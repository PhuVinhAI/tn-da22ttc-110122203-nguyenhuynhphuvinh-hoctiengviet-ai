import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, In, Repository } from 'typeorm';
import { SimulationSession } from '../../domain/simulation-session.entity';
import { SimulationSessionStatus } from '../../../../common/enums';

@Injectable()
export class SimulationSessionsRepository {
  constructor(
    @InjectRepository(SimulationSession)
    private readonly repository: Repository<SimulationSession>,
  ) {}

  async findIncompleteByUser(
    userId: string,
  ): Promise<SimulationSession | null> {
    return this.repository.findOne({
      where: {
        userId,
        status: In([
          SimulationSessionStatus.ACTIVE,
          SimulationSessionStatus.PAUSED,
        ]),
        deletedAt: IsNull(),
      },
    });
  }

  async create(data: {
    userId: string;
    scenarioId: string;
    chosenCharacterId: string;
    status: SimulationSessionStatus;
    nextTurnCharacterId: string;
  }): Promise<SimulationSession> {
    const session = this.repository.create(data);
    return this.repository.save(session);
  }

  async findIncompleteByUserWithRelations(
    userId: string,
  ): Promise<SimulationSession | null> {
    return this.repository.findOne({
      where: {
        userId,
        status: In([
          SimulationSessionStatus.ACTIVE,
          SimulationSessionStatus.PAUSED,
        ]),
        deletedAt: IsNull(),
      },
      relations: ['scenario', 'chosenCharacter'],
    });
  }

  async findByIdWithMessages(
    sessionId: string,
  ): Promise<SimulationSession | null> {
    return this.repository.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
      relations: [
        'messages',
        'messages.speakerCharacter',
        'chosenCharacter',
        'scenario',
        'scenario.characters',
      ],
      order: {
        messages: { orderIndex: 'ASC' },
      },
    });
  }

  async findById(sessionId: string): Promise<SimulationSession | null> {
    return this.repository.findOne({
      where: { id: sessionId, deletedAt: IsNull() },
    });
  }

  async updateStatus(
    sessionId: string,
    status: SimulationSessionStatus,
  ): Promise<void> {
    await this.repository.update({ id: sessionId }, { status });
  }

  async updateNextTurnCharacterId(
    sessionId: string,
    nextTurnCharacterId: string,
  ): Promise<void> {
    await this.repository.update({ id: sessionId }, { nextTurnCharacterId });
  }

  async incrementTokens(sessionId: string, tokenCount: number): Promise<void> {
    await this.repository.increment(
      { id: sessionId },
      'totalTokens',
      tokenCount,
    );
  }

  async softDelete(sessionId: string): Promise<void> {
    await this.repository.softDelete({ id: sessionId });
  }
}
