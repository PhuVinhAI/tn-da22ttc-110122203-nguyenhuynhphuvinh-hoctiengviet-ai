import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './presentation/admin.controller';
import { AdminLearningController } from './presentation/admin-learning.controller';
import { AdminSimulationsController } from './presentation/admin-simulations.controller';
import { AdminPulseService } from './application/admin-pulse.service';
import { AdminAttentionService } from './application/admin-attention.service';
import { AdminActivityService } from './application/admin-activity.service';
import { AdminLearningService } from './application/admin-learning.service';
import { AdminSimulationsService } from './application/admin-simulations.service';
import { UsersModule } from '../users/users.module';
import { CoursesModule } from '../courses/courses.module';
import { ExercisesModule } from '../exercises/exercises.module';
import { VocabulariesModule } from '../vocabularies/vocabularies.module';
import { SimulationsModule } from '../simulations/simulations.module';
import { ConversationsModule } from '../conversations/conversations.module';
import { User } from '../users/domain/user.entity';
import { Course } from '../courses/domain/course.entity';
import { Lesson } from '../courses/domain/lesson.entity';
import { Question } from '../exercises/domain/question.entity';
import { Vocabulary } from '../vocabularies/domain/vocabulary.entity';
import { SimulationSession } from '../simulations/domain/simulation-session.entity';
import { Conversation } from '../conversations/domain/conversation.entity';

@Module({
  imports: [
    UsersModule,
    CoursesModule,
    ExercisesModule,
    VocabulariesModule,
    SimulationsModule,
    ConversationsModule,
    TypeOrmModule.forFeature([
      User,
      Course,
      Lesson,
      Question,
      Vocabulary,
      SimulationSession,
      Conversation,
    ]),
  ],
  controllers: [
    AdminController,
    AdminLearningController,
    AdminSimulationsController,
  ],
  providers: [
    AdminPulseService,
    AdminAttentionService,
    AdminActivityService,
    AdminLearningService,
    AdminSimulationsService,
  ],
  exports: [
    AdminPulseService,
    AdminAttentionService,
    AdminActivityService,
    AdminLearningService,
    AdminSimulationsService,
  ],
})
export class AdminModule {}
