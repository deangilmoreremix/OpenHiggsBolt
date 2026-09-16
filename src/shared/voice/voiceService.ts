export type VoiceProvider = 'modal' | 'muapi' | 'openai-compatible';

export interface VoiceHealth {
  status: 'ok' | 'error';
  service: string;
  version: string;
  provider?: VoiceProvider;
  detail?: string;
}

export interface VoiceGenerateOptions {
  text: string;
  voiceId?: string;
  model?: string;
  language?: string;
  stability?: number;
  similarityBoost?: number;
  style?: number;
  speakerBoost?: boolean;
  onProgress?: (progress: number) => void;
}

export interface VoiceCloneOptions {
  name: string;
  audioUrls: string[];
  description?: string;
}

export interface VoiceConvertOptions {
  audioUrl: string;
  targetVoiceId: string;
}

export interface VoiceTranscribeOptions {
  audioUrl: string;
  language?: string;
  diarization?: boolean;
}

export interface VoiceDubOptions {
  videoUrl: string;
  targetLanguage: string;
  voiceAssignments?: Record<string, string>;
}

export interface VoiceJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  type: 'generate' | 'clone' | 'convert' | 'transcribe' | 'dub';
  progress?: number;
  result?: Record<string, unknown>;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VoiceService {
  health(): Promise<VoiceHealth>;
  generate(options: VoiceGenerateOptions): Promise<VoiceJob>;
  clone(options: VoiceCloneOptions): Promise<VoiceJob>;
  convert(options: VoiceConvertOptions): Promise<VoiceJob>;
  transcribe(options: VoiceTranscribeOptions): Promise<VoiceJob>;
  dub(options: VoiceDubOptions): Promise<VoiceJob>;
  getJob(id: string): Promise<VoiceJob>;
  cancelJob(id: string): Promise<void>;
}

export function createVoiceService(provider: VoiceProvider, _config: Record<string, unknown>): VoiceService {
  // Provider implementations will be registered here.
  // For now this is a minimal factory; real providers are added in later phases.
  return {
    health: async () => ({ status: 'error', service: 'voice', version: '0.1.0', provider }),
    generate: async () => { throw new Error('Voice provider not implemented'); },
    clone: async () => { throw new Error('Voice provider not implemented'); },
    convert: async () => { throw new Error('Voice provider not implemented'); },
    transcribe: async () => { throw new Error('Voice provider not implemented'); },
    dub: async () => { throw new Error('Voice provider not implemented'); },
    getJob: async () => { throw new Error('Voice provider not implemented'); },
    cancelJob: async () => { throw new Error('Voice provider not implemented'); },
  };
}

export interface VoiceModel {
  id: string;
  name: string;
  endpoint: string;
  provider: string;
  provider_name: string;
  family: string;
  description: string;
  required?: string[];
  inputs: Record<string, any>;
}

export interface VoiceGenerationParams {
  model: string;
  text?: string;
  voice_id?: string;
  audio_url?: string;
  [key: string]: any;
}

export interface VoiceResult {
  url: string;
  request_id?: string;
  id?: string;
  model?: string;
  prompt?: string;
  timestamp?: string;
  [key: string]: any;
}

export interface Voice {
  id: string;
  name: string;
  provider: string;
  created_at: string;
  [key: string]: any;
}
