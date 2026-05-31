import { Module } from '@nestjs/common';
import { AdminController } from './presentation/admin.controller';
import { AdminLearningController } from './presentation/admin-learning.controller';
import { AdminSimulationsController } from './presentation/admin-simulations.controller';
import { AdminLearnersController } from './presentation/admin-learners.controller';
import { AdminDashboardService } from './application/admin-dashboard.service';
import { AdminLearningService } from './application/admin-learning.service';
import { AdminSimulationsService } from './application/admin-simulations.service';
import { AdminLearnersService } from './application/admin-learners.service';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { UsersService } from '../users/application/users.service';
import { CourseContentService } from '../courses/application/course-content.service';
import { ExercisesService } from '../exercises/application/exercises.service';
import {
  USER_STATS_PORT,
  COURSE_STATS_PORT,
  EXERCISE_STATS_PORT,
} from './application/ports/dashboard-stats.ports';
import { VocabulariesModule } from '../vocabularies/vocabularies.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { ProgressModule } from '../progress/progress.module';
import { DailyGoalsModule } from '../daily-goals/daily-goals.module';
import { PersonalVocabulariesModule } from '../personal-vocabularies/personal-vocabularies.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../users/domain/user.entity';
import { LearningProgress } from '../progress/domain/learning-progress.entity';
import { DailyGoal } from '../daily-goals/domain/daily-goal.entity';
import { DailyGoalProgress } from '../daily-goals/domain/daily-goal-progress.entity';
import { DailyStreak } from '../daily-goals/domain/daily-streak.entity';
import { UserExerciseResult } from '../exercises/domain/user-exercise-result.entity';
import { ExerciseAttempt } from '../exercises/domain/exercise-attempt.entity';
import { PersonalVocabulary } from '../personal-vocabularies/domain/personal-vocabulary.entity';
import { Bookmark } from '../vocabularies/domain/bookmark.entity';
import { SimulationSession } from '../simulations/domain/simulation-session.entity';
import { SimulationMessage } from '../simulations/domain/simulation-message.entity';
import { Conversation } from '../conversations/domain/conversation.entity';
import { ConversationMessage } from '../conversations/domain/conversation-message.entity';

@Module({
  imports: [
    UsersModule,
    CoursesModule,
    ExercisesModule,
    VocabulariesModule,
    SimulationsModule,
    ProgressModule,
    DailyGoalsModule,
    PersonalVocabulariesModule,
    ConversationsModule,
    TypeOrmModule.forFeature([
      User,
      LearningProgress,
      DailyGoal,
      DailyGoalProgress,
      DailyStreak,
      UserExerciseResult,
      ExerciseAttempt,
      PersonalVocabulary,
      Bookmark,
      SimulationSession,
      SimulationMessage,
      Conversation,
      ConversationMessage,
    ]),
  ],
  controllers: [
    AdminController,
    AdminLearningController,
    AdminSimulationsController,
    AdminLearnersController,
  ],
  providers: [
    AdminDashboardService,
    AdminLearningService,
    AdminSimulationsService,
    AdminLearnersService,
    {
      provide: USER_STATS_PORT,
      useExisting: UsersService,
    },
    {
      provide: COURSE_STATS_PORT,
      useExisting: CourseContentService,
    },
    {
      provide: EXERCISE_STATS_PORT,
      useExisting: ExercisesService,
    },
  ],
  exports: [
    AdminDashboardService,
    AdminLearningService,
    AdminSimulationsService,
    AdminLearnersService,
  ],
})
export class AdminModule {}
