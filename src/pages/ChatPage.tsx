
import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import SessionList from '@/components/chat/SessionList';
import { useChatSessions } from '@/hooks/useChatSessions';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";

const ChatPage = () => {
  const {
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
  } = useChatSessions('gpt-4o-mini'); // Default model
  
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
              onCreateSession={createSession}
              onSwitchSession={switchSession}
              onRenameSession={renameSession}
              onDeleteSession={deleteSession}
              onClearCurrentChat={clearSessionMessages} 
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
              onSelectModel={(model) => updateSessionModel(activeSession.id, model)}
              onRegenerateResponse={regenerateResponse}
              onToggleSaveMessage={toggleSaveMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
              <div>
                <p className="mb-2 text-lg font-medium">Select or create a chat to begin.</p>
                <p className="text-sm">Start a new conversation or continue an existing one.</p>
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ChatPage;
