import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { Permission } from '../../../common/enums';
import { CurrentUser } from '../../../common/decorators';
import { ScenariosService } from '../application/scenarios.service';
import { SimulationSessionService } from '../application/simulation-session.service';
import { SimulationResultsService } from '../application/simulation-results.service';
import { ListScenariosDto } from '../dto/list-scenarios.dto';
import { CreateSessionDto } from '../dto/create-session.dto';
import { SendMessageDto } from '../dto/send-message.dto';
import { ListResultsDto } from '../dto/list-results.dto';

@ApiTags('Simulations')
@Controller('simulations')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class SimulationsController {
  constructor(
    private readonly scenariosService: ScenariosService,
    private readonly sessionService: SimulationSessionService,
    private readonly resultsService: SimulationResultsService,
  ) {}

  @Get('categories')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Danh sách danh mục tình huống',
    description: 'Lấy tất cả danh mục tình huống, sắp xếp theo tên',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách danh mục',
    schema: {
      example: [
        {
          id: 'uuid',
          name: 'Mua sắm',
          description: 'Các tình huống mua bán tại chợ, siêu thị',
          icon: 'shopping-cart',
          color: '#FF6B6B',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  async listCategories() {
    return this.scenariosService.listCategories();
  }

  @Get('scenarios')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Danh sách tình huống mô phỏng',
    description:
      'Lấy danh sách các tình huống đã published với bộ lọc tùy chọn',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách tình huống',
    schema: {
      example: [
        {
          id: 'uuid',
          title: 'Mua rau ở chợ',
          description: 'Thực hành mua rau với người bán hàng',
          requiredLevel: 'A1',
          difficulty: 'EASY',
          estimatedMinutes: 10,
          characterCount: 2,
          category: {
            id: 'uuid',
            name: 'Mua sắm',
            icon: 'shopping-cart',
            color: '#FF6B6B',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  async listScenarios(@Query() query: ListScenariosDto) {
    return this.scenariosService.listScenarios(query);
  }

  @Get('scenarios/:id')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Chi tiết tình huống mô phỏng',
    description:
      'Lấy chi tiết tình huống bao gồm tất cả nhân vật và tiêu chí chấm điểm',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của tình huống',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết tình huống với danh sách nhân vật',
    schema: {
      example: {
        id: 'uuid',
        title: 'Mua rau ở chợ',
        description: 'Thực hành mua rau',
        systemPrompt: '...',
        openingMessage: 'Chào mừng đến chợ!',
        requiredLevel: 'A1',
        difficulty: 'EASY',
        estimatedMinutes: 10,
        isPublished: true,
        scoringCriteria: [
          { name: 'Giao tiếp', description: 'Khả năng giao tiếp', weight: 50 },
        ],
        category: { id: 'uuid', name: 'Mua sắm' },
        characters: [
          {
            id: 'uuid',
            name: 'Khách hàng',
            role: 'Người mua hàng',
            isPlayable: true,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy tình huống' })
  async getScenarioDetail(@Param('id') id: string) {
    return this.scenariosService.getScenarioDetail(id);
  }

  // ─── Session endpoints ────────────────────────────────────────────────────

  @Get('sessions/active')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Lấy phiên đang hoạt động/tạm dừng',
    description:
      'Lấy phiên ACTIVE hoặc PAUSED của người dùng hiện tại. Trả về null nếu không có.',
  })
  @ApiResponse({
    status: 200,
    description: 'Thông tin phiên đang hoạt động hoặc null',
    schema: {
      oneOf: [
        { type: 'null' },
        {
          example: {
            id: 'uuid',
            scenarioId: 'uuid',
            scenarioTitle: 'Mua rau ở chợ',
            chosenCharacterId: 'uuid',
            chosenCharacterName: 'Khách hàng',
            status: 'ACTIVE',
            nextTurnCharacterId: 'uuid',
          },
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  async getActiveSession(@CurrentUser() user: { id: string }) {
    return this.sessionService.getActiveSession(user.id);
  }

  @Post('sessions')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Tạo phiên mô phỏng mới',
    description:
      'Tạo một phiên mô phỏng mới. Mỗi người dùng chỉ được có 1 phiên chưa hoàn thành (ACTIVE hoặc PAUSED) tại một thời điểm.',
  })
  @ApiResponse({
    status: 201,
    description: 'Phiên được tạo thành công',
    schema: {
      example: {
        session: {
          id: 'uuid',
          scenarioId: 'uuid',
          chosenCharacterId: 'uuid',
          status: 'ACTIVE',
          totalTokens: 0,
        },
        openingMessage: {
          id: 'uuid',
          content: 'Chào mừng đến chợ!',
          isLearner: false,
          speakerCharacterId: null,
          orderIndex: 0,
        },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  @ApiResponse({
    status: 404,
    description: 'Tình huống không tồn tại hoặc nhân vật không hợp lệ',
  })
  @ApiResponse({
    status: 409,
    description: 'Người dùng đang có phiên chưa hoàn thành',
  })
  async createSession(
    @CurrentUser() user: { id: string },
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionService.createSession(user.id, dto);
  }

  @Get('sessions/:id')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Lấy phiên mô phỏng với lịch sử tin nhắn (resume)',
    description:
      'Lấy thông tin phiên cùng toàn bộ tin nhắn. Nếu phiên đang PAUSED, tự động chuyển về ACTIVE.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phiên mô phỏng',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Phiên với lịch sử tin nhắn',
    schema: {
      example: {
        session: {
          id: 'uuid',
          status: 'ACTIVE',
          scenarioId: 'uuid',
          chosenCharacterId: 'uuid',
        },
        messages: [
          {
            id: 'uuid',
            content: 'Chào mừng!',
            isLearner: false,
            orderIndex: 0,
          },
        ],
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({
    status: 403,
    description: 'Phiên không thuộc về người dùng này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiên' })
  async getSession(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
  ) {
    return this.sessionService.getSessionWithMessages(user.id, sessionId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Hủy phiên mô phỏng',
    description:
      'Hủy phiên mô phỏng (soft-delete). Không tạo SimulationResult.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phiên mô phỏng',
    example: 'uuid-string',
  })
  @ApiResponse({ status: 204, description: 'Phiên đã được hủy thành công' })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({
    status: 403,
    description: 'Phiên không thuộc về người dùng này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiên' })
  async cancelSession(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
  ) {
    await this.sessionService.cancelSession(user.id, sessionId);
  }

  @Delete('sessions/:id/messages/pending-learner')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Hoàn tác tin nhắn học viên chưa gửi xong',
    description:
      'Soft-delete tin nhắn học viên cuối cùng khi lượt AI chưa hoàn tất (lỗi hoặc client hủy). Không làm gì nếu không có tin cần hoàn tác.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phiên mô phỏng',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 204,
    description: 'Đã hoàn tác hoặc không có tin cần xóa',
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({
    status: 403,
    description: 'Phiên không thuộc về người dùng này',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiên' })
  async revertPendingLearnerMessage(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
  ) {
    await this.sessionService.revertPendingLearnerMessage(user.id, sessionId);
  }

  @Post('sessions/:id/messages')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Gửi tin nhắn trong phiên mô phỏng',
    description:
      'Gửi tin nhắn của học viên, nhận phản hồi AI kèm nhận xét. AI có thể trả lời bằng nhiều nhân vật trong một response.',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của phiên mô phỏng',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 201,
    description: 'AI phản hồi kèm feedback',
    schema: {
      example: {
        messages: [
          {
            speakerCharacterId: 'uuid',
            speakerName: 'Chị Lan',
            content: 'Chào em, em muốn mua gì?',
          },
        ],
        nextTurnCharacterId: 'uuid',
        feedback: {
          corrections: [
            {
              original: 'cho tôi',
              corrected: 'cho tôi',
              type: 'spelling',
              severity: 'error',
              startIndex: 0,
              endIndex: 7,
            },
          ],
          review: 'Check your spelling',
          reviewAvailable: true,
        },
        sessionEnded: false,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền hoặc phiên không thuộc về bạn',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy phiên' })
  @ApiResponse({
    status: 400,
    description: 'Phiên không hoạt động hoặc không phải lượt của bạn',
  })
  async sendMessage(
    @CurrentUser() user: { id: string },
    @Param('id') sessionId: string,
    @Body() dto: SendMessageDto,
  ) {
    return this.sessionService.sendMessage(user.id, sessionId, dto.content);
  }

  // ─── Results endpoints ────────────────────────────────────────────────────

  @Get('results')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Danh sách kết quả mô phỏng',
    description:
      'Lấy danh sách kết quả mô phỏng của người dùng hiện tại, sắp xếp theo mới nhất. Có thể lọc theo scenarioId.',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách kết quả mô phỏng',
    schema: {
      example: [
        {
          id: 'uuid',
          totalScore: 85,
          endReason: 'COMPLETED',
          createdAt: '2025-01-01T00:00:00.000Z',
          scenarioTitle: 'Mua rau ở chợ',
          chosenCharacterName: 'Khách hàng',
        },
      ],
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  async listResults(
    @CurrentUser() user: { id: string },
    @Query() query: ListResultsDto,
  ) {
    return this.resultsService.listResults(user.id, query);
  }

  @Get('results/:id')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Chi tiết kết quả mô phỏng',
    description:
      'Lấy chi tiết kết quả mô phỏng bao gồm điểm số theo tiêu chí và nhận xét AI',
  })
  @ApiParam({
    name: 'id',
    description: 'ID của kết quả mô phỏng',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết kết quả mô phỏng',
    schema: {
      example: {
        id: 'uuid',
        totalScore: 85,
        criteriaScores: [
          { name: 'Vocabulary', score: 90, comment: 'Good' },
          { name: 'Grammar', score: 80, comment: 'Fair' },
        ],
        endReason: 'COMPLETED',
        aiSummary: 'Well done!',
        totalMessages: 10,
        scenario: { id: 'uuid', title: 'Mua rau ở chợ' },
        chosenCharacter: { id: 'uuid', name: 'Khách hàng' },
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền hoặc kết quả không thuộc về bạn',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy kết quả' })
  async getResultDetail(
    @CurrentUser() user: { id: string },
    @Param('id') resultId: string,
  ) {
    return this.resultsService.getResultDetail(user.id, resultId);
  }

  @Get('stats')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Thống kê mô phỏng',
    description:
      'Lấy thống kê mô phỏng của người dùng: số tình huống đã thử và điểm trung bình',
  })
  @ApiResponse({
    status: 200,
    description: 'Thống kê mô phỏng',
    schema: {
      example: {
        scenariosAttempted: 5,
        averageScore: 72.5,
      },
    },
  })
  @ApiResponse({ status: 401, description: 'Chưa đăng nhập' })
  @ApiResponse({ status: 403, description: 'Không có quyền SIMULATION_ACCESS' })
  async getStats(@CurrentUser() user: { id: string }) {
    return this.resultsService.getStats(user.id);
  }
}
