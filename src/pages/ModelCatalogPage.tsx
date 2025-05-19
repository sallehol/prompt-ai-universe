
import { Brain, Code, ImageIcon, Film, BarChart3, Search } from 'lucide-react';
import { Input } from "@/components/ui/input"; // Assuming Input component is available
import { Button } from "@/components/ui/button";

const ModelCategoryCard = ({ icon, name, description, modelCount }: { icon: React.ReactNode, name: string, description: string, modelCount: number }) => (
  <div className="bg-card/50 p-6 rounded-lg shadow-xl border border-border hover:border-neon-cyan transition-all duration-300 transform hover:scale-105 cursor-pointer">
    <div className="text-neon-cyan mb-4">{icon}</div>
    <h3 className="text-xl font-semibold text-light-text mb-2">{name}</h3>
    <p className="text-medium-text text-sm mb-3">{description}</p>
    <p className="text-xs text-bright-purple">{modelCount} Models Available (Soon)</p>
  </div>
);

const ModelCatalogPage = () => {
  const categories = [
    { icon: <Brain size={40} />, name: "Text Models (LLMs)", description: "Chatbots, content generation, summarization, translation, and more.", modelCount: 8 },
    { icon: <ImageIcon size={40} />, name: "Image Generation", description: "Create stunning visuals from text prompts, edit existing images.", modelCount: 5 },
    { icon: <Film size={40} />, name: "Video Generation & Editing", description: "Generate videos from text or images, AI-powered editing tools.", modelCount: 4 },
    { icon: <Code size={40} />, name: "Code Generation & Analysis", description: "AI-assisted coding, debugging, and code explanation.", modelCount: 7 },
    { icon: <BarChart3 size={40} />, name: "Data Analysis & Specialized AI", description: "Insights from data, specialized tools for specific industries.", modelCount: 3 },
  ];

  return (
    <div className="py-8">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-light-text mb-3">Explore Our AI Model Catalog</h1>
        <p className="text-lg text-medium-text max-w-2xl mx-auto">
          Discover a diverse range of AI capabilities. Actual model integrations are coming soon!
        </p>
      </div>

      <div className="mb-10 max-w-xl mx-auto flex gap-2">
        <Input type="search" placeholder="Search for models or capabilities (e.g., 'GPT-4o', 'image editing')..." className="bg-card/50 border-border focus:border-neon-cyan" />
        <Button className="bg-neon-cyan text-deep-bg hover:bg-cyan-300">
          <Search size={18} className="mr-2"/> Search
        </Button>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
        {categories.map(category => (
          <ModelCategoryCard key={category.name} {...category} />
        ))}
      </div>
      <p className="text-center text-medium-text mt-12 text-sm">
        Note: The models listed under each category are illustrative. We are working hard to integrate a comprehensive suite of AI tools.
      </p>
    </div>
  );
};

export default ModelCatalogPage;

