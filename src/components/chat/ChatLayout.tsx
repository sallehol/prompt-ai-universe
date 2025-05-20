
import React from 'react';
// Removed SidebarProvider and related imports if not used with direct div structure
// import { 
//   SidebarProvider, 
//   Sidebar, 
//   SidebarContent, 
//   SidebarInset 
// } from "@/components/ui/sidebar";
import SessionList from '@/components/chat/SessionList';
import ChatInterface from '@/components/chat/ChatInterface';
import EmptyState from '@/components/chat/EmptyState';
import { Session } from '@/types/chat';
// import { useIsMobile } from '@/hooks/use-mobile'; // Not used in the new simpler layout
import { getModelById } from '@/data/aiModels';
import { toast } from '@/components/ui/use-toast'; // Corrected path for toast

interface ChatLayoutProps {
  sessions: Session[];
  activeSession: Session | null;
  activeSessionId: string | null;
  isAiTyping: boolean;
  createSession: () => string; // This returns a string
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
  // const isMobile = useIsMobile(); // Not used in this simplified layout
  const selectedModelForActiveSession = activeSession?.modelUsed || 'gpt-4o-mini';

  return (
    // Using flexbox for a simple two-column layout as per user's example
    // The height `h-[calc(100vh-var(--navbar-height,4rem))]` ensures it fits below a potential navbar
    // `var(--navbar-height)` defaults to 4rem if not set.
    // If Navbar component sets this CSS variable, it will adapt. Otherwise, it's 64px.
    // From Layout.tsx, Navbar is outside, so main content area should occupy remaining height.
    // The main content in Layout.tsx is flex-grow. ChatPage is rendered in Outlet.
    // So, ChatLayout should aim for full available height within its container.
    <div className="flex h-full w-full overflow-hidden"> {/* Use h-full to take parent's height */}
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 h-full bg-card border-r border-border"> {/* Fixed width as requested */}
        <SessionList
          sessions={sessions}
          activeSessionId={activeSessionId}
          onCreateSession={() => {
            console.log(`[ChatLayout] User initiated new session from SessionList button.`);
            const newSessionId = createSession();
            // switchSession(newSessionId); // createSession in useSessionMutations already calls setActiveSessionId
            return newSessionId; // onCreateSession in SessionList expects the new ID
          }}
          onSwitchSession={switchSession}
          onRenameSession={renameSession}
          onDeleteSession={deleteSession}
          // Pass clearSessionMessages directly. SessionList will call it with activeSessionId if available.
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
          // Adjust EmptyState to match its expected prop type for onCreateSession (void return)
          <EmptyState onCreateSession={() => { createSession(); }} />
        )}
      </div>
    </div>
  );
};

export default ChatLayout;
