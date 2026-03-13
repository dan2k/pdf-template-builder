import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, Index, ManyToOne, JoinColumn } from 'typeorm';
import { Template } from '../templates/template.entity';

@Entity('api_keys')
export class ApiKey {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Index()
    @Column({ default: '' })
    keyHash: string;

    @Column({ default: '' })
    prefix: string;

    @Column({ nullable: true })
    label: string;

    @Index()
    @Column({ default: true })
    isActive: boolean;

    @ManyToOne(() => Template, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'templateId' })
    template: Template;

    @Column()
    templateId: string;

    @Column({ nullable: true })
    revokedAt: Date;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
