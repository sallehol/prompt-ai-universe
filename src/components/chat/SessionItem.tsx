
import React, { useState } from 'react';
import { Session } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Edit3, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SessionItemProps {
  session: Session;
  isActive: boolean;
  onSwitchSession: (sessionId: string) => void;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
}

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onSwitchSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(session.name);

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent switching session when clicking edit
    setNewName(session.name);
    setIsEditing(true);
  };

  const handleRename = () => {
    if (newName.trim() !== '' && newName.trim() !== session.name) {
      onRenameSession(session.id, newName.trim());
    }
    setIsEditing(false);
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent switching session when clicking delete
    onDeleteSession(session.id);
  };

  const lastMessageContent = session.messages.length > 0
    ? (session.messages[session.messages.length - 1].content || "Empty message")
    : 'No messages yet';

  return (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <div
        className={cn(
          'flex items-center p-3 rounded-md hover:bg-accent cursor-pointer group mb-1 mx-1',
          isActive && 'bg-accent text-accent-foreground'
        )}
        onClick={() => onSwitchSession(session.id)}
        title={session.name}
      >
        <div className="flex-1 truncate">
          <span className={cn("truncate block text-sm", isActive && "font-medium")}>
            {session.name}
          </span>
          <span className={cn("text-xs truncate block", isActive ? "text-accent-foreground/80" : "text-muted-foreground")}>
            {lastMessageContent.substring(0, 30) + (lastMessageContent.length > 30 ? '...' : '')}
          </span>
        </div>
        <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleStartEdit}>
              <Edit3 size={13} />
            </Button>
          </DialogTrigger>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive" onClick={handleDelete}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>

      {isEditing && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new chat name"
            onKeyPress={(e) => { if (e.key === 'Enter') { handleRename(); } }}
            autoFocus
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setIsEditing(false)}>Cancel</Button>
            </DialogClose>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SessionItem;
