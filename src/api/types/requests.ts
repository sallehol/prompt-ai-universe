
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface ChatCompletionRequest {
  model: string;
  provider?: string; // Optional, derived from model if not provided by edge function
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  stream?: boolean;
}

export interface TextCompletionRequest {
  model: string;
  provider?: string;
  prompt: string;
  temperature?: number;
  max_tokens?: number;
}

export interface ImageGenerationRequest {
  model: string;
  provider?: string;
  prompt: string;
  n?: number;
  size?: string; // e.g., "1024x1024"
}

// Add other request types as needed, e.g., for image edit, variation, audio, video
