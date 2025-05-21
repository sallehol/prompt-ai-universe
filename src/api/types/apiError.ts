
export interface ApiError {
  type: 'auth' | 'network' | 'request' | 'rate_limit' | 'server' | 'unknown';
  message: string;
  status: number; // HTTP status code, or 0 for client-side/network errors
  data?: any;    // Additional error details, e.g., provider name, error codes
}
