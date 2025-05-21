
import { BaseApiClient } from './base.client';
import type { ImageGenerationRequest, ImageGenerationResponse } from '../types';

export class ImageGenerationClient extends BaseApiClient {
  // Improved overloads for the create method
  async create<S extends boolean = false>(
    requestConfig: ImageGenerationRequest, 
    isStreaming: S
  ): Promise<S extends true ? ReadableStream<Uint8Array> : ImageGenerationResponse>;
  
  // Implementation of the create method
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
