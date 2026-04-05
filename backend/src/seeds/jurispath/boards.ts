import { Board, BoardGroup, BoardView, Column } from '../../models';
import { JurisPathContext } from './workspace';

export interface JurisPathBoards {
  caseBoard: BoardContext;
  intakeBoard: BoardContext;
  billingBoard: BoardContext;
}

export interface BoardContext {
  boardId: number;
  groups: Record<string, number>;
  columns: Record<string, number>;
}

export async function seedJurisPathBoards(ctx: JurisPathContext): Promise<JurisPathBoards> {
  console.log('[JurisPath] Seeding boards, columns, and groups...');

  const caseBoard = await createCaseManagement(ctx);
  const intakeBoard = await createClientIntake(ctx);
  const billingBoard = await createBillingTracker(ctx);

  return { caseBoard, intakeBoard, billingBoard };
}

// ─── Board 1: Case Management ───────────────────────────────────────────────

async function createCaseManagement(ctx: JurisPathContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Case Management',
    description: 'Full case lifecycle tracking — intake through closure across all practice areas',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'briefcase', color: '#166534' },
  });

  // Groups — case lifecycle stages
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Intake', color: '#94A3B8', position: 0 },
    { name: 'Discovery', color: '#60A5FA', position: 1 },
    { name: 'Motions', color: '#A78BFA', position: 2 },
    { name: 'Trial', color: '#FB923C', position: 3 },
    { name: 'Closed', color: '#34D399', position: 4 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  // Columns
  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 0,
      width: 140,
      config: {
        options: [
          { label: 'Intake', color: '#94A3B8', order: 0 },
          { label: 'Discovery', color: '#60A5FA', order: 1 },
          { label: 'Motions', color: '#A78BFA', order: 2 },
          { label: 'Trial', color: '#FB923C', order: 3 },
          { label: 'Closed', color: '#34D399', order: 4 },
        ],
        default_option: 'Intake',
      },
    },
    {
      name: 'Client',
      columnType: 'person' as const,
      position: 1,
      width: 160,
      config: { allow_multiple: false },
    },
    {
      name: 'Lead Attorney',
      columnType: 'person' as const,
      position: 2,
      width: 160,
      config: { allow_multiple: false },
    },
    {
      name: 'Case Type',
      columnType: 'dropdown' as const,
      position: 3,
      width: 140,
      config: {
        options: [
          { id: 'litigation', label: 'Litigation', color: '#DC2626', order: 0 },
          { id: 'corporate', label: 'Corporate', color: '#2563EB', order: 1 },
          { id: 'ip', label: 'IP', color: '#7C3AED', order: 2 },
          { id: 'other', label: 'Other', color: '#94A3B8', order: 3 },
        ],
      },
    },
    {
      name: 'Filing Date',
      columnType: 'date' as const,
      position: 4,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Completion Date',
      columnType: 'date' as const,
      position: 5,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Case Notes',
      columnType: 'long_text' as const,
      position: 6,
      width: 280,
      config: {},
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  // Views
  await BoardView.create({
    boardId: board.id,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Case Pipeline',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[JurisPath] Case Management board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Board 2: Client Intake ─────────────────────────────────────────────────

async function createClientIntake(ctx: JurisPathContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Client Intake',
    description: 'New client onboarding — inquiry, consultation, engagement, and conflict checks',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'user-plus', color: '#14532D' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Inquiry', color: '#94A3B8', position: 0 },
    { name: 'Consultation', color: '#FCD34D', position: 1 },
    { name: 'Engaged', color: '#34D399', position: 2 },
    { name: 'Completed', color: '#60A5FA', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Client Name',
      columnType: 'text' as const,
      position: 0,
      width: 200,
      config: {},
      isRequired: true,
    },
    {
      name: 'Contact Info',
      columnType: 'text' as const,
      position: 1,
      width: 220,
      config: {},
    },
    {
      name: 'Matter Type',
      columnType: 'dropdown' as const,
      position: 2,
      width: 140,
      config: {
        options: [
          { id: 'litigation', label: 'Litigation', color: '#DC2626', order: 0 },
          { id: 'corporate', label: 'Corporate', color: '#2563EB', order: 1 },
          { id: 'ip', label: 'IP', color: '#7C3AED', order: 2 },
        ],
      },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 3,
      width: 140,
      config: {
        options: [
          { label: 'Inquiry', color: '#94A3B8', order: 0 },
          { label: 'Consultation', color: '#FCD34D', order: 1 },
          { label: 'Engaged', color: '#34D399', order: 2 },
          { label: 'Completed', color: '#60A5FA', order: 3 },
        ],
        default_option: 'Inquiry',
      },
    },
    {
      name: 'Initial Consultation',
      columnType: 'date' as const,
      position: 4,
      width: 150,
      config: { include_time: false },
    },
    {
      name: 'Assigned Attorney',
      columnType: 'person' as const,
      position: 5,
      width: 160,
      config: { allow_multiple: false },
    },
    {
      name: 'Intake Notes',
      columnType: 'long_text' as const,
      position: 6,
      width: 260,
      config: {},
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  await BoardView.create({
    boardId: board.id,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Intake Pipeline',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[JurisPath] Client Intake board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Board 3: Billing Tracker ───────────────────────────────────────────────

async function createBillingTracker(ctx: JurisPathContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Billing Tracker',
    description: 'Invoice management — time tracking, billing, and collections across all matters',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'receipt', color: '#059669' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Draft', color: '#94A3B8', position: 0 },
    { name: 'Sent', color: '#60A5FA', position: 1 },
    { name: 'Paid', color: '#34D399', position: 2 },
    { name: 'Overdue', color: '#F87171', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Invoice Number',
      columnType: 'text' as const,
      position: 0,
      width: 140,
      config: {},
      isRequired: true,
    },
    {
      name: 'Client',
      columnType: 'text' as const,
      position: 1,
      width: 180,
      config: {},
    },
    {
      name: 'Amount',
      columnType: 'number' as const,
      position: 2,
      width: 130,
      config: { format: 'currency', decimal_places: 2, currency: 'USD' },
    },
    {
      name: 'Hours',
      columnType: 'number' as const,
      position: 3,
      width: 100,
      config: { format: 'plain', decimal_places: 1 },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 4,
      width: 130,
      config: {
        options: [
          { label: 'Draft', color: '#94A3B8', order: 0 },
          { label: 'Sent', color: '#60A5FA', order: 1 },
          { label: 'Paid', color: '#34D399', order: 2 },
          { label: 'Overdue', color: '#F87171', order: 3 },
        ],
        default_option: 'Draft',
      },
    },
    {
      name: 'Due Date',
      columnType: 'date' as const,
      position: 5,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Matter Reference',
      columnType: 'text' as const,
      position: 6,
      width: 180,
      config: {},
    },
    {
      name: 'Billing Attorney',
      columnType: 'person' as const,
      position: 7,
      width: 160,
      config: { allow_multiple: false },
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  await BoardView.create({
    boardId: board.id,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Collections Board',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[JurisPath] Billing Tracker board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}
