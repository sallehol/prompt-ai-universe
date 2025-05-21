
// supabase/functions/ai-proxy/providers/model-checks/specific-model-checks.ts
import { ProviderName } from '../types.ts';

export function checkSpecificModels(model: string): ProviderName | undefined {
  // Video models
  if (model === 'gen-1' || model === 'gen-2') {
    return ProviderName.RUNWAY;
  }

  // Image models
  if (model === 'sdxl' || model === 'sd-xl' || model === 'stable-diffusion-xl' || model.startsWith('sd3') || model.startsWith('stable-diffusion-3')) {
    return ProviderName.STABILITY;
  }

  // Text/Chat models
  if (model === 'gpt-4o' || model === 'gpt-4o-mini' || model === 'gpt-4-turbo' || model === 'gpt-4' || model === 'gpt-3.5-turbo') {
    return ProviderName.OPENAI;
  }
  if (model === 'claude-3-opus' || model === 'claude-3.5-sonnet' || model === 'claude-3-sonnet' || model === 'claude-3-haiku' || model === 'claude-2.1' || model === 'claude-2' || model === 'claude-instant-1.2') {
    return ProviderName.ANTHROPIC;
  }
  if (model === 'gemini-1.5-pro' || model === 'gemini-1.5-flash' || model === 'gemini-pro' || model === 'gemini-ultra' || model === 'text-bison' || model === 'chat-bison') {
    return ProviderName.GOOGLE;
  }
  if (model === 'mistral-large-latest' || model === 'mistral-large' || model === 'mistral-medium' || model === 'mistral-small' || model === 'mistral-7b' || model === 'mixtral-8x7b' || model === 'codestral-latest') {
    return ProviderName.MISTRAL;
  }
  if (model.startsWith('llama-3') || model.startsWith('llama3') || model.startsWith('llama-2') || model.startsWith('llama2') || model.startsWith('codellama')) {
    return ProviderName.META;
  }
  if (model === 'command-r-plus' || model === 'command-r' || model === 'command' || model === 'command-light' || model === 'command-nightly') {
    return ProviderName.COHERE;
  }
  if (model.startsWith('deepseek-coder') || model.startsWith('deepseek-llm')) {
      return ProviderName.DEEPSEEK;
  }

  // Audio models
  if (model === 'tts-1' || model === 'tts-1-hd' || model === 'whisper-1') {
    return ProviderName.OPENAI;
  }
  if (model === 'eleven-multilingual-v2' || model === 'eleven-multilingual-v1' || model === 'eleven-mono' || model === 'eleven-turbo-v2' || model.startsWith('eleven_')) {
    return ProviderName.ELEVENLABS;
  }

  return undefined;
}

