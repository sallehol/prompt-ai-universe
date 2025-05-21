
import { BaseApiClient } from './base.client';
import type { TextCompletionRequest, TextCompletionResponse } from '../types';

export class TextCompletionClient extends BaseApiClient {
  // Overloads for the create method
  async create(requestConfig: TextCompletionRequest, isStreaming: true): Promise<ReadableStream<Uint8Array>>;
  async create(requestConfig: TextCompletionRequest, isStreaming?: false): Promise<TextCompletionResponse>;

  // Implementation of the create method
  async create(
    requestConfig: TextCompletionRequest,
    isStreaming: boolean = false
  ): Promise<TextCompletionResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/models/text/completion';
    // Note: Standard text completion APIs like OpenAI's do not typically support streaming for `text_completion` objects
    // in the same way as `chat.completion`. However, this structure allows for it if the backend supports it.
    // Assuming for now that `stream: true` might be a valid parameter for the backend.
    return this.request<TextCompletionResponse>(
      endpoint,
      'POST',
      isStreaming ? { ...requestConfig, stream: true } : requestConfig, // Pass stream property if streaming
      isStreaming
    );
  }
}

