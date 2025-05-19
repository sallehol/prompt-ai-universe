
import React from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu"; // Assuming these are available from shadcn/ui
import { Button } from "@/components/ui/button";
import { ChevronDown, Brain, Code, ImageIcon } from 'lucide-react';

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

// Placeholder models
const models = {
  text: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', capabilities: 'Fast, Vision' },
    { id: 'gpt-4o', name: 'GPT-4o', capabilities: 'Powerful, Vision' },
  ],
  image: [
    { id: 'dall-e-3', name: 'DALL·E 3', capabilities: 'Image Generation' },
  ],
  code: [
    { id: 'code-llama', name: 'Code Llama', capabilities: 'Code Generation' },
  ],
};

const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const getModelDisplayName = () => {
    for (const category of Object.values(models)) {
      const model = category.find(m => m.id === selectedModel);
      if (model) return model.name;
    }
    return selectedModel;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 min-w-[180px] justify-between">
          {getModelDisplayName()}
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-64 bg-popover border-border text-popover-foreground">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-medium-text">Text Models</DropdownMenuLabel>
          {models.text.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => onSelectModel(model.id)}
              className={selectedModel === model.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
            >
              <Brain className="mr-2 h-4 w-4 text-neon-cyan" />
              <span>{model.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-medium-text">Image Models</DropdownMenuLabel>
          {models.image.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => onSelectModel(model.id)}
              className={selectedModel === model.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
            >
              <ImageIcon className="mr-2 h-4 w-4 text-bright-purple" />
              <span>{model.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
        <DropdownMenuSeparator className="bg-border" />
         <DropdownMenuGroup>
          <DropdownMenuLabel className="text-medium-text">Code Models</DropdownMenuLabel>
          {models.code.map((model) => (
            <DropdownMenuItem
              key={model.id}
              onSelect={() => onSelectModel(model.id)}
              className={selectedModel === model.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
            >
              <Code className="mr-2 h-4 w-4 text-primary" />
              <span>{model.name}</span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ModelSelector;
