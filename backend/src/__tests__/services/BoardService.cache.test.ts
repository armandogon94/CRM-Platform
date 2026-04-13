/**
 * Tests for BoardService cache-aside pattern with RedisService.
 */

// Must mock ioredis BEFORE any imports
const mockCacheStore: Map<string, string> = new Map();

const mockRedisInstance = {
  get: jest.fn((key: string) => Promise.resolve(mockCacheStore.get(key) || null)),
  set: jest.fn((key: string, value: string) => {
    mockCacheStore.set(key, value);
    return Promise.resolve('OK');
  }),
  del: jest.fn((key: string) => {
    mockCacheStore.delete(key);
    return Promise.resolve(1);
  }),
  keys: jest.fn(() => Promise.resolve([])),
  pipeline: jest.fn(() => ({
    del: jest.fn().mockReturnThis(),
    exec: jest.fn(() => Promise.resolve([])),
  })),
  on: jest.fn(),
  quit: jest.fn(),
};

jest.mock('ioredis', () => ({
  __esModule: true,
  default: jest.fn().mockImplementation(() => mockRedisInstance),
}));

jest.mock('../../config', () => ({
  default: { redisUrl: 'redis://localhost:6379' },
  __esModule: true,
}));

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

jest.mock('../../config/database', () => {
  const { Sequelize } = jest.requireActual('sequelize');
  const seq = new Sequelize('sqlite::memory:', { logging: false });
  return { default: seq, sequelize: seq, __esModule: true };
});

jest.mock('../../models', () => {
  const mockBoard: any = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn(),
  };
  mockBoard.init = jest.fn();
  mockBoard.hasMany = jest.fn();
  mockBoard.belongsTo = jest.fn();

  return {
    sequelize: { transaction: jest.fn() },
    Board: mockBoard,
    BoardGroup: { init: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn(), create: jest.fn() },
    Column: { init: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn() },
    BoardView: { init: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn(), create: jest.fn() },
    Item: { init: jest.fn(), findAll: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn() },
    ColumnValue: { init: jest.fn(), hasMany: jest.fn(), belongsTo: jest.fn() },
    ActivityLog: { create: jest.fn(), init: jest.fn() },
  };
});

import BoardService from '../../services/BoardService';
import { RedisService } from '../../services/RedisService';
import { Board } from '../../models';

describe('BoardService cache-aside', () => {
  let cache: RedisService;

  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheStore.clear();
    cache = new RedisService();
  });

  it('returns cached board on cache hit (no DB query)', async () => {
    const cachedBoard = { id: 1, name: 'Cached Board', workspaceId: 1 };
    await cache.set('board:1:ws:1', cachedBoard, 300);

    // DB should NOT be called since cache hit
    const result = await BoardService.getByIdCached(1, 1, cache);
    expect(result).toEqual(cachedBoard);
    expect(Board.findOne).not.toHaveBeenCalled();
  });

  it('queries DB on cache miss and caches the result', async () => {
    const dbBoard = { id: 2, name: 'DB Board', workspaceId: 1, toJSON: () => ({ id: 2, name: 'DB Board', workspaceId: 1 }) };
    (Board.findOne as jest.Mock).mockResolvedValue(dbBoard);

    const result = await BoardService.getByIdCached(2, 1, cache);
    expect(Board.findOne).toHaveBeenCalled();
    expect(result).toEqual({ id: 2, name: 'DB Board', workspaceId: 1 });

    // Verify it was cached
    const cached = await cache.get('board:2:ws:1');
    expect(cached).toEqual({ id: 2, name: 'DB Board', workspaceId: 1 });
  });

  it('returns null on cache miss when board does not exist in DB', async () => {
    (Board.findOne as jest.Mock).mockResolvedValue(null);

    const result = await BoardService.getByIdCached(999, 1, cache);
    expect(result).toBeNull();
  });
});
