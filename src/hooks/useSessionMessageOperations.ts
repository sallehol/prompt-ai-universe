import { useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import type { ApiError } from '@/api/types';

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
            ...(errorDetails.data?.provider && { provider: errorDetails.data.provider })
          } 
        };
        return { ...s, messages: [...s.messages, errorMessage] };
      }
      return s;
    }));
  }, [updateAndPersistSessions]);
  
  const findLastUserMessageToRetry = useCallback(() => {
    if (!activeSessionId) return null;
    
    const activeSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) return null;
    
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
    
    return lastUserMessageContent;
  }, [activeSessionId, persistedSessions]);
  
  const removeErrorMessages = useCallback(() => {
    if (!activeSessionId) return;
    
    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.filter(msg => !(msg.role === 'assistant' && msg.status === 'error')),
        };
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
    if (messageIndex === -1 || currentSession.messages[messageIndex].role !== 'assistant') {
      logger.warn(`[useSessionMessageOperations] findMessageToRegenerate: AI message ${messageIdToRegenerate} not found or not AI.`);
      return null;
    }

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].role !== 'user') {
      logger.warn(`[useSessionMessageOperations] findMessageToRegenerate: User prompt for ${messageIdToRegenerate} not found.`);
      return null;
    }
    
    const userPromptMsg = currentSession.messages[userPromptMessageIndex];
    const userPromptText = typeof userPromptMsg.content === 'string' ? userPromptMsg.content : 
                          (userPromptMsg.content[0] && userPromptMsg.content[0].type === 'text' ? userPromptMsg.content[0].content : '');

    if (!userPromptText) {
      logger.warn(`[useSessionMessageOperations] findMessageToRegenerate: User prompt content is empty.`);
      return null;
    }
    
    return { 
      messageIndex,
      userPromptText,
      modelId: currentSession.modelUsed
    };
  }, [activeSessionId, persistedSessions]);
  
  const truncateSessionToMessage = useCallback((messageIndex: number) => {
    if (!activeSessionId) return;
    
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
