import { KeyPool } from './key-pool';
import { AiRateLimitException } from '../genai/ai.exceptions';

const fakeIsRateLimit = (err: any) => err?.statusCode === 429;
const fakeCooldownMs = (_err: any) => 30_000;

function makePool(keys: string[]) {
  return new KeyPool({
    keys,
    isRateLimitError: fakeIsRateLimit,
    getCooldownMs: fakeCooldownMs,
  });
}

describe('KeyPool', () => {
  describe('rotation through multiple keys', () => {
    it('returns the only key when pool has one entry', () => {
      const pool = makePool(['key-a']);
      expect(pool.getKey().key).toBe('key-a');
    });

    it('returns key with lowest totalTokens', () => {
      const pool = makePool(['key-a', 'key-b', 'key-c']);
      pool.updateStats('key-a', 500);
      pool.updateStats('key-b', 100);
      pool.updateStats('key-c', 300);
      expect(pool.getKey().key).toBe('key-b');
    });

    it('rotates to next key when one is in cooldown', () => {
      const pool = makePool(['key-a', 'key-b']);
      pool.markCooldown('key-a', { statusCode: 429 });
      expect(pool.getKey().key).toBe('key-b');
    });
  });

  describe('cooldown when isRateLimitError returns true', () => {
    it('marks key in cooldown when error is rate limit', () => {
      const pool = makePool(['key-a']);
      pool.markCooldown('key-a', { statusCode: 429 });
      expect(pool.keyStats['key-a'].cooldownUntil).toBeGreaterThan(Date.now());
    });

    it('does not mark cooldown when error is not rate limit', () => {
      const pool = makePool(['key-a']);
      pool.markCooldown('key-a', { statusCode: 500 });
      expect(pool.keyStats['key-a'].cooldownUntil).toBe(0);
    });

    it('skips cooled-down key in subsequent getKey calls', () => {
      const pool = makePool(['key-a', 'key-b']);
      pool.markCooldown('key-a', { statusCode: 429 });
      const { key } = pool.getKey();
      expect(key).toBe('key-b');
    });

    it('applies getCooldownMs duration from callback', () => {
      const customCooldown = (err: any) =>
        err?.statusCode === 429 ? 5_000 : 0;
      const pool = new KeyPool({
        keys: ['key-a'],
        isRateLimitError: fakeIsRateLimit,
        getCooldownMs: customCooldown,
      });
      const before = Date.now();
      pool.markCooldown('key-a', { statusCode: 429 });
      const diff = pool.keyStats['key-a'].cooldownUntil - before;
      expect(diff).toBeGreaterThanOrEqual(4_000);
      expect(diff).toBeLessThanOrEqual(6_000);
    });
  });

  describe('all keys rate-limited → throw AiRateLimitException', () => {
    it('throws AiRateLimitException when all keys are in cooldown', () => {
      const pool = makePool(['key-a', 'key-b']);
      pool.markCooldown('key-a', { statusCode: 429 });
      pool.markCooldown('key-b', { statusCode: 429 });
      expect(() => pool.getKey()).toThrow(AiRateLimitException);
    });

    it('throws when pool is empty', () => {
      const pool = makePool([]);
      expect(() => pool.getKey()).toThrow(AiRateLimitException);
    });
  });

  describe('recover after cooldown expires', () => {
    it('returns key again after cooldown window passes', () => {
      const pool = makePool(['key-a']);
      pool.markCooldown('key-a', { statusCode: 429 });
      expect(pool.isExhausted()).toBe(true);

      // Simulate cooldown expiry
      (pool as any).entries[0].stats.cooldownUntil = Date.now() - 1;

      expect(pool.isExhausted()).toBe(false);
      expect(pool.getKey().key).toBe('key-a');
    });
  });

  describe('stats tracking', () => {
    it('increments totalCalls and totalTokens on updateStats', () => {
      const pool = makePool(['key-a']);
      pool.updateStats('key-a', 100);
      pool.updateStats('key-a', 200);
      expect(pool.keyStats['key-a'].totalCalls).toBe(2);
      expect(pool.keyStats['key-a'].totalTokens).toBe(300);
    });

    it('tracks stats independently per key', () => {
      const pool = makePool(['key-a', 'key-b']);
      pool.updateStats('key-a', 100);
      pool.updateStats('key-b', 500);
      expect(pool.keyStats['key-a'].totalTokens).toBe(100);
      expect(pool.keyStats['key-b'].totalTokens).toBe(500);
    });

    it('isExhausted returns false when keys are available', () => {
      const pool = makePool(['key-a']);
      expect(pool.isExhausted()).toBe(false);
    });

    it('isExhausted returns true when all keys are cooled', () => {
      const pool = makePool(['key-a', 'key-b']);
      pool.markCooldown('key-a', { statusCode: 429 });
      pool.markCooldown('key-b', { statusCode: 429 });
      expect(pool.isExhausted()).toBe(true);
    });
  });
});
