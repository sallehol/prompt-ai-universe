
import { Route } from './index.ts';
import { handleHealthCheck } from './handlers/health.ts';
import { 
  handleListProviders, 
  handleCheckApiKeyStatus, 
  handleSetApiKey, 
  handleDeleteApiKey 
} from './handlers/keys.ts';
import {
  handleTextCompletionRequest, // Renamed to avoid conflict with core import
  handleChatCompletionRequest  // Renamed to avoid conflict with core import
} from './handlers/models.ts';
import {
  handleImageGenerationRequest, // Renamed
  handleImageEditRequest,       // Renamed
  handleImageVariationRequest   // Renamed
} from './handlers/image.ts';
import { handleVideoGenerationRequest } from './handlers/video.ts'; // Renamed
import {
  handleTextToSpeechRequest,    // Renamed
  handleSpeechToTextRequest     // Renamed
} from './handlers/audio.ts';
import { handleUsageSummary } from './handlers/usage.ts';

export const routes: Route[] = [
  // Health check
  { pattern: ['api', 'health'], methods: ['GET'], handler: handleHealthCheck },
  
  // API Keys
  { pattern: ['api', 'keys', 'providers'], methods: ['GET'], handler: handleListProviders },
  { pattern: ['api', 'keys', 'status'], methods: ['GET'], handler: handleCheckApiKeyStatus },
  { pattern: ['api', 'keys', 'set'], methods: ['POST'], handler: handleSetApiKey },
  { pattern: ['api', 'keys', 'delete'], methods: ['POST'], handler: handleDeleteApiKey },
  
  // Models
  { pattern: ['api', 'models', 'text', 'completion'], methods: ['POST'], handler: handleTextCompletionRequest },
  { pattern: ['api', 'models', 'chat', 'completion'], methods: ['POST'], handler: handleChatCompletionRequest },
  
  // Image
  { pattern: ['api', 'image', 'generation'], methods: ['POST'], handler: handleImageGenerationRequest },
  { pattern: ['api', 'image', 'edit'], methods: ['POST'], handler: handleImageEditRequest },
  { pattern: ['api', 'image', 'variation'], methods: ['POST'], handler: handleImageVariationRequest },
  
  // Video
  { pattern: ['api', 'video', 'generation'], methods: ['POST'], handler: handleVideoGenerationRequest },
  
  // Audio
  { pattern: ['api', 'audio', 'speech'], methods: ['POST'], handler: handleTextToSpeechRequest },
  { pattern: ['api', 'audio', 'transcription'], methods: ['POST'], handler: handleSpeechToTextRequest },
  
  // Usage
  { pattern: ['api', 'usage', 'summary'], methods: ['GET'], handler: handleUsageSummary }
];

