import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { CourseContentService } from './course-content.service';
import { CoursesRepository } from './repositories/courses.repository';
import { UnitsRepository } from './repositories/units.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { ContentsRepository } from '../../contents/application/contents.repository';
import { GrammarRepository } from '../../grammar/application/grammar.repository';

describe('CourseContentService', () => {
  let service: CourseContentService;
  let coursesRepo: jest.Mocked<CoursesRepository>;
  let unitsRepo: jest.Mocked<UnitsRepository>;
  let lessonsRepo: jest.Mocked<LessonsRepository>;
  let contentsRepo: jest.Mocked<ContentsRepository>;
  let grammarRepo: jest.Mocked<GrammarRepository>;

  beforeEach(async () => {
    const coursesMock = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
    };
    const unitsMock = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const lessonsMock = {
      findById: jest.fn(),
      findByUnitId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const contentsMock = {
      findByLessonId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const grammarMock = {
      findByLessonId: jest.fn(),
      findById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseContentService,
        { provide: CoursesRepository, useValue: coursesMock },
        { provide: UnitsRepository, useValue: unitsMock },
        { provide: LessonsRepository, useValue: lessonsMock },
        { provide: ContentsRepository, useValue: contentsMock },
        { provide: GrammarRepository, useValue: grammarMock },
      ],
    }).compile();

    service = module.get<CourseContentService>(CourseContentService);
    coursesRepo = module.get(CoursesRepository);
    unitsRepo = module.get(UnitsRepository);
    lessonsRepo = module.get(LessonsRepository);
    contentsRepo = module.get(ContentsRepository);
    grammarRepo = module.get(GrammarRepository);
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
      contentsRepo.findByLessonId.mockResolvedValue(contents as any);
      grammarRepo.findByLessonId.mockResolvedValue(grammarRules as any);

      const result = await service.getLessonDetail('l1');

      expect(result.id).toBe('l1');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].id).toBe('ct1');
      expect(result.grammarRules).toHaveLength(1);
      expect(result.grammarRules[0].id).toBe('gr1');
      expect(contentsRepo.findByLessonId).toHaveBeenCalledWith('l1');
      expect(grammarRepo.findByLessonId).toHaveBeenCalledWith('l1');
    });

    it('throws NotFoundException when lesson not found', async () => {
      lessonsRepo.findById.mockResolvedValue(null);

      await expect(service.getLessonDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getUnitsByCourse', () => {
    it('returns units for a course', async () => {
      const units = [{ id: 'u1', title: 'Unit 1' }];
      unitsRepo.findByCourseId.mockResolvedValue(units as any);

      const result = await service.getUnitsByCourse('c1');

      expect(result).toHaveLength(1);
      expect(unitsRepo.findByCourseId).toHaveBeenCalledWith('c1');
    });
  });

  describe('getLessonsByUnit', () => {
    it('returns lessons for a unit', async () => {
      const lessons = [{ id: 'l1', title: 'Lesson 1' }];
      lessonsRepo.findByUnitId.mockResolvedValue(lessons as any);

      const result = await service.getLessonsByUnit('u1');

      expect(result).toHaveLength(1);
      expect(lessonsRepo.findByUnitId).toHaveBeenCalledWith('u1');
    });
  });

  describe('getContentsByLesson', () => {
    it('returns contents for a lesson', async () => {
      const contents = [{ id: 'ct1', vietnameseText: 'Xin chào' }];
      contentsRepo.findByLessonId.mockResolvedValue(contents as any);

      const result = await service.getContentsByLesson('l1');

      expect(result).toHaveLength(1);
      expect(contentsRepo.findByLessonId).toHaveBeenCalledWith('l1');
    });
  });

  describe('getContentDetail', () => {
    it('returns content by id', async () => {
      const content = { id: 'ct1', vietnameseText: 'Xin chào' };
      contentsRepo.findById.mockResolvedValue(content as any);

      const result = await service.getContentDetail('ct1');

      expect(result.id).toBe('ct1');
    });

    it('throws NotFoundException when content not found', async () => {
      contentsRepo.findById.mockResolvedValue(null);

      await expect(service.getContentDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getGrammarByLesson', () => {
    it('returns grammar rules for a lesson', async () => {
      const rules = [{ id: 'gr1', title: 'SVO' }];
      grammarRepo.findByLessonId.mockResolvedValue(rules as any);

      const result = await service.getGrammarByLesson('l1');

      expect(result).toHaveLength(1);
      expect(grammarRepo.findByLessonId).toHaveBeenCalledWith('l1');
    });
  });

  describe('getGrammarDetail', () => {
    it('returns grammar rule by id', async () => {
      const rule = { id: 'gr1', title: 'SVO' };
      grammarRepo.findById.mockResolvedValue(rule as any);

      const result = await service.getGrammarDetail('gr1');

      expect(result.id).toBe('gr1');
    });

    it('throws NotFoundException when grammar rule not found', async () => {
      grammarRepo.findById.mockResolvedValue(null);

      await expect(service.getGrammarDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createUnit', () => {
    it('creates and returns unit', async () => {
      const data = { title: 'Unit 1', courseId: 'c1' };
      const created = { id: 'u1', ...data };
      unitsRepo.create.mockResolvedValue(created as any);

      const result = await service.createUnit(data);

      expect(result.id).toBe('u1');
      expect(unitsRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('updateUnit', () => {
    it('updates and returns unit', async () => {
      const existing = { id: 'u1', title: 'Old' };
      const updated = { id: 'u1', title: 'New' };
      unitsRepo.findById.mockResolvedValue(existing as any);
      unitsRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateUnit('u1', { title: 'New' });

      expect(result.title).toBe('New');
      expect(unitsRepo.update).toHaveBeenCalledWith('u1', { title: 'New' });
    });

    it('throws NotFoundException when unit not found', async () => {
      unitsRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateUnit('missing', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteUnit', () => {
    it('deletes unit after verifying existence', async () => {
      const existing = { id: 'u1', title: 'Unit 1' };
      unitsRepo.findById.mockResolvedValue(existing as any);
      unitsRepo.delete.mockResolvedValue(undefined);

      await service.deleteUnit('u1');

      expect(unitsRepo.delete).toHaveBeenCalledWith('u1');
    });

    it('throws NotFoundException when unit not found', async () => {
      unitsRepo.findById.mockResolvedValue(null);

      await expect(service.deleteUnit('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createLesson', () => {
    it('creates and returns lesson', async () => {
      const data = { title: 'Lesson 1', unitId: 'u1' };
      const created = { id: 'l1', ...data };
      lessonsRepo.create.mockResolvedValue(created as any);

      const result = await service.createLesson(data);

      expect(result.id).toBe('l1');
      expect(lessonsRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('updateLesson', () => {
    it('updates and returns lesson', async () => {
      const existing = { id: 'l1', title: 'Old' };
      const updated = { id: 'l1', title: 'New' };
      lessonsRepo.findById.mockResolvedValue(existing as any);
      lessonsRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateLesson('l1', { title: 'New' });

      expect(result.title).toBe('New');
      expect(lessonsRepo.update).toHaveBeenCalledWith('l1', { title: 'New' });
    });

    it('throws NotFoundException when lesson not found', async () => {
      lessonsRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateLesson('missing', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteLesson', () => {
    it('deletes lesson after verifying existence', async () => {
      const existing = { id: 'l1', title: 'Lesson 1' };
      lessonsRepo.findById.mockResolvedValue(existing as any);
      lessonsRepo.delete.mockResolvedValue(undefined);

      await service.deleteLesson('l1');

      expect(lessonsRepo.delete).toHaveBeenCalledWith('l1');
    });

    it('throws NotFoundException when lesson not found', async () => {
      lessonsRepo.findById.mockResolvedValue(null);

      await expect(service.deleteLesson('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createContent', () => {
    it('creates and returns content', async () => {
      const data = { vietnameseText: 'Xin chào', lessonId: 'l1' };
      const created = { id: 'ct1', ...data };
      contentsRepo.create.mockResolvedValue(created as any);

      const result = await service.createContent(data);

      expect(result.id).toBe('ct1');
      expect(contentsRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('updateContent', () => {
    it('updates and returns content', async () => {
      const existing = { id: 'ct1', vietnameseText: 'Old' };
      const updated = { id: 'ct1', vietnameseText: 'New' };
      contentsRepo.findById.mockResolvedValue(existing as any);
      contentsRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateContent('ct1', {
        vietnameseText: 'New',
      });

      expect(result.vietnameseText).toBe('New');
      expect(contentsRepo.update).toHaveBeenCalledWith('ct1', {
        vietnameseText: 'New',
      });
    });

    it('throws NotFoundException when content not found', async () => {
      contentsRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateContent('missing', { vietnameseText: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteContent', () => {
    it('deletes content after verifying existence', async () => {
      const existing = { id: 'ct1', vietnameseText: 'Content' };
      contentsRepo.findById.mockResolvedValue(existing as any);
      contentsRepo.delete.mockResolvedValue(undefined);

      await service.deleteContent('ct1');

      expect(contentsRepo.delete).toHaveBeenCalledWith('ct1');
    });

    it('throws NotFoundException when content not found', async () => {
      contentsRepo.findById.mockResolvedValue(null);

      await expect(service.deleteContent('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createGrammarRule', () => {
    it('creates and returns grammar rule', async () => {
      const data = { title: 'SVO', lessonId: 'l1' };
      const created = { id: 'gr1', ...data };
      grammarRepo.create.mockResolvedValue(created as any);

      const result = await service.createGrammarRule(data);

      expect(result.id).toBe('gr1');
      expect(grammarRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('updateGrammarRule', () => {
    it('updates and returns grammar rule', async () => {
      const existing = { id: 'gr1', title: 'Old' };
      const updated = { id: 'gr1', title: 'New' };
      grammarRepo.findById.mockResolvedValue(existing as any);
      grammarRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateGrammarRule('gr1', { title: 'New' });

      expect(result.title).toBe('New');
      expect(grammarRepo.update).toHaveBeenCalledWith('gr1', { title: 'New' });
    });

    it('throws NotFoundException when grammar rule not found', async () => {
      grammarRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateGrammarRule('missing', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteGrammarRule', () => {
    it('deletes grammar rule after verifying existence', async () => {
      const existing = { id: 'gr1', title: 'SVO' };
      grammarRepo.findById.mockResolvedValue(existing as any);
      grammarRepo.delete.mockResolvedValue(undefined);

      await service.deleteGrammarRule('gr1');

      expect(grammarRepo.delete).toHaveBeenCalledWith('gr1');
    });

    it('throws NotFoundException when grammar rule not found', async () => {
      grammarRepo.findById.mockResolvedValue(null);

      await expect(service.deleteGrammarRule('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
