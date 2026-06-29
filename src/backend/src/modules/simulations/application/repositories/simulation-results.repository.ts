import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  SimulationResult,
  SimulationSession,
} from '../../domain/simulation-session.entity';
import {
  SimulationEndReason,
  SimulationSessionStatus,
} from '../../../../common/enums';

@Injectable()
export class SimulationResultsRepository {
  constructor(
    @InjectRepository(SimulationSession)
    private readonly repository: Repository<SimulationSession>,
  ) {}

  async create(data: {
    userId: string;
    sessionId: string;
    scenarioId: string;
    chosenCharacterId: string;
    totalScore: number;
    criteriaScores: SimulationResult['criteriaScores'];
    endReason: SimulationEndReason;
    aiSummary: string;
    totalMessages: number;
  }): Promise<SimulationResult> {
    const session = await this.repository.findOne({
      where: { id: data.sessionId },
    });
    if (!session) {
      throw new Error('Simulation session not found while saving result');
    }

    Object.assign(session, {
      status: SimulationSessionStatus.COMPLETED,
      totalScore: data.totalScore,
      criteriaScores: data.criteriaScores,
      endReason: data.endReason,
      aiSummary: data.aiSummary,
      totalMessages: data.totalMessages,
      resultCreatedAt: new Date(),
    });

    return this.repository.save(session);
  }

  async findByUserId(
    userId: string,
    scenarioId?: string,
  ): Promise<SimulationResult[]> {
    const where: any = {
      userId,
      status: SimulationSessionStatus.COMPLETED,
    };
    if (scenarioId) where.scenarioId = scenarioId;

    return this.repository.find({
      where,
      relations: ['scenario', 'chosenCharacter'],
      order: { resultCreatedAt: 'DESC' },
    });
  }

  async findById(id: string): Promise<SimulationResult | null> {
    return this.repository.findOne({
      where: { id, status: SimulationSessionStatus.COMPLETED },
      relations: ['scenario', 'chosenCharacter'],
    });
  }

  async getUserStats(userId: string): Promise<{
    scenariosAttempted: number;
    averageScore: number;
  }> {
    const result = await this.repository
      .createQueryBuilder('r')
      .select('COUNT(DISTINCT r.scenarioId)', 'scenariosAttempted')
      .addSelect('COALESCE(AVG(r.totalScore), 0)', 'averageScore')
      .where('r.userId = :userId', { userId })
      .andWhere('r.status = :status', {
        status: SimulationSessionStatus.COMPLETED,
      })
      .andWhere('r.totalScore IS NOT NULL')
      .getRawOne();

    return {
      scenariosAttempted: parseInt(result?.scenariosAttempted ?? '0', 10) || 0,
      averageScore: parseFloat(result?.averageScore ?? '0') || 0,
    };
  }

  async countByUserIdAndDateRange(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<number> {
    return this.repository
      .createQueryBuilder('r')
      .where('r.userId = :userId', { userId })
      .andWhere('r.status = :status', {
        status: SimulationSessionStatus.COMPLETED,
      })
      .andWhere('r.resultCreatedAt >= :start', { start })
      .andWhere('r.resultCreatedAt <= :end', { end })
      .getCount();
  }
}
