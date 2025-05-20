
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';

const API_KEYS_STORAGE_KEY = 'api_keys';

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (storedKeys) {
        setApiKeys(JSON.parse(storedKeys));
      }
    } catch (error) {
      logger.error('Error loading API keys from localStorage:', error);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    if (isLoaded && Object.keys(apiKeys).length >= 0) { // Also save if all keys are removed
      try {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(apiKeys));
      } catch (error) {
        logger.error('Error saving API keys to localStorage:', error);
      }
    }
  }, [apiKeys, isLoaded]);

  const getApiKey = useCallback((provider: string): string => {
    return apiKeys[provider] || '';
  }, [apiKeys]);

  const setApiKey = useCallback((provider: string, key: string) => {
    setApiKeys(prev => ({
      ...prev,
      [provider]: key,
    }));
  }, []);

  const removeApiKey = useCallback((provider: string) => {
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
      // If newKeys is empty, ensure localStorage reflects this
      if (Object.keys(newKeys).length === 0) {
          localStorage.removeItem(API_KEYS_STORAGE_KEY);
      }
      return newKeys;
    });
  }, []);

  return {
    apiKeys,
    getApiKey,
    setApiKey,
    removeApiKey,
    isApiKeysLoaded: isLoaded,
  };
};
