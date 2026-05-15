import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DailyGoal } from './domain/daily-goal.entity';
import { DailyGoalProgress } from './domain/daily-goal-progress.entity';
import { DailyStreak } from './domain/daily-streak.entity';
import { DailyGoalsRepository } from './application/daily-goals.repository';
import { DailyGoalProgressRepository } from './application/daily-goal-progress.repository';
import { DailyStreakRepository } from './application/daily-streak.repository';
import { DailyGoalsService } from './application/daily-goals.service';
import { DailyGoalProgressService } from './application/daily-goal-progress.service';
import { DailyStreakService } from './application/daily-streak.service';
import { DailyGoalsController } from './presentation/daily-goals.controller';
import { DailyGoalProgressController } from './presentation/daily-goal-progress.controller';
import { ExercisesModule } from '../exercises/exercises.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([DailyGoal, DailyGoalProgress, DailyStreak]),
    forwardRef(() => ExercisesModule),
    forwardRef(() => ProgressModule),
  ],
  controllers: [DailyGoalsController, DailyGoalProgressController],
  providers: [
    DailyGoalsService,
    DailyGoalsRepository,
    DailyGoalProgressService,
    DailyGoalProgressRepository,
    DailyStreakService,
    DailyStreakRepository,
  ],
  exports: [DailyGoalsService, DailyGoalProgressService, DailyStreakService],
})
export class DailyGoalsModule {}
