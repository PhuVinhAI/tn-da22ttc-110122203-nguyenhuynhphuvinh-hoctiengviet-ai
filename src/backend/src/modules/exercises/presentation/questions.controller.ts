import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
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
import { QuestionsService } from '../application/questions.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { RequirePermissions } from '../../../common/decorators';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';
import { User } from '../../users/domain/user.entity';
import { Public } from '../../../common/decorators';
import { CreateQuestionDto } from '../dto/create-question.dto';
import { SubmitAnswerResult } from '../application/questions.service';

@ApiTags('Questions')
@Controller('questions')
export class QuestionsController {
  constructor(private readonly questionsService: QuestionsService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-results')
  @ApiOperation({
    summary: 'Lấy kết quả câu hỏi của user',
    description: 'Lấy lịch sử làm câu hỏi của user hiện tại',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách kết quả câu hỏi',
    schema: {
      example: [
        {
          id: 'uuid-string',
          questionId: 'exercise-uuid',
          userAnswer: 'Câu trả lời',
          isCorrect: true,
          timeSpent: 30,
          completedAt: '2024-01-01T00:00:00.000Z',
        },
      ],
    },
  })
  async getMyResults(@CurrentUser() user: User) {
    return this.questionsService.getUserResults(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-stats')
  @ApiOperation({
    summary: 'Lấy thống kê bài tập',
    description: 'Lấy thống kê tổng quan về bài tập của user',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê bài tập',
    schema: {
      example: {
        totalQuestions: 100,
        correctAnswers: 60,
        incorrectAnswers: 40,
        accuracy: 60,
        completedExercises: 12,
        totalTimeSpent: 7200,
      },
    },
  })
  async getMyStats(@CurrentUser() user: User) {
    return this.questionsService.getUserStats(user.id);
  }

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy bài tập theo lesson',
    description: 'Lấy tất cả bài tập thuộc một lesson',
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bài tập',
    schema: {
      example: [
        {
          id: 'uuid-string',
          questionType: 'MULTIPLE_CHOICE',
          question: '_____ là sinh viên.',
          options: ['Tôi', 'Bạn', 'Anh ấy', 'Cả 3 đều đúng'],
          orderIndex: 1,
          acceptsWithoutDiacritics: true,
        },
      ],
    },
  })
  async findByLesson(@Param('lessonId') lessonId: string) {
    const exercises = await this.questionsService.findByLessonId(lessonId);
    return this.questionsService.serializeQuestions(exercises);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('exercise/:exerciseId')
  @ApiOperation({
    summary: 'Lấy bài tập theo exercise',
    description: 'Lấy tất cả bài tập thuộc một exercise',
  })
  @ApiParam({ name: 'exerciseId', description: 'ID của exercise' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bài tập của set',
  })
  async findBySet(
    @Param('exerciseId') exerciseId: string,
    @CurrentUser() user: User,
  ) {
    const exercises = await this.questionsService.findByExerciseId(
      exerciseId,
      user.id,
    );
    return this.questionsService.serializeQuestions(exercises);
  }

  @Public()
  @Get(':id')
  @ApiOperation({
    summary: 'Lấy chi tiết bài tập',
    description: 'Lấy thông tin chi tiết của một bài tập',
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết bài tập',
    schema: {
      example: {
        id: 'uuid-string',
        questionType: 'MULTIPLE_CHOICE',
        question: '_____ là sinh viên.',
        questionAudioUrl: 'https://example.com/audio.mp3',
        options: ['Tôi', 'Bạn', 'Anh ấy', 'Cả 3 đều đúng'],
        explanation: 'Cả 3 đại từ đều có thể đứng trước "là sinh viên"',
        orderIndex: 1,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async findOne(@Param('id') id: string) {
    return this.questionsService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequirePermissions(Permission.EXERCISE_CREATE)
  @ApiOperation({
    summary: 'Tạo bài tập mới',
    description: 'Tạo bài tập mới trong lesson - yêu cầu quyền Admin',
  })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({ status: 201, description: 'Tạo bài tập thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền EXERCISE_CREATE' })
  async create(@Body() createQuestionDto: CreateQuestionDto) {
    return this.questionsService.create(createQuestionDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequirePermissions(Permission.EXERCISE_UPDATE)
  @ApiOperation({
    summary: 'Cập nhật bài tập',
    description: 'Cập nhật thông tin bài tập - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiBody({ type: CreateQuestionDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền EXERCISE_UPDATE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async update(
    @Param('id') id: string,
    @Body() updateQuestionDto: Partial<CreateQuestionDto>,
  ) {
    return this.questionsService.update(id, updateQuestionDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequirePermissions(Permission.EXERCISE_DELETE)
  @ApiOperation({
    summary: 'Xóa bài tập',
    description: 'Xóa bài tập khỏi lesson - yêu cầu quyền Admin',
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiResponse({
    status: 200,
    description: 'Xóa thành công',
    schema: { example: { message: 'Exercise deleted successfully' } },
  })
  @ApiResponse({ status: 403, description: 'Không có quyền EXERCISE_DELETE' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async remove(@Param('id') id: string) {
    return this.questionsService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiOperation({
    summary: 'Nộp bài tập',
    description: 'Nộp câu trả lời cho bài tập và nhận kết quả chấm điểm.',
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiBody({
    schema: {
      example: {
        userAnswer: 'Cả 3 đều đúng',
        timeSpent: 30,
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Kết quả chấm bài',
    schema: {
      example: {
        isCorrect: true,
        correctAnswer: 'Cả 3 đều đúng',
        explanation: 'Cả 3 đại từ đều có thể đứng trước "là sinh viên"',
        score: 10,
        userAnswer: 'Cả 3 đều đúng',
        timeSpent: 30,
      },
    },
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async submitAnswer(
    @CurrentUser() user: User,
    @Param('id') questionId: string,
    @Body() body: { userAnswer: any; timeSpent?: number },
  ): Promise<SubmitAnswerResult> {
    await this.questionsService.findById(questionId);

    const result = await this.questionsService.submitAnswer(
      user.id,
      questionId,
      body.userAnswer,
      body.timeSpent,
    );

    return {
      id: result.id,
      isCorrect: result.isCorrect,
      score: result.score,
      userAnswer: result.userAnswer,
      timeTaken: result.timeTaken,
      attemptedAt: result.attemptedAt,
    };
  }
}
