import React, { useRef, useEffect, useState } from 'react'; // Added useState
import { SendIcon } from 'lucide-react'; // Assuming SendIcon is used or replace with Send
import ChatMessage from './ChatMessage';
import ModelSelector from './ModelSelector';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils'; // Added this import

interface ChatInterfaceProps {
  messages: any[];
  onSendMessage: (text: string) => void;
  isAiTyping: boolean;
  modelId: string;
  updateSessionModel: (sessionId: string, modelId: string) => void;
  activeSessionId: string;
  onRegenerateResponse: (messageId: string) => void;
  onToggleSaveMessage: (messageId: string) => void;
  className?: string;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  onSendMessage,
  isAiTyping,
  modelId,
  updateSessionModel,
  activeSessionId,
  onRegenerateResponse,
  onToggleSaveMessage,
  className
}) => {
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  useEffect(() => {
    scrollToBottom();
    
    if (isAiTyping) {
      const scrollInterval = setInterval(scrollToBottom, 300);
      return () => clearInterval(scrollInterval);
    }
  }, [messages, isAiTyping]);
  
  const handleSendMessageInternal = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };
  
  return (
    <div className={cn("flex flex-col h-full bg-deep-bg", className)}>
      <div className="flex-shrink-0 flex justify-end items-center p-4 border-b border-border"> {/* Changed justify-between to justify-end */}
        <div className="w-auto min-w-[150px] max-w-[250px]"> {/* Adjusted width constraints for ModelSelector */}
          <ModelSelector 
            currentModelId={modelId} 
            onModelChange={(newModelId) => updateSessionModel(activeSessionId, newModelId)} 
          />
        </div>
      </div>
      
      <div 
        ref={messagesContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-4"
      >
        {/* Make sure messages are properly typed, assuming 'any' for now */}
        {(messages as Array<{id: string; content: string; role: string; isSaved?: boolean; createdAt: number;}>).map((message) => (
          <ChatMessage 
            key={message.id} 
            message={message}
            // These props are not part of ChatMessage, pass them if ChatMessage is updated to use them
            // onRegenerate={() => onRegenerateResponse(message.id)} 
            // onToggleSave={() => onToggleSaveMessage(message.id)}
          />
        ))}
          
        <div ref={messagesEndRef} /> {/* This div is used to scroll to the bottom */}
          
        {isAiTyping && (
           <div className="flex items-center space-x-2 p-2">
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.3s]"></div>
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse [animation-delay:-0.15s]"></div>
            <div className="h-2 w-2 bg-muted-foreground rounded-full animate-pulse"></div>
            <span className="text-sm text-muted-foreground">AI is typing...</span>
          </div>
        )}
      </div>
      
      <div className="flex-shrink-0 border-t border-border p-4 bg-background">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault(); // Prevent newline on Enter
                handleSendMessageInternal();
              }
            }}
            placeholder="Type your message... (Shift+Enter for newline)"
            className="flex-1 bg-input border border-border rounded-md px-4 py-2 focus:outline-none focus:ring-1 focus:ring-primary resize-none" // Changed bg-card/50 to bg-input
            rows={1} // Start with one row, could be a textarea for multiline later
          />
          <Button
            onClick={handleSendMessageInternal}
            variant="default" 
            size="default" 
            className="p-2" 
            disabled={!inputValue.trim() || isAiTyping} // Disable if no input or AI is typing
          >
            <SendIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ChatInterface;
