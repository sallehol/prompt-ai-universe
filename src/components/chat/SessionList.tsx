
import React, { useState } from 'react';
import { Session } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Plus, Edit3, Trash2, MessageSquareText } from 'lucide-react';
import { cn } from '@/lib/utils';

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
    console.log('Creating new chat...');
    console.log('Before creating new chat - Current sessions:', sessions);
    const newId = onCreateSession();
    console.log('New chat created with ID:', newId);
    // The sessions prop might not update immediately here due to state batching.
    // To see updated sessions, log inside a useEffect that depends on `sessions` in the parent component,
    // or rely on the logs within `useSessionMutations` and `useSessionPersistence`.
    console.log('Switching to new chat...');
    onSwitchSession(newId);
  };

  const handleClearChatClick = () => {
    if (activeSessionId) {
        onClearCurrentChat(activeSessionId);
    }
  };

  const isClearChatDisabled = () => {
    if (!activeSessionId) return true;
    const activeSession = sessions.find(s => s.id === activeSessionId);
    return !activeSession || (activeSession.messages.length <= 1);
  };

  return (
    <div className="flex flex-col h-full p-2 bg-card border-r border-border text-sm">
      <Button
        onClick={handleNewChat}
        className="w-full mb-3 bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
        variant="default"
      >
        <Plus size={18} className="stroke-[2.5px]" /> New Chat
      </Button>

      <p className="text-xs text-muted-foreground mt-1 mb-1 px-1">Conversations</p>
      <ScrollArea className="flex-grow mb-2">
        {sessions.map((session) => (
          <Dialog key={session.id} onOpenChange={(open) => !open && setEditingSessionId(null)}>
            <div
              className={cn(
                'flex flex-col p-2 rounded-md hover:bg-accent cursor-pointer group mb-1.5', // slightly increased mb
                session.id === activeSessionId && 'bg-accent text-accent-foreground'
              )}
              onClick={() => onSwitchSession(session.id)}
            >
              {/* Session header with title and actions */}
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center truncate">
                  <MessageSquareText size={15} className="mr-2 flex-shrink-0" />
                  <span className={cn("truncate font-medium", session.id === activeSessionId && "text-accent-foreground")} title={session.name}>
                    {session.name}
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
              
              {/* Preview of last message */}
              <div className={cn("text-xs text-muted-foreground mt-1 truncate pl-[23px]", session.id === activeSessionId && "text-accent-foreground/80")}> {/* Align with text after icon */}
                {session.messages.length > 0 
                  ? (session.messages[session.messages.length - 1].content || "Empty message").substring(0, 35) + ((session.messages[session.messages.length - 1].content || "").length > 35 ? '...' : '')
                  : 'No messages yet'}
              </div>
              {/* Timestamp */}
              <div className={cn("text-xs text-muted-foreground mt-0.5 pl-[23px]", session.id === activeSessionId && "text-accent-foreground/70")}> {/* Align with text after icon */}
                {new Date(session.lastActivityAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', hour12: false})}
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
        ))}
      </ScrollArea>

      <Button
        onClick={handleClearChatClick}
        variant="ghost"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2 mt-auto pt-2 pb-2 border-t border-border"
        disabled={isClearChatDisabled()}
        title={isClearChatDisabled() ? "Clear chat (disabled for new or empty chats)" : "Clear all messages in the current chat"}
      >
        <Trash2 size={16} /> Clear Current Chat
      </Button>
    </div>
  );
};

export default SessionList;
