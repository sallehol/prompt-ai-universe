
import React, { useRef, useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useChatToasts } from '@/hooks/useChatToasts';
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';

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
  logger.log(`[ChatInterface] Rendering with currentModel: ${currentModel}, number of messages: ${messages.length}, isAiTyping: ${isAiTyping}`);
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // messagesContainerRef is kept for potential future use, but not for height calculation
  const messagesContainerRef = useRef<HTMLDivElement>(null); 

  const {
    handleCopyToClipboard,
    showSaveToggleToast,
  } = useChatToasts();
  
  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior });
    }
  };
  
  useEffect(() => {
    if (messages.length > 0 || isAiTyping) {
        const timer = setTimeout(() => {
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
        showSaveToggleToast(!!message.isSaved);
    }
  };

  // combinedFixedElementsHeight constant is no longer needed as messages area uses flex-1.

  return (
    // Added flex-1 to make this component fill available space from ChatLayout
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text chat-container flex-1" style={{ minHeight: '100%' }}>
      {/* Fixed header with precise border and explicit height */}
      <div className="flex-shrink-0 border-b border-border flex justify-between items-center bg-card chat-header px-4 h-[65px]">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      {/* Scrollable messages container - uses flex-1 to fill space, overflow-y for scrolling */}
      <div 
        ref={messagesContainerRef}
        className="py-4 px-4 md:px-6 space-y-4 messages-area flex-1 overflow-y-auto"
        // Removed inline style for height calculation, minHeight: '0' is implicitly handled by flex-1 in a flex-col parent
      >
        <div className="max-w-3xl mx-auto w-full">
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
            <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed input area - outer div is full-width for the border, inner div centers content */}
      <div className="flex-shrink-0 border-t border-border bg-deep-bg input-area h-[65px] w-full">
        {/* This inner div centers the input elements and applies padding */}
        <div className="mx-auto w-[497px] h-full flex items-center px-4 py-3"> {/* Added flex items-center */}
          <div className="w-full flex items-center gap-2">
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
    </div>
  );
};

export default ChatInterface;
