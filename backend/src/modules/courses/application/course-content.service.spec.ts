import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CourseContentService } from './course-content.service';
import { CoursesRepository } from './repositories/courses.repository';
import { ModulesRepository } from './repositories/modules.repository';
import { LessonsRepository } from './repositories/lessons.repository';
import { ContentsRepository } from '../../contents/application/contents.repository';
import { GrammarRepository } from '../../grammar/application/grammar.repository';
import { ProgressRepository } from '../../progress/application/progress.repository';
import { ModuleProgressRepository } from '../../progress/application/module-progress.repository';
import { CourseProgressRepository } from '../../progress/application/course-progress.repository';
import { ContentType, ProgressStatus } from '../../../common/enums';

describe('CourseContentService', () => {
  let service: CourseContentService;
  let coursesRepo: jest.Mocked<CoursesRepository>;
  let modulesRepo: jest.Mocked<ModulesRepository>;
  let lessonsRepo: jest.Mocked<LessonsRepository>;
  let contentsRepo: jest.Mocked<ContentsRepository>;
  let grammarRepo: jest.Mocked<GrammarRepository>;
  let moduleProgressRepo: jest.Mocked<ModuleProgressRepository>;
  let courseProgressRepo: jest.Mocked<CourseProgressRepository>;

  beforeEach(async () => {
    const coursesMock = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
    };
    const modulesMock = {
      findById: jest.fn(),
      findByCourseId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    const lessonsMock = {
      findById: jest.fn(),
      findByModuleId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByFilter: jest.fn(),
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
      search: jest.fn(),
    };
    const progressMock = {
      getTopCoursesByEnrollment: jest.fn(),
    };
    const moduleProgressMock = {
      findCompletedByModule: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };
    const courseProgressMock = {
      findCompletedByCourse: jest.fn().mockResolvedValue([]),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CourseContentService,
        { provide: CoursesRepository, useValue: coursesMock },
        { provide: ModulesRepository, useValue: modulesMock },
        { provide: LessonsRepository, useValue: lessonsMock },
        { provide: ContentsRepository, useValue: contentsMock },
        { provide: GrammarRepository, useValue: grammarMock },
        { provide: ProgressRepository, useValue: progressMock },
        { provide: ModuleProgressRepository, useValue: moduleProgressMock },
        { provide: CourseProgressRepository, useValue: courseProgressMock },
      ],
    }).compile();

    service = module.get<CourseContentService>(CourseContentService);
    coursesRepo = module.get(CoursesRepository);
    modulesRepo = module.get(ModulesRepository);
    lessonsRepo = module.get(LessonsRepository);
    contentsRepo = module.get(ContentsRepository);
    grammarRepo = module.get(GrammarRepository);
    moduleProgressRepo = module.get(ModuleProgressRepository);
    courseProgressRepo = module.get(CourseProgressRepository);
  });

  describe('getCourseStructure', () => {
    it('returns course with modules from repository', async () => {
      const course = {
        id: 'c1',
        title: 'Course 1',
        modules: [{ id: 'm1', title: 'Module 1' }],
      };
      coursesRepo.findById.mockResolvedValue(course as any);

      const result = await service.getCourseStructure('c1');

      expect(result.id).toBe('c1');
      expect(result.modules).toHaveLength(1);
      expect(coursesRepo.findById).toHaveBeenCalledWith('c1');
    });

    it('throws NotFoundException when course not found', async () => {
      coursesRepo.findById.mockResolvedValue(null);

      await expect(service.getCourseStructure('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getModuleDetail', () => {
    it('returns module with lessons', async () => {
      const module = { id: 'm1', title: 'Module 1', lessons: [] };
      const lessons = [
        { id: 'l1', title: 'Lesson 1' },
        { id: 'l2', title: 'Lesson 2' },
      ];
      modulesRepo.findById.mockResolvedValue(module as any);
      lessonsRepo.findByModuleId.mockResolvedValue(lessons as any);

      const result = await service.getModuleDetail('m1');

      expect(result.id).toBe('m1');
      expect(result.lessons).toHaveLength(2);
      expect(result.lessons[0].id).toBe('l1');
      expect(lessonsRepo.findByModuleId).toHaveBeenCalledWith('m1');
    });

    it('throws NotFoundException when module not found', async () => {
      modulesRepo.findById.mockResolvedValue(null);

      await expect(service.getModuleDetail('missing')).rejects.toThrow(
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
        exercises: [],
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

    it('exposes exercises loaded by LessonsRepository.findById', async () => {
      const lesson = {
        id: 'l1',
        title: 'Lesson 1',
        contents: [],
        grammarRules: [],
        exercises: [{ id: 'es1', title: 'Practice exercise' }],
      };
      lessonsRepo.findById.mockResolvedValue(lesson as any);
      contentsRepo.findByLessonId.mockResolvedValue([]);
      grammarRepo.findByLessonId.mockResolvedValue([]);

      const result = await service.getLessonDetail('l1');

      expect(result.exercises).toHaveLength(1);
      expect(result.exercises[0].id).toBe('es1');
    });

    it('throws NotFoundException when lesson not found', async () => {
      lessonsRepo.findById.mockResolvedValue(null);

      await expect(service.getLessonDetail('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('getModulesByCourse', () => {
    it('returns modules for a course', async () => {
      const modules = [{ id: 'm1', title: 'Module 1' }];
      modulesRepo.findByCourseId.mockResolvedValue(modules as any);

      const result = await service.getModulesByCourse('c1');

      expect(result).toHaveLength(1);
      expect(modulesRepo.findByCourseId).toHaveBeenCalledWith('c1');
    });
  });

  describe('getLessonsByModule', () => {
    it('returns lessons for a module', async () => {
      const lessons = [{ id: 'l1', title: 'Lesson 1' }];
      lessonsRepo.findByModuleId.mockResolvedValue(lessons as any);

      const result = await service.getLessonsByModule('m1');

      expect(result).toHaveLength(1);
      expect(lessonsRepo.findByModuleId).toHaveBeenCalledWith('m1');
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

  describe('findLessons', () => {
    it('forwards the full filter set to LessonsRepository.findByFilter', async () => {
      lessonsRepo.findByFilter.mockResolvedValue([]);

      await service.findLessons({
        topic: 'family',
        level: 'A1' as any,
        type: 'vocabulary' as any,
        limit: 5,
      });

      expect(lessonsRepo.findByFilter).toHaveBeenCalledWith({
        topic: 'family',
        level: 'A1',
        type: 'vocabulary',
        limit: 5,
      });
    });

    it('returns lesson summary shape: id, title, level, type, courseTitle, moduleTitle', async () => {
      lessonsRepo.findByFilter.mockResolvedValue([
        {
          id: 'l1',
          title: 'Family members',
          lessonType: 'vocabulary',
          module: {
            id: 'm1',
            title: 'Family',
            course: { id: 'c1', title: 'Beginner Vietnamese', level: 'A1' },
          },
        } as any,
      ]);

      const result = await service.findLessons({ topic: 'family' });

      expect(result).toEqual([
        {
          id: 'l1',
          title: 'Family members',
          level: 'A1',
          type: 'vocabulary',
          courseTitle: 'Beginner Vietnamese',
          moduleTitle: 'Family',
        },
      ]);
    });

    it('omits filters that are undefined when calling the repository', async () => {
      lessonsRepo.findByFilter.mockResolvedValue([]);

      await service.findLessons({ topic: 'family' });

      expect(lessonsRepo.findByFilter).toHaveBeenCalledWith({
        topic: 'family',
      });
    });

    it('accepts an empty filter (returns whatever the repository returns)', async () => {
      lessonsRepo.findByFilter.mockResolvedValue([]);

      const result = await service.findLessons({});

      expect(lessonsRepo.findByFilter).toHaveBeenCalledWith({});
      expect(result).toEqual([]);
    });
  });

  describe('searchGrammar', () => {
    it('forwards a plain query (no opts) to GrammarRepository.search', async () => {
      grammarRepo.search.mockResolvedValue([
        { id: 'gr1', title: 'Classifiers' } as any,
      ]);

      const result = await service.searchGrammar('classifier');

      expect(grammarRepo.search).toHaveBeenCalledWith('classifier', {});
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('gr1');
    });

    it('forwards lessonId and level filters to the repository', async () => {
      grammarRepo.search.mockResolvedValue([]);

      await service.searchGrammar('classifier', {
        lessonId: 'l1',
        level: 'A2' as any,
      });

      expect(grammarRepo.search).toHaveBeenCalledWith('classifier', {
        lessonId: 'l1',
        level: 'A2',
      });
    });

    it('returns [] without hitting the repository on empty / whitespace query', async () => {
      const a = await service.searchGrammar('');
      const b = await service.searchGrammar('   ');

      expect(a).toEqual([]);
      expect(b).toEqual([]);
      expect(grammarRepo.search).not.toHaveBeenCalled();
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

  describe('content invalidation', () => {
    describe('createLesson — module progress invalidation', () => {
      it('transitions completed ModuleProgress to IN_PROGRESS when lesson added', async () => {
        const data = { title: 'Lesson 3', moduleId: 'm1' };
        const created = { id: 'l3', ...data };
        lessonsRepo.create.mockResolvedValue(created as any);
        const completedProgress = {
          id: 'mp1',
          moduleId: 'm1',
          userId: 'u1',
          status: ProgressStatus.COMPLETED,
          score: 85,
          completedAt: new Date(),
        };
        moduleProgressRepo.findCompletedByModule.mockResolvedValue([
          completedProgress as any,
        ]);
        moduleProgressRepo.update.mockResolvedValue({
          ...completedProgress,
          status: ProgressStatus.IN_PROGRESS,
        } as any);

        const result = await service.createLesson(data);

        expect(result.id).toBe('l3');
        expect(moduleProgressRepo.findCompletedByModule).toHaveBeenCalledWith(
          'm1',
        );
        expect(moduleProgressRepo.update).toHaveBeenCalledWith('mp1', {
          status: ProgressStatus.IN_PROGRESS,
        });
      });

      it('has no effect when module has no completed progress', async () => {
        const data = { title: 'Lesson 3', moduleId: 'm1' };
        const created = { id: 'l3', ...data };
        lessonsRepo.create.mockResolvedValue(created as any);
        moduleProgressRepo.findCompletedByModule.mockResolvedValue([]);

        await service.createLesson(data);

        expect(moduleProgressRepo.findCompletedByModule).toHaveBeenCalledWith(
          'm1',
        );
        expect(moduleProgressRepo.update).not.toHaveBeenCalled();
      });

      it('preserves score and completedAt when invalidating', async () => {
        const data = { title: 'Lesson 3', moduleId: 'm1' };
        const created = { id: 'l3', ...data };
        const completedAt = new Date('2025-01-01');
        lessonsRepo.create.mockResolvedValue(created as any);
        const completedProgress = {
          id: 'mp1',
          status: ProgressStatus.COMPLETED,
          score: 90,
          completedAt,
        };
        moduleProgressRepo.findCompletedByModule.mockResolvedValue([
          completedProgress as any,
        ]);
        moduleProgressRepo.update.mockResolvedValue({
          ...completedProgress,
          status: ProgressStatus.IN_PROGRESS,
        } as any);

        await service.createLesson(data);

        expect(moduleProgressRepo.update).toHaveBeenCalledWith('mp1', {
          status: ProgressStatus.IN_PROGRESS,
        });
      });

      it('invalidates multiple completed ModuleProgress records', async () => {
        const data = { title: 'Lesson 3', moduleId: 'm1' };
        const created = { id: 'l3', ...data };
        lessonsRepo.create.mockResolvedValue(created as any);
        const mp1 = { id: 'mp1', status: ProgressStatus.COMPLETED };
        const mp2 = { id: 'mp2', status: ProgressStatus.COMPLETED };
        moduleProgressRepo.findCompletedByModule.mockResolvedValue([
          mp1 as any,
          mp2 as any,
        ]);
        moduleProgressRepo.update.mockResolvedValue({} as any);

        await service.createLesson(data);

        expect(moduleProgressRepo.update).toHaveBeenCalledTimes(2);
        expect(moduleProgressRepo.update).toHaveBeenCalledWith('mp1', {
          status: ProgressStatus.IN_PROGRESS,
        });
        expect(moduleProgressRepo.update).toHaveBeenCalledWith('mp2', {
          status: ProgressStatus.IN_PROGRESS,
        });
      });
    });

    describe('createModule — course progress invalidation', () => {
      it('transitions completed CourseProgress to IN_PROGRESS when module added', async () => {
        const data = { title: 'Module 2', courseId: 'c1' };
        const created = { id: 'm2', ...data };
        modulesRepo.create.mockResolvedValue(created as any);
        const completedProgress = {
          id: 'cp1',
          courseId: 'c1',
          userId: 'u1',
          status: ProgressStatus.COMPLETED,
          score: 80,
          completedAt: new Date(),
        };
        courseProgressRepo.findCompletedByCourse.mockResolvedValue([
          completedProgress as any,
        ]);
        courseProgressRepo.update.mockResolvedValue({
          ...completedProgress,
          status: ProgressStatus.IN_PROGRESS,
        } as any);

        const result = await service.createModule(data);

        expect(result.id).toBe('m2');
        expect(courseProgressRepo.findCompletedByCourse).toHaveBeenCalledWith(
          'c1',
        );
        expect(courseProgressRepo.update).toHaveBeenCalledWith('cp1', {
          status: ProgressStatus.IN_PROGRESS,
        });
      });

      it('has no effect when course has no completed progress', async () => {
        const data = { title: 'Module 2', courseId: 'c1' };
        const created = { id: 'm2', ...data };
        modulesRepo.create.mockResolvedValue(created as any);
        courseProgressRepo.findCompletedByCourse.mockResolvedValue([]);

        await service.createModule(data);

        expect(courseProgressRepo.findCompletedByCourse).toHaveBeenCalledWith(
          'c1',
        );
        expect(courseProgressRepo.update).not.toHaveBeenCalled();
      });

      it('preserves score and completedAt when invalidating', async () => {
        const data = { title: 'Module 2', courseId: 'c1' };
        const created = { id: 'm2', ...data };
        const completedAt = new Date('2025-03-15');
        modulesRepo.create.mockResolvedValue(created as any);
        const completedProgress = {
          id: 'cp1',
          status: ProgressStatus.COMPLETED,
          score: 75,
          completedAt,
        };
        courseProgressRepo.findCompletedByCourse.mockResolvedValue([
          completedProgress as any,
        ]);
        courseProgressRepo.update.mockResolvedValue({
          ...completedProgress,
          status: ProgressStatus.IN_PROGRESS,
        } as any);

        await service.createModule(data);

        expect(courseProgressRepo.update).toHaveBeenCalledWith('cp1', {
          status: ProgressStatus.IN_PROGRESS,
        });
      });

      it('invalidates multiple completed CourseProgress records', async () => {
        const data = { title: 'Module 2', courseId: 'c1' };
        const created = { id: 'm2', ...data };
        modulesRepo.create.mockResolvedValue(created as any);
        const cp1 = { id: 'cp1', status: ProgressStatus.COMPLETED };
        const cp2 = { id: 'cp2', status: ProgressStatus.COMPLETED };
        courseProgressRepo.findCompletedByCourse.mockResolvedValue([
          cp1 as any,
          cp2 as any,
        ]);
        courseProgressRepo.update.mockResolvedValue({} as any);

        await service.createModule(data);

        expect(courseProgressRepo.update).toHaveBeenCalledTimes(2);
        expect(courseProgressRepo.update).toHaveBeenCalledWith('cp1', {
          status: ProgressStatus.IN_PROGRESS,
        });
        expect(courseProgressRepo.update).toHaveBeenCalledWith('cp2', {
          status: ProgressStatus.IN_PROGRESS,
        });
      });
    });
  });

  describe('createModule', () => {
    it('creates and returns module', async () => {
      const data = { title: 'Module 1', courseId: 'c1' };
      const created = { id: 'm1', ...data };
      modulesRepo.create.mockResolvedValue(created as any);

      const result = await service.createModule(data);

      expect(result.id).toBe('m1');
      expect(modulesRepo.create).toHaveBeenCalledWith(data);
    });
  });

  describe('updateModule', () => {
    it('updates and returns module', async () => {
      const existing = { id: 'm1', title: 'Old' };
      const updated = { id: 'm1', title: 'New' };
      modulesRepo.findById.mockResolvedValue(existing as any);
      modulesRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateModule('m1', { title: 'New' });

      expect(result.title).toBe('New');
      expect(modulesRepo.update).toHaveBeenCalledWith('m1', { title: 'New' });
    });

    it('throws NotFoundException when module not found', async () => {
      modulesRepo.findById.mockResolvedValue(null);

      await expect(
        service.updateModule('missing', { title: 'New' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('deleteModule', () => {
    it('deletes module after verifying existence', async () => {
      const existing = { id: 'm1', title: 'Module 1' };
      modulesRepo.findById.mockResolvedValue(existing as any);
      modulesRepo.delete.mockResolvedValue(undefined);

      await service.deleteModule('m1');

      expect(modulesRepo.delete).toHaveBeenCalledWith('m1');
    });

    it('throws NotFoundException when module not found', async () => {
      modulesRepo.findById.mockResolvedValue(null);

      await expect(service.deleteModule('missing')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('createLesson', () => {
    it('creates and returns lesson', async () => {
      const data = { title: 'Lesson 1', moduleId: 'm1' };
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
      const data = {
        vietnameseText: 'Xin chào',
        lessonId: 'l1',
        contentType: ContentType.TEXT,
      };
      const created = { id: 'ct1', ...data };
      contentsRepo.create.mockResolvedValue(created as any);

      const result = await service.createContent(data);

      expect(result.id).toBe('ct1');
      expect(contentsRepo.create).toHaveBeenCalledWith({
        ...data,
        dialogueData: null,
      });
    });

    it('derives vietnameseText and translation from dialogue lines', async () => {
      const data = {
        contentType: ContentType.DIALOGUE,
        orderIndex: 1,
        lessonId: 'l1',
        dialogueData: {
          characters: [
            { id: 'c1', name: 'Nam', side: 'left' as const },
            { id: 'c2', name: 'Lan', side: 'right' as const },
          ],
          lines: [
            { characterId: 'c1', vi: 'Xin chào!', en: 'Hello!' },
            { characterId: 'c2', vi: 'Chào bạn!', en: 'Hi!' },
          ],
        },
      };
      contentsRepo.create.mockImplementation(async (payload: any) => ({
        id: 'ct2',
        ...payload,
      }));

      await service.createContent(data as any);

      expect(contentsRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          vietnameseText: 'Nam: Xin chào!\nLan: Chào bạn!',
          translation: 'Nam: Hello!\nLan: Hi!',
          dialogueData: data.dialogueData,
        }),
      );
    });

    it('rejects dialogue with two right-side characters', async () => {
      await expect(
        service.createContent({
          contentType: ContentType.DIALOGUE,
          orderIndex: 1,
          lessonId: 'l1',
          dialogueData: {
            characters: [
              { id: 'c1', name: 'A', side: 'right' as const },
              { id: 'c2', name: 'B', side: 'right' as const },
            ],
            lines: [],
          },
        } as any),
      ).rejects.toThrow(BadRequestException);
    });

    it('rejects dialogue when contentType=dialogue but dialogueData missing', async () => {
      await expect(
        service.createContent({
          contentType: ContentType.DIALOGUE,
          orderIndex: 1,
          lessonId: 'l1',
        } as any),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('updateContent', () => {
    it('updates and returns content', async () => {
      const existing = {
        id: 'ct1',
        vietnameseText: 'Old',
        contentType: ContentType.TEXT,
      };
      const updated = { id: 'ct1', vietnameseText: 'New' };
      contentsRepo.findById.mockResolvedValue(existing as any);
      contentsRepo.update.mockResolvedValue(updated as any);

      const result = await service.updateContent('ct1', {
        vietnameseText: 'New',
      });

      expect(result.vietnameseText).toBe('New');
      expect(contentsRepo.update).toHaveBeenCalledWith(
        'ct1',
        expect.objectContaining({
          vietnameseText: 'New',
          dialogueData: null,
        }),
      );
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
