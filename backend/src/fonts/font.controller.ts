import {
  Controller, Get, Post, UploadedFile,
  UseInterceptors, BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ApiTags, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { FontService } from './font.service';

@ApiTags('Fonts')
@Controller('fonts')
export class FontController {
  constructor(private readonly fontService: FontService) {}

  @Get()
  @ApiOperation({ summary: 'Get all available fonts' })
  getFonts() {
    return this.fontService.getFonts().map(f => ({
      name: f.name,
      key: f.key,
      language: f.language,
      hasRegular: f.variants.some(v => v.weight === 'normal' && v.style === 'normal'),
      hasBold: f.variants.some(v => v.weight === 'bold'),
      hasItalic: f.variants.some(v => v.style === 'italic'),
    }));
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload custom font (.ttf or .otf)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          // Use the fonts service directory
          cb(null, (req as any).fontService?.getFontsDir() || './fonts');
        },
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
    return {
      message: 'Font uploaded successfully. Restart server to use it.',
      filename: file.filename,
      size: file.size,
    };
  }
}
