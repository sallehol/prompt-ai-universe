
import React, { useState, useRef, useEffect, useCallback } from 'react';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import TypingIndicator from './TypingIndicator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from '@/hooks/use-toast'; // Import toast

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  model?: string;
  isSaved?: boolean; // Added for save functionality
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'ai', timestamp: new Date(), model: 'gpt-4o-mini', isSaved: false },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini');
  const [isAiTyping, setIsAiTyping] = useState<boolean>(false);
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);

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

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated response from ${selectedModel} to your message: "${text}"`,
        sender: 'ai',
        timestamp: new Date(),
        model: selectedModel,
        isSaved: false,
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
      setIsAiTyping(false);
      // Scroll smoothly after AI message is added
      // Use a short timeout to ensure the message is rendered before scrolling
      setTimeout(() => scrollToBottom('smooth'), 50);
    }, 1500);
  };

  useEffect(() => {
    // Scroll non-smoothly for user messages and initial typing indicator
    if (isAiTyping || messages[messages.length -1]?.sender === 'user') {
      scrollToBottom('auto');
    }
  }, [messages, isAiTyping, scrollToBottom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Show button if not at bottom and there's content to scroll to
      const atBottom = scrollHeight - scrollTop <= clientHeight + 20; // Added a small tolerance
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight);
    };

    viewport.addEventListener('scroll', handleScroll);
    // Initial check
    handleScroll();
    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [messages]); // Re-check on messages change as scrollHeight might update

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

  const handleRegenerateResponse = (messageId: string) => {
    // Placeholder for regeneration logic
    console.log(`Regenerate response for message ID: ${messageId}`);
    const originalMessage = messages.find(msg => msg.id === messageId);
    if (originalMessage && originalMessage.sender === 'ai') {
        // For now, just simulate a new response based on the previous query structure
        // This assumes the user's message prompting this AI response is the one before it.
        const userMessageIndex = messages.findIndex(msg => msg.id === messageId) -1;
        if (userMessageIndex >= 0 && messages[userMessageIndex].sender === 'user') {
            const userPrompt = messages[userMessageIndex].text;
            setIsAiTyping(true);
            // Remove old AI response
            setMessages(prev => prev.filter(msg => msg.id !== messageId));

            setTimeout(() => {
              const regeneratedResponse: Message = {
                id: Date.now().toString(), // New ID for regenerated message
                text: `(Regenerated) This is a new simulated response from ${selectedModel} to: "${userPrompt}"`,
                sender: 'ai',
                timestamp: new Date(),
                model: selectedModel,
                isSaved: false,
              };
              setMessages((prevMessages) => [...prevMessages, regeneratedResponse]);
              setIsAiTyping(false);
              setTimeout(() => scrollToBottom('smooth'), 50);
            }, 1500);
        } else {
             toast({ title: "Cannot regenerate", description: "Original user prompt not found.", variant: "destructive" });
        }
    }
  };

  const handleToggleSaveMessage = (messageId: string) => {
    setMessages((prevMessages) =>
      prevMessages.map((msg) =>
        msg.id === messageId ? { ...msg, isSaved: !msg.isSaved } : msg
      )
    );
    const message = messages.find(msg => msg.id === messageId);
    if (message) {
        toast({
            title: message.isSaved ? "Message Unsaved" : "Message Saved",
            duration: 2000,
        });
    }
  };

  return (
    <div className="flex flex-col h-full bg-deep-bg text-light-text border border-border rounded-lg shadow-xl relative">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      </div>

      <ScrollArea className="flex-grow p-4" ref={scrollAreaRef}>
        <div ref={viewportRef} className="h-full space-y-2"> {/* Added space-y-2 for consistent message spacing */}
          {messages.map((msg) => (
            <ChatMessage
              key={msg.id}
              message={msg}
              onCopyToClipboard={handleCopyToClipboard}
              onRegenerateResponse={handleRegenerateResponse}
              onToggleSaveMessage={handleToggleSaveMessage}
            />
          ))}
          {isAiTyping && <TypingIndicator modelName={selectedModel} />}
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

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatInterface;

