
// supabase/functions/ai-proxy/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, verifyAuth, corsHeaders } from './auth.ts'
import { createErrorResponse, ErrorType } from './error-utils.ts'
// getProviderFromModel, ProviderName, ProviderType are not used in this version of index.ts yet
// import { getProviderFromModel, ProviderName, ProviderType } from './providers.ts'
import { 
  listProviders, 
  checkApiKeyStatus, 
  setApiKey, 
  deleteApiKey
  // getApiKeyInternal is not an endpoint, so not imported here for routing
} from './api-keys.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  try {
    // Parse the URL to determine which endpoint was called
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    
    // The first part of the path after /ai-proxy/ is the actual API path
    // e.g., /functions/v1/ai-proxy/api/health -> path parts after "ai-proxy" are ["api", "health"]
    const functionNameIndex = path.findIndex(p => p === 'ai-proxy');
    if (functionNameIndex === -1) {
        return createErrorResponse(ErrorType.VALIDATION, 'Invalid path: ai-proxy segment not found.', 400);
    }
    const apiPath = path.slice(functionNameIndex + 1);

    // apiPath[0] should be 'api'
    if (apiPath.length < 1 || apiPath[0] !== 'api') {
      return createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid endpoint structure. Expected /api/...',
        400
      )
    }
    
    // apiPath[1] is the main endpoint category e.g. 'health', 'keys'
    const mainEndpoint = apiPath[1] 
    
    // Route to the appropriate handler based on the endpoint
    switch (mainEndpoint) {
      case 'health':
        // For health check, we need to verify auth first
        const { user } = await verifyAuth(req) // supabaseClient also returned but not used here
        return new Response(
          JSON.stringify({ status: 'ok', user: { id: user.id, email: user.email } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      
      case 'keys':
        // Handle API key specific endpoints, apiPath[2] will be the sub-endpoint
        if (apiPath.length < 2) { // Must have at least /api/keys
             return createErrorResponse(ErrorType.VALIDATION, 'API key endpoint not specified.', 400);
        }
        const keyEndpoint = apiPath[2] // e.g. 'providers', 'status', 'set', 'delete'
        
        if (!keyEndpoint) { // Path was just /api/keys
            return createErrorResponse(ErrorType.VALIDATION, 'API key action not specified (e.g., /providers, /status).', 400);
        }

        switch (keyEndpoint) {
          case 'providers':
            return await listProviders(req)
          case 'status':
            return await checkApiKeyStatus(req)
          case 'set':
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST.', 405)
            return await setApiKey(req)
          case 'delete':
            // Standard for delete is often DELETE method, but prompt implies POST/body for simplicity matching 'set'
            // Allowing POST for delete as per prompt structure implied by curl example.
            // if (req.method !== 'DELETE' && req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected DELETE or POST.', 405)
            if (req.method !== 'POST') return createErrorResponse(ErrorType.VALIDATION, 'Method Not Allowed, expected POST for delete as per API design.', 405)
            return await deleteApiKey(req)
          default:
            return createErrorResponse(
              ErrorType.NOT_FOUND,
              `API key endpoint '/${keyEndpoint}' not found.`,
              404
            )
        }
      
      default:
        // If apiPath[0] was 'api' but apiPath[1] is not 'health' or 'keys'
        if (mainEndpoint) {
            return createErrorResponse(
              ErrorType.NOT_FOUND,
              `Endpoint '/api/${mainEndpoint}' not implemented.`,
              501 
            )
        }
        // This case should ideally be caught by the apiPath length check earlier
        return createErrorResponse(
            ErrorType.VALIDATION,
            'Invalid API endpoint path.',
            400
        );
    }
  } catch (error) {
    console.error('Error processing request in ai-proxy/index.ts:', error.message)
    
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    
    // Check if it's an error from createErrorResponse (already a Response object)
    if (error instanceof Response) {
        return error;
    }

    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
})
