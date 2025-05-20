
import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Added Link
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuGroup
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown, Info, Search, ExternalLink } from 'lucide-react'; // Added Search, ExternalLink
import { Input } from '@/components/ui/input'; // Added Input
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { allModels, modelCategoryDetails, Model, ModelCategoryInfo, getModelById } from '@/data/aiModels'; // Updated imports

const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const [searchTerm, setSearchTerm] = useState('');

  const getModelDisplayName = () => {
    const model = getModelById(selectedModel);
    if (model) return model.name;
    // Fallback for models not in the detailed list (e.g. if a session used an old ID)
    // Or provide a more generic "Select Model" or the ID itself
    return selectedModel || "Select Model";
  };

  const filteredAndGroupedModels = (): Record<string, Model[]> => {
    const grouped: Record<string, Model[]> = {};
    const lowerSearchTerm = searchTerm.toLowerCase();

    allModels.forEach(model => {
      if (
        model.name.toLowerCase().includes(lowerSearchTerm) ||
        model.provider.toLowerCase().includes(lowerSearchTerm) ||
        (model.description && model.description.toLowerCase().includes(lowerSearchTerm)) ||
        (model.capabilities && model.capabilities.toLowerCase().includes(lowerSearchTerm))
      ) {
        if (!grouped[model.categoryKey]) {
          grouped[model.categoryKey] = [];
        }
        grouped[model.categoryKey].push(model);
      }
    });
    return grouped;
  };

  const displayedModelGroups = filteredAndGroupedModels();
  const categoryOrder = Object.keys(modelCategoryDetails); // To maintain a consistent order


  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 min-w-[200px] justify-between">
            {getModelDisplayName()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          className="w-80 bg-popover border-border text-popover-foreground max-h-96 overflow-y-auto p-0" // Added max-h, overflow, p-0
          // Prevent closing on click inside search input
          onCloseAutoFocus={(e) => e.preventDefault()} 
        >
          <div className="p-2 sticky top-0 bg-popover z-10 border-b border-border">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search models..."
                className="w-full pl-8 h-9 bg-background text-foreground"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                // Stop propagation to prevent dropdown from closing or other interactions
                onClick={(e) => e.stopPropagation()} 
                onKeyDown={(e) => e.stopPropagation()}
              />
            </div>
          </div>
          
          <div className="p-1"> {/* Content padding wrapper */}
            {categoryOrder.map((categoryKey) => {
              const modelsInGroup = displayedModelGroups[categoryKey];
              const categoryInfo = modelCategoryDetails[categoryKey];
              if (!modelsInGroup || modelsInGroup.length === 0 || !categoryInfo) return null;

              return (
                <React.Fragment key={categoryKey}>
                  <DropdownMenuGroup>
                    <DropdownMenuLabel className="text-medium-text capitalize flex items-center px-2 py-1.5">
                      <categoryInfo.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                      {categoryInfo.name}
                    </DropdownMenuLabel>
                    {modelsInGroup.map((model) => (
                      <DropdownMenuItem
                        key={model.id}
                        onSelect={() => {
                          onSelectModel(model.id);
                          setSearchTerm(''); // Clear search on select
                        }}
                        className={`flex flex-col items-start p-2 mx-1 rounded-sm ${selectedModel === model.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                      >
                        <div className="flex items-center w-full">
                          <span className="font-medium">{model.name}</span>
                          {model.provider && <span className="ml-1 text-xs text-muted-foreground">({model.provider})</span>}
                          {(model.capabilities || model.limitations) && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 p-0 hover:bg-transparent">
                                  <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground border-border shadow-lg p-3">
                                <p className="text-sm font-semibold text-foreground">{model.name}</p>
                                {model.provider && <p className="text-xs text-muted-foreground">Provider: {model.provider}</p>}
                                {model.capabilities && <p className="text-xs text-muted-foreground mt-1"><strong>Capabilities:</strong> {model.capabilities}</p>}
                                {model.limitations && <p className="text-xs text-muted-foreground mt-1"><strong>Limitations:</strong> {model.limitations}</p>}
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuGroup>
                  {/* Conditional separator if not the last group with content */}
                  {/* This logic needs to be smarter, perhaps by checking next group */}
                   <DropdownMenuSeparator className="bg-border mx-1 my-0.5" />
                </React.Fragment>
              );
            })}
            {Object.keys(displayedModelGroups).length === 0 && searchTerm && (
              <p className="text-center text-sm text-muted-foreground py-4 px-2">No models match "{searchTerm}".</p>
            )}
          </div>
          
          <DropdownMenuSeparator className="bg-border my-0" />
          <DropdownMenuItem asChild className="hover:bg-accent/50 cursor-pointer p-2 mx-1 rounded-sm">
            <Link to="/models" className="flex items-center w-full">
              <ExternalLink className="mr-2 h-4 w-4 text-muted-foreground" />
              View Full Model Catalog
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TooltipProvider>
  );
};

// Interface for props (if not already defined broadly)
interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}


export default ModelSelector;
