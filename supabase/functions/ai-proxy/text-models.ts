// supabase/functions/ai-proxy/text-models.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from './auth.ts'
import { createErrorResponse, ErrorType, handleProviderError } from './error-utils.ts'
import { getProviderFromModel, ProviderName } from './providers.ts'
import { createProviderClient } from './provider-clients.ts'
import { getApiKeyInternal } from './api-keys.ts'
import { MiddlewareContext } from './middleware/index.ts'; // Ensure this import is correct

// New sanitization function
function sanitizeProviderParams(params: Record<string, any>, requestId?: string): Record<string, any> {
  // Create a new object to avoid modifying the original
  const sanitizedParams = { ...params };
  
  // Remove cache parameter in any case variation
  const cacheKeys = Object.keys(sanitizedParams).filter(key => 
    key.toLowerCase() === 'cache'
  );
  
  if (cacheKeys.length > 0) {
    for (const key of cacheKeys) {
      delete sanitizedParams[key];
    }
    console.log(`[${requestId || 'NO_REQ_ID'}] FINAL SANITIZATION (text-models): Removed cache parameter(s) from provider payload. Original keys: ${cacheKeys.join(', ')}`);
  }
  
  // Log the final payload for debugging
  // console.log(`[${requestId || 'NO_REQ_ID'}] FINAL PAYLOAD to ${params.model} (text-models):`, JSON.stringify(sanitizedParams));
  
  return sanitizedParams;
}

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
                controller.enqueue(encoder.encode(line + '\n'));
              } catch (e) {
                console.error('Error parsing JSON from stream line:', jsonStr, e);
              }
            } else if (line.trim()) {
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
  requestType: 'text' | 'chat',
  context?: MiddlewareContext // Added context
) {
  let provider: ProviderName | undefined;
  const requestId = context?.requestId || 'NO_REQ_ID_IN_PROCESS_MODEL_REQUEST';

  try {
    // If context is not passed, it implies an internal call or a path where auth might not have run.
    // For direct calls (like from tests or older entry points not using middleware chain),
    // we might need to re-verify auth or ensure context is always provided.
    // For now, assuming verifyAuth handles req correctly if context is missing.
    const { user, supabaseClient } = context?.user && context?.supabaseClient 
      ? { user: context.user, supabaseClient: context.supabaseClient } 
      : await verifyAuth(req);
    
    // Use context.requestParams if available and parsed by middleware, otherwise parse body.
    // This avoids re-parsing if RequestOptimizationMiddleware has already done it.
    const body = context?.requestParams || await req.json();
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
      
      console.log(`[${requestId}] Sending text completion request to ${provider} via text-models.ts. Payload:`, JSON.stringify(finalParamsForProvider));
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

      console.log(`[${requestId}] Sending chat completion request to ${provider} via text-models.ts. Payload:`, JSON.stringify(finalParamsForProvider));
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

export async function handleTextCompletion(req: Request, context?: MiddlewareContext) {
  return processModelRequest(req, 'text', context);
}

export async function handleChatCompletion(req: Request, context?: MiddlewareContext) {
  return processModelRequest(req, 'chat', context);
}
