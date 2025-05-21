
// supabase/functions/ai-proxy/providers/model-checks/prefix-model-checks.ts
import { ProviderName } from '../types.ts';

export function checkModelPrefixes(model: string): ProviderName | undefined {
  if (model.startsWith('openai/') || model.startsWith('gpt-') || model.startsWith('dall-e-') || model.startsWith('whisper-')) {
    return ProviderName.OPENAI;
  }
  if (model.startsWith('anthropic/') || model.startsWith('claude-')) {
    return ProviderName.ANTHROPIC;
  }
  if (model.startsWith('google/') || model.startsWith('gemini-') || model.startsWith('imagen-') || model.startsWith('models/text-bison') || model.startsWith('models/chat-bison')) {
    return ProviderName.GOOGLE;
  }
  if (model.startsWith('mistralai/') || model.startsWith('mistral-') || model.startsWith('open-mistral-') || model.startsWith('open-mixtral-') || model.startsWith('codestral-')) {
    return ProviderName.MISTRAL;
  }
  if (model.startsWith('meta-llama/') || model.startsWith('llama-') || model.startsWith('codellama/')) {
    return ProviderName.META;
  }
  if (model.startsWith('cohere/') || model.startsWith('command-')) {
    return ProviderName.COHERE;
  }
  if (model.startsWith('deepseek-') || model.startsWith('deepseekai/')) {
    return ProviderName.DEEPSEEK;
  }
  if (model.startsWith('midjourney')) {
    return ProviderName.MIDJOURNEY;
  }
  if (model.startsWith('stabilityai/') || model.startsWith('stable-') || model.startsWith('sdxl') || model.startsWith('sd-')) {
    return ProviderName.STABILITY;
  }
  if (model.startsWith('runwayml/') || model.startsWith('runway-')) {
    return ProviderName.RUNWAY;
  }
  if (model.startsWith('pika_')) {
    return ProviderName.PIKA;
  }
  if (model.startsWith('heygen-')) {
    return ProviderName.HEYGEN;
  }
  if (model.startsWith('did-') || model.startsWith('d-id-')) {
    return ProviderName.DID;
  }
  if (model.startsWith('elevenlabs/') || model.startsWith('eleven_')) { // This might be redundant if specific checks already cover it well
    return ProviderName.ELEVENLABS;
  }
  if (model.startsWith('assemblyai/') || model.startsWith('assembly-')) {
    return ProviderName.ASSEMBLYAI;
  }
  if (model.startsWith('deepgram/')) {
    return ProviderName.DEEPGRAM;
  }
  if (model.startsWith('huggingface/') || model.startsWith('hf_') || model.includes('/')) {
    // More specific HuggingFace check, less prone to false positives than a generic includes('/')
    // Check if it's a known HF model if not caught by other specific checks
    if (model.includes('facebook/wav2vec2') || model.includes('bert-base-uncased') ) { // Add more known HF models here
        return ProviderName.HUGGINGFACE;
    }
    // If it contains a slash and wasn't caught by other providers, it's likely HuggingFace
    // This is a broad assumption and should be last among prefix checks or refined
    if (model.includes('/') && ![
        ProviderName.OPENAI, ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META,
        ProviderName.COHERE, ProviderName.DEEPSEEK, ProviderName.STABILITY, ProviderName.RUNWAY,
        ProviderName.PIKA, ProviderName.HEYGEN, ProviderName.DID, ProviderName.ELEVENLABS,
        ProviderName.ASSEMBLYAI, ProviderName.DEEPGRAM, ProviderName.ORIGINALITY, ProviderName.TAVUS,
        ProviderName.CODEIUM, ProviderName.TABNINE, ProviderName.GETTY
      ].some(p => model.toLowerCase().startsWith(p.toLowerCase() + '/')) // check if it starts with a known provider prefix
    ) {
        return ProviderName.HUGGINGFACE;
    }
  }
  if (model.startsWith('originalityai/')) {
    return ProviderName.ORIGINALITY;
  }
  if (model.startsWith('tavus-')) {
    return ProviderName.TAVUS;
  }
  if (model.startsWith('codeium-')) {
    return ProviderName.CODEIUM;
  }
  if (model.startsWith('tabnine-')) {
    return ProviderName.TABNINE;
  }
  if (model.startsWith('gettyimages/')) {
    return ProviderName.GETTY;
  }
  return undefined;
}

