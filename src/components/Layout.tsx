
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div 
      className="min-h-screen flex flex-col bg-deep-bg text-light-text"
      style={{ "--navbar-height": "4rem" } as React.CSSProperties}
    >
      <Navbar />
      {/* Updated main element: removed container, mx-auto, px-6, py-8 for more flexible child layouts */}
      <main className="flex-grow flex flex-col overflow-auto"> {/* Changed from overflow-hidden to overflow-auto to allow content pages to scroll if needed */}
        <Outlet />
      </main>
      <footer className="bg-deep-bg/50 border-t border-border py-6 text-center text-medium-text">
        <p>&copy; {new Date().getFullYear()} AI Aggregator. All rights reserved.</p>
        <p className="text-xs mt-1">Unleash the power of AI, unified.</p>
      </footer>
    </div>
  );
};

export default Layout;
