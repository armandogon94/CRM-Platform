import { seedTrustGuardWorkspace } from './workspace';
import { seedTrustGuardBoards } from './boards';
import { seedPolicies } from './policies-data';
import { seedClaims } from './claims-data';
import { seedProspects } from './prospects-data';
import { seedTrustGuardAutomations } from './automations';

export async function seedTrustGuard(): Promise<void> {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' TrustGuard Insurance — Full Seed');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Workspace + Users (20 users)
  const ctx = await seedTrustGuardWorkspace();

  // Step 2: Board Templates (3 boards with columns & groups)
  const boards = await seedTrustGuardBoards(ctx);

  // Step 3: Seed data (80 policies + 50 claims + 30 prospects)
  await seedPolicies(ctx, boards);
  await seedClaims(ctx, boards);
  await seedProspects(ctx, boards);

  // Step 4: Automation rules (4 automations)
  await seedTrustGuardAutomations(ctx, boards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('───────────────────────────────────────────────────────────');
  console.log(` TrustGuard seed complete in ${elapsed}s`);
  console.log('  • 1 workspace with 20 users');
  console.log('  • 3 board templates (Claims Pipeline, Policy Lifecycle, Underwriting Queue)');
  console.log('  • 80 policy records');
  console.log('  • 50 claim records');
  console.log('  • 30 prospect / underwriting records');
  console.log('  • 4 automation rules');
  console.log('═══════════════════════════════════════════════════════════');
}

// Allow direct execution: npx ts-node src/seeds/trustguard/index.ts
if (require.main === module) {
  // Import models to register associations before seeding
  import('../../models/index').then(() => {
    seedTrustGuard()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('[TrustGuard] Seed failed:', err);
        process.exit(1);
      });
  });
}
