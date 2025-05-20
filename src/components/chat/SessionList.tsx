
import React from 'react';
import { Session } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Plus, Trash2 } from 'lucide-react';
import SessionItem from './SessionItem'; // Import the new component

interface SessionListProps {
  sessions: Session[];
  activeSessionId: string | null;
  onCreateSession: () => string; // Returns new session ID
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

  const handleNewChat = () => {
    const newSessionId = onCreateSession();
    // Assuming onCreateSession might now directly switch or the parent component handles switching
    // If direct switch is needed here: onSwitchSession(newSessionId);
    // For now, relying on the hook's behavior to switch to newly created session if activeSessionId becomes null or invalid.
  };
  
  const groupSessionsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const groups: { today: Session[], yesterday: Session[], previous7Days: Session[], older: Session[] } = {
      today: [],
      yesterday: [],
      previous7Days: [],
      older: []
    };
    
    // Ensure sessions is always an array
    const safeSessions = Array.isArray(sessions) ? sessions : [];

    safeSessions.forEach(session => {
      const sessionDate = new Date(session.lastActivityAt);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === today.getTime()) {
        groups.today.push(session);
      } else if (sessionDate.getTime() === yesterday.getTime()) {
        groups.yesterday.push(session);
      } else if (sessionDate >= weekAgo) {
        groups.previous7Days.push(session);
      } else {
        groups.older.push(session);
      }
    });

    for (const key in groups) {
        groups[key as keyof typeof groups].sort((a, b) => new Date(b.lastActivityAt).getTime() - new Date(a.lastActivityAt).getTime());
    }
    return groups;
  };
  
  const sessionGroups = groupSessionsByDate();

  const renderSessionGroup = (title: string, groupSessions: Session[]) => {
    if (groupSessions.length === 0) return null;
    
    return (
      <div className="mb-3">
        <h3 className="text-xs font-semibold text-muted-foreground mb-1.5 px-3 pt-2">{title}</h3>
        {groupSessions.map(session => (
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

  const isClearChatDisabled = () => {
    if (!activeSessionId) return true;
    const activeSess = sessions.find(s => s.id === activeSessionId);
    return !activeSess || (activeSess.messages.length === 0); // Simplified: clear if messages exist, not <=1
  };

  return (
    <div className="flex flex-col h-full bg-card"> {/* Changed from bg-sidebar to bg-card to match theme */}
      <div className="p-3 border-b border-border flex-shrink-0">
        <Button
          onClick={handleNewChat}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          variant="default"
        >
          <Plus size={16} className="stroke-[2.5px]" /> New chat
        </Button>
      </div>
      
      <ScrollArea className="flex-grow px-1 py-2">
        {/* Render sessions using the new SessionItem component */}
        {/* Re-introducing date grouping as it was in the original SessionList */}
        {renderSessionGroup('Today', sessionGroups.today)}
        {renderSessionGroup('Yesterday', sessionGroups.yesterday)}
        {renderSessionGroup('Previous 7 Days', sessionGroups.previous7Days)}
        {renderSessionGroup('Older', sessionGroups.older)}
        
        {(!sessions || sessions.length === 0) && ( // Check for null or empty
            <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet. Start a new one!</p>
        )}
      </ScrollArea>
      
      <div className="p-3 border-t border-border flex-shrink-0">
        <Button
          onClick={() => activeSessionId && onClearCurrentChat(activeSessionId)}
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
          disabled={isClearChatDisabled()}
          title={isClearChatDisabled() ? "Clear chat (disabled for new or empty chats)" : "Clear all messages in the current chat"}
        >
          <Trash2 size={16} /> Clear Current Chat
        </Button>
      </div>
    </div>
  );
};

export default SessionList;

