import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ScenarioCharacter } from '../../domain/scenario-character.entity';

@Injectable()
export class ScenarioCharactersRepository {
  constructor(
    @InjectRepository(ScenarioCharacter)
    private readonly repository: Repository<ScenarioCharacter>,
  ) {}

  async create(data: Partial<ScenarioCharacter>): Promise<ScenarioCharacter> {
    const character = this.repository.create(data);
    return this.repository.save(character);
  }

  async findById(id: string): Promise<ScenarioCharacter | null> {
    return this.repository.findOne({
      where: { id },
      relations: ['scenario', 'scenario.category'],
    });
  }

  async update(
    id: string,
    data: Partial<ScenarioCharacter>,
  ): Promise<ScenarioCharacter> {
    await this.repository.update(id, data);
    const character = await this.findById(id);
    if (!character) {
      throw new Error('Scenario character not found after update');
    }
    return character;
  }

  async delete(id: string): Promise<void> {
    await this.repository.softDelete(id);
  }
}
