import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private configService: ConfigService,
        @InjectRepository(User) private usersRepository: Repository<User>,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('JWT_SECRET') || 'super-secret-default-key-12345',
        });
    }

    async validate(payload: any) {
        const user = await this.usersRepository.findOne({
            where: { id: payload.sub },
            relations: ['department']
        });
        if (!user || (!user.isActive && payload.role !== 'admin')) {
            throw new UnauthorizedException('User is suspended or not found');
        }
        // Return object gets attached to req.user
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
            departmentId: user.department?.id || null
        };
    }
}
