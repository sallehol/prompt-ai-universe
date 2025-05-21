
// supabase/functions/ai-proxy/clients/google.client.ts
import { ProviderClient } from './provider-client.interface.ts';

// Google (Gemini) Client
export class GoogleClient implements ProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://generativelanguage.googleapis.com/v1beta';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async makeTextRequest(params: any): Promise<any> {
    console.log(`GoogleClient - Final payload for text request (generateContent):`, JSON.stringify(params));

    const mutableParams = { ...params };
    const cacheKeys = Object.keys(mutableParams).filter(key => key.toLowerCase() === 'cache');
    if (cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        delete mutableParams[key];
      }
      console.log(`GoogleClient (makeTextRequest) - Removed unexpected cache parameter(s) at final stage: ${cacheKeys.join(', ')}`);
    }

    const { model, prompt, max_tokens = 1000, temperature = 0.7, stream, ...rest } = mutableParams;
    const modelId = model.startsWith('google/') ? model.substring('google/'.length) : model;

    if (stream) {
        console.warn("GoogleClient: makeTextRequest streaming not implemented in a way compatible with generic SSE processor. Falling back to non-streaming.");
    }
    
    const response = await fetch(
      `${this.baseUrl}/models/${modelId}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            maxOutputTokens: max_tokens,
            temperature,
            ...rest
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Google text request failed:', errorData);
      throw new Error(errorData.error?.message || `Google request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    return {
      id: `google-${Date.now()}`, 
      object: 'text_completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          text: result.candidates[0].content.parts[0].text,
          index: 0,
          logprobs: null,
          finish_reason: result.candidates[0].finishReason || 'stop'
        }
      ],
      usage: { prompt_tokens: -1, completion_tokens: -1, total_tokens: -1 } 
    };
  }
  
  async makeChatRequest(params: any): Promise<any> {
    console.log(`GoogleClient - Final payload for chat request (generateContent):`, JSON.stringify(params));
    
    const mutableParams = { ...params };
    const cacheKeys = Object.keys(mutableParams).filter(key => key.toLowerCase() === 'cache');
    if (cacheKeys.length > 0) {
      for (const key of cacheKeys) {
        delete mutableParams[key];
      }
      console.log(`GoogleClient (makeChatRequest) - Removed unexpected cache parameter(s) at final stage: ${cacheKeys.join(', ')}`);
    }

    const { model, messages, max_tokens = 1000, temperature = 0.7, stream, ...rest } = mutableParams;
    const modelId = model.startsWith('google/') ? model.substring('google/'.length) : model;

    if (stream) {
        console.warn("GoogleClient: makeChatRequest streaming not implemented in a way compatible with generic SSE processor. Falling back to non-streaming.");
    }

    const contents = messages.map((msg: {role: string, content: string}) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role, // Google specific role mapping
      parts: [{ text: msg.content }]
    }));
    
    const response = await fetch(
      `${this.baseUrl}/models/${modelId}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents,
          generationConfig: {
            maxOutputTokens: max_tokens,
            temperature,
            ...rest
          }
        })
      }
    );
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Google chat request failed:', errorData);
      throw new Error(errorData.error?.message || `Google request failed with status ${response.status}`);
    }
    
    const result = await response.json();
    return {
      id: `google-chat-${Date.now()}`,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000),
      model: model,
      choices: [
        {
          index: 0,
          message: {
            role: 'assistant',
            content: result.candidates[0].content.parts[0].text
          },
          finish_reason: result.candidates[0].finishReason || 'stop'
        }
      ],
      usage: { prompt_tokens: -1, completion_tokens: -1, total_tokens: -1 }
    };
  }
}

