// supabase/functions/ai-proxy/middleware/caching.ts
import { Middleware, MiddlewareContext } from './index.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SupabaseCache } from '../cache.ts';
import { corsHeaders } from '../auth.ts';

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
    // The pathParts here are expected to be like ['api', 'models', 'text', 'completion']
    if (pathParts.length < 3) return false; 
    // We want to match "models/text/completion" or "models/chat/completion"
    // So we should take elements from index 1 (models) onwards.
    const endpointKey = pathParts.slice(1).join('/'); // e.g. models/text/completion
    return this.cacheableEndpoints.has(endpointKey);
  }
  
  async before(req: Request, context: MiddlewareContext): Promise<Request | Response | void> {
    const { requestId } = context;
    // console.log(`[${requestId}] CachingMiddleware.before: Processing request`); // Redundant if MiddlewareChain logs it
    
    if (req.method !== 'POST') { 
      // console.log(`[${requestId}] CachingMiddleware.before: Skipping non-POST request`);
      return;
    }
    
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean); 
    const aiProxyPathIndex = pathParts.findIndex(p => p === 'ai-proxy');
    if (aiProxyPathIndex === -1 || pathParts[aiProxyPathIndex + 1] !== 'api') {
        console.warn(`[${requestId}] CachingMiddleware.before: Invalid path for caching check: ${url.pathname}`);
        return; // Not a valid API path for our concern
    }
    // relevantPath is like ['api', 'models', 'text', 'completion']
    const relevantPath = pathParts.slice(aiProxyPathIndex + 1); 

    // console.log(`[${requestId}] CachingMiddleware.before: Path: ${relevantPath.join('/')}, Cacheable: ${this.isCacheable(relevantPath)}`);

    if (!this.isCacheable(relevantPath)) {
      // console.log(`[${requestId}] CachingMiddleware.before: Path not cacheable, skipping`);
      return;
    }

    // RequestOptimizationMiddleware should have populated this.
    if (!context.requestParams) {
      // This case should ideally not be hit if RequestOptimizationMiddleware runs first and succeeds.
      // If it does, it means the body wasn't JSON or RequestOptimizationMiddleware didn't run.
      console.warn(`[${requestId}] CachingMiddleware.before: context.requestParams not populated. Body might not be JSON or optimization middleware didn't run/parse.`);
      return; // Cannot proceed without params for caching logic
    }
    
    // CRITICAL FIX: Properly handle cache parameter with case-insensitivity
    if (context.requestParams) {
      // Check for cache parameter in any case (cache, Cache, CACHE)
      const cacheParamKey = Object.keys(context.requestParams)
        .find(key => key.toLowerCase() === 'cache');
      
      if (cacheParamKey) {
        context.explicitCachePreference = !!context.requestParams[cacheParamKey];
        console.log(`[${requestId}] CachingMiddleware.before: Explicit cache preference set to ${context.explicitCachePreference} from param '${cacheParamKey}'`);
        
        // Create a new object without the cache parameter
        const newParams = { ...context.requestParams };
        delete newParams[cacheParamKey];
        context.requestParams = newParams;
        
        console.log(`[${requestId}] CachingMiddleware.before: Removed '${cacheParamKey}' parameter from request params. New params:`, JSON.stringify(context.requestParams));
      }
    }

    if (context.explicitCachePreference === false) {
      console.log(`[${requestId}] CachingMiddleware.before: Caching explicitly disabled by request parameter.`);
      return; // Skip caching for this request
    }
    
    let isStreamingRequest = false;
    if (context.requestParams && context.requestParams.stream === true) {
        isStreamingRequest = true;
    }
    
    if (isStreamingRequest) {
      console.log(`[${requestId}] CachingMiddleware.before: Skipping cache for streaming request.`);
      return; 
    }

    try {
      // provider should be set by ProviderDetectionMiddleware
      const providerForCache = context.provider || (context.requestParams && context.requestParams.provider) || 'unknown_provider_for_cache';
      // endpoint is like 'models/text/completion'
      const endpoint = relevantPath.slice(1).join('/'); 
      
      const cacheKey = SupabaseCache.generateCacheKey(providerForCache as string, endpoint, context.requestParams);
      context.cacheKey = cacheKey; 
      console.log(`[${requestId}] CachingMiddleware.before: Cache check for key: ${cacheKey}`);
      
      const cachedResponse = await this.cache.get(cacheKey);
      if (cachedResponse) {
        console.log(`[${requestId}] CachingMiddleware.before: Cache HIT for key: ${cacheKey}`);
        context.responseBody = cachedResponse; 
        
        return new Response(
          JSON.stringify(cachedResponse),
          { 
            headers: { 
              ...corsHeaders, 
              'Content-Type': 'application/json', 
              'X-Cache': 'HIT',
              'X-Request-ID': requestId
            } 
          }
        );
      }
      console.log(`[${requestId}] CachingMiddleware.before: Cache MISS for key: ${cacheKey}`);
    } catch (error) {
      console.error(`[${requestId}] CachingMiddleware.before error:`, error.message);
    }
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<Response | void> {
    const { requestId } = context;
    let cacheStatusHeader = 'BYPASS'; // Default if no other condition met

    if (context.explicitCachePreference === false) {
      console.log(`[${requestId}] CachingMiddleware.after: Caching explicitly disabled.`);
      cacheStatusHeader = 'DISABLED';
    } else if (!context.cacheKey || res.status !== 200 || res.headers.get('Content-Type')?.includes('text/event-stream')) {
      if (res.status !== 200) {
        // console.log(`[${requestId}] CachingMiddleware.after: Skipping cache set for non-200 status: ${res.status}`);
      }
      if (res.headers.get('Content-Type')?.includes('text/event-stream')) {
        // console.log(`[${requestId}] CachingMiddleware.after: Skipping cache set for event stream`);
      }
      if (!context.cacheKey) {
        // console.log(`[${requestId}] CachingMiddleware.after: Skipping cache set as no cacheKey in context`);
      }
      // cacheStatusHeader remains 'BYPASS'
    } else {
      // Condition to cache: cacheKey exists, status 200, not event-stream, not explicitly disabled
      try {
        let bodyToCache = context.responseBody; // Use if already parsed by MiddlewareChain or handler
        if (!bodyToCache) {
            const clonedRes = res.clone();
            try {
                bodyToCache = await clonedRes.json();
                // console.log(`[${requestId}] CachingMiddleware.after: Successfully parsed response as JSON for caching`);
            } catch (e) {
                console.warn(`[${requestId}] CachingMiddleware.after: Failed to parse response as JSON for caching, trying as text: ${e.message}`);
                const textClonedRes = res.clone(); 
                bodyToCache = await textClonedRes.text();
            }
        }
        
        context.responseBody = bodyToCache; // Ensure context has it for other after-middlewares (e.g., logging)
        await this.cache.set(context.cacheKey, bodyToCache);
        console.log(`[${requestId}] CachingMiddleware.after: Cached response for key ${context.cacheKey}`);
        cacheStatusHeader = 'MISS'; // It was a MISS, now it's cached.
      } catch (error) {
        console.error(`[${requestId}] CachingMiddleware.after error during cache set:`, error.message, error.stack ? error.stack.split('\n')[0] : '');
        cacheStatusHeader = 'ERROR';
      }
    }
      
    const newHeaders = new Headers(res.headers);
    newHeaders.set('X-Cache', cacheStatusHeader);
    newHeaders.set('X-Request-ID', requestId);
    
    // console.log(`[${requestId}] CachingMiddleware.after: Setting response headers:`, Object.fromEntries(newHeaders.entries()));
    
    // Body might have been consumed by res.json() or res.text() if context.responseBody was not pre-filled.
    // Reconstruct response with context.responseBody if available and valid, otherwise use original res.body (stream).
    let finalBody: BodyInit | null = null;
    if (context.responseBody && (typeof context.responseBody === 'string' || typeof context.responseBody === 'object')) {
        finalBody = typeof context.responseBody === 'string' ? context.responseBody : JSON.stringify(context.responseBody);
    } else {
        finalBody = res.body; // Fallback to original stream if context.responseBody is not suitable
    }

    return new Response(finalBody, {
      status: res.status,
      statusText: res.statusText,
      headers: newHeaders
    });
  }
}
