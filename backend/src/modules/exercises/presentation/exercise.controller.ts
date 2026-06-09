import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseGuards,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ExerciseService } from '../application/exercise.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { CreateCustomExerciseDto } from '../dto/create-custom-exercise.dto';
import { GenerateDto } from '../dto/generate.dto';

@ApiTags('Exercises')
@Controller('exercises')
export class ExerciseController {
  constructor(private readonly exerciseService: ExerciseService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AI_GENERATE_EXERCISE)
  @Post('custom')
  @ApiOperation({
    summary: 'Create custom practice exercise with AI generation',
    description:
      'Create a custom exercise with user-defined config (questionCount, questionTypes, focusArea). Exactly one of lessonId, moduleId, or courseId must be provided. Requires AI_GENERATE_EXERCISE permission.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Custom exercise created. Call POST /questions/:id/generate to generate exercises.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid config or XOR validation failed',
  })
  async createCustom(
    @Body() dto: CreateCustomExerciseDto,
    @CurrentUser() user: User,
  ) {
    return this.exerciseService.createCustom(
      {
        lessonId: dto.lessonId,
        moduleId: dto.moduleId,
        courseId: dto.courseId,
      },
      {
        questionCount: dto.config.questionCount,
        questionTypes: dto.config.questionTypes,
        focusArea: dto.config.focusArea,
      },
      user.id,
      dto.userPrompt,
    );
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('module/:moduleId')
  @ApiOperation({
    summary: 'Get custom practice exercises for a module',
    description:
      'Returns eligibility (≥1 completed lesson), lesson counts, and custom practice exercises for the module',
  })
  @ApiParam({ name: 'moduleId', description: 'ID của module' })
  @ApiResponse({
    status: 200,
    description: 'Module custom practice info',
    schema: {
      example: {
        eligible: true,
        completedLessonsCount: 3,
        totalLessonsCount: 5,
        moduleExercises: [],
      },
    },
  })
  async findByModule(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: User,
  ) {
    return this.exerciseService.findByModuleId(moduleId, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Get custom practice exercises for a course',
    description:
      'Returns eligibility (≥1 completed module), module counts, and custom practice exercises for the course',
  })
  @ApiParam({ name: 'courseId', description: 'ID của course' })
  @ApiResponse({
    status: 200,
    description: 'Course custom practice info',
    schema: {
      example: {
        eligible: true,
        completedModulesCount: 2,
        totalModulesCount: 5,
        courseExercises: [],
      },
    },
  })
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.exerciseService.findByCourseId(courseId, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy exercises theo lesson',
    description: 'Lấy danh sách active exercises với progress stats',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách exercises với progress',
  })
  async findByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    return this.exerciseService.findByLessonId(lessonId, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  @ApiOperation({
    summary: 'Lấy tiến độ chi tiết của exercise',
    description:
      'Lấy tiến độ chi tiết bao gồm totalQuestions, attempted, correct, percentCorrect, percentComplete',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 200,
    description: 'Tiến độ chi tiết của exercise',
  })
  async getProgress(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseService.getExerciseProgress(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/resume')
  @ApiOperation({
    summary: 'Lấy thông tin resume cho exercise',
    description:
      'Kiểm tra xem user có thể tiếp tục làm dở không. Trả về canResume, attempted, totalQuestions.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin resume',
    schema: {
      example: { canResume: true, attempted: 5, totalQuestions: 10 },
    },
  })
  async getResumeInfo(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseService.getResumeInfo(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AI_GENERATE_EXERCISE)
  @Post(':id/generate')
  @ApiOperation({
    summary: 'AI generate questions for an empty exercise',
    description:
      'Generate AI exercises for an empty exercise. Accepts optional userPrompt to override the stored one. Requires AI_GENERATE_EXERCISE permission.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 201,
    description: 'Exercises generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Exercise already has questions',
  })
  async generate(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto?: GenerateDto,
  ) {
    return this.exerciseService.generate(id, user.id, dto?.userPrompt);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AI_GENERATE_EXERCISE)
  @Post(':id/regenerate')
  @ApiOperation({
    summary: 'Create a new exercise for regeneration',
    description:
      'Create a new empty exercise cloned from the old exercise config. Accepts optional userPrompt to override for the new exercise. Call POST /exercises/:newExerciseId/generate next. Requires AI_GENERATE_EXERCISE permission.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 201,
    description: 'New exercise created for regeneration',
    schema: {
      example: { newExerciseId: 'uuid' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Exercise not found',
  })
  async regenerate(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto?: GenerateDto,
  ) {
    const newExercise = await this.exerciseService.regenerate(
      id,
      user.id,
      dto?.userPrompt,
    );
    return { newExerciseId: newExercise.id };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/custom')
  @ApiOperation({
    summary: 'Xóa bài tập custom',
    description:
      'Soft-delete exercise custom và các exercise thuộc bài tập. Chỉ áp dụng khi bài tập có isCustom=true.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({ status: 200, description: 'Đã xóa' })
  @ApiResponse({
    status: 400,
    description: 'Bài tập không phải custom',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy exercise' })
  async deleteCustom(@Param('id') id: string, @CurrentUser() user: User) {
    await this.exerciseService.deleteCustom(id, user.id);
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reset')
  @ApiOperation({
    summary: 'Reset tiến độ exercise',
    description:
      'Xoá toàn bộ kết quả làm bài của user cho exercise này (start over)',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 200,
    description: 'Reset thành công',
  })
  async resetProgress(@Param('id') id: string, @CurrentUser() user: User) {
    await this.exerciseService.resetProgress(id, user.id);
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/summary')
  @ApiOperation({
    summary: 'Lấy tóm tắt kết quả exercise',
    description:
      'Trả về thống kê tổng quan và danh sách câu sai với đáp án đúng',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 200,
    description: 'Tóm tắt kết quả',
    schema: {
      example: {
        stats: {
          totalQuestions: 10,
          attempted: 10,
          correct: 8,
          percentCorrect: 80,
          percentComplete: 100,
        },
        wrongQuestions: [
          {
            questionId: 'uuid',
            question: 'Q?',
            correctAnswer: { value: 'A' },
            explanation: 'Exp',
          },
        ],
      },
    },
  })
  async getSummary(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseService.getSummary(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết exercise',
    description: 'Lấy chi tiết exercise với đầy đủ exercises',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết exercise với exercises',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy exercise' })
  async findById(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseService.findById(id, user.id);
  }
}
