
import { logger } from '@/utils/logger';

// It's good practice to ensure environment variables are handled correctly,
// especially for URLs. The fallback helps during local development or if the env var is missing.
const SUPABASE_PROJECT_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zxpywvtgpfqyazabsvlb.supabase.co';

if (process.env.NEXT_PUBLIC_SUPABASE_URL !== SUPABASE_PROJECT_URL) {
  logger.warn(`[apiUtils] NEXT_PUBLIC_SUPABASE_URL is not set or differs from default. Using: ${SUPABASE_PROJECT_URL}`);
}

export const API_BASE_PATH = `/functions/v1/ai-proxy`;

export const API_ENDPOINTS = {
  // Model Endpoints
  CHAT_COMPLETION: '/api/models/chat/completion',
  TEXT_COMPLETION: '/api/models/text/completion',

  // Image Endpoints
  IMAGE_GENERATION: '/api/image/generation',
  IMAGE_EDIT: '/api/image/edit',
  IMAGE_VARIATION: '/api/image/variation',

  // Audio Endpoints
  TEXT_TO_SPEECH: '/api/audio/speech',
  SPEECH_TO_TEXT: '/api/audio/transcription',

  // Video Endpoints
  VIDEO_GENERATION: '/api/video/generation',

  // API Key Management Endpoints
  LIST_PROVIDERS: '/api/keys/providers',
  CHECK_API_KEY_STATUS: '/api/keys/status',
  SET_API_KEY: '/api/keys/set',
  DELETE_API_KEY: '/api/keys/delete',

  // Usage Endpoints
  USAGE_SUMMARY: '/api/usage/summary',

  // Health Check
  HEALTH_CHECK: '/api/health',
};

export function getApiEndpoint(endpointKey: keyof typeof API_ENDPOINTS): string {
  const baseUrl = `${SUPABASE_PROJECT_URL}${API_BASE_PATH}`;
  const specificEndpoint = API_ENDPOINTS[endpointKey];
  
  if (!specificEndpoint) {
    logger.error(`[apiUtils] Unknown API endpoint key: ${endpointKey}`);
    throw new Error(`Unknown API endpoint key: ${endpointKey}`);
  }
  
  const fullUrl = `${baseUrl}${specificEndpoint}`;
  logger.log(`[apiUtils] Constructed API endpoint for ${endpointKey}: ${fullUrl}`);
  return fullUrl;
}

