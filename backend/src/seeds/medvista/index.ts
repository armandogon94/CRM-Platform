import { seedMedVistaWorkspace } from './workspace';
import { seedMedVistaBoards } from './boards';
import { seedMedVistaData } from './data';
import { seedMedVistaAutomations } from './automations';

export async function seedMedVista(): Promise<void> {
  console.log('=== Seeding MedVista Healthcare CRM ===');
  const ctx = await seedMedVistaWorkspace();
  const boards = await seedMedVistaBoards(ctx);
  await seedMedVistaData(ctx, boards);
  await seedMedVistaAutomations(ctx, boards);
  console.log('=== MedVista seeding complete ===');
}

if (require.main === module) {
  // Import models to register associations before seeding
  import('../../models/index').then(() => {
    (async () => {
      try {
        await seedMedVista();
        process.exit(0);
      } catch (err) {
        console.error(err);
        process.exit(1);
      }
    })();
  });
}
