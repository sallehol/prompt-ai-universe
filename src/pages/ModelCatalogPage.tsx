
import React from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { modelCategoryDetails, getAllCategoriesArray, ModelCategoryInfo } from '@/data/aiModels'; // Updated import

const ModelCategoryCard = ({ category }: { category: ModelCategoryInfo }) => (
  <Link to={`/models/${category.key}`} className="block h-full">
    <div className="bg-card/50 p-6 rounded-lg shadow-xl border border-border hover:border-neon-cyan transition-all duration-300 transform hover:scale-105 cursor-pointer h-full flex flex-col">
      <div className="text-neon-cyan mb-4">
        <category.icon size={40} />
      </div>
      <h3 className="text-xl font-semibold text-light-text mb-2">{category.name}</h3>
      <p className="text-medium-text text-sm mb-3 flex-grow">{category.description}</p>
      {category.modelCountLabel && (
        <p className="text-xs text-bright-purple mt-auto">{category.modelCountLabel}</p>
      )}
    </div>
  </Link>
);

const ModelCatalogPage = () => {
  const categories = getAllCategoriesArray();

  const [searchTerm, setSearchTerm] = React.useState("");
  const filteredCategories = categories.filter(category => 
    category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    category.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (category.modelCountLabel && category.modelCountLabel.toLowerCase().includes(searchTerm.toLowerCase()))
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
          placeholder="Search categories (e.g., 'Image', 'Text Models')..." 
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
            <ModelCategoryCard key={category.key} category={category} />
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
