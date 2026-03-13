import {
  Controller, Post, Param, Body, Res, Get,
  UseInterceptors, UploadedFile, UseGuards, Request, UnauthorizedException
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation, ApiConsumes, ApiBody } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage, memoryStorage } from 'multer';
import { extname } from 'path';
import { GenerateService } from './generate.service';
import { PdfImportService } from './pdf-import.service';
import { ApiKeyGuard } from '../api-keys/api-key.guard';
import { mkdirSync } from 'fs';

mkdirSync('uploads', { recursive: true });

@ApiTags('Generate')
@Controller()
export class GenerateController {
  constructor(
    private readonly generateService: GenerateService,
    private readonly pdfImportService: PdfImportService,
  ) { }

  @Post('templates/:id/generate')
  @UseGuards(ApiKeyGuard)
  @ApiOperation({ summary: 'Generate PDF from template with data using API Key' })
  async generate(
    @Request() req,
    @Param('id') id: string,
    @Body() data: Record<string, any>,
    @Res() res: Response,
  ) {
    if (req.apiKey && req.apiKey.templateId !== id) {
      throw new UnauthorizedException('API Key does not match the requested template');
    }
    const buffer = await this.generateService.generatePdf(id, data);

    if (data.responseType === 'base64') {
      return res.json({
        base64: buffer.toString('base64'),
        filename: `generated-${Date.now()}.pdf`,
        contentType: 'application/pdf',
      });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="generated-${Date.now()}.pdf"`,
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }

  @Post('templates/:id/preview')
  @ApiOperation({ summary: 'Preview PDF (inline)' })
  async preview(
    @Param('id') id: string,
    @Body() data: Record<string, any>,
    @Res() res: Response,
  ) {
    const buffer = await this.generateService.generatePdf(id, data);

    if (data.responseType === 'base64') {
      return res.json({
        base64: buffer.toString('base64'),
        contentType: 'application/pdf',
      });
    }

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
      'Content-Length': buffer.length,
    });
    res.end(buffer);
  }


  @Post('upload/image')
  @ApiOperation({ summary: 'Upload image for template use' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
          cb(null, `${unique}${extname(file.originalname)}`);
        },
      }),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype.match(/^image\/(jpeg|png|gif|webp|svg)/)) cb(null, true);
        else cb(new Error('Only image files allowed'), false);
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File) {
    return {
      url: `/uploads/${file.filename}`,
      originalName: file.originalname,
      size: file.size,
      mimetype: file.mimetype,
    };
  }

  // ─── PDF Import ──────────────────────────────────────────────────────────────
  @Post('import/pdf')
  @ApiOperation({ summary: 'Import PDF and convert to template structure' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 50 * 1024 * 1024 },
      fileFilter: (req, file, cb) => {
        if (file.mimetype === 'application/pdf' || file.originalname.endsWith('.pdf'))
          cb(null, true);
        else
          cb(new Error('Only PDF files are supported'), false);
      },
    }),
  )
  async importPdf(@UploadedFile() file: Express.Multer.File) {
    const result = await this.pdfImportService.importPdf(file.buffer, file.originalname);
    return result;
  }
}
