import { Injectable, NotFoundException } from '@nestjs/common';
import { ScenarioCategory } from '../../simulations/domain/scenario-category.entity';
import { Scenario } from '../../simulations/domain/scenario.entity';
import { ScenarioCharacter } from '../../simulations/domain/scenario-character.entity';
import { ScenarioCategoriesRepository } from '../../simulations/application/repositories/scenario-categories.repository';
import { ScenariosRepository } from '../../simulations/application/repositories/scenarios.repository';
import { ScenarioCharactersRepository } from '../../simulations/application/repositories/scenario-characters.repository';

@Injectable()
export class AdminSimulationsService {
  constructor(
    private readonly categoriesRepository: ScenarioCategoriesRepository,
    private readonly scenariosRepository: ScenariosRepository,
    private readonly charactersRepository: ScenarioCharactersRepository,
  ) {}

  async listCategories() {
    return this.categoriesRepository.findAll();
  }

  async createCategory(dto: Partial<ScenarioCategory>) {
    return this.categoriesRepository.create(dto);
  }

  async updateCategory(id: string, dto: Partial<ScenarioCategory>) {
    return this.categoriesRepository.update(id, dto);
  }

  async deleteCategory(id: string) {
    await this.categoriesRepository.delete(id);
    return { success: true };
  }

  async getCategory(id: string) {
    const category = await this.categoriesRepository.findById(id);
    if (!category) {
      throw new NotFoundException(`Scenario category with ID ${id} not found`);
    }
    return category;
  }

  async createScenario(categoryId: string, dto: Partial<Scenario>) {
    return this.scenariosRepository.create({ ...dto, categoryId });
  }

  async updateScenario(id: string, dto: Partial<Scenario>) {
    return this.scenariosRepository.update(id, dto);
  }

  async deleteScenario(id: string) {
    await this.scenariosRepository.delete(id);
    return { success: true };
  }

  async getScenario(id: string) {
    const scenario = await this.scenariosRepository.findById(id);
    if (!scenario) {
      throw new NotFoundException(`Scenario with ID ${id} not found`);
    }
    return scenario;
  }

  async createCharacter(scenarioId: string, dto: Partial<ScenarioCharacter>) {
    return this.charactersRepository.create({ ...dto, scenarioId });
  }

  async updateCharacter(id: string, dto: Partial<ScenarioCharacter>) {
    return this.charactersRepository.update(id, dto);
  }

  async deleteCharacter(id: string) {
    await this.charactersRepository.delete(id);
    return { success: true };
  }
}
