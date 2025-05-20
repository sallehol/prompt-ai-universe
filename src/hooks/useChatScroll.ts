
import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/components/chat/ChatInterface';

export const useChatScroll = (messages: Message[], isAiTyping: boolean) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea component itself
  const viewportRef = useRef<HTMLDivElement>(null);   // Ref for the scrollable content viewport within ScrollArea
  const isUserScrolling = useRef<boolean>(false);     // Track if user is manually scrolling
  const lastMessageRef = useRef<number>(messages.length); // Track message count to detect new messages

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
    if (viewportRef.current) {
      const scrollHeight = viewportRef.current.scrollHeight;
      viewportRef.current.scrollTo({
        top: scrollHeight,
        behavior: behavior,
      });
      console.log(`[useChatScroll] Scrolled to bottom. Behavior: ${behavior}, Height: ${scrollHeight}`);
    }
  }, []);

  // Handle automatic scrolling when new messages are added
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageRef.current;
    const isNewUserMessage = hasNewMessages && messages[messages.length - 1]?.sender === 'user';
    
    // Always scroll on user messages or typing indicator changes
    if (isNewUserMessage || isAiTyping) {
      scrollToBottom('auto');
    } 
    // For AI responses, use smooth scrolling
    else if (hasNewMessages && !isUserScrolling.current) {
      scrollToBottom('smooth');
    }
    
    // Update last message count
    lastMessageRef.current = messages.length;
  }, [messages, isAiTyping, scrollToBottom]);

  // Add event listeners to detect user scrolling
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    const handleScroll = () => {
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      // Show button if not at bottom and there's enough content to scroll
      const atBottom = scrollHeight - scrollTop - clientHeight <= 20; // 20px tolerance
      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight);
      
      // Track if user is actively scrolling up
      if (!atBottom) {
        isUserScrolling.current = true;
      } else {
        // Reset the flag when user scrolls to bottom
        isUserScrolling.current = false;
      }
    };
    
    // Add touchstart listener to detect user interaction on mobile
    const handleTouchStart = () => {
      isUserScrolling.current = true;
    };

    viewport.addEventListener('scroll', handleScroll);
    viewport.addEventListener('touchstart', handleTouchStart);
    handleScroll(); // Initial check on mount and when messages change

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      viewport.removeEventListener('touchstart', handleTouchStart);
    };
  }, [messages]); // Re-check on messages change as scrollHeight might change

  return {
    scrollAreaRef,
    viewportRef,
    showScrollToBottom,
    scrollToBottom,
  };
};
