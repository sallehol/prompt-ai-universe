
// supabase/functions/ai-proxy/text-models.ts
import { MiddlewareContext } from './middleware/index.ts';
import { processModelRequest } from './core/model-request-processor.ts';

// This file is now much simpler, acting as an entry point for text and chat completions.
// The core logic has been moved to './core/model-request-processor.ts'
// and utility functions to './utils/text-model-utils.ts'.

export async function handleTextCompletion(req: Request, context?: MiddlewareContext) {
  // The context parameter is passed down from the router handler (models.ts)
  // and then to processModelRequest.
  return processModelRequest(req, 'text', context);
}

export async function handleChatCompletion(req: Request, context?: MiddlewareContext) {
  // The context parameter is passed down from the router handler (models.ts)
  // and then to processModelRequest.
  return processModelRequest(req, 'chat', context);
}

