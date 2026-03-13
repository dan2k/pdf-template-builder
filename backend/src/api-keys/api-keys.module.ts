import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ApiKey } from './api-key.entity';
import { Template } from '../templates/template.entity';
import { ApiKeysService } from './api-keys.service';
import { ApiKeysController } from './api-keys.controller';

@Module({
    imports: [TypeOrmModule.forFeature([ApiKey, Template])],
    providers: [ApiKeysService],
    controllers: [ApiKeysController],
    exports: [ApiKeysService],
})
export class ApiKeysModule { }
