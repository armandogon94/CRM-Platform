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
} from '../../models';

// ─── Helpers ────────────────────────────────────────────────────────────────

function log(message: string): void {
  console.log(`[CraneStack Seed] ${message}`);
}

function logError(message: string, error?: unknown): void {
  console.error(`[CraneStack Seed] ERROR: ${message}`, error);
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// ─── Main seed function ─────────────────────────────────────────────────────

export async function seedCraneStack(): Promise<void> {
  const transaction = await sequelize.transaction();

  try {
    // ─── 1. Workspace ────────────────────────────────────────────────────
    log('Creating CraneStack workspace...');
    const workspace = await Workspace.create(
      {
        name: 'CraneStack',
        slug: 'cranestack',
        description: 'Construction project management and general contracting platform.',
        settings: {
          brandColor: '#EA580C',
          secondaryColor: '#C2410C',
          accentColor: '#FB923C',
          industry: 'construction',
          tagline: 'Build Smarter. Deliver Faster.',
          logo: 'cranestack-logo.svg',
        },
      },
      { transaction }
    );
    log(`Workspace created: "${workspace.name}" (id: ${workspace.id})`);

    // ─── 3. Users ────────────────────────────────────────────────────────
    log('Creating users...');
    const adminHash = await hashPassword('admin');
    const demoHash = await hashPassword('demo123');

    const adminUser = await User.create(
      {
        email: 'admin@cranestack.com',
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
        email: 'ceo@cranestack.com',
        passwordHash: demoHash,
        firstName: 'Marcus',
        lastName: 'Crane',
        role: 'admin',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const pmUser = await User.create(
      {
        email: 'pm@cranestack.com',
        passwordHash: demoHash,
        firstName: 'Sarah',
        lastName: 'Nguyen',
        role: 'member',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const siteManager = await User.create(
      {
        email: 'site@cranestack.com',
        passwordHash: demoHash,
        firstName: 'Jake',
        lastName: 'Morrison',
        role: 'member',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const safetyOfficer = await User.create(
      {
        email: 'safety@cranestack.com',
        passwordHash: demoHash,
        firstName: 'Linda',
        lastName: 'Castillo',
        role: 'member',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const estimator = await User.create(
      {
        email: 'estimator@cranestack.com',
        passwordHash: demoHash,
        firstName: 'Tony',
        lastName: 'Russo',
        role: 'member',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const viewerUser = await User.create(
      {
        email: 'viewer@cranestack.com',
        passwordHash: demoHash,
        firstName: 'Guest',
        lastName: 'Viewer',
        role: 'viewer',
        workspaceId: workspace.id,
        isActive: true,
      },
      { transaction }
    );

    const users = [adminUser, ceoUser, pmUser, siteManager, safetyOfficer, estimator, viewerUser];
    log(`Users created: ${users.map((u) => u.email).join(', ')}`);

    // =====================================================================
    // BOARD 1 — PROJECT PIPELINE
    // =====================================================================
    log('Creating "Project Pipeline" board...');

    const projectBoard = await Board.create(
      {
        name: 'Project Pipeline',
        description: 'Track construction projects from bid through closeout.',
        workspaceId: workspace.id,
        createdBy: ceoUser.id,
        boardType: 'main',
        settings: { icon: 'hard-hat', color: '#EA580C' },
      },
      { transaction }
    );

    // Groups by phase
    const grpBid = await BoardGroup.create(
      { boardId: projectBoard.id, name: 'Bid', color: '#6366F1', position: 0 },
      { transaction }
    );
    const grpPreCon = await BoardGroup.create(
      { boardId: projectBoard.id, name: 'Pre-Construction', color: '#F59E0B', position: 1 },
      { transaction }
    );
    const grpInProgress = await BoardGroup.create(
      { boardId: projectBoard.id, name: 'In Progress', color: '#EA580C', position: 2 },
      { transaction }
    );
    const grpPunchList = await BoardGroup.create(
      { boardId: projectBoard.id, name: 'Punch List', color: '#8B5CF6', position: 3 },
      { transaction }
    );
    const grpCloseout = await BoardGroup.create(
      { boardId: projectBoard.id, name: 'Closeout', color: '#10B981', position: 4 },
      { transaction }
    );

    // Columns
    const projColStatus = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'Status',
        columnType: 'status',
        position: 0,
        config: {
          labels: [
            { id: 'bid', text: 'Bid', color: '#6366F1' },
            { id: 'pre_construction', text: 'Pre-Construction', color: '#F59E0B' },
            { id: 'in_progress', text: 'In Progress', color: '#EA580C' },
            { id: 'punch_list', text: 'Punch List', color: '#8B5CF6' },
            { id: 'closeout', text: 'Closeout', color: '#10B981' },
          ],
        },
      },
      { transaction }
    );

    const projColClient = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'Client',
        columnType: 'person',
        position: 1,
        config: { allow_multiple: false },
      },
      { transaction }
    );

    const projColPM = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'Project Manager',
        columnType: 'person',
        position: 2,
        config: { allow_multiple: false },
      },
      { transaction }
    );

    const projColBudget = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'Budget',
        columnType: 'number',
        position: 3,
        config: { format: 'currency', currency: 'USD', decimal_places: 0 },
      },
      { transaction }
    );

    const projColStart = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'Start Date',
        columnType: 'date',
        position: 4,
      },
      { transaction }
    );

    const projColEnd = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'End Date',
        columnType: 'date',
        position: 5,
      },
      { transaction }
    );

    const projColLocation = await Column.create(
      {
        boardId: projectBoard.id,
        name: 'Location',
        columnType: 'text',
        position: 6,
      },
      { transaction }
    );

    // 12 Project items
    const projects = [
      // Bid (2)
      { name: 'Riverfront Mixed-Use Tower', group: grpBid, status: 'bid', budget: 28500000, start: '2026-07-01', end: '2028-06-30', pm: pmUser, client: ceoUser, location: 'Austin, TX' },
      { name: 'Metro Transit Hub Expansion', group: grpBid, status: 'bid', budget: 15200000, start: '2026-08-15', end: '2027-12-31', pm: estimator, client: ceoUser, location: 'Dallas, TX' },
      // Pre-Construction (2)
      { name: 'Lakewood Office Campus Ph. 2', group: grpPreCon, status: 'pre_construction', budget: 12800000, start: '2026-05-01', end: '2027-08-15', pm: pmUser, client: ceoUser, location: 'Denver, CO' },
      { name: 'Central Hospital Wing Addition', group: grpPreCon, status: 'pre_construction', budget: 42000000, start: '2026-06-01', end: '2028-03-31', pm: siteManager, client: ceoUser, location: 'Houston, TX' },
      // In Progress (4)
      { name: 'Sunrise Residential Community', group: grpInProgress, status: 'in_progress', budget: 8500000, start: '2025-11-01', end: '2026-09-30', pm: pmUser, client: ceoUser, location: 'Phoenix, AZ' },
      { name: 'Grand Avenue Parking Structure', group: grpInProgress, status: 'in_progress', budget: 6200000, start: '2025-12-15', end: '2026-07-31', pm: siteManager, client: ceoUser, location: 'Los Angeles, CA' },
      { name: 'Westfield K-8 School Renovation', group: grpInProgress, status: 'in_progress', budget: 18700000, start: '2025-09-01', end: '2026-08-15', pm: pmUser, client: ceoUser, location: 'Chicago, IL' },
      { name: 'Harbor Point Retail Center', group: grpInProgress, status: 'in_progress', budget: 11300000, start: '2025-10-01', end: '2026-10-31', pm: estimator, client: ceoUser, location: 'San Diego, CA' },
      // Punch List (2)
      { name: 'Oakridge Corporate Headquarters', group: grpPunchList, status: 'punch_list', budget: 22100000, start: '2024-06-01', end: '2026-04-30', pm: siteManager, client: ceoUser, location: 'Seattle, WA' },
      { name: 'Maple Creek Condominiums', group: grpPunchList, status: 'punch_list', budget: 9800000, start: '2025-01-15', end: '2026-04-15', pm: pmUser, client: ceoUser, location: 'Portland, OR' },
      // Closeout (2)
      { name: 'Downtown Fire Station #7', group: grpCloseout, status: 'closeout', budget: 5400000, start: '2024-03-01', end: '2026-02-28', pm: pmUser, client: ceoUser, location: 'Nashville, TN' },
      { name: 'Valley Industrial Warehouse', group: grpCloseout, status: 'closeout', budget: 3700000, start: '2024-08-01', end: '2026-01-31', pm: siteManager, client: ceoUser, location: 'Salt Lake City, UT' },
    ];

    for (let i = 0; i < projects.length; i++) {
      const p = projects[i];
      const item = await Item.create(
        {
          boardId: projectBoard.id,
          groupId: p.group.id,
          name: p.name,
          position: i,
          createdBy: p.pm.id,
        },
        { transaction }
      );
      await ColumnValue.bulkCreate(
        [
          { itemId: item.id, columnId: projColStatus.id, value: { label: p.status } },
          { itemId: item.id, columnId: projColClient.id, value: { userId: p.client.id } },
          { itemId: item.id, columnId: projColPM.id, value: { userId: p.pm.id } },
          { itemId: item.id, columnId: projColBudget.id, value: { number: p.budget } },
          { itemId: item.id, columnId: projColStart.id, value: { date: p.start } },
          { itemId: item.id, columnId: projColEnd.id, value: { date: p.end } },
          { itemId: item.id, columnId: projColLocation.id, value: { text: p.location } },
        ],
        { transaction }
      );
    }

    // Views
    await BoardView.create(
      { boardId: projectBoard.id, name: 'Main Table', viewType: 'table', isDefault: true, createdBy: ceoUser.id, settings: {} },
      { transaction }
    );
    await BoardView.create(
      { boardId: projectBoard.id, name: 'Kanban View', viewType: 'kanban', isDefault: false, createdBy: ceoUser.id, settings: { groupByColumn: projColStatus.id } },
      { transaction }
    );
    await BoardView.create(
      { boardId: projectBoard.id, name: 'Timeline', viewType: 'timeline', isDefault: false, createdBy: ceoUser.id, settings: {} },
      { transaction }
    );

    log('"Project Pipeline" created with 5 groups, 7 columns, 12 items, 3 views.');

    // =====================================================================
    // BOARD 2 — EQUIPMENT TRACKER
    // =====================================================================
    log('Creating "Equipment Tracker" board...');

    const equipBoard = await Board.create(
      {
        name: 'Equipment Tracker',
        description: 'Fleet management for construction equipment and machinery.',
        workspaceId: workspace.id,
        createdBy: siteManager.id,
        boardType: 'main',
        settings: { icon: 'truck', color: '#D97706' },
      },
      { transaction }
    );

    const eqGrpAvailable = await BoardGroup.create(
      { boardId: equipBoard.id, name: 'Available', color: '#10B981', position: 0 },
      { transaction }
    );
    const eqGrpInService = await BoardGroup.create(
      { boardId: equipBoard.id, name: 'In Service', color: '#3B82F6', position: 1 },
      { transaction }
    );
    const eqGrpMaintenance = await BoardGroup.create(
      { boardId: equipBoard.id, name: 'Maintenance', color: '#F59E0B', position: 2 },
      { transaction }
    );
    const eqGrpRetired = await BoardGroup.create(
      { boardId: equipBoard.id, name: 'Retired', color: '#6B7280', position: 3 },
      { transaction }
    );

    // Columns
    const eqColId = await Column.create(
      { boardId: equipBoard.id, name: 'Equipment ID', columnType: 'text', position: 0 },
      { transaction }
    );
    const eqColType = await Column.create(
      {
        boardId: equipBoard.id,
        name: 'Type',
        columnType: 'dropdown',
        position: 1,
        config: {
          options: [
            { id: 'excavator', label: 'Excavator', color: '#EA580C', order: 0 },
            { id: 'crane', label: 'Crane', color: '#2563EB', order: 1 },
            { id: 'forklift', label: 'Forklift', color: '#16A34A', order: 2 },
            { id: 'scaffolding', label: 'Scaffolding', color: '#9333EA', order: 3 },
            { id: 'bulldozer', label: 'Bulldozer', color: '#D97706', order: 4 },
            { id: 'loader', label: 'Loader', color: '#0891B2', order: 5 },
            { id: 'dump_truck', label: 'Dump Truck', color: '#BE185D', order: 6 },
            { id: 'concrete_mixer', label: 'Concrete Mixer', color: '#4F46E5', order: 7 },
            { id: 'other', label: 'Other', color: '#6B7280', order: 8 },
          ],
        },
      },
      { transaction }
    );
    const eqColStatus = await Column.create(
      {
        boardId: equipBoard.id,
        name: 'Status',
        columnType: 'status',
        position: 2,
        config: {
          labels: [
            { id: 'available', text: 'Available', color: '#10B981' },
            { id: 'in_service', text: 'In Service', color: '#3B82F6' },
            { id: 'maintenance', text: 'Maintenance', color: '#F59E0B' },
            { id: 'retired', text: 'Retired', color: '#6B7280' },
          ],
        },
      },
      { transaction }
    );
    const eqColLocation = await Column.create(
      { boardId: equipBoard.id, name: 'Location', columnType: 'text', position: 3 },
      { transaction }
    );
    const eqColLastMaint = await Column.create(
      { boardId: equipBoard.id, name: 'Last Maintenance', columnType: 'date', position: 4 },
      { transaction }
    );
    const eqColNextMaint = await Column.create(
      { boardId: equipBoard.id, name: 'Next Maintenance', columnType: 'date', position: 5 },
      { transaction }
    );
    const eqColOperator = await Column.create(
      { boardId: equipBoard.id, name: 'Assigned Operator', columnType: 'person', position: 6 },
      { transaction }
    );

    // 30 Equipment items
    const equipmentData = [
      // Available (8)
      { name: 'CAT 320 Excavator', id: 'EX-001', type: 'excavator', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-02-15', nextMaint: '2026-05-15', op: siteManager },
      { name: 'Komatsu PC210', id: 'EX-002', type: 'excavator', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-01-20', nextMaint: '2026-04-20', op: siteManager },
      { name: 'Liebherr LTM 1100', id: 'CR-001', type: 'crane', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-03-01', nextMaint: '2026-06-01', op: siteManager },
      { name: 'Toyota 8FGU25 Forklift', id: 'FL-001', type: 'forklift', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-02-28', nextMaint: '2026-05-28', op: siteManager },
      { name: 'Hyster H50FT Forklift', id: 'FL-002', type: 'forklift', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-03-10', nextMaint: '2026-06-10', op: siteManager },
      { name: 'PERI UP Scaffolding Set A', id: 'SC-001', type: 'scaffolding', status: 'available', group: eqGrpAvailable, location: 'Storage Lot B', lastMaint: '2026-01-10', nextMaint: '2026-07-10', op: siteManager },
      { name: 'CAT 950M Loader', id: 'LD-001', type: 'loader', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-03-05', nextMaint: '2026-06-05', op: siteManager },
      { name: 'Kenworth T880 Dump Truck', id: 'DT-003', type: 'dump_truck', status: 'available', group: eqGrpAvailable, location: 'Equipment Yard', lastMaint: '2026-02-20', nextMaint: '2026-05-20', op: siteManager },
      // In Service (12)
      { name: 'CAT 336 Excavator', id: 'EX-003', type: 'excavator', status: 'in_service', group: eqGrpInService, location: 'Sunrise Residential', lastMaint: '2026-01-15', nextMaint: '2026-04-15', op: pmUser },
      { name: 'Volvo EC220E Excavator', id: 'EX-004', type: 'excavator', status: 'in_service', group: eqGrpInService, location: 'Grand Ave Parking', lastMaint: '2026-02-01', nextMaint: '2026-05-01', op: siteManager },
      { name: 'Manitowoc 999 Crawler Crane', id: 'CR-002', type: 'crane', status: 'in_service', group: eqGrpInService, location: 'Westfield K-8 School', lastMaint: '2025-12-20', nextMaint: '2026-03-20', op: pmUser },
      { name: 'Tadano GR-1000XL', id: 'CR-003', type: 'crane', status: 'in_service', group: eqGrpInService, location: 'Sunrise Residential', lastMaint: '2026-01-10', nextMaint: '2026-04-10', op: siteManager },
      { name: 'CAT D6T Bulldozer', id: 'BD-001', type: 'bulldozer', status: 'in_service', group: eqGrpInService, location: 'Harbor Point Retail', lastMaint: '2026-02-10', nextMaint: '2026-05-10', op: estimator },
      { name: 'John Deere 850K Bulldozer', id: 'BD-002', type: 'bulldozer', status: 'in_service', group: eqGrpInService, location: 'Sunrise Residential', lastMaint: '2025-12-01', nextMaint: '2026-03-01', op: pmUser },
      { name: 'Mack Granite Dump Truck', id: 'DT-001', type: 'dump_truck', status: 'in_service', group: eqGrpInService, location: 'Grand Ave Parking', lastMaint: '2026-01-25', nextMaint: '2026-04-25', op: siteManager },
      { name: 'Peterbilt 567 Dump Truck', id: 'DT-002', type: 'dump_truck', status: 'in_service', group: eqGrpInService, location: 'Westfield K-8 School', lastMaint: '2026-03-01', nextMaint: '2026-06-01', op: pmUser },
      { name: 'McNeilus Concrete Mixer', id: 'CM-001', type: 'concrete_mixer', status: 'in_service', group: eqGrpInService, location: 'Harbor Point Retail', lastMaint: '2026-02-05', nextMaint: '2026-05-05', op: estimator },
      { name: 'Oshkosh S-Series Mixer', id: 'CM-002', type: 'concrete_mixer', status: 'in_service', group: eqGrpInService, location: 'Grand Ave Parking', lastMaint: '2026-01-30', nextMaint: '2026-04-30', op: siteManager },
      { name: 'CAT 966M Loader', id: 'LD-002', type: 'loader', status: 'in_service', group: eqGrpInService, location: 'Sunrise Residential', lastMaint: '2026-02-18', nextMaint: '2026-05-18', op: pmUser },
      { name: 'PERI UP Scaffolding Set B', id: 'SC-002', type: 'scaffolding', status: 'in_service', group: eqGrpInService, location: 'Oakridge HQ', lastMaint: '2025-11-15', nextMaint: '2026-05-15', op: siteManager },
      // Maintenance (6)
      { name: 'Volvo EC350E Excavator', id: 'EX-005', type: 'excavator', status: 'maintenance', group: eqGrpMaintenance, location: 'Repair Shop', lastMaint: '2026-03-25', nextMaint: '2026-06-25', op: siteManager },
      { name: 'Liebherr LTM 1300', id: 'CR-004', type: 'crane', status: 'maintenance', group: eqGrpMaintenance, location: 'Repair Shop', lastMaint: '2026-03-20', nextMaint: '2026-06-20', op: siteManager },
      { name: 'Hyster H80FT Forklift', id: 'FL-003', type: 'forklift', status: 'maintenance', group: eqGrpMaintenance, location: 'Repair Shop', lastMaint: '2026-03-18', nextMaint: '2026-06-18', op: siteManager },
      { name: 'CAT D8T Bulldozer', id: 'BD-003', type: 'bulldozer', status: 'maintenance', group: eqGrpMaintenance, location: 'Repair Shop', lastMaint: '2026-03-22', nextMaint: '2026-06-22', op: siteManager },
      { name: 'Volvo A30G Dump Truck', id: 'DT-004', type: 'dump_truck', status: 'maintenance', group: eqGrpMaintenance, location: 'Repair Shop', lastMaint: '2026-03-15', nextMaint: '2026-06-15', op: siteManager },
      { name: 'PERI UP Scaffolding Set C', id: 'SC-003', type: 'scaffolding', status: 'maintenance', group: eqGrpMaintenance, location: 'Storage Lot B', lastMaint: '2026-03-28', nextMaint: '2026-09-28', op: siteManager },
      // Retired (4)
      { name: 'CAT 312 Excavator (2008)', id: 'EX-006', type: 'excavator', status: 'retired', group: eqGrpRetired, location: 'Surplus Lot', lastMaint: '2025-06-01', nextMaint: '2025-09-01', op: siteManager },
      { name: 'Kobelco CK1100G Crane', id: 'CR-005', type: 'crane', status: 'retired', group: eqGrpRetired, location: 'Surplus Lot', lastMaint: '2025-04-15', nextMaint: '2025-07-15', op: siteManager },
      { name: 'Clark C500 Forklift', id: 'FL-004', type: 'forklift', status: 'retired', group: eqGrpRetired, location: 'Surplus Lot', lastMaint: '2025-03-01', nextMaint: '2025-06-01', op: siteManager },
      { name: 'International 7600 Dump Truck', id: 'DT-005', type: 'dump_truck', status: 'retired', group: eqGrpRetired, location: 'Surplus Lot', lastMaint: '2025-05-10', nextMaint: '2025-08-10', op: siteManager },
    ];

    for (let i = 0; i < equipmentData.length; i++) {
      const eq = equipmentData[i];
      const item = await Item.create(
        { boardId: equipBoard.id, groupId: eq.group.id, name: eq.name, position: i, createdBy: siteManager.id },
        { transaction }
      );
      await ColumnValue.bulkCreate(
        [
          { itemId: item.id, columnId: eqColId.id, value: { text: eq.id } },
          { itemId: item.id, columnId: eqColType.id, value: { selected: eq.type } },
          { itemId: item.id, columnId: eqColStatus.id, value: { label: eq.status } },
          { itemId: item.id, columnId: eqColLocation.id, value: { text: eq.location } },
          { itemId: item.id, columnId: eqColLastMaint.id, value: { date: eq.lastMaint } },
          { itemId: item.id, columnId: eqColNextMaint.id, value: { date: eq.nextMaint } },
          { itemId: item.id, columnId: eqColOperator.id, value: { userId: eq.op.id } },
        ],
        { transaction }
      );
    }

    await BoardView.create(
      { boardId: equipBoard.id, name: 'Main Table', viewType: 'table', isDefault: true, createdBy: siteManager.id, settings: {} },
      { transaction }
    );
    await BoardView.create(
      { boardId: equipBoard.id, name: 'Kanban by Status', viewType: 'kanban', isDefault: false, createdBy: siteManager.id, settings: { groupByColumn: eqColStatus.id } },
      { transaction }
    );

    log('"Equipment Tracker" created with 4 groups, 7 columns, 30 items, 2 views.');

    // =====================================================================
    // BOARD 3 — SUBCONTRACTOR BOARD
    // =====================================================================
    log('Creating "Subcontractor Board"...');

    const subBoard = await Board.create(
      {
        name: 'Subcontractor Board',
        description: 'Vendor management and subcontractor performance tracking.',
        workspaceId: workspace.id,
        createdBy: pmUser.id,
        boardType: 'main',
        settings: { icon: 'users', color: '#2563EB' },
      },
      { transaction }
    );

    const subGrpActive = await BoardGroup.create(
      { boardId: subBoard.id, name: 'Active', color: '#10B981', position: 0 },
      { transaction }
    );
    const subGrpPending = await BoardGroup.create(
      { boardId: subBoard.id, name: 'Pending Approval', color: '#F59E0B', position: 1 },
      { transaction }
    );
    const subGrpInactive = await BoardGroup.create(
      { boardId: subBoard.id, name: 'Inactive', color: '#6B7280', position: 2 },
      { transaction }
    );

    // Columns
    const subColName = await Column.create(
      { boardId: subBoard.id, name: 'Subcontractor Name', columnType: 'person', position: 0 },
      { transaction }
    );
    const subColTrade = await Column.create(
      {
        boardId: subBoard.id,
        name: 'Trade',
        columnType: 'dropdown',
        position: 1,
        config: {
          options: [
            { id: 'concrete', label: 'Concrete', color: '#78716C', order: 0 },
            { id: 'electrical', label: 'Electrical', color: '#F59E0B', order: 1 },
            { id: 'plumbing', label: 'Plumbing', color: '#3B82F6', order: 2 },
            { id: 'hvac', label: 'HVAC', color: '#06B6D4', order: 3 },
            { id: 'framing', label: 'Framing', color: '#D97706', order: 4 },
            { id: 'roofing', label: 'Roofing', color: '#DC2626', order: 5 },
            { id: 'painting', label: 'Painting', color: '#8B5CF6', order: 6 },
            { id: 'drywall', label: 'Drywall', color: '#A3A3A3', order: 7 },
            { id: 'masonry', label: 'Masonry', color: '#92400E', order: 8 },
            { id: 'steel', label: 'Structural Steel', color: '#475569', order: 9 },
            { id: 'landscaping', label: 'Landscaping', color: '#16A34A', order: 10 },
            { id: 'other', label: 'Other', color: '#6B7280', order: 11 },
          ],
        },
      },
      { transaction }
    );
    const subColStatus = await Column.create(
      {
        boardId: subBoard.id,
        name: 'Status',
        columnType: 'status',
        position: 2,
        config: {
          labels: [
            { id: 'active', text: 'Active', color: '#10B981' },
            { id: 'inactive', text: 'Inactive', color: '#6B7280' },
            { id: 'pending', text: 'Pending Approval', color: '#F59E0B' },
          ],
        },
      },
      { transaction }
    );
    const subColJob = await Column.create(
      { boardId: subBoard.id, name: 'Current Job', columnType: 'text', position: 3 },
      { transaction }
    );
    const subColContact = await Column.create(
      { boardId: subBoard.id, name: 'Contact', columnType: 'text', position: 4 },
      { transaction }
    );
    const subColRating = await Column.create(
      { boardId: subBoard.id, name: 'Performance Rating', columnType: 'rating', position: 5, config: { max: 5 } },
      { transaction }
    );

    // 50 Subcontractor items
    const subcontractors = [
      // Active (35)
      { name: 'Apex Concrete Solutions', trade: 'concrete', status: 'active', group: subGrpActive, job: 'Sunrise Residential', contact: '(512) 555-0101', rating: 5 },
      { name: 'Rivera Concrete Co.', trade: 'concrete', status: 'active', group: subGrpActive, job: 'Grand Ave Parking', contact: '(512) 555-0102', rating: 4 },
      { name: 'SolidBase Foundations', trade: 'concrete', status: 'active', group: subGrpActive, job: 'Harbor Point Retail', contact: '(214) 555-0103', rating: 4 },
      { name: 'ProPour Concrete Inc.', trade: 'concrete', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(713) 555-0104', rating: 5 },
      { name: 'Volt-Tech Electrical', trade: 'electrical', status: 'active', group: subGrpActive, job: 'Sunrise Residential', contact: '(512) 555-0201', rating: 5 },
      { name: 'Bright Wire Electric', trade: 'electrical', status: 'active', group: subGrpActive, job: 'Harbor Point Retail', contact: '(619) 555-0202', rating: 4 },
      { name: 'Circuit Masters LLC', trade: 'electrical', status: 'active', group: subGrpActive, job: 'Oakridge HQ', contact: '(206) 555-0203', rating: 3 },
      { name: 'Precision Electric', trade: 'electrical', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(312) 555-0204', rating: 5 },
      { name: 'BlueLine Plumbing', trade: 'plumbing', status: 'active', group: subGrpActive, job: 'Sunrise Residential', contact: '(480) 555-0301', rating: 4 },
      { name: 'FlowRight Plumbing Services', trade: 'plumbing', status: 'active', group: subGrpActive, job: 'Grand Ave Parking', contact: '(213) 555-0302', rating: 5 },
      { name: 'Metro Pipe & Drain', trade: 'plumbing', status: 'active', group: subGrpActive, job: 'Oakridge HQ', contact: '(206) 555-0303', rating: 4 },
      { name: 'AirFlow HVAC Solutions', trade: 'hvac', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(312) 555-0401', rating: 5 },
      { name: 'CoolBreeze Mechanical', trade: 'hvac', status: 'active', group: subGrpActive, job: 'Harbor Point Retail', contact: '(619) 555-0402', rating: 4 },
      { name: 'Summit HVAC Corp.', trade: 'hvac', status: 'active', group: subGrpActive, job: 'Sunrise Residential', contact: '(480) 555-0403', rating: 4 },
      { name: 'TrueFrame Builders', trade: 'framing', status: 'active', group: subGrpActive, job: 'Sunrise Residential', contact: '(480) 555-0501', rating: 5 },
      { name: 'Western Framing Co.', trade: 'framing', status: 'active', group: subGrpActive, job: 'Maple Creek Condos', contact: '(503) 555-0502', rating: 4 },
      { name: 'StrongBuild Framing', trade: 'framing', status: 'active', group: subGrpActive, job: 'Harbor Point Retail', contact: '(619) 555-0503', rating: 3 },
      { name: 'Ironclad Framing LLC', trade: 'framing', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(312) 555-0504', rating: 5 },
      { name: 'Pinnacle Roofing', trade: 'roofing', status: 'active', group: subGrpActive, job: 'Oakridge HQ', contact: '(206) 555-0601', rating: 5 },
      { name: 'AllWeather Roofing', trade: 'roofing', status: 'active', group: subGrpActive, job: 'Maple Creek Condos', contact: '(503) 555-0602', rating: 4 },
      { name: 'TopShield Roofing Inc.', trade: 'roofing', status: 'active', group: subGrpActive, job: 'Downtown Fire Station', contact: '(615) 555-0603', rating: 5 },
      { name: 'ColorCoat Painting', trade: 'painting', status: 'active', group: subGrpActive, job: 'Oakridge HQ', contact: '(206) 555-0701', rating: 4 },
      { name: 'Finish Line Painters', trade: 'painting', status: 'active', group: subGrpActive, job: 'Maple Creek Condos', contact: '(503) 555-0702', rating: 5 },
      { name: 'ProCoat Painters LLC', trade: 'painting', status: 'active', group: subGrpActive, job: 'Downtown Fire Station', contact: '(615) 555-0703', rating: 4 },
      { name: 'CleanWall Drywall', trade: 'drywall', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(312) 555-0801', rating: 5 },
      { name: 'FlatFinish Drywall Co.', trade: 'drywall', status: 'active', group: subGrpActive, job: 'Sunrise Residential', contact: '(480) 555-0802', rating: 4 },
      { name: 'Midwest Drywall Inc.', trade: 'drywall', status: 'active', group: subGrpActive, job: 'Harbor Point Retail', contact: '(619) 555-0803', rating: 4 },
      { name: 'Heritage Masonry', trade: 'masonry', status: 'active', group: subGrpActive, job: 'Downtown Fire Station', contact: '(615) 555-0901', rating: 5 },
      { name: 'BrickMaster Inc.', trade: 'masonry', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(312) 555-0902', rating: 4 },
      { name: 'Titan Steel Erectors', trade: 'steel', status: 'active', group: subGrpActive, job: 'Grand Ave Parking', contact: '(213) 555-1001', rating: 5 },
      { name: 'IronWorks Structural', trade: 'steel', status: 'active', group: subGrpActive, job: 'Westfield K-8 School', contact: '(312) 555-1002', rating: 5 },
      { name: 'Pacific Steel Fabricators', trade: 'steel', status: 'active', group: subGrpActive, job: 'Harbor Point Retail', contact: '(619) 555-1003', rating: 4 },
      { name: 'GreenScape Landscaping', trade: 'landscaping', status: 'active', group: subGrpActive, job: 'Oakridge HQ', contact: '(206) 555-1101', rating: 5 },
      { name: 'Urban Green Solutions', trade: 'landscaping', status: 'active', group: subGrpActive, job: 'Maple Creek Condos', contact: '(503) 555-1102', rating: 4 },
      { name: 'NatureBuild Landscapes', trade: 'landscaping', status: 'active', group: subGrpActive, job: 'Downtown Fire Station', contact: '(615) 555-1103', rating: 4 },
      // Pending Approval (8)
      { name: 'Delta Concrete LLC', trade: 'concrete', status: 'pending', group: subGrpPending, job: 'Lakewood Office Ph. 2', contact: '(303) 555-2001', rating: 0 },
      { name: 'SparkPro Electrical', trade: 'electrical', status: 'pending', group: subGrpPending, job: 'Central Hospital Wing', contact: '(713) 555-2002', rating: 0 },
      { name: 'AquaPipe Plumbing', trade: 'plumbing', status: 'pending', group: subGrpPending, job: 'Central Hospital Wing', contact: '(713) 555-2003', rating: 0 },
      { name: 'Arctic HVAC Systems', trade: 'hvac', status: 'pending', group: subGrpPending, job: 'Lakewood Office Ph. 2', contact: '(303) 555-2004', rating: 0 },
      { name: 'RapidFrame Construction', trade: 'framing', status: 'pending', group: subGrpPending, job: 'Metro Transit Hub', contact: '(214) 555-2005', rating: 0 },
      { name: 'Redstone Masonry', trade: 'masonry', status: 'pending', group: subGrpPending, job: 'Riverfront Tower', contact: '(512) 555-2006', rating: 0 },
      { name: 'Lone Star Steel', trade: 'steel', status: 'pending', group: subGrpPending, job: 'Metro Transit Hub', contact: '(214) 555-2007', rating: 0 },
      { name: 'EverGreen Grounds', trade: 'landscaping', status: 'pending', group: subGrpPending, job: 'Riverfront Tower', contact: '(512) 555-2008', rating: 0 },
      // Inactive (7)
      { name: 'OldGuard Concrete', trade: 'concrete', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3001', rating: 2 },
      { name: 'Budget Wiring Co.', trade: 'electrical', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3002', rating: 2 },
      { name: 'QuickFix Plumbing', trade: 'plumbing', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3003', rating: 1 },
      { name: 'Temp HVAC Services', trade: 'hvac', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3004', rating: 2 },
      { name: 'Discount Roofing Co.', trade: 'roofing', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3005', rating: 1 },
      { name: 'BasicPaint Services', trade: 'painting', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3006', rating: 2 },
      { name: 'Flat Earth Grading', trade: 'other', status: 'inactive', group: subGrpInactive, job: '—', contact: '(555) 555-3007', rating: 1 },
    ];

    for (let i = 0; i < subcontractors.length; i++) {
      const sub = subcontractors[i];
      const item = await Item.create(
        { boardId: subBoard.id, groupId: sub.group.id, name: sub.name, position: i, createdBy: pmUser.id },
        { transaction }
      );
      await ColumnValue.bulkCreate(
        [
          { itemId: item.id, columnId: subColName.id, value: { userId: pmUser.id } },
          { itemId: item.id, columnId: subColTrade.id, value: { selected: sub.trade } },
          { itemId: item.id, columnId: subColStatus.id, value: { label: sub.status } },
          { itemId: item.id, columnId: subColJob.id, value: { text: sub.job } },
          { itemId: item.id, columnId: subColContact.id, value: { text: sub.contact } },
          { itemId: item.id, columnId: subColRating.id, value: { rating: sub.rating } },
        ],
        { transaction }
      );
    }

    await BoardView.create(
      { boardId: subBoard.id, name: 'Main Table', viewType: 'table', isDefault: true, createdBy: pmUser.id, settings: {} },
      { transaction }
    );
    await BoardView.create(
      { boardId: subBoard.id, name: 'By Trade', viewType: 'kanban', isDefault: false, createdBy: pmUser.id, settings: { groupByColumn: subColTrade.id } },
      { transaction }
    );

    log('"Subcontractor Board" created with 3 groups, 6 columns, 50 items, 2 views.');

    // =====================================================================
    // BOARD 4 — SAFETY COMPLIANCE
    // =====================================================================
    log('Creating "Safety Compliance" board...');

    const safetyBoard = await Board.create(
      {
        name: 'Safety Compliance',
        description: 'Safety inspections, incidents, and compliance tracking.',
        workspaceId: workspace.id,
        createdBy: safetyOfficer.id,
        boardType: 'main',
        settings: { icon: 'shield-check', color: '#DC2626' },
      },
      { transaction }
    );

    const safeGrpInspections = await BoardGroup.create(
      { boardId: safetyBoard.id, name: 'Inspections', color: '#3B82F6', position: 0 },
      { transaction }
    );
    const safeGrpIncidents = await BoardGroup.create(
      { boardId: safetyBoard.id, name: 'Incidents', color: '#DC2626', position: 1 },
      { transaction }
    );
    const safeGrpTraining = await BoardGroup.create(
      { boardId: safetyBoard.id, name: 'Training Records', color: '#10B981', position: 2 },
      { transaction }
    );
    const safeGrpPermits = await BoardGroup.create(
      { boardId: safetyBoard.id, name: 'Permits & Certifications', color: '#8B5CF6', position: 3 },
      { transaction }
    );

    // Columns
    const safeColType = await Column.create(
      {
        boardId: safetyBoard.id,
        name: 'Record Type',
        columnType: 'dropdown',
        position: 0,
        config: {
          options: [
            { id: 'inspection', label: 'Inspection', color: '#3B82F6', order: 0 },
            { id: 'incident', label: 'Incident', color: '#DC2626', order: 1 },
            { id: 'training', label: 'Training', color: '#10B981', order: 2 },
            { id: 'permit', label: 'Permit', color: '#8B5CF6', order: 3 },
          ],
        },
      },
      { transaction }
    );
    const safeColStatus = await Column.create(
      {
        boardId: safetyBoard.id,
        name: 'Status',
        columnType: 'status',
        position: 1,
        config: {
          labels: [
            { id: 'passed', text: 'Passed', color: '#10B981' },
            { id: 'failed', text: 'Failed', color: '#DC2626' },
            { id: 'pending', text: 'Pending', color: '#F59E0B' },
            { id: 'resolved', text: 'Resolved', color: '#3B82F6' },
            { id: 'open', text: 'Open', color: '#EA580C' },
            { id: 'completed', text: 'Completed', color: '#10B981' },
            { id: 'expired', text: 'Expired', color: '#6B7280' },
            { id: 'valid', text: 'Valid', color: '#10B981' },
          ],
        },
      },
      { transaction }
    );
    const safeColSite = await Column.create(
      { boardId: safetyBoard.id, name: 'Job Site', columnType: 'text', position: 2 },
      { transaction }
    );
    const safeColDate = await Column.create(
      { boardId: safetyBoard.id, name: 'Date', columnType: 'date', position: 3 },
      { transaction }
    );
    const safeColAssigned = await Column.create(
      { boardId: safetyBoard.id, name: 'Assigned To', columnType: 'person', position: 4 },
      { transaction }
    );
    const safeColNotes = await Column.create(
      { boardId: safetyBoard.id, name: 'Notes', columnType: 'long_text', position: 5 },
      { transaction }
    );
    const safeColSeverity = await Column.create(
      {
        boardId: safetyBoard.id,
        name: 'Severity',
        columnType: 'dropdown',
        position: 6,
        config: {
          options: [
            { id: 'low', label: 'Low', color: '#10B981', order: 0 },
            { id: 'medium', label: 'Medium', color: '#F59E0B', order: 1 },
            { id: 'high', label: 'High', color: '#EA580C', order: 2 },
            { id: 'critical', label: 'Critical', color: '#DC2626', order: 3 },
          ],
        },
      },
      { transaction }
    );

    // 40 Safety Compliance records
    const safetyRecords = [
      // Inspections (15)
      { name: 'Fall Protection Inspection — Sunrise Residential', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Sunrise Residential', date: '2026-03-15', assigned: safetyOfficer, notes: 'All harnesses and guardrails compliant. No deficiencies.', severity: 'low' },
      { name: 'Electrical Safety Audit — Westfield K-8', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Westfield K-8 School', date: '2026-03-10', assigned: safetyOfficer, notes: 'GFCI outlets tested and functional. Lockout/tagout procedures verified.', severity: 'low' },
      { name: 'Scaffolding Inspection — Oakridge HQ', group: safeGrpInspections, type: 'inspection', status: 'failed', site: 'Oakridge HQ', date: '2026-03-08', assigned: safetyOfficer, notes: 'Missing toe boards on level 3. Corrective action required within 48 hours.', severity: 'high' },
      { name: 'Fire Extinguisher Check — Grand Ave', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Grand Ave Parking', date: '2026-03-05', assigned: siteManager, notes: 'All 12 units inspected and tagged. Expiration dates current.', severity: 'low' },
      { name: 'Crane Annual Certification — CR-002', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Westfield K-8 School', date: '2026-02-20', assigned: safetyOfficer, notes: 'Annual OSHA crane inspection passed. Load tests satisfactory.', severity: 'low' },
      { name: 'Trenching & Excavation Review — Harbor Point', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Harbor Point Retail', date: '2026-02-15', assigned: safetyOfficer, notes: 'Shoring in place. Competent person on site confirmed.', severity: 'low' },
      { name: 'PPE Compliance Check — All Sites', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'All Active Sites', date: '2026-03-01', assigned: safetyOfficer, notes: 'Spot checks at 4 sites. 97% compliance rate. 3 workers issued new hard hats.', severity: 'low' },
      { name: 'Hazmat Storage Audit — Equipment Yard', group: safeGrpInspections, type: 'inspection', status: 'failed', site: 'Equipment Yard', date: '2026-02-28', assigned: safetyOfficer, notes: 'Diesel drums missing secondary containment. SDS binder outdated.', severity: 'high' },
      { name: 'Confined Space Entry Review — Grand Ave', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Grand Ave Parking', date: '2026-02-10', assigned: siteManager, notes: 'Atmospheric monitoring equipment calibrated. Entry permits current.', severity: 'medium' },
      { name: 'Weekly Toolbox Talk Audit — Q1', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'All Active Sites', date: '2026-03-28', assigned: safetyOfficer, notes: 'All 12 weekly talks documented. Attendance logs complete.', severity: 'low' },
      { name: 'Noise Level Assessment — Sunrise', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Sunrise Residential', date: '2026-03-20', assigned: safetyOfficer, notes: 'Peak levels 84 dB. Below 85 dB action level. Hearing protection recommended.', severity: 'low' },
      { name: 'Silica Dust Monitoring — Grand Ave', group: safeGrpInspections, type: 'inspection', status: 'pending', site: 'Grand Ave Parking', date: '2026-04-05', assigned: safetyOfficer, notes: 'Scheduled air monitoring for concrete cutting operations.', severity: 'medium' },
      { name: 'Ladder Safety Inspection — All Sites', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'All Active Sites', date: '2026-03-12', assigned: siteManager, notes: '28 ladders inspected. 2 removed from service due to damage.', severity: 'low' },
      { name: 'Emergency Evacuation Drill — Westfield', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'Westfield K-8 School', date: '2026-02-25', assigned: safetyOfficer, notes: 'Full site evacuation in 4 min 12 sec. Assembly point procedures followed.', severity: 'low' },
      { name: 'First Aid Kit Inventory — Q1', group: safeGrpInspections, type: 'inspection', status: 'passed', site: 'All Active Sites', date: '2026-03-30', assigned: safetyOfficer, notes: 'All kits restocked. AED batteries checked at each trailer.', severity: 'low' },
      // Incidents (10)
      { name: 'Slip & Fall — Grand Ave Parking Lvl 2', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Grand Ave Parking', date: '2026-03-02', assigned: safetyOfficer, notes: 'Worker slipped on wet concrete. Minor ankle sprain. Ice applied on site. Root cause: standing water from overnight rain.', severity: 'medium' },
      { name: 'Falling Object Near Miss — Oakridge', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Oakridge HQ', date: '2026-02-18', assigned: safetyOfficer, notes: 'Unsecured tool fell from 3rd floor. No injuries. Barricade zone expanded.', severity: 'high' },
      { name: 'Electrical Shock — Harbor Point', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Harbor Point Retail', date: '2026-01-22', assigned: safetyOfficer, notes: 'Worker contacted live wire during conduit installation. Minor shock. Evaluated at ER and released. GFCI was bypassed — corrected immediately.', severity: 'critical' },
      { name: 'Heat Exhaustion — Sunrise Residential', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Sunrise Residential', date: '2026-02-14', assigned: siteManager, notes: 'Worker showed signs of heat exhaustion during afternoon pour. Water breaks enforced. Worker rested and recovered on site.', severity: 'medium' },
      { name: 'Vehicle Backup Incident — Equipment Yard', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Equipment Yard', date: '2026-01-10', assigned: safetyOfficer, notes: 'Dump truck backed into parked forklift. No injuries. Property damage only. Spotter requirement reinforced.', severity: 'medium' },
      { name: 'Trench Wall Collapse Near Miss', group: safeGrpIncidents, type: 'incident', status: 'open', site: 'Harbor Point Retail', date: '2026-03-18', assigned: safetyOfficer, notes: 'Partial soil collapse in 6ft trench. Workers had exited minutes prior. Geotechnical review ordered.', severity: 'critical' },
      { name: 'Crane Load Swing — Westfield K-8', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Westfield K-8 School', date: '2026-02-05', assigned: safetyOfficer, notes: 'Steel beam swung during lift due to wind gust. Area was clear. Wind speed protocol updated to 20 mph limit.', severity: 'high' },
      { name: 'Chemical Splash — Maple Creek', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Maple Creek Condos', date: '2026-03-22', assigned: safetyOfficer, notes: 'Concrete sealer splashed on worker face. Eye wash station used. No lasting injury. Face shield now mandatory for sealer application.', severity: 'medium' },
      { name: 'Scaffolding Plank Failure — Oakridge', group: safeGrpIncidents, type: 'incident', status: 'open', site: 'Oakridge HQ', date: '2026-03-25', assigned: safetyOfficer, notes: 'Scaffold plank cracked under load. Worker grabbed rail and was uninjured. All planks being re-inspected.', severity: 'high' },
      { name: 'Forklift Tip-Over — Equipment Yard', group: safeGrpIncidents, type: 'incident', status: 'resolved', site: 'Equipment Yard', date: '2025-12-15', assigned: siteManager, notes: 'Forklift tipped on uneven ground. Operator wore seatbelt, no injuries. Ground leveling completed.', severity: 'high' },
      // Training Records (8)
      { name: 'OSHA 30-Hour — Site Supervisors', group: safeGrpTraining, type: 'training', status: 'completed', site: 'Corporate Office', date: '2026-01-15', assigned: safetyOfficer, notes: '6 site supervisors completed 30-hour OSHA construction training.', severity: 'low' },
      { name: 'Fall Protection Certification — Q1', group: safeGrpTraining, type: 'training', status: 'completed', site: 'Training Center', date: '2026-02-01', assigned: safetyOfficer, notes: '22 workers certified in fall protection and harness use.', severity: 'low' },
      { name: 'Crane Operator Recertification', group: safeGrpTraining, type: 'training', status: 'completed', site: 'Training Center', date: '2026-03-01', assigned: safetyOfficer, notes: '4 operators passed NCCCO recertification exams.', severity: 'low' },
      { name: 'Hazmat Handling Training', group: safeGrpTraining, type: 'training', status: 'completed', site: 'Corporate Office', date: '2026-02-20', assigned: safetyOfficer, notes: '18 workers completed hazardous materials handling course.', severity: 'low' },
      { name: 'CPR/First Aid Renewal', group: safeGrpTraining, type: 'training', status: 'pending', site: 'Training Center', date: '2026-04-10', assigned: safetyOfficer, notes: 'Scheduled for 15 workers whose certifications expire this quarter.', severity: 'medium' },
      { name: 'Confined Space Entry Training', group: safeGrpTraining, type: 'training', status: 'completed', site: 'Grand Ave Parking', date: '2026-01-28', assigned: siteManager, notes: '8 workers certified for confined space entry at parking garage site.', severity: 'low' },
      { name: 'Silica Exposure Awareness', group: safeGrpTraining, type: 'training', status: 'completed', site: 'Corporate Office', date: '2026-03-05', assigned: safetyOfficer, notes: 'All concrete and cutting crews trained on OSHA silica standard.', severity: 'low' },
      { name: 'Forklift Operator Certification — New Hires', group: safeGrpTraining, type: 'training', status: 'pending', site: 'Equipment Yard', date: '2026-04-15', assigned: siteManager, notes: '5 new operators scheduled for forklift certification course.', severity: 'medium' },
      // Permits & Certifications (7)
      { name: 'Building Permit — Sunrise Residential', group: safeGrpPermits, type: 'permit', status: 'valid', site: 'Sunrise Residential', date: '2025-10-15', assigned: pmUser, notes: 'City of Phoenix Building Permit #BP-2025-4421. Valid through 2027-10-15.', severity: 'low' },
      { name: 'Building Permit — Westfield K-8 School', group: safeGrpPermits, type: 'permit', status: 'valid', site: 'Westfield K-8 School', date: '2025-08-20', assigned: pmUser, notes: 'Chicago Building Dept Permit #2025-SCH-0892. Valid through 2027-08-20.', severity: 'low' },
      { name: 'Demolition Permit — Grand Ave', group: safeGrpPermits, type: 'permit', status: 'valid', site: 'Grand Ave Parking', date: '2025-11-01', assigned: siteManager, notes: 'LA County Demo Permit #DEM-2025-1156. Phase 1 demo complete.', severity: 'low' },
      { name: 'Environmental Compliance — Harbor Point', group: safeGrpPermits, type: 'permit', status: 'valid', site: 'Harbor Point Retail', date: '2025-09-15', assigned: safetyOfficer, notes: 'Stormwater prevention plan (SWPPP) approved. BMP inspections weekly.', severity: 'low' },
      { name: 'Crane Operating Permit — Westfield', group: safeGrpPermits, type: 'permit', status: 'valid', site: 'Westfield K-8 School', date: '2025-12-01', assigned: safetyOfficer, notes: 'City crane permit for Manitowoc 999. Annual inspection current.', severity: 'low' },
      { name: 'Excavation Permit — Harbor Point', group: safeGrpPermits, type: 'permit', status: 'valid', site: 'Harbor Point Retail', date: '2025-09-20', assigned: siteManager, notes: 'Underground utilities located and marked. Permit valid for Phase 2 excavation.', severity: 'low' },
      { name: 'Fire Alarm Permit — Oakridge HQ', group: safeGrpPermits, type: 'permit', status: 'expired', site: 'Oakridge HQ', date: '2025-06-01', assigned: pmUser, notes: 'Fire alarm installation permit expired. Renewal submitted 2026-03-28.', severity: 'high' },
    ];

    for (let i = 0; i < safetyRecords.length; i++) {
      const rec = safetyRecords[i];
      const item = await Item.create(
        { boardId: safetyBoard.id, groupId: rec.group.id, name: rec.name, position: i, createdBy: safetyOfficer.id },
        { transaction }
      );
      await ColumnValue.bulkCreate(
        [
          { itemId: item.id, columnId: safeColType.id, value: { selected: rec.type } },
          { itemId: item.id, columnId: safeColStatus.id, value: { label: rec.status } },
          { itemId: item.id, columnId: safeColSite.id, value: { text: rec.site } },
          { itemId: item.id, columnId: safeColDate.id, value: { date: rec.date } },
          { itemId: item.id, columnId: safeColAssigned.id, value: { userId: rec.assigned.id } },
          { itemId: item.id, columnId: safeColNotes.id, value: { text: rec.notes } },
          { itemId: item.id, columnId: safeColSeverity.id, value: { selected: rec.severity } },
        ],
        { transaction }
      );
    }

    await BoardView.create(
      { boardId: safetyBoard.id, name: 'Main Table', viewType: 'table', isDefault: true, createdBy: safetyOfficer.id, settings: {} },
      { transaction }
    );
    await BoardView.create(
      { boardId: safetyBoard.id, name: 'Kanban by Status', viewType: 'kanban', isDefault: false, createdBy: safetyOfficer.id, settings: { groupByColumn: safeColStatus.id } },
      { transaction }
    );

    log('"Safety Compliance" created with 4 groups, 7 columns, 40 items, 2 views.');

    // =====================================================================
    // AUTOMATIONS
    // =====================================================================
    log('Creating automations...');

    // 1. Project Milestone Alert
    const auto1 = await Automation.create(
      {
        boardId: projectBoard.id,
        name: 'Project Milestone Alert',
        triggerType: 'on_date_reached',
        triggerConfig: {
          columnId: projColEnd.id,
          offsetDays: -7,
          description: 'Triggers 7 days before project end date to notify PM and team of upcoming milestone.',
        },
        actionType: 'send_notification',
        actionConfig: {
          title: 'Project Milestone Approaching',
          message: 'Project {{item.name}} is 7 days from its scheduled end date. Review progress and update status.',
          notifyColumns: [projColPM.id],
          type: 'warning',
        },
        isActive: true,
        createdBy: ceoUser.id,
      },
      { transaction }
    );

    // 2. Equipment Maintenance Scheduler
    const auto2 = await Automation.create(
      {
        boardId: equipBoard.id,
        name: 'Equipment Maintenance Due',
        triggerType: 'on_date_reached',
        triggerConfig: {
          columnId: eqColLastMaint.id,
          offsetDays: 90,
          description: 'When last maintenance was more than 3 months ago, schedule maintenance.',
        },
        actionType: 'update_status',
        actionConfig: {
          columnId: eqColStatus.id,
          newValue: 'maintenance',
          notificationTitle: 'Maintenance Overdue',
          notificationMessage: 'Equipment {{item.name}} ({{Equipment ID}}) has exceeded 3-month maintenance interval. Schedule service immediately.',
        },
        isActive: true,
        createdBy: siteManager.id,
      },
      { transaction }
    );

    // 3. Subcontractor Performance Review
    const auto3 = await Automation.create(
      {
        boardId: projectBoard.id,
        name: 'Subcontractor Performance Review',
        triggerType: 'on_status_changed',
        triggerConfig: {
          columnId: projColStatus.id,
          fromValue: 'punch_list',
          toValue: 'closeout',
          description: 'When a project moves to Closeout phase, trigger vendor rating forms for all assigned subcontractors.',
        },
        actionType: 'create_activity',
        actionConfig: {
          activityType: 'vendor_review',
          title: 'Vendor Performance Review Required',
          message: 'Project {{item.name}} has reached Closeout. Submit performance ratings for all subcontractors on this project.',
          assignTo: 'project_manager',
        },
        isActive: true,
        createdBy: pmUser.id,
      },
      { transaction }
    );

    // 4. Safety Inspection Due
    const auto4 = await Automation.create(
      {
        boardId: safetyBoard.id,
        name: 'Safety Inspection Due',
        triggerType: 'on_recurring',
        triggerConfig: {
          interval: 'monthly',
          dayOfMonth: 1,
          description: 'On the 1st of each month, check all sites for inspections older than 6 months and flag them.',
        },
        actionType: 'send_notification',
        actionConfig: {
          title: 'Safety Inspection Due',
          message: 'Monthly safety inspection reminder: Review all active job sites for inspections older than 6 months. Flag overdue sites for immediate scheduling.',
          notifyUsers: [safetyOfficer.id, siteManager.id],
          type: 'warning',
        },
        isActive: true,
        createdBy: safetyOfficer.id,
      },
      { transaction }
    );

    // Create sample automation logs for each
    const automations = [auto1, auto2, auto3, auto4];
    for (const auto of automations) {
      await AutomationLog.create(
        {
          automationId: auto.id,
          status: 'success',
          triggerData: { triggeredAt: '2026-03-15T09:00:00Z', source: 'scheduler' },
          actionResult: { notificationsSent: 1, message: 'Automation executed successfully' },
          executedAt: new Date('2026-03-15T09:00:00Z'),
        },
        { transaction }
      );
    }

    log('4 automations created with execution logs.');

    // =====================================================================
    // NOTIFICATIONS
    // =====================================================================
    await Notification.bulkCreate(
      [
        {
          userId: pmUser.id,
          workspaceId: workspace.id,
          title: 'Project Milestone: Oakridge HQ nearing completion',
          message: 'Oakridge Corporate Headquarters is entering punch list phase. Review remaining items.',
          type: 'warning',
          isRead: false,
        },
        {
          userId: safetyOfficer.id,
          workspaceId: workspace.id,
          title: 'Safety Alert: Scaffolding inspection failed',
          message: 'Scaffolding inspection at Oakridge HQ failed. Corrective action required within 48 hours.',
          type: 'error',
          isRead: false,
        },
        {
          userId: siteManager.id,
          workspaceId: workspace.id,
          title: 'Equipment: 3 items due for maintenance',
          message: 'Manitowoc 999 Crane, John Deere 850K Bulldozer, and PERI Scaffolding Set B are overdue for scheduled maintenance.',
          type: 'warning',
          isRead: false,
        },
        {
          userId: ceoUser.id,
          workspaceId: workspace.id,
          title: 'New bid opportunity: Riverfront Mixed-Use Tower',
          message: 'Bid package received for the Riverfront Mixed-Use Tower project in Austin, TX. $28.5M estimated value.',
          type: 'info',
          isRead: true,
        },
      ],
      { transaction }
    );

    // ─── Commit ──────────────────────────────────────────────────────────
    await transaction.commit();

    log('══════════════════════════════════════════════════');
    log('CraneStack database seeded successfully!');
    log('');
    log('Users:');
    log('  admin@cranestack.com     / admin    (admin)');
    log('  ceo@cranestack.com       / demo123  (admin)  — Marcus Crane');
    log('  pm@cranestack.com        / demo123  (member) — Sarah Nguyen');
    log('  site@cranestack.com      / demo123  (member) — Jake Morrison');
    log('  safety@cranestack.com    / demo123  (member) — Linda Castillo');
    log('  estimator@cranestack.com / demo123  (member) — Tony Russo');
    log('  viewer@cranestack.com    / demo123  (viewer)');
    log('');
    log('Boards:');
    log('  1. Project Pipeline      (5 groups, 7 cols, 12 items)');
    log('  2. Equipment Tracker     (4 groups, 7 cols, 30 items)');
    log('  3. Subcontractor Board   (3 groups, 6 cols, 50 items)');
    log('  4. Safety Compliance     (4 groups, 7 cols, 40 items)');
    log('');
    log('Automations: 4 active');
    log('Total records: 132 items + 4 automations');
    log('══════════════════════════════════════════════════');
  } catch (error) {
    await transaction.rollback();
    logError('Seed failed — transaction rolled back.', error);
    throw error;
  }
}

// ─── Run seed when executed directly ────────────────────────────────────────

// Run standalone: npx ts-node src/seeds/cranestack/index.ts
if (require.main === module) {
  (async () => {
    try {
      log('Connecting to database...');
      await sequelize.authenticate();
      log('Database connection established.');
      await seedCraneStack();
    } catch (error) {
      logError('Seed process failed.', error);
      process.exit(1);
    } finally {
      await sequelize.close();
      log('Database connection closed.');
    }
  })();
}
