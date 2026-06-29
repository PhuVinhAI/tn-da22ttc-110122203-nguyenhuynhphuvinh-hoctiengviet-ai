import { SetMetadata } from '@nestjs/common';

export const CACHE_KEY_METADATA = 'cache:key';
export const CACHE_TTL_METADATA = 'cache:ttl';

/**
 * Decorator to cache method results
 * @param key Cache key or function to generate key
 * @param ttl Time to live in seconds (default: 3600)
 */
export const Cacheable = (
  key: string | ((...args: any[]) => string),
  ttl: number = 3600,
) => {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    SetMetadata(CACHE_KEY_METADATA, key)(target, propertyKey, descriptor);
    SetMetadata(CACHE_TTL_METADATA, ttl)(target, propertyKey, descriptor);
  };
};

/**
 * Decorator to invalidate cache
 * @param pattern Pattern to invalidate
 */
export const CacheEvict = (pattern: string) => {
  return SetMetadata('cache:evict', pattern);
};
