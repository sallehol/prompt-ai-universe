
import React from 'react'; // Removed useState, useRef, useEffect, useCallback as they are moved to hooks
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
// import { cn } from '@/lib/utils'; // cn is not used directly in this file after refactor
// import { toast } from '@/hooks/use-toast'; // toast is now handled by useChatToasts
import { useChatScroll } from '@/hooks/useChatScroll';
import { useChatToasts } from '@/hooks/useChatToasts';


export interface Message { // Keep this export
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  model?: string;
  isSaved?: boolean;
}

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
  const {
    scrollAreaRef,
    viewportRef,
    showScrollToBottom,
    scrollToBottom,
  } = useChatScroll(messages, isAiTyping);

  const {
    handleCopyToClipboard,
    showSaveToggleToast,
  } = useChatToasts();
  
  const handleInternalRegenerate = (messageId: string) => {
    onRegenerateResponse(messageId);
  };

  const handleInternalToggleSave = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    // Call the prop to update the actual state
    onToggleSaveMessage(messageId); 
    // Show toast based on the state *before* the toggle fully propagates from parent.
    // The useChatToasts hook handles the inverted logic.
    if (message) {
        showSaveToggleToast(message.isSaved);
    }
  };


  return (
    <div className="flex flex-col h-full bg-deep-bg text-light-text border-l border-border shadow-xl relative">
      <div className="p-4 border-b border-border flex justify-between items-center bg-card">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div ref={viewportRef} className="h-full space-y-2">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onCopyToClipboard={handleCopyToClipboard} // Use directly from hook
              onRegenerateResponse={handleInternalRegenerate}
              onToggleSaveMessage={handleInternalToggleSave}
            />
          ))}
          {isAiTyping && <TypingIndicator modelName={currentModel} />}
        </div>
      </ScrollArea>

      {showScrollToBottom && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-20 right-6 bg-card/80 hover:bg-card border-border text-light-text rounded-full z-10 animate-fade-in"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </Button>
      )}

      <MessageInput onSendMessage={onSendMessage} />
    </div>
  );
};

export default ChatInterface;
