
import React from 'react';
import { Button } from '@/components/ui/button';
import { Trash2 } from 'lucide-react';

interface SessionListFooterProps {
  onClearCurrentChat: () => void; // Simplified: assumes active session ID is handled by parent
  isClearDisabled: boolean;
}

const SessionListFooter: React.FC<SessionListFooterProps> = ({ onClearCurrentChat, isClearDisabled }) => {
  return (
    <div className="p-3 border-t border-border/40 flex-shrink-0">
      <Button
        onClick={onClearCurrentChat}
        variant="ghost"
        className="w-full text-destructive hover:bg-destructive/10 hover:text-destructive flex items-center justify-center gap-2"
        disabled={isClearDisabled}
        title={isClearDisabled ? "Clear chat (disabled for new or empty chats)" : "Clear all messages in the current chat"}
      >
        <Trash2 size={16} /> Clear Current Chat
      </Button>
    </div>
  );
};

export default SessionListFooter;
