import jwt from 'jsonwebtoken';

// ─── Mock external dependencies BEFORE any app imports ──────────────

jest.mock('jsonwebtoken');
jest.mock('bcryptjs');

// Mock config so no real env vars are needed
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

// Mock Sequelize database (prevents real DB connection)
jest.mock('../../config/database', () => {
  const { Sequelize } = jest.requireActual('sequelize');
  return {
    default: new Sequelize('sqlite::memory:', { logging: false }),
    sequelize: new Sequelize('sqlite::memory:', { logging: false }),
    __esModule: true,
  };
});

// Mock logger
jest.mock('../../utils/logger', () => ({
  logger: {
    debug: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  },
}));

// ─── Mock AuthService ────────────────────────────────────────────────
const mockLogin = jest.fn();
const mockRegister = jest.fn();
const mockRefreshToken = jest.fn();
const mockGetUserById = jest.fn();
const mockChangePassword = jest.fn();

jest.mock('../../services/AuthService', () => ({
  default: {
    login: (...args: any[]) => mockLogin(...args),
    register: (...args: any[]) => mockRegister(...args),
    refreshToken: (...args: any[]) => mockRefreshToken(...args),
    getUserById: (...args: any[]) => mockGetUserById(...args),
    changePassword: (...args: any[]) => mockChangePassword(...args),
    generateAccessToken: jest.fn().mockReturnValue('mock-token'),
    generateRefreshToken: jest.fn().mockReturnValue('mock-refresh'),
  },
  __esModule: true,
}));

// Mock User model (used directly in some routes)
jest.mock('../../models/User', () => {
  const MockUser: any = jest.fn();
  MockUser.findOne = jest.fn();
  MockUser.findByPk = jest.fn();
  MockUser.create = jest.fn();
  MockUser.update = jest.fn();
  MockUser.init = jest.fn();
  MockUser.belongsTo = jest.fn();
  MockUser.hasMany = jest.fn();
  return { default: MockUser, __esModule: true };
});

// Mock Workspace model
jest.mock('../../models/Workspace', () => {
  const MockWorkspace: any = jest.fn();
  MockWorkspace.create = jest.fn();
  MockWorkspace.update = jest.fn();
  MockWorkspace.init = jest.fn();
  MockWorkspace.hasMany = jest.fn();
  MockWorkspace.belongsTo = jest.fn();
  return { default: MockWorkspace, __esModule: true };
});

// Mock all other models so they don't try to connect to a DB
const modelNames = [
  'Board', 'BoardGroup', 'Column', 'Item', 'ColumnValue',
  'BoardView', 'Automation', 'AutomationLog', 'ActivityLog',
  'Notification', 'FileAttachment',
];
for (const modelName of modelNames) {
  jest.mock(`../../models/${modelName}`, () => {
    const MockModel: any = jest.fn();
    MockModel.init = jest.fn();
    MockModel.findAll = jest.fn().mockResolvedValue([]);
    MockModel.findOne = jest.fn().mockResolvedValue(null);
    MockModel.findByPk = jest.fn().mockResolvedValue(null);
    MockModel.create = jest.fn();
    MockModel.update = jest.fn();
    MockModel.destroy = jest.fn();
    MockModel.upsert = jest.fn();
    MockModel.hasMany = jest.fn();
    MockModel.belongsTo = jest.fn();
    return { default: MockModel, __esModule: true };
  });
}

// Mock models/index to prevent association setup from blowing up
jest.mock('../../models/index', () => ({}));

// ─── Now import supertest and app ────────────────────────────────────
import request from 'supertest';
import app from '../../app';

const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

describe('Auth Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── POST /api/v1/auth/login ─────────────────────────────────────

  describe('POST /api/v1/auth/login', () => {
    it('should login with valid credentials', async () => {
      const mockResult = {
        user: {
          id: 1,
          email: 'john@example.com',
          firstName: 'John',
          lastName: 'Doe',
          workspaceId: 10,
          role: 'admin',
        },
        accessToken: 'access-123',
        refreshToken: 'refresh-456',
      };
      mockLogin.mockResolvedValue(mockResult);

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'password123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('access-123');
      expect(res.body.data.refreshToken).toBe('refresh-456');
      expect(res.body.data.user.email).toBe('john@example.com');
      expect(res.body.message).toBe('Login successful');
    });

    it('should reject invalid credentials', async () => {
      mockLogin.mockRejectedValue(new Error('Invalid email or password'));

      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com', password: 'wrongpass' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid email or password');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/login')
        .send({ email: 'john@example.com' }); // missing password

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required');
    });
  });

  // ─── POST /api/v1/auth/register ──────────────────────────────────

  describe('POST /api/v1/auth/register', () => {
    it('should register new user', async () => {
      const mockUser = {
        id: 2,
        email: 'jane@example.com',
        firstName: 'Jane',
        lastName: 'Smith',
        workspaceId: 20,
        role: 'admin',
      };
      mockRegister.mockResolvedValue(mockUser);

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'jane@example.com',
          password: 'secure123456',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('jane@example.com');
      expect(res.body.message).toBe('Registration successful');
    });

    it('should reject missing fields', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({ email: 'jane@example.com' }); // missing password, firstName, lastName

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required');
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'jane@example.com',
          password: 'short',
          firstName: 'Jane',
          lastName: 'Smith',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('at least 8 characters');
    });

    it('should reject duplicate email', async () => {
      mockRegister.mockRejectedValue(new Error('Email already registered'));

      const res = await request(app)
        .post('/api/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(res.status).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Email already registered');
    });
  });

  // ─── POST /api/v1/auth/refresh ───────────────────────────────────

  describe('POST /api/v1/auth/refresh', () => {
    it('should refresh valid token', async () => {
      mockRefreshToken.mockResolvedValue({ accessToken: 'new-access-token' });

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'valid-refresh-token' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.accessToken).toBe('new-access-token');
      expect(res.body.message).toBe('Token refreshed');
    });

    it('should reject missing refresh token', async () => {
      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toContain('required');
    });

    it('should reject invalid refresh token', async () => {
      mockRefreshToken.mockRejectedValue(new Error('Invalid refresh token'));

      const res = await request(app)
        .post('/api/v1/auth/refresh')
        .send({ refreshToken: 'bad-token' });

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
      expect(res.body.error).toBe('Invalid refresh token');
    });
  });

  // ─── GET /api/v1/auth/me ─────────────────────────────────────────

  describe('GET /api/v1/auth/me', () => {
    it('should return user profile when authenticated', async () => {
      // jwt.verify will return a decoded payload for the authenticate middleware
      const payload = {
        sub: 1,
        email: 'john@example.com',
        workspaceId: 10,
        role: 'admin',
        firstName: 'John',
        lastName: 'Doe',
      };
      mockedJwtVerify.mockReturnValue(payload as any);

      mockGetUserById.mockResolvedValue({
        id: 1,
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
        workspaceId: 10,
        role: 'admin',
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer valid-token');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe('john@example.com');
    });

    it('should reject unauthenticated request', async () => {
      const res = await request(app).get('/api/v1/auth/me');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it('should reject request with invalid token', async () => {
      const jwtError = new Error('jwt malformed');
      jwtError.name = 'JsonWebTokenError';
      mockedJwtVerify.mockImplementation(() => {
        throw jwtError;
      });

      const res = await request(app)
        .get('/api/v1/auth/me')
        .set('Authorization', 'Bearer bad-token');

      expect(res.status).toBe(401);
      expect(res.body.success).toBe(false);
    });
  });
});
