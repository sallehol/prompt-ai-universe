
import { BaseApiClient } from './base.client';
import type { ImageGenerationRequest, ImageGenerationResponse } from '../types';

export class ImageGenerationClient extends BaseApiClient {
  async create(requestConfig: ImageGenerationRequest): Promise<ImageGenerationResponse> {
    return this.request<ImageGenerationResponse>(
      '/api/image/generation',
      'POST',
      requestConfig
    );
  }
  // Add methods for /api/image/edit and /api/image/variation later if needed
}
