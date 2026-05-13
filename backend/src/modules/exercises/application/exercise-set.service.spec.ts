import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ExerciseSetService } from './exercise-set.service';
import { ExerciseSetsRepository } from './repositories/exercise-sets.repository';
import { TierProgressService } from './tier-progress.service';
import { ExerciseTier } from '../../../common/enums';

describe('ExerciseSetService', () => {
  let service: ExerciseSetService;
  let exerciseSetsRepo: jest.Mocked<ExerciseSetsRepository>;
  let tierProgressService: jest.Mocked<TierProgressService>;

  beforeEach(async () => {
    exerciseSetsRepo = {
      create: jest.fn(),
      findByIdWithExercises: jest.fn(),
    } as any;

    tierProgressService = {
      getLessonTierSummary: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExerciseSetService,
        {
          provide: ExerciseSetsRepository,
          useValue: exerciseSetsRepo,
        },
        {
          provide: TierProgressService,
          useValue: tierProgressService,
        },
      ],
    }).compile();

    service = module.get<ExerciseSetService>(ExerciseSetService);
  });

  describe('findById', () => {
    it('returns exercise set with exercises', async () => {
      const mockSet = {
        id: 'set-1',
        title: 'Basic Exercises',
        exercises: [{ id: 'ex-1' }, { id: 'ex-2' }],
      };
      exerciseSetsRepo.findByIdWithExercises.mockResolvedValue(mockSet as any);

      const result = await service.findById('set-1');

      expect(result.id).toBe('set-1');
      expect(result.exercises).toHaveLength(2);
      expect(exerciseSetsRepo.findByIdWithExercises).toHaveBeenCalledWith(
        'set-1',
      );
    });

    it('throws NotFoundException when set not found', async () => {
      exerciseSetsRepo.findByIdWithExercises.mockResolvedValue(null);

      await expect(service.findById('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByLessonId', () => {
    it('delegates to tierProgressService', async () => {
      const mockSummary = {
        sets: [],
        unlockedTiers: ['BASIC'],
      };
      tierProgressService.getLessonTierSummary.mockResolvedValue(
        mockSummary as any,
      );

      const result = await service.findByLessonId('lesson-1', 'user-1');

      expect(result).toEqual(mockSummary);
      expect(tierProgressService.getLessonTierSummary).toHaveBeenCalledWith(
        'lesson-1',
        'user-1',
      );
    });
  });

  describe('create', () => {
    it('creates and returns exercise set', async () => {
      const data = {
        lessonId: 'lesson-1',
        tier: ExerciseTier.BASIC,
        title: 'Basic Exercises',
      };
      const created = { id: 'set-1', ...data };
      exerciseSetsRepo.create.mockResolvedValue(created as any);

      const result = await service.create(data);

      expect(result.id).toBe('set-1');
      expect(exerciseSetsRepo.create).toHaveBeenCalledWith(data);
    });
  });
});
