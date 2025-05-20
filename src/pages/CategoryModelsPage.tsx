import React from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ChevronRight, ArrowLeft, Sparkles } from 'lucide-react';
import { Model, getModelsByCategory, getCategoryInfo, modelCategoryDetails } from '@/data/aiModels';
import { Button } from '@/components/ui/button';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const ModelCard = ({ model }: { model: Model }) => {
  // Use optional chaining and provide a default icon (Sparkles)
  const CategoryIcon = modelCategoryDetails[model.categoryKey]?.icon || Sparkles;

  return (
    <Card className="bg-card/50 shadow-lg hover:shadow-xl transition-shadow duration-300 border border-border hover:border-neon-cyan flex flex-col h-full">
      <CardHeader className="flex flex-row items-center gap-4 pb-2">
        <div className="text-neon-cyan p-2 bg-card rounded-md">
          <CategoryIcon size={28} />
        </div>
        <div>
          <CardTitle className="text-lg text-light-text">{model.name}</CardTitle>
          <CardDescription className="text-xs text-medium-text">{model.provider}</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col">
        <p className="text-sm text-medium-text mb-4 flex-grow line-clamp-3">{model.description || "No description available."}</p>
        <Button 
          asChild 
          className="w-full mt-auto bg-neon-cyan text-deep-bg hover:bg-cyan-300"
        >
          <Link to={`/chat?model=${model.id}`}>Chat with {model.name}</Link>
        </Button>
      </CardContent>
    </Card>
  );
};

const CategoryModelsPage = () => {
  const { categoryKey } = useParams<{ categoryKey: string }>();
  const navigate = useNavigate();
  
  if (!categoryKey) {
    // Should not happen if route is set up correctly, but good for type safety
    return <p className="text-center text-destructive">Category key is missing.</p>;
  }

  const categoryInfo = getCategoryInfo(categoryKey);
  const models = getModelsByCategory(categoryKey);

  if (!categoryInfo) {
    return <p className="text-center text-destructive">Category not found.</p>;
  }

  return (
    <div className="py-8 px-4 md:px-6 lg:px-8">
      <div className="mb-6 flex items-center justify-between">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/models" className="hover:text-neon-cyan">Model Catalog</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator>
              <ChevronRight />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              <BreadcrumbPage className="text-light-text">{categoryInfo.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button variant="outline" onClick={() => navigate(-1)} className="border-border hover:border-neon-cyan hover:text-neon-cyan">
          <ArrowLeft size={16} className="mr-2" /> Back
        </Button>
      </div>

      <div className="text-left mb-10">
        <div className="flex items-center mb-3">
           <categoryInfo.icon size={32} className="text-neon-cyan mr-3" />
           <h1 className="text-3xl font-bold text-light-text">{categoryInfo.name}</h1>
        </div>
        <p className="text-lg text-medium-text max-w-3xl">
          {categoryInfo.description} Browse models specialized in {categoryInfo.name.toLowerCase()}.
        </p>
      </div>

      {models.length > 0 ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {models.map(model => (
            <ModelCard key={model.id} model={model} />
          ))}
        </div>
      ) : (
        <p className="text-center text-medium-text mt-12 text-lg">
          No models found in this category yet.
        </p>
      )}
    </div>
  );
};

export default CategoryModelsPage;
