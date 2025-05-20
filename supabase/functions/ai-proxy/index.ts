
// index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { handleCors, verifyAuth, corsHeaders } from './auth.ts' // Updated import path
import { createErrorResponse, ErrorType } from './error-utils.ts' // Updated import path
// getProviderFromModel, ProviderName, ProviderType are not used in this version of index.ts yet
// import { getProviderFromModel, ProviderName, ProviderType } from './providers.ts'

serve(async (req) => {
  // Handle CORS preflight requests
  const corsResponse = handleCors(req)
  if (corsResponse) return corsResponse
  
  try {
    // Verify authentication
    const { user } = await verifyAuth(req) // supabaseClient is returned but not used here
    
    // Parse the URL to determine which endpoint was called
    const url = new URL(req.url)
    const path = url.pathname.split('/').filter(Boolean)
    
    // The first part of the path after /ai-proxy/ is the actual API path
    // e.g., /functions/v1/ai-proxy/api/health -> path parts after "ai-proxy" are ["api", "health"]
    const functionNameIndex = path.findIndex(p => p === 'ai-proxy');
    const apiPath = path.slice(functionNameIndex + 1);


    if (apiPath.length < 2 || apiPath[0] !== 'api') {
      return createErrorResponse(
        ErrorType.VALIDATION,
        'Invalid endpoint structure. Expected /api/...',
        400
      )
    }
    
    const endpoint = apiPath[1]
    
    // Route to the appropriate handler based on the endpoint
    switch (endpoint) {
      case 'health':
        return new Response(
          JSON.stringify({ status: 'ok', user: { id: user.id, email: user.email } }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      default:
        return createErrorResponse(
          ErrorType.NOT_FOUND,
          'Endpoint not implemented',
          501 // Changed from 404 to 501 as per user prompt example
        )
    }
  } catch (error) {
    console.error('Error processing request in ai-proxy/index.ts:', error)
    
    if (error.message === 'Unauthorized') {
      return createErrorResponse(
        ErrorType.AUTHENTICATION,
        'Unauthorized',
        401
      )
    }
    
    // Check if it's an error from createErrorResponse (already a Response object)
    if (error instanceof Response) {
        return error;
    }

    return createErrorResponse(
      ErrorType.SERVER,
      error.message || 'An unexpected error occurred',
      500
    )
  }
})
