
import React from 'react';
import SessionList from '@/components/chat/SessionList';
import ChatInterface from '@/components/chat/ChatInterface';
import EmptyState from '@/components/chat/EmptyState';
import { Session } from '@/types/chat';
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
  onClearSearchParams: () => void;
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
  const selectedModelForActiveSession = activeSession?.modelUsed || 'gpt-4o-mini';

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Fixed width sidebar */}
      <div className="w-72 flex-shrink-0 h-full bg-card border-r border-border">
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateSession={() => {
            console.log(`[ChatLayout] User initiated new session from SessionList button.`);
            const newSessionId = createSession();
            return newSessionId;
          }}
          onSwitchSession={switchSession}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
          onClearCurrentChat={clearSessionMessages} 
        />
      </div>
      
      {/* Main chat area */}
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-deep-bg">
        {activeSession ? (
          <ChatInterface
            key={activeSession.id} 
            messages={activeSession.messages}
            currentModel={selectedModelForActiveSession}
            isAiTyping={isAiTyping}
            onSendMessage={handleSendMessage}
            onSelectModel={(modelId) => {
              if (activeSessionId) {
                console.log(`[ChatLayout] onSelectModel: User selected ${modelId} for session ${activeSessionId}. Current model: ${activeSession.modelUsed}`);
                updateSessionModel(activeSessionId, modelId);
                
                const modelDetails = getModelById(modelId);
                toast({
                  title: "Model Updated",
                  description: `Chat model changed to ${modelDetails?.name || modelId}.`,
                });
              } else {
                console.error("[ChatLayout] onSelectModel: No active session to update model for.");
              }
              onClearSearchParams();
            }}
            onRegenerateResponse={regenerateResponse}
            onToggleSaveMessage={toggleSaveMessage}
          />
        ) : (
          <EmptyState
            actionButton={
              <Button onClick={() => createSession()}>
                <Plus size={16} className="mr-2" /> Start New Chat
              </Button>
            }
          />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
