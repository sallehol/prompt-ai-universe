// supabase/functions/ai-proxy/middleware.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SupabaseCache } from './cache.ts'
import { SupabaseRateLimiter } from './rate-limit.ts'
import { SupabaseUsageLogger } from './monitoring.ts'
import { createErrorResponse, ErrorType } from './error-utils.ts'
import { corsHeaders } from './auth.ts'
import { getProviderFromModel, ProviderName } from './providers.ts';

// Middleware Context
export interface MiddlewareContext {
  user?: any; // User object from verifyAuth
  supabaseClient: SupabaseClient;
  handler: (req: Request, context: MiddlewareContext) => Promise<Response>;
  provider?: ProviderName | string; // Provider for the current request
  cacheKey?: string;
  rateLimit?: { userId: string; provider: string };
  rateLimitHeaders?: Record<string, string>;
  requestStartTime?: number;
  requestPath?: string[];
  requestParams?: any;
  responseBody?: any; // To store parsed response body for logging
  errorDetails?: any; // To store error details for logging
}

// Middleware interface
export interface Middleware {
  before?(req: Request, context: MiddlewareContext): Promise<Request | Response | void>; // void means continue
  after?(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void>; // void means continue
}

// Provider Detection Middleware (NEW)
export class ProviderDetectionMiddleware implements Middleware {
  async before(req: Request, context: MiddlewareContext): Promise<void> {
    if (req.method === 'POST') {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        try {
          // Ensure requestParams is populated. If already populated by a previous middleware, use it.
          // For this setup, ProviderDetectionMiddleware is likely the first to parse the body.
          if (!context.requestParams) {
            const clonedReq = req.clone(); // Clone to read body without consuming it
            const body = await clonedReq.json();
            context.requestParams = body; // Store for other middleware and logging
          }

          const body = context.requestParams; // Use already parsed or freshly parsed body

          if (body) {
            let provider: ProviderName | string | undefined;
            // Prefer provider derived from model if model exists, otherwise use direct provider field
            if (body.model) {
              provider = getProviderFromModel(body.model, body.provider);
            } else if (body.provider) {
              provider = body.provider;
            }

            if (provider) {
              context.provider = provider;
              console.log(`ProviderDetectionMiddleware: Set context.provider to '${provider}'`);
            } else {
              console.log("ProviderDetectionMiddleware: Could not determine provider from request body (model or provider field missing/unrecognized).");
            }
          } else {
            console.log("ProviderDetectionMiddleware: Request body is empty or not valid JSON.");
          }
        } catch (error) {
          // Log error but don't block the request.
          // Downstream middleware (like RateLimiter) will use defaults if provider is not set.
          console.error('ProviderDetectionMiddleware: Error parsing request body or determining provider:', error.message);
        }
      }
    }
  }
  // No 'after' method needed for this specific middleware
}

// Caching middleware
export class CachingMiddleware implements Middleware {
  private cache: SupabaseCache;
  private cacheableEndpoints: Set<string>;
  
  constructor(supabaseClient: SupabaseClient) {
    this.cache = new SupabaseCache(supabaseClient);
    this.cacheableEndpoints = new Set([
      // Format: category/type/action or category/action
      'models/text/completion',
      'models/chat/completion',
      // 'image/generation' // Image generation is often non-deterministic, consider carefully
    ]);
  }
  
  private isCacheable(pathParts: string[]): boolean {
    if (pathParts.length < 3) return false; // e.g. api/models/text/completion (4 parts)
    // ai-proxy/api/models/text/completion -> pathParts[1]=api, pathParts[2]=models, etc.
    const endpointKey = pathParts.slice(2).join('/'); // e.g. models/text/completion
    return this.cacheableEndpoints.has(endpointKey);
  }
  
  async before(req: Request, context: MiddlewareContext): Promise<Request | Response | void> {
    if (req.method !== 'POST') { // Assuming most AI requests are POST
      return;
    }
    
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean); // e.g. [functions, v1, ai-proxy, api, models, text, completion]
    const apiPathIndex = pathParts.findIndex(p => p === 'ai-proxy') + 1;
    const relevantPath = pathParts.slice(apiPathIndex); // e.g. [api, models, text, completion]

    if (!this.isCacheable(relevantPath)) {
      return;
    }

    try {
      // context.requestParams should be populated by ProviderDetectionMiddleware if it ran first
      if (!context.requestParams) {
          // Fallback: if ProviderDetectionMiddleware didn't run or failed to parse
          console.warn("CachingMiddleware: context.requestParams not set, attempting to parse body.");
          const clonedReq = req.clone(); 
          context.requestParams = await clonedReq.json();
      }
      const params = context.requestParams;

      // Provider should be in context from ProviderDetectionMiddleware
      // Fallback if not set, or if provider is part of cache key logic itself
      const providerForCache = context.provider || (params && params.provider) || 'unknown_provider_for_cache';
      const endpoint = relevantPath.slice(1).join('/'); // e.g. models/text/completion
      
      const cacheKey = SupabaseCache.generateCacheKey(providerForCache as string, endpoint, params);
      context.cacheKey = cacheKey; // Store for after middleware
      
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        console.log(`Cache HIT for key: ${cacheKey}`);
        context.responseBody = cachedResponse; // For logging
        return new Response(
          JSON.stringify(cachedResponse),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json', 'X-Cache': 'HIT' } }
        );
      }
      console.log(`Cache MISS for key: ${cacheKey}`);
    } catch (error) {
      console.error('CachingMiddleware "before" error:', error.message);
    }
  }
  
  async after(_req: Request, res: Response, context: MiddlewareContext): Promise<Response | void> {
    if (!context.cacheKey || res.status !== 200) {
      return;
    }
    
    try {
      // context.responseBody might be set by main handler or here
      if (!context.responseBody) {
        const clonedRes = res.clone();
        context.responseBody = await clonedRes.json(); // Store for logging
      }
      await this.cache.set(context.cacheKey, context.responseBody);
      
      const newHeaders = new Headers(res.headers);
      newHeaders.set('X-Cache', 'MISS'); // Was a miss, now cached
      
      // Return a new response with potentially modified body (if it was stringified from context.responseBody)
      // and new headers.
      return new Response(JSON.stringify(context.responseBody), {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      });

    } catch (error) {
      console.error('CachingMiddleware "after" error:', error.message);
    }
  }
}

// Rate limiting middleware
export class RateLimitingMiddleware implements Middleware {
  private rateLimiter: SupabaseRateLimiter;
  
  constructor(supabaseClient: SupabaseClient) {
    this.rateLimiter = new SupabaseRateLimiter(supabaseClient);
  }
  
  async before(req: Request, context: MiddlewareContext): Promise<Request | Response | void> {
    if (!context.user || !context.user.id) {
      console.warn('RateLimiting: No user ID in context, skipping.');
      return; // No user, skip. Or could implement IP based rate limiting.
    }

    const userId = context.user.id;
    // Provider should now be determined by ProviderDetectionMiddleware and set in context.provider.
    // If not, use a default.
    const provider = context.provider || 'default'; 
    if (provider === 'default' && context.provider !== 'default') {
        // This case should ideally not happen if ProviderDetectionMiddleware works.
        // It means context.provider was set to something, but then evaluated as falsy here.
        console.warn(`RateLimiting: context.provider was '${context.provider}', but resolved to 'default'. Check provider values.`);
    } else if (!context.provider) {
        console.log(`RateLimiting: No provider in context, using 'default'. Request path: ${new URL(req.url).pathname}`);
    }


    try {
      const { allowed, remaining, reset, limit } = await this.rateLimiter.checkLimit(userId, provider as string);
      
      context.rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      };

      if (!allowed) {
        // Log details before returning error
        console.log(`Rate limit exceeded for user ${userId}, provider ${provider}. Limit: ${limit}, Remaining: ${remaining}, Reset: ${new Date(reset * 1000).toISOString()}`);
        return createErrorResponse(
          ErrorType.RATE_LIMIT,
          `Rate limit exceeded for ${provider}. Try again after ${new Date(reset * 1000).toISOString()}`,
          429,
          provider as string,
          context.rateLimitHeaders 
        );
      }
      // Store for incrementing usage in 'after' only if request was allowed
      context.rateLimit = { userId, provider: provider as string }; 
    } catch (error) {
      console.error('RateLimitingMiddleware "before" error:', error.message);
      // Fail open or handle error appropriately
    }
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void> {
    // Always attach rate limit headers if they were prepared
    const newHeaders = new Headers(res.headers);
    if (context.rateLimitHeaders) {
      for (const [key, value] of Object.entries(context.rateLimitHeaders)) {
        newHeaders.set(key, value);
      }
    }

    // Increment usage if rateLimit context was set (meaning request was allowed by 'before' hook)
    // and the response is not a server error or the rate limit error itself.
    if (context.rateLimit && (res.status >= 200 && res.status < 500 && res.status !== 429)) {
      try {
        await this.rateLimiter.incrementUsage(context.rateLimit.userId, context.rateLimit.provider);
        console.log(`RateLimitingMiddleware: Incremented usage for user ${context.rateLimit.userId}, provider ${context.rateLimit.provider}`);
      } catch (error) {
        console.error('RateLimitingMiddleware "after" (incrementUsage) error:', error.message);
      }
    }
    
    // Create a new response to apply headers.
    // Body might have been consumed or transformed by other middleware (e.g. CachingMiddleware).
    // If context.responseBody exists, use it, otherwise read from res.
    let responseBodyContent: BodyInit | null = null;
    if (context.responseBody && (res.headers.get('Content-Type')?.includes('application/json'))) {
        responseBodyContent = JSON.stringify(context.responseBody);
    } else {
        responseBodyContent = await res.text(); // Fallback to text if not JSON or no context.responseBody
    }
    
    return new Response(responseBodyContent, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
    });
  }
}

// Usage logging middleware
export class UsageLoggingMiddleware implements Middleware {
  private usageLogger: SupabaseUsageLogger;
  
  constructor(supabaseClient: SupabaseClient) {
    this.usageLogger = new SupabaseUsageLogger(supabaseClient);
  }
  
  async before(_req: Request, context: MiddlewareContext): Promise<void> {
    context.requestStartTime = Date.now();
    // requestParams should be populated by ProviderDetectionMiddleware or CachingMiddleware
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<void> {
    if (!context.user || !context.user.id) {
      console.warn('UsageLogging: No user ID, skipping log.');
      return;
    }

    const userId = context.user.id;
    // Provider should be in context from ProviderDetectionMiddleware
    const providerForLog = context.provider || 'unknown_provider_log';
    let modelForLog = 'unknown_model_log';
    
    // context.requestParams should be set by ProviderDetectionMiddleware or CachingMiddleware
    if (context.requestParams && context.requestParams.model) {
        modelForLog = context.requestParams.model;
    } else if (req.method === 'POST' && !context.requestParams) {
        // Fallback if earlier middleware didn't parse (should be rare)
        try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();
            modelForLog = body.model || modelForLog;
            context.requestParams = body; 
        } catch (e) { /* ignore if not JSON or already parsed */ }
    }


    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const apiPathIndex = pathParts.findIndex(p => p === 'ai-proxy') + 1;
    const endpoint = pathParts.slice(apiPathIndex +1).join('/'); // e.g. models/text/completion or usage/summary


    // Try to get response body if not already in context (e.g. from CachingMiddleware's after hook)
    let responseBodyToLog = context.responseBody;
    let errorDetailsToLog = context.errorDetails; // Should be set by MiddlewareChain's error handling or main handler

    if (res.status !== 200 && !errorDetailsToLog) {
        try {
            // Clone response as it might have been read
            const clonedRes = res.clone();
            errorDetailsToLog = await clonedRes.json();
        } catch (e) {
            errorDetailsToLog = { status: res.status, message: res.statusText || "Failed to parse error response body for logging" };
        }
    } else if (res.status === 200 && !responseBodyToLog) {
         try {
            const clonedRes = res.clone();
            responseBodyToLog = await clonedRes.json();
        } catch (e) { 
            console.warn("UsageLogging: Could not parse success response for logging. It might not be JSON or was already consumed.");
        }
    }

    try {
      await this.usageLogger.logRequest(
        userId,
        providerForLog as string,
        modelForLog,
        endpoint,
        context.requestParams || {note: "No JSON body or params in GET"},
        res.status,
        responseBodyToLog, // Already parsed if available
        errorDetailsToLog   // Already parsed if available
      );
    } catch (error) {
      console.error('UsageLoggingMiddleware "after" error:', error.message);
    }
  }
}

// Middleware chain
export class MiddlewareChain {
  middlewares: Middleware[] = []; // Made public for inspection if needed
  
  constructor() {}
  
  use(middleware: Middleware): MiddlewareChain {
    this.middlewares.push(middleware);
    return this;
  }
  
  async process(req: Request, context: MiddlewareContext): Promise<Response> {
    let currentReq = req;
    let finalResponse: Response | null = null;

    // Process "before" hooks
    for (const middleware of this.middlewares) {
      if (middleware.before) {
        const result = await middleware.before(currentReq, context);
        if (result instanceof Response) { // Short-circuit if a response is returned
          finalResponse = result;
          // Capture error details if the response is an error
          if (finalResponse.status >= 400 && !context.errorDetails) {
            try {
                const clonedFinalResponse = finalResponse.clone();
                context.errorDetails = await clonedFinalResponse.json();
            } catch (e) {
                context.errorDetails = { status: finalResponse.status, message: finalResponse.statusText || "Error response from middleware 'before' hook."};
            }
          }
          break; 
        }
        if (result instanceof Request) { // Update request if modified
          currentReq = result;
        }
      }
    }

    // If not short-circuited by a "before" hook, call the main handler
    if (!finalResponse) {
        try {
            finalResponse = await context.handler(currentReq, context);
            // If handler returns a successful response, try to parse and store body if JSON
            if (finalResponse.status >= 200 && finalResponse.status < 300 && finalResponse.headers.get('Content-Type')?.includes('application/json') && !context.responseBody) {
                try {
                    const clonedFinalResponse = finalResponse.clone();
                    context.responseBody = await clonedFinalResponse.json();
                } catch(e) {
                    console.warn("MiddlewareChain: Could not parse successful handler response body for context.");
                }
            }
        } catch(e) {
            console.error("Error in main handler:", e.message, e.stack ? e.stack.split('\n')[0] : '');
            context.errorDetails = { message: e.message, stack: e.stack, source: 'mainHandler' }; // Store error for logging
            finalResponse = createErrorResponse(ErrorType.SERVER, e.message || "Error in handler", 500);
        }
    }
    
    // Process "after" hooks in reverse order
    // Pass the 'finalResponse' which could be from a 'before' hook or the main handler
    let responseForAfterHooks = finalResponse;
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.after) {
        // Ensure responseForAfterHooks is not null, though it should always be a Response object by now
        if (responseForAfterHooks === null) {
            console.error("MiddlewareChain: finalResponse is null before 'after' hooks. This should not happen.");
            // Create a generic error response if somehow null
            responseForAfterHooks = createErrorResponse(ErrorType.SERVER, "Internal error in middleware processing", 500);
        }
        const result = await middleware.after(currentReq, responseForAfterHooks, context);
        if (result instanceof Response) { // Update response if modified
          responseForAfterHooks = result;
        }
      }
    }
    
    return responseForAfterHooks!; // Assert non-null, as it's initialized or created
  }
}
