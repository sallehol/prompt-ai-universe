
import { BaseApiClient } from './base.client';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../types';
import type { ApiError } from './base.client';
import { normalizeApiError } from '@/utils/errorUtils';

export class ChatCompletionClient extends BaseApiClient {
  async create(requestConfig: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    return this.request<ChatCompletionResponse>(
      '/api/models/chat/completion',
      'POST',
      requestConfig
    );
  }

  async createStreaming(
    requestConfig: ChatCompletionRequest,
    onChunk: (chunk: any) => void, // Type this 'chunk' more specifically if possible, e.g. based on expected stream format
    onComplete: () => void,
    onError: (error: ApiError) => void
  ): Promise<void> {
    try {
      const stream = await this.request<ReadableStream<Uint8Array>>(
        '/api/models/chat/completion',
        'POST',
        { ...requestConfig, stream: true },
        true // isStreaming = true
      );

      const reader = stream.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      const processStream = async () => {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { done, value } = await reader.read();
          if (done) {
            // Process any remaining buffer content if necessary, though SSE usually handles this by line ends
            if (buffer.trim()) {
                console.warn("[ChatCompletionClient] Streaming ended with unprocessed buffer:", buffer);
            }
            onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          let eolIndex;
          // Assuming Server-Sent Events (SSE) format: "data: {...}\n\n"
          // Or just JSON objects separated by newlines for simpler streams
          while ((eolIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, eolIndex).trim();
            buffer = buffer.slice(eolIndex + 1);

            if (line.startsWith('data: ')) { // Standard SSE
              const jsonData = line.slice(6);
              if (jsonData.trim() === '[DONE]') { // OpenAI specific marker, may not apply to our proxy
                // Stream should naturally end with done:true from reader.read()
                continue;
              }
              try {
                const chunkData = JSON.parse(jsonData);
                onChunk(chunkData);
              } catch (e: any) {
                console.error('[ChatCompletionClient] Error parsing streaming JSON chunk:', jsonData, e);
                // onError(normalizeApiError({ message: `Error parsing stream: ${e.message}`, type: 'network'}));
                // Decide if parsing error should terminate stream or just be logged
              }
            } else if (line.trim().startsWith('{') && line.trim().endsWith('}')) { // Simple JSON objects per line
                 try {
                    const chunkData = JSON.parse(line);
                    onChunk(chunkData);
                } catch (e: any) {
                    console.error('[ChatCompletionClient] Error parsing streaming JSON object line:', line, e);
                }
            } else if (line.trim()) { // Log unexpected lines
                // console.log("[ChatCompletionClient] Received non-data line in stream:", line);
            }
          }
        }
      };
      
      await processStream();
      reader.releaseLock(); // Ensure the lock is released

    } catch (error) {
      console.error('[ChatCompletionClient] Error in createStreaming:', error);
      onError(normalizeApiError(error));
    }
  }
}
