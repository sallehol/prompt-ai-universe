// supabase/functions/ai-proxy/provider-clients.ts
import { ProviderName } from './providers.ts'

// Base interface for all provider clients
export interface ProviderClient {
  makeTextRequest(params: any): Promise<any>; // Can return Response object or JSON data
  makeChatRequest(params: any): Promise<any>; // Can return Response object or JSON data
}

// OpenAI Client
class OpenAIClient implements ProviderClient {
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

// Anthropic Client
class AnthropicClient implements ProviderClient {
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

// Google (Gemini) Client
class GoogleClient implements ProviderClient {
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

// Mistral Client
class MistralClient implements ProviderClient {
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

// Factory function to create provider clients
export function createProviderClient(provider: ProviderName, apiKey: string): ProviderClient {
  switch (provider) {
    case ProviderName.OPENAI:
      return new OpenAIClient(apiKey);
    case ProviderName.ANTHROPIC:
      return new AnthropicClient(apiKey);
    case ProviderName.GOOGLE:
      return new GoogleClient(apiKey);
    case ProviderName.MISTRAL:
      return new MistralClient(apiKey);
    default:
      console.warn(`Provider client for '${provider}' is not implemented. Falling back to a dummy client or throwing error.`);
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
