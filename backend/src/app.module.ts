import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { APP_GUARD, APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import redisConfig from './config/redis.config';
import mailConfig from './config/mail.config';
import genaiConfig from './config/genai.config';
import aiRouterConfig from './config/ai-router.config';
import { validateEnv } from './config/env.validation';

import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';

import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { CoursesModule } from './modules/courses/courses.module';
import { ContentsModule } from './modules/contents/contents.module';
import { VocabulariesModule } from './modules/vocabularies/vocabularies.module';
import { GrammarModule } from './modules/grammar/grammar.module';
import { ExercisesModule } from './modules/exercises/exercises.module';
import { ProgressModule } from './modules/progress/progress.module';
import { ConversationsModule } from './modules/conversations/conversations.module';
import { AgentModule } from './modules/agent/agent.module';
import { AdminModule } from './modules/admin/admin.module';
import { AiModule } from './modules/ai/ai.module';
import { DailyGoalsModule } from './modules/daily-goals/daily-goals.module';
import { SimulationsModule } from './modules/simulations/simulations.module';
import { PersonalVocabulariesModule } from './modules/personal-vocabularies/personal-vocabularies.module';
import { ImageAnalysisModule } from './modules/image-analysis/image-analysis.module';
import { UploadsModule } from './modules/uploads/uploads.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { StorageModule } from './infrastructure/storage/storage.module';
import { LoggingModule } from './infrastructure/logging/logging.module';
import { MailModule } from './infrastructure/mail/mail.module';
import { QueueModule } from './infrastructure/queue/queue.module';
import { ArchivingModule } from './infrastructure/archiving/archiving.module';
import { AiModule as AiInfraModule } from './infrastructure/genai/ai.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
      load: [
        appConfig,
        databaseConfig,
        jwtConfig,
        redisConfig,
        mailConfig,
        genaiConfig,
        aiRouterConfig,
      ],
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const dbConfig = configService.get('database');
        if (!dbConfig) {
          throw new Error('Database configuration not found');
        }
        return dbConfig;
      },
      inject: [ConfigService],
    }),
    ServeStaticModule.forRoot({
      rootPath: process.env.UPLOADS_DIR || join(__dirname, '..', 'uploads'),
      serveRoot: '/uploads',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 seconds
        limit: 1000, // Increased for integration tests
      },
    ]),
    ScheduleModule.forRoot(),
    CacheModule,
    StorageModule,
    LoggingModule,
    MailModule,
    QueueModule,
    ArchivingModule,
    AiInfraModule,
    AuthModule,
    UsersModule,
    CoursesModule,
    ContentsModule,
    VocabulariesModule,
    GrammarModule,
    ExercisesModule,
    ProgressModule,
    ConversationsModule,
    AgentModule,
    AdminModule,
    AiModule,
    DailyGoalsModule,
    SimulationsModule,
    PersonalVocabulariesModule,
    ImageAnalysisModule,
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
  ],
})
export class AppModule {}
