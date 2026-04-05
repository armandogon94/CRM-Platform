import { sequelize } from '../../models';
import { seedTableSyncWorkspace } from './workspace';
import { seedTableSyncBoards } from './boards';
import { seedReservations } from './reservations-data';
import { seedMenu } from './menu-data';
import { seedStaffSchedule } from './staff-data';
import { seedAutomations } from './automations';

export async function seedTableSync(): Promise<void> {
  console.log('\n========================================');
  console.log('  TableSync CRM Seed — Starting');
  console.log('========================================\n');

  const startTime = Date.now();

  // Step 1: Create workspace and users
  const ctx = await seedTableSyncWorkspace();

  // Step 2: Create boards, columns, groups, and views
  const boards = await seedTableSyncBoards(ctx);

  // Step 3: Populate board items and column values
  await seedReservations(ctx, boards.reservationBoard);
  await seedMenu(ctx, boards.menuBoard);
  await seedStaffSchedule(ctx, boards.staffBoard);

  // Step 4: Create automation rules
  await seedAutomations(ctx, boards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n========================================');
  console.log(`  TableSync CRM Seed — Complete (${elapsed}s)`);
  console.log('  Summary:');
  console.log('    - 1 workspace (TableSync Demo)');
  console.log('    - 10 users');
  console.log('    - 3 boards (Reservation Board, Menu Management, Staff Schedule)');
  console.log('    - 100 reservations');
  console.log('    - 70 menu items');
  console.log('    - 50 staff schedule records');
  console.log('    - 4 automations');
  console.log('========================================\n');
}

// Run standalone: npx ts-node src/seeds/tablesync/index.ts
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('[TableSync] Database connection established.');
      await sequelize.sync({ force: false });
      await seedTableSync();
    } catch (error) {
      console.error('[TableSync] Seed failed:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
}
