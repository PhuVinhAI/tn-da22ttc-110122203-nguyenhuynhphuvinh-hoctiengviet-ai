import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthToken } from '../domain/auth-token.entity';
import { TOKEN_REPOSITORY } from './interfaces';
import { TypeOrmTokenRepository } from './typeorm.repository';
import { TokenLifecycle } from './token-lifecycle.service';

@Module({
  imports: [TypeOrmModule.forFeature([AuthToken])],
  providers: [
    { provide: TOKEN_REPOSITORY, useClass: TypeOrmTokenRepository },
    TokenLifecycle,
  ],
  exports: [TokenLifecycle],
})
export class TokenLifecycleModule {}
