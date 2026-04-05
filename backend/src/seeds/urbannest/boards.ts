import Board from '../../models/Board';
import BoardGroup from '../../models/BoardGroup';
import BoardView from '../../models/BoardView';
import Column from '../../models/Column';
import { UrbanNestContext } from './workspace';

export interface BoardContext {
  boardId: number;
  groups: Record<string, number>;
  columns: Record<string, number>;
}

export interface UrbanNestBoards {
  leadPipeline: BoardContext;
  propertyListings: BoardContext;
  showingScheduler: BoardContext;
}

export async function seedUrbanNestBoards(ctx: UrbanNestContext): Promise<UrbanNestBoards> {
  console.log('[UrbanNest] Seeding boards, columns, and groups...');

  const leadPipeline = await createLeadPipeline(ctx);
  const propertyListings = await createPropertyListings(ctx);
  const showingScheduler = await createShowingScheduler(ctx);

  return { leadPipeline, propertyListings, showingScheduler };
}

// ─── Board 1: Lead Pipeline ────────────────────────────────────────────────────

async function createLeadPipeline(ctx: UrbanNestContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Lead Pipeline',
    description: 'Prospect qualification through closing — track every buyer and seller lead',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'users', color: '#D97706' },
  });

  // Groups (pipeline stages)
  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'New Leads', color: '#94A3B8', position: 0 },
    { name: 'Contacted', color: '#60A5FA', position: 1 },
    { name: 'Showing Scheduled', color: '#A78BFA', position: 2 },
    { name: 'Offer Stage', color: '#FBBF24', position: 3 },
    { name: 'Under Contract', color: '#FB923C', position: 4 },
    { name: 'Closed', color: '#34D399', position: 5 },
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
          { label: 'New', color: '#94A3B8', order: 0 },
          { label: 'Contacted', color: '#60A5FA', order: 1 },
          { label: 'Showing', color: '#A78BFA', order: 2 },
          { label: 'Offer', color: '#FBBF24', order: 3 },
          { label: 'Closing', color: '#FB923C', order: 4 },
          { label: 'Closed', color: '#34D399', order: 5 },
        ],
        default_option: 'New',
      },
    },
    {
      name: 'Lead Type',
      columnType: 'dropdown' as const,
      position: 1,
      width: 120,
      config: {
        options: [
          { id: 'buyer', label: 'Buyer', color: '#2563EB', order: 0 },
          { id: 'seller', label: 'Seller', color: '#7C3AED', order: 1 },
          { id: 'both', label: 'Both', color: '#D97706', order: 2 },
          { id: 'renter', label: 'Renter', color: '#059669', order: 3 },
        ],
      },
    },
    {
      name: 'Property Interest',
      columnType: 'text' as const,
      position: 2,
      width: 200,
      config: {},
    },
    {
      name: 'Budget',
      columnType: 'number' as const,
      position: 3,
      width: 130,
      config: { format: 'currency', decimal_places: 0, currency: 'USD' },
    },
    {
      name: 'Contact Email',
      columnType: 'email' as const,
      position: 4,
      width: 180,
      config: {},
    },
    {
      name: 'Contact Phone',
      columnType: 'phone' as const,
      position: 5,
      width: 140,
      config: {},
    },
    {
      name: 'Last Contact',
      columnType: 'date' as const,
      position: 6,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Agent',
      columnType: 'person' as const,
      position: 7,
      width: 150,
      config: { allow_multiple: false },
    },
    {
      name: 'Source',
      columnType: 'dropdown' as const,
      position: 8,
      width: 130,
      config: {
        options: [
          { id: 'zillow', label: 'Zillow', color: '#2563EB', order: 0 },
          { id: 'realtor', label: 'Realtor.com', color: '#DC2626', order: 1 },
          { id: 'referral', label: 'Referral', color: '#059669', order: 2 },
          { id: 'open_house', label: 'Open House', color: '#D97706', order: 3 },
          { id: 'website', label: 'Website', color: '#7C3AED', order: 4 },
          { id: 'social', label: 'Social Media', color: '#EC4899', order: 5 },
          { id: 'cold_call', label: 'Cold Call', color: '#94A3B8', order: 6 },
        ],
      },
    },
    {
      name: 'Notes',
      columnType: 'long_text' as const,
      position: 9,
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
    name: 'Pipeline Table',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Kanban Pipeline',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[UrbanNest] Lead Pipeline board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Board 2: Property Listings ────────────────────────────────────────────────

async function createPropertyListings(ctx: UrbanNestContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Property Listings',
    description: 'Active, pending, and sold properties — the full inventory',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'home', color: '#B45309' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Active Listings', color: '#34D399', position: 0 },
    { name: 'Pending', color: '#FBBF24', position: 1 },
    { name: 'Sold', color: '#60A5FA', position: 2 },
    { name: 'Expired / Withdrawn', color: '#F87171', position: 3 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Address',
      columnType: 'text' as const,
      position: 0,
      width: 250,
      config: {},
      isRequired: true,
    },
    {
      name: 'Price',
      columnType: 'number' as const,
      position: 1,
      width: 130,
      config: { format: 'currency', decimal_places: 0, currency: 'USD' },
    },
    {
      name: 'Bedrooms',
      columnType: 'number' as const,
      position: 2,
      width: 90,
      config: { format: 'plain', decimal_places: 0, min_value: 0, max_value: 10 },
    },
    {
      name: 'Bathrooms',
      columnType: 'number' as const,
      position: 3,
      width: 100,
      config: { format: 'plain', decimal_places: 1, min_value: 0, max_value: 10 },
    },
    {
      name: 'Sq Ft',
      columnType: 'number' as const,
      position: 4,
      width: 100,
      config: { format: 'plain', decimal_places: 0 },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 5,
      width: 130,
      config: {
        options: [
          { label: 'Active', color: '#34D399', order: 0 },
          { label: 'Pending', color: '#FBBF24', order: 1 },
          { label: 'Sold', color: '#60A5FA', order: 2 },
          { label: 'Expired', color: '#F87171', order: 3 },
        ],
        default_option: 'Active',
      },
    },
    {
      name: 'Property Type',
      columnType: 'dropdown' as const,
      position: 6,
      width: 140,
      config: {
        options: [
          { id: 'single_family', label: 'Single Family', color: '#D97706', order: 0 },
          { id: 'condo', label: 'Condo', color: '#2563EB', order: 1 },
          { id: 'townhouse', label: 'Townhouse', color: '#7C3AED', order: 2 },
          { id: 'multi_family', label: 'Multi-Family', color: '#059669', order: 3 },
          { id: 'land', label: 'Land', color: '#94A3B8', order: 4 },
        ],
      },
    },
    {
      name: 'Neighborhood',
      columnType: 'text' as const,
      position: 7,
      width: 150,
      config: {},
    },
    {
      name: 'Listed Date',
      columnType: 'date' as const,
      position: 8,
      width: 130,
      config: { include_time: false },
    },
    {
      name: 'Listing Agent',
      columnType: 'person' as const,
      position: 9,
      width: 150,
      config: { allow_multiple: false },
    },
    {
      name: 'Year Built',
      columnType: 'number' as const,
      position: 10,
      width: 100,
      config: { format: 'plain', decimal_places: 0 },
    },
    {
      name: 'Description',
      columnType: 'long_text' as const,
      position: 11,
      width: 300,
      config: {},
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  await BoardView.create({
    boardId: board.id,
    name: 'All Listings',
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
    name: 'Listing Calendar',
    viewType: 'calendar',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { dateColumn: columns['Listed Date'] },
  });

  console.log(`[UrbanNest] Property Listings board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}

// ─── Board 3: Showing Scheduler ────────────────────────────────────────────────

async function createShowingScheduler(ctx: UrbanNestContext): Promise<BoardContext> {
  const board = await Board.create({
    name: 'Showing Scheduler',
    description: 'Property viewings — schedule, track, and collect feedback',
    workspaceId: ctx.workspaceId,
    createdBy: ctx.adminId,
    boardType: 'main',
    settings: { icon: 'calendar', color: '#FBBF24' },
  });

  const groups: Record<string, number> = {};
  const groupDefs = [
    { name: 'Scheduled', color: '#60A5FA', position: 0 },
    { name: 'Completed', color: '#34D399', position: 1 },
    { name: 'Cancelled', color: '#F87171', position: 2 },
  ];
  for (const g of groupDefs) {
    const group = await BoardGroup.create({ boardId: board.id, ...g });
    groups[g.name] = group.id;
  }

  const columns: Record<string, number> = {};
  const colDefs = [
    {
      name: 'Property',
      columnType: 'text' as const,
      position: 0,
      width: 250,
      config: {},
      isRequired: true,
    },
    {
      name: 'Prospect',
      columnType: 'text' as const,
      position: 1,
      width: 180,
      config: {},
    },
    {
      name: 'Showing Date',
      columnType: 'date' as const,
      position: 2,
      width: 160,
      config: { include_time: true },
    },
    {
      name: 'Status',
      columnType: 'status' as const,
      position: 3,
      width: 130,
      config: {
        options: [
          { label: 'Scheduled', color: '#60A5FA', order: 0 },
          { label: 'Completed', color: '#34D399', order: 1 },
          { label: 'Cancelled', color: '#F87171', order: 2 },
          { label: 'No Show', color: '#94A3B8', order: 3 },
        ],
        default_option: 'Scheduled',
      },
    },
    {
      name: 'Agent',
      columnType: 'person' as const,
      position: 4,
      width: 150,
      config: { allow_multiple: false },
    },
    {
      name: 'Feedback',
      columnType: 'long_text' as const,
      position: 5,
      width: 300,
      config: {},
    },
    {
      name: 'Interest Level',
      columnType: 'rating' as const,
      position: 6,
      width: 120,
      config: { max: 5 },
    },
    {
      name: 'Follow-Up Date',
      columnType: 'date' as const,
      position: 7,
      width: 140,
      config: { include_time: false },
    },
  ];

  for (const col of colDefs) {
    const column = await Column.create({ boardId: board.id, ...col });
    columns[col.name] = column.id;
  }

  await BoardView.create({
    boardId: board.id,
    name: 'Showing List',
    viewType: 'table',
    isDefault: true,
    createdBy: ctx.adminId,
    settings: { groupBy: 'status' },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Showing Calendar',
    viewType: 'calendar',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { dateColumn: columns['Showing Date'] },
  });

  await BoardView.create({
    boardId: board.id,
    name: 'Status Board',
    viewType: 'kanban',
    isDefault: false,
    createdBy: ctx.adminId,
    settings: { groupByColumn: columns['Status'] },
  });

  console.log(`[UrbanNest] Showing Scheduler board (id=${board.id}): ${colDefs.length} columns, ${groupDefs.length} groups`);
  return { boardId: board.id, groups, columns };
}
