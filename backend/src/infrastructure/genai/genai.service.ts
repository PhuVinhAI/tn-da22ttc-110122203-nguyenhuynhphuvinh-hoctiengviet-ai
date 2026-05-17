import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Interactions, Type } from '@google/genai';

export { Type };
import * as fs from 'fs';
import * as path from 'path';
import {
  AiRateLimitException,
  AiTimeoutException,
  AiSafetyBlockedException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from './ai.exceptions';
import { KeyPool } from './key-pool';

interface AiChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  functionCall?: { id?: string; name: string; arguments: Record<string, any> };
  functionResult?: { callId?: string; name: string; result: any };
}

interface AiChatRequest {
  messages: AiChatMessage[];
  systemInstruction?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  model?: string;
}

interface AiChatStructuredRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemInstruction?: string;
  responseSchema: Record<string, any>;
  model?: string;
}

interface AiFunctionCall {
  id?: string;
  name: string;
  arguments: Record<string, any>;
}

interface AiChatResponse {
  text: string;
  functionCalls?: AiFunctionCall[];
  usageMetadata: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

interface AiChatChunk {
  text: string;
}

interface AiEmbedding {
  values: number[];
  index?: number;
}

interface AiFileUpload {
  data: Buffer | Uint8Array;
  mimeType: string;
  displayName?: string;
}

interface AiFileRef {
  name: string;
  uri: string;
  mimeType: string;
  sizeBytes?: number;
}

interface AiImageRequest {
  prompt: string;
  negativePrompt?: string;
  width?: number;
  height?: number;
  numberOfImages?: number;
}

interface AiImageRef {
  data: Buffer | Uint8Array;
  mimeType: string;
  width?: number;
  height?: number;
}

interface IAiProvider {
  chat(req: AiChatRequest): Promise<AiChatResponse>;
  chatStream(req: AiChatRequest): AsyncIterable<AiChatChunk>;
  embed(texts: string[]): Promise<AiEmbedding[]>;
  uploadFile(file: AiFileUpload): Promise<AiFileRef>;
  generateImage(prompt: AiImageRequest): Promise<AiImageRef>;
}

interface PromptTemplateVariable {
  name: string;
  description?: string;
  required?: boolean;
  defaultValue?: string;
}

interface PromptTemplate {
  name: string;
  description?: string;
  template: string;
  variables: PromptTemplateVariable[];
}

interface PromptTemplateCollection {
  version: string;
  templates: Record<string, PromptTemplate>;
}

interface GenaiConfig {
  models: {
    chat: string;
    chatFallback: string;
    embed: string;
    image: string;
  };
  maxRetries: number;
  timeout: number;
  safety: {
    chat: Array<{ category: string; threshold: string }>;
    image: Array<{ category: string; threshold: string }>;
    default: Array<{ category: string; threshold: string }>;
  };
}

@Injectable()
export class GenaiService implements IAiProvider, OnModuleInit {
  private readonly logger = new Logger(GenaiService.name);
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private config: GenaiConfig;

  constructor(
    private readonly configService: ConfigService,
    private readonly keyPool: KeyPool,
  ) {
    this.config = this.configService.get<GenaiConfig>('genai')!;
  }

  onModuleInit() {
    this.loadPromptTemplates();
  }

  private loadPromptTemplates() {
    const promptsDir = path.join(__dirname, 'prompts');
    if (!fs.existsSync(promptsDir)) {
      this.logger.warn(
        'Prompts directory not found, skipping template loading',
      );
      return;
    }

    try {
      const files = fs
        .readdirSync(promptsDir)
        .filter((f) => f.endsWith('.yaml') || f.endsWith('.yml'));
      for (const file of files) {
        const filePath = path.join(promptsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const collection = this.parseYamlPrompts(content);
        if (collection?.templates) {
          for (const [name, template] of Object.entries(collection.templates)) {
            this.promptTemplates.set(name, template);
          }
        }
      }
      this.logger.log(`Loaded ${this.promptTemplates.size} prompt template(s)`);
    } catch (error) {
      this.logger.error('Failed to load prompt templates', error);
    }
  }

  private parseYamlPrompts(content: string): PromptTemplateCollection | null {
    const templates: Record<string, PromptTemplate> = {};
    const lines = content.split('\n');
    let currentTemplate: Partial<PromptTemplate> | null = null;
    let currentName = '';
    let collectingMultiLine = false;
    let multiLineKey = '';
    let multiLineBuffer: string[] = [];
    let multiLineIndent = -1;

    const flushMultiLine = () => {
      if (!collectingMultiLine || !currentTemplate) return;
      const value = multiLineBuffer.join('\n').trimEnd();
      if (multiLineKey === 'template') {
        currentTemplate.template = value;
      } else if (multiLineKey === 'description') {
        currentTemplate.description = value;
      }
      collectingMultiLine = false;
      multiLineBuffer = [];
      multiLineIndent = -1;
    };

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const trimmed = line.trim();
      const lineIndent = line.length - line.trimStart().length;

      if (collectingMultiLine) {
        if (trimmed === '') {
          multiLineBuffer.push('');
        } else if (lineIndent >= multiLineIndent) {
          multiLineBuffer.push(line.slice(multiLineIndent));
        } else {
          flushMultiLine();
        }
        if (collectingMultiLine) continue;
      }

      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.endsWith(':') && lineIndent === 0) {
        if (currentTemplate && currentName) {
          flushMultiLine();
          templates[currentName] = currentTemplate as PromptTemplate;
        }
        currentName = trimmed.slice(0, -1).trim();
        currentTemplate = { name: currentName, template: '', variables: [] };
      } else if (currentTemplate) {
        if (trimmed.startsWith('template:')) {
          const raw = trimmed.slice('template:'.length).trim();
          if (raw === '|' || raw === '|-' || raw === '>' || raw === '>-') {
            collectingMultiLine = true;
            multiLineKey = 'template';
            const nextLine = lines[i + 1] || '';
            multiLineIndent = nextLine.length - nextLine.trimStart().length;
            multiLineBuffer = [];
          } else {
            currentTemplate.template = raw.replace(/^["']|["']$/g, '');
          }
        } else if (trimmed.startsWith('description:')) {
          const raw = trimmed.slice('description:'.length).trim();
          if (raw === '|' || raw === '|-' || raw === '>' || raw === '>-') {
            collectingMultiLine = true;
            multiLineKey = 'description';
            const nextLine = lines[i + 1] || '';
            multiLineIndent = nextLine.length - nextLine.trimStart().length;
            multiLineBuffer = [];
          } else {
            currentTemplate.description = raw.replace(/^["']|["']$/g, '');
          }
        }
      }
    }

    if (collectingMultiLine) {
      flushMultiLine();
    }

    if (currentTemplate && currentName) {
      templates[currentName] = currentTemplate as PromptTemplate;
    }

    return { version: '1.0', templates };
  }

  renderPrompt(
    templateName: string,
    variables: Record<string, any> = {},
  ): string {
    const template = this.promptTemplates.get(templateName);
    if (!template) {
      throw new AiInvalidRequestException(
        `Prompt template '${templateName}' not found`,
      );
    }

    let rendered = template.template;
    const flat = this.flattenVariables(variables);
    for (const [key, value] of Object.entries(flat)) {
      const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      rendered = rendered.replace(
        new RegExp(`\\{\\{${escaped}\\}\\}`, 'g'),
        value,
      );
    }
    return rendered;
  }

  // Flattens `{ a: { b: 'x' }, c: 1 }` → `{ 'a.b': 'x', c: '1' }` so a flat
  // `{{a.b}}` substitution can resolve nested template variables without
  // pulling in a Jinja-style template engine.
  private flattenVariables(
    input: Record<string, any>,
    prefix = '',
  ): Record<string, string> {
    const out: Record<string, string> = {};
    for (const [key, value] of Object.entries(input)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      if (value === null || value === undefined) {
        out[fullKey] = '';
      } else if (
        typeof value === 'object' &&
        !Array.isArray(value) &&
        !(value instanceof Date) &&
        !(value instanceof Buffer)
      ) {
        Object.assign(out, this.flattenVariables(value, fullKey));
      } else {
        out[fullKey] = String(value);
      }
    }
    return out;
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const model = req.model || this.config.models.chat;
    const steps = this.mapMessagesToSteps(req.messages);

    this.logger.debug(
      `chat() called with ${steps.length} steps, tools=${req.tools?.length ?? 0}, step types: ${steps.map((s) => s.type).join(', ')}`,
    );

    return this.executeWithRetry(async (client) => {
      const response = await client.interactions.create({
        model,
        input: steps,
        stream: false,
        system_instruction: req.systemInstruction,
        ...(req.tools?.length
          ? {
              tools: req.tools.map((t) => ({
                type: 'function' as const,
                name: t.name,
                description: t.description,
                parameters: t.parameters,
              })),
            }
          : {}),
      });

      return this.mapResponseToAiChatResponse(response);
    });
  }

  async *chatStream(req: AiChatRequest): AsyncIterable<AiChatChunk> {
    const model = req.model || this.config.models.chat;
    const steps = this.mapMessagesToSteps(req.messages);

    const { client } = this.keyPool.getKey();

    const stream = await client.interactions.create({
      model,
      input: steps,
      store: false,
      stream: true,
      system_instruction: req.systemInstruction,
    });

    for await (const event of stream) {
      if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
        yield {
          text: event.delta.text ?? '',
        };
      }
    }
  }

  async chatStructured(req: AiChatStructuredRequest): Promise<AiChatResponse> {
    const model = req.model || this.config.models.chat;
    const contents = this.mapMessagesToContents(req.messages);

    return this.executeWithRetry(async (client) => {
      const response = await client.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: req.responseSchema,
          systemInstruction: req.systemInstruction,
        },
      });

      return {
        text: response.text ?? '',
        usageMetadata: {
          promptTokenCount: response.usageMetadata?.promptTokenCount,
          candidatesTokenCount: response.usageMetadata?.candidatesTokenCount,
          totalTokenCount: response.usageMetadata?.totalTokenCount,
        },
      };
    });
  }

  async embed(_texts: string[]): Promise<AiEmbedding[]> {
    throw new AiInvalidRequestException('embed() is not yet implemented');
  }

  async uploadFile(_file: AiFileUpload): Promise<AiFileRef> {
    throw new AiInvalidRequestException('uploadFile() is not yet implemented');
  }

  async generateImage(_prompt: AiImageRequest): Promise<AiImageRef> {
    throw new AiInvalidRequestException(
      'generateImage() is not yet implemented',
    );
  }

  private async executeWithRetry<T>(
    fn: (client: GoogleGenAI) => Promise<T>,
  ): Promise<T> {
    const maxRetries = this.config.maxRetries;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      const { key, client } = this.keyPool.getKey();

      try {
        const result = await fn(client);
        return result;
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.status || error?.statusCode;

        if (statusCode === 429) {
          this.keyPool.markCooldown(key, { statusCode: 429 });
          this.logger.warn(
            `Rate limited on key ${key.slice(0, 8)}..., attempt ${attempt + 1}/${maxRetries + 1}`,
          );
          continue;
        }

        throw this.mapSdkError(error);
      }
    }

    if (this.keyPool.isExhausted()) {
      try {
        return await this.tryFallbackModel(fn);
      } catch {
        throw new AiServiceUnavailableException(
          'All keys exhausted and fallback model failed',
        );
      }
    }

    throw this.mapSdkError(
      lastError || new AiServiceUnavailableException('Max retries exceeded'),
    );
  }

  private async tryFallbackModel<T>(
    fn: (client: GoogleGenAI) => Promise<T>,
  ): Promise<T> {
    const fallbackModel = this.config.models.chatFallback;
    this.logger.warn(`Attempting fallback model: ${fallbackModel}`);

    const { client } = this.keyPool.getKey();
    return fn(client);
  }

  private mapSdkError(error: any): Error {
    const statusCode = error?.status || error?.statusCode;
    const message = error?.message || 'Unknown AI error';

    if (statusCode === 429) {
      return new AiRateLimitException(message);
    }
    if (statusCode === 504 || error?.name === 'TimeoutError') {
      return new AiTimeoutException(message);
    }
    if (message.includes('SAFETY') || message.includes('blocked')) {
      return new AiSafetyBlockedException(message);
    }
    if (statusCode === 400) {
      return new AiInvalidRequestException(message);
    }

    return new AiServiceUnavailableException(message);
  }

  private mapMessagesToSteps(
    messages: AiChatRequest['messages'],
  ): Interactions.Step[] {
    const steps: Interactions.Step[] = [];

    for (const msg of messages) {
      if (msg.functionCall) {
        steps.push({
          type: 'user_input',
          content: [
            {
              type: 'text',
              text: `[Tool call: ${msg.functionCall.name}(${JSON.stringify(msg.functionCall.arguments)})]`,
            },
          ],
        } as any);
        continue;
      }
      if (msg.functionResult) {
        steps.push({
          type: 'user_input',
          content: [
            {
              type: 'text',
              text: `[Tool result for ${msg.functionResult.name}]: ${this.truncateFunctionResult(msg.functionResult.result)}`,
            },
          ],
        } as any);
        continue;
      }
      steps.push({
        type: msg.role === 'user' ? 'user_input' : 'model_output',
        content: [
          {
            type: 'text',
            text: msg.content,
          },
        ],
      } as any);
    }
    return steps;
  }

  private sanitizeForGemini(value: any): any {
    if (value === null || value === undefined) {
      return null;
    }
    if (Array.isArray(value)) {
      const sanitized = value
        .map((v) => this.sanitizeForGemini(v))
        .filter((v) => v !== null && v !== undefined);
      return sanitized.length > 0 ? sanitized : null;
    }
    if (typeof value === 'object') {
      const entries = Object.entries(value)
        .map(([k, v]) => [k, this.sanitizeForGemini(v)])
        .filter(([, v]) => v !== null && v !== undefined);
      return entries.length > 0 ? Object.fromEntries(entries) : null;
    }
    return value;
  }

  private truncateFunctionResult(result: any): string {
    const sanitized = this.sanitizeForGemini(result);
    if (sanitized === null || sanitized === undefined) {
      return 'Tool returned empty result';
    }
    return JSON.stringify(sanitized);
  }

  private mapMessagesToContents(
    messages: AiChatRequest['messages'],
  ): Array<{ role: string; parts: Array<{ text: string }> }> {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }));
  }

  private mapResponseToAiChatResponse(response: any): AiChatResponse {
    const steps: any[] = response.steps || [];

    // Gemini Interactions API returns each function invocation as a top-level
    // step with `type: 'function_call'` (see js-genai/sdk-samples). Collect
    // them so AgentService can drive the ReAct tool loop — without this
    // mapping the existing tool loop never sees any calls.
    const functionCalls: AiFunctionCall[] = [];
    let text = '';

    for (const step of steps) {
      if (step?.type === 'function_call' && typeof step.name === 'string') {
        functionCalls.push({
          id: step.id,
          name: step.name,
          arguments: (step.arguments ?? {}) as Record<string, any>,
        });
        continue;
      }
      // Text lives on model_output steps (or on the older `content`-only shape
      // emitted by the test fixtures, which omit `type`). Accept both.
      const contents: any[] = Array.isArray(step?.content) ? step.content : [];
      for (const item of contents) {
        if (item?.type === 'text' && typeof item.text === 'string') {
          text += item.text;
        }
      }
    }

    const usageMetadata = response.usageMetadata || {};

    return {
      text,
      ...(functionCalls.length > 0 ? { functionCalls } : {}),
      usageMetadata: {
        promptTokenCount: usageMetadata.promptTokenCount,
        candidatesTokenCount: usageMetadata.candidatesTokenCount,
        totalTokenCount: usageMetadata.totalTokenCount,
      },
    };
  }
}
