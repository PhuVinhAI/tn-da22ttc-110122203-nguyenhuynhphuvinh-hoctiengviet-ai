import { AiRateLimitException } from '../genai/ai.exceptions';

export interface KeyStats {
  totalCalls: number;
  totalTokens: number;
  totalErrors: number;
  cooldownUntil: number;
}

interface KeyEntry {
  key: string;
  stats: KeyStats;
}

export interface KeyPoolOptions {
  keys: string[];
  isRateLimitError: (err: any) => boolean;
  getCooldownMs: (err: any) => number;
}

export class KeyPool {
  private readonly entries: KeyEntry[];
  private readonly isRateLimitError: (err: any) => boolean;
  private readonly getCooldownMs: (err: any) => number;

  constructor(options: KeyPoolOptions) {
    this.entries = options.keys.map((key) => ({
      key,
      stats: {
        totalCalls: 0,
        totalTokens: 0,
        totalErrors: 0,
        cooldownUntil: 0,
      },
    }));
    this.isRateLimitError = options.isRateLimitError;
    this.getCooldownMs = options.getCooldownMs;
  }

  getKey(): { key: string } {
    const now = Date.now();
    const available = this.entries.filter((e) => e.stats.cooldownUntil <= now);

    if (available.length === 0) {
      throw new AiRateLimitException('All API keys are rate-limited');
    }

    const best = available.reduce((a, b) =>
      a.stats.totalTokens <= b.stats.totalTokens ? a : b,
    );
    return { key: best.key };
  }

  markCooldown(key: string, err: any): void {
    const entry = this.entries.find((e) => e.key === key);
    if (!entry) return;

    if (!this.isRateLimitError(err)) return;

    const duration = this.getCooldownMs(err);
    entry.stats.cooldownUntil = Date.now() + duration;
    entry.stats.totalErrors++;
  }

  updateStats(key: string, tokens: number): void {
    const entry = this.entries.find((e) => e.key === key);
    if (!entry) return;
    entry.stats.totalCalls++;
    entry.stats.totalTokens += tokens;
  }

  isExhausted(): boolean {
    if (this.entries.length === 0) return true;
    const now = Date.now();
    return this.entries.every((e) => e.stats.cooldownUntil > now);
  }

  get keyStats(): Record<string, KeyStats> {
    const result: Record<string, KeyStats> = {};
    for (const entry of this.entries) {
      result[entry.key] = { ...entry.stats };
    }
    return result;
  }
}
