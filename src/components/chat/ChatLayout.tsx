
import React from 'react';
import SessionList from '@/components/chat/SessionList';
import ChatInterface from '@/components/chat/ChatInterface';
import EmptyState from '@/components/chat/EmptyState';
import { Session } from '@/types/chat';
import { getModelById } from '@/data/aiModels'; // getModelById might still be useful for other model details if not in modelConfig
import { toast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { logger } from '@/utils/logger';
import type { ApiError } from '@/api/types'; // Updated import
import { getModelConfig } from '@/config/modelConfig';

interface ChatLayoutProps {
  sessions: Session[];
  activeSession: Session | null;
  activeSessionId: string | null;
  isAiTyping: boolean;
  isError: boolean;
  errorDetails?: ApiError | null;
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
  onRetryLastMessage?: () => void;
}

const ChatLayout: React.FC<ChatLayoutProps> = ({
  sessions,
  activeSession,
  activeSessionId,
  isAiTyping,
  isError,
  errorDetails, // Already ApiError | null from props
  createSession,
  switchSession,
  renameSession,
  deleteSession,
  clearSessionMessages,
  updateSessionModel,
  handleSendMessage,
  regenerateResponse,
  toggleSaveMessage,
  onClearSearchParams,
  onRetryLastMessage
}) => {
  const selectedModelForActiveSession = activeSession?.modelUsed || 'gpt-4o-mini';

  return (
    <div className="flex h-full w-full overflow-hidden flex-1" style={{ minHeight: '100%' }}>
      <div className="w-[286px] h-full flex-shrink-0 bg-card border-r border-border/40 overflow-hidden flex flex-col" style={{ minHeight: '100%' }}>
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateSession={() => {
            logger.log(`[ChatLayout] User initiated new session from SessionList button.`);
            const newSessionId = createSession();
            return newSessionId;
          }}
          onSwitchSession={switchSession}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
          onClearCurrentChat={clearSessionMessages} 
        />
      </div>
      
      <div className="flex-1 h-full flex flex-col overflow-hidden bg-deep-bg" style={{ minHeight: '100%' }}>
        {activeSession ? (
          <ChatInterface
            key={activeSession.id} 
            messages={activeSession.messages}
            currentModel={selectedModelForActiveSession}
            isAiTyping={isAiTyping}
            isError={isError}
            errorDetails={errorDetails ?? undefined} // Pass the full ApiError object
            onSendMessage={handleSendMessage}
            onSelectModel={(modelId) => {
              if (activeSessionId) {
                logger.log(`[ChatLayout] onSelectModel: User selected ${modelId} for session ${activeSessionId}. Current model: ${activeSession.modelUsed}`);
                updateSessionModel(activeSessionId, modelId);
                
                const modelDetails = getModelConfig(modelId); // Use getModelConfig for display name
                toast({
                  title: "Model Updated",
                  description: `Chat model changed to ${modelDetails?.displayName || modelId}.`,
                });
              } else {
                logger.error("[ChatLayout] onSelectModel: No active session to update model for.");
              }
              onClearSearchParams();
            }}
            onRegenerateResponse={regenerateResponse}
            onToggleSaveMessage={toggleSaveMessage}
            onRetryLastMessage={onRetryLastMessage}
          />
        ) : (
          <EmptyState
            title="Select or create a chat to begin"
            message="Start a new conversation or continue an existing one from the sidebar."
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
