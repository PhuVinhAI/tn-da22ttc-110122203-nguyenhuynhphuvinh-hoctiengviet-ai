import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { AdminLearnersService } from '../application/admin-learners.service';

@ApiTags('Admin Learners')
@ApiBearerAuth()
@Controller('admin/learners')
@UseGuards(PermissionsGuard)
export class AdminLearnersController {
  constructor(private readonly service: AdminLearnersService) {}

  @Get()
  @RequirePermissions(Permission.USER_LIST)
  @ApiOperation({ summary: 'List learners for admin workspace' })
  findAll() {
    return this.service.findAll();
  }

  @Get(':userId')
  @RequirePermissions(Permission.USER_READ)
  @ApiOperation({ summary: 'Get learner profile and learning data' })
  findOne(@Param('userId') userId: string) {
    return this.service.findOne(userId);
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
