
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const UserProfilePage = () => {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-light-text">Loading profile...</p></div>;
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="container mx-auto py-12 px-4 md:px-6">
      <Card className="max-w-2xl mx-auto bg-card border-border shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-neon-cyan">User Profile</CardTitle>
          <CardDescription className="text-medium-text">Manage your account and preferences.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-light-text">Personal Information</h3>
            <p className="text-medium-text"><strong>Email:</strong> {user.email}</p>
            <p className="text-medium-text"><strong>Name:</strong> {user.user_metadata?.full_name || 'Not set'}</p>
            {/* Placeholder for profile picture upload/display */}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-light-text">Subscription Details</h3>
            <p className="text-medium-text">Current Plan: Free Tier (Placeholder)</p>
            <p className="text-medium-text">Usage: 10/1000 API calls (Placeholder)</p>
            {/* Placeholder for upgrade button and more details */}
          </div>

          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-light-text">API Key Management</h3>
            <p className="text-medium-text">Your API Keys will appear here. (Placeholder)</p>
            {/* Placeholder for generating/revoking API keys */}
          </div>
          
          <div className="space-y-2">
            <h3 className="text-xl font-semibold text-light-text">Account Settings</h3>
            <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">Change Password (Placeholder)</Button>
            {/* More settings here */}
          </div>

          <Button onClick={signOut} variant="destructive" className="w-full sm:w-auto">
            Log Out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
