
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

export interface Message { // Keep this export if useChatSessions relies on it from here
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
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  // const [localIsAiTyping, setLocalIsAiTyping] = useState<boolean>(false); // Managed by hook now

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: behavior,
      });
    }
  }, []);

  // Use the passed isAiTyping prop
  // const handleSend = (text: string) => {
  //   onSendMessage(text); // This will trigger isAiTyping from the hook
  // };

  useEffect(() => {
    // Scroll non-smoothly for user messages and initial typing indicator
    if (isAiTyping || (messages.length > 0 && messages[messages.length - 1]?.sender === 'user')) {
      scrollToBottom('auto');
    } else if (messages.length > 0) { // Scroll smoothly for new AI messages after typing
        setTimeout(() => scrollToBottom('smooth'), 50);
    }
  }, [messages, isAiTyping, scrollToBottom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop <= clientHeight + 20;
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight);
    };

    viewport.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [messages]); // Re-check on messages change

  const handleCopyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast({
        title: "Copied to clipboard!",
        description: "The AI response has been copied.",
        duration: 3000,
      });
    }).catch(err => {
      console.error('Failed to copy text: ', err);
      toast({
        title: "Error",
        description: "Could not copy text to clipboard.",
        variant: "destructive",
        duration: 3000,
      });
    });
  };
  
  const handleInternalRegenerate = (messageId: string) => {
    // The actual regeneration logic is now in useChatSessions hook
    onRegenerateResponse(messageId);
    // Potentially show local loading state if needed, but hook manages isAiTyping
  };

  const handleInternalToggleSave = (messageId: string) => {
    onToggleSaveMessage(messageId);
    const message = messages.find(msg => msg.id === messageId);
    // Check the state *after* toggle for the correct toast message.
    // This requires a slight delay or getting the new state back if toast is critical here.
    // For simplicity, the hook doesn't return the *exact* toggled message state immediately for this toast.
    // A more robust solution might involve the hook returning the updated message or handling toast itself.
    if (message) {
        // This toast will reflect the state *before* the update propogates fully.
        // It's better if the toast source of truth is closer to the state update (i.e., in the hook or ChatPage).
        // For now, this is a known minor limitation of this toast placement.
        toast({
            title: !message.isSaved ? "Message Saved" : "Message Unsaved", // Logic inverted due to timing
            duration: 2000,
        });
    }
  };


  return (
    <div className="flex flex-col h-full bg-deep-bg text-light-text border-l border-border shadow-xl relative"> {/* Removed main border, now part of page layout */}
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
              onCopyToClipboard={handleCopyToClipboard}
              onRegenerateResponse={handleInternalRegenerate} // Use internal handler
              onToggleSaveMessage={handleInternalToggleSave} // Use internal handler
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
