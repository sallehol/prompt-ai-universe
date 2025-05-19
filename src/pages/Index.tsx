
import { Button } from '@/components/ui/button'; // Assuming Button component is available
import { Link } from 'react-router-dom';
import { Zap, Brain, Code, ImageIcon, Film, BarChart3 } from 'lucide-react';

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <div className="bg-card/50 p-6 rounded-lg shadow-xl border border-border hover:border-neon-cyan transition-all duration-300 transform hover:scale-105">
    <div className="text-neon-cyan mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-light-text mb-2">{title}</h3>
    <p className="text-medium-text">{description}</p>
  </div>
);

const Index = () => {
  return (
    <div className="flex flex-col items-center justify-center text-center py-12">
      <header className="mb-16">
        <h1 className="text-5xl md:text-7xl font-bold mb-6">
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon-cyan to-bright-purple">
            AI Aggregator
          </span>
        </h1>
        <p className="text-xl md:text-2xl text-medium-text max-w-3xl mx-auto mb-8">
          Access a universe of AI models—text, image, video, code, and more—through one seamless, powerful interface.
        </p>
        <div className="space-x-4">
          <Button size="lg" className="bg-neon-cyan text-deep-bg hover:bg-cyan-300 font-semibold animate-glow">
            Get Started
          </Button>
          <Button size="lg" variant="outline" className="border-bright-purple text-bright-purple hover:bg-bright-purple hover:text-deep-bg transition-all">
            <Link to="/models">Explore Models</Link>
          </Button>
        </div>
      </header>

      <section className="w-full max-w-6xl mb-16">
        <h2 className="text-3xl font-semibold text-light-text mb-10">Why AI Aggregator?</h2>
        <div className="grid md:grid-cols-3 gap-8">
          <FeatureCard 
            icon={<Zap size={40} />}
            title="Unified Access"
            description="Connect to diverse AI models from top providers without juggling multiple accounts."
          />
          <FeatureCard 
            icon={<Brain size={40} />}
            title="Powerful Capabilities"
            description="Leverage text generation, image creation, video editing, code assistance, and data analysis tools."
          />
          <FeatureCard 
            icon={<Code size={40} />}
            title="Streamlined Workflow"
            description="Boost productivity with a centralized hub for all your AI-powered tasks and projects."
          />
        </div>
      </section>
      
      <section className="w-full max-w-6xl">
        <h2 className="text-3xl font-semibold text-light-text mb-10">Models We Integrate (Coming Soon)</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 text-center">
          {[
            { name: "Text Models", icon: <Brain className="mx-auto mb-2 text-neon-cyan" size={32}/> },
            { name: "Image Generation", icon: <ImageIcon className="mx-auto mb-2 text-neon-cyan" size={32}/> },
            { name: "Video Creation", icon: <Film className="mx-auto mb-2 text-neon-cyan" size={32}/> },
            { name: "Code Generation", icon: <Code className="mx-auto mb-2 text-neon-cyan" size={32}/> },
            { name: "Data Analysis", icon: <BarChart3 className="mx-auto mb-2 text-neon-cyan" size={32}/> },
          ].map(model => (
            <div key={model.name} className="p-4 bg-card/30 rounded-md border border-border">
              {model.icon}
              <p className="text-medium-text text-sm">{model.name}</p>
            </div>
          ))}
        </div>
         <p className="text-center text-medium-text mt-6 text-sm">
            We are actively working on integrating a wide array of leading AI models. Stay tuned!
          </p>
      </section>
    </div>
  );
};

export default Index;

