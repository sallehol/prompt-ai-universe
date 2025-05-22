
import { Session } from '@/types/chat';
import { useApiKeys } from './useApiKeys';
import { useAiMessageHandler } from './useAiMessageHandler';
import { useSessionMessageOperations } from './useSessionMessageOperations';

// Import the new hooks
import { useSendMessageHandler } from './useSendMessageHandler';
import { useRegenerateResponseHandler } from './useRegenerateResponseHandler';
import { useRetryMessageHandler } from './useRetryMessageHandler';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseMessageManagerProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useMessageManager = ({
  activeSessionId,
  persistedSessions,
  updateAndPersistSessions,
}: UseMessageManagerProps) => {
  const { getApiKey, isApiKeysLoaded } = useApiKeys();
  
  const { 
    isAiTyping, 
    isError, 
    errorDetails, 
    sendMessageToAi,
    resetErrorState
  } = useAiMessageHandler(); 
  
  const {
    addMessageToSession,
    addErrorMessageToSession,
    findLastUserMessageToRetry,
    removeErrorMessages,
    toggleSaveMessage,
    findMessageToRegenerate,
    truncateSessionToMessage
  } = useSessionMessageOperations({
    activeSessionId,
    persistedSessions,
    updateAndPersistSessions
  });

  const { handleSendMessage } = useSendMessageHandler({
    activeSessionId,
    persistedSessions,
    isApiKeysLoaded,
    getApiKey,
    sendMessageToAi,
    addMessageToSession,
    addErrorMessageToSession,
    resetErrorState,
  });

  const { regenerateResponse } = useRegenerateResponseHandler({
    activeSessionId,
    getApiKey,
    sendMessageToAi,
    addMessageToSession,
    addErrorMessageToSession,
    resetErrorState,
    findMessageToRegenerate,
    truncateSessionToMessage,
  });

  const { retryLastMessage } = useRetryMessageHandler({
    findLastUserMessageToRetry,
    resetErrorState,
    removeErrorMessages,
    handleSendMessage,
  });

  return {
    isAiTyping,
    isError,
    errorDetails,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
    retryLastMessage,
  };
};
