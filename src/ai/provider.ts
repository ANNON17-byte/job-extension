import type { Profile } from '../types/profile';
import type { JobDescription } from '../types/form';

export interface AIProviderConfig {
  apiKey: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AnswerGenerationRequest {
  question: string;
  fieldLabel: string;
  maxLength?: number;
  jobDescription?: Partial<JobDescription>;
  profile: Profile;
}

export interface AnswerGenerationResult {
  answer: string;
  reasoning: string;
  evidenceUsed: string[];
  isAiSuggestion: boolean;
}

export interface LLMProvider {
  isConfigured(): boolean;
  generateAnswer(request: AnswerGenerationRequest): Promise<AnswerGenerationResult>;
  analyzeJobDescription(rawText: string): Promise<Partial<JobDescription>>;
}

