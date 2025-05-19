
import React from 'react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

interface AuthHeaderProps {
  view: 'login' | 'signup' | 'forgotPassword';
}

const AuthHeader: React.FC<AuthHeaderProps> = ({ view }) => {
  return (
    <>
      <DialogTitle className="text-2xl font-bold text-neon-cyan">
        {view === 'login' && 'Welcome Back'}
        {view === 'signup' && 'Create Your Account'}
        {view === 'forgotPassword' && 'Reset Your Password'}
      </DialogTitle>
      <DialogDescription className="text-medium-text">
        {view === 'login' && 'Access your AI dashboard.'}
        {view === 'signup' && 'Join the AI revolution.'}
        {view === 'forgotPassword' && "Enter your email to receive a reset link."}
      </DialogDescription>
    </>
  );
};

export default AuthHeader;
