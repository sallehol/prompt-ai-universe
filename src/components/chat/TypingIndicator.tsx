
import React from 'react';
import { cn } from '@/lib/utils';

const TypingIndicator = () => {
  return (
    <div
      className={cn(
        'flex items-center space-x-1 py-3 px-4 rounded-lg mb-2 max-w-[85%] md:max-w-[75%]',
        'mr-auto bg-card/80' // Styles similar to AI message bubble
      )}
    >
      <div className="flex-shrink-0 p-2 rounded-full bg-neon-cyan/20 text-neon-cyan">
        {/* Placeholder for Bot icon, or remove if too cluttered */}
      </div>
      <div className="flex items-center space-x-1.5">
        <span className="h-2 w-2 bg-light-text/70 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="h-2 w-2 bg-light-text/70 rounded-full animate-pulse [animation-delay:-0.15s]"></span>
        <span className="h-2 w-2 bg-light-text/70 rounded-full animate-pulse"></span>
      </div>
    </div>
  );
};

export default TypingIndicator;
