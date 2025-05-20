
import React from 'react';
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
import { ChevronDown, Brain, Code, ImageIcon, Film, Mic, BarChart3, LayoutDashboard, Info } from 'lucide-react'; // Added Film, Mic, BarChart3, LayoutDashboard
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ModelSelectorProps {
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

// Expanded models with more categories and details
const models = {
  text: [
    { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', capabilities: 'Powerful, Vision, Advanced Reasoning, Multimodal', limitations: 'Higher cost, potential latency' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini', provider: 'OpenAI', capabilities: 'Fast, Vision, General Text, Cost-effective', limitations: 'Slightly less powerful than GPT-4o' },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', provider: 'Anthropic', capabilities: 'Highest performance, Vision, Complex tasks', limitations: 'Most expensive Claude model' },
    { id: 'claude-3.5-sonnet', name: 'Claude 3.5 Sonnet', provider: 'Anthropic', capabilities: 'Strong performance, Vision, Speed, Cost-effective for scale', limitations: 'Beta, may have evolving capabilities' },
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro', provider: 'Google', capabilities: 'Large context window, Multimodal, Advanced reasoning', limitations: 'Availability might vary' },
    { id: 'mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral AI', capabilities: 'Top-tier reasoning, Multilingual, Function calling', limitations: 'Newer model, ecosystem maturing' },
    { id: 'llama-3-70b', name: 'Llama 3 70B', provider: 'Meta AI', capabilities: 'Strong general performance, Open weights', limitations: 'Requires significant compute for self-hosting' },
  ],
  image: [
    { id: 'dall-e-3', name: 'DALL·E 3', provider: 'OpenAI', capabilities: 'High-Quality Image Generation, Detail, Coherence', limitations: 'Usage limits, API costs' },
    { id: 'midjourney-v6', name: 'Midjourney V6', provider: 'Midjourney', capabilities: 'Artistic, Stylized Images, Highly creative', limitations: 'Primarily Discord-based, API access limited' },
    { id: 'sd3', name: 'Stable Diffusion 3', provider: 'Stability AI', capabilities: 'Open source, Highly customizable, Strong photorealism', limitations: 'Can require technical setup' },
  ],
  video: [
    { id: 'runway-gen-2', name: 'Runway Gen-2', provider: 'RunwayML', capabilities: 'Text-to-video, Image-to-video, Video editing tools', limitations: 'Generation length/quality can vary' },
    { id: 'pika-1.0', name: 'Pika 1.0', provider: 'Pika Labs', capabilities: 'Text-to-video, Image-to-video, Diverse styles', limitations: 'Early access, evolving features' },
    { id: 'heygen-avatars', name: 'HeyGen Avatars', provider: 'HeyGen', capabilities: 'AI video avatars, Lip sync, Translation', limitations: 'Focus on avatar-based video' },
  ],
  speech: [
    { id: 'elevenlabs-v2', name: 'ElevenLabs Multilingual v2', provider: 'ElevenLabs', capabilities: 'Realistic TTS, Voice cloning, Multiple languages', limitations: 'Commercial use pricing' },
    { id: 'openai-whisper', name: 'OpenAI Whisper', provider: 'OpenAI', capabilities: 'Accurate ASR, Multilingual, Open source', limitations: 'Primarily ASR, TTS is separate' },
    { id: 'assemblyai-core', name: 'AssemblyAI Core', provider: 'AssemblyAI', capabilities: 'Accurate ASR, Speaker diarization, Summarization', limitations: 'Commercial API' },
  ],
  code: [
    { id: 'gpt-4o-code', name: 'GPT-4o (Code)', provider: 'OpenAI', capabilities: 'Advanced code generation, Debugging, Explanation', limitations: 'General model, not specialized as some others' },
    { id: 'claude-3.5-sonnet-code', name: 'Claude 3.5 Sonnet (Code)', provider: 'Anthropic', capabilities: 'Strong code understanding & generation', limitations: 'General model focus' },
    { id: 'codestral', name: 'Codestral', provider: 'Mistral AI', capabilities: 'Specialized for code, Fast, Autocompletion', limitations: 'Newer, focus on code tasks' },
    { id: 'starcoder-2', name: 'StarCoder 2', provider: 'Hugging Face/ServiceNow', capabilities: 'Open source, Trained on diverse code', limitations: 'May require fine-tuning for specific needs' },
  ],
  dataAnalysis: [
      { id: 'huggingface-transformers', name: 'Hugging Face Transformers', provider: 'Hugging Face', capabilities: 'Platform for various models, NLP, Data tasks', limitations: 'Library/Platform, not a single model' },
      { id: 'ai-content-detector', name: 'AI Content Detector', provider: 'Various (e.g., Originality.AI)', capabilities: 'Detects AI-generated text', limitations: 'Accuracy can vary, not foolproof' },
  ],
  websiteBuilders: [
      { id: 'wix-adi', name: 'Wix ADI', provider: 'Wix', capabilities: 'AI-powered website design and content creation', limitations: 'Tied to Wix platform, customization limits' },
      { id: 'builder-io-visual-copilot', name: 'Builder.io Visual Copilot', provider: 'Builder.io', capabilities: 'AI-assisted UI/UX generation and component creation', limitations: 'Integrates with Builder.io platform' },
      { id: 'v0-dev', name: 'v0.dev by Vercel', provider: 'Vercel', capabilities: 'Generative UI, Generates React code from text/images', limitations: 'Early access, focus on component generation' },
  ]
};

const ModelSelector = ({ selectedModel, onSelectModel }: ModelSelectorProps) => {
  const getModelDisplayName = () => {
    for (const category of Object.values(models)) {
      const model = category.find(m => m.id === selectedModel);
      if (model) return model.name;
    }
    // Fallback for models not in the detailed list (e.g. if a session used an old ID)
    if (selectedModel === 'gpt-4o-mini') return 'GPT-4o Mini';
    if (selectedModel === 'gpt-4o') return 'GPT-4o';
    if (selectedModel === 'dall-e-3') return 'DALL·E 3';
    if (selectedModel === 'code-llama') return 'Code Llama'; // old model
    return selectedModel; // Or a more generic "Select Model"
  };

  const categoryIcons: { [key: string]: React.ElementType } = {
    text: Brain,
    image: ImageIcon,
    video: Film,
    speech: Mic,
    code: Code,
    dataAnalysis: BarChart3,
    websiteBuilders: LayoutDashboard,
  };

  return (
    <TooltipProvider>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="border-neon-cyan text-neon-cyan hover:bg-neon-cyan/10 min-w-[200px] justify-between">
            {getModelDisplayName()}
            <ChevronDown className="ml-2 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-80 bg-popover border-border text-popover-foreground">
          {Object.entries(models).map(([categoryKey, categoryModels], index) => (
            <React.Fragment key={categoryKey}>
              <DropdownMenuGroup>
                <DropdownMenuLabel className="text-medium-text capitalize flex items-center">
                  {React.createElement(categoryIcons[categoryKey] || Info, { className: "mr-2 h-4 w-4 text-muted-foreground" })}
                  {categoryKey.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())} Models
                </DropdownMenuLabel>
                {categoryModels.map((model) => (
                  <DropdownMenuItem
                    key={model.id}
                    onSelect={() => onSelectModel(model.id)}
                    className={`flex flex-col items-start p-2 ${selectedModel === model.id ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}`}
                  >
                    <div className="flex items-center w-full">
                      {/* Optional: specific model icon if available, else category icon from label */}
                      {/* <model.icon className="mr-2 h-4 w-4 text-neon-cyan flex-shrink-0" /> */}
                      <span className="font-medium">{model.name}</span>
                      {model.provider && <span className="ml-1 text-xs text-muted-foreground">({model.provider})</span>}
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="ml-auto h-6 w-6 p-0 hover:bg-transparent">
                            <Info className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right" className="max-w-xs bg-popover text-popover-foreground border-border shadow-lg p-3">
                          <p className="text-sm font-semibold text-foreground">{model.name}</p>
                          {model.provider && <p className="text-xs text-muted-foreground">Provider: {model.provider}</p>}
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

