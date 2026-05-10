import { ConfigService } from '@nestjs/config';
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
  })),
  Interactions: {},
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
  });
});
