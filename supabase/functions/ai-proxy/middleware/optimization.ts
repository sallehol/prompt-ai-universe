
// supabase/functions/ai-proxy/middleware/optimization.ts
import { Middleware, MiddlewareContext } from './index.ts';

export class RequestOptimizationMiddleware implements Middleware {
  async before(req: Request, context: MiddlewareContext): Promise<Request | void> {
    const { requestId } = context;
    // console.log(`[${requestId}] RequestOptimizationMiddleware.before: Processing request`);
    
    if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
      const contentType = req.headers.get('content-type');
      if (contentType && contentType.toLowerCase().includes('application/json')) {
        try {
          if (!context.requestParams) { // Only parse if not already parsed
            const clonedReq = req.clone(); // Clone to read body without consuming original
            const body = await clonedReq.json();
            context.requestParams = body; // Store parsed body in context
            // console.log(`[${requestId}] RequestOptimizationMiddleware: Parsed and cached request body in context.requestParams`);
          }
        } catch (e) {
          // If JSON parsing fails, it might be an invalid JSON or not JSON at all.
          // Don't throw; let subsequent middleware or handler decide.
          // Log a warning. The request will proceed with an unparsed body.
          console.warn(`[${requestId}] RequestOptimizationMiddleware: Error parsing request body as JSON: ${e.message}. Request will proceed, but context.requestParams will not be set by this middleware.`);
          // Potentially return a 400 error here if JSON is strictly required.
          // For now, let it pass. Caching/ProviderDetection might fail if they expect requestParams.
        }
      }
    }
  }
}
