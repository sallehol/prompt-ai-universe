import React, { useEffect } from 'react';
import ChatInterface from '@/components/chat/ChatInterface';
import SessionList from '@/components/chat/SessionList'; // ReadOnly
import { useChatSessions } from '@/hooks/useChatSessions';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarInset,
} from "@/components/ui/sidebar";
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getModelById } from '@/data/aiModels';
import { toast } from '@/hooks/use-toast'; // Import toast for notifications

const ChatPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const modelIdFromUrl = searchParams.get('model');
  const [isValidModelId, setIsValidModelId] = React.useState(true);
  const [attemptedModelId, setAttemptedModelId] = React.useState<string | null>(null);

  const defaultModel = 'gpt-4o-mini';

  useEffect(() => {
    if (modelIdFromUrl) {
      setAttemptedModelId(modelIdFromUrl);
      const modelExists = getModelById(modelIdFromUrl);
      if (!modelExists) {
        setIsValidModelId(false);
        console.log(`[ChatPage] useEffect (modelIdFromUrl): Invalid modelId "${modelIdFromUrl}" from URL.`);
      } else {
        setIsValidModelId(true);
        console.log(`[ChatPage] useEffect (modelIdFromUrl): Valid modelId "${modelIdFromUrl}" from URL.`);
      }
    } else {
      setIsValidModelId(true); 
      setAttemptedModelId(null);
    }
  }, [modelIdFromUrl]);
  
  // Handle model selection from localStorage (e.g., from a catalog page)
  useEffect(() => {
    const modelFromStorage = localStorage.getItem('selectedModelForChat');
    if (modelFromStorage && !modelIdFromUrl && isValidModelId) { // Only if no model in URL currently
      const modelExists = getModelById(modelFromStorage);
      if (modelExists) {
        console.log(`[ChatPage] Found model "${modelFromStorage}" in localStorage. Navigating to set it in URL.`);
        const newSearchParams = new URLSearchParams(searchParams);
        newSearchParams.set('model', modelFromStorage);
        navigate({ search: newSearchParams.toString() }, { replace: true });
        localStorage.removeItem('selectedModelForChat'); // Clean up after use
      } else {
        console.warn(`[ChatPage] Model "${modelFromStorage}" from localStorage is invalid. Ignoring.`);
        localStorage.removeItem('selectedModelForChat'); // Clean up invalid entry
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps 
  }, [isValidModelId, navigate]); // Run once on mount if isValidModelId is stable, or when it changes. modelIdFromUrl is intentionally omitted to allow setting it.

  const initialModelForHook = modelIdFromUrl && isValidModelId ? modelIdFromUrl : defaultModel;
  console.log(`[ChatPage] Initializing useChatSessions with model: ${initialModelForHook}`);

  const {
    sessions,
    activeSession,
    activeSessionId,
    isAiTyping,
    createSession, // Available for UI integration
    switchSession,
    renameSession,
    deleteSession,
    clearSessionMessages,
    updateSessionModel,
    handleSendMessage,
    regenerateResponse,
    toggleSaveMessage,
    isLoadingSessions,
  } = useChatSessions(initialModelForHook);

  const isMobile = useIsMobile();

  // Effect to handle model change from URL and update session
  useEffect(() => {
    if (isLoadingSessions || !activeSessionId) {
      console.log(`[ChatPage] Model Sync Effect: Waiting for sessions to load or active session. isLoading: ${isLoadingSessions}, activeSessionId: ${activeSessionId}`);
      return;
    }
    
    const currentModelIdFromUrl = searchParams.get('model'); // Re-fetch here as it might have changed
    console.log(`[ChatPage] Model Sync Effect: modelIdFromUrl=${currentModelIdFromUrl}, isValidModelId=${isValidModelId}, activeSessionId=${activeSessionId}`);

    if (currentModelIdFromUrl && isValidModelId) {
      const sessionToUpdate = sessions.find(s => s.id === activeSessionId);
      if (sessionToUpdate && sessionToUpdate.modelUsed !== currentModelIdFromUrl) {
        console.log(`[ChatPage] Model Sync Effect: Updating active session ${activeSessionId} model from ${sessionToUpdate.modelUsed} to ${currentModelIdFromUrl} from URL.`);
        updateSessionModel(activeSessionId, currentModelIdFromUrl);
        // Toast notification for model change via URL is implicitly handled if UI updates. 
        // Explicit toast is better with user interaction (see onSelectModel)
      } else if (sessionToUpdate) {
        console.log(`[ChatPage] Model Sync Effect: Active session ${activeSessionId} model ${sessionToUpdate.modelUsed} already matches URL model ${currentModelIdFromUrl}. No update needed.`);
      } else {
        console.log(`[ChatPage] Model Sync Effect: Active session ${activeSessionId} not found for URL model update.`);
      }
      
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('model');
      navigate({ search: newSearchParams.toString() }, { replace: true });
      console.log(`[ChatPage] Model Sync Effect: Removed 'model' param from URL. New search: ${newSearchParams.toString()}`);

    } else if (currentModelIdFromUrl && !isValidModelId) {
      console.log(`[ChatPage] Model Sync Effect: modelIdFromUrl ${currentModelIdFromUrl} is invalid. Error page should be shown.`);
    }
  }, [searchParams, activeSessionId, sessions, updateSessionModel, isValidModelId, isLoadingSessions, navigate, setSearchParams]);


  const selectedModelForActiveSession = activeSession?.modelUsed || defaultModel;
  
  console.log(`[ChatPage] Rendering. isLoadingSessions: ${isLoadingSessions}, activeSessionId: ${activeSessionId}, activeSession model: ${activeSession?.modelUsed}, selectedModelForActiveSession (UI): ${selectedModelForActiveSession}`);
  if (activeSession) {
    console.log(`[ChatPage] Active session details: ID=${activeSession.id}, Name=${activeSession.name}, Model=${activeSession.modelUsed}, Messages=${activeSession.messages.length}`);
  }


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
  
  // Handling loading state and no active session
  if (isLoadingSessions) {
    return (
        <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center bg-deep-bg">
            <p className="text-lg font-medium">Loading chat sessions...</p>
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
            {/* SessionList is ReadOnly, user needs to add a button to call createSession() */}
            <SessionList
              sessions={sessions}
              activeSessionId={activeSessionId}
              onCreateSession={() => {
                const newSessionId = createSession();
                console.log(`[ChatPage] User initiated new session: ${newSessionId}`);
                // Potentially switch to this new session or let useChatSessions handle it
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
                  console.log(`[ChatPage] onSelectModel: User selected ${modelId} for session ${activeSessionId}. Current model: ${activeSession.modelUsed}`);
                  updateSessionModel(activeSessionId, modelId);
                  
                  const modelDetails = getModelById(modelId);
                  toast({
                    title: "Model Updated",
                    description: `Chat model changed to ${modelDetails?.name || modelId}.`,
                    variant: "default", // Explicitly set variant for styling consistency
                  });

                } else {
                  console.error("[ChatPage] onSelectModel: No active session to update model for.");
                }
                if (searchParams.has('model')) {
                  const newSearchParams = new URLSearchParams(searchParams);
                  newSearchParams.delete('model');
                  navigate({ search: newSearchParams.toString() }, { replace: true });
                   console.log(`[ChatPage] onSelectModel: Cleared 'model' param from URL.`);
                }
              }}
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
