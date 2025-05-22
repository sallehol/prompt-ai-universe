
import { useCallback } from 'react';
import { Session } from '@/types/chat';
import { logger } from '@/utils/logger';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseToggleSaveMessageProps {
  activeSessionId: string | null;
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useToggleSaveMessage = ({
  activeSessionId,
  updateAndPersistSessions,
}: UseToggleSaveMessageProps) => {
  const toggleSaveMessage = useCallback((messageId: string) => {
    if (!activeSessionId) return;
    logger.log(`[useToggleSaveMessage] toggleSaveMessage: messageId=${messageId} in session ${activeSessionId}`);
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

  return { toggleSaveMessage };
};
