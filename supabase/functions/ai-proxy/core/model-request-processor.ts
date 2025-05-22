
// supabase/functions/ai-proxy/core/model-request-processor.ts
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
    const { user, supabaseClient, provider, model, allParamsFromRequest } = validationResult;
    determinedProvider = provider; 

    const typedSupabaseClient = supabaseClient as SupabaseClient<Database>;

    // 1a. Check Subscription Status
    const subscription: SubscriptionStatus = await checkSubscription(typedSupabaseClient, user.id);
    if (!subscription.active || !subscription.subscriptionId || !subscription.limits || !subscription.availableModels) {
      return createErrorResponse(
        ErrorType.AUTHORIZATION, // Or FORBIDDEN
        subscription.error || 'No active subscription or subscription data incomplete.',
        403,
        provider,
        { errorCode: subscription.errorCode || 'SUBSCRIPTION_ISSUE' }
      );
    }

    // 1b. Determine actual requestType based on model from provider_models table
    const actualRequestType = await getRequestTypeFromModel(typedSupabaseClient, provider, model);
    if (!actualRequestType) { // Should have a default from getRequestTypeFromModel
        return createErrorResponse(ErrorType.VALIDATION, `Could not determine request type for model ${model}`, 400, provider);
    }
    // Store actualRequestType and subscriptionId in context if other middleware/handlers need it.
    if (context) {
      context.requestType = actualRequestType as 'text' | 'chat' | 'image' | 'audio' | 'video' | 'code' | 'website' | 'analysis';
      context.subscriptionId = subscription.subscriptionId;
    }


    // 1c. Check Usage Limits
    const limitCheck = await checkUsageLimits(
      typedSupabaseClient,
      user.id,
      subscription.subscriptionId,
      actualRequestType, // Use dynamically determined request type
      provider,
      model,
      subscription.limits,
      subscription.availableModels
    );

    if (!limitCheck.allowed) {
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
    // Note: requestType for executeProviderRequest might need to be more specific if not just 'text'/'chat'
    // For now, assuming 'text' or 'chat' can encompass various model interactions.
    // If executeProviderRequest needs more specific types, this mapping needs adjustment.
    const executionRequestType = (actualRequestType === 'text' || actualRequestType === 'chat' || actualRequestType === 'code' || actualRequestType === 'analysis') ? actualRequestType : 'chat'; // Default to 'chat' for non-text/code

    const executionResult = await executeProviderRequest(
      user,
      typedSupabaseClient,
      provider,
      model,
      allParamsFromRequest,
      executionRequestType as 'text' | 'chat', // This needs to align with what executeProviderRequest expects
      requestId
    );
    if (executionResult.errorResponse) {
      return executionResult.errorResponse;
    }
    const { resultFromClient, finalParamsForProvider } = executionResult;
    
    // 3. Process Provider Response
    // The processProviderResponse might also need access to actualRequestType and subscriptionId for usage recording
    // This can be passed via finalParamsForProvider or context if available there.
    // For now, assuming it can get what it needs or that usage recording is handled elsewhere (e.g. middleware)
    return await processProviderResponse(
      resultFromClient,
      finalParamsForProvider,
      provider,
      requestId
    );

  } catch (error) {
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

