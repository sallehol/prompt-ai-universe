
// supabase/functions/ai-proxy/provider-clients.ts
import { ProviderName } from './providers.ts'

// Base interface for all provider clients
export interface ProviderClient {
  makeTextRequest(params: any): Promise<any>;
  makeChatRequest(params: any): Promise<any>;
}

// OpenAI Client
class OpenAIClient implements ProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async makeTextRequest(params: any): Promise<any> {
    const { model, prompt, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    
    const response = await fetch(`${this.baseUrl}/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        prompt,
        max_tokens,
        temperature,
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('OpenAI text request failed:', errorData);
      throw new Error(errorData.error?.message || `OpenAI request failed with status ${response.status}`);
    }
    
    return await response.json();
  }
  
  async makeChatRequest(params: any): Promise<any> {
    const { model, messages, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('OpenAI chat request failed:', errorData);
      throw new Error(errorData.error?.message || `OpenAI request failed with status ${response.status}`);
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
    // Anthropic doesn't support standalone text completion via the /v1/messages endpoint well,
    // so we adapt it by forming a simple chat request.
    const { model, prompt, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    
    return this.makeChatRequest({
      model, // Pass the original model
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      ...rest
    });
  }
  
  async makeChatRequest(params: any): Promise<any> {
    const { model, messages, max_tokens = 1000, temperature = 0.7, system, ...rest } = params;
    
    const requestBody: any = {
      model,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role === 'user' ? 'user' : 'assistant', // System messages handled separately if provided
        content: m.content
      })),
      max_tokens,
      temperature,
      ...rest
    };

    if (system) {
      requestBody.system = system;
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
    
    const result = await response.json();
    
    return {
      id: result.id,
      object: 'chat.completion',
      created: Math.floor(Date.now() / 1000), // Approximation
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
      usage: { // Anthropic API provides usage in the response
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
    const { model, prompt, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    const modelId = model.startsWith('google/') ? model.substring('google/'.length) : model;
    
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
      id: `google-${Date.now()}`, // Approximation
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
    const { model, messages, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    const modelId = model.startsWith('google/') ? model.substring('google/'.length) : model;
    
    const contents = messages.map((msg: {role: string, content: string}) => ({
      role: msg.role === 'assistant' ? 'model' : msg.role, // 'user' or 'system' (system becomes user for older models)
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
      id: `google-chat-${Date.now()}`, // Approximation
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
    const { model, prompt, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    return this.makeChatRequest({
      model,
      messages: [{ role: 'user', content: prompt }],
      max_tokens,
      temperature,
      ...rest
    });
  }
  
  async makeChatRequest(params: any): Promise<any> {
    const { model, messages, max_tokens = 1000, temperature = 0.7, ...rest } = params;
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: { message: response.statusText } }));
      console.error('Mistral chat request failed:', errorData);
      throw new Error(errorData.error?.message || `Mistral request failed with status ${response.status}`);
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
    // Add other providers as needed
    // Consider cases for ProviderName.META, ProviderName.COHERE, ProviderName.DEEPSEEK etc.
    default:
      console.warn(`Provider client for '${provider}' is not implemented. Falling back to a dummy client or throwing error.`);
      // For now, throw an error for unhandled providers that require keys.
      // If a provider might not need a key (e.g. local model), handle differently.
      throw new Error(`Unsupported provider: ${provider}`);
  }
}

