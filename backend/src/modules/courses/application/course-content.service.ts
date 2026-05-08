import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './repositories/courses.repository';
import { UnitsRepository } from './repositories/units.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { ContentsRepository } from '../../contents/application/contents.repository';
import { GrammarRepository } from '../../grammar/application/grammar.repository';
import { Course } from '../domain/course.entity';
import { Unit } from '../domain/unit.entity';
import { Lesson } from '../domain/lesson.entity';
import { LessonContent } from '../../contents/domain/lesson-content.entity';
import { GrammarRule } from '../../grammar/domain/grammar-rule.entity';

@Injectable()
export class CourseContentService {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly unitsRepository: UnitsRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly contentsRepository: ContentsRepository,
    private readonly grammarRepository: GrammarRepository,
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
    lesson.contents = await this.contentsRepository.findByLessonId(lessonId);
    lesson.grammarRules = await this.grammarRepository.findByLessonId(lessonId);
    return lesson;
  }

  async getUnitsByCourse(courseId: string): Promise<Unit[]> {
    return this.unitsRepository.findByCourseId(courseId);
  }

  async getLessonsByUnit(unitId: string): Promise<Lesson[]> {
    return this.lessonsRepository.findByUnitId(unitId);
  }

  async getContentsByLesson(lessonId: string): Promise<LessonContent[]> {
    return this.contentsRepository.findByLessonId(lessonId);
  }

  async getContentDetail(contentId: string): Promise<LessonContent> {
    const content = await this.contentsRepository.findById(contentId);
    if (!content) {
      throw new NotFoundException(`Content with ID ${contentId} not found`);
    }
    return content;
  }

  async getGrammarByLesson(lessonId: string): Promise<GrammarRule[]> {
    return this.grammarRepository.findByLessonId(lessonId);
  }

  async getGrammarDetail(grammarId: string): Promise<GrammarRule> {
    const grammar = await this.grammarRepository.findById(grammarId);
    if (!grammar) {
      throw new NotFoundException(
        `Grammar rule with ID ${grammarId} not found`,
      );
    }
    return grammar;
  }

  async createUnit(data: Partial<Unit>): Promise<Unit> {
    return this.unitsRepository.create(data);
  }

  async updateUnit(id: string, data: Partial<Unit>): Promise<Unit> {
    await this.findUnitById(id);
    return this.unitsRepository.update(id, data);
  }

  async deleteUnit(id: string): Promise<void> {
    await this.findUnitById(id);
    await this.unitsRepository.delete(id);
  }

  async createLesson(data: Partial<Lesson>): Promise<Lesson> {
    return this.lessonsRepository.create(data);
  }

  async updateLesson(id: string, data: Partial<Lesson>): Promise<Lesson> {
    await this.findLessonById(id);
    return this.lessonsRepository.update(id, data);
  }

  async deleteLesson(id: string): Promise<void> {
    await this.findLessonById(id);
    await this.lessonsRepository.delete(id);
  }

  async createContent(data: Partial<LessonContent>): Promise<LessonContent> {
    return this.contentsRepository.create(data);
  }

  async updateContent(
    id: string,
    data: Partial<LessonContent>,
  ): Promise<LessonContent> {
    await this.findContentById(id);
    return this.contentsRepository.update(id, data);
  }

  async deleteContent(id: string): Promise<void> {
    await this.findContentById(id);
    await this.contentsRepository.delete(id);
  }

  async createGrammarRule(data: Partial<GrammarRule>): Promise<GrammarRule> {
    return this.grammarRepository.create(data);
  }

  async updateGrammarRule(
    id: string,
    data: Partial<GrammarRule>,
  ): Promise<GrammarRule> {
    await this.findGrammarById(id);
    return this.grammarRepository.update(id, data);
  }

  async deleteGrammarRule(id: string): Promise<void> {
    await this.findGrammarById(id);
    await this.grammarRepository.delete(id);
  }

  private async findUnitById(id: string): Promise<Unit> {
    const unit = await this.unitsRepository.findById(id);
    if (!unit) {
      throw new NotFoundException(`Unit with ID ${id} not found`);
    }
    return unit;
  }

  private async findLessonById(id: string): Promise<Lesson> {
    const lesson = await this.lessonsRepository.findById(id);
    if (!lesson) {
      throw new NotFoundException(`Lesson with ID ${id} not found`);
    }
    return lesson;
  }

  private async findContentById(id: string): Promise<LessonContent> {
    const content = await this.contentsRepository.findById(id);
    if (!content) {
      throw new NotFoundException(`Content with ID ${id} not found`);
    }
    return content;
  }

  private async findGrammarById(id: string): Promise<GrammarRule> {
    const grammar = await this.grammarRepository.findById(id);
    if (!grammar) {
      throw new NotFoundException(`Grammar rule with ID ${id} not found`);
    }
    return grammar;
  }
}
