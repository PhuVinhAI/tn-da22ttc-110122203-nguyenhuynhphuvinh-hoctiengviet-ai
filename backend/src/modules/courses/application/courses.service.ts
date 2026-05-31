import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './repositories/courses.repository';
import { Course } from '../domain/course.entity';
import { CacheService } from '../../../infrastructure/cache/cache.service';

@Injectable()
export class CoursesService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly cacheService: CacheService,
  ) {}

  async create(data: Partial<Course>): Promise<Course> {
    const course = await this.coursesRepository.create(data);
    // Invalidate cache when creating new course
    await this.cacheService.invalidatePattern('courses:*');
    return course;
  }

  async findAll(): Promise<Course[]> {
    // Use cache with 1 hour TTL
    return this.cacheService.getOrSet(
      'courses:all',
      () => this.coursesRepository.findAll(),
      3600,
    );
  }

  async findAllForAdmin(): Promise<Course[]> {
    return this.coursesRepository.findAllForAdmin();
  }

  async findById(id: string): Promise<Course> {
    // Use cache with 1 hour TTL
    const course = await this.cacheService.getOrSet(
      `courses:${id}`,
      async () => {
        const found = await this.coursesRepository.findById(id);
        if (!found) {
          throw new NotFoundException(`Course with ID ${id} not found`);
        }
        return found;
      },
      3600,
    );
    return course;
  }

  async update(id: string, data: Partial<Course>): Promise<Course> {
    await this.findById(id);
    const updated = await this.coursesRepository.update(id, data);
    // Invalidate cache for this course and list
    await this.cacheService.del(`courses:${id}`);
    await this.cacheService.invalidatePattern('courses:all');
    return updated;
  }

  async delete(id: string): Promise<void> {
    await this.findById(id);
    await this.coursesRepository.delete(id);
    // Invalidate cache
    await this.cacheService.del(`courses:${id}`);
    await this.cacheService.invalidatePattern('courses:all');
  }
}
