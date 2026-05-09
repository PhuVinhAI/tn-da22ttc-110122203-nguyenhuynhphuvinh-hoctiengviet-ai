import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Course } from './domain/course.entity';
import { Module as ModuleEntity } from './domain/module.entity';
import { Lesson } from './domain/lesson.entity';
import { LessonContent } from '../contents/domain/lesson-content.entity';
import { GrammarRule } from '../grammar/domain/grammar-rule.entity';
import { CoursesService } from './application/courses.service';
import { CourseContentService } from './application/course-content.service';
import { CoursesRepository } from './application/repositories/courses.repository';
import { ModulesRepository } from './application/repositories/modules.repository';
import { LessonsRepository } from './application/repositories/lessons.repository';
import { ContentsRepository } from '../contents/application/contents.repository';
import { GrammarRepository } from '../grammar/application/grammar.repository';
import { CoursesController } from './presentation/courses.controller';
import { ModulesController } from './presentation/modules.controller';
import { LessonsController } from './presentation/lessons.controller';
import { ContentsModule } from '../contents/contents.module';
import { GrammarModule } from '../grammar/grammar.module';
import { ProgressModule } from '../progress/progress.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Course,
      ModuleEntity,
      Lesson,
      LessonContent,
      GrammarRule,
    ]),
    forwardRef(() => ContentsModule),
    GrammarModule,
    ProgressModule,
  ],
  controllers: [CoursesController, ModulesController, LessonsController],
  providers: [
    CoursesService,
    CourseContentService,
    CoursesRepository,
    ModulesRepository,
    LessonsRepository,
    ContentsRepository,
    GrammarRepository,
  ],
  exports: [CoursesService, CourseContentService],
})
export class CoursesModule {}
