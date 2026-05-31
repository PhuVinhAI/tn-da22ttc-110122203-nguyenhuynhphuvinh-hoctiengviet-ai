import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseSet } from '../../domain/exercise-set.entity';

@Injectable()
export class ExerciseSetsRepository {
  constructor(
    @InjectRepository(ExerciseSet)
    private readonly repository: Repository<ExerciseSet>,
  ) {}

  async create(data: Partial<ExerciseSet>): Promise<ExerciseSet> {
    const set = this.repository.create(data);
    return this.repository.save(set);
  }

  async findByLessonId(lessonId: string): Promise<ExerciseSet[]> {
    return this.repository.find({
      where: { lessonId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findActiveByLessonId(
    lessonId: string,
    userId?: string,
  ): Promise<ExerciseSet[]> {
    return this.repository
      .createQueryBuilder('set')
      .where('set.lesson_id = :lessonId', { lessonId })
      .andWhere('set.deleted_at IS NULL')
      .andWhere("set.generation_status IS DISTINCT FROM 'generating'")
      .andWhere(
        userId
          ? '(set.is_custom = false OR set.owner_user_id = :userId)'
          : 'set.is_custom = false',
        { userId },
      )
      .orderBy('set.order_index', 'ASC')
      .addOrderBy('set.created_at', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<ExerciseSet | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithExercises(id: string): Promise<ExerciseSet | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['exercises'],
    });
  }

  async update(
    id: string,
    data: Partial<ExerciseSet>,
  ): Promise<ExerciseSet | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findActiveCustomSetsByModule(
    moduleId: string,
    userId: string,
  ): Promise<ExerciseSet[]> {
    return this.repository.find({
      where: { moduleId, isCustom: true, ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveCustomSetsByCourse(
    courseId: string,
    userId: string,
  ): Promise<ExerciseSet[]> {
    return this.repository.find({
      where: { courseId, isCustom: true, ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }
}
