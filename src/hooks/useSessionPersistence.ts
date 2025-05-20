
import { useState, useEffect, useCallback } from 'react';
import { Session, Message } from '@/types/chat'; // Message type might be needed if createInitialSession used Message
// import { createInitialSession } from '@/lib/chatUtils'; // Not used in the new logic

const LOCAL_STORAGE_KEY = 'chatSessions'; // Changed from chatSessions_v1 as per user instructions

export const useSessionPersistence = (initialModel: string = 'gpt-4o-mini') => {
  const [persistedSessions, setPersistedSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  // Load sessions from localStorage on component mount
  useEffect(() => {
    setIsLoadingSessions(true);
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      let sessions: Session[] = [];
      
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as Session[];
        // Ensure messages have numeric timestamps if they were stored differently before
        sessions = parsedSessions.map(session => ({
          ...session,
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: typeof msg.timestamp === 'string' || msg.timestamp instanceof Date 
              ? new Date(msg.timestamp).getTime() 
              : msg.timestamp,
          }) as Message) // Added type assertion for msg
        }));
        console.log('Loaded sessions from storage:', sessions);
      }
      
      setPersistedSessions(sessions);
    } catch (error) {
      console.error('Error loading sessions:', error);
      setPersistedSessions([]); // Fallback to empty if error
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Function to update sessions and persist to localStorage
  const updateAndPersistSessions = useCallback((updater: (prevSessions: Session[]) => Session[]) => {
    setPersistedSessions(prevSessions => {
      const updatedSessions = updater(prevSessions);
      try {
        if (updatedSessions.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updatedSessions));
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        console.log('Persisted sessions to storage:', updatedSessions);
        console.log('localStorage content:', localStorage.getItem(LOCAL_STORAGE_KEY));

      } catch (error) {
        console.error('Error persisting sessions:', error);
      }
      return updatedSessions;
    });
  }, []);
  
  // Initialize a default session if needed
  const initializeDefaultSessionIfNeeded = useCallback(() => {
    // This check needs to be careful: persistedSessions might be an empty array but not yet confirmed by isLoading=false
    if (persistedSessions.length === 0 && !isLoadingSessions) {
      const now = new Date();
      const defaultSession: Session = {
        id: 'default-' + now.getTime(), // Or a more robust unique ID
        name: 'New Chat', // Default name
        modelUsed: initialModel,
        messages: [], // Start with no messages as per user requirement for createSession
        createdAt: now.getTime(),
        lastActivityAt: now.getTime()
      };
      
      updateAndPersistSessions(() => [defaultSession]);
      console.log('Created default session:', defaultSession);
      return defaultSession.id; // Return new session ID for activeSessionId initialization
    }
    return null; // No new session created
  }, [persistedSessions, isLoadingSessions, initialModel, updateAndPersistSessions]);


  return {
    persistedSessions,
    updateAndPersistSessions,
    isLoadingSessions,
    initializeDefaultSessionIfNeeded,
  };
};
