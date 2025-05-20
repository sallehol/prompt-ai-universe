
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex-1 flex items-center justify-center text-muted-foreground p-4 text-center bg-deep-bg">
      <p className="text-lg font-medium">Loading chat sessions...</p>
    </div>
  );
};

export default LoadingState;
