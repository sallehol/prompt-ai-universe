
import type { Message } from '@/components/chat/ChatInterface'; // Make sure Message is exported from ChatInterface or define it here

export interface Session {
  id: string;
  name: string;
  createdAt: number; // Unix timestamp
  lastActivityAt: number; // Unix timestamp
  messages: Message[];
  modelUsed: string; // e.g., 'gpt-4o-mini'
}
