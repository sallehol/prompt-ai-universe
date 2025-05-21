
// supabase/functions/ai-proxy/core/api-keys/set-key.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from '../../auth.ts'
import { createErrorResponse, ErrorType } from '../../error-utils.ts'
import { ProviderName } from '../../providers/index.ts'

// Set API key for a provider
export async function setApiKey(req: Request) {
  try {
    // Verify authentication
    const { user, supabaseClient } = await verifyAuth(req)
    
    // Parse request body
    const body = await req.json()
    const { provider, key } = body
    
    // Validate provider
    if (!provider || !Object.values(ProviderName).includes(provider as ProviderName)) {
      return createErrorResponse(ErrorType.VALIDATION, `Invalid or missing provider: ${provider}`, 400)
    }
    
    // Validate API key
    if (!key || typeof key !== 'string' || key.trim() === '') {
      return createErrorResponse(ErrorType.VALIDATION, 'API key is required and must be a non-empty string', 400)
    }
    
    // Store API key using RPC
    const { data: success, error: rpcError } = await supabaseClient.rpc(
      'store_api_key', // RPC function name from SQL
      {
        p_user_id: user.id,
        p_provider: provider,
        p_api_key: key
      }
    )
    
    if (rpcError) {
      console.error('RPC store_api_key error:', rpcError)
      throw new Error(`Failed to store API key: ${rpcError.message}`)
    }
    if (!success) {
        throw new Error('Storing API key failed for an unknown reason (RPC returned false).')
    }
    
    return new Response(
      JSON.stringify({ success: true, provider }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error setting API key:', error.message)
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    // Check if it's a known validation error from our code
    if (error.message.includes('Invalid or missing provider') || error.message.includes('API key is required')) {
        return createErrorResponse(ErrorType.VALIDATION, error.message, 400);
    }
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
}
