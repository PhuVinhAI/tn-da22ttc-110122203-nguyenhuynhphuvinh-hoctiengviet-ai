import { Test, TestingModule } from '@nestjs/testing';
import { DailyStreakService } from './daily-streak.service';
import { DailyStreakRepository } from './daily-streak.repository';
import { DailyStreak } from '../domain/daily-streak.entity';

describe('DailyStreakService', () => {
  let service: DailyStreakService;
  let streakRepo: jest.Mocked<DailyStreakRepository>;

  beforeEach(async () => {
    const streakRepoMock = {
      findByUserId: jest.fn(),
      upsert: jest.fn(),
      create: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DailyStreakService,
        { provide: DailyStreakRepository, useValue: streakRepoMock },
      ],
    }).compile();

    service = module.get<DailyStreakService>(DailyStreakService);
    streakRepo = module.get(DailyStreakRepository);
  });

  const makeStreak = (overrides: Partial<DailyStreak> = {}): DailyStreak =>
    ({
      id: 'streak-1',
      userId: 'user-1',
      currentStreak: 0,
      longestStreak: 0,
      lastGoalMetDate: null,
      user: null as any,
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: undefined,
      ...overrides,
    }) as DailyStreak;

  describe('updateStreak', () => {
    it('creates streak with currentStreak=1 when allGoalsMet and no existing streak', async () => {
      streakRepo.findByUserId.mockResolvedValue(null);
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 1,
          longestStreak: 1,
          lastGoalMetDate: '2025-01-15',
        }),
      );

      await service.updateStreak('user-1', true, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 1,
        longestStreak: 1,
        lastGoalMetDate: '2025-01-15',
      });
    });

    it('keeps streak unchanged when not allGoalsMet and no existing streak', async () => {
      streakRepo.findByUserId.mockResolvedValue(null);
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastGoalMetDate: null,
        }),
      );

      await service.updateStreak('user-1', false, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 0,
        longestStreak: 0,
        lastGoalMetDate: null,
      });
    });

    it('increments streak when allGoalsMet and lastGoalMetDate is yesterday', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 3,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-14',
        }),
      );
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 4,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-15',
        }),
      );

      await service.updateStreak('user-1', true, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 4,
        longestStreak: 5,
        lastGoalMetDate: '2025-01-15',
      });
    });

    it('updates longestStreak when currentStreak exceeds it', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 5,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-14',
        }),
      );
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 6,
          longestStreak: 6,
          lastGoalMetDate: '2025-01-15',
        }),
      );

      await service.updateStreak('user-1', true, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 6,
        longestStreak: 6,
        lastGoalMetDate: '2025-01-15',
      });
    });

    it('does not increment when allGoalsMet but lastGoalMetDate is already today', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 3,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-15',
        }),
      );
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 3,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-15',
        }),
      );

      await service.updateStreak('user-1', true, '2025-01-15');

      expect(streakRepo.upsert).not.toHaveBeenCalled();
    });

    it('resets to 1 when allGoalsMet but gap in streak', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 3,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-12',
        }),
      );
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 1,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-15',
        }),
      );

      await service.updateStreak('user-1', true, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 1,
        longestStreak: 5,
        lastGoalMetDate: '2025-01-15',
      });
    });

    it('resets to 0 when not allGoalsMet and existing streak', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 3,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-14',
        }),
      );
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 0,
          longestStreak: 5,
          lastGoalMetDate: '2025-01-14',
        }),
      );

      await service.updateStreak('user-1', false, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 0,
        longestStreak: 5,
        lastGoalMetDate: '2025-01-14',
      });
    });

    it('keeps streak at 0 when not allGoalsMet and no previous streak', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 0,
          longestStreak: 0,
          lastGoalMetDate: null,
        }),
      );

      await service.updateStreak('user-1', false, '2025-01-15');

      expect(streakRepo.upsert).not.toHaveBeenCalled();
    });

    it('does not update longestStreak when reset to 1 below record', async () => {
      streakRepo.findByUserId.mockResolvedValue(
        makeStreak({
          currentStreak: 10,
          longestStreak: 10,
          lastGoalMetDate: '2025-01-10',
        }),
      );
      streakRepo.upsert.mockResolvedValue(
        makeStreak({
          currentStreak: 1,
          longestStreak: 10,
          lastGoalMetDate: '2025-01-15',
        }),
      );

      await service.updateStreak('user-1', true, '2025-01-15');

      expect(streakRepo.upsert).toHaveBeenCalledWith('user-1', {
        currentStreak: 1,
        longestStreak: 10,
        lastGoalMetDate: '2025-01-15',
      });
    });
  });

  describe('getStreak', () => {
    it('returns null when no streak exists', async () => {
      streakRepo.findByUserId.mockResolvedValue(null);

      const result = await service.getStreak('user-1');

      expect(result).toBeNull();
    });

    it('returns streak when it exists', async () => {
      const existing = makeStreak({ currentStreak: 5, longestStreak: 7 });
      streakRepo.findByUserId.mockResolvedValue(existing);

      const result = await service.getStreak('user-1');

      expect(result).toEqual(existing);
    });
  });
});
