import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Exercise } from '../../domain/exercise.entity';

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

  async findByLessonId(lessonId: string): Promise<Exercise[]> {
    return this.repository
      .createQueryBuilder('exercise')
      .innerJoinAndSelect('exercise.exerciseSet', 'exerciseSet')
      .leftJoinAndSelect('exerciseSet.lesson', 'lesson')
      .leftJoinAndSelect('lesson.module', 'lessonModule')
      .leftJoinAndSelect('lessonModule.course', 'lessonCourse')
      .where('exerciseSet.lesson_id = :lessonId', { lessonId })
      .andWhere('exercise.deleted_at IS NULL')
      .andWhere('exerciseSet.deleted_at IS NULL')
      .andWhere('exerciseSet.is_custom = false')
      .orderBy('exercise.order_index', 'ASC')
      .getMany();
  }

  async findBySetId(setId: string): Promise<Exercise[]> {
    return this.repository.find({
      where: { setId },
      order: { orderIndex: 'ASC' },
      relations: [
        'exerciseSet',
        'exerciseSet.lesson',
        'exerciseSet.lesson.module',
        'exerciseSet.lesson.module.course',
        'exerciseSet.module',
        'exerciseSet.module.course',
        'exerciseSet.course',
      ],
    });
  }

  async findById(id: string): Promise<Exercise | null> {
    return this.repository.findOne({ where: { id } });
  }

  async findByIdWithCourseLevel(id: string): Promise<Exercise | null> {
    return this.repository.findOne({
      where: { id },
      relations: [
        'exerciseSet',
        'exerciseSet.lesson',
        'exerciseSet.lesson.module',
        'exerciseSet.lesson.module.course',
        'exerciseSet.module',
        'exerciseSet.module.course',
        'exerciseSet.course',
      ],
    });
  }

  async update(id: string, data: Partial<Exercise>): Promise<Exercise> {
    await this.repository.update(id, data);
    const exercise = await this.findById(id);
    if (!exercise) {
      throw new Error('Exercise not found after update');
    }
    return exercise;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }

  async softDeleteBySetId(setId: string): Promise<void> {
    await this.repository
      .createQueryBuilder()
      .softDelete()
      .where('setId = :setId', { setId })
      .execute();
  }
}
