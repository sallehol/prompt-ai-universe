
import React from 'react';
import { Message } from './ChatInterface';
import { cn } from '@/lib/utils';
import { User, Bot, Cpu } from 'lucide-react'; // Added Cpu icon

const ChatMessage = ({ message }: { message: Message }) => {
  const isUser = message.sender === 'user';

  return (
    <div
      className={cn(
        'flex items-start space-x-3 py-3 px-4 rounded-lg mb-2 max-w-[85%] md:max-w-[75%]',
        isUser ? 'ml-auto bg-primary/10 justify-end' : 'mr-auto bg-card/80'
      )}
    >
      <div className={cn(
        "flex-shrink-0 p-2 rounded-full",
        isUser ? 'bg-bright-purple/20 text-bright-purple' : 'bg-neon-cyan/20 text-neon-cyan'
      )}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>
      <div className="flex flex-col min-w-0">
        <div className={cn("flex items-center", isUser ? "justify-end" : "justify-start")}>
          <p className={cn('text-sm font-medium', isUser ? 'text-light-text' : 'text-light-text')}>
            {isUser ? 'You' : 'AI Model'}
          </p>
          {!isUser && message.model && (
            <div className="flex items-center text-xs text-medium-text/70 ml-2" title={`Model: ${message.model}`}>
              <Cpu size={12} className="mr-1" />
              <span>{message.model.replace('gpt-4o-mini', '4o Mini').replace('gpt-4o', '4o')}</span>
            </div>
          )}
        </div>
        <div
          className={cn(
            'mt-1 text-sm leading-relaxed prose prose-sm prose-invert max-w-none',
             isUser ? 'text-light-text/90' : 'text-light-text/90'
          )}
        >
          {message.text}
        </div>
        <p className={cn("text-xs mt-1", isUser ? "text-medium-text/70 text-right" : "text-medium-text/70")}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
