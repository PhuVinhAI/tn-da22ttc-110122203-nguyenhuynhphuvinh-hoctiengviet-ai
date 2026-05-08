import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './domain/user-progress.entity';
import { UserExerciseResult } from '../exercises/domain/user-exercise-result.entity';
import { UserVocabulary } from '../vocabularies/domain/user-vocabulary.entity';
import { ProgressService } from './application/progress.service';
import { ProgressRepository } from './application/progress.repository';
import { ProgressController } from './presentation/progress.controller';
import { ProgressTransactionService } from './application/progress-transaction.service';
import { SpacedRepetitionService } from './application/spaced-repetition.service';
import { FSRSService } from './application/fsrs.service';
import { UserExerciseResultsRepository } from '../exercises/application/repositories/user-exercise-results.repository';
import { UserVocabulariesRepository } from '../vocabularies/application/repositories/user-vocabularies.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserProgress,
      UserExerciseResult,
      UserVocabulary,
    ]),
  ],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    ProgressRepository,
    ProgressTransactionService,
    SpacedRepetitionService,
    FSRSService,
    UserExerciseResultsRepository,
    UserVocabulariesRepository,
  ],
  exports: [
    ProgressService,
    ProgressTransactionService,
    SpacedRepetitionService,
  ],
})
export class ProgressModule {}
