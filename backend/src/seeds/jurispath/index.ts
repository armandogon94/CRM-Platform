import { sequelize } from '../../models';
import { seedJurisPathWorkspace } from './workspace';
import { seedJurisPathBoards } from './boards';
import { seedClients } from './clients';
import { seedCases } from './cases';
import { seedInvoices } from './invoices';
import { seedAutomations } from './automations';

export async function seedJurisPath(): Promise<void> {
  console.log('\n========================================');
  console.log('  JurisPath CRM Seed — Starting');
  console.log('========================================\n');

  const startTime = Date.now();

  // Step 1: Create workspace and users (25 attorneys + support staff)
  const ctx = await seedJurisPathWorkspace();

  // Step 2: Create boards, columns, groups, and views
  const boards = await seedJurisPathBoards(ctx);

  // Step 3: Populate board items and column values
  await seedCases(ctx, boards.caseBoard);
  await seedClients(ctx, boards.intakeBoard);
  await seedInvoices(ctx, boards.billingBoard);

  // Step 4: Create automation rules
  await seedAutomations(ctx, boards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n========================================');
  console.log(`  JurisPath CRM Seed — Complete (${elapsed}s)`);
  console.log('  Summary:');
  console.log('    - 1 workspace (JurisPath Legal)');
  console.log('    - 28 users (25 attorneys + 3 support)');
  console.log('    - 3 boards (Case Management, Client Intake, Billing Tracker)');
  console.log('    - 60 cases');
  console.log('    - 100 clients');
  console.log('    - 50 invoices');
  console.log('    - 4 automations');
  console.log('========================================\n');
}

// Run standalone: npx ts-node src/seeds/jurispath/index.ts
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('[JurisPath] Database connection established.');
      await sequelize.sync({ force: false });
      await seedJurisPath();
    } catch (error) {
      console.error('[JurisPath] Seed failed:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
}
