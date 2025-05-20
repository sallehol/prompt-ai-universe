
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

  // Commented-out useEffect with console.log has been removed as part of cleanup.
  // If it were active, it would be:
  // useEffect(() => {
  //   if (activeSession) {
  //     logger.log(`[useChatSessions] Orchestrator: Active session ID: ${activeSession.id}, Model: ${activeSession.modelUsed}, Messages: ${activeSession.messages.length}`);
  //   } else if (!isLoadingSessions) {
  //     logger.log(`[useChatSessions] Orchestrator: No active session.`);
  //   }
  // }, [activeSession, isLoadingSessions]);


  return {
    // Session State
    sessions: sortedSessions,
    activeSession,
    activeSessionId,
    isLoadingSessions,

    // AI State
    isAiTyping: messageManagerActions.isAiTyping,

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
  };
};
