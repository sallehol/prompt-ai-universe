
// supabase/functions/ai-proxy/api-keys.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders, verifyAuth } from './auth.ts'
import { createErrorResponse, ErrorType } from './error-utils.ts'
// Updated import path below
import { ProviderName } from './providers/index.ts'

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

