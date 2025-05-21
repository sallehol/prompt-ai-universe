import { corsHeaders } from '../auth.ts'
import { createErrorResponse, ErrorType, handleProviderError } from '../error-utils.ts'
import { ProviderName } from '../providers/index.ts'
import { processOpenAIStream } from '../utils/text-model-utils.ts';

export async function processProviderResponse(
  resultFromClient: any,
  finalParamsForProvider: Record<string, any>, // Used to check 'stream' flag
  provider: ProviderName,
  requestId: string
): Promise<Response> {
  // TODO: Log usage (to be implemented, especially complex for streams) - This was in original code

  if (finalParamsForProvider.stream && resultFromClient instanceof Response) {
    const providerResponse = resultFromClient; // It's the full Response object from the provider
    if (!providerResponse.ok) {
        const errorText = await providerResponse.text().catch(() => `Provider request failed with status ${providerResponse.status}`);
        console.error(`[${requestId}] Streaming provider error for ${provider} (${providerResponse.status}): ${errorText}`);
        try {
          const errorJson = JSON.parse(errorText);
          return handleProviderError(errorJson.error || errorJson , provider as ProviderName);
        } catch (_e) {
           return createErrorResponse(ErrorType.PROVIDER, `Provider error: ${errorText}`, providerResponse.status, provider);
        }
    }

    // Check if the provider is OpenAI, Mistral, or Anthropic (for streaming) to use processOpenAIStream
    if (provider === ProviderName.OPENAI || provider === ProviderName.MISTRAL || (provider === ProviderName.ANTHROPIC && finalParamsForProvider.stream)) {
      const processedStream = await processOpenAIStream(providerResponse);
      return new Response(
        processedStream,
        { headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          } 
        }
      );
    } else {
      // For other streaming providers that might not conform to OpenAI's SSE format, pass raw stream
      console.warn(`[${requestId}] Provider ${provider} is streaming but not explicitly handled by SSE processor. Passing raw stream.`);
      return new Response(
        providerResponse.body,
        { headers: { 
            ...corsHeaders, 
            'Content-Type': 'text/event-stream', 
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive'
          } 
        }
      );
    }
  } else {
    // Non-streaming response (resultFromClient is JSON data)
    return new Response(
      JSON.stringify(resultFromClient),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
