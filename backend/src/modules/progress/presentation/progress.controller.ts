import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { ProgressService } from '../application/progress.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';
@ApiTags('Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('progress')
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy toàn bộ tiến độ học của user',
    description:
      'Lấy tổng quan tiến độ học tập của user bao gồm tất cả lessons đã học',
  })
  @ApiResponse({
    status: 200,
    description: 'Tiến độ học tập',
    schema: {
      example: [
        {
          id: 'uuid-string',
          lessonId: 'lesson-uuid',
          lesson: {
            title: 'Bài 1: Từ vựng chào hỏi',
            lessonType: 'VOCABULARY',
          },
          status: 'COMPLETED',
          score: 85,
          timeSpent: 1800,
          startedAt: '2024-01-01T00:00:00.000Z',
          completedAt: '2024-01-01T00:30:00.000Z',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async getUserProgress(@CurrentUser() user: User) {
    return this.progressService.getUserProgress(user.id);
  }

  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy tiến độ của 1 lesson',
    description: 'Lấy thông tin chi tiết tiến độ học của một lesson cụ thể',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Tiến độ lesson',
    schema: {
      example: {
        id: 'uuid-string',
        lessonId: 'lesson-uuid',
        status: 'IN_PROGRESS',
        score: 0,
        timeSpent: 600,
        startedAt: '2024-01-01T00:00:00.000Z',
        completedAt: null,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tiến độ' })
  async getLessonProgress(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getLessonProgress(user.id, lessonId);
  }

  @Get('lesson/:lessonId/exercise-status')
  @ApiOperation({
    summary: 'Lấy trạng thái exercise của lesson cho revisit flow',
    description:
      'Trả về contentViewed, hasIncompleteSet, incompleteSetId — dùng cho mobile quyết định "Review content" hoặc "Do exercises" khi quay lại lesson',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái exercise',
    schema: {
      example: {
        contentViewed: true,
        hasIncompleteSet: true,
        incompleteSetId: 'uuid',
        incompleteSetAttempted: 5,
        incompleteSetTotal: 10,
      },
    },
  })
  async getLessonExerciseStatus(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.getLessonExerciseStatus(user.id, lessonId);
  }

  @Post('lesson/:lessonId/start')
  @ApiOperation({
    summary: 'Bắt đầu học lesson',
    description: 'Đánh dấu bắt đầu học một lesson mới',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 201,
    description: 'Bắt đầu lesson thành công',
    schema: {
      example: {
        id: 'uuid-string',
        lessonId: 'lesson-uuid',
        status: 'IN_PROGRESS',
        score: 0,
        timeSpent: 0,
        startedAt: '2024-01-01T00:00:00.000Z',
      },
    },
  })
  async startLesson(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.startLesson(user.id, lessonId);
  }

  @Post('lesson/:lessonId/content-viewed')
  @ApiOperation({
    summary: 'Đánh dấu đã xem nội dung lesson',
    description:
      'Đánh dấu contentViewed=true khi user đến trang cuối wizard. Dùng để track việc user đã xem nội dung bài học.',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Đánh dấu thành công',
    schema: {
      example: {
        id: 'uuid-string',
        lessonId: 'lesson-uuid',
        contentViewed: true,
        status: 'IN_PROGRESS',
      },
    },
  })
  async markContentReviewed(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
  ) {
    return this.progressService.markContentReviewed(user.id, lessonId);
  }

  @Post('lesson/:lessonId/complete')
  @ApiOperation({
    summary: 'Hoàn thành lesson',
    description: 'Đánh dấu hoàn thành lesson và lưu điểm số',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiBody({
    schema: {
      example: {
        score: 85,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Hoàn thành lesson',
    schema: {
      example: {
        id: 'uuid-string',
        lessonId: 'lesson-uuid',
        status: 'COMPLETED',
        score: 85,
        timeSpent: 1800,
        startedAt: '2024-01-01T00:00:00.000Z',
        completedAt: '2024-01-01T00:30:00.000Z',
      },
    },
  })
  async completeLesson(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Body() body: { score: number },
  ) {
    return this.progressService.completeLesson(user.id, lessonId, body.score);
  }

  @Patch('lesson/:lessonId/time')
  @ApiOperation({
    summary: 'Cập nhật thời gian học',
    description: 'Cập nhật thời gian đã dành cho lesson (tính bằng giây)',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiBody({
    schema: {
      example: {
        additionalTime: 300,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Cập nhật thời gian thành công',
    schema: {
      example: {
        id: 'uuid-string',
        timeSpent: 900,
      },
    },
  })
  async updateTimeSpent(
    @CurrentUser() user: User,
    @Param('lessonId') lessonId: string,
    @Body() body: { additionalTime: number },
  ) {
    return this.progressService.updateTimeSpent(
      user.id,
      lessonId,
      body.additionalTime,
    );
  }

  @Get('module/:moduleId')
  @ApiOperation({
    summary: 'Lấy tiến độ module',
    description: 'Lấy tiến độ học của một module cho user đã xác thực',
  })
  @ApiParam({ name: 'moduleId', description: 'ID của module' })
  @ApiResponse({
    status: 200,
    description: 'Tiến độ module',
    schema: {
      example: {
        id: 'uuid-string',
        moduleId: 'module-uuid',
        status: 'COMPLETED',
        score: 85,
        completedLessonsCount: 3,
        totalLessonsCount: 3,
        completedAt: '2024-01-01T00:30:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tiến độ module' })
  async getModuleProgress(
    @CurrentUser() user: User,
    @Param('moduleId') moduleId: string,
  ) {
    return this.progressService.getModuleProgress(user.id, moduleId);
  }

  @Get('course/:courseId')
  @ApiOperation({
    summary: 'Lấy tiến độ course',
    description: 'Lấy tiến độ học của một course cho user đã xác thực',
  })
  @ApiParam({ name: 'courseId', description: 'ID của course' })
  @ApiResponse({
    status: 200,
    description: 'Tiến độ course',
    schema: {
      example: {
        id: 'uuid-string',
        courseId: 'course-uuid',
        status: 'COMPLETED',
        score: 85,
        completedModulesCount: 2,
        totalModulesCount: 2,
        completedAt: '2024-01-01T01:00:00.000Z',
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tiến độ course' })
  async getCourseProgress(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    return this.progressService.getCourseProgress(user.id, courseId);
  }

  @Post('course/:courseId/complete-all')
  @ApiOperation({
    summary: 'Bypass hoàn thành toàn bộ course',
    description:
      'Đánh dấu hoàn thành tất cả lessons/modules trong course. Yêu cầu user level cao hơn course level.',
  })
  @ApiParam({ name: 'courseId', description: 'ID của course' })
  @ApiResponse({
    status: 200,
    description: 'Hoàn thành toàn bộ course thành công',
  })
  @ApiResponse({
    status: 403,
    description: 'User level không cao hơn course level',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy course' })
  async completeAllCourseProgress(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    await this.progressService.completeAllCourseProgress(
      user.id,
      courseId,
      user.currentLevel,
    );
    return { success: true };
  }

  @Post('course/:courseId/reset')
  @ApiOperation({
    summary: 'Reset toàn bộ tiến độ course',
    description:
      'Xoá tất cả tiến độ, kết quả bài tập, và custom practice sets của course.',
  })
  @ApiParam({ name: 'courseId', description: 'ID của course' })
  @ApiResponse({
    status: 200,
    description: 'Reset course thành công',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy course' })
  async resetCourseProgress(
    @CurrentUser() user: User,
    @Param('courseId') courseId: string,
  ) {
    await this.progressService.resetCourseProgress(user.id, courseId);
    return { success: true };
  }
}
