
// supabase/functions/ai-proxy/providers/capabilities.ts
import { ProviderName, ProviderType } from './types.ts';

// Get provider capabilities
export function getProviderCapabilities(provider: ProviderName): ProviderType[] {
  switch (provider) {
    case ProviderName.OPENAI:
      return [ProviderType.TEXT, ProviderType.CHAT, ProviderType.IMAGE, ProviderType.AUDIO, ProviderType.CODE]
    case ProviderName.ANTHROPIC:
      return [ProviderType.CHAT]
    case ProviderName.GOOGLE:
      return [ProviderType.TEXT, ProviderType.CHAT, ProviderType.IMAGE]
    case ProviderName.MISTRAL:
      return [ProviderType.TEXT, ProviderType.CHAT, ProviderType.CODE]
    case ProviderName.META:
      return [ProviderType.TEXT, ProviderType.CHAT]
    case ProviderName.COHERE:
      return [ProviderType.TEXT, ProviderType.CHAT]
    case ProviderName.DEEPSEEK:
      return [ProviderType.TEXT, ProviderType.CHAT, ProviderType.CODE]
    case ProviderName.MIDJOURNEY:
      return [ProviderType.IMAGE]
    case ProviderName.STABILITY:
      return [ProviderType.IMAGE]
    case ProviderName.RUNWAY:
      return [ProviderType.VIDEO]
    case ProviderName.PIKA:
      return [ProviderType.VIDEO]
    case ProviderName.HEYGEN:
      return [ProviderType.VIDEO]
    case ProviderName.DID:
      return [ProviderType.VIDEO]
    case ProviderName.ELEVENLABS:
      return [ProviderType.AUDIO]
    case ProviderName.ASSEMBLYAI:
      return [ProviderType.AUDIO]
    case ProviderName.DEEPGRAM:
      return [ProviderType.AUDIO]
    case ProviderName.HUGGINGFACE:
      return [ProviderType.TEXT, ProviderType.CHAT, ProviderType.IMAGE, ProviderType.AUDIO, ProviderType.CODE]
    case ProviderName.ORIGINALITY:
      return [ProviderType.TEXT]
    case ProviderName.TAVUS:
      return [ProviderType.VIDEO]
    case ProviderName.CODEIUM:
      return [ProviderType.CODE]
    case ProviderName.TABNINE:
      return [ProviderType.CODE]
    case ProviderName.GETTY:
      return [ProviderType.IMAGE]
    default:
      // Ensure all enum members are handled, or provide a safe default
      const _exhaustiveCheck: never = provider;
      return []
  }
}

