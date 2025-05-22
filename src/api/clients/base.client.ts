
import { supabase } from '@/lib/supabaseClient';
import type { ApiError } from '@/api/types/apiError';
import { normalizeApiError } from '@/utils/errorUtils';
import { logger } from '@/utils/logger';

// The Supabase URL is hardcoded in supabaseClient.ts, we'll use that for consistency.
const SUPABASE_PROJECT_URL = 'https://zxpywvtgpfqyazabsvlb.supabase.co';

export class BaseApiClient {
  protected supabaseInstance = supabase;
  protected baseUrl: string;
  protected timeout: number;

  constructor(timeout: number = 30000) {
    this.baseUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_PROJECT_URL}/functions/v1/ai-proxy`;
    this.timeout = timeout;
    logger.log(`[BaseApiClient] Initialized with baseUrl: ${this.baseUrl}`);
  }

  protected async getAuthHeaders(): Promise<Headers> {
    const { data: { session }, error } = await this.supabaseInstance.auth.getSession();
    
    if (error) {
      logger.error('[BaseApiClient] Error getting session:', error);
      throw normalizeApiError({ status: 500, message: `Failed to get session: ${error.message}`, type: 'auth' });
    }
    
    if (!session) {
      logger.warn('[BaseApiClient] No active session found.');
      throw normalizeApiError({ status: 401, message: 'User not authenticated. Please log in.', type: 'auth' });
    }
    
    logger.log('[BaseApiClient] Session valid, token expires at:', new Date(session.expires_at * 1000).toISOString());
    
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
    logger.log(`[BaseApiClient] Sending request: ${method} ${this.baseUrl}${endpoint}`);
    const headers = await this.getAuthHeaders();
    if (body) logger.log(`[BaseApiClient] Request body:`, body);
    logger.log(`[BaseApiClient] Request headers:`, Object.fromEntries(headers.entries()));

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
        logger.warn(`[BaseApiClient] Request timed out: ${method} ${endpoint}`);
        controller.abort();
    }, this.timeout);

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      logger.log(`[BaseApiClient] Response status: ${response.status}`);
      logger.log(`[BaseApiClient] Response headers:`, Object.fromEntries(response.headers.entries()));
      logger.log(`[BaseApiClient] Content-Type:`, response.headers.get('content-type'));

      if (!response.ok) {
        let errorData: any = { message: response.statusText };
        let errorText = '';
        
        try {
          errorText = await response.text();
          logger.log(`[BaseApiClient] Error response text:`, errorText);
          
          if (errorText.trim().startsWith('<!DOCTYPE') || errorText.trim().startsWith('<html')) {
            logger.error('[BaseApiClient] Received HTML instead of JSON. The endpoint may not exist or a server error occurred.');
            errorData = { 
              message: 'Server returned HTML instead of JSON. The endpoint may not exist or a server error occurred.',
              originalHtml: errorText.substring(0, 200) + '...'
            };
          } else {
            try {
              errorData = JSON.parse(errorText);
            } catch (parseError) {
              logger.error('[BaseApiClient] Response is neither valid JSON nor HTML:', errorText);
              errorData = { 
                message: 'Server returned invalid response format.',
                originalText: errorText
              };
            }
          }
        } catch (e: any) {
          logger.error('[BaseApiClient] Failed to read error response text:', e.message);
        }
        
        this.handleAndThrowApiError(response.status, errorData, endpoint);
      }

      if (isStreaming) {
        if (!response.body) {
          logger.error('[BaseApiClient] Streaming response body is null.');
          throw normalizeApiError({ status: 500, message: 'Streaming response body is null.', type: 'server' });
        }
        return response.body;
      }
      
      const responseData = await response.json();
      return responseData as T_Response;

    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw normalizeApiError({ status: 0, message: 'The request timed out.', type: 'network' });
      }
      if (error.status !== undefined && error.type !== undefined && error.message !== undefined) {
        throw error;
      }
      logger.error(`[BaseApiClient] Unknown error during request to ${endpoint}:`, error);
      throw normalizeApiError(error);
    }
  }
  
  private handleAndThrowApiError(status: number, data: any, endpoint: string): never {
    let type: ApiError['type'] = 'unknown';
    let message = data?.error?.message || data?.message || data?.msg || 'An error occurred with the API request.';
    const provider = data?.error?.provider || data?.error?.data?.provider; // Added provider extraction from error data

    logger.error(`[BaseApiClient] API Error Status ${status} for ${endpoint}:`, data);

    switch (status) {
      case 400: type = 'request'; message = data?.error?.message || "Invalid request."; break;
      case 401: type = 'auth'; message = data?.error?.message || 'Authentication failed. Please log in again.'; break;
      case 403: type = 'auth'; message = data?.error?.message || 'You do not have permission to access this resource.'; break;
      case 404: type = 'request'; message = data?.error?.message || 'Resource not found.'; break;
      case 429: type = 'rate_limit'; message = data?.error?.message || `Rate limit exceeded. Please try again after ${data?.error?.details?.reset_time || 'some time'}.`; break;
      case 500: type = 'server'; message = data?.error?.message || 'Server error. Please try again later.'; break;
      default: type = this.mapErrorType(status); break;
    }
    
    // Enhance message with provider if not already included and provider info exists
    if (provider && !message.toLowerCase().includes(provider.toLowerCase())) {
        message = `Error from ${provider}: ${message}`;
    }

    const apiError: ApiError = { status, message, type, data: data?.error || data }; // ensure data is consistent
    throw apiError;
  }
  
  protected mapErrorType(status: number): ApiError['type'] {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate_limit';
    if (status >= 500) return 'server';
    if (status >= 400 && status < 500) return 'request';
    return 'unknown';
  }
}
