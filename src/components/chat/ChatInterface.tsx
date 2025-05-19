
import React, { useState, useRef, useEffect } from 'react';
import ChatMessage from './ChatMessage';
import MessageInput from './MessageInput';
import ModelSelector from './ModelSelector';
import { ScrollArea } from '@/components/ui/scroll-area'; // Assuming you have this shadcn component

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', text: 'Hello! How can I help you today?', sender: 'ai', timestamp: new Date() },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>('gpt-4o-mini'); // Default model

  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);


  const handleSendMessage = (text: string) => {
    if (text.trim() === '') return;

    const newUserMessage: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages((prevMessages) => [...prevMessages, newUserMessage]);

    // Simulate AI response
    setTimeout(() => {
      const aiResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `This is a simulated response from ${selectedModel} to your message: "${text}"`,
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
  };

  useEffect(() => {
    // Scroll to bottom when new messages are added
    if (viewportRef.current) {
      viewportRef.current.scrollTop = viewportRef.current.scrollHeight;
    }
  }, [messages]);
  

  return (
    <div className="flex flex-col h-full bg-deep-bg text-light-text border border-border rounded-lg shadow-xl">
      <div className="p-4 border-b border-border flex justify-between items-center">
        <h2 className="text-xl font-semibold text-neon-cyan">AI Chat</h2>
        <ModelSelector selectedModel={selectedModel} onSelectModel={setSelectedModel} />
      </div>

      <ScrollArea className="flex-grow p-4 space-y-4" ref={scrollAreaRef}>
        <div ref={viewportRef} className="h-full">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
        </div>
      </ScrollArea>

      <MessageInput onSendMessage={handleSendMessage} />
    </div>
  );
};

export default ChatInterface;
