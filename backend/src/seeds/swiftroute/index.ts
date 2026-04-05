import { seedSwiftRouteWorkspace } from './workspace';
import { seedSwiftRouteBoards } from './boards';
import { seedShipments } from './shipments-data';
import { seedRoutes } from './routes-data';
import { seedFleet } from './fleet-data';
import { seedSwiftRouteAutomations } from './automations';

export async function seedSwiftRoute(): Promise<void> {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' SwiftRoute Logistics — Full Seed');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Workspace + Users (120 drivers + 11 staff = 131 users)
  const ctx = await seedSwiftRouteWorkspace();

  // Step 2: Board Templates (3 boards with columns & groups)
  const boards = await seedSwiftRouteBoards(ctx);

  // Step 3: Seed data (100 shipments + 50 routes + 30 vehicles)
  await seedShipments(ctx, boards);
  await seedRoutes(ctx, boards);
  await seedFleet(ctx, boards);

  // Step 4: Automation rules (4 automations)
  await seedSwiftRouteAutomations(ctx, boards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('───────────────────────────────────────────────────────────');
  console.log(` SwiftRoute seed complete in ${elapsed}s`);
  console.log('  • 1 workspace with 131 users (120 drivers + 11 staff)');
  console.log('  • 3 board templates (Shipment Tracker, Route Board, Fleet & Vehicle Tracking)');
  console.log('  • 100 shipment records');
  console.log('  • 50 route records');
  console.log('  • 30 vehicle records');
  console.log('  • 4 automation rules');
  console.log('═══════════════════════════════════════════════════════════');
}

// Allow direct execution: npx ts-node src/seeds/swiftroute/index.ts
if (require.main === module) {
  // Import models to register associations before seeding
  import('../../models/index').then(() => {
    seedSwiftRoute()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('[SwiftRoute] Seed failed:', err);
        process.exit(1);
      });
  });
}
