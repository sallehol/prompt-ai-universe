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
}

// Caching middleware
export class CachingMiddleware implements Middleware {
  private cache: SupabaseCache;
  private cacheableEndpoints: Set<string>;
  
  constructor(supabaseClient: SupabaseClient) {
    this.cache = new SupabaseCache(supabaseClient);
    this.cacheableEndpoints = new Set([
      'models/text/completion',
      'models/chat/completion',
    ]);
  }
  
  private isCacheable(pathParts: string[]): boolean {
    if (pathParts.length < 3) return false; 
    const endpointKey = pathParts.slice(2).join('/'); 
    return this.cacheableEndpoints.has(endpointKey);
  }
  
  async before(req: Request, context: MiddlewareContext): Promise<Request | Response | void> {
    if (req.method !== 'POST') { 
      return;
    }
    
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean); 
    const apiPathIndex = pathParts.findIndex(p => p === 'ai-proxy') + 1;
    const relevantPath = pathParts.slice(apiPathIndex); 

    if (!this.isCacheable(relevantPath)) {
      return;
    }

    // If ProviderDetectionMiddleware ran, context.requestParams is available
    let isStreamingRequest = false;
    if (context.requestParams && context.requestParams.stream === true) {
        isStreamingRequest = true;
    } else if (!context.requestParams) {
        // Fallback: try to parse if not already parsed (should be rare if ProviderDetectionMiddleware is first)
        try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();
            context.requestParams = body; // Store for other uses
            if (body.stream === true) {
                isStreamingRequest = true;
            }
        } catch (e) { /* ignore if not JSON or already parsed */ }
    }
    
    if (isStreamingRequest) {
      console.log('CachingMiddleware: Skipping cache for streaming request.');
      return; // Do not cache or serve from cache for streaming requests
    }

    try {
      // context.requestParams should be populated by ProviderDetectionMiddleware if it ran first
      if (!context.requestParams) {
          // Fallback: if ProviderDetectionMiddleware didn't run or failed to parse
          console.warn("CachingMiddleware: context.requestParams not set, attempting to parse body.");
          const clonedReq = req.clone(); 
          context.requestParams = await clonedReq.json();
      }
      const params = context.requestParams || (await req.clone().json()); // Ensure params is available

      // Provider should be in context from ProviderDetectionMiddleware
      // Fallback if not set, or if provider is part of cache key logic itself
      const providerForCache = context.provider || (params && params.provider) || 'unknown_provider_for_cache';
      const endpoint = relevantPath.slice(1).join('/');
      
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
    if (!context.cacheKey || res.status !== 200 || res.headers.get('Content-Type')?.includes('text/event-stream')) {
      return;
    }
    
    try {
      if (!context.responseBody) {
        // This part is tricky if res is a stream that was already consumed by the client.
        // However, we should not reach here for streams due to the check above.
        const clonedRes = res.clone();
        context.responseBody = await clonedRes.json(); 
      }
      await this.cache.set(context.cacheKey, context.responseBody);
      
      const newHeaders = new Headers(res.headers);
      newHeaders.set('X-Cache', 'MISS');
      
      return new Response(JSON.stringify(context.responseBody), {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
      });

    } catch (error) {
      console.error('CachingMiddleware "after" error:', error.message);
      // If error occurs (e.g. trying to clone/read an already used stream body),
      // just return the original response without new headers to avoid breaking client.
      // This might happen if a stream somehow bypasses the Content-Type check.
      return res; 
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
      return; 
    }

    const userId = context.user.id;
    const provider = context.provider || 'default'; 
    if (provider === 'default' && context.provider !== 'default') {
        console.warn(`RateLimiting: context.provider was '${context.provider}', but resolved to 'default'. Check provider values.`);
    } else if (!context.provider) {
        console.log(`RateLimiting: No provider in context, using 'default'. Request path: ${new URL(req.url).pathname}`);
    }

    try {
      const { allowed, remaining, reset, limit } = await this.rateLimiter.checkLimit(userId, provider as string);
      
      context.rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
        'X-RateLimit-Reset': reset.toString()
      };

      if (!allowed) {
        console.log(`Rate limit exceeded for user ${userId}, provider ${provider}. Limit: ${limit}, Actual Remaining (can be <=0): ${remaining}, Reset: ${new Date(reset * 1000).toISOString()}`);
        
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        const retryAfterSeconds = Math.max(0, Math.ceil(reset - currentTimeInSeconds));

        const errorBody = {
          error: {
            type: ErrorType.RATE_LIMIT,
            message: `Rate limit exceeded for provider: ${provider}. Please try again after ${new Date(reset * 1000).toISOString()}`,
            provider: provider as string,
            limit: limit,
            remaining: 0, 
            reset_time: reset,
            retry_after: retryAfterSeconds,
          }
        };
        
        const responseHeaders = {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'X-RateLimit-Limit': limit.toString(),
          'X-RateLimit-Remaining': '0', 
          'X-RateLimit-Reset': reset.toString(),
          'Retry-After': retryAfterSeconds.toString()
        };
        
        console.log(`RateLimitingMiddleware: Returning 429 response with headers: ${JSON.stringify(responseHeaders)}`);
        const response = new Response(JSON.stringify(errorBody), {
          status: 429,
          headers: responseHeaders
        });
        console.log(`RateLimitingMiddleware: 429 Response created successfully: ${response.status}`);
        context.errorDetails = errorBody;

        return response;
      }
      context.rateLimit = { userId, provider: provider as string }; 
    } catch (error) {
      console.error('RateLimitingMiddleware "before" error:', error.message);
      context.errorDetails = { message: error.message, source: 'RateLimitingMiddlewareCatch' };
    }
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void> {
    const newHeaders = new Headers(res.headers);
    if (context.rateLimitHeaders) {
      for (const [key, value] of Object.entries(context.rateLimitHeaders)) {
        newHeaders.set(key, value);
      }
    }

    // Increment usage only for successful or client-error responses, not for server errors or if rate limited (429)
    if (context.rateLimit && (res.status >= 200 && res.status < 500 && res.status !== 429)) {
      try {
        await this.rateLimiter.incrementUsage(context.rateLimit.userId, context.rateLimit.provider);
        console.log(`RateLimitingMiddleware: Incremented usage for user ${context.rateLimit.userId}, provider ${context.rateLimit.provider}`);
      } catch (error) {
        console.error('RateLimitingMiddleware "after" (incrementUsage) error:', error.message);
      }
    }
    
    let responseBodyContent: BodyInit | null = null;
    const contentType = res.headers.get('Content-Type');

    // Preserve streaming responses
    if (res.body && (contentType?.includes('text/event-stream') || contentType?.includes('application/octet-stream'))) {
        responseBodyContent = res.body; 
    } else if (context.responseBody && contentType?.includes('application/json')) { // Use parsed body if available and JSON
        responseBodyContent = JSON.stringify(context.responseBody);
    } else if (res.body) { // Fallback for other types or if context.responseBody is not set
        try {
            const clonedRes = res.clone(); 
            responseBodyContent = await clonedRes.text(); 
        } catch (e) {
            console.warn("RateLimitingMiddleware after: Could not clone/read response body.", e.message)
            responseBodyContent = null; 
        }
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
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<void> {
    if (!context.user || !context.user.id) {
      console.warn('UsageLogging: No user ID, skipping log.');
      return;
    }

    const userId = context.user.id;
    const providerForLog = context.provider || 'unknown_provider_log';
    let modelForLog = 'unknown_model_log';
    
    if (context.requestParams && context.requestParams.model) {
        modelForLog = context.requestParams.model;
    } else if (req.method === 'POST' && !context.requestParams) {
        try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();
            modelForLog = body.model || modelForLog;
            context.requestParams = body; 
        } catch (e) { /* ignore */ }
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const apiPathIndex = pathParts.findIndex(p => p === 'ai-proxy') + 1;
    const endpoint = pathParts.slice(apiPathIndex +1).join('/');


    let responseBodyToLog = context.responseBody;
    let errorDetailsToLog = context.errorDetails;

    // Avoid parsing stream responses for logging body
    const contentType = res.headers.get('Content-Type');
    const isStreamingResponse = contentType?.includes('text/event-stream');

    if (res.status !== 200 && !errorDetailsToLog) {
        try {
            const clonedRes = res.clone();
            errorDetailsToLog = await clonedRes.json(); // Error responses are usually JSON
        } catch (e) {
            errorDetailsToLog = { status: res.status, message: res.statusText || "Failed to parse error response body for logging" };
        }
    } else if (res.status === 200 && !responseBodyToLog && !isStreamingResponse) { // Only try to parse if not streaming
         try {
            const clonedRes = res.clone();
            responseBodyToLog = await clonedRes.json();
        } catch (e) { 
            console.warn("UsageLogging: Could not parse success JSON response for logging.");
        }
    } else if (isStreamingResponse) {
        responseBodyToLog = { note: "Streaming response, body not logged." };
    }


    try {
      await this.usageLogger.logRequest(
        userId,
        providerForLog as string,
        modelForLog,
        endpoint,
        context.requestParams || {note: "No JSON body or params in GET/stream"},
        res.status,
        responseBodyToLog, 
        errorDetailsToLog
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

    for (const middleware of this.middlewares) {
      if (middleware.before) {
        const result = await middleware.before(currentReq, context);
        if (result instanceof Response) { 
          console.log(`MiddlewareChain: Middleware ${middleware.constructor.name} .before returned Response with status: ${result.status}, headers: ${JSON.stringify(Object.fromEntries(result.headers))}`);
          finalResponse = result;
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
        if (result instanceof Request) { 
          currentReq = result;
        }
      }
    }

    if (!finalResponse) {
        try {
            console.log("MiddlewareChain: No response from 'before' hooks, calling main handler.");
            finalResponse = await context.handler(currentReq, context);
            console.log(`MiddlewareChain: Main handler returned Response with status: ${finalResponse.status}, headers: ${JSON.stringify(Object.fromEntries(finalResponse.headers))}`);
            const finalContentType = finalResponse.headers.get('Content-Type');
            if (finalResponse.status >= 200 && finalResponse.status < 300 && finalContentType?.includes('application/json') && !context.responseBody) {
                try {
                    const clonedFinalResponse = finalResponse.clone();
                    context.responseBody = await clonedFinalResponse.json();
                } catch(e) {
                    console.warn("MiddlewareChain: Could not parse successful handler JSON response body for context.");
                }
            }
        } catch(e) {
            console.error("Error in main handler:", e.message, e.stack ? e.stack.split('\n')[0] : '');
            context.errorDetails = { message: e.message, stack: e.stack, source: 'mainHandler' }; 
            finalResponse = createErrorResponse(ErrorType.SERVER, e.message || "Error in handler", 500);
            console.log(`MiddlewareChain: Main handler caught error, created Response with status: ${finalResponse.status}`);
        }
    }
    
    let responseForAfterHooks = finalResponse;
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.after) {
        if (responseForAfterHooks === null) {
            console.error("MiddlewareChain: responseForAfterHooks is null before 'after' hooks. This should not happen.");
            responseForAfterHooks = createErrorResponse(ErrorType.SERVER, "Internal error in middleware processing", 500);
        }
        console.log(`MiddlewareChain: Calling ${middleware.constructor.name} .after with response status: ${responseForAfterHooks?.status}`);
        const result = await middleware.after(currentReq, responseForAfterHooks, context);
        if (result instanceof Response) { 
          console.log(`MiddlewareChain: ${middleware.constructor.name} .after returned new Response with status: ${result.status}, headers: ${JSON.stringify(Object.fromEntries(result.headers))}`);
          responseForAfterHooks = result;
        }
      }
    }
    
    if (responseForAfterHooks) {
      console.log(`MiddlewareChain: Returning finalResponse from .process with status: ${responseForAfterHooks.status}, headers: ${JSON.stringify(Object.fromEntries(responseForAfterHooks.headers))}`);
    } else {
      // This case should ideally not be reached if error handling and response creation are robust.
      console.error("MiddlewareChain: CRITICAL - responseForAfterHooks is null before returning from .process. Creating fallback error response.");
      responseForAfterHooks = createErrorResponse(ErrorType.SERVER, "Internal server error: Null response encountered in middleware processing", 500);
    }
    return responseForAfterHooks!; 
  }
}
