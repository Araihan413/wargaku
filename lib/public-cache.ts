/**
 * Simple in-memory client-side cache for public API requests.
 * Default TTL is 3 minutes (180,000 ms).
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const cacheMap = new Map<string, CacheEntry<any>>();

export function getCachedData<T>(key: string, ttlMs = 3 * 60 * 1000): T | null {
  const entry = cacheMap.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > ttlMs) {
    cacheMap.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setCachedData<T>(key: string, data: T): void {
  cacheMap.set(key, { data, timestamp: Date.now() });
}

export function clearPublicCache(): void {
  cacheMap.clear();
}
