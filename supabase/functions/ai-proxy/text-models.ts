
// supabase/functions/ai-proxy/text-models.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from './auth.ts'
import { createErrorResponse, ErrorType, handleProviderError } from './error-utils.ts'
import { getProviderFromModel, ProviderName } from './providers.ts'
import { createProviderClient } from './provider-clients.ts'
import { getApiKeyInternal } from './api-keys.ts'

async function processModelRequest(
  req: Request,
  requestType: 'text' | 'chat'
) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req)
    
    const body = await req.json()
    const { model, provider: explicitProvider, ...params } = body // Extract explicitProvider
    
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
    let responsePayload;

    if (requestType === 'text') {
      const { prompt, ...restParams } = params;
      if (!prompt || typeof prompt !== 'string') {
        return createErrorResponse(ErrorType.VALIDATION, 'Prompt is required for text completion and must be a string.', 400)
      }
      responsePayload = await client.makeTextRequest({ model, prompt, ...restParams })
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
      responsePayload = await client.makeChatRequest({ model, messages, ...restParams })
    }
    
    // TODO: Log usage (to be implemented)
    
    return new Response(
      JSON.stringify(responsePayload),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
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

