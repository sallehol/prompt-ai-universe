
import { useState, useEffect, useCallback } from 'react';
import { Session } from '@/types/chat';
import { Message } from '@/components/chat/ChatInterface'; // Assuming Message is exported

const LOCAL_STORAGE_KEY = 'chatSessions_v1';

const createNewMessage = (text: string, sender: 'user' | 'ai', model?: string): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substring(2,7), // More unique ID
  text,
  sender,
  timestamp: new Date(),
  model,
  isSaved: false,
});

const createInitialSession = (model: string = 'gpt-4o-mini'): Session => {
  const now = Date.now();
  return {
    id: now.toString(),
    name: 'New Chat',
    createdAt: now,
    lastActivityAt: now,
    messages: [createNewMessage('Hello! How can I help you today?', 'ai', model)],
    modelUsed: model,
  };
};

export const useChatSessions = (initialModel: string = 'gpt-4o-mini') => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [isAiTypingInHook, setIsAiTypingInHook] = useState<boolean>(false); // Renamed to avoid conflict

  useEffect(() => {
    try {
      const storedSessions = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (storedSessions) {
        const parsedSessions = JSON.parse(storedSessions) as Session[];
        // Ensure messages have Date objects
        parsedSessions.forEach(session => {
          session.messages = session.messages.map(msg => ({
            ...msg,
            timestamp: new Date(msg.timestamp)
          }));
        });
        setSessions(parsedSessions);
        if (parsedSessions.length > 0) {
          // Make the most recent session active
          const sortedSessions = [...parsedSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedSessions[0].id);
        } else {
          const newSession = createInitialSession(initialModel);
          setSessions([newSession]);
          setActiveSessionId(newSession.id);
        }
      } else {
        const newSession = createInitialSession(initialModel);
        setSessions([newSession]);
        setActiveSessionId(newSession.id);
      }
    } catch (error) {
      console.error("Failed to load sessions from localStorage:", error);
      const newSession = createInitialSession(initialModel);
      setSessions([newSession]);
      setActiveSessionId(newSession.id);
    }
  }, [initialModel]);

  useEffect(() => {
    if (sessions.length > 0) {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sessions));
    } else {
      // If all sessions are deleted, clear local storage for this key
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    }
  }, [sessions]);

  const createSession = useCallback(() => {
    const modelForNewSession = activeSessionId 
      ? sessions.find(s => s.id === activeSessionId)?.modelUsed || initialModel
      : initialModel;
    const newSession = createInitialSession(modelForNewSession);
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(newSession.id);
    return newSession.id;
  }, [initialModel, activeSessionId, sessions]);

  const switchSession = useCallback((sessionId: string) => {
    setActiveSessionId(sessionId);
  }, []);

  const renameSession = useCallback((sessionId: string, newName: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, name: newName, lastActivityAt: Date.now() } : session
      )
    );
  }, []);

  const deleteSession = useCallback((sessionId: string) => {
    setSessions(prev => {
      const remainingSessions = prev.filter(session => session.id !== sessionId);
      if (activeSessionId === sessionId) {
        if (remainingSessions.length > 0) {
          const sortedRemaining = [...remainingSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
          setActiveSessionId(sortedRemaining[0].id);
        } else {
          // If deleting the last session, create a new one
          const newSession = createInitialSession(initialModel);
          setActiveSessionId(newSession.id);
          return [newSession]; // Return array with the new session
        }
      }
      return remainingSessions;
    });
  }, [activeSessionId, initialModel]);

  const clearSessionMessages = useCallback((sessionId: string) => {
    setSessions(prev =>
      prev.map(session => {
        if (session.id === sessionId) {
          return {
            ...session,
            messages: [createNewMessage('Hello! How can I help you today?', 'ai', session.modelUsed)],
            lastActivityAt: Date.now(),
            name: session.name === "New Chat" || session.messages.length <= 1 ? "New Chat" : session.name // Reset name if it was auto-generated potentially
          };
        }
        return session;
      })
    );
  }, []);

  const addMessageToSession = useCallback((sessionId: string, text: string, sender: 'user' | 'ai', modelOverride?: string) => {
    setSessions(prevSessions => {
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
            modelUsed: modelForMessage // Ensure modelUsed is updated if overridden
          };
        }
        return session;
      });
    });
  }, []);
  
  const updateSessionModel = useCallback((sessionId: string, model: string) => {
    setSessions(prev =>
      prev.map(session =>
        session.id === sessionId ? { ...session, modelUsed: model, lastActivityAt: Date.now() } : session
      )
    );
  }, []);

  const activeSession = sessions.find(session => session.id === activeSessionId) || null;

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSessionId || text.trim() === '') return;

    addMessageToSession(activeSessionId, text, 'user');
    setIsAiTypingInHook(true);

    // Simulate AI response
    setTimeout(() => {
      const currentSessionForResponse = sessions.find(s => s.id === activeSessionId);
      if (currentSessionForResponse) {
        const aiResponseText = `Simulated response from ${currentSessionForResponse.modelUsed} to: "${text}"`;
        addMessageToSession(activeSessionId, aiResponseText, 'ai', currentSessionForResponse.modelUsed);
      }
      setIsAiTypingInHook(false);
    }, 1500);
  }, [activeSessionId, addMessageToSession, sessions]);

  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    if (!activeSessionId) return;

    const currentSession = sessions.find(s => s.id === activeSessionId);
    if (!currentSession) return;
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    if (messageIndex === -1 || currentSession.messages[messageIndex].sender !== 'ai') return;

    const userPromptMessageIndex = messageIndex -1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].sender !== 'user') return;
    
    const userPrompt = currentSession.messages[userPromptMessageIndex].text;

    // Remove old AI response
    setSessions(prevSessions => prevSessions.map(s => {
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
      const updatedSessionForResponse = sessions.find(s => s.id === activeSessionId); // get latest session state
      if (updatedSessionForResponse) {
        const regeneratedResponseText = `(Regenerated) New response from ${updatedSessionForResponse.modelUsed} to: "${userPrompt}"`;
        addMessageToSession(activeSessionId, regeneratedResponseText, 'ai', updatedSessionForResponse.modelUsed);
      }
      setIsAiTypingInHook(false);
    }, 1500);

  }, [activeSessionId, sessions, addMessageToSession]);

  const toggleSaveMessage = useCallback((messageId: string) => {
     if (!activeSessionId) return;
     setSessions(prevSessions => prevSessions.map(s => {
      if (s.id === activeSessionId) {
        return {
          ...s,
          messages: s.messages.map(msg => msg.id === messageId ? {...msg, isSaved: !msg.isSaved} : msg),
          lastActivityAt: Date.now()
        };
      }
      return s;
    }));
    // Toast logic would ideally be here or in ChatInterface based on this state change
  }, [activeSessionId]);


  return {
    sessions: sessions.sort((a,b) => b.lastActivityAt - a.lastActivityAt), // Always return sorted
    activeSession,
    activeSessionId,
    isAiTyping: isAiTypingInHook,
    createSession,
    switchSession,
    renameSession,
    deleteSession,
    clearSessionMessages,
    addMessageToSession, // exposing for ChatInterface to directly use if needed for more complex scenarios
    updateSessionModel,
    handleSendMessage, // for MessageInput
    regenerateResponse, // for ChatMessage actions
    toggleSaveMessage, // for ChatMessage actions
  };
};
