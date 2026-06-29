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
import { Exercise } from '../src/modules/exercises/domain/question.entity';
import { UserLevel, ProgressStatus } from '../src/common/enums';
import { JwtService } from '@nestjs/jwt';

describe('Module Custom Practice (e2e)', () => {
  let app: INestApplication<App>;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let moduleRepo: Repository<Module>;
  let lessonRepo: Repository<Lesson>;
  let progressRepo: Repository<UserProgress>;
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
    exerciseRepo = app.get(getRepositoryToken(Exercise));
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const user = userRepo.create({
      email: `e2e-modpract-${Date.now()}@test.com`,
      password: 'hashedpassword',
      fullName: 'E2E Module Practice User',
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

  describe('POST /questions/custom with moduleId', () => {
    let courseId: string;
    let moduleId: string;
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

      const module = moduleRepo.create({
        title: 'Module 1',
        description: 'Test module',
        orderIndex: 1,
        courseId,
      });
      const savedModule = await moduleRepo.save(module);
      moduleId = savedModule.id;

      const lesson1 = lessonRepo.create({
        title: 'Lesson 1',
        description: 'Test',
        orderIndex: 1,
        moduleId: savedModule.id,
      });
      const savedLesson1 = await lessonRepo.save(lesson1);
      lessonId1 = savedLesson1.id;

      const lesson2 = lessonRepo.create({
        title: 'Lesson 2',
        description: 'Test',
        orderIndex: 2,
        moduleId: savedModule.id,
      });
      await lessonRepo.save(lesson2);

      const progress = progressRepo.create({
        userId: testUserId,
        lessonId: lessonId1,
        status: ProgressStatus.COMPLETED,
        contentViewed: true,
        score: 80,
        completedAt: new Date(),
      });
      await progressRepo.save(progress);
    });

    afterEach(async () => {
      await exerciseRepo.delete({ moduleId } as any);
      await progressRepo.delete({ userId: testUserId });
      await lessonRepo.delete({ moduleId });
      await moduleRepo.delete(moduleId);
      await courseRepo.delete(courseId);
    });

    it('creates custom practice exercise with moduleId', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice', 'matching'],
            focusArea: 'both',
          },
        })
        .expect(201);

      expect(res.body.data.exercise.moduleId).toBe(moduleId);
      expect(res.body.data.exercise.isCustom).toBe(true);
      expect(res.body.data.exercise.title).toBe('Custom Practice');
    });

    it('returns 400 when moduleId has no completed lessons', async () => {
      await progressRepo.delete({ userId: testUserId });

      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice'],
            focusArea: 'both',
          },
        })
        .expect(400);
    });

    it('returns 400 when both lessonId and moduleId provided (XOR)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          lessonId: lessonId1,
          moduleId,
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice'],
            focusArea: 'both',
          },
        })
        .expect(400);
    });

    it('returns 400 when no scope provided (XOR)', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          config: {
            questionCount: 10,
            questionTypes: ['multiple_choice'],
            focusArea: 'both',
          },
        })
        .expect(400);
    });
  });

  describe('GET /questions/module/:moduleId', () => {
    let courseId: string;
    let moduleId: string;

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

      const module = moduleRepo.create({
        title: 'Module 1',
        description: 'Test module',
        orderIndex: 1,
        courseId,
      });
      const savedModule = await moduleRepo.save(module);
      moduleId = savedModule.id;

      const lesson1 = lessonRepo.create({
        title: 'Lesson 1',
        description: 'Test',
        orderIndex: 1,
        moduleId: savedModule.id,
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
    });

    afterEach(async () => {
      await exerciseRepo.delete({ moduleId } as any);
      await progressRepo.delete({ userId: testUserId });
      await lessonRepo.delete({ moduleId });
      await moduleRepo.delete(moduleId);
      await courseRepo.delete(courseId);
    });

    it('returns eligibility and exercises for module', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/exercises/module/${moduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.eligible).toBe(true);
      expect(res.body.data.completedLessonsCount).toBe(1);
      expect(res.body.data.totalLessonsCount).toBe(1);
      expect(res.body.data.moduleExercises).toEqual([]);
    });

    it('returns eligible=false when no completed lessons', async () => {
      await progressRepo.delete({ userId: testUserId });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/exercises/module/${moduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.eligible).toBe(false);
      expect(res.body.data.completedLessonsCount).toBe(0);
    });

    it('returns created custom practice exercises', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/exercises/custom')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          moduleId,
          config: {
            questionCount: 5,
            questionTypes: ['matching'],
            focusArea: 'vocabulary',
          },
        });

      const res = await request(app.getHttpServer())
        .get(`/api/v1/exercises/module/${moduleId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.moduleExercises.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.moduleExercises[0].isCustom).toBe(true);
    });
  });
});
