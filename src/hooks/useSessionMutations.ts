import { useCallback } from 'react';
import { Session, Message } from '@/types/chat'; // Message is needed by Session
import { createNewMessage } from '@/lib/chatUtils'; // For clearSessionMessages

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseSessionMutationsProps {
  updateAndPersistSessions: UpdateSessionsFn;
  initialModel: string;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  persistedSessions: Session[];
}

export const useSessionMutations = ({
  updateAndPersistSessions,
  initialModel,
  activeSessionId,
  setActiveSessionId,
  persistedSessions, // Keep if used by other mutations
}: UseSessionMutationsProps) => {
  const createSession = useCallback(() => {
    const newSessionId = Date.now().toString(); // Unique ID
    const now = new Date();
    // Default name with timestamp HH:MM
    const defaultName = `New Chat ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
    
    const newSession: Session = {
      id: newSessionId,
      name: defaultName,
      modelUsed: persistedSessions.find(s => s.id === activeSessionId)?.modelUsed || initialModel,
      messages: [], // Start with no messages. An initial greeting can be added by system/AI later if needed.
      createdAt: now.getTime(),
      lastActivityAt: now.getTime(),
    };
    
    updateAndPersistSessions(prevSessions => {
      const updatedSessions = [...prevSessions, newSession];
      console.log('Created new session:', newSession);
      console.log('Updated sessions:', updatedSessions);
      return updatedSessions;
    });
    
    setActiveSessionId(newSessionId);
    return newSessionId;
  }, [initialModel, updateAndPersistSessions, setActiveSessionId, persistedSessions, activeSessionId]);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    console.log(`[useSessionMutations] renameSession: ${sessionId} to "${newName}"`);
    updateAndPersistSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, name: newName, lastActivityAt: Date.now() } : session
      )
    );
  }, [updateAndPersistSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    console.log(`[useSessionMutations] deleteSession: ${sessionId}`);
    updateAndPersistSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          const sortedRemaining = [...remainingSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedRemaining[0].id);
          console.log(`[useSessionMutations] deleteSession: active session deleted, switched to ${sortedRemaining[0].id}`);
        } else {
          // No sessions left, create a new one
          const newSessionId = Date.now().toString();
          const now = new Date();
          const defaultName = `New Chat ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;
          const newFallbackSession: Session = {
            id: newSessionId,
            name: defaultName,
            modelUsed: initialModel,
            messages: [],
            createdAt: now.getTime(),
            lastActivityAt: now.getTime(),
          };
          setActiveSessionId(newFallbackSession.id);
          console.log(`[useSessionMutations] deleteSession: last session deleted, created new ${newFallbackSession.id}`);
          return [newFallbackSession];
        }
      }
      return remainingSessions.length > 0 ? remainingSessions : []; // Ensure it doesn't return empty if nothing to return for default
    });
  }, [activeSessionId, initialModel, updateAndPersistSessions, setActiveSessionId]);

  const clearSessionMessages = useCallback((sessionId: string) => {
    console.log(`[useSessionMutations] clearSessionMessages: for ${sessionId}`);
    updateAndPersistSessions(prev =>
      prev.map(session => {
        if (session.id === sessionId) {
          const currentModel = session.modelUsed;
          // createNewMessage will need to be updated to use role/content for Message type
          // For now, assuming it still works or will be fixed.
          // If it needs to be an empty array: messages: [],
          const initialMessage: Message = {
            id: Date.now().toString() + '_ai',
            role: 'assistant',
            content: 'Hello! How can I help you today?',
            timestamp: Date.now(),
          };
          return {
            ...session,
            messages: [initialMessage],
            lastActivityAt: Date.now(),
            // Reset name if it's "New Chat" or was very short (likely an empty chat that got named)
            // or if messages.length <= 1 (meaning it was just the initial greeting)
            name: session.name.startsWith("New Chat") || session.messages.length <= 1 
                  ? `Chat ${new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}` 
                  : session.name,
          };
        }
        return session;
      })
    );
  }, [updateAndPersistSessions]);

  const updateSessionModel = useCallback((sessionId: string, model: string) => {
    console.log(`[useSessionMutations] updateSessionModel: Updating session ${sessionId} to model ${model}`);
    
    updateAndPersistSessions(prev => {
      const newSessions = prev.map(s => {
        if (s.id === sessionId) {
          console.log(`[useSessionMutations] Found session ${sessionId}, changing model from ${s.modelUsed} to ${model}`);
          return { 
            ...s, 
            modelUsed: model, 
            lastActivityAt: Date.now() 
          };
        }
        return s;
      });
      
      // Debug log to verify the update happened
      const updatedSession = newSessions.find(s => s.id === sessionId);
      if (updatedSession) {
        console.log(`[useSessionMutations] After update: session ${sessionId} model is now ${updatedSession.modelUsed}`);
      } else {
        console.warn(`[useSessionMutations] Warning: Could not find session ${sessionId} after update attempt`);
      }
      
      return newSessions;
    });
  }, [updateAndPersistSessions]);

  return {
    createSession,
    renameSession, // Already correct
    deleteSession,
    clearSessionMessages,
    updateSessionModel,
  };
};
