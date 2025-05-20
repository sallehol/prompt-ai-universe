
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
        console.log(`[useChatSessions] useEffect (sessions loaded): Set activeSessionId to ${sortedSessions[0].id} from ${persistedSessions.length} sessions.`);
      } else {
        // If no sessions, try to initialize one
        const newSessionId = initializeDefaultSessionIfNeeded();
        if (newSessionId) {
            setActiveSessionId(newSessionId);
            console.log(`[useChatSessions] useEffect (sessions loaded): Initialized and set activeSessionId to ${newSessionId}.`);
        } else {
            console.log(`[useChatSessions] useEffect (sessions loaded): No persisted sessions and no new session initialized.`);
        }
      }
    }
  }, [persistedSessions, isLoadingSessions, initializeDefaultSessionIfNeeded]);


  const createSession = useCallback(() => {
    const modelForNewSession = activeSessionId
      ? persistedSessions.find(s => s.id === activeSessionId)?.modelUsed || initialModel
      : initialModel;
    const newSession = createInitialSession(modelForNewSession);
    console.log(`[useChatSessions] createSession: new session ${newSession.id} with model ${modelForNewSession}`);
    
    updateAndPersistSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [initialModel, activeSessionId, persistedSessions, updateAndPersistSessions]);

  const switchSession = useCallback((sessionId: string) => {
    console.log(`[useChatSessions] switchSession: to ${sessionId}`);
    setActiveSessionId(sessionId);
  }, []);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    console.log(`[useChatSessions] renameSession: ${sessionId} to "${newName}"`);
    updateAndPersistSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, name: newName, lastActivityAt: Date.now() } : session
      )
    );
  }, [updateAndPersistSessions]);

  const deleteSession = useCallback((sessionId: string) => {
    console.log(`[useChatSessions] deleteSession: ${sessionId}`);
    updateAndPersistSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          const sortedRemaining = [...remainingSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedRemaining[0].id);
           console.log(`[useChatSessions] deleteSession: active session deleted, switched to ${sortedRemaining[0].id}`);
        } else {
          const newSession = createInitialSession(initialModel);
          setActiveSessionId(newSession.id);
          console.log(`[useChatSessions] deleteSession: last session deleted, created new ${newSession.id}`);
          return [newSession]; // This becomes the new state for sessions
        }
      }
      return remainingSessions;
    });
  }, [activeSessionId, initialModel, updateAndPersistSessions]);

  const clearSessionMessages = useCallback((sessionId: string) => {
    console.log(`[useChatSessions] clearSessionMessages: for ${sessionId}`);
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
          
          console.log(`[useChatSessions] addMessageToSession: for session ${session.id}, text: "${text.substring(0,30)}...", sender: ${sender}, modelForMessage: ${modelForMessage}, current session.modelUsed: ${session.modelUsed}, resulting newMessage.model: ${newMessage.model}`);
          
          let newName = session.name;
          if (sender === 'user' && (session.name === 'New Chat' || session.messages.length <= 1) && session.messages.filter(m => m.sender === 'user').length === 0) {
            newName = text.substring(0, 30) + (text.length > 30 ? '...' : '');
          }

          return {
            ...session,
            messages: [...session.messages, newMessage],
            lastActivityAt: now,
            name: newName,
            modelUsed: session.modelUsed, // Crucially, do NOT change session.modelUsed here. It's changed by updateSessionModel.
                                          // The message carries its own model info.
          };
        }
        return session;
      });
    });
  }, [updateAndPersistSessions]);
  
  const updateSessionModel = useCallback((sessionId: string, model: string) => {
    console.log(`[useChatSessions] updateSessionModel: Attempting to update session ${sessionId} to model ${model}`);
    updateAndPersistSessions(prev => {
      const newSessions = prev.map(session => {
        if (session.id === sessionId) {
          console.log(`[useChatSessions] updateSessionModel: Updating session ${sessionId} from ${session.modelUsed} to ${model}`);
          return { ...session, modelUsed: model, lastActivityAt: Date.now() };
        }
        return session;
      });
      // Log the state of the specific session after the map operation
      const updatedSession = newSessions.find(s => s.id === sessionId);
      if (updatedSession) {
        console.log(`[useChatSessions] updateSessionModel: Session ${sessionId} after update attempt - new modelUsed: ${updatedSession.modelUsed}`);
      } else {
        console.log(`[useChatSessions] updateSessionModel: Session ${sessionId} not found after update attempt.`);
      }
      return newSessions;
    });
  }, [updateAndPersistSessions]);

  const activeSession = persistedSessions.find(session => session.id === activeSessionId) || null;

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSessionId || text.trim() === '') return;

    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      console.error(`[useChatSessions] handleSendMessage: No current session found for activeSessionId: ${activeSessionId}`);
      return;
    }
    
    const modelForResponse = currentSession.modelUsed;
    console.log(`[useChatSessions] handleSendMessage: activeSessionId=${activeSessionId}, text: "${text.substring(0,30)}...", modelForUserMessage (and AI response): ${modelForResponse}`);

    addMessageToSession(activeSessionId, text, 'user', modelForResponse); // Pass modelForResponse explicitly for user message too
    setIsAiTypingInHook(true);

    setTimeout(() => {
      const aiResponseText = `Simulated response from ${modelForResponse} to: "${text}"`;
      addMessageToSession(activeSessionId, aiResponseText, 'ai', modelForResponse);
      setIsAiTypingInHook(false);
      console.log(`[useChatSessions] handleSendMessage: AI response sent using model ${modelForResponse}`);
    }, 1500);
  }, [activeSessionId, addMessageToSession, persistedSessions]);

  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    if (!activeSessionId) return;
    
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      console.error(`[useChatSessions] regenerateResponse: No current session found for activeSessionId: ${activeSessionId}`);
      return;
    }
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    if (messageIndex === -1 || currentSession.messages[messageIndex].sender !== 'ai') {
      console.warn(`[useChatSessions] regenerateResponse: AI message to regenerate (id: ${messageIdToRegenerate}) not found or not an AI message.`);
      return;
    }

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].sender !== 'user') {
      console.warn(`[useChatSessions] regenerateResponse: User prompt for message ${messageIdToRegenerate} not found.`);
      return;
    }
    
    const userPrompt = currentSession.messages[userPromptMessageIndex].text;
    const modelForRegeneration = currentSession.modelUsed; 
    console.log(`[useChatSessions] regenerateResponse: Regenerating for prompt "${userPrompt.substring(0,30)}..." using model ${modelForRegeneration}`);

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
      console.log(`[useChatSessions] regenerateResponse: AI response regenerated using model ${modelForRegeneration}`);
    }, 1500);

  }, [activeSessionId, persistedSessions, addMessageToSession, updateAndPersistSessions]);

  const toggleSaveMessage = useCallback((messageId: string) => {
     if (!activeSessionId) return;
     console.log(`[useChatSessions] toggleSaveMessage: messageId=${messageId} in session ${activeSessionId}`);
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
    isLoadingSessions,
    createSession,
    switchSession,
    renameSession,
    deleteSession,
    clearSessionMessages,
    updateSessionModel,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
  };
};
