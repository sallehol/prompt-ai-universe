
import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/components/chat/ChatInterface'; // Assuming Message type is accessible from ChatInterface

export const useChatScroll = (messages: Message[], isAiTyping: boolean) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea component itself
  const viewportRef = useRef<HTMLDivElement>(null);   // Ref for the scrollable content viewport within ScrollArea

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: behavior,
      });
    }
  }, []);

  useEffect(() => {
    // Scroll non-smoothly for user messages and initial typing indicator
    if (isAiTyping || (messages.length > 0 && messages[messages.length - 1]?.sender === 'user')) {
      scrollToBottom('auto');
    } else if (messages.length > 0) { // Scroll smoothly for new AI messages after typing
        setTimeout(() => scrollToBottom('smooth'), 50); // Small delay for smooth scroll to be noticeable
    }
  }, [messages, isAiTyping, scrollToBottom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Show button if not at bottom and there's enough content to scroll
      const atBottom = scrollHeight - scrollTop <= clientHeight + 20; // 20px tolerance
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight);
    };

    viewport.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check on mount and when messages change

    return () => viewport.removeEventListener('scroll', handleScroll);
  }, [messages]); // Re-check on messages change as scrollHeight might change

  return {
    scrollAreaRef,
    viewportRef,
    showScrollToBottom,
    scrollToBottom,
  };
};
