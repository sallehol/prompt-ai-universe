
import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { logger } from '@/utils/logger';

interface SessionListHeaderProps {
  onCreateSession: () => string;
  onSwitchSession: (sessionId: string) => void; // Added to switch after creation
}

const SessionListHeader: React.FC<SessionListHeaderProps> = ({ onCreateSession, onSwitchSession }) => {
  const handleNewChat = () => {
    logger.log('[SessionListHeader] Creating new chat...');
    const newId = onCreateSession();
    logger.log('[SessionListHeader] New chat created with ID:', newId);
    logger.log('[SessionListHeader] Switching to new chat...');
    onSwitchSession(newId);
  };

  return (
    <div className="p-3 flex-shrink-0">
      <Button
        onClick={handleNewChat}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
        variant="default"
      >
        <Plus size={16} className="stroke-[2.5px]" /> New chat
      </Button>
    </div>
  );
};

export default SessionListHeader;
