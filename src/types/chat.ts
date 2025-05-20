import type { Message } from '@/components/chat/ChatInterface'; // Make sure Message is exported from ChatInterface or define it here

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system'; // Changed from sender: 'user' | 'ai'
  content: string; // Changed from text: string
  timestamp: number; // Changed from Date to number
  isSaved?: boolean;
  // model?: string; // model was part of the old Message interface, removing as per new spec.
}

export interface Session {
  id: string;
  name: string;
  createdAt: number; // Unix timestamp
  lastActivityAt: number; // Unix timestamp
  messages: Message[];
  modelUsed: string; // e.g., 'gpt-4o-mini'
}
