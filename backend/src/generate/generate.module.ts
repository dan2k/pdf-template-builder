import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { GenerateController } from './generate.controller';
import { GenerateService } from './generate.service';
import { PdfImportService } from './pdf-import.service';
import { Template } from '../templates/template.entity';
import { ApiKeysModule } from '../api-keys/api-keys.module';
import { TemplatesModule } from '../templates/templates.module';
import { FontModule } from '../fonts/font.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Template]),
    ApiKeysModule,
    TemplatesModule,
    FontModule
  ],
  controllers: [GenerateController],
  providers: [GenerateService, PdfImportService],
})
export class GenerateModule { }
