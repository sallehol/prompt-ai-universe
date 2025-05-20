import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BotMessageSquare, LayoutGrid, Tags, UserCircle, LogOut, Settings, User, MessageSquare } from 'lucide-react';
import AuthModal from './AuthModal';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const Navbar = () => {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const { user, signOut, isLoading } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    // Optional: Show a toast message for successful logout
  };

  return (
    <>
      <nav className="bg-deep-bg/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link to="/" className="text-2xl font-bold text-neon-cyan hover:text-cyan-300 transition-colors">
            AI Aggregator
          </Link>
          <div className="flex items-center space-x-6">
            <NavLinkItem to="/" icon={<BotMessageSquare size={20} />} text="Home" />
            <NavLinkItem to="/models" icon={<LayoutGrid size={20} />} text="Model Catalog" />
            <NavLinkItem to="/pricing" icon={<Tags size={20} />} text="Pricing" />
            <NavLinkItem to="/chat" icon={<MessageSquare size={20} />} text="Chat" /> {/* Added Chat NavLinkItem */}
            
            {isLoading ? (
              <Button variant="ghost" className="text-medium-text" disabled>Loading...</Button>
            ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center text-medium-text hover:text-light-text transition-colors">
                    {/* Basic user icon, can be replaced with user's avatar later */}
                    <UserCircle size={24} className="mr-2" /> 
                    <span className="hidden sm:inline">{user.email}</span> {/* Or user.user_metadata.full_name */}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56 bg-card border-border text-card-foreground">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator className="bg-border" />
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer hover:bg-accent/50">
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/settings')} className="cursor-pointer hover:bg-accent/50">
                     <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span> {/* Placeholder, link to profile or dedicated settings page */}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-border"/>
                  <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer hover:bg-accent/50 text-destructive hover:text-destructive-foreground hover:bg-destructive/90">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button 
                onClick={() => setIsAuthModalOpen(true)} 
                variant="ghost" 
                className="flex items-center text-medium-text hover:text-light-text transition-colors"
              >
                <UserCircle size={20} className="mr-1" />
                Login
              </Button>
            )}
          </div>
        </div>
      </nav>
      <AuthModal isOpen={isAuthModalOpen} onOpenChange={setIsAuthModalOpen} />
    </>
  );
};

const NavLinkItem = ({ to, icon, text }: { to: string; icon: React.ReactNode; text: string }) => (
  <Link
    to={to}
    className="flex items-center text-medium-text hover:text-neon-cyan transition-colors group"
  >
    {icon}
    <span className="ml-2 group-hover:underline">{text}</span>
  </Link>
);

export default Navbar;
