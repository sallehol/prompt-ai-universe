// supabase/functions/ai-proxy/providers/types.ts

// Defines the list of supported AI providers
export enum ProviderName {
  // Text/LLM Providers
  OPENAI = "openai",
  ANTHROPIC = "anthropic",
  GOOGLE = "google",
  MISTRAL = "mistral",
  META = "meta",
  COHERE = "cohere",
  DEEPSEEK = "deepseek",
  HUGGINGFACE = "huggingface",
  
  // Image Generation Providers
  MIDJOURNEY = "midjourney",
  STABILITY = "stability", // Was STABILITY_AI
  RUNWAY = "runway",       // Was RUNWAY_ML
  GETTY = "getty",         // Was GETTY_IMAGES
  
  // Video Generation Providers
  PIKA = "pika",           // Was PIKA_LABS
  HEYGEN = "heygen",
  DID = "did",
  
  // Audio/Speech Providers
  ELEVENLABS = "elevenlabs",
  ASSEMBLYAI = "assemblyai",
  DEEPGRAM = "deepgram",
  
  // Code/Analysis Providers
  CODEIUM = "codeium",
  TABNINE = "tabnine",
  SNYK = "snyk",
  
  // Website & App Builders
  WIX = "wix",
  VERCEL = "vercel",
  BUILDER_IO = "builder.io", // Standardized to builder.io from builder
  
  // Other Specialized Providers
  ORIGINALITY = "originality",
  TAVUS = "tavus"
}

// Describes the capabilities of a provider's model
export interface ModelCapabilities {
  text?: boolean;
  image?: boolean;
  audio?: boolean;
  video?: boolean;
  multimodal?: boolean;
  maxTokens?: number;
  supportedFormats?: string[]; // For image/audio/video types
  streaming?: boolean; // Does the model support streaming responses?
  functions?: boolean; // Does the model support function calling?
}

// General configuration for a provider
export interface ProviderConfig {
  apiBaseUrl?: string; // Base URL for the provider's API
  apiKeyHeader?: string; // Header name for API key, if non-standard
  authPrefix?: string; // e.g., "Bearer ", "Token "
  models: Record<string, ModelCapabilities>; // Model ID -> Capabilities
  defaultModels: { // Default models for various types, if applicable
    text?: string;
    image?: string;
    // ... other types
  };
  imageModels?: string[]; // List of image model identifiers for this provider
  // Add any other provider-specific configurations here
}

// Overall application configuration for all providers
export interface AppProviderConfig {
  [key: string]: ProviderConfig; // ProviderName -> ProviderConfig
}
