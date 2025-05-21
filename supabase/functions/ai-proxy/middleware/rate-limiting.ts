
// supabase/functions/ai-proxy/middleware/rate-limiting.ts
import { Middleware, MiddlewareContext } from './index.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SupabaseRateLimiter } from '../rate-limit.ts';
import { corsHeaders } from '../auth.ts';
import { createStandardErrorResponse } from './error-handling.ts'; // Use new standard error response
import { ErrorType } from '../error-utils.ts'; // For ErrorType enum

export class RateLimitingMiddleware implements Middleware {
  private rateLimiter: SupabaseRateLimiter;
  
  constructor(supabaseClient: SupabaseClient) {
    this.rateLimiter = new SupabaseRateLimiter(supabaseClient);
  }
  
  async before(req: Request, context: MiddlewareContext): Promise<Request | Response | void> {
    const { requestId } = context;
    if (!context.user || !context.user.id) {
      // console.warn(`[${requestId}] RateLimitingMiddleware: No user ID in context, skipping.`);
      return; 
    }

    const userId = context.user.id;
    // Provider should be set by ProviderDetectionMiddleware.
    const provider = context.provider || 'default'; 
    // if (provider === 'default' && context.provider !== 'default') {
    //     console.warn(`[${requestId}] RateLimitingMiddleware: context.provider was '${context.provider}', but resolved to 'default'. Request path: ${new URL(req.url).pathname}`);
    // } else if (!context.provider) {
    //     console.log(`[${requestId}] RateLimitingMiddleware: No provider in context, using 'default'. Request path: ${new URL(req.url).pathname}`);
    // }

    try {
      const { allowed, remaining, reset, limit } = await this.rateLimiter.checkLimit(userId, provider as string);
      
      context.rateLimitHeaders = {
        'X-RateLimit-Limit': limit.toString(),
        'X-RateLimit-Remaining': Math.max(0, remaining).toString(),
        'X-RateLimit-Reset': reset.toString() // Unix timestamp (seconds)
      };

      if (!allowed) {
        const currentTimeInSeconds = Math.floor(Date.now() / 1000);
        const retryAfterSeconds = Math.max(0, Math.ceil(reset - currentTimeInSeconds));
        
        console.log(`[${requestId}] RateLimitingMiddleware: Rate limit EXCEEDED for user ${userId}, provider ${provider}. Limit: ${limit}, Reset: ${new Date(reset * 1000).toISOString()}. Retry-After: ${retryAfterSeconds}s`);
        
        // Add Retry-After to headers for context.rateLimitHeaders
        context.rateLimitHeaders['Retry-After'] = retryAfterSeconds.toString();

        const errorDetails = {
            provider,
            limit,
            remaining: Math.max(0, remaining), // ensure non-negative
            resetTimestamp: reset, // Unix timestamp (seconds)
            retryAfterSeconds
        };
        context.errorDetails = errorDetails; // Store for logging

        return createStandardErrorResponse(
            ErrorType.RATE_LIMIT,
            `Rate limit exceeded for provider: ${provider}. Please try again after ${new Date(reset * 1000).toISOString()}`,
            429,
            errorDetails,
            requestId
        );
      }
      // console.log(`[${requestId}] RateLimitingMiddleware: Rate limit check PASSED for user ${userId}, provider ${provider}. Remaining: ${remaining}`);
      context.rateLimit = { userId, provider: provider as string }; 
    } catch (error) {
      console.error(`[${requestId}] RateLimitingMiddleware.before error:`, error.message);
      context.errorDetails = { message: error.message, source: 'RateLimitingMiddleware.before.catch' };
      // Let ErrorHandlingMiddleware deal with this as a generic server error
      throw error; // Re-throw to be caught by MiddlewareChain or global handler
    }
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void> {
    const { requestId } = context;
    const newHeaders = new Headers(res.headers);

    if (context.rateLimitHeaders) {
      for (const [key, value] of Object.entries(context.rateLimitHeaders)) {
        newHeaders.set(key, value);
      }
    }
    
    // Ensure X-Request-ID is on all responses passing through here
    newHeaders.set('X-Request-ID', requestId);


    // Increment usage only for successful or client-error responses, not for server errors or if rate limited (429)
    // If rate limited (429), the .before hook would have returned, so this .after hook implies the limit was not hit *before* the handler.
    if (context.rateLimit && (res.status >= 200 && res.status < 500 && res.status !== 429)) {
      try {
        await this.rateLimiter.incrementUsage(context.rateLimit.userId, context.rateLimit.provider);
        // console.log(`[${requestId}] RateLimitingMiddleware.after: Incremented usage for user ${context.rateLimit.userId}, provider ${context.rateLimit.provider}`);
      } catch (error) {
        console.error(`[${requestId}] RateLimitingMiddleware.after (incrementUsage) error:`, error.message);
      }
    }
    
    // Reconstruct response with new headers. Body handling is tricky with potential prior consumption.
    // Rely on context.responseBody if set by CachingMiddleware or MiddlewareChain, or use original res.body.
    let finalBody: BodyInit | null = null;
    const contentType = res.headers.get('Content-Type');

    if (res.body && (contentType?.includes('text/event-stream') || contentType?.includes('application/octet-stream'))) {
        finalBody = res.body; // Preserve streaming responses
    } else if (context.responseBody && (typeof context.responseBody === 'string' || typeof context.responseBody === 'object')) {
        finalBody = typeof context.responseBody === 'string' ? context.responseBody : JSON.stringify(context.responseBody);
    } else if (res.body) { // Fallback if context.responseBody not set or suitable
        // To avoid re-reading if already read by another middleware's after hook (e.g. ErrorHandling or Caching)
        // we should ideally use a flag or a shared parsed body in context if one exists.
        // For now, if context.responseBody is not set, we assume res.body is still readable or null.
        finalBody = res.body;
    }
    
    return new Response(finalBody, {
        status: res.status,
        statusText: res.statusText,
        headers: newHeaders
    });
  }
}
