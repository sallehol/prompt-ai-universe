
// supabase/functions/ai-proxy/middleware/provider-detection.ts
import { Middleware, MiddlewareContext } from './index.ts';
import { getProviderFromModel, ProviderName } from '../providers.ts';

export class ProviderDetectionMiddleware implements Middleware {
  async before(req: Request, context: MiddlewareContext): Promise<void> {
    const { requestId } = context;
    // RequestOptimizationMiddleware should have parsed JSON body for POST requests.
    // This middleware relies on context.requestParams being populated.
    if (req.method === 'POST' && context.requestParams) {
        const body = context.requestParams;
        let provider: ProviderName | string | undefined;

        if (body.model) {
          provider = getProviderFromModel(body.model, body.provider);
        } else if (body.provider) {
          provider = body.provider;
        }

        if (provider) {
          context.provider = provider;
          console.log(`[${requestId}] ProviderDetectionMiddleware: Set context.provider to '${provider}'`);
        } else {
          // console.log(`[${requestId}] ProviderDetectionMiddleware: Could not determine provider from request body.`);
        }
    } else if (req.method === 'POST' && !context.requestParams) {
        // console.warn(`[${requestId}] ProviderDetectionMiddleware: POST request but no pre-parsed context.requestParams. Body might not be JSON or optimization middleware didn't run/parse.`);
    }
  }
}
