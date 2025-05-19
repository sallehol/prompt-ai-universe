
import React from 'react';
import { Button } from '@/components/ui/button';
import { Github, ChromeIcon } from 'lucide-react';

interface SocialAuthButtonsProps {
  onGoogleSignIn: () => Promise<void>;
  onGitHubSignIn: () => Promise<void>;
  isLoading: boolean;
}

const SocialAuthButtons: React.FC<SocialAuthButtonsProps> = ({ onGoogleSignIn, onGitHubSignIn, isLoading }) => {
  return (
    <>
      <div className="my-4 flex items-center">
        <div className="flex-grow border-t border-border"></div>
        <span className="mx-4 text-xs text-medium-text">OR CONTINUE WITH</span>
        <div className="flex-grow border-t border-border"></div>
      </div>
      <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
        <Button variant="outline" className="w-full border-border hover:bg-accent/50 text-light-text" onClick={onGoogleSignIn} disabled={isLoading}>
          <ChromeIcon className="mr-2 h-5 w-5" /> Google
        </Button>
        <Button variant="outline" className="w-full border-border hover:bg-accent/50 text-light-text" onClick={onGitHubSignIn} disabled={isLoading}>
          <Github className="mr-2 h-5 w-5" /> GitHub
        </Button>
      </div>
    </>
  );
};

export default SocialAuthButtons;
