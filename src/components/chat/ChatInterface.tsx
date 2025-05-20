import React, { useRef, useEffect, useState } from 'react';
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';
import { useChatToasts } from '@/hooks/useChatToasts';
import { Message } from '@/types/chat';
import { logger } from '@/utils/logger';
import ErrorDisplay from './ErrorDisplay';
import { ApiError } from '@/api/clients/base.client'; // Import ApiError

interface ChatInterfaceProps {
  messages: Message[];
  currentModel: string;
  isAiTyping: boolean;
  isError: boolean;
  errorDetails?: ApiError | null; // Updated to use ApiError type
  onSendMessage: (text: string) => void;
  onSelectModel: (model: string) => void;
  onRegenerateResponse: (messageId: string) => void;
  onToggleSaveMessage: (messageId: string) => void;
  onRetryLastMessage?: () => void;
}

const ChatInterface = ({
  messages,
  currentModel,
  isAiTyping,
  isError,
  errorDetails, // This is now ApiError | null
  onSendMessage,
  onSelectModel,
  onRegenerateResponse,
  onToggleSaveMessage,
  onRetryLastMessage,
}: ChatInterfaceProps) => {
  logger.log(`[ChatInterface] Rendering with currentModel: ${currentModel}, number of messages: ${messages.length}, isAiTyping: ${isAiTyping}, isError: ${isError}`);
  
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
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
        showSaveToggleToast(!message.isSaved);
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-deep-bg text-light-text chat-container flex-1" style={{ minHeight: '100%' }}>
      <div className="flex-shrink-0 border-b border-border flex justify-between items-center bg-card chat-header px-4 h-[65px]">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={currentModel} onSelectModel={onSelectModel} />
      </div>

      <div 
        ref={messagesContainerRef}
        className="py-4 px-4 md:px-6 space-y-4 messages-area flex-1 overflow-y-auto"
      >
        <div className="max-w-3xl mx-auto w-full">
            {messages.map((msg) => (
              <ChatMessage
                key={msg.id}
                message={{
                  id: msg.id,
                  text: typeof msg.content === 'string' ? msg.content : 'Complex content not displayable yet.',
                  sender: msg.role === 'user' ? 'user' : 'ai',
                  timestamp: new Date(msg.timestamp),
                  isSaved: msg.isSaved,
                  model: msg.role === 'assistant' ? (msg.metadata?.model || currentModel) : undefined,
                }}
                onCopyToClipboard={handleCopyToClipboard}
                onRegenerateResponse={handleInternalRegenerate}
                onToggleSaveMessage={handleInternalToggleSave}
              />
            ))}
            {isAiTyping && !isError && <TypingIndicator modelName={currentModel} />}
            {isError && errorDetails && ( // errorDetails is now ApiError | null
              <div className="max-w-3xl mx-auto w-full px-4 md:px-0">
                <ErrorDisplay 
                  error={errorDetails} // Pass the full ApiError object
                  onRetry={onRetryLastMessage} 
                />
              </div>
            )}
            <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="flex-shrink-0 border-t border-border bg-deep-bg input-area h-[65px] w-full">
        <div className="mx-auto w-[497px] h-full flex items-center px-4 py-3">
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
              disabled={isAiTyping}
            />
            <Button
              onClick={handleSendMessageInternal}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              aria-label="Send message"
              size="icon"
              disabled={isAiTyping || inputValue.trim() === ''}
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
