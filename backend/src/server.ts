import http from 'http';
import app from './app';
import config from './config';
import { testConnection, runMigrations } from './config/database';
import { assertPerfIsolation } from './config/safety-guards';
import { logger } from './utils/logger';
import { wsService } from './services/WebSocketService';

// ---------------------------------------------------------------------------
// Perf-mode safety guard (Slice 19C, Task A3)
// ---------------------------------------------------------------------------
// Runs BEFORE any I/O (DB connect, port bind) so a misconfigured perf run
// aborts with a clear error instead of silently writing to dev/prod state.
// No-op outside `NODE_ENV=perf`. See `config/safety-guards.ts` for details.
try {
  assertPerfIsolation();
} catch (error) {
  // Intentionally bypass the logger so the refusal message is visible even
  // if the logger itself is misconfigured in perf mode.
  // eslint-disable-next-line no-console
  console.error((error as Error).message);
  process.exit(1);
}

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
