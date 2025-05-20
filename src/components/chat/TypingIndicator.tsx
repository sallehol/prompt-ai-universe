
import React from 'react';
import { cn } from '@/lib/utils';
import { Bot, Cpu } from 'lucide-react'; // Added Cpu icon

interface TypingIndicatorProps {
  modelName?: string;
}

const TypingIndicator = ({ modelName }: TypingIndicatorProps) => {
  const displayModelName = modelName?.replace('gpt-4o-mini', '4o Mini').replace('gpt-4o', '4o');

  return (
    <div
      className={cn(
        'flex items-start space-x-3 py-3 px-4 rounded-lg mb-2 max-w-[85%] md:max-w-[75%]', // Matched ChatMessage structure
        'mr-auto bg-card/80' // Styles similar to AI message bubble
      )}
    >
      <div className="flex-shrink-0 p-2 rounded-full bg-neon-cyan/20 text-neon-cyan">
        <Bot size={20} />
      </div>
      <div className="flex flex-col min-w-0">
        <div className="flex items-center">
          <p className="text-sm font-medium text-light-text">
            AI Model
          </p>
          {displayModelName && (
            <div className="flex items-center text-xs text-medium-text/70 ml-2" title={`Model: ${displayModelName}`}>
              <Cpu size={12} className="mr-1" />
              <span>{displayModelName} is typing</span>
            </div>
          )}
        </div>
        <div className="flex items-center space-x-1.5 mt-1.5"> {/* Adjusted margin for alignment */}
          <span className="h-2 w-2 bg-light-text/70 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
          <span className="h-2 w-2 bg-light-text/70 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
          <span className="h-2 w-2 bg-light-text/70 rounded-full animate-pulse"></span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;

