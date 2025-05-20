
import { useCallback } from 'react';
import { Session } from '@/types/chat';
import { createInitialSession, createNewMessage } from '@/lib/chatUtils'; // createNewMessage needed for clearSessionMessages

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseSessionMutationsProps {
  updateAndPersistSessions: UpdateSessionsFn;
  initialModel: string;
  activeSessionId: string | null;
  setActiveSessionId: (id: string | null) => void;
  persistedSessions: Session[]; // Needed for deleteSession logic
}

export const useSessionMutations = ({
  updateAndPersistSessions,
  initialModel,
  activeSessionId,
  setActiveSessionId,
  persistedSessions,
}: UseSessionMutationsProps) => {
  const createSession = useCallback(() => {
    const modelForNewSession = activeSessionId
      ? persistedSessions.find(s => s.id === activeSessionId)?.modelUsed || initialModel
      : initialModel;
    const newSession = createInitialSession(modelForNewSession);
    console.log(`[useSessionMutations] createSession: new session ${newSession.id} with model ${modelForNewSession}`);
    
    updateAndPersistSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [initialModel, activeSessionId, persistedSessions, updateAndPersistSessions, setActiveSessionId]);

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
          const newSession = createInitialSession(initialModel);
          setActiveSessionId(newSession.id);
          console.log(`[useSessionMutations] deleteSession: last session deleted, created new ${newSession.id}`);
          return [newSession];
        }
      }
      return remainingSessions;
    });
  }, [activeSessionId, initialModel, updateAndPersistSessions, setActiveSessionId]);

  const clearSessionMessages = useCallback((sessionId: string) => {
    console.log(`[useSessionMutations] clearSessionMessages: for ${sessionId}`);
    updateAndPersistSessions(prev =>
      prev.map(session => {
        if (session.id === sessionId) {
          const currentModel = session.modelUsed;
          return {
            ...session,
            messages: [createNewMessage('Hello! How can I help you today?', 'ai', currentModel)],
            lastActivityAt: Date.now(),
            name: session.name === "New Chat" || session.messages.length <= 1 ? "New Chat" : session.name
          };
        }
        return session;
      })
    );
  }, [updateAndPersistSessions]);

  const updateSessionModel = useCallback((sessionId: string, model: string) => {
    console.log(`[useSessionMutations] updateSessionModel: Attempting to update session ${sessionId} to model ${model}`);
    updateAndPersistSessions(prev => {
      const newSessions = prev.map(s => {
        if (s.id === sessionId) {
          console.log(`[useSessionMutations] updateSessionModel: Updating session ${s.id} from ${s.modelUsed} to ${model}`);
          return { ...s, modelUsed: model, lastActivityAt: Date.now() };
        }
        return s;
      });
      const updatedSession = newSessions.find(s => s.id === sessionId);
      if (updatedSession) {
        console.log(`[useSessionMutations] updateSessionModel: Session ${sessionId} after update attempt - new modelUsed: ${updatedSession.modelUsed}`);
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

