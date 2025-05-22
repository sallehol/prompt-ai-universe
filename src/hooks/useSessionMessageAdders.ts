
import { useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger';
import type { ApiError } from '@/api/types/apiError';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseSessionMessageAddersProps {
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useSessionMessageAdders = ({
  updateAndPersistSessions,
}: UseSessionMessageAddersProps) => {
  const addMessageToSession = useCallback((sessionId: string, message: Message) => {
    updateAndPersistSessions(prevSessions => {
      return prevSessions.map(session => {
        if (session.id === sessionId) {
          logger.log(`[useSessionMessageAdders] addMessageToSession: for session ${session.id}, role: ${message.role}`);
          
          let newName = session.name;
          if (message.role === 'user' && (session.name === 'New Chat' || session.messages.filter(m => m.role === 'user').length === 0)) {
            const contentText = typeof message.content === 'string' ? message.content : 
                              (message.content[0] && message.content[0].type === 'text' ? (message.content[0] as { type: 'text', content: string }).content : 'New Chat');
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
            ...(errorDetails.data?.originalError && { originalError: errorDetails.data.originalError })
          } 
        };
        logger.log('[useSessionMessageAdders] Adding error message to session:', errorMessage, 'for sessionID:', sessionId);
        return { ...s, messages: [...s.messages, errorMessage], lastActivityAt: Date.now() };
      }
      return s;
    }));
  }, [updateAndPersistSessions]);

  return {
    addMessageToSession,
    addErrorMessageToSession,
  };
};
