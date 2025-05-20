
import { useState, useRef, useEffect, useCallback } from 'react';
import { Message } from '@/types/chat'; // Use standardized Message type

export const useChatScroll = (messages: Message[], isAiTyping: boolean) => {
  const [showScrollToBottom, setShowScrollToBottom] = useState<boolean>(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null); // Ref for the ScrollArea component from ShadCN
  const viewportRef = useRef<HTMLDivElement>(null); // Ref for the scrollable viewport inside ScrollArea
  const isUserScrolling = useRef<boolean>(false);
  const lastMessageCountRef = useRef<number>(messages.length);
  const aiTypingScrollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const scrollToBottom = useCallback((behavior: 'smooth' | 'auto' = 'auto') => {
    // scrollAreaRef.current?.scrollTo(0, scrollAreaRef.current.scrollHeight); // This was likely for a simple div
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: behavior,
      });
    }
  }, []);

  useEffect(() => {
    const hasNewMessages = messages.length > lastMessageCountRef.current;
    // Use role for checking sender
    const isNewUserMessage = hasNewMessages && messages.length > 0 && messages[messages.length - 1]?.role === 'user';

    if (aiTypingScrollIntervalRef.current) {
      clearInterval(aiTypingScrollIntervalRef.current);
      aiTypingScrollIntervalRef.current = null;
    }

    if (isNewUserMessage) {
      scrollToBottom('auto');
      isUserScrolling.current = false;
    } else if (hasNewMessages && !isUserScrolling.current) {
      scrollToBottom('smooth');
    }

    if (isAiTyping && !isUserScrolling.current) {
      scrollToBottom('smooth');
      aiTypingScrollIntervalRef.current = setInterval(() => {
        if (viewportRef.current && !isUserScrolling.current) {
          const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
          if (scrollHeight - scrollTop - clientHeight > 5) {
            scrollToBottom('smooth');
          }
        } else if (aiTypingScrollIntervalRef.current) {
          clearInterval(aiTypingScrollIntervalRef.current);
          aiTypingScrollIntervalRef.current = null;
        }
      }, 300);
    }
    
    lastMessageCountRef.current = messages.length;

    return () => {
      if (aiTypingScrollIntervalRef.current) {
        clearInterval(aiTypingScrollIntervalRef.current);
      }
    };
  }, [messages, isAiTyping, scrollToBottom]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;

    let scrollEndTimeout: NodeJS.Timeout | null = null;

    const handleScroll = () => {
      if (!viewport) return;
      const { scrollTop, scrollHeight, clientHeight } = viewport;
      const atBottom = scrollHeight - scrollTop - clientHeight <= 20;

      setShowScrollToBottom(!atBottom && scrollHeight > clientHeight + 20);

      if (!atBottom) {
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        isUserScrolling.current = true;
      } else {
        if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        scrollEndTimeout = setTimeout(() => {
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
      if (viewportRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = viewportRef.current;
        if (scrollHeight - scrollTop - clientHeight > 20) {
            isUserScrolling.current = true;
            if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
        }
      }
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    viewport.addEventListener('touchstart', handleTouchStart, { passive: true });
    handleScroll();

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      viewport.removeEventListener('touchstart', handleTouchStart);
      if (scrollEndTimeout) clearTimeout(scrollEndTimeout);
      if (aiTypingScrollIntervalRef.current) clearInterval(aiTypingScrollIntervalRef.current);
    };
  }, [messages]);

  return {
    scrollAreaRef, // This is for the <ScrollArea> component
    viewportRef,   // This is for the direct child of <ScrollArea> that scrolls
    showScrollToBottom,
    scrollToBottom,
  };
};
