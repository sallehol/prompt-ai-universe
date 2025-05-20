
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/chat';

interface UseActiveSessionManagerProps {
  persistedSessions: Session[];
  isLoadingSessions: boolean;
  initializeDefaultSessionIfNeeded: () => string | null;
}

export const useActiveSessionManager = ({
  persistedSessions,
  isLoadingSessions,
  initializeDefaultSessionIfNeeded,
}: UseActiveSessionManagerProps) => {
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoadingSessions) {
      if (persistedSessions.length > 0) {
        // If there's an activeSessionId already, check if it's still valid
        const currentActiveIsValid = persistedSessions.some(s => s.id === activeSessionId);
        if (!currentActiveIsValid || !activeSessionId) {
          const sortedSessions = [...persistedSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedSessions[0].id);
          console.log(`[useActiveSessionManager] useEffect (sessions loaded): Set activeSessionId to ${sortedSessions[0].id} from ${persistedSessions.length} sessions.`);
        }
      } else {
        const newSessionId = initializeDefaultSessionIfNeeded();
        if (newSessionId) {
          setActiveSessionId(newSessionId);
          console.log(`[useActiveSessionManager] useEffect (sessions loaded): Initialized and set activeSessionId to ${newSessionId}.`);
        } else {
           console.log(`[useActiveSessionManager] useEffect (sessions loaded): No persisted sessions and no new session initialized.`);
        }
      }
    }
  }, [persistedSessions, isLoadingSessions, initializeDefaultSessionIfNeeded, activeSessionId]);

  const switchSession = useCallback((sessionId: string) => {
    console.log(`[useActiveSessionManager] switchSession: to ${sessionId}`);
    setActiveSessionId(sessionId);
  }, []);

  return {
    activeSessionId,
    setActiveSessionId, // Needed by useSessionMutations for delete logic
    switchSession,
  };
};

