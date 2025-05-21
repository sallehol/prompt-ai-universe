
// supabase/functions/ai-proxy/core/model-request-processor.ts
import { createErrorResponse, ErrorType, handleProviderError } from '../error-utils.ts'
import { ProviderName } from '../providers.ts'
import { MiddlewareContext } from '../middleware/index.ts';
import { validateRequest } from './request-validator.ts';
import { executeProviderRequest } from './provider-executor.ts';
import { processProviderResponse } from './response-processor.ts';

export async function processModelRequest(
  req: Request,
  requestType: 'text' | 'chat',
  context?: MiddlewareContext 
) {
  let determinedProvider: ProviderName | undefined;
  const requestId = context?.requestId || 'NO_REQ_ID_IN_PROCESS_MODEL_REQUEST';

  try {
    // 1. Validate Request
    const validationResult = await validateRequest(req, requestType, context);
    if (validationResult.errorResponse) {
      return validationResult.errorResponse;
    }
    const { user, supabaseClient, provider, model, allParamsFromRequest } = validationResult;
    determinedProvider = provider; // For use in the main catch block

    // 2. Execute Provider Request
    const executionResult = await executeProviderRequest(
      user,
      supabaseClient,
      provider,
      model,
      allParamsFromRequest, // This contains prompt/messages and other params including 'stream'
      requestType,
      requestId
    );
    if (executionResult.errorResponse) {
      return executionResult.errorResponse;
    }
    const { resultFromClient, finalParamsForProvider } = executionResult;
    
    // 3. Process Provider Response
    return await processProviderResponse(
      resultFromClient,
      finalParamsForProvider,
      provider,
      requestId
    );

  } catch (error) {
    console.error(`[${requestId}] Error handling ${requestType} completion (provider: ${determinedProvider || 'unknown'}):`, error.message, error.stack);
    
    // Handle specific errors that might not be caught by sub-functions or are general
    if (error.message === 'Unauthorized' && !determinedProvider) { // If auth failed before provider was determined
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    }
    
    if (determinedProvider) {
      return handleProviderError(error, determinedProvider);
    }
    
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}
