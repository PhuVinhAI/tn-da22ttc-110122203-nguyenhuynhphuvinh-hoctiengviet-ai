import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './domain/course.entity';
import { Unit } from './domain/unit.entity';
import { Lesson } from './domain/lesson.entity';
import { LessonContent } from '../contents/domain/lesson-content.entity';
import { GrammarRule } from '../grammar/domain/grammar-rule.entity';
import { CoursesService } from './application/courses.service';
import { CourseContentService } from './application/course-content.service';
import { CoursesRepository } from './application/repositories/courses.repository';
import { UnitsRepository } from './application/repositories/units.repository';
import { LessonsRepository } from './application/repositories/lessons.repository';
import { ContentsRepository } from '../contents/application/contents.repository';
import { GrammarRepository } from '../grammar/application/grammar.repository';
import { CoursesController } from './presentation/courses.controller';
import { UnitsController } from './presentation/units.controller';
import { LessonsController } from './presentation/lessons.controller';
import { ContentsModule } from '../contents/contents.module';
import { GrammarModule } from '../grammar/grammar.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      Unit,
      Lesson,
      LessonContent,
      GrammarRule,
    ]),
    forwardRef(() => ContentsModule),
    GrammarModule,
  ],
  controllers: [CoursesController, UnitsController, LessonsController],
  providers: [
    CoursesService,
    CourseContentService,
    CoursesRepository,
    UnitsRepository,
    LessonsRepository,
    ContentsRepository,
    GrammarRepository,
  ],
  exports: [CoursesService, CourseContentService],
})
export class CoursesModule {}
