import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import config from '../config';
import User, { UserAttributes } from '../models/User';
import Workspace from '../models/Workspace';

type SafeUser = Omit<UserAttributes, 'passwordHash'>;

function toSafeUser(user: User): SafeUser {
  const { passwordHash, ...safeUser } = user.toJSON() as UserAttributes;
  return safeUser;
}

class AuthService {
  async register(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    workspaceId?: number
  ): Promise<SafeUser> {
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      throw new Error('Email already registered');
    }

    const passwordHash = await bcrypt.hash(password, 12);

    let resolvedWorkspaceId = workspaceId ?? null;

    if (!workspaceId) {
      const slug = `${firstName.toLowerCase()}-${lastName.toLowerCase()}-${Date.now()}`;
      const workspace = await Workspace.create({
        name: `${firstName}'s Workspace`,
        slug,
      });
      resolvedWorkspaceId = workspace.id;
    }

    const user = await User.create({
      email,
      passwordHash,
      firstName,
      lastName,
      workspaceId: resolvedWorkspaceId,
      role: 'admin',
    });

    // Update workspace createdBy if we just created one
    if (!workspaceId && resolvedWorkspaceId) {
      await Workspace.update(
        { createdBy: user.id },
        { where: { id: resolvedWorkspaceId } }
      );
    }

    return toSafeUser(user);
  }

  async login(
    email: string,
    password: string
  ): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    await user.update({ lastLoginAt: new Date() });

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    return {
      user: toSafeUser(user),
      accessToken,
      refreshToken,
    };
  }

  async refreshToken(token: string): Promise<{ accessToken: string }> {
    try {
      const decoded = jwt.verify(token, config.jwt.refreshSecret) as jwt.JwtPayload;
      const userId = decoded.sub as unknown as number;

      const user = await User.findByPk(userId);
      if (!user || !user.isActive) {
        throw new Error('User not found or inactive');
      }

      const accessToken = this.generateAccessToken(user);
      return { accessToken };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
      }
      throw error;
    }
  }

  generateAccessToken(user: User): string {
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn as unknown as number,
    };
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        workspaceId: user.workspaceId,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      },
      config.jwt.secret,
      options
    );
  }

  generateRefreshToken(user: User): string {
    const options: SignOptions = {
      expiresIn: config.jwt.refreshExpiresIn as unknown as number,
    };
    return jwt.sign(
      { sub: user.id },
      config.jwt.refreshSecret,
      options
    );
  }

  async changePassword(
    userId: number,
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const isValidPassword = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Current password is incorrect');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });
  }

  async getUserById(id: number): Promise<SafeUser | null> {
    const user = await User.findByPk(id);
    if (!user) {
      return null;
    }
    return toSafeUser(user);
  }
}

export default new AuthService();
