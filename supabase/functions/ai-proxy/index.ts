// supabase/functions/ai-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, verifyAuth, corsHeaders } from './auth.ts'
import { createErrorResponse, ErrorType } from './error-utils.ts' // Removed handleProviderError as it's used in other endpoint files
import { getProviderFromModel, ProviderName, ProviderType } from './providers.ts'
import { 
  listProviders, 
  checkApiKeyStatus, 
  setApiKey, 
  deleteApiKey
  // getApiKeyInternal is not imported here, it's used by endpoint handlers
} from './api-keys.ts'
import {
  handleTextCompletion,
  handleChatCompletion
} from './text-models.ts'
import {
  handleImageGeneration,
  handleImageEdit,
  handleImageVariation, // Added new handler
  handleVideoGeneration,
  handleTextToSpeech,
  handleSpeechToText
} from './multimodal-endpoints.ts' // New import for multimodal handlers

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  try {
    const url = new URL(req.url)
    const pathParts = url.pathname.split('/').filter(Boolean)
    
    const functionNameIndex = pathParts.findIndex(p => p === 'ai-proxy');
    if (functionNameIndex === -1) {
        return createErrorResponse(ErrorType.VALIDATION, 'Invalid path: ai-proxy segment not found.', 400);
    }
    // apiPath will be like ["api", "models", "text", "completion"] or ["api", "image", "generation"]
    const apiPath = pathParts.slice(functionNameIndex + 1);

    if (apiPath.length < 1 || apiPath[0] !== 'api') {
      return createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid endpoint structure. Path must start with /api/... after /ai-proxy/',
        400
      )
    }
    
    const mainEndpointCategory = apiPath[1] // e.g. 'health', 'keys', 'models', 'image', 'video', 'audio'
    
    switch (mainEndpointCategory) {
      case 'health':
        // For health check, we need to verify auth first
        const { user } = await verifyAuth(req) // supabaseClient also returned but not used here
        return new Response(
          JSON.stringify({ status: 'ok', user: { id: user.id, email: user.email } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      
      case 'keys':
        if (apiPath.length < 3) { // Expects /api/keys/{action}
             return createErrorResponse(ErrorType.VALIDATION, 'API key action not specified (e.g., /providers, /status).', 400);
        }
        const keyAction = apiPath[2]
        
        switch (keyAction) {
          case 'providers':
            return await listProviders(req)
          case 'status':
            return await checkApiKeyStatus(req)
          case 'set':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
            return await setApiKey(req)
          case 'delete':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST for delete.', 405)
            return await deleteApiKey(req)
          default:
            return createErrorResponse(
              ErrorType.NOT_FOUND,
              `API key action '/${keyAction}' not found.`,
              404
            )
        }
      
      case 'models': // This will now only handle text/chat models
        // Path structure: /api/models/{modelType}/{modelAction}
        // e.g., /api/models/text/completion  => apiPath = ["api", "models", "text", "completion"]
        if (apiPath.length < 4) { 
          return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid model endpoint structure. Expected /api/models/{type}/{action}.',
            400
          )
        }
        
        const modelType = apiPath[2]       // "text", "chat"
        const modelAction = apiPath[3]     // "completion"
        
        if (req.method !== 'POST') {
            return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        }

        switch (modelType) {
          case 'text':
            if (modelAction === 'completion') {
              return await handleTextCompletion(req);
            }
            break;
          case 'chat':
            if (modelAction === 'completion') {
              return await handleChatCompletion(req);
            }
            break;
        }
        
        return createErrorResponse(
          ErrorType.NOT_FOUND,
          `Model endpoint /${modelType}/${modelAction} not found or not supported.`,
          404
        );

      case 'image':
        // Path structure: /api/image/{action} e.g. /api/image/generation
        if (apiPath.length < 3) { 
          return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid image endpoint structure. Expected /api/image/{action}.',
            400
          );
        }
        const imageAction = apiPath[2]; // "generation", "edit", "variation"
        if (req.method !== 'POST') {
          return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        }
        switch (imageAction) {
          case 'generation':
            return await handleImageGeneration(req);
          case 'edit':
            return await handleImageEdit(req);
          case 'variation':
            return await handleImageVariation(req);
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Image action '/${imageAction}' not found.`, 404);

      case 'video':
        // Path structure: /api/video/{action} e.g. /api/video/generation
        if (apiPath.length < 3) {
          return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid video endpoint structure. Expected /api/video/{action}.',
            400
          );
        }
        const videoAction = apiPath[2]; // "generation"
        if (req.method !== 'POST') {
          return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        }
        switch (videoAction) {
          case 'generation':
            return await handleVideoGeneration(req);
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Video action '/${videoAction}' not found.`, 404);
        
      case 'audio':
        // Path structure: /api/audio/{action} e.g. /api/audio/speech
        if (apiPath.length < 3) {
          return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid audio endpoint structure. Expected /api/audio/{action}.',
            400
          );
        }
        const audioAction = apiPath[2]; // "speech", "transcription"
        if (req.method !== 'POST') {
          return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405);
        }
        switch (audioAction) {
          case 'speech': // Text-to-speech
            return await handleTextToSpeech(req);
          case 'transcription': // Speech-to-text
            return await handleSpeechToText(req);
        }
        return createErrorResponse(ErrorType.NOT_FOUND, `Audio action '/${audioAction}' not found.`, 404);
      
      default:
        if (mainEndpointCategory) {
            return createErrorResponse(
              ErrorType.NOT_FOUND,
              `Endpoint category '/api/${mainEndpointCategory}' not implemented.`,
              501 
            )
        }
        return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid API endpoint path. Main category not specified.',
            400
        );
    }
  } catch (error) {
    console.error('Error processing request in ai-proxy/index.ts:', error.message, error.stack)
    
    if (error.message === 'Unauthorized') { // From verifyAuth if it throws directly
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    
    // Check if it's an error from createErrorResponse (already a Response object)
    if (error instanceof Response) {
        return error;
    }

    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
})
