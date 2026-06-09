import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Question } from '../../domain/question.entity';
import { bulkReorder, ReorderItem } from '../../../../common/utils/bulk-reorder';

@Injectable()
export class QuestionsRepository {
  constructor(
    @InjectRepository(Question)
    private readonly repository: Repository<Question>,
  ) {}

  async create(data: Partial<Question>): Promise<Question> {
    const question = this.repository.create(data);
    return this.repository.save(question);
  }

  async reorder(items: ReorderItem[]): Promise<void> {
    await bulkReorder(this.repository, items);
  }

  async findByLessonId(lessonId: string): Promise<Question[]> {
    return this.repository
      .createQueryBuilder('question')
      .innerJoinAndSelect('question.exercise', 'exercise')
      .leftJoinAndSelect('exercise.lesson', 'lesson')
      .leftJoinAndSelect('lesson.module', 'lessonModule')
      .leftJoinAndSelect('lessonModule.course', 'lessonCourse')
      .where('exercise.lesson_id = :lessonId', { lessonId })
      .andWhere('question.deleted_at IS NULL')
      .andWhere('exercise.deleted_at IS NULL')
      .andWhere('exercise.is_custom = false')
      .orderBy('question.order_index', 'ASC')
      .getMany();
  }

  async findByExerciseId(exerciseId: string): Promise<Question[]> {
    return this.repository.find({
      where: { exerciseId },
      order: { orderIndex: 'ASC' },
      relations: [
        'exercise',
        'exercise.lesson',
        'exercise.lesson.module',
        'exercise.lesson.module.course',
        'exercise.module',
        'exercise.module.course',
        'exercise.course',
      ],
    });
  }

  async findById(id: string): Promise<Question | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithCourseLevel(id: string): Promise<Question | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'exercise',
        'exercise.lesson',
        'exercise.lesson.module',
        'exercise.lesson.module.course',
        'exercise.module',
        'exercise.module.course',
        'exercise.course',
      ],
    });
  }

  async update(id: string, data: Partial<Question>): Promise<Question> {
    await this.repository.update(id, data);
    const question = await this.findById(id);
    if (!question) {
      throw new Error('Question not found after update');
    }
    return question;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async softDeleteByExerciseId(exerciseId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('exerciseId = :exerciseId', { exerciseId })
      .execute();
  }
}
