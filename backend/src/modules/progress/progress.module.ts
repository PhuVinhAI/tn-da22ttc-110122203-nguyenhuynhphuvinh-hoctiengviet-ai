import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProgress } from './domain/user-progress.entity';
import { ProgressService } from './application/progress.service';
import { ProgressRepository } from './application/progress.repository';
import { ProgressController } from './presentation/progress.controller';
import { SpacedRepetitionService } from './application/spaced-repetition.service';
import { FSRSService } from './application/fsrs.service';

@Module({
  imports: [TypeOrmModule.forFeature([UserProgress])],
  controllers: [ProgressController],
  providers: [
    ProgressService,
    ProgressRepository,
    SpacedRepetitionService,
    FSRSService,
  ],
  exports: [ProgressService, SpacedRepetitionService],
})
export class ProgressModule {}
