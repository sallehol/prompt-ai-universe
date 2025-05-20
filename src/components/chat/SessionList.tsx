
import React from 'react';
import { Session } from '@/types/chat';
import { ScrollArea } from '@/components/ui/scroll-area';
import { logger } from '@/utils/logger';

import SessionListHeader from './SessionList/SessionListHeader';
import SessionListFooter from './SessionList/SessionListFooter';
import SessionGroup from './SessionList/SessionGroup';
import { useSessionGrouping } from './SessionList/useSessionGrouping';

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onCreateSession: () => string;
  onSwitchSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
  onClearCurrentChat: (sessionId: string) => void;
}

const SessionList: React.FC<SessionListProps> = ({
  sessions,
  activeSessionId,
  onCreateSession,
  onSwitchSession,
  onRenameSession,
  onDeleteSession,
  onClearCurrentChat,
}) => {
  logger.log(`[SessionList] Rendering with ${sessions.length} sessions. Active: ${activeSessionId}`);
  const sessionGroups = useSessionGrouping(sessions);

  const handleClearCurrentChatInternal = () => {
    if (activeSessionId) {
      onClearCurrentChat(activeSessionId);
    }
  };

  const isClearChatDisabled = () => {
    if (!activeSessionId) return true;
    const activeSession = sessions.find(s => s.id === activeSessionId);
    return !activeSession || activeSession.messages.length === 0; // Simplified: only disable if no messages or if 1 message and it's system (or handle this nuance in parent)
                                                                  // For now, basic check: if messages array is empty. The old logic was activeSession.messages.length <=1.
                                                                  // Let's stick to the original logic: !activeSession || (activeSession.messages.length <= 1);
                                                                  // The parent might add a system message at the start.
  };
  
  const calculateIsClearDisabled = () => {
    if (!activeSessionId) return true;
    const activeSess = sessions.find(s => s.id === activeSessionId);
    return !activeSess || activeSess.messages.length === 0; // Changed from <=1 to ===0 to allow clearing single user message chats
  };


  return (
    <div className="flex flex-col h-full bg-card">
      <SessionListHeader onCreateSession={onCreateSession} onSwitchSession={onSwitchSession} />
      
      <ScrollArea className="flex-grow px-1 py-2">
        {renderSessionGroup('Today', sessionGroups.today)}
        {renderSessionGroup('Yesterday', sessionGroups.yesterday)}
        {renderSessionGroup('Previous 7 Days', sessionGroups.previous7Days)}
        {renderSessionGroup('Older', sessionGroups.older)}
        {sessions.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet. Start a new one!</p>
        )}
      </ScrollArea>
      
      <SessionListFooter
        onClearCurrentChat={handleClearCurrentChatInternal}
        isClearDisabled={calculateIsClearDisabled()}
      />
    </div>
  );

  // Helper to render groups, used above
  function renderSessionGroup(title: string, groupSessions: Session[]) {
    if (groupSessions.length === 0) return null;
    return (
      <SessionGroup
        title={title}
        sessionsInGroup={groupSessions}
        activeSessionId={activeSessionId}
        onSwitchSession={onSwitchSession}
        onRenameSession={onRenameSession}
        onDeleteSession={onDeleteSession}
      />
    );
  }
};

export default SessionList;
