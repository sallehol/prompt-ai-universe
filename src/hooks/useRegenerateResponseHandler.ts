
import { useCallback } from 'react';
import { Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig';
import { createAuthError } from '@/utils/errorUtils';
import type { ApiError } from '@/api/types/apiError';

const PLATFORM_MANAGED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];

interface UseRegenerateResponseHandlerProps {
  activeSessionId: string | null;
  getApiKey: (provider: string) => string;
  sendMessageToAi: (
    messages: Message[],
    modelId: string,
    apiKey: string
  ) => Promise<{ success: boolean; message?: Message; error?: ApiError }>;
  addMessageToSession: (sessionId: string, message: Message) => void;
  addErrorMessageToSession: (sessionId: string, error: ApiError) => void;
  resetErrorState: () => void;
  findMessageToRegenerate: (messageIdToRegenerate: string) => {
    userPromptMessage: Message;
    modelId: string;
    messageIndexOfAiResponse: number;
    historyForResend: Message[];
  } | null;
  truncateSessionToMessage: (messageIndex: number) => void;
}

export const useRegenerateResponseHandler = ({
  activeSessionId,
  getApiKey,
  sendMessageToAi,
  addMessageToSession,
  addErrorMessageToSession,
  resetErrorState,
  findMessageToRegenerate,
  truncateSessionToMessage,
}: UseRegenerateResponseHandlerProps) => {
  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    const messageData = findMessageToRegenerate(messageIdToRegenerate);
    if (!messageData || !activeSessionId) return;
    
    const { userPromptMessage, modelId, messageIndexOfAiResponse, historyForResend } = messageData; 
    
    let userPromptText = "";
    if (typeof userPromptMessage.content === 'string') {
      userPromptText = userPromptMessage.content;
    } else if (Array.isArray(userPromptMessage.content) && userPromptMessage.content.length > 0 && typeof userPromptMessage.content[0] === 'string') {
      userPromptText = userPromptMessage.content[0];
    } else if (Array.isArray(userPromptMessage.content) && userPromptMessage.content.length > 0 && userPromptMessage.content[0].type === 'text') {
      userPromptText = (userPromptMessage.content[0] as { type: 'text', content: string }).content;
    }
    
    const modelConfig = getModelConfig(modelId);
    
    logger.log(`[useRegenerateResponseHandler] regenerateResponse: For prompt "${userPromptText.substring(0,30)}..." using model ${modelConfig.displayName} (${modelConfig.provider})`);
    
    truncateSessionToMessage(messageIndexOfAiResponse); 
    resetErrorState();
    
    const isPlatformManaged = PLATFORM_MANAGED_PROVIDERS.includes(modelConfig.provider.toLowerCase());
    let apiKeyForRegen = '';
    if (modelConfig.requiresApiKey && !isPlatformManaged) {
      apiKeyForRegen = getApiKey(modelConfig.provider);
      if (!apiKeyForRegen) {
        logger.warn(`[useRegenerateResponseHandler] regenerateResponse: API key for ${modelConfig.provider} not found.`);
        const authError = createAuthError(modelConfig.provider);
        addErrorMessageToSession(activeSessionId, authError);
        const simulatedMessage = createNewMessage(
          `[Simulated response] API key for ${modelConfig.displayName} is missing for regeneration. Please configure it in settings.`,
          'assistant'
        );
        simulatedMessage.metadata = { model: modelId, provider: modelConfig.provider, simulated: true };
        addMessageToSession(activeSessionId, simulatedMessage);
        return;
      }
    } else if (modelConfig.requiresApiKey && isPlatformManaged) {
      apiKeyForRegen = '';
    }

    const result = await sendMessageToAi(
      historyForResend, 
      modelId, 
      apiKeyForRegen
    );

    if (result.success && result.message) {
      addMessageToSession(activeSessionId, result.message);
      logger.log(`[useRegenerateResponseHandler] regenerateResponse: AI response regenerated successfully.`);
    } else if (!result.success && result.error) {
      addErrorMessageToSession(activeSessionId, result.error);
      logger.log(`[useRegenerateResponseHandler] regenerateResponse: AI call failed. Adding simulated response. Error:`, result.error.message);
      const simulatedMessageContent = `[Simulated response] I'm sorry, but I couldn't regenerate the response from ${modelConfig.displayName}. Reason: ${result.error.message}`;
      const simulatedMessage = createNewMessage(simulatedMessageContent, 'assistant');
      simulatedMessage.metadata = { model: modelId, provider: modelConfig.provider, simulated: true, error: { type: result.error.type, message: result.error.message } };
      addMessageToSession(activeSessionId, simulatedMessage);
    }
  }, [
    activeSessionId,
    findMessageToRegenerate,
    truncateSessionToMessage,
    resetErrorState,
    addMessageToSession,
    sendMessageToAi,
    getApiKey,
    addErrorMessageToSession
  ]);

  return { regenerateResponse };
};
