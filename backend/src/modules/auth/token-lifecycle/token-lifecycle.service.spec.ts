import { TokenLifecycle } from './token-lifecycle.service';
import { InMemoryTokenRepository } from './in-memory.repository';
import { TOKEN_REPOSITORY } from './interfaces';
import { Test, TestingModule } from '@nestjs/testing';

describe('TokenLifecycle', () => {
  let service: TokenLifecycle;
  let repo: InMemoryTokenRepository;

  beforeEach(async () => {
    repo = new InMemoryTokenRepository();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokenLifecycle,
        { provide: TOKEN_REPOSITORY, useValue: repo },
      ],
    }).compile();

    service = module.get<TokenLifecycle>(TokenLifecycle);
  });

  describe('createVerificationToken', () => {
    it('returns { token, expiresAt } with 64-char hex token and 24h expiry', async () => {
      const result = await service.createVerificationToken('user-1');

      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.expiresAt).toBeDefined();

      const now = new Date();
      const diffMs = result.expiresAt.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(23.9);
      expect(diffHours).toBeLessThan(24.1);
    });

    it('generates different tokens on each call', async () => {
      const a = await service.createVerificationToken('user-1');
      const b = await service.createVerificationToken('user-1');

      expect(a.token).not.toBe(b.token);
    });

    it('deletes old unverified tokens for the same user before creating', async () => {
      repo.addUser('user-1', 'user@example.com');
      const first = await service.createVerificationToken('user-1');
      const second = await service.createVerificationToken('user-1');

      const firstResult = await repo.findUnverifiedByToken(first.token);
      expect(firstResult).toBeNull();

      const secondResult = await repo.findUnverifiedByToken(second.token);
      expect(secondResult).not.toBeNull();
    });
  });

  describe('verifyEmailToken', () => {
    beforeEach(() => {
      repo.addUser('user-1', 'user@example.com');
    });

    it('returns { userId, email, fullName } for valid unexpired token', async () => {
      const created = await service.createVerificationToken('user-1');
      const result = await service.verifyEmailToken(created.token);

      expect(result).toEqual({
        userId: 'user-1',
        email: 'user@example.com',
        fullName: 'Test User',
      });
    });

    it('returns null for non-existent token', async () => {
      const result = await service.verifyEmailToken('does-not-exist');

      expect(result).toBeNull();
    });

    it('returns null for expired token', async () => {
      const created = await service.createVerificationToken('user-1');

      repo.setTokenExpiry(created.token, new Date(Date.now() - 1000));

      const result = await service.verifyEmailToken(created.token);

      expect(result).toBeNull();
    });

    it('returns null for already-verified token', async () => {
      const created = await service.createVerificationToken('user-1');

      await service.verifyEmailToken(created.token);
      const result = await service.verifyEmailToken(created.token);

      expect(result).toBeNull();
    });

    it('marks token as used after successful verification', async () => {
      const created = await service.createVerificationToken('user-1');

      await service.verifyEmailToken(created.token);

      const entry = await repo.findUnverifiedByToken(created.token);
      expect(entry).toBeNull();
    });
  });

  describe('cleanupExpired', () => {
    it('removes expired tokens', async () => {
      repo.addUser('user-1', 'user@example.com');
      const created = await service.createVerificationToken('user-1');

      repo.setTokenExpiry(created.token, new Date(Date.now() - 1000));

      await service.cleanupExpired();

      const after = await repo.findUnverifiedByToken(created.token);
      expect(after).toBeNull();
    });

    it('returns counts of removed verification and password reset tokens', async () => {
      repo.addUser('user-1', 'user@example.com');

      const vToken = await service.createVerificationToken('user-1');
      repo.setTokenExpiry(vToken.token, new Date(Date.now() - 1000));

      const pToken = await service.createPasswordResetToken('user-1');
      repo.setPasswordResetExpiry(pToken.token, new Date(Date.now() - 1000));

      const result = await service.cleanupExpired();

      expect(result.verificationTokensRemoved).toBe(1);
      expect(result.passwordResetTokensRemoved).toBe(1);
    });
  });

  describe('createPasswordResetToken', () => {
    it('returns { token, expiresAt } with 64-char hex token and 1h expiry', async () => {
      repo.addUser('user-1', 'user@example.com');
      const result = await service.createPasswordResetToken('user-1');

      expect(result.token).toBeDefined();
      expect(result.token).toHaveLength(64);
      expect(result.expiresAt).toBeDefined();

      const now = new Date();
      const diffMs = result.expiresAt.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);
      expect(diffHours).toBeGreaterThan(0.9);
      expect(diffHours).toBeLessThan(1.1);
    });

    it('generates different tokens on each call', async () => {
      repo.addUser('user-1', 'user@example.com');
      const a = await service.createPasswordResetToken('user-1');
      const b = await service.createPasswordResetToken('user-1');

      expect(a.token).not.toBe(b.token);
    });

    it('deletes old unused tokens for the same user before creating', async () => {
      repo.addUser('user-1', 'user@example.com');
      const first = await service.createPasswordResetToken('user-1');
      const second = await service.createPasswordResetToken('user-1');

      const firstResult = await repo.findUnusedPasswordResetByToken(
        first.token,
      );
      expect(firstResult).toBeNull();

      const secondResult = await repo.findUnusedPasswordResetByToken(
        second.token,
      );
      expect(secondResult).not.toBeNull();
    });
  });

  describe('verifyPasswordResetToken', () => {
    beforeEach(() => {
      repo.addUser('user-1', 'user@example.com');
    });

    it('returns { userId, email } for valid unused token', async () => {
      const created = await service.createPasswordResetToken('user-1');
      const result = await service.verifyPasswordResetToken(created.token);

      expect(result).toEqual({
        userId: 'user-1',
        email: 'user@example.com',
      });
    });

    it('returns null for non-existent token', async () => {
      const result = await service.verifyPasswordResetToken('does-not-exist');

      expect(result).toBeNull();
    });

    it('returns null for expired token', async () => {
      const created = await service.createPasswordResetToken('user-1');
      repo.setPasswordResetExpiry(created.token, new Date(Date.now() - 1000));

      const result = await service.verifyPasswordResetToken(created.token);

      expect(result).toBeNull();
    });

    it('returns null for already-used token', async () => {
      const created = await service.createPasswordResetToken('user-1');
      await service.verifyPasswordResetToken(created.token);
      const result = await service.verifyPasswordResetToken(created.token);

      expect(result).toBeNull();
    });

    it('marks token as used after successful verification', async () => {
      const created = await service.createPasswordResetToken('user-1');
      await service.verifyPasswordResetToken(created.token);

      const entry = await repo.findUnusedPasswordResetByToken(created.token);
      expect(entry).toBeNull();
    });
  });
});
