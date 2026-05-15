import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, Reflector } from '@nestjs/common';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtAuthGuard } from '../../src/modules/auth/guards/jwt-auth.guard';
import { DailyGoalsModule } from '../../src/modules/daily-goals/daily-goals.module';
import { AuthModule } from '../../src/modules/auth/auth.module';
import { UsersModule } from '../../src/modules/users/users.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { DailyStreak } from '../../src/modules/daily-goals/domain/daily-streak.entity';
import { DailyStreakService } from '../../src/modules/daily-goals/application/daily-streak.service';
import { DailyStreakRepository } from '../../src/modules/daily-goals/application/daily-streak.repository';

describe('Daily Streak (e2e)', () => {
  let app: INestApplication<App>;
  let streakService: DailyStreakService;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          load: [
            () => ({
              app: { apiPrefix: 'api', apiVersion: 'v1', port: 0 },
              database: {
                type: 'better-sqlite3',
                database: ':memory:',
                synchronize: true,
              },
              jwt: {
                secret: 'test-secret-key-for-e2e-testing',
                expiresIn: '1h',
              },
              redis: { host: 'localhost', port: 6379 },
            }),
          ],
        }),
        TypeOrmModule.forRootAsync({
          useFactory: () => ({
            type: 'better-sqlite3' as const,
            database: ':memory:',
            synchronize: true,
            autoLoadEntities: true,
          }),
        }),
        ThrottlerModule.forRoot([{ limit: 1000, ttl: 60000 }]),
        AuthModule,
        UsersModule,
        DailyGoalsModule,
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    app.useGlobalInterceptors(
      new ClassSerializerInterceptor(app.get(Reflector)),
    );
    await app.init();

    streakService = moduleFixture.get(DailyStreakService);

    const registerRes = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: `streak-test-${Date.now()}@test.com`,
        password: 'Test1234!',
        fullName: 'Streak Test User',
      });

    authToken = registerRes.body.data.accessToken;
    userId = registerRes.body.data.user.id;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Streak flow via progress endpoint', () => {
    it('creates a goal and returns streak=0 when goals not yet met', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/daily-goals')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ goalType: 'EXERCISES', targetValue: 5 })
        .expect(201);

      const res = await request(app.getHttpServer())
        .get('/api/v1/daily-goals/progress/today')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(res.body.data.currentStreak).toBe(0);
      expect(res.body.data.longestStreak).toBe(0);
      expect(res.body.data.allGoalsMet).toBe(false);
    });

    it('increments streak when all goals met for the first time', async () => {
      const streak = await streakService.updateStreak(userId, true, '2025-01-15');
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(1);
    });

    it('continues streak on consecutive day', async () => {
      const streak = await streakService.updateStreak(userId, true, '2025-01-16');
      expect(streak.currentStreak).toBe(2);
      expect(streak.longestStreak).toBe(2);
    });

    it('resets streak on gap day then met', async () => {
      const streak = await streakService.updateStreak(userId, true, '2025-01-20');
      expect(streak.currentStreak).toBe(1);
      expect(streak.longestStreak).toBe(2);
    });

    it('resets streak to 0 when not all goals met', async () => {
      const streak = await streakService.updateStreak(userId, false, '2025-01-21');
      expect(streak.currentStreak).toBe(0);
      expect(streak.longestStreak).toBe(2);
    });

    it('updates longestStreak when current exceeds it', async () => {
      await streakService.updateStreak(userId, true, '2025-01-22');
      await streakService.updateStreak(userId, true, '2025-01-23');
      await streakService.updateStreak(userId, true, '2025-01-24');

      const streak = await streakService.getStreak(userId);
      expect(streak!.currentStreak).toBe(3);
      expect(streak!.longestStreak).toBe(3);
    });
  });
});
