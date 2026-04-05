import { seedUrbanNestWorkspace } from './workspace';
import { seedUrbanNestBoards } from './boards';
import { seedProperties } from './properties';
import { seedLeads } from './leads';
import { seedShowings } from './showings';
import { seedUrbanNestAutomations } from './automations';

export async function seedUrbanNest(): Promise<void> {
  console.log('=== Seeding UrbanNest Real Estate CRM ===');
  const ctx = await seedUrbanNestWorkspace();
  const boards = await seedUrbanNestBoards(ctx);
  await seedProperties(ctx, boards.propertyListings);
  await seedLeads(ctx, boards.leadPipeline);
  await seedShowings(ctx, boards.showingScheduler);
  await seedUrbanNestAutomations(ctx, boards);
  console.log('=== UrbanNest seeding complete ===');
  console.log('');
  console.log('UrbanNest Users:');
  console.log('  admin@urbannest.com              / demo123  (admin)');
  console.log('  broker@urbannest.com             / demo123  (admin)');
  console.log('  sarah.agent@urbannest.com        / demo123  (member)');
  console.log('  marcus.agent@urbannest.com       / demo123  (member)');
  console.log('  elena.agent@urbannest.com        / demo123  (member)');
  console.log('  james.agent@urbannest.com        / demo123  (member)');
  console.log('  olivia.agent@urbannest.com       / demo123  (member)');
  console.log('  nathan.agent@urbannest.com       / demo123  (member)');
  console.log('  coordinator@urbannest.com        / demo123  (member)');
  console.log('  viewer@urbannest.com             / demo123  (viewer)');
  console.log('');
  console.log('UrbanNest Boards:');
  console.log('  1. Lead Pipeline       (6 groups, 10 columns, 80 leads)');
  console.log('  2. Property Listings   (4 groups, 12 columns, 60 properties)');
  console.log('  3. Showing Scheduler   (3 groups, 8 columns, 30 showings)');
  console.log('  4 automation rules active');
}
