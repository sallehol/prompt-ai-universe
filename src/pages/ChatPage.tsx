
import React from 'react';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useUrlModelParam } from '@/hooks/useUrlModelParam';
import InvalidModelError from '@/components/chat/InvalidModelError';
import LoadingState from '@/components/chat/LoadingState';
import ChatLayout from '@/components/chat/ChatLayout';

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
    createSession,
    switchSession,
    renameSession,
    deleteSession,
    clearSessionMessages,
    updateSessionModel,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
    isLoadingSessions,
  } = useChatSessions(initialModelForHook);

  console.log(`[ChatPage] Rendering. isLoadingSessions: ${isLoadingSessions}, activeSessionId: ${activeSessionId}, activeSession model: ${activeSession?.modelUsed}`);
  
  if (!isValidModelId && attemptedModelId) {
    return <InvalidModelError modelId={attemptedModelId} />;
  }
  
  if (isLoadingSessions) {
    return <LoadingState />;
  }

  return (
    <div className="h-[calc(100vh-var(--navbar-height)-var(--footer-height)-4rem)] overflow-hidden">
      <ChatLayout
        sessions={sessions}
        activeSession={activeSession}
        activeSessionId={activeSessionId}
        isAiTyping={isAiTyping}
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
      />
    </div>
  );
};

export default ChatPage;
