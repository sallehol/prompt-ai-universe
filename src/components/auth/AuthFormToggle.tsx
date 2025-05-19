
import React from 'react';
import { Button } from '@/components/ui/button';

interface AuthFormToggleProps {
  view: 'login' | 'signup' | 'forgotPassword';
  setView: (view: 'login' | 'signup' | 'forgotPassword') => void;
}

const AuthFormToggle: React.FC<AuthFormToggleProps> = ({ view, setView }) => {
  return (
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
  );
};

export default AuthFormToggle;
