import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from './category.entity';
import { CreateCategoryDto, UpdateCategoryDto } from './categories.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private repo: Repository<Category>,
  ) { }

  // Get categories tailored for a given user. Admin gets everything (unless filtered later)
  async findAllForUser(userId: string): Promise<Category[]> {
    return this.repo.find({
      where: { userId },
      order: { name: 'ASC' }
    });
  }

  // Used by admin
  async findAll(): Promise<Category[]> {
    return this.repo.find({ relations: ['user', 'parent'], order: { name: 'ASC' } });
  }

  async findOne(id: string, userId: string, isAdmin = false): Promise<Category> {
    const whereClause: any = { id };
    if (!isAdmin) {
      whereClause.userId = userId;
    }
    const cat = await this.repo.findOne({ where: whereClause });
    if (!cat) throw new NotFoundException(`Category ${id} not found or you have no access`);
    return cat;
  }

  async create(dto: CreateCategoryDto, userId: string): Promise<Category> {
    const parentId = dto.parentId || null;
    const existing = await this.repo.createQueryBuilder('category')
      .where('category.name = :name', { name: dto.name })
      .andWhere('category.userId = :userId', { userId })
      .andWhere(parentId ? 'category.parentId = :parentId' : 'category.parentId IS NULL', { parentId })
      .getOne();

    if (existing) return existing;

    const cat = this.repo.create({
      name: dto.name,
      color: dto.color || '#1a56db',
      userId,
      parentId: dto.parentId
    });
    return this.repo.save(cat);
  }

  async update(id: string, dto: UpdateCategoryDto, userId: string, isAdmin = false): Promise<Category> {
    const cat = await this.findOne(id, userId, isAdmin);

    // Prevent cyclic parent references (basic check: child cannot be its own parent)
    if (dto.parentId && dto.parentId === id) {
      throw new ConflictException('Category cannot be its own parent');
    }

    if (dto.name !== undefined) cat.name = dto.name;
    if (dto.color !== undefined) cat.color = dto.color;
    if (dto.parentId !== undefined) cat.parentId = dto.parentId;

    return this.repo.save(cat);
  }

  async remove(id: string, userId: string, isAdmin = false): Promise<void> {
    const cat = await this.findOne(id, userId, isAdmin);
    await this.repo.softRemove(cat);
  }

  // Basic ensureByName: legacy compatibility for local template generation
  async ensureByName(name: string, color?: string, userId?: string, parentId?: string): Promise<Category> {
    if (!userId) return null;
    const pid = parentId || null;

    const existing = await this.repo.createQueryBuilder('category')
      .where('category.name = :name', { name })
      .andWhere('category.userId = :userId', { userId })
      .andWhere(pid ? 'category.parentId = :parentId' : 'category.parentId IS NULL', { parentId: pid })
      .getOne();

    if (existing) return existing;
    return this.repo.save(this.repo.create({
      name,
      color: color || '#1a56db',
      userId,
      parentId: pid
    }));
  }
}
