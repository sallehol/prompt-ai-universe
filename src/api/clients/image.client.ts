
import { BaseApiClient } from './base.client';
import type { ImageGenerationRequest, ImageGenerationResponse } from '../types';

export class ImageGenerationClient extends BaseApiClient {
  // Overloads for the create method
  // Image generation APIs typically do not stream pixel data, but this structure allows for future flexibility.
  // For now, we'll assume isStreaming will likely be false for image generation.
  async create(requestConfig: ImageGenerationRequest, isStreaming: true): Promise<ReadableStream<Uint8Array>>;
  async create(requestConfig: ImageGenerationRequest, isStreaming?: false): Promise<ImageGenerationResponse>;
  
  // Implementation of the create method
  async create(
    requestConfig: ImageGenerationRequest,
    isStreaming: boolean = false
  ): Promise<ImageGenerationResponse | ReadableStream<Uint8Array>> {
    const endpoint = '/api/image/generation';
    // Image generation does not typically stream. `isStreaming` is included for structural consistency.
    // If streaming is true, it implies the backend might stream parts of an image or related data.
    return this.request<ImageGenerationResponse>(
      endpoint,
      'POST',
      requestConfig, // Body usually doesn't need a 'stream' property for images
      isStreaming
    );
  }
  // Add methods for /api/image/edit and /api/image/variation later if needed
}

