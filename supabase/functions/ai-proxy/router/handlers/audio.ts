
import { MiddlewareContext } from '../../middleware/index.ts';
import { createErrorResponse, ErrorType } from '../../error-utils.ts';
import {
  handleTextToSpeech,
  handleSpeechToText,
} from '../../multimodal-endpoints.ts'; // Core logic

export async function handleTextToSpeechRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.AudioHandler: Handling text-to-speech`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleTextToSpeech(req, context);
}

export async function handleSpeechToTextRequest(req: Request, context: MiddlewareContext): Promise<Response> {
  const { requestId } = context;
  console.log(`[${requestId}] Router.AudioHandler: Handling speech-to-text (transcription)`);
  if (req.method !== 'POST') {
    return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
  }
  return await handleSpeechToText(req, context);
}
