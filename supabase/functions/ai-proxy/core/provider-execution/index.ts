
// supabase/functions/ai-proxy/core/provider-execution/index.ts
import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { ProviderName } from '../../providers/index.ts'
import { createProviderClient } from '../../clients/index.ts'
import { selectApiKey } from '../api-key-manager.ts' 
import { sendTextRequest, sendChatRequest } from './requestSender.ts'
import { ProviderExecutionResult } from './interfaces.ts'
import { createErrorResponse, ErrorType } from '../../error-utils.ts'
// Updated import path
import { Database } from '../../../_shared/database.types.ts'; 

export type { ProviderExecutionResult }; // Re-export for convenience

export async function executeProviderRequest(
  user: User, 
  supabaseClient: SupabaseClient<Database>,
  provider: ProviderName,
  model: string,
  paramsFromRequest: Record<string, any>, 
  requestType: 'text' | 'chat', 
  requestId: string
): Promise<ProviderExecutionResult> {
  // 1. Retrieve platform API key by calling selectApiKey with userId
  // The selectApiKey function now calls the get_api_key RPC
  const apiKeyResult = await selectApiKey(supabaseClient, provider, user.id); 
  
  if (apiKeyResult.error || !apiKeyResult.apiKey) {
    const errorMessage = apiKeyResult.error || `Platform API key for ${provider} is not available.`;
    console.error(`[executeProviderRequest] Error retrieving API key for provider ${provider}, user ${user.id}: ${errorMessage}`);
    return { 
      // @ts-ignore: errorResponse makes other fields irrelevant, but TS needs all fields if not explicitly typed as a union
      errorResponse: createErrorResponse(
        ErrorType.CONFIGURATION, 
        errorMessage,
        503, // Service Unavailable, as key config is a server-side issue
        provider
      )
    };
  }
  const apiKey = apiKeyResult.apiKey; // This is now guaranteed to be a string if no error

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
