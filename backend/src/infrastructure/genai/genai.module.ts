import { Module, Global } from '@nestjs/common';
import { KeyPool } from './key-pool';

@Global()
@Module({
  providers: [KeyPool],
  exports: [KeyPool],
})
export class GenaiModule {}
