import { Sequelize, Options } from 'sequelize';
import dotenv from 'dotenv';
import { isPerfMode, perfDatabaseName } from './perf';

dotenv.config();

const isDevEnvironment = process.env.NODE_ENV === 'development';
const perfEnvironment = isPerfMode();

// Perf mode (Slice 19C, Task A2) widens the pool so Artillery's concurrent
// VUs don't queue on `pool.acquire`, silences SQL logging (logging I/O
// skews latency measurements), and targets the isolated `crm_perf`
// database so dev/prod data is never touched. All other environments keep
// their prior behaviour — this is a strictly additive branch.
const dbConfig: Options = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  dialect: 'postgres',
  logging: perfEnvironment
    ? false
    : isDevEnvironment
    ? (msg: string) => console.log(`[SQL] ${msg}`)
    : false,
  pool: perfEnvironment
    ? { min: 0, max: 20, acquire: 30000, idle: 10000 }
    : { min: 2, max: 10, acquire: 30000, idle: 10000 },
  define: {
    timestamps: true,
    underscored: true,
    freezeTableName: true,
  },
};

const defaultDatabaseName = perfEnvironment ? perfDatabaseName : 'crm_platform';

const sequelize = new Sequelize(
  process.env.DB_NAME || defaultDatabaseName,
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

/**
 * @deprecated Use migrations instead: `npx sequelize-cli db:migrate`
 * Retained for test environments that need fast schema setup.
 */
export async function syncDatabase(force = false): Promise<void> {
  try {
    await sequelize.sync({ force });
    console.log('[Database] Models synchronized successfully.');
  } catch (error) {
    console.error('[Database] Sync failed:', error);
    throw error;
  }
}

export async function runMigrations(): Promise<void> {
  const { Umzug, SequelizeStorage } = await import('umzug');
  const path = await import('path');

  const umzug = new Umzug({
    migrations: {
      glob: path.join(__dirname, '../migrations/*.js'),
    },
    context: sequelize.getQueryInterface(),
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });

  await umzug.up();
  console.log('[Database] Migrations complete.');
}

export { sequelize };
export default sequelize;
