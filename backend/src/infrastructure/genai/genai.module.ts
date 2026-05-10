import { Module, Global } from '@nestjs/common';
import { KeyPool } from './key-pool';
import { GenaiService } from './genai.service';

export const AI_PROVIDER = 'AI_PROVIDER';

@Global()
@Module({
  providers: [
    KeyPool,
    GenaiService,
    {
      provide: AI_PROVIDER,
      useExisting: GenaiService,
    },
  ],
  exports: [KeyPool, GenaiService, AI_PROVIDER],
})
export class GenaiModule {}
