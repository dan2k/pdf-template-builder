import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ActivityLog } from './activity-log.entity';

@Injectable()
export class ActivityLogsService {
    constructor(
        @InjectRepository(ActivityLog)
        private activityLogsRepository: Repository<ActivityLog>,
    ) { }

    async logAction(userId: string | null, action: string, details: any = null) {
        const log = this.activityLogsRepository.create({
            userId,
            action,
            details: details ? JSON.stringify(details) : null,
        });
        await this.activityLogsRepository.save(log);
    }
}
