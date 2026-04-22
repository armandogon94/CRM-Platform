import Redis from 'ioredis';
import config from '../config';
import { logger } from '../utils/logger';

const KEY_PREFIX = 'crm:';

export class RedisService {
  private client: Redis;

  constructor(url?: string) {
    this.client = new Redis(url || config.redisUrl || 'redis://localhost:6379');

    this.client.on('error', (err: Error) => {
      logger.error('Redis connection error:', err.message);
    });
  }

  private prefixed(key: string): string {
    return `${KEY_PREFIX}${key}`;
  }

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(this.prefixed(key));
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds: number): Promise<void> {
    await this.client.set(
      this.prefixed(key),
      JSON.stringify(value),
      'EX',
      ttlSeconds
    );
  }

  async del(key: string): Promise<void> {
    await this.client.del(this.prefixed(key));
  }

  async invalidatePattern(pattern: string): Promise<void> {
    const keys = await this.client.keys(this.prefixed(pattern));
    if (keys.length === 0) return;

    const pipeline = this.client.pipeline();
    for (const key of keys) {
      pipeline.del(key);
    }
    await pipeline.exec();
  }

  /**
   * Lightweight liveness probe used by the /health endpoint.
   * Resolves with 'PONG' when the connection is healthy, rejects otherwise.
   */
  async ping(): Promise<string> {
    return this.client.ping();
  }

  getClient(): Redis {
    return this.client;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

// Singleton for app-wide use
export const redisService = new RedisService();
export default redisService;
