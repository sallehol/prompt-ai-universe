// supabase/functions/ai-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, verifyAuth, corsHeaders } from './auth.ts'
import { createErrorResponse, ErrorType } from './error-utils.ts'
import { getProviderFromModel } from './providers.ts'
import { 
  listProviders, 
  checkApiKeyStatus, 
  setApiKey, 
  deleteApiKey
} from './api-keys.ts'
import {
  handleTextCompletion,
  handleChatCompletion
} from './text-models.ts'
import {
  handleImageGeneration,
  handleImageEdit,
  handleImageVariation,
  handleVideoGeneration,
  handleTextToSpeech,
  handleSpeechToText
} from './multimodal-endpoints.ts'

import {
  MiddlewareChain,
  ProviderDetectionMiddleware,
  CachingMiddleware,
  RateLimitingMiddleware,
  UsageLoggingMiddleware,
  MiddlewareContext
} from './middleware.ts'
import { ensureCacheTable } from './cache.ts'
import { ensureRateLimitTables } from './rate-limit.ts'
import { ensureUsageLogTable, SupabaseUsageLogger } from './monitoring.ts'

// Initialize middleware chain
const middlewareChain = new MiddlewareChain();
let middlewareInitialized = false;

async function mainRequestHandler(req: Request, context: MiddlewareContext): Promise<Response> {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    const functionNameIndex = pathParts.findIndex(p => p === 'ai-proxy');
    if (functionNameIndex === -1 || pathParts[functionNameIndex + 1] !== 'api') {
        return createErrorResponse(ErrorType.VALIDATION, 'Invalid API path. Must include /ai-proxy/api/', 400);
    }
    
    const apiPath = pathParts.slice(functionNameIndex + 1);

    if (apiPath.length < 1) {
      return createErrorResponse(ErrorType.VALIDATION, 'API path segment not found after /ai-proxy/', 400);
    }
    
    const mainEndpointCategory = apiPath[1];
    
    // Provider and requestParams should now be populated by ProviderDetectionMiddleware.
    // This block can act as a fallback or be further simplified if ProviderDetectionMiddleware is reliable.
    if (mainEndpointCategory === 'models' && req.method === 'POST') {
        if (!context.provider && context.requestParams && context.requestParams.model) {
            // If ProviderDetectionMiddleware didn't set provider, try to derive it here.
            // This might happen if getProviderFromModel logic is more nuanced.
            console.warn("mainRequestHandler: context.provider not set by middleware, attempting to derive from model.");
            context.provider = getProviderFromModel(context.requestParams.model, context.requestParams.provider);
        }
        // If requestParams were somehow not set by ProviderDetectionMiddleware (e.g., non-JSON POST)
        // and this handler needs them, it would need to parse req.clone().json() itself.
        // However, for JSON POSTs, ProviderDetectionMiddleware should handle it.
    }


    switch (mainEndpointCategory) {
      case 'health':
        // User is already available in context from the outer verifyAuth
        // Ensure tables are created on health check.
        await Promise.all([
          ensureCacheTable(context.supabaseClient),
          ensureRateLimitTables(context.supabaseClient),
          ensureUsageLogTable(context.supabaseClient)
        ]);
        return new Response(
          JSON.stringify({ status: 'ok', user: { id: context.user?.id, email: context.user?.email } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      
      case 'keys':
        // ... keep existing code (key actions logic)
        if (apiPath.length < 3) {
             return createErrorResponse(ErrorType.VALIDATION, 'API key action not specified (e.g., /providers, /status).', 400);
        }
        const keyAction = apiPath[2]
        
        switch (keyAction) {
          case 'providers':
            return await listProviders(req) // req might need to be context.req if modified by middleware
          case 'status':
            return await checkApiKeyStatus(req) // req might need to be context.req
          case 'set':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
            return await setApiKey(req) // req might need to be context.req
          case 'delete':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST for delete.', 405) // Should be DELETE method semantically
            return await deleteApiKey(req) // req might need to be context.req
          default:
            return createErrorResponse(ErrorType.NOT_FOUND, `API key action '/${keyAction}' not found.`, 404);
        }
      
      case 'models':
        // ... keep existing code (model routing logic)
        if (apiPath.length < 4) { 
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid model endpoint. Expected /api/models/{type}/{action}.', 400);
        }
        const modelType = apiPath[2];
        const modelAction = apiPath[3];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);

        switch (modelType) {
          case 'text':
            if (modelAction === 'completion') return await handleTextCompletion(req); // req might need to be context.req
            break;
          case 'chat':
            if (modelAction === 'completion') return await handleChatCompletion(req); // req might need to be context.req
            break;
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Model endpoint /${modelType}/${modelAction} not found.`, 404);

      case 'image':
        // ... keep existing code (image routing logic)
        if (apiPath.length < 3) { 
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid image endpoint. Expected /api/image/{action}.', 400);
        }
        const imageAction = apiPath[2];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        switch (imageAction) {
          case 'generation': return await handleImageGeneration(req); // req might need to be context.req
          case 'edit': return await handleImageEdit(req); // req might need to be context.req
          case 'variation': return await handleImageVariation(req); // req might need to be context.req
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Image action '/${imageAction}' not found.`, 404);

      case 'video':
        // ... keep existing code (video routing logic)
        if (apiPath.length < 3) {
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid video endpoint. Expected /api/video/{action}.', 400);
        }
        const videoAction = apiPath[2];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        switch (videoAction) {
          case 'generation': return await handleVideoGeneration(req); // req might need to be context.req
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Video action '/${videoAction}' not found.`, 404);
        
      case 'audio':
        // ... keep existing code (audio routing logic)
        if (apiPath.length < 3) {
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid audio endpoint. Expected /api/audio/{action}.', 400);
        }
        const audioAction = apiPath[2];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        switch (audioAction) {
          case 'speech': return await handleTextToSpeech(req); // req might need to be context.req
          case 'transcription': return await handleSpeechToText(req); // req might need to be context.req
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Audio action '/${audioAction}' not found.`, 404);

      case 'usage':
        if (apiPath.length < 3 || apiPath[2] !== 'summary') {
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid usage endpoint. Expected /api/usage/summary.', 400);
        }
        if (req.method !== 'GET') {
            return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected GET for usage summary.', 405);
        }
        // User already authenticated and in context
        const period = url.searchParams.get('period') || 'month';
        const usageLogger = new SupabaseUsageLogger(context.supabaseClient);
        const summary = await usageLogger.getUsageSummary(context.user.id, period);
        
        if (summary === null) { // Explicitly check for null if getUsageSummary can return it on error
            return createErrorResponse(ErrorType.SERVER, 'Failed to retrieve usage summary.', 500);
        }
        return new Response(JSON.stringify({ summary }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      
      default:
        if (mainEndpointCategory) {
            return createErrorResponse(ErrorType.NOT_FOUND, `Endpoint category '/api/${mainEndpointCategory}' not found.`, 404);
        }
        return createErrorResponse(ErrorType.VALIDATION, 'Invalid API endpoint. Main category not specified.', 400);
    }
}

serve(async (req: Request) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;
  
  let user, supabaseClient: SupabaseClient;

  try {
    const authResult = await verifyAuth(req);
    user = authResult.user;
    supabaseClient = authResult.supabaseClient;

    if (!middlewareInitialized) {
      middlewareChain
        .use(new ProviderDetectionMiddleware()) // Add new middleware first
        .use(new CachingMiddleware(supabaseClient))
        .use(new RateLimitingMiddleware(supabaseClient))
        .use(new UsageLoggingMiddleware(supabaseClient));
      middlewareInitialized = true;
      console.log("Middleware chain initialized with ProviderDetectionMiddleware.");
    }
    
    const context: MiddlewareContext = {
      user,
      supabaseClient,
      handler: mainRequestHandler // The main logic is now the handler for the middleware
    };
    
    return await middlewareChain.process(req, context);

  } catch (error) {
    console.error('Top-level error in ai-proxy/index.ts:', error.message, error.stack ? error.stack.split('\n')[0] : '');
    
    // Check if it's an auth error from verifyAuth (which throws 'Unauthorized')
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    }
    // Check if it's an error from createErrorResponse (already a Response object)
    if (error instanceof Response) {
        return error;
    }
    // Generic server error
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
})
