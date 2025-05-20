export interface ApiClientOptions {
  baseUrl: string;
  apiKey: string;
  timeout?: number;
}

export interface ApiError {
  status: number;
  message: string;
  type: 'auth' | 'rate_limit' | 'server' | 'request' | 'network' | 'unknown';
  data?: any;
}

export class BaseApiClient {
  protected baseUrl: string;
  protected apiKey: string;
  protected timeout: number;

  constructor(options: ApiClientOptions) {
    this.baseUrl = options.baseUrl;
    this.apiKey = options.apiKey;
    this.timeout = options.timeout || 30000; // 30 seconds default
  }

  protected async fetchWithTimeout(
    url: string,
    options: RequestInit,
    timeout: number = this.timeout
  ): Promise<Response> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      if (!response.ok) {
        let errorData: any = {};
        try {
          errorData = await response.json();
        } catch (e) {
          // If response is not JSON, use statusText
        }
        const apiError: ApiError = {
          status: response.status,
          message: errorData?.error?.message || errorData?.message || response.statusText || 'An error occurred',
          type: this.mapErrorType(response.status),
          data: errorData,
        };
        throw apiError;
      }
      
      return response;
    } catch (error: any) {
      if (error.name === 'AbortError') {
        const networkError: ApiError = {
            status: 0, // Or a specific status code for timeout
            message: 'The request timed out.',
            type: 'network',
        };
        throw networkError;
      }
      // If it's already an ApiError, rethrow it
      if (error.status !== undefined && error.type !== undefined) {
        throw error;
      }
      // Otherwise, wrap it as an unknown error
      const unknownError: ApiError = {
        status: 0,
        message: error.message || 'An unknown network error occurred.',
        type: 'unknown',
        data: error
      };
      throw unknownError;
    } finally {
      clearTimeout(id);
    }
  }
  
  protected mapErrorType(status: number): ApiError['type'] {
    if (status === 401 || status === 403) return 'auth';
    if (status === 429) return 'rate_limit';
    if (status >= 500) return 'server';
    if (status >= 400) return 'request';
    return 'unknown';
  }
}
