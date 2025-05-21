
import { useCallback, useMemo } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import { useApiKeys } from './useApiKeys';
import { useAiMessageHandler } from './useAiMessageHandler';
import { useSessionMessageOperations } from './useSessionMessageOperations';
import { getModelConfig } from '@/config/modelConfig';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseMessageManagerProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
  updateAndPersistSessions: UpdateSessionsFn;
}

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
  } = useAiMessageHandler({ getApiKey });
  
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

    const result = await sendMessageToAi(
      currentSession.messages,
      currentSession.modelUsed
    );

    if (result.success && result.message) {
      addMessageToSession(activeSessionId, result.message);
    } else if (!result.success && result.error) {
      addErrorMessageToSession(activeSessionId, result.error);
    }
  }, [
    activeSessionId, 
    persistedSessions, 
    isApiKeysLoaded, 
    addMessageToSession,
    sendMessageToAi,
    resetErrorState,
    addErrorMessageToSession
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
    
    // Destructure based on the updated findMessageToRegenerate return type
    const { userPromptMessage, modelId, messageIndexOfAiResponse } = messageData; 
    
    let userPromptText = "";
    if (typeof userPromptMessage.content === 'string') {
      userPromptText = userPromptMessage.content;
    } else if (Array.isArray(userPromptMessage.content) && userPromptMessage.content.length > 0 && userPromptMessage.content[0].type === 'text') {
      userPromptText = userPromptMessage.content[0].content;
    }
    
    const modelConfig = getModelConfig(modelId);
    
    logger.log(`[useMessageManager] regenerateResponse: For prompt "${userPromptText.substring(0,30)}..." using model ${modelConfig.displayName} (${modelConfig.provider})`);
    
    // Use messageIndexOfAiResponse for truncation
    truncateSessionToMessage(messageIndexOfAiResponse); 
    resetErrorState();
    
    // Simulate regeneration (Original logic)
    // In a real scenario, you would call sendMessageToAi here with userPromptMessage and history
    // For example:
    // const result = await sendMessageToAi(messageData.historyForResend, modelId);
    // if (result.success && result.message) { ... } else if ...
    
    setTimeout(() => {
      const regeneratedResponseText = `(Regenerated) New response from ${modelConfig.displayName} to: "${userPromptText}"`;
      const regeneratedMsg = createNewMessage(regeneratedResponseText, 'assistant');
      regeneratedMsg.metadata = { model: modelId, provider: modelConfig.provider };
      addMessageToSession(activeSessionId, regeneratedMsg);
      logger.log(`[useMessageManager] regenerateResponse: AI response regenerated (simulated).`);
    }, 1500);
  }, [
    activeSessionId,
    findMessageToRegenerate,
    truncateSessionToMessage,
    resetErrorState,
    addMessageToSession
    // sendMessageToAi // Would be needed for real regeneration
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

