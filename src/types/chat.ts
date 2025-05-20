// Remove the conflicting import: import type { Message } from '@/components/chat/ChatInterface';

export interface ContentBlock {
  type: 'text' | 'image' | 'code' | 'markdown' | 'file';
  content: string; // For text-based types, this is the text. For image/file, could be URL or base64.
  metadata?: Record<string, any>; // e.g., for code: language; for image: alt text, dimensions.
}

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string | ContentBlock[]; // Can be simple text or an array of rich content blocks
  timestamp: number; // Unix timestamp
  isSaved?: boolean;
  status?: 'complete' | 'streaming' | 'error'; // For tracking message generation status
  metadata?: {
    model?: string;
    provider?: string; // e.g., 'openai', 'anthropic'
    usage?: {
      prompt_tokens?: number;
      completion_tokens?: number;
      total_tokens?: number;
    };
    error?: { // Store error details directly on the message if it failed
        type: string;
        message: string;
    };
  };
}

export interface Session {
  id: string;
  name: string;
  createdAt: number; // Unix timestamp
  lastActivityAt: number; // Unix timestamp
  messages: Message[];
  modelUsed: string; // e.g., 'gpt-4o-mini'
}
