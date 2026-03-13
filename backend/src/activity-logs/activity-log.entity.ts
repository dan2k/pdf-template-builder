import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('activity_logs')
export class ActivityLog {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ nullable: true })
    userId: string;

    @Column()
    action: string;

    @Column({ type: 'text', nullable: true })
    details: string; // Stored as JSON string

    @CreateDateColumn()
    createdAt: Date;
}
