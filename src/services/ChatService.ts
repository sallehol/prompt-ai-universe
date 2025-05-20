
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig'; // Import the new config utility

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
    logger.log(`[ChatService] sendMessage called with model: ${model}`);
    
    const modelConfig = getModelConfig(model);

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Simulate different responses based on model or for testing
    // These specific test models can remain if they serve a purpose beyond general simulation
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

    // If the model is configured to be simulated, ensure we provide a simulated response.
    // The default behavior is already simulation, so this mainly affects logging.
    let aiResponseText = `Simulated response from ${modelConfig.displayName} (${modelConfig.provider}) to user.`;
    if (modelConfig.requiresApiKey && !_apiKey && modelConfig.provider !== 'simulated' && modelConfig.provider !== 'unknown_provider') {
        // This case should ideally be caught by useMessageManager before calling sendMessage
        // But as a safeguard in ChatService:
        logger.error(`[ChatService] sendMessage called for model ${model} which requires an API key, but none was provided or it's invalid.`);
        aiResponseText = `Error: API key for ${modelConfig.provider} is required but not provided/invalid. (Simulated error message from ChatService)`;
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

