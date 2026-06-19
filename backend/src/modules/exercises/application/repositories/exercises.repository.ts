import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../../domain/exercise.entity';
import {
  bulkReorder,
  ReorderItem,
} from '../../../../common/utils/bulk-reorder';

@Injectable()
export class ExercisesRepository {
  constructor(
    @InjectRepository(Exercise)
    private readonly repository: Repository<Exercise>,
  ) {}

  async create(data: Partial<Exercise>): Promise<Exercise> {
    const exercise = this.repository.create(data);
    return this.repository.save(exercise);
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    return this.repository.find({
      where: { lessonId },
      order: { orderIndex: 'ASC' },
    });
  }

  async findAllByLessonIdForAdmin(lessonId: string): Promise<Exercise[]> {
    return this.repository.find({
      where: { lessonId },
      order: {
        orderIndex: 'ASC',
        createdAt: 'DESC',
        questions: { orderIndex: 'ASC' },
      },
      relations: ['questions'],
    });
  }

  async findActiveByLessonId(
    lessonId: string,
    userId?: string,
  ): Promise<Exercise[]> {
    return this.repository
      .createQueryBuilder('exercise')
      .where('exercise.lesson_id = :lessonId', { lessonId })
      .andWhere('exercise.deleted_at IS NULL')
      .andWhere("exercise.generation_status IS DISTINCT FROM 'generating'")
      .andWhere(
        userId
          ? '(exercise.is_custom = false OR exercise.owner_user_id = :userId)'
          : 'exercise.is_custom = false',
        { userId },
      )
      .orderBy('exercise.order_index', 'ASC')
      .addOrderBy('exercise.created_at', 'DESC')
      .getMany();
  }

  async findById(id: string): Promise<Exercise | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithQuestions(id: string): Promise<Exercise | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'lesson',
        'lesson.module',
        'lesson.module.course',
        'lesson.vocabularies',
        'questions',
      ],
      order: { questions: { orderIndex: 'ASC' } },
    });
  }

  async update(id: string, data: Partial<Exercise>): Promise<Exercise | null> {
    await this.repository.update(id, data);
    return this.findById(id);
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async findActiveCustomExercisesByModule(
    moduleId: string,
    userId: string,
  ): Promise<Exercise[]> {
    return this.repository.find({
      where: { moduleId, isCustom: true, ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findActiveCustomExercisesByCourse(
    courseId: string,
    userId: string,
  ): Promise<Exercise[]> {
    return this.repository.find({
      where: { courseId, isCustom: true, ownerUserId: userId },
      order: { createdAt: 'DESC' },
    });
  }
}
