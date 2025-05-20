
import React from 'react';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { useChatScroll } from '@/hooks/useChatScroll';
import { useChatToasts } from '@/hooks/useChatToasts';

export interface Message {
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
  console.log(`[ChatInterface] Rendering with currentModel: ${currentModel}, number of messages: ${messages.length}, isAiTyping: ${isAiTyping}`);
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
    onToggleSaveMessage(messageId); 
    if (message) {
        // Note: This will show the toast based on the state *before* toggle
        // To show based on new state, the logic would need to be in useMessageManager or ChatPage
        showSaveToggleToast(message.isSaved); 
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text relative">
      {/* Header with model selector */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-card flex-shrink-0">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      {/* Message area with scroll */}
      <ScrollArea className="flex-grow p-4 md:p-6 overflow-y-auto" ref={scrollAreaRef}>
        {/* Increased bottom padding to 32 (8rem) to ensure last message is not hidden by the input area */}
        <div ref={viewportRef} className="space-y-4 max-w-3xl mx-auto pb-32">
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onCopyToClipboard={handleCopyToClipboard}
              onRegenerateResponse={handleInternalRegenerate}
              onToggleSaveMessage={handleInternalToggleSave}
            />
          ))}
          {isAiTyping && <TypingIndicator modelName={currentModel} />}
        </div>
      </ScrollArea>

      {/* Scroll to bottom button */}
      {showScrollToBottom && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-28 md:bottom-28 right-6 md:right-8 bg-card/80 hover:bg-card border-border text-light-text rounded-full z-10 animate-fade-in" // Adjusted bottom position for better placement above input
          onClick={() => scrollToBottom('smooth')}
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </Button>
      )}

      {/* Message input area - Using fixed positioning to ensure it's always visible */}
      <div className="w-full fixed bottom-0 left-0 right-0 bg-deep-bg border-t border-border z-20 py-4 px-4 md:px-6">
        <div className="max-w-3xl mx-auto">
          <MessageInput onSendMessage={onSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
