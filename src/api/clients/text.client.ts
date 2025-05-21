
import { BaseApiClient } from './base.client';
import type { TextCompletionRequest, TextCompletionResponse } from '../types';

export class TextCompletionClient extends BaseApiClient {
  // Improved overloads for the create method
  async create<S extends boolean = false>(
    requestConfig: TextCompletionRequest, 
    isStreaming: S
  ): Promise<S extends true ? ReadableStream<Uint8Array> : TextCompletionResponse>;

  // Implementation of the create method
  async create(
    requestConfig: TextCompletionRequest,
    isStreaming: boolean = false
  ): Promise<TextCompletionResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/models/text/completion';
    return this.request<TextCompletionResponse>(
      endpoint,
      'POST',
      isStreaming ? { ...requestConfig, stream: true } : requestConfig,
      isStreaming
    );
  }
}
