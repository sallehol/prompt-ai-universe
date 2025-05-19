
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Mail, Lock, User as UserIcon } from 'lucide-react';
import { signupSchema } from './authSchemas';

interface SignupFormProps {
  onSubmit: (values: z.infer<typeof signupSchema>) => Promise<void>;
  isLoading: boolean;
}

const SignupForm: React.FC<SignupFormProps> = ({ onSubmit, isLoading }) => {
  const form = useForm<z.infer<typeof signupSchema>>({
    resolver: zodResolver(signupSchema),
    defaultValues: { fullName: '', email: '', password: '' /*terms: false*/ },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
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
          control={form.control}
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
          control={form.control}
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
  );
};

export default SignupForm;
