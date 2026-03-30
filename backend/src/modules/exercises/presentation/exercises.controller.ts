import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
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
  @ApiOperation({ summary: 'Lấy kết quả bài tập của user' })
  async getMyResults(@CurrentUser() user: User) {
    return this.exercisesService.getUserResults(user.id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('my-stats')
  @ApiOperation({ summary: 'Lấy thống kê bài tập' })
  async getMyStats(@CurrentUser() user: User) {
    return this.exercisesService.getUserStats(user.id);
  }

  @Public()
  @Get('lesson/:lessonId')
  @ApiOperation({ summary: 'Lấy bài tập theo lesson' })
  async findByLesson(@Param('lessonId') lessonId: string) {
    return this.exercisesService.findByLessonId(lessonId);
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bài tập' })
  async findOne(@Param('id') id: string) {
    return this.exercisesService.findById(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiOperation({ summary: 'Tạo bài tập mới' })
  async create(@Body() createExerciseDto: CreateExerciseDto) {
    return this.exercisesService.create(createExerciseDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật bài tập' })
  async update(@Param('id') id: string, @Body() updateExerciseDto: Partial<CreateExerciseDto>) {
    return this.exercisesService.update(id, updateExerciseDto);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiOperation({ summary: 'Xóa bài tập' })
  async remove(@Param('id') id: string) {
    return this.exercisesService.delete(id);
  }

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Post(':id/submit')
  @ApiOperation({ summary: 'Nộp bài tập' })
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
