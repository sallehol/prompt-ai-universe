
import { Model as AiModelData } from '@/data/aiModels'; // Assuming Model type from aiModels is relevant for display name
import { allModels, getModelById } from '@/data/aiModels';

export interface ModelConfig {
  provider: string;
  requiresApiKey: boolean;
  isSimulated: boolean;
  displayName: string;
  modelId: string; // Keep original modelId for reference
}

// Pre-populate with some common models and examples from user
export const MODEL_CONFIGS: Record<string, ModelConfig> = {
  'gpt-4o-mini': {
    modelId: 'gpt-4o-mini',
    provider: 'openai',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'GPT-4o mini'
  },
  'gpt-4o': {
    modelId: 'gpt-4o',
    provider: 'openai',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'GPT-4o'
  },
  'gpt-4-turbo': { // from user example
    modelId: 'gpt-4-turbo',
    provider: 'openai',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'GPT-4 Turbo'
  },
  'claude-3-opus-20240229': {
    modelId: 'claude-3-opus-20240229',
    provider: 'anthropic',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'Claude 3 Opus'
  },
  'claude-3-sonnet-20240229': {
    modelId: 'claude-3-sonnet-20240229',
    provider: 'anthropic',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'Claude 3 Sonnet'
  },
  'claude-3-haiku-20240307': {
    modelId: 'claude-3-haiku-20240307',
    provider: 'anthropic',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'Claude 3 Haiku'
  },
  'mistral-large-latest': { // Example, maps to a mistral model from aiModels.ts
    modelId: 'mistral-large-latest',
    provider: 'mistral',
    requiresApiKey: true,
    isSimulated: false,
    displayName: 'Mistral Large'
  },
  'mistral-large-2-preview': { // from user example
    modelId: 'mistral-large-2-preview',
    provider: 'mistral', // Assuming Mistral for preview as well
    requiresApiKey: false,
    isSimulated: true,
    displayName: 'Mistral Large 2 (Preview)'
  },
  // Add a simulated model example explicitly
   'simulated-echo-model': {
    modelId: 'simulated-echo-model',
    provider: 'simulated',
    requiresApiKey: false,
    isSimulated: true,
    displayName: 'Simulated Echo Model'
  }
  // It's better to populate this more comprehensively or dynamically
  // based on a flag in `allModels` from `src/data/aiModels.ts` if possible in future.
  // For now, this manual list will work.
};

// Populate MODEL_CONFIGS from allModels in aiModels.ts as a base, then override with specific logic
allModels.forEach(model => {
  if (!MODEL_CONFIGS[model.id]) { // If not already defined with specific logic
    let requiresApiKey = true; // Default to requiring API key
    let isSimulated = false;    // Default to not simulated
    let provider = model.provider.toLowerCase();

    // Basic logic based on name for simulation/preview from user suggestion
    if (model.name.toLowerCase().includes('(preview)') || model.name.toLowerCase().includes('simulated')) {
      requiresApiKey = false;
      isSimulated = true;
    }
    
    // Heuristic for provider if not openai or anthropic
    if (provider !== 'openai' && provider !== 'anthropic' && provider !== 'mistral') {
        if (model.id.startsWith('gpt-') || model.name.toLowerCase().includes('gpt')) provider = 'openai';
        else if (model.id.startsWith('claude-') || model.name.toLowerCase().includes('claude')) provider = 'anthropic';
        else if (model.id.startsWith('mistral-') || model.name.toLowerCase().includes('mistral')) provider = 'mistral';
        // else provider remains model.provider or could be 'unknown_provider'
    }


    MODEL_CONFIGS[model.id] = {
      modelId: model.id,
      provider: provider,
      requiresApiKey: requiresApiKey,
      isSimulated: isSimulated,
      displayName: model.name,
    };
  }
});


export const getModelConfig = (modelId: string): ModelConfig => {
  const normalizedId = modelId.toLowerCase().replace(/\s+/g, '-');

  // Try exact match on original modelId
  if (MODEL_CONFIGS[modelId]) {
    return MODEL_CONFIGS[modelId];
  }
  // Try exact match on normalizedId
  if (MODEL_CONFIGS[normalizedId]) {
    return MODEL_CONFIGS[normalizedId];
  }

  // Try partial match based on name or id (more robust)
  for (const key in MODEL_CONFIGS) {
    const config = MODEL_CONFIGS[key];
    if (config.modelId.toLowerCase() === normalizedId || config.displayName.toLowerCase().includes(normalizedId.substring(0,10))) { // a bit of fuzzy matching
      return config;
    }
  }
  
  // Fallback to checking src/data/aiModels.ts for basic info
  const modelData = getModelById(modelId);
  if (modelData) {
    return {
        modelId: modelData.id,
        provider: modelData.provider.toLowerCase() || 'unknown_provider',
        requiresApiKey: !(modelData.name.toLowerCase().includes('(preview)') || modelData.name.toLowerCase().includes('simulated')), // Guess based on name
        isSimulated: (modelData.name.toLowerCase().includes('(preview)') || modelData.name.toLowerCase().includes('simulated')), // Guess based on name
        displayName: modelData.name
    };
  }

  // Final fallback as per user's suggestion
  return {
    modelId: modelId,
    provider: 'unknown_provider',
    requiresApiKey: false,
    isSimulated: true,
    displayName: modelId,
  };
};

