import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Exercise } from './domain/exercise.entity';
import { ExerciseSet } from './domain/exercise-set.entity';
import { UserExerciseResult } from './domain/user-exercise-result.entity';
import { ExercisesService } from './application/exercises.service';
import { ExerciseSetService } from './application/exercise-set.service';
import { ExerciseGenerationService } from './application/exercise-generation.service';
import { ExerciseContextLoader } from './application/exercise-context-loader';

import { AnswerAssessment } from './application/answer-assessment.service';
import { AnswerNormalizer } from './application/answer-normalizer';
import { ExercisesRepository } from './application/repositories/exercises.repository';
import { ExerciseSetsRepository } from './application/repositories/exercise-sets.repository';
import { UserExerciseResultsRepository } from './application/repositories/user-exercise-results.repository';
import { ExercisesController } from './presentation/exercises.controller';
import { ExerciseSetController } from './presentation/exercise-set.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Exercise, ExerciseSet, UserExerciseResult]),
  ],
  controllers: [ExercisesController, ExerciseSetController],
  providers: [
    ExercisesService,
    ExerciseSetService,
    ExerciseGenerationService,
    ExerciseContextLoader,
    AnswerAssessment,
    AnswerNormalizer,
    ExercisesRepository,
    ExerciseSetsRepository,
    UserExerciseResultsRepository,
  ],
  exports: [
    ExercisesService,
    ExerciseSetService,
    ExerciseGenerationService,
    ExerciseContextLoader,
    ExercisesRepository,
    UserExerciseResultsRepository,
  ],
})
export class ExercisesModule {}
