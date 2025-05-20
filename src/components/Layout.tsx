
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div 
      className="min-h-screen flex flex-col bg-deep-bg text-light-text"
      style={{ 
        "--navbar-height": "4rem",
        "--footer-height": "4rem" // Updated footer height variable
      } as React.CSSProperties}
    >
      <Navbar />
      {/* Main content area now takes remaining space and allows Outlet to control its own layout */}
      <main className="flex-1 w-full flex flex-col overflow-hidden">
        <Outlet />
      </main>
      {/* Footer with fixed height and centered content, pushed to bottom */}
      <footer 
        className="h-[4rem] bg-deep-bg/50 border-t border-border flex items-center justify-center text-center text-medium-text mt-auto"
        style={{ flexShrink: 0 }} // Ensure footer doesn't shrink
      >
        <div>
          <p>&copy; {new Date().getFullYear()} AI Aggregator. All rights reserved.</p>
          <p className="text-xs mt-1">Unleash the power of AI, unified.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
