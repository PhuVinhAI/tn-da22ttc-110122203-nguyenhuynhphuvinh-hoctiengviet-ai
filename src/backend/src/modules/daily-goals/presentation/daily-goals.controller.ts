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
} from '@nestjs/swagger';
import { DailyGoalsService } from '../application/daily-goals.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../../../common/decorators';
import { User } from '../../users/domain/user.entity';
import { CreateDailyGoalDto } from '../dto/create-daily-goal.dto';
import { UpdateDailyGoalDto } from '../dto/update-daily-goal.dto';

@ApiTags('Daily Goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('daily-goals')
export class DailyGoalsController {
  constructor(private readonly dailyGoalsService: DailyGoalsService) {}

  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách mục tiêu ngày',
    description: 'Lấy tất cả mục tiêu ngày của user đang đăng nhập',
  })
  @ApiResponse({ status: 200, description: 'Danh sách mục tiêu' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  findAll(@CurrentUser() user: User) {
    return this.dailyGoalsService.findAll(user.id);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo mục tiêu ngày mới',
    description:
      'Tạo mục tiêu ngày. Mỗi goalType chỉ có 1 goal per user. Range: QUESTIONS 1-50, SIMULATIONS 1-10, LESSONS 1-10',
  })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({
    status: 400,
    description: 'GoalType đã tồn tại hoặc targetValue ngoài range',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  create(@CurrentUser() user: User, @Body() createDto: CreateDailyGoalDto) {
    return this.dailyGoalsService.create(
      user.id,
      createDto.goalType,
      createDto.targetValue,
    );
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Cập nhật mục tiêu ngày',
    description: 'Chỉ cập nhật targetValue, không đổi goalType',
  })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mục tiêu' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  update(@Param('id') id: string, @Body() updateDto: UpdateDailyGoalDto) {
    return this.dailyGoalsService.update(id, updateDto.targetValue);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Xoá mục tiêu ngày',
    description: 'Xoá vĩnh viễn (hard delete)',
  })
  @ApiResponse({ status: 200, description: 'Xoá thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy mục tiêu' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  delete(@Param('id') id: string) {
    return this.dailyGoalsService.delete(id);
  }
}
