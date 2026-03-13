import {
  Controller, Get, Post, Put, Delete,
  Body, Param, HttpCode, HttpStatus,
  UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TemplatesService } from './templates.service';
import { CreateTemplateDto, UpdateTemplateDto, DuplicateTemplateDto } from './templates.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/jwt-optional-auth.guard';

@ApiTags('Templates')
@Controller('templates')
export class TemplatesController {
  constructor(private readonly service: TemplatesService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all visible templates for user' })
  findAll(@Request() req) {
    return this.service.findAllVisibleToUser(req.user.id, req.user.role);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get template by ID (requires access)' })
  findOne(@Request() req, @Param('id') id: string) {
    return this.service.findOne(id, req.user.id, req.user.role);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create new template' })
  create(@Request() req, @Body() dto: CreateTemplateDto) {
    return this.service.create(dto, req.user.id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update template (owner or admin only)' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateTemplateDto) {
    return this.service.update(id, dto, req.user.id, req.user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete template (owner or admin only)' })
  remove(@Request() req, @Param('id') id: string) {
    return this.service.remove(id, req.user.id, req.user.role);
  }

  @Post(':id/copy')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Copy template to your account' })
  duplicate(@Request() req, @Param('id') id: string, @Body() dto: DuplicateTemplateDto) {
    return this.service.duplicate(id, req.user.id, req.user.role, dto?.targetUserId, dto?.targetCategory);
  }
}
