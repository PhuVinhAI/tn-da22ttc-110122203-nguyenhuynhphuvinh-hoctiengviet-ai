import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ExerciseSetService } from '../application/exercise-set.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';

@ApiTags('Exercise Sets')
@Controller('exercise-sets')
export class ExerciseSetController {
  constructor(private readonly exerciseSetService: ExerciseSetService) {}

  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @Get('lesson/:lessonId')
  @ApiOperation({
    summary: 'Lấy exercise sets theo lesson',
    description:
      'Lấy danh sách active exercise sets theo tier với progress stats và unlockedTiers',
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
