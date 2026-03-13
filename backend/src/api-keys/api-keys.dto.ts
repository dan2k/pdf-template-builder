import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateApiKeyDto {
    @ApiProperty()
    @IsString()
    @IsNotEmpty()
    templateId: string;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    label?: string;
}

export class UpdateApiKeyDto {
    @ApiPropertyOptional()
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;

    @ApiPropertyOptional()
    @IsOptional()
    @IsString()
    label?: string;
}
