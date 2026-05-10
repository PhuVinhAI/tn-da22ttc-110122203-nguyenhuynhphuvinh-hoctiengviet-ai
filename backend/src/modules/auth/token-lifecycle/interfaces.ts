export interface VerificationTokenResult {
  token: string;
  code: string;
  expiresAt: Date;
}

export interface VerifiedEmailResult {
  userId: string;
  email: string;
  fullName: string;
}

export interface PasswordResetTokenResult {
  token: string;
  code: string;
  expiresAt: Date;
}

export interface VerifiedPasswordResetResult {
  userId: string;
  email: string;
}

export interface VerifiedResetCodeResult {
  userId: string;
  email: string;
  resetToken: string;
}

export interface CleanupResult {
  verificationTokensRemoved: number;
  passwordResetTokensRemoved: number;
  refreshTokensRemoved: number;
}

export interface ITokenRepository {
  save(
    token: string,
    userId: string,
    expiresAt: Date,
    code: string,
  ): Promise<void>;
  findUnverifiedByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null>;
  findUnverifiedByCodeAndUser(
    code: string,
    userId: string,
  ): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null>;
  markVerified(token: string): Promise<void>;
  markVerifiedByCodeAndUser(code: string, userId: string): Promise<void>;
  deleteUnverifiedByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;

  savePasswordReset(
    token: string,
    userId: string,
    expiresAt: Date,
    code?: string,
  ): Promise<void>;
  deleteUnusedPasswordResetByUserId(userId: string): Promise<void>;
  findUnusedPasswordResetByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
  } | null>;
  findUnusedPasswordResetByCodeAndEmail(
    code: string,
    email: string,
  ): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    token: string;
  } | null>;
  markPasswordResetUsed(token: string): Promise<void>;
  markPasswordResetUsedByCodeAndEmail(
    code: string,
    email: string,
  ): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<number>;
}

export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');
