
import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => void;
}

const MessageInput = ({ onSendMessage }: MessageInputProps) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-border bg-deep-bg/50">
      <div className="flex items-center space-x-2">
        <Input
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          className="flex-grow bg-card/70 border-border focus:ring-neon-cyan text-light-text placeholder-medium-text"
          aria-label="Chat message input"
        />
        <Button type="submit" className="bg-neon-cyan text-deep-bg hover:bg-cyan-300" aria-label="Send message">
          <Send size={18} />
        </Button>
      </div>
    </form>
  );
};

export default MessageInput;
