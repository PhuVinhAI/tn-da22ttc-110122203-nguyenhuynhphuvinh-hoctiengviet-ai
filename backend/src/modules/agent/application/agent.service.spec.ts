import { Test, TestingModule } from '@nestjs/testing';
import { AgentService, AI_TOOL_MAX_ITERATIONS } from './agent.service';
import { ConversationService } from '../../conversations/application/conversation.service';
import { GenaiService } from '../../../infrastructure/genai/genai.service';
import { UsersService } from '../../users/application/users.service';
import { ConversationMessageRole } from '../../../common/enums';
import { ZodError } from 'zod';

abstract class BaseTool<TParams = any, TResult = any> {
  abstract readonly name: string;
  abstract readonly displayName: string;
  abstract readonly description: string;
  abstract readonly parameters: any;
  abstract execute(params: TParams, ctx: any): Promise<TResult>;
  toDeclaration() {
    return { name: this.name, description: this.description, parameters: {} };
  }
}

class MockTool extends BaseTool<{ input: string }, { output: string }> {
  readonly name = 'mock_tool';
  readonly displayName = 'Đang chạy mock tool...';
  readonly description = 'A mock tool';
  readonly parameters = { parse: jest.fn() } as any;

  async execute(params: { input: string }): Promise<{ output: string }> {
    return { output: `processed: ${params.input}` };
  }
}

describe('AgentService', () => {
  let service: AgentService;
  let aiProvider: {
    chat: jest.Mock;
    chatStream: jest.Mock;
    embed: jest.Mock;
    uploadFile: jest.Mock;
    generateImage: jest.Mock;
  };
  let conversationService: jest.Mocked<ConversationService>;
  let genaiService: jest.Mocked<GenaiService>;
  let usersService: jest.Mocked<UsersService>;
  let mockTool: MockTool & {
    parameters: { parse: jest.Mock };
    execute: jest.Mock;
    toDeclaration: jest.Mock;
  };

  const mockUser = {
    id: 'user-1',
    email: 'a@b.com',
    nativeLanguage: 'English',
    currentLevel: 'A1',
    preferredDialect: 'STANDARD',
  };

  beforeEach(async () => {
    aiProvider = {
      chat: jest.fn(),
      chatStream: jest.fn(),
      embed: jest.fn(),
      uploadFile: jest.fn(),
      generateImage: jest.fn(),
    };

    conversationService = {
      findById: jest.fn(),
      addMessage: jest.fn(),
      accumulateTokens: jest.fn(),
      create: jest.fn(),
      findByUser: jest.fn(),
      softDelete: jest.fn(),
    } as any;

    genaiService = {
      renderPrompt: jest.fn(),
    } as any;

    usersService = {
      findById: jest.fn().mockResolvedValue(mockUser),
    } as any;

    mockTool = {
      name: 'mock_tool',
      displayName: 'Đang chạy mock tool...',
      description: 'A mock tool',
      parameters: { parse: jest.fn() },
      execute: jest.fn(),
      toDeclaration: jest.fn().mockReturnValue({
        name: 'mock_tool',
        description: 'A mock tool',
        parameters: {},
      }),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AgentService,
        { provide: 'AI_PROVIDER', useValue: aiProvider },
        { provide: ConversationService, useValue: conversationService },
        { provide: GenaiService, useValue: genaiService },
        { provide: UsersService, useValue: usersService },
        { provide: 'TOOLS', useValue: [mockTool] },
      ],
    }).compile();

    service = module.get<AgentService>(AgentService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('runTurn', () => {
    const conversationId = 'conv-1';
    const userMessage = 'Hello';
    const screenContext = { route: '/home', displayName: 'Trang chủ' };

    beforeEach(() => {
      conversationService.findById.mockResolvedValue({
        id: conversationId,
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are a helpful assistant.',
        lessonId: undefined,
        title: '',
        screenContext,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);

      conversationService.addMessage.mockResolvedValue({} as any);
      conversationService.accumulateTokens.mockResolvedValue({} as any);
    });

    it('should complete with final text when no function calls', async () => {
      const response = {
        text: 'Hi there!',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      aiProvider.chat.mockResolvedValue(response);

      const result = await service.runTurn(conversationId, userMessage);

      expect(aiProvider.chat).toHaveBeenCalledTimes(1);
      expect(result).toEqual(response);
      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.USER,
          content: userMessage,
        }),
      );
      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.ASSISTANT,
          content: 'Hi there!',
          tokenCount: 5,
        }),
      );
      expect(conversationService.accumulateTokens).toHaveBeenCalledWith(
        conversationId,
        10,
        5,
      );
    });

    it('loads the conversation owner exactly once per turn', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'ok',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });

      await service.runTurn(conversationId, userMessage);

      expect(usersService.findById).toHaveBeenCalledTimes(1);
      expect(usersService.findById).toHaveBeenCalledWith('user-1');
    });

    it('should handle tool loop with function calls then final text', async () => {
      const functionCall = {
        name: 'mock_tool',
        arguments: { input: 'test' },
      };
      const firstResponse = {
        text: '',
        functionCalls: [functionCall],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 0,
          totalTokenCount: 10,
        },
      };
      const secondResponse = {
        text: 'Tool executed successfully.',
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 10,
          totalTokenCount: 30,
        },
      };

      aiProvider.chat
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      mockTool.parameters.parse.mockReturnValue({ input: 'test' });
      mockTool.execute.mockResolvedValue({ output: 'processed: test' });

      const result = await service.runTurn(conversationId, userMessage);

      expect(aiProvider.chat).toHaveBeenCalledTimes(2);
      expect(mockTool.parameters.parse).toHaveBeenCalledWith({ input: 'test' });
      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.TOOL,
          toolCalls: [functionCall],
          toolResults: [
            { name: 'mock_tool', result: { output: 'processed: test' } },
          ],
        }),
      );
      expect(result).toEqual(secondResponse);
    });

    it('passes a fully-populated ToolContext to every tool.execute call', async () => {
      const fc = { name: 'mock_tool', arguments: { input: 'first' } };
      const firstResp = {
        text: '',
        functionCalls: [fc],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
      };
      const secondResp = {
        text: 'done',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      };
      aiProvider.chat
        .mockResolvedValueOnce(firstResp)
        .mockResolvedValueOnce(secondResp);
      mockTool.parameters.parse.mockReturnValue({ input: 'first' });
      mockTool.execute.mockResolvedValue({ output: 'ok' });

      await service.runTurn(conversationId, userMessage);

      expect(mockTool.execute).toHaveBeenCalledTimes(1);
      expect(mockTool.execute).toHaveBeenCalledWith(
        { input: 'first' },
        {
          userId: 'user-1',
          conversationId,
          screenContext,
          user: mockUser,
        },
      );
    });

    it('reuses the same ToolContext across multiple tool calls in a single turn', async () => {
      const fc1 = { name: 'mock_tool', arguments: { input: 'a' } };
      const fc2 = { name: 'mock_tool', arguments: { input: 'b' } };
      const firstResp = {
        text: '',
        functionCalls: [fc1, fc2],
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
      };
      const secondResp = {
        text: 'done',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      };
      aiProvider.chat
        .mockResolvedValueOnce(firstResp)
        .mockResolvedValueOnce(secondResp);
      mockTool.parameters.parse.mockImplementation((args: any) => args);
      mockTool.execute.mockResolvedValue({ output: 'ok' });

      await service.runTurn(conversationId, userMessage);

      expect(mockTool.execute).toHaveBeenCalledTimes(2);
      const ctx1 = mockTool.execute.mock.calls[0][1];
      const ctx2 = mockTool.execute.mock.calls[1][1];
      expect(ctx1).toEqual({
        userId: 'user-1',
        conversationId,
        screenContext,
        user: mockUser,
      });
      expect(ctx2).toEqual(ctx1);
    });

    it('falls back to an empty screenContext object when conversation has none', async () => {
      conversationService.findById.mockResolvedValue({
        id: conversationId,
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        title: '',
        screenContext: undefined,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);

      const fc = { name: 'mock_tool', arguments: { x: 1 } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'done',
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        });
      mockTool.parameters.parse.mockReturnValue({ x: 1 });
      mockTool.execute.mockResolvedValue({ output: 'ok' });

      await service.runTurn(conversationId, userMessage);

      expect(mockTool.execute).toHaveBeenCalledWith(
        { x: 1 },
        expect.objectContaining({ screenContext: {} }),
      );
    });

    it('should stop at max iterations guard', async () => {
      const functionCall = {
        name: 'mock_tool',
        arguments: { input: 'loop' },
      };
      const infiniteResponse = {
        text: '',
        functionCalls: [functionCall],
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 0,
          totalTokenCount: 5,
        },
      };

      aiProvider.chat.mockResolvedValue(infiniteResponse);
      mockTool.parameters.parse.mockReturnValue({ input: 'loop' });
      mockTool.execute.mockResolvedValue({ output: 'processed: loop' });

      const result = await service.runTurn(conversationId, userMessage);

      expect(aiProvider.chat).toHaveBeenCalledTimes(AI_TOOL_MAX_ITERATIONS);
      expect(result).toEqual(infiniteResponse);
    });

    it('should dispatch tool by name', async () => {
      const functionCall = {
        name: 'nonexistent_tool',
        arguments: {},
      };
      const response = {
        text: '',
        functionCalls: [functionCall],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 0,
          totalTokenCount: 10,
        },
      };
      const finalResponse = {
        text: 'Tool not found handled.',
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 10,
          totalTokenCount: 30,
        },
      };

      aiProvider.chat
        .mockResolvedValueOnce(response)
        .mockResolvedValueOnce(finalResponse);

      const result = await service.runTurn(conversationId, userMessage);

      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.TOOL,
          toolCalls: [functionCall],
          toolResults: [
            {
              name: 'nonexistent_tool',
              result: { error: 'Tool nonexistent_tool not found' },
            },
          ],
        }),
      );
      expect(result).toEqual(finalResponse);
    });

    it('should validate tool parameters and handle ZodError', async () => {
      const functionCall = {
        name: 'mock_tool',
        arguments: { invalid: true },
      };
      const response = {
        text: '',
        functionCalls: [functionCall],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 0,
          totalTokenCount: 10,
        },
      };
      const finalResponse = {
        text: 'Validation error handled.',
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 10,
          totalTokenCount: 30,
        },
      };

      aiProvider.chat
        .mockResolvedValueOnce(response)
        .mockResolvedValueOnce(finalResponse);

      const zodError = new ZodError([]);
      mockTool.parameters.parse.mockImplementation(() => {
        throw zodError;
      });

      const result = await service.runTurn(conversationId, userMessage);

      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.TOOL,
          toolCalls: [functionCall],
          toolResults: [
            {
              name: 'mock_tool',
              result: { error: `Invalid parameters: ${zodError.message}` },
            },
          ],
        }),
      );
      expect(result).toEqual(finalResponse);
    });

    it('should inject lesson context into system prompt when lessonId is set', async () => {
      conversationService.findById.mockResolvedValue({
        id: conversationId,
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: 'You are a helpful assistant.',
        lessonId: 'lesson-123',
        title: '',
        screenContext: {},
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);

      const response = {
        text: 'Lesson context injected.',
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      aiProvider.chat.mockResolvedValue(response);

      await service.runTurn(conversationId, userMessage);

      const chatCall = aiProvider.chat.mock.calls[0][0];
      expect(chatCall.systemInstruction).toContain('lesson-123');
    });

    it('should accumulate tokens across multiple AI calls', async () => {
      const firstResponse = {
        text: '',
        functionCalls: [
          {
            name: 'mock_tool',
            arguments: { input: 'test' },
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 0,
          totalTokenCount: 10,
        },
      };
      const secondResponse = {
        text: 'Done.',
        usageMetadata: {
          promptTokenCount: 20,
          candidatesTokenCount: 10,
          totalTokenCount: 30,
        },
      };

      aiProvider.chat
        .mockResolvedValueOnce(firstResponse)
        .mockResolvedValueOnce(secondResponse);

      mockTool.parameters.parse.mockReturnValue({ input: 'test' });
      mockTool.execute.mockResolvedValue({ output: 'processed: test' });

      await service.runTurn(conversationId, userMessage);

      expect(conversationService.accumulateTokens).toHaveBeenCalledWith(
        conversationId,
        10,
        0,
      );
      expect(conversationService.accumulateTokens).toHaveBeenCalledWith(
        conversationId,
        20,
        10,
      );
    });
  });

  describe('runTurnStream', () => {
    const conversationId = 'conv-1';
    const userMessage = 'How am I doing?';
    const screenContext = {
      route: '/',
      displayName: 'Trang chủ',
      barPlaceholder: 'Hỏi gì đi nào?',
      data: {},
    };

    async function collect<T>(iter: AsyncIterable<T>): Promise<T[]> {
      const out: T[] = [];
      for await (const item of iter) out.push(item);
      return out;
    }

    beforeEach(() => {
      conversationService.findById.mockResolvedValue({
        id: conversationId,
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        lessonId: undefined,
        title: '',
        screenContext,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);

      conversationService.addMessage.mockImplementation(async (_id, dto) => {
        const seq = conversationService.addMessage.mock.calls.length;
        return {
          id: `msg-${seq}`,
          conversationId: _id,
          role: dto.role,
          content: dto.content ?? '',
          tokenCount: dto.tokenCount ?? 0,
          interrupted: dto.interrupted ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as any;
      });
      conversationService.accumulateTokens.mockResolvedValue({} as any);
      conversationService.create.mockResolvedValue({
        id: 'conv-new',
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        title: '',
        screenContext,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);
    });

    it('yields conversation_started + text_chunk + done for a plain text response (no tool calls)', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'Bạn đang học rất tốt!',
        usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 3 },
      });

      const events = await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(events).toEqual([
        { type: 'conversation_started', conversationId },
        { type: 'text_chunk', text: 'Bạn đang học rất tốt!' },
        expect.objectContaining({ type: 'done', interrupted: false }),
      ]);
    });

    it('emits conversation_started as the very first event for a lazily-created conversation', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'hi',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });

      const events = await collect(
        service.runTurnStream('user-1', null, userMessage, screenContext),
      );

      expect(events[0]).toEqual({
        type: 'conversation_started',
        conversationId: 'conv-new',
      });
    });

    it('persists the user message before invoking the AI provider', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'ok',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });

      await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.USER,
          content: userMessage,
        }),
      );
    });

    it('persists the final assistant message with interrupted=false on a clean turn', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'Tóm tắt: streak 3 ngày.',
        usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 6 },
      });

      await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.ASSISTANT,
          content: 'Tóm tắt: streak 3 ngày.',
          tokenCount: 6,
          interrupted: false,
        }),
      );
    });

    it('yields tool_start + tool_result + text_chunk + done for a single-tool turn', async () => {
      const fc = { name: 'mock_tool', arguments: { input: 'hello' } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 5, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'Final answer.',
          usageMetadata: { promptTokenCount: 10, candidatesTokenCount: 5 },
        });

      mockTool.parameters.parse.mockReturnValue({ input: 'hello' });
      mockTool.execute.mockResolvedValue({ output: 'echoed' });

      const events = await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(events).toEqual([
        { type: 'conversation_started', conversationId },
        {
          type: 'tool_start',
          name: 'mock_tool',
          displayName: 'Đang chạy mock tool...',
          args: { input: 'hello' },
        },
        { type: 'tool_result', name: 'mock_tool', ok: true },
        { type: 'text_chunk', text: 'Final answer.' },
        expect.objectContaining({ type: 'done', interrupted: false }),
      ]);
    });

    it('emits tool_result with ok=false when the tool returns an error result', async () => {
      const fc = { name: 'mock_tool', arguments: { input: 'oops' } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'Handled the error.',
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        });
      mockTool.parameters.parse.mockReturnValue({ input: 'oops' });
      mockTool.execute.mockResolvedValue({ error: 'boom' });

      const events = await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(events).toContainEqual({
        type: 'tool_result',
        name: 'mock_tool',
        ok: false,
      });
    });

    it('emits tool_result with ok=false when the tool throws', async () => {
      const fc = { name: 'mock_tool', arguments: { input: 'x' } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'Recovered.',
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        });
      mockTool.parameters.parse.mockReturnValue({ input: 'x' });
      mockTool.execute.mockRejectedValue(new Error('runtime boom'));

      const events = await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(events).toContainEqual({
        type: 'tool_result',
        name: 'mock_tool',
        ok: false,
      });
    });

    it('drives a multi-iteration tool loop and yields events in order', async () => {
      const fcA = { name: 'mock_tool', arguments: { input: 'a' } };
      const fcB = { name: 'mock_tool', arguments: { input: 'b' } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fcA],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fcB],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'All done.',
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 2 },
        });

      mockTool.parameters.parse.mockImplementation((args: any) => args);
      mockTool.execute.mockResolvedValue({ output: 'ok' });

      const events = await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(events.filter((e: any) => e.type === 'tool_start')).toHaveLength(
        2,
      );
      expect(events.filter((e: any) => e.type === 'tool_result')).toHaveLength(
        2,
      );
      expect(events[events.length - 1]).toEqual(
        expect.objectContaining({ type: 'done', interrupted: false }),
      );
      expect(aiProvider.chat).toHaveBeenCalledTimes(3);
    });

    it('lazy-creates the conversation when conversationId is null and snapshots screenContext', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'hi',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });
      const passedScreenContext = {
        route: '/lessons/abc',
        displayName: 'Bài học',
        barPlaceholder: 'Hỏi về bài học?',
        data: { lessonId: 'abc' },
      };

      await collect(
        service.runTurnStream('user-1', null, userMessage, passedScreenContext),
      );

      expect(conversationService.create).toHaveBeenCalledWith(
        'user-1',
        expect.objectContaining({ screenContext: passedScreenContext }),
      );
    });

    it('passes the lazily-created conversationId to addMessage and tool ctx', async () => {
      const fc = { name: 'mock_tool', arguments: { input: 'x' } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'done',
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        });
      mockTool.parameters.parse.mockReturnValue({ input: 'x' });
      mockTool.execute.mockResolvedValue({ output: 'ok' });

      // Make the lazily-created conv pre-fetched the same way findById does.
      conversationService.findById.mockResolvedValueOnce({
        id: 'conv-new',
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: '',
        title: '',
        screenContext,
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);

      await collect(
        service.runTurnStream('user-1', null, userMessage, screenContext),
      );

      expect(mockTool.execute).toHaveBeenCalledWith(
        { input: 'x' },
        expect.objectContaining({ conversationId: 'conv-new' }),
      );
    });

    it('renders the assistant-tutor prompt as system instruction when screenContext is non-empty', async () => {
      genaiService.renderPrompt = jest
        .fn()
        .mockReturnValue('RENDERED ASSISTANT TUTOR PROMPT');

      aiProvider.chat.mockResolvedValue({
        text: 'ok',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });

      await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(genaiService.renderPrompt).toHaveBeenCalledWith(
        'assistant-tutor',
        expect.objectContaining({
          user: expect.objectContaining({
            nativeLanguage: mockUser.nativeLanguage,
            currentLevel: mockUser.currentLevel,
            preferredDialect: mockUser.preferredDialect,
          }),
          screenContext: expect.objectContaining({
            route: screenContext.route,
            displayName: screenContext.displayName,
            // The flat-key prompt renderer requires a pre-serialized JSON
            // string for `screenContext.data` per the assistant-tutor yaml
            // contract. Verify the agent pre-serializes it.
            data: JSON.stringify(screenContext.data),
          }),
        }),
      );
      expect(aiProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          systemInstruction: 'RENDERED ASSISTANT TUTOR PROMPT',
        }),
      );
    });

    it('falls back to the conversation systemInstruction when screenContext is empty', async () => {
      conversationService.findById.mockResolvedValue({
        id: conversationId,
        userId: 'user-1',
        model: 'gemini-2.0-flash',
        systemInstruction: 'Default tutor.',
        title: '',
        screenContext: {},
        totalTokens: 0,
        totalPromptTokens: 0,
        totalCompletionTokens: 0,
        messages: [],
      } as any);
      genaiService.renderPrompt = jest.fn();

      aiProvider.chat.mockResolvedValue({
        text: 'ok',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });

      await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(genaiService.renderPrompt).not.toHaveBeenCalled();
      expect(aiProvider.chat).toHaveBeenCalledWith(
        expect.objectContaining({ systemInstruction: 'Default tutor.' }),
      );
    });

    it('persists a partial assistant message with interrupted=true when aborted mid-loop', async () => {
      const abortController = new AbortController();
      const fc = { name: 'mock_tool', arguments: { input: 'a' } };
      aiProvider.chat.mockImplementation(async () => {
        // Trigger abort before the second iteration would fire — this models
        // "mid-stream" cancellation arriving while the agent is between
        // boundaries.
        return {
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        };
      });
      mockTool.parameters.parse.mockReturnValue({ input: 'a' });
      mockTool.execute.mockImplementation(async () => {
        abortController.abort();
        return { output: 'ok' };
      });

      const events = await collect(
        service.runTurnStream(
          'user-1',
          conversationId,
          userMessage,
          undefined,
          abortController.signal,
        ),
      );

      const done = events.find((e: any) => e.type === 'done') as any;
      expect(done).toBeDefined();
      expect(done.interrupted).toBe(true);
      expect(conversationService.addMessage).toHaveBeenCalledWith(
        conversationId,
        expect.objectContaining({
          role: ConversationMessageRole.ASSISTANT,
          interrupted: true,
        }),
      );
    });

    it('does not call the AI provider when the abort signal is already aborted on entry', async () => {
      const abortController = new AbortController();
      abortController.abort();

      const events = await collect(
        service.runTurnStream(
          'user-1',
          conversationId,
          userMessage,
          undefined,
          abortController.signal,
        ),
      );

      expect(aiProvider.chat).not.toHaveBeenCalled();
      const done = events.find((e: any) => e.type === 'done') as any;
      expect(done.interrupted).toBe(true);
    });

    it('passes a fully-populated ToolContext to tool.execute (mirrors runTurn)', async () => {
      const fc = { name: 'mock_tool', arguments: { input: 'first' } };
      aiProvider.chat
        .mockResolvedValueOnce({
          text: '',
          functionCalls: [fc],
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 0 },
        })
        .mockResolvedValueOnce({
          text: 'done',
          usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
        });
      mockTool.parameters.parse.mockReturnValue({ input: 'first' });
      mockTool.execute.mockResolvedValue({ output: 'ok' });

      await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      expect(mockTool.execute).toHaveBeenCalledWith(
        { input: 'first' },
        {
          userId: 'user-1',
          conversationId,
          screenContext,
          user: mockUser,
        },
      );
    });

    it('emits done with the messageId of the persisted final assistant message', async () => {
      aiProvider.chat.mockResolvedValue({
        text: 'final',
        usageMetadata: { promptTokenCount: 1, candidatesTokenCount: 1 },
      });

      const events = await collect(
        service.runTurnStream('user-1', conversationId, userMessage),
      );

      const done = events.find((e: any) => e.type === 'done') as any;
      expect(done).toBeDefined();
      expect(typeof done.messageId).toBe('string');
      expect(done.messageId.length).toBeGreaterThan(0);
    });
  });
});
