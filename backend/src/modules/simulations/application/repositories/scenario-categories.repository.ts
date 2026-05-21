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
      order: { orderIndex: 'ASC' },
    });
  }
}
