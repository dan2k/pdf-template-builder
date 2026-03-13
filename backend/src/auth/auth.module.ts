import { Module, OnModuleInit } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { JwtStrategy } from './jwt.strategy';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { ActivityLogsModule } from '../activity-logs/activity-logs.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([User]),
        PassportModule,
        JwtModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                secret: configService.get<string>('JWT_SECRET') || 'super-secret-default-key-12345',
                signOptions: { expiresIn: '7d' },
            }),
            inject: [ConfigService],
        }),
        ActivityLogsModule
    ],
    providers: [AuthService, JwtStrategy],
    controllers: [AuthController],
    exports: [AuthService],
})
export class AuthModule implements OnModuleInit {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) { }

    async onModuleInit() {
        const adminExists = await this.usersRepository.findOne({ where: { username: 'admin' } });
        if (!adminExists) {
            console.log('Seeding default admin user...');
            const passwordHash = await bcrypt.hash('admin', 10);
            const admin = this.usersRepository.create({
                username: 'admin',
                passwordHash,
                role: UserRole.ADMIN,
                isActive: true,
                isFirstLogin: true,
            });
            await this.usersRepository.save(admin);
        }
    }
}
