import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LessonContent } from './domain/lesson-content.entity';
import { ContentsController } from './presentation/contents.controller';
import { CoursesModule } from '../courses/courses.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([LessonContent]),
    forwardRef(() => CoursesModule),
  ],
  controllers: [ContentsController],
  providers: [],
  exports: [],
})
export class ContentsModule {}
