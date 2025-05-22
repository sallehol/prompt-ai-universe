
import { useCallback } from 'react';
import { logger } from '@/utils/logger';
import { Message } from '@/types/chat'; // Added Message type

interface UseRetryMessageHandlerProps {
  findLastUserMessageToRetry: () => { content: string; fullMessage: Message; modelId: string } | null;
  resetErrorState: () => void;
  removeErrorMessages: () => void;
  handleSendMessage: (text: string) => Promise<void>;
}

export const useRetryMessageHandler = ({
  findLastUserMessageToRetry,
  resetErrorState,
  removeErrorMessages,
  handleSendMessage,
}: UseRetryMessageHandlerProps) => {
  const retryLastMessage = useCallback(() => {
    const userMessageData = findLastUserMessageToRetry();
      
    if (userMessageData && userMessageData.content) {
      logger.log(`[useRetryMessageHandler] Retrying last user message: "${userMessageData.content.substring(0,30)}..."`);
      resetErrorState();
      removeErrorMessages();
      handleSendMessage(userMessageData.content);
    } else {
      logger.warn('[useRetryMessageHandler] retryLastMessage: No suitable user message found to retry or content is missing.');
    }
  }, [findLastUserMessageToRetry, resetErrorState, removeErrorMessages, handleSendMessage]);

  return { retryLastMessage };
};
