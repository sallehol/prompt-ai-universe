
import type { ChatMessage } from './requests';

export interface UsageInfo {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
}

export interface ChatCompletionResponse {
  id: string;
  object: string; // e.g., "chat.completion"
  created: number; // Unix timestamp
  model: string;
  provider?: string;
  choices: {
    index: number;
    message: ChatMessage;
    finish_reason: string;
  }[];
  usage?: UsageInfo;
}

export interface TextCompletionResponse {
  id: string;
  object: string; // e.g., "text_completion"
  created: number;
  model: string;
  provider?: string;
  choices: {
    index: number;
    text: string;
    finish_reason: string;
  }[];
  usage?: UsageInfo;
}

export interface ImageObject {
  url?: string;
  b64_json?: string; // For base64 encoded images
}

export interface ImageGenerationResponse {
  created: number;
  data: ImageObject[];
  provider?: string;
}

// Add other response types as needed
