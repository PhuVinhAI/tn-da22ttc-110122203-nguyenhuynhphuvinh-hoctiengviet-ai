import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmailVerificationToken } from '../domain/email-verification-token.entity';
import { PasswordResetToken } from '../domain/password-reset-token.entity';
import { TOKEN_REPOSITORY } from './interfaces';
import { TypeOrmTokenRepository } from './typeorm.repository';
import { TokenLifecycle } from './token-lifecycle.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmailVerificationToken, PasswordResetToken]),
  ],
  providers: [
    { provide: TOKEN_REPOSITORY, useClass: TypeOrmTokenRepository },
    TokenLifecycle,
  ],
  exports: [TokenLifecycle],
})
export class TokenLifecycleModule {}
