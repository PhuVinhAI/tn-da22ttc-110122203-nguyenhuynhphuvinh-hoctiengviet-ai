import { Injectable, NotFoundException } from '@nestjs/common';
import {
  ScenariosRepository,
  ScenarioFilter,
} from './repositories/scenarios.repository';
import { ScenarioCategoriesRepository } from './repositories/scenario-categories.repository';
import { ScenarioCategory } from '../domain/scenario-category.entity';
import { Scenario } from '../domain/scenario.entity';

export interface ScenarioListItem {
  id: string;
  title: string;
  description: string;
  requiredLevel: string;
  difficulty: string;
  estimatedMinutes: number;
  characterCount: number;
  category: { id: string; name: string; icon: string; color: string } | null;
}

export interface ScenarioDetail extends Scenario {
  characters: Scenario['characters'];
}

@Injectable()
export class ScenariosService {
  constructor(
    private readonly scenariosRepository: ScenariosRepository,
    private readonly categoriesRepository: ScenarioCategoriesRepository,
  ) {}

  async listCategories(): Promise<ScenarioCategory[]> {
    return this.categoriesRepository.findAll();
  }

  async listScenarios(filter: ScenarioFilter): Promise<ScenarioListItem[]> {
    const scenarios = await this.scenariosRepository.findPublished(filter);

    return scenarios.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      requiredLevel: s.requiredLevel,
      difficulty: s.difficulty,
      estimatedMinutes: s.estimatedMinutes,
      characterCount: s.characters ? s.characters.length : 0,
      category: s.category
        ? {
            id: s.category.id,
            name: s.category.name,
            icon: s.category.icon,
            color: s.category.color,
          }
        : null,
    }));
  }

  async getScenarioDetail(
    id: string,
  ): Promise<Scenario & { characterCount: number }> {
    const scenario = await this.scenariosRepository.findById(id);
    if (!scenario) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }
    return {
      ...scenario,
      characterCount: scenario.characters?.length ?? 0,
    };
  }
}
