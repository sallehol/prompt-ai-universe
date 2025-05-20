
import React, { useEffect } from 'react';
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
import { useSearchParams, Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getModelById } from '@/data/aiModels';

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const modelIdFromUrl = searchParams.get('model');
  const [isValidModelId, setIsValidModelId] = React.useState(true);
  const [attemptedModelId, setAttemptedModelId] = React.useState<string | null>(null);

  // Set a default model if none is specified or invalid
  const defaultModel = 'gpt-4o-mini';

  useEffect(() => {
    if (modelIdFromUrl) {
      setAttemptedModelId(modelIdFromUrl);
      const modelExists = getModelById(modelIdFromUrl);
      if (!modelExists) {
        setIsValidModelId(false);
      } else {
        setIsValidModelId(true);
      }
    } else {
      setIsValidModelId(true);
      setAttemptedModelId(null);
    }
  }, [modelIdFromUrl]);

  const initialModelForHook = modelIdFromUrl && isValidModelId ? modelIdFromUrl : defaultModel;

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
  } = useChatSessions(initialModelForHook);

  const isMobile = useIsMobile();

  useEffect(() => {
    const currentModelIdFromUrl = searchParams.get('model');
    // Only change model if there's a valid model ID in the URL AND we have an active session
    if (currentModelIdFromUrl && isValidModelId && activeSession) {
      // Update the model for the active session if it's different
      if (activeSession.modelUsed !== currentModelIdFromUrl) {
        updateSessionModel(activeSession.id, currentModelIdFromUrl);
      }
      
      // Remove the model parameter from URL after processing it
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('model');
      setSearchParams(newSearchParams, { replace: true });
    }
  }, [searchParams, activeSession, updateSessionModel, isValidModelId, setSearchParams]);

  // Get the current model for the active session, or use default
  const selectedModelForActiveSession = activeSession?.modelUsed || defaultModel;

  // If we have an invalid model in the URL, show error page
  if (!isValidModelId && attemptedModelId) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-deep-bg">
        <AlertCircle className="w-16 h-16 text-destructive mb-4" />
        <h2 className="text-2xl font-semibold text-light-text mb-2">Invalid Model Specified</h2>
        <p className="text-medium-text mb-6">
          The model ID "{attemptedModelId}" from the URL is not recognized.
        </p>
        <Button asChild className="bg-neon-cyan text-deep-bg hover:bg-cyan-300">
          <Link to="/models">Browse Available Models</Link>
        </Button>
      </div>
    );
  }

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
              onSelectModel={(modelId) => {
                updateSessionModel(activeSession.id, modelId);
                // Clear any model params from URL when model is changed manually
                if (searchParams.has('model')) {
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.delete('model');
                  setSearchParams(newSearchParams, { replace: true });
                }
              }}
              onRegenerateResponse={regenerateResponse}
              onToggleSaveMessage={toggleSaveMessage}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
              <div>
                <p className="mb-2 text-lg font-medium">Select or create a chat to begin.</p>
                <p className="text-sm">Start a new conversation or continue an existing one with the default model, or pick one from the catalog.</p>
              </div>
            </div>
          )}
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
};

export default ChatPage;
