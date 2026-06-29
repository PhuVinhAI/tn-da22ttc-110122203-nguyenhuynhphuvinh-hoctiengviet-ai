import { z } from 'zod';
import {
  AiException,
  AiRateLimitException,
  AiQuotaExceededException,
  AiTimeoutException,
  AiSafetyBlockedException,
  AiInvalidRequestException,
  AiServiceUnavailableException,
} from '../exceptions/ai.exception.js';
import { BaseTool } from '../tools/base-tool.js';
import type { ToolContext } from '../tools/tool-context.js';
import type { ToolDeclaration } from '../types/ai.js';
import type { IAiProvider } from '../types/provider.js';
import { isProposalPayload, DEFAULT_PROPOSAL_LABELS } from '../tools/proposal-payload.js';

const mockCtx: ToolContext = {
  userId: 'user-1',
  conversationId: 'conv-1',
  screenContext: { route: '/' },
  user: { id: 'user-1' },
};

describe('AiException hierarchy', () => {
  it('AiException has correct base properties', () => {
    const ex = new AiException('test error', 500, 'TEST_ERROR');
    expect(ex).toBeInstanceOf(Error);
    expect(ex).toBeInstanceOf(AiException);
    expect(ex.message).toBe('test error');
    expect(ex.statusCode).toBe(500);
    expect(ex.code).toBe('TEST_ERROR');
    expect(ex.name).toBe('AiException');
  });

  it('AiRateLimitException has status 429', () => {
    const ex = new AiRateLimitException();
    expect(ex.statusCode).toBe(429);
    expect(ex.code).toBe('AI_RATE_LIMIT_EXCEEDED');
    expect(ex).toBeInstanceOf(AiException);
  });

  it('AiQuotaExceededException has status 429', () => {
    const ex = new AiQuotaExceededException();
    expect(ex.statusCode).toBe(429);
    expect(ex.code).toBe('AI_QUOTA_EXCEEDED');
    expect(ex).toBeInstanceOf(AiException);
  });

  it('AiTimeoutException has status 504', () => {
    const ex = new AiTimeoutException();
    expect(ex.statusCode).toBe(504);
    expect(ex.code).toBe('AI_TIMEOUT');
    expect(ex).toBeInstanceOf(AiException);
  });

  it('AiSafetyBlockedException has status 422', () => {
    const ex = new AiSafetyBlockedException();
    expect(ex.statusCode).toBe(422);
    expect(ex.code).toBe('AI_SAFETY_BLOCKED');
    expect(ex).toBeInstanceOf(AiException);
  });

  it('AiInvalidRequestException has status 400', () => {
    const ex = new AiInvalidRequestException();
    expect(ex.statusCode).toBe(400);
    expect(ex.code).toBe('AI_INVALID_REQUEST');
    expect(ex).toBeInstanceOf(AiException);
  });

  it('AiServiceUnavailableException has status 503', () => {
    const ex = new AiServiceUnavailableException();
    expect(ex.statusCode).toBe(503);
    expect(ex.code).toBe('AI_SERVICE_UNAVAILABLE');
    expect(ex).toBeInstanceOf(AiException);
  });

  it('all subclasses preserve custom messages', () => {
    const cases = [
      { cls: AiRateLimitException, msg: 'custom rate limit' },
      { cls: AiQuotaExceededException, msg: 'custom quota' },
      { cls: AiTimeoutException, msg: 'custom timeout' },
      { cls: AiSafetyBlockedException, msg: 'custom safety' },
      { cls: AiInvalidRequestException, msg: 'custom invalid' },
      { cls: AiServiceUnavailableException, msg: 'custom unavailable' },
    ];

    for (const { cls, msg } of cases) {
      const ex = new (cls as any)(msg);
      expect(ex.message).toBe(msg);
    }
  });
});

describe('BaseTool', () => {
  class TestTool extends BaseTool<{ input: string }, string> {
    readonly name = 'test_tool';
    readonly displayName = 'Đang chạy test tool...';
    readonly description = 'A test tool';
    readonly parameters = z.object({
      input: z.string().describe('The input value'),
    });

    async execute(
      params: { input: string },
      _ctx: ToolContext,
    ): Promise<string> {
      return `processed: ${params.input}`;
    }
  }

  class NestedTool extends BaseTool<
    { user: { name: string; age: number }; tags: string[] },
    boolean
  > {
    readonly name = 'nested_tool';
    readonly displayName = 'Đang xử lý...';
    readonly description = 'A tool with nested params';
    readonly parameters = z.object({
      user: z.object({
        name: z.string(),
        age: z.number(),
      }),
      tags: z.array(z.string()),
    });

    async execute(): Promise<boolean> {
      return true;
    }
  }

  class CtxAwareTool extends BaseTool<{ q: string }, ToolContext> {
    readonly name = 'ctx_aware_tool';
    readonly displayName = 'Đang lấy ngữ cảnh...';
    readonly description = 'Returns the ctx for verification';
    readonly parameters = z.object({ q: z.string() });

    async execute(
      _params: { q: string },
      ctx: ToolContext,
    ): Promise<ToolContext> {
      return ctx;
    }
  }

  it('execute receives params and ToolContext', async () => {
    const tool = new TestTool();
    const result = await tool.execute({ input: 'hello' }, mockCtx);
    expect(result).toBe('processed: hello');
  });

  it('exposes a Vietnamese displayName for the per-tool loading state', () => {
    // Every tool MUST expose `displayName` — the mobile assistant shows this
    // as the spinner subtitle during Phase B of the Mid mode so the learner
    // knows what the AI is currently doing.
    const tool = new TestTool();
    expect(typeof tool.displayName).toBe('string');
    expect(tool.displayName.length).toBeGreaterThan(0);
    expect(tool.displayName).toBe('Đang chạy test tool...');
  });

  it('execute forwards ToolContext to tool implementation', async () => {
    const tool = new CtxAwareTool();
    const result = await tool.execute({ q: 'x' }, mockCtx);
    expect(result).toBe(mockCtx);
    expect(result.userId).toBe('user-1');
    expect(result.conversationId).toBe('conv-1');
  });

  it('toDeclaration returns correct ToolDeclaration shape', () => {
    const tool = new TestTool();
    const decl = tool.toDeclaration();

    expect(decl.name).toBe('test_tool');
    expect(decl.description).toBe('A test tool');
    expect(typeof decl.parameters).toBe('object');
    expect(decl.parameters).toHaveProperty('type', 'object');
    expect(decl.parameters).toHaveProperty('properties');
  });

  it('toDeclaration produces valid JSON Schema from Zod schema', () => {
    const tool = new TestTool();
    const decl = tool.toDeclaration();
    const params = decl.parameters as any;

    expect(params.type).toBe('object');
    expect(params.properties.input).toBeDefined();
    expect(params.properties.input.type).toBe('string');
  });

  it('toDeclaration handles nested objects and arrays', () => {
    const tool = new NestedTool();
    const decl = tool.toDeclaration();
    const params = decl.parameters as any;

    expect(params.properties.user.type).toBe('object');
    expect(params.properties.user.properties.name.type).toBe('string');
    expect(params.properties.user.properties.age.type).toBe('number');
    expect(params.properties.tags.type).toBe('array');
    expect(params.properties.tags.items.type).toBe('string');
  });

  it('toDeclaration result is plain JSON (no SDK types)', () => {
    const tool = new TestTool();
    const decl = tool.toDeclaration();
    const jsonStr = JSON.stringify(decl);
    const parsed = JSON.parse(jsonStr);

    expect(parsed.name).toBe('test_tool');
    expect(parsed.description).toBe('A test tool');
    expect(parsed.parameters.type).toBe('object');
  });
});

describe('Type contracts', () => {
  it('IAiProvider interface has all required methods', () => {
    const mockProvider: IAiProvider = {
      chat: async () => ({
        text: '',
        usageMetadata: { totalTokenCount: 0 },
      }),
      chatStream: async function* () {},
      embed: async () => [],
      uploadFile: async () => ({
        name: '',
        uri: '',
        mimeType: '',
      }),
      generateImage: async () => ({
        data: new Uint8Array(),
        mimeType: '',
      }),
    };

    expect(typeof mockProvider.chat).toBe('function');
    expect(typeof mockProvider.chatStream).toBe('function');
    expect(typeof mockProvider.embed).toBe('function');
    expect(typeof mockProvider.uploadFile).toBe('function');
    expect(typeof mockProvider.generateImage).toBe('function');
  });

  it('ToolDeclaration has correct shape', () => {
    const decl: ToolDeclaration = {
      name: 'test',
      description: 'desc',
      parameters: { type: 'object', properties: {} },
    };
    expect(decl.name).toBe('test');
    expect(decl.description).toBe('desc');
    expect(typeof decl.parameters).toBe('object');
  });

  it('ToolContext has the documented shape', () => {
    const ctx: ToolContext<{ id: string; nativeLanguage: string }> = {
      userId: 'u1',
      conversationId: 'c1',
      screenContext: { route: '/x' },
      user: { id: 'u1', nativeLanguage: 'English' },
    };
    expect(ctx.userId).toBe('u1');
    expect(ctx.user.nativeLanguage).toBe('English');
  });
});

describe('isProposalPayload', () => {
  it('returns true for a valid ProposalPayload', () => {
    const payload = {
      kind: 'create_daily_goal',
      title: 'Tạo mục tiêu?',
      description: 'Đặt mục tiêu 3 hội thoại',
      endpoint: 'POST /api/v1/daily-goals',
      payload: { goalType: 'SIMULATIONS', targetValue: 3 },
    };
    expect(isProposalPayload(payload)).toBe(true);
  });

  it('returns true when optional labels are present', () => {
    const payload = {
      kind: 'create_daily_goal',
      title: 'Tạo mục tiêu?',
      description: 'desc',
      endpoint: 'POST /daily-goals',
      payload: {},
      labels: { confirm: 'Có', decline: 'Không' },
    };
    expect(isProposalPayload(payload)).toBe(true);
  });

  it('returns false for objects with error field', () => {
    expect(isProposalPayload({ error: 'boom' })).toBe(false);
  });

  it('returns false for null', () => {
    expect(isProposalPayload(null)).toBe(false);
  });

  it('returns false for undefined', () => {
    expect(isProposalPayload(undefined)).toBe(false);
  });

  it('returns false for arrays', () => {
    expect(isProposalPayload([])).toBe(false);
  });

  it('returns false for non-object values', () => {
    expect(isProposalPayload('string')).toBe(false);
    expect(isProposalPayload(42)).toBe(false);
  });

  it('returns false when kind is missing', () => {
    expect(
      isProposalPayload({
        title: 't',
        description: 'd',
        endpoint: 'e',
        payload: {},
      }),
    ).toBe(false);
  });

  it('returns false when payload is null', () => {
    expect(
      isProposalPayload({
        kind: 'k',
        title: 't',
        description: 'd',
        endpoint: 'e',
        payload: null,
      }),
    ).toBe(false);
  });

  it('returns false when payload is an array', () => {
    expect(
      isProposalPayload({
        kind: 'k',
        title: 't',
        description: 'd',
        endpoint: 'e',
        payload: [],
      }),
    ).toBe(false);
  });
});

describe('DEFAULT_PROPOSAL_LABELS', () => {
  it('has Vietnamese confirm and decline labels', () => {
    expect(DEFAULT_PROPOSAL_LABELS.confirm).toBe('Có');
    expect(DEFAULT_PROPOSAL_LABELS.decline).toBe('Không');
  });
});
