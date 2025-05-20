
import React, { useState } from 'react';
import { Session, ContentBlock } from '@/types/chat';
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

const getMessagePreviewText = (content: string | ContentBlock[]): string => {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content) && content.length > 0) {
    const textBlock = content.find(block => block.type === 'text');
    if (textBlock && typeof textBlock.content === 'string') {
      return textBlock.content;
    }
    return "[Rich content]";
  }
  return "";
};

const SessionItem: React.FC<SessionItemProps> = ({
  session,
  isActive,
  onSwitchSession,
  onRenameSession,
  onDeleteSession,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [newName, setNewName] = useState(session.name);

  const handleStartEdit = () => {
    setIsEditingName(true);
    setNewName(session.name);
  };

  const handleRename = () => {
    if (newName.trim() !== '' && newName.trim() !== session.name) {
      onRenameSession(session.id, newName.trim());
    }
    setIsEditingName(false);
  };

  let previewContent = 'No messages yet';
  if (session.messages.length > 0) {
    const lastMessage = session.messages[session.messages.length - 1];
    const rawPreview = getMessagePreviewText(lastMessage.content);
    previewContent = rawPreview ? (rawPreview.substring(0, 30) + (rawPreview.length > 30 ? '...' : '')) : "Empty message";
  }

  return (
    <Dialog open={isEditingName} onOpenChange={setIsEditingName}>
      <div
        className={cn(
          'flex items-center p-3 rounded-md hover:bg-accent cursor-pointer group mb-1 mx-1',
          isActive && 'bg-accent text-accent-foreground'
        )}
        onClick={() => onSwitchSession(session.id)}
      >
        <div className="flex-1 truncate">
          <span className={cn("truncate block text-sm", isActive && "font-medium")} title={session.name}>
            {session.name}
          </span>
          <span className={cn("text-xs truncate block", isActive ? "text-accent-foreground/80" : "text-muted-foreground")}>
            {previewContent}
          </span>
        </div>
        <div className="flex-shrink-0 space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <DialogTrigger asChild>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={(e) => { e.stopPropagation(); handleStartEdit(); }}>
              <Edit3 size={13} />
            </Button>
          </DialogTrigger>
          <Button variant="ghost" size="icon" className="h-7 w-7 hover:bg-destructive/20 hover:text-destructive" onClick={(e) => { e.stopPropagation(); onDeleteSession(session.id); }}>
            <Trash2 size={13} />
          </Button>
        </div>
      </div>
      {isEditingName && (
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
          </DialogHeader>
          <Input
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Enter new chat name"
            onKeyPress={(e) => { if (e.key === 'Enter') handleRename(); }}
          />
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" onClick={() => setIsEditingName(false)}>Cancel</Button>
            </DialogClose>
            <DialogClose asChild={newName.trim() !== '' && newName.trim() !== session.name}>
              <Button onClick={handleRename} disabled={newName.trim() === '' || newName.trim() === session.name}>Save</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      )}
    </Dialog>
  );
};

export default SessionItem;
