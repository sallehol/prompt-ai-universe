
import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/components/chat/ChatInterface';

export const useChatScroll = (messages: Message[], isAiTyping: boolean) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);
  const isUserScrolling = useRef<boolean>(false);
  const lastMessageCountRef = useRef<number>(messages.length); // Renamed for clarity
  const aiTypingScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
    if (viewportRef.current) {
      const scrollHeight = viewportRef.current.scrollHeight;
      viewportRef.current.scrollTo({
        top: scrollHeight,
        behavior: behavior,
      });
      // console.log(`[useChatScroll] Scrolled to bottom. Behavior: ${behavior}, Height: ${scrollHeight}`);
    }
  }, []);

  // Handle automatic scrolling for new messages and AI typing
  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    const isNewUserMessage = hasNewMessages && messages.length > 0 && messages[messages.length - 1]?.sender === 'user';

    // Clear previous interval if AI stops typing or messages change
    if (aiTypingScrollIntervalRef.current) {
      clearInterval(aiTypingScrollIntervalRef.current);
      aiTypingScrollIntervalRef.current = null;
    }

    if (isNewUserMessage) {
      // Always scroll immediately for user's own messages
      scrollToBottom('auto');
      isUserScrolling.current = false; // Assume user wants to see their own message
    } else if (hasNewMessages && !isUserScrolling.current) {
      // Smooth scroll for new AI messages if user hasn't scrolled up
      scrollToBottom('smooth');
    }

    if (isAiTyping && !isUserScrolling.current) {
      // If AI is typing and user isn't scrolled up, start/continue scrolling
      scrollToBottom('smooth'); // Initial scroll
      aiTypingScrollIntervalRef.current = setInterval(() => {
        if (viewportRef.current && !isUserScrolling.current) {
          const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
          // Only scroll if not already at/near the bottom to avoid jitter
          if (scrollHeight - scrollTop - clientHeight > 5) { 
            scrollToBottom('smooth');
          }
        } else if (aiTypingScrollIntervalRef.current) {
          // Clear interval if user starts scrolling or viewport is gone
          clearInterval(aiTypingScrollIntervalRef.current);
          aiTypingScrollIntervalRef.current = null;
        }
      }, 300); // Adjust interval as needed
    }
    
    lastMessageCountRef.current = messages.length;

    return () => {
      if (aiTypingScrollIntervalRef.current) {
        clearInterval(aiTypingScrollIntervalRef.current);
      }
    };
  }, [messages, isAiTyping, scrollToBottom]);

  // Add event listeners to detect user scrolling and update showScrollToBottom button
  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let scrollEndTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (!viewport) return;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 20; // 20px tolerance

      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 20); // Show if not at bottom and there's enough to scroll

      // User is considered to be scrolling if they are not at the bottom.
      // Debounce setting isUserScrolling.current to true to avoid issues with programmatic scrolls.
      if (!atBottom) {
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        isUserScrolling.current = true; // Set immediately when scrolling up
      } else {
        // If scrolled to bottom, reset the flag after a short delay to ensure it's user action
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
          // Re-check atBottom condition as state might have changed (e.g., new message arrived)
          if (viewportRef.current) {
             const currentScrollTop = viewportRef.current.scrollTop;
             const currentScrollHeight = viewportRef.current.scrollHeight;
             const currentClientHeight = viewportRef.current.clientHeight;
             if (currentScrollHeight - currentScrollTop - currentClientHeight <= 20) {
                isUserScrolling.current = false;
             }
          }
        }, 150);
      }
    };
    
    const handleTouchStart = () => {
      // Any touch interaction that isn't at the very bottom might indicate user intent to scroll
      if (viewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
        if (scrollHeight - scrollTop - clientHeight > 20) {
            isUserScrolling.current = true;
            if (scrollEndTimeout) clearTimeout(scrollEndTimeout); // Clear any pending reset
        }
      }
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    handleScroll(); // Initial check

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      viewport.removeEventListener('touchstart', handleTouchStart);
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
      if (aiTypingScrollIntervalRef.current) clearInterval(aiTypingScrollIntervalRef.current);
    };
  }, [messages]); // Re-check on messages change as scrollHeight might change and to re-evaluate isUserScrolling

  return {
    scrollAreaRef,
    viewportRef,
    showScrollToBottom,
    scrollToBottom,
  };
};
