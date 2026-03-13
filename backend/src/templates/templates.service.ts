import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Brackets } from 'typeorm';
import { Template, TemplateVisibility } from './template.entity';
import { CreateTemplateDto, UpdateTemplateDto } from './templates.dto';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private repo: Repository<Template>,
  ) { }

  // List templates for dashboard. 
  // User sees: Their own templates + Any Public templates
  // Admin sees: All templates
  async findAllVisibleToUser(userId: string, role: string): Promise<Template[]> {
    const query = this.repo.createQueryBuilder('template')
      .leftJoinAndSelect('template.user', 'user')
      .leftJoinAndSelect('user.department', 'department')
      .orderBy('template.updatedAt', 'DESC');

    if (role !== 'admin') {
      if (!userId) {
        query.where('template.visibility = :publicVis', { publicVis: TemplateVisibility.PUBLIC });
      } else {
        query.where('template.userId = :userId', { userId })
          .orWhere('template.visibility = :publicVis', { publicVis: TemplateVisibility.PUBLIC });
      }
    }

    const templates = await query.getMany();
    return templates.map(t => this.parse(t));
  }

  async findOne(id: string, userId?: string, role?: string): Promise<Template> {
    const query = this.repo.createQueryBuilder('template')
      .leftJoinAndSelect('template.user', 'user')
      .leftJoinAndSelect('user.department', 'department')
      .where('template.id = :id', { id });

    const t = await query.getOne();
    if (!t) throw new NotFoundException(`Template ${id} not found`);

    // Access control logic
    if (role && role !== 'admin') {
      if (t.userId !== userId && t.visibility !== TemplateVisibility.PUBLIC) {
        throw new ForbiddenException(`You do not have access to this template`);
      }
    }

    return this.parse(t);
  }

  async create(dto: CreateTemplateDto, userId: string): Promise<Template> {
    const t = this.repo.create({
      name: dto.name,
      description: dto.description,
      pages: JSON.stringify(dto.pages || []),
      variables: JSON.stringify(dto.variables || []),
      globalHeaderFooter: dto.globalHeaderFooter ? JSON.stringify(dto.globalHeaderFooter) : null,
      category: dto.category || null,
      tags: JSON.stringify(dto.tags || []),
      userId,
      visibility: dto.visibility || TemplateVisibility.PRIVATE,
      allowCopy: dto.allowCopy || false,
    });
    const saved = await this.repo.save(t);
    return this.findOne(saved.id);
  }


  async update(id: string, dto: UpdateTemplateDto, userId: string, role: string): Promise<Template> {
    const t = await this.findOne(id); // Basic check exists

    // Only owner or admin can update
    if (role !== 'admin' && t.userId !== userId) {
      throw new ForbiddenException('You can only edit your own templates');
    }

    if (dto.name !== undefined) t.name = dto.name;
    if (dto.description !== undefined) t.description = dto.description;
    if (dto.pages !== undefined) t.pages = JSON.stringify(dto.pages);
    if (dto.variables !== undefined) t.variables = JSON.stringify(dto.variables);
    if (dto.globalHeaderFooter !== undefined) (t as any).globalHeaderFooter = dto.globalHeaderFooter ? JSON.stringify(dto.globalHeaderFooter) : null;
    if (dto.isActive !== undefined) t.isActive = (dto.isActive ? 1 : 0) as any;
    if (dto.category !== undefined) t.category = dto.category ?? null;
    if (dto.tags !== undefined) (t as any).tags = JSON.stringify(dto.tags);
    if (dto.visibility !== undefined) t.visibility = dto.visibility;
    if (dto.allowCopy !== undefined) t.allowCopy = (dto.allowCopy ? 1 : 0) as any;

    // Before saving, ensure array/object fields parsed by findOne are re-stringified for SQLite
    if (typeof t.pages !== 'string') t.pages = JSON.stringify(t.pages);
    if (typeof t.variables !== 'string') t.variables = JSON.stringify(t.variables);
    if (typeof (t as any).tags !== 'string') (t as any).tags = JSON.stringify((t as any).tags);
    if (typeof (t as any).globalHeaderFooter !== 'string' && (t as any).globalHeaderFooter !== null) {
      (t as any).globalHeaderFooter = JSON.stringify((t as any).globalHeaderFooter);
    }

    const saved = await this.repo.save(t);
    return this.parse(saved);
  }

  async remove(id: string, userId: string, role: string): Promise<void> {
    const t = await this.findOne(id);

    if (role !== 'admin' && t.userId !== userId) {
      throw new ForbiddenException('You can only delete your own templates');
    }

    await this.repo.softRemove(t);
  }

  // Used by "Copy" logic
  async duplicate(id: string, userId: string, role: string, targetUserId?: string, targetCategory?: string): Promise<Template> {
    const original = await this.findOne(id, userId, role); // Throws if not public and not owner

    if (role !== 'admin' && original.userId !== userId && !original.allowCopy) {
      throw new ForbiddenException('The owner has not allowed this template to be copied.');
    }

    const copy = this.repo.create({
      name: `${original.name} (Copy)`,
      description: original.description,
      pages: JSON.stringify((original as any).pages),
      variables: JSON.stringify((original as any).variables),
      category: targetCategory !== undefined ? targetCategory : ((original as any).category || null),
      tags: JSON.stringify((original as any).tags || []),
      userId: targetUserId || userId, // New owner (Admin can override)
      visibility: TemplateVisibility.PRIVATE, // Reset visibility
      allowCopy: false, // Reset copy permission
    });
    const saved = await this.repo.save(copy);
    // Re-fetch with full user+department relations so frontend sidebar works correctly
    return this.findOne(saved.id);
  }

  private parse(t: Template): Template {
    try {
      (t as any).pages = typeof t.pages === 'string' ? JSON.parse(t.pages) : t.pages;
    } catch { (t as any).pages = []; }
    try {
      (t as any).variables = typeof t.variables === 'string' ? JSON.parse(t.variables) : t.variables;
    } catch { (t as any).variables = []; }
    try {
      (t as any).tags = typeof (t as any).tags === 'string' ? JSON.parse((t as any).tags) : ((t as any).tags || []);
    } catch { (t as any).tags = []; }
    try {
      (t as any).globalHeaderFooter = (t as any).globalHeaderFooter
        ? (typeof (t as any).globalHeaderFooter === 'string' ? JSON.parse((t as any).globalHeaderFooter) : (t as any).globalHeaderFooter)
        : null;
    } catch { (t as any).globalHeaderFooter = null; }

    // SQLite booleans are stored as 1/0, convert them back to true/false for frontend
    if (t.hasOwnProperty('allowCopy')) {
      (t as any).allowCopy = !!t.allowCopy;
    }
    if (t.hasOwnProperty('isActive')) {
      (t as any).isActive = !!t.isActive;
    }

    return t;
  }
}
