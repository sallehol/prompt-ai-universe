
// supabase/functions/ai-proxy/error-utils.ts
import { corsHeaders } from './auth.ts' // Ensure this path is correct

// Standard error types
export enum ErrorType {
  AUTHENTICATION = 'authentication_error',
  AUTHORIZATION = 'authorization_error',
  VALIDATION = 'validation_error',
  NOT_FOUND = 'not_found_error',
  RATE_LIMIT = 'rate_limit_error',
  PROVIDER = 'provider_error',
  SERVER = 'server_error',
}

// Error response structure
export interface ErrorResponsePayload { // Renamed to avoid conflict with DOM Response
  error: {
    type: ErrorType;
    message: string;
    provider?: string;
    details?: any;
  }
}

// Create a standardized error response
export function createErrorResponse(
  type: ErrorType,
  message: string,
  status: number = 500,
  provider?: string,
  details?: any
): Response { // Explicitly return Response
  const errorBody: ErrorResponsePayload = {
    error: {
      type,
      message,
      ...(provider && { provider }),
      ...(details && { details }),
    }
  }
  
  return new Response(
    JSON.stringify(errorBody),
    { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  )
}

// Handle provider-specific errors
export function handleProviderError(error: any, provider: string): Response { // Explicitly return Response
  console.error(`Error from ${provider}:`, error)
  
  // Default error response
  let errorType = ErrorType.PROVIDER
  let errorMessage = `Error from ${provider}: ${error?.message || 'Unknown error'}`
  let statusCode = 500
  
  // Provider-specific error handling can be added here
  if (error?.status === 401 || error?.message?.includes('API key') || error?.message?.includes('Unauthorized')) {
    errorType = ErrorType.AUTHENTICATION
    errorMessage = `Invalid API key or authentication issue for ${provider}`
    statusCode = 401
  } else if (error?.status === 429 || error?.message?.includes('rate limit')) {
    errorType = ErrorType.RATE_LIMIT
    errorMessage = `Rate limit exceeded for ${provider}`
    statusCode = 429
  }
  
  return createErrorResponse(errorType, errorMessage, statusCode, provider, error)
}
