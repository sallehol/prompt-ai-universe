
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast';
import { supabase } from '@/lib/supabaseClient';

import AuthHeader from './auth/AuthHeader';
import LoginForm from './auth/LoginForm';
import SignupForm from './auth/SignupForm';
import ForgotPasswordForm from './auth/ForgotPasswordForm';
import SocialAuthButtons from './auth/SocialAuthButtons';
import AuthFormToggle from './auth/AuthFormToggle';
import { loginSchema, signupSchema, forgotPasswordSchema } from './auth/authSchemas'; // For type inference
import * as z from 'zod'; // Required for z.infer

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: 'login' | 'signup' | 'forgotPassword';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onOpenChange, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>(initialView);
  const { signInWithPassword, signUpNewUser, signInWithGitHub, signInWithGoogle, isLoading } = useAuth();

  const handleLogin = async (values: z.infer<typeof loginSchema>) => {
    try {
      await signInWithPassword(values.email, values.password);
      toast({ title: 'Logged in successfully!' });
      onOpenChange(false);
    } catch (error: any) {
      toast({ title: 'Login Failed', description: error.message, variant: 'destructive' });
    }
  };

  const handleSignup = async (values: z.infer<typeof signupSchema>) => {
    try {
      // We need to access form.reset() here if we move the form instance out.
      // For now, we assume signupForm.reset() was part of the original SignupForm and can be called there after onSubmit.
      // Or, the onSubmit in SignupForm can handle the reset internally.
      // The current SignupForm component handles its own form and reset.
      await signUpNewUser(values.email, values.password, values.fullName);
      toast({ title: 'Signup Successful!', description: 'Please check your email to confirm your account.' });
      setView('login'); // Switch to login view after successful signup
    } catch (error: any) {
      toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
    }
  };
  
  const handleForgotPasswordRequest = async (values: z.infer<typeof forgotPasswordSchema>) => {
    try {
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast({ title: 'Password Reset Email Sent', description: 'Please check your email for instructions.' });
      setView('login'); 
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
          <AuthHeader view={view} />
        </DialogHeader>

        {view === 'login' && (
          <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
        )}

        {view === 'signup' && (
          <SignupForm onSubmit={handleSignup} isLoading={isLoading} />
        )}
        
        {view === 'forgotPassword' && (
          <ForgotPasswordForm onSubmit={handleForgotPasswordRequest} isLoading={isLoading} />
        )}

        <AuthFormToggle view={view} setView={setView} />
        
        <SocialAuthButtons 
          onGoogleSignIn={signInWithGoogle} 
          onGitHubSignIn={signInWithGitHub} 
          isLoading={isLoading} 
        />
        
        <DialogFooter className="sm:justify-start mt-4">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="text-medium-text hover:text-light-text">
                Close
              </Button>
            </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;

