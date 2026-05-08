import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonContent } from './domain/lesson-content.entity';
import { ContentsService } from './application/contents.service';
import { ContentsRepository } from './application/contents.repository';
import { ContentsController } from './presentation/contents.controller';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LessonContent]),
    forwardRef(() => CoursesModule),
  ],
  controllers: [ContentsController],
  providers: [ContentsService, ContentsRepository],
  exports: [ContentsService],
})
export class ContentsModule {}
