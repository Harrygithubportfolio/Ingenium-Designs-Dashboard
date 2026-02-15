import Anthropic from '@anthropic-ai/sdk';
import type { AiProvider, AiCompletionOptions, AiCompletionResult } from './types';

const DEFAULT_MODEL = 'claude-sonnet-4-5-20250929';

export class AnthropicProvider implements AiProvider {
  readonly name = 'anthropic' as const;
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model ?? DEFAULT_MODEL;
  }

  async complete(options: AiCompletionOptions): Promise<AiCompletionResult> {
    const message = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens,
      system: options.prompt.system,
      messages: [{ role: 'user', content: options.prompt.user }],
    });

    const textBlock = message.content.find((b) => b.type === 'text');
    if (!textBlock || textBlock.type !== 'text') {
      throw new Error('No text response from Anthropic');
    }

    return {
      text: textBlock.text,
      modelUsed: this.model,
      providerName: 'anthropic',
    };
  }
}
