
import { BaseApiClient } from './base.client';
import type { TextCompletionRequest, TextCompletionResponse } from '../types';

export class TextCompletionClient extends BaseApiClient {
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

