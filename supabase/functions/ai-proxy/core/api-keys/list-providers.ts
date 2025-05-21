
// supabase/functions/ai-proxy/core/api-keys/list-providers.ts
import { corsHeaders, verifyAuth } from '../../auth.ts'
import { createErrorResponse, ErrorType } from '../../error-utils.ts'
import { ProviderName } from '../../providers/index.ts'

// List all available providers
export async function listProviders(req: Request) {
  try {
    // Verify authentication (user and supabaseClient are not strictly needed here but good for consistency)
    await verifyAuth(req)
    
    // Return all available providers from the enum
    const providers = Object.values(ProviderName)
    
    return new Response(
      JSON.stringify({ providers }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error listing providers:', error.message)
    // If verifyAuth fails, it throws 'Unauthorized'
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
}
