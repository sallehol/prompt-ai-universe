
import { Session } from '@/types/chat';
import { useSessionMessageAdders } from './useSessionMessageAdders';
import { useSessionMessageCleaners } from './useSessionMessageCleaners';
import { useSessionMessageSelectors } from './useSessionMessageSelectors';
import { useToggleSaveMessage } from './useToggleSaveMessage';

type UpdateSessionsFn = (updater: (prevSessions: Session[]) => Session[]) => void;

interface UseSessionMessageOperationsProps {
  activeSessionId: string | null;
  persistedSessions: Session[];
  updateAndPersistSessions: UpdateSessionsFn;
}

export const useSessionMessageOperations = ({
  activeSessionId,
  persistedSessions,
  updateAndPersistSessions,
}: UseSessionMessageOperationsProps) => {
  
  const { addMessageToSession, addErrorMessageToSession } = useSessionMessageAdders({
    updateAndPersistSessions,
  });
  
  const { removeErrorMessages, truncateSessionToMessage } = useSessionMessageCleaners({
    activeSessionId,
    updateAndPersistSessions,
  });

  const { findLastUserMessageToRetry, findMessageToRegenerate } = useSessionMessageSelectors({
    activeSessionId,
    persistedSessions,
  });

  const { toggleSaveMessage } = useToggleSaveMessage({
    activeSessionId,
    updateAndPersistSessions,
  });

  return {
    addMessageToSession,
    addErrorMessageToSession,
    findLastUserMessageToRetry,
    removeErrorMessages,
    toggleSaveMessage,
    findMessageToRegenerate,
    truncateSessionToMessage,
  };
};
