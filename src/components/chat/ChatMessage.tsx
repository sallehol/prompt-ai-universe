
import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from './ChatInterface'; // Import the Message type
import { cn } from '@/lib/utils';
import { User, Bot } from 'lucide-react'; // Icons for user and AI

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
      <div className="flex flex-col min-w-0"> {/* Added min-w-0 to prevent overflow issues with long markdown content */}
        <p className={cn('text-sm font-medium', isUser ? 'text-light-text text-right' : 'text-light-text')}>
          {isUser ? 'You' : 'AI Model'}
        </p>
        <div
          className={cn(
            'mt-1 text-sm leading-relaxed prose prose-sm prose-invert max-w-none',
             isUser ? 'text-light-text/90' : 'text-light-text/90'
          )}
        >
          {isUser ? (
            message.text
          ) : (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.text}
            </ReactMarkdown>
          )}
        </div>
        <p className={cn("text-xs mt-1", isUser ? "text-medium-text/70 text-right" : "text-medium-text/70")}>
          {message.timestamp.toLocaleTimeString()}
        </p>
      </div>
    </div>
  );
};

export default ChatMessage;
