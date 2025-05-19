import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

// Define SITE_URL at the module level
const SITE_URL = window.location.origin;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signInWithPassword: (email: string, pass: string) => Promise<any>;
  signUpNewUser: (email: string, pass: string, fullName?: string) => Promise<any>;
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
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      setUser(currentSession?.user ?? null);
      setIsLoading(false);
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user ?? null);
        setIsLoading(false);
        if (_event === 'PASSWORD_RECOVERY') {
          // Handle password recovery navigation if needed
          // Example: navigate('/reset-password');
        }
        // Optional: handle signed_in event for OAuth if needed for specific navigation
        // if (_event === "SIGNED_IN" && currentSession) {
        //   navigate('/profile'); // Or wherever appropriate after OAuth sign-in
        // }
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          full_name: fullName,
        },
        emailRedirectTo: SITE_URL, // Use dynamic site URL for email confirmation
      }
    });
    setIsLoading(false);
    if (error) throw error;
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
        redirectTo: SITE_URL + '/auth/callback', // Use dynamic site URL + callback path
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
        redirectTo: SITE_URL + '/auth/callback', // Use dynamic site URL + callback path
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
