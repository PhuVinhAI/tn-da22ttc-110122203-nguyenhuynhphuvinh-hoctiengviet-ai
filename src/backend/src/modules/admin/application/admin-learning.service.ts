import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesService } from '../../courses/application/courses.service';
import { CourseContentService } from '../../courses/application/course-content.service';
import { VocabulariesService } from '../../vocabularies/application/vocabularies.service';
import { ExerciseService } from '../../exercises/application/exercise.service';
import { QuestionsService } from '../../exercises/application/questions.service';
import { CreateCourseDto } from '../../courses/dto/courses/create-course.dto';
import { CreateModuleDto } from '../../courses/dto/modules/create-module.dto';
import { CreateLessonDto } from '../../courses/dto/lessons/create-lesson.dto';
import { CreateContentDto } from '../../contents/dto/create-content.dto';
import { CreateVocabularyDto } from '../../vocabularies/dto/create-vocabulary.dto';
import { CreateGrammarDto } from '../../grammar/dto/create-grammar.dto';
import { CreateQuestionDto } from '../../exercises/dto/create-question.dto';
import { Exercise } from '../../exercises/domain/exercise.entity';
import { ReorderItem } from '../../../common/utils/bulk-reorder';

@Injectable()
export class AdminLearningService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseContentService: CourseContentService,
    private readonly vocabulariesService: VocabulariesService,
    private readonly exerciseService: ExerciseService,
    private readonly questionsService: QuestionsService,
  ) {}

  async getCourses() {
    return this.coursesService.findAllForAdmin();
  }

  async createCourse(dto: CreateCourseDto) {
    const { isPublished: _ignored, ...rest } = dto;
    return this.coursesService.create(rest);
  }

  async updateCourse(id: string, dto: Partial<CreateCourseDto>) {
    const { isPublished: _ignored, ...rest } = dto;
    return this.coursesService.update(id, rest);
  }

  async setCoursePublished(id: string, isPublished: boolean) {
    return this.coursesService.update(id, { isPublished });
  }

  async deleteCourse(id: string) {
    await this.coursesService.delete(id);
    return { success: true };
  }

  async getCourseTree(courseId: string) {
    return this.courseContentService.getCourseStructure(courseId);
  }

  async createModule(courseId: string, dto: Omit<CreateModuleDto, 'courseId'>) {
    return this.courseContentService.createModule({ ...dto, courseId });
  }

  async updateModule(id: string, dto: Partial<CreateModuleDto>) {
    return this.courseContentService.updateModule(id, dto);
  }

  async deleteModule(id: string) {
    await this.courseContentService.deleteModule(id);
    return { success: true };
  }

  async getModuleTree(moduleId: string) {
    return this.courseContentService.getModuleDetail(moduleId);
  }

  async createLesson(moduleId: string, dto: Omit<CreateLessonDto, 'moduleId'>) {
    return this.courseContentService.createLesson({ ...dto, moduleId });
  }

  async updateLesson(id: string, dto: Partial<CreateLessonDto>) {
    return this.courseContentService.updateLesson(id, dto);
  }

  async deleteLesson(id: string) {
    await this.courseContentService.deleteLesson(id);
    return { success: true };
  }

  async getLessonWorkspace(lessonId: string) {
    const lesson = await this.courseContentService.getLessonDetail(lessonId);
    const [contents, vocabularies, grammarRules, exercises] = await Promise.all(
      [
        this.courseContentService.getContentsByLesson(lessonId),
        this.vocabulariesService.findByLessonId(lessonId),
        this.courseContentService.getGrammarByLesson(lessonId),
        this.exerciseService.findAllByLessonIdForAdmin(lessonId),
      ],
    );

    return {
      ...lesson,
      contents,
      vocabularies,
      grammarRules,
      exercises,
    };
  }

  async createContent(
    lessonId: string,
    dto: Omit<CreateContentDto, 'lessonId'>,
  ) {
    return this.courseContentService.createContent({ ...dto, lessonId });
  }

  async updateContent(id: string, dto: Partial<CreateContentDto>) {
    return this.courseContentService.updateContent(id, dto);
  }

  async deleteContent(id: string) {
    await this.courseContentService.deleteContent(id);
    return { success: true };
  }

  async createVocabulary(
    lessonId: string,
    dto: Omit<CreateVocabularyDto, 'lessonId'>,
  ) {
    return this.vocabulariesService.create({ ...dto, lessonId });
  }

  async updateVocabulary(id: string, dto: Partial<CreateVocabularyDto>) {
    return this.vocabulariesService.update(id, dto);
  }

  async deleteVocabulary(id: string) {
    await this.vocabulariesService.delete(id);
    return { success: true };
  }

  async createGrammar(
    lessonId: string,
    dto: Omit<CreateGrammarDto, 'lessonId'>,
  ) {
    return this.courseContentService.createGrammarRule({ ...dto, lessonId });
  }

  async updateGrammar(id: string, dto: Partial<CreateGrammarDto>) {
    return this.courseContentService.updateGrammarRule(id, dto);
  }

  async deleteGrammar(id: string) {
    await this.courseContentService.deleteGrammarRule(id);
    return { success: true };
  }

  async createExercise(
    lessonId: string,
    dto: Pick<Exercise, 'title' | 'description' | 'orderIndex'>,
  ) {
    return this.exerciseService.create({
      ...dto,
      lessonId,
      isCustom: false,
      isAIGenerated: false,
    });
  }

  async updateExercise(id: string, dto: Partial<Exercise>) {
    return this.exerciseService.updateForAdmin(id, dto);
  }

  async deleteExercise(id: string) {
    await this.exerciseService.deleteForAdmin(id);
    return { success: true };
  }

  async getExerciseWorkspace(exerciseId: string) {
    const set = await this.exerciseService.findByIdForAdmin(exerciseId);
    if (!set) {
      throw new NotFoundException(`Exercise with ID ${exerciseId} not found`);
    }
    return set;
  }

  async createQuestion(
    exerciseId: string,
    dto: Omit<CreateQuestionDto, 'exerciseId'>,
  ) {
    return this.questionsService.create({ ...dto, exerciseId });
  }

  async updateQuestion(id: string, dto: Partial<CreateQuestionDto>) {
    return this.questionsService.update(id, dto);
  }

  async deleteQuestion(id: string) {
    await this.questionsService.delete(id);
    return { success: true };
  }

  async reorderCourses(items: ReorderItem[]) {
    await this.coursesService.reorder(items);
    return { success: true };
  }

  async reorderModules(items: ReorderItem[]) {
    await this.courseContentService.reorderModules(items);
    return { success: true };
  }

  async reorderLessons(items: ReorderItem[]) {
    await this.courseContentService.reorderLessons(items);
    return { success: true };
  }

  async reorderExercises(items: ReorderItem[]) {
    await this.exerciseService.reorderExercises(items);
    return { success: true };
  }

  async reorderQuestions(items: ReorderItem[]) {
    await this.exerciseService.reorderQuestions(items);
    return { success: true };
  }

  async reorderContents(items: ReorderItem[]) {
    await this.courseContentService.reorderContents(items);
    return { success: true };
  }

  async reorderVocabularies(items: ReorderItem[]) {
    await this.vocabulariesService.reorder(items);
    return { success: true };
  }

  async reorderGrammar(items: ReorderItem[]) {
    await this.courseContentService.reorderGrammarRules(items);
    return { success: true };
  }
}
