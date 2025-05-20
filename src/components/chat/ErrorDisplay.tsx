
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react'; // These are in the allowed icons list

interface ErrorDisplayProps {
  error: {
    type: 'network' | 'auth' | 'request' | 'rate_limit' | 'server' | 'unknown';
    message: string;
  };
  onRetry?: () => void;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onRetry }) => {
  const getErrorTitle = () => {
    switch (error.type) {
      case 'network': return 'Network Error';
      case 'auth': return 'Authentication Error';
      case 'request': return 'Invalid Request';
      case 'rate_limit': return 'Rate Limit Exceeded';
      case 'server': return 'Server Error';
      default: return 'An Error Occurred';
    }
  };

  return (
    <div className="flex flex-col p-4 my-4 bg-destructive/10 border border-destructive/30 rounded-md">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <h3 className="font-semibold text-base">{getErrorTitle()}</h3>
      </div>
      <p className="mt-2 text-sm text-destructive/90">{error.message}</p>
      {onRetry && (
        <Button 
          onClick={onRetry}
          variant="outline"
          size="sm"
          className="mt-3 self-start flex items-center gap-2 text-destructive border-destructive/50 hover:bg-destructive/10 hover:text-destructive"
        >
          <RefreshCw className="h-4 w-4" />
          Retry
        </Button>
      )}
    </div>
  );
};

export default ErrorDisplay;
