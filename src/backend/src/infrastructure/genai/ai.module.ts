import { Module, Global } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { KeyPool } from '../ai/key-pool';
import { GenaiProvider } from './genai-provider';
import { isGenaiRateLimitError, getGenaiCooldownMs } from './genai-errors';
import { AiProviderRouter } from '../ai/ai-provider-router';

@Global()
@Module({
  providers: [
    {
      provide: KeyPool,
      useFactory: (configService: ConfigService) => {
        const genaiConfig = configService.get<{
          apiKey: string;
          apiKeys: string[];
        }>('genai')!;
        const keys =
          genaiConfig.apiKeys.length > 0
            ? genaiConfig.apiKeys
            : genaiConfig.apiKey
              ? [genaiConfig.apiKey]
              : [];
        return new KeyPool({
          keys,
          isRateLimitError: isGenaiRateLimitError,
          getCooldownMs: getGenaiCooldownMs,
        });
      },
      inject: [ConfigService],
    },
    GenaiProvider,
    AiProviderRouter,
  ],
  exports: [KeyPool, GenaiProvider, AiProviderRouter],
})
export class AiModule {}
