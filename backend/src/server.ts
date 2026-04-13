import http from 'http';
import app from './app';
import config from './config';
import { testConnection, runMigrations } from './config/database';
import { logger } from './utils/logger';
import { wsService } from './services/WebSocketService';

// ---------------------------------------------------------------------------
// Create HTTP server
// ---------------------------------------------------------------------------
const server = http.createServer(app);

// ---------------------------------------------------------------------------
// WebSocket initialization
// ---------------------------------------------------------------------------
wsService.initialize(server);

// Make io accessible from the app (useful in route handlers)
app.set('io', wsService.getIO());

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------
async function startServer(): Promise<void> {
  try {
    // Test database connection
    await testConnection();

    // Run database migrations
    await runMigrations();

    // Start listening
    server.listen(config.port, () => {
      logger.info(`----------------------------------------------`);
      logger.info(`CRM Platform API Server`);
      logger.info(`Environment : ${config.env}`);
      logger.info(`Port        : ${config.port}`);
      logger.info(`Health      : http://localhost:${config.port}/health`);
      logger.info(`API Base    : http://localhost:${config.port}/api/v1`);
      logger.info(`----------------------------------------------`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// ---------------------------------------------------------------------------
// Graceful shutdown helpers
// ---------------------------------------------------------------------------
function gracefulShutdown(signal: string): void {
  logger.info(`${signal} received. Shutting down gracefully...`);
  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force exit after 10 seconds if graceful shutdown fails
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

// ---------------------------------------------------------------------------
// Process event handlers
// ---------------------------------------------------------------------------
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error.message, error.stack);
  process.exit(1);
});

process.on('unhandledRejection', (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  process.exit(1);
});

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// ---------------------------------------------------------------------------
// Boot
// ---------------------------------------------------------------------------
startServer();

export { server, wsService };
