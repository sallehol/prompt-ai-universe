// supabase/functions/ai-proxy/providers/model-mapping.ts
import { ProviderName } from './types.ts';

// Map model names to providers
export function getProviderFromModel(model: string, explicitProvider?: string): ProviderName {
  model = model.toLowerCase();
  
  // 1. If explicit provider is specified and valid, use it
  if (explicitProvider) {
    const normalizedProvider = explicitProvider.toLowerCase();
    // Check if it's a valid provider name
    const isValidProvider = Object.values(ProviderName)
      .some(p => p.toLowerCase() === normalizedProvider);
    
    if (isValidProvider) {
      // Find the correctly cased provider name
      const providerEnum = Object.values(ProviderName)
        .find(p => p.toLowerCase() === normalizedProvider);
      
      if (providerEnum) {
        return providerEnum;
      }
    }
    // If provider is specified but invalid, log a warning but continue with model-based detection
    console.warn(`Specified provider "${explicitProvider}" is not recognized. Falling back to model-based detection.`);
  }
  
  // 2. Specific model identifiers (no provider name in model)
  // Video models
  if (model === 'gen-1' || model === 'gen-2') {
    return ProviderName.RUNWAY;
  }
  
  // Image models
  if (model === 'sdxl' || model === 'sd-xl' || model === 'stable-diffusion-xl' || model.startsWith('sd3') || model.startsWith('stable-diffusion-3')) { // Added SD3
    return ProviderName.STABILITY;
  }
  
  // Text/Chat models (prioritize newer/common versions if ambiguous)
  if (model === 'gpt-4o' || model === 'gpt-4o-mini' || model === 'gpt-4-turbo' || model === 'gpt-4' || model === 'gpt-3.5-turbo') { // Added more OpenAI models
    return ProviderName.OPENAI;
  }
  if (model === 'claude-3-opus' || model === 'claude-3.5-sonnet' || model === 'claude-3-sonnet' || model === 'claude-3-haiku' || model === 'claude-2.1' || model === 'claude-2' || model === 'claude-instant-1.2') { // Added more Anthropic models
    return ProviderName.ANTHROPIC;
  }
  if (model === 'gemini-1.5-pro' || model === 'gemini-1.5-flash' || model === 'gemini-pro' || model === 'gemini-ultra' || model === 'text-bison' || model === 'chat-bison') { // Added more Google models
    return ProviderName.GOOGLE;
  }
  if (model === 'mistral-large-latest' || model === 'mistral-large' || model === 'mistral-medium' || model === 'mistral-small' || model === 'mistral-7b' || model === 'mixtral-8x7b' || model === 'codestral-latest') { // Added more Mistral models
    return ProviderName.MISTRAL;
  }
  if (model.startsWith('llama-3') || model.startsWith('llama3') || model.startsWith('llama-2') || model.startsWith('llama2') || model.startsWith('codellama')) { // Added more Llama models
    return ProviderName.META;
  }
  if (model === 'command-r-plus' || model === 'command-r' || model === 'command' || model === 'command-light' || model === 'command-nightly') { // Added more Cohere models
    return ProviderName.COHERE;
  }
  if (model.startsWith('deepseek-coder') || model.startsWith('deepseek-llm')) {
      return ProviderName.DEEPSEEK;
  }
  
  // Audio models
  if (model === 'tts-1' || model === 'tts-1-hd' || model === 'whisper-1') {
    return ProviderName.OPENAI;
  }
  if (model === 'eleven-multilingual-v2' || model === 'eleven-multilingual-v1' || model === 'eleven-mono' || model === 'eleven-turbo-v2' || model.startsWith('eleven_')) { // Updated ElevenLabs
    return ProviderName.ELEVENLABS;
  }
  
  // 3. Provider prefixes (explicit provider name in model) - generally more reliable than includes
  if (model.startsWith('openai/') || model.startsWith('gpt-') || model.startsWith('dall-e-') || model.startsWith('whisper-')) {
    return ProviderName.OPENAI;
  }
  if (model.startsWith('anthropic/') || model.startsWith('claude-')) {
    return ProviderName.ANTHROPIC;
  }
  if (model.startsWith('google/') || model.startsWith('gemini-') || model.startsWith('imagen-') || model.startsWith('models/text-bison') || model.startsWith('models/chat-bison')) {
    return ProviderName.GOOGLE;
  }
  if (model.startsWith('mistralai/') || model.startsWith('mistral-') || model.startsWith('open-mistral-') || model.startsWith('open-mixtral-') || model.startsWith('codestral-')) { // More specific Mistral prefixes
    return ProviderName.MISTRAL;
  }
  if (model.startsWith('meta-llama/') || model.startsWith('llama-') || model.startsWith('codellama/')) { // More specific Meta prefixes
    return ProviderName.META;
  }
  if (model.startsWith('cohere/') || model.startsWith('command-')) {
    return ProviderName.COHERE;
  }
  if (model.startsWith('deepseek-') || model.startsWith('deepseekai/')) {
    return ProviderName.DEEPSEEK;
  }
  if (model.startsWith('midjourney')) { // Midjourney often doesn't have a prefix but the name itself
    return ProviderName.MIDJOURNEY;
  }
  if (model.startsWith('stabilityai/') || model.startsWith('stable-') || model.startsWith('sdxl') || model.startsWith('sd-')) { // Stability AI specific prefixes
    return ProviderName.STABILITY;
  }
  if (model.startsWith('runwayml/') || model.startsWith('runway-')) {
    return ProviderName.RUNWAY;
  }
  if (model.startsWith('pika_')) { // Pika often uses underscores
    return ProviderName.PIKA;
  }
  if (model.startsWith('heygen-')) {
    return ProviderName.HEYGEN;
  }
  if (model.startsWith('did-') || model.startsWith('d-id-')) {
    return ProviderName.DID;
  }
  if (model.startsWith('elevenlabs/') || model.startsWith('eleven_')) {
    return ProviderName.ELEVENLABS;
  }
  if (model.startsWith('assemblyai/') || model.startsWith('assembly-')) {
    return ProviderName.ASSEMBLYAI;
  }
  if (model.startsWith('deepgram/')) { // Deepgram specific prefix
    return ProviderName.DEEPGRAM;
  }
  if (model.startsWith('huggingface/') || model.startsWith('hf_') || model.includes('/')) { // HuggingFace often has owner/model_name
    // Check if it's a known HF model if not caught by other specific checks
    if (model.includes('facebook/wav2vec2') || model.includes('bert-base-uncased') ) { // Add more known HF models here
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
  
  // 4. Pattern matching (for backward compatibility) - less reliable, placed after specific checks
  // Use more specific checks to avoid conflicts
  if (model.includes('gpt') || model.includes('dall-e') || model.includes('whisper')) {
    if (![ProviderName.ANTHROPIC, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE].some(p => model.includes(p))) return ProviderName.OPENAI;
  }
  if (model.includes('claude')) {
    if (![ProviderName.OPENAI, ProviderName.GOOGLE, ProviderName.MISTRAL, ProviderName.META, ProviderName.COHERE].some(p => model.includes(p))) return ProviderName.ANTHROPIC;
  }
  // ... (keep other .includes checks, but they are now lower priority)
  if (model.includes('gemini') || model.includes('imagen')) {
    return ProviderName.GOOGLE;
  }
  if (model.includes('mistral') || model.includes('codestral')) { // codestral is Mistral
    return ProviderName.MISTRAL;
  }
  if (model.includes('llama')) {
    return ProviderName.META;
  }
  // command for cohere might be too generic, handled by prefix.
  // deepseek handled by prefix.
  // midjourney handled by prefix/specific.
  if (model.includes('stable') || model.includes('stability')) { // Keep this for broader stability catch
    return ProviderName.STABILITY;
  }
  // runway handled by prefix/specific.
  // pika handled by prefix/specific.
  // heygen handled by prefix.
  // d-id handled by prefix.
  if (model.includes('eleven')) { // Keep this for broader elevenlabs catch
    return ProviderName.ELEVENLABS;
  }
  // assembly handled by prefix.
  // deepgram handled by prefix.
  if (model.includes('huggingface') || model.includes('transformers')) { // Keep for broader HF catch
    return ProviderName.HUGGINGFACE;
  }
  // originality handled by prefix.
  // tavus handled by prefix.
  // codeium handled by prefix.
  // tabnine handled by prefix.
  // getty handled by prefix.
  
  // 5. Better error handling
  console.warn(`Unknown provider for model: ${model}. Consider specifying provider explicitly or check model name.`);
  // Instead of defaulting to OpenAI, throw an error
  throw new Error(`Unknown provider for model: "${model}". Please specify provider explicitly or ensure the model name is registered.`);
}
