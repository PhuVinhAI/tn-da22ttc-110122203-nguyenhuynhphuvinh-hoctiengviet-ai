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
import { CreateExerciseDto } from '../../exercises/dto/create-exercise.dto';
import { ExerciseSet } from '../../exercises/domain/exercise-set.entity';
import { AdminLearningService } from '../application/admin-learning.service';

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

  @Post('courses')
  createCourse(@Body() dto: CreateCourseDto) {
    return this.adminLearningService.createCourse(dto);
  }

  @Patch('courses/:id')
  updateCourse(@Param('id') id: string, @Body() dto: Partial<CreateCourseDto>) {
    return this.adminLearningService.updateCourse(id, dto);
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

  @Post('lessons/:lessonId/exercise-sets')
  createExerciseSet(
    @Param('lessonId') lessonId: string,
    @Body() dto: Pick<ExerciseSet, 'title' | 'description' | 'orderIndex'>,
  ) {
    return this.adminLearningService.createExerciseSet(lessonId, dto);
  }

  @Patch('exercise-sets/:id')
  updateExerciseSet(
    @Param('id') id: string,
    @Body() dto: Partial<ExerciseSet>,
  ) {
    return this.adminLearningService.updateExerciseSet(id, dto);
  }

  @Delete('exercise-sets/:id')
  deleteExerciseSet(@Param('id') id: string) {
    return this.adminLearningService.deleteExerciseSet(id);
  }

  @Get('exercise-sets/:setId')
  getExerciseSetWorkspace(@Param('setId') setId: string) {
    return this.adminLearningService.getExerciseSetWorkspace(setId);
  }

  @Post('exercise-sets/:setId/exercises')
  createExercise(
    @Param('setId') setId: string,
    @Body() dto: Omit<CreateExerciseDto, 'setId'>,
  ) {
    return this.adminLearningService.createExercise(setId, dto);
  }

  @Patch('exercises/:id')
  updateExercise(
    @Param('id') id: string,
    @Body() dto: Partial<CreateExerciseDto>,
  ) {
    return this.adminLearningService.updateExercise(id, dto);
  }

  @Delete('exercises/:id')
  deleteExercise(@Param('id') id: string) {
    return this.adminLearningService.deleteExercise(id);
  }
}
