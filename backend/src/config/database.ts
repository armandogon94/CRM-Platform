import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';

dotenv.config();

const isDevEnvironment = process.env.NODE_ENV === 'development';

const dbConfig: Options = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: isDevEnvironment ? (msg: string) => console.log(`[SQL] ${msg}`) : false,
  pool: {
    min: 2,
    max: 10,
    acquire: 30000,
    idle: 10000,
  },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

const sequelize = new Sequelize(
  process.env.DB_NAME || 'crm_platform',
  process.env.DB_USER || 'crm_admin',
  process.env.DB_PASSWORD || 'crm_secret_2026',
  dbConfig
);

export async function testConnection(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('[Database] Connection established successfully.');
  } catch (error) {
    console.error('[Database] Unable to connect:', error);
    throw error;
  }
}

export async function syncDatabase(force = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log('[Database] Models synchronized successfully.');
  } catch (error) {
    console.error('[Database] Sync failed:', error);
    throw error;
  }
}

export { sequelize };
export default sequelize;
