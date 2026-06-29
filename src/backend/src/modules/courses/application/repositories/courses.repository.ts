import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../domain/course.entity';
import {
  bulkReorder,
  ReorderItem,
} from '../../../../common/utils/bulk-reorder';

@Injectable()
export class CoursesRepository {
  constructor(
    @InjectRepository(Course)
    private readonly repository: Repository<Course>,
  ) {}

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async create(data: Partial<Course>): Promise<Course> {
    const course = this.repository.create(data);
    return this.repository.save(course);
  }

  async findAll(): Promise<Course[]> {
    return this.repository.find({
      where: { isPublished: true },
      order: {
        orderIndex: 'ASC',
        modules: { orderIndex: 'ASC' },
      },
      relations: ['modules'],
    });
  }

  async findAllForAdmin(): Promise<Course[]> {
    return this.repository.find({
      order: {
        orderIndex: 'ASC',
        modules: {
          orderIndex: 'ASC',
          lessons: { orderIndex: 'ASC' },
        },
      },
      relations: ['modules', 'modules.lessons'],
    });
  }

  async findById(id: string): Promise<Course | null> {
    return this.repository.findOne({
      where: { id },
      order: {
        modules: {
          orderIndex: 'ASC',
          lessons: { orderIndex: 'ASC' },
        },
      },
      relations: ['modules', 'modules.lessons'],
    });
  }

  async update(id: string, data: Partial<Course>): Promise<Course> {
    await this.repository.update(id, data);
    const course = await this.findById(id);
    if (!course) {
      throw new Error('Course not found after update');
    }
    return course;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
