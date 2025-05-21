
import { BaseApiClient } from './base.client';
import type { ImageGenerationRequest, ImageGenerationResponse } from '../types';

export class ImageGenerationClient extends BaseApiClient {
  async create(
    requestConfig: ImageGenerationRequest,
    isStreaming: boolean = false
  ): Promise<ImageGenerationResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/image/generation';
    return this.request<ImageGenerationResponse>(
      endpoint,
      'POST',
      requestConfig, 
      isStreaming
    );
  }
}

