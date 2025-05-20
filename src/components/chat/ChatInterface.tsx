
import React, { useRef, useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
// TypingIndicator component is replaced by inline JSX as per user snippet
import { Send } from 'lucide-react'; // Using Send from lucide
import { useChatToasts } from '@/hooks/useChatToasts'; // For copy/save toasts
import { Message } from '@/types/chat'; // For Message type

interface ChatInterfaceProps {
  messages: Message[];
  onSendMessage: (text: string) => void;
  isAiTyping: boolean;
  modelId: string; // From activeSession.modelUsed
  updateSessionModel: (sessionId: string, modelId: string) => void; // To be called by ModelSelector
  activeSessionId: string; // For updateSessionModel
  onRegenerateResponse: (messageId: string) => void; // Added back
  onToggleSaveMessage: (messageId: string) => void; // Added back
}

const ChatInterface = ({
  messages,
  onSendMessage,
  isAiTyping,
  modelId,
  updateSessionModel,
  activeSessionId,
  onRegenerateResponse,
  onToggleSaveMessage,
}: ChatInterfaceProps) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null); // Correctly typed

  const { handleCopyToClipboard, showSaveToggleToast } = useChatToasts();

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };
  
  useEffect(() => {
    // Auto scroll for new messages or when AI starts typing
    if (messages.length > 0 || isAiTyping) {
        const timer = setTimeout(() => {
            const lastMessage = messages[messages.length -1];
            // Use 'auto' for user messages for instant scroll, 'smooth' for AI
            scrollToBottom(lastMessage?.role === 'user' ? 'auto' : 'smooth');
        }, 100); 
        return () => clearTimeout(timer);
    }
  }, [messages, isAiTyping]);
  
  const handleSendMessageInternal = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  const handleInternalRegenerate = (messageId: string) => {
    onRegenerateResponse(messageId);
  };

  const handleInternalToggleSave = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    onToggleSaveMessage(messageId); 
    if (message) {
        // showSaveToggleToast expects the *new* saved state.
        // If message.isSaved is current state, !message.isSaved is previous state.
        // The hook useChatSessions updates isSaved, then this renders. So message.isSaved is the *new* state.
        showSaveToggleToast(message.isSaved);
    }
  };
  
  // Estimate header height (p-4 + content) ~60-68px. User uses 140px total fixed.
  // Input area height (p-4 + input) ~72px.
  // User's calc for combined fixed height is 140px.
  const combinedFixedElementsHeight = "140px"; // From user's CSS calc

  return (
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text"> {/* w-full and bg/text from existing */}
      {/* Chat header with model selector - bottom border only */}
      <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-border bg-card"> {/* Added bg-card like existing */}
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2> {/* text-neon-cyan from existing */}
        <div className="w-64"> {/* Width from user snippet */}
          <ModelSelector 
            selectedModel={modelId} // Prop renamed from currentModelId
            onSelectModel={(newModelId) => { // Prop renamed from onModelChange
              if (activeSessionId) { // Ensure activeSessionId is present
                updateSessionModel(activeSessionId, newModelId);
                // If toast for model change is needed, it should be triggered here or in ChatLayout after this call
              }
            }} 
          />
        </div>
      </div>
      
      {/* Scrollable messages container - NO borders as per user spec */}
      <div 
        ref={messagesContainerRef}
        className="flex-1 py-4 px-4 md:px-6 space-y-4" // p-4 space-y-4 from user, existing had py-4 px-4 md:px-6
        style={{ 
          height: `calc(100% - ${combinedFixedElementsHeight})`, // User's calc
          overflowY: 'auto',
          // display: 'flex', flexDirection: 'column' // Removed these as children will flow naturally
        }}
      >
        <div className="max-w-3xl mx-auto w-full"> {/* Horizontal constraint from existing */}
            {messages.map((msg) => ( // msg is already of type Message
              <ChatMessage
                key={msg.id}
                message={{ // Adapting to ChatMessage's expected prop structure
                  id: msg.id,
                  text: msg.content,
                  sender: msg.role === 'user' ? 'user' : 'ai',
                  timestamp: new Date(msg.timestamp), // Assuming timestamp is string/number
                  isSaved: msg.isSaved,
                  model: msg.role === 'assistant' ? modelId : undefined,
                }}
                onCopyToClipboard={handleCopyToClipboard}
                onRegenerateResponse={handleInternalRegenerate} // Use internal handler
                onToggleSaveMessage={handleInternalToggleSave} // Use internal handler
              />
            ))}
            
            {isAiTyping && ( // User's simpler typing indicator
              <div className="flex items-center text-muted-foreground pl-2 py-2"> {/* Minor styling for consistency */}
                <span>AI is typing</span>
                <span className="animate-pulse ml-1">...</span>
              </div>
            )}
            <div ref={messagesEndRef} /> 
        </div>
      </div>
      
      {/* Fixed input area at bottom - top border only */}
      <div className="flex-shrink-0 border-t border-border p-4 bg-deep-bg"> {/* bg-deep-bg from existing */}
        <div className="max-w-3xl mx-auto flex items-center gap-2"> {/* Horizontal constraint and gap from existing */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessageInternal();
              }
            }}
            placeholder="Type your message..."
            // Classes from user snippet, slightly merged with existing for consistency
            className="flex-1 bg-card/80 border border-input rounded-md px-4 py-2 text-light-text placeholder-medium-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button // Shadcn Button from existing
            onClick={handleSendMessageInternal}
            className="bg-primary text-primary-foreground hover:bg-primary/90" // Classes from existing
            aria-label="Send message"
            size="icon" // size="icon" from existing
          >
            <Send className="h-5 w-5" /> {/* lucide-react Send icon */}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
