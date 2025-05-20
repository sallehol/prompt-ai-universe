
import { useState, useCallback } from 'react';
import { Session } from '@/types/chat';
import { createNewMessage } from '@/lib/chatUtils';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseMessageManagerProps {
  activeSessionId: string | null;
  persistedSessions: Session[]; // To find current session details
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useMessageManager = ({
  activeSessionId,
  persistedSessions,
  updateAndPersistSessions,
}: UseMessageManagerProps) => {
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);

  const addMessageToSessionInternal = useCallback((sessionId: string, text: string, sender: 'user' | 'ai', modelOverride?: string) => {
    updateAndPersistSessions(prevSessions => {
      const now = Date.now();
      return prevSessions.map(session => {
        if (session.id === sessionId) {
          const modelForMessage = modelOverride || session.modelUsed;
          const newMessage = createNewMessage(text, sender, modelForMessage);
          
          console.log(`[useMessageManager] addMessageToSession: for session ${session.id}, text: "${text.substring(0,30)}...", sender: ${sender}, modelForMessage: ${modelForMessage}`);
          
          let newName = session.name;
          if (sender === 'user' && (session.name === 'New Chat' || session.messages.length <= 1) && session.messages.filter(m => m.sender === 'user').length === 0) {
            newName = text.substring(0, 30) + (text.length > 30 ? '...' : '');
          }

          return {
            ...session,
            messages: [...session.messages, newMessage],
            lastActivityAt: now,
            name: newName,
            // modelUsed is NOT changed here, only message's model is set
          };
        }
        return session;
      });
    });
  }, [updateAndPersistSessions]);

  const handleSendMessage = useCallback(async (text: string) => {
    if (!activeSessionId || text.trim() === '') return;

    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      console.error(`[useMessageManager] handleSendMessage: No current session found for activeSessionId: ${activeSessionId}`);
      return;
    }
    
    const modelForResponse = currentSession.modelUsed;
    console.log(`[useMessageManager] handleSendMessage: activeSessionId=${activeSessionId}, text: "${text.substring(0,30)}...", model: ${modelForResponse}`);

    addMessageToSessionInternal(activeSessionId, text, 'user', modelForResponse);
    setIsAiTyping(true);

    setTimeout(() => {
      const aiResponseText = `Simulated response from ${modelForResponse} to: "${text}"`;
      addMessageToSessionInternal(activeSessionId, aiResponseText, 'ai', modelForResponse);
      setIsAiTyping(false);
      console.log(`[useMessageManager] handleSendMessage: AI response sent using model ${modelForResponse}`);
    }, 1500);
  }, [activeSessionId, persistedSessions, addMessageToSessionInternal, setIsAiTyping]);

  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    if (!activeSessionId) return;
    
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      console.error(`[useMessageManager] regenerateResponse: No current session for ${activeSessionId}`);
      return;
    }
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    if (messageIndex === -1 || currentSession.messages[messageIndex].sender !== 'ai') {
      console.warn(`[useMessageManager] regenerateResponse: AI message ${messageIdToRegenerate} not found or not AI.`);
      return;
    }

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].sender !== 'user') {
      console.warn(`[useMessageManager] regenerateResponse: User prompt for ${messageIdToRegenerate} not found.`);
      return;
    }
    
    const userPrompt = currentSession.messages[userPromptMessageIndex].text;
    const modelForRegeneration = currentSession.modelUsed; 
    console.log(`[useMessageManager] regenerateResponse: For prompt "${userPrompt.substring(0,30)}..." using model ${modelForRegeneration}`);

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
    
    setIsAiTyping(true);

    setTimeout(() => {
      const regeneratedResponseText = `(Regenerated) New response from ${modelForRegeneration} to: "${userPrompt}"`;
      addMessageToSessionInternal(activeSessionId, regeneratedResponseText, 'ai', modelForRegeneration);
      setIsAiTyping(false);
      console.log(`[useMessageManager] regenerateResponse: AI response regenerated using model ${modelForRegeneration}`);
    }, 1500);
  }, [activeSessionId, persistedSessions, addMessageToSessionInternal, updateAndPersistSessions, setIsAiTyping]);

  const toggleSaveMessage = useCallback((messageId: string) => {
     if (!activeSessionId) return;
     console.log(`[useMessageManager] toggleSaveMessage: messageId=${messageId} in session ${activeSessionId}`);
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
    isAiTyping,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
  };
};

