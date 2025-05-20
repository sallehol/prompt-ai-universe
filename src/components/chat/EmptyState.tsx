
import React from 'react';
import { MessageSquarePlus } from 'lucide-react';

const EmptyState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center bg-deep-bg">
      <div className="max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-primary/10 text-primary">
            <MessageSquarePlus size={48} />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">Select or create a chat to begin</h3>
        <p className="text-sm opacity-80">
          Start a new conversation or continue an existing one from the sidebar.
        </p>
      </div>
    </div>
  );
};

export default EmptyState;
