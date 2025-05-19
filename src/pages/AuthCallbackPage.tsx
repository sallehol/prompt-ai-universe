
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Assuming useAuth handles session state
import { toast } from '@/components/ui/use-toast';

const AuthCallbackPage = () => {
  const navigate = useNavigate();
  const { session, isLoading } = useAuth(); // useAuth should update when session is available

  useEffect(() => {
    // The onAuthStateChange listener in AuthContext should handle setting the session.
    // This page is mostly a loading/redirect mechanism.
    
    // If Supabase redirects with an error in the URL hash:
    const hash = window.location.hash;
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

    if (!isLoading) {
      if (session) {
        toast({ title: 'Successfully authenticated!' });
        navigate('/'); // Or to a dashboard, or intended URL
      } else {
        // This case might happen if the auth process didn't complete successfully
        // or if there's a delay in session propagation.
        // Could add a small delay or a retry mechanism, but usually onAuthStateChange handles it.
        // For now, redirecting to home if no session after loading.
        // console.log("No session after loading, redirecting from callback.");
        // navigate('/'); 
        // It's better to wait for session or error from onAuthStateChange.
        // If it's stuck here, there might be an issue in AuthContext's onAuthStateChange.
      }
    }
  }, [session, isLoading, navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-deep-bg p-4">
      <div className="text-center">
        <svg className="animate-spin h-10 w-10 text-neon-cyan mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p className="text-xl text-light-text">Authenticating, please wait...</p>
        <p className="text-medium-text">You will be redirected shortly.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;
