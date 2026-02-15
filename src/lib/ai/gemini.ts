import { GoogleGenerativeAI } from '@google/generative-ai';
import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';

const DEFAULT_MODEL = 'gemini-2.5-flash';

export class GeminiProvider implements AiProvider {
  readonly name = 'gemini' as const;
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model ?? DEFAULT_MODEL;
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: options.prompt.system,
      generationConfig: {
        maxOutputTokens: options.maxTokens,
        ...(options.jsonMode && {
          responseMimeType: 'application/json',
        }),
      },
    });

    const result = await model.generateContent(options.prompt.user);
    const text = result.response.text();

    if (!text) {
      throw new Error('No text response from Gemini');
    }

    return {
      text,
      modelUsed: this.model,
      providerName: 'gemini',
    };
  }
}
