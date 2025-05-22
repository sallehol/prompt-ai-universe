
import { useCallback } from 'react';
import { Session, Message } from '@/types/chat';
import { logger } from '@/utils/logger';

interface UseSessionMessageSelectorsProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
}

export const useSessionMessageSelectors = ({
  activeSessionId,
  persistedSessions,
}: UseSessionMessageSelectorsProps) => {
  const findLastUserMessageToRetry = useCallback(() => {
    if (!activeSessionId) return null;
    
    const activeSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!activeSession || activeSession.messages.length === 0) return null;
    
    let lastUserMessageContent: string | null = null;
    let lastUserMessage: Message | null = null;
    
    for (let i = activeSession.messages.length - 1; i >= 0; i--) {
      const msg = activeSession.messages[i];
      if (msg.role === 'user') {
        const nextMsg = activeSession.messages[i+1];
        if (!nextMsg || (nextMsg.role === 'assistant' && nextMsg.status === 'error')) {
          lastUserMessage = msg;
          if(typeof msg.content === 'string') {
            lastUserMessageContent = msg.content;
          } else {
            const textBlock = msg.content.find(block => block.type === 'text');
            if (textBlock) lastUserMessageContent = textBlock.content;
          }
          break; 
        }
      }
    }
    
    if (lastUserMessage && lastUserMessageContent !== null) {
      return {
        content: lastUserMessageContent,
        fullMessage: lastUserMessage,
        modelId: activeSession.modelUsed
      };
    }
    
    return null;
  }, [activeSessionId, persistedSessions]);
  
  const findMessageToRegenerate = useCallback((messageIdToRegenerate: string) => {
    if (!activeSessionId) return null;
    
    const currentSession = persistedSessions.find(s => s.id === activeSessionId);
    if (!currentSession) {
      logger.error(`[useSessionMessageSelectors] findMessageToRegenerate: No current session for ${activeSessionId}`);
      return null;
    }
    
    const messageIndex = currentSession.messages.findIndex(msg => msg.id === messageIdToRegenerate);
    
    if (messageIndex === -1 || currentSession.messages[messageIndex].role !== 'assistant' || currentSession.messages[messageIndex].status === 'error') {
      logger.warn(`[useSessionMessageSelectors] findMessageToRegenerate: AI message ${messageIdToRegenerate} not found, not AI, or is an error message.`);
      return null;
    }

    const userPromptMessageIndex = messageIndex - 1;
    if (userPromptMessageIndex < 0 || currentSession.messages[userPromptMessageIndex].role !== 'user') {
      logger.warn(`[useSessionMessageSelectors] findMessageToRegenerate: User prompt for AI message ${messageIdToRegenerate} not found at index ${userPromptMessageIndex}.`);
      return null;
    }
    
    const userPromptMsg = currentSession.messages[userPromptMessageIndex];
    let userPromptContentForResend: Message['content'] = userPromptMsg.content;
        
    if (!userPromptContentForResend || (typeof userPromptContentForResend === 'string' && userPromptContentForResend.trim() === "") || (Array.isArray(userPromptContentForResend) && userPromptContentForResend.length === 0) ) {
      logger.warn(`[useSessionMessageSelectors] findMessageToRegenerate: User prompt content is empty or invalid.`);
      return null;
    }
    
    const historyForResend = currentSession.messages.slice(0, userPromptMessageIndex + 1);
    
    logger.log(`[useSessionMessageSelectors] findMessageToRegenerate: Found user prompt for AI message ${messageIdToRegenerate}. User message index: ${userPromptMessageIndex}. Model: ${currentSession.modelUsed}. History length for resend: ${historyForResend.length}`);

    return { 
      messageToRegenerateId: messageIdToRegenerate,
      userPromptMessage: userPromptMsg,
      historyForResend,
      modelId: currentSession.modelUsed,
      messageIndexOfAiResponse: messageIndex
    };
  }, [activeSessionId, persistedSessions]);

  return {
    findLastUserMessageToRetry,
    findMessageToRegenerate,
  };
};
