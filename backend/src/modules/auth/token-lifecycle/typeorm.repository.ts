import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { ITokenRepository } from './interfaces';
import { EmailVerificationToken } from '../domain/email-verification-token.entity';
import { PasswordResetToken } from '../domain/password-reset-token.entity';

@Injectable()
export class TypeOrmTokenRepository implements ITokenRepository {
  constructor(
    @InjectRepository(EmailVerificationToken)
    private readonly repo: Repository<EmailVerificationToken>,
    @InjectRepository(PasswordResetToken)
    private readonly passwordResetRepo: Repository<PasswordResetToken>,
  ) {}

  async save(
    token: string,
    userId: string,
    expiresAt: Date,
    code: string,
  ): Promise<void> {
    const entity = this.repo.create({ token, userId, expiresAt, code });
    await this.repo.save(entity);
  }

  async findUnverifiedByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null> {
    const entity = await this.repo.findOne({
      where: { token, verifiedAt: null as any },
      relations: ['user'],
    });
    if (!entity) return null;
    return {
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      email: entity.user.email,
      fullName: entity.user.fullName,
    };
  }

  async findUnverifiedByCodeAndUser(
    code: string,
    userId: string,
  ): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null> {
    const entity = await this.repo.findOne({
      where: { code, userId, verifiedAt: null as any },
      relations: ['user'],
    });
    if (!entity) return null;
    return {
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      email: entity.user.email,
      fullName: entity.user.fullName,
    };
  }

  async markVerified(token: string): Promise<void> {
    const entity = await this.repo.findOne({ where: { token } });
    if (entity) {
      entity.verifiedAt = new Date();
      await this.repo.save(entity);
    }
  }

  async markVerifiedByCodeAndUser(code: string, userId: string): Promise<void> {
    const entity = await this.repo.findOne({
      where: { code, userId, verifiedAt: null as any },
    });
    if (entity) {
      entity.verifiedAt = new Date();
      await this.repo.save(entity);
    }
  }

  async deleteUnverifiedByUserId(userId: string): Promise<void> {
    await this.repo.delete({ userId, verifiedAt: null as any });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repo.delete({ expiresAt: LessThan(new Date()) });
    return result.affected ?? 0;
  }

  async savePasswordReset(
    token: string,
    userId: string,
    expiresAt: Date,
    code?: string,
  ): Promise<void> {
    const entity = this.passwordResetRepo.create({
      token,
      userId,
      expiresAt,
      code,
    });
    await this.passwordResetRepo.save(entity);
  }

  async deleteUnusedPasswordResetByUserId(userId: string): Promise<void> {
    await this.passwordResetRepo.delete({ userId, usedAt: IsNull() });
  }

  async findUnusedPasswordResetByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
  } | null> {
    const entity = await this.passwordResetRepo.findOne({
      where: { token, usedAt: IsNull() },
      relations: ['user'],
    });
    if (!entity) return null;
    return {
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      email: entity.user.email,
    };
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    const entity = await this.passwordResetRepo.findOne({ where: { token } });
    if (entity) {
      entity.usedAt = new Date();
      await this.passwordResetRepo.save(entity);
    }
  }

  async findUnusedPasswordResetByCodeAndEmail(
    code: string,
    email: string,
  ): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    token: string;
  } | null> {
    const entity = await this.passwordResetRepo.findOne({
      where: { code, usedAt: IsNull() },
      relations: ['user'],
    });
    if (!entity || entity.user.email !== email) return null;
    return {
      userId: entity.userId,
      expiresAt: entity.expiresAt,
      email: entity.user.email,
      token: entity.token,
    };
  }

  async markPasswordResetUsedByCodeAndEmail(
    code: string,
    email: string,
  ): Promise<void> {
    const entity = await this.passwordResetRepo.findOne({
      where: { code, usedAt: IsNull() },
      relations: ['user'],
    });
    if (entity && entity.user.email === email) {
      entity.usedAt = new Date();
      await this.passwordResetRepo.save(entity);
    }
  }

  async deleteExpiredPasswordResetTokens(): Promise<number> {
    const result = await this.passwordResetRepo.delete({
      expiresAt: LessThan(new Date()),
    });
    return result.affected ?? 0;
  }
}
