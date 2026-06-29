import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CreateCourseDto } from '../../courses/dto/courses/create-course.dto';
import { CreateModuleDto } from '../../courses/dto/modules/create-module.dto';
import { CreateLessonDto } from '../../courses/dto/lessons/create-lesson.dto';
import { CreateContentDto } from '../../contents/dto/create-content.dto';
import { CreateVocabularyDto } from '../../vocabularies/dto/create-vocabulary.dto';
import { CreateGrammarDto } from '../../grammar/dto/create-grammar.dto';
import { CreateQuestionDto } from '../../exercises/dto/create-question.dto';
import { Exercise } from '../../exercises/domain/exercise.entity';
import { AdminLearningService } from '../application/admin-learning.service';
import { SetPublishedDto } from '../dto/set-published.dto';
import { ReorderDto } from '../dto/reorder.dto';

@ApiTags('Admin Learning')
@ApiBearerAuth()
@Controller('admin/learning')
@UseGuards(PermissionsGuard)
@RequirePermissions(Permission.ADMIN_ACCESS)
export class AdminLearningController {
  constructor(private readonly adminLearningService: AdminLearningService) {}

  @Get('courses')
  getCourses() {
    return this.adminLearningService.getCourses();
  }

  @Post('courses/reorder')
  reorderCourses(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderCourses(dto.items);
  }

  @Post('modules/reorder')
  reorderModules(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderModules(dto.items);
  }

  @Post('lessons/reorder')
  reorderLessons(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderLessons(dto.items);
  }

  @Post('exercises/reorder')
  reorderExercises(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderExercises(dto.items);
  }

  @Post('questions/reorder')
  reorderQuestions(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderQuestions(dto.items);
  }

  @Post('contents/reorder')
  reorderContents(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderContents(dto.items);
  }

  @Post('vocabularies/reorder')
  reorderVocabularies(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderVocabularies(dto.items);
  }

  @Post('grammar/reorder')
  reorderGrammar(@Body() dto: ReorderDto) {
    return this.adminLearningService.reorderGrammar(dto.items);
  }

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.adminLearningService.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.adminLearningService.updateCourse(id, dto);
  }

  @Patch('courses/:id/publish')
  setCoursePublished(@Param('id') id: string, @Body() dto: SetPublishedDto) {
    return this.adminLearningService.setCoursePublished(id, dto.isPublished);
  }

  @Delete('courses/:id')
  deleteCourse(@Param('id') id: string) {
    return this.adminLearningService.deleteCourse(id);
  }

  @Get('courses/:courseId')
  getCourseTree(@Param('courseId') courseId: string) {
    return this.adminLearningService.getCourseTree(courseId);
  }

  @Post('courses/:courseId/modules')
  createModule(
    @Param('courseId') courseId: string,
    @Body() dto: Omit<CreateModuleDto, 'courseId'>,
  ) {
    return this.adminLearningService.createModule(courseId, dto);
  }

  @Patch('modules/:id')
  updateModule(@Param('id') id: string, @Body() dto: Partial<CreateModuleDto>) {
    return this.adminLearningService.updateModule(id, dto);
  }

  @Delete('modules/:id')
  deleteModule(@Param('id') id: string) {
    return this.adminLearningService.deleteModule(id);
  }

  @Get('modules/:moduleId')
  getModuleTree(@Param('moduleId') moduleId: string) {
    return this.adminLearningService.getModuleTree(moduleId);
  }

  @Post('modules/:moduleId/lessons')
  createLesson(
    @Param('moduleId') moduleId: string,
    @Body() dto: Omit<CreateLessonDto, 'moduleId'>,
  ) {
    return this.adminLearningService.createLesson(moduleId, dto);
  }

  @Patch('lessons/:id')
  updateLesson(@Param('id') id: string, @Body() dto: Partial<CreateLessonDto>) {
    return this.adminLearningService.updateLesson(id, dto);
  }

  @Delete('lessons/:id')
  deleteLesson(@Param('id') id: string) {
    return this.adminLearningService.deleteLesson(id);
  }

  @Get('lessons/:lessonId')
  getLessonWorkspace(@Param('lessonId') lessonId: string) {
    return this.adminLearningService.getLessonWorkspace(lessonId);
  }

  @Post('lessons/:lessonId/contents')
  createContent(
    @Param('lessonId') lessonId: string,
    @Body() dto: Omit<CreateContentDto, 'lessonId'>,
  ) {
    return this.adminLearningService.createContent(lessonId, dto);
  }

  @Patch('contents/:id')
  updateContent(
    @Param('id') id: string,
    @Body() dto: Partial<CreateContentDto>,
  ) {
    return this.adminLearningService.updateContent(id, dto);
  }

  @Delete('contents/:id')
  deleteContent(@Param('id') id: string) {
    return this.adminLearningService.deleteContent(id);
  }

  @Post('lessons/:lessonId/vocabularies')
  createVocabulary(
    @Param('lessonId') lessonId: string,
    @Body() dto: Omit<CreateVocabularyDto, 'lessonId'>,
  ) {
    return this.adminLearningService.createVocabulary(lessonId, dto);
  }

  @Patch('vocabularies/:id')
  updateVocabulary(
    @Param('id') id: string,
    @Body() dto: Partial<CreateVocabularyDto>,
  ) {
    return this.adminLearningService.updateVocabulary(id, dto);
  }

  @Delete('vocabularies/:id')
  deleteVocabulary(@Param('id') id: string) {
    return this.adminLearningService.deleteVocabulary(id);
  }

  @Post('lessons/:lessonId/grammar')
  createGrammar(
    @Param('lessonId') lessonId: string,
    @Body() dto: Omit<CreateGrammarDto, 'lessonId'>,
  ) {
    return this.adminLearningService.createGrammar(lessonId, dto);
  }

  @Patch('grammar/:id')
  updateGrammar(
    @Param('id') id: string,
    @Body() dto: Partial<CreateGrammarDto>,
  ) {
    return this.adminLearningService.updateGrammar(id, dto);
  }

  @Delete('grammar/:id')
  deleteGrammar(@Param('id') id: string) {
    return this.adminLearningService.deleteGrammar(id);
  }

  @Post('lessons/:lessonId/exercises')
  createExercise(
    @Param('lessonId') lessonId: string,
    @Body() dto: Pick<Exercise, 'title' | 'description' | 'orderIndex'>,
  ) {
    return this.adminLearningService.createExercise(lessonId, dto);
  }

  @Patch('exercises/:id')
  updateExercise(@Param('id') id: string, @Body() dto: Partial<Exercise>) {
    return this.adminLearningService.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  deleteExercise(@Param('id') id: string) {
    return this.adminLearningService.deleteExercise(id);
  }

  @Get('exercises/:exerciseId')
  getExerciseWorkspace(@Param('exerciseId') exerciseId: string) {
    return this.adminLearningService.getExerciseWorkspace(exerciseId);
  }

  @Post('exercises/:exerciseId/questions')
  createQuestion(
    @Param('exerciseId') exerciseId: string,
    @Body() dto: Omit<CreateQuestionDto, 'exerciseId'>,
  ) {
    return this.adminLearningService.createQuestion(exerciseId, dto);
  }

  @Patch('questions/:id')
  updateQuestion(
    @Param('id') id: string,
    @Body() dto: Partial<CreateQuestionDto>,
  ) {
    return this.adminLearningService.updateQuestion(id, dto);
  }

  @Delete('questions/:id')
  deleteQuestion(@Param('id') id: string) {
    return this.adminLearningService.deleteQuestion(id);
  }
}
