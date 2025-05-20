
import React from 'react'; // Added React import
import { Brain, Code, ImageIcon, Film, BarChart3, Search, Mic, LayoutDashboard } from 'lucide-react'; // Added Mic, LayoutDashboard
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const ModelCategoryCard = ({ icon, name, description, modelCountLabel }: { icon: React.ReactNode, name: string, description: string, modelCountLabel: string }) => (
  <div className="bg-card/50 p-6 rounded-lg shadow-xl border border-border hover:border-neon-cyan transition-all duration-300 transform hover:scale-105 cursor-pointer h-full flex flex-col">
    <div className="text-neon-cyan mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-light-text mb-2">{name}</h3>
    <p className="text-medium-text text-sm mb-3 flex-grow">{description}</p>
    <p className="text-xs text-bright-purple mt-auto">{modelCountLabel}</p>
  </div>
);

const ModelCatalogPage = () => {
  const categories = [
    { 
      icon: <Brain size={40} />, 
      name: "Text Models (LLMs)", 
      description: "For chatbots, content generation, summarization, translation, complex reasoning, and more.", 
      modelCountLabel: "Models like GPT-4o, Claude 3.5, Gemini 1.5, Llama 3" 
    },
    { 
      icon: <ImageIcon size={40} />, 
      name: "Image Generation", 
      description: "Create stunning visuals from text prompts, edit existing images, and explore artistic styles.", 
      modelCountLabel: "Models like DALL·E 3, Midjourney, Stable Diffusion" 
    },
    { 
      icon: <Film size={40} />, 
      name: "Video Generation & Editing", 
      description: "Generate videos from text or images, AI-powered editing tools, and create avatar-based content.", 
      modelCountLabel: "Tools like Runway, Pika Labs, HeyGen" 
    },
    { 
      icon: <Mic size={40} />, 
      name: "Speech Recognition & Synthesis", 
      description: "Convert speech to text (ASR) and text to natural-sounding speech (TTS), voice cloning, and more.", 
      modelCountLabel: "Services like ElevenLabs, OpenAI Whisper, AssemblyAI" 
    },
    { 
      icon: <Code size={40} />, 
      name: "Code Generation & Analysis", 
      description: "AI-assisted coding, debugging, code explanation, and generation for various programming languages.", 
      modelCountLabel: "Models like Codestral, GPT-4o (Code), StarCoder" 
    },
    { 
      icon: <BarChart3 size={40} />, 
      name: "Data Analysis & Specialized AI", 
      description: "Extract insights from data, AI content detection, and utilize specialized tools for specific industries or tasks.", 
      modelCountLabel: "Platforms like Hugging Face, AI Detectors" 
    },
    { 
      icon: <LayoutDashboard size={40} />, 
      name: "Website & App Builders", 
      description: "AI-powered tools to design and build websites, applications, and UI components with ease.", 
      modelCountLabel: "Tools like Wix ADI, Builder.io, v0.dev" 
    },
  ];

  // Simple search state (not fully implemented search logic)
  const [searchTerm, setSearchTerm] = React.useState("");
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.modelCountLabel.toLowerCase().includes(searchTerm.toLowerCase())
  );


  return (
    <div className="py-8 px-4 md:px-6 lg:px-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-light-text mb-3">Explore Our AI Model Catalog</h1>
        <p className="text-lg text-medium-text max-w-3xl mx-auto">
          Discover a diverse range of AI capabilities. We are continuously expanding our integrated model offerings.
        </p>
      </div>

      <div className="mb-10 max-w-xl mx-auto flex gap-2">
        <Input 
          type="search" 
          placeholder="Search categories or model types (e.g., 'Image', 'GPT-4o')..." 
          className="bg-card/50 border-border focus:border-neon-cyan text-light-text placeholder:text-medium-text/70" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Button className="bg-neon-cyan text-deep-bg hover:bg-cyan-300">
          <Search size={18} className="mr-2"/> Search
        </Button>
      </div>

      {filteredCategories.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCategories.map(category => (
            <ModelCategoryCard key={category.name} {...category} />
          ))}
        </div>
      ) : (
        <p className="text-center text-medium-text mt-12 text-lg">
          No categories match your search criteria.
        </p>
      )}

      <p className="text-center text-medium-text mt-12 text-sm">
        Note: The models and tools listed are representative examples. Specific integrations and availability may vary.
      </p>
    </div>
  );
};

export default ModelCatalogPage;

