/**
 * Unit tests for RedisService — caching layer.
 */

const mockStore: Map<string, string> = new Map();

const MockRedisInstance = {
  get: jest.fn((key: string) => Promise.resolve(mockStore.get(key) || null)),
  set: jest.fn((key: string, value: string, _ex: string, _ttl: number) => {
    mockStore.set(key, value);
    return Promise.resolve('OK');
  }),
  del: jest.fn((key: string) => {
    mockStore.delete(key);
    return Promise.resolve(1);
  }),
  keys: jest.fn((pattern: string) => {
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    const matching = Array.from(mockStore.keys()).filter((k) => regex.test(k));
    return Promise.resolve(matching);
  }),
  pipeline: jest.fn(() => ({
    del: jest.fn().mockReturnThis(),
    exec: jest.fn(() => Promise.resolve([])),
  })),
  status: 'ready',
  on: jest.fn(),
  disconnect: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => MockRedisInstance),
  };
});

jest.mock('../../config', () => ({
  default: {
    redisUrl: 'redis://localhost:6379',
  },
  __esModule: true,
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

import { RedisService } from '../../services/RedisService';

describe('RedisService', () => {
  let service: RedisService;

  beforeEach(() => {
    service = new RedisService();
  });

  describe('get/set', () => {
    it('returns null for missing key', async () => {
      const result = await service.get<string>('nonexistent');
      expect(result).toBeNull();
    });

    it('stores and retrieves a value', async () => {
      await service.set('board:1', { id: 1, name: 'Test Board' }, 300);
      const result = await service.get<{ id: number; name: string }>('board:1');
      expect(result).toEqual({ id: 1, name: 'Test Board' });
    });

    it('stores with TTL', async () => {
      await service.set('key', 'value', 60);
      // Verify set was called with EX and TTL
      const client = (service as any).client;
      expect(client.set).toHaveBeenCalledWith('crm:key', JSON.stringify('value'), 'EX', 60);
    });
  });

  describe('del', () => {
    it('removes a key', async () => {
      await service.set('temp', 'data', 60);
      await service.del('temp');
      const result = await service.get('temp');
      expect(result).toBeNull();
    });
  });

  describe('invalidatePattern', () => {
    it('deletes keys matching a pattern', async () => {
      await service.set('board:1', 'data1', 300);
      await service.set('board:2', 'data2', 300);

      await service.invalidatePattern('board:*');

      const client = (service as any).client;
      expect(client.keys).toHaveBeenCalledWith('crm:board:*');
    });
  });
});
