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
import { ChevronDown, Brain, Code, ImageIcon, Info } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"; // Import Tooltip components

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

// Updated models with capabilities and limitations
const models = {
  text: [
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', capabilities: 'Fast, Vision, General Text', limitations: 'Slightly less powerful than GPT-4o' },
    { id: 'gpt-4o', name: 'GPT-4o', capabilities: 'Powerful, Vision, Advanced Reasoning', limitations: 'Higher cost' },
  ],
  image: [
    { id: 'dall-e-3', name: 'DALL·E 3', capabilities: 'High-Quality Image Generation', limitations: 'Text rendering in images can be inconsistent' },
  ],
  code: [
    { id: 'code-llama', name: 'Code Llama', capabilities: 'Code Generation, Completion, Debugging', limitations: 'May not support all niche programming languages equally well' },
  ],
};

const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  // ... keep existing code (getModelDisplayName function)
  const getModelDisplayName = () => {
    for (const category of Object.values(models)) {
      const model = category.find(m => m.id === selectedModel);
      if (model) return model.name;
    }
    return selectedModel;
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 min-w-[180px] justify-between">
            {getModelDisplayName()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-72 bg-popover border-border text-popover-foreground">
          {Object.entries(models).map(([categoryKey, categoryModels], index) => (
            <React.Fragment key={categoryKey}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-medium-text capitalize">
                  {categoryKey} Models
                </DropdownMenuLabel>
                {categoryModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => onSelectModel(model.id)}
                    className={`flex flex-col items-start p-2 ${selectedModel === model.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                  >
                    <div className="flex items-center w-full">
                      {categoryKey === 'text' && <Brain className="mr-2 h-4 w-4 text-neon-cyan flex-shrink-0" />}
                      {categoryKey === 'image' && <ImageIcon className="mr-2 h-4 w-4 text-bright-purple flex-shrink-0" />}
                      {categoryKey === 'code' && <Code className="mr-2 h-4 w-4 text-primary flex-shrink-0" />}
                      <span className="font-medium">{model.name}</span>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 p-0 hover:bg-transparent">
                            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground border-border shadow-lg p-3">
                          <p className="text-sm font-semibold text-foreground">{model.name}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Capabilities:</strong> {model.capabilities}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            <strong>Limitations:</strong> {model.limitations}
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
              {index < Object.keys(models).length - 1 && <DropdownMenuSeparator className="bg-border" />}
            </React.Fragment>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

export default ModelSelector;
