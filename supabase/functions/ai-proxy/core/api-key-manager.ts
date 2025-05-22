// supabase/functions/ai-proxy/core/api-key-manager.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../_shared/database.types.ts'

// Updated to call the get_api_key SQL function and return an object
export async function selectApiKey(
  supabaseClient: SupabaseClient<Database>,
  provider: string,
  userId: string // Added userId to be passed to the RPC
): Promise<{ apiKey: string | null; error: string | null }> {
  try {
    // Normalize provider name to lowercase to avoid case sensitivity issues.
    const normalizedProvider = provider.toLowerCase();

    const { data: apiKeyFromRpc, error: rpcError } = await supabaseClient.rpc(
      'get_api_key',
      {
        p_user_id: userId,
        p_provider: normalizedProvider,
      }
    );

    if (rpcError) {
      console.error(`[selectApiKey] RPC get_api_key error for provider "${normalizedProvider}" and user "${userId}":`, rpcError.message, rpcError.details, rpcError.hint);
      return { apiKey: null, error: `Failed to retrieve API key due to a database error: ${rpcError.message}` };
    }

    if (!apiKeyFromRpc) {
      // This can happen if the SQL function returns NULL (e.g., no active subscription, no key for provider).
      console.warn(`[selectApiKey] No API key returned by RPC get_api_key for provider "${normalizedProvider}" and user "${userId}". This may be due to an inactive subscription, the key not being found, or the provider name mismatch.`);
      return { apiKey: null, error: `Platform API key for provider "${provider}" is not available, user subscription may be inactive, or key is not configured for this provider.` };
    }

    // The SQL function 'get_api_key' already handles incrementing usage_count.
    return { apiKey: apiKeyFromRpc, error: null };

  } catch (error) {
    console.error(`[selectApiKey] Unexpected error fetching API key for provider "${provider}" and user "${userId}":`, error.message, error.stack);
    return { apiKey: null, error: `An unexpected error occurred while retrieving the API key: ${error.message}` };
  }
}

export async function recordUsage(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  subscriptionId: string,
  requestType: string,
  provider: string,
  model: string,
  tokensInput: number,
  tokensOutput: number
): Promise<void> {
  // Get pricing information for the model
  const { data: modelData, error: modelError } = await supabaseClient
    .from('provider_models')
    .select('pricing_input, pricing_output')
    .eq('provider', provider)
    .eq('model_id', model)
    .single()

  let cost = 0
  if (!modelError && modelData && modelData.pricing_input !== null && modelData.pricing_output !== null) {
    // Calculate cost based on tokens and pricing (assuming pricing is per token)
    // Ensure pricing_input and pricing_output are treated as numbers
    const pricingInput = Number(modelData.pricing_input)
    const pricingOutput = Number(modelData.pricing_output)
    cost = tokensInput * pricingInput + tokensOutput * pricingOutput
  } else {
    if (modelError) console.warn(`Error fetching pricing for ${provider}:${model}: ${modelError.message}`);
    else console.warn(`Pricing information not found or incomplete for ${provider}:${model}`)
  }

  // Record usage
  const { error: insertError } = await supabaseClient.from('usage_records').insert({
    user_id: userId,
    subscription_id: subscriptionId,
    request_type: requestType,
    provider,
    model,
    tokens_input: tokensInput,
    tokens_output: tokensOutput,
    cost_usd: cost,
    // request_timestamp is defaulted by the table
  })

  if (insertError) {
    console.error(`Failed to record usage: ${insertError.message}`)
  }
}

// Helper function to determine request type based on model
export async function getRequestTypeFromModel(
  supabaseClient: SupabaseClient<Database>,
  provider: string,
  model: string
): Promise<string> {
  const { data, error } = await supabaseClient
    .from('provider_models')
    .select('model_type')
    .eq('provider', provider)
    .eq('model_id', model)
    .single()

  if (error || !data) {
    console.warn(`Model type not found for ${provider}:${model}, defaulting to 'text'. Error: ${error?.message}`)
    return 'text' // Default if not found
  }

  return data.model_type
}
