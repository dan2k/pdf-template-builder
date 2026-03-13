import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private departmentsRepository: Repository<Department>,
    ) { }

    findAll() {
        return this.departmentsRepository.find();
    }

    async findOne(id: string) {
        const department = await this.departmentsRepository.findOne({ where: { id } });
        if (!department) throw new NotFoundException('Department not found');
        return department;
    }

    async create(data: any) {
        const existing = await this.departmentsRepository.findOne({ where: { name: data.name } });
        if (existing) throw new BadRequestException('Department name already exists');

        const department = this.departmentsRepository.create(data);
        return this.departmentsRepository.save(department);
    }

    async update(id: string, data: any) {
        const department = await this.findOne(id);
        if (data.name && data.name !== department.name) {
            const existing = await this.departmentsRepository.findOne({ where: { name: data.name } });
            if (existing) throw new BadRequestException('Department name already exists');
            department.name = data.name;
        }
        if (data.description !== undefined) department.description = data.description;

        return this.departmentsRepository.save(department);
    }

    async remove(id: string) {
        const department = await this.findOne(id);
        // Soft delete the department
        await this.departmentsRepository.softRemove(department);
    }
}
