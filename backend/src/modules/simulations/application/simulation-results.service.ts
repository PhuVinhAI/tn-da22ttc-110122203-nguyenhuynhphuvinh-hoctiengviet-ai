import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SimulationResultsRepository } from './repositories/simulation-results.repository';

export interface ResultListItem {
  id: string;
  totalScore: number;
  endReason: string;
  createdAt: Date;
  scenarioId: string;
  scenarioTitle: string;
  chosenCharacterName: string;
}

export interface ResultDetail {
  id: string;
  userId: string;
  sessionId: string;
  scenarioId: string;
  chosenCharacterId: string;
  totalScore: number;
  criteriaScores: Array<{
    name: string;
    score: number;
    comment: string;
  }>;
  endReason: string;
  aiSummary: string;
  totalMessages: number;
  createdAt: Date;
  updatedAt: Date;
  scenario: { id: string; title: string };
  chosenCharacter: { id: string; name: string };
}

export interface SimulationStats {
  scenariosAttempted: number;
  averageScore: number;
}

@Injectable()
export class SimulationResultsService {
  constructor(
    private readonly resultsRepository: SimulationResultsRepository,
  ) {}

  async listResults(
    userId: string,
    filter: { scenarioId?: string },
  ): Promise<ResultListItem[]> {
    const results = await this.resultsRepository.findByUserId(
      userId,
      filter.scenarioId,
    );

    return results.map((r) => ({
      id: r.id,
      totalScore: r.totalScore ?? 0,
      endReason: r.endReason ?? '',
      createdAt: r.resultCreatedAt ?? r.updatedAt,
      scenarioId: r.scenarioId,
      scenarioTitle: (r.scenario as any)?.title ?? '',
      chosenCharacterName: (r.chosenCharacter as any)?.name ?? '',
    }));
  }

  async getResultDetail(
    userId: string,
    resultId: string,
  ): Promise<ResultDetail> {
    const result = await this.resultsRepository.findById(resultId);

    if (!result) {
      throw new NotFoundException(
        `Simulation result with ID ${resultId} not found`,
      );
    }

    if (result.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this simulation result',
      );
    }

    return {
      id: result.id,
      userId: result.userId,
      sessionId: result.id,
      scenarioId: result.scenarioId,
      chosenCharacterId: result.chosenCharacterId,
      totalScore: result.totalScore ?? 0,
      criteriaScores: result.criteriaScores ?? [],
      endReason: result.endReason ?? '',
      aiSummary: result.aiSummary ?? '',
      totalMessages: result.totalMessages ?? 0,
      createdAt: result.resultCreatedAt ?? result.updatedAt,
      updatedAt: result.updatedAt,
      scenario: {
        id: (result.scenario as any)?.id ?? result.scenarioId,
        title: (result.scenario as any)?.title ?? '',
      },
      chosenCharacter: {
        id: (result.chosenCharacter as any)?.id ?? result.chosenCharacterId,
        name: (result.chosenCharacter as any)?.name ?? '',
      },
    };
  }

  async getStats(userId: string): Promise<SimulationStats> {
    return this.resultsRepository.getUserStats(userId);
  }
}
