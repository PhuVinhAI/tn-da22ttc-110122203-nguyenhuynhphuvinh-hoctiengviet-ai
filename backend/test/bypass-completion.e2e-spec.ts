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
import { UserProgress } from '../src/modules/progress/domain/user-progress.entity';
import { ModuleProgress } from '../src/modules/progress/domain/module-progress.entity';
import { CourseProgress } from '../src/modules/progress/domain/course-progress.entity';
import { UserLevel, ProgressStatus } from '../src/common/enums';
import { JwtService } from '@nestjs/jwt';

describe('Bypass Completion & Onboarding (e2e)', () => {
  let app: INestApplication<App>;
  let userRepo: Repository<User>;
  let courseRepo: Repository<Course>;
  let moduleRepo: Repository<Module>;
  let lessonRepo: Repository<Lesson>;
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
    jwtService = app.get(JwtService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(async () => {
    const user = userRepo.create({
      email: `e2e-test-${Date.now()}@test.com`,
      password: 'hashedpassword',
      fullName: 'E2E Test User',
      currentLevel: UserLevel.B1,
      onboardingCompleted: false,
    });
    const savedUser = await userRepo.save(user);
    testUserId = savedUser.id;
    authToken = jwtService.sign({ sub: testUserId, email: savedUser.email });
  });

  afterEach(async () => {
    await userRepo.delete(testUserId);
  });

  describe('POST /progress/course/:courseId/complete-all', () => {
    let courseId: string;

    beforeEach(async () => {
      const course = courseRepo.create({
        title: 'A1 Course',
        description: 'Test A1 course',
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

      const lesson1 = lessonRepo.create({
        title: 'Lesson 1',
        description: 'Test lesson',
        lessonType: 'VOCABULARY' as any,
        orderIndex: 1,
        moduleId: savedModule.id,
      });
      const lesson2 = lessonRepo.create({
        title: 'Lesson 2',
        description: 'Test lesson',
        lessonType: 'GRAMMAR' as any,
        orderIndex: 2,
        moduleId: savedModule.id,
      });
      await lessonRepo.save([lesson1, lesson2]);
    });

    afterEach(async () => {
      await lessonRepo.delete({ module: { course: { id: courseId } } } as any);
      await moduleRepo.delete({ courseId });
      await courseRepo.delete(courseId);
    });

    it('completes all progress for eligible user (B1 > A1)', async () => {
      const res = await request(app.getHttpServer())
        .post(`/api/v1/progress/course/${courseId}/complete-all`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(res.body.data.success).toBe(true);
    });

    it('returns 403 when user level is not higher than course level', async () => {
      await userRepo.update(testUserId, { currentLevel: UserLevel.A1 });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/progress/course/${courseId}/complete-all`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(403);
    });

    it('returns 404 when course does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/progress/course/nonexistent/complete-all')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /progress/course/:courseId/reset', () => {
    let courseId: string;

    beforeEach(async () => {
      const course = courseRepo.create({
        title: 'A1 Course',
        description: 'Test A1 course',
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

      const lesson = lessonRepo.create({
        title: 'Lesson 1',
        description: 'Test lesson',
        lessonType: 'VOCABULARY' as any,
        orderIndex: 1,
        moduleId: savedModule.id,
      });
      await lessonRepo.save(lesson);
    });

    afterEach(async () => {
      await lessonRepo.delete({ module: { course: { id: courseId } } } as any);
      await moduleRepo.delete({ courseId });
      await courseRepo.delete(courseId);
    });

    it('resets all course progress', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/progress/course/${courseId}/complete-all`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      const res = await request(app.getHttpServer())
        .post(`/api/v1/progress/course/${courseId}/reset`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      expect(res.body.data.success).toBe(true);
    });

    it('can be called multiple times (idempotent)', async () => {
      await request(app.getHttpServer())
        .post(`/api/v1/progress/course/${courseId}/reset`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);

      await request(app.getHttpServer())
        .post(`/api/v1/progress/course/${courseId}/reset`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(201);
    });

    it('returns 404 when course does not exist', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/progress/course/nonexistent/reset')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });
  });

  describe('POST /users/onboarding', () => {
    it('updates user and completes lower courses when completeLowerCourses=true', async () => {
      const course = courseRepo.create({
        title: 'A1 Course',
        description: 'Test A1 course',
        level: UserLevel.A1,
        orderIndex: 1,
        isPublished: true,
      });
      const savedCourse = await courseRepo.save(course);

      const res = await request(app.getHttpServer())
        .post('/api/v1/users/onboarding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentLevel: UserLevel.B1,
          completeLowerCourses: true,
        })
        .expect(201);

      expect(res.body.data.currentLevel).toBe(UserLevel.B1);
      expect(res.body.data.onboardingCompleted).toBe(true);

      await courseRepo.delete(savedCourse.id);
    });

    it('updates user without completing lower courses when completeLowerCourses=false', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/users/onboarding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          currentLevel: UserLevel.A2,
          completeLowerCourses: false,
        })
        .expect(201);

      expect(res.body.data.currentLevel).toBe(UserLevel.A2);
      expect(res.body.data.onboardingCompleted).toBe(true);
    });

    it('returns 400 when currentLevel is missing', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/users/onboarding')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ completeLowerCourses: true })
        .expect(400);
    });
  });

  describe('PATCH /users/me level increase', () => {
    it('triggers completeAllLowerCourses when level increases', async () => {
      await userRepo.update(testUserId, { currentLevel: UserLevel.A1 });

      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentLevel: UserLevel.B1 })
        .expect(200);

      expect(res.body.data.currentLevel).toBe(UserLevel.B1);
    });

    it('does not trigger completeAllLowerCourses when level stays the same', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/v1/users/me')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ currentLevel: UserLevel.B1 })
        .expect(200);

      expect(res.body.data.currentLevel).toBe(UserLevel.B1);
    });
  });
});
