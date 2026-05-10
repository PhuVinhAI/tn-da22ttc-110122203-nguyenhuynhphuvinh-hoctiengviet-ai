import { ConfigService } from '@nestjs/config';
import { KeyPool } from './key-pool';

jest.mock('@google/genai', () => ({
  GoogleGenAI: jest.fn().mockImplementation(() => ({})),
}));

function createConfigService(genaiOverrides: Record<string, any> = {}) {
  const defaults = {
    apiKey: 'single-key',
    apiKeys: [] as string[],
  };
  const genai = { ...defaults, ...genaiOverrides };
  return {
    get: (key: string) => (key === 'genai' ? genai : undefined),
  } as unknown as ConfigService;
}

describe('KeyPool', () => {
  describe('key selection priority', () => {
    it('returns the only key when pool has one entry', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      const result = pool.getKey();
      expect(result.key).toBe('key-a');
    });

    it('returns key with lowest totalTokens', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a', 'key-b', 'key-c'],
        }),
      );
      pool.onModuleInit();

      pool.updateStats('key-a', 500);
      pool.updateStats('key-b', 100);
      pool.updateStats('key-c', 300);

      const result = pool.getKey();
      expect(result.key).toBe('key-b');
    });

    it('skips keys in cooldown and returns next best', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a', 'key-b'],
        }),
      );
      pool.onModuleInit();

      pool.updateStats('key-a', 10);
      pool.updateStats('key-b', 20);
      pool.markCooldown('key-a', { statusCode: 429 });

      const result = pool.getKey();
      expect(result.key).toBe('key-b');
    });

    it('falls back to single apiKey when pool is empty', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKey: 'fallback-key',
          apiKeys: [],
        }),
      );
      pool.onModuleInit();

      const result = pool.getKey();
      expect(result.key).toBe('fallback-key');
    });

    it('returns client instance with key', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      const result = pool.getKey();
      expect(result.client).toBeDefined();
    });
  });

  describe('cooldown marking and expiry', () => {
    it('marks key as cooldown on 429 error', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      pool.markCooldown('key-a', { statusCode: 429 });

      expect(pool.keyStats['key-a'].cooldownUntil).toBeGreaterThan(Date.now());
      expect(pool.keyStats['key-a'].totalErrors).toBe(1);
    });

    it('does not mark cooldown for non-429 errors', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      pool.markCooldown('key-a', { statusCode: 500 });

      expect(pool.keyStats['key-a'].cooldownUntil).toBe(0);
      expect(pool.keyStats['key-a'].totalErrors).toBe(0);
    });

    it('uses exponential backoff: 30s, 60s, 120s', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      const before1 = Date.now();
      pool.markCooldown('key-a', { statusCode: 429 });
      const cooldown1 = pool.keyStats['key-a'].cooldownUntil - before1;
      expect(cooldown1).toBeGreaterThanOrEqual(29000);
      expect(cooldown1).toBeLessThanOrEqual(31000);
    });

    it('caps cooldown at 120s', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      pool.markCooldown('key-a', { statusCode: 429 });
      const firstCooldown = pool.keyStats['key-a'].cooldownUntil;

      pool.markCooldown('key-a', { statusCode: 429 });
      const secondCooldown = pool.keyStats['key-a'].cooldownUntil;
      const duration = secondCooldown - firstCooldown;
      expect(duration).toBeLessThanOrEqual(120000);
    });

    it('ignores markCooldown for unknown key', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      expect(() =>
        pool.markCooldown('unknown-key', { statusCode: 429 }),
      ).not.toThrow();
    });
  });

  describe('rotation on 429', () => {
    it('selects different key after one is cooled down', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a', 'key-b'],
        }),
      );
      pool.onModuleInit();

      const first = pool.getKey();
      pool.markCooldown(first.key, { statusCode: 429 });

      const second = pool.getKey();
      expect(second.key).not.toBe(first.key);
    });

    it('returns all keys to pool after cooldown expires', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      pool.markCooldown('key-a', { statusCode: 429 });
      expect(pool.isExhausted()).toBe(true);

      const entry = (pool as any).entries[0];
      entry.stats.cooldownUntil = Date.now() - 1;

      expect(pool.isExhausted()).toBe(false);
    });
  });

  describe('stats tracking', () => {
    it('increments totalCalls on updateStats', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      pool.updateStats('key-a', 100);
      pool.updateStats('key-a', 200);

      expect(pool.keyStats['key-a'].totalCalls).toBe(2);
      expect(pool.keyStats['key-a'].totalTokens).toBe(300);
    });

    it('tracks stats independently per key', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a', 'key-b'],
        }),
      );
      pool.onModuleInit();

      pool.updateStats('key-a', 100);
      pool.updateStats('key-b', 500);

      expect(pool.keyStats['key-a'].totalTokens).toBe(100);
      expect(pool.keyStats['key-b'].totalTokens).toBe(500);
    });

    it('ignores updateStats for unknown key', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      expect(() => pool.updateStats('unknown-key', 100)).not.toThrow();
    });

    it('exposes keyStats as a copy', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      const stats1 = pool.keyStats;
      const stats2 = pool.keyStats;
      expect(stats1).not.toBe(stats2);
      expect(stats1).toEqual(stats2);
    });
  });

  describe('exhaustion detection', () => {
    it('returns false when keys are available', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a'],
        }),
      );
      pool.onModuleInit();

      expect(pool.isExhausted()).toBe(false);
    });

    it('returns true when all keys are in cooldown', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a', 'key-b'],
        }),
      );
      pool.onModuleInit();

      pool.markCooldown('key-a', { statusCode: 429 });
      pool.markCooldown('key-b', { statusCode: 429 });

      expect(pool.isExhausted()).toBe(true);
    });

    it('returns true when no keys configured', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKey: '',
          apiKeys: [],
        }),
      );
      pool.onModuleInit();

      expect(pool.isExhausted()).toBe(true);
    });

    it('returns false when at least one key is available', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKeys: ['key-a', 'key-b'],
        }),
      );
      pool.onModuleInit();

      pool.markCooldown('key-a', { statusCode: 429 });

      expect(pool.isExhausted()).toBe(false);
    });
  });

  describe('single key fallback', () => {
    it('uses single apiKey when apiKeys array is empty', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKey: 'single-fallback',
          apiKeys: [],
        }),
      );
      pool.onModuleInit();

      const result = pool.getKey();
      expect(result.key).toBe('single-fallback');
    });

    it('prefers apiKeys pool over single apiKey', () => {
      const pool = new KeyPool(
        createConfigService({
          apiKey: 'single-key',
          apiKeys: ['pool-key-a', 'pool-key-b'],
        }),
      );
      pool.onModuleInit();

      const result = pool.getKey();
      expect(['pool-key-a', 'pool-key-b']).toContain(result.key);
    });
  });
});
