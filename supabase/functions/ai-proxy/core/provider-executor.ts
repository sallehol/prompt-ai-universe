import { SupabaseClient, User } from 'https://esm.sh/@supabase/supabase-js@2'
import { createErrorResponse, ErrorType } from '../error-utils.ts'
import { ProviderName } from '../providers/index.ts' // Updated import
import { createProviderClient } from '../clients/index.ts'; 
import { getApiKeyInternal } from '../api-keys.ts'
import { sanitizeProviderParams } from '../utils/text-model-utils.ts';

export interface ProviderExecutionResult {
  resultFromClient: any;
  finalParamsForProvider: Record<string, any>;
  errorResponse?: Response;
}

export async function executeProviderRequest(
  user: User,
  supabaseClient: SupabaseClient,
  provider: ProviderName,
  model: string,
  // Contains specific params like prompt/messages and any other passthrough params
  // including 'stream' if present.
  paramsFromRequest: Record<string, any>, 
  requestType: 'text' | 'chat',
  requestId: string
): Promise<ProviderExecutionResult> {
  const apiKey = await getApiKeyInternal(supabaseClient, user.id, provider);
    
  if (!apiKey) {
    return { 
      // @ts-ignore: errorResponse makes other fields irrelevant
      errorResponse: createErrorResponse(
        ErrorType.AUTHENTICATION,
        `API key for ${provider} is not set or could not be retrieved. Please add your API key in settings.`,
        401,
        provider
      ) 
    };
  }
  
  const client = createProviderClient(provider, apiKey);
  
  let finalParamsForProvider: Record<string, any>;
  let resultFromClient: any;

  if (requestType === 'text') {
    const { prompt, ...restParams } = paramsFromRequest;
    // Sanitize parameters before sending to provider
    // The 'stream' flag, if present, is within restParams or paramsFromRequest.stream
    finalParamsForProvider = sanitizeProviderParams({ model, prompt, ...restParams }, requestId);
    
    console.log(`[${requestId}] Sending text completion request to ${provider} via provider-executor. Payload:`, JSON.stringify(finalParamsForProvider));
    resultFromClient = await client.makeTextRequest(finalParamsForProvider);
  } else { // chat
    const { messages, ...restParams } = paramsFromRequest;
    // Sanitize parameters before sending to provider
    // The 'stream' flag, if present, is within restParams or paramsFromRequest.stream
    finalParamsForProvider = sanitizeProviderParams({ model, messages, ...restParams }, requestId);

    console.log(`[${requestId}] Sending chat completion request to ${provider} via provider-executor. Payload:`, JSON.stringify(finalParamsForProvider));
    resultFromClient = await client.makeChatRequest(finalParamsForProvider);
  }

  return { resultFromClient, finalParamsForProvider };
}
