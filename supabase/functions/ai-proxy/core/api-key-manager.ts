
// supabase/functions/ai-proxy/core/api-key-manager.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../_shared/database.types.ts' // Assuming you have this type definition

export async function selectApiKey(
  supabaseClient: SupabaseClient<Database>,
  provider: string
): Promise<string | null> {
  // Get active key with lowest usage_count
  const { data, error } = await supabaseClient
    .from('platform_api_keys')
    .select('id, key_value, usage_count')
    .eq('provider', provider)
    .eq('is_active', true)
    .order('usage_count', { ascending: true })
    .limit(1)
    .single()

  if (error || !data) {
    console.error(`No active API key found for provider: ${provider}. Error: ${error?.message}`)
    return null
  }

  // Increment usage_count counter and update last_used_at
  const { error: updateError } = await supabaseClient
    .from('platform_api_keys')
    .update({
      usage_count: (data.usage_count || 0) + 1,
      last_used_at: new Date().toISOString(),
    })
    .eq('id', data.id)

  if (updateError) {
    console.error(`Failed to update usage_count for API key ${data.id}: ${updateError.message}`)
    // Proceeding with the key anyway, as it was successfully retrieved.
  }

  return data.key_value
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

