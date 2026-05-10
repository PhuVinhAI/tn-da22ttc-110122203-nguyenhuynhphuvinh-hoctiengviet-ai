import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenAI } from '@google/genai';

export interface KeyStats {
  totalCalls: number;
  totalTokens: number;
  totalErrors: number;
  cooldownUntil: number;
}

interface KeyEntry {
  key: string;
  client: GoogleGenAI;
  stats: KeyStats;
}

const BASE_COOLDOWN_MS = 30_000;
const MAX_COOLDOWN_MS = 120_000;

@Injectable()
export class KeyPool implements OnModuleInit {
  private readonly logger = new Logger(KeyPool.name);
  private entries: KeyEntry[] = [];
  private singleKeyClient: GoogleGenAI | null = null;
  private singleApiKey: string | null = null;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit() {
    const genaiConfig = this.configService.get<{
      apiKey: string;
      apiKeys: string[];
    }>('genai')!;

    const keys =
      genaiConfig.apiKeys.length > 0
        ? genaiConfig.apiKeys
        : genaiConfig.apiKey
          ? [genaiConfig.apiKey]
          : [];

    this.entries = keys.map((key) => ({
      key,
      client: new GoogleGenAI({ apiKey: key }),
      stats: {
        totalCalls: 0,
        totalTokens: 0,
        totalErrors: 0,
        cooldownUntil: 0,
      },
    }));

    if (this.entries.length === 0 && genaiConfig.apiKey) {
      this.singleKeyClient = new GoogleGenAI({ apiKey: genaiConfig.apiKey });
      this.singleApiKey = genaiConfig.apiKey;
    }

    this.logger.log(`KeyPool initialized with ${this.entries.length} key(s)`);
  }

  getKey(): { key: string; client: GoogleGenAI } {
    const now = Date.now();
    const available = this.entries.filter((e) => e.stats.cooldownUntil <= now);

    if (available.length === 0) {
      if (this.singleKeyClient) {
        return { key: this.singleApiKey!, client: this.singleKeyClient };
      }
      if (this.entries.length > 0) {
        this.logger.warn(
          'All keys in cooldown, returning least-recently-cooled',
        );
        const oldest = this.entries.reduce((a, b) =>
          a.stats.cooldownUntil < b.stats.cooldownUntil ? a : b,
        );
        return { key: oldest.key, client: oldest.client };
      }
      throw new Error('No API keys configured');
    }

    const best = available.reduce((a, b) =>
      a.stats.totalTokens <= b.stats.totalTokens ? a : b,
    );
    return { key: best.key, client: best.client };
  }

  markCooldown(key: string, error?: { statusCode?: number }) {
    const entry = this.entries.find((e) => e.key === key);
    if (!entry) return;

    if (error?.statusCode === 429) {
      const prevCooldown = entry.stats.cooldownUntil;
      const consecutive = prevCooldown > Date.now() ? 1 : 0;
      const duration = Math.min(
        BASE_COOLDOWN_MS * Math.pow(2, consecutive),
        MAX_COOLDOWN_MS,
      );
      entry.stats.cooldownUntil = Date.now() + duration;
      entry.stats.totalErrors++;
      this.logger.warn(
        `Key ${key.slice(0, 8)}... marked cooldown for ${duration}ms`,
      );
    }
  }

  updateStats(key: string, tokens: number) {
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
