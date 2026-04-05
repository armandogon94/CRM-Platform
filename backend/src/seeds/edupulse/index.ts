import { seedEduPulseWorkspace } from './workspace';
import { seedEduPulseBoards } from './boards';
import { seedStudents } from './students-data';
import { seedCourses } from './courses-data';
import { seedAssignments } from './assignments-data';
import { seedEduPulseAutomations } from './automations';

export async function seedEduPulse(): Promise<void> {
  const startTime = Date.now();
  console.log('═══════════════════════════════════════════════════════════');
  console.log(' EduPulse Education Platform — Full Seed');
  console.log('═══════════════════════════════════════════════════════════');

  // Step 1: Workspace + Users (12 users: admin, principal, dean, counselor, 6 teachers, registrar, viewer)
  const ctx = await seedEduPulseWorkspace();

  // Step 2: Board Templates (3 boards with columns, groups & views)
  const boards = await seedEduPulseBoards(ctx);

  // Step 3: Seed data (100 students + 30 courses + 60 assignments)
  await seedStudents(ctx, boards);
  await seedCourses(ctx, boards);
  await seedAssignments(ctx, boards);

  // Step 4: Automation rules (4 automations)
  await seedEduPulseAutomations(ctx, boards);

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('───────────────────────────────────────────────────────────');
  console.log(` EduPulse seed complete in ${elapsed}s`);
  console.log('  • 1 workspace with 12 users (6 teachers)');
  console.log('  • 3 board templates (Student Enrollment, Course Management, Assignment Tracker)');
  console.log('  • 100 student records');
  console.log('  • 30 course records');
  console.log('  • 60 assignment records');
  console.log('  • 4 automation rules');
  console.log('═══════════════════════════════════════════════════════════');
}

// Allow direct execution: npx ts-node src/seeds/edupulse/index.ts
if (require.main === module) {
  // Import models to register associations before seeding
  import('../../models/index').then(() => {
    seedEduPulse()
      .then(() => process.exit(0))
      .catch((err) => {
        console.error('[EduPulse] Seed failed:', err);
        process.exit(1);
      });
  });
}
