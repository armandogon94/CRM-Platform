import type { User, Workspace, Board, BoardGroup, Column, Item, ColumnValue, BoardView } from '@/types';

// --- Builder functions ---

export function makeUser(overrides: Partial<User> = {}): User {
  return {
    id: 1,
    email: 'admin@crm-platform.com',
    firstName: 'Admin',
    lastName: 'User',
    avatar: null,
    role: 'admin',
    workspaceId: 1,
    ...overrides,
  };
}

export function makeWorkspace(overrides: Partial<Workspace> = {}): Workspace {
  return {
    id: 1,
    name: 'Test Workspace',
    slug: 'test-workspace',
    description: null,
    ...overrides,
  };
}

export function makeColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: 200,
    boardId: 10,
    name: 'Text Column',
    columnType: 'text',
    config: {},
    position: 0,
    width: 200,
    isRequired: false,
    ...overrides,
  };
}

export function makeGroup(overrides: Partial<BoardGroup> = {}): BoardGroup {
  return {
    id: 100,
    boardId: 10,
    name: 'Group A',
    color: '#579BFC',
    position: 0,
    isCollapsed: false,
    ...overrides,
  };
}

export function makeItem(overrides: Partial<Item> = {}): Item {
  return {
    id: 1,
    boardId: 10,
    groupId: 100,
    name: 'Test Item',
    position: 0,
    createdBy: 1,
    columnValues: [],
    ...overrides,
  };
}

export function makeColumnValue(overrides: Partial<ColumnValue> = {}): ColumnValue {
  return {
    id: 1,
    itemId: 1,
    columnId: 200,
    value: null,
    ...overrides,
  };
}

export function makeBoardView(overrides: Partial<BoardView> = {}): BoardView {
  return {
    id: 1,
    boardId: 10,
    name: 'Table View',
    viewType: 'table',
    settings: {},
    layoutJson: null,
    isDefault: true,
    ...overrides,
  };
}

export function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 10,
    name: 'Test Board',
    description: null,
    workspaceId: 1,
    boardType: 'board',
    groups: [],
    columns: [],
    views: [makeBoardView()],
    ...overrides,
  };
}

// --- Pre-built fixtures for common test scenarios ---

export const STATUS_COLUMN = makeColumn({
  id: 201,
  name: 'Status',
  columnType: 'status',
  config: {
    options: [
      { label: 'Not started', color: '#c4c4c4' },
      { label: 'Working on it', color: '#fdab3d' },
      { label: 'Done', color: '#00c875' },
      { label: 'Stuck', color: '#e2445c' },
    ],
  },
  position: 0,
});

export const TEXT_COLUMN = makeColumn({
  id: 202,
  name: 'Notes',
  columnType: 'text',
  position: 1,
});

export const DATE_COLUMN = makeColumn({
  id: 203,
  name: 'Due Date',
  columnType: 'date',
  config: { include_time: false },
  position: 2,
});

export const NUMBER_COLUMN = makeColumn({
  id: 204,
  name: 'Budget',
  columnType: 'number',
  config: { format: 'currency', prefix: '$' },
  position: 3,
});

export const MOCK_USER = makeUser();

export const MOCK_WORKSPACE = makeWorkspace();

export const MOCK_BOARD = makeBoard({
  groups: [
    makeGroup({ id: 100, name: 'Sprint 1', color: '#579BFC', position: 0 }),
    makeGroup({ id: 101, name: 'Sprint 2', color: '#a25ddc', position: 1 }),
  ],
  columns: [STATUS_COLUMN, TEXT_COLUMN, DATE_COLUMN],
  views: [
    makeBoardView({ id: 1, viewType: 'table', name: 'Table', isDefault: true }),
    makeBoardView({ id: 2, viewType: 'kanban', name: 'Kanban', isDefault: false }),
    makeBoardView({ id: 3, viewType: 'calendar', name: 'Calendar', isDefault: false }),
    makeBoardView({ id: 4, viewType: 'dashboard', name: 'Dashboard', isDefault: false }),
    makeBoardView({ id: 5, viewType: 'map', name: 'Map', isDefault: false }),
  ],
});

export const MOCK_ITEMS: Item[] = [
  makeItem({
    id: 1,
    name: 'Item One',
    groupId: 100,
    columnValues: [
      makeColumnValue({ id: 1, itemId: 1, columnId: 201, value: { label: 'Done', color: '#00c875' } }),
    ],
  }),
  makeItem({
    id: 2,
    name: 'Item Two',
    groupId: 100,
    columnValues: [
      makeColumnValue({ id: 2, itemId: 2, columnId: 201, value: { label: 'Working on it', color: '#fdab3d' } }),
    ],
  }),
  makeItem({
    id: 3,
    name: 'Item Three',
    groupId: 101,
    columnValues: [
      makeColumnValue({ id: 3, itemId: 3, columnId: 201, value: { label: 'Not started', color: '#c4c4c4' } }),
    ],
  }),
];
