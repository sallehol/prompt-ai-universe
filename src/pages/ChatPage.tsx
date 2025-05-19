
import React from 'react';
import ChatInterface from '@/components/chat/ChatInterface';

const ChatPage = () => {
  return (
    <div className="flex flex-col h-[calc(100vh-var(--navbar-height,10rem))]"> {/* Adjust height based on your navbar/header/footer */}
      <ChatInterface />
    </div>
  );
};

export default ChatPage;
