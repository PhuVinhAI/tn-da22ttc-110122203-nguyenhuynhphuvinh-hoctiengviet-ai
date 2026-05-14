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
import { ExerciseSetService } from '../application/exercise-set.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { CurrentUser } from '../../../common/decorators';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { CreateCustomSetDto } from '../dto/create-custom-set.dto';
import { GenerateDto } from '../dto/generate.dto';

@ApiTags('Exercise Sets')
@Controller('exercise-sets')
export class ExerciseSetController {
  constructor(private readonly exerciseSetService: ExerciseSetService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AI_GENERATE_EXERCISE)
  @Post('custom')
  @ApiOperation({
    summary: 'Create custom practice set with AI generation',
    description:
      'Create a custom exercise set with user-defined config (questionCount, exerciseTypes, focusArea). Exactly one of lessonId, moduleId, or courseId must be provided. Requires AI_GENERATE_EXERCISE permission.',
  })
  @ApiResponse({
    status: 201,
    description:
      'Custom exercise set created. Call POST /exercise-sets/:id/generate to generate exercises.',
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid config or XOR validation failed',
  })
  async createCustom(
    @Body() dto: CreateCustomSetDto,
    @CurrentUser() user: User,
  ) {
    return this.exerciseSetService.createCustom(
      {
        lessonId: dto.lessonId,
        moduleId: dto.moduleId,
        courseId: dto.courseId,
      },
      {
        questionCount: dto.config.questionCount,
        exerciseTypes: dto.config.exerciseTypes,
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
    summary: 'Get custom practice sets for a module',
    description:
      'Returns eligibility (≥1 completed lesson), lesson counts, and custom practice sets for the module',
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
        moduleSets: [],
      },
    },
  })
  async findByModule(
    @Param('moduleId') moduleId: string,
    @CurrentUser() user: User,
  ) {
    return this.exerciseSetService.findByModuleId(moduleId, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Get custom practice sets for a course',
    description:
      'Returns eligibility (≥1 completed module), module counts, and custom practice sets for the course',
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
        courseSets: [],
      },
    },
  })
  async findByCourse(
    @Param('courseId') courseId: string,
    @CurrentUser() user: User,
  ) {
    return this.exerciseSetService.findByCourseId(courseId, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy exercise sets theo lesson',
    description: 'Lấy danh sách active exercise sets với progress stats',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách exercise sets với progress',
  })
  async findByLesson(
    @Param('lessonId') lessonId: string,
    @CurrentUser() user: User,
  ) {
    return this.exerciseSetService.findByLessonId(lessonId, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/progress')
  @ApiOperation({
    summary: 'Lấy tiến độ chi tiết của exercise set',
    description:
      'Lấy tiến độ chi tiết bao gồm totalExercises, attempted, correct, percentCorrect, percentComplete',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 200,
    description: 'Tiến độ chi tiết của exercise set',
  })
  async getProgress(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseSetService.getSetProgress(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/resume')
  @ApiOperation({
    summary: 'Lấy thông tin resume cho exercise set',
    description:
      'Kiểm tra xem user có thể tiếp tục làm dở không. Trả về canResume, attempted, totalExercises.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 200,
    description: 'Thông tin resume',
    schema: {
      example: { canResume: true, attempted: 5, totalExercises: 10 },
    },
  })
  async getResumeInfo(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseSetService.getResumeInfo(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AI_GENERATE_EXERCISE)
  @Post(':id/generate')
  @ApiOperation({
    summary: 'AI generate exercises for an empty set',
    description:
      'Generate AI exercises for an empty exercise set. Accepts optional userPrompt to override the stored one. Requires AI_GENERATE_EXERCISE permission.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 201,
    description: 'Exercises generated successfully',
  })
  @ApiResponse({
    status: 400,
    description: 'Set already has exercises',
  })
  async generate(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto?: GenerateDto,
  ) {
    return this.exerciseSetService.generate(id, user.id, dto?.userPrompt);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions(Permission.AI_GENERATE_EXERCISE)
  @Post(':id/regenerate')
  @ApiOperation({
    summary: 'Create a new set for regeneration',
    description:
      'Create a new empty set cloned from the old set config. Accepts optional userPrompt to override for the new set. Call POST /exercise-sets/:newSetId/generate next. Requires AI_GENERATE_EXERCISE permission.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 201,
    description: 'New set created for regeneration',
    schema: {
      example: { newSetId: 'uuid' },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Set not found',
  })
  async regenerate(
    @Param('id') id: string,
    @CurrentUser() user: User,
    @Body() dto?: GenerateDto,
  ) {
    const newSet = await this.exerciseSetService.regenerate(
      id,
      user.id,
      dto?.userPrompt,
    );
    return { newSetId: newSet.id };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id/custom')
  @ApiOperation({
    summary: 'Xóa bộ bài tập custom',
    description:
      'Soft-delete exercise set custom và các exercise thuộc set. Chỉ áp dụng khi set có isCustom=true.',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({ status: 200, description: 'Đã xóa' })
  @ApiResponse({
    status: 400,
    description: 'Set không phải custom',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy exercise set' })
  async deleteCustom(@Param('id') id: string) {
    await this.exerciseSetService.deleteCustom(id);
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/reset')
  @ApiOperation({
    summary: 'Reset tiến độ exercise set',
    description:
      'Xoá toàn bộ kết quả làm bài của user cho exercise set này (start over)',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 200,
    description: 'Reset thành công',
  })
  async resetProgress(@Param('id') id: string, @CurrentUser() user: User) {
    await this.exerciseSetService.resetProgress(id, user.id);
    return { success: true };
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id/summary')
  @ApiOperation({
    summary: 'Lấy tóm tắt kết quả exercise set',
    description:
      'Trả về thống kê tổng quan và danh sách câu sai với đáp án đúng',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 200,
    description: 'Tóm tắt kết quả',
    schema: {
      example: {
        stats: {
          totalExercises: 10,
          attempted: 10,
          correct: 8,
          percentCorrect: 80,
          percentComplete: 100,
        },
        wrongQuestions: [
          {
            exerciseId: 'uuid',
            question: 'Q?',
            correctAnswer: { value: 'A' },
            explanation: 'Exp',
          },
        ],
      },
    },
  })
  async getSummary(@Param('id') id: string, @CurrentUser() user: User) {
    return this.exerciseSetService.getSummary(id, user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết exercise set',
    description: 'Lấy chi tiết exercise set với đầy đủ exercises',
  })
  @ApiParam({ name: 'id', description: 'ID của exercise set' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết exercise set với exercises',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy exercise set' })
  async findById(@Param('id') id: string) {
    return this.exerciseSetService.findById(id);
  }
}
