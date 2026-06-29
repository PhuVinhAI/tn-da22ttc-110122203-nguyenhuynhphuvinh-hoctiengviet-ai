import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Interactions, Type } from '@google/genai';

export { Type };
import * as fs from 'fs';
import * as path from 'path';
import {
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from './ai.exceptions';
import { KeyPool } from '../ai/key-pool';
import { mapGenaiError } from './genai-errors';
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
} from '@linvnix/shared';

interface AiAttachment {
  type: 'image';
  mimeType: string;
  data: string;
}

interface AiChatMessage {
  role: 'user' | 'assistant' | 'system' | 'function';
  content: string;
  attachments?: AiAttachment[];
  functionCall?: { id?: string; name: string; arguments: Record<string, any> };
  functionResult?: { callId?: string; name: string; result: any };
}

interface AiFunctionCall {
  id?: string;
  name: string;
  arguments: Record<string, any>;
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

interface GenaiGenerationConfig {
  temperature?: number;
  topP?: number;
  topK?: number;
  maxOutputTokens?: number;
  thinkingBudget?: number;
  thinkingLevel?: string;
  includeThoughts?: boolean;
}

interface GenaiConfig {
  apiKey: string;
  apiKeys: string[];
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
  generation?: GenaiGenerationConfig;
}

@Injectable()
export class GenaiProvider implements IAiProvider, OnModuleInit {
  private readonly logger = new Logger(GenaiProvider.name);
  private promptTemplates: Map<string, PromptTemplate> = new Map();
  private config: GenaiConfig;
  private clients: Map<string, GoogleGenAI> = new Map();
  private singleClient: GoogleGenAI | null = null;
  private singleApiKey: string | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly keyPool: KeyPool,
  ) {
    this.config = this.configService.get<GenaiConfig>('genai')!;
  }

  onModuleInit() {
    const genaiConfig = this.configService.get<GenaiConfig>('genai')!;
    const keys =
      genaiConfig.apiKeys.length > 0
        ? genaiConfig.apiKeys
        : genaiConfig.apiKey
          ? [genaiConfig.apiKey]
          : [];

    for (const key of keys) {
      this.clients.set(key, new GoogleGenAI({ apiKey: key }));
    }

    if (keys.length === 0 && genaiConfig.apiKey) {
      this.singleClient = new GoogleGenAI({ apiKey: genaiConfig.apiKey });
      this.singleApiKey = genaiConfig.apiKey;
    }

    this.loadPromptTemplates();
  }

  private getClientForKey(key: string): GoogleGenAI {
    const client = this.clients.get(key);
    if (client) return client;
    if (this.singleClient && key === this.singleApiKey)
      return this.singleClient;
    throw new Error(`No client found for key ${key.slice(0, 8)}...`);
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
  // pulling in a Jinja-style template engine. Arrays expand to bracketed
  // index keys: `{ list: [{name:'x'}] }` → `{ 'list[0].name': 'x' }` so
  // templates can use `{{list[0].name}}`.
  private flattenVariables(
    input: Record<string, any> | unknown[],
    prefix = '',
  ): Record<string, string> {
    const out: Record<string, string> = {};
    const entries: Array<[string, unknown]> = Array.isArray(input)
      ? input.map((v, i): [string, unknown] => [String(i), v])
      : Object.entries(input);
    for (const [key, value] of entries) {
      const fullKey = Array.isArray(input)
        ? `${prefix}[${key}]`
        : prefix
          ? `${prefix}.${key}`
          : key;
      if (value === null || value === undefined) {
        out[fullKey] = '';
      } else if (Array.isArray(value)) {
        Object.assign(out, this.flattenVariables(value, fullKey));
      } else if (
        typeof value === 'object' &&
        !(value instanceof Date) &&
        !(value instanceof Buffer)
      ) {
        Object.assign(
          out,
          this.flattenVariables(value as Record<string, any>, fullKey),
        );
      } else {
        out[fullKey] = String(value);
      }
    }
    return out;
  }

  private buildGenerationConfig(): Record<string, any> | undefined {
    const gen = this.config.generation;
    if (!gen) return undefined;
    const cfg: Record<string, any> = {};
    if (gen.temperature !== undefined) cfg.temperature = gen.temperature;
    if (gen.topP !== undefined) cfg.topP = gen.topP;
    if (gen.topK !== undefined) cfg.topK = gen.topK;
    if (gen.maxOutputTokens !== undefined)
      cfg.maxOutputTokens = gen.maxOutputTokens;
    const hasThinking =
      gen.thinkingBudget !== undefined ||
      gen.thinkingLevel ||
      gen.includeThoughts !== undefined;
    if (hasThinking) {
      cfg.thinkingConfig = {
        ...(gen.thinkingBudget !== undefined
          ? { thinkingBudget: gen.thinkingBudget }
          : {}),
        ...(gen.thinkingLevel ? { thinkingLevel: gen.thinkingLevel } : {}),
        ...(gen.includeThoughts !== undefined
          ? { includeThoughts: gen.includeThoughts }
          : {}),
      };
    }
    return Object.keys(cfg).length > 0 ? cfg : undefined;
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const model = req.model || this.config.models.chat;
    const steps = this.mapMessagesToSteps(req.messages as AiChatMessage[]);

    this.logger.debug(
      `chat() called with ${steps.length} steps, tools=${req.tools?.length ?? 0}, step types: ${steps.map((s) => s.type).join(', ')}`,
    );

    const genConfig = this.buildGenerationConfig();

    return this.executeWithRetry(async (client) => {
      const response = await client.interactions.create({
        model,
        input: steps,
        store: false,
        stream: false,
        system_instruction: req.systemInstruction,
        ...(genConfig ? { config: genConfig } : {}),
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
    if (req.abortSignal?.aborted) {
      return;
    }

    const model = req.model || this.config.models.chat;
    const steps = this.mapMessagesToSteps(req.messages as AiChatMessage[]);

    const { key } = this.keyPool.getKey();
    const client = this.getClientForKey(key);

    const genConfig = this.buildGenerationConfig();

    const params = {
      model,
      input: steps,
      store: false,
      stream: true as const,
      system_instruction: req.systemInstruction,
      ...(genConfig ? { config: genConfig } : {}),
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
    };
    const stream = req.abortSignal
      ? await client.interactions.create(params, { signal: req.abortSignal })
      : await client.interactions.create(params);

    const pendingFunctionCalls = new Map<number, AiFunctionCall>();
    const pendingArgumentDeltas = new Map<number, string>();
    const emittedFunctionCallIndexes = new Set<number>();

    for await (const event of stream) {
      if (req.abortSignal?.aborted) {
        break;
      }

      if (event.event_type === 'step.delta' && event.delta?.type === 'text') {
        yield {
          text: event.delta.text ?? '',
        };
        continue;
      }

      if (
        event.event_type === 'step.delta' &&
        event.delta?.type === 'arguments_delta'
      ) {
        const existing = pendingArgumentDeltas.get(event.index) ?? '';
        pendingArgumentDeltas.set(
          event.index,
          existing + (event.delta.partial_arguments ?? ''),
        );
        continue;
      }

      if (
        event.event_type === 'step.start' &&
        event.step?.type === 'function_call'
      ) {
        const step = event.step as any;
        pendingFunctionCalls.set(event.index, {
          id: step.id,
          name: step.name,
          arguments: (step.arguments ?? step.args ?? {}) as Record<string, any>,
        });
        continue;
      }

      if (event.event_type === 'step.stop') {
        const call = this.finalizeStreamedFunctionCall(
          event.index,
          pendingFunctionCalls,
          pendingArgumentDeltas,
        );
        if (call && !emittedFunctionCallIndexes.has(event.index)) {
          emittedFunctionCallIndexes.add(event.index);
          yield { text: '', functionCalls: [call] };
        }
        continue;
      }

      if (event.event_type === 'interaction.completed') {
        for (const [index] of pendingFunctionCalls) {
          if (emittedFunctionCallIndexes.has(index)) continue;
          const call = this.finalizeStreamedFunctionCall(
            index,
            pendingFunctionCalls,
            pendingArgumentDeltas,
          );
          if (call) {
            emittedFunctionCallIndexes.add(index);
            yield { text: '', functionCalls: [call] };
          }
        }

        const usage = (event as any).interaction?.usage;
        if (usage) {
          yield {
            text: '',
            usageMetadata: {
              promptTokenCount: usage.total_input_tokens,
              candidatesTokenCount: usage.total_output_tokens,
              totalTokenCount: usage.total_tokens,
            },
          };
        }
        continue;
      }

      if (event.event_type === 'error') {
        throw mapGenaiError(event as any);
      }
    }
  }

  async chatStructured<T = any>(req: AiChatStructuredRequest): Promise<T> {
    const model = req.model || this.config.models.chat;
    const contents = this.mapStructuredMessagesToContents(req.messages);

    const genConfig = this.buildGenerationConfig();

    const response = await this.executeWithRetry(async (client) => {
      return client.models.generateContent({
        model,
        contents,
        config: {
          responseMimeType: 'application/json',
          responseSchema: req.responseSchema,
          systemInstruction: req.systemInstruction,
          ...genConfig,
        },
      });
    });

    return {
      text: response.text ?? '',
      usageMetadata: {
        promptTokenCount: response.usageMetadata?.promptTokenCount,
        candidatesTokenCount: response.usageMetadata?.candidatesTokenCount,
        totalTokenCount: response.usageMetadata?.totalTokenCount,
      },
    } as unknown as T;
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
      const { key } = this.keyPool.getKey();
      const client = this.getClientForKey(key);

      try {
        const result = await fn(client);
        return result;
      } catch (error: any) {
        lastError = error;
        const statusCode = error?.status || error?.statusCode;

        if (statusCode === 429) {
          this.keyPool.markCooldown(key, error);
          this.logger.warn(
            `Rate limited on key ${key.slice(0, 8)}..., attempt ${attempt + 1}/${maxRetries + 1}`,
          );
          continue;
        }

        throw mapGenaiError(error);
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

    throw mapGenaiError(
      lastError || new AiServiceUnavailableException('Max retries exceeded'),
    );
  }

  private async tryFallbackModel<T>(
    fn: (client: GoogleGenAI) => Promise<T>,
  ): Promise<T> {
    const fallbackModel = this.config.models.chatFallback;
    this.logger.warn(`Attempting fallback model: ${fallbackModel}`);

    const { key } = this.keyPool.getKey();
    const client = this.getClientForKey(key);
    return fn(client);
  }

  private mapMessagesToSteps(messages: AiChatMessage[]): Interactions.Step[] {
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
      const content = this.mapMessageToInteractionContent(msg);
      steps.push({
        type: msg.role === 'user' ? 'user_input' : 'model_output',
        content,
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

  private finalizeStreamedFunctionCall(
    index: number,
    pendingFunctionCalls: Map<number, AiFunctionCall>,
    pendingArgumentDeltas: Map<number, string>,
  ): AiFunctionCall | null {
    const call = pendingFunctionCalls.get(index);
    if (!call) return null;

    const partialArguments = pendingArgumentDeltas.get(index);
    if (!partialArguments) return call;

    try {
      const parsed = JSON.parse(partialArguments);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return {
          ...call,
          arguments: parsed as Record<string, any>,
        };
      }
    } catch {
      // Keep the complete arguments from step.start when streamed partial
      // arguments are incomplete or not valid JSON in this SDK event shape.
    }

    return call;
  }

  private mapStructuredMessagesToContents(
    messages: AiChatStructuredRequest['messages'],
  ): Array<{
    role: string;
    parts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    >;
  }> {
    return messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: this.mapStructuredMessageToContentParts(msg),
    }));
  }

  private mapStructuredMessageToContentParts(
    msg: AiChatStructuredRequest['messages'][number],
  ): Array<
    { text: string } | { inlineData: { mimeType: string; data: string } }
  > {
    const parts: Array<
      { text: string } | { inlineData: { mimeType: string; data: string } }
    > = [];

    if (msg.content) {
      parts.push({ text: msg.content });
    }

    for (const attachment of msg.attachments ?? []) {
      if (attachment.type === 'image') {
        parts.push({
          inlineData: {
            mimeType: attachment.mimeType,
            data: attachment.data,
          },
        });
      }
    }

    return parts;
  }

  private mapMessageToInteractionContent(
    msg: AiChatMessage,
  ): Array<
    | { type: 'text'; text: string }
    | { type: 'image'; data: string; mime_type: string }
  > {
    const content: Array<
      | { type: 'text'; text: string }
      | { type: 'image'; data: string; mime_type: string }
    > = [];

    if (msg.content) {
      content.push({
        type: 'text',
        text: msg.content,
      });
    }

    for (const attachment of msg.attachments ?? []) {
      if (attachment.type === 'image') {
        content.push({
          type: 'image',
          data: attachment.data,
          mime_type: attachment.mimeType,
        });
      }
    }

    return content;
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
