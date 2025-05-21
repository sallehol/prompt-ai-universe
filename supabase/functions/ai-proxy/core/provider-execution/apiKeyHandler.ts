
// supabase/functions/ai-proxy/core/provider-execution/apiKeyHandler.ts
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { createErrorResponse, ErrorType } from '../../error-utils.ts'
import { ProviderName } from '../../providers/index.ts'
import { getApiKeyInternal } from '../api-keys/index.ts'

export async function retrieveValidatedApiKey(
  supabaseClient: SupabaseClient,
  userId: string,
  provider: ProviderName
): Promise<{ apiKey: string; errorResponse?: undefined } | { apiKey?: undefined; errorResponse: Response }> {
  const apiKey = await getApiKeyInternal(supabaseClient, userId, provider);
    
  if (!apiKey) {
    return { 
      errorResponse: createErrorResponse(
        ErrorType.AUTHENTICATION,
        `API key for ${provider} is not set or could not be retrieved. Please add your API key in settings.`,
        401,
        provider
      ) 
    };
  }
  return { apiKey };
}
