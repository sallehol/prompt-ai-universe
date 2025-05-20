
// Remove the conflicting import: import type { Message } from '@/components/chat/ChatInterface';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number; // Unix timestamp
  isSaved?: boolean;
  // model?: string; // model was part of the old Message interface, was on Session.modelUsed
}

export interface Session {
  id: string;
  name: string;
  createdAt: number; // Unix timestamp
  lastActivityAt: number; // Unix timestamp
  messages: Message[];
  modelUsed: string; // e.g., 'gpt-4o-mini'
}
