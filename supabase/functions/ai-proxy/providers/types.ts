
// supabase/functions/ai-proxy/providers/types.ts

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

