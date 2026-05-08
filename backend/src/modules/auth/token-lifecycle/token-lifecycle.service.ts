import { Injectable, Inject } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { ITokenRepository } from './interfaces';
import {
  TOKEN_REPOSITORY,
  VerificationTokenResult,
  VerifiedEmailResult,
  PasswordResetTokenResult,
  VerifiedPasswordResetResult,
  CleanupResult,
} from './interfaces';

@Injectable()
export class TokenLifecycle {
  constructor(
    @Inject(TOKEN_REPOSITORY)
    private readonly repo: ITokenRepository,
  ) {}

  async createVerificationToken(
    userId: string,
  ): Promise<VerificationTokenResult> {
    await this.repo.deleteUnverifiedByUserId(userId);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);

    await this.repo.save(token, userId, expiresAt);

    return { token, expiresAt };
  }

  async verifyEmailToken(token: string): Promise<VerifiedEmailResult | null> {
    const entry = await this.repo.findUnverifiedByToken(token);
    if (!entry) return null;
    if (entry.expiresAt < new Date()) return null;

    await this.repo.markVerified(token);

    return {
      userId: entry.userId,
      email: entry.email,
      fullName: entry.fullName,
    };
  }

  async createPasswordResetToken(
    userId: string,
  ): Promise<PasswordResetTokenResult> {
    await this.repo.deleteUnusedPasswordResetByUserId(userId);

    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    await this.repo.savePasswordReset(token, userId, expiresAt);

    return { token, expiresAt };
  }

  async verifyPasswordResetToken(
    token: string,
  ): Promise<VerifiedPasswordResetResult | null> {
    const entry = await this.repo.findUnusedPasswordResetByToken(token);
    if (!entry) return null;
    if (entry.expiresAt < new Date()) return null;

    await this.repo.markPasswordResetUsed(token);

    return {
      userId: entry.userId,
      email: entry.email,
    };
  }

  async cleanupExpired(): Promise<CleanupResult> {
    const verificationTokensRemoved = await this.repo.deleteExpired();
    const passwordResetTokensRemoved =
      await this.repo.deleteExpiredPasswordResetTokens();

    return {
      verificationTokensRemoved,
      passwordResetTokensRemoved,
      refreshTokensRemoved: 0,
    };
  }
}
