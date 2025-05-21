
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import {
  handleTextCompletion,
  handleChatCompletion
} from '../../text-models.ts'; // Core logic

export async function handleTextCompletionRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context; // Use context.requestId
  console.log(`[${requestId}] Router.ModelsHandler: Handling text completion`);

  // Final safety check to remove any cache parameter before sending to provider
  if (context.requestParams) {
    const paramsToCheck = Object.keys(context.requestParams);
    let paramsChanged = false;
    
    const newParams = { ...context.requestParams }; // Create a mutable copy
    for (const key of paramsToCheck) {
      if (key.toLowerCase() === 'cache') {
        delete newParams[key];
        paramsChanged = true;
        console.log(`[${requestId}] Handler safety check (TextCompletion): Removed '${key}' parameter`);
      }
    }
    
    if (paramsChanged) {
      context.requestParams = newParams; // Update context with the modified params
      console.log(`[${requestId}] Handler safety check (TextCompletion): Updated request params:`, JSON.stringify(context.requestParams));
    }
  }

  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleTextCompletion(req, context);
}

export async function handleChatCompletionRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context; // Use context.requestId
  console.log(`[${requestId}] Router.ModelsHandler: Handling chat completion`);

  // Final safety check to remove any cache parameter before sending to provider
  if (context.requestParams) {
    const paramsToCheck = Object.keys(context.requestParams);
    let paramsChanged = false;
    
    const newParams = { ...context.requestParams }; // Create a mutable copy
    for (const key of paramsToCheck) {
      if (key.toLowerCase() === 'cache') {
        delete newParams[key];
        paramsChanged = true;
        console.log(`[${requestId}] Handler safety check (ChatCompletion): Removed '${key}' parameter`);
      }
    }
    
    if (paramsChanged) {
      context.requestParams = newParams; // Update context with the modified params
      console.log(`[${requestId}] Handler safety check (ChatCompletion): Updated request params:`, JSON.stringify(context.requestParams));
    }
  }

  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleChatCompletion(req, context);
}

