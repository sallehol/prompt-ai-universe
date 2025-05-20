
// supabase/functions/ai-proxy/video-clients.ts
import { ProviderName } from './providers.ts'

// Base interface for all video provider clients
export interface VideoProviderClient {
  generateVideo(params: any): Promise<any>;
  editVideo?(params: any): Promise<any>; // Optional editVideo method
}

// RunwayML Client
class RunwayMLClient implements VideoProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.runwayml.com/v1'; // Placeholder URL
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.warn("RunwayMLClient is using a placeholder API URL. Ensure this is configured to your actual RunwayML API endpoint if official one is different.");
  }
  
  async generateVideo(params: any): Promise<any> {
    const { model, prompt, ...rest } = params; // Model might be part of the endpoint or body
    
    // Actual endpoint for Runway Gen-2 might be different, e.g. tasks or specific model endpoints
    const response = await fetch(`${this.baseUrl}/generate`, { // Adjusted to /generate, or use a specific task endpoint
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        model_name: model, // Assuming model name is passed like this
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `RunwayML video generation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`RunwayML video generation failed: ${response.status} - ${errorText}`);
      }
    }
    
    const result = await response.json();
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          url: result.url || result.videoUrl, // Depending on actual API response
          type: 'video',
          task_id: result.task_id // Often video generation is async
        }
      ]
    };
  }
}

// Pika Labs Client
class PikaLabsClient implements VideoProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.pika.art/v1'; // Official API URL
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateVideo(params: any): Promise<any> {
    const { model, prompt, ...rest } = params; // Model might not be used if API key implies it or endpoint is specific
    
    const response = await fetch(`${this.baseUrl}/videos`, { // Standard endpoint for Pika API
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        prompt,
        ...rest // Pika has specific parameters like aspect_ratio, motion_score, etc.
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        // Pika error structure might be { "type": "/probs/bad-request", "title": "Bad Request", "status": 400, "detail": "...", "instance": "..." }
        throw new Error(errorJson.detail || errorJson.title || `Pika Labs video generation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`Pika Labs video generation failed: ${response.status} - ${errorText}`);
      }
    }
    
    const result = await response.json(); // Pika returns job details, video URL comes later or via webhook/polling
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          url: result.data?.asset_url, // Example if asset_url is provided upon success, or polling might be needed
          id: result.id, // Pika returns a job ID
          status: result.status,
          type: 'video'
        }
      ]
    };
  }
}

// Factory function to create video provider clients
export function createVideoProviderClient(provider: ProviderName, apiKey: string): VideoProviderClient {
  switch (provider) {
    case ProviderName.RUNWAY:
      return new RunwayMLClient(apiKey);
    case ProviderName.PIKA:
      return new PikaLabsClient(apiKey);
    default:
      console.error(`Attempted to create video client for unsupported provider: ${provider}`);
      throw new Error(`Unsupported video provider: ${provider}`);
  }
}
