import { seedDentaFlowWorkspace } from './workspace';
import { seedDentaFlowBoards } from './boards';
import { seedPatients } from './patients-data';
import { seedAppointments } from './appointments-data';
import { seedTreatments } from './treatments-data';
import { seedDentaFlowAutomations } from './automations';

export async function seedDentaFlow(): Promise<void> {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' DentaFlow Dental Clinic — Full Seed');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Workspace + Users (12 users: admin, office mgr, 6 dentists, 2 hygienists, front desk, viewer)
  const ctx = await seedDentaFlowWorkspace();

  // Step 2: Board Templates (3 boards with columns, groups & views)
  const boards = await seedDentaFlowBoards(ctx);

  // Step 3: Seed data (80 patients + 50 appointments + 30 treatment plans)
  await seedPatients(ctx, boards);
  await seedAppointments(ctx, boards);
  await seedTreatments(ctx, boards);

  // Step 4: Automation rules (4 automations)
  await seedDentaFlowAutomations(ctx, boards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('───────────────────────────────────────────────────────────');
  console.log(` DentaFlow seed complete in ${elapsed}s`);
  console.log('  • 1 workspace with 12 users (6 dentists)');
  console.log('  • 3 board templates (Patient Pipeline, Appointment Board, Treatment Plans)');
  console.log('  • 80 patient records');
  console.log('  • 50 appointment records');
  console.log('  • 30 treatment plan records');
  console.log('  • 4 automation rules');
  console.log('═══════════════════════════════════════════════════════════');
}

// Allow direct execution: npx ts-node src/seeds/dentaflow/index.ts
if (require.main === module) {
  // Import models to register associations before seeding
  import('../../models/index').then(() => {
    seedDentaFlow()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('[DentaFlow] Seed failed:', err);
        process.exit(1);
      });
  });
}
