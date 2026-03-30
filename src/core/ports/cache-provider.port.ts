export interface CacheProviderPort {
  get(key: string): Promise<string | null | undefined>;
  set(key: string, value: string, ttlSeconds?: number): Promise<void>;
  del(key: string): Promise<void>;
  ttl(key: string): Promise<number | null>;
}
