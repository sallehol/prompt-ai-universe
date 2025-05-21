
import { BaseApiClient } from './base.client';
import type { TextCompletionRequest, TextCompletionResponse } from '../types';

export class TextCompletionClient extends BaseApiClient {
  async create(requestConfig: TextCompletionRequest): Promise<TextCompletionResponse> {
    return this.request<TextCompletionResponse>(
      '/api/models/text/completion',
      'POST',
      requestConfig
    );
  }
}
