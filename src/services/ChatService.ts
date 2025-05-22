
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';
import { getModelConfig, ModelConfig } from '@/config/modelConfig';
import { supabase } from '@/lib/supabaseClient';
import { createAuthError } from '@/utils/errorUtils';

// List of providers for whom the platform manages API keys via subscriptions
const PLATFORM_MANAGED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];

// Updated getProviderFromModel function
export const getProviderFromModel = (modelId: string): string => {
  const config = getModelConfig(modelId);
  if (config.provider === 'unknown_provider' && !config.isSimulated) {
    // Log only if it's an unknown provider that's NOT explicitly simulated by default config
    logger.warn(`[ChatService] Unknown provider for model: ${modelId} based on modelConfig. Defaulting to '${config.provider}'. Display Name: ${config.displayName}`);
  }
  return config.provider;
};

// Placeholder ChatService class
export class ChatService {
  constructor() {
    logger.log('[ChatService] Initialized');
  }

  async sendMessage(
    messages: Message[],
    model: string,
    apiKeyFromMessageHandler: string
  ): Promise<Message> {
    logger.log(`[ChatService] sendMessage called with model: ${model}, apiKeyProvidedToService: ${!!apiKeyFromMessageHandler}`);
    
    const modelConfig = getModelConfig(model);

    // Handle specific test models first
    if (model === 'error_model_test') {
      logger.warn(`[ChatService] Triggering simulated server error for model: ${model}`);
      throw {
        type: 'server',
        message: 'Simulated server error from the API.',
        status: 500,
      };
    }
    if (model === 'auth_error_test') {
      logger.warn(`[ChatService] Triggering simulated auth error for model: ${model}`);
        throw {
          type: 'auth',
          message: 'Simulated authentication error: Invalid API Key.',
          status: 401,
          data: { provider: 'test_auth_provider' }
        };
    }

    // If the model is configured to be explicitly simulated (e.g., 'simulated-echo-model')
    if (modelConfig.isSimulated) {
      logger.log(`[ChatService] Using EXPLICITLY SIMULATED response for model: ${model}`);
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate delay
      const simulatedResponseText = `Simulated response from ${modelConfig.displayName} (${modelConfig.provider}) because modelConfig.isSimulated is true.`;
      return {
        id: Date.now().toString() + '_ai_simulated',
        role: 'assistant',
        content: simulatedResponseText,
        timestamp: Date.now(),
        isSaved: false,
        status: 'complete',
        metadata: { model: model, provider: modelConfig.provider },
      };
    }

    // --- Attempt REAL API call via proxy ---
    logger.log(`[ChatService] Attempting REAL API call via proxy for model: ${model}`);

    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !session?.access_token) {
        logger.error('[ChatService] No active session or token for proxy call.', sessionError);
        throw createAuthError({ 
            provider: modelConfig.provider, 
            message: 'Authentication token is missing or invalid. Please log in again.' 
        });
    }
    const accessToken = session.access_token;

    const isPlatformManaged = PLATFORM_MANAGED_PROVIDERS.includes(modelConfig.provider.toLowerCase());

    // Check for required user-provided API key if not platform managed
    if (modelConfig.requiresApiKey && !isPlatformManaged && !apiKeyFromMessageHandler) {
        logger.error(`[ChatService] User-managed API key required for ${modelConfig.provider} but not provided.`);
        throw createAuthError({
            provider: modelConfig.provider,
            message: `API key for ${modelConfig.provider} is required but not provided/invalid.`
        });
    }
    
    const proxyUrl = new URL('/api/ai-proxy/v1/chat/completions', window.location.origin).toString();
    
    const requestBody = {
        model: model, // The modelId
        messages: messages,
    };

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
    };

    if (modelConfig.requiresApiKey && !isPlatformManaged && apiKeyFromMessageHandler) {
        headers['X-API-Key'] = apiKeyFromMessageHandler;
        logger.log(`[ChatService] Forwarding user-provided API key in X-API-Key header for ${modelConfig.provider}`);
    } else if (isPlatformManaged) {
        logger.log(`[ChatService] Using platform-managed API key for ${modelConfig.provider} via proxy.`);
    }

    try {
        const response = await fetch(proxyUrl, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify(requestBody),
        });

        const responseBody = await response.text(); // Read body once

        if (!response.ok) {
            let errorData;
            try {
                errorData = JSON.parse(responseBody);
            } catch (e) {
                errorData = { error: { message: responseBody || response.statusText } };
            }
            logger.error(`[ChatService] Proxy call failed for model ${model}: ${response.status}`, errorData);
            throw {
                type: errorData.error?.type || 'api_error', // More specific than 'server' if possible
                message: errorData.error?.message || `AI service request failed: ${response.statusText}`,
                status: response.status,
                data: errorData.error?.data || { provider: modelConfig.provider, errorCode: errorData.error?.errorCode }
            };
        }

        const result = JSON.parse(responseBody);
        
        let aiContent = "Error: Could not parse AI response content.";
        let usageData;
        let responseId = Date.now().toString() + '_ai';

        // Standardized extraction based on common provider patterns
        // The proxy should ideally standardize this further, but this is a client-side attempt.
        if (result.choices && result.choices[0] && result.choices[0].message && typeof result.choices[0].message.content === 'string') { // OpenAI, Mistral
            aiContent = result.choices[0].message.content;
            usageData = result.usage;
            if(result.id) responseId = result.id;
        } else if (result.content && Array.isArray(result.content) && result.content[0]?.type === 'text' && typeof result.content[0].text === 'string') { // Anthropic
            aiContent = result.content[0].text;
            usageData = result.usage; // Anthropic specific usage structure
            if(result.id) responseId = result.id;
        } else if (result.candidates && result.candidates[0]?.content?.parts && Array.isArray(result.candidates[0].content.parts)) { // Google
            aiContent = result.candidates[0].content.parts.map((p: any) => p.text || '').join("");
            // Google usage is often separate or needs specific calculation. Placeholder:
            // usageData = result.usageMetadata || { promptTokenCount: 0, candidatesTokenCount: 0 };
            if(result.id) responseId = result.id; // Google often doesn't return a top-level ID in this way
        } else {
            logger.warn(`[ChatService] Unhandled or unexpected response structure from provider ${modelConfig.provider}:`, result);
            // Fallback attempts
            if (typeof result.text === 'string') aiContent = result.text;
            else if (typeof result.completion === 'string') aiContent = result.completion;
            else if (typeof result.content === 'string') aiContent = result.content; // Generic content field
        }
        
        logger.log(`[ChatService] Real API call successful for model ${model}. Provider: ${modelConfig.provider}`);

        return {
            id: responseId,
            role: 'assistant',
            content: aiContent,
            timestamp: Date.now(),
            isSaved: false,
            status: 'complete',
            metadata: {
                model: model,
                provider: modelConfig.provider,
                usage: usageData,
            },
        };

    } catch (error: any) {
        logger.error(`[ChatService] Error during real API call processing for model ${model}:`, error);
        if (error.type && error.message) { // If it's already one of our structured errors
            throw error;
        }
        throw { // Wrap unexpected errors
            type: 'server',
            message: error.message || 'Failed to communicate with AI service due to an unexpected error.',
            status: error.status || 500,
            data: { provider: modelConfig.provider }
        };
    }
  }
}

