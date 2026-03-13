import { Injectable, NotFoundException, ForbiddenException, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ApiKey } from './api-key.entity';
import { Template } from '../templates/template.entity';
import { CreateApiKeyDto, UpdateApiKeyDto } from './api-keys.dto';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ApiKeysService {
    constructor(
        @InjectRepository(ApiKey) private apiKeysRepository: Repository<ApiKey>,
        @InjectRepository(Template) private templatesRepository: Repository<Template>,
    ) { }

    async findAllForTemplate(templateId: string, userId: string, role: string): Promise<any[]> {
        const template = await this.templatesRepository.findOne({ where: { id: templateId } });
        if (!template) throw new NotFoundException('Template not found');
        if (role !== 'admin' && template.userId !== userId) {
            throw new ForbiddenException('You can only manage API keys for your own templates');
        }

        const keys = await this.apiKeysRepository.find({ where: { templateId } });
        return keys.map(k => ({
            id: k.id,
            prefix: k.prefix,
            label: k.label,
            isActive: k.isActive,
            templateId: k.templateId,
            createdAt: k.createdAt,
        }));
    }

    async create(dto: CreateApiKeyDto, userId: string, role: string): Promise<any> {
        const template = await this.templatesRepository.findOne({ where: { id: dto.templateId } });
        if (!template) throw new NotFoundException('Template not found');

        if (role !== 'admin' && template.userId !== userId) {
            throw new ForbiddenException('You can only generate API keys for your own templates');
        }

        // Step 1: Generate secure random secret
        const rawSecret = crypto.randomBytes(32).toString('hex');
        const hashedSecret = await bcrypt.hash(rawSecret, 10);

        // Step 2: Insert into DB so we get the UUID
        const apiKey = this.apiKeysRepository.create({
            keyHash: hashedSecret,
            prefix: 'sk_... (pending)',
            label: dto.label,
            isActive: true,
            templateId: dto.templateId,
        });
        await this.apiKeysRepository.save(apiKey);

        // Step 3: Now we have the ID, construct the final key string: id.secret
        const finalRawKey = `sk_${apiKey.id}.${rawSecret}`;
        const prefixStr = finalRawKey.substring(0, 15) + '...';

        // Update prefix in DB
        apiKey.prefix = prefixStr;
        await this.apiKeysRepository.save(apiKey);

        return {
            id: apiKey.id,
            key: finalRawKey, // Return ONLY ONCE!
            prefix: apiKey.prefix,
            label: apiKey.label,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
        };
    }

    async update(id: string, dto: UpdateApiKeyDto, userId: string, role: string) {
        const apiKey = await this.apiKeysRepository.findOne({ where: { id }, relations: ['template'] });
        if (!apiKey) throw new NotFoundException('API Key not found');

        if (role !== 'admin' && apiKey.template.userId !== userId) {
            throw new ForbiddenException('You do not have access to this API key');
        }

        if (dto.isActive !== undefined) {
            apiKey.isActive = dto.isActive;
            if (!dto.isActive) apiKey.revokedAt = new Date();
            else apiKey.revokedAt = null;
        }
        if (dto.label !== undefined) apiKey.label = dto.label;

        await this.apiKeysRepository.save(apiKey);
        return {
            id: apiKey.id,
            prefix: apiKey.prefix,
            label: apiKey.label,
            isActive: apiKey.isActive,
            createdAt: apiKey.createdAt,
        };
    }

    async remove(id: string, userId: string, role: string) {
        const apiKey = await this.apiKeysRepository.findOne({ where: { id }, relations: ['template'] });
        if (!apiKey) throw new NotFoundException('API Key not found');

        if (role !== 'admin' && apiKey.template.userId !== userId) {
            throw new ForbiddenException('You do not have access to this API key');
        }

        await this.apiKeysRepository.remove(apiKey);
    }

    // Very efficient O(1) lookup
    async validateKeyForExecution(clientKey: string): Promise<ApiKey> {
        if (!clientKey || !clientKey.startsWith('sk_')) {
            throw new UnauthorizedException('Invalid API Key format');
        }

        // Format is sk_UUID.SECRET
        const withoutPrefix = clientKey.substring(3);
        const dotIndex = withoutPrefix.indexOf('.');

        if (dotIndex === -1) {
            throw new UnauthorizedException('Invalid API Key format (missing identifier)');
        }

        const keyId = withoutPrefix.substring(0, dotIndex);
        const secret = withoutPrefix.substring(dotIndex + 1);

        const apiKey = await this.apiKeysRepository.findOne({ where: { id: keyId }, relations: ['template'] });
        if (!apiKey) {
            throw new UnauthorizedException('API Key not found or revoked');
        }

        if (!apiKey.isActive) {
            throw new UnauthorizedException('API Key is disabled');
        }

        // Compare secret
        const isValid = await bcrypt.compare(secret, apiKey.keyHash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid API Key secret');
        }

        return apiKey;
    }
}
