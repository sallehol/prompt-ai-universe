
// supabase/functions/ai-proxy/middleware/logging.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { Middleware, MiddlewareContext } from './index.ts';
import { Database } from '../../_shared/database.types.ts';
import { recordUsage } from '../core/api-key-manager.ts'; // New import
import { extractTokenUsage } from '../utils/text-model-utils.ts';

export class UsageLoggingMiddleware implements Middleware {
  private supabaseClient: SupabaseClient<Database>;

  constructor(supabaseClient: SupabaseClient) {
    this.supabaseClient = supabaseClient as SupabaseClient<Database>;
  }

  async before(req: Request, context: MiddlewareContext): Promise<Request | Response | null> {
    // console.log(`[${context.requestId}] UsageLoggingMiddleware: Before - Path: ${context.requestPath}`);
    return null; // No action before, but could initialize timers or grab initial state
  }

  async after(response: Response, context: MiddlewareContext): Promise<Response> {
    // console.log(`[${context.requestId}] UsageLoggingMiddleware: After - Path: ${context.requestPath}, Status: ${response.status}`);
    
    if (!context.user || !context.provider || !context.model || !context.allParamsFromRequest || !context.subscriptionId || !context.requestType) {
      // console.warn(`[${context.requestId}] UsageLoggingMiddleware: Missing context for usage logging. Skipping.`);
      return response;
    }

    let responseBodyClone = null;
    let responseBodyForLogging = {}; // Default to empty object
    let inputTokens = 0;
    let outputTokens = 0;

    // Only attempt to parse JSON if it's likely a JSON response and successful
    const contentType = response.headers.get('content-type');
    if (response.ok && contentType && contentType.includes('application/json')) {
      try {
        responseBodyClone = response.clone(); // Clone for logging, original response stream is consumed once
        responseBodyForLogging = await responseBodyClone.json();

        // Extract token usage from response body (specific to provider/model structure)
        const usage = extractTokenUsage(responseBodyForLogging, context.provider);
        inputTokens = usage.inputTokens;
        outputTokens = usage.outputTokens;

      } catch (e) {
        console.error(`[${context.requestId}] UsageLoggingMiddleware: Error parsing response JSON for logging:`, e.message);
        // responseBodyForLogging remains {}
      }
    } else if (!response.ok) {
        // console.log(`[${context.requestId}] UsageLoggingMiddleware: Response not OK or not JSON, basic logging.`);
    }


    try {
      // Use the new recordUsage function
      await recordUsage(
        this.supabaseClient,
        context.user.id,
        context.subscriptionId, // Comes from context, set by model-request-processor
        context.requestType,    // Comes from context, set by model-request-processor
        context.provider,
        context.model,
        inputTokens,
        outputTokens
      );
      // console.log(`[${context.requestId}] Usage recorded successfully for ${context.provider}:${context.model}.`);
    } catch (dbError) {
      console.error(`[${context.requestId}] UsageLoggingMiddleware: Database error recording usage:`, dbError.message, dbError.stack);
    }
    
    // Return the original response, not the clone used for logging
    return response;
  }
}

