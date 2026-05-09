import {
  Injectable,
  Logger,
  OnModuleInit,
  OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(CacheService.name);
  private redisClient: Redis;
  private fallbackCache: Map<string, { value: any; expiry: number }> =
    new Map();
  private useRedis: boolean = false;

  constructor(private configService: ConfigService) {}

  async onModuleInit() {
    try {
      const redisConfig = this.configService.get('redis');

      this.redisClient = new Redis({
        host: redisConfig.host,
        port: redisConfig.port,
        password: redisConfig.password,
        db: redisConfig.db,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, using in-memory cache');
            this.useRedis = false;
            return null;
          }
          return Math.min(times * 100, 3000);
        },
      });

      this.redisClient.on('connect', () => {
        this.logger.log('✅ Redis connected successfully');
        this.useRedis = true;
      });

      this.redisClient.on('error', (error) => {
        this.logger.error('Redis connection error:', error.message);
        this.useRedis = false;
      });

      // Test connection
      await this.redisClient.ping();
      this.useRedis = true;
    } catch (_error) {
      this.logger.warn('Redis not available, using in-memory cache');
      this.useRedis = false;
    }
  }

  async onModuleDestroy() {
    if (this.redisClient) {
      await this.redisClient.quit();
    }
  }

  /**
   * Set a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache
   * @param ttl Time to live in seconds (default: 3600)
   */
  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.setex(key, ttl, JSON.stringify(value));
        this.logger.debug(`Redis cache set: ${key} (TTL: ${ttl}s)`);
      } else {
        const expiry = Date.now() + ttl * 1000;
        this.fallbackCache.set(key, { value, expiry });
        this.logger.debug(`Memory cache set: ${key} (TTL: ${ttl}s)`);
      }
    } catch (error) {
      this.logger.error(`Cache set error: ${error.message}`);
      // Fallback to memory
      const expiry = Date.now() + ttl * 1000;
      this.fallbackCache.set(key, { value, expiry });
    }
  }

  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      if (this.useRedis && this.redisClient) {
        const cached = await this.redisClient.get(key);

        if (!cached) {
          this.logger.debug(`Redis cache miss: ${key}`);
          return null;
        }

        this.logger.debug(`Redis cache hit: ${key}`);
        return JSON.parse(cached) as T;
      } else {
        const cached = this.fallbackCache.get(key);

        if (!cached) {
          this.logger.debug(`Memory cache miss: ${key}`);
          return null;
        }

        if (Date.now() > cached.expiry) {
          this.fallbackCache.delete(key);
          this.logger.debug(`Memory cache expired: ${key}`);
          return null;
        }

        this.logger.debug(`Memory cache hit: ${key}`);
        return cached.value as T;
      }
    } catch (error) {
      this.logger.error(`Cache get error: ${error.message}`);
      return null;
    }
  }

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  async del(key: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.del(key);
        this.logger.debug(`Redis cache deleted: ${key}`);
      } else {
        this.fallbackCache.delete(key);
        this.logger.debug(`Memory cache deleted: ${key}`);
      }
    } catch (error) {
      this.logger.error(`Cache delete error: ${error.message}`);
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        await this.redisClient.flushdb();
        this.logger.log('Redis cache cleared');
      } else {
        this.fallbackCache.clear();
        this.logger.log('Memory cache cleared');
      }
    } catch (error) {
      this.logger.error(`Cache clear error: ${error.message}`);
    }
  }

  /**
   * Check if key exists in cache
   * @param key Cache key
   */
  async exists(key: string): Promise<boolean> {
    try {
      if (this.useRedis && this.redisClient) {
        const exists = await this.redisClient.exists(key);
        return exists === 1;
      } else {
        const cached = this.fallbackCache.get(key);
        if (!cached) return false;

        if (Date.now() > cached.expiry) {
          this.fallbackCache.delete(key);
          return false;
        }

        return true;
      }
    } catch (error) {
      this.logger.error(`Cache exists error: ${error.message}`);
      return false;
    }
  }

  /**
   * Get or set pattern: Get from cache, if not found, execute function and cache result
   * @param key Cache key
   * @param fn Function to execute if cache miss
   * @param ttl Time to live in seconds
   */
  async getOrSet<T>(
    key: string,
    fn: () => Promise<T>,
    ttl: number = 3600,
  ): Promise<T> {
    const cached = await this.get<T>(key);

    if (cached !== null) {
      return cached;
    }

    const value = await fn();
    await this.set(key, value, ttl);
    return value;
  }

  /**
   * Invalidate cache by pattern
   * @param pattern Pattern to match (e.g., 'user:*')
   */
  async invalidatePattern(pattern: string): Promise<void> {
    try {
      if (this.useRedis && this.redisClient) {
        const keys = await this.redisClient.keys(pattern);
        if (keys.length > 0) {
          await this.redisClient.del(...keys);
          this.logger.log(
            `Redis invalidated ${keys.length} keys matching: ${pattern}`,
          );
        }
      } else {
        const regex = new RegExp(pattern.replace('*', '.*'));
        const keysToDelete: string[] = [];

        for (const key of this.fallbackCache.keys()) {
          if (regex.test(key)) {
            keysToDelete.push(key);
          }
        }

        keysToDelete.forEach((key) => this.fallbackCache.delete(key));
        this.logger.log(
          `Memory invalidated ${keysToDelete.length} keys matching: ${pattern}`,
        );
      }
    } catch (error) {
      this.logger.error(`Cache invalidate pattern error: ${error.message}`);
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<any> {
    try {
      if (this.useRedis && this.redisClient) {
        const info = await this.redisClient.info('stats');
        return {
          type: 'redis',
          connected: this.useRedis,
          info,
        };
      } else {
        return {
          type: 'memory',
          connected: false,
          size: this.fallbackCache.size,
        };
      }
    } catch (error) {
      return {
        type: 'memory',
        connected: false,
        size: this.fallbackCache.size,
        error: error.message,
      };
    }
  }
}
