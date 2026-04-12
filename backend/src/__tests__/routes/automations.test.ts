/**
 * Integration tests for automation routes — logs endpoint and engine-backed trigger.
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
    M.findAndCountAll = jest.fn().mockResolvedValue({ rows: [], count: 0 });
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

// Mock AutomationEngine
const mockEvaluate = jest.fn();
jest.mock('../../services/AutomationEngine', () => ({
  AutomationEngine: { evaluate: (...a: any[]) => mockEvaluate(...a) },
}));

import request from 'supertest';
import app from '../../app';
import Board from '../../models/Board';
import Automation from '../../models/Automation';
import AutomationLog from '../../models/AutomationLog';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

function auth(): [string, string] {
  (mockedJwtVerify as jest.Mock).mockReturnValue({ sub: 1, email: 'test@test.com', workspaceId: 1, role: 'admin' });
  return ['Authorization', 'Bearer valid-token'];
}

describe('Automation routes', () => {
  beforeEach(() => jest.clearAllMocks());

  describe('GET /automations/:id/logs', () => {
    it('returns paginated automation logs', async () => {
      const automation = { id: 1, boardId: 10 };
      (Automation.findByPk as jest.Mock).mockResolvedValue(automation);
      (Board.findOne as jest.Mock).mockResolvedValue({ id: 10, workspaceId: 1 });
      (AutomationLog.findAndCountAll as jest.Mock).mockResolvedValue({
        rows: [{ id: 1, status: 'success', executedAt: new Date() }],
        count: 1,
      });

      const res = await request(app)
        .get('/api/v1/automations/1/logs')
        .set(...auth());

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it('returns 404 when automation not found', async () => {
      (Automation.findByPk as jest.Mock).mockResolvedValue(null);

      const res = await request(app)
        .get('/api/v1/automations/999/logs')
        .set(...auth());

      expect(res.status).toBe(404);
    });
  });

  describe('POST /automations/:id/trigger (engine-backed)', () => {
    it('uses AutomationEngine to execute the automation', async () => {
      const automation = {
        id: 1, boardId: 10, triggerType: 'on_item_created',
        triggerConfig: {}, actionType: 'send_notification',
        actionConfig: {}, isActive: true,
      };
      (Automation.findByPk as jest.Mock).mockResolvedValue(automation);
      (Board.findOne as jest.Mock).mockResolvedValue({ id: 10, workspaceId: 1 });
      mockEvaluate.mockResolvedValue(undefined);
      (AutomationLog.create as jest.Mock).mockResolvedValue({ id: 1, status: 'success' });

      const res = await request(app)
        .post('/api/v1/automations/1/trigger')
        .set(...auth())
        .send({ triggerData: { manual: true } });

      expect(res.status).toBe(200);
    });

    it('returns 400 when automation is not active', async () => {
      const automation = { id: 1, boardId: 10, isActive: false };
      (Automation.findByPk as jest.Mock).mockResolvedValue(automation);
      (Board.findOne as jest.Mock).mockResolvedValue({ id: 10, workspaceId: 1 });

      const res = await request(app)
        .post('/api/v1/automations/1/trigger')
        .set(...auth())
        .send({});

      expect(res.status).toBe(400);
    });
  });
});
