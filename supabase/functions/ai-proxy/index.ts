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
    const apiPath = pathParts.slice(functionNameIndex + 1);

    if (apiPath.length < 1 || apiPath[0] !== 'api') {
      return createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid endpoint structure. Path must start with /api/... after /ai-proxy/',
        400
      )
    }
    
    const mainEndpointCategory = apiPath[1] // e.g. 'health', 'keys', 'models'
    
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
      
      case 'models':
        // Path structure: /api/models/{modelType}/{modelAction}
        // e.g., /api/models/text/completion  => apiPath = ["api", "models", "text", "completion"]
        // apiPath[0]="api", apiPath[1]="models", apiPath[2]="text", apiPath[3]="completion"
        if (apiPath.length < 4) { 
          return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid model endpoint structure. Expected /api/models/{type}/{action}.',
            400
          )
        }
        
        const modelType = apiPath[2]       // "text", "chat", "image", "video", "audio"
        const modelAction = apiPath[3]     // "completion", "generation", "edit", "variation", "speech", "transcription"
        
        // Ensure POST for actions that modify or generate new data
        // GET could be used for listing models or capabilities in future, but all current actions are POST-like
        if (req.method !== 'POST' && 
            !((modelType === 'image' && modelAction === 'edit') || // Edit/Variation might involve form data with POST
              (modelType === 'image' && modelAction === 'variation') ||
              (modelType === 'audio' && modelAction === 'transcription'))) {
            // Allowing POST for all model actions initially for simplicity, but can be refined
            // The above check is an example, simpler to just enforce POST for all data-changing ops
        }
        if (req.method !== 'POST') {
             // Specific checks for methods (e.g. image edit with FormData) are handled within the endpoint handlers
             // For now, most model interactions will be POST.
        }


        switch (modelType) {
          case 'text':
            if (modelAction === 'completion') {
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleTextCompletion(req);
            }
            break;
          case 'chat':
            if (modelAction === 'completion') {
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleChatCompletion(req);
            }
            break;
          case 'image':
            if (modelAction === 'generation') {
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleImageGeneration(req);
            } else if (modelAction === 'edit') {
              // FormData requests are POST
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleImageEdit(req);
            } else if (modelAction === 'variation') { // New endpoint for image variations
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleImageVariation(req);
            }
            break;
          case 'video':
            if (modelAction === 'generation') {
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleVideoGeneration(req);
            }
            break;
          case 'audio':
            if (modelAction === 'speech') { // Text-to-speech
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleTextToSpeech(req);
            } else if (modelAction === 'transcription') { // Speech-to-text
              // FormData requests are POST
              if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
              return await handleSpeechToText(req);
            }
            break;
        }
        
        return createErrorResponse(
          ErrorType.NOT_FOUND,
          `Model endpoint /${modelType}/${modelAction} not found or not supported.`,
          404
        );
      
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
