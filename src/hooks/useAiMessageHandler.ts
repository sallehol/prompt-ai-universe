
import { useState, useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { ChatService } from '@/services/ChatService';
import type { ApiError } from '@/api/types/apiError';
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig';
import { normalizeApiError } from '@/utils/errorUtils'; // createAuthError is not used here anymore

interface UseAiMessageHandlerProps {
  // getApiKey is no longer needed here if apiKey is passed directly to sendMessageToAi
}

// PLATFORM_MANAGED_PROVIDERS is not used here anymore if apiKey logic is externalized
// const PLATFORM_MANAGED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];

export const useAiMessageHandler = (/* { getApiKey }: UseAiMessageHandlerProps */) => {
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<ApiError | null>(null);
  const chatService = new ChatService(); // chatService instance

  const sendMessageToAi = useCallback(async (
    messages: Message[], 
    modelId: string,
    apiKeyFromManager: string // New argument for the API key
  ) => {
    setIsAiTyping(true);
    setIsError(false);
    setErrorDetails(null);

    try {
      const modelConfig = getModelConfig(modelId); // Still useful for logging provider
      
      logger.log(`[useAiMessageHandler] Sending to ChatService. Model: ${modelId}, Provider: ${modelConfig.provider}, ApiKeyProvided: ${!!apiKeyFromManager}, IsSimulated: ${modelConfig.isSimulated}`);
      
      const aiResponseMessage = await chatService.sendMessage(
        messages,
        modelId,
        apiKeyFromManager // Pass the API key received from the manager
      );
      
      return { success: true, message: aiResponseMessage };

    } catch (err: any) {
      logger.error('[useAiMessageHandler] Error sending message:', err);
      setIsError(true);
      
      const finalErrorDetails = normalizeApiError(err);
      
      // Ensure provider information is attached to the error if not already present
      if (!finalErrorDetails.data?.provider) {
        const modelConfigForError = getModelConfig(modelId);
        finalErrorDetails.data = { ...finalErrorDetails.data, provider: modelConfigForError.provider };
      }
      
      setErrorDetails(finalErrorDetails);
      return { success: false, error: finalErrorDetails };
    } finally {
      setIsAiTyping(false);
    }
  // chatService should be in dependencies if it's not stable, but it's new ChatService()
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, []); // Removed getApiKey from dependencies as it's no longer used here. Added chatService to dependencies.

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
