import { useCallback, useMemo } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import { useApiKeys } from './useApiKeys';
import { useAiMessageHandler } from './useAiMessageHandler';
import { useSessionMessageOperations } from './useSessionMessageOperations';
import { getModelConfig } from '@/config/modelConfig';
import { createAuthError, createApiError, normalizeApiError } from '@/utils/errorUtils'; // Added createApiError & normalizeApiError

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseMessageManagerProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
  updateAndPersistSessions: UpdateSessionsFn;
}

const PLATFORM_MANAGED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];

export const useMessageManager = ({
  activeSessionId,
  persistedSessions,
  updateAndPersistSessions,
}: UseMessageManagerProps) => {
  const { getApiKey, isApiKeysLoaded } = useApiKeys();
  
  const { 
    isAiTyping, 
    isError, 
    errorDetails, 
    sendMessageToAi,
    resetErrorState
  } = useAiMessageHandler(); 
  
  const {
    addMessageToSession,
    addErrorMessageToSession,
    findLastUserMessageToRetry,
    removeErrorMessages,
    toggleSaveMessage,
    findMessageToRegenerate,
    truncateSessionToMessage
  } = useSessionMessageOperations({
    activeSessionId,
    persistedSessions,
    updateAndPersistSessions
  });

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSessionId || text.trim() === '' || !isApiKeysLoaded) {
      if (!isApiKeysLoaded) logger.warn('[useMessageManager] API keys not loaded yet, aborting send.');
      return;
    }

    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      logger.error(`[useMessageManager] handleSendMessage: No current session found for activeSessionId: ${activeSessionId}`);
      return;
    }
    
    const userMessage = createNewMessage(text, 'user');
    addMessageToSession(activeSessionId, userMessage);
    resetErrorState();

    const modelConfig = getModelConfig(currentSession.modelUsed);
    const isPlatformManaged = PLATFORM_MANAGED_PROVIDERS.includes(modelConfig.provider.toLowerCase());
    let apiKey = '';

    if (modelConfig.requiresApiKey && !isPlatformManaged) {
      apiKey = getApiKey(modelConfig.provider);
      if (!apiKey) {
        logger.warn(`[useMessageManager] User-provided API key for ${modelConfig.provider} not found.`);
        const authError = createAuthError(modelConfig.provider);
        addErrorMessageToSession(activeSessionId, authError);
        const simulatedMessage = createNewMessage(
          `[Simulated response] API key for ${modelConfig.displayName} is missing. Please configure it in settings. This is a simulated response.`,
          'assistant'
        );
        simulatedMessage.metadata = { model: currentSession.modelUsed, provider: modelConfig.provider, simulated: true };
        addMessageToSession(activeSessionId, simulatedMessage);
        return;
      }
    } else if (modelConfig.requiresApiKey && isPlatformManaged) {
      apiKey = ''; 
    }
    
    const result = await sendMessageToAi(
      currentSession.messages, 
      currentSession.modelUsed,
      apiKey // Pass the determined apiKey
    );

    if (result.success && result.message) {
      addMessageToSession(activeSessionId, result.message);
    } else if (!result.success && result.error) {
      addErrorMessageToSession(activeSessionId, result.error);
      logger.log(`[useMessageManager] AI call failed. Adding simulated response. Error:`, result.error.message);
      const simulatedMessageContent = `[Simulated response] I'm sorry, but I couldn't connect to the AI service (${modelConfig.displayName}). This is a simulated response. Reason: ${result.error.message}`;
      const simulatedMessage = createNewMessage(simulatedMessageContent, 'assistant');
      simulatedMessage.metadata = { model: currentSession.modelUsed, provider: modelConfig.provider, simulated: true, error: { type: result.error.type, message: result.error.message } };
      addMessageToSession(activeSessionId, simulatedMessage);
    }
  }, [
    activeSessionId, 
    persistedSessions, 
    isApiKeysLoaded, 
    addMessageToSession,
    sendMessageToAi,
    resetErrorState,
    addErrorMessageToSession,
    getApiKey // Added getApiKey
  ]);

  const retryLastMessage = useCallback(() => {
    const userMessageData = findLastUserMessageToRetry();
      
    if (userMessageData && userMessageData.content) { // Check userMessageData.content
      logger.log(`[useMessageManager] Retrying last user message: "${userMessageData.content.substring(0,30)}..."`); // Use .content
      resetErrorState();
      removeErrorMessages();
      handleSendMessage(userMessageData.content); // Pass .content
    } else {
      logger.warn('[useMessageManager] retryLastMessage: No suitable user message found to retry or content is missing.');
    }
  }, [findLastUserMessageToRetry, resetErrorState, removeErrorMessages, handleSendMessage]);

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
    
    logger.log(`[useMessageManager] regenerateResponse: For prompt "${userPromptText.substring(0,30)}..." using model ${modelConfig.displayName} (${modelConfig.provider})`);
    
    truncateSessionToMessage(messageIndexOfAiResponse); 
    resetErrorState();
    
    const isPlatformManaged = PLATFORM_MANAGED_PROVIDERS.includes(modelConfig.provider.toLowerCase());
    let apiKeyForRegen = ''; // Changed from apiKey to apiKeyForRegen to avoid conflict
    if (modelConfig.requiresApiKey && !isPlatformManaged) {
      apiKeyForRegen = getApiKey(modelConfig.provider);
      if (!apiKeyForRegen) {
        logger.warn(`[useMessageManager] regenerateResponse: API key for ${modelConfig.provider} not found.`);
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
      apiKeyForRegen // Pass apiKeyForRegen
    );

    if (result.success && result.message) {
      addMessageToSession(activeSessionId, result.message);
      logger.log(`[useMessageManager] regenerateResponse: AI response regenerated successfully.`);
    } else if (!result.success && result.error) {
      addErrorMessageToSession(activeSessionId, result.error);
      logger.log(`[useMessageManager] regenerateResponse: AI call failed. Adding simulated response. Error:`, result.error.message);
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
    getApiKey, // Added getApiKey
    addErrorMessageToSession
  ]);

  return {
    isAiTyping,
    isError,
    errorDetails,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
    retryLastMessage,
  };
};
