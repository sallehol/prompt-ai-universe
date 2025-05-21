
import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, RefreshCw } from 'lucide-react';
import type { ApiError } from '@/api/types'; // Updated import

interface ErrorDisplayProps {
  error: ApiError;
  onRetry?: () => void;
}

// Enhanced getProviderName function that handles more edge cases
const getProviderName = (providerId: string): string => {
  if (!providerId) return 'the AI service'; // Generic fallback
  
  switch (providerId.toLowerCase()) {
    case 'openai': return 'OpenAI';
    case 'anthropic': return 'Anthropic';
    case 'mistral': return 'Mistral AI';
    case 'simulated': return 'Simulated Provider';
    // Add more user-friendly names as needed
    default: return providerId.charAt(0).toUpperCase() + providerId.slice(1); // Capitalize first letter
  }
};

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

  // Extract provider information from error data or error message
  const providerFromErrorData = error.data?.provider as string | undefined;
  let displayMessage = error.message;

  if (error.type === 'auth' && providerFromErrorData) {
    displayMessage = `API key for ${getProviderName(providerFromErrorData)} is not set or is invalid. Please add/check your API key in settings.`;
  } else if (error.type === 'auth' && error.message.includes('API key for')) {
    // Fallback if provider not in data but message implies it
    displayMessage = error.message; // Use the message as is, it might contain the provider
  }

  return (
    <div className="flex flex-col p-4 my-4 bg-destructive/10 border border-destructive/30 rounded-md">
      <div className="flex items-center gap-2 text-destructive">
        <AlertCircle className="h-5 w-5 flex-shrink-0" />
        <h3 className="font-semibold text-base">{getErrorTitle()}</h3>
      </div>
      <p className="mt-2 text-sm text-destructive/90">{displayMessage}</p>
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
