
// supabase/functions/ai-proxy/core/api-keys/check-status.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from '../../auth.ts'
import { createErrorResponse, ErrorType } from '../../error-utils.ts'
import { ProviderName } from '../../providers/index.ts'

// Check API key status for each provider
export async function checkApiKeyStatus(req: Request) {
  try {
    // Verify authentication
    const { user, supabaseClient } = await verifyAuth(req)
    
    // Get all provider names
    const allProviderNames = Object.values(ProviderName)
    
    // Call the RPC function to get providers for which the user has keys
    const { data: userStoredProviders, error: rpcError } = await supabaseClient.rpc(
      'list_api_keys', // RPC function name from SQL
      { p_user_id: user.id }
    )
    
    if (rpcError) {
      console.error('RPC list_api_keys error:', rpcError)
      throw new Error(`Failed to list API keys: ${rpcError.message}`)
    }
    
    // Create a map of provider to API key status
    const keysStatus: Record<string, boolean> = {}
    
    // Initialize all providers to false
    for (const provider of allProviderNames) {
      keysStatus[provider] = false
    }
    
    // Set providers with API keys to true
    // userStoredProviders is an array of objects like [{provider: 'openai'}, {provider: 'google'}]
    if (userStoredProviders && Array.isArray(userStoredProviders)) {
        for (const item of userStoredProviders) {
            if (item && typeof item.provider === 'string' && allProviderNames.includes(item.provider as ProviderName)) {
                 keysStatus[item.provider] = true
            }
        }
    }
    
    return new Response(
      JSON.stringify({ keys: keysStatus }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error checking API key status:', error.message)
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
}
