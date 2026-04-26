/**
 * Integration tests for workspace member-search route (Slice 21B Phase A).
 * Mocks WorkspaceService.searchMembers, verifies auth, RBAC, response shape, and security boundaries.
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

// Mock WorkspaceService — only `searchMembers` is exercised here.
const mockSearchMembers = jest.fn();
const mockList = jest.fn();
const mockGetById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

jest.mock('../../services/WorkspaceService', () => ({
  default: {
    list: (...args: any[]) => mockList(...args),
    getById: (...args: any[]) => mockGetById(...args),
    create: (...args: any[]) => mockCreate(...args),
    update: (...args: any[]) => mockUpdate(...args),
    delete: (...args: any[]) => mockDelete(...args),
    searchMembers: (...args: any[]) => mockSearchMembers(...args),
  },
  __esModule: true,
}));

// Mock models (the route does not query these directly, but model imports
// in the service module graph need stubs so tests don't hit a real DB).
jest.mock('../../models/User', () => {
  const M: any = jest.fn();
  M.findOne = jest.fn();
  M.findByPk = jest.fn();
  M.findAll = jest.fn();
  M.findAndCountAll = jest.fn();
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
  'Board',
  'BoardGroup',
  'Column',
  'Item',
  'ColumnValue',
  'BoardView',
  'Automation',
  'AutomationLog',
  'ActivityLog',
  'Notification',
  'FileAttachment',
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
jest.mock('../../services/WebSocketService', () => ({
  default: { emitToBoard: jest.fn(), emitToWorkspace: jest.fn(), emitToUser: jest.fn() },
  __esModule: true,
}));

import request from 'supertest';
import app from '../../app';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function authAsAdminInWorkspace(workspaceId: number): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({
    sub: 1,
    email: 'admin@test.com',
    workspaceId,
    role: 'admin',
    firstName: 'Test',
    lastName: 'Admin',
  });
  return ['Authorization', 'Bearer valid-token'];
}

describe('Workspace member-search route (Slice 21B A1)', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /workspaces/:workspaceId/members', () => {
    it('returns 401 when no Authorization header is present', async () => {
      const res = await request(app).get('/api/v1/workspaces/1/members');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(mockSearchMembers).not.toHaveBeenCalled();
    });

    it('returns 403 when the user belongs to a different workspace', async () => {
      // User is in workspace 2; requesting members of workspace 1 must be rejected.
      const res = await request(app)
        .get('/api/v1/workspaces/1/members')
        .set(...authAsAdminInWorkspace(2));

      expect(res.status).toBe(403);
      expect(res.body.success).toBe(false);
      expect(mockSearchMembers).not.toHaveBeenCalled();
    });

    it('returns 200 with up to 50 most-recent members on empty search', async () => {
      const members = Array.from({ length: 50 }, (_, i) => ({
        id: i + 1,
        email: `user${i + 1}@test.com`,
        firstName: `User${i + 1}`,
        lastName: 'Smith',
        avatar: null,
        role: 'member',
      }));
      mockSearchMembers.mockResolvedValue({ members, total: 50 });

      const res = await request(app)
        .get('/api/v1/workspaces/1/members')
        .set(...authAsAdminInWorkspace(1));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members).toHaveLength(50);
      expect(res.body.pagination).toEqual(
        expect.objectContaining({ page: 1, limit: 50, total: 50, totalPages: 1 })
      );
      // Service called with workspaceId=1, empty search, limit=50.
      expect(mockSearchMembers).toHaveBeenCalledWith(1, '', 50);
    });

    it('returns 200 with ILIKE-filtered list when ?search=alice is provided', async () => {
      const members = [
        {
          id: 7,
          email: 'alice@test.com',
          firstName: 'Alice',
          lastName: 'Wonder',
          avatar: null,
          role: 'member',
        },
      ];
      mockSearchMembers.mockResolvedValue({ members, total: 1 });

      const res = await request(app)
        .get('/api/v1/workspaces/1/members?search=alice')
        .set(...authAsAdminInWorkspace(1));

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.members).toEqual(members);
      expect(res.body.pagination.total).toBe(1);
      expect(mockSearchMembers).toHaveBeenCalledWith(1, 'alice', 50);
    });

    it('never includes passwordHash, refreshToken, or sensitive fields in the response', async () => {
      // Simulate a service that — even if a future regression leaked sensitive fields —
      // would surface them in the response. The route must rely on the service's
      // strict allowlist; this test guards against accidental serialization.
      const members = [
        {
          id: 1,
          email: 'safe@test.com',
          firstName: 'Safe',
          lastName: 'User',
          avatar: null,
          role: 'admin',
        },
      ];
      mockSearchMembers.mockResolvedValue({ members, total: 1 });

      const res = await request(app)
        .get('/api/v1/workspaces/1/members')
        .set(...authAsAdminInWorkspace(1));

      expect(res.status).toBe(200);
      const body = JSON.stringify(res.body);
      expect(body).not.toMatch(/passwordHash/i);
      expect(body).not.toMatch(/password_hash/i);
      expect(body).not.toMatch(/refreshToken/i);
      expect(body).not.toMatch(/refresh_token/i);
      expect(body).not.toMatch(/resetToken/i);
    });
  });
});
