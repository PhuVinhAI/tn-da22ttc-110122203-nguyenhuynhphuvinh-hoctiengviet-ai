import {
  Controller,
  Get,
  ParseIntPipe,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
  ApiResponse,
} from '@nestjs/swagger';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { AdminPulseService } from '../application/admin-pulse.service';
import { AdminAttentionService } from '../application/admin-attention.service';
import { AdminActivityService } from '../application/admin-activity.service';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(PermissionsGuard)
export class AdminController {
  constructor(
    private readonly pulseService: AdminPulseService,
    private readonly attentionService: AdminAttentionService,
    private readonly activityService: AdminActivityService,
  ) {}

  @Get('dashboard/pulse')
  @RequirePermissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({
    summary: 'Dashboard pulse metrics',
    description:
      'Today / yesterday / 14-day sparkline for question attempts, accuracy, completed lessons and new AI sessions.',
  })
  @ApiResponse({ status: 200, description: 'Pulse metrics' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getPulse() {
    return this.pulseService.getPulse();
  }

  @Get('dashboard/attention')
  @RequirePermissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({
    summary: 'Actionable content issues',
    description:
      'High-error questions, empty lessons, exercises without questions, vocabularies missing audio, draft courses and failed AI generations.',
  })
  @ApiResponse({ status: 200, description: 'Actionable content issues' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getAttention() {
    return this.attentionService.getAttention();
  }

  @Get('dashboard/activity')
  @RequirePermissions(Permission.SYSTEM_SETTINGS)
  @ApiOperation({
    summary: 'Daily activity trends and answer heatmap',
    description:
      'Daily series for question attempts, completed lessons, completed simulations, AI conversations and accuracy, plus weekday-hour answer heatmap.',
  })
  @ApiQuery({
    name: 'days',
    required: false,
    enum: [7, 30, 90],
    description: 'Statistics window, defaults to 30 days',
  })
  @ApiResponse({ status: 200, description: 'Daily activity series + heatmap' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin only' })
  getActivity(
    @Query('days', new ParseIntPipe({ optional: true })) days?: number,
  ) {
    return this.activityService.getActivity(days);
  }
}
