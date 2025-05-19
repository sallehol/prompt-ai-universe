
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from '@/components/ui/use-toast';
import { useNavigate, useLocation } from 'react-router-dom';
import { Lock } from 'lucide-react';

const resetPasswordSchema = z.object({
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: "Passwords don't match.",
  path: ["confirmPassword"], // path of error
});

const ResetPasswordPage = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation(); // To check for access_token from Supabase email link

  useEffect(() => {
    // Supabase redirects here with an access_token in the URL hash after user clicks email link
    // We need to handle this if it's part of the password recovery flow (TYPE=recovery)
    // For now, this page assumes the user is here to set a new password.
    // A more robust solution would verify the token from the URL.
  }, [location]);


  const form = useForm<z.infer<typeof resetPasswordSchema>>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onSubmit = async (values: z.infer<typeof resetPasswordSchema>) => {
    setIsLoading(true);
    setMessage('');
    setError('');

    // The access token is usually in the URL fragment like #access_token=...
    // This is a simplified way to extract it. A robust app might use a library or more complex regex.
    const hash = window.location.hash;
    const params = new URLSearchParams(hash.substring(1)); // remove #
    const accessToken = params.get('access_token');

    if (!accessToken) {
        // This check is important. If user lands here without a token, they can't update password.
        // However, Supabase's onAuthStateChange handles setting the session if the token is valid.
        // The user might already be in a "recovery" session state.
        // console.warn("No access token found in URL for password reset.");
        // Let's try to update the user directly, Supabase client might have the session.
    }
    
    try {
      // If the user clicked the link in their email, Supabase handles the session.
      // We just need to update the password for the currently authenticated (in recovery) user.
      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      });

      if (updateError) throw updateError;
      
      setMessage("Your password has been successfully updated.");
      toast({ title: "Password Updated", description: "You can now log in with your new password." });
      form.reset();
      setTimeout(() => navigate('/'), 2000); // Redirect to login or home
    } catch (err: any) {
      setError(`Error: ${err.message}`);
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg p-4">
      <Card className="w-full max-w-md bg-card border-border shadow-xl">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold text-neon-cyan">Set New Password</CardTitle>
          <CardDescription className="text-medium-text">
            Enter your new password below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">New Password</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-light-text">Confirm New Password</FormLabel>
                    <FormControl>
                     <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                        <Input 
                          type="password" 
                          placeholder="••••••••" 
                          {...field} 
                          className="pl-10 bg-input text-foreground border-border focus:ring-neon-cyan"
                        />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {message && <p className="text-sm text-green-400">{message}</p>}
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Password"}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ResetPasswordPage;
