
import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/components/ui/use-toast'; // Using shadcn toast
import { Github, ChromeIcon, Mail, Lock, User as UserIcon } from 'lucide-react'; // ChromeIcon for Google

const loginSchema = z.object({
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(1, { message: 'Password is required.' }),
});

const signupSchema = z.object({
  fullName: z.string().min(2, { message: 'Full name must be at least 2 characters.' }).optional(),
  email: z.string().email({ message: 'Invalid email address.' }),
  password: z.string().min(8, { message: 'Password must be at least 8 characters.' }),
  // terms: z.boolean().refine(val => val === true, { message: "You must accept the terms and conditions." }),
});

interface AuthModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initialView?: 'login' | 'signup' | 'forgotPassword';
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onOpenChange, initialView = 'login' }) => {
  const [view, setView] = useState<'login' | 'signup' | 'forgotPassword'>(initialView);
  const { signInWithPassword, signUpNewUser, signInWithGitHub, signInWithGoogle, isLoading } = useAuth();

  const loginForm = useForm<z.infer<typeof loginSchema>>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const signupForm = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' /*terms: false*/ },
  });

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
      await signUpNewUser(values.email, values.password, values.fullName);
      toast({ title: 'Signup Successful!', description: 'Please check your email to confirm your account.' });
      setView('login'); // Switch to login view after successful signup
      signupForm.reset();
    } catch (error: any) {
      toast({ title: 'Signup Failed', description: error.message, variant: 'destructive' });
    }
  };
  
  // Placeholder for forgot password
  const handleForgotPasswordRequest = async (values: { email: string }) => {
    try {
      await supabase.auth.resetPasswordForEmail(values.email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      toast({ title: 'Password Reset Email Sent', description: 'Please check your email for instructions.' });
      setView('login'); // Or a confirmation message view
    } catch (error: any) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    }
  };
  
  const forgotPasswordForm = useForm<{ email: string }>({
    resolver: zodResolver(z.object({ email: z.string().email() })),
    defaultValues: { email: '' },
  });


  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card text-card-foreground border-border">
        <DialogHeader>
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
        </DialogHeader>

        {view === 'login' && (
          <Form {...loginForm}>
            <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
              <FormField
                control={loginForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="you@example.com" {...field} className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={loginForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="password" placeholder="••••••••" {...field} className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </form>
          </Form>
        )}

        {view === 'signup' && (
          <Form {...signupForm}>
            <form onSubmit={signupForm.handleSubmit(handleSignup)} className="space-y-4">
              <FormField
                control={signupForm.control}
                name="fullName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Full Name (Optional)</FormLabel>
                    <FormControl>
                       <div className="relative">
                        <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="Your Name" {...field} className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="you@example.com" {...field} className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={signupForm.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input type="password" placeholder="Must be 8+ characters" {...field} className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan" />
                      </div>
                    </FormControl>
                    {/* Password strength indicator placeholder */}
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Terms of service placeholder */}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? 'Signing up...' : 'Create Account'}
              </Button>
            </form>
          </Form>
        )}
        
        {view === 'forgotPassword' && (
          <Form {...forgotPasswordForm}>
            <form onSubmit={forgotPasswordForm.handleSubmit(handleForgotPasswordRequest)} className="space-y-4">
              <FormField
                control={forgotPasswordForm.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Email</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input placeholder="you@example.com" {...field} className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? 'Sending...' : 'Send Reset Link'}
              </Button>
            </form>
          </Form>
        )}


        <div className="mt-4 text-center text-sm">
          {view === 'login' && (
            <>
              <p className="text-medium-text">
                Don't have an account?{' '}
                <Button variant="link" className="text-neon-cyan p-0 h-auto" onClick={() => setView('signup')}>
                  Sign up
                </Button>
              </p>
              <Button variant="link" className="text-neon-cyan p-0 h-auto mt-1" onClick={() => setView('forgotPassword')}>
                Forgot Password?
              </Button>
            </>
          )}
          {view === 'signup' && (
            <p className="text-medium-text">
              Already have an account?{' '}
              <Button variant="link" className="text-neon-cyan p-0 h-auto" onClick={() => setView('login')}>
                Login
              </Button>
            </p>
          )}
          {view === 'forgotPassword' && (
             <p className="text-medium-text">
              Remembered your password?{' '}
              <Button variant="link" className="text-neon-cyan p-0 h-auto" onClick={() => setView('login')}>
                Login
              </Button>
            </p>
          )}
        </div>

        <div className="my-4 flex items-center">
          <div className="flex-grow border-t border-border"></div>
          <span className="mx-4 text-xs text-medium-text">OR CONTINUE WITH</span>
          <div className="flex-grow border-t border-border"></div>
        </div>

        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
          <Button variant="outline" className="w-full border-border hover:bg-accent/50 text-light-text" onClick={signInWithGoogle} disabled={isLoading}>
            <ChromeIcon className="mr-2 h-5 w-5" /> Google
          </Button>
          <Button variant="outline" className="w-full border-border hover:bg-accent/50 text-light-text" onClick={signInWithGitHub} disabled={isLoading}>
            <Github className="mr-2 h-5 w-5" /> GitHub
          </Button>
        </div>
        
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
