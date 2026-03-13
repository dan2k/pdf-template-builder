import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsersService {
    constructor(
        @InjectRepository(User)
        private usersRepository: Repository<User>,
    ) { }

    findAll() {
        return this.usersRepository.find({ relations: ['department'] });
    }

    async findAllWithTemplateCounts(): Promise<any[]> {
        const users = await this.usersRepository
            .createQueryBuilder('u')
            .leftJoinAndSelect('u.department', 'dept')
            .getMany();

        // Count templates per user via raw query
        const counts = await this.usersRepository.query(
            'SELECT userId, COUNT(*) as cnt FROM templates WHERE deletedAt IS NULL GROUP BY userId'
        );
        const countMap: Record<string, number> = {};
        counts.forEach((row: any) => { countMap[row.userId] = parseInt(row.cnt, 10); });

        return users.map(u => ({ ...u, _templateCount: countMap[u.id] || 0 }));
    }


    async findOne(id: string) {
        const user = await this.usersRepository.findOne({ where: { id }, relations: ['department'] });
        if (!user) throw new NotFoundException('User not found');
        return user;
    }

    async create(data: any) {
        const existing = await this.usersRepository.findOne({ where: { username: data.username } });
        if (existing) throw new BadRequestException('Username already exists');

        const passwordHash = await bcrypt.hash(data.password || 'password123', 10);
        const user = this.usersRepository.create({
            username: data.username,
            passwordHash,
            role: data.role || UserRole.USER,
            isActive: data.isActive !== false,
            isFirstLogin: true,
            department: data.departmentId ? { id: data.departmentId } : null,
        });
        return this.usersRepository.save(user);
    }

    async update(id: string, data: any) {
        const user = await this.findOne(id);
        if (data.username && data.username !== user.username) {
            const existing = await this.usersRepository.findOne({ where: { username: data.username } });
            if (existing) throw new BadRequestException('Username already exists');
            user.username = data.username;
        }
        if (data.password) {
            user.passwordHash = await bcrypt.hash(data.password, 10);
            user.isFirstLogin = true;
        }
        if (data.role) user.role = data.role;
        if (data.isActive !== undefined) user.isActive = data.isActive;
        if (data.departmentId !== undefined) {
            user.department = data.departmentId ? { id: data.departmentId } as any : null;
        }

        return this.usersRepository.save(user);
    }

    async resetPassword(id: string) {
        const user = await this.findOne(id);
        const tempPassword = Math.random().toString(36).slice(-8);
        user.passwordHash = await bcrypt.hash(tempPassword, 10);
        user.isFirstLogin = true;
        await this.usersRepository.save(user);
        return { tempPassword };
    }

    async remove(id: string) {
        const user = await this.findOne(id);
        // Don't delete the only admin
        if (user.role === UserRole.ADMIN) {
            const admins = await this.usersRepository.count({ where: { role: UserRole.ADMIN } });
            if (admins <= 1) throw new BadRequestException('Cannot delete the last admin user');
        }
        await this.usersRepository.softRemove(user);
    }
}
