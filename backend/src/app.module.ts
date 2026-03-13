import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { DepartmentsModule } from './departments/departments.module';
import { TemplatesModule } from './templates/templates.module';
import { GenerateModule } from './generate/generate.module';
import { FontModule } from './fonts/font.module';
import { ConfigModule } from '@nestjs/config';
import { join } from 'path';
import { CategoriesModule } from './categories/categories.module';
import { AiModule } from './ai/ai.module';
import { ApiKeysModule } from './api-keys/api-keys.module';
import { ActivityLogsModule } from './activity-logs/activity-logs.module';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    TypeOrmModule.forRoot({
      type: 'better-sqlite3',
      database: join(__dirname, '..', 'data', 'pdf_templates.db'),
      autoLoadEntities: true,
      synchronize: true,
    }),
    FontModule,
    TemplatesModule,
    GenerateModule,
    CategoriesModule,
    AiModule,
    AuthModule,
    UsersModule,
    DepartmentsModule,
    ApiKeysModule,
    ActivityLogsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard
    }
  ],
})
export class AppModule { }
