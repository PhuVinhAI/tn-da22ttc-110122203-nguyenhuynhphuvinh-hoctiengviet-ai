import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { SimulationResultsService } from './simulation-results.service';
import { SimulationResultsRepository } from './repositories/simulation-results.repository';
import { SimulationEndReason } from '../../../common/enums';

const makeResult = (overrides: any = {}) => ({
  id: 'result-1',
  userId: 'user-1',
  sessionId: 'session-1',
  scenarioId: 'sc-1',
  chosenCharacterId: 'ch-1',
  totalScore: 85,
  criteriaScores: [
    { name: 'Vocabulary', score: 90, comment: 'Good' },
    { name: 'Grammar', score: 80, comment: 'Fair' },
  ],
  endReason: SimulationEndReason.COMPLETED,
  aiSummary: 'Well done!',
  totalMessages: 10,
  createdAt: new Date('2025-01-01'),
  scenario: { id: 'sc-1', title: 'Mua rau ở chợ' },
  chosenCharacter: { id: 'ch-1', name: 'Khách hàng' },
  ...overrides,
});

describe('SimulationResultsService', () => {
  let service: SimulationResultsService;
  let resultsRepo: jest.Mocked<SimulationResultsRepository>;

  beforeEach(async () => {
    const resultsMock = {
      create: jest.fn(),
      findByUserId: jest.fn(),
      findById: jest.fn(),
      getUserStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SimulationResultsService,
        { provide: SimulationResultsRepository, useValue: resultsMock },
      ],
    }).compile();

    service = module.get<SimulationResultsService>(SimulationResultsService);
    resultsRepo = module.get(SimulationResultsRepository);
  });

  describe('listResults', () => {
    it('returns current user results ordered by most recent first', async () => {
      const results = [
        makeResult({ id: 'r2', createdAt: new Date('2025-01-02') }),
        makeResult({ id: 'r1', createdAt: new Date('2025-01-01') }),
      ];
      resultsRepo.findByUserId.mockResolvedValue(results as any);

      const list = await service.listResults('user-1', {});

      expect(list).toHaveLength(2);
      expect(list[0].id).toBe('r2');
      expect(list[1].id).toBe('r1');
      expect(resultsRepo.findByUserId).toHaveBeenCalledWith(
        'user-1',
        undefined,
      );
    });

    it('filters results by scenarioId', async () => {
      resultsRepo.findByUserId.mockResolvedValue([makeResult()] as any);

      await service.listResults('user-1', { scenarioId: 'sc-1' });

      expect(resultsRepo.findByUserId).toHaveBeenCalledWith('user-1', 'sc-1');
    });

    it('includes scenario title and character name in list items', async () => {
      resultsRepo.findByUserId.mockResolvedValue([makeResult()] as any);

      const list = await service.listResults('user-1', {});

      expect(list[0]).toMatchObject({
        scenarioId: 'sc-1',
        scenarioTitle: 'Mua rau ở chợ',
        chosenCharacterName: 'Khách hàng',
      });
    });

    it('returns empty array when user has no results', async () => {
      resultsRepo.findByUserId.mockResolvedValue([]);

      const list = await service.listResults('user-1', {});

      expect(list).toEqual([]);
    });
  });

  describe('getResultDetail', () => {
    it('returns full result with criteria scores and AI summary', async () => {
      const result = makeResult();
      resultsRepo.findById.mockResolvedValue(result);

      const detail = await service.getResultDetail('user-1', 'result-1');

      expect(detail.totalScore).toBe(85);
      expect(detail.criteriaScores).toHaveLength(2);
      expect(detail.aiSummary).toBe('Well done!');
      expect(detail.endReason).toBe(SimulationEndReason.COMPLETED);
      expect(detail.totalMessages).toBe(10);
      expect(resultsRepo.findById).toHaveBeenCalledWith('result-1');
    });

    it('includes scenario and character info in detail', async () => {
      const result = makeResult();
      resultsRepo.findById.mockResolvedValue(result);

      const detail = await service.getResultDetail('user-1', 'result-1');

      expect(detail.scenario).toMatchObject({
        id: 'sc-1',
        title: 'Mua rau ở chợ',
      });
      expect(detail.chosenCharacter).toMatchObject({
        id: 'ch-1',
        name: 'Khách hàng',
      });
    });

    it('throws NotFoundException when result not found', async () => {
      resultsRepo.findById.mockResolvedValue(null);

      await expect(
        service.getResultDetail('user-1', 'missing'),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws ForbiddenException when result belongs to different user', async () => {
      const result = makeResult({ userId: 'user-other' });
      resultsRepo.findById.mockResolvedValue(result);

      await expect(
        service.getResultDetail('user-1', 'result-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('getStats', () => {
    it('returns scenarios attempted and average score', async () => {
      resultsRepo.getUserStats.mockResolvedValue({
        scenariosAttempted: 5,
        averageScore: 72.5,
      });

      const stats = await service.getStats('user-1');

      expect(stats.scenariosAttempted).toBe(5);
      expect(stats.averageScore).toBe(72.5);
      expect(resultsRepo.getUserStats).toHaveBeenCalledWith('user-1');
    });

    it('returns zero stats when user has no results', async () => {
      resultsRepo.getUserStats.mockResolvedValue({
        scenariosAttempted: 0,
        averageScore: 0,
      });

      const stats = await service.getStats('user-1');

      expect(stats.scenariosAttempted).toBe(0);
      expect(stats.averageScore).toBe(0);
    });
  });
});
