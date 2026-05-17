import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import { GenaiService } from './genai.service';
import { KeyPool } from './key-pool';
import {
  AiRateLimitException,
  AiTimeoutException,
  AiSafetyBlockedException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from './ai.exceptions';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    interactions: {
      create: jest.fn(),
    },
    models: {
      generateContent: jest.fn(),
    },
  })),
  Interactions: {},
  Type: {
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
    ARRAY: 'ARRAY',
    OBJECT: 'OBJECT',
  },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(false),
  readdirSync: jest.fn().mockReturnValue([]),
  readFileSync: jest.fn(),
}));

function createConfigService(overrides: Record<string, any> = {}) {
  const defaults = {
    genai: {
      apiKey: 'test-key',
      apiKeys: ['test-key'],
      models: {
        chat: 'gemini-2.5-flash',
        chatFallback: 'gemini-2.0-flash',
        embed: 'text-embedding-004',
        image: 'imagen-4.0-generate-001',
      },
      maxRetries: 2,
      timeout: 30000,
      safety: {
        chat: [],
        image: [],
        default: [],
      },
    },
  };
  return {
    get: (key: string) =>
      overrides[key] ?? defaults[key as keyof typeof defaults],
  } as unknown as ConfigService;
}

function createMockKeyPool(clientMock: any) {
  return {
    getKey: jest.fn().mockReturnValue({ key: 'test-key', client: clientMock }),
    markCooldown: jest.fn(),
    isExhausted: jest.fn().mockReturnValue(false),
    updateStats: jest.fn(),
  } as unknown as KeyPool;
}

describe('GenaiService', () => {
  let service: GenaiService;
  let mockClient: any;
  let mockKeyPool: any;

  beforeEach(() => {
    mockClient = {
      interactions: {
        create: jest.fn(),
      },
      models: {
        generateContent: jest.fn(),
      },
    };
    mockKeyPool = createMockKeyPool(mockClient);
    service = new GenaiService(createConfigService(), mockKeyPool);
  });

  describe('chat()', () => {
    it('calls Interactions API with correct parameters', async () => {
      const mockResponse = {
        steps: [
          {
            content: [{ type: 'text', text: 'Hello!' }],
          },
        ],
        usageMetadata: {
          promptTokenCount: 10,
          candidatesTokenCount: 5,
          totalTokenCount: 15,
        },
      };
      mockClient.interactions.create.mockResolvedValue(mockResponse);

      const result = await service.chat({
        messages: [{ role: 'user', content: 'Hi' }],
      });

      expect(mockClient.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          input: [
            { type: 'user_input', content: [{ type: 'text', text: 'Hi' }] },
          ],
          store: false,
          stream: false,
        }),
      );
      expect(result.text).toBe('Hello!');
      expect(result.usageMetadata.totalTokenCount).toBe(15);
    });

    it('uses custom model when specified', async () => {
      mockClient.interactions.create.mockResolvedValue({
        steps: [{ content: [{ type: 'text', text: 'ok' }] }],
        usageMetadata: {},
      });

      await service.chat({
        messages: [{ role: 'user', content: 'test' }],
        model: 'custom-model',
      });

      expect(mockClient.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'custom-model' }),
      );
    });

    it('passes system instruction to API', async () => {
      mockClient.interactions.create.mockResolvedValue({
        steps: [{ content: [{ type: 'text', text: 'ok' }] }],
        usageMetadata: {},
      });

      await service.chat({
        messages: [{ role: 'user', content: 'test' }],
        systemInstruction: 'You are a helpful assistant',
      });

      expect(mockClient.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          system_instruction: 'You are a helpful assistant',
        }),
      );
    });

    it('propagates functionCalls from function_call steps in the SDK response', async () => {
      // The @google/genai Interactions API returns function-call invocations as
      // top-level steps with `type: 'function_call'`, `name`, `arguments`
      // (verified against sdk-samples/interactions_function_calling_client_state.ts).
      // Today the response mapper drops them, which is why the existing tool
      // loop in `AgentService.runTurn` never actually sees tool calls.
      mockClient.interactions.create.mockResolvedValue({
        steps: [
          {
            type: 'function_call',
            id: 'call-1',
            name: 'get_user_summary',
            arguments: {},
          },
          {
            type: 'function_call',
            id: 'call-2',
            name: 'search_vocabulary',
            arguments: { query: 'xin chào', dialect: 'NORTHERN' },
          },
        ],
        usageMetadata: { promptTokenCount: 4, candidatesTokenCount: 0 },
      });

      const result = await service.chat({
        messages: [{ role: 'user', content: 'How am I doing?' }],
      });

      expect(result.functionCalls).toEqual([
        { id: 'call-1', name: 'get_user_summary', arguments: {} },
        {
          id: 'call-2',
          name: 'search_vocabulary',
          arguments: { query: 'xin chào', dialect: 'NORTHERN' },
        },
      ]);
      expect(result.text).toBe('');
    });

    it('returns undefined functionCalls when the model only emitted text', async () => {
      mockClient.interactions.create.mockResolvedValue({
        steps: [
          { type: 'model_output', content: [{ type: 'text', text: 'Hi!' }] },
        ],
        usageMetadata: {},
      });

      const result = await service.chat({
        messages: [{ role: 'user', content: 'hello' }],
      });

      expect(result.functionCalls).toBeUndefined();
      expect(result.text).toBe('Hi!');
    });

    it('returns both text and functionCalls when the model emitted both', async () => {
      mockClient.interactions.create.mockResolvedValue({
        steps: [
          {
            type: 'model_output',
            content: [{ type: 'text', text: 'Let me look that up.' }],
          },
          {
            type: 'function_call',
            id: 'call-1',
            name: 'search_vocabulary',
            arguments: { query: 'xin chào' },
          },
        ],
        usageMetadata: {},
      });

      const result = await service.chat({
        messages: [{ role: 'user', content: 'translate xin chào' }],
      });

      expect(result.text).toBe('Let me look that up.');
      expect(result.functionCalls).toEqual([
        { id: 'call-1', name: 'search_vocabulary', arguments: { query: 'xin chào' } },
      ]);
    });
  });

  describe('chatStream()', () => {
    it('yields text chunks from streaming response', async () => {
      const mockStream = (async function* () {
        yield {
          event_type: 'step.delta',
          delta: { type: 'text', text: 'Hello' },
        };
        yield {
          event_type: 'step.delta',
          delta: { type: 'text', text: ' world' },
        };
      })();
      mockClient.interactions.create.mockResolvedValue(mockStream);

      const chunks: string[] = [];
      for await (const chunk of service.chatStream({
        messages: [{ role: 'user', content: 'test' }],
      })) {
        chunks.push(chunk.text);
      }

      expect(chunks).toEqual(['Hello', ' world']);
    });

    it('calls API with stream: true', async () => {
      const mockStream = (async function* () {
        yield { event_type: 'step.delta', delta: { type: 'text', text: 'ok' } };
      })();
      mockClient.interactions.create.mockResolvedValue(mockStream);

      const chunks: any[] = [];
      for await (const chunk of service.chatStream({
        messages: [{ role: 'user', content: 'test' }],
      })) {
        chunks.push(chunk);
      }

      expect(mockClient.interactions.create).toHaveBeenCalledWith(
        expect.objectContaining({ stream: true }),
      );
    });
  });

  describe('chatStructured()', () => {
    const testSchema = {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', nullable: false },
      },
      required: ['name'],
    };

    it('calls models.generateContent with responseMimeType and responseSchema', async () => {
      mockClient.models.generateContent.mockResolvedValue({
        text: '{"name":"Alice"}',
        usageMetadata: {
          promptTokenCount: 5,
          candidatesTokenCount: 3,
          totalTokenCount: 8,
        },
      });

      const result = await service.chatStructured({
        messages: [{ role: 'user', content: 'Give me a name' }],
        responseSchema: testSchema,
      });

      expect(mockClient.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gemini-2.5-flash',
          contents: [{ role: 'user', parts: [{ text: 'Give me a name' }] }],
          config: expect.objectContaining({
            responseMimeType: 'application/json',
            responseSchema: testSchema,
          }),
        }),
      );
      expect(result.text).toBe('{"name":"Alice"}');
      expect(result.usageMetadata.totalTokenCount).toBe(8);
    });

    it('passes system instruction via config', async () => {
      mockClient.models.generateContent.mockResolvedValue({
        text: '{"name":"Bob"}',
        usageMetadata: {},
      });

      await service.chatStructured({
        messages: [{ role: 'user', content: 'test' }],
        responseSchema: testSchema,
        systemInstruction: 'You are a namer',
      });

      expect(mockClient.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            systemInstruction: 'You are a namer',
          }),
        }),
      );
    });

    it('uses custom model when specified', async () => {
      mockClient.models.generateContent.mockResolvedValue({
        text: '{"name":"X"}',
        usageMetadata: {},
      });

      await service.chatStructured({
        messages: [{ role: 'user', content: 'test' }],
        responseSchema: testSchema,
        model: 'gemini-2.0-flash',
      });

      expect(mockClient.models.generateContent).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gemini-2.0-flash' }),
      );
    });

    it('retries on 429 error', async () => {
      const error = Object.assign(new Error('Rate limited'), {
        status: 429,
        statusCode: 429,
      });
      mockClient.models.generateContent
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          text: '{"name":"Retry"}',
          usageMetadata: {},
        });

      const result = await service.chatStructured({
        messages: [{ role: 'user', content: 'test' }],
        responseSchema: testSchema,
      });

      expect(mockClient.models.generateContent).toHaveBeenCalledTimes(2);
      expect(result.text).toBe('{"name":"Retry"}');
    });
  });

  describe('executeWithRetry()', () => {
    it('retries on 429 error', async () => {
      const error = Object.assign(new Error('Rate limited'), {
        status: 429,
        statusCode: 429,
      });
      mockClient.interactions.create
        .mockRejectedValueOnce(error)
        .mockResolvedValueOnce({
          steps: [{ content: [{ type: 'text', text: 'ok' }] }],
          usageMetadata: {},
        });

      const result = await service.chat({
        messages: [{ role: 'user', content: 'test' }],
      });

      expect(mockClient.interactions.create).toHaveBeenCalledTimes(2);
      expect(mockKeyPool.markCooldown).toHaveBeenCalledWith('test-key', {
        statusCode: 429,
      });
      expect(result.text).toBe('ok');
    });

    it('throws AiServiceUnavailableException after max retries exhausted', async () => {
      const error = Object.assign(new Error('Rate limited'), {
        status: 429,
        statusCode: 429,
      });
      mockClient.interactions.create.mockRejectedValue(error);
      mockKeyPool.isExhausted = jest.fn().mockReturnValue(true);

      await expect(
        service.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiServiceUnavailableException);
    });

    it('maps 429 to AiRateLimitException after retries exhausted', async () => {
      const error = Object.assign(new Error('Rate limit'), {
        status: 429,
        statusCode: 429,
      });
      mockClient.interactions.create.mockRejectedValue(error);
      mockKeyPool.isExhausted = jest.fn().mockReturnValue(false);

      await expect(
        service.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiRateLimitException);
    });
  });

  describe('error mapping', () => {
    it('maps timeout errors to AiTimeoutException', async () => {
      const error = Object.assign(new Error('Timeout'), {
        name: 'TimeoutError',
      });
      mockClient.interactions.create.mockRejectedValue(error);

      await expect(
        service.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiTimeoutException);
    });

    it('maps safety blocks to AiSafetyBlockedException', async () => {
      const error = new Error('Content blocked by SAFETY filters');
      mockClient.interactions.create.mockRejectedValue(error);

      await expect(
        service.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiSafetyBlockedException);
    });

    it('maps 400 errors to AiInvalidRequestException', async () => {
      const error = Object.assign(new Error('Bad request'), {
        status: 400,
        statusCode: 400,
      });
      mockClient.interactions.create.mockRejectedValue(error);

      await expect(
        service.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiInvalidRequestException);
    });
  });

  describe('scaffolded methods', () => {
    it('embed() throws AiInvalidRequestException', async () => {
      await expect(service.embed(['test'])).rejects.toThrow(
        AiInvalidRequestException,
      );
    });

    it('uploadFile() throws AiInvalidRequestException', async () => {
      await expect(
        service.uploadFile({ data: Buffer.from(''), mimeType: 'text/plain' }),
      ).rejects.toThrow(AiInvalidRequestException);
    });

    it('generateImage() throws AiInvalidRequestException', async () => {
      await expect(service.generateImage({ prompt: 'test' })).rejects.toThrow(
        AiInvalidRequestException,
      );
    });
  });

  describe('prompt template rendering', () => {
    it('throws AiInvalidRequestException for unknown template', () => {
      expect(() => service.renderPrompt('nonexistent')).toThrow(
        AiInvalidRequestException,
      );
    });

    describe('with a loaded template', () => {
      const yaml = `t:
  description: "T"
  template: |
    Hi {{name}}.
    Lang: {{user.nativeLanguage}}.
    Dialect: {{user.preferredDialect}}.
    Route: {{screenContext.route}}.
    Data: {{screenContext.data}}.
    Count: {{count}}.
`;

      beforeEach(() => {
        (fs.existsSync as jest.Mock).mockReturnValue(true);
        (fs.readdirSync as jest.Mock).mockReturnValue(['t.yaml']);
        (fs.readFileSync as jest.Mock).mockReturnValue(yaml);
        service = new GenaiService(createConfigService(), mockKeyPool);
        service.onModuleInit();
      });

      it('substitutes flat placeholders (existing behavior preserved)', () => {
        const out = service.renderPrompt('t', { name: 'Alex', count: '3' });
        expect(out).toContain('Hi Alex.');
        expect(out).toContain('Count: 3.');
      });

      it('substitutes nested placeholders via dot notation', () => {
        const out = service.renderPrompt('t', {
          name: 'Alex',
          user: {
            nativeLanguage: 'English',
            preferredDialect: 'NORTHERN',
          },
          screenContext: {
            route: '/lessons/abc',
            data: '{"lessonId":"abc"}',
          },
          count: 1,
        });
        expect(out).toContain('Hi Alex.');
        expect(out).toContain('Lang: English.');
        expect(out).toContain('Dialect: NORTHERN.');
        expect(out).toContain('Route: /lessons/abc.');
        expect(out).toContain('Data: {"lessonId":"abc"}.');
        expect(out).toContain('Count: 1.');
      });

      it('coerces null and undefined values to empty strings', () => {
        const out = service.renderPrompt('t', {
          name: null,
          user: { nativeLanguage: undefined, preferredDialect: 'STANDARD' },
          screenContext: { route: '/', data: '' },
          count: 0,
        });
        expect(out).toContain('Hi .');
        expect(out).toContain('Lang: .');
        expect(out).toContain('Dialect: STANDARD.');
        expect(out).toContain('Count: 0.');
      });

      it('leaves un-substituted placeholders intact (and does not throw)', () => {
        const out = service.renderPrompt('t', { name: 'A' });
        expect(out).toContain('Hi A.');
        expect(out).toContain('{{user.nativeLanguage}}');
      });
    });
  });
});
