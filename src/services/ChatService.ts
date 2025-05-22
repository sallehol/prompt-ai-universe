
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig'; // Import the new config utility

// List of providers for whom the platform manages API keys via subscriptions
// This should be consistent with useAiMessageHandler.ts
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
    _messages: Message[], // Current conversation history
    model: string, // This is the modelId
    _apiKey: string // API key, may or may not be used depending on modelConfig
  ): Promise<Message> { // Should return the AI's response as a Message object
    logger.log(`[ChatService] sendMessage called with model: ${model}, apiKey provided: ${!!_apiKey}`);
    
    const modelConfig = getModelConfig(model);
    const isPlatformManaged = PLATFORM_MANAGED_PROVIDERS.includes(modelConfig.provider.toLowerCase());

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate different responses based on model or for testing
    if (model === 'error_model_test') {
      throw {
        type: 'server',
        message: 'Simulated server error from the API.',
        status: 500,
      };
    }
    if (model === 'auth_error_test') {
        throw {
          type: 'auth',
          message: 'Simulated authentication error: Invalid API Key.',
          status: 401,
          data: { provider: 'test_auth_provider' } // Example provider for test auth error
        };
    }

    let aiResponseText = `Simulated response from ${modelConfig.displayName} (${modelConfig.provider}) to user.`;
    
    // This error condition should only apply if:
    // 1. The model requires an API key.
    // 2. It's NOT a platform-managed provider (meaning the user should provide the key).
    // 3. No API key was actually provided by the user.
    // 4. It's not an explicitly simulated or unknown provider (which might have different key handling).
    if (modelConfig.requiresApiKey && !isPlatformManaged && !_apiKey && modelConfig.provider !== 'simulated' && modelConfig.provider !== 'unknown_provider') {
        logger.error(`[ChatService] sendMessage called for model ${model} which requires a user-provided API key, but none was provided or it's invalid.`);
        aiResponseText = `Error: API key for ${modelConfig.provider} is required but not provided/invalid. (Simulated error message from ChatService for user-provided key)`;
         return {
          id: Date.now().toString() + '_ai_error',
          role: 'assistant',
          content: aiResponseText,
          timestamp: Date.now(),
          isSaved: false,
          status: 'error',
          metadata: {
            model: model,
            provider: modelConfig.provider,
            error: { type: 'auth', message: aiResponseText }
          },
        };
    }
    
    // If the execution reaches here, it's either:
    // - A model that doesn't require a key.
    // - A platform-managed model (where an empty _apiKey is fine for the frontend).
    // - A user-managed model where the key was provided.
    // - A simulated/unknown provider.
    // In all these cases (for the simulator), we proceed to give a simulated success response.
    
    logger.log(`[ChatService] Simulation successful for model ${model}. isPlatformManaged: ${isPlatformManaged}`);

    return {
      id: Date.now().toString() + '_ai',
      role: 'assistant',
      content: aiResponseText,
      timestamp: Date.now(),
      isSaved: false,
      status: 'complete',
      metadata: {
        model: model,
        provider: modelConfig.provider, // Use provider from config
        usage: { // Simulated usage
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      },
    };
  }
}
