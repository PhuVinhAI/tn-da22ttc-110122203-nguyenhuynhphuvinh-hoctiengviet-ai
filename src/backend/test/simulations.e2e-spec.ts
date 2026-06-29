import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { SimulationAiService } from '../src/modules/simulations/application/simulation-ai.service';
import { User } from '../src/modules/users/domain/user.entity';
import {
  UserLevel,
  Difficulty,
  SimulationSessionStatus,
} from '../src/common/enums';
import { ScenarioCategory } from '../src/modules/simulations/domain/scenario-category.entity';
import { Scenario } from '../src/modules/simulations/domain/scenario.entity';
import { ScenarioCharacter } from '../src/modules/simulations/domain/scenario-character.entity';
import { SimulationSession } from '../src/modules/simulations/domain/simulation-session.entity';
import { SimulationResult } from '../src/modules/simulations/domain/simulation-session.entity';

const SCORING_CRITERIA = [
  { name: 'Vocabulary', description: 'Vocabulary usage', weight: 40 },
  { name: 'Grammar', description: 'Grammar accuracy', weight: 30 },
  { name: 'Communication', description: 'Communication effectiveness', weight: 30 },
];

describe('Simulations (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let otherToken: string;
  let testUserId: string;
  let otherUserId: string;

  let userRepo: Repository<User>;
  let categoryRepo: Repository<ScenarioCategory>;
  let scenarioRepo: Repository<Scenario>;
  let characterRepo: Repository<ScenarioCharacter>;
  let sessionRepo: Repository<SimulationSession>;
  let resultRepo: Repository<SimulationResult>;

  let categoryId: string;
  let scenarioId: string;
  let playableCharId: string;
  let npcCharId: string;

  let aiServiceMock: { processTurn: jest.Mock };

  beforeAll(async () => {
    aiServiceMock = { processTurn: jest.fn() };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(SimulationAiService)
      .useValue(aiServiceMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    categoryRepo = moduleFixture.get<Repository<ScenarioCategory>>(
      getRepositoryToken(ScenarioCategory),
    );
    scenarioRepo = moduleFixture.get<Repository<Scenario>>(
      getRepositoryToken(Scenario),
    );
    characterRepo = moduleFixture.get<Repository<ScenarioCharacter>>(
      getRepositoryToken(ScenarioCharacter),
    );
    sessionRepo = moduleFixture.get<Repository<SimulationSession>>(
      getRepositoryToken(SimulationSession),
    );
    resultRepo = moduleFixture.get<Repository<SimulationResult>>(
      getRepositoryToken(SimulationResult),
    );

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    const hashed = await bcrypt.hash('Test1234!', 10);

    const testUser = userRepo.create({
      email: `sim-e2e-${Date.now()}@test.com`,
      password: hashed,
      fullName: 'Sim E2E User',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      currentLevel: UserLevel.A2,
      nativeLanguage: 'English',
    });
    await userRepo.save(testUser);
    testUserId = testUser.id;
    authToken = jwtService.sign({ sub: testUser.id, email: testUser.email });

    const otherUser = userRepo.create({
      email: `sim-other-${Date.now()}@test.com`,
      password: hashed,
      fullName: 'Sim Other User',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      currentLevel: UserLevel.A1,
      nativeLanguage: 'English',
    });
    await userRepo.save(otherUser);
    otherUserId = otherUser.id;
    otherToken = jwtService.sign({
      sub: otherUser.id,
      email: otherUser.email,
    });

    const category = categoryRepo.create({
      name: 'E2E Test Category',
      description: 'Category for e2e tests',
      icon: 'test-icon',
      color: '#FF0000',
      orderIndex: 999,
    });
    await categoryRepo.save(category);
    categoryId = category.id;

    const scenario = scenarioRepo.create({
      categoryId,
      title: 'E2E Test Scenario',
      description: 'Scenario for e2e tests',
      systemPrompt: 'You are a fruit seller at a Vietnamese market.',
      openingMessage: 'Chào em, em muốn mua gì hôm nay?',
      requiredLevel: UserLevel.A1,
      difficulty: Difficulty.EASY,
      scoringCriteria: SCORING_CRITERIA,
      maxTurns: 10,
      estimatedMinutes: 5,
      isPublished: true,
    });
    await scenarioRepo.save(scenario);
    scenarioId = scenario.id;

    const playableChar = characterRepo.create({
      scenarioId,
      name: 'Khách hàng',
      role: 'Người mua hàng',
      personality: 'Friendly and curious',
      speechStyle: 'Casual Vietnamese',
      isPlayable: true,
      orderIndex: 1,
    });
    await characterRepo.save(playableChar);
    playableCharId = playableChar.id;

    const npcChar = characterRepo.create({
      scenarioId,
      name: 'Cô Hồng',
      role: 'Người bán trái cây',
      personality: 'Warm and helpful',
      speechStyle: 'Southern dialect',
      isPlayable: false,
      orderIndex: 2,
    });
    await characterRepo.save(npcChar);
    npcCharId = npcChar.id;
  });

  afterAll(async () => {
    if (otherUserId) await userRepo.delete(otherUserId);
    if (testUserId) await userRepo.delete(testUserId);
    if (scenarioId) await scenarioRepo.delete(scenarioId);
    if (categoryId) await categoryRepo.delete(categoryId);
    if (app) await app.close();
  });

  beforeEach(() => {
    aiServiceMock.processTurn.mockReset();
  });

  describe('Browse scenarios', () => {
    it('GET /categories returns category list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/simulations/categories')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      const cat = res.body.data.find((c: any) => c.id === categoryId);
      expect(cat).toBeDefined();
      expect(cat.name).toBe('E2E Test Category');
    });

    it('GET /scenarios returns scenarios with categoryId filter', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/simulations/scenarios?categoryId=${categoryId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      expect(res.body.data.length).toBeGreaterThan(0);
      const s = res.body.data.find((item: any) => item.id === scenarioId);
      expect(s).toBeDefined();
      expect(s.title).toBe('E2E Test Scenario');
      expect(s.category.name).toBe('E2E Test Category');
    });

    it('GET /scenarios/:id returns scenario detail with characters', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/simulations/scenarios/${scenarioId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(scenarioId);
      expect(res.body.data.title).toBe('E2E Test Scenario');
      expect(res.body.data.openingMessage).toBe(
        'Chào em, em muốn mua gì hôm nay?',
      );
      expect(res.body.data.characters).toBeInstanceOf(Array);
      expect(res.body.data.characters.length).toBe(2);
      const playable = res.body.data.characters.find(
        (c: any) => c.isPlayable === true,
      );
      const npc = res.body.data.characters.find(
        (c: any) => c.isPlayable === false,
      );
      expect(playable).toBeDefined();
      expect(npc).toBeDefined();
    });
  });

  describe('Happy path — full simulation flow', () => {
    let sessionId: string;
    let resultId: string;

    it('creates session with opening message', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });

      expect(res.status).toBe(201);
      expect(res.body.data.session).toBeDefined();
      expect(res.body.data.session.status).toBe('ACTIVE');
      expect(res.body.data.session.chosenCharacterId).toBe(playableCharId);
      sessionId = res.body.data.session.id;

      expect(res.body.data.openingMessage).toBeDefined();
      expect(res.body.data.openingMessage.content).toBe(
        'Chào em, em muốn mua gì hôm nay?',
      );
      expect(res.body.data.openingMessage.isLearner).toBe(false);
    });

    it('sends message and receives AI response with feedback', async () => {
      aiServiceMock.processTurn.mockResolvedValue({
        messages: [
          {
            speakerCharacterId: npcCharId,
            speakerName: 'Cô Hồng',
            content: 'Dạ, trái cây tươi lắm, em muốn mua gì nè?',
          },
        ],
        nextTurnCharacterId: playableCharId,
        feedback: {
          corrections: [
            {
              original: 'cho tôi',
              corrected: 'cho tôi',
              type: 'grammar',
              severity: 'warning',
              startIndex: 0,
              endIndex: 7,
            },
          ],
          review: 'Try using more polite forms.',
          reviewAvailable: true,
        },
        sessionEnded: false,
        tokenCount: 50,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/simulations/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Cho tôi mua một ký trái cây' });

      expect(res.status).toBe(201);
      expect(res.body.data.messages).toBeInstanceOf(Array);
      expect(res.body.data.messages.length).toBe(1);
      expect(res.body.data.messages[0].speakerCharacterId).toBe(npcCharId);
      expect(res.body.data.messages[0].speakerName).toBe('Cô Hồng');
      expect(res.body.data.feedback).toBeDefined();
      expect(res.body.data.feedback.reviewAvailable).toBe(true);
      expect(res.body.data.feedback.corrections.length).toBeGreaterThan(0);
      expect(res.body.data.sessionEnded).toBe(false);
    });

    it('session completes with result and scores', async () => {
      aiServiceMock.processTurn.mockResolvedValue({
        messages: [
          {
            speakerCharacterId: npcCharId,
            speakerName: 'Cô Hồng',
            content: 'Cảm ơn em, hẹn gặp lại!',
          },
        ],
        nextTurnCharacterId: playableCharId,
        feedback: null,
        sessionEnded: true,
        endReason: 'COMPLETED',
        criteriaScores: [
          {
            name: 'Vocabulary',
            score: 75,
            comment: 'Good vocabulary',
          },
          {
            name: 'Grammar',
            score: 75,
            comment: 'Some errors',
          },
          {
            name: 'Communication',
            score: 75,
            comment: 'Natural flow',
          },
        ],
        aiSummary: 'Good effort! Keep practicing.',
        tokenCount: 80,
      });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/simulations/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Cảm ơn cô, tôi sẽ quay lại' });

      expect(res.status).toBe(201);
      expect(res.body.data.sessionEnded).toBe(true);
      expect(res.body.data.endReason).toBe('COMPLETED');
      expect(res.body.data.result).toBeDefined();
      expect(res.body.data.result.totalScore).toBe(75);
      expect(res.body.data.result.criteriaScores).toBeInstanceOf(Array);
      expect(res.body.data.result.criteriaScores.length).toBe(3);
      expect(res.body.data.result.aiSummary).toBe(
        'Good effort! Keep practicing.',
      );
      resultId = res.body.data.result.id;
    });

    it('result appears in results list', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/simulations/results')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeInstanceOf(Array);
      const result = res.body.data.find((r: any) => r.id === resultId);
      expect(result).toBeDefined();
      expect(result.totalScore).toBe(75);
      expect(result.endReason).toBe('COMPLETED');
      expect(result.scenarioTitle).toBe('E2E Test Scenario');
      expect(result.chosenCharacterName).toBe('Khách hàng');
    });

    it('result detail includes criteria scores and relations', async () => {
      const res = await request(app.getHttpServer())
        .get(`/api/v1/simulations/results/${resultId}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.totalScore).toBe(75);
      expect(res.body.data.criteriaScores.length).toBe(3);
      expect(res.body.data.endReason).toBe('COMPLETED');
      expect(res.body.data.aiSummary).toBe('Good effort! Keep practicing.');
      expect(res.body.data.scenario.title).toBe('E2E Test Scenario');
      expect(res.body.data.chosenCharacter.name).toBe('Khách hàng');
    });
  });

  describe('1-session constraint', () => {
    let firstSessionId: string;

    it('rejects second session with 409 Conflict', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      expect(createRes.status).toBe(201);
      firstSessionId = createRes.body.data.session.id;

      const res = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      expect(res.status).toBe(409);
    });

    it('allows new session after canceling the first', async () => {
      const cancelRes = await request(app.getHttpServer())
        .delete(`/api/v1/simulations/sessions/${firstSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(cancelRes.status).toBe(204);

      const res = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      expect(res.status).toBe(201);

      await request(app.getHttpServer())
        .delete(`/api/v1/simulations/sessions/${res.body.data.session.id}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Active session endpoint', () => {
    let activeSessionId: string;

    it('GET /sessions/active returns null when no incomplete session', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/v1/simulations/sessions/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });

    it('GET /sessions/active returns incomplete session with scenario/character info', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      expect(createRes.status).toBe(201);
      activeSessionId = createRes.body.data.session.id;

      const res = await request(app.getHttpServer())
        .get('/api/v1/simulations/sessions/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeDefined();
      expect(res.body.data.id).toBe(activeSessionId);
      expect(res.body.data.scenarioId).toBe(scenarioId);
      expect(res.body.data.scenarioTitle).toBe('E2E Test Scenario');
      expect(res.body.data.chosenCharacterId).toBe(playableCharId);
      expect(res.body.data.chosenCharacterName).toBe('Khách hàng');
      expect(res.body.data.status).toBe('ACTIVE');
    });

    it('GET /sessions/active returns PAUSED session', async () => {
      await sessionRepo.update(
        { id: activeSessionId },
        { status: SimulationSessionStatus.PAUSED },
      );

      const res = await request(app.getHttpServer())
        .get('/api/v1/simulations/sessions/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data.id).toBe(activeSessionId);
      expect(res.body.data.status).toBe('PAUSED');
    });

    it('GET /sessions/active returns null after session cancelled', async () => {
      await request(app.getHttpServer())
        .delete(`/api/v1/simulations/sessions/${activeSessionId}`)
        .set('Authorization', `Bearer ${authToken}`);

      const res = await request(app.getHttpServer())
        .get('/api/v1/simulations/sessions/active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toBeNull();
    });
  });

  describe('Pause/resume flow', () => {
    it('auto-resumes PAUSED session on GET with full message history', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      expect(createRes.status).toBe(201);
      const sessionId = createRes.body.data.session.id;

      aiServiceMock.processTurn.mockResolvedValue({
        messages: [
          {
            speakerCharacterId: npcCharId,
            speakerName: 'Cô Hồng',
            content: 'Dạ, em muốn mua gì?',
          },
        ],
        nextTurnCharacterId: playableCharId,
        feedback: null,
        sessionEnded: false,
        tokenCount: 30,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/simulations/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Cho tôi xem trái cây' });

      await sessionRepo.update(
        { id: sessionId },
        { status: SimulationSessionStatus.PAUSED },
      );

      const res = await request(app.getHttpServer())
        .get(`/api/v1/simulations/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
      expect(res.status).toBe(200);
      expect(res.body.data.session.status).toBe('ACTIVE');
      expect(res.body.data.messages).toBeInstanceOf(Array);
      expect(res.body.data.messages.length).toBeGreaterThan(0);

      await request(app.getHttpServer())
        .delete(`/api/v1/simulations/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });

  describe('Permission guard', () => {
    const endpoints = [
      { method: 'get' as const, path: '/api/v1/simulations/categories' },
      { method: 'get' as const, path: '/api/v1/simulations/scenarios' },
      {
        method: 'get' as const,
        path: `/api/v1/simulations/scenarios/${scenarioId}`,
      },
      {
        method: 'post' as const,
        path: '/api/v1/simulations/sessions',
        body: { scenarioId, chosenCharacterId: playableCharId },
      },
      { method: 'get' as const, path: '/api/v1/simulations/results' },
    ];

    it('rejects unauthenticated requests with 401', async () => {
      for (const ep of endpoints) {
        const req = request(app.getHttpServer())[ep.method](ep.path);
        if (ep.body) req.send(ep.body);
        const res = await req;
        expect(res.status).toBe(401);
      }
    });

  });

  describe('Validation', () => {
    it('returns 404 for non-existent scenario', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          scenarioId: '00000000-0000-0000-0000-000000000000',
          chosenCharacterId: playableCharId,
        });
      expect(res.status).toBe(404);
    });

    it('returns 404 for non-playable character', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: npcCharId });
      expect(res.status).toBe(404);
    });

    it('returns 400 when sending message to completed session', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      const sessionId = createRes.body.data.session.id;

      aiServiceMock.processTurn.mockResolvedValue({
        messages: [
          {
            speakerCharacterId: npcCharId,
            speakerName: 'Cô Hồng',
            content: 'Tạm biệt em!',
          },
        ],
        nextTurnCharacterId: playableCharId,
        feedback: null,
        sessionEnded: true,
        endReason: 'COMPLETED',
        totalScore: 50,
        criteriaScores: SCORING_CRITERIA.map((c) => ({
          name: c.name,
          score: 0,
          comment: '',
        })),
        aiSummary: 'Session ended.',
        tokenCount: 20,
      });

      await request(app.getHttpServer())
        .post(`/api/v1/simulations/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Tạm biệt cô' });

      const res = await request(app.getHttpServer())
        .post(`/api/v1/simulations/sessions/${sessionId}/messages`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ content: 'Xin chào lại' });
      expect(res.status).toBe(400);
    });

    it('returns 403 when accessing another user session', async () => {
      const createRes = await request(app.getHttpServer())
        .post('/api/v1/simulations/sessions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ scenarioId, chosenCharacterId: playableCharId });
      const sessionId = createRes.body.data.session.id;

      const res = await request(app.getHttpServer())
        .get(`/api/v1/simulations/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${otherToken}`);
      expect(res.status).toBe(403);

      await request(app.getHttpServer())
        .delete(`/api/v1/simulations/sessions/${sessionId}`)
        .set('Authorization', `Bearer ${authToken}`);
    });
  });
});
