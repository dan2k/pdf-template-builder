import { IsString, IsOptional, IsArray, IsBoolean, ValidateIf, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TemplateVisibility } from './template.entity';

export class CreateTemplateDto {
  @ApiProperty()
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pages?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  variables?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  globalHeaderFooter?: any;

  @ApiPropertyOptional()
  @IsOptional()
  @ValidateIf((o) => o.category !== null)
  @IsString()
  category?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  tags?: string[];

  @ApiPropertyOptional({ enum: TemplateVisibility, default: TemplateVisibility.PRIVATE })
  @IsOptional()
  @IsEnum(TemplateVisibility)
  visibility?: TemplateVisibility;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  allowCopy?: boolean;
}

export class UpdateTemplateDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  pages?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  variables?: any[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  globalHeaderFooter?: any;

  @ApiPropertyOptional()
  @IsOptional()
  category?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  tags?: string[];

  @ApiPropertyOptional({ enum: TemplateVisibility })
  @IsOptional()
  @IsEnum(TemplateVisibility)
  visibility?: TemplateVisibility;

  @ApiPropertyOptional()
  @IsOptional()
  allowCopy?: boolean;
}

export class DuplicateTemplateDto {
  @ApiPropertyOptional({ description: 'Target User ID (Admin overrides only)' })
  @IsOptional()
  @IsString()
  targetUserId?: string;

  @ApiPropertyOptional({ description: 'Target Category (Admin overrides only)' })
  @IsOptional()
  @IsString()
  targetCategory?: string;
}
