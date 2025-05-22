
import { useCallback } from 'react';
import { Session } from '@/types/chat';
import { logger } from '@/utils/logger';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseSessionMessageCleanersProps {
  activeSessionId: string | null;
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useSessionMessageCleaners = ({
  activeSessionId,
  updateAndPersistSessions,
}: UseSessionMessageCleanersProps) => {
  const removeErrorMessages = useCallback(() => {
    if (!activeSessionId) return;
    
    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        const updatedMessages = s.messages.filter(msg => !(msg.role === 'assistant' && msg.status === 'error'));
        if (updatedMessages.length < s.messages.length) {
            logger.log(`[useSessionMessageCleaners] Removing error messages from session ${s.id}`);
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

  const truncateSessionToMessage = useCallback((messageIndex: number) => {
    if (!activeSessionId) return;
    
    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        logger.log(`[useSessionMessageCleaners] Truncating session ${s.id} to message index ${messageIndex}`);
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
    removeErrorMessages,
    truncateSessionToMessage,
  };
};
