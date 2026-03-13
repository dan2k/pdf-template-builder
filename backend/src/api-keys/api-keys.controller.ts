import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ApiKeysService } from './api-keys.service';
import { CreateApiKeyDto, UpdateApiKeyDto } from './api-keys.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@ApiTags('API Keys')
@Controller('api-keys')
@UseGuards(JwtAuthGuard)
export class ApiKeysController {
    constructor(private readonly apiKeysService: ApiKeysService) { }

    @Get()
    @ApiOperation({ summary: 'Get API keys for a template' })
    @ApiQuery({ name: 'templateId', required: true })
    findAll(@Request() req, @Query('templateId') templateId: string) {
        return this.apiKeysService.findAllForTemplate(templateId, req.user.id, req.user.role);
    }

    @Post()
    @ApiOperation({ summary: 'Create a new API key' })
    create(@Request() req, @Body() dto: CreateApiKeyDto) {
        return this.apiKeysService.create(dto, req.user.id, req.user.role);
    }

    @Put(':id')
    @ApiOperation({ summary: 'Update an API key (e.g., disable/label)' })
    update(@Request() req, @Param('id') id: string, @Body() dto: UpdateApiKeyDto) {
        return this.apiKeysService.update(id, dto, req.user.id, req.user.role);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Revoke and delete an API key' })
    remove(@Request() req, @Param('id') id: string) {
        return this.apiKeysService.remove(id, req.user.id, req.user.role);
    }
}
