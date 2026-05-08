import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './repositories/courses.repository';
import { UnitsRepository } from './repositories/units.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { ContentsService } from '../../contents/application/contents.service';
import { GrammarService } from '../../grammar/application/grammar.service';
import { Course } from '../domain/course.entity';
import { Unit } from '../domain/unit.entity';
import { Lesson } from '../domain/lesson.entity';
import { LessonContent } from '../../contents/domain/lesson-content.entity';

@Injectable()
export class CourseContentService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly unitsRepository: UnitsRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly contentsService: ContentsService,
    private readonly grammarService: GrammarService,
  ) {}

  async getCourseStructure(courseId: string): Promise<Course> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    return course;
  }

  async getUnitDetail(unitId: string): Promise<Unit> {
    const unit = await this.unitsRepository.findById(unitId);
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${unitId} not found`);
    }
    unit.lessons = await this.lessonsRepository.findByUnitId(unitId);
    return unit;
  }

  async getLessonDetail(lessonId: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findById(lessonId);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${lessonId} not found`);
    }
    lesson.contents = await this.contentsService.findByLessonId(lessonId);
    lesson.grammarRules = await this.grammarService.findByLessonId(lessonId);
    return lesson;
  }

  async getUnitsByCourse(courseId: string): Promise<Unit[]> {
    return this.unitsRepository.findByCourseId(courseId);
  }

  async getLessonsByUnit(unitId: string): Promise<Lesson[]> {
    return this.lessonsRepository.findByUnitId(unitId);
  }

  async getContentsByLesson(lessonId: string): Promise<LessonContent[]> {
    return this.contentsService.findByLessonId(lessonId);
  }

  async getContentDetail(contentId: string): Promise<LessonContent> {
    return this.contentsService.findById(contentId);
  }
}
