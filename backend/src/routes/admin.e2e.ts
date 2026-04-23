/**
 * POST /api/v1/admin/e2e/reset — Slice 19, Task A4.
 *
 * Wipes and re-seeds the dedicated E2E fixture workspace. Gated by a
 * double-guard so the route cannot be enabled accidentally in production:
 *
 *   1. Env guard: NODE_ENV must NOT be 'production' AND
 *      E2E_RESET_ENABLED must === 'true'. Failing either check short-
 *      circuits with a 404 — 403 would confirm the route exists.
 *   2. JWT: `authenticate` middleware runs after the env guard so a valid
 *      session is still required even when the endpoint is enabled
 *      (defense in depth; limits blast radius if the flag leaks).
 *
 * The handler delegates all business logic to E2EResetService.reset()
 * (Task A3) so the HTTP and CLI (Task A5) adapters stay identical.
 */

import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth';
import { isPerfMode } from '../config/perf';
import E2EResetService from '../services/E2EResetService';
import { seedNovaPayE2eFixture } from '../seeds/novapay/workspace';
import { seedNovaPayE2eFlaggedAutomation } from '../seeds/novapay/automations';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types';

/**
 * Re-populates the fixture workspace after the service has cascade-deleted
 * its rows. Without this, subsequent /reset calls within a single container
 * lifecycle would leave the fixture empty and downstream specs would fail
 * at "board not found". Runs inside the same transaction as the destroys.
 */
async function rebuildFixture(): Promise<void> {
  await seedNovaPayE2eFixture();
  await seedNovaPayE2eFlaggedAutomation();
}

/**
 * Env-guard middleware. Must come BEFORE `authenticate` so unauthenticated
 * probes get the same 404 response and cannot distinguish "route hidden"
 * from "route requires auth".
 *
 * Returns 404 when ANY of the following hold:
 *   - `NODE_ENV=production` (this route must never ship to prod)
 *   - `NODE_ENV=perf` (Slice 19C — perf runs must not mutate workspace
 *     state; defence in depth alongside the compose-level isolation)
 *   - `E2E_RESET_ENABLED` is anything other than the literal string `"true"`
 */
export function e2eEnvGuard(req: Request, res: Response, next: NextFunction): void {
  const isProd = process.env.NODE_ENV === 'production';
  const enabled = process.env.E2E_RESET_ENABLED === 'true';

  if (isProd || isPerfMode() || !enabled) {
    const response: ApiResponse = {
      success: false,
      error: `Route not found: ${req.method} ${req.originalUrl}`,
    };
    res.status(404).json(response);
    return;
  }
  next();
}

const router = Router();

router.post('/reset', e2eEnvGuard, authenticate, async (_req, res) => {
  try {
    const result = await E2EResetService.reset({ reseed: rebuildFixture });
    res.status(200).json({
      ok: true,
      workspaceId: result?.workspaceId ?? null,
    });
  } catch (err) {
    logger.error(
      `E2E reset failed: ${err instanceof Error ? err.message : String(err)}`
    );
    const response: ApiResponse = {
      success: false,
      error: 'E2E reset failed.',
    };
    res.status(500).json(response);
  }
});

export default router;
