import OpenAI from 'openai';
import type { AiChatChunk } from '@linvnix/shared';
import { OpenaiProvider } from './openai.provider';
import {
  AiRateLimitException,
  AiTimeoutException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
  MethodNotSupportedException,
} from '../genai/ai.exceptions';

jest.mock('openai', () => {
  const MockOpenAI = jest.fn();
  return {
    __esModule: true,
    default: MockOpenAI,
  };
});

const DEFAULT_CONFIG = {
  baseUrl: 'https://openrouter.ai/api/v1',
  apiKeys: ['test-key-1'],
  model: 'gpt-4o',
};

describe('OpenaiProvider', () => {
  let provider: OpenaiProvider;
  let mockCreate: jest.Mock;

  beforeEach(() => {
    mockCreate = jest.fn();
    (OpenAI as jest.MockedClass<typeof OpenAI>).mockImplementation(
      () =>
        ({
          chat: { completions: { create: mockCreate } },
        }) as any,
    );
    provider = new OpenaiProvider(DEFAULT_CONFIG);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('chat() — text only', () => {
    it('converts messages in correct order/role and normalizes response', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'Hello world', tool_calls: null } }],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await provider.chat({
        messages: [
          { role: 'user', content: 'Hi' },
          { role: 'assistant', content: 'Hello' },
          { role: 'user', content: 'How are you?' },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          model: 'gpt-4o',
          messages: [
            { role: 'user', content: 'Hi' },
            { role: 'assistant', content: 'Hello' },
            { role: 'user', content: 'How are you?' },
          ],
          stream: false,
        }),
      );
      expect(result.text).toBe('Hello world');
      expect(result.usageMetadata.promptTokenCount).toBe(10);
      expect(result.usageMetadata.candidatesTokenCount).toBe(5);
      expect(result.usageMetadata.totalTokenCount).toBe(15);
      expect(result.functionCalls).toBeUndefined();
    });

    it('prepends systemInstruction as a system message', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok', tool_calls: null } }],
        usage: {},
      });

      await provider.chat({
        messages: [{ role: 'user', content: 'test' }],
        systemInstruction: 'You are helpful',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: [
            { role: 'system', content: 'You are helpful' },
            { role: 'user', content: 'test' },
          ],
        }),
      );
    });

    it('uses custom model when specified', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: 'ok', tool_calls: null } }],
        usage: {},
      });

      await provider.chat({
        messages: [{ role: 'user', content: 'test' }],
        model: 'gpt-4-turbo',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4-turbo' }),
      );
    });
  });

  describe('chat() — with tools', () => {
    it('converts tools to OpenAI function format', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: null, tool_calls: null } }],
        usage: {},
      });

      await provider.chat({
        messages: [{ role: 'user', content: 'Search for test' }],
        tools: [
          {
            name: 'search',
            description: 'Search for information',
            parameters: {
              type: 'object',
              properties: { query: { type: 'string' } },
            },
          },
        ],
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: [
            {
              type: 'function',
              function: {
                name: 'search',
                description: 'Search for information',
                parameters: {
                  type: 'object',
                  properties: { query: { type: 'string' } },
                },
              },
            },
          ],
        }),
      );
    });

    it('normalizes tool_calls response into AiFunctionCall[] with parsed arguments', async () => {
      mockCreate.mockResolvedValue({
        choices: [
          {
            message: {
              content: null,
              tool_calls: [
                {
                  id: 'call_123',
                  type: 'function',
                  function: { name: 'search', arguments: '{"query":"test"}' },
                },
              ],
            },
          },
        ],
        usage: { prompt_tokens: 10, completion_tokens: 5, total_tokens: 15 },
      });

      const result = await provider.chat({
        messages: [{ role: 'user', content: 'Search for test' }],
        tools: [{ name: 'search', description: 'Search', parameters: {} }],
      });

      expect(result.functionCalls).toEqual([
        { id: 'call_123', name: 'search', arguments: { query: 'test' } },
      ]);
      expect(result.text).toBe('');
    });
  });

  describe('chatStructured()', () => {
    it('passes schema as json_schema response_format with strict: false', async () => {
      const schema = {
        type: 'object',
        properties: { name: { type: 'string' } },
        required: ['name'],
      };

      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"name":"Alice"}' } }],
        usage: {},
      });

      await provider.chatStructured({
        messages: [{ role: 'user', content: 'Give me a name' }],
        responseSchema: schema,
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          response_format: {
            type: 'json_schema',
            json_schema: { name: 'response', schema, strict: false },
          },
        }),
      );
    });

    it('parses JSON content and returns typed object', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{"name":"Alice","score":42}' } }],
        usage: {},
      });

      const result = await provider.chatStructured<{
        name: string;
        score: number;
      }>({
        messages: [{ role: 'user', content: 'Give me a name' }],
        responseSchema: {},
      });

      expect(result).toEqual({ name: 'Alice', score: 42 });
    });

    it('uses custom model when specified', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{}' } }],
        usage: {},
      });

      await provider.chatStructured({
        messages: [{ role: 'user', content: 'test' }],
        responseSchema: {},
        model: 'gpt-4-turbo',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ model: 'gpt-4-turbo' }),
      );
    });

    it('prepends systemInstruction when provided', async () => {
      mockCreate.mockResolvedValue({
        choices: [{ message: { content: '{}' } }],
        usage: {},
      });

      await provider.chatStructured({
        messages: [{ role: 'user', content: 'test' }],
        responseSchema: {},
        systemInstruction: 'You are a helper',
      });

      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            { role: 'system', content: 'You are a helper' },
          ]),
        }),
      );
    });
  });

  describe('error mapping', () => {
    it('maps 429 to AiRateLimitException (key goes into cooldown, next getKey throws)', async () => {
      const error = Object.assign(new Error('Rate limited'), { status: 429 });
      mockCreate.mockRejectedValue(error);

      await expect(
        provider.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiRateLimitException);
    });

    it('maps APIConnectionTimeoutError to AiTimeoutException', async () => {
      const error = Object.assign(new Error('Connection timeout'), {
        name: 'APIConnectionTimeoutError',
      });
      mockCreate.mockRejectedValue(error);

      await expect(
        provider.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiTimeoutException);
    });

    it('maps 400 to AiInvalidRequestException', async () => {
      const error = Object.assign(new Error('Bad request'), { status: 400 });
      mockCreate.mockRejectedValue(error);

      await expect(
        provider.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiInvalidRequestException);
    });

    it('maps 503 to AiServiceUnavailableException', async () => {
      const error = Object.assign(new Error('Service unavailable'), {
        status: 503,
      });
      mockCreate.mockRejectedValue(error);

      await expect(
        provider.chat({ messages: [{ role: 'user', content: 'test' }] }),
      ).rejects.toThrow(AiServiceUnavailableException);
    });

    it('retries on 429 and succeeds with second key', async () => {
      const multiKeyProvider = new OpenaiProvider({
        ...DEFAULT_CONFIG,
        apiKeys: ['key-1', 'key-2'],
      });

      const rateLimitError = Object.assign(new Error('Rate limited'), {
        status: 429,
      });
      mockCreate.mockRejectedValueOnce(rateLimitError).mockResolvedValueOnce({
        choices: [{ message: { content: 'Success', tool_calls: null } }],
        usage: {},
      });

      const result = await multiKeyProvider.chat({
        messages: [{ role: 'user', content: 'test' }],
      });

      expect(result.text).toBe('Success');
      expect(mockCreate).toHaveBeenCalledTimes(2);
    });
  });

  describe('chatStream()', () => {
    function makeStream(chunks: object[]): Generator<object> {
      return (function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
      })();
    }

    function makeStreamWithError(
      chunks: object[],
      error: unknown,
    ): Generator<object> {
      return (function* () {
        for (const chunk of chunks) {
          yield chunk;
        }
        throw error;
      })();
    }

    it('emits 3 text chunks immediately as they arrive', async () => {
      mockCreate.mockResolvedValue(
        makeStream([
          { choices: [{ delta: { content: 'Hello' }, finish_reason: null }] },
          { choices: [{ delta: { content: ' world' }, finish_reason: null }] },
          { choices: [{ delta: { content: '!' }, finish_reason: 'stop' }] },
        ]),
      );

      const chunks: AiChatChunk[] = [];
      for await (const chunk of provider.chatStream({
        messages: [{ role: 'user', content: 'test' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].text).toBe('Hello');
      expect(chunks[1].text).toBe(' world');
      expect(chunks[2].text).toBe('!');
    });

    it('accumulates 1 tool call delta and emits on finish_reason: tool_calls', async () => {
      mockCreate.mockResolvedValue(
        makeStream([
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: 'call_1',
                      type: 'function',
                      function: { name: 'search', arguments: '' },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [{ index: 0, function: { arguments: '{"q' } }],
                },
                finish_reason: null,
              },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    { index: 0, function: { arguments: 'uery":"test"}' } },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
        ]),
      );

      const chunks: AiChatChunk[] = [];
      for await (const chunk of provider.chatStream({
        messages: [{ role: 'user', content: 'search something' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].functionCalls).toEqual([
        { id: 'call_1', name: 'search', arguments: { query: 'test' } },
      ]);
    });

    it('accumulates 2 parallel tool calls by index in correct order', async () => {
      mockCreate.mockResolvedValue(
        makeStream([
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: 'call_0',
                      type: 'function',
                      function: { name: 'search', arguments: '' },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 1,
                      id: 'call_1',
                      type: 'function',
                      function: { name: 'analyze', arguments: '' },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    { index: 0, function: { arguments: '{"query":"a"}' } },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    { index: 1, function: { arguments: '{"text":"b"}' } },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
        ]),
      );

      const chunks: AiChatChunk[] = [];
      for await (const chunk of provider.chatStream({
        messages: [{ role: 'user', content: 'do two things' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(1);
      expect(chunks[0].functionCalls).toHaveLength(2);
      expect(chunks[0].functionCalls![0]).toEqual({
        id: 'call_0',
        name: 'search',
        arguments: { query: 'a' },
      });
      expect(chunks[0].functionCalls![1]).toEqual({
        id: 'call_1',
        name: 'analyze',
        arguments: { text: 'b' },
      });
    });

    it('emits text chunks immediately and tool call chunk on finish', async () => {
      mockCreate.mockResolvedValue(
        makeStream([
          {
            choices: [
              { delta: { content: 'Thinking...' }, finish_reason: null },
            ],
          },
          {
            choices: [
              { delta: { content: ' Let me search.' }, finish_reason: null },
            ],
          },
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: 'call_1',
                      type: 'function',
                      function: { name: 'search', arguments: '{"query":"x"}' },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
        ]),
      );

      const chunks: AiChatChunk[] = [];
      for await (const chunk of provider.chatStream({
        messages: [{ role: 'user', content: 'test' }],
      })) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(3);
      expect(chunks[0].text).toBe('Thinking...');
      expect(chunks[1].text).toBe(' Let me search.');
      expect(chunks[2].functionCalls).toEqual([
        { id: 'call_1', name: 'search', arguments: { query: 'x' } },
      ]);
    });

    it('throws AiRateLimitException when stream errors with 429', async () => {
      const error = Object.assign(new Error('Rate limited'), { status: 429 });
      mockCreate.mockResolvedValue(
        makeStreamWithError(
          [{ choices: [{ delta: { content: 'Hello' }, finish_reason: null }] }],
          error,
        ),
      );

      await expect(async () => {
        for await (const _ of provider.chatStream({
          messages: [{ role: 'user', content: 'test' }],
        })) {
          // no-op — only testing that the generator throws
        }
      }).rejects.toThrow(AiRateLimitException);
    });

    it('throws AiInvalidRequestException for malformed tool call JSON arguments', async () => {
      mockCreate.mockResolvedValue(
        makeStream([
          {
            choices: [
              {
                delta: {
                  tool_calls: [
                    {
                      index: 0,
                      id: 'call_1',
                      type: 'function',
                      function: { name: 'search', arguments: '{invalid' },
                    },
                  ],
                },
                finish_reason: null,
              },
            ],
          },
          { choices: [{ delta: {}, finish_reason: 'tool_calls' }] },
        ]),
      );

      await expect(async () => {
        for await (const _ of provider.chatStream({
          messages: [{ role: 'user', content: 'test' }],
        })) {
          // no-op — only testing that the generator throws
        }
      }).rejects.toThrow(AiInvalidRequestException);
    });
  });

  describe('unsupported methods', () => {
    it('embed() throws MethodNotSupportedException', async () => {
      await expect(provider.embed(['text'])).rejects.toThrow(
        MethodNotSupportedException,
      );
    });

    it('uploadFile() throws MethodNotSupportedException', async () => {
      await expect(
        provider.uploadFile({ data: Buffer.from(''), mimeType: 'text/plain' }),
      ).rejects.toThrow(MethodNotSupportedException);
    });

    it('generateImage() throws MethodNotSupportedException', async () => {
      await expect(provider.generateImage({ prompt: 'test' })).rejects.toThrow(
        MethodNotSupportedException,
      );
    });
  });
});
