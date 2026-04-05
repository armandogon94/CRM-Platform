import { Board, BoardGroup, BoardView, Column } from '../../models';
import { TableSyncContext } from './workspace';

export interface TableSyncBoards {
  reservationBoard: BoardContext;
  menuBoard: BoardContext;
  staffBoard: BoardContext;
}

export interface BoardContext {
  boardId: number;
  groups: Record<string, number>;
  columns: Record<string, number>;
}

export async function seedTableSyncBoards(ctx: TableSyncContext): Promise<TableSyncBoards> {
  console.log('[TableSync] Seeding boards, columns, and groups...');

  const reservationBoard = await createReservationBoard(ctx);
  const menuBoard = await createMenuBoard(ctx);
  const staffBoard = await createStaffScheduleBoard(ctx);

  return { reservationBoard, menuBoard, staffBoard };
}

// ─── Reservation Board ───────────────────────────────────────────────
async function createReservationBoard(ctx: TableSyncContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Reservation Board',
    description: 'Booking management — track guest reservations, party sizes, table assignments, and dining status',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'calendar-clock', color: '#9F1239' },
  });

  // Groups
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Requested', color: '#94A3B8', position: 0 },
    { name: 'Confirmed', color: '#60A5FA', position: 1 },
    { name: 'Seated', color: '#A78BFA', position: 2 },
    { name: 'Completed', color: '#34D399', position: 3 },
    { name: 'No-Show', color: '#FB923C', position: 4 },
    { name: 'Cancelled', color: '#F87171', position: 5 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  // Columns
  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Guest Name',
      columnType: 'person' as const,
      position: 0,
      width: 180,
      config: { allow_multiple: false },
      isRequired: true,
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 1,
      width: 140,
      config: {
        options: [
          { label: 'Requested', color: '#94A3B8', order: 0 },
          { label: 'Confirmed', color: '#60A5FA', order: 1 },
          { label: 'Seated', color: '#A78BFA', order: 2 },
          { label: 'Completed', color: '#34D399', order: 3 },
          { label: 'No-Show', color: '#FB923C', order: 4 },
          { label: 'Cancelled', color: '#F87171', order: 5 },
        ],
        default_option: 'Requested',
      },
    },
    {
      name: 'Party Size',
      columnType: 'number' as const,
      position: 2,
      width: 110,
      config: { format: 'plain', decimal_places: 0, min_value: 1, max_value: 20 },
    },
    {
      name: 'Reservation Time',
      columnType: 'date' as const,
      position: 3,
      width: 170,
      config: { include_time: true },
    },
    {
      name: 'Table',
      columnType: 'dropdown' as const,
      position: 4,
      width: 120,
      config: {
        options: Array.from({ length: 20 }, (_, i) => ({
          id: `table_${i + 1}`,
          label: `Table ${i + 1}`,
          color: i < 6 ? '#34D399' : i < 12 ? '#60A5FA' : i < 16 ? '#A78BFA' : '#FCD34D',
          order: i,
        })),
      },
    },
    {
      name: 'Special Notes',
      columnType: 'long_text' as const,
      position: 5,
      width: 250,
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
    name: 'Status Board',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Calendar',
    viewType: 'calendar',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { dateColumn: columns['Reservation Time'] },
  });

  console.log(`[TableSync] Reservation Board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Menu Management Board ───────────────────────────────────────────
async function createMenuBoard(ctx: TableSyncContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Menu Management',
    description: 'Dishes & categories — manage pricing, availability, ingredients, and photos',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.headChefId,
    boardType: 'main',
    settings: { icon: 'utensils', color: '#BE123C' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Appetizers', color: '#FB923C', position: 0 },
    { name: 'Entrees', color: '#9F1239', position: 1 },
    { name: 'Desserts', color: '#A78BFA', position: 2 },
    { name: 'Beverages', color: '#60A5FA', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Dish Name',
      columnType: 'text' as const,
      position: 0,
      width: 200,
      config: {},
      isRequired: true,
    },
    {
      name: 'Category',
      columnType: 'dropdown' as const,
      position: 1,
      width: 140,
      config: {
        options: [
          { id: 'appetizers', label: 'Appetizers', color: '#FB923C', order: 0 },
          { id: 'entrees', label: 'Entrees', color: '#9F1239', order: 1 },
          { id: 'desserts', label: 'Desserts', color: '#A78BFA', order: 2 },
          { id: 'beverages', label: 'Beverages', color: '#60A5FA', order: 3 },
        ],
      },
    },
    {
      name: 'Price',
      columnType: 'number' as const,
      position: 2,
      width: 110,
      config: { format: 'currency', decimal_places: 2, currency: 'USD' },
    },
    {
      name: 'Available',
      columnType: 'checkbox' as const,
      position: 3,
      width: 100,
      config: {},
    },
    {
      name: 'Ingredients',
      columnType: 'long_text' as const,
      position: 4,
      width: 280,
      config: {},
    },
    {
      name: 'Photo',
      columnType: 'files' as const,
      position: 5,
      width: 120,
      config: { max_files: 3, accepted_types: ['image/jpeg', 'image/png', 'image/webp'] },
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
    createdBy: ctx.headChefId,
    settings: { groupBy: 'category' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'By Category',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.headChefId,
    settings: { groupByColumn: columns['Category'] },
  });

  console.log(`[TableSync] Menu Management board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Staff Schedule Board ────────────────────────────────────────────
async function createStaffScheduleBoard(ctx: TableSyncContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Staff Schedule',
    description: 'Shift assignments — manage staff roles, shift times, and attendance status',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.gmId,
    boardType: 'main',
    settings: { icon: 'users', color: '#881337' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Scheduled', color: '#60A5FA', position: 0 },
    { name: 'Confirmed', color: '#34D399', position: 1 },
    { name: 'Completed', color: '#94A3B8', position: 2 },
    { name: 'Called Out', color: '#F87171', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Staff Member',
      columnType: 'person' as const,
      position: 0,
      width: 180,
      config: { allow_multiple: false },
      isRequired: true,
    },
    {
      name: 'Role',
      columnType: 'dropdown' as const,
      position: 1,
      width: 130,
      config: {
        options: [
          { id: 'server', label: 'Server', color: '#60A5FA', order: 0 },
          { id: 'host', label: 'Host', color: '#34D399', order: 1 },
          { id: 'chef', label: 'Chef', color: '#FB923C', order: 2 },
          { id: 'busser', label: 'Busser', color: '#A78BFA', order: 3 },
          { id: 'manager', label: 'Manager', color: '#9F1239', order: 4 },
        ],
      },
    },
    {
      name: 'Shift Date',
      columnType: 'date' as const,
      position: 2,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Start Time',
      columnType: 'date' as const,
      position: 3,
      width: 140,
      config: { include_time: true },
    },
    {
      name: 'End Time',
      columnType: 'date' as const,
      position: 4,
      width: 140,
      config: { include_time: true },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 5,
      width: 140,
      config: {
        options: [
          { label: 'Scheduled', color: '#60A5FA', order: 0 },
          { label: 'Confirmed', color: '#34D399', order: 1 },
          { label: 'Completed', color: '#94A3B8', order: 2 },
          { label: 'Called Out', color: '#F87171', order: 3 },
        ],
        default_option: 'Scheduled',
      },
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
    createdBy: ctx.gmId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Weekly Calendar',
    viewType: 'calendar',
    isDefault: false,
    createdBy: ctx.gmId,
    settings: { dateColumn: columns['Shift Date'] },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'By Role',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.gmId,
    settings: { groupByColumn: columns['Role'] },
  });

  console.log(`[TableSync] Staff Schedule board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}
