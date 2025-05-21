// supabase/functions/ai-proxy/core/model-request-processor.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from '../auth.ts'
import { createErrorResponse, ErrorType, handleProviderError } from '../error-utils.ts'
import { getProviderFromModel, ProviderName } from '../providers.ts'
// Import from the new clients directory
import { createProviderClient } from '../clients/index.ts'; 
import { getApiKeyInternal } from '../api-keys.ts'
import { MiddlewareContext } from '../middleware/index.ts';
import { sanitizeProviderParams, processOpenAIStream } from '../utils/text-model-utils.ts';

export async function processModelRequest(
  req: Request,
  requestType: 'text' | 'chat',
  context?: MiddlewareContext // Added context
) {
  let provider: ProviderName | undefined;
  const requestId = context?.requestId || 'NO_REQ_ID_IN_PROCESS_MODEL_REQUEST';

  try {
    const { user, supabaseClient } = context?.user && context?.supabaseClient 
      ? { user: context.user, supabaseClient: context.supabaseClient } 
      : await verifyAuth(req);
    
    const body = context?.requestParams || await req.json();
    // paramsFromRequest alias for clarity, as it contains more than just 'params'
    const { model, provider: explicitProvider, ...paramsFromRequest } = body; 
    
    if (!model || typeof model !== 'string') {
      return createErrorResponse(ErrorType.VALIDATION, 'Model is required and must be a string.', 400)
    }
    
    try {
        provider = getProviderFromModel(model, explicitProvider as string | undefined);
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }
    
    const apiKey = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider)
    
    if (!apiKey) {
      return createErrorResponse(
        ErrorType.AUTHENTICATION,
        `API key for ${provider} is not set or could not be retrieved. Please add your API key in settings.`,
        401,
        provider
      )
    }
    
    const client = createProviderClient(provider, apiKey)
    
    let resultFromClient: any;
    let finalParamsForProvider: Record<string, any>;

    if (requestType === 'text') {
      const { prompt, ...restParams } = paramsFromRequest;
      if (!prompt || typeof prompt !== 'string') {
        return createErrorResponse(ErrorType.VALIDATION, 'Prompt is required for text completion and must be a string.', 400)
      }
      // Sanitize parameters before sending to provider
      finalParamsForProvider = sanitizeProviderParams({ model, prompt, ...restParams, stream: paramsFromRequest.stream }, requestId);
      
      console.log(`[${requestId}] Sending text completion request to ${provider} via model-request-processor. Payload:`, JSON.stringify(finalParamsForProvider));
      resultFromClient = await client.makeTextRequest(finalParamsForProvider);

    } else { // chat
      const { messages, ...restParams } = paramsFromRequest;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return createErrorResponse(ErrorType.VALIDATION, 'Messages are required for chat completion and must be a non-empty array.', 400)
      }
      for (const msg of messages) {
        if (typeof msg !== 'object' || !msg.role || !msg.content || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
          return createErrorResponse(ErrorType.VALIDATION, 'Each message must be an object with "role" and "content" string properties.', 400);
        }
      }
      // Sanitize parameters before sending to provider
      finalParamsForProvider = sanitizeProviderParams({ model, messages, ...restParams, stream: paramsFromRequest.stream }, requestId);

      console.log(`[${requestId}] Sending chat completion request to ${provider} via model-request-processor. Payload:`, JSON.stringify(finalParamsForProvider));
      resultFromClient = await client.makeChatRequest(finalParamsForProvider);
    }
    
    // TODO: Log usage (to be implemented, especially complex for streams)

    if (finalParamsForProvider.stream && resultFromClient instanceof Response) {
      const providerResponse = resultFromClient; // It's the full Response object from the provider
      if (!providerResponse.ok) {
          const errorText = await providerResponse.text().catch(() => `Provider request failed with status ${providerResponse.status}`);
          console.error(`[${requestId}] Streaming provider error for ${provider} (${providerResponse.status}): ${errorText}`);
          try {
            const errorJson = JSON.parse(errorText);
            return handleProviderError(errorJson.error || errorJson , provider as ProviderName);
          } catch (_e) {
             return createErrorResponse(ErrorType.PROVIDER, `Provider error: ${errorText}`, providerResponse.status, provider);
          }
      }

      // Check if the provider is OpenAI, Mistral, or Anthropic (for streaming) to use processOpenAIStream
      if (provider === ProviderName.OPENAI || provider === ProviderName.MISTRAL || (provider === ProviderName.ANTHROPIC && finalParamsForProvider.stream)) {
        const processedStream = await processOpenAIStream(providerResponse);
        return new Response(
          processedStream,
          { headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            } 
          }
        );
      } else {
        // For other streaming providers that might not conform to OpenAI's SSE format, pass raw stream
        console.warn(`[${requestId}] Provider ${provider} is streaming but not explicitly handled by SSE processor. Passing raw stream.`);
        return new Response(
          providerResponse.body,
          { headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/event-stream', 
              'Cache-Control': 'no-cache',
              'Connection': 'keep-alive'
            } 
          }
        );
      }
    } else {
      // Non-streaming response (resultFromClient is JSON data)
      return new Response(
        JSON.stringify(resultFromClient),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

  } catch (error) {
    console.error(`[${requestId}] Error handling ${requestType} completion (provider: ${provider}):`, error.message, error.stack);
    
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    
    if (provider) {
      return handleProviderError(error, provider)
    }
    
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
}
