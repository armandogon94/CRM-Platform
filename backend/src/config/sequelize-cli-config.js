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
