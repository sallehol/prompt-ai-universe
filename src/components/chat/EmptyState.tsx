
import React, { ReactNode } from 'react';
import { MessageSquarePlus } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  message?: string;
  actionButton?: ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "Select or create a chat to begin",
  message = "Start a new conversation or continue an existing one from the sidebar.",
  actionButton 
}) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-deep-bg">
      <div className="max-w-md">
        <div className="flex justify-center mb-6">
          <div className="p-6 rounded-full bg-primary/10 text-primary">
            <MessageSquarePlus size={48} />
          </div>
        </div>
        <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>
        <p className="text-sm opacity-80 mb-4">
          {message}
        </p>
        {actionButton && (
          <div className="mt-4">
            {actionButton}
          </div>
        )}
      </div>
    </div>
  );
};

export default EmptyState;
