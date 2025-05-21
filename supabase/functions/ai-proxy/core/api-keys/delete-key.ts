
// supabase/functions/ai-proxy/core/api-keys/delete-key.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from '../../auth.ts'
import { createErrorResponse, ErrorType } from '../../error-utils.ts'
import { ProviderName } from '../../providers/index.ts'

// Delete API key for a provider
export async function deleteApiKey(req: Request) {
  try {
    // Verify authentication
    const { user, supabaseClient } = await verifyAuth(req)
    
    // Parse request body
    const body = await req.json()
    const { provider } = body
    
    // Validate provider
    if (!provider || !Object.values(ProviderName).includes(provider as ProviderName)) {
      return createErrorResponse(ErrorType.VALIDATION, `Invalid or missing provider: ${provider}`, 400)
    }
    
    // Delete API key using RPC
    const { data: success, error: rpcError } = await supabaseClient.rpc(
      'delete_api_key', // RPC function name from SQL
      {
        p_user_id: user.id,
        p_provider: provider
      }
    )
    
    if (rpcError) {
      console.error('RPC delete_api_key error:', rpcError)
      throw new Error(`Failed to delete API key: ${rpcError.message}`)
    }
    
    return new Response(
      JSON.stringify({ success: success, provider }), // success here is boolean from RPC
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error deleting API key:', error.message)
    if (error.message === 'Unauthorized') {
      return createErrorResponse(ErrorType.AUTHENTICATION, 'Unauthorized', 401)
    }
    if (error.message.includes('Invalid or missing provider')) {
        return createErrorResponse(ErrorType.VALIDATION, error.message, 400);
    }
    return createErrorResponse(ErrorType.SERVER, error.message || 'An unexpected error occurred', 500)
  }
}
