import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Course } from '../../domain/course.entity';

@Injectable()
export class CoursesRepository {
  constructor(
    @InjectRepository(Course)
    private readonly repository: Repository<Course>,
  ) {}

  async create(data: Partial<Course>): Promise<Course> {
    const course = this.repository.create(data);
    return this.repository.save(course);
  }

  async findAll(): Promise<Course[]> {
    return this.repository.find({
      where: { isPublished: true },
      order: { orderIndex: 'ASC' },
      relations: ['modules'],
    });
  }

  async findAllForAdmin(): Promise<Course[]> {
    return this.repository.find({
      order: { orderIndex: 'ASC' },
      relations: ['modules', 'modules.lessons'],
    });
  }

  async findById(id: string): Promise<Course | null> {
    return this.repository.findOne({
      where: { id },
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
