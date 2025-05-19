
import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';

const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-deep-bg text-light-text">
      <Navbar />
      <main className="flex-grow container mx-auto px-6 py-8">
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

