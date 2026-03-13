import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { ActivityLogsService } from '../activity-logs/activity-logs.service';

@Injectable()
export class AuthService {
    constructor(
        @InjectRepository(User) private usersRepository: Repository<User>,
        private jwtService: JwtService,
        private activityLogsService: ActivityLogsService,
    ) { }

    async validateUser(username: string, pass: string): Promise<any> {
        const user = await this.usersRepository.findOne({
            where: { username },
            relations: ['department']
        });

        if (user && await bcrypt.compare(pass, user.passwordHash)) {
            if (!user.isActive && user.role !== 'admin') {
                await this.activityLogsService.logAction(user.id, 'LOGIN_FAILED_SUSPENDED');
                throw new UnauthorizedException('User account is suspended');
            }
            const { passwordHash, ...result } = user;
            return result;
        }

        if (user) {
            await this.activityLogsService.logAction(user.id, 'LOGIN_FAILED_CREDENTIALS');
        } else {
            await this.activityLogsService.logAction(null, 'LOGIN_FAILED_UNKNOWN_USER', { username });
        }

        return null;
    }

    async login(user: any) {
        await this.activityLogsService.logAction(user.id, 'LOGIN_SUCCESS');

        const payload = {
            username: user.username,
            sub: user.id,
            role: user.role,
            isFirstLogin: user.isFirstLogin,
            departmentId: user.department?.id || null,
        };

        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                isFirstLogin: user.isFirstLogin,
                departmentId: user.department?.id || null,
                department: user.department ? { id: user.department.id, name: user.department.name } : null,
            },
        };
    }

    async changePassword(userId: string, oldPass: string, newPass: string) {
        const user = await this.usersRepository.findOne({
            where: { id: userId },
            relations: ['department']
        });
        if (!user) throw new BadRequestException('User not found');

        const isMatch = await bcrypt.compare(oldPass, user.passwordHash);
        if (!isMatch) {
            await this.activityLogsService.logAction(userId, 'PASSWORD_CHANGE_FAILED');
            throw new UnauthorizedException('Invalid old password');
        }

        user.passwordHash = await bcrypt.hash(newPass, 10);
        user.isFirstLogin = false;
        await this.usersRepository.save(user);

        await this.activityLogsService.logAction(userId, 'PASSWORD_CHANGED');

        // Return new token
        return this.login(user);
    }
}
