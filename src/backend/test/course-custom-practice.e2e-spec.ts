import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../src/modules/users/domain/user.entity';
import { Course } from '../src/modules/courses/domain/course.entity';
import { Module } from '../src/modules/courses/domain/module.entity';
import { Lesson } from '../src/modules/courses/domain/lesson.entity';
import { UserProgress } from '../src/modules/progress/domain/learning-progress.entity';
import { ModuleProgress } from '../src/modules/progress/domain/learning-progress.entity';
import { Exercise } from '../src/modules/exercises/domain/question.entity';
import { UserLevel, ProgressStatus } from '../src/common/enums';
import { JwtService } from '@nestjs/jwt';

describe('Course Custom Practice (e2e)', () => {
  let app: INestApplication<App>;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let moduleRepo: Repository<Module>;
  let lessonRepo: Repository<Lesson>;
  let progressRepo: Repository<UserProgress>;
  let moduleProgressRepo: Repository<ModuleProgress>;
  let exerciseRepo: Repository<Exercise>;
  let jwtService: JwtService;
  let authToken: string;
  let testUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    userRepo = app.get(getRepositoryToken(User));
    courseRepo = app.get(getRepositoryToken(Course));
    moduleRepo = app.get(getRepositoryToken(Module));
    lessonRepo = app.get(getRepositoryToken(Lesson));
    progressRepo = app.get(getRepositoryToken(UserProgress));
    moduleProgressRepo = app.get(getRepositoryToken(ModuleProgress));
    exerciseRepo = app.get(getRepositoryToken(Exercise));
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const user = userRepo.create({
      email: `e2e-crspract-${Date.now()}@test.com`,
      password: 'hashedpassword',
      fullName: 'E2E Course Practice User',
      currentLevel: UserLevel.A1,
      onboardingCompleted: true,
    });
    const savedUser = await userRepo.save(user);
    testUserId = savedUser.id;
    authToken = jwtService.sign({ sub: testUserId, email: savedUser.email });
  });

  afterEach(async () => {
    await userRepo.delete(testUserId);
  });

  describe('POST /questions/custom with courseId', () => {
    let courseId: string;
    let moduleId1: string;
    let lessonId1: string;

    beforeEach(async () => {
      const course = courseRepo.create({
        title: 'A1 Course',
        description: 'Test course',
        level: UserLevel.A1,
        orderIndex: 1,
        isPublished: true,
      });
      const savedCourse = await courseRepo.save(course);
      courseId = savedCourse.id;

      const module1 = moduleRepo.create({
        title: 'Module 1',
        description: 'Test module 1',
        orderIndex: 1,
        courseId,
      });
      const savedModule1 = await moduleRepo.save(module1);
      moduleId1 = savedModule1.id;

      const lesson1 = lessonRepo.create({
        title: 'Lesson 1',
        description: 'Test',
        orderIndex: 1,
        moduleId: savedModule1.id,
      });
      const savedLesson1 = await lessonRepo.save(lesson1);
      lessonId1 = savedLesson1.id;

      const progress = progressRepo.create({
        userId: testUserId,
        lessonId: lessonId1,
        status: ProgressStatus.COMPLETED,
        contentViewed: true,
        score: 80,
        completedAt: new Date(),
      });
      await progressRepo.save(progress);

      const moduleProgress = moduleProgressRepo.create({
        userId: testUserId,
        moduleId: moduleId1,
        status: ProgressStatus.COMPLETED,
        completedLessonsCount: 1,
        totalLessonsCount: 1,
        completedAt: new Date(),
      });
      await moduleProgressRepo.save(moduleProgress);
    });

    afterEach(async () => {
      await exerciseRepo.delete({ courseId } as any);
      await moduleProgressRepo.delete({ userId: testUserId, moduleId: moduleId1 });
      await progressRepo.delete({ userId: testUserId, lessonId: lessonId1 });
      await lessonRepo.delete({ moduleId: moduleId1 });
      await moduleRepo.delete(moduleId1);
      await courseRepo.delete(courseId);
    });

    it('creates custom practice exercise with courseId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice', 'matching'],
            focusArea: 'both',
          },
        })
        .expect(201);

      expect(res.body.data.exercise.courseId).toBe(courseId);
      expect(res.body.data.exercise.isCustom).toBe(true);
      expect(res.body.data.exercise.title).toBe('Custom Practice');
    });

    it('creates custom practice exercise with courseId and userPrompt', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice'],
            focusArea: 'both',
          },
          userPrompt: 'Focus on cross-module review',
        })
        .expect(201);

      expect(res.body.data.exercise.courseId).toBe(courseId);
      expect(res.body.data.exercise.userPrompt).toBe('Focus on cross-module review');
    });

    it('returns 400 when courseId has no completed modules', async () => {
      await moduleProgressRepo.delete({
        userId: testUserId,
        moduleId: moduleId1,
      });
      await progressRepo.delete({ userId: testUserId, lessonId: lessonId1 });

      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice'],
            focusArea: 'both',
          },
        })
        .expect(400);
    });

    it('returns 400 when both courseId and moduleId provided (XOR)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          moduleId: moduleId1,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice'],
            focusArea: 'both',
          },
        })
        .expect(400);
    });
  });

  describe('GET /questions/course/:courseId', () => {
    let courseId: string;
    let moduleId1: string;

    beforeEach(async () => {
      const course = courseRepo.create({
        title: 'A1 Course',
        description: 'Test course',
        level: UserLevel.A1,
        orderIndex: 1,
        isPublished: true,
      });
      const savedCourse = await courseRepo.save(course);
      courseId = savedCourse.id;

      const module1 = moduleRepo.create({
        title: 'Module 1',
        description: 'Test module 1',
        orderIndex: 1,
        courseId,
      });
      const savedModule1 = await moduleRepo.save(module1);
      moduleId1 = savedModule1.id;

      const lesson1 = lessonRepo.create({
        title: 'Lesson 1',
        description: 'Test',
        orderIndex: 1,
        moduleId: savedModule1.id,
      });
      const savedLesson1 = await lessonRepo.save(lesson1);

      const progress = progressRepo.create({
        userId: testUserId,
        lessonId: savedLesson1.id,
        status: ProgressStatus.COMPLETED,
        contentViewed: true,
        score: 90,
        completedAt: new Date(),
      });
      await progressRepo.save(progress);

      const moduleProgress = moduleProgressRepo.create({
        userId: testUserId,
        moduleId: moduleId1,
        status: ProgressStatus.COMPLETED,
        completedLessonsCount: 1,
        totalLessonsCount: 1,
        completedAt: new Date(),
      });
      await moduleProgressRepo.save(moduleProgress);
    });

    afterEach(async () => {
      await exerciseRepo.delete({ courseId } as any);
      await moduleProgressRepo.delete({ userId: testUserId, moduleId: moduleId1 });
      await progressRepo.delete({ userId: testUserId });
      await lessonRepo.delete({ moduleId: moduleId1 });
      await moduleRepo.delete(moduleId1);
      await courseRepo.delete(courseId);
    });

    it('returns eligibility and exercises for course', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/exercises/course/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.eligible).toBe(true);
      expect(res.body.data.completedModulesCount).toBe(1);
      expect(res.body.data.totalModulesCount).toBe(1);
      expect(res.body.data.courseExercises).toEqual([]);
    });

    it('returns eligible=false when no completed modules', async () => {
      await moduleProgressRepo.delete({
        userId: testUserId,
        moduleId: moduleId1,
      });
      await progressRepo.delete({ userId: testUserId });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/exercises/course/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.completedModulesCount).toBe(0);
    });

    it('returns created custom practice exercises', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          courseId,
          config: {
            questionCount: 5,
            questionTypes: ['matching'],
            focusArea: 'vocabulary',
          },
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/exercises/course/${courseId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.courseExercises.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.courseExercises[0].isCustom).toBe(true);
    });
  });
});
