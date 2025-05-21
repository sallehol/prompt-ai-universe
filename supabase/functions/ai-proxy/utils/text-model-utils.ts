
// supabase/functions/ai-proxy/utils/text-model-utils.ts

// New sanitization function
export function sanitizeProviderParams(params: Record<string, any>, requestId?: string): Record<string, any> {
  // Create a new object to avoid modifying the original
  const sanitizedParams = { ...params };
  
  // Remove cache parameter in any case variation
  const cacheKeys = Object.keys(sanitizedParams).filter(key => 
    key.toLowerCase() === 'cache'
  );
  
  if (cacheKeys.length > 0) {
    for (const key of cacheKeys) {
      delete sanitizedParams[key];
    }
    console.log(`[${requestId || 'NO_REQ_ID'}] FINAL SANITIZATION (text-model-utils): Removed cache parameter(s) from provider payload. Original keys: ${cacheKeys.join(', ')}`);
  }
  
  // Log the final payload for debugging (example model, actual model might be in params.model)
  // console.log(`[${requestId || 'NO_REQ_ID'}] FINAL PAYLOAD (text-model-utils) for model ${params.model}:`, JSON.stringify(sanitizedParams));
  
  return sanitizedParams;
}

// Helper function to process OpenAI-style SSE streams
export async function processOpenAIStream(response: Response): Promise<ReadableStream<Uint8Array>> {
  if (!response.body) {
    throw new Error("Response body is null for streaming.");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  const encoder = new TextEncoder();
  
  return new ReadableStream({
    async start(controller) {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n').filter(line => line.trim() !== '');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const jsonStr = line.substring(6).trim(); // Remove "data: " prefix and trim
              
              if (jsonStr === '[DONE]') {
                // OpenAI specific: forward the [DONE] marker as is, then close.
                controller.enqueue(encoder.encode(line + '\n'));
                controller.close();
                return;
              }
              
              try {
                controller.enqueue(encoder.encode(line + '\n'));
              } catch (e) {
                console.error('Error parsing JSON from stream line:', jsonStr, e);
                // Potentially enqueue the raw line if parsing fails but it's still data
                // controller.enqueue(encoder.encode(line + '\n')); 
              }
            } else if (line.trim()) { // Forward non-data lines if they are not empty (e.g. comments, empty lines)
                controller.enqueue(encoder.encode(line + '\n'));
            }
          }
        }
        controller.close();
      } catch (e) {
        console.error('Error in processOpenAIStream:', e);
        controller.error(e);
      }
    }
  });
}

