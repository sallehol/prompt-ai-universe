
import React from 'react';
import { Message } from './ChatInterface';
import { cn } from '@/lib/utils';
import { User, Bot, Cpu, Copy, RefreshCw, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ChatMessageProps {
  message: Message;
  onCopyToClipboard: (text: string) => void;
  onRegenerateResponse: (messageId: string) => void;
  onToggleSaveMessage: (messageId: string) => void;
}

const ChatMessage = ({ message, onCopyToClipboard, onRegenerateResponse, onToggleSaveMessage }: ChatMessageProps) => {
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = React.useState(false);

  const handleCopy = () => {
    onCopyToClipboard(message.text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000); // Reset icon after 2 seconds
  };

  return (
    <div
      className={cn(
        'group flex items-start py-4 px-5 rounded-lg relative', // Removed fixed width constraints
        isUser ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={cn(
          'flex items-start space-x-3 rounded-lg p-4 max-w-[85%] md:max-w-[75%]',
          isUser ? 'bg-primary/10' : 'bg-card/80'
        )}
      >
        <div className={cn(
          "flex-shrink-0 p-2 rounded-full",
          isUser ? 'bg-bright-purple/20 text-bright-purple' : 'bg-neon-cyan/20 text-neon-cyan'
        )}>
          {isUser ? <User size={20} /> : <Bot size={20} />}
        </div>
        <div className="flex flex-col min-w-0 flex-grow">
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
          <div className="flex items-center justify-between mt-1">
              <p className={cn("text-xs", isUser ? "text-medium-text/70 text-right" : "text-medium-text/70")}>
                  {message.timestamp.toLocaleTimeString()}
              </p>
              {!isUser && (
              <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <TooltipProvider>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-medium-text/80 hover:text-light-text" onClick={handleCopy} aria-label="Copy message">
                                  {isCopied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{isCopied ? 'Copied!' : 'Copy'}</p>
                          </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-medium-text/80 hover:text-light-text" onClick={() => onRegenerateResponse(message.id)} aria-label="Regenerate response">
                                  <RefreshCw size={14} />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>Regenerate</p>
                          </TooltipContent>
                      </Tooltip>
                      <Tooltip>
                          <TooltipTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-7 w-7 text-medium-text/80 hover:text-light-text" onClick={() => onToggleSaveMessage(message.id)} aria-label={message.isSaved ? "Unsave message" : "Save message"}>
                                  <Star size={14} className={cn(message.isSaved ? "fill-yellow-400 text-yellow-400" : "")} />
                              </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                              <p>{message.isSaved ? "Unsave" : "Save"}</p>
                          </TooltipContent>
                      </Tooltip>
                  </TooltipProvider>
              </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
