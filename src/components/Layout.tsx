
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar'; // Assuming Navbar is in the same directory
import React from 'react';

const Layout = () => { // Renaming to MainLayout as per user's example context if this was a new file, but it's an update to existing Layout.tsx
  return (
    <div 
      className="flex flex-col h-screen overflow-hidden" // Changed from min-h-screen
      // style={{ "--navbar-height": "4rem" } as React.CSSProperties} // Navbar height might be handled differently now
    >
      {/* Fixed header - always visible */}
      <div className="flex-shrink-0 border-b border-border"> {/* Applied border-b as per user spec */}
        <Navbar />
      </div>
      
      {/* Content container - no internal borders here */}
      <div className="flex-1 flex overflow-hidden"> {/* Ensures children can take full height and manage their own scroll */}
        <Outlet />
      </div>
      
      {/* Footer is removed as per user's MainLayout example, which doesn't include one. 
          If footer is desired, it should be placed carefully within the flex structure.
          For now, aligning with the user's provided `MainLayout` structure.
      */}
      {/* 
      <footer className="bg-deep-bg/50 border-t border-border py-6 text-center text-medium-text">
        <p>&copy; {new Date().getFullYear()} AI Aggregator. All rights reserved.</p>
        <p className="text-xs mt-1">Unleash the power of AI, unified.</p>
      </footer> 
      */}
    </div>
  );
};

export default Layout;
