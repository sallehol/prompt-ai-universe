
import React from 'react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center">
      <div>
        <p className="mb-2 text-lg font-medium">Select or create a chat to begin.</p>
        <p className="text-sm">Start a new conversation or continue an existing one.</p>
      </div>
    </div>
  );
};

export default EmptyState;
