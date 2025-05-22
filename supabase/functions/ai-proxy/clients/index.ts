
// supabase/functions/ai-proxy/clients/index.ts
import { ProviderName } from '../providers/index.ts';
import { ProviderClient } from './provider-client.interface.ts';
import { OpenAIClient } from './openai.client.ts';
import { AnthropicClient } from './anthropic.client.ts';
import { GoogleClient } from './google.client.ts';
import { MistralClient } from './mistral.client.ts';
// Import other clients as they are created

export type { ProviderClient };

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
    // Add cases for new providers. For now, they might throw an error or use a generic client.
    case ProviderName.META:
    case ProviderName.COHERE:
    case ProviderName.DEEPSEEK:
    case ProviderName.HUGGINGFACE:
    case ProviderName.MIDJOURNEY:
    case ProviderName.STABILITY:
    case ProviderName.RUNWAY:
    case ProviderName.GETTY:
    case ProviderName.PIKA:
    case ProviderName.HEYGEN:
    case ProviderName.DID:
    case ProviderName.ELEVENLABS:
    case ProviderName.ASSEMBLYAI:
    case ProviderName.DEEPGRAM:
    case ProviderName.CODEIUM:
    case ProviderName.TABNINE:
    case ProviderName.SNYK:
    case ProviderName.WIX:
    case ProviderName.VERCEL:
    case ProviderName.BUILDER_IO:
    case ProviderName.ORIGINALITY:
    case ProviderName.TAVUS:
      // For now, let's use OpenAIClient as a placeholder for unimplmented ones,
      // or throw a specific error. Throwing is safer.
      console.warn(`Provider client for '${provider}' is not yet fully implemented. API calls may fail or be routed incorrectly.`);
      // return new OpenAIClient(apiKey); // Example placeholder, not ideal
      throw new Error(`Client for provider '${provider}' is not implemented.`);
    default:
      // This case should ideally not be reached if ProviderName enum is exhaustive
      console.error(`Unknown provider: ${provider}. Cannot create client.`);
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

