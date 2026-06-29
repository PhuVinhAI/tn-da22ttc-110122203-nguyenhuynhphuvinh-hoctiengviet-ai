import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LearningProgress } from './domain/learning-progress.entity';
import { QuestionAttempt } from '../exercises/domain/question-attempt.entity';
import { UserQuestionResult } from '../exercises/domain/user-question-result.entity';
import { ProgressService } from './application/progress.service';
import { ProgressRepository } from './application/progress.repository';
import { ModuleProgressRepository } from './application/module-progress.repository';
import { CourseProgressRepository } from './application/course-progress.repository';
import { ProgressController } from './presentation/progress.controller';
import { ProgressTransactionService } from './application/progress-transaction.service';
import { UserQuestionResultsRepository } from '../exercises/application/repositories/user-question-results.repository';
import { ExercisesModule } from '../exercises/exercises.module';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      LearningProgress,
      QuestionAttempt,
      UserQuestionResult,
    ]),
    forwardRef(() => ExercisesModule),
    forwardRef(() => CoursesModule),
  ],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    ProgressRepository,
    ModuleProgressRepository,
    CourseProgressRepository,
    ProgressTransactionService,
    UserQuestionResultsRepository,
  ],
  exports: [
    ProgressService,
    ProgressRepository,
    ModuleProgressRepository,
    CourseProgressRepository,
    ProgressTransactionService,
  ],
})
export class ProgressModule {}
