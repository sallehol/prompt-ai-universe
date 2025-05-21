
// supabase/functions/ai-proxy/providers/model-mapping.ts
import { ProviderName } from './types.ts';
import {
  checkSpecificModels,
  checkModelPrefixes,
  checkModelPatterns,
} from './model-checks/index.ts';

// Helper for explicit provider check
function getProviderFromExplicit(explicitProvider?: string): ProviderName | undefined {
  if (explicitProvider) {
    const normalizedProvider = explicitProvider.toLowerCase();
    // Check if it's a valid provider name
    const providerEnumValue = Object.values(ProviderName)
      .find(p => p.toLowerCase() === normalizedProvider);
    
    if (providerEnumValue) {
      return providerEnumValue;
    }
    // If provider is specified but invalid, log a warning but continue with model-based detection
    console.warn(`Specified provider "${explicitProvider}" is not recognized. Falling back to model-based detection.`);
  }
  return undefined;
}

// Map model names to providers
export function getProviderFromModel(model: string, explicitProvider?: string): ProviderName {
  const lowerModel = model.toLowerCase();
  
  // 1. If explicit provider is specified and valid, use it
  const providerFromExplicit = getProviderFromExplicit(explicitProvider);
  if (providerFromExplicit) {
    return providerFromExplicit;
  }
  
  // 2. Specific model identifiers
  let provider = checkSpecificModels(lowerModel);
  if (provider) {
    return provider;
  }
  
  // 3. Provider prefixes (explicit provider name in model) - generally more reliable than includes
  provider = checkModelPrefixes(lowerModel);
  if (provider) {
    return provider;
  }
  
  // 4. Pattern matching (for backward compatibility) - less reliable, placed after specific checks
  provider = checkModelPatterns(lowerModel);
  if (provider) {
    return provider;
  }
  
  // 5. Better error handling
  console.warn(`Unknown provider for model: ${model}. Consider specifying provider explicitly or check model name.`);
  // Instead of defaulting to OpenAI, throw an error
  throw new Error(`Unknown provider for model: "${model}". Please specify provider explicitly or ensure the model name is registered.`);
}

