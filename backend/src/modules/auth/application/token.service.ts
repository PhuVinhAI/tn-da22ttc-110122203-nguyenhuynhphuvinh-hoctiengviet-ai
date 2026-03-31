import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { EmailVerificationToken } from '../domain/email-verification-token.entity';
import { PasswordResetToken } from '../domain/password-reset-token.entity';
import { randomBytes } from 'crypto';

@Injectable()
export class TokenService {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private emailVerificationTokenRepository: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private passwordResetTokenRepository: Repository<PasswordResetToken>,
  ) {}

  async createEmailVerificationToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // 24 hours

    const verificationToken = this.emailVerificationTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    await this.emailVerificationTokenRepository.save(verificationToken);
    return token;
  }

  async verifyEmailToken(token: string): Promise<EmailVerificationToken | null> {
    const verificationToken = await this.emailVerificationTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!verificationToken) {
      return null;
    }

    if (verificationToken.verifiedAt) {
      return null; // Already verified
    }

    if (new Date() > verificationToken.expiresAt) {
      return null; // Expired
    }

    verificationToken.verifiedAt = new Date();
    await this.emailVerificationTokenRepository.save(verificationToken);

    return verificationToken;
  }

  async createPasswordResetToken(userId: string): Promise<string> {
    const token = this.generateToken();
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1); // 1 hour

    const resetToken = this.passwordResetTokenRepository.create({
      token,
      userId,
      expiresAt,
    });

    await this.passwordResetTokenRepository.save(resetToken);
    return token;
  }

  async verifyPasswordResetToken(token: string): Promise<PasswordResetToken | null> {
    const resetToken = await this.passwordResetTokenRepository.findOne({
      where: { token },
      relations: ['user'],
    });

    if (!resetToken) {
      return null;
    }

    if (resetToken.usedAt) {
      return null; // Already used
    }

    if (new Date() > resetToken.expiresAt) {
      return null; // Expired
    }

    return resetToken;
  }

  async markPasswordResetTokenAsUsed(token: string): Promise<void> {
    await this.passwordResetTokenRepository.update(
      { token },
      { usedAt: new Date() },
    );
  }

  async cleanupExpiredTokens(): Promise<void> {
    const now = new Date();

    await this.emailVerificationTokenRepository.delete({
      expiresAt: LessThan(now),
    });

    await this.passwordResetTokenRepository.delete({
      expiresAt: LessThan(now),
    });
  }

  private generateToken(): string {
    return randomBytes(32).toString('hex');
  }
}
