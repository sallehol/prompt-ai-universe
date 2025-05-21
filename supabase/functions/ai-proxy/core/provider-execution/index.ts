
// supabase/functions/ai-proxy/core/provider-execution/index.ts
import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { ProviderName } from '../../providers/index.ts'
import { createProviderClient } from '../../clients/index.ts'
import { retrieveValidatedApiKey } from './apiKeyHandler.ts'
import { sendTextRequest, sendChatRequest } from './requestSender.ts'
import { ProviderExecutionResult } from './interfaces.ts'

export { ProviderExecutionResult } from './interfaces.ts' // Re-export for convenience

export async function executeProviderRequest(
  user: User,
  supabaseClient: SupabaseClient,
  provider: ProviderName,
  model: string,
  paramsFromRequest: Record<string, any>, 
  requestType: 'text' | 'chat',
  requestId: string
): Promise<ProviderExecutionResult> {
  // 1. Retrieve and validate API key
  const apiKeyResult = await retrieveValidatedApiKey(supabaseClient, user.id, provider);
  if (apiKeyResult.errorResponse) {
    return { 
      // @ts-ignore: errorResponse makes other fields irrelevant, type expects all fields
      errorResponse: apiKeyResult.errorResponse 
    };
  }
  const { apiKey } = apiKeyResult;

  // 2. Create provider client
  const client = createProviderClient(provider, apiKey);
  
  // 3. Send request based on type
  if (requestType === 'text') {
    const { resultFromClient, finalParamsForProvider } = await sendTextRequest({
      client,
      provider,
      model,
      paramsFromRequest,
      requestId,
    });
    return { resultFromClient, finalParamsForProvider };
  } else { // chat
    const { resultFromClient, finalParamsForProvider } = await sendChatRequest({
      client,
      provider,
      model,
      paramsFromRequest,
      requestId,
    });
    return { resultFromClient, finalParamsForProvider };
  }
}
