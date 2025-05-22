
// supabase/functions/ai-proxy/core/subscription-manager.ts

import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Database } from '../../_shared/database.types.ts' // Assuming this type definition

export interface SubscriptionStatus {
  active: boolean;
  subscriptionId?: string;
  planId?: string;
  limits?: any; // JSONB from subscription_plans.limits
  availableModels?: string[]; // JSONB from subscription_plans.available_models
  error?: string;
  errorCode?: 'NO_SUBSCRIPTION' | 'EXPIRED_SUBSCRIPTION' | 'DB_ERROR';
}

export interface LimitCheckResult {
  allowed: boolean;
  reason?: string;
  currentUsage?: number;
  limitValue?: number;
  upgradeRequired?: boolean;
  error?: string;
}

export async function checkSubscription(
  supabaseClient: SupabaseClient<Database>,
  userId: string
): Promise<SubscriptionStatus> {
  const { data, error } = await supabaseClient
    .from('subscriptions')
    .select(`
      id,
      plan_id,
      status,
      current_period_end,
      subscription_plans (
        limits,
        available_models
      )
    `)
    .eq('user_id', userId)
    .eq('status', 'active') // Only consider active subscriptions
    .single() // Assuming one active subscription per user

  if (error) {
    if (error.code === 'PGRST116') { // PostgREST error for "Row not found"
      return { active: false, error: 'No active subscription found.', errorCode: 'NO_SUBSCRIPTION' }
    }
    console.error('Error fetching subscription:', error)
    return { active: false, error: 'Database error fetching subscription.', errorCode: 'DB_ERROR' }
  }

  if (!data) { // Should be caught by PGRST116, but as a fallback
    return { active: false, error: 'No active subscription found.', errorCode: 'NO_SUBSCRIPTION' }
  }

  const now = new Date()
  const periodEnd = new Date(data.current_period_end)

  if (now > periodEnd) {
    // Optionally update status to 'expired' here if not handled by webhooks
    return { active: false, error: 'Subscription has expired.', errorCode: 'EXPIRED_SUBSCRIPTION' }
  }
  
  // Type assertion for subscription_plans
  const planData = data.subscription_plans as { limits: any; available_models: string[] } | null;

  if (!planData) {
    console.error('Subscription plan data missing for active subscription:', data.id);
    return { active: false, error: 'Subscription plan data incomplete.', errorCode: 'DB_ERROR' };
  }


  return {
    active: true,
    subscriptionId: data.id,
    planId: data.plan_id,
    limits: planData.limits,
    availableModels: planData.available_models,
  }
}

export async function checkUsageLimits(
  supabaseClient: SupabaseClient<Database>,
  userId: string,
  subscriptionId: string,
  requestType: string, // e.g., 'text', 'image'
  provider: string,
  model: string,
  currentLimits: any, // from subscription_plans.limits
  availableModels: string[] // from subscription_plans.available_models
): Promise<LimitCheckResult> {
  // 1. Check if model is available in the subscription plan
  const modelKey = `${provider}:${model}`
  if (!availableModels.includes(modelKey)) {
    return {
      allowed: false,
      reason: `Model ${modelKey} is not available in your current subscription plan.`,
      upgradeRequired: true,
    }
  }

  // 2. Check daily request type limit
  const limitKey = `daily_${requestType}_requests` // e.g., daily_text_requests
  const dailyLimitForType = currentLimits?.[limitKey]

  if (typeof dailyLimitForType !== 'number') {
    // No specific limit for this request type, or limit is not set properly
    return { allowed: true } // Or treat as not allowed if strict limits are required
  }

  // Get usage for the current day for this request type
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0) // Start of UTC day

  const { count, error: countError } = await supabaseClient
    .from('usage_records')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('subscription_id', subscriptionId)
    .eq('request_type', requestType)
    .gte('request_timestamp', today.toISOString())

  if (countError) {
    console.error('Error counting usage records:', countError)
    return { allowed: false, reason: 'Error checking usage limits.', error: countError.message }
  }

  const currentDailyUsage = count || 0;

  if (currentDailyUsage >= dailyLimitForType) {
    return {
      allowed: false,
      reason: `Daily limit for ${requestType} requests (${dailyLimitForType}) reached.`,
      currentUsage: currentDailyUsage,
      limitValue: dailyLimitForType,
      upgradeRequired: true, // Suggest upgrade if limit is hit
    }
  }

  // Potentially add more checks here (e.g., max_tokens_per_request from limits)

  return { allowed: true }
}
