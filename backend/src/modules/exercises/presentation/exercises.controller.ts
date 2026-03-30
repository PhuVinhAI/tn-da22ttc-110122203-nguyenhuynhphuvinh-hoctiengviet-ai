import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiParam, ApiBody } from '@nestjs/swagger';
import { ExercisesService } from '../application/exercises.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';
import { Public } from '../../../common/decorators';
import { CreateExerciseDto } from '../dto/create-exercise.dto';

@ApiTags('Exercises')
@Controller('exercises')
export class ExercisesController {
  constructor(private readonly exercisesService: ExercisesService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-results')
  @ApiOperation({ 
    summary: 'Lấy kết quả bài tập của user',
    description: 'Lấy lịch sử làm bài tập của user hiện tại'
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách kết quả bài tập',
    schema: {
      example: [
        {
          id: 'uuid-string',
          exerciseId: 'exercise-uuid',
          userAnswer: 'Câu trả lời',
          isCorrect: true,
          timeSpent: 30,
          completedAt: '2024-01-01T00:00:00.000Z'
        }
      ]
    }
  })
  async getMyResults(@CurrentUser() user: User) {
    return this.exercisesService.getUserResults(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-stats')
  @ApiOperation({ 
    summary: 'Lấy thống kê bài tập',
    description: 'Lấy thống kê tổng quan về bài tập của user'
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê bài tập',
    schema: {
      example: {
        totalExercises: 100,
        completedExercises: 75,
        correctAnswers: 60,
        accuracy: 80,
        totalTimeSpent: 3600
      }
    }
  })
  async getMyStats(@CurrentUser() user: User) {
    return this.exercisesService.getUserStats(user.id);
  }

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({ 
    summary: 'Lấy bài tập theo lesson',
    description: 'Lấy tất cả bài tập thuộc một lesson'
  })
  @ApiParam({ name: 'lessonId', description: 'ID của lesson' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách bài tập',
    schema: {
      example: [
        {
          id: 'uuid-string',
          exerciseType: 'MULTIPLE_CHOICE',
          question: '_____ là sinh viên.',
          options: ['Tôi', 'Bạn', 'Anh ấy', 'Cả 3 đều đúng'],
          orderIndex: 1,
          difficultyLevel: 1
        }
      ]
    }
  })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.exercisesService.findByLessonId(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ 
    summary: 'Lấy chi tiết bài tập',
    description: 'Lấy thông tin chi tiết của một bài tập'
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết bài tập',
    schema: {
      example: {
        id: 'uuid-string',
        exerciseType: 'MULTIPLE_CHOICE',
        question: '_____ là sinh viên.',
        questionAudioUrl: 'https://example.com/audio.mp3',
        options: ['Tôi', 'Bạn', 'Anh ấy', 'Cả 3 đều đúng'],
        explanation: 'Cả 3 đại từ đều có thể đứng trước "là sinh viên"',
        orderIndex: 1,
        difficultyLevel: 1
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async findOne(@Param('id') id: string) {
    return this.exercisesService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ 
    summary: 'Tạo bài tập mới',
    description: 'Tạo bài tập mới trong lesson - yêu cầu quyền Admin'
  })
  @ApiBody({ type: CreateExerciseDto })
  @ApiResponse({ status: 201, description: 'Tạo bài tập thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  async create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ 
    summary: 'Cập nhật bài tập',
    description: 'Cập nhật thông tin bài tập - yêu cầu quyền Admin'
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiBody({ type: CreateExerciseDto })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async update(@Param('id') id: string, @Body() updateExerciseDto: Partial<CreateExerciseDto>) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ 
    summary: 'Xóa bài tập',
    description: 'Xóa bài tập khỏi lesson - yêu cầu quyền Admin'
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiResponse({ 
    status: 200, 
    description: 'Xóa thành công',
    schema: { example: { message: 'Exercise deleted successfully' } }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async remove(@Param('id') id: string) {
    return this.exercisesService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiOperation({ 
    summary: 'Nộp bài tập',
    description: 'Nộp câu trả lời cho bài tập và nhận kết quả chấm điểm'
  })
  @ApiParam({ name: 'id', description: 'ID của bài tập' })
  @ApiBody({
    schema: {
      example: {
        userAnswer: 'Cả 3 đều đúng',
        timeSpent: 30
      }
    }
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
        timeSpent: 30
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy bài tập' })
  async submitAnswer(
    @CurrentUser() user: User,
    @Param('id') exerciseId: string,
    @Body() body: { userAnswer: any; timeSpent?: number },
  ) {
    return this.exercisesService.submitAnswer(
      user.id,
      exerciseId,
      body.userAnswer,
      body.timeSpent,
    );
  }
}
