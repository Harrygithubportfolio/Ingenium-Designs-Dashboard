import type { AiProvider, AiProviderName } from './types';
import { AnthropicProvider } from './anthropic';
import { GeminiProvider } from './gemini';

/**
 * Returns the configured AI provider based on the AI_PROVIDER env var.
 * Defaults to 'gemini' (cheapest option).
 */
export function getAiProvider(): AiProvider {
  const providerName = (process.env.AI_PROVIDER ?? 'gemini') as AiProviderName;

  switch (providerName) {
    case 'anthropic': {
      const apiKey = process.env.ANTHROPIC_API_KEY;
      if (!apiKey) {
        throw new Error('ANTHROPIC_API_KEY is required when AI_PROVIDER=anthropic');
      }
      return new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL);
    }

    case 'gemini': {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        throw new Error('GEMINI_API_KEY is required when AI_PROVIDER=gemini');
      }
      return new GeminiProvider(apiKey, process.env.GEMINI_MODEL);
    }

    default:
      throw new Error(`Unknown AI provider: ${providerName}`);
  }
}

/**
 * Checks whether any AI provider is configured and available.
 */
export function isAiConfigured(): boolean {
  const providerName = (process.env.AI_PROVIDER ?? 'gemini') as AiProviderName;

  switch (providerName) {
    case 'anthropic':
      return !!process.env.ANTHROPIC_API_KEY;
    case 'gemini':
      return !!process.env.GEMINI_API_KEY;
    default:
      return false;
  }
}
