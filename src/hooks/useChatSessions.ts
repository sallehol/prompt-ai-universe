
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/chat';
// Message type is still needed if createNewMessage is used here, but it's moved
// import { Message } from '@/components/chat/ChatInterface'; 
import { createNewMessage, createInitialSession } from '@/lib/chatUtils';
import { useSessionPersistence } from './useSessionPersistence';

export const useChatSessions = (initialModel: string = 'gpt-4o-mini') => {
  const { 
    persistedSessions, 
    updateAndPersistSessions, 
    isLoadingSessions,
    initializeDefaultSessionIfNeeded,
  } = useSessionPersistence(initialModel);
  
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAiTypingInHook, setIsAiTypingInHook] = useState<boolean>(false);

  // Initialize activeSessionId once sessions are loaded
  useEffect(() => {
    if (!isLoadingSessions) {
      if (persistedSessions.length > 0) {
        const sortedSessions = [...persistedSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
        setActiveSessionId(sortedSessions[0].id);
      } else {
        // If no sessions, try to initialize one
        const newSessionId = initializeDefaultSessionIfNeeded();
        if (newSessionId) {
            setActiveSessionId(newSessionId);
        }
      }
    }
  }, [persistedSessions, isLoadingSessions, initializeDefaultSessionIfNeeded]);


  const createSession = useCallback(() => {
    const modelForNewSession = activeSessionId
      ? persistedSessions.find(s => s.id === activeSessionId)?.modelUsed || initialModel
      : initialModel;
    const newSession = createInitialSession(modelForNewSession);
    
    updateAndPersistSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [initialModel, activeSessionId, persistedSessions, updateAndPersistSessions]);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    updateAndPersistSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, name: newName, lastActivityAt: Date.now() } : session
      )
    );
  }, [updateAndPersistSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    updateAndPersistSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          const sortedRemaining = [...remainingSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedRemaining[0].id);
        } else {
          const newSession = createInitialSession(initialModel);
          setActiveSessionId(newSession.id);
          return [newSession]; // This becomes the new state for sessions
        }
      }
      return remainingSessions;
    });
  }, [activeSessionId, initialModel, updateAndPersistSessions]);

  const clearSessionMessages = useCallback((sessionId: string) => {
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

  const addMessageToSession = useCallback((sessionId: string, text: string, sender: 'user' | 'ai', modelOverride?: string) => {
    updateAndPersistSessions(prevSessions => {
      const now = Date.now();
      return prevSessions.map(session => {
        if (session.id === sessionId) {
          const modelForMessage = modelOverride || session.modelUsed;
          const newMessage = createNewMessage(text, sender, modelForMessage);
          
          let newName = session.name;
          if (sender === 'user' && (session.name === 'New Chat' || session.messages.length <= 1) && session.messages.filter(m => m.sender === 'user').length === 0) {
            newName = text.substring(0, 30) + (text.length > 30 ? '...' : '');
          }

          return {
            ...session,
            messages: [...session.messages, newMessage],
            lastActivityAt: now,
            name: newName,
            modelUsed: modelForMessage
          };
        }
        return session;
      });
    });
  }, [updateAndPersistSessions]);
  
  const updateSessionModel = useCallback((sessionId: string, model: string) => {
    updateAndPersistSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, modelUsed: model, lastActivityAt: Date.now() } : session
      )
    );
  }, [updateAndPersistSessions]);

  const activeSession = persistedSessions.find(session => session.id === activeSessionId) || null;

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSessionId || text.trim() === '') return;

    // Optimistically get the current session model before adding the user message
    // This ensures the AI response uses the model active at the time of sending.
    const sessionBeforeUserMessage = persistedSessions.find(s => s.id === activeSessionId);
    const modelForResponse = sessionBeforeUserMessage?.modelUsed || initialModel;

    addMessageToSession(activeSessionId, text, 'user');
    setIsAiTypingInHook(true);

    setTimeout(() => {
      // No need to find session again, use modelForResponse captured earlier
      const aiResponseText = `Simulated response from ${modelForResponse} to: "${text}"`;
      addMessageToSession(activeSessionId, aiResponseText, 'ai', modelForResponse);
      setIsAiTypingInHook(false);
    }, 1500);
  }, [activeSessionId, addMessageToSession, persistedSessions, initialModel]);

  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    if (!activeSessionId) return;
    
    // Find session state *before* removing the message to get userPrompt & model
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    if (messageIndex === -1 || currentSession.messages[messageIndex].sender !== 'ai') return;

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].sender !== 'user') return;
    
    const userPrompt = currentSession.messages[userPromptMessageIndex].text;
    const modelForRegeneration = currentSession.modelUsed;

    updateAndPersistSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.filter(msg => msg.id !== messageIdToRegenerate),
          lastActivityAt: Date.now(),
        };
      }
      return s;
    }));
    
    setIsAiTypingInHook(true);

    setTimeout(() => {
      const regeneratedResponseText = `(Regenerated) New response from ${modelForRegeneration} to: "${userPrompt}"`;
      addMessageToSession(activeSessionId, regeneratedResponseText, 'ai', modelForRegeneration);
      setIsAiTypingInHook(false);
    }, 1500);

  }, [activeSessionId, persistedSessions, addMessageToSession, updateAndPersistSessions]);

  const toggleSaveMessage = useCallback((messageId: string) => {
     if (!activeSessionId) return;
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


  return {
    sessions: persistedSessions.sort((a,b) => b.lastActivityAt - a.lastActivityAt),
    activeSession,
    activeSessionId,
    isAiTyping: isAiTypingInHook,
    isLoadingSessions, // Expose loading state if UI needs it
    createSession,
    switchSession,
    renameSession,
    deleteSession,
    clearSessionMessages,
    // addMessageToSession is not directly exposed if handleSendMessage covers all needs
    updateSessionModel,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
  };
};
