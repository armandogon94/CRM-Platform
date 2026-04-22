/**
 * reset-e2e CLI — Slice 19, Task A5.
 *
 * Thin adapter around E2EResetService so the fixture workspace can be
 * reset from a shell (docker compose exec backend npm run reset:e2e)
 * without going through the HTTP surface. The HTTP route in A4 may be
 * disabled in some environments (e.g. when `E2E_RESET_ENABLED` is
 * unset); the CLI path exists so operators and CI always have a
 * working entrypoint.
 *
 * Both adapters MUST share the same core so cleanup behavior stays
 * identical — all real logic lives in `E2EResetService.reset()`.
 *
 * Safety rail: refuses to run when NODE_ENV === 'production'. This is
 * belt-and-suspenders; the service itself only touches rows flagged
 * `is_e2e_fixture = true`, but we refuse at the entry point too so an
 * accidental invocation in prod never reaches the DB.
 */

import e2eResetService from '../services/E2EResetService';

export async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    const message =
      'Refusing to run reset-e2e: NODE_ENV=production. This script is for test/dev environments only.';
    process.stderr.write(`${message}\n`);
    throw new Error(message);
  }

  const result = await e2eResetService.reset();

  if (result === null) {
    process.stdout.write(
      'E2E workspace reset complete: no fixture workspace found (first-boot case — run seed first).\n'
    );
    return;
  }

  process.stdout.write(
    `E2E workspace reset complete (workspaceId=${result.workspaceId}).\n`
  );
}

// Auto-run only when invoked directly (e.g. `ts-node src/scripts/reset-e2e.ts`).
// Importing the module from tests must NOT trigger execution.
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      // `main()` already wrote a refusal message for the prod case; other
      // failures get the raw error so operators can debug DB/seed issues.
      if (!(err instanceof Error) || !/Refusing to run reset-e2e/.test(err.message)) {
        console.error(err);
      }
      process.exit(1);
    });
}
