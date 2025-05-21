
// supabase/functions/ai-proxy/core/api-keys/get-key-internal.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Get API key for a provider (intended for internal use within Edge Functions)
export async function getApiKeyInternal(supabaseClient: SupabaseClient, userId: string, provider: string): Promise<string | null> {
  try {
    const { data, error: rpcError } = await supabaseClient.rpc(
      'get_api_key', // RPC function name from SQL
      {
        p_user_id: userId,
        p_provider: provider
      }
    )
    
    if (rpcError) {
      console.error(`RPC get_api_key error for provider ${provider}:`, rpcError)
      // It's important not to expose detailed errors or the key itself in logs if it were sensitive
      return null
    }
    
    return data // This will be the decrypted key or null
  } catch (error) {
    console.error(`Error in getApiKeyInternal for provider ${provider}:`, error.message)
    return null
  }
}
