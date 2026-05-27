import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GenaiProvider } from '../genai/genai-provider';
import { OpenaiProvider } from '../openai/openai.provider';
import type { IAiProvider } from '@linvnix/shared';

export type FeatureName = 'exercise' | 'simulation' | 'assistant';

interface FeatureConfig {
  provider: string;
  baseUrl: string;
  apiKeys: string[];
  model: string;
  fallbackModel: string;
  generation: {
    temperature?: number;
    topP?: number;
    topK?: number;
    maxTokens?: number;
    reasoningEffort?: string;
  };
}

@Injectable()
export class AiProviderRouter implements OnModuleInit {
  private readonly logger = new Logger(AiProviderRouter.name);
  private readonly cache = new Map<FeatureName, IAiProvider>();

  constructor(
    private readonly genaiProvider: GenaiProvider,
    private readonly configService: ConfigService,
  ) {}

  onModuleInit(): void {
    const features: FeatureName[] = ['exercise', 'simulation', 'assistant'];
    for (const feature of features) {
      const config = this.getFeatureConfig(feature);
      if (config.provider === 'openai') {
        if (!config.baseUrl || config.apiKeys.length === 0) {
          throw new Error(
            `AI_${feature.toUpperCase()}_PROVIDER=openai requires AI_${feature.toUpperCase()}_BASE_URL and AI_${feature.toUpperCase()}_API_KEYS`,
          );
        }
      }
    }
  }

  forFeature(name: FeatureName): IAiProvider {
    const cached = this.cache.get(name);
    if (cached) return cached;

    const config = this.getFeatureConfig(name);
    const provider = this.buildProvider(name, config);
    this.cache.set(name, provider);
    return provider;
  }

  renderPrompt(
    templateName: string,
    variables: Record<string, any> = {},
  ): string {
    return this.genaiProvider.renderPrompt(templateName, variables);
  }

  private buildProvider(name: FeatureName, config: FeatureConfig): IAiProvider {
    if (config.provider === 'openai') {
      this.logger.log(
        `Feature '${name}' → OpenaiProvider (${config.baseUrl}, model=${config.model})`,
      );
      return new OpenaiProvider({
        baseUrl: config.baseUrl,
        apiKeys: config.apiKeys,
        model: config.model,
        fallbackModel: config.fallbackModel || undefined,
        generation: {
          temperature: config.generation.temperature,
          top_p: config.generation.topP,
          top_k: config.generation.topK,
          max_tokens: config.generation.maxTokens,
          reasoning_effort: config.generation.reasoningEffort,
        },
      });
    }

    if (config.model) {
      this.logger.log(
        `Feature '${name}' → GenaiProvider with model override (${config.model})`,
      );
    }

    return this.genaiProvider;
  }

  private getFeatureConfig(feature: FeatureName): FeatureConfig {
    return this.configService.get<FeatureConfig>(`aiRouter.${feature}`)!;
  }
}
