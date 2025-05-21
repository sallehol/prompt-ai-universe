// supabase/functions/ai-proxy/providers/model-checks/pattern-model-checks.ts
import { ProviderName } from '../types.ts';

export function checkModelPatterns(model: string): ProviderName | undefined {
  // Use more specific checks to avoid conflicts
  // These are lower priority and act as fallbacks

  if (model.includes('gpt') || model.includes('dall-e') || model.includes('whisper')) {
    if (![ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE, ProviderName.DEEPSEEK].some(p => model.includes(p.toLowerCase()))) return ProviderName.OPENAI;
  }
  if (model.includes('claude')) {
     if (![ProviderName.OPENAI, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE, ProviderName.DEEPSEEK].some(p => model.includes(p.toLowerCase()))) return ProviderName.ANTHROPIC;
  }
  if (model.includes('gemini') || model.includes('imagen')) {
    // Check if it's not already identified as OpenAI/Anthropic etc. to avoid conflicts if a model name is like "gpt-gemini-hybrid"
    if (![ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE].some(p => model.includes(p.toLowerCase()))) {
        return ProviderName.GOOGLE;
    }
  }
  if (model.includes('mistral') || model.includes('codestral')) {
    if (![ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.META, ProviderName.COHERE].some(p => model.includes(p.toLowerCase()))) {
        return ProviderName.MISTRAL;
    }
  }
  if (model.includes('llama')) {
     if (![ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.COHERE].some(p => model.includes(p.toLowerCase()))) {
        return ProviderName.META;
    }
  }
  if (model.includes('stable') || model.includes('stability')) {
    if (![ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE, ProviderName.RUNWAY].some(p => model.includes(p.toLowerCase()))) {
        return ProviderName.STABILITY;
    }
  }
  if (model.includes('eleven')) {
    if (![ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE, ProviderName.DEEPGRAM, ProviderName.ASSEMBLYAI].some(p => model.includes(p.toLowerCase()))) {
        return ProviderName.ELEVENLABS;
    }
  }
  if (model.includes('huggingface') || model.includes('transformers')) {
    // This is a very broad catch-all, ensure it doesn't override more specific ones
    if (![
        ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META,
        ProviderName.COHERE, ProviderName.DEEPSEEK, ProviderName.STABILITY, ProviderName.RUNWAY,
        ProviderName.PIKA, ProviderName.HEYGEN, ProviderName.DID, ProviderName.ELEVENLABS,
        ProviderName.ASSEMBLYAI, ProviderName.DEEPGRAM, ProviderName.ORIGINALITY, ProviderName.TAVUS,
        ProviderName.CODEIUM, ProviderName.TABNINE, ProviderName.GETTY
      ].some(p => model.includes(p.toLowerCase()) || model.toLowerCase().startsWith(p.toLowerCase() + '/')))
    {
        return ProviderName.HUGGINGFACE;
    }
  }
  // Other specific includes like 'command', 'deepseek', 'midjourney', 'runway', 'pika', 'heygen', 'd-id', 
  // 'assembly', 'deepgram', 'originality', 'tavus', 'codeium', 'tabnine', 'getty' are better handled by prefix or specific model checks.
  // Adding them here with .includes can be risky due to potential substrings in other model names.

  return undefined;
}
