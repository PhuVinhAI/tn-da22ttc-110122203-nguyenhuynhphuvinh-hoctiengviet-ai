import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { AI_PROVIDER } from '../src/infrastructure/genai/genai.module';
import { User } from '../src/modules/users/domain/user.entity';
import { Role as RoleEntity } from '../src/modules/auth/domain/role.entity';
import { Role as RoleEnum } from '../src/common/enums';

interface SsePacket {
  event: string;
  data: any;
}

function parseSse(raw: string): SsePacket[] {
  const packets: SsePacket[] = [];
  // NestJS Sse decorator emits `event: <type>\ndata: <json>\n\n` per frame.
  const frames = raw.split(/\r?\n\r?\n/);
  for (const frame of frames) {
    if (!frame.trim()) continue;
    let event = 'message';
    let data = '';
    for (const line of frame.split(/\r?\n/)) {
      if (line.startsWith('event:')) event = line.slice('event:'.length).trim();
      else if (line.startsWith('data:'))
        data += line.slice('data:'.length).trim();
    }
    if (data) {
      try {
        packets.push({ event, data: JSON.parse(data) });
      } catch {
        packets.push({ event, data });
      }
    }
  }
  return packets;
}

describe('POST /ai/chat/stream (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let testUserEmail: string;
  let userRepo: Repository<User>;
  let aiProviderMock: {
    chat: jest.Mock;
    chatStream: jest.Mock;
    embed: jest.Mock;
    uploadFile: jest.Mock;
    generateImage: jest.Mock;
  };

  beforeAll(async () => {
    aiProviderMock = {
      chat: jest.fn(),
      chatStream: jest.fn(),
      embed: jest.fn(),
      uploadFile: jest.fn(),
      generateImage: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(AI_PROVIDER)
      .useValue(aiProviderMock)
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    // Seed a fully-verified user + USER role-link directly. The default
    // register/login flow goes through email verification which we can't
    // (and shouldn't) drive from an e2e — bypass it by minting the JWT
    // ourselves with the same JwtService the app uses, against a user row
    // already marked `emailVerified=true`.
    userRepo = moduleFixture.get<Repository<User>>(getRepositoryToken(User));
    const roleRepo = moduleFixture.get<Repository<RoleEntity>>(
      getRepositoryToken(RoleEntity),
    );
    const userRole = await roleRepo.findOne({
      where: { name: RoleEnum.USER },
    });
    if (!userRole) {
      throw new Error(
        'USER role not seeded by RbacService — verify db:up and seed flow',
      );
    }

    testUserEmail = `ai-stream-${Date.now()}@test.com`;
    const hashed = await bcrypt.hash('Test1234!', 10);
    const user = userRepo.create({
      email: testUserEmail,
      password: hashed,
      fullName: 'AI Stream Test User',
      emailVerified: true,
      emailVerifiedAt: new Date(),
      roles: [userRole],
    });
    await userRepo.save(user);

    const jwtService = moduleFixture.get<JwtService>(JwtService);
    authToken = jwtService.sign({ sub: user.id, email: user.email });
  });

  afterAll(async () => {
    if (userRepo && testUserEmail) {
      await userRepo.delete({ email: testUserEmail });
    }
    if (app) await app.close();
  });

  beforeEach(() => {
    aiProviderMock.chat.mockReset();
  });

  it('emits tool_start + tool_result + text_chunk + done for "How am I doing?" with screen context', async () => {
    aiProviderMock.chat
      .mockResolvedValueOnce({
        text: '',
        functionCalls: [{ name: 'get_user_summary', arguments: {} }],
        usageMetadata: { promptTokenCount: 8, candidatesTokenCount: 0 },
      })
      .mockResolvedValueOnce({
        text: 'Bạn đã học liên tục 0 ngày, mục tiêu chưa được đặt. Hãy bắt đầu!',
        usageMetadata: { promptTokenCount: 16, candidatesTokenCount: 14 },
      });

    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/chat/stream')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'text/event-stream')
      .send({
        message: 'How am I doing?',
        screenContext: {
          route: '/',
          displayName: 'Trang chủ',
          barPlaceholder: 'Hỏi gì đi nào?',
          data: {},
        },
      })
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () =>
          callback(null, Buffer.concat(chunks).toString('utf-8')),
        );
        response.on('error', (err) => callback(err, null as any));
      });

    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/text\/event-stream/);

    const packets = parseSse(res.body as unknown as string);
    expect(packets.map((p) => p.event)).toEqual([
      'conversation_started',
      'tool_start',
      'tool_result',
      'text_chunk',
      'done',
    ]);

    expect(typeof packets[0].data.conversationId).toBe('string');
    expect((packets[0].data.conversationId as string).length).toBeGreaterThan(0);
    expect(packets[1].data).toEqual({
      name: 'get_user_summary',
      displayName: 'Đang tóm tắt thông tin của bạn...',
      args: {},
    });
    expect(packets[2].data).toEqual({
      name: 'get_user_summary',
      ok: true,
    });
    expect(packets[3].data.text).toContain('Bạn đã học liên tục');
    expect(packets[4].data.interrupted).toBe(false);
    expect(typeof packets[4].data.messageId).toBe('string');
    expect(packets[4].data.messageId.length).toBeGreaterThan(0);
  });

  it('uses the rendered assistant-tutor system instruction when screenContext is non-empty', async () => {
    aiProviderMock.chat.mockResolvedValueOnce({
      text: 'Câu trả lời.',
      usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
    });

    await request(app.getHttpServer())
      .post('/api/v1/ai/chat/stream')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Accept', 'text/event-stream')
      .send({
        message: 'xin chào',
        screenContext: {
          route: '/lessons/abc',
          displayName: 'Bài học: Chào hỏi',
          barPlaceholder: 'Hỏi về bài học?',
          data: { lessonId: 'abc' },
        },
      })
      .buffer(true)
      .parse((response, callback) => {
        const chunks: Buffer[] = [];
        response.on('data', (chunk: Buffer) => chunks.push(chunk));
        response.on('end', () =>
          callback(null, Buffer.concat(chunks).toString('utf-8')),
        );
        response.on('error', (err) => callback(err, null as any));
      });

    expect(aiProviderMock.chat).toHaveBeenCalledWith(
      expect.objectContaining({
        systemInstruction: expect.stringContaining('Trợ lý AI'),
      }),
    );
    const lastCallArg = aiProviderMock.chat.mock.calls[
      aiProviderMock.chat.mock.calls.length - 1
    ][0];
    expect(lastCallArg.systemInstruction).toContain('lessonId');
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/ai/chat/stream')
      .send({ message: 'hi' });

    expect(res.status).toBe(401);
  });
});
