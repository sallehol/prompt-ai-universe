// supabase/functions/ai-proxy/core/model-request-processor.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'; // Added SupabaseClient import if it wasn't already there explicitly for casting, now for type annotation.
import { createErrorResponse, ErrorType, handleProviderError } from '../error-utils.ts'
import { ProviderName } from '../providers/index.ts' 
import { MiddlewareContext } from '../middleware/index.ts';
import { validateRequest } from './request-validator.ts';
import { executeProviderRequest } from './provider-execution/index.ts'; 
import { processProviderResponse } from './response-processor.ts';
import { checkSubscription, checkUsageLimits, SubscriptionStatus } from './subscription-manager.ts';
import { getRequestTypeFromModel } from './api-key-manager.ts';
import { Database } from '../../_shared/database.types.ts';

export async function processModelRequest(
  req: Request,
  // requestType: 'text' | 'chat', // This will be determined dynamically
  context?: MiddlewareContext 
) {
  let determinedProvider: ProviderName | undefined;
  const requestId = context?.requestId || 'NO_REQ_ID_IN_PROCESS_MODEL_REQUEST';

  try {
    // 1. Validate Request (gets user, supabaseClient, provider, model, params)
    // We will pass 'text' as a placeholder, requestType will be determined later
    const validationResult = await validateRequest(req, 'text', context); 
    if (validationResult.errorResponse) {
      return validationResult.errorResponse;
    }
    // supabaseClient from validationResult is now expected to be SupabaseClient<Database>
    // as context.supabaseClient is SupabaseClient<Database>
    const { user, supabaseClient, provider, model, allParamsFromRequest } = validationResult;
    determinedProvider = provider; 

    // const typedSupabaseClient = supabaseClient as SupabaseClient<Database>; // Cast no longer needed
    // supabaseClient is already SupabaseClient<Database>

    // 1a. Check Subscription Status
    const subscription: SubscriptionStatus = await checkSubscription(supabaseClient, user.id); // Use supabaseClient directly
    if (!subscription.active || !subscription.subscriptionId || !subscription.limits || !subscription.availableModels) {
      // ... keep existing error response code
      return createErrorResponse(
        ErrorType.AUTHORIZATION, // Or FORBIDDEN
        subscription.error || 'No active subscription or subscription data incomplete.',
        403,
        provider,
        { errorCode: subscription.errorCode || 'SUBSCRIPTION_ISSUE' }
      );
    }

    // 1b. Determine actual requestType based on model from provider_models table
    const actualRequestType = await getRequestTypeFromModel(supabaseClient, provider, model); // Use supabaseClient directly
    if (!actualRequestType) { // Should have a default from getRequestTypeFromModel
        return createErrorResponse(ErrorType.VALIDATION, `Could not determine request type for model ${model}`, 400, provider);
    }
    // Store actualRequestType and subscriptionId in context if other middleware/handlers need it.
    if (context) {
      context.requestType = actualRequestType as 'text' | 'chat' | 'image' | 'audio' | 'video' | 'code' | 'analysis';
      context.subscriptionId = subscription.subscriptionId;
    }


    // 1c. Check Usage Limits
    const limitCheck = await checkUsageLimits(
      supabaseClient, // Use supabaseClient directly
      user.id,
      subscription.subscriptionId,
      actualRequestType, // Use dynamically determined request type
      provider,
      model,
      subscription.limits,
      subscription.availableModels
    );

    if (!limitCheck.allowed) {
      // ... keep existing error response code
      return createErrorResponse(
        ErrorType.RATE_LIMIT, // Or USAGE_LIMIT
        limitCheck.reason || 'Usage limit exceeded.',
        429, // Too Many Requests
        provider,
        { 
          current: limitCheck.currentUsage, 
          limit: limitCheck.limitValue, 
          upgradeRequired: limitCheck.upgradeRequired,
          errorCode: 'LIMIT_EXCEEDED'
        }
      );
    }

    // 2. Execute Provider Request
    // ... keep existing executionRequestType logic
    const executionRequestType = (actualRequestType === 'text' || actualRequestType === 'chat' || actualRequestType === 'code' || actualRequestType === 'analysis') ? actualRequestType : 'chat'; // Default to 'chat' for non-text/code

    const executionResult = await executeProviderRequest(
      user,
      supabaseClient, // Use supabaseClient directly
      provider,
      model,
      allParamsFromRequest,
      executionRequestType as 'text' | 'chat', 
      requestId
    );
    // ... keep existing executionResult error check and response processing
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
    // ... keep existing error handling
    console.error(`[${requestId}] Error handling model request (provider: ${determinedProvider || 'unknown'}):`, error.message, error.stack);
    
    if (error.message === 'Unauthorized' && !determinedProvider) {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    }
    
    if (determinedProvider) {
      return handleProviderError(error, determinedProvider);
    }
    
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}
