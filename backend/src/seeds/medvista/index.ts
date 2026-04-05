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
