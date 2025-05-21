
// supabase/functions/ai-proxy/clients/anthropic.client.ts
import { ProviderClient } from './provider-client.interface.ts';

// Anthropic Client
export class AnthropicClient implements ProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.anthropic.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async makeTextRequest(params: any): Promise<any> {
    // This method adapts to makeChatRequest. Logging here shows params *before* adaptation.
    // The crucial check will be in makeChatRequest.
    console.log(`AnthropicClient - Initial params for makeTextRequest (will be adapted to chat):`, JSON.stringify(params));
    
    const { model, prompt, max_tokens = 1000, temperature = 0.7, stream, ...rest } = params;
    
    // Pass through all params, including potentially 'cache', to makeChatRequest
    // makeChatRequest will handle the final sanitization.
    return this.makeChatRequest({
      model, 
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      stream,
      ...rest // This will carry over any other params, including 'cache' if present
    });
  }
  
  async makeChatRequest(params: any): Promise<any> {
    // Final safety check - log what's actually being sent to the API
    console.log(`AnthropicClient - Final payload for chat request (/messages):`, JSON.stringify(params));
    
    const mutableParams = { ...params }; // Create a mutable copy
    const cacheKeys = Object.keys(mutableParams).filter(key => key.toLowerCase() === 'cache');
    if (cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        delete mutableParams[key];
      }
      console.log(`AnthropicClient (makeChatRequest) - Removed unexpected cache parameter(s) at final stage: ${cacheKeys.join(', ')}`);
    }

    const { model, messages, max_tokens = 1000, temperature = 0.7, system, stream, ...rest } = mutableParams;
    
    const requestBody: any = {
      model,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant', // Anthropic specific role mapping
        content: m.content
      })),
      max_tokens,
      temperature,
      ...rest // Spread rest of the sanitized params
    };

    if (system) {
      requestBody.system = system;
    }
    if (stream) {
      requestBody.stream = true;
    }
    
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestBody)
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Anthropic chat request failed:', errorData);
      throw new Error(errorData.error?.message || errorData.error?.type || `Anthropic request failed with status ${response.status}`);
    }
    
    if (stream) {
      return response; 
    }
    
    const result = await response.json();
    return {
      id: result.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000), 
      model: result.model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.content[0].text
          },
          finish_reason: result.stop_reason === 'max_tokens' ? 'length' : result.stop_reason || 'stop',
        }
      ],
      usage: { 
        prompt_tokens: result.usage?.input_tokens || -1,
        completion_tokens: result.usage?.output_tokens || -1,
        total_tokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0) || -1,
      }
    };
  }
}

