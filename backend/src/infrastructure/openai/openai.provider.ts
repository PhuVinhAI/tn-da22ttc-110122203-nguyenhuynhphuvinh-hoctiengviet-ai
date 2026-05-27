import OpenAI from 'openai';
import { KeyPool } from '../ai/key-pool';
import {
  MethodNotSupportedException,
  AiServiceUnavailableException,
} from '../genai/ai.exceptions';
import {
  isOpenaiRateLimitError,
  getOpenaiCooldownMs,
  mapOpenaiError,
} from './openai-errors';
import type {
  IAiProvider,
  AiChatRequest,
  AiChatResponse,
  AiChatChunk,
  AiChatStructuredRequest,
  AiEmbedding,
  AiFileRef,
  AiFileUpload,
  AiImageRef,
  AiImageRequest,
  AiMessage,
  ToolDeclaration,
} from '@linvnix/shared';

export interface OpenaiProviderConfig {
  baseUrl: string;
  apiKeys: string[];
  model: string;
  fallbackModel?: string;
  timeout?: number;
  maxRetries?: number;
}

export class OpenaiProvider implements IAiProvider {
  private readonly clients: Map<string, OpenAI>;
  private readonly keyPool: KeyPool;
  private readonly model: string;
  private readonly maxRetries: number;

  constructor(config: OpenaiProviderConfig) {
    this.model = config.model;
    this.maxRetries = config.maxRetries ?? 2;

    this.keyPool = new KeyPool({
      keys: config.apiKeys,
      isRateLimitError: isOpenaiRateLimitError,
      getCooldownMs: getOpenaiCooldownMs,
    });

    this.clients = new Map(
      config.apiKeys.map((key) => [
        key,
        new OpenAI({
          apiKey: key,
          baseURL: config.baseUrl,
          timeout: config.timeout,
          maxRetries: 0,
        }),
      ]),
    );
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const model = req.model || this.model;
    const messages = this.convertMessages(req.messages);

    if (req.systemInstruction) {
      messages.unshift({ role: 'system', content: req.systemInstruction });
    }

    const tools = req.tools?.length ? this.convertTools(req.tools) : undefined;

    return this.executeWithRetry(async (client) => {
      const response = await client.chat.completions.create({
        model,
        messages,
        ...(tools ? { tools } : {}),
        stream: false,
      });

      return this.normalizeResponse(response);
    });
  }

  async chatStructured<T = any>(req: AiChatStructuredRequest): Promise<T> {
    const model = req.model || this.model;
    const messages = this.buildStructuredMessages(req);

    return this.executeWithRetry(async (client) => {
      const response = await client.chat.completions.create({
        model,
        messages,
        response_format: {
          type: 'json_schema',
          json_schema: {
            name: 'response',
            schema: req.responseSchema,
            strict: false,
          },
        },
        stream: false,
      });

      const content = response.choices[0]?.message?.content ?? '{}';
      return JSON.parse(content) as T;
    });
  }

  chatStream(_req: AiChatRequest): AsyncIterable<AiChatChunk> {
    throw new MethodNotSupportedException(
      'chatStream() is not yet implemented for OpenaiProvider',
    );
  }

  async embed(_texts: string[]): Promise<AiEmbedding[]> {
    throw new MethodNotSupportedException(
      'embed() is not supported by OpenaiProvider',
    );
  }

  async uploadFile(_file: AiFileUpload): Promise<AiFileRef> {
    throw new MethodNotSupportedException(
      'uploadFile() is not supported by OpenaiProvider',
    );
  }

  async generateImage(_prompt: AiImageRequest): Promise<AiImageRef> {
    throw new MethodNotSupportedException(
      'generateImage() is not supported by OpenaiProvider',
    );
  }

  private async executeWithRetry<T>(
    fn: (client: OpenAI) => Promise<T>,
  ): Promise<T> {
    let lastError: any = null;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      const { key } = this.keyPool.getKey();
      const client = this.getClientForKey(key);

      try {
        return await fn(client);
      } catch (error: any) {
        lastError = error;

        if (isOpenaiRateLimitError(error)) {
          this.keyPool.markCooldown(key, error);
          continue;
        }

        throw mapOpenaiError(error);
      }
    }

    if (this.keyPool.isExhausted()) {
      throw new AiServiceUnavailableException(
        'All OpenAI API keys are rate-limited',
      );
    }

    throw mapOpenaiError(lastError);
  }

  private getClientForKey(key: string): OpenAI {
    const client = this.clients.get(key);
    if (!client) throw new Error(`No client for key ${key.slice(0, 8)}...`);
    return client;
  }

  private convertMessages(
    messages: AiMessage[],
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const result: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        result.push({ role: 'system', content: msg.content });
      } else if (msg.role === 'user') {
        result.push({ role: 'user', content: msg.content });
      } else if (msg.role === 'assistant') {
        if (msg.functionCall) {
          result.push({
            role: 'assistant',
            content: msg.content || null,
            tool_calls: [
              {
                id: msg.functionCall.id || `call-${Date.now()}`,
                type: 'function',
                function: {
                  name: msg.functionCall.name,
                  arguments: JSON.stringify(msg.functionCall.arguments),
                },
              },
            ],
          });
        } else {
          result.push({ role: 'assistant', content: msg.content });
        }
      } else if (msg.role === 'function' && msg.functionResult) {
        result.push({
          role: 'tool',
          tool_call_id: msg.functionResult.callId || `call-${Date.now()}`,
          content: JSON.stringify(msg.functionResult.result),
        });
      }
    }

    return result;
  }

  private buildStructuredMessages(
    req: AiChatStructuredRequest,
  ): OpenAI.Chat.ChatCompletionMessageParam[] {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    if (req.systemInstruction) {
      messages.push({ role: 'system', content: req.systemInstruction });
    }

    for (const msg of req.messages) {
      if (msg.role === 'system') {
        messages.push({ role: 'system', content: msg.content });
      } else if (msg.role === 'assistant') {
        messages.push({ role: 'assistant', content: msg.content });
      } else {
        messages.push({ role: 'user', content: msg.content });
      }
    }

    return messages;
  }

  private convertTools(
    tools: ToolDeclaration[],
  ): OpenAI.Chat.ChatCompletionTool[] {
    return tools.map((tool) => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.parameters,
      },
    }));
  }

  private normalizeResponse(
    response: OpenAI.Chat.ChatCompletion,
  ): AiChatResponse {
    const message = response.choices[0]?.message;
    const text = message?.content ?? '';

    const functionCalls = (message?.tool_calls ?? [])
      .filter((call) => call.type === 'function')
      .map((call) => {
        const fn = (call as any).function as {
          name: string;
          arguments: string;
        };
        return {
          id: call.id,
          name: fn.name,
          arguments: JSON.parse(fn.arguments || '{}') as Record<string, any>,
        };
      });

    const usage = response.usage;

    return {
      text,
      ...(functionCalls.length > 0 ? { functionCalls } : {}),
      usageMetadata: {
        promptTokenCount: usage?.prompt_tokens,
        candidatesTokenCount: usage?.completion_tokens,
        totalTokenCount: usage?.total_tokens,
      },
    };
  }
}
