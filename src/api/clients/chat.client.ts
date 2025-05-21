
import { BaseApiClient } from './base.client';
import type { ChatCompletionRequest, ChatCompletionResponse } from '../types';
import type { ApiError } from '@/api/types/apiError'; // Updated import
import { normalizeApiError } from '@/utils/errorUtils'; // Keep normalizeApiError if used, or remove if not

export class ChatCompletionClient extends BaseApiClient {
  // Overloads for the create method
  async create(requestConfig: ChatCompletionRequest, isStreaming: true): Promise<ReadableStream<Uint8Array>>;
  async create(requestConfig: ChatCompletionRequest, isStreaming?: false): Promise<ChatCompletionResponse>;
  
  // Implementation of the create method
  async create(
    requestConfig: ChatCompletionRequest,
    isStreaming: boolean = false
  ): Promise<ChatCompletionResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/models/chat/completion';
    // For streaming requests, we pass `isStreaming: true`.
    // For non-streaming, `isStreaming` will be false (or undefined, defaulting to false).
    // The `T_Response` for `this.request` should be `ChatCompletionResponse` for the non-streaming case.
    return this.request<ChatCompletionResponse>(
      endpoint,
      'POST',
      isStreaming ? { ...requestConfig, stream: true } : requestConfig,
      isStreaming
    );
  }

  // The old createStreaming method is now consolidated into the overloaded create method.
  // If specific stream processing logic (onChunk, onComplete, onError) is needed by callers,
  // they will need to implement it when consuming the ReadableStream<Uint8Array>
  // returned by `create(requestConfig, true)`.
}

