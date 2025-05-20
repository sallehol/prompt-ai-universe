
import React from 'react';

const LoadingState: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground p-4 text-center bg-deep-bg">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
      <p className="text-lg font-medium">Loading chat sessions...</p>
      <p className="text-sm opacity-70 mt-2">Please wait while we retrieve your conversations</p>
    </div>
  );
};

export default LoadingState;
