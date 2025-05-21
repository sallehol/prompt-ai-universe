
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
// Functions from text-models.ts now expect context as the second argument
import {
  handleTextCompletion,
  handleChatCompletion
} from '../../text-models.ts';

export async function handleTextCompletionRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ModelsHandler: Handling text completion request`);

  // Final safety check to remove any cache parameter before sending to provider (already present from previous step)
  // This check happens before calling the potentially modified text-models.ts functions
  if (context.requestParams) {
    const paramsToCheck = Object.keys(context.requestParams);
    let paramsChanged = false;
    
    const newParams = { ...context.requestParams };
    for (const key of paramsToCheck) {
      if (key.toLowerCase() === 'cache') {
        delete newParams[key];
        paramsChanged = true;
        console.log(`[${requestId}] Handler safety check (TextCompletionRequest): Removed '${key}' parameter`);
      }
    }
    
    if (paramsChanged) {
      context.requestParams = newParams;
      console.log(`[${requestId}] Handler safety check (TextCompletionRequest): Updated request params:`, JSON.stringify(context.requestParams));
    }
  }

  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  // Pass context to handleTextCompletion
  return await handleTextCompletion(req, context);
}

export async function handleChatCompletionRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.ModelsHandler: Handling chat completion request`);

  // Final safety check to remove any cache parameter before sending to provider (already present from previous step)
  if (context.requestParams) {
    const paramsToCheck = Object.keys(context.requestParams);
    let paramsChanged = false;
    
    const newParams = { ...context.requestParams }; // Create a mutable copy
    for (const key of paramsToCheck) {
      if (key.toLowerCase() === 'cache') {
        delete newParams[key];
        paramsChanged = true;
        console.log(`[${requestId}] Handler safety check (ChatCompletionRequest): Removed '${key}' parameter`);
      }
    }
    
    if (paramsChanged) {
      context.requestParams = newParams; // Update context with the modified params
      console.log(`[${requestId}] Handler safety check (ChatCompletionRequest): Updated request params:`, JSON.stringify(context.requestParams));
    }
  }

  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  // Pass context to handleChatCompletion
  return await handleChatCompletion(req, context);
}

