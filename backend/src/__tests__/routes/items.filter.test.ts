/**
 * Tests for item route filter/sort query parameter parsing.
 * Mocks ItemService and verifies the route correctly decodes
 * base64-encoded columnFilters and sortByColumn params.
 */

import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

jest.mock('../../config', () => ({
  default: {
    env: 'test',
    port: 13000,
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
    corsOrigins: ['http://localhost:3000'],
    rateLimit: { windowMs: 60000, max: 1000 },
    redisUrl: 'redis://localhost:6379',
    upload: { dir: './uploads', maxFileSize: 10485760, maxWorkspaceStorage: 524288000 },
    database: { host: 'localhost', port: 5432, name: 'test', user: 'test', password: 'test' },
  },
  __esModule: true,
}));

jest.mock('../../config/database', () => {
  const { Sequelize } = jest.requireActual('sequelize');
  return {
    default: new Sequelize('sqlite::memory:', { logging: false }),
    sequelize: new Sequelize('sqlite::memory:', { logging: false }),
    __esModule: true,
  };
});

jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// Mock ItemService
const mockList = jest.fn();
jest.mock('../../services/ItemService', () => ({
  default: {
    list: (...args: any[]) => mockList(...args),
  },
  __esModule: true,
}));

// Mock models used by auth middleware
jest.mock('../../models/User', () => {
  const M: any = jest.fn();
  M.findOne = jest.fn();
  M.findByPk = jest.fn();
  M.create = jest.fn();
  M.update = jest.fn();
  M.init = jest.fn();
  M.belongsTo = jest.fn();
  M.hasMany = jest.fn();
  return { default: M, __esModule: true };
});

jest.mock('../../models/Workspace', () => {
  const M: any = jest.fn();
  M.create = jest.fn();
  M.update = jest.fn();
  M.init = jest.fn();
  M.hasMany = jest.fn();
  M.belongsTo = jest.fn();
  return { default: M, __esModule: true };
});

const modelNames = [
  'Board', 'BoardGroup', 'Column', 'Item', 'ColumnValue',
  'BoardView', 'Automation', 'AutomationLog', 'ActivityLog',
  'Notification', 'FileAttachment',
];
for (const name of modelNames) {
  jest.mock(`../../models/${name}`, () => {
    const M: any = jest.fn();
    M.init = jest.fn();
    M.findAll = jest.fn().mockResolvedValue([]);
    M.findOne = jest.fn().mockResolvedValue(null);
    M.findByPk = jest.fn().mockResolvedValue(null);
    M.create = jest.fn();
    M.update = jest.fn();
    M.destroy = jest.fn();
    M.upsert = jest.fn();
    M.hasMany = jest.fn();
    M.belongsTo = jest.fn();
    return { default: M, __esModule: true };
  });
}

jest.mock('../../models/index', () => ({}));

// Mock WebSocket service
jest.mock('../../services/WebSocketService', () => ({
  default: { emitToBoard: jest.fn(), emitToWorkspace: jest.fn(), emitToUser: jest.fn() },
  __esModule: true,
}));

import request from 'supertest';
import app from '../../app';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function authHeader(): [string, string] {
  // Make jwt.verify return a valid user payload
  (mockedJwtVerify as jest.Mock).mockReturnValue({
    id: 1,
    email: 'test@test.com',
    workspaceId: 1,
    role: 'admin',
  });
  return ['Authorization', 'Bearer valid-token'];
}

describe('Item routes — filter/sort query params', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockList.mockResolvedValue({ items: [], total: 0 });
  });

  it('passes decoded columnFilters to ItemService.list', async () => {
    const filters = [{ columnId: 5, operator: 'equals', value: 'Done' }];
    const encoded = Buffer.from(JSON.stringify(filters)).toString('base64');

    const res = await request(app)
      .get(`/api/v1/workspaces/1/boards/10/items?columnFilters=${encoded}`)
      .set(...authHeader());

    expect(res.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        columnFilters: filters,
      })
    );
  });

  it('passes sortByColumn and sortOrder to ItemService.list', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces/1/boards/10/items?sortByColumn=5&sortOrder=DESC')
      .set(...authHeader());

    expect(res.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        sortByColumn: 5,
        sortOrder: 'DESC',
      })
    );
  });

  it('returns 400 for invalid columnFilters (bad base64/JSON)', async () => {
    const res = await request(app)
      .get('/api/v1/workspaces/1/boards/10/items?columnFilters=not-valid-base64!!!')
      .set(...authHeader());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error).toMatch(/invalid/i);
  });

  it('returns 400 for columnFilters that is not an array', async () => {
    const encoded = Buffer.from(JSON.stringify({ not: 'array' })).toString('base64');

    const res = await request(app)
      .get(`/api/v1/workspaces/1/boards/10/items?columnFilters=${encoded}`)
      .set(...authHeader());

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it('combines columnFilters with existing search and groupId params', async () => {
    const filters = [{ columnId: 5, operator: 'contains', value: 'test' }];
    const encoded = Buffer.from(JSON.stringify(filters)).toString('base64');

    const res = await request(app)
      .get(`/api/v1/workspaces/1/boards/10/items?search=hello&groupId=3&columnFilters=${encoded}`)
      .set(...authHeader());

    expect(res.status).toBe(200);
    expect(mockList).toHaveBeenCalledWith(
      10,
      expect.objectContaining({
        search: 'hello',
        groupId: 3,
        columnFilters: filters,
      })
    );
  });
});
