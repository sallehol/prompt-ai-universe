
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<any>; // Simplified, expand later
  signUpNewUser: (email: string, pass: string, fullName?: string) => Promise<any>; // Simplified
  signOut: () => Promise<void>;
  signInWithGitHub: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);
        if (_event === 'PASSWORD_RECOVERY') {
          // Handle password recovery navigation if needed, e.g., redirect to a reset password page.
          // For now, you might navigate to a specific route.
          // Example: navigate('/reset-password'); // Ensure this route exists
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, [navigate]);

  const signInWithPassword = async (email: string, pass: string) => {
    setIsLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    setIsLoading(false);
    if (error) throw error;
    return data;
  };

  const signUpNewUser = async (email: string, pass: string, fullName?: string) => {
    setIsLoading(true);
    // Note: Supabase by default might not directly take 'fullName' in signUp.
    // It's typically stored in a separate 'profiles' table linked by user_id.
    // For now, we'll pass it as metadata if needed, or you'll handle profile creation separately.
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName, // This gets stored in auth.users.raw_user_meta_data
        }
      }
    });
    setIsLoading(false);
    if (error) throw error;
    // Typically, Supabase sends a confirmation email. You might want to show a message to the user.
    return data;
  };
  
  const signOut = async () => {
    setIsLoading(true);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsLoading(false);
    navigate('/'); // Redirect to home after logout
  };

  const signInWithGitHub = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + '/auth/callback', // Adjust if your callback path is different
      },
    });
    setIsLoading(false);
    if (error) console.error('GitHub sign-in error:', error.message);
  };

  const signInWithGoogle = async () => {
    setIsLoading(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + '/auth/callback', // Adjust if your callback path is different
      },
    });
    setIsLoading(false);
    if (error) console.error('Google sign-in error:', error.message);
  };


  const value = {
    session,
    user,
    isLoading,
    signInWithPassword,
    signUpNewUser,
    signOut,
    signInWithGitHub,
    signInWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
