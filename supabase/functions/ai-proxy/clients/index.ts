
// supabase/functions/ai-proxy/clients/index.ts
import { ProviderName } from '../providers/index.ts'; // Updated import path
import { ProviderClient } from './provider-client.interface.ts';
import { OpenAIClient } from './openai.client.ts';
import { AnthropicClient } from './anthropic.client.ts';
import { GoogleClient } from './google.client.ts';
import { MistralClient } from './mistral.client.ts';

export { ProviderClient } from './provider-client.interface.ts';

// Factory function to create provider clients
export function createProviderClient(provider: ProviderName, apiKey: string): ProviderClient {
  switch (provider) {
    case ProviderName.OPENAI:
      return new OpenAIClient(apiKey);
    case ProviderName.ANTHROPIC:
      return new AnthropicClient(apiKey);
    case ProviderName.GOOGLE:
      return new GoogleClient(apiKey);
    case ProviderName.MISTRAL:
      return new MistralClient(apiKey);
    default:
      console.warn(`Provider client for '${provider}' is not implemented. Falling back to a dummy client or throwing error.`);
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

