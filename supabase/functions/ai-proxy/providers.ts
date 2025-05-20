
// supabase/functions/ai-proxy/providers.ts

// Define provider types
export enum ProviderType {
  TEXT = 'text',
  CHAT = 'chat',
  IMAGE = 'image',
  VIDEO = 'video',
  AUDIO = 'audio',
  CODE = 'code',
}

// Define provider names
export enum ProviderName {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
  GOOGLE = 'google',
  MISTRAL = 'mistral',
  META = 'meta',
  COHERE = 'cohere',
  DEEPSEEK = 'deepseek',
  MIDJOURNEY = 'midjourney',
  STABILITY = 'stability',
  RUNWAY = 'runway',
  PIKA = 'pika',
  HEYGEN = 'heygen',
  DID = 'did',
  ELEVENLABS = 'elevenlabs',
  ASSEMBLYAI = 'assemblyai',
  DEEPGRAM = 'deepgram',
  HUGGINGFACE = 'huggingface',
  ORIGINALITY = 'originality',
  TAVUS = 'tavus',
  CODEIUM = 'codeium',
  TABNINE = 'tabnine',
  GETTY = 'getty',
}

// Map model names to providers
export function getProviderFromModel(model: string): ProviderName {
  model = model.toLowerCase()
  
  if (model.includes('gpt') || model.includes('dall-e') || model.includes('whisper')) {
    return ProviderName.OPENAI
  }
  
  if (model.includes('claude')) {
    return ProviderName.ANTHROPIC
  }
  
  if (model.includes('gemini') || model.includes('imagen')) {
    return ProviderName.GOOGLE
  }
  
  if (model.includes('mistral') || model.includes('codestral')) {
    return ProviderName.MISTRAL
  }
  
  if (model.includes('llama')) {
    return ProviderName.META
  }
  
  if (model.includes('command')) {
    return ProviderName.COHERE
  }
  
  if (model.includes('deepseek')) {
    return ProviderName.DEEPSEEK
  }
  
  if (model.includes('midjourney')) {
    return ProviderName.MIDJOURNEY
  }
  
  if (model.includes('stable') || model.includes('stability')) {
    return ProviderName.STABILITY
  }
  
  if (model.includes('runway')) {
    return ProviderName.RUNWAY
  }
  
  if (model.includes('pika')) {
    return ProviderName.PIKA
  }
  
  if (model.includes('heygen')) {
    return ProviderName.HEYGEN
  }
  
  if (model.includes('d-id')) {
    return ProviderName.DID
  }
  
  if (model.includes('eleven')) {
    return ProviderName.ELEVENLABS
  }
  
  if (model.includes('assembly')) {
    return ProviderName.ASSEMBLYAI
  }
  
  if (model.includes('deepgram')) {
    return ProviderName.DEEPGRAM
  }
  
  if (model.includes('huggingface') || model.includes('transformers')) {
    return ProviderName.HUGGINGFACE
  }
  
  if (model.includes('originality')) {
    return ProviderName.ORIGINALITY
  }
  
  if (model.includes('tavus')) {
    return ProviderName.TAVUS
  }
  
  if (model.includes('codeium')) {
    return ProviderName.CODEIUM
  }
  
  if (model.includes('tabnine')) {
    return ProviderName.TABNINE
  }
  
  if (model.includes('getty')) {
    return ProviderName.GETTY
  }
  
  // Consider a more specific error or a default provider
  console.warn(`Unknown provider for model: ${model}. Falling back to OpenAI as a generic default or consider throwing a specific error.`);
  // throw new Error(`Unknown provider for model: ${model}`)
  return ProviderName.OPENAI; // Example fallback, adjust as needed
}

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
