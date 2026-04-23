require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER || 'crm_admin',
    password: process.env.DB_PASSWORD || 'crm_secret_2026',
    database: process.env.DB_NAME || 'crm_platform',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
  },
  test: {
    username: process.env.DB_USER || 'crm_admin',
    password: process.env.DB_PASSWORD || 'crm_secret_2026',
    database: process.env.DB_NAME || 'crm_platform_test',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
  },
  // Slice 19C Task A2 — perf runtime targets the isolated `crm_perf` DB.
  // Mirrors the runtime branch in src/config/database.ts so that
  // `NODE_ENV=perf npx sequelize-cli db:migrate` applies migrations to the
  // perf database. Pool/logging tuning is runtime-only (sequelize-cli uses
  // its own short-lived connection), so we only override `database` here.
  perf: {
    username: process.env.DB_USER || 'crm_admin',
    password: process.env.DB_PASSWORD || 'crm_secret_2026',
    database: process.env.DB_NAME || 'crm_perf',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
    logging: false,
  },
};
