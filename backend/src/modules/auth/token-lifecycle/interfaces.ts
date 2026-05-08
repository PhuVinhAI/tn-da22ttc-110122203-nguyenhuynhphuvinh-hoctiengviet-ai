export interface VerificationTokenResult {
  token: string;
  expiresAt: Date;
}

export interface VerifiedEmailResult {
  userId: string;
  email: string;
  fullName: string;
}

export interface PasswordResetTokenResult {
  token: string;
  expiresAt: Date;
}

export interface VerifiedPasswordResetResult {
  userId: string;
  email: string;
}

export interface CleanupResult {
  verificationTokensRemoved: number;
  passwordResetTokensRemoved: number;
  refreshTokensRemoved: number;
}

export interface ITokenRepository {
  save(token: string, userId: string, expiresAt: Date): Promise<void>;
  findUnverifiedByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
    fullName: string;
  } | null>;
  markVerified(token: string): Promise<void>;
  deleteUnverifiedByUserId(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;

  savePasswordReset(
    token: string,
    userId: string,
    expiresAt: Date,
  ): Promise<void>;
  deleteUnusedPasswordResetByUserId(userId: string): Promise<void>;
  findUnusedPasswordResetByToken(token: string): Promise<{
    userId: string;
    expiresAt: Date;
    email: string;
  } | null>;
  markPasswordResetUsed(token: string): Promise<void>;
  deleteExpiredPasswordResetTokens(): Promise<number>;
}

export const TOKEN_REPOSITORY = Symbol('TOKEN_REPOSITORY');
