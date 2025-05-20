
import { Session, Message } from '@/types/chat'; // Updated Message import

// Changed signature: text -> content, sender -> role
// Removed model from parameters as it's not part of the Message type from @/types/chat
// Timestamp is now a number (Date.now())
export const createNewMessage = (content: string, role: 'user' | 'assistant'): Message => ({
  id: Date.now().toString() + Math.random().toString(36).substring(2, 7), // More unique ID
  content, // Changed from text
  role,    // Changed from sender
  timestamp: Date.now(), // Changed from new Date()
  isSaved: false,
  // model property is not part of the Message type in @/types/chat
});

export const createInitialSession = (model: string = 'gpt-4o-mini'): Session => {
  const now = Date.now();
  return {
    id: now.toString(),
    name: 'New Chat',
    createdAt: now,
    lastActivityAt: now,
    // Updated to call createNewMessage with role 'assistant' and correct content
    // The 'model' parameter of createInitialSession is used for session.modelUsed,
    // not directly in the initial message object itself.
    messages: [createNewMessage('Hello! How can I help you today?', 'assistant')],
    modelUsed: model,
  };
};

