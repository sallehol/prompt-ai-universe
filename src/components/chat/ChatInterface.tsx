import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  model?: string;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'ai', timestamp: new Date(), model: 'gpt-4o-mini' },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, []);

  const handleSendMessage = (text: string) => {
    if (text.trim() === '') return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);
    setIsAiTyping(true);

    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated response from ${selectedModel} to your message: "${text}"`,
        sender: 'ai',
        timestamp: new Date(),
        model: selectedModel,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      setIsAiTyping(false);
    }, 1500);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAiTyping, scrollToBottom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop <= clientHeight + 10;
      setShowScrollToBottom(!atBottom && scrollTop > 0);
    };

    viewport.addEventListener('scroll', handleScroll);
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="flex flex-col h-full bg-deep-bg text-light-text border border-border rounded-lg shadow-xl relative">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      </div>

      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        <div ref={viewportRef} className="h-full">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isAiTyping && <TypingIndicator />}
        </div>
      </ScrollArea>

      {showScrollToBottom && (
        <Button
          variant="outline"
          size="icon"
          className="absolute bottom-20 right-6 bg-card/80 hover:bg-card border-border text-light-text rounded-full z-10 animate-fade-in"
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </Button>
      )}

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatInterface;
