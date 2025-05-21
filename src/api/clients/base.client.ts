
import { supabase } from '@/lib/supabaseClient';
import type { ApiError } from './base.client'; // Keep existing ApiError type if suitable
import { normalizeApiError } from '@/utils/errorUtils'; // For consistent error handling

// The Supabase URL is hardcoded in supabaseClient.ts, we'll use that for consistency.
const SUPABASE_PROJECT_URL = 'https://zxpywvtgpfqyazabsvlb.supabase.co';

export class BaseApiClient {
  protected supabaseInstance = supabase;
  protected baseUrl: string;
  protected timeout: number;

  constructor(timeout: number = 30000) {
    this.baseUrl = `${SUPABASE_PROJECT_URL}/functions/v1/ai-proxy`;
    this.timeout = timeout;
    console.log(`[BaseApiClient] Initialized with baseUrl: ${this.baseUrl}`);
  }

  protected async getAuthHeaders(): Promise<Headers> {
    const { data: { session }, error } = await this.supabaseInstance.auth.getSession();
    
    if (error) {
      console.error('[BaseApiClient] Error getting session:', error);
      throw normalizeApiError({ status: 500, message: `Failed to get session: ${error.message}`, type: 'auth' });
    }
    
    if (!session) {
      console.warn('[BaseApiClient] No active session found.');
      throw normalizeApiError({ status: 401, message: 'User not authenticated. Please log in.', type: 'auth' });
    }
    
    const headers = new Headers();
    headers.append('Authorization', `Bearer ${session.access_token}`);
    headers.append('Content-Type', 'application/json');
    return headers;
  }

  protected async request<T_Response>(
    endpoint: string,
    method: string,
    body?: any,
    isStreaming: boolean = false
  ): Promise<T_Response | ReadableStream<Uint8Array>> {
    console.log(`[BaseApiClient] Requesting: ${method} ${this.baseUrl}${endpoint}`, body ? {body} : {});
    const headers = await this.getAuthHeaders();
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        console.warn(`[BaseApiClient] Request timed out: ${method} ${endpoint}`);
        controller.abort();
    }, this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId); // Clear timeout if fetch completes/fails before timeout

      if (!response.ok) {
        let errorData: any = { message: response.statusText }; // Default error data
        try {
          const textData = await response.text();
          // console.log(`[BaseApiClient] Error response text: ${textData}`); // Log raw error text
          if(textData) errorData = JSON.parse(textData);
        } catch (e) {
          console.error('[BaseApiClient] Failed to parse error response JSON:', e);
        }
        // Use the custom error handling logic
        this.handleAndThrowApiError(response.status, errorData, endpoint);
      }

      if (isStreaming) {
        if (!response.body) {
          console.error('[BaseApiClient] Streaming response body is null.');
          throw normalizeApiError({ status: 500, message: 'Streaming response body is null.', type: 'server' });
        }
        return response.body;
      }
      
      const responseData = await response.json();
      // console.log(`[BaseApiClient] Response for ${method} ${endpoint}:`, responseData);
      return responseData as T_Response;

    } catch (error: any) {
      clearTimeout(timeoutId); // Ensure timeout is cleared on any error
      if (error.name === 'AbortError') {
        throw normalizeApiError({ status: 0, message: 'The request timed out.', type: 'network' });
      }
      // If it's already an ApiError (e.g., thrown by getAuthHeaders or handleAndThrowApiError), rethrow it
      if (error.status !== undefined && error.type !== undefined) {
        throw error;
      }
      console.error(`[BaseApiClient] Unknown error during request to ${endpoint}:`, error);
      throw normalizeApiError(error); // Normalize other errors
    }
  }
  
  private handleAndThrowApiError(status: number, data: any, endpoint: string): never {
    let type: ApiError['type'] = 'unknown';
    // Try to get message from standard Supabase Edge Function error structure or direct message
    let message = data?.error?.message || data?.message || data?.msg || 'An error occurred with the API request.';
    const provider = data?.error?.provider;

    console.error(`[BaseApiClient] API Error Status ${status} for ${endpoint}:`, data);

    switch (status) {
      case 400: type = 'request'; message = data?.error?.message || "Invalid request."; break;
      case 401: type = 'auth'; message = data?.error?.message || 'Authentication failed. Please log in again.'; break;
      case 403: type = 'auth'; message = data?.error?.message || 'You do not have permission to access this resource.'; break;
      case 404: type = 'request'; message = data?.error?.message || 'Resource not found.'; break;
      case 429: type = 'rate_limit'; message = data?.error?.message || `Rate limit exceeded. Please try again after ${data?.error?.details?.reset_time || 'some time'}.`; break;
      case 500: type = 'server'; message = data?.error?.message || 'Server error. Please try again later.'; break;
      default: type = this.mapErrorType(status); break;
    }
    
    if (provider) {
        message = `Error from ${provider}: ${message}`;
    }

    const apiError: ApiError = { status, message, type, data };
    throw apiError;
  }
  
  protected mapErrorType(status: number): ApiError['type'] {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate_limit';
    if (status >= 500) return 'server';
    if (status >= 400 && status < 500) return 'request'; // General client-side errors
    return 'unknown';
  }
}
