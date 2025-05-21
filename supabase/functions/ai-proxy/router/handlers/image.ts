
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import {
  handleImageGeneration,
  handleImageEdit,
  handleImageVariation,
} from '../../multimodal-endpoints.ts'; // Core logic

export async function handleImageGenerationRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ImageHandler: Handling image generation`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleImageGeneration(req, context);
}

export async function handleImageEditRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ImageHandler: Handling image edit`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleImageEdit(req, context);
}

export async function handleImageVariationRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ImageHandler: Handling image variation`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleImageVariation(req, context);
}
