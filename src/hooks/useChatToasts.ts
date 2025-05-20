
import { toast } from '@/hooks/use-toast';
// Message type is not directly needed here if we only pass the relevant primitive like `isSaved`

export const useChatToasts = () => {
  const showCopySuccessToast = () => {
    toast({
      title: "Copied to clipboard!",
      description: "The AI response has been copied.",
      duration: 3000,
    });
  };

  const showCopyErrorToast = () => {
    toast({
      title: "Error",
      description: "Could not copy text to clipboard.",
      variant: "destructive",
      duration: 3000,
    });
  };

  const handleCopyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showCopySuccessToast();
    } catch (err) {
      console.error('Failed to copy text to clipboard: ', err);
      showCopyErrorToast();
    }
  };
  
  const showSaveToggleToast = (currentIsSavedState: boolean | undefined) => {
    // This logic reflects the state *before* the toggle was fully processed by the parent state.
    // So, if currentIsSavedState is true (it was saved), the action was "Unsave".
    // If currentIsSavedState is false (it was not saved), the action was "Save".
    toast({
        title: !currentIsSavedState ? "Message Saved" : "Message Unsaved",
        duration: 2000,
    });
  };

  return {
    handleCopyToClipboard,
    showSaveToggleToast,
  };
};
