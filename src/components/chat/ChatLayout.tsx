
import React from 'react';
import { 
  SidebarProvider, 
  Sidebar, 
  SidebarContent, 
  SidebarInset 
} from "@/components/ui/sidebar";
import SessionList from '@/components/chat/SessionList';
import ChatInterface from '@/components/chat/ChatInterface';
import EmptyState from '@/components/chat/EmptyState';
import { Session } from '@/types/chat';
import { useIsMobile } from '@/hooks/use-mobile';
import { getModelById } from '@/data/aiModels';
import { toast } from '@/hooks/use-toast';

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
  const isMobile = useIsMobile();
  const selectedModelForActiveSession = activeSession?.modelUsed || 'gpt-4o-mini';

  return (
    <SidebarProvider defaultOpen={!isMobile}>
      <div className="flex h-[calc(100vh-var(--navbar-height,4rem))] w-full overflow-hidden">
        <Sidebar 
          collapsible="icon" 
          className="border-r border-border flex-shrink-0 data-[collapsed=true]:w-14 md:w-72 !bg-card"
        >
          <SidebarContent className="p-0 h-full">
            <SessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onCreateSession={() => {
                const newSessionId = createSession();
                console.log(`[ChatLayout] User initiated new session: ${newSessionId}`);
                return newSessionId;
              }}
              onSwitchSession={switchSession}
              onRenameSession={renameSession}
              onDeleteSession={deleteSession}
              onClearCurrentChat={activeSessionId ? () => clearSessionMessages(activeSessionId) : () => {}} 
            />
          </SidebarContent>
        </Sidebar>
        
        <SidebarInset className="flex-1 flex flex-col overflow-hidden bg-deep-bg">
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
                    variant: "default",
                  });
                } else {
                  console.error("[ChatLayout] onSelectModel: No active session to update model for.");
                }
                // Clear URL search params if present
                onClearSearchParams();
              }}
              onRegenerateResponse={regenerateResponse}
              onToggleSaveMessage={toggleSaveMessage}
            />
          ) : (
            <EmptyState />
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ChatLayout;
