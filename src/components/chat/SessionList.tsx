import React, { useState } from 'react';
import { Session, Message, ContentBlock } from '@/types/chat'; // Added ContentBlock
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { logger } from '@/utils/logger'; // Added logger import

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
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');

  const handleStartEdit = (session: Session) => {
    setEditingSessionId(session.id);
    setNewName(session.name);
  };

  const handleRename = () => {
    if (editingSessionId && newName.trim() !== '') {
      onRenameSession(editingSessionId, newName.trim());
    }
    setEditingSessionId(null);
    setNewName('');
  };

  const handleNewChat = () => {
    logger.log('[SessionList] Creating new chat via props...');
    const newId = onCreateSession();
    logger.log('[SessionList] New chat created with ID from props:', newId);
    logger.log('[SessionList] Switching to new chat via props...');
    onSwitchSession(newId);
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
    
    sessions.forEach(session => {
      const sessionDate = new Date(session.lastActivityAt); // Using lastActivityAt for grouping
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
    // Sort sessions within each group by lastActivityAt descending
    for (const key in groups) {
        groups[key as keyof typeof groups].sort((a, b) => b.lastActivityAt - a.lastActivityAt);
    }
    return groups;
  };
  
  const sessionGroups = groupSessionsByDate();

  const getMessagePreviewText = (content: string | ContentBlock[]): string => {
    if (typeof content === 'string') {
      return content;
    }
    if (Array.isArray(content) && content.length > 0) {
      const textBlock = content.find(block => block.type === 'text');
      if (textBlock && typeof textBlock.content === 'string') {
        return textBlock.content;
      }
      return "[Rich content]"; // Placeholder if no text block or text content is not string
    }
    return ""; // Return empty string if no content or unknown format
  };

  const renderSessionItem = (session: Session) => {
    let previewContent = 'No messages yet';
    if (session.messages.length > 0) {
      const lastMessage = session.messages[session.messages.length - 1];
      const rawPreview = getMessagePreviewText(lastMessage.content);
      if (rawPreview) {
        previewContent = rawPreview.substring(0, 30) + (rawPreview.length > 30 ? '...' : '');
      } else {
        previewContent = "Empty message";
      }
    }

    return (
      <Dialog key={session.id} onOpenChange={(open) => !open && setEditingSessionId(null)}>
        <div
          className={cn(
            'flex items-center p-3 rounded-md hover:bg-accent cursor-pointer group mb-1 mx-1',
            session.id === activeSessionId && 'bg-accent text-accent-foreground'
          )}
          onClick={() => onSwitchSession(session.id)}
        >
          <div className="flex-1 truncate">
            <span className={cn("truncate block text-sm", session.id === activeSessionId && "font-medium")} title={session.name}>
              {session.name}
            </span>
            <span className={cn("text-xs truncate block", session.id === activeSessionId ? "text-accent-foreground/80" : "text-muted-foreground")}>
              {previewContent}
            </span>
          </div>
          <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}>
                <Edit3 size={13} />
              </Button>
            </DialogTrigger>
            <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}>
              <Trash2 size={13} />
            </Button>
          </div>
        </div>
        {editingSessionId === session.id && (
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Chat</DialogTitle>
            </DialogHeader>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Enter new chat name"
              onKeyPress={(e) => e.key === 'Enter' && handleRename()}
            />
            <DialogFooter>
              <DialogClose asChild>
                 <Button variant="outline" onClick={() => setEditingSessionId(null)}>Cancel</Button>
              </DialogClose>
              <DialogClose asChild>
                <Button onClick={handleRename}>Save</Button>
              </DialogClose>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    );
  };
  
  const renderSessionGroup = (title: string, groupSessions: Session[]) => {
    if (groupSessions.length === 0) return null;
    
    return (
      <div className="mb-3"> {/* Reduced bottom margin for group */}
        <h3 className="text-xs font-semibold text-muted-foreground mb-1.5 px-3 pt-2">{title}</h3> {/* Adjusted padding and margin */}
        {groupSessions.map(session => renderSessionItem(session))}
      </div>
    );
  };

  const isClearChatDisabled = () => {
    if (!activeSessionId) return true;
    const activeSession = sessions.find(s => s.id === activeSessionId);
    return !activeSession || (activeSession.messages.length <= 1);
  };

  return (
    <div className="flex flex-col h-full bg-card">
      {/* Fixed header with New Chat button - removed bottom border */}
      <div className="p-3 flex-shrink-0">
        <Button
          onClick={handleNewChat}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
          variant="default"
        >
          <Plus size={16} className="stroke-[2.5px]" /> New chat
        </Button>
      </div>
      
      {/* Scrollable session list */}
      <ScrollArea className="flex-grow px-1 py-2">
        {renderSessionGroup('Today', sessionGroups.today)}
        {renderSessionGroup('Yesterday', sessionGroups.yesterday)}
        {renderSessionGroup('Previous 7 Days', sessionGroups.previous7Days)}
        {renderSessionGroup('Older', sessionGroups.older)}
        {sessions.length === 0 && (
            <p className="px-3 py-2 text-sm text-muted-foreground">No chats yet. Start a new one!</p>
        )}
      </ScrollArea>
      
      {/* Fixed footer with Clear Current Chat button - updated top border */}
      <div className="p-3 border-t border-border/40 flex-shrink-0">
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
