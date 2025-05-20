
import React from 'react';
// Removed erroneous import: import { Message } from './ChatInterface';
import { cn } from '@/lib/utils';
import { User, Bot, Cpu, Copy, RefreshCw, Star, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { getModelById } from '@/data/aiModels';

// Local interface to define the structure of the 'message' prop AS PASSED BY ChatInterface.tsx
// This matches the object structure ChatInterface creates.
interface ChatMessageDisplayData {
  id: string;
  text: string; // Corresponds to content after mapping in ChatInterface
  sender: 'user' | 'ai'; // Corresponds to role after mapping in ChatInterface
  timestamp: Date; // Corresponds to numeric timestamp after new Date() in ChatInterface
  isSaved?: boolean;
  model?: string; // Optional model name, passed by ChatInterface for AI messages
}

interface ChatMessageProps {
  message: ChatMessageDisplayData; // Use the local interface
  onCopyToClipboard: (text: string) => void;
  onRegenerateResponse: (messageId: string) => void;
  onToggleSaveMessage: (messageId: string) => void;
}

const ChatMessage = ({ message, onCopyToClipboard, onRegenerateResponse, onToggleSaveMessage }: ChatMessageProps) => {
  // Internal logic uses 'sender' and 'text' as per ChatMessageDisplayData
  const isUser = message.sender === 'user';
  const [isCopied, setIsCopied] = React.useState(false);

  // Log based on the received props
  console.log(`[ChatMessage] Rendering ID ${message.id}, sender: ${message.sender}, model: ${message.model}, text: "${message.text.substring(0, 20)}..."`);

  const handleCopy = () => {
    onCopyToClipboard(message.text); // message.text is correct here due to ChatMessageDisplayData
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const modelDetails = message.model ? getModelById(message.model) : null;
  const displayModelName = modelDetails?.name || (message.model ? message.model.replace('gpt-4o-mini', '4o Mini').replace('gpt-4o', '4o') : 'N/A');

  return (
    <div
      className={cn(
        'group flex items-start py-4 px-5 rounded-lg relative',
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
              <div className="flex items-center text-xs text-medium-text/70 ml-2" title={`Model: ${displayModelName}`}>
                <Cpu size={12} className="mr-1" />
                <span>{displayModelName}</span>
              </div>
            )}
          </div>
          <div
            className={cn(
              'mt-1 text-sm leading-relaxed prose prose-sm prose-invert max-w-none',
               isUser ? 'text-light-text/90' : 'text-light-text/90'
            )}
          >
            {message.text} {/* Use message.text as per ChatMessageDisplayData */}
          </div>
          <div className="flex items-center justify-between mt-1">
              <p className={cn("text-xs", isUser ? "text-medium-text/70 text-right" : "text-medium-text/70")}>
                  {/* message.timestamp is already a Date object here */}
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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

