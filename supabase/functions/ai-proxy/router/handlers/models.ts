
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import {
  handleTextCompletion,
  handleChatCompletion
} from '../../text-models.ts'; // Core logic

export async function handleTextCompletionRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ModelsHandler: Handling text completion`);
  // Original mainRequestHandler had modelType and modelAction derived from path.
  // The route itself specifies this, so the handler is specific.
  // Method check:
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleTextCompletion(req, context);
}

export async function handleChatCompletionRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ModelsHandler: Handling chat completion`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleChatCompletion(req, context);
}
