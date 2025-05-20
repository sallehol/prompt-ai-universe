import { useState, useCallback } from 'react';
import { Session, Message } from '@/types/chat'; // Ensured Message is from @/types/chat
import { createNewMessage } from '@/lib/chatUtils';
import { logger } from '@/utils/logger'; // Added logger import

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
          const modelForMessage = modelOverride || session.modelUsed; // Used for context/logging
          const messageRole = sender === 'user' ? 'user' : 'assistant'; // Map sender to role
          // Call createNewMessage with content and role. modelForMessage is not part of Message object.
          const newMessage = createNewMessage(text, messageRole); 
          
          logger.log(`[useMessageManager] addMessageToSession: for session ${session.id}, content: "${text.substring(0,30)}...", role: ${messageRole}, modelForMessageContext: ${modelForMessage}`);
          
          let newName = session.name;
          // Use role for filtering
          if (sender === 'user' && (session.name === 'New Chat' || session.messages.length <= 1) && session.messages.filter(m => m.role === 'user').length === 0) {
            newName = text.substring(0, 30) + (text.length > 30 ? '...' : '');
          }

          return {
            ...session,
            messages: [...session.messages, newMessage],
            lastActivityAt: now,
            name: newName,
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
      logger.error(`[useMessageManager] handleSendMessage: No current session found for activeSessionId: ${activeSessionId}`);
      return;
    }
    
    const modelForResponse = currentSession.modelUsed;
    logger.log(`[useMessageManager] handleSendMessage: activeSessionId=${activeSessionId}, text: "${text.substring(0,30)}...", model: ${modelForResponse}`);

    // 'user' is passed as sender, addMessageToSessionInternal will map it to role
    addMessageToSessionInternal(activeSessionId, text, 'user'); // modelForResponse is implicitly used by session context
    setIsAiTyping(true);

    setTimeout(() => {
      const aiResponseText = `Simulated response from ${modelForResponse} to: "${text}"`;
      // 'ai' is passed as sender, addMessageToSessionInternal will map it to role
      addMessageToSessionInternal(activeSessionId, aiResponseText, 'ai', modelForResponse);
      setIsAiTyping(false);
      logger.log(`[useMessageManager] handleSendMessage: AI response sent using model ${modelForResponse}`);
    }, 1500);
  }, [activeSessionId, persistedSessions, addMessageToSessionInternal, setIsAiTyping]);

  const regenerateResponse = useCallback(async (messageIdToRegenerate: string) => {
    if (!activeSessionId) return;
    
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      logger.error(`[useMessageManager] regenerateResponse: No current session for ${activeSessionId}`);
      return;
    }
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    // Check role for AI message
    if (messageIndex === -1 || currentSession.messages[messageIndex].role !== 'assistant') {
      logger.warn(`[useMessageManager] regenerateResponse: AI message ${messageIdToRegenerate} not found or not AI (role: ${currentSession.messages[messageIndex]?.role}).`);
      return;
    }

    const userPromptMessageIndex = messageIndex - 1;
    // Check role for user message
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].role !== 'user') {
      logger.warn(`[useMessageManager] regenerateResponse: User prompt for ${messageIdToRegenerate} not found (index: ${userPromptMessageIndex}, role: ${currentSession.messages[userPromptMessageIndex]?.role}).`);
      return;
    }
    
    // Use content for text
    const userPrompt = currentSession.messages[userPromptMessageIndex].content;
    const modelForRegeneration = currentSession.modelUsed; 
    logger.log(`[useMessageManager] regenerateResponse: For prompt "${userPrompt.substring(0,30)}..." using model ${modelForRegeneration}`);

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
      // 'ai' is passed as sender, addMessageToSessionInternal will map it to role
      addMessageToSessionInternal(activeSessionId, regeneratedResponseText, 'ai', modelForRegeneration);
      setIsAiTyping(false);
      logger.log(`[useMessageManager] regenerateResponse: AI response regenerated using model ${modelForRegeneration}`);
    }, 1500);
  }, [activeSessionId, persistedSessions, addMessageToSessionInternal, updateAndPersistSessions, setIsAiTyping]);

  const toggleSaveMessage = useCallback((messageId: string) => {
     if (!activeSessionId) return;
     logger.log(`[useMessageManager] toggleSaveMessage: messageId=${messageId} in session ${activeSessionId}`);
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
