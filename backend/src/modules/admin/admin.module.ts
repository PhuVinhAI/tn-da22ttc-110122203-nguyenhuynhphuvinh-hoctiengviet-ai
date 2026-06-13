import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './presentation/admin.controller';
import { AdminLearningController } from './presentation/admin-learning.controller';
import { AdminSimulationsController } from './presentation/admin-simulations.controller';
import { AdminLearnersController } from './presentation/admin-learners.controller';
import { AdminPulseService } from './application/admin-pulse.service';
import { AdminAttentionService } from './application/admin-attention.service';
import { AdminActivityService } from './application/admin-activity.service';
import { AdminLearnerInsightsService } from './application/admin-learner-insights.service';
import { AdminLearningService } from './application/admin-learning.service';
import { AdminSimulationsService } from './application/admin-simulations.service';
import { AdminLearnersService } from './application/admin-learners.service';
import { AdminLearnerAnalyticsService } from './application/admin-learner-analytics.service';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { VocabulariesModule } from '../vocabularies/vocabularies.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { ProgressModule } from '../progress/progress.module';
import { DailyGoalsModule } from '../daily-goals/daily-goals.module';
import { PersonalVocabulariesModule } from '../personal-vocabularies/personal-vocabularies.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { User } from '../users/domain/user.entity';
import { Course } from '../courses/domain/course.entity';
import { Module as CourseModule } from '../courses/domain/module.entity';
import { Lesson } from '../courses/domain/lesson.entity';
import { LessonContent } from '../contents/domain/lesson-content.entity';
import { GrammarRule } from '../grammar/domain/grammar-rule.entity';
import { Exercise } from '../exercises/domain/exercise.entity';
import { Question } from '../exercises/domain/question.entity';
import { LearningProgress } from '../progress/domain/learning-progress.entity';
import { DailyGoal } from '../daily-goals/domain/daily-goal.entity';
import { DailyGoalProgress } from '../daily-goals/domain/daily-goal-progress.entity';
import { DailyStreak } from '../daily-goals/domain/daily-streak.entity';
import { UserQuestionResult } from '../exercises/domain/user-question-result.entity';
import { QuestionAttempt } from '../exercises/domain/question-attempt.entity';
import { PersonalVocabulary } from '../personal-vocabularies/domain/personal-vocabulary.entity';
import { Vocabulary } from '../vocabularies/domain/vocabulary.entity';
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
      Course,
      CourseModule,
      Lesson,
      LessonContent,
      GrammarRule,
      Exercise,
      Question,
      LearningProgress,
      DailyGoal,
      DailyGoalProgress,
      DailyStreak,
      UserQuestionResult,
      QuestionAttempt,
      PersonalVocabulary,
      Vocabulary,
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
    AdminPulseService,
    AdminAttentionService,
    AdminActivityService,
    AdminLearnerInsightsService,
    AdminLearningService,
    AdminSimulationsService,
    AdminLearnersService,
    AdminLearnerAnalyticsService,
  ],
  exports: [
    AdminPulseService,
    AdminAttentionService,
    AdminActivityService,
    AdminLearnerInsightsService,
    AdminLearningService,
    AdminSimulationsService,
    AdminLearnersService,
    AdminLearnerAnalyticsService,
  ],
})
export class AdminModule {}
