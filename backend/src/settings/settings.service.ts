import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SystemSetting } from './system-setting.entity';

@Injectable()
export class SettingsService {
    constructor(
        @InjectRepository(SystemSetting)
        private readonly settingsRepository: Repository<SystemSetting>,
    ) { }

    async get(key: string, defaultValue?: string): Promise<string> {
        const setting = await this.settingsRepository.findOne({ where: { key } });
        return setting ? setting.value : defaultValue;
    }

    async getAll(): Promise<SystemSetting[]> {
        return this.settingsRepository.find();
    }

    async set(key: string, value: string, description?: string): Promise<SystemSetting> {
        let setting = await this.settingsRepository.findOne({ where: { key } });
        if (setting) {
            setting.value = value;
            if (description) setting.description = description;
        } else {
            setting = this.settingsRepository.create({ key, value, description });
        }
        return this.settingsRepository.save(setting);
    }

    async getAiProvidersConfig() {
        const configJson = await this.get('AI_PROVIDERS_CONFIG', '[]');
        try {
            return JSON.parse(configJson);
        } catch (e) {
            return [];
        }
    }

    async setAiProvidersConfig(config: any) {
        await this.set('AI_PROVIDERS_CONFIG', JSON.stringify(config), 'Detailed settings for all AI providers');

        // Also update the active provider shorthand for convenience
        const active = config.find((p: any) => p.isActive);
        if (active) {
            await this.set('AI_PROVIDER', active.id, 'Currently active AI provider ID');
            await this.set('AI_MODEL', active.modelName || '', 'Currently active AI model name');
        }

        return config;
    }

    async getAiConfig() {
        const providers = await this.getAiProvidersConfig();
        const active = providers.find((p: any) => p.isActive);

        return {
            provider: active?.id || await this.get('AI_PROVIDER', 'gemini'),
            model: active?.modelName || await this.get('AI_MODEL', ''),
            credentials: active || {}
        };
    }
}
