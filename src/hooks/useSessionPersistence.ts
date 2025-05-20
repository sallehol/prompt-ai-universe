import { useState, useEffect, useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { logger } from '@/utils/logger';

const LOCAL_STORAGE_KEY = 'chatSessions';

export const useSessionPersistence = (initialModel: string = 'gpt-4o-mini') => {
  const [persistedSessions, setPersistedSessions] = useState<Session[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(true);

  useEffect(() => {
    setIsLoadingSessions(true);
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      let sessions: Session[] = [];
      
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as any[];
        sessions = parsedSessions.map(s => ({
          id: String(s.id || `migrated-${Date.now()}-${Math.random()}`),
          name: String(s.name || 'Untitled Chat'),
          createdAt: Number(s.createdAt || Date.now()),
          lastActivityAt: Number(s.lastActivityAt || Date.now()),
          modelUsed: String(s.modelUsed || initialModel),
          messages: Array.isArray(s.messages) ? s.messages.map((msg: any) => ({
            id: String(msg.id || `msg-${Date.now()}-${Math.random()}`),
            role: ['user', 'assistant', 'system'].includes(msg.role) ? msg.role : (msg.sender === 'ai' ? 'assistant' : 'user'),
            content: String(msg.content || msg.text || ''),
            timestamp: Number(msg.timestamp instanceof Date ? msg.timestamp.getTime() : (msg.timestamp || Date.now())),
            isSaved: typeof msg.isSaved === 'boolean' ? msg.isSaved : false,
          } as Message)) : [],
        } as Session));
        logger.log('Loaded and mapped sessions from storage:', sessions);
      }
      
      setPersistedSessions(sessions);
    } catch (error) {
      logger.error('Error loading/mapping sessions:', error);
      setPersistedSessions([]);
    } finally {
      setIsLoadingSessions(false);
    }
  }, [initialModel]);

  const updateAndPersistSessions = useCallback((updater: (prevSessions: Session[]) => Session[]) => {
    setPersistedSessions(prevSessions => {
      const updatedSessions = updater(prevSessions);
      try {
        const sessionsToStore = updatedSessions.map(s => ({
            ...s,
            messages: s.messages.map(m => ({
                id: m.id,
                role: m.role,
                content: m.content,
                timestamp: m.timestamp,
                isSaved: m.isSaved || false,
            }))
        }));

        if (sessionsToStore.length > 0) {
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessionsToStore));
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
        logger.log('Persisted sessions to storage:', sessionsToStore);
      } catch (error) {
        logger.error('Error persisting sessions:', error);
      }
      return updatedSessions;
    });
  }, []);
  
  const initializeDefaultSessionIfNeeded = useCallback(() => {
    if (persistedSessions.length === 0 && !isLoadingSessions) {
      const now = new Date();
      const defaultSession: Session = {
        id: 'default-' + now.getTime(),
        name: 'New Chat',
        modelUsed: initialModel,
        messages: [], 
        createdAt: now.getTime(),
        lastActivityAt: now.getTime()
      };
      
      updateAndPersistSessions(() => [defaultSession]);
      logger.log('Created default session because storage was empty:', defaultSession);
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
