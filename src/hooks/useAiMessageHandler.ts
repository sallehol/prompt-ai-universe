
import { useState, useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { ChatService } from '@/services/ChatService';
import type { ApiError } from '@/api/types/apiError';
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig';
import { createAuthError, normalizeApiError } from '@/utils/errorUtils';

interface UseAiMessageHandlerProps {
  getApiKey: (provider: string) => string;
}

// List of providers for whom the platform manages API keys via subscriptions
const PLATFORM_MANAGED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];

export const useAiMessageHandler = ({ getApiKey }: UseAiMessageHandlerProps) => {
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<ApiError | null>(null);
  const chatService = new ChatService();

  const sendMessageToAi = useCallback(async (
    messages: Message[], 
    modelId: string
  ) => {
    setIsAiTyping(true);
    setIsError(false);
    setErrorDetails(null);

    let apiKey = ''; // Initialize apiKey

    try {
      const modelConfig = getModelConfig(modelId);
      
      const isPlatformManaged = PLATFORM_MANAGED_PROVIDERS.includes(modelConfig.provider.toLowerCase());

      if (modelConfig.requiresApiKey && !isPlatformManaged) {
        // For non-platform managed models, get key from local storage
        apiKey = getApiKey(modelConfig.provider);
        if (!apiKey) {
          logger.warn(`[useAiMessageHandler] User-provided API key for ${modelConfig.provider} not found.`);
          throw createAuthError(modelConfig.provider);
        }
      } else if (modelConfig.requiresApiKey && isPlatformManaged) {
        // For platform-managed models, apiKey remains empty.
        // The proxy will use the platform's key.
        logger.log(`[useAiMessageHandler] Using platform-managed API key for ${modelConfig.provider}.`);
        apiKey = ''; 
      }
      
      logger.log(`[useAiMessageHandler] Sending to ChatService. Model: ${modelId}, Provider: ${modelConfig.provider}, RequiresKey: ${modelConfig.requiresApiKey}, IsSimulated: ${modelConfig.isSimulated}, IsPlatformManaged: ${isPlatformManaged}`);
      
      const aiResponseMessage = await chatService.sendMessage(
        messages,
        modelId,
        apiKey // Pass the determined apiKey (empty for platform-managed)
      );
      
      return { success: true, message: aiResponseMessage };

    } catch (err: any) {
      logger.error('[useAiMessageHandler] Error sending message:', err);
      setIsError(true);
      
      const finalErrorDetails = normalizeApiError(err);
      
      if (finalErrorDetails.type === 'auth' && !finalErrorDetails.data?.provider) {
        const modelConfig = getModelConfig(modelId);
        finalErrorDetails.data = { ...finalErrorDetails.data, provider: modelConfig.provider };
      }
      
      setErrorDetails(finalErrorDetails);
      return { success: false, error: finalErrorDetails };
    } finally {
      setIsAiTyping(false);
    }
  }, [getApiKey]);

  return {
    isAiTyping,
    isError,
    errorDetails,
    sendMessageToAi,
    resetErrorState: () => {
      setIsError(false);
      setErrorDetails(null);
    }
  };
};

