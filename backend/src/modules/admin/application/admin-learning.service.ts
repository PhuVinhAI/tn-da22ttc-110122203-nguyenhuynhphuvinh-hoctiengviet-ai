import { Injectable, NotFoundException } from '@nestjs/common';
import { CoursesService } from '../../courses/application/courses.service';
import { CourseContentService } from '../../courses/application/course-content.service';
import { VocabulariesService } from '../../vocabularies/application/vocabularies.service';
import { ExerciseSetService } from '../../exercises/application/exercise-set.service';
import { ExercisesService } from '../../exercises/application/exercises.service';
import { CreateCourseDto } from '../../courses/dto/courses/create-course.dto';
import { CreateModuleDto } from '../../courses/dto/modules/create-module.dto';
import { CreateLessonDto } from '../../courses/dto/lessons/create-lesson.dto';
import { CreateContentDto } from '../../contents/dto/create-content.dto';
import { CreateVocabularyDto } from '../../vocabularies/dto/create-vocabulary.dto';
import { CreateGrammarDto } from '../../grammar/dto/create-grammar.dto';
import { CreateExerciseDto } from '../../exercises/dto/create-exercise.dto';
import { ExerciseSet } from '../../exercises/domain/exercise-set.entity';

@Injectable()
export class AdminLearningService {
  constructor(
    private readonly coursesService: CoursesService,
    private readonly courseContentService: CourseContentService,
    private readonly vocabulariesService: VocabulariesService,
    private readonly exerciseSetService: ExerciseSetService,
    private readonly exercisesService: ExercisesService,
  ) {}

  async getCourses() {
    return this.coursesService.findAllForAdmin();
  }

  async createCourse(dto: CreateCourseDto) {
    return this.coursesService.create(dto);
  }

  async updateCourse(id: string, dto: Partial<CreateCourseDto>) {
    return this.coursesService.update(id, dto);
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
    const [contents, vocabularies, grammarRules, exerciseSets] =
      await Promise.all([
        this.courseContentService.getContentsByLesson(lessonId),
        this.vocabulariesService.findByLessonId(lessonId),
        this.courseContentService.getGrammarByLesson(lessonId),
        this.exerciseSetService.findAllByLessonIdForAdmin(lessonId),
      ]);

    return {
      ...lesson,
      contents,
      vocabularies,
      grammarRules,
      exerciseSets,
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

  async createExerciseSet(
    lessonId: string,
    dto: Pick<ExerciseSet, 'title' | 'description' | 'orderIndex'>,
  ) {
    return this.exerciseSetService.create({
      ...dto,
      lessonId,
      isCustom: false,
      isAIGenerated: false,
    });
  }

  async updateExerciseSet(id: string, dto: Partial<ExerciseSet>) {
    return this.exerciseSetService.updateForAdmin(id, dto);
  }

  async deleteExerciseSet(id: string) {
    await this.exerciseSetService.deleteForAdmin(id);
    return { success: true };
  }

  async getExerciseSetWorkspace(setId: string) {
    const set = await this.exerciseSetService.findByIdForAdmin(setId);
    if (!set) {
      throw new NotFoundException(`ExerciseSet with ID ${setId} not found`);
    }
    return set;
  }

  async createExercise(setId: string, dto: Omit<CreateExerciseDto, 'setId'>) {
    return this.exercisesService.create({ ...dto, setId });
  }

  async updateExercise(id: string, dto: Partial<CreateExerciseDto>) {
    return this.exercisesService.update(id, dto);
  }

  async deleteExercise(id: string) {
    await this.exercisesService.delete(id);
    return { success: true };
  }
}
