import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScenarioCategory } from './domain/scenario-category.entity';
import { Scenario } from './domain/scenario.entity';
import { ScenarioCharacter } from './domain/scenario-character.entity';
import { SimulationSession } from './domain/simulation-session.entity';
import { SimulationMessage } from './domain/simulation-message.entity';
import { SimulationResult } from './domain/simulation-result.entity';
import { ScenariosService } from './application/scenarios.service';
import { ScenariosRepository } from './application/repositories/scenarios.repository';
import { ScenarioCategoriesRepository } from './application/repositories/scenario-categories.repository';
import { SimulationsController } from './presentation/simulations.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ScenarioCategory,
      Scenario,
      ScenarioCharacter,
      SimulationSession,
      SimulationMessage,
      SimulationResult,
    ]),
  ],
  controllers: [SimulationsController],
  providers: [
    ScenariosService,
    ScenariosRepository,
    ScenarioCategoriesRepository,
  ],
  exports: [ScenariosService],
})
export class SimulationsModule {}
