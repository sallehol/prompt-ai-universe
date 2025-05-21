
// supabase/functions/ai-proxy/middleware.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { SupabaseCache } from './cache.ts'
import { SupabaseRateLimiter } from './rate-limit.ts'
import { SupabaseUsageLogger } from './monitoring.ts'
import { createErrorResponse, ErrorType } from './error-utils.ts'
import { corsHeaders } from './auth.ts'
import { ProviderName } from './providers.ts'; // Assuming ProviderName enum exists

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
      const clonedReq = req.clone(); // Clone to read body
      const params = await clonedReq.json();
      context.requestParams = params; // Store for logging and other middleware

      const provider = context.provider || params.provider || 'unknown_provider_for_cache';
      const endpoint = relevantPath.slice(1).join('/'); // e.g. models/text/completion
      
      const cacheKey = SupabaseCache.generateCacheKey(provider as string, endpoint, params);
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
      const clonedRes = res.clone();
      const body = await clonedRes.json();
      context.responseBody = body; // Store for logging
      await this.cache.set(context.cacheKey, body);
      
      const newHeaders = new Headers(res.headers);
      newHeaders.set('X-Cache', 'MISS'); // Was a miss, now cached
      
      return new Response(JSON.stringify(body), {
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
    if (!context.provider) {
        console.warn('RateLimiting: No provider in context, skipping or using default.');
        // If you want to rate limit even if provider isn't determined yet, set a default
        // context.provider = 'default_rate_limit_provider'; 
        // return; // Or proceed with a default provider
    }

    const userId = context.user.id;
    // Provider should be determined by earlier logic (e.g. from model in index.ts)
    // and passed in context.provider. If not, use a default.
    const provider = context.provider || 'default'; 

    try {
      const { allowed, remaining, reset, limit } = await this.rateLimiter.checkLimit(userId, provider as string);
      
      context.rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': remaining.toString(),
        'X-RateLimit-Reset': reset.toString()
      };

      if (!allowed) {
        return createErrorResponse(
          ErrorType.RATE_LIMIT,
          `Rate limit exceeded for ${provider}. Try again after ${new Date(reset * 1000).toISOString()}`,
          429,
          provider as string,
          context.rateLimitHeaders 
        );
      }
      context.rateLimit = { userId, provider: provider as string }; // Store for incrementing usage in 'after'
    } catch (error) {
      console.error('RateLimitingMiddleware "before" error:', error.message);
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

    if (context.rateLimit && (res.status >= 200 && res.status < 500 && res.status !== 429)) {
      // Increment usage for successful or client error requests (but not if rate limited itself, or server errors)
      try {
        await this.rateLimiter.incrementUsage(context.rateLimit.userId, context.rateLimit.provider);
      } catch (error) {
        console.error('RateLimitingMiddleware "after" (incrementUsage) error:', error.message);
      }
    }
    
    // Create a new response to apply headers, even if just passing through
    // Clone to be safe if body is already consumed or streamed
    const clonedResBody = await res.text(); // Read body as text to handle various content types
    return new Response(clonedResBody, {
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
    // requestParams should be populated by CachingMiddleware or main handler if needed for logging
    // and if request is POST with JSON body.
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<void> {
    if (!context.user || !context.user.id) {
      console.warn('UsageLogging: No user ID, skipping log.');
      return;
    }

    const userId = context.user.id;
    // Provider and model determined in main handler or other middleware
    const provider = context.provider || 'unknown_provider_log';
    let model = 'unknown_model_log';
    if (context.requestParams && context.requestParams.model) {
        model = context.requestParams.model;
    } else if (req.method === 'POST' && !context.requestParams) {
        // Attempt to parse body if not already done (e.g. if caching was skipped)
        try {
            const clonedReq = req.clone();
            const body = await clonedReq.json();
            model = body.model || model;
            context.requestParams = body; // For logging
        } catch (e) { /* ignore if not JSON or already parsed */ }
    }


    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const apiPathIndex = pathParts.findIndex(p => p === 'ai-proxy') + 1;
    const endpoint = pathParts.slice(apiPathIndex +1).join('/'); // e.g. models/text/completion or usage/summary


    // Try to get response body if not already in context from caching middleware
    let responseBodyToLog = context.responseBody;
    let errorDetailsToLog = context.errorDetails;

    if (res.status !== 200 && !errorDetailsToLog) {
        try {
            const clonedRes = res.clone();
            errorDetailsToLog = await clonedRes.json(); // Assuming error responses are JSON
        } catch (e) {
            // If error response is not JSON, or already consumed
            errorDetailsToLog = { status: res.status, message: res.statusText || "Failed to parse error response body" };
        }
    } else if (res.status === 200 && !responseBodyToLog) {
         try {
            const clonedRes = res.clone();
            responseBodyToLog = await clonedRes.json();
        } catch (e) { 
            /* ignore if not JSON or already consumed */ 
            console.warn("UsageLogging: Could not parse success response for logging");
        }
    }

    try {
      await this.usageLogger.logRequest(
        userId,
        provider as string,
        model,
        endpoint,
        context.requestParams || {note: "No JSON body or params in GET"},
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

    // Process "before" hooks
    for (const middleware of this.middlewares) {
      if (middleware.before) {
        const result = await middleware.before(currentReq, context);
        if (result instanceof Response) { // Short-circuit if a response is returned
          finalResponse = result;
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
        } catch(e) {
            console.error("Error in main handler:", e);
            context.errorDetails = { message: e.message, stack: e.stack }; // Store error for logging
            finalResponse = createErrorResponse(ErrorType.SERVER, e.message || "Error in handler", 500);
        }
    }
    
    // Process "after" hooks in reverse order
    for (const middleware of [...this.middlewares].reverse()) {
      if (middleware.after) {
        const result = await middleware.after(currentReq, finalResponse, context);
        if (result instanceof Response) { // Update response if modified
          finalResponse = result;
        }
      }
    }
    
    return finalResponse;
  }
}

