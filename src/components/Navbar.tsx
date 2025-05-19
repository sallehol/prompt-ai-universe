
import { Link } from 'react-router-dom';
import { BotMessageSquare, LayoutGrid, Tags, UserCircle } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-deep-bg/80 backdrop-blur-md shadow-lg sticky top-0 z-50">
      <div className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold text-neon-cyan hover:text-cyan-300 transition-colors">
          AI Aggregator
        </Link>
        <div className="flex items-center space-x-6">
          <NavLinkItem to="/" icon={<BotMessageSquare size={20} />} text="Home" />
          <NavLinkItem to="/models" icon={<LayoutGrid size={20} />} text="Model Catalog" />
          <NavLinkItem to="/pricing" icon={<Tags size={20} />} text="Pricing" />
          {/* Placeholder for Login/User button - will be implemented after Supabase setup */}
          <button className="flex items-center text-medium-text hover:text-light-text transition-colors">
            <UserCircle size={20} className="mr-1" />
            Login
          </button>
        </div>
      </div>
    </nav>
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

