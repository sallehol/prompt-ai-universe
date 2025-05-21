
import { BaseApiClient } from './base.client';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../types';
import type { ApiError } from '@/api/types'; // Updated import
import { normalizeApiError } from '@/utils/errorUtils';

export class ChatCompletionClient extends BaseApiClient {
  async create(requestConfig: ChatCompletionRequest): Promise<ChatCompletionResponse> {
    // This will now correctly infer Promise<ChatCompletionResponse>
    // because isStreaming is implicitly false.
    return this.request<ChatCompletionResponse>(
      '/api/models/chat/completion',
      'POST',
      requestConfig
    );
  }

  async createStreaming(
    requestConfig: ChatCompletionRequest,
    onChunk: (chunk: any) => void,
    onComplete: () => void,
    onError: (error: ApiError) => void
  ): Promise<void> {
    try {
      // This will now correctly infer Promise<ReadableStream<Uint8Array>>
      // because isStreaming is true.
      const stream = await this.request<ChatCompletionResponse>( // T_Response is not used for stream's direct return type, but good for context
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
            if (buffer.trim()) {
                console.warn("[ChatCompletionClient] Streaming ended with unprocessed buffer:", buffer);
            }
            onComplete();
            break;
          }

          buffer += decoder.decode(value, { stream: true });
          
          let eolIndex;
          while ((eolIndex = buffer.indexOf('\n')) >= 0) {
            const line = buffer.slice(0, eolIndex).trim();
            buffer = buffer.slice(eolIndex + 1);

            if (line.startsWith('data: ')) {
              const jsonData = line.slice(6);
              if (jsonData.trim() === '[DONE]') {
                continue;
              }
              try {
                const chunkData = JSON.parse(jsonData);
                onChunk(chunkData);
              } catch (e: any) {
                console.error('[ChatCompletionClient] Error parsing streaming JSON chunk:', jsonData, e);
              }
            } else if (line.trim().startsWith('{') && line.trim().endsWith('}')) {
                 try {
                    const chunkData = JSON.parse(line);
                    onChunk(chunkData);
                } catch (e: any) {
                    console.error('[ChatCompletionClient] Error parsing streaming JSON object line:', line, e);
                }
            }
          }
        }
      };
      
      await processStream();
      reader.releaseLock();

    } catch (error) {
      console.error('[ChatCompletionClient] Error in createStreaming:', error);
      onError(normalizeApiError(error));
    }
  }
}

