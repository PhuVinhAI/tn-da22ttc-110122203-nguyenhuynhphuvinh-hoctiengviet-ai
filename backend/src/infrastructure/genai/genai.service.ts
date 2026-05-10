import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI, Interactions } from '@google/genai';
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

interface AiChatRequest {
  messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
  systemInstruction?: string;
  tools?: Array<{
    name: string;
    description: string;
    parameters: Record<string, any>;
  }>;
  model?: string;
}

interface AiChatResponse {
  text: string;
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

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      if (trimmed.endsWith(':') && !trimmed.startsWith(' ')) {
        if (currentTemplate && currentName) {
          templates[currentName] = currentTemplate as PromptTemplate;
        }
        currentName = trimmed.slice(0, -1).trim();
        currentTemplate = { name: currentName, template: '', variables: [] };
      } else if (currentTemplate) {
        if (trimmed.startsWith('template:')) {
          currentTemplate.template = trimmed
            .slice('template:'.length)
            .trim()
            .replace(/^["']|["']$/g, '');
        } else if (trimmed.startsWith('description:')) {
          currentTemplate.description = trimmed
            .slice('description:'.length)
            .trim()
            .replace(/^["']|["']$/g, '');
        }
      }
    }

    if (currentTemplate && currentName) {
      templates[currentName] = currentTemplate as PromptTemplate;
    }

    return { version: '1.0', templates };
  }

  renderPrompt(
    templateName: string,
    variables: Record<string, string> = {},
  ): string {
    const template = this.promptTemplates.get(templateName);
    if (!template) {
      throw new AiInvalidRequestException(
        `Prompt template '${templateName}' not found`,
      );
    }

    let rendered = template.template;
    for (const [key, value] of Object.entries(variables)) {
      rendered = rendered.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), value);
    }
    return rendered;
  }

  async chat(req: AiChatRequest): Promise<AiChatResponse> {
    const model = req.model || this.config.models.chat;
    const steps = this.mapMessagesToSteps(req.messages);

    return this.executeWithRetry(async (client) => {
      const response = await client.interactions.create({
        model,
        input: steps,
        store: false,
        stream: false,
        system_instruction: req.systemInstruction,
        tools: req.tools?.map((t) => ({
          type: 'function' as const,
          name: t.name,
          description: t.description,
          parameters: t.parameters,
        })),
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
    return messages.map((msg) => ({
      type: msg.role === 'user' ? 'user_input' : 'model_output',
      content: [
        {
          type: 'text',
          text: msg.content,
        },
      ],
    }));
  }

  private mapResponseToAiChatResponse(response: any): AiChatResponse {
    const steps = response.steps || [];
    const lastStep = steps[steps.length - 1];
    const content = lastStep?.content?.[0];
    const text = content?.text || '';
    const usageMetadata = response.usageMetadata || {};

    return {
      text,
      usageMetadata: {
        promptTokenCount: usageMetadata.promptTokenCount,
        candidatesTokenCount: usageMetadata.candidatesTokenCount,
        totalTokenCount: usageMetadata.totalTokenCount,
      },
    };
  }
}
