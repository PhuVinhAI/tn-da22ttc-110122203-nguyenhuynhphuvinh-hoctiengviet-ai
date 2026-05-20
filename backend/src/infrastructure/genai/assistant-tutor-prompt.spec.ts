import * as path from 'path';
import * as fs from 'fs';
import { ConfigService } from '@nestjs/config';
import { GenaiService } from './genai.service';
import { KeyPool } from './key-pool';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({
    interactions: { create: jest.fn() },
    models: { generateContent: jest.fn() },
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

function createConfigService() {
  return {
    get: () => ({
      apiKey: 'test',
      apiKeys: ['test'],
      models: {
        chat: 'gemini-2.5-flash',
        chatFallback: 'gemini-2.0-flash',
        embed: 'text-embedding-004',
        image: 'imagen-4.0-generate-001',
      },
      maxRetries: 0,
      timeout: 1000,
      safety: { chat: [], image: [], default: [] },
    }),
  } as unknown as ConfigService;
}

function createMockKeyPool() {
  return {
    getKey: jest
      .fn()
      .mockReturnValue({ key: 'test', client: { interactions: {} } }),
    markCooldown: jest.fn(),
    isExhausted: jest.fn().mockReturnValue(false),
    updateStats: jest.fn(),
  } as unknown as KeyPool;
}

// This spec deliberately does NOT mock 'fs' — we want to load the real
// assistant-tutor.yaml file from disk so the test catches breakage if the
// template file is renamed, malformed, or stripped of a placeholder.
describe('assistant-tutor prompt template', () => {
  let service: GenaiService;

  beforeAll(() => {
    service = new GenaiService(createConfigService(), createMockKeyPool());
    service.onModuleInit();
  });

  it('loads the assistant-tutor template from disk', () => {
    // Sanity check: the loader read it. Render with no vars and confirm
    // the persona header is present.
    const out = service.renderPrompt('assistant-tutor', {});
    expect(out).toContain('AI Assistant');
  });

  it('substitutes all documented placeholders from a nested variable object', () => {
    const out = service.renderPrompt('assistant-tutor', {
      user: {
        nativeLanguage: 'English',
        currentLevel: 'B1',
        preferredDialect: 'NORTHERN',
      },
      screenContext: {
        route: '/courses/c1/modules/m1/lessons/l1',
        displayName: 'Lesson: Greetings',
        data: JSON.stringify({ lessonId: 'l1', body: 'Xin chào' }),
      },
    });

    expect(out).toContain('Native language: English');
    expect(out).toContain('CEFR level: B1');
    expect(out).toContain('Preferred Vietnamese dialect: NORTHERN');
    expect(out).toContain('Route: /courses/c1/modules/m1/lessons/l1');
    expect(out).toContain('Display name: Lesson: Greetings');
    expect(out).toContain('"lessonId":"l1"');
  });

  it('declares the hint-mode rule keyed off exercises/play route', () => {
    const out = service.renderPrompt('assistant-tutor', {});
    expect(out).toMatch(/exercises\/play/);
    expect(out).toMatch(/hint|Hint/);
  });

  it('locks the response language to user.nativeLanguage as a hard rule', () => {
    const out = service.renderPrompt('assistant-tutor', {
      user: { nativeLanguage: 'English' },
    });
    expect(out).toContain('ALWAYS write your reply in the learner');
    expect(out).toContain('English');
  });

  it('defaults to English when nativeLanguage is empty', () => {
    const out = service.renderPrompt('assistant-tutor', {
      user: { nativeLanguage: '' },
    });
    expect(out).toContain('If that field is empty, use English');
  });

  it('enables markdown rendering in the persona', () => {
    const out = service.renderPrompt('assistant-tutor', {});
    expect(out.toLowerCase()).toContain('markdown');
  });

  it('explains the runtime Flutter uiSnapshot contract to the model', () => {
    const out = service.renderPrompt('assistant-tutor', {});
    expect(out).toContain('screenContext.data.uiSnapshot');
    expect(out).toContain('screenType');
    expect(out).toContain('texts');
    expect(out).toContain('structure');
  });

  it('reads from backend/src/infrastructure/genai/prompts/assistant-tutor.yaml on disk', () => {
    const expected = path.join(__dirname, 'prompts', 'assistant-tutor.yaml');
    // If this file ever moves the loader skips it silently, which would make
    // the substitution tests above start to fail. This assertion documents
    // the expected location.
    expect(fs.existsSync(expected)).toBe(true);
  });
});
