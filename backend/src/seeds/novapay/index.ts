import { sequelize } from '../../models';
import { seedNovaPayWorkspace, seedNovaPayE2eFixture } from './workspace';
import { seedNovaPayBoards } from './boards';
import { seedMerchants } from './merchants';
import { seedTransactions } from './transactions';
import { seedCompliance } from './compliance';
import { seedAutomations, seedNovaPayE2eFlaggedAutomation } from './automations';

export async function seedNovaPay(): Promise<void> {
  console.log('\n========================================');
  console.log('  NovaPay CRM Seed — Starting');
  console.log('========================================\n');

  const startTime = Date.now();

  // Step 1: Create workspace and users
  const ctx = await seedNovaPayWorkspace();

  // Step 2: Create boards, columns, groups, and views
  const boards = await seedNovaPayBoards(ctx);

  // Step 3: Populate board items and column values
  await seedMerchants(ctx, boards.onboardingBoard);
  await seedTransactions(ctx, boards.transactionBoard);
  await seedCompliance(ctx, boards.complianceBoard);

  // Step 4: Create automation rules
  await seedAutomations(ctx, boards);

  // Step 5: Create isolated E2E fixture workspace (Slice 19 B1) — idempotent
  await seedNovaPayE2eFixture();

  // Step 6: Seed the Flow 5 Status=Flagged → notification automation into the
  // fixture workspace (Slice 19 B2). Must run after step 5 so the fixture
  // workspace + E2E user exist when the rule is wired.
  //
  // Guard: older test suites may `jest.mock` the automations module with only
  // the subset of exports they care about. The guard keeps those mocks working
  // without forcing updates to unrelated test files.
  if (typeof seedNovaPayE2eFlaggedAutomation === 'function') {
    await seedNovaPayE2eFlaggedAutomation();
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('\n========================================');
  console.log(`  NovaPay CRM Seed — Complete (${elapsed}s)`);
  console.log('  Summary:');
  console.log('    - 1 workspace (NovaPay Demo)');
  console.log('    - 8 users');
  console.log('    - 3 boards (Transaction Pipeline, Merchant Onboarding, Compliance)');
  console.log('    - 75 merchants');
  console.log('    - 200 transactions');
  console.log('    - 15 compliance cases');
  console.log('    - 5 automations');
  console.log('========================================\n');
}

// Run standalone: npx ts-node src/seeds/novapay/index.ts
if (require.main === module) {
  (async () => {
    try {
      await sequelize.authenticate();
      console.log('[NovaPay] Database connection established.');
      await sequelize.sync({ force: false });
      await seedNovaPay();
    } catch (error) {
      console.error('[NovaPay] Seed failed:', error);
      process.exit(1);
    } finally {
      await sequelize.close();
    }
  })();
}
