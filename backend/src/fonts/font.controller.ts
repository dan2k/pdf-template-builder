import {
  Controller, Get, Post, Delete, Patch, Param, Body,
  UploadedFile, UseInterceptors, UseGuards, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FontService } from './font.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '../users/user.entity';

@ApiTags('Fonts')
@Controller('fonts')
export class FontController {
  constructor(private readonly fontService: FontService) {}

  @Get()
  @ApiOperation({ summary: 'Get visible fonts (for editor)' })
  getFonts() {
    return this.fontService.getVisibleFonts().map(f => ({
      name: f.name, key: f.key, language: f.language,
      hasRegular: f.variants.some(v => v.weight === 'normal' && v.style === 'normal'),
      hasBold: f.variants.some(v => v.weight === 'bold'),
      hasItalic: f.variants.some(v => v.style === 'italic'),
    }));
  }

  @Get('all')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all fonts including hidden (admin)' })
  getAllFonts() {
    return this.fontService.getFonts().map(f => ({
      name: f.name, key: f.key, language: f.language,
      hidden: !!(f as any).hidden,
      isBuiltin: ['Helvetica', 'Times-Roman', 'Courier'].includes(f.key),
      hasRegular: f.variants.some(v => v.weight === 'normal' && v.style === 'normal'),
      hasBold: f.variants.some(v => v.weight === 'bold'),
      hasItalic: f.variants.some(v => v.style === 'italic'),
      variantCount: f.variants.length,
    }));
  }

  @Patch(':key/visibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Toggle font visibility (admin)' })
  toggleVisibility(@Param('key') key: string, @Body() body: { hidden: boolean }) {
    const ok = this.fontService.setFontVisibility(key, body.hidden);
    if (!ok) throw new BadRequestException('Font not found');
    return { key, hidden: body.hidden };
  }

  @Delete(':key')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete a custom font (admin)' })
  deleteFont(@Param('key') key: string) {
    const ok = this.fontService.deleteFont(key);
    if (!ok) throw new BadRequestException('Cannot delete this font (builtin or not found)');
    return { deleted: key };
  }

  @Post('upload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Upload custom font (.ttf or .otf)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './fonts',
        filename: (req, file, cb) => {
          const name = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
          cb(null, name);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.originalname.match(/\.(ttf|otf)$/i)) cb(null, true);
        else cb(new BadRequestException('Only .ttf and .otf font files allowed'), false);
      },
    }),
  )
  uploadFont(@UploadedFile() file: Express.Multer.File) {
    // Reload fonts after upload
    this.fontService.reloadFonts();
    return {
      message: 'Font uploaded and loaded successfully.',
      filename: file.filename,
      size: file.size,
    };
  }

  @Post('reload')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Reload fonts from disk (admin)' })
  reloadFonts() {
    this.fontService.reloadFonts();
    return { message: 'Fonts reloaded', count: this.fontService.getFonts().length };
  }
}
