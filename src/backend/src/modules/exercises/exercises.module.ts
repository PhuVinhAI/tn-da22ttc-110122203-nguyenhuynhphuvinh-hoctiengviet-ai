import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Question } from './domain/question.entity';
import { Exercise } from './domain/exercise.entity';
import { QuestionAttempt } from './domain/question-attempt.entity';
import { UserQuestionResult } from './domain/user-question-result.entity';
import { QuestionsService } from './application/questions.service';
import { ExerciseService } from './application/exercise.service';
import { ExerciseGenerationService } from './application/exercise-generation.service';
import { ExerciseContextLoader } from './application/exercise-context-loader';

import { AnswerAssessment } from './application/answer-assessment.service';
import { AnswerNormalizer } from './application/answer-normalizer';
import { QuestionsRepository } from './application/repositories/questions.repository';
import { ExercisesRepository } from './application/repositories/exercises.repository';
import { UserQuestionResultsRepository } from './application/repositories/user-question-results.repository';
import { QuestionsController } from './presentation/questions.controller';
import { ExerciseController } from './presentation/exercise.controller';
import { ProgressModule } from '../progress/progress.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      Exercise,
      QuestionAttempt,
      UserQuestionResult,
    ]),
    forwardRef(() => ProgressModule),
    forwardRef(() => CoursesModule),
  ],
  controllers: [QuestionsController, ExerciseController],
  providers: [
    QuestionsService,
    ExerciseService,
    ExerciseGenerationService,
    ExerciseContextLoader,
    AnswerAssessment,
    AnswerNormalizer,
    QuestionsRepository,
    ExercisesRepository,
    UserQuestionResultsRepository,
  ],
  exports: [
    QuestionsService,
    ExerciseService,
    ExerciseGenerationService,
    ExerciseContextLoader,
    QuestionsRepository,
    ExercisesRepository,
    UserQuestionResultsRepository,
  ],
})
export class ExercisesModule {}
