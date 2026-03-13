import {
  Controller, Get, Post, Put, Delete,
  Body, Param, HttpCode, HttpStatus,
  UseGuards, Request
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/jwt-optional-auth.guard';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly service: CategoriesService) { }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get all categories for the authenticated user' })
  findAll(@Request() req) {
    // All users (including guests) get full category list for sidebar tree.
    // Write access is still restricted by create/update/delete endpoints.
    return this.service.findAll();
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create category (scoped to user, admin can override)' })
  create(@Request() req, @Body() dto: CreateCategoryDto) {
    const targetUserId = req.user.role === 'admin' && dto.userId ? dto.userId : req.user.id;
    return this.service.create(dto, targetUserId);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update category' })
  update(@Request() req, @Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    const isAdmin = req.user.role === 'admin';
    const targetUserId = isAdmin && dto.userId ? dto.userId : req.user.id;
    return this.service.update(id, dto, targetUserId, isAdmin);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete category' })
  remove(@Request() req, @Param('id') id: string) {
    // For delete, we might not have a DTO with userId, so Admin can delete any category 
    // simply by overriding the finder in the service, or we pass admin flag.
    const isAdmin = req.user.role === 'admin';
    return this.service.remove(id, req.user.id, isAdmin);
  }
}
