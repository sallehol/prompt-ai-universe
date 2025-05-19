
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { toast } from '@/components/ui/use-toast';

const AuthCallback: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;

    // First, check for errors in the hash from OAuth provider
    if (hash.includes('error_description=')) {
      const params = new URLSearchParams(hash.substring(1)); // remove #
      const errorDescription = params.get('error_description');
      toast({
        title: "OAuth Error",
        description: decodeURIComponent(errorDescription || "An unknown error occurred during authentication."),
        variant: "destructive",
      });
      navigate('/'); // Redirect to home or login page
      return;
    }

    // Supabase client v2 automatically handles session from URL hash.
    // The onAuthStateChange listener in AuthContext should pick up the new session.
    // This component's main job is to provide a UI during this brief period and then navigate.

    const checkSessionAndNavigate = async () => {
      // Attempt to get session; Supabase client might have already processed it.
      // This can confirm session availability before navigating.
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Error getting session in AuthCallback:", error.message);
        toast({ title: "Authentication Error", description: error.message, variant: "destructive" });
        navigate('/');
      } else if (session) {
        // Session is confirmed. AuthContext's onAuthStateChange will update user state.
        toast({ title: "Successfully authenticated!" });
        navigate('/profile'); // Navigate to profile page as per user's implied intent
      } else {
        // No session and no error from getSession.
        // This could mean the auth hash was invalid, expired, or already processed and cleared.
        // Or the user landed here without a valid auth hash.
        // console.warn("AuthCallback: No session found after getSession(). Potentially navigating too early or invalid hash.");
        // If there was no auth-related token in hash initially, redirect home.
        if (!hash.includes('access_token') && !hash.includes('refresh_token')) {
           navigate('/');
        } else {
            // Tokens were in hash, but no session. This is unusual.
            // Defaulting to home. The user might not be logged in.
            toast({ title: "Authentication Issue", description: "Could not establish a session. Please try logging in again.", variant: "default" });
            navigate('/');
        }
      }
    };
    
    // If auth-specific tokens are in the hash, Supabase client processes them.
    // We then check the session and navigate.
    if (hash.includes('access_token') || hash.includes('refresh_token')) {
      checkSessionAndNavigate();
    } else if (!hash.includes('error_description=')) {
      // No specific auth tokens in hash and no error, user might have landed here directly.
      // console.log("AuthCallback: No auth tokens or error in hash. Redirecting home.");
      navigate('/');
    }
    // The error_description case is handled at the top of useEffect.

  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen bg-deep-bg text-light-text">
      <div className="text-center p-6 rounded-lg shadow-xl bg-card">
        <svg className="animate-spin h-10 w-10 text-neon-cyan mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <h2 className="text-2xl font-bold mb-2 text-neon-cyan">Processing authentication...</h2>
        <p className="text-medium-text">Please wait while we complete your sign-in.</p>
      </div>
    </div>
  );
};

export default AuthCallback;

