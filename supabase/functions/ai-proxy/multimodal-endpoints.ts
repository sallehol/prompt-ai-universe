// supabase/functions/ai-proxy/multimodal-endpoints.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from './auth.ts'
import { createErrorResponse, ErrorType, handleProviderError } from './error-utils.ts'
import { getProviderFromModel } from './providers/model-mapping.ts'
import { ProviderName } from './providers/types.ts'
import { getApiKeyInternal } from './core/api-keys/get-key-internal.ts'
import { createImageProviderClient } from './image-clients.ts'
import { createVideoProviderClient } from './video-clients.ts'
import { createAudioProviderClient } from './audio-clients.ts'

// Helper to extract all params from FormData if needed for some providers
async function extractOtherParamsFromFormData(formData: FormData, excludeKeys: string[]): Promise<Record<string, any>> {
    const params: Record<string, any> = {};
    for (const [key, value] of formData.entries()) {
        if (!excludeKeys.includes(key) && typeof value === 'string') {
            try { // Attempt to parse JSON for structured params, otherwise keep as string
                params[key] = JSON.parse(value);
            } catch (e) {
                params[key] = value;
            }
        }
    }
    return params;
}


// Handle image generation requests
export async function handleImageGeneration(req: Request) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req)
    const { model, prompt, provider: explicitProvider, ...params } = await req.json()
    
    if (!model || typeof model !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Model is required and must be a string.', 400)
    if (!prompt || typeof prompt !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Prompt is required and must be a string.', 400)
    
    try {
        provider = getProviderFromModel(model, explicitProvider as string | undefined);
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }

    const apiKeyResult = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider);
    if (!apiKeyResult) return createErrorResponse(ErrorType.AUTHENTICATION, `API key for ${provider} not set or retrievable.`, 401, provider);
    const apiKey = apiKeyResult;

    const client = createImageProviderClient(provider, apiKey);
    const responsePayload = await client.generateImage({ model, prompt, ...params });
    
    return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Error in handleImageGeneration (provider: ${provider}):`, error.message, error.stack);
    if (error.message === 'Unauthorized') return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    if (provider) return handleProviderError(error, provider);
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}

// Handle image editing requests
export async function handleImageEdit(req: Request) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req);
    const formData = await req.formData();
    
    const model = formData.get('model') as string;
    const prompt = formData.get('prompt') as string;
    const image = formData.get('image') as File;
    const mask = formData.get('mask') as File | null;
    const explicitProvider = formData.get('provider') as string | undefined;

    if (!model || typeof model !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Model (form field) is required and must be a string.', 400);
    if (!prompt || typeof prompt !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Prompt (form field) is required.', 400);
    if (!image) return createErrorResponse(ErrorType.VALIDATION, 'Image (form field) is required.', 400);

    try {
        provider = getProviderFromModel(model, explicitProvider);
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }

    const apiKeyResult = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider);
    if (!apiKeyResult) return createErrorResponse(ErrorType.AUTHENTICATION, `API key for ${provider} not set or retrievable.`, 401, provider);
    const apiKey = apiKeyResult;

    const client = createImageProviderClient(provider, apiKey);
    if (!client.editImage) return createErrorResponse(ErrorType.VALIDATION, `Provider ${provider} does not support image editing.`, 400, provider);

    const otherParams = await extractOtherParamsFromFormData(formData, ['model', 'prompt', 'image', 'mask', 'provider']);

    const responsePayload = await client.editImage({ model, prompt, image, mask, ...otherParams });
    
    return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Error in handleImageEdit (provider: ${provider}):`, error.message, error.stack);
    if (error.message === 'Unauthorized') return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    if (provider) return handleProviderError(error, provider);
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}

// Handle image variation requests
export async function handleImageVariation(req: Request) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req);
    const formData = await req.formData();

    const model = formData.get('model') as string;
    const image = formData.get('image') as File;
    const explicitProvider = formData.get('provider') as string | undefined;


    if (!model || typeof model !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Model (form field) is required.', 400);
    if (!image) return createErrorResponse(ErrorType.VALIDATION, 'Image (form field) is required for variations.', 400);
    
    try {
        provider = getProviderFromModel(model, explicitProvider || ProviderName.OPENAI); 
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }

    const apiKeyResult = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider);
    if (!apiKeyResult) return createErrorResponse(ErrorType.AUTHENTICATION, `API key for ${provider} not set or retrievable.`, 401, provider);
    const apiKey = apiKeyResult;

    const client = createImageProviderClient(provider, apiKey);
    if (!client.createVariation) return createErrorResponse(ErrorType.VALIDATION, `Provider ${provider} does not support image variations.`, 400, provider);
    
    const otherParams = await extractOtherParamsFromFormData(formData, ['model', 'image', 'provider']);

    const responsePayload = await client.createVariation({ model, image, ...otherParams });

    return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Error in handleImageVariation (provider: ${provider}):`, error.message, error.stack);
    if (error.message === 'Unauthorized') return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    if (provider) return handleProviderError(error, provider);
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}


// Handle video generation requests
export async function handleVideoGeneration(req: Request) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req)
    const { model, prompt, provider: explicitProvider, ...params } = await req.json()

    if (!model || typeof model !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Model is required and must be a string.', 400)
    if (!prompt || typeof prompt !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Prompt is required and must be a string.', 400)

    try {
        provider = getProviderFromModel(model, explicitProvider as string | undefined);
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }
    
    const apiKeyResult = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider);
    if (!apiKeyResult) return createErrorResponse(ErrorType.AUTHENTICATION, `API key for ${provider} not set or retrievable.`, 401, provider);
    const apiKey = apiKeyResult;
    
    const client = createVideoProviderClient(provider, apiKey);
    const responsePayload = await client.generateVideo({ model, prompt, ...params });

    return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Error in handleVideoGeneration (provider: ${provider}):`, error.message, error.stack);
    if (error.message === 'Unauthorized') return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    if (provider) return handleProviderError(error, provider);
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}

// Handle text-to-speech requests
export async function handleTextToSpeech(req: Request) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req)
    const { model, input, provider: explicitProvider, ...params } = await req.json()

    if (!model || typeof model !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Model is required and must be a string.', 400)
    if (!input || typeof input !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Input text is required and must be a string.', 400)

    try {
        provider = getProviderFromModel(model, explicitProvider as string | undefined);
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }

    const apiKeyResult = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider);
    if (!apiKeyResult) return createErrorResponse(ErrorType.AUTHENTICATION, `API key for ${provider} not set or retrievable.`, 401, provider);
    const apiKey = apiKeyResult;

    const client = createAudioProviderClient(provider, apiKey);
    if (!client.generateSpeech) return createErrorResponse(ErrorType.VALIDATION, `Provider ${provider} does not support text-to-speech.`, 400, provider);

    const responsePayload = await client.generateSpeech({ model, input, ...params });
    
    return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Error in handleTextToSpeech (provider: ${provider}):`, error.message, error.stack);
    if (error.message === 'Unauthorized') return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    if (provider) return handleProviderError(error, provider);
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}

// Handle speech-to-text requests
export async function handleSpeechToText(req: Request) {
  let provider: ProviderName | undefined;
  try {
    const { user, supabaseClient } = await verifyAuth(req);
    const formData = await req.formData();

    const model = formData.get('model') as string;
    const audio = formData.get('audio') as File;
    const explicitProvider = formData.get('provider') as string | undefined;

    if (!model || typeof model !== 'string') return createErrorResponse(ErrorType.VALIDATION, 'Model (form field) is required.', 400);
    if (!audio) return createErrorResponse(ErrorType.VALIDATION, 'Audio file (form field) is required.', 400);

    try {
        provider = getProviderFromModel(model, explicitProvider);
    } catch (error) {
        return createErrorResponse(ErrorType.VALIDATION, `Provider detection failed: ${error.message}`, 400);
    }
    
    const apiKeyResult = await getApiKeyInternal(supabaseClient as SupabaseClient, user.id, provider);
    if (!apiKeyResult) return createErrorResponse(ErrorType.AUTHENTICATION, `API key for ${provider} not set or retrievable.`, 401, provider);
    const apiKey = apiKeyResult;

    const client = createAudioProviderClient(provider, apiKey);
    if (!client.transcribeSpeech) return createErrorResponse(ErrorType.VALIDATION, `Provider ${provider} does not support speech-to-text.`, 400, provider);

    const otherParams = await extractOtherParamsFromFormData(formData, ['model', 'audio', 'provider']);

    const responsePayload = await client.transcribeSpeech({ model, audio, ...otherParams });

    return new Response(JSON.stringify(responsePayload), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error(`Error in handleSpeechToText (provider: ${provider}):`, error.message, error.stack);
    if (error.message === 'Unauthorized') return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401);
    if (provider) return handleProviderError(error, provider);
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500);
  }
}
