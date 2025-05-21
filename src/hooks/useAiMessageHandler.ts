import { useState, useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { ChatService } from '@/services/ChatService';
import type { ApiError } from '@/api/types/apiError'; // Updated import
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig';
import { createAuthError, normalizeApiError } from '@/utils/errorUtils';

interface UseAiMessageHandlerProps {
  getApiKey: (provider: string) => string;
}

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

    try {
      const modelConfig = getModelConfig(modelId);
      let apiKey = '';

      if (modelConfig.requiresApiKey) {
        apiKey = getApiKey(modelConfig.provider);
        if (!apiKey) {
          throw createAuthError(modelConfig.provider);
        }
      }
      
      logger.log(`[useAiMessageHandler] Sending to ChatService. Model: ${modelId}, Provider: ${modelConfig.provider}, RequiresKey: ${modelConfig.requiresApiKey}, IsSimulated: ${modelConfig.isSimulated}`);
      
      const aiResponseMessage = await chatService.sendMessage(
        messages,
        modelId,
        apiKey
      );
      
      return { success: true, message: aiResponseMessage };

    } catch (err: any) {
      logger.error('[useAiMessageHandler] Error sending message:', err);
      setIsError(true);
      
      const finalErrorDetails = normalizeApiError(err);
      
      // Add provider to error if missing but we can infer it
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
