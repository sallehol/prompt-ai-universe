
import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import SessionList from '@/components/chat/SessionList';
import { useChatSessions } from '@/hooks/useChatSessions';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarTrigger, // If needed for a global trigger
  SidebarInset,
} from "@/components/ui/sidebar"; // Assuming sidebar is in ui
import { PanelLeft } from 'lucide-react';

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
    clearSessionMessages, // Renamed from clearCurrentChat for clarity
    // addMessageToSession, // Not directly passed to ChatInterface, handleSendMessage will be used
    updateSessionModel,
    handleSendMessage, // Pass this to MessageInput via ChatInterface
    regenerateResponse,
    toggleSaveMessage,
  } = useChatSessions('gpt-4o-mini'); // Default model

  const selectedModelForActiveSession = activeSession?.modelUsed || 'gpt-4o-mini';

  return (
    <SidebarProvider defaultOpen>
      <div className="flex h-[calc(100vh-var(--navbar-height,4rem))]"> {/* Adjusted default navbar height assumption */}
        <Sidebar collapsible="icon" className="data-[collapsed=true]:w-14 md:w-64 !bg-card">
            <SidebarContent className="p-0"> {/* Remove padding from content if SessionList has its own */}
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
            {/* Optional: Header for ChatInterface or global sidebar trigger */}
            {/* <div className="p-2 border-b md:hidden"> <SidebarTrigger /> </div> */}
            {activeSession ? (
              <ChatInterface
                key={activeSession.id} // Important for re-rendering on session switch
                messages={activeSession.messages}
                currentModel={selectedModelForActiveSession}
                isAiTyping={isAiTyping}
                onSendMessage={handleSendMessage}
                onSelectModel={(model) => updateSessionModel(activeSession.id, model)}
                onRegenerateResponse={regenerateResponse}
                onToggleSaveMessage={toggleSaveMessage}
                // onCopyToClipboard is handled internally by ChatMessage or ChatInterface
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <p>Select or create a chat to begin.</p>
              </div>
            )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ChatPage;
