
// supabase/functions/ai-proxy/middleware/index.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createErrorResponse, ErrorType } from '../error-utils.ts' // Keep for MiddlewareChain fallback

// Middleware Context with request ID for tracing
export interface MiddlewareContext {
  requestId: string; // New: unique ID for request tracing
  user?: any;
  supabaseClient: SupabaseClient;
  handler: (req: Request, context: MiddlewareContext) => Promise<Response>;
  provider?: string; // Simplified to string
  cacheKey?: string;
  rateLimit?: { userId: string; provider: string };
  rateLimitHeaders?: Record<string, string>;
  requestStartTime?: number;
  requestPath?: string[];
  requestParams?: any;
  responseBody?: any;
  errorDetails?: any;
  explicitCachePreference?: boolean;
}

// Middleware interface
export interface Middleware {
  before?(req: Request, context: MiddlewareContext): Promise<Request | Response | void>;
  after?(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void>;
}

// Middleware Chain
export class MiddlewareChain {
  private middlewares: Middleware[] = [];
  
  use(middleware: Middleware): MiddlewareChain {
    this.middlewares.push(middleware);
    return this;
  }
  
  async process(req: Request, context: MiddlewareContext): Promise<Response> {
    // Ensure requestId is set (should be set by the caller, e.g. main serve function)
    if (!context.requestId) {
      // Fallback if not set, though it's better if the entry point sets it.
      context.requestId = crypto.randomUUID();
      console.warn(`[${context.requestId}] MiddlewareContext.requestId was not set by caller, generated in MiddlewareChain.`);
    }
    
    console.log(`[${context.requestId}] MiddlewareChain: Starting request processing for ${req.method} ${new URL(req.url).pathname}`);
    
    let currentReq = req;
    let finalResponse: Response | null = null;

    for (const middleware of this.middlewares) {
      if (middleware.before) {
        try {
          console.log(`[${context.requestId}] MiddlewareChain: Executing .before for ${middleware.constructor.name}`);
          const result = await middleware.before(currentReq, context);
          if (result instanceof Response) { 
            console.log(`[${context.requestId}] MiddlewareChain: Middleware ${middleware.constructor.name} .before returned Response with status: ${result.status}`);
            finalResponse = result;
            // If a middleware returns a response (e.g., cache hit, rate limit), capture details if it's an error
            if (finalResponse.status >= 400 && !context.errorDetails) {
              try {
                  const clonedFinalResponse = finalResponse.clone();
                  context.errorDetails = await clonedFinalResponse.json();
              } catch (e) {
                  context.errorDetails = { status: finalResponse.status, message: finalResponse.statusText || `Error response from ${middleware.constructor.name} .before hook.`};
              }
            }
            break; 
          }
          if (result instanceof Request) { 
            currentReq = result;
          }
          console.log(`[${context.requestId}] MiddlewareChain: Finished .before for ${middleware.constructor.name}`);
        } catch (error) {
          console.error(`[${context.requestId}] MiddlewareChain: Error in .before for ${middleware.constructor.name}:`, error.message);
          context.errorDetails = { message: error.message, source: `${middleware.constructor.name}.before`, stack: error.stack };
          finalResponse = createErrorResponse(ErrorType.SERVER, `Error in ${middleware.constructor.name}: ${error.message}`, 500); // Using old createErrorResponse for internal middleware errors
          break;
        }
      }
    }

    if (!finalResponse) {
        try {
            console.log(`[${context.requestId}] MiddlewareChain: No response from 'before' hooks, calling main handler.`);
            finalResponse = await context.handler(currentReq, context);
            console.log(`[${context.requestId}] MiddlewareChain: Main handler returned Response with status: ${finalResponse.status}`);
            // If handler returns success and JSON, store body for logging/caching if not already set
            const finalContentType = finalResponse.headers.get('Content-Type');
            if (finalResponse.status >= 200 && finalResponse.status < 300 && finalContentType?.includes('application/json') && !context.responseBody) {
                try {
                    const clonedFinalResponse = finalResponse.clone();
                    context.responseBody = await clonedFinalResponse.json();
                } catch(e) {
                    console.warn(`[${context.requestId}] MiddlewareChain: Could not parse successful handler JSON response body for context.`);
                }
            }
        } catch(e) {
            console.error(`[${context.requestId}] MiddlewareChain: Error in main handler:`, e.message, e.stack ? e.stack.split('\n')[0] : '');
            context.errorDetails = { message: e.message, stack: e.stack, source: 'mainHandler' }; 
            finalResponse = createErrorResponse(ErrorType.SERVER, e.message || "Error in handler", 500); // Using old createErrorResponse
            console.log(`[${context.requestId}] MiddlewareChain: Main handler caught error, created Response with status: ${finalResponse.status}`);
        }
    }
    
    let responseForAfterHooks = finalResponse;
    // Iterate in reverse for 'after' hooks
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.after) {
        if (responseForAfterHooks === null) {
            // This should ideally not happen if error handling above is robust
            console.error(`[${context.requestId}] MiddlewareChain: responseForAfterHooks is null before 'after' hooks for ${middleware.constructor.name}. This should not happen.`);
            responseForAfterHooks = createErrorResponse(ErrorType.SERVER, "Internal error in middleware processing", 500);
        }
        try {
          console.log(`[${context.requestId}] MiddlewareChain: Executing .after for ${middleware.constructor.name} with response status: ${responseForAfterHooks?.status}`);
          const result = await middleware.after(currentReq, responseForAfterHooks!, context); // Non-null assertion as we create one if null
          if (result instanceof Response) { 
            console.log(`[${context.requestId}] MiddlewareChain: ${middleware.constructor.name} .after returned new Response with status: ${result.status}`);
            responseForAfterHooks = result;
          }
          console.log(`[${context.requestId}] MiddlewareChain: Finished .after for ${middleware.constructor.name}`);
        } catch (error) {
            console.error(`[${context.requestId}] MiddlewareChain: Error in .after for ${middleware.constructor.name}:`, error.message);
            // If an 'after' hook itself errors, we might be in trouble for response consistency.
            // The ErrorHandlingMiddleware (if last) should ideally catch this and standardize.
            // For now, let the possibly modified responseForAfterHooks pass, or if it's critical, create a new error response.
        }
      }
    }
    
    if (!responseForAfterHooks) {
      console.error(`[${context.requestId}] MiddlewareChain: CRITICAL - responseForAfterHooks is null before returning from .process. Creating fallback error response.`);
      responseForAfterHooks = createErrorResponse(ErrorType.SERVER, "Internal server error: Null response encountered in middleware processing", 500);
    }
    
    console.log(`[${context.requestId}] MiddlewareChain: Returning finalResponse from .process with status: ${responseForAfterHooks!.status}`);
    return responseForAfterHooks!; 
  }
}

// Export middleware classes from their respective files
export { CachingMiddleware } from './caching.ts';
export { RateLimitingMiddleware } from './rate-limiting.ts';
export { UsageLoggingMiddleware } from './logging.ts';
export { ProviderDetectionMiddleware } from './provider-detection.ts';
export { ErrorHandlingMiddleware } from './error-handling.ts';
export { RequestOptimizationMiddleware } from './optimization.ts';

