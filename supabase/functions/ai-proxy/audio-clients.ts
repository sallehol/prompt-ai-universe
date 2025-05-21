// supabase/functions/ai-proxy/audio-clients.ts
import { ProviderName } from './providers/types.ts'; // Updated import path

// Base interface for all audio provider clients
export interface AudioProviderClient {
  generateSpeech?(params: any): Promise<any>;
  transcribeSpeech?(params: any): Promise<any>;
}

// OpenAI Audio Client
class OpenAIAudioClient implements AudioProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.openai.com/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateSpeech(params: any): Promise<any> {
    const { input, voice = 'alloy', model = 'tts-1', response_format = 'mp3', ...rest } = params;
    
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        input,
        voice,
        model,
        response_format,
        ...rest
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.message || `OpenAI speech generation failed: ${response.status}`);
      } catch (e) {
        throw new Error(`OpenAI speech generation failed: ${response.status} - ${errorText}`);
      }
    }
    
    const audioData = await response.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: {
        audio_content: base64Audio,
        content_type: response.headers.get('content-type') || `audio/${response_format}` // Use actual content type or guess
      }
    };
  }
  
  async transcribeSpeech(params: any): Promise<any> {
    const { audio, model = 'whisper-1', ...rest } = params;
    
    const formData = new FormData();
    if (audio instanceof File) formData.append('file', audio); else throw new Error('Audio must be a File object for transcription.');
    formData.append('model', model);
    
    for (const [key, value] of Object.entries(rest)) {
      if (typeof value === 'string') formData.append(key, value);
      else if (typeof value === 'number' || typeof value === 'boolean') formData.append(key, String(value));
    }
    
    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: formData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      try {
        const errorJson = JSON.parse(errorText);
        throw new Error(errorJson.error?.message || `OpenAI speech transcription failed: ${response.status}`);
      } catch (e) {
        throw new Error(`OpenAI speech transcription failed: ${response.status} - ${errorText}`);
      }
    }
    
    return await response.json(); // OpenAI returns JSON with "text" field
  }
}

// ElevenLabs Client
class ElevenLabsClient implements AudioProviderClient {
  private apiKey: string;
  private baseUrl: string = 'https://api.elevenlabs.io/v1';
  
  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }
  
  async generateSpeech(params: any): Promise<any> {
    const { 
      input, // 'text' for ElevenLabs
      model = 'eleven_multilingual_v2', // Changed default model
      voice = '9BWtsMINqrJLrRacOk9x', // Default voice_id (Aria)
      voice_settings, // Optional voice settings object
      ...rest 
    } = params;
    
    const body: Record<string, any> = {
        text: input,
        model_id: model,
        ...rest
    };
    if (voice_settings) body.voice_settings = voice_settings;

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voice}`, { // voice_id in path
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'xi-api-key': this.apiKey,
        'Accept': 'audio/mpeg' // Request MP3 audio
      },
      body: JSON.stringify(body)
    });
    
    if (!response.ok) {
        const errorText = await response.text();
        try {
            const errorJson = JSON.parse(errorText);
            // ElevenLabs error structure: { "detail": { "status": "...", "message": "...", "code": "...", "metadata": {} } }
            throw new Error(errorJson.detail?.message || `ElevenLabs speech generation failed: ${response.status}`);
        } catch (e) {
             throw new Error(`ElevenLabs speech generation failed: ${response.status} - ${errorText}`);
        }
    }
    
    const audioData = await response.arrayBuffer();
    const base64Audio = btoa(
      new Uint8Array(audioData).reduce((data, byte) => data + String.fromCharCode(byte), '')
    );
    
    return {
      created: Math.floor(Date.now() / 1000),
      data: {
        audio_content: base64Audio,
        content_type: response.headers.get('content-type') || 'audio/mpeg'
      }
    };
  }

  // transcribeSpeech not typically primary for ElevenLabs, they focus on TTS.
  // If needed, one might use a different provider like AssemblyAI or Deepgram via this client structure.
}

// Factory function to create audio provider clients
export function createAudioProviderClient(provider: ProviderName, apiKey: string): AudioProviderClient {
  switch (provider) {
    case ProviderName.OPENAI:
      return new OpenAIAudioClient(apiKey);
    case ProviderName.ELEVENLABS:
      return new ElevenLabsClient(apiKey);
    default:
      console.error(`Attempted to create audio client for unsupported provider: ${provider}`);
      throw new Error(`Unsupported audio provider: ${provider}`);
  }
}
