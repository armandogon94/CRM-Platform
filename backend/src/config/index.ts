import dotenv from 'dotenv';

dotenv.config();

export interface DatabaseConfig {
  host: string;
  port: number;
  name: string;
  user: string;
  password: string;
}

export interface JwtConfig {
  secret: string;
  refreshSecret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface RateLimitConfig {
  windowMs: number;
  max: number;
}

export interface UploadConfig {
  dir: string;
  maxFileSize: number;
  maxWorkspaceStorage: number;
}

export interface AppConfig {
  env: string;
  port: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  redisUrl: string;
  corsOrigins: string[];
  rateLimit: RateLimitConfig;
  upload: UploadConfig;
}

const config: AppConfig = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '13000', 10),

  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    name: process.env.DB_NAME || 'crm_platform',
    user: process.env.DB_USER || 'crm_admin',
    password: process.env.DB_PASSWORD || 'crm_secret_2026',
  },

  jwt: {
    secret: process.env.JWT_SECRET || 'crm-jwt-secret-key-2026-very-long-and-secure',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'crm-jwt-refresh-secret-key-2026-very-long',
    expiresIn: process.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',

  corsOrigins: (process.env.CORS_ORIGINS || 'http://localhost:13001').split(','),

  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
    max: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
  },

  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760', 10),
    maxWorkspaceStorage: parseInt(process.env.MAX_WORKSPACE_STORAGE || '524288000', 10),
  },
};

export default config;
