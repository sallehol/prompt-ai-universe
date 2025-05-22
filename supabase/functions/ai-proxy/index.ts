import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, verifyAuth, corsHeaders } from './auth.ts' // Keep corsHeaders for top-level errors
import { createErrorResponse, ErrorType } from './error-utils.ts'
// No longer need getProviderFromModel or direct handler imports from text-models, multimodal-endpoints, api-keys here
// No longer need ensureTable functions here, health handler does it.

import {
  MiddlewareChain,
  ProviderDetectionMiddleware,
  CachingMiddleware,
  RateLimitingMiddleware,
  UsageLoggingMiddleware,
  MiddlewareContext // Keep MiddlewareContext
} from './middleware/index.ts'
import { ErrorHandlingMiddleware } from './middleware/error-handling.ts'
import { RequestOptimizationMiddleware } from './middleware/optimization.ts'

// Import the new router handler
import { handleApiRequest } from './router/index.ts';
import { Database } from '../_shared/database.types.ts'; // Added import for Database types

// Initialize middleware chain
const middlewareChain = new MiddlewareChain();
let middlewareInitialized = false;

// mainRequestHandler is now removed. The logic is in the router and its handlers.

serve(async (req: Request) => {
  const requestId = crypto.randomUUID(); // Generate unique ID for the request
  const requestStartTime = Date.now(); // For duration logging
  // console.log(`[${requestId}] New request: ${req.method} ${new URL(req.url).pathname}`);
  
  const corsResponse = handleCors(req);
  if (corsResponse) {
    const newCorsHeaders = new Headers(corsResponse.headers);
    newCorsHeaders.set('X-Request-ID', requestId);
    return new Response(corsResponse.body, {status: corsResponse.status, headers: newCorsHeaders});
  }
  
  let user; // User type can be inferred or explicitly set if known from verifyAuth
  let supabaseClient: SupabaseClient<Database>; // Changed to SupabaseClient<Database>

  try {
    const authResult = await verifyAuth(req);
    user = authResult.user;
    supabaseClient = authResult.supabaseClient as SupabaseClient<Database>; // Cast to SupabaseClient<Database>

    if (!middlewareInitialized) {
      middlewareChain
        .use(new RequestOptimizationMiddleware())
        .use(new ProviderDetectionMiddleware())
        .use(new CachingMiddleware(supabaseClient))
        .use(new RateLimitingMiddleware(supabaseClient))
        .use(new UsageLoggingMiddleware(supabaseClient)) // supabaseClient is now SupabaseClient<Database>
        .use(new ErrorHandlingMiddleware()); // Standardizes errors last
      middlewareInitialized = true;
      // console.log(`[${requestId}] Middleware chain initialized.`);
    }
    
    const context: MiddlewareContext = {
      requestId,
      user,
      supabaseClient, // This is now SupabaseClient<Database>
      handler: handleApiRequest, // Use the new router handler
      requestStartTime
      // requestPath, requestParams etc. will be populated by middleware/router
    };
    
    const finalProcessedResponse = await middlewareChain.process(req, context);
    
    // console.log(`[${requestId}] Serve function: Final response status: ${finalProcessedResponse.status}`);
    // console.log(`[${requestId}] Serve function: Final response headers: ${JSON.stringify(Object.fromEntries(finalProcessedResponse.headers))}`);
    
    return finalProcessedResponse;

  } catch (error) {
    console.error(`[${requestId}] Top-level error in ai-proxy/index.ts:`, error.message, error.stack ? error.stack.split('\n')[0] : '');
    
    let errorResponse: Response;
    if (error.message === 'Unauthorized') {
      errorResponse = createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    } else if (error instanceof Response) {
        errorResponse = error; // If it's already a Response, pass it through
    } else {
      errorResponse = createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
    }
    
    const newErrorHeaders = new Headers(errorResponse.headers);
    newErrorHeaders.set('X-Request-ID', requestId); // Ensure X-Request-ID is on all error responses
    if (!newErrorHeaders.has('Access-Control-Allow-Origin')) { // Ensure CORS headers
        newErrorHeaders.set('Access-Control-Allow-Origin', corsHeaders['Access-Control-Allow-Origin']);
        newErrorHeaders.set('Access-Control-Allow-Headers', corsHeaders['Access-Control-Allow-Headers']);
    }
    return new Response(errorResponse.body, {status: errorResponse.status, headers: newErrorHeaders});
  }
})
