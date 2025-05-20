
import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/utils/logger';
import { ApiKeyService } from '@/services/ApiKeyService'; // Import the new service

export const useApiKeys = () => {
  const [apiKeys, setApiKeys] = useState<Record<string, string>>({});
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    logger.log('[useApiKeys] Attempting to load API keys from storage.');
    const loadedKeys = ApiKeyService.loadApiKeysFromStorage();
    setApiKeys(loadedKeys);
    setIsLoaded(true);
    logger.log('[useApiKeys] API keys loaded into state.', loadedKeys);
  }, []);

  useEffect(() => {
    if (isLoaded) {
      logger.log('[useApiKeys] API keys or loaded status changed, attempting to save to storage.', apiKeys);
      ApiKeyService.saveApiKeysToStorage(apiKeys);
    }
  }, [apiKeys, isLoaded]);

  const getApiKey = useCallback((provider: string): string => {
    return apiKeys[provider] || '';
  }, [apiKeys]);

  const setApiKey = useCallback((provider: string, key: string) => {
    logger.log(`[useApiKeys] Setting API key for provider: ${provider}`);
    setApiKeys(prev => {
      const newKeys = { ...prev, [provider]: key };
      return newKeys;
    });
  }, []);

  const removeApiKey = useCallback((provider: string) => {
    logger.log(`[useApiKeys] Removing API key for provider: ${provider}`);
    setApiKeys(prev => {
      const newKeys = { ...prev };
      delete newKeys[provider];
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

