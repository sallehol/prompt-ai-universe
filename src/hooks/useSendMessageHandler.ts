
import { useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import { getModelConfig } from '@/config/modelConfig';
import { createAuthError } from '@/utils/errorUtils';
import type { ApiError } from '@/api/types/apiError';

const PLATFORM_MANAGED_PROVIDERS = ['openai', 'anthropic', 'google', 'mistral'];

interface UseSendMessageHandlerProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
  isApiKeysLoaded: boolean;
  getApiKey: (provider: string) => string;
  sendMessageToAi: (
    messages: Message[],
    modelId: string,
    apiKey: string
  ) => Promise<{ success: boolean; message?: Message; error?: ApiError }>;
  addMessageToSession: (sessionId: string, message: Message) => void;
  addErrorMessageToSession: (sessionId: string, error: ApiError) => void;
  resetErrorState: () => void;
}

export const useSendMessageHandler = ({
  activeSessionId,
  persistedSessions,
  isApiKeysLoaded,
  getApiKey,
  sendMessageToAi,
  addMessageToSession,
  addErrorMessageToSession,
  resetErrorState,
}: UseSendMessageHandlerProps) => {
  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSessionId || text.trim() === '' || !isApiKeysLoaded) {
      if (!isApiKeysLoaded) logger.warn('[useSendMessageHandler] API keys not loaded yet, aborting send.');
      return;
    }

    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      logger.error(`[useSendMessageHandler] handleSendMessage: No current session found for activeSessionId: ${activeSessionId}`);
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
        logger.warn(`[useSendMessageHandler] User-provided API key for ${modelConfig.provider} not found.`);
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
      apiKey
    );

    if (result.success && result.message) {
      addMessageToSession(activeSessionId, result.message);
    } else if (!result.success && result.error) {
      addErrorMessageToSession(activeSessionId, result.error);
      logger.log(`[useSendMessageHandler] AI call failed. Adding simulated response. Error:`, result.error.message);
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
    getApiKey
  ]);

  return { handleSendMessage };
};
