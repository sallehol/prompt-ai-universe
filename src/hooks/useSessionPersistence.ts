
import { useState, useEffect, useCallback } from 'react';
import { Session, Message } from '@/types/chat'; // Ensure these are the standardized types

const LOCAL_STORAGE_KEY = 'chatSessions'; // Using the existing constant

export const useSessionPersistence = (initialModel: string = 'gpt-4o-mini') => {
  const [persistedSessions, setPersistedSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    setIsLoadingSessions(true);
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      let sessions: Session[] = [];
      
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as any[]; // Parse as any first for safety
        // Map and validate to ensure structure matches Session and Message from @/types/chat
        sessions = parsedSessions.map(s => ({
          id: String(s.id || `migrated-${Date.now()}-${Math.random()}`),
          name: String(s.name || 'Untitled Chat'),
          createdAt: Number(s.createdAt || Date.now()),
          lastActivityAt: Number(s.lastActivityAt || Date.now()),
          modelUsed: String(s.modelUsed || initialModel),
          messages: Array.isArray(s.messages) ? s.messages.map((msg: any) => ({
            id: String(msg.id || `msg-${Date.now()}-${Math.random()}`),
            role: ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : (msg.sender === 'ai' ? 'assistant' : 'user'), // Migration
            content: String(msg.content || msg.text || ''), // Migration
            timestamp: Number(msg.timestamp instanceof Date ? msg.timestamp.getTime() : (msg.timestamp || Date.now())), // Migration
            isSaved: typeof msg.isSaved === 'boolean' ? msg.isSaved : false,
          } as Message)) : [],
        } as Session));
        console.log('Loaded and mapped sessions from storage:', sessions);
      }
      
      setPersistedSessions(sessions);
    } catch (error) {
      console.error('Error loading/mapping sessions:', error);
      setPersistedSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [initialModel]); // Added initialModel to dependencies for safety if modelUsed defaults to it

  const updateAndPersistSessions = useCallback((updater: (prevSessions: Session[]) => Session[]) => {
    setPersistedSessions(prevSessions => {
      const updatedSessions = updater(prevSessions);
      try {
        // Ensure all sessions and messages conform to the latest type structure before saving
        const sessionsToStore = updatedSessions.map(s => ({
            ...s,
            messages: s.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                isSaved: m.isSaved || false, // Ensure isSaved exists
            }))
        }));

        if (sessionsToStore.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionsToStore));
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY); // Clear if no sessions
        }
        console.log('Persisted sessions to storage:', sessionsToStore);
      } catch (error) {
        console.error('Error persisting sessions:', error);
      }
      return updatedSessions; // Return the state version, not necessarily sessionsToStore
    });
  }, []);
  
  const initializeDefaultSessionIfNeeded = useCallback(() => {
    if (persistedSessions.length === 0 && !isLoadingSessions) {
      const now = new Date();
      const defaultSession: Session = {
        id: 'default-' + now.getTime(),
        name: 'New Chat', // Default name as requested
        modelUsed: initialModel,
        messages: [], 
        createdAt: now.getTime(),
        lastActivityAt: now.getTime()
      };
      
      updateAndPersistSessions(() => [defaultSession]);
      console.log('Created default session because storage was empty:', defaultSession);
      return defaultSession.id;
    }
    return null;
  }, [persistedSessions, isLoadingSessions, initialModel, updateAndPersistSessions]);


  return {
    persistedSessions,
    updateAndPersistSessions,
    isLoadingSessions,
    initializeDefaultSessionIfNeeded,
  };
};
