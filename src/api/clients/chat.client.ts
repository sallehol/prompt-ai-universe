
import { BaseApiClient } from './base.client';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../types';

export class ChatCompletionClient extends BaseApiClient {
  async create(
    requestConfig: ChatCompletionRequest,
    isStreaming: boolean = false
  ): Promise<ChatCompletionResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/models/chat/completion';
    return this.request<ChatCompletionResponse>(
      endpoint,
      'POST',
      isStreaming ? { ...requestConfig, stream: true } : requestConfig,
      isStreaming
    );
  }
}

