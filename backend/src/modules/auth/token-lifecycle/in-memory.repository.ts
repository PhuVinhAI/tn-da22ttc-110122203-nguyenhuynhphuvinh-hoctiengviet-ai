import { ITokenRepository } from './interfaces';

interface TokenRecord {
  token: string;
  userId: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  email: string;
  fullName: string;
}

interface PasswordResetRecord {
  token: string;
  userId: string;
  expiresAt: Date;
  usedAt: Date | null;
  email: string;
}

export class InMemoryTokenRepository implements ITokenRepository {
  private tokens = new Map<string, TokenRecord>();
  private passwordResetTokens = new Map<string, PasswordResetRecord>();
  private users = new Map<string, { email: string; fullName: string }>();

  addUser(userId: string, email: string, fullName: string = 'Test User') {
    this.users.set(userId, { email, fullName });
  }

  async save(token: string, userId: string, expiresAt: Date): Promise<void> {
    const user = this.users.get(userId) || { email: '', fullName: '' };
    this.tokens.set(token, {
      token,
      userId,
      expiresAt,
      verifiedAt: null,
      ...user,
    });
  }

  async findUnverifiedByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null> {
    const entry = this.tokens.get(token);
    if (!entry || entry.verifiedAt !== null) return null;
    return {
      userId: entry.userId,
      expiresAt: entry.expiresAt,
      email: entry.email,
      fullName: entry.fullName,
    };
  }

  async markVerified(token: string): Promise<void> {
    const entry = this.tokens.get(token);
    if (entry) entry.verifiedAt = new Date();
  }

  async deleteUnverifiedByUserId(userId: string): Promise<void> {
    for (const [key, entry] of this.tokens.entries()) {
      if (entry.userId === userId && entry.verifiedAt === null) {
        this.tokens.delete(key);
      }
    }
  }

  async deleteExpired(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [key, entry] of this.tokens.entries()) {
      if (entry.expiresAt < now) {
        this.tokens.delete(key);
        count++;
      }
    }
    return count;
  }

  async savePasswordReset(
    token: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void> {
    const user = this.users.get(userId) || { email: '' };
    this.passwordResetTokens.set(token, {
      token,
      userId,
      expiresAt,
      usedAt: null,
      email: user.email,
    });
  }

  async deleteUnusedPasswordResetByUserId(userId: string): Promise<void> {
    for (const [key, entry] of this.passwordResetTokens.entries()) {
      if (entry.userId === userId && entry.usedAt === null) {
        this.passwordResetTokens.delete(key);
      }
    }
  }

  async findUnusedPasswordResetByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
  } | null> {
    const entry = this.passwordResetTokens.get(token);
    if (!entry || entry.usedAt !== null) return null;
    return {
      userId: entry.userId,
      expiresAt: entry.expiresAt,
      email: entry.email,
    };
  }

  async markPasswordResetUsed(token: string): Promise<void> {
    const entry = this.passwordResetTokens.get(token);
    if (entry) entry.usedAt = new Date();
  }

  async deleteExpiredPasswordResetTokens(): Promise<number> {
    const now = new Date();
    let count = 0;
    for (const [key, entry] of this.passwordResetTokens.entries()) {
      if (entry.expiresAt < now) {
        this.passwordResetTokens.delete(key);
        count++;
      }
    }
    return count;
  }

  setPasswordResetExpiry(token: string, expiresAt: Date): void {
    const entry = this.passwordResetTokens.get(token);
    if (entry) entry.expiresAt = expiresAt;
  }

  setPasswordResetUsed(token: string, usedAt: Date): void {
    const entry = this.passwordResetTokens.get(token);
    if (entry) entry.usedAt = usedAt;
  }

  setTokenExpiry(token: string, expiresAt: Date): void {
    const entry = this.tokens.get(token);
    if (entry) entry.expiresAt = expiresAt;
  }
}
