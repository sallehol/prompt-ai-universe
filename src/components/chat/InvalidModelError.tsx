
import React from 'react';
import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';

interface InvalidModelErrorProps {
  modelId: string;
}

const InvalidModelError: React.FC<InvalidModelErrorProps> = ({ modelId }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center text-center p-4 bg-deep-bg">
      <AlertCircle className="w-16 h-16 text-destructive mb-4" />
      <h2 className="text-2xl font-semibold text-light-text mb-2">Invalid Model Specified</h2>
      <p className="text-medium-text mb-6">
        The model ID "{modelId}" from the URL is not recognized.
      </p>
      <Button asChild className="bg-neon-cyan text-deep-bg hover:bg-cyan-300">
        <Link to="/models">Browse Available Models</Link>
      </Button>
    </div>
  );
};

export default InvalidModelError;
