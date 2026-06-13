import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminLearnersService } from '../application/admin-learners.service';
import { AdminLearnerAnalyticsService } from '../application/admin-learner-analytics.service';

@ApiTags('Admin Learners')
@ApiBearerAuth()
@Controller('admin/learners')
@UseGuards(PermissionsGuard)
export class AdminLearnersController {
  constructor(
    private readonly service: AdminLearnersService,
    private readonly analyticsService: AdminLearnerAnalyticsService,
  ) {}

  @Get()
  @RequirePermissions(Permission.USER_LIST)
  @ApiOperation({ summary: 'List learners for admin workspace' })
  findAll() {
    return this.service.findAll();
  }

  /**
   * Bảng phân tích tổng hợp cho từng học viên — thay cho findOne cũ.
   * Trả về toàn bộ dữ liệu chart/heatmap/insights để render dashboard
   * "Học viên 360°" trên admin.
   */
  @Get(':userId')
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get learner analytics dashboard payload' })
  getAnalytics(@Param('userId') userId: string) {
    return this.analyticsService.getAnalytics(userId);
  }

  @Get(':userId/conversations/:conversationId')
  @RequirePermissions(Permission.AI_VIEW_CONVERSATIONS)
  @ApiOperation({ summary: 'Get learner AI conversation detail' })
  findConversation(
    @Param('userId') userId: string,
    @Param('conversationId') conversationId: string,
  ) {
    return this.service.findConversation(userId, conversationId);
  }

  @Get(':userId/simulations/:sessionId')
  @RequirePermissions(Permission.PROGRESS_VIEW_ALL)
  @ApiOperation({ summary: 'Get learner simulation session detail' })
  findSimulation(
    @Param('userId') userId: string,
    @Param('sessionId') sessionId: string,
  ) {
    return this.service.findSimulation(userId, sessionId);
  }
}
