
// supabase/functions/ai-proxy/clients/openai.client.ts
import { ProviderClient } from './provider-client.interface.ts';

// OpenAI Client
export class OpenAIClient implements ProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async makeTextRequest(params: any): Promise<any> {
    // Final safety check - log what's actually being sent to the API
    console.log(`OpenAIClient - Final payload for text request (/completions):`, JSON.stringify(params));
    
    const mutableParams = { ...params }; // Create a mutable copy
    // Remove any cache parameter that might have slipped through
    const cacheKeys = Object.keys(mutableParams).filter(key => key.toLowerCase() === 'cache');
    if (cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        delete mutableParams[key];
      }
      console.log(`OpenAIClient (makeTextRequest) - Removed unexpected cache parameter(s) at final stage: ${cacheKeys.join(', ')}`);
    }
    
    const { model, prompt, max_tokens = 1000, temperature = 0.7, stream, ...rest } = mutableParams;
    
    const bodyPayload: any = {
      model,
      prompt,
      max_tokens,
      temperature,
      ...rest
    };
    if (stream) {
      bodyPayload.stream = true;
    }

    const response = await fetch(`${this.baseUrl}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(bodyPayload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('OpenAI text request failed:', errorData);
      throw new Error(errorData.error?.message || `OpenAI request failed with status ${response.status}`);
    }
    
    if (stream) {
      return response; // Return the full Response object for streaming
    }
    return await response.json();
  }
  
  async makeChatRequest(params: any): Promise<any> {
    // Final safety check - log what's actually being sent to the API
    console.log(`OpenAIClient - Final payload for chat request (/chat/completions):`, JSON.stringify(params));

    const mutableParams = { ...params }; // Create a mutable copy
    // Remove any cache parameter that might have slipped through
    const cacheKeys = Object.keys(mutableParams).filter(key => key.toLowerCase() === 'cache');
    if (cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        delete mutableParams[key];
      }
      console.log(`OpenAIClient (makeChatRequest) - Removed unexpected cache parameter(s) at final stage: ${cacheKeys.join(', ')}`);
    }
        
    const { model, messages, max_tokens = 1000, temperature = 0.7, stream, ...rest } = mutableParams;
    
    const bodyPayload: any = {
      model,
      messages,
      max_tokens,
      temperature,
      ...rest
    };
    if (stream) {
      bodyPayload.stream = true;
    }
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(bodyPayload)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('OpenAI chat request failed:', errorData);
      throw new Error(errorData.error?.message || `OpenAI request failed with status ${response.status}`);
    }
    
    if (stream) {
      return response; // Return the full Response object for streaming
    }
    return await response.json();
  }
}

