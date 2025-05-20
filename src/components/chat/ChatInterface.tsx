
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
        showSaveToggleToast(!!message.isSaved);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text">
      {/* Fixed header */}
      <div className="p-4 border-b border-border flex justify-between items-center bg-card flex-shrink-0">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      {/* Scrollable messages area */}
      <div className="flex-grow relative">
        <ScrollArea className="h-full py-4 px-4 md:px-6" ref={scrollAreaRef}>
          <div ref={viewportRef} className="space-y-4 max-w-3xl mx-auto">
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
          </div>
        </ScrollArea>

        {/* Scroll to bottom button */}
        {showScrollToBottom && (
          <Button
            variant="outline"
            size="icon"
            className="absolute bottom-4 right-4 bg-card/80 hover:bg-card border-border text-light-text rounded-full z-10 animate-fade-in"
            onClick={() => scrollToBottom('smooth')}
            aria-label="Scroll to bottom"
          >
            <ChevronDown size={20} />
          </Button>
        )}
      </div>

      {/* Fixed input area */}
      <div className="bg-deep-bg border-t border-border px-4 py-4 md:px-6 flex-shrink-0">
        <div className="max-w-3xl mx-auto">
          <MessageInput onSendMessage={onSendMessage} />
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
