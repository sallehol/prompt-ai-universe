
import { useCallback } from 'react';
import { Session, Message } from '@/types/chat';
// import { createNewMessage } from '@/lib/chatUtils'; // Not directly used in createSession

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
  persistedSessions,
}: UseSessionMutationsProps) => {
  const createSession = useCallback(() => {
    const newSessionId = Date.now().toString();
    const now = new Date();
    // Default name as per user request in this message (no timestamp in name)
    const defaultName = `New Chat`;
    
    const newSession: Session = {
      id: newSessionId,
      name: defaultName,
      // Use current model of active session if available, otherwise initialModel
      modelUsed: persistedSessions.find(s => s.id === activeSessionId)?.modelUsed || initialModel,
      messages: [], // Start with no messages
      createdAt: now.getTime(),
      lastActivityAt: now.getTime(),
    };
    
    console.log('[useSessionMutations] Creating new session:', newSession);
    
    updateAndPersistSessions(prevSessions => {
      const updatedSessions = [...prevSessions, newSession];
      console.log('[useSessionMutations] Updated sessions after creation:', updatedSessions);
      return updatedSessions;
    });
    
    setActiveSessionId(newSessionId);
    console.log('[useSessionMutations] Set active session to new ID:', newSessionId);
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
          // No sessions left, create a new one (This behavior might differ from initializeDefaultSessionIfNeeded)
          // For consistency, let's rely on initializeDefaultSessionIfNeeded from useActiveSessionManager
          // by setting activeSessionId to null, which should trigger it.
          // However, current logic creates one directly. Let's make it create one to ensure UI isn't blank.
          const newFallbackSessionId = Date.now().toString() + "-fallback";
          const now = new Date();
          const fallbackName = `New Chat`; // Consistent naming
          const newFallbackSession: Session = {
            id: newFallbackSessionId,
            name: fallbackName,
            modelUsed: initialModel, // Fallback to initial model
            messages: [],
            createdAt: now.getTime(),
            lastActivityAt: now.getTime(),
          };
          setActiveSessionId(newFallbackSession.id);
          console.log(`[useSessionMutations] deleteSession: last session deleted, created new fallback ${newFallbackSession.id}`);
          return [newFallbackSession]; // Return the new session as the only one
        }
      }
      // If we deleted a non-active session, or an active one and switched, return remaining.
      // If remainingSessions is empty AFTER deleting the last session and creating a fallback, this path might not be hit as expected.
      // The logic above handles the "last session deleted" case by returning `[newFallbackSession]`.
      return remainingSessions;
    });
  }, [activeSessionId, initialModel, updateAndPersistSessions, setActiveSessionId]);
  
  const clearSessionMessages = useCallback((sessionId: string) => {
    console.log(`[useSessionMutations] clearSessionMessages: for ${sessionId}`);
    updateAndPersistSessions(prev =>
      prev.map(session => {
        if (session.id === sessionId) {
          // const currentModel = session.modelUsed; // Not used for new initial message
          // Create a new initial message for the cleared chat.
          const initialMessage: Message = {
            id: Date.now().toString() + '_ai_cleared', // Unique ID for the message
            role: 'assistant',
            content: 'Chat cleared. How can I help you now?',
            timestamp: Date.now(),
          };
          const now = new Date();
          const newName = `Chat ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}`;

          return {
            ...session,
            messages: [initialMessage], // Reset messages to just the new initial greeting
            lastActivityAt: Date.now(),
            // Optionally reset name if it was a generic "New Chat" or based on few messages
            name: session.name.startsWith("New Chat") || session.messages.length <= 1 
                  ? newName
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
    renameSession,
    deleteSession,
    clearSessionMessages,
    updateSessionModel,
  };
};
