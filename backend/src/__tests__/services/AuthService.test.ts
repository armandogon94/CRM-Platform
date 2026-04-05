import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Mock all external dependencies before importing the module under test

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

// Mock config
jest.mock('../../config', () => ({
  default: {
    jwt: {
      secret: 'test-secret',
      refreshSecret: 'test-refresh-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    },
  },
  __esModule: true,
}));

// Mock Sequelize database connection
jest.mock('../../config/database', () => {
  const { Sequelize } = jest.requireActual('sequelize');
  return {
    default: new Sequelize('sqlite::memory:', { logging: false }),
    __esModule: true,
  };
});

// Mock User model
const mockUserFindOne = jest.fn();
const mockUserFindByPk = jest.fn();
const mockUserCreate = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock('../../models/User', () => {
  const MockUser: any = jest.fn();
  MockUser.findOne = (...args: any[]) => mockUserFindOne(...args);
  MockUser.findByPk = (...args: any[]) => mockUserFindByPk(...args);
  MockUser.create = (...args: any[]) => mockUserCreate(...args);
  MockUser.update = (...args: any[]) => mockUserUpdate(...args);
  return { default: MockUser, __esModule: true };
});

// Mock Workspace model
const mockWorkspaceCreate = jest.fn();
const mockWorkspaceUpdate = jest.fn();

jest.mock('../../models/Workspace', () => {
  const MockWorkspace: any = jest.fn();
  MockWorkspace.create = (...args: any[]) => mockWorkspaceCreate(...args);
  MockWorkspace.update = (...args: any[]) => mockWorkspaceUpdate(...args);
  return { default: MockWorkspace, __esModule: true };
});

// Now import the service (mocks are already in place)
import AuthService from '../../services/AuthService';

const mockedBcryptHash = bcrypt.hash as jest.MockedFunction<typeof bcrypt.hash>;
const mockedBcryptCompare = bcrypt.compare as jest.MockedFunction<typeof bcrypt.compare>;
const mockedJwtSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>;
const mockedJwtVerify = jwt.verify as jest.MockedFunction<typeof jwt.verify>;

// Helper to create a mock user instance
function createMockUser(overrides: Record<string, any> = {}) {
  const base = {
    id: 1,
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    firstName: 'John',
    lastName: 'Doe',
    workspaceId: 10,
    role: 'admin',
    isActive: true,
    avatar: null,
    lastLoginAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    ...overrides,
  };

  return {
    ...base,
    toJSON: () => ({ ...base }),
    update: jest.fn().mockResolvedValue(undefined),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─── register ──────────────────────────────────────────────────────

  describe('register', () => {
    it('should register a new user with hashed password', async () => {
      mockUserFindOne.mockResolvedValue(null); // no existing user
      mockedBcryptHash.mockResolvedValue('hashed-new-password' as never);
      mockWorkspaceCreate.mockResolvedValue({ id: 100 });
      mockWorkspaceUpdate.mockResolvedValue([1]);

      const newUser = createMockUser({
        id: 5,
        email: 'new@example.com',
        passwordHash: 'hashed-new-password',
        firstName: 'Jane',
        lastName: 'Smith',
        workspaceId: 100,
      });
      mockUserCreate.mockResolvedValue(newUser);

      const result = await AuthService.register(
        'new@example.com',
        'securepass123',
        'Jane',
        'Smith'
      );

      expect(mockUserFindOne).toHaveBeenCalledWith({ where: { email: 'new@example.com' } });
      expect(mockedBcryptHash).toHaveBeenCalledWith('securepass123', 12);
      expect(mockUserCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'new@example.com',
          passwordHash: 'hashed-new-password',
          firstName: 'Jane',
          lastName: 'Smith',
          role: 'admin',
        })
      );
      // The returned object should NOT contain passwordHash
      expect(result).not.toHaveProperty('passwordHash');
      expect(result.email).toBe('new@example.com');
    });

    it('should fail registration with duplicate email', async () => {
      mockUserFindOne.mockResolvedValue(createMockUser()); // user already exists

      await expect(
        AuthService.register('test@example.com', 'password123', 'John', 'Doe')
      ).rejects.toThrow('Email already registered');
    });
  });

  // ─── login ─────────────────────────────────────────────────────────

  describe('login', () => {
    it('should login with correct credentials', async () => {
      const mockUser = createMockUser({ isActive: true });
      mockUserFindOne.mockResolvedValue(mockUser);
      mockedBcryptCompare.mockResolvedValue(true as never);
      mockedJwtSign.mockReturnValue('access-token-123' as never);

      const result = await AuthService.login('test@example.com', 'correctpassword');

      expect(mockUserFindOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(mockedBcryptCompare).toHaveBeenCalledWith('correctpassword', 'hashed-password');
      expect(mockUser.update).toHaveBeenCalledWith({ lastLoginAt: expect.any(Date) });
      expect(result.user).toBeDefined();
      expect(result.user).not.toHaveProperty('passwordHash');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('should fail login with wrong password', async () => {
      const mockUser = createMockUser({ isActive: true });
      mockUserFindOne.mockResolvedValue(mockUser);
      mockedBcryptCompare.mockResolvedValue(false as never);

      await expect(
        AuthService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should fail login with non-existent email', async () => {
      mockUserFindOne.mockResolvedValue(null);

      await expect(
        AuthService.login('nobody@example.com', 'password')
      ).rejects.toThrow('Invalid email or password');
    });

    it('should fail login when account is deactivated', async () => {
      const mockUser = createMockUser({ isActive: false });
      mockUserFindOne.mockResolvedValue(mockUser);

      await expect(
        AuthService.login('test@example.com', 'password')
      ).rejects.toThrow('Account is deactivated');
    });
  });

  // ─── token generation ──────────────────────────────────────────────

  describe('generateAccessToken', () => {
    it('should generate valid access token', () => {
      mockedJwtSign.mockReturnValue('mock-access-token' as never);
      const mockUser = createMockUser() as any;

      const token = AuthService.generateAccessToken(mockUser);

      expect(mockedJwtSign).toHaveBeenCalledWith(
        {
          sub: mockUser.id,
          email: mockUser.email,
          workspaceId: mockUser.workspaceId,
          role: mockUser.role,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
        },
        'test-secret',
        expect.objectContaining({ expiresIn: '1h' })
      );
      expect(token).toBe('mock-access-token');
    });
  });

  describe('generateRefreshToken', () => {
    it('should generate valid refresh token', () => {
      mockedJwtSign.mockReturnValue('mock-refresh-token' as never);
      const mockUser = createMockUser() as any;

      const token = AuthService.generateRefreshToken(mockUser);

      expect(mockedJwtSign).toHaveBeenCalledWith(
        { sub: mockUser.id },
        'test-refresh-secret',
        expect.objectContaining({ expiresIn: '7d' })
      );
      expect(token).toBe('mock-refresh-token');
    });
  });

  // ─── refreshToken ──────────────────────────────────────────────────

  describe('refreshToken', () => {
    it('should refresh token successfully', async () => {
      mockedJwtVerify.mockReturnValue({ sub: 1 } as any);
      const mockUser = createMockUser({ isActive: true });
      mockUserFindByPk.mockResolvedValue(mockUser);
      mockedJwtSign.mockReturnValue('new-access-token' as never);

      const result = await AuthService.refreshToken('valid-refresh-token');

      expect(mockedJwtVerify).toHaveBeenCalledWith('valid-refresh-token', 'test-refresh-secret');
      expect(mockUserFindByPk).toHaveBeenCalledWith(1);
      expect(result.accessToken).toBe('new-access-token');
    });

    it('should fail refresh with invalid token', async () => {
      const jwtError = new jwt.JsonWebTokenError('invalid signature');
      mockedJwtVerify.mockImplementation(() => {
        throw jwtError;
      });

      await expect(AuthService.refreshToken('bad-token')).rejects.toThrow(
        'Invalid refresh token'
      );
    });

    it('should fail refresh when user not found', async () => {
      mockedJwtVerify.mockReturnValue({ sub: 999 } as any);
      mockUserFindByPk.mockResolvedValue(null);

      await expect(AuthService.refreshToken('orphan-token')).rejects.toThrow(
        'User not found or inactive'
      );
    });
  });

  // ─── changePassword ────────────────────────────────────────────────

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const mockUser = createMockUser();
      mockUserFindByPk.mockResolvedValue(mockUser);
      mockedBcryptCompare.mockResolvedValue(true as never);
      mockedBcryptHash.mockResolvedValue('new-hashed-password' as never);

      await AuthService.changePassword(1, 'oldpass', 'newpass123');

      expect(mockUserFindByPk).toHaveBeenCalledWith(1);
      expect(mockedBcryptCompare).toHaveBeenCalledWith('oldpass', 'hashed-password');
      expect(mockedBcryptHash).toHaveBeenCalledWith('newpass123', 12);
      expect(mockUser.update).toHaveBeenCalledWith({ passwordHash: 'new-hashed-password' });
    });

    it('should fail to change password with wrong old password', async () => {
      const mockUser = createMockUser();
      mockUserFindByPk.mockResolvedValue(mockUser);
      mockedBcryptCompare.mockResolvedValue(false as never);

      await expect(
        AuthService.changePassword(1, 'wrongold', 'newpass123')
      ).rejects.toThrow('Current password is incorrect');
    });

    it('should fail when user not found', async () => {
      mockUserFindByPk.mockResolvedValue(null);

      await expect(
        AuthService.changePassword(999, 'oldpass', 'newpass123')
      ).rejects.toThrow('User not found');
    });
  });

  // ─── getUserById ───────────────────────────────────────────────────

  describe('getUserById', () => {
    it('should return safe user without passwordHash', async () => {
      const mockUser = createMockUser();
      mockUserFindByPk.mockResolvedValue(mockUser);

      const result = await AuthService.getUserById(1);

      expect(result).not.toBeNull();
      expect(result).not.toHaveProperty('passwordHash');
      expect(result!.email).toBe('test@example.com');
    });

    it('should return null for non-existent user', async () => {
      mockUserFindByPk.mockResolvedValue(null);

      const result = await AuthService.getUserById(999);

      expect(result).toBeNull();
    });
  });
});
