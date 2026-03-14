import { Injectable } from '@nestjs/common';
import { LlmProvider } from './llm-provider.interface';
import { GeminiProvider } from './gemini.provider';
import { OpenRouterProvider } from './openrouter.provider';
import { OpenAiProvider } from './openai.provider';
import { LocalLlmProvider } from './local-llm.provider';
import { AnthropicProvider } from './anthropic.provider';

@Injectable()
export class AiProviderFactory {
    getProvider(name?: string): LlmProvider {
        const providerName = name || process.env.AI_PROVIDER || 'gemini';

        switch (providerName.toLowerCase()) {
            case 'gemini':
                return new GeminiProvider();
            case 'openrouter':
                return new OpenRouterProvider();
            case 'openai':
                return new OpenAiProvider();
            case 'local':
                return new LocalLlmProvider();
            case 'anthropic':
                return new AnthropicProvider();
            // Future providers will be added here
            default:
                return new GeminiProvider();
        }
    }
}
