
// supabase/functions/ai-proxy/core/provider-execution/requestSender.ts
import { ProviderClient } from '../../clients/index.ts'
import { sanitizeProviderParams } from '../../utils/text-model-utils.ts'
import { ProviderName } from '../../providers/index.ts';

interface RequestSenderParams {
  client: ProviderClient;
  provider: ProviderName;
  model: string;
  paramsFromRequest: Record<string, any>;
  requestId: string;
}

interface RequestSenderResult {
  resultFromClient: any;
  finalParamsForProvider: Record<string, any>;
}

export async function sendTextRequest(
  { client, provider, model, paramsFromRequest, requestId }: RequestSenderParams
): Promise<RequestSenderResult> {
  const { prompt, ...restParams } = paramsFromRequest;
  const finalParamsForProvider = sanitizeProviderParams({ model, prompt, ...restParams }, requestId);
  
  console.log(`[${requestId}] Sending text completion request to ${provider} via requestSender. Payload:`, JSON.stringify(finalParamsForProvider));
  const resultFromClient = await client.makeTextRequest(finalParamsForProvider);
  return { resultFromClient, finalParamsForProvider };
}

export async function sendChatRequest(
  { client, provider, model, paramsFromRequest, requestId }: RequestSenderParams
): Promise<RequestSenderResult> {
  const { messages, ...restParams } = paramsFromRequest;
  const finalParamsForProvider = sanitizeProviderParams({ model, messages, ...restParams }, requestId);

  console.log(`[${requestId}] Sending chat completion request to ${provider} via requestSender. Payload:`, JSON.stringify(finalParamsForProvider));
  const resultFromClient = await client.makeChatRequest(finalParamsForProvider);
  return { resultFromClient, finalParamsForProvider };
}
