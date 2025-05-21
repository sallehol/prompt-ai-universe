
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import {
  handleVideoGeneration,
} from '../../multimodal-endpoints.ts'; // Core logic

export async function handleVideoGenerationRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.VideoHandler: Handling video generation`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleVideoGeneration(req, context);
}
