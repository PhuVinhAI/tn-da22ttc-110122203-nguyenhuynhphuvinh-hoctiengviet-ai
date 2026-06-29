import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenarioCategory } from '../../domain/scenario-category.entity';

@Injectable()
export class ScenarioCategoriesRepository {
  constructor(
    @InjectRepository(ScenarioCategory)
    private readonly repository: Repository<ScenarioCategory>,
  ) {}

  async findAll(): Promise<ScenarioCategory[]> {
    return this.repository.find({
      order: { name: 'ASC' },
      relations: ['scenarios', 'scenarios.characters'],
    });
  }

  async findById(id: string): Promise<ScenarioCategory | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['scenarios', 'scenarios.characters'],
      order: {
        scenarios: { createdAt: 'DESC' },
      },
    });
  }

  async create(data: Partial<ScenarioCategory>): Promise<ScenarioCategory> {
    const category = this.repository.create(data);
    return this.repository.save(category);
  }

  async update(
    id: string,
    data: Partial<ScenarioCategory>,
  ): Promise<ScenarioCategory> {
    await this.repository.update(id, data);
    const category = await this.findById(id);
    if (!category) {
      throw new Error('Scenario category not found after update');
    }
    return category;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
