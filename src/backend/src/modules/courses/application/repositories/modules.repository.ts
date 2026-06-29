import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Module } from '../../domain/module.entity';
import {
  bulkReorder,
  ReorderItem,
} from '../../../../common/utils/bulk-reorder';

@Injectable()
export class ModulesRepository {
  constructor(
    @InjectRepository(Module)
    private readonly repository: Repository<Module>,
  ) {}

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async create(data: Partial<Module>): Promise<Module> {
    const module = this.repository.create(data);
    return this.repository.save(module);
  }

  async findByCourseId(courseId: string): Promise<Module[]> {
    return this.repository.find({
      where: { courseId },
      order: {
        orderIndex: 'ASC',
        lessons: { orderIndex: 'ASC' },
      },
      relations: ['lessons'],
    });
  }

  async findById(id: string): Promise<Module | null> {
    return this.repository.findOne({
      where: { id },
      order: { lessons: { orderIndex: 'ASC' } },
      relations: ['lessons', 'course'],
    });
  }

  async update(id: string, data: Partial<Module>): Promise<Module> {
    await this.repository.update(id, data);
    const module = await this.findById(id);
    if (!module) {
      throw new Error('Module not found after update');
    }
    return module;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
