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
} from './middleware/index.ts'
import { ErrorHandlingMiddleware } from './middleware/error-handling.ts'
import { RequestOptimizationMiddleware } from './middleware/optimization.ts'

import { ensureCacheTable } from './cache.ts'
import { ensureRateLimitTables } from './rate-limit.ts'
import { ensureUsageLogTable, SupabaseUsageLogger } from './monitoring.ts'

// Initialize middleware chain
const middlewareChain = new MiddlewareChain();
let middlewareInitialized = false;

async function mainRequestHandler(req: Request, context: MiddlewareContext): Promise<Response> {
    const { requestId } = context;
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    
    const functionNameIndex = pathParts.findIndex(p => p === 'ai-proxy');
    if (functionNameIndex === -1 || pathParts[functionNameIndex + 1] !== 'api') {
        console.warn(`[${requestId}] mainRequestHandler: Invalid API path structure: ${url.pathname}`);
        return createErrorResponse(ErrorType.VALIDATION, 'Invalid API path. Must include /ai-proxy/api/', 400);
    }
    
    const apiPath = pathParts.slice(functionNameIndex + 1);

    if (apiPath.length < 1) {
      console.warn(`[${requestId}] mainRequestHandler: API path segment not found after /ai-proxy/`);
      return createErrorResponse(ErrorType.VALIDATION, 'API path segment not found after /ai-proxy/', 400);
    }
    
    const mainEndpointCategory = apiPath[1];
    
    // This re-derivation of provider is a fallback, ProviderDetectionMiddleware should handle it.
    // if (mainEndpointCategory === 'models' && req.method === 'POST') {
    //     if (!context.provider && context.requestParams && context.requestParams.model) {
    //         console.warn(`[${requestId}] mainRequestHandler: context.provider not set by middleware, attempting to derive from model.`);
    //         context.provider = getProviderFromModel(context.requestParams.model, context.requestParams.provider);
    //     }
    // }

    // console.log(`[${requestId}] mainRequestHandler: Category: ${mainEndpointCategory}, Path: ${apiPath.join('/')}`);

    switch (mainEndpointCategory) {
      case 'health':
        await Promise.all([
          ensureCacheTable(context.supabaseClient),
          ensureRateLimitTables(context.supabaseClient),
          ensureUsageLogTable(context.supabaseClient)
        ]);
        return new Response(
          JSON.stringify({ status: 'ok', user: { id: context.user?.id, email: context.user?.email }, requestId }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId } }
        );
      
      case 'keys':
        if (apiPath.length < 3) {
             return createErrorResponse(ErrorType.VALIDATION, 'API key action not specified (e.g., /providers, /status).', 400);
        }
        const keyAction = apiPath[2]
        
        switch (keyAction) {
          case 'providers':
            return await listProviders(req)
          case 'status':
            return await checkApiKeyStatus(req)
          case 'set':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
            return await setApiKey(req)
          case 'delete':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST for delete.', 405)
            return await deleteApiKey(req)
          default:
            return createErrorResponse(ErrorType.NOT_FOUND, `API key action '/${keyAction}' not found.`, 404);
        }
      
      case 'models':
        if (apiPath.length < 4) { 
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid model endpoint. Expected /api/models/{type}/{action}.', 400);
        }
        const modelType = apiPath[2];
        const modelAction = apiPath[3];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);

        switch (modelType) {
          case 'text':
            if (modelAction === 'completion') return await handleTextCompletion(req, context);
            break;
          case 'chat':
            if (modelAction === 'completion') return await handleChatCompletion(req, context);
            break;
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Model endpoint /${modelType}/${modelAction} not found.`, 404);

      case 'image':
        if (apiPath.length < 3) { 
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid image endpoint. Expected /api/image/{action}.', 400);
        }
        const imageAction = apiPath[2];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        switch (imageAction) {
          case 'generation': return await handleImageGeneration(req, context);
          case 'edit': return await handleImageEdit(req, context);
          case 'variation': return await handleImageVariation(req, context);
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Image action '/${imageAction}' not found.`, 404);

      case 'video':
        if (apiPath.length < 3) {
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid video endpoint. Expected /api/video/{action}.', 400);
        }
        const videoAction = apiPath[2];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        switch (videoAction) {
          case 'generation': return await handleVideoGeneration(req, context);
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Video action '/${videoAction}' not found.`, 404);
        
      case 'audio':
        if (apiPath.length < 3) {
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid audio endpoint. Expected /api/audio/{action}.', 400);
        }
        const audioAction = apiPath[2];
        if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        switch (audioAction) {
          case 'speech': return await handleTextToSpeech(req, context);
          case 'transcription': return await handleSpeechToText(req, context);
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Audio action '/${audioAction}' not found.`, 404);

      case 'usage':
        if (apiPath.length < 3 || apiPath[2] !== 'summary') {
          return createErrorResponse(ErrorType.VALIDATION, 'Invalid usage endpoint. Expected /api/usage/summary.', 400);
        }
        if (req.method !== 'GET') {
            return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected GET for usage summary.', 405);
        }
        const period = url.searchParams.get('period') || 'month';
        const usageLogger = new SupabaseUsageLogger(context.supabaseClient);
        const summary = await usageLogger.getUsageSummary(context.user.id, period);
        
        if (summary === null) {
            return createErrorResponse(ErrorType.SERVER, 'Failed to retrieve usage summary.', 500);
        }
        return new Response(JSON.stringify({ summary, requestId }), { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Request-ID': requestId } });
      
      default:
        if (mainEndpointCategory) {
            console.warn(`[${requestId}] mainRequestHandler: Endpoint category '/api/${mainEndpointCategory}' not found.`);
            return createErrorResponse(ErrorType.NOT_FOUND, `Endpoint category '/api/${mainEndpointCategory}' not found.`, 404);
        }
        console.warn(`[${requestId}] mainRequestHandler: Invalid API endpoint. Main category not specified.`);
        return createErrorResponse(ErrorType.VALIDATION, 'Invalid API endpoint. Main category not specified.', 400);
    }
}

serve(async (req: Request) => {
  const requestId = crypto.randomUUID(); // Generate unique ID for the request
  const requestStartTime = Date.now(); // For duration logging
  // console.log(`[${requestId}] New request: ${req.method} ${new URL(req.url).pathname}`);
  
  const corsResponse = handleCors(req);
  if (corsResponse) {
    // Add X-Request-ID to CORS preflight responses too
    const newCorsHeaders = new Headers(corsResponse.headers);
    newCorsHeaders.set('X-Request-ID', requestId);
    return new Response(corsResponse.body, {status: corsResponse.status, headers: newCorsHeaders});
  }
  
  let user, supabaseClient: SupabaseClient;

  try {
    const authResult = await verifyAuth(req);
    user = authResult.user;
    supabaseClient = authResult.supabaseClient;

    if (!middlewareInitialized) {
      middlewareChain
        .use(new RequestOptimizationMiddleware()) // Parses body first
        .use(new ProviderDetectionMiddleware())  // Detects provider from body
        .use(new CachingMiddleware(supabaseClient)) // Caching uses provider and body
        .use(new RateLimitingMiddleware(supabaseClient)) // Rate limiting uses provider
        .use(new UsageLoggingMiddleware(supabaseClient)) // Logs everything
        .use(new ErrorHandlingMiddleware()); // Standardizes errors last
      middlewareInitialized = true;
      // console.log(`[${requestId}] Middleware chain initialized.`);
    }
    
    const context: MiddlewareContext = {
      requestId,
      user,
      supabaseClient,
      handler: mainRequestHandler,
      requestStartTime
      // requestPath, requestParams etc. will be populated by middleware
    };
    
    const finalProcessedResponse = await middlewareChain.process(req, context);
    
    // console.log(`[${requestId}] Serve function: Final response status: ${finalProcessedResponse.status}`);
    // console.log(`[${requestId}] Serve function: Final response headers: ${JSON.stringify(Object.fromEntries(finalProcessedResponse.headers))}`);

    // Extensive logging for 429s or other specific statuses can be done here or in ErrorHandlingMiddleware.after
    // if (finalProcessedResponse.status === 429) {
    //   // ... detailed logging for 429 ...
    // } else if (finalProcessedResponse.body) {
    //   // ... preview logging for other responses ...
    // }
    
    return finalProcessedResponse;

  } catch (error) {
    console.error(`[${requestId}] Top-level error in ai-proxy/index.ts:`, error.message, error.stack ? error.stack.split('\n')[0] : '');
    
    let errorResponse: Response;
    if (error.message === 'Unauthorized') {
      errorResponse = createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    } else if (error instanceof Response) {
        errorResponse = error;
    } else {
      errorResponse = createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
    }
    
    // Ensure X-Request-ID is on top-level error responses
    const newErrorHeaders = new Headers(errorResponse.headers);
    newErrorHeaders.set('X-Request-ID', requestId);
    return new Response(errorResponse.body, {status: errorResponse.status, headers: newErrorHeaders});
  }
})
