/**
 * Integration tests for board CRUD routes.
 * Mocks BoardService, verifies route param parsing, response formats, and error handling.
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
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

// Mock BoardService
const mockList = jest.fn();
const mockGetById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();
const mockDuplicate = jest.fn();

jest.mock('../../services/BoardService', () => ({
  default: {
    list: (...args: any[]) => mockList(...args),
    getById: (...args: any[]) => mockGetById(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
    duplicate: (...args: any[]) => mockDuplicate(...args),
  },
  __esModule: true,
}));

// Mock models
jest.mock('../../models/User', () => {
  const M: any = jest.fn();
  M.findOne = jest.fn(); M.findByPk = jest.fn(); M.create = jest.fn();
  M.update = jest.fn(); M.init = jest.fn(); M.belongsTo = jest.fn(); M.hasMany = jest.fn();
  return { default: M, __esModule: true };
});

jest.mock('../../models/Workspace', () => {
  const M: any = jest.fn();
  M.create = jest.fn(); M.update = jest.fn(); M.init = jest.fn();
  M.hasMany = jest.fn(); M.belongsTo = jest.fn();
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
    M.init = jest.fn(); M.findAll = jest.fn().mockResolvedValue([]);
    M.findOne = jest.fn().mockResolvedValue(null); M.findByPk = jest.fn().mockResolvedValue(null);
    M.create = jest.fn(); M.update = jest.fn(); M.destroy = jest.fn();
    M.upsert = jest.fn(); M.hasMany = jest.fn(); M.belongsTo = jest.fn();
    return { default: M, __esModule: true };
  });
}

jest.mock('../../models/index', () => ({}));
jest.mock('../../services/WebSocketService', () => ({
  default: { emitToBoard: jest.fn(), emitToWorkspace: jest.fn(), emitToUser: jest.fn() },
  __esModule: true,
}));

import request from 'supertest';
import app from '../../app';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function auth(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({
    sub: 1, email: 'test@test.com', workspaceId: 1, role: 'admin',
    firstName: 'Test', lastName: 'User',
  });
  return ['Authorization', 'Bearer valid-token'];
}

const BASE = '/api/v1/workspaces/1/boards';

describe('Board routes', () => {
  beforeEach(() => jest.clearAllMocks());

  // ─── GET /workspaces/:workspaceId/boards ────────────────────────────────────

  describe('GET /boards', () => {
    it('lists boards for a workspace', async () => {
      const boards = [
        { id: 1, name: 'Board A', workspaceId: 1 },
        { id: 2, name: 'Board B', workspaceId: 1 },
      ];
      mockList.mockResolvedValue(boards);

      const res = await request(app)
        .get(BASE)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(boards);
      expect(res.body.message).toBe('Boards retrieved');
      expect(mockList).toHaveBeenCalledWith(1);
    });

    it('returns 500 when service throws', async () => {
      mockList.mockRejectedValue(new Error('DB connection failed'));

      const res = await request(app)
        .get(BASE)
        .set(...auth());

      expect(res.status).toBe(500);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('DB connection failed');
    });
  });

  // ─── GET /workspaces/:workspaceId/boards/:id ───────────────────────────────

  describe('GET /boards/:id', () => {
    it('gets a board by ID', async () => {
      const board = { id: 1, name: 'Board A', workspaceId: 1, groups: [], columns: [] };
      mockGetById.mockResolvedValue(board);

      const res = await request(app)
        .get(`${BASE}/1`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(board);
      expect(res.body.message).toBe('Board retrieved');
      expect(mockGetById).toHaveBeenCalledWith(1, 1);
    });

    it('returns 404 for non-existent board', async () => {
      mockGetById.mockResolvedValue(null);

      const res = await request(app)
        .get(`${BASE}/999`)
        .set(...auth());

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Board not found');
    });

    it('returns 400 for invalid (non-numeric) board ID', async () => {
      const res = await request(app)
        .get(`${BASE}/abc`)
        .set(...auth());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid board ID');
    });
  });

  // ─── POST /workspaces/:workspaceId/boards ──────────────────────────────────

  describe('POST /boards', () => {
    it('creates a board with name', async () => {
      const created = { id: 1, name: 'New Board', workspaceId: 1 };
      mockCreate.mockResolvedValue(created);

      const res = await request(app)
        .post(BASE)
        .set(...auth())
        .send({ name: 'New Board', description: 'Test desc', boardType: 'main' });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(created);
      expect(res.body.message).toBe('Board created');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'New Board', description: 'Test desc', boardType: 'main' }),
        1,
        expect.objectContaining({ id: 1 })
      );
    });

    it('returns 400 without name', async () => {
      const res = await request(app)
        .post(BASE)
        .set(...auth())
        .send({ description: 'no name provided' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Board name is required');
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('returns 400 when service throws on create', async () => {
      mockCreate.mockRejectedValue(new Error('Duplicate board name'));

      const res = await request(app)
        .post(BASE)
        .set(...auth())
        .send({ name: 'Duplicate Board' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Duplicate board name');
    });
  });

  // ─── PUT /workspaces/:workspaceId/boards/:id ──────────────────────────────

  describe('PUT /boards/:id', () => {
    it('updates board name and description', async () => {
      const updated = { id: 1, name: 'Updated Board', description: 'Updated desc', workspaceId: 1 };
      mockUpdate.mockResolvedValue(updated);

      const res = await request(app)
        .put(`${BASE}/1`)
        .set(...auth())
        .send({ name: 'Updated Board', description: 'Updated desc' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(updated);
      expect(res.body.message).toBe('Board updated');
      expect(mockUpdate).toHaveBeenCalledWith(
        1,
        1,
        expect.objectContaining({ name: 'Updated Board', description: 'Updated desc' }),
        expect.objectContaining({ id: 1 })
      );
    });

    it('returns 404 for non-existent board', async () => {
      mockUpdate.mockRejectedValue(new Error('Board not found'));

      const res = await request(app)
        .put(`${BASE}/999`)
        .set(...auth())
        .send({ name: 'Ghost Board' });

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Board not found');
    });

    it('returns 400 for invalid board ID', async () => {
      const res = await request(app)
        .put(`${BASE}/abc`)
        .set(...auth())
        .send({ name: 'Test' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid board ID');
    });

    it('returns 400 when update service throws a non-404 error', async () => {
      mockUpdate.mockRejectedValue(new Error('Invalid settings format'));

      const res = await request(app)
        .put(`${BASE}/1`)
        .set(...auth())
        .send({ settings: 'bad' });

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Invalid settings format');
    });
  });

  // ─── DELETE /workspaces/:workspaceId/boards/:id ────────────────────────────

  describe('DELETE /boards/:id', () => {
    it('deletes a board and returns success', async () => {
      mockDelete.mockResolvedValue(undefined);

      const res = await request(app)
        .delete(`${BASE}/1`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.message).toBe('Board deleted');
      expect(mockDelete).toHaveBeenCalledWith(
        1, 1, expect.objectContaining({ id: 1 })
      );
    });

    it('returns 404 when board not found for deletion', async () => {
      mockDelete.mockRejectedValue(new Error('Board not found'));

      const res = await request(app)
        .delete(`${BASE}/999`)
        .set(...auth());

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Board not found');
    });

    it('returns 400 for invalid board ID on delete', async () => {
      const res = await request(app)
        .delete(`${BASE}/abc`)
        .set(...auth());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid board ID');
    });
  });

  // ─── POST /workspaces/:workspaceId/boards/:id/duplicate ───────────────────

  describe('POST /boards/:id/duplicate', () => {
    it('duplicates a board', async () => {
      const duplicated = { id: 2, name: 'Board A (copy)', workspaceId: 1 };
      mockDuplicate.mockResolvedValue(duplicated);

      const res = await request(app)
        .post(`${BASE}/1/duplicate`)
        .set(...auth());

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual(duplicated);
      expect(res.body.message).toBe('Board duplicated');
      expect(mockDuplicate).toHaveBeenCalledWith(
        1, 1, expect.objectContaining({ id: 1 })
      );
    });

    it('returns 404 when source board not found for duplication', async () => {
      mockDuplicate.mockRejectedValue(new Error('Board not found'));

      const res = await request(app)
        .post(`${BASE}/999/duplicate`)
        .set(...auth());

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Board not found');
    });

    it('returns 400 for invalid board ID on duplicate', async () => {
      const res = await request(app)
        .post(`${BASE}/abc/duplicate`)
        .set(...auth());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid board ID');
    });

    it('returns 400 when duplicate service throws a non-404 error', async () => {
      mockDuplicate.mockRejectedValue(new Error('Workspace storage limit exceeded'));

      const res = await request(app)
        .post(`${BASE}/1/duplicate`)
        .set(...auth());

      expect(res.status).toBe(400);
      expect(res.body.error).toBe('Workspace storage limit exceeded');
    });
  });
});
