/**
 * Integration tests for notification routes.
 */

import jwt from 'jsonwebtoken';

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

jest.mock('../../config', () => ({
  default: {
    env: 'test', port: 13000,
    jwt: { secret: 'test-secret', refreshSecret: 'test-refresh-secret', expiresIn: '1h', refreshExpiresIn: '7d' },
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
  return { default: new Sequelize('sqlite::memory:', { logging: false }), sequelize: new Sequelize('sqlite::memory:', { logging: false }), __esModule: true };
});

jest.mock('../../utils/logger', () => ({
  logger: { debug: jest.fn(), info: jest.fn(), warn: jest.fn(), error: jest.fn() },
}));

const mockCreate = jest.fn();
const mockList = jest.fn();
const mockMarkRead = jest.fn();
const mockMarkAllRead = jest.fn();
const mockGetUnreadCount = jest.fn();

jest.mock('../../services/NotificationService', () => ({
  default: {
    create: (...a: any[]) => mockCreate(...a),
    list: (...a: any[]) => mockList(...a),
    markRead: (...a: any[]) => mockMarkRead(...a),
    markAllRead: (...a: any[]) => mockMarkAllRead(...a),
    getUnreadCount: (...a: any[]) => mockGetUnreadCount(...a),
  },
  __esModule: true,
}));

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
  (mockedJwtVerify as jest.Mock).mockReturnValue({ sub: 5, email: 'test@test.com', workspaceId: 1, role: 'admin' });
  return ['Authorization', 'Bearer valid-token'];
}

const BASE = '/api/v1/notifications';

describe('Notification routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /notifications', () => {
    it('returns paginated notifications for authenticated user', async () => {
      const data = {
        rows: [{ id: 1, title: 'Test' }],
        count: 1,
      };
      mockList.mockResolvedValue(data);

      const res = await request(app)
        .get(BASE)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(mockList).toHaveBeenCalledWith(5, 1, expect.objectContaining({ page: 1, limit: 20 }));
    });

    it('passes unreadOnly filter when query param is set', async () => {
      mockList.mockResolvedValue({ rows: [], count: 0 });

      const res = await request(app)
        .get(`${BASE}?unreadOnly=true`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(mockList).toHaveBeenCalledWith(5, 1, expect.objectContaining({ unreadOnly: true }));
    });

    it('parses page and limit from query params', async () => {
      mockList.mockResolvedValue({ rows: [], count: 0 });

      await request(app)
        .get(`${BASE}?page=3&limit=10`)
        .set(...auth());

      expect(mockList).toHaveBeenCalledWith(5, 1, expect.objectContaining({ page: 3, limit: 10 }));
    });
  });

  describe('GET /notifications/unread-count', () => {
    it('returns unread count', async () => {
      mockGetUnreadCount.mockResolvedValue(7);

      const res = await request(app)
        .get(`${BASE}/unread-count`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data).toEqual({ count: 7 });
      expect(mockGetUnreadCount).toHaveBeenCalledWith(5, 1);
    });
  });

  describe('PUT /notifications/:id/read', () => {
    it('marks notification as read', async () => {
      const notif = { id: 1, isRead: true };
      mockMarkRead.mockResolvedValue(notif);

      const res = await request(app)
        .put(`${BASE}/1/read`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(mockMarkRead).toHaveBeenCalledWith(1, 5);
    });

    it('returns 404 for non-existent notification', async () => {
      mockMarkRead.mockRejectedValue(new Error('Notification not found'));

      const res = await request(app)
        .put(`${BASE}/999/read`)
        .set(...auth());

      expect(res.status).toBe(404);
    });
  });

  describe('PUT /notifications/read-all', () => {
    it('marks all notifications as read', async () => {
      mockMarkAllRead.mockResolvedValue(undefined);

      const res = await request(app)
        .put(`${BASE}/read-all`)
        .set(...auth());

      expect(res.status).toBe(200);
      expect(mockMarkAllRead).toHaveBeenCalledWith(5, 1);
    });
  });
});
