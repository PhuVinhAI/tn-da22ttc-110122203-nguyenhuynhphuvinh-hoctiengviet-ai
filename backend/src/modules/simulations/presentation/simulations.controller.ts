import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
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
import { ScenariosService } from '../application/scenarios.service';
import { ListScenariosDto } from '../dto/list-scenarios.dto';

@ApiTags('Simulations')
@Controller('simulations')
@UseGuards(PermissionsGuard)
@ApiBearerAuth()
export class SimulationsController {
  constructor(private readonly scenariosService: ScenariosService) {}

  @Get('categories')
  @RequirePermissions(Permission.SIMULATION_ACCESS)
  @ApiOperation({
    summary: 'Danh sách danh mục tình huống',
    description: 'Lấy tất cả danh mục tình huống, sắp xếp theo orderIndex',
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
          orderIndex: 1,
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
            orderIndex: 1,
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
}
