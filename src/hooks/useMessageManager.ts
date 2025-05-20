import { useState, useCallback, useMemo } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import { useApiKeys } from './useApiKeys';
import { ChatService, getProviderFromModel } from '@/services/ChatService';
import { ApiError } from '@/api/clients/base.client';

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
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [isError, setIsError] = useState<boolean>(false);
  const [errorDetails, setErrorDetails] = useState<ApiError | null>(null);

  const chatService = useMemo(() => new ChatService(), []);
  const { getApiKey, isApiKeysLoaded } = useApiKeys();

  const addMessageToSessionInternal = useCallback((sessionId: string, message: Message) => {
    updateAndPersistSessions(prevSessions => {
      return prevSessions.map(session => {
        if (session.id === sessionId) {
          logger.log(`[useMessageManager] addMessageToSession: for session ${session.id}, role: ${message.role}`);
          
          let newName = session.name;
          if (message.role === 'user' && (session.name === 'New Chat' || session.messages.filter(m => m.role === 'user').length === 0)) {
            const contentText = typeof message.content === 'string' ? message.content : 
                                (message.content[0] && message.content[0].type === 'text' ? message.content[0].content : 'New Chat');
            newName = contentText.substring(0, 30) + (contentText.length > 30 ? '...' : '');
          }

          return {
            ...session,
            messages: [...session.messages, message],
            lastActivityAt: Date.now(),
            name: newName,
          };
        }
        return session;
      });
    });
  }, [updateAndPersistSessions]);

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
    addMessageToSessionInternal(activeSessionId, userMessage);

    setIsAiTyping(true);
    setIsError(false);
    setErrorDetails(null);

    try {
      const modelForResponse = currentSession.modelUsed;
      const provider = getProviderFromModel(modelForResponse);
      const apiKey = getApiKey(provider);

      if (!apiKey && provider !== 'unknown_provider') {
        logger.error(`[useMessageManager] API key for ${provider} is not set.`);
        const authError: ApiError = {
          type: 'auth',
          message: `API key for ${provider} is not set. Please add your API key in settings.`,
          status: 401,
        };
        throw authError;
      }
      
      logger.log(`[useMessageManager] Sending to ChatService. Model: ${modelForResponse}, Provider: ${provider}`);
      const aiResponseMessage = await chatService.sendMessage(
        currentSession.messages,
        modelForResponse,
        apiKey
      );
      
      addMessageToSessionInternal(activeSessionId, aiResponseMessage);

    } catch (err: any) {
      logger.error('[useMessageManager] Error sending message:', err);
      setIsError(true);
      const caughtError = err as ApiError;
      setErrorDetails({
        type: caughtError.type || 'unknown',
        message: caughtError.message || 'An unknown error occurred while contacting the AI.',
        status: caughtError.status || 0,
        data: caughtError.data
      });
      updateAndPersistSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId) {
          const errorMessage: Message = createNewMessage(
            `Error: ${err.message || 'Failed to get response.'}`, 
            'assistant'
          );
          errorMessage.status = 'error';
          errorMessage.metadata = { 
              error: { type: err.type || 'unknown', message: err.message || 'Failed to get response.'} 
          };
          return { ...s, messages: [...s.messages, errorMessage] };
        }
        return s;
      }));
    } finally {
      setIsAiTyping(false);
    }
  }, [activeSessionId, persistedSessions, addMessageToSessionInternal, chatService, getApiKey, isApiKeysLoaded, updateAndPersistSessions]);

  const retryLastMessage = useCallback(() => {
    if (!activeSessionId) return;
    const activeSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) return;
    
    let lastUserMessageContent: string | null = null;
    for (let i = activeSession.messages.length - 1; i >= 0; i--) {
        const msg = activeSession.messages[i];
        if (msg.role === 'user') {
            const nextMsg = activeSession.messages[i+1];
            if (!nextMsg || (nextMsg.role === 'assistant' && nextMsg.status === 'error')) {
                 if(typeof msg.content === 'string') {
                    lastUserMessageContent = msg.content;
                 } else {
                    const textBlock = msg.content.find(block => block.type === 'text');
                    if (textBlock) lastUserMessageContent = textBlock.content;
                 }
                 break;
            }
        }
    }
      
    if (lastUserMessageContent) {
      logger.log(`[useMessageManager] Retrying last user message: "${lastUserMessageContent.substring(0,30)}..."`);
      setIsError(false);
      setErrorDetails(null);
      updateAndPersistSessions(prevSessions => prevSessions.map(s => {
        if (s.id === activeSessionId) {
          return {
            ...s,
            messages: s.messages.filter(msg => !(msg.role === 'assistant' && msg.status === 'error')),
          };
        }
        return s;
      }));
      handleSendMessage(lastUserMessageContent);
    } else {
      logger.warn('[useMessageManager] retryLastMessage: No suitable user message found to retry.');
    }
  }, [activeSessionId, persistedSessions, handleSendMessage, updateAndPersistSessions]);

  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    if (!activeSessionId) return;
    
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      logger.error(`[useMessageManager] regenerateResponse: No current session for ${activeSessionId}`);
      return;
    }
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    if (messageIndex === -1 || currentSession.messages[messageIndex].role !== 'assistant') {
      logger.warn(`[useMessageManager] regenerateResponse: AI message ${messageIdToRegenerate} not found or not AI.`);
      return;
    }

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].role !== 'user') {
      logger.warn(`[useMessageManager] regenerateResponse: User prompt for ${messageIdToRegenerate} not found.`);
      return;
    }
    
    const userPromptMsg = currentSession.messages[userPromptMessageIndex];
    const userPromptText = typeof userPromptMsg.content === 'string' ? userPromptMsg.content : 
                           (userPromptMsg.content[0] && userPromptMsg.content[0].type === 'text' ? userPromptMsg.content[0].content : '');

    if (!userPromptText) {
        logger.warn(`[useMessageManager] regenerateResponse: User prompt content is empty.`);
        return;
    }
    
    const modelForRegeneration = currentSession.modelUsed; 
    logger.log(`[useMessageManager] regenerateResponse: For prompt "${userPromptText.substring(0,30)}..." using model ${modelForRegeneration}`);

    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.slice(0, messageIndex),
          lastActivityAt: Date.now(),
        };
      }
      return s;
    }));
    
    setIsAiTyping(true);
    setIsError(false);
    setErrorDetails(null);

    setTimeout(() => {
      const regeneratedResponseText = `(Regenerated) New response from ${modelForRegeneration} to: "${userPromptText}"`;
      const regeneratedMsg = createNewMessage(regeneratedResponseText, 'assistant');
      regeneratedMsg.metadata = { model: modelForRegeneration, provider: getProviderFromModel(modelForRegeneration) };
      addMessageToSessionInternal(activeSessionId, regeneratedMsg);
      setIsAiTyping(false);
      logger.log(`[useMessageManager] regenerateResponse: AI response regenerated (simulated).`);
    }, 1500);
  }, [activeSessionId, persistedSessions, addMessageToSessionInternal, updateAndPersistSessions, setIsAiTyping]);

  const toggleSaveMessage = useCallback((messageId: string) => {
    if (!activeSessionId) return;
     logger.log(`[useMessageManager] toggleSaveMessage: messageId=${messageId} in session ${activeSessionId}`);
     updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.map(msg => msg.id === messageId ? {...msg, isSaved: !msg.isSaved} : msg),
          lastActivityAt: Date.now()
        };
      }
      return s;
    }));
  }, [activeSessionId, updateAndPersistSessions]);

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
