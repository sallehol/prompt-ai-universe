
import React from 'react';
import { Session } from '@/types/chat';
import SessionItem from './SessionItem';

interface SessionGroupProps {
  title: string;
  sessionsInGroup: Session[];
  activeSessionId: string | null;
  onSwitchSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SessionGroup: React.FC<SessionGroupProps> = ({
  title,
  sessionsInGroup,
  activeSessionId,
  onSwitchSession,
  onRenameSession,
  onDeleteSession,
}) => {
  if (sessionsInGroup.length === 0) return null;

  return (
    <div className="mb-3">
      <h3 className="text-xs font-semibold text-muted-foreground mb-1.5 px-3 pt-2">{title}</h3>
      {sessionsInGroup.map(session => (
        <SessionItem
          key={session.id}
          session={session}
          isActive={session.id === activeSessionId}
          onSwitchSession={onSwitchSession}
          onRenameSession={onRenameSession}
          onDeleteSession={onDeleteSession}
        />
      ))}
    </div>
  );
};

export default SessionGroup;
