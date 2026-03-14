import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('settings')
export class SettingsController {
    constructor(private readonly settingsService: SettingsService) { }

    @Get('ai')
    async getAiConfig() {
        // PUBLIC or GUEST can see what provider is running if needed, 
        // but usually only admin manages it. 
        return this.settingsService.getAiConfig();
    }

    @Get('ai/providers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAiProviders() {
        return this.settingsService.getAiProvidersConfig();
    }

    @Post('ai/providers')
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async setAiProviders(@Body() config: any) {
        return this.settingsService.setAiProvidersConfig(config);
    }

    @Get()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles(UserRole.ADMIN)
    async getAll() {
        return this.settingsService.getAll();
    }
}
