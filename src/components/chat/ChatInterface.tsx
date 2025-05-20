
import React, { useRef, useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
// Removed ScrollArea and useChatScroll
// Removed MessageInput
import { Button } from '@/components/ui/button';
import { ChevronDown, Send } from 'lucide-react'; // Added Send icon
import { useChatToasts } from '@/hooks/useChatToasts';
import { Message } from '@/types/chat';

interface ChatInterfaceProps {
  messages: Message[];
  currentModel: string;
  isAiTyping: boolean;
  onSendMessage: (text: string) => void;
  onSelectModel: (model: string) => void;
  onRegenerateResponse: (messageId: string) => void;
  onToggleSaveMessage: (messageId: string) => void;
}

const ChatInterface = ({
  messages,
  currentModel,
  isAiTyping,
  onSendMessage,
  onSelectModel,
  onRegenerateResponse,
  onToggleSaveMessage,
}: ChatInterfaceProps) => {
  console.log(`[ChatInterface] Rendering with currentModel: ${currentModel}, number of messages: ${messages.length}, isAiTyping: ${isAiTyping}`);
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const {
    handleCopyToClipboard,
    showSaveToggleToast,
  } = useChatToasts();
  
  // Function to scroll to bottom (simplified from user snippet)
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };
  
  // Scroll to bottom when messages change or AI is typing (simplified from user snippet)
  useEffect(() => {
    // Auto scroll for new messages or when AI starts typing
    if (messages.length > 0 || isAiTyping) {
        // A small delay can help ensure the DOM is updated, especially for smooth scroll
        const timer = setTimeout(() => {
            // Prioritize auto scroll on user message, smooth on AI.
            const lastMessage = messages[messages.length -1];
            if (lastMessage?.role === 'user') {
                scrollToBottom('auto');
            } else {
                scrollToBottom('smooth');
            }
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
        showSaveToggleToast(!!message.isSaved); // Toggling from previous state, so !message.isSaved
    }
  };

  // Estimate header height (p-4 + content) ~60-68px. Let's use 68px.
  // Estimate input area height (p-4 + input) ~72px. Let's use 72px.
  // Total fixed height = 68px + 72px = 140px. This matches user's calc.
  const combinedFixedElementsHeight = "140px";

  return (
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text chat-container">
      {/* Fixed header */}
      <div className="flex-shrink-0 p-4 border-b border-border flex justify-between items-center bg-card">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      {/* Scrollable messages container - ONLY THIS PART SCROLLS */}
      <div 
        ref={messagesContainerRef}
        className="py-4 px-4 md:px-6 space-y-4 messages-area" // p-4 was in user snippet, current uses py-4 px-4 md:px-6
        style={{ 
          height: `calc(100% - ${combinedFixedElementsHeight})`,
          overflowY: 'auto',
        }}
      >
        <div className="max-w-3xl mx-auto w-full"> {/* Ensure messages are constrained horizontally */}
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={{
                  id: msg.id,
                  text: msg.content,
                  sender: msg.role === 'user' ? 'user' : 'ai',
                  timestamp: new Date(msg.timestamp),
                  isSaved: msg.isSaved,
                  model: msg.role === 'assistant' ? currentModel : undefined,
                }}
                onCopyToClipboard={handleCopyToClipboard}
                onRegenerateResponse={handleInternalRegenerate}
                onToggleSaveMessage={handleInternalToggleSave}
              />
            ))}
            {isAiTyping && <TypingIndicator modelName={currentModel} />}
            {/* Empty div at the end for scroll target */}
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed input area at bottom - ALWAYS VISIBLE */}
      <div className="flex-shrink-0 border-t border-border p-4 bg-deep-bg input-area">
        <div className="max-w-3xl mx-auto flex items-center gap-2"> {/* Ensure input is constrained horizontally */}
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevents newline in input if it were a textarea
                handleSendMessageInternal();
              }
            }}
            placeholder="Type your message..."
            className="flex-1 bg-card/80 border border-input rounded-md px-4 py-2 text-light-text placeholder-medium-text focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <Button
            onClick={handleSendMessageInternal}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Send message"
            size="icon"
          >
            <Send className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;

