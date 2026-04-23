import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import config from './config';
import { isPerfMode } from './config/perf';
import routes from './routes';
import { notFoundHandler, errorHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const HEALTH_PROBE_TIMEOUT_MS = 2000;

/**
 * Race a probe against a timeout; never throws — returns 'ok' or 'error'.
 * Used by /health to keep the endpoint fast and predictable even when a
 * dependency hangs.
 */
async function probeOk(fn: () => Promise<unknown>, timeoutMs: number): Promise<'ok' | 'error'> {
  try {
    await Promise.race([
      fn(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs)),
    ]);
    return 'ok';
  } catch {
    return 'error';
  }
}

// Load model associations before anything uses them
import './models/index';

const app = express();

// ---------------------------------------------------------------------------
// Security middleware
// ---------------------------------------------------------------------------
app.use(helmet());

// ---------------------------------------------------------------------------
// CORS
// ---------------------------------------------------------------------------
app.use(
  cors({
    origin: config.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// ---------------------------------------------------------------------------
// Body parsers
// ---------------------------------------------------------------------------
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------------------------------------------------------------------
// HTTP request logging
//   Skipped in:
//     - test mode (noisy jest output)
//     - perf mode (Slice 19C — morgan's synchronous write skews latency)
// ---------------------------------------------------------------------------
if (config.env !== 'test' && !isPerfMode()) {
  app.use(morgan('dev'));
}

// ---------------------------------------------------------------------------
// Rate limiting
// ---------------------------------------------------------------------------
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please try again later.',
  },
});
app.use('/api', limiter);

// ---------------------------------------------------------------------------
// Health check — probes DB and Redis in parallel with a 2s timeout each.
// Returns 200 + status=ok when both healthy, 503 + status=degraded otherwise.
// ---------------------------------------------------------------------------
app.get('/health', async (_req, res) => {
  // Lazy-imported so test suites that never hit /health don't force the
  // config/database or RedisService modules to load (keeps their mocks inert).
  const { sequelize } = await import('./config/database');
  const { redisService } = await import('./services/RedisService');

  const [db, redis] = await Promise.all([
    probeOk(() => sequelize.authenticate(), HEALTH_PROBE_TIMEOUT_MS),
    probeOk(() => redisService.ping(), HEALTH_PROBE_TIMEOUT_MS),
  ]);

  const healthy = db === 'ok' && redis === 'ok';
  res.status(healthy ? 200 : 503).json({
    status: healthy ? 'ok' : 'degraded',
    db,
    redis,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// ---------------------------------------------------------------------------
// API routes
// ---------------------------------------------------------------------------
app.use('/api/v1', routes);

// ---------------------------------------------------------------------------
// Error handling (must be registered last)
// ---------------------------------------------------------------------------
app.use(notFoundHandler);
app.use(errorHandler);

logger.info('Express application configured.');

export default app;
