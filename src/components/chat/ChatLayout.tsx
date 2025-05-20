
import React from 'react';
import SessionList from '@/components/chat/SessionList';
import ChatInterface from '@/components/chat/ChatInterface';
import EmptyState from '@/components/chat/EmptyState';
import { Session, Message } from '@/types/chat'; // Added Message for ChatInterface if needed by its props
import { getModelById } from '@/data/aiModels';
import { toast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface ChatLayoutProps {
  sessions: Session[];
  activeSession: Session | null;
  activeSessionId: string | null;
  isAiTyping: boolean;
  createSession: () => string;
  switchSession: (id: string) => void;
  renameSession: (id: string, name: string) => void;
  deleteSession: (id: string) => void;
  clearSessionMessages: (id: string) => void;
  updateSessionModel: (id: string, modelId: string) => void;
  handleSendMessage: (text: string) => void;
  regenerateResponse: (messageId: string) => void;
  toggleSaveMessage: (messageId: string) => void;
  onClearSearchParams: () => void; // Kept this prop as it's used in onSelectModel logic
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  sessions,
  activeSession,
  activeSessionId,
  isAiTyping,
  createSession,
  switchSession,
  renameSession,
  deleteSession,
  clearSessionMessages,
  updateSessionModel,
  handleSendMessage,
  regenerateResponse,
  toggleSaveMessage,
  onClearSearchParams
}) => {
  const newChatButton = (
    <Button
      onClick={() => { // Ensure createSession is called and returns string for switchSession
        const newSessionId = createSession();
        // switchSession(newSessionId); // Switching is typically handled by hook effect or user action
      }}
      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground flex items-center justify-center gap-2"
      variant="default"
    >
      <Plus size={16} /> New chat
    </Button>
  );

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Sidebar with session list - RIGHT border only */}
      <div className="w-64 flex-shrink-0 h-full flex flex-col overflow-hidden border-r border-border"> {/* Changed width to w-64, added border-r */}
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateSession={createSession} // Passed directly
          onSwitchSession={switchSession}
          onRenameSession={renameSession} // Passed directly
          onDeleteSession={deleteSession} // Passed directly
          onClearCurrentChat={clearSessionMessages} // Passed directly
        />
      </div>
      
      {/* Chat area - NO left border (to avoid double borders) */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-deep-bg"> {/* Ensured bg-deep-bg if needed */}
        {activeSession ? (
          <ChatInterface
            key={activeSession.id} 
            messages={activeSession.messages}
            // Props as per user's ChatInterface snippet
            modelId={activeSession.modelUsed} 
            updateSessionModel={updateSessionModel}
            activeSessionId={activeSession.id} // Pass activeSession.id
            
            // Original props that are still needed by ChatInterface structure
            onSendMessage={handleSendMessage}
            isAiTyping={isAiTyping}
            onRegenerateResponse={regenerateResponse} // Added back
            onToggleSaveMessage={toggleSaveMessage} // Added back

            // Logic for onSelectModel is now effectively within ChatInterface using ModelSelector's onModelChange
            // The old onSelectModel from ChatLayout's props is replaced by direct passing of updateSessionModel
            // The toast and onClearSearchParams need to be handled if ModelSelector is changed or this logic moves
            // For now, ModelSelector's onModelChange will call updateSessionModel.
            // If toast/clearParams is needed on model change, it has to be called after updateSessionModel completes.
          />
        ) : (
          <EmptyState 
            title="No active chat" // Added a title for EmptyState
            message="Select an existing chat or create a new one to get started" // User's message
            actionButton={newChatButton} // User's button
          />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
