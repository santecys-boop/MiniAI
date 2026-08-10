import { registerPlugin } from '@capacitor/core';

export interface SystemPrompt { prompt: string; size: number; }
export interface GenerateResult { text: string; mode: string; }

export interface AiEnginePlugin {
  getSystemPrompt(): Promise<{ value: SystemPrompt }>;
  generateWithPrompt(options: { message: string }): Promise<{ value: GenerateResult }>;
}

const AiEngine = registerPlugin<AiEnginePlugin>('AiEngine');
export default AiEngine;
