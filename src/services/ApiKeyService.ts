
import { logger } from '@/utils/logger';

const API_KEYS_STORAGE_KEY = 'api_keys';

export const ApiKeyService = {
  loadApiKeysFromStorage: (): Record<string, string> => {
    try {
      const storedKeys = localStorage.getItem(API_KEYS_STORAGE_KEY);
      if (storedKeys) {
        return JSON.parse(storedKeys);
      }
    } catch (error) {
      logger.error('Error loading API keys from localStorage:', error);
    }
    return {};
  },

  saveApiKeysToStorage: (keys: Record<string, string>): void => {
    try {
      if (Object.keys(keys).length === 0) {
        localStorage.removeItem(API_KEYS_STORAGE_KEY);
        logger.log('[ApiKeyService] All API keys removed, clearing from localStorage.');
      } else {
        localStorage.setItem(API_KEYS_STORAGE_KEY, JSON.stringify(keys));
        logger.log('[ApiKeyService] API keys saved to localStorage.');
      }
    } catch (error) {
      logger.error('Error saving API keys to localStorage:', error);
    }
  },
};

