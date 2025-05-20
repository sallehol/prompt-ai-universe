
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/chat';
import { createInitialSession } from '@/lib/chatUtils';

const LOCAL_STORAGE_KEY = 'chatSessions_v1';

export const useSessionPersistence = (initialModel: string = 'gpt-4o-mini') => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    setIsLoading(true);
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as Session[];
        parsedSessions.forEach(session => {
          session.messages = session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp) // Ensure Date objects
          }));
        });
        setSessions(parsedSessions);
      } else {
        // No stored sessions, create one if needed (or handle as per existing logic)
        // For now, useChatSessions will handle creating the first session if this returns empty
        setSessions([]); 
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      setSessions([]); // Fallback to empty if error
    } finally {
      setIsLoading(false);
    }
  }, []); // Removed initialModel dependency as it's for initial creation, not re-loading

  const updateAndPersistSessions = useCallback((newSessionsOrCallback: Session[] | ((prevSessions: Session[]) => Session[])) => {
    setSessions(prevSessions => {
      const updatedSessions = typeof newSessionsOrCallback === 'function'
        ? newSessionsOrCallback(prevSessions)
        : newSessionsOrCallback;

      if (updatedSessions.length > 0) {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));
      } else {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      }
      return updatedSessions;
    });
  }, []);
  
  // Function to initialize sessions if empty after loading, used by useChatSessions
  const initializeDefaultSessionIfNeeded = useCallback(() => {
    if (sessions.length === 0 && !isLoading) {
      const newSession = createInitialSession(initialModel);
      updateAndPersistSessions([newSession]);
      return newSession.id; // Return new session ID for activeSessionId initialization
    }
    return null; // No new session created
  }, [sessions, isLoading, initialModel, updateAndPersistSessions]);


  return {
    persistedSessions: sessions,
    updateAndPersistSessions,
    isLoadingSessions: isLoading,
    initializeDefaultSessionIfNeeded,
  };
};
