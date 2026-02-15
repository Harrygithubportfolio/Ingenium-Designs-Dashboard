export interface AiPrompt {
  system: string;
  user: string;
}

export interface AiCompletionOptions {
  prompt: AiPrompt;
  maxTokens: number;
  /** If true, use the provider's native JSON output mode (if available). */
  jsonMode?: boolean;
}

export interface AiCompletionResult {
  text: string;
  modelUsed: string;
  providerName: AiProviderName;
}

export type AiProviderName = 'anthropic' | 'gemini';

export interface AiProvider {
  readonly name: AiProviderName;
  complete(options: AiCompletionOptions): Promise<AiCompletionResult>;
}
