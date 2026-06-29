import { AiProviderRouter } from './ai-provider-router';
import { GenaiProvider } from '../genai/genai-provider';
import { OpenaiProvider } from '../openai/openai.provider';
import { ConfigService } from '@nestjs/config';

const emptyGeneration = {
  temperature: undefined,
  topP: undefined,
  topK: undefined,
  maxTokens: undefined,
  reasoningEffort: undefined,
};

function makeRouter(
  featureConfigs: Record<string, Partial<Record<string, any>>> = {},
): AiProviderRouter {
  const defaults = {
    question: {
      provider: 'genai',
      baseUrl: '',
      apiKeys: [],
      model: '',
      fallbackModel: '',
      generation: emptyGeneration,
    },
    simulation: {
      provider: 'genai',
      baseUrl: '',
      apiKeys: [],
      model: '',
      fallbackModel: '',
      generation: emptyGeneration,
    },
    assistant: {
      provider: 'genai',
      baseUrl: '',
      apiKeys: [],
      model: '',
      fallbackModel: '',
      generation: emptyGeneration,
    },
    imageAnalysis: {
      provider: 'genai',
      baseUrl: '',
      apiKeys: [],
      model: '',
      fallbackModel: '',
      generation: emptyGeneration,
    },
  };
  const merged = {
    question: { ...defaults.question, ...(featureConfigs['question'] ?? {}) },
    simulation: {
      ...defaults.simulation,
      ...(featureConfigs['simulation'] ?? {}),
    },
    assistant: {
      ...defaults.assistant,
      ...(featureConfigs['assistant'] ?? {}),
    },
    imageAnalysis: {
      ...defaults.imageAnalysis,
      ...(featureConfigs['imageAnalysis'] ?? {}),
    },
  };

  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'aiRouter.question') return merged.question;
      if (key === 'aiRouter.simulation') return merged.simulation;
      if (key === 'aiRouter.assistant') return merged.assistant;
      if (key === 'aiRouter.imageAnalysis') return merged.imageAnalysis;
      return undefined;
    }),
  } as unknown as ConfigService;

  const genaiProvider = { renderPrompt: jest.fn() } as unknown as GenaiProvider;
  return new AiProviderRouter(genaiProvider, configService);
}

describe('AiProviderRouter', () => {
  describe('forFeature - default genai', () => {
    it('returns injected GenaiProvider when no per-feature config set', () => {
      const router = makeRouter();
      const genai = (router as any).genaiProvider as GenaiProvider;

      router.onModuleInit();
      const provider = router.forFeature('question');

      expect(provider).toBe(genai);
    });
  });

  describe('forFeature - openai provider', () => {
    it('returns OpenaiProvider instance when provider=openai with valid config', () => {
      const router = makeRouter({
        question: {
          provider: 'openai',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKeys: ['sk-key1'],
          model: 'claude-3-haiku',
          fallbackModel: '',
          generation: emptyGeneration,
        },
      });

      router.onModuleInit();
      const provider = router.forFeature('question');

      expect(provider).toBeInstanceOf(OpenaiProvider);
    });

    it('caches provider — two calls return same instance', () => {
      const router = makeRouter({
        question: {
          provider: 'openai',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKeys: ['sk-key1'],
          model: 'claude-3-haiku',
          fallbackModel: '',
          generation: emptyGeneration,
        },
      });

      router.onModuleInit();
      const first = router.forFeature('question');
      const second = router.forFeature('question');

      expect(first).toBe(second);
    });

    it('returns different instances for different features', () => {
      const openaiConfig = {
        provider: 'openai',
        baseUrl: 'https://openrouter.ai/api/v1',
        apiKeys: ['sk-key1'],
        model: 'claude-3-haiku',
        fallbackModel: '',
        generation: emptyGeneration,
      };
      const router = makeRouter({
        question: openaiConfig,
        simulation: openaiConfig,
      });

      router.onModuleInit();
      const exerciseProvider = router.forFeature('question');
      const simulationProvider = router.forFeature('simulation');

      expect(exerciseProvider).not.toBe(simulationProvider);
      expect(exerciseProvider).toBeInstanceOf(OpenaiProvider);
      expect(simulationProvider).toBeInstanceOf(OpenaiProvider);
    });
  });

  describe('startup validation', () => {
    it('throws when provider=openai but BASE_URL is missing', () => {
      const router = makeRouter({
        question: {
          provider: 'openai',
          baseUrl: '',
          apiKeys: ['sk-key1'],
          model: 'some-model',
          fallbackModel: '',
        },
      });

      expect(() => router.onModuleInit()).toThrow(
        /AI_QUESTION_PROVIDER=openai requires/,
      );
    });

    it('throws when provider=openai but API_KEYS is empty', () => {
      const router = makeRouter({
        question: {
          provider: 'openai',
          baseUrl: 'https://openrouter.ai/api/v1',
          apiKeys: [],
          model: 'some-model',
          fallbackModel: '',
        },
      });

      expect(() => router.onModuleInit()).toThrow(
        /AI_QUESTION_PROVIDER=openai requires/,
      );
    });

    it('throws for simulation feature with missing config', () => {
      const router = makeRouter({
        simulation: {
          provider: 'openai',
          baseUrl: '',
          apiKeys: [],
          model: '',
          fallbackModel: '',
        },
      });

      expect(() => router.onModuleInit()).toThrow(
        /AI_SIMULATION_PROVIDER=openai requires/,
      );
    });

    it('does not throw when all features use default genai provider', () => {
      const router = makeRouter();
      expect(() => router.onModuleInit()).not.toThrow();
    });
  });

  describe('renderPrompt delegation', () => {
    it('delegates renderPrompt to GenaiProvider', () => {
      const router = makeRouter();
      const genai = (router as any).genaiProvider as jest.Mocked<GenaiProvider>;
      (genai.renderPrompt as jest.Mock).mockReturnValue('rendered');

      const result = router.renderPrompt('some-template', { key: 'value' });

      expect(genai.renderPrompt).toHaveBeenCalledWith('some-template', {
        key: 'value',
      });
      expect(result).toBe('rendered');
    });
  });
});
