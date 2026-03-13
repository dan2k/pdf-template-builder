import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, DeleteDateColumn } from 'typeorm';
import { Department } from '../departments/department.entity';

export enum UserRole {
    ADMIN = 'admin',
    USER = 'user',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    username: string;

    @Column()
    passwordHash: string;

    @Column({ type: 'varchar', default: UserRole.USER })
    role: UserRole;

    @Column({ default: true })
    isActive: boolean;

    @Column({ default: true })
    isFirstLogin: boolean;

    @ManyToOne(() => Department, { nullable: true, onDelete: 'SET NULL' })
    department: Department;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @DeleteDateColumn()
    deletedAt: Date;
}
