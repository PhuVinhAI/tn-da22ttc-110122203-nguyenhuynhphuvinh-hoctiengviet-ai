import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull } from 'typeorm';
import { ITokenRepository } from './interfaces';
import { AuthToken, AuthTokenPurpose } from '../domain/auth-token.entity';

@Injectable()
export class TypeOrmTokenRepository implements ITokenRepository {
  constructor(
    @InjectRepository(AuthToken)
    private readonly repo: Repository<AuthToken>,
  ) {}

  async save(
    token: string,
    userId: string,
    expiresAt: Date,
    code: string,
  ): Promise<void> {
    const entity = this.repo.create({
      token,
      userId,
      expiresAt,
      code,
      purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
    });
    await this.repo.save(entity);
  }

  async findUnverifiedByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null> {
    const entity = await this.repo.findOne({
      where: {
        token,
        purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
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
      where: {
        code,
        userId,
        purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
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
      entity.usedAt = new Date();
      await this.repo.save(entity);
    }
  }

  async markVerifiedByCodeAndUser(code: string, userId: string): Promise<void> {
    const entity = await this.repo.findOne({
      where: {
        code,
        userId,
        purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
        usedAt: IsNull(),
      },
    });
    if (entity) {
      entity.usedAt = new Date();
      await this.repo.save(entity);
    }
  }

  async deleteUnverifiedByUserId(userId: string): Promise<void> {
    await this.repo.delete({
      userId,
      purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
      usedAt: IsNull(),
    });
  }

  async deleteExpired(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
      purpose: AuthTokenPurpose.EMAIL_VERIFICATION,
    });
    return result.affected ?? 0;
  }

  async savePasswordReset(
    token: string,
    userId: string,
    expiresAt: Date,
    code?: string,
  ): Promise<void> {
    const entity = this.repo.create({
      token,
      userId,
      expiresAt,
      code,
      purpose: AuthTokenPurpose.PASSWORD_RESET,
    });
    await this.repo.save(entity);
  }

  async deleteUnusedPasswordResetByUserId(userId: string): Promise<void> {
    await this.repo.delete({
      userId,
      purpose: AuthTokenPurpose.PASSWORD_RESET,
      usedAt: IsNull(),
    });
  }

  async findUnusedPasswordResetByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
  } | null> {
    const entity = await this.repo.findOne({
      where: {
        token,
        purpose: AuthTokenPurpose.PASSWORD_RESET,
        usedAt: IsNull(),
      },
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
    const entity = await this.repo.findOne({
      where: { token, purpose: AuthTokenPurpose.PASSWORD_RESET },
    });
    if (entity) {
      entity.usedAt = new Date();
      await this.repo.save(entity);
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
    const entity = await this.repo.findOne({
      where: {
        code,
        purpose: AuthTokenPurpose.PASSWORD_RESET,
        usedAt: IsNull(),
      },
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
    const entity = await this.repo.findOne({
      where: {
        code,
        purpose: AuthTokenPurpose.PASSWORD_RESET,
        usedAt: IsNull(),
      },
      relations: ['user'],
    });
    if (entity && entity.user.email === email) {
      entity.usedAt = new Date();
      await this.repo.save(entity);
    }
  }

  async deleteExpiredPasswordResetTokens(): Promise<number> {
    const result = await this.repo.delete({
      expiresAt: LessThan(new Date()),
      purpose: AuthTokenPurpose.PASSWORD_RESET,
    });
    return result.affected ?? 0;
  }
}
