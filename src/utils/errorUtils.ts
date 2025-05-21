
import type { ApiError } from '@/api/types/apiError'; // Updated import
import { logger } from '@/utils/logger';

/**
 * Creates a standardized API error object
 */
export const createApiError = (
  type: ApiError['type'],
  message: string,
  status: number = 0,
  data?: any
): ApiError => {
  return {
    type,
    message,
    status,
    data
  };
};

/**
 * Creates an authentication error for missing API keys
 */
export const createAuthError = (provider: string): ApiError => {
  logger.error(`[errorUtils] API key for ${provider} is not set.`);
  return createApiError(
    'auth',
    `API key for ${provider} is not set. Please add your API key in settings.`,
    401, // HTTP 401 Unauthorized
    { provider }
  );
};

/**
 * Standardizes error handling from caught errors
 */
export const normalizeApiError = (err: any): ApiError => {
  // If already an ApiError (duck typing), return it directly
  if (err && typeof err.type === 'string' && typeof err.message === 'string' && typeof err.status === 'number') {
    logger.log('[errorUtils] Error is already a normalized ApiError:', err);
    return err as ApiError;
  }
  
  // Handle errors that might come from Supabase Edge Functions or other structured errors
  const errorResponse = err?.response?.data?.error || err?.data?.error || err?.error;
  if (errorResponse && typeof errorResponse.type === 'string' && typeof errorResponse.message === 'string') {
    logger.warn('[errorUtils] Normalizing error from error response structure:', errorResponse);
    return {
      type: errorResponse.type as ApiError['type'],
      message: errorResponse.message,
      status: err.status || err.response?.status || 0,
      data: { ...errorResponse, provider: errorResponse.provider, details: errorResponse.details }
    };
  }
  
  // Handle string errors
  if (typeof err === 'string') {
    logger.warn('[errorUtils] Normalizing string error:', err);
    return createApiError('unknown', err, 0);
  }

  // Fallback for other error types
  logger.warn('[errorUtils] Normalizing unknown error structure:', err);
  const finalErrorDetails: ApiError = {
    type: 'unknown',
    message: err?.message || 'An unknown error occurred.',
    status: err?.status || 0,
    data: err?.data || (err instanceof Error ? { name: err.name, stack: err.stack } : err),
  };

  return finalErrorDetails;
};
