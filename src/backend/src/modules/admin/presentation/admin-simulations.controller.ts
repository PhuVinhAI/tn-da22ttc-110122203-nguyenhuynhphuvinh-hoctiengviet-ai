import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { RequirePermissions } from '../../../common/decorators';
import { Permission } from '../../../common/enums';
import { PermissionsGuard } from '../../../common/guards/permissions.guard';
import { ScenarioCategory } from '../../simulations/domain/scenario-category.entity';
import { Scenario } from '../../simulations/domain/scenario.entity';
import { ScenarioCharacter } from '../../simulations/domain/scenario-character.entity';
import { AdminSimulationsService } from '../application/admin-simulations.service';
import { SetPublishedDto } from '../dto/set-published.dto';

@ApiTags('Admin Simulations')
@ApiBearerAuth()
@Controller('admin/simulations')
@UseGuards(PermissionsGuard)
@RequirePermissions(Permission.ADMIN_ACCESS)
export class AdminSimulationsController {
  constructor(
    private readonly adminSimulationsService: AdminSimulationsService,
  ) {}

  @Get('categories')
  listCategories() {
    return this.adminSimulationsService.listCategories();
  }

  @Post('categories')
  createCategory(@Body() dto: Partial<ScenarioCategory>) {
    return this.adminSimulationsService.createCategory(dto);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() dto: Partial<ScenarioCategory>,
  ) {
    return this.adminSimulationsService.updateCategory(id, dto);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id') id: string) {
    return this.adminSimulationsService.deleteCategory(id);
  }

  @Get('categories/:id')
  getCategory(@Param('id') id: string) {
    return this.adminSimulationsService.getCategory(id);
  }

  @Post('categories/:categoryId/scenarios')
  createScenario(
    @Param('categoryId') categoryId: string,
    @Body() dto: Partial<Scenario>,
  ) {
    return this.adminSimulationsService.createScenario(categoryId, dto);
  }

  @Patch('scenarios/:id')
  updateScenario(@Param('id') id: string, @Body() dto: Partial<Scenario>) {
    return this.adminSimulationsService.updateScenario(id, dto);
  }

  @Patch('scenarios/:id/publish')
  setScenarioPublished(@Param('id') id: string, @Body() dto: SetPublishedDto) {
    return this.adminSimulationsService.setScenarioPublished(
      id,
      dto.isPublished,
    );
  }

  @Delete('scenarios/:id')
  deleteScenario(@Param('id') id: string) {
    return this.adminSimulationsService.deleteScenario(id);
  }

  @Get('scenarios/:id')
  getScenario(@Param('id') id: string) {
    return this.adminSimulationsService.getScenario(id);
  }

  @Post('scenarios/:scenarioId/characters')
  createCharacter(
    @Param('scenarioId') scenarioId: string,
    @Body() dto: Partial<ScenarioCharacter>,
  ) {
    return this.adminSimulationsService.createCharacter(scenarioId, dto);
  }

  @Patch('characters/:id')
  updateCharacter(
    @Param('id') id: string,
    @Body() dto: Partial<ScenarioCharacter>,
  ) {
    return this.adminSimulationsService.updateCharacter(id, dto);
  }

  @Delete('characters/:id')
  deleteCharacter(@Param('id') id: string) {
    return this.adminSimulationsService.deleteCharacter(id);
  }
}
