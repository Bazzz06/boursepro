type CacheEntry<T> = {
  value: T;
  expiresAt: number;
};

const cache = new Map<string, CacheEntry<any>>();

export async function getCache<T>(
  key: string,
  ttlSeconds: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const now = Date.now();
  const entry = cache.get(key);

  if (entry && entry.expiresAt > now) {
    return entry.value as T;
  }

  const value = await fetcher();
  cache.set(key, {
    value,
    expiresAt: now + ttlSeconds * 1000,
  });

  return value;
}

export const getCached = getCache;
