
import React from 'react';
import { Brain, Code, ImageIcon, Film, Mic, BarChart3, LayoutDashboard, Sparkles, Cpu, LucideProps } from 'lucide-react';

export interface Model {
  id: string;
  name: string;
  provider: string;
  categoryKey: string;
  description?: string; // For model cards on category pages
  capabilities?: string; // For tooltips or detailed views
  limitations?: string; // For tooltips or detailed views
  // icon?: React.ComponentType<{ className?: string }>; // Placeholder for specific model/provider logo
}

export interface ModelCategoryInfo {
  key: string; // e.g., "text"
  name: string; // e.g., "Text Models (LLMs)"
  description: string; // For ModelCatalogPage card
  icon: React.FC<LucideProps>; // Changed type to React.FC<LucideProps>
  modelCountLabel?: string; // For ModelCatalogPage card (e.g. "Models like GPT-4o, Claude 3.7...")
}

// Define categories
export const modelCategoryDetails: Record<string, ModelCategoryInfo> = {
  text: { 
    key: 'text', 
    name: 'Text Models (LLMs)', 
    description: "For chatbots, content generation, summarization, translation, complex reasoning, and more.",
    icon: Brain,
    modelCountLabel: "Models like GPT-4o, Claude 3.7"
  },
  image: { 
    key: 'image', 
    name: 'Image Generation', 
    description: "Create stunning visuals from text prompts, edit existing images, and explore artistic styles.",
    icon: ImageIcon,
    modelCountLabel: "Models like DALL·E 3, Midjourney"
  },
  video: {
    key: 'video',
    name: 'Video Generation & Editing',
    description: "Generate videos from text or images, AI-powered editing tools, and create avatar-based content.",
    icon: Film,
    modelCountLabel: "Tools like Runway, Pika Labs"
  },
  speech: {
    key: 'speech',
    name: 'Speech Recognition & Synthesis',
    description: "Convert speech to text (ASR) and text to natural-sounding speech (TTS), voice cloning, and more.",
    icon: Mic,
    modelCountLabel: "Services like ElevenLabs, Whisper"
  },
  code: {
    key: 'code',
    name: 'Code Generation & Analysis',
    description: "AI-assisted coding, debugging, code explanation, and generation for various programming languages.",
    icon: Code,
    modelCountLabel: "Models like Codestral, OpenAI Codex"
  },
  dataAnalysis: {
    key: 'dataAnalysis',
    name: 'Data Analysis & Specialized AI',
    description: "Extract insights from data, AI content detection, and specialized tools.",
    icon: BarChart3, // Changed from Database to BarChart3 for consistency
    modelCountLabel: "Tools like Hugging Face, AI Detectors"
  },
  websiteBuilders: {
    key: 'websiteBuilders',
    name: 'Website & App Builders',
    description: "AI-powered tools to design and build websites, applications, and UI components with ease.",
    icon: LayoutDashboard,
    modelCountLabel: "Tools like Wix ADI, Builder.io, v0.dev"
  },
  // Add other categories as needed
};

// Define all models
// Note: This is a representative subset. Expand with the full list provided.
// For provider logos (model.icon), you'd typically use imported image components or URLs.
// Using category icons or generic ones as placeholders if no specific icon is available.
export const allModels: Model[] = [
  // Text Models
  { id: 'gpt-4o', name: 'GPT-4o', provider: 'OpenAI', categoryKey: 'text', description: 'OpenAI\'s most advanced multimodal model.', capabilities: 'Powerful, Vision, Advanced Reasoning, Multimodal', limitations: 'Higher cost, potential latency' },
  { id: 'gpt-4.1-turbo', name: 'GPT-4.1 Turbo (Preview)', provider: 'OpenAI', categoryKey: 'text', description: 'The next generation of GPT-4 Turbo.', capabilities: 'Enhanced capabilities over GPT-4 Turbo', limitations: 'Preview, API access may vary' },
  { id: 'claude-3.7-sonnet', name: 'Claude 3.7 Sonnet', provider: 'Anthropic', categoryKey: 'text', description: 'A fast and versatile model from Anthropic.', capabilities: 'Strong performance, Vision, Speed, Cost-effective for scale', limitations: 'Beta, may have evolving capabilities' },
  { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', provider: 'Google', categoryKey: 'text', description: 'Google\'s latest high-capability multimodal model.', capabilities: 'Large context window, Multimodal, Advanced reasoning', limitations: 'Availability might vary' },
  { id: 'mistral-large-2', name: 'Mistral Large 2', provider: 'Mistral AI', categoryKey: 'text', description: 'Mistral AI\'s flagship large language model.', capabilities: 'Top-tier reasoning, Multilingual, Function calling', limitations: 'Newer model, ecosystem maturing' },
  // Adding the missing text models
  { id: 'deepseek-coder', name: 'DeepSeek Coder', provider: 'DeepSeek', categoryKey: 'text', description: 'Specialized in understanding and generating code.', capabilities: 'Code understanding, Generation, Multilingual support', limitations: 'Specialized focus on code tasks' },
  { id: 'deepseek-llm', name: 'DeepSeek LLM', provider: 'DeepSeek', categoryKey: 'text', description: 'General-purpose large language model.', capabilities: 'Text generation, Translation, Summarization', limitations: 'Newer to market, still evolving' },
  { id: 'cohere-command', name: 'Command R+', provider: 'Cohere', categoryKey: 'text', description: 'Enterprise-grade foundation model for business use cases.', capabilities: 'Content generation, RAG applications, Enterprise focus', limitations: 'Primarily business-oriented' },
  { id: 'llama-3', name: 'Llama 3', provider: 'Meta AI', categoryKey: 'text', description: 'Open-source large language model by Meta.', capabilities: 'Open ecosystem, Flexible deployment, Community support', limitations: 'Requires technical setup for self-hosting' },
  
  // Image Generation
  { id: 'dall-e-3', name: 'DALL·E 3', provider: 'OpenAI', categoryKey: 'image', description: 'High-quality image generation from text.', capabilities: 'High-Quality Image Generation, Detail, Coherence', limitations: 'Usage limits, API costs' },
  { id: 'midjourney-v7', name: 'Midjourney V7', provider: 'Midjourney', categoryKey: 'image', description: 'Artistic and stylized image generation (hypothetical V7).', capabilities: 'Artistic, Stylized Images, Highly creative', limitations: 'Primarily Discord-based, API access limited' },
  { id: 'sd3', name: 'Stable Diffusion 3', provider: 'Stability AI', categoryKey: 'image', description: 'Open-source model with strong photorealism.', capabilities: 'Open source, Highly customizable, Strong photorealism', limitations: 'Can require technical setup' },
  // Adding missing image models
  { id: 'imagen-3', name: 'Imagen 3', provider: 'Google', categoryKey: 'image', description: 'Google\'s advanced image generation model.', capabilities: 'High fidelity, Prompt accuracy, Consistent style', limitations: 'Limited availability through API' },
  { id: 'getty-ai', name: 'Getty Images AI', provider: 'Getty Images', categoryKey: 'image', description: 'Commercial-safe AI image generation built on licensed content.', capabilities: 'Commercial usage rights, No copyright concerns, Professional quality', limitations: 'Subscription required, More limited style range' },

  // Video Generation
  { id: 'runway-gen-2', name: 'Runway Gen-2', provider: 'RunwayML', categoryKey: 'video', description: 'Text-to-video and image-to-video generation.', capabilities: 'Text-to-video, Image-to-video, Video editing tools', limitations: 'Generation length/quality can vary' },
  { id: 'pika-1.0', name: 'Pika 1.0', provider: 'Pika Labs', categoryKey: 'video', description: 'Generate and edit videos in diverse styles.', capabilities: 'Text-to-video, Image-to-video, Diverse styles', limitations: 'Early access, evolving features' },
  // Adding missing video models
  { id: 'heygen', name: 'HeyGen', provider: 'HeyGen', categoryKey: 'video', description: 'AI-powered video generation platform with avatar creation.', capabilities: 'AI avatars, Text-to-video, Professional presentations', limitations: 'Primarily template-based, Subscription model' },
  { id: 'd-id', name: 'D-ID', provider: 'D-ID', categoryKey: 'video', description: 'Create talking head videos from text or audio.', capabilities: 'Talking avatars, Face animation, Multiple languages', limitations: 'Focused on talking heads rather than full scenes' },

  // Speech
  { id: 'elevenlabs-v2', name: 'ElevenLabs Multilingual v2', provider: 'ElevenLabs', categoryKey: 'speech', description: 'Realistic text-to-speech and voice cloning.', capabilities: 'Realistic TTS, Voice cloning, Multiple languages', limitations: 'Commercial use pricing' },
  { id: 'openai-whisper', name: 'OpenAI Whisper', provider: 'OpenAI', categoryKey: 'speech', description: 'Accurate speech-to-text transcription.', capabilities: 'Accurate ASR, Multilingual, Open source', limitations: 'Primarily ASR, TTS is separate' },
  // Adding missing speech models
  { id: 'assemblyai', name: 'AssemblyAI', provider: 'AssemblyAI', categoryKey: 'speech', description: 'API for transcription, summarization, and content moderation.', capabilities: 'Real-time transcription, Content intelligence, Speaker diarization', limitations: 'API-only, No standalone application' },
  { id: 'deepgram', name: 'Deepgram', provider: 'Deepgram', categoryKey: 'speech', description: 'Enterprise-grade speech recognition platform.', capabilities: 'High accuracy ASR, Real-time processing, Custom vocabulary', limitations: 'Enterprise focus, More complex integration' },

  // Code Generation
  { id: 'openai-codex', name: 'OpenAI Codex', provider: 'OpenAI', categoryKey: 'code', description: 'Powerful code generation model (often part of GPT models).', capabilities: 'Code generation, completion, explanation', limitations: 'Context length, specificity' },
  { id: 'mistral-codestral', name: 'Codestral', provider: 'Mistral AI', categoryKey: 'code', description: 'Specialized model for code generation and understanding.', capabilities: 'Specialized for code, Fast, Autocompletion', limitations: 'Newer, focus on code tasks' },
  // Adding missing code models
  { id: 'codeium', name: 'Codeium', provider: 'Codeium', categoryKey: 'code', description: 'AI code assistant with editor integrations.', capabilities: 'Code completion, In-editor assistance, Multi-language', limitations: 'Editor plugin required' },
  { id: 'tabnine', name: 'Tabnine', provider: 'Tabnine', categoryKey: 'code', description: 'AI code completion tool trained on billions of lines of code.', capabilities: 'Code completion, Multi-language, Privacy focus', limitations: 'Primarily completion, less explanation' },
  { id: 'deepcode', name: 'DeepCode', provider: 'Snyk', categoryKey: 'code', description: 'AI-powered code review and bug detection.', capabilities: 'Security scanning, Bug detection, Best practices', limitations: 'Focus on review rather than generation' },
  { id: 'starcoder', name: 'StarCoder', provider: 'Hugging Face', categoryKey: 'code', description: 'Open-source code generation model.', capabilities: 'Open source, Community-supported, Multiple languages', limitations: 'May require fine-tuning for specific tasks' },
  
  // Data Analysis
  { id: 'huggingface-transformers', name: 'Hugging Face Transformers', provider: 'Hugging Face', categoryKey: 'dataAnalysis', description: 'Access a wide variety of models for NLP and data tasks.', capabilities: 'Platform for various models, NLP, Data tasks', limitations: 'Library/Platform, not a single model' },
  { id: 'ai-content-detector-originality', name: 'Originality.AI Detector', provider: 'Originality.AI', categoryKey: 'dataAnalysis', description: 'Detects AI-generated text content.', capabilities: 'Detects AI-generated text', limitations: 'Accuracy can vary, not foolproof' },
  // Adding missing data analysis models
  { id: 'tavus', name: 'Tavus', provider: 'Tavus', categoryKey: 'dataAnalysis', description: 'Personalized video generation platform using data insights.', capabilities: 'Personalized videos, Data-driven, Marketing focus', limitations: 'Specialized use case, Enterprise pricing' },

  // Website Builders
  { id: 'wix-adi', name: 'Wix ADI', provider: 'Wix', categoryKey: 'websiteBuilders', description: 'AI-powered website design and content creation on Wix.', capabilities: 'AI-powered website design and content creation', limitations: 'Tied to Wix platform, customization limits' },
  { id: 'v0-dev', name: 'v0.dev by Vercel', provider: 'Vercel', categoryKey: 'websiteBuilders', description: 'Generative UI for React components from text/images.', capabilities: 'Generative UI, Generates React code from text/images', limitations: 'Early access, focus on component generation' },
  // Adding missing website builder models
  { id: 'builder-io', name: 'Builder.io', provider: 'Builder.io', categoryKey: 'websiteBuilders', description: 'Visual CMS with AI-powered content generation.', capabilities: 'Visual editing, Headless CMS, AI content generation', limitations: 'Requires technical integration for custom sites' },
];

export const getModelsByCategory = (categoryKey: string): Model[] => {
  return allModels.filter(model => model.categoryKey === categoryKey);
};

export const getModelById = (modelId: string): Model | undefined => {
  return allModels.find(m => m.id === modelId);
};

export const getCategoryInfo = (categoryKey: string): ModelCategoryInfo | undefined => {
  return modelCategoryDetails[categoryKey];
};

export const getAllCategoriesArray = (): ModelCategoryInfo[] => {
    return Object.values(modelCategoryDetails);
};
