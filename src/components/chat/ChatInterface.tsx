
import React from 'react';
import ChatMessage from './ChatMessage'; // Read-only, expects text, sender, timestamp: Date
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useChatScroll } from '@/hooks/useChatScroll'; // Will be updated
import { useChatToasts } from '@/hooks/useChatToasts';
import { Message } from '@/types/chat'; // Use standardized Message type

// Removed local Message interface definition

interface ChatInterfaceProps {
  messages: Message[]; // Now uses Message from @/types/chat
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
  
  const {
    scrollAreaRef, // This is for the Shadcn ScrollArea component itself
    viewportRef,   // This is for the direct child of ScrollArea that actually scrolls
    showScrollToBottom,
    scrollToBottom,
  } = useChatScroll(messages, isAiTyping); // Pass standardized messages

  const {
    handleCopyToClipboard,
    showSaveToggleToast,
  } = useChatToasts();
  
  const handleInternalRegenerate = (messageId: string) => {
    onRegenerateResponse(messageId);
  };

  const handleInternalToggleSave = (messageId: string) => {
    const message = messages.find(msg => msg.id === messageId);
    onToggleSaveMessage(messageId); 
    if (message) {
        showSaveToggleToast(!!message.isSaved); // Check current saved state for toast logic
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text relative">
      <div className="p-4 border-b border-border flex justify-between items-center bg-card flex-shrink-0">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      <ScrollArea className="flex-grow p-4 md:p-6" ref={scrollAreaRef}>
        <div ref={viewportRef} className="space-y-4 max-w-3xl mx-auto pb-32">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={{
                id: msg.id,
                text: msg.content, // Map content to text
                sender: msg.role === 'user' ? 'user' : 'ai', // Map role to sender
                timestamp: new Date(msg.timestamp), // Map number timestamp to Date object
                isSaved: msg.isSaved,
                model: msg.role === 'assistant' ? currentModel : undefined, // Pass currentModel if AI message
              }}
              onCopyToClipboard={handleCopyToClipboard}
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
          className="absolute bottom-28 md:bottom-28 right-6 md:right-8 bg-card/80 hover:bg-card border-border text-light-text rounded-full z-10 animate-fade-in"
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </Button>
      )}

      <div className="w-full fixed bottom-0 left-0 right-0 bg-deep-bg border-t border-border z-20 py-4 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <MessageInput onSendMessage={onSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
