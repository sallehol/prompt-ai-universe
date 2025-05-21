// supabase/functions/ai-proxy/text-models.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from './auth.ts'
import { createErrorResponse, ErrorType, handleProviderError } from './error-utils.ts'
import { getProviderFromModel, ProviderName } from './providers.ts'
import { createProviderClient } from './provider-clients.ts'
import { getApiKeyInternal } from './api-keys.ts'

// Helper function to process OpenAI-style SSE streams
async function processOpenAIStream(response: Response): Promise<ReadableStream<Uint8Array>> {
  if (!response.body) {
    throw new Error("Response body is null for streaming.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim(); // Remove "data: " prefix and trim
              
              if (jsonStr === '[DONE]') {
                // OpenAI specific: forward the [DONE] marker as is, then close.
                controller.enqueue(encoder.encode(line + '\n'));
                controller.close();
                return;
              }
              
              try {
                // We don't strictly need to parse and re-stringify if we're just forwarding.
                // Forwarding the raw line ensures maximum compatibility with what client expects.
                // const jsonData = JSON.parse(jsonStr); 
                // const processedData = JSON.stringify(jsonData) + '\n';
                // controller.enqueue(encoder.encode(processedData));
                controller.enqueue(encoder.encode(line + '\n'));

              } catch (e) {
                console.error('Error parsing JSON from stream line:', jsonStr, e);
                // Optionally forward the problematic line or an error event
                // For now, log and skip.
              }
            } else if (line.trim()) {
                // Forward other non-empty lines as well (e.g. ping events or comments if any)
                controller.enqueue(encoder.encode(line + '\n'));
            }
          }
        }
        controller.close();
      } catch (e) {
        console.error('Error in processOpenAIStream:', e);
        controller.error(e);
      }
    }
  });
}


async function processModelRequest(
  req: Request,
  requestType: 'text' | 'chat'
) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req)
    
    const body = await req.json()
    const { model, provider: explicitProvider, ...params } = body 
    
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

    if (requestType === 'text') {
      const { prompt, ...restParams } = params;
      if (!prompt || typeof prompt !== 'string') {
        return createErrorResponse(ErrorType.VALIDATION, 'Prompt is required for text completion and must be a string.', 400)
      }
      resultFromClient = await client.makeTextRequest({ model, prompt, ...restParams, stream: params.stream })
    } else { // chat
      const { messages, ...restParams } = params;
      if (!messages || !Array.isArray(messages) || messages.length === 0) {
        return createErrorResponse(ErrorType.VALIDATION, 'Messages are required for chat completion and must be a non-empty array.', 400)
      }
      for (const msg of messages) {
        if (typeof msg !== 'object' || !msg.role || !msg.content || typeof msg.role !== 'string' || typeof msg.content !== 'string') {
          return createErrorResponse(ErrorType.VALIDATION, 'Each message must be an object with "role" and "content" string properties.', 400);
        }
      }
      resultFromClient = await client.makeChatRequest({ model, messages, ...restParams, stream: params.stream })
    }
    
    // TODO: Log usage (to be implemented, especially complex for streams)

    if (params.stream && resultFromClient instanceof Response) {
      const providerResponse = resultFromClient; // It's the full Response object from the provider
      if (!providerResponse.ok) {
          // Errors from providers should ideally be caught within the provider client itself.
          // If an error response is streamed, it's tricky. Assume error responses are not streamed or are handled by client.
          const errorText = await providerResponse.text().catch(() => `Provider request failed with status ${providerResponse.status}`);
          console.error(`Streaming provider error for ${provider} (${providerResponse.status}): ${errorText}`);
          // Try to parse as JSON, otherwise return text
          try {
            const errorJson = JSON.parse(errorText);
            return handleProviderError(errorJson.error || errorJson , provider as ProviderName);
          } catch (_e) {
             return createErrorResponse(ErrorType.PROVIDER, `Provider error: ${errorText}`, providerResponse.status, provider);
          }
      }

      // Use processOpenAIStream if the provider is OpenAI or Mistral (which mimics OpenAI SSE)
      // For Anthropic, if its client returns a raw stream, it might need its own processor or client-side handling.
      // For now, assume processOpenAIStream is suitable for OpenAI/Mistral.
      if (provider === ProviderName.OPENAI || provider === ProviderName.MISTRAL || (provider === ProviderName.ANTHROPIC && params.stream)) { // Crude check for Anthropic stream
        const processedStream = await processOpenAIStream(providerResponse);
        return new Response(
          processedStream,
          { headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/event-stream',
              'Cache-Control': 'no-cache', // Important for streams
              'Connection': 'keep-alive'    // Important for streams
            } 
          }
        );
      } else {
        // For other providers or if processOpenAIStream is not suitable, pass raw body.
        // This branch might be hit if AnthropicClient returns a stream not intended for processOpenAIStream.
        // Or if a new provider is added.
        console.warn(`Provider ${provider} is streaming but not explicitly handled by SSE processor. Passing raw stream.`);
        return new Response(
          providerResponse.body, // Pass the raw stream body
          { headers: { 
              ...corsHeaders, 
              'Content-Type': 'text/event-stream', // Assuming it's SSE
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
    console.error(`Error handling ${requestType} completion (provider: ${provider}):`, error.message, error.stack);
    
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    
    if (provider) {
      return handleProviderError(error, provider)
    }
    
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
}

export async function handleTextCompletion(req: Request) {
  return processModelRequest(req, 'text');
}

export async function handleChatCompletion(req: Request) {
  return processModelRequest(req, 'chat');
}
