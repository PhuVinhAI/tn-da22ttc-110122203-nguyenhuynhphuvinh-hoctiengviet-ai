import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, Repository } from 'typeorm';
import { Scenario } from '../../domain/scenario.entity';
import { Difficulty, UserLevel } from '../../../../common/enums';

export interface ScenarioFilter {
  categoryId?: string;
  level?: UserLevel;
  difficulty?: Difficulty;
}

@Injectable()
export class ScenariosRepository {
  constructor(
    @InjectRepository(Scenario)
    private readonly repository: Repository<Scenario>,
  ) {}

  async findPublished(filter: ScenarioFilter = {}): Promise<Scenario[]> {
    const where: FindOptionsWhere<Scenario> = { isPublished: true };

    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }
    if (filter.level) {
      where.requiredLevel = filter.level;
    }
    if (filter.difficulty) {
      where.difficulty = filter.difficulty;
    }

    return this.repository.find({
      where,
      relations: ['category', 'characters'],
      order: { createdAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<Scenario | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['category', 'characters'],
      order: {
        characters: { orderIndex: 'ASC' },
      },
    });
  }
}
