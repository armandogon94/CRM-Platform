import bcrypt from 'bcryptjs';
import {
  sequelize,
  Workspace,
  User,
  Board,
  BoardGroup,
  Column,
  Item,
  ColumnValue,
  BoardView,
  Automation,
  AutomationLog,
  ActivityLog,
  Notification,
  FileAttachment,
} from '../models';

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(message: string): void {
  console.log(`[Seed] ${message}`);
}

function logError(message: string, error?: unknown): void {
  console.error(`[Seed] ERROR: ${message}`, error);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ─── Main seed function ─────────────────────────────────────────────────────

async function seed(): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    // ─── 1. Clear existing data (reverse dependency order) ──────────────
    log('Clearing existing data...');

    await FileAttachment.destroy({ where: {}, force: true, transaction });
    await Notification.destroy({ where: {}, force: true, transaction });
    await ActivityLog.destroy({ where: {}, force: true, transaction });
    await AutomationLog.destroy({ where: {}, force: true, transaction });
    await Automation.destroy({ where: {}, force: true, transaction });
    await ColumnValue.destroy({ where: {}, force: true, transaction });
    await Item.destroy({ where: {}, force: true, transaction });
    await Column.destroy({ where: {}, force: true, transaction });
    await BoardView.destroy({ where: {}, force: true, transaction });
    await BoardGroup.destroy({ where: {}, force: true, transaction });
    await Board.destroy({ where: {}, force: true, transaction });
    await User.destroy({ where: {}, force: true, transaction });
    await Workspace.destroy({ where: {}, force: true, transaction });

    log('All tables cleared.');

    // ─── 2. Create default workspace ────────────────────────────────────
    log('Creating default workspace...');

    const workspace = await Workspace.create(
      {
        name: 'Main Workspace',
        slug: 'main-workspace',
        description: 'The primary workspace for the CRM platform.',
        settings: {},
      },
      { transaction }
    );

    log(`Workspace created: "${workspace.name}" (id: ${workspace.id})`);

    // ─── 3. Create users ────────────────────────────────────────────────
    log('Creating users...');

    const adminHash = await hashPassword('admin');
    const demoHash = await hashPassword('demo123');

    const adminUser = await User.create(
      {
        email: 'admin@crm-platform.com',
        passwordHash: adminHash,
        firstName: 'System',
        lastName: 'Admin',
        role: 'admin',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const ceoUser = await User.create(
      {
        email: 'ceo@crm-platform.com',
        passwordHash: demoHash,
        firstName: 'Platform',
        lastName: 'CEO',
        role: 'admin',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const managerUser = await User.create(
      {
        email: 'manager@crm-platform.com',
        passwordHash: demoHash,
        firstName: 'Project',
        lastName: 'Manager',
        role: 'member',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const memberUser = await User.create(
      {
        email: 'user@crm-platform.com',
        passwordHash: demoHash,
        firstName: 'Team',
        lastName: 'Member',
        role: 'member',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const viewerUser = await User.create(
      {
        email: 'viewer@crm-platform.com',
        passwordHash: demoHash,
        firstName: 'Guest',
        lastName: 'Viewer',
        role: 'viewer',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    log(
      `Users created: ${[adminUser, ceoUser, managerUser, memberUser, viewerUser]
        .map((u) => u.email)
        .join(', ')}`
    );

    // ─── 4. Board 1 — "Getting Started Board" ──────────────────────────
    log('Creating "Getting Started Board"...');

    const board1 = await Board.create(
      {
        name: 'Getting Started Board',
        description: 'A sample board to help you get familiar with the platform.',
        workspaceId: workspace.id,
        createdBy: adminUser.id,
        boardType: 'main',
      },
      { transaction }
    );

    // Groups
    const groupTodo = await BoardGroup.create(
      { boardId: board1.id, name: 'To Do', color: '#579BFC', position: 0 },
      { transaction }
    );
    const groupInProgress = await BoardGroup.create(
      { boardId: board1.id, name: 'In Progress', color: '#FDAB3D', position: 1 },
      { transaction }
    );
    const groupDone = await BoardGroup.create(
      { boardId: board1.id, name: 'Done', color: '#00C875', position: 2 },
      { transaction }
    );

    // Columns
    const b1ColStatus = await Column.create(
      {
        boardId: board1.id,
        name: 'Status',
        columnType: 'status',
        position: 0,
        config: {
          labels: [
            { id: 'working', text: 'Working', color: '#FDAB3D' },
            { id: 'stuck', text: 'Stuck', color: '#E2445C' },
            { id: 'done', text: 'Done', color: '#00C875' },
          ],
        },
      },
      { transaction }
    );

    const b1ColDescription = await Column.create(
      {
        boardId: board1.id,
        name: 'Description',
        columnType: 'text',
        position: 1,
      },
      { transaction }
    );

    const b1ColOwner = await Column.create(
      {
        boardId: board1.id,
        name: 'Owner',
        columnType: 'person',
        position: 2,
      },
      { transaction }
    );

    const b1ColDueDate = await Column.create(
      {
        boardId: board1.id,
        name: 'Due Date',
        columnType: 'date',
        position: 3,
      },
      { transaction }
    );

    const b1ColPriority = await Column.create(
      {
        boardId: board1.id,
        name: 'Priority',
        columnType: 'number',
        position: 4,
        config: { unit: '', min: 1, max: 5 },
      },
      { transaction }
    );

    const b1ColCategory = await Column.create(
      {
        boardId: board1.id,
        name: 'Category',
        columnType: 'dropdown',
        position: 5,
        config: {
          options: [
            { id: 'feature', text: 'Feature' },
            { id: 'bug', text: 'Bug' },
            { id: 'task', text: 'Task' },
          ],
        },
      },
      { transaction }
    );

    // Items — Board 1
    // Item 1: To Do group
    const b1Item1 = await Item.create(
      {
        boardId: board1.id,
        groupId: groupTodo.id,
        name: 'Set up project repository',
        position: 0,
        createdBy: adminUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b1Item1.id, columnId: b1ColStatus.id, value: { label: 'working' } },
        { itemId: b1Item1.id, columnId: b1ColDescription.id, value: { text: 'Initialize the Git repo and configure CI/CD pipeline.' } },
        { itemId: b1Item1.id, columnId: b1ColOwner.id, value: { userId: managerUser.id } },
        { itemId: b1Item1.id, columnId: b1ColDueDate.id, value: { date: '2026-04-15' } },
        { itemId: b1Item1.id, columnId: b1ColPriority.id, value: { number: 5 } },
        { itemId: b1Item1.id, columnId: b1ColCategory.id, value: { selected: 'task' } },
      ],
      { transaction }
    );

    // Item 2: To Do group
    const b1Item2 = await Item.create(
      {
        boardId: board1.id,
        groupId: groupTodo.id,
        name: 'Design landing page',
        position: 1,
        createdBy: ceoUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b1Item2.id, columnId: b1ColStatus.id, value: { label: 'stuck' } },
        { itemId: b1Item2.id, columnId: b1ColDescription.id, value: { text: 'Create wireframes and mockups for the main landing page.' } },
        { itemId: b1Item2.id, columnId: b1ColOwner.id, value: { userId: memberUser.id } },
        { itemId: b1Item2.id, columnId: b1ColDueDate.id, value: { date: '2026-04-20' } },
        { itemId: b1Item2.id, columnId: b1ColPriority.id, value: { number: 4 } },
        { itemId: b1Item2.id, columnId: b1ColCategory.id, value: { selected: 'feature' } },
      ],
      { transaction }
    );

    // Item 3: In Progress group
    const b1Item3 = await Item.create(
      {
        boardId: board1.id,
        groupId: groupInProgress.id,
        name: 'Implement user authentication',
        position: 0,
        createdBy: managerUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b1Item3.id, columnId: b1ColStatus.id, value: { label: 'working' } },
        { itemId: b1Item3.id, columnId: b1ColDescription.id, value: { text: 'Build JWT-based login and registration flows.' } },
        { itemId: b1Item3.id, columnId: b1ColOwner.id, value: { userId: managerUser.id } },
        { itemId: b1Item3.id, columnId: b1ColDueDate.id, value: { date: '2026-04-10' } },
        { itemId: b1Item3.id, columnId: b1ColPriority.id, value: { number: 5 } },
        { itemId: b1Item3.id, columnId: b1ColCategory.id, value: { selected: 'feature' } },
      ],
      { transaction }
    );

    // Item 4: In Progress group
    const b1Item4 = await Item.create(
      {
        boardId: board1.id,
        groupId: groupInProgress.id,
        name: 'Fix navigation menu bug',
        position: 1,
        createdBy: memberUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b1Item4.id, columnId: b1ColStatus.id, value: { label: 'working' } },
        { itemId: b1Item4.id, columnId: b1ColDescription.id, value: { text: 'Navigation dropdown closes unexpectedly on mobile.' } },
        { itemId: b1Item4.id, columnId: b1ColOwner.id, value: { userId: memberUser.id } },
        { itemId: b1Item4.id, columnId: b1ColDueDate.id, value: { date: '2026-04-08' } },
        { itemId: b1Item4.id, columnId: b1ColPriority.id, value: { number: 3 } },
        { itemId: b1Item4.id, columnId: b1ColCategory.id, value: { selected: 'bug' } },
      ],
      { transaction }
    );

    // Item 5: Done group
    const b1Item5 = await Item.create(
      {
        boardId: board1.id,
        groupId: groupDone.id,
        name: 'Define project requirements',
        position: 0,
        createdBy: ceoUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b1Item5.id, columnId: b1ColStatus.id, value: { label: 'done' } },
        { itemId: b1Item5.id, columnId: b1ColDescription.id, value: { text: 'Gathered stakeholder input and documented all functional requirements.' } },
        { itemId: b1Item5.id, columnId: b1ColOwner.id, value: { userId: ceoUser.id } },
        { itemId: b1Item5.id, columnId: b1ColDueDate.id, value: { date: '2026-03-30' } },
        { itemId: b1Item5.id, columnId: b1ColPriority.id, value: { number: 5 } },
        { itemId: b1Item5.id, columnId: b1ColCategory.id, value: { selected: 'task' } },
      ],
      { transaction }
    );

    // Board 1 — Default table view
    await BoardView.create(
      {
        boardId: board1.id,
        name: 'Main Table',
        viewType: 'table',
        isDefault: true,
        createdBy: adminUser.id,
        settings: {},
      },
      { transaction }
    );

    log('"Getting Started Board" created with 3 groups, 6 columns, 5 items, and 1 view.');

    // ─── 5. Board 2 — "Project Tracker" ─────────────────────────────────
    log('Creating "Project Tracker" board...');

    const board2 = await Board.create(
      {
        name: 'Project Tracker',
        description: 'Track active and completed projects across the team.',
        workspaceId: workspace.id,
        createdBy: ceoUser.id,
        boardType: 'main',
      },
      { transaction }
    );

    // Groups
    const groupActive = await BoardGroup.create(
      { boardId: board2.id, name: 'Active Projects', color: '#579BFC', position: 0 },
      { transaction }
    );
    const groupCompleted = await BoardGroup.create(
      { boardId: board2.id, name: 'Completed', color: '#00C875', position: 1 },
      { transaction }
    );

    // Columns
    const b2ColStatus = await Column.create(
      {
        boardId: board2.id,
        name: 'Status',
        columnType: 'status',
        position: 0,
        config: {
          labels: [
            { id: 'on_track', text: 'On Track', color: '#00C875' },
            { id: 'at_risk', text: 'At Risk', color: '#FDAB3D' },
            { id: 'off_track', text: 'Off Track', color: '#E2445C' },
            { id: 'completed', text: 'Completed', color: '#00C875' },
          ],
        },
      },
      { transaction }
    );

    const b2ColSummary = await Column.create(
      {
        boardId: board2.id,
        name: 'Summary',
        columnType: 'text',
        position: 1,
      },
      { transaction }
    );

    const b2ColTimeline = await Column.create(
      {
        boardId: board2.id,
        name: 'Timeline',
        columnType: 'timeline',
        position: 2,
      },
      { transaction }
    );

    const b2ColLead = await Column.create(
      {
        boardId: board2.id,
        name: 'Lead',
        columnType: 'person',
        position: 3,
      },
      { transaction }
    );

    const b2ColRating = await Column.create(
      {
        boardId: board2.id,
        name: 'Confidence',
        columnType: 'rating',
        position: 4,
        config: { max: 5 },
      },
      { transaction }
    );

    // Items — Board 2
    // Item 1: Active
    const b2Item1 = await Item.create(
      {
        boardId: board2.id,
        groupId: groupActive.id,
        name: 'CRM Platform v1.0',
        position: 0,
        createdBy: ceoUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b2Item1.id, columnId: b2ColStatus.id, value: { label: 'on_track' } },
        { itemId: b2Item1.id, columnId: b2ColSummary.id, value: { text: 'Full-stack CRM platform with boards, automations, and dashboards.' } },
        { itemId: b2Item1.id, columnId: b2ColTimeline.id, value: { start: '2026-03-01', end: '2026-06-30' } },
        { itemId: b2Item1.id, columnId: b2ColLead.id, value: { userId: managerUser.id } },
        { itemId: b2Item1.id, columnId: b2ColRating.id, value: { rating: 4 } },
      ],
      { transaction }
    );

    // Item 2: Active
    const b2Item2 = await Item.create(
      {
        boardId: board2.id,
        groupId: groupActive.id,
        name: 'Mobile App Redesign',
        position: 1,
        createdBy: managerUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b2Item2.id, columnId: b2ColStatus.id, value: { label: 'at_risk' } },
        { itemId: b2Item2.id, columnId: b2ColSummary.id, value: { text: 'Redesign the mobile app with new branding and UX patterns.' } },
        { itemId: b2Item2.id, columnId: b2ColTimeline.id, value: { start: '2026-02-15', end: '2026-05-15' } },
        { itemId: b2Item2.id, columnId: b2ColLead.id, value: { userId: memberUser.id } },
        { itemId: b2Item2.id, columnId: b2ColRating.id, value: { rating: 3 } },
      ],
      { transaction }
    );

    // Item 3: Completed
    const b2Item3 = await Item.create(
      {
        boardId: board2.id,
        groupId: groupCompleted.id,
        name: 'Q1 Marketing Campaign',
        position: 0,
        createdBy: ceoUser.id,
      },
      { transaction }
    );

    await ColumnValue.bulkCreate(
      [
        { itemId: b2Item3.id, columnId: b2ColStatus.id, value: { label: 'completed' } },
        { itemId: b2Item3.id, columnId: b2ColSummary.id, value: { text: 'Multi-channel marketing campaign targeting enterprise customers.' } },
        { itemId: b2Item3.id, columnId: b2ColTimeline.id, value: { start: '2026-01-01', end: '2026-03-31' } },
        { itemId: b2Item3.id, columnId: b2ColLead.id, value: { userId: ceoUser.id } },
        { itemId: b2Item3.id, columnId: b2ColRating.id, value: { rating: 5 } },
      ],
      { transaction }
    );

    // Board 2 — Views: Table + Kanban
    await BoardView.create(
      {
        boardId: board2.id,
        name: 'Table View',
        viewType: 'table',
        isDefault: true,
        createdBy: ceoUser.id,
        settings: {},
      },
      { transaction }
    );

    await BoardView.create(
      {
        boardId: board2.id,
        name: 'Kanban View',
        viewType: 'kanban',
        isDefault: false,
        createdBy: ceoUser.id,
        settings: {
          groupByColumn: b2ColStatus.id,
        },
      },
      { transaction }
    );

    log('"Project Tracker" created with 2 groups, 5 columns, 3 items, and 2 views.');

    // ─── Commit ─────────────────────────────────────────────────────────
    await transaction.commit();

    log('──────────────────────────────────────────────');
    log('Database seeded successfully!');
    log('');
    log('Users:');
    log('  admin@crm-platform.com   / admin    (admin)');
    log('  ceo@crm-platform.com     / demo123  (admin)');
    log('  manager@crm-platform.com / demo123  (member)');
    log('  user@crm-platform.com    / demo123  (member)');
    log('  viewer@crm-platform.com  / demo123  (viewer)');
    log('');
    log('Boards:');
    log('  1. Getting Started Board  (3 groups, 6 columns, 5 items)');
    log('  2. Project Tracker        (2 groups, 5 columns, 3 items)');
    log('──────────────────────────────────────────────');
  } catch (error) {
    await transaction.rollback();
    logError('Seed failed — transaction rolled back.', error);
    throw error;
  }
}

// ─── Run seed when executed directly ────────────────────────────────────────

// ─── Industry Seeders ───────────────────────────────────────────────────────
import { seedMedVista } from './medvista';
import { seedUrbanNest } from './urbannest';
import { seedJurisPath } from './jurispath';

async function run(): Promise<void> {
  try {
    log('Connecting to database...');
    await sequelize.authenticate();
    log('Database connection established.');

    await seed();

    // Seed industry verticals
    log('Seeding industry verticals...');
    await seedMedVista();
    await seedUrbanNest();
    await seedJurisPath();
    log('All industry verticals seeded.');
  } catch (error) {
    logError('Seed process failed.', error);
    process.exit(1);
  } finally {
    await sequelize.close();
    log('Database connection closed.');
  }
}

run();

export default seed;
