
import type { ApiError } from '@/api/types'; // Updated import
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
    401,
    { provider }
  );
};

/**
 * Standardizes error handling from caught errors
 */
export const normalizeApiError = (err: any): ApiError => {
  const caughtError = err as Partial<ApiError>;
  
  const finalErrorDetails: ApiError = {
    type: caughtError.type || 'unknown',
    message: caughtError.message || 'An unknown error occurred while contacting the AI.',
    status: caughtError.status || 0,
    data: caughtError.data,
  };

  return finalErrorDetails;
};
