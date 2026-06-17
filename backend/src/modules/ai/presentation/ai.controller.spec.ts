import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, MessageEvent } from '@nestjs/common';
import { AiController } from './ai.controller';
import { ConversationService } from '../../conversations/application/conversation.service';
import { AgentService } from '../../agent/application/agent.service';
import { GenaiProvider } from '../../../infrastructure/genai/genai-provider';
import { Observable } from 'rxjs';
import type { StreamEvent } from '../../agent/application/stream-event';

describe('AiController', () => {
  let controller: AiController;
  let conversationService: jest.Mocked<ConversationService>;
  let agentService: jest.Mocked<AgentService>;
  let genaiService: jest.Mocked<GenaiProvider>;

  const mockUser = { id: 'user-1' };
  const mockConversation = {
    id: 'conv-1',
    userId: 'user-1',
    model: 'gemini-2.0-flash',
    systemInstruction: 'You are a tutor.',
    lessonId: undefined,
    title: '',
    screenContext: {},
    totalTokens: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    messages: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  function makeStreamFrom(events: StreamEvent[]): AsyncIterable<StreamEvent> {
    return (async function* () {
      for (const e of events) yield e;
    })();
  }

  async function collect<T>(
    observable: Observable<T>,
    timeoutMs = 2000,
  ): Promise<T[]> {
    return new Promise<T[]>((resolve, reject) => {
      const collected: T[] = [];
      const timer = setTimeout(
        () => reject(new Error('Observable did not complete in time')),
        timeoutMs,
      );
      observable.subscribe({
        next: (event) => collected.push(event),
        complete: () => {
          clearTimeout(timer);
          resolve(collected);
        },
        error: (err) => {
          clearTimeout(timer);
          reject(err instanceof Error ? err : new Error(String(err)));
        },
      });
    });
  }

  beforeEach(async () => {
    conversationService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByUser: jest.fn(),
      addMessage: jest.fn(),
      accumulateTokens: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    agentService = {
      runTurn: jest.fn(),
      runTurnStream: jest.fn(),
    } as any;

    genaiService = {
      chatStream: jest.fn(),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AiController],
      providers: [
        { provide: ConversationService, useValue: conversationService },
        { provide: AgentService, useValue: agentService },
        { provide: GenaiProvider, useValue: genaiService },
      ],
    }).compile();

    controller = module.get<AiController>(AiController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('POST /ai/chat/stream', () => {
    it('returns an Observable that yields encoded SSE events', async () => {
      agentService.runTurnStream.mockReturnValue(
        makeStreamFrom([
          { type: 'text_chunk', text: 'Hi' },
          { type: 'done', messageId: 'msg-1', interrupted: false },
        ]),
      );

      const result = controller.chatStream(mockUser, {
        message: 'hello',
      });

      expect(result).toBeInstanceOf(Observable);
      const events = await collect(result);
      expect(events).toHaveLength(2);
      expect(events[0].type).toBe('text_chunk');
      expect(JSON.parse(events[0].data as string)).toEqual({ text: 'Hi' });
      expect(events[1].type).toBe('done');
      expect(JSON.parse(events[1].data as string)).toEqual({
        messageId: 'msg-1',
        interrupted: false,
      });
    });

    it('emits a full tool-call sequence: tool_start, tool_result, text_chunk, done', async () => {
      agentService.runTurnStream.mockReturnValue(
        makeStreamFrom([
          {
            type: 'tool_start',
            name: 'get_user_summary',
            displayName: 'Đang tóm tắt thông tin của bạn...',
            args: {},
          },
          { type: 'tool_result', name: 'get_user_summary', ok: true },
          { type: 'text_chunk', text: 'Bạn đang học rất tốt!' },
          { type: 'done', messageId: 'msg-2', interrupted: false },
        ]),
      );

      const observable = controller.chatStream(mockUser, {
        message: 'How am I doing?',
        screenContext: {
          route: '/',
          displayName: 'Trang chủ',
          barPlaceholder: 'Hỏi gì đi nào?',
          data: {},
        },
      });

      const events = await collect(observable);
      expect(events.map((e) => e.type)).toEqual([
        'tool_start',
        'tool_result',
        'text_chunk',
        'done',
      ]);
    });

    it('forwards userId, conversationId, message, screenContext, and abortSignal to AgentService', async () => {
      agentService.runTurnStream.mockReturnValue(
        makeStreamFrom([
          { type: 'done', messageId: 'msg-x', interrupted: false },
        ]),
      );
      const sc = {
        route: '/lessons/abc',
        displayName: 'Bài học',
        barPlaceholder: 'Hỏi về bài học?',
        data: { lessonId: 'abc' },
      };

      const observable = controller.chatStream(mockUser, {
        conversationId: 'conv-existing',
        message: 'tell me more',
        screenContext: sc,
      });
      await collect(observable);

      expect(agentService.runTurnStream).toHaveBeenCalledWith(
        'user-1',
        'conv-existing',
        'tell me more',
        sc,
        expect.any(AbortSignal),
      );
    });

    it('passes conversationId=null to the agent when none is provided (lazy create path)', async () => {
      agentService.runTurnStream.mockReturnValue(
        makeStreamFrom([
          { type: 'done', messageId: 'msg-z', interrupted: false },
        ]),
      );

      const observable = controller.chatStream(mockUser, {
        message: 'first message ever',
      });
      await collect(observable);

      expect(agentService.runTurnStream).toHaveBeenCalledWith(
        'user-1',
        null,
        'first message ever',
        undefined,
        expect.any(AbortSignal),
      );
    });

    it('aborts the agent stream when the SSE subscriber unsubscribes', async () => {
      let capturedSignal: AbortSignal | undefined;
      // Build an async iterable we can hold open until abort fires.
      const yieldOne = (event: StreamEvent) => ({
        async *[Symbol.asyncIterator]() {
          yield event;
          // Stall here; the controller's teardown should fire abort and
          // the loop should bail out via the abort signal.
          await new Promise((resolve, reject) => {
            const i = setInterval(() => {
              if (capturedSignal?.aborted) {
                clearInterval(i);
                resolve(undefined);
              }
            }, 5);
            // safety net
            setTimeout(() => {
              clearInterval(i);
              reject(new Error('abort never fired'));
            }, 1000);
          });
        },
      });
      agentService.runTurnStream.mockImplementation((...args: any[]) => {
        capturedSignal = args[4] as AbortSignal;
        return yieldOne({
          type: 'text_chunk',
          text: 'partial',
        }) as any;
      });

      const observable = controller.chatStream(mockUser, {
        message: 'long answer',
      });

      // Subscribe, receive the first event, then unsubscribe to trigger teardown.
      await new Promise<void>((resolve) => {
        const sub = observable.subscribe({
          next: () => {
            // unsubscribe inside next() — same shape the SSE controller hits
            // when Dio cancels mid-stream.
            sub.unsubscribe();
            // Give the agent loop time to observe the aborted signal.
            setTimeout(resolve, 20);
          },
        });
      });

      expect(capturedSignal?.aborted).toBe(true);
    });

    it('emits an error event when the agent stream throws', async () => {
      agentService.runTurnStream.mockReturnValue(
        (async function* () {
          throw new Error('boom');

          yield;
        })() as AsyncIterable<StreamEvent>,
      );

      const observable = controller.chatStream(mockUser, {
        message: 'hi',
      });

      const events = await collect(observable);
      const errorEvt = events.find((e) => e.type === 'error');
      expect(errorEvt).toBeDefined();
      // Generic (non-AiException) errors are sanitized to a safe message;
      // the raw 'boom' must not leak to the client. Code defaults to
      // AI_SERVICE_UNAVAILABLE when the error has no `code`.
      const errorPayload = JSON.parse(errorEvt!.data as string);
      expect(errorPayload.code).toBe('AI_SERVICE_UNAVAILABLE');
      expect(errorPayload.message).toBe('AI service unavailable');
    });
  });

  describe('POST /ai/chat/simple', () => {
    it('creates conversation and runs AI turn', async () => {
      conversationService.create.mockResolvedValue(mockConversation as any);
      agentService.runTurn.mockResolvedValue({
        text: 'Xin chào!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      } as any);

      const result = await controller.chatSimple(mockUser, {
        message: 'Xin chào',
      });

      expect(conversationService.create).toHaveBeenCalledWith('user-1', {
        model: 'gemini-2.0-flash',
        lessonId: undefined,
      });
      expect(agentService.runTurn).toHaveBeenCalledWith('conv-1', 'Xin chào');
      expect(result).toEqual({
        conversationId: 'conv-1',
        text: 'Xin chào!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      });
    });

    it('uses existing conversation when conversationId is provided', async () => {
      agentService.runTurn.mockResolvedValue({
        text: 'Response',
        usageMetadata: {},
      } as any);

      const result = await controller.chatSimple(mockUser, {
        message: 'Hello',
        conversationId: 'conv-1',
      });

      expect(conversationService.create).not.toHaveBeenCalled();
      expect(result.conversationId).toBe('conv-1');
    });
  });

  describe('GET /ai/conversations', () => {
    it('returns paginated conversations for the current user', async () => {
      const mockResult = {
        data: [{ id: 'conv-1' }, { id: 'conv-2' }],
        total: 2,
      };
      conversationService.findByUser.mockResolvedValue(mockResult as any);

      const result = await controller.listConversations(mockUser, {});

      expect(conversationService.findByUser).toHaveBeenCalledWith(
        'user-1',
        1,
        20,
        { courseId: undefined, lessonId: undefined },
      );
      expect(result).toEqual(mockResult);
    });

    it('passes pagination and filter params', async () => {
      conversationService.findByUser.mockResolvedValue({
        data: [],
        total: 0,
      });

      await controller.listConversations(mockUser, {
        page: '2',
        limit: '10',
        courseId: 'course-1',
        lessonId: 'lesson-1',
      });

      expect(conversationService.findByUser).toHaveBeenCalledWith(
        'user-1',
        2,
        10,
        { courseId: 'course-1', lessonId: 'lesson-1' },
      );
    });
  });

  describe('GET /ai/conversations/:id', () => {
    it('returns conversation when user owns it', async () => {
      conversationService.findById.mockResolvedValue(mockConversation as any);

      const result = await controller.getConversation(mockUser, 'conv-1');

      expect(result).toEqual(mockConversation);
    });

    it('throws ForbiddenException when user does not own the conversation', async () => {
      conversationService.findById.mockResolvedValue({
        ...mockConversation,
        userId: 'other-user',
      } as any);

      await expect(
        controller.getConversation(mockUser, 'conv-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('DELETE /ai/conversations/:id', () => {
    it('soft-deletes conversation when user owns it', async () => {
      conversationService.findById.mockResolvedValue(mockConversation as any);
      conversationService.softDelete.mockResolvedValue(undefined);

      await controller.deleteConversation(mockUser, 'conv-1');

      expect(conversationService.softDelete).toHaveBeenCalledWith('conv-1');
    });

    it('throws ForbiddenException when user does not own the conversation', async () => {
      conversationService.findById.mockResolvedValue({
        ...mockConversation,
        userId: 'other-user',
      } as any);

      await expect(
        controller.deleteConversation(mockUser, 'conv-1'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
