import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CourseContentService } from './course-content.service';
import { CoursesRepository } from './repositories/courses.repository';
import { UnitsRepository } from './repositories/units.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { ContentsService } from '../../contents/application/contents.service';
import { GrammarService } from '../../grammar/application/grammar.service';

describe('CourseContentService', () => {
  let service: CourseContentService;
  let coursesRepo: jest.Mocked<CoursesRepository>;
  let unitsRepo: jest.Mocked<UnitsRepository>;
  let lessonsRepo: jest.Mocked<LessonsRepository>;
  let contentsService: jest.Mocked<ContentsService>;
  let grammarService: jest.Mocked<GrammarService>;

  beforeEach(async () => {
    const coursesMock = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
    };
    const unitsMock = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
    };
    const lessonsMock = {
      findById: jest.fn(),
      findByUnitId: jest.fn(),
    };
    const contentsMock = {
      findByLessonId: jest.fn(),
      findById: jest.fn(),
    };
    const grammarMock = {
      findByLessonId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseContentService,
        { provide: CoursesRepository, useValue: coursesMock },
        { provide: UnitsRepository, useValue: unitsMock },
        { provide: LessonsRepository, useValue: lessonsMock },
        { provide: ContentsService, useValue: contentsMock },
        { provide: GrammarService, useValue: grammarMock },
      ],
    }).compile();

    service = module.get<CourseContentService>(CourseContentService);
    coursesRepo = module.get(CoursesRepository);
    unitsRepo = module.get(UnitsRepository);
    lessonsRepo = module.get(LessonsRepository);
    contentsService = module.get(ContentsService);
    grammarService = module.get(GrammarService);
  });

  describe('getCourseStructure', () => {
    it('returns course with units from repository', async () => {
      const course = {
        id: 'c1',
        title: 'Course 1',
        units: [{ id: 'u1', title: 'Unit 1' }],
      };
      coursesRepo.findById.mockResolvedValue(course as any);

      const result = await service.getCourseStructure('c1');

      expect(result.id).toBe('c1');
      expect(result.units).toHaveLength(1);
      expect(coursesRepo.findById).toHaveBeenCalledWith('c1');
    });

    it('throws NotFoundException when course not found', async () => {
      coursesRepo.findById.mockResolvedValue(null);

      await expect(service.getCourseStructure('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnitDetail', () => {
    it('returns unit with lessons', async () => {
      const unit = { id: 'u1', title: 'Unit 1', lessons: [] };
      const lessons = [
        { id: 'l1', title: 'Lesson 1' },
        { id: 'l2', title: 'Lesson 2' },
      ];
      unitsRepo.findById.mockResolvedValue(unit as any);
      lessonsRepo.findByUnitId.mockResolvedValue(lessons as any);

      const result = await service.getUnitDetail('u1');

      expect(result.id).toBe('u1');
      expect(result.lessons).toHaveLength(2);
      expect(result.lessons[0].id).toBe('l1');
      expect(lessonsRepo.findByUnitId).toHaveBeenCalledWith('u1');
    });

    it('throws NotFoundException when unit not found', async () => {
      unitsRepo.findById.mockResolvedValue(null);

      await expect(service.getUnitDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getLessonDetail', () => {
    it('returns lesson with contents and grammar rules', async () => {
      const lesson = {
        id: 'l1',
        title: 'Lesson 1',
        contents: [],
        grammarRules: [],
      };
      const contents = [
        { id: 'ct1', contentType: 'text', vietnameseText: 'Xin chào' },
      ];
      const grammarRules = [{ id: 'gr1', title: 'Chào hỏi', examples: [] }];
      lessonsRepo.findById.mockResolvedValue(lesson as any);
      contentsService.findByLessonId.mockResolvedValue(contents as any);
      grammarService.findByLessonId.mockResolvedValue(grammarRules as any);

      const result = await service.getLessonDetail('l1');

      expect(result.id).toBe('l1');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].id).toBe('ct1');
      expect(result.grammarRules).toHaveLength(1);
      expect(result.grammarRules[0].id).toBe('gr1');
      expect(contentsService.findByLessonId).toHaveBeenCalledWith('l1');
      expect(grammarService.findByLessonId).toHaveBeenCalledWith('l1');
    });

    it('throws NotFoundException when lesson not found', async () => {
      lessonsRepo.findById.mockResolvedValue(null);

      await expect(service.getLessonDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
