// supabase/functions/ai-proxy/image-clients.ts
import { ProviderName } from './providers/types.ts';

// Base interface for all image provider clients
export interface ImageProviderClient {
  generateImage(params: any): Promise<any>;
  editImage?(params: any): Promise<any>;
  createVariation?(params: any): Promise<any>;
}

// OpenAI (DALL-E) Client
class OpenAIImageClient implements ImageProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateImage(params: any): Promise<any> {
    const { model, prompt, n = 1, size = '1024x1024', ...rest } = params; // Added model to destructuring
    
    const body: Record<string, any> = { // Defined body type
        prompt,
        n,
        size,
        ...rest
    };
    if (model) body.model = model; // Conditionally add model if provided, OpenAI DALL-E 2 doesn't use it in body

    const response = await fetch(`${this.baseUrl}/images/generations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.message || `OpenAI image generation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`OpenAI image generation failed: ${response.status} - ${errorText}`);
      }
    }
    
    return await response.json();
  }
  
  async editImage(params: any): Promise<any> {
    const { image, mask, prompt, n = 1, size = '1024x1024', ...rest } = params;
    
    const formData = new FormData();
    if (image instanceof File) formData.append('image', image); else throw new Error('Image must be a File object for edits.');
    if (mask) {
        if (mask instanceof File) formData.append('mask', mask); else throw new Error('Mask must be a File object.');
    }
    formData.append('prompt', prompt);
    formData.append('n', String(n)); // Ensure n is string
    formData.append('size', size);
    
    for (const [key, value] of Object.entries(rest)) {
        if (typeof value === 'string') formData.append(key, value);
        else if (typeof value === 'number' || typeof value === 'boolean') formData.append(key, String(value));
    }
    
    const response = await fetch(`${this.baseUrl}/images/edits`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.message || `OpenAI image edit failed: ${response.status}`);
      } catch (e) {
        throw new Error(`OpenAI image edit failed: ${response.status} - ${errorText}`);
      }
    }
    
    return await response.json();
  }
  
  async createVariation(params: any): Promise<any> {
    const { image, n = 1, size = '1024x1024', ...rest } = params;
    
    const formData = new FormData();
    if (image instanceof File) formData.append('image', image); else throw new Error('Image must be a File object for variations.');
    formData.append('n', String(n)); // Ensure n is string
    formData.append('size', size);
    
    for (const [key, value] of Object.entries(rest)) {
        if (typeof value === 'string') formData.append(key, value);
        else if (typeof value === 'number' || typeof value === 'boolean') formData.append(key, String(value));
    }
    
    const response = await fetch(`${this.baseUrl}/images/variations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.message || `OpenAI image variation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`OpenAI image variation failed: ${response.status} - ${errorText}`);
      }
    }
    
    return await response.json();
  }
}

// Stability AI Client
class StabilityAIClient implements ImageProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.stability.ai/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateImage(params: any): Promise<any> {
    const { 
      prompt, 
      model = 'stable-diffusion-xl-1024-v1-0', // Default engine_id
      width = 1024,
      height = 1024,
      samples = 1,
      text_prompts, // Allow pre-formatted text_prompts
      ...rest 
    } = params;
    
    let actualTextPrompts;
    if (text_prompts) {
      actualTextPrompts = text_prompts;
    } else if (typeof prompt === 'string') {
      actualTextPrompts = [{ text: prompt, weight: 1 }];
    } else if (Array.isArray(prompt)) {
      actualTextPrompts = prompt.map(p => (typeof p === 'string' ? { text: p, weight: 1 } : p));
    } else {
      throw new Error('Invalid prompt format for Stability AI. Must be string, array of strings/objects, or pre-formatted text_prompts array.');
    }
    
    const engineId = model.startsWith('stable-diffusion') ? model : 'stable-diffusion-xl-1024-v1-0';

    const response = await fetch(`${this.baseUrl}/generation/${engineId}/text-to-image`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'Accept': 'application/json' // Stability recommends 'application/json' or 'image/png'
      },
      body: JSON.stringify({
        text_prompts: actualTextPrompts,
        width,
        height,
        samples,
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Stability AI image generation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`Stability AI image generation failed: ${response.status} - ${errorText}`);
      }
    }
    
    const result = await response.json();
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: result.artifacts.map((artifact: any) => ({ // artifact should be { base64: string, seed: number, finishReason: string }
        url: artifact.base64 ? `data:image/png;base64,${artifact.base64}` : null, // Check if base64 is present
        b64_json: artifact.base64 || null
      }))
    };
  }
}

// Midjourney Client (via proxy API)
class MidjourneyClient implements ImageProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.midjourney.com/v1'; // This is a placeholder, official API doesn't exist.
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
    console.warn("MidjourneyClient is using a placeholder API URL. Ensure this is configured to a working Midjourney proxy if used.");
  }
  
  async generateImage(params: any): Promise<any> {
    const { model, prompt, ...rest } = params; // model is not typically used by Midjourney directly
    
    const response = await fetch(`${this.baseUrl}/imagine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}` // Or other auth mechanism for the proxy
      },
      body: JSON.stringify({
        prompt,
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.message || `Midjourney image generation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`Midjourney image generation failed: ${response.status} - ${errorText}`);
      }
    }
    
    const result = await response.json();
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: [
        {
          url: result.imageUrl, // Assuming proxy returns imageUrl
          b64_json: null // Proxy might not return base64
        }
      ]
    };
  }
}

// Factory function to create image provider clients
export function createImageProviderClient(provider: ProviderName, apiKey: string): ImageProviderClient {
  switch (provider) {
    case ProviderName.OPENAI:
      return new OpenAIImageClient(apiKey);
    case ProviderName.STABILITY:
      return new StabilityAIClient(apiKey);
    case ProviderName.MIDJOURNEY:
      return new MidjourneyClient(apiKey);
    default:
      console.error(`Attempted to create image client for unsupported provider: ${provider}`);
      throw new Error(`Unsupported image provider: ${provider}`);
  }
}
