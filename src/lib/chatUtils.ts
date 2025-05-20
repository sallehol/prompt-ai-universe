
import { Session } from '@/types/chat';
import { Message } from '@/components/chat/ChatInterface';

export const createNewMessage = (text: string, sender: 'user' | 'ai', model?: string): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // More unique ID
  text,
  sender,
  timestamp: new Date(),
  model,
  isSaved: false,
});

export const createInitialSession = (model: string = 'gpt-4o-mini'): Session => {
  const now = Date.now();
  return {
    id: now.toString(),
    name: 'New Chat',
    createdAt: now,
    lastActivityAt: now,
    messages: [createNewMessage('Hello! How can I help you today?', 'ai', model)],
    modelUsed: model,
  };
};
