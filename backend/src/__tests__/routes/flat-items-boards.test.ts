/**
 * Tests for the flat convenience shims added in Slice 20 A2.5:
 *
 *   DELETE /api/v1/items/:id
 *   POST   /api/v1/boards
 *
 * Both are thin wrappers around the existing nested-route logic. The
 * nested versions already have full behaviour coverage in boards.test.ts
 * and the ItemService unit tests — this suite only proves the flat URL
 * surface is reachable, authenticated, and honors workspace ownership.
 *
 * Keeps the mock stack intentionally sparse: only Board + Item model
 * methods the shims actually call, plus BoardService.create for the
 * POST /boards path (same delegation pattern as the nested shim).
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

// BoardService.create — POST /boards flat shim delegates to it.
const mockBoardCreate = jest.fn();
jest.mock('../../services/BoardService', () => ({
  default: {
    create: (...args: any[]) => mockBoardCreate(...args),
  },
  __esModule: true,
}));

// Minimal User + Workspace mocks for the auth middleware chain.
jest.mock('../../models/User', () => {
  const M: any = jest.fn();
  M.findOne = jest.fn();
  M.findByPk = jest.fn();
  M.create = jest.fn();
  M.init = jest.fn();
  M.belongsTo = jest.fn();
  M.hasMany = jest.fn();
  return { default: M, __esModule: true };
});

jest.mock('../../models/Workspace', () => {
  const M: any = jest.fn();
  M.create = jest.fn();
  M.init = jest.fn();
  M.hasMany = jest.fn();
  M.belongsTo = jest.fn();
  return { default: M, __esModule: true };
});

// Model mocks for the flat routes. findOne / findByPk return values are
// overridden per test; the default is "no match" so the failure paths
// are the path of least resistance.
const mockBoardFindOne = jest.fn().mockResolvedValue(null);
const mockItemFindByPk = jest.fn().mockResolvedValue(null);

jest.mock('../../models/Board', () => {
  const M: any = jest.fn();
  M.init = jest.fn();
  M.findAll = jest.fn().mockResolvedValue([]);
  M.findOne = (...args: any[]) => mockBoardFindOne(...args);
  M.findByPk = jest.fn().mockResolvedValue(null);
  M.create = jest.fn();
  M.hasMany = jest.fn();
  M.belongsTo = jest.fn();
  return { default: M, __esModule: true };
});

jest.mock('../../models/Item', () => {
  const M: any = jest.fn();
  M.init = jest.fn();
  M.findAll = jest.fn().mockResolvedValue([]);
  M.findOne = jest.fn().mockResolvedValue(null);
  M.findByPk = (...args: any[]) => mockItemFindByPk(...args);
  M.create = jest.fn();
  M.destroy = jest.fn();
  M.hasMany = jest.fn();
  M.belongsTo = jest.fn();
  return { default: M, __esModule: true };
});

// Other models only consulted by the auth middleware / route bootstrap
// — default to null so we don't accidentally exercise them.
const otherModelNames = [
  'BoardGroup', 'Column', 'ColumnValue',
  'BoardView', 'Automation', 'AutomationLog', 'ActivityLog',
  'Notification', 'FileAttachment',
];
for (const name of otherModelNames) {
  jest.mock(`../../models/${name}`, () => {
    const M: any = jest.fn();
    M.init = jest.fn();
    M.findAll = jest.fn().mockResolvedValue([]);
    M.findOne = jest.fn().mockResolvedValue(null);
    M.findByPk = jest.fn().mockResolvedValue(null);
    M.create = jest.fn();
    M.destroy = jest.fn();
    M.upsert = jest.fn();
    M.hasMany = jest.fn();
    M.belongsTo = jest.fn();
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
    sub: 1,
    email: 'test@test.com',
    workspaceId: 1,
    role: 'admin',
    firstName: 'Test',
    lastName: 'User',
  });
  return ['Authorization', 'Bearer valid-token'];
}

describe('Flat convenience shims (Slice 20 A2.5)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockBoardFindOne.mockResolvedValue(null);
    mockItemFindByPk.mockResolvedValue(null);
  });

  // ─── DELETE /api/v1/items/:id ─────────────────────────────────────────────

  describe('DELETE /api/v1/items/:id', () => {
    it('soft-deletes the item when it belongs to a board in the user’s workspace', async () => {
      const destroy = jest.fn().mockResolvedValue(undefined);
      mockItemFindByPk.mockResolvedValue({ id: 99, boardId: 7, destroy });
      mockBoardFindOne.mockResolvedValue({ id: 7, workspaceId: 1 });

      const res = await request(app)
        .delete('/api/v1/items/99')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(destroy).toHaveBeenCalledTimes(1);
    });

    it('returns 404 when the item does not exist', async () => {
      mockItemFindByPk.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/items/999')
        .set(...auth());

      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
    });

    it('returns 403 when the item belongs to a board in another workspace', async () => {
      const destroy = jest.fn();
      mockItemFindByPk.mockResolvedValue({ id: 99, boardId: 7, destroy });
      // Board lookup scoped to user's workspace returns null → foreign board.
      mockBoardFindOne.mockResolvedValue(null);

      const res = await request(app)
        .delete('/api/v1/items/99')
        .set(...auth());

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(destroy).not.toHaveBeenCalled();
    });

    it('returns 400 for a non-numeric item id', async () => {
      const res = await request(app)
        .delete('/api/v1/items/not-a-number')
        .set(...auth());

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('returns 401 when no Authorization header is present', async () => {
      const res = await request(app).delete('/api/v1/items/99');
      expect(res.status).toBe(401);
    });
  });

  // ─── POST /api/v1/boards ──────────────────────────────────────────────────

  describe('POST /api/v1/boards', () => {
    it('creates a board and returns 201 + { board }', async () => {
      const created = {
        id: 5,
        name: 'Deals Pipeline',
        workspaceId: 1,
        boardType: 'main',
      };
      mockBoardCreate.mockResolvedValue(created);

      const res = await request(app)
        .post('/api/v1/boards')
        .set(...auth())
        .send({
          name: 'Deals Pipeline',
          description: 'Q2 pipeline',
          workspaceId: 1,
          boardType: 'main',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({ board: created });
      expect(mockBoardCreate).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Deals Pipeline', boardType: 'main' }),
        1, // workspaceId from body
        expect.objectContaining({ workspaceId: 1 })
      );
    });

    it('returns 400 when name is missing', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set(...auth())
        .send({ description: 'no-name', workspaceId: 1, boardType: 'main' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockBoardCreate).not.toHaveBeenCalled();
    });

    it('returns 400 when workspaceId is missing from body', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set(...auth())
        .send({ name: 'Orphan Board', boardType: 'main' });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(mockBoardCreate).not.toHaveBeenCalled();
    });

    it('returns 403 when workspaceId in body differs from user workspace', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .set(...auth()) // user.workspaceId === 1
        .send({ name: 'Foreign Board', workspaceId: 999, boardType: 'main' });

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(mockBoardCreate).not.toHaveBeenCalled();
    });

    it('returns 401 when no Authorization header is present', async () => {
      const res = await request(app)
        .post('/api/v1/boards')
        .send({ name: 'X', workspaceId: 1, boardType: 'main' });

      expect(res.status).toBe(401);
    });
  });
});
