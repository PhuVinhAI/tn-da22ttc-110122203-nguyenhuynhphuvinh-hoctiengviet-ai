import { Injectable, NotFoundException } from '@nestjs/common';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { TierProgressService } from './tier-progress.service';

@Injectable()
export class ExerciseSetService {
  constructor(
    private readonly exerciseSetsRepository: ExerciseSetsRepository,
    private readonly tierProgressService: TierProgressService,
  ) {}

  async findByLessonId(lessonId: string, userId: string) {
    return this.tierProgressService.getLessonTierSummary(lessonId, userId);
  }

  async findById(id: string) {
    const set = await this.exerciseSetsRepository.findByIdWithExercises(id);
    if (!set) {
      throw new NotFoundException(`ExerciseSet with ID ${id} not found`);
    }
    return set;
  }

  async create(
    data: Partial<import('../domain/exercise-set.entity').ExerciseSet>,
  ) {
    return this.exerciseSetsRepository.create(data);
  }
}
