
// supabase/functions/ai-proxy/clients/mistral.client.ts
import { ProviderClient } from './provider-client.interface.ts';

// Mistral Client
export class MistralClient implements ProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.mistral.ai/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async makeTextRequest(params: any): Promise<any> {
    // This method adapts to makeChatRequest. Logging here shows params *before* adaptation.
    console.log(`MistralClient - Initial params for makeTextRequest (will be adapted to chat):`, JSON.stringify(params));
    
    const { model, prompt, max_tokens = 1000, temperature = 0.7, stream, ...rest } = params;
    
    // Pass through all params, including potentially 'cache', to makeChatRequest
    return this.makeChatRequest({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      stream,
      ...rest // This will carry over any other params
    });
  }
  
  async makeChatRequest(params: any): Promise<any> {
    console.log(`MistralClient - Final payload for chat request (/chat/completions):`, JSON.stringify(params));

    const mutableParams = { ...params };
    const cacheKeys = Object.keys(mutableParams).filter(key => key.toLowerCase() === 'cache');
    if (cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        delete mutableParams[key];
      }
      console.log(`MistralClient (makeChatRequest) - Removed unexpected cache parameter(s) at final stage: ${cacheKeys.join(', ')}`);
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
      console.error('Mistral chat request failed:', errorData);
      throw new Error(errorData.error?.message || `Mistral request failed with status ${response.status}`);
    }

    if (stream) {
      return response; 
    }
    return await response.json();
  }
}

