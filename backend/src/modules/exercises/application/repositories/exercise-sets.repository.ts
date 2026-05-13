import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ExerciseSet } from '../../domain/exercise-set.entity';
import { ExerciseTier } from '../../../../common/enums';

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

  async findActiveByLessonId(lessonId: string): Promise<ExerciseSet[]> {
    return this.repository.find({
      where: { lessonId, deletedAt: undefined as any },
      order: { orderIndex: 'ASC' },
    });
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

  async findActiveByLessonAndTier(
    lessonId: string,
    tier: ExerciseTier,
  ): Promise<ExerciseSet | null> {
    return this.repository.findOne({
      where: { lessonId, tier, deletedAt: undefined as any },
    });
  }

  async softDelete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
