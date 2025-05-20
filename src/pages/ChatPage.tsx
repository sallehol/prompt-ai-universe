
import React from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useUrlModelParam } from '@/hooks/useUrlModelParam';
import InvalidModelError from '@/components/chat/InvalidModelError';
import LoadingState from '@/components/chat/LoadingState';
import ChatLayout from '@/components/chat/ChatLayout';
import { logger } from '@/utils/logger';

const defaultModel = 'gpt-4o-mini';

const ChatPage = () => {
  const {
    initialModelForHook,
    isValidModelId,
    attemptedModelId,
    clearModelSearchParam
  } = useUrlModelParam(defaultModel);

  const {
    sessions,
    activeSession,
    activeSessionId,
    isAiTyping,
    isError, // New from useChatSessions
    errorDetails, // New from useChatSessions
    createSession,
    switchSession,
    renameSession,
    deleteSession,
    clearSessionMessages,
    updateSessionModel,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
    retryLastMessage, // New from useChatSessions
    isLoadingSessions,
  } = useChatSessions(initialModelForHook);

  logger.log(`[ChatPage] Rendering. isLoadingSessions: ${isLoadingSessions}, activeSessionId: ${activeSessionId}, activeSession model: ${activeSession?.modelUsed}, isError: ${isError}`);
  
  if (!isValidModelId && attemptedModelId) {
    return <InvalidModelError modelId={attemptedModelId} />;
  }
  
  if (isLoadingSessions) {
    return <LoadingState />;
  }

  return (
    <div className="h-[calc(100vh-var(--navbar-height)-var(--footer-height))] overflow-hidden flex flex-col">
      <ChatLayout
        sessions={sessions}
        activeSession={activeSession}
        activeSessionId={activeSessionId}
        isAiTyping={isAiTyping}
        isError={isError} // Pass down
        errorDetails={errorDetails} // Pass down
        createSession={createSession}
        switchSession={switchSession}
        renameSession={renameSession}
        deleteSession={deleteSession}
        clearSessionMessages={clearSessionMessages}
        updateSessionModel={updateSessionModel}
        handleSendMessage={handleSendMessage}
        regenerateResponse={regenerateResponse}
        toggleSaveMessage={toggleSaveMessage}
        onClearSearchParams={clearModelSearchParam}
        onRetryLastMessage={retryLastMessage} // Pass down
      />
    </div>
  );
};

export default ChatPage;
