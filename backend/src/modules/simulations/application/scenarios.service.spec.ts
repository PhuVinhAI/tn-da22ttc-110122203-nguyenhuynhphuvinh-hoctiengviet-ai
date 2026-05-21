import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ScenariosService } from './scenarios.service';
import { ScenariosRepository } from './repositories/scenarios.repository';
import { ScenarioCategoriesRepository } from './repositories/scenario-categories.repository';
import { Difficulty, UserLevel } from '../../../common/enums';

describe('ScenariosService', () => {
  let service: ScenariosService;
  let scenariosRepo: jest.Mocked<ScenariosRepository>;
  let categoriesRepo: jest.Mocked<ScenarioCategoriesRepository>;

  beforeEach(async () => {
    const scenariosMock = {
      findPublished: jest.fn(),
      findById: jest.fn(),
    };
    const categoriesMock = {
      findAll: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ScenariosService,
        { provide: ScenariosRepository, useValue: scenariosMock },
        { provide: ScenarioCategoriesRepository, useValue: categoriesMock },
      ],
    }).compile();

    service = module.get<ScenariosService>(ScenariosService);
    scenariosRepo = module.get(ScenariosRepository);
    categoriesRepo = module.get(ScenarioCategoriesRepository);
  });

  describe('listCategories', () => {
    it('returns all categories ordered by orderIndex', async () => {
      const categories = [
        { id: 'cat1', name: 'Mua sắm', orderIndex: 1 },
        { id: 'cat2', name: 'Ăn uống', orderIndex: 2 },
      ];
      categoriesRepo.findAll.mockResolvedValue(categories as any);

      const result = await service.listCategories();

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('Mua sắm');
      expect(result[1].name).toBe('Ăn uống');
      expect(categoriesRepo.findAll).toHaveBeenCalledTimes(1);
    });

    it('returns empty array when no categories exist', async () => {
      categoriesRepo.findAll.mockResolvedValue([]);

      const result = await service.listCategories();

      expect(result).toEqual([]);
    });
  });

  describe('listScenarios', () => {
    const publishedScenario = {
      id: 'sc1',
      title: 'Mua rau',
      isPublished: true,
      categoryId: 'cat1',
      requiredLevel: UserLevel.A1,
      difficulty: Difficulty.EASY,
      characters: [{ id: 'ch1' }, { id: 'ch2' }],
      category: { id: 'cat1', name: 'Mua sắm' },
    };

    it('returns only published scenarios', async () => {
      scenariosRepo.findPublished.mockResolvedValue([publishedScenario as any]);

      const result = await service.listScenarios({});

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('sc1');
      expect(scenariosRepo.findPublished).toHaveBeenCalledWith({});
    });

    it('filters by categoryId', async () => {
      scenariosRepo.findPublished.mockResolvedValue([publishedScenario as any]);

      await service.listScenarios({ categoryId: 'cat1' });

      expect(scenariosRepo.findPublished).toHaveBeenCalledWith({
        categoryId: 'cat1',
      });
    });

    it('filters by level', async () => {
      scenariosRepo.findPublished.mockResolvedValue([publishedScenario as any]);

      await service.listScenarios({ level: UserLevel.A1 });

      expect(scenariosRepo.findPublished).toHaveBeenCalledWith({
        level: UserLevel.A1,
      });
    });

    it('filters by difficulty', async () => {
      scenariosRepo.findPublished.mockResolvedValue([publishedScenario as any]);

      await service.listScenarios({ difficulty: Difficulty.EASY });

      expect(scenariosRepo.findPublished).toHaveBeenCalledWith({
        difficulty: Difficulty.EASY,
      });
    });

    it('combines multiple filters', async () => {
      scenariosRepo.findPublished.mockResolvedValue([]);

      await service.listScenarios({
        categoryId: 'cat1',
        level: UserLevel.A1,
        difficulty: Difficulty.EASY,
      });

      expect(scenariosRepo.findPublished).toHaveBeenCalledWith({
        categoryId: 'cat1',
        level: UserLevel.A1,
        difficulty: Difficulty.EASY,
      });
    });

    it('includes character count and category info in response', async () => {
      scenariosRepo.findPublished.mockResolvedValue([publishedScenario as any]);

      const result = await service.listScenarios({});

      expect(result[0].characterCount).toBe(2);
      expect(result[0].category).toMatchObject({ id: 'cat1', name: 'Mua sắm' });
    });
  });

  describe('getScenarioDetail', () => {
    it('returns scenario with characters ordered by orderIndex', async () => {
      const scenario = {
        id: 'sc1',
        title: 'Mua rau',
        isPublished: true,
        scoringCriteria: [{ name: 'Giao tiếp', weight: 50 }],
        category: { id: 'cat1', name: 'Mua sắm' },
        characters: [
          { id: 'ch2', name: 'Người bán', orderIndex: 2, isPlayable: false },
          { id: 'ch1', name: 'Khách hàng', orderIndex: 1, isPlayable: true },
        ],
      };
      scenariosRepo.findById.mockResolvedValue(scenario as any);

      const result = await service.getScenarioDetail('sc1');

      expect(result.id).toBe('sc1');
      expect(result.characters).toHaveLength(2);
      expect(scenariosRepo.findById).toHaveBeenCalledWith('sc1');
    });

    it('throws NotFoundException when scenario not found', async () => {
      scenariosRepo.findById.mockResolvedValue(null);

      await expect(service.getScenarioDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
