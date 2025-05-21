
import { BaseApiClient } from './base.client';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../types';
// No direct ApiError import needed here unless used for other purposes

export class ChatCompletionClient extends BaseApiClient {
  // Improved overloads for the create method
  async create<S extends boolean = false>(
    requestConfig: ChatCompletionRequest, 
    isStreaming: S
  ): Promise<S extends true ? ReadableStream<Uint8Array> : ChatCompletionResponse>;
  
  // Implementation of the create method
  async create(
    requestConfig: ChatCompletionRequest,
    isStreaming: boolean = false
  ): Promise<ChatCompletionResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/models/chat/completion';
    return this.request<ChatCompletionResponse>( // T_Response is ChatCompletionResponse for the non-streaming case
      endpoint,
      'POST',
      isStreaming ? { ...requestConfig, stream: true } : requestConfig,
      isStreaming // Pass the boolean value of isStreaming
    );
  }
}
