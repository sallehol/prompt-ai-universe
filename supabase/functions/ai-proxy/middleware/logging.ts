
// supabase/functions/ai-proxy/middleware/logging.ts
import { Middleware, MiddlewareContext } from './index.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { SupabaseUsageLogger } from '../monitoring.ts';

export class UsageLoggingMiddleware implements Middleware {
  private usageLogger: SupabaseUsageLogger;
  
  constructor(supabaseClient: SupabaseClient) {
    this.usageLogger = new SupabaseUsageLogger(supabaseClient);
  }
  
  async before(req: Request, context: MiddlewareContext): Promise<void> {
    // context.requestStartTime is set by main serve() function now.
    // No specific action needed in 'before' for logging itself,
    // but good place for initial log if desired.
    // const { requestId } = context;
    // console.log(`[${requestId}] UsageLoggingMiddleware.before: Request received.`);
  }
  
  async after(req: Request, res: Response, context: MiddlewareContext): Promise<void> {
    const { requestId } = context;
    if (!context.user || !context.user.id) {
      // console.warn(`[${requestId}] UsageLoggingMiddleware: No user ID, skipping log.`);
      return;
    }
    if (!context.requestStartTime) {
        console.warn(`[${requestId}] UsageLoggingMiddleware: requestStartTime not set in context. Log might be incomplete.`);
    }

    const userId = context.user.id;
    // Provider should be set by ProviderDetectionMiddleware
    const providerForLog = context.provider || 'unknown_provider_log';
    let modelForLog = 'unknown_model_log';
    
    // requestParams should be populated by RequestOptimizationMiddleware or other preceding middleware
    if (context.requestParams && context.requestParams.model) {
        modelForLog = context.requestParams.model;
    }

    const url = new URL(req.url);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const aiProxyPathIndex = pathParts.findIndex(p => p === 'ai-proxy');
    // endpoint is like 'models/text/completion' or 'image/generation'
    const endpoint = pathParts.slice(aiProxyPathIndex + 2).join('/');


    // responseBody should be populated by CachingMiddleware or MiddlewareChain (for successful JSON)
    // errorDetails should be populated by middleware returning errors or by MiddlewareChain for handler errors
    let responseBodyToLog = context.responseBody;
    let errorDetailsToLog = context.errorDetails;

    const contentType = res.headers.get('Content-Type');
    const isStreamingResponse = contentType?.includes('text/event-stream');

    // If not a 200 response, and errorDetails not yet set, try to parse from response.
    // This might be redundant if ErrorHandlingMiddleware already parsed it.
    if (res.status !== 200 && !errorDetailsToLog) {
        try {
            const clonedRes = res.clone(); // Safe to clone, body might be read by ErrorHandlingMiddleware
            errorDetailsToLog = await clonedRes.json();
        } catch (e) {
            // Fallback if parsing fails
            errorDetailsToLog = { status: res.status, message: res.statusText || "Failed to parse error response body for logging" };
        }
    } else if (res.status === 200 && !responseBodyToLog && !isStreamingResponse) {
         // If successful JSON and not streaming, and body not in context, try to parse.
         // This might be redundant if MiddlewareChain (for handler) or CachingMiddleware already parsed it.
         try {
            const clonedRes = res.clone();
            responseBodyToLog = await clonedRes.json();
        } catch (e) { 
            // console.warn(`[${requestId}] UsageLoggingMiddleware: Could not parse success JSON response for logging.`);
            // If parsing fails, bodyToLog might remain undefined, which is acceptable for logging.
        }
    }
    
    if (isStreamingResponse) {
        responseBodyToLog = { note: "Streaming response, body not logged in detail." };
    }
    
    const durationMs = context.requestStartTime ? Date.now() - context.requestStartTime : -1;
    // console.log(`[${requestId}] UsageLoggingMiddleware.after: Logging request. Duration: ${durationMs}ms`);

    try {
      await this.usageLogger.logRequest(
        userId,
        providerForLog as string,
        modelForLog,
        endpoint,
        context.requestParams || {note: "No JSON body or params not applicable"},
        res.status,
        responseBodyToLog, 
        errorDetailsToLog,
        durationMs, // Add duration
        requestId // Add requestId
      );
    } catch (error) {
      console.error(`[${requestId}] UsageLoggingMiddleware.after (logRequest) error:`, error.message);
    }
  }
}
