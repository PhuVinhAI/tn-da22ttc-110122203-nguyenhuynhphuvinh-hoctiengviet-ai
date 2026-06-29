import { Controller, Get, UseGuards } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { DailyGoalProgressService } from '../application/daily-goal-progress.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';

@ApiTags('Daily Goals Progress')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('daily-goals/progress')
export class DailyGoalProgressController {
  constructor(private readonly progressService: DailyGoalProgressService) {}

  @Get('today')
  @ApiOperation({
    summary: 'Lấy tiến trình hôm nay',
    description:
      'Trả về progress hôm nay cho tất cả active goals + allGoalsMet boolean',
  })
  @ApiResponse({ status: 200, description: 'Tiến trình hôm nay' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  getTodayProgress(@CurrentUser() user: User) {
    return this.progressService.getTodayProgress(user.id);
  }
}
