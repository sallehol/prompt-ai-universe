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
  user: User, // Keep user for potential future use, logging, etc.
  supabaseClient: SupabaseClient<Database>,
  provider: ProviderName,
  model: string,
  paramsFromRequest: Record<string, any>, 
  requestType: 'text' | 'chat', // This might be determined by getRequestTypeFromModel later
  requestId: string
): Promise<ProviderExecutionResult> {
  // 1. Retrieve platform API key
  const apiKeyResult = await selectApiKey(supabaseClient, provider); // Now returns an object
  if (apiKeyResult.error || !apiKeyResult.apiKey) {
    return { 
      // @ts-ignore: errorResponse makes other fields irrelevant
      errorResponse: createErrorResponse(
        ErrorType.CONFIGURATION, 
        apiKeyResult.error || `Platform API key for ${provider} is not available.`,
        503, 
        provider
      )
    };
  }
  const apiKey = apiKeyResult.apiKey;

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
