import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesRepository } from './repositories/courses.repository';
import { ModulesRepository } from './repositories/modules.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { ContentsRepository } from '../../contents/application/contents.repository';
import { GrammarRepository } from '../../grammar/application/grammar.repository';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { Course } from '../domain/course.entity';
import { Module } from '../domain/module.entity';
import { Lesson } from '../domain/lesson.entity';
import { LessonContent } from '../../contents/domain/lesson-content.entity';
import { GrammarRule } from '../../grammar/domain/grammar-rule.entity';
import {
  CourseStatsPort,
  CourseStatsResult,
} from '../../admin/application/ports/dashboard-stats.ports';

@Injectable()
export class CourseContentService implements CourseStatsPort {
  constructor(
    private readonly coursesRepository: CoursesRepository,
    private readonly modulesRepository: ModulesRepository,
    private readonly lessonsRepository: LessonsRepository,
    private readonly contentsRepository: ContentsRepository,
    private readonly grammarRepository: GrammarRepository,
    private readonly progressRepository: ProgressRepository,
  ) {}

  async getTopCoursesByEnrollment(limit: number): Promise<CourseStatsResult[]> {
    return this.progressRepository.getTopCoursesByEnrollment(limit);
  }

  async getCourseStructure(courseId: string): Promise<Course> {
    const course = await this.coursesRepository.findById(courseId);
    if (!course) {
      throw new NotFoundException(`Course with ID ${courseId} not found`);
    }
    return course;
  }

  async getModuleDetail(moduleId: string): Promise<Module> {
    const module = await this.modulesRepository.findById(moduleId);
    if (!module) {
      throw new NotFoundException(`Module with ID ${moduleId} not found`);
    }
    module.lessons = await this.lessonsRepository.findByModuleId(moduleId);
    return module;
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

  async getModulesByCourse(courseId: string): Promise<Module[]> {
    return this.modulesRepository.findByCourseId(courseId);
  }

  async getLessonsByModule(moduleId: string): Promise<Lesson[]> {
    return this.lessonsRepository.findByModuleId(moduleId);
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

  async createModule(data: Partial<Module>): Promise<Module> {
    return this.modulesRepository.create(data);
  }

  async updateModule(id: string, data: Partial<Module>): Promise<Module> {
    await this.findModuleById(id);
    return this.modulesRepository.update(id, data);
  }

  async deleteModule(id: string): Promise<void> {
    await this.findModuleById(id);
    await this.modulesRepository.delete(id);
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

  private async findModuleById(id: string): Promise<Module> {
    const module = await this.modulesRepository.findById(id);
    if (!module) {
      throw new NotFoundException(`Module with ID ${id} not found`);
    }
    return module;
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
