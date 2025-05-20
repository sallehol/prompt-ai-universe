
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
  onClearCurrentChat: (sessionId: string) => void; // Added this prop
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
    const newId = onCreateSession();
    onSwitchSession(newId); // Automatically switch to the new chat
  };
  
  const handleClearChatClick = () => {
    if (activeSessionId) {
        onClearCurrentChat(activeSessionId);
    }
  };

  return (
    <div className="flex flex-col h-full p-2 bg-card border-r border-border text-sm">
      {/* More prominent New Chat button */}
      <Button 
        onClick={handleNewChat} 
        className="w-full mb-3 bg-primary hover:bg-primary/90 flex items-center justify-center gap-2"
        variant="default"
      >
        <Plus size={16} /> New Chat
      </Button>
      
      {/* Visually distinct Clear Current Chat button */}
      <Button 
        onClick={handleClearChatClick} 
        variant="outline" 
        className="w-full mb-4 border-dashed hover:bg-accent/50 flex items-center justify-center gap-2"
        disabled={!activeSessionId || sessions.find(s => s.id === activeSessionId)?.messages.length === 1} // Disable if no active session or only initial message
      >
        <Trash2 size={16} /> Clear Current Chat
      </Button>
      
      <p className="text-xs text-muted-foreground mb-1 px-1">Conversations</p>
      <ScrollArea className="flex-grow">
        {sessions.map((session) => (
          <Dialog key={session.id} onOpenChange={(open) => !open && setEditingSessionId(null)}>
            <div
              className={cn(
                'flex items-center justify-between p-2 rounded-md hover:bg-accent cursor-pointer group mb-1',
                session.id === activeSessionId && 'bg-accent text-accent-foreground'
              )}
              onClick={() => onSwitchSession(session.id)}
            >
              <div className="flex items-center truncate">
                <MessageSquareText size={16} className="mr-2 flex-shrink-0" />
                <span className="truncate" title={session.name}>{session.name}</span>
              </div>
              <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={(e) => { e.stopPropagation(); handleStartEdit(session); }}>
                    <Edit3 size={14} />
                  </Button>
                </DialogTrigger>
                <Button variant="ghost" size="icon" className="hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}>
                  <Trash2 size={14} />
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
        ))}
      </ScrollArea>
    </div>
  );
};

export default SessionList;
