import { useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import type { ApiError } from '@/api/types/apiError';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseSessionMessageOperationsProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useSessionMessageOperations = ({
  activeSessionId,
  persistedSessions,
  updateAndPersistSessions,
}: UseSessionMessageOperationsProps) => {
  
  const addMessageToSession = useCallback((sessionId: string, message: Message) => {
    updateAndPersistSessions(prevSessions => {
      return prevSessions.map(session => {
        if (session.id === sessionId) {
          logger.log(`[useSessionMessageOperations] addMessageToSession: for session ${session.id}, role: ${message.role}`);
          
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
  
  const addErrorMessageToSession = useCallback((sessionId: string, errorDetails: ApiError) => {
    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === sessionId) {
        const errorMessageContent = errorDetails.message || 'Failed to get response.';
        const errorMessage: Message = createNewMessage(errorMessageContent, 'assistant');
        errorMessage.status = 'error';
        errorMessage.metadata = { 
          error: { 
            type: errorDetails.type, 
            message: errorMessageContent,
            ...(errorDetails.data?.provider && { provider: errorDetails.data.provider }),
            ...(errorDetails.data?.originalError && { originalError: errorDetails.data.originalError }) // Ensure originalError is preserved if present
          } 
        };
        logger.log('[useSessionMessageOperations] Adding error message to session:', errorMessage, 'for sessionID:', sessionId);
        return { ...s, messages: [...s.messages, errorMessage], lastActivityAt: Date.now() };
      }
      return s;
    }));
  }, [updateAndPersistSessions]);
  
  const findLastUserMessageToRetry = useCallback(() => {
    if (!activeSessionId) return null;
    
    const activeSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) return null;
    
    let lastUserMessageContent: string | null = null;
    let lastUserMessage: Message | null = null;
    
    for (let i = activeSession.messages.length - 1; i >= 0; i--) {
      const msg = activeSession.messages[i];
      if (msg.role === 'user') {
        const nextMsg = activeSession.messages[i+1];
        if (!nextMsg || (nextMsg.role === 'assistant' && nextMsg.status === 'error')) {
          lastUserMessage = msg; // Store the whole message
          if(typeof msg.content === 'string') {
            lastUserMessageContent = msg.content;
          } else {
            // For multi-modal content, find the first text block
            const textBlock = msg.content.find(block => block.type === 'text');
            if (textBlock) lastUserMessageContent = textBlock.content;
            // If you need to handle image retries or other types, extend here
          }
          break; 
        }
      }
    }
    
    if (lastUserMessage && lastUserMessageContent !== null) {
      return {
        content: lastUserMessageContent, // The text content to be resent
        fullMessage: lastUserMessage,   // The original Message object
        modelId: activeSession.modelUsed // The model used in the session
      };
    }
    
    return null;
  }, [activeSessionId, persistedSessions]);
  
  const removeErrorMessages = useCallback(() => {
    if (!activeSessionId) return;
    
    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        const updatedMessages = s.messages.filter(msg => !(msg.role === 'assistant' && msg.status === 'error'));
        if (updatedMessages.length < s.messages.length) {
            logger.log(`[useSessionMessageOperations] Removing error messages from session ${s.id}`);
            return {
              ...s,
              messages: updatedMessages,
              lastActivityAt: Date.now(),
            };
        }
      }
      return s;
    }));
  }, [activeSessionId, updateAndPersistSessions]);

  const toggleSaveMessage = useCallback((messageId: string) => {
    if (!activeSessionId) return;
    logger.log(`[useSessionMessageOperations] toggleSaveMessage: messageId=${messageId} in session ${activeSessionId}`);
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
  
  const findMessageToRegenerate = useCallback((messageIdToRegenerate: string) => {
    if (!activeSessionId) return null;
    
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      logger.error(`[useSessionMessageOperations] findMessageToRegenerate: No current session for ${activeSessionId}`);
      return null;
    }
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    
    if (messageIndex === -1 || currentSession.messages[messageIndex].role !== 'assistant' || currentSession.messages[messageIndex].status === 'error') {
      logger.warn(`[useSessionMessageOperations] findMessageToRegenerate: AI message ${messageIdToRegenerate} not found, not AI, or is an error message.`);
      return null;
    }

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].role !== 'user') {
      logger.warn(`[useSessionMessageOperations] findMessageToRegenerate: User prompt for AI message ${messageIdToRegenerate} not found at index ${userPromptMessageIndex}.`);
      return null;
    }
    
    const userPromptMsg = currentSession.messages[userPromptMessageIndex];
    let userPromptContentForResend: Message['content'];

    userPromptContentForResend = userPromptMsg.content;
    
    if (!userPromptContentForResend || (typeof userPromptContentForResend === 'string' && userPromptContentForResend.trim() === "") || (Array.isArray(userPromptContentForResend) && userPromptContentForResend.length === 0) ) {
      logger.warn(`[useSessionMessageOperations] findMessageToRegenerate: User prompt content is empty or invalid.`);
      return null;
    }
    
    const historyForResend = currentSession.messages.slice(0, userPromptMessageIndex + 1);
    
    logger.log(`[useSessionMessageOperations] findMessageToRegenerate: Found user prompt for AI message ${messageIdToRegenerate}. User message index: ${userPromptMessageIndex}. Model: ${currentSession.modelUsed}. History length for resend: ${historyForResend.length}`);

    return { 
      messageToRegenerateId: messageIdToRegenerate,
      userPromptMessage: userPromptMsg,
      historyForResend,
      modelId: currentSession.modelUsed,
      messageIndexOfAiResponse: messageIndex
    };
  }, [activeSessionId, persistedSessions]);
  
  const truncateSessionToMessage = useCallback((messageIndex: number) => {
    if (!activeSessionId) return;
    
    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        logger.log(`[useSessionMessageOperations] Truncating session ${s.id} to message index ${messageIndex}`);
        return {
          ...s,
          messages: s.messages.slice(0, messageIndex), // messageIndex is exclusive for slice, so it keeps up to messageIndex-1
          lastActivityAt: Date.now(),
        };
      }
      return s;
    }));
  }, [activeSessionId, updateAndPersistSessions]);

  return {
    addMessageToSession,
    addErrorMessageToSession,
    findLastUserMessageToRetry,
    removeErrorMessages,
    toggleSaveMessage,
    findMessageToRegenerate,
    truncateSessionToMessage
  };
};
