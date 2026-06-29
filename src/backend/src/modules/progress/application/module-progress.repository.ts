import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import {
  LearningUnitType,
  ModuleProgress,
} from '../domain/learning-progress.entity';

@Injectable()
export class ModuleProgressRepository {
  constructor(
    @InjectRepository(ModuleProgress)
    private readonly repository: Repository<ModuleProgress>,
  ) {}

  async create(data: Partial<ModuleProgress>): Promise<ModuleProgress> {
    const progress = this.repository.create({
      ...data,
      unitType: LearningUnitType.MODULE,
    });
    return this.repository.save(progress);
  }

  async findByUserAndModule(
    userId: string,
    moduleId: string,
  ): Promise<ModuleProgress | null> {
    return this.repository.findOne({
      where: { userId, moduleId, unitType: LearningUnitType.MODULE },
    });
  }

  async update(
    id: string,
    data: Partial<ModuleProgress>,
  ): Promise<ModuleProgress> {
    await this.repository.update(id, data);
    const progress = await this.repository.findOne({ where: { id } });
    if (!progress) {
      throw new Error('Module progress not found after update');
    }
    return progress;
  }

  async findCompletedByUserInModules(
    userId: string,
    moduleIds: string[],
  ): Promise<ModuleProgress[]> {
    return this.repository.find({
      where: {
        userId,
        moduleId: In(moduleIds),
        unitType: LearningUnitType.MODULE,
        status: 'completed' as any,
      },
    });
  }

  async findCompletedByModule(moduleId: string): Promise<ModuleProgress[]> {
    return this.repository.find({
      where: {
        moduleId,
        unitType: LearningUnitType.MODULE,
        status: 'completed' as any,
      },
    });
  }
}
