
import { Button } from '@/components/ui/button';
import { CheckCircle2 } from 'lucide-react';

const PricingTierCard = ({ name, price, features, popular, ctaText }: { name: string, price: string, features: string[], popular?: boolean, ctaText: string }) => (
  <div className={`bg-card/50 p-8 rounded-lg shadow-xl border ${popular ? 'border-neon-cyan animate-glow' : 'border-border'} flex flex-col`}>
    {popular && <div className="text-center text-sm bg-neon-cyan text-deep-bg font-semibold py-1 px-3 rounded-full -mt-12 mb-4 self-center">POPULAR</div>}
    <h3 className="text-2xl font-semibold text-light-text mb-2 text-center">{name}</h3>
    <p className="text-4xl font-bold text-neon-cyan mb-6 text-center">{price}<span className="text-lg text-medium-text">/mo</span></p>
    <ul className="space-y-3 text-medium-text mb-8 flex-grow">
      {features.map((feature, index) => (
        <li key={index} className="flex items-start">
          <CheckCircle2 size={20} className="text-bright-purple mr-2 flex-shrink-0 mt-0.5" />
          <span>{feature}</span>
        </li>
      ))}
    </ul>
    <Button className={`w-full mt-auto ${popular ? 'bg-neon-cyan text-deep-bg hover:bg-cyan-300' : 'bg-bright-purple text-light-text hover:bg-purple-400'}`}>
      {ctaText}
    </Button>
  </div>
);

const PricingPage = () => {
  const tiers = [
    { 
      name: "Explorer", 
      price: "$19", 
      features: [
        "Access to basic text & image models", 
        "Limited monthly usage credits", 
        "Community gallery access",
        "Standard support"
      ],
      ctaText: "Choose Explorer"
    },
    { 
      name: "Creator", 
      price: "$49", 
      features: [
        "Access to most models (text, image, basic video & code)", 
        "Increased monthly usage credits", 
        "Save & organize projects",
        "Prompt library access",
        "Priority support"
      ],
      popular: true,
      ctaText: "Choose Creator"
    },
    { 
      name: "Innovator", 
      price: "$99", 
      features: [
        "Full access to all integrated models",
        "High monthly usage credits",
        "Advanced features & tools",
        "Early access to new models",
        "Dedicated support & API access (soon)"
      ],
      ctaText: "Choose Innovator"
    },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-light-text mb-3">Flexible Pricing for Every Need</h1>
        <p className="text-lg text-medium-text max-w-2xl mx-auto">
          Choose a plan that scales with your AI ambitions. Subscriptions and payments coming soon!
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        {tiers.map(tier => (
          <PricingTierCard key={tier.name} {...tier} />
        ))}
      </div>

      <div className="text-center mt-16 max-w-3xl mx-auto">
        <h2 className="text-2xl font-semibold text-light-text mb-4">Business & Enterprise Solutions</h2>
        <p className="text-medium-text mb-6">
          Need custom solutions, higher limits, or team access? We'll offer tailored plans for businesses and enterprises. 
          Contact us to discuss your requirements (once we launch!).
        </p>
        <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-deep-bg">
          Contact Sales (Placeholder)
        </Button>
      </div>
    </div>
  );
};

export default PricingPage;

