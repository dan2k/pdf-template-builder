import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { ApiKeysService } from './api-keys.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private apiKeysService: ApiKeysService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const apiKeyHeader = request.headers['x-api-key'];

        if (!apiKeyHeader) {
            throw new UnauthorizedException('Missing X-API-Key header');
        }

        // validateKeyForExecution checks hash, existence, and active status
        const apiKey = await this.apiKeysService.validateKeyForExecution(apiKeyHeader);

        // Attach to request so the controller can verify it matches the requested template ID
        request.apiKey = apiKey;

        return true;
    }
}
