import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AiProviderFactory } from './providers/ai-provider.factory';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class AiService {
    constructor(
        private readonly providerFactory: AiProviderFactory,
        private readonly settingsService: SettingsService,
    ) { }

    async transformTemplate(prompt: string, currentElements: any[], providerName?: string, modelName?: string): Promise<any> {
        try {
            // Get persisted settings
            const aiConfig = await this.settingsService.getAiConfig();
            const finalProvider = providerName || aiConfig.provider;
            const finalModel = modelName || aiConfig.model;
            const credentials = aiConfig.credentials;

            const provider = this.providerFactory.getProvider(finalProvider);
            const elements = await provider.generateTemplate(prompt, currentElements, finalModel, credentials);
            return elements;
        } catch (error) {
            console.error('AiService Error:', error);
            if (error instanceof InternalServerErrorException) throw error;
            throw new InternalServerErrorException(error.message || 'Failed to process AI request.');
        }
    }
}
