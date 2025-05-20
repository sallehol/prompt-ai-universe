
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

  // This effect runs when sessions are loaded or changed, ensuring we have an active session
  useEffect(() => {
    if (!isLoadingSessions) {
      console.log(`[useActiveSessionManager] useEffect running with ${persistedSessions.length} sessions, activeSessionId: ${activeSessionId}`);
      
      if (persistedSessions.length > 0) {
        // If there's an activeSessionId already, check if it's still valid
        const currentActiveIsValid = persistedSessions.some(s => s.id === activeSessionId);
        
        if (!currentActiveIsValid || !activeSessionId) {
          // Sort by most recent activity and set the most recent as active
          const sortedSessions = [...persistedSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedSessions[0].id);
          console.log(`[useActiveSessionManager] Setting activeSessionId to most recent: ${sortedSessions[0].id}`);
        } else {
          console.log(`[useActiveSessionManager] Keeping current activeSessionId: ${activeSessionId}`);
        }
      } else {
        // No sessions exist, create a default one
        const newSessionId = initializeDefaultSessionIfNeeded();
        if (newSessionId) {
          setActiveSessionId(newSessionId);
          console.log(`[useActiveSessionManager] Creating default session with ID: ${newSessionId}`);
        } else {
           console.log(`[useActiveSessionManager] No sessions available and couldn't create default.`);
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
