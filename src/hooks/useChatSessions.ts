
import { useSessionPersistence } from './useSessionPersistence';
import { useActiveSessionManager } from './useActiveSessionManager';
import { useSessionMutations } from './useSessionMutations';
import { useMessageManager } from './useMessageManager';
// Removed logger import as no logs are active in this file after cleanup.
// If logs are re-added, import { logger } from '@/utils/logger';

export const useChatSessions = (initialModel: string = 'gpt-4o-mini') => {
  const {
    persistedSessions,
    updateAndPersistSessions,
    isLoadingSessions,
    initializeDefaultSessionIfNeeded,
  } = useSessionPersistence(initialModel);

  const {
    activeSessionId,
    setActiveSessionId, // Needed for useSessionMutations
    switchSession,
  } = useActiveSessionManager({
    persistedSessions,
    isLoadingSessions,
    initializeDefaultSessionIfNeeded,
  });

  const sessionMutationActions = useSessionMutations({
    updateAndPersistSessions,
    initialModel,
    activeSessionId,
    setActiveSessionId,
    persistedSessions,
  });

  const messageManagerActions = useMessageManager({
    activeSessionId,
    persistedSessions,
    updateAndPersistSessions,
  });

  const activeSession = persistedSessions.find(session => session.id === activeSessionId) || null;
  const sortedSessions = [...persistedSessions].sort((a, b) => b.lastActivityAt - a.lastActivityAt);

  return {
    // Session State
    sessions: sortedSessions,
    activeSession,
    activeSessionId,
    isLoadingSessions,

    // AI State from useMessageManager
    isAiTyping: messageManagerActions.isAiTyping,
    isError: messageManagerActions.isError, // Pass through
    errorDetails: messageManagerActions.errorDetails, // Pass through

    // Session Lifecycle Actions from useSessionMutations & useActiveSessionManager
    createSession: sessionMutationActions.createSession,
    switchSession: switchSession, // from useActiveSessionManager
    renameSession: sessionMutationActions.renameSession,
    deleteSession: sessionMutationActions.deleteSession,
    clearSessionMessages: sessionMutationActions.clearSessionMessages,
    updateSessionModel: sessionMutationActions.updateSessionModel,

    // Message Actions from useMessageManager
    handleSendMessage: messageManagerActions.handleSendMessage,
    regenerateResponse: messageManagerActions.regenerateResponse,
    toggleSaveMessage: messageManagerActions.toggleSaveMessage,
    retryLastMessage: messageManagerActions.retryLastMessage, // Pass through
  };
};
