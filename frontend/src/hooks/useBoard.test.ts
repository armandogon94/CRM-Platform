import { describe, it, expect } from 'vitest';
import type { Item, Board, BoardGroup, Column, ColumnValue } from '@/types';
import {
  addItem,
  updateItem,
  removeItem,
  updateColumnValue,
  addGroup,
  updateGroup,
  removeGroup,
  addColumn,
  updateColumn,
  removeColumn,
} from './useBoard';

// --- Fixtures ---

function makeItem(overrides: Partial<Item> = {}): Item {
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

function makeBoard(overrides: Partial<Board> = {}): Board {
  return {
    id: 10,
    name: 'Test Board',
    description: null,
    workspaceId: 1,
    boardType: 'board',
    groups: [],
    columns: [],
    views: [],
    ...overrides,
  };
}

function makeGroup(overrides: Partial<BoardGroup> = {}): BoardGroup {
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

function makeColumn(overrides: Partial<Column> = {}): Column {
  return {
    id: 200,
    boardId: 10,
    name: 'Status',
    columnType: 'status',
    config: {},
    position: 0,
    width: 150,
    isRequired: false,
    ...overrides,
  };
}

// --- Item state helpers ---

describe('addItem', () => {
  it('appends a new item to the list', () => {
    const existing = [makeItem({ id: 1 })];
    const newItem = makeItem({ id: 2, name: 'New' });
    const result = addItem(existing, newItem);
    expect(result).toHaveLength(2);
    expect(result[1].id).toBe(2);
  });

  it('does not duplicate an item that already exists', () => {
    const existing = [makeItem({ id: 1 })];
    const duplicate = makeItem({ id: 1, name: 'Duplicate' });
    const result = addItem(existing, duplicate);
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Test Item'); // unchanged
  });
});

describe('updateItem', () => {
  it('replaces the matching item in the list', () => {
    const items = [makeItem({ id: 1, name: 'Old' }), makeItem({ id: 2, name: 'Other' })];
    const updated = makeItem({ id: 1, name: 'Updated' });
    const result = updateItem(items, updated);
    expect(result[0].name).toBe('Updated');
    expect(result[1].name).toBe('Other');
  });

  it('returns unchanged list when id not found', () => {
    const items = [makeItem({ id: 1 })];
    const missing = makeItem({ id: 99, name: 'Ghost' });
    const result = updateItem(items, missing);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });
});

describe('removeItem', () => {
  it('filters out the item by id', () => {
    const items = [makeItem({ id: 1 }), makeItem({ id: 2 }), makeItem({ id: 3 })];
    const result = removeItem(items, 2);
    expect(result).toHaveLength(2);
    expect(result.map((i) => i.id)).toEqual([1, 3]);
  });

  it('returns unchanged list when id not found', () => {
    const items = [makeItem({ id: 1 })];
    const result = removeItem(items, 99);
    expect(result).toHaveLength(1);
  });
});

describe('updateColumnValue', () => {
  it('updates an existing column value on the correct item', () => {
    const cv: ColumnValue = { id: 500, itemId: 1, columnId: 200, value: 'Working' };
    const items = [makeItem({ id: 1, columnValues: [cv] })];
    const newCv: ColumnValue = { id: 500, itemId: 1, columnId: 200, value: 'Done' };
    const result = updateColumnValue(items, 1, 200, newCv);
    expect(result[0].columnValues[0].value).toBe('Done');
  });

  it('appends a new column value when columnId not found on item', () => {
    const items = [makeItem({ id: 1, columnValues: [] })];
    const newCv: ColumnValue = { id: 501, itemId: 1, columnId: 300, value: 'Hello' };
    const result = updateColumnValue(items, 1, 300, newCv);
    expect(result[0].columnValues).toHaveLength(1);
    expect(result[0].columnValues[0].columnId).toBe(300);
  });

  it('does not modify items that do not match itemId', () => {
    const items = [makeItem({ id: 1 }), makeItem({ id: 2 })];
    const cv: ColumnValue = { id: 502, itemId: 1, columnId: 200, value: 'X' };
    const result = updateColumnValue(items, 1, 200, cv);
    expect(result[1]).toBe(items[1]); // reference unchanged
  });
});

// --- Group state helpers ---

describe('addGroup', () => {
  it('appends a new group to the board', () => {
    const board = makeBoard({ groups: [makeGroup({ id: 100 })] });
    const newGroup = makeGroup({ id: 101, name: 'Group B' });
    const result = addGroup(board, newGroup);
    expect(result.groups).toHaveLength(2);
    expect(result.groups[1].name).toBe('Group B');
  });

  it('does not duplicate a group that already exists', () => {
    const board = makeBoard({ groups: [makeGroup({ id: 100 })] });
    const dup = makeGroup({ id: 100, name: 'Dup' });
    const result = addGroup(board, dup);
    expect(result.groups).toHaveLength(1);
  });
});

describe('updateGroup', () => {
  it('updates the matching group in the board', () => {
    const board = makeBoard({ groups: [makeGroup({ id: 100, name: 'Old' })] });
    const updated = makeGroup({ id: 100, name: 'Renamed' });
    const result = updateGroup(board, updated);
    expect(result.groups[0].name).toBe('Renamed');
  });
});

describe('removeGroup', () => {
  it('removes the group by id', () => {
    const board = makeBoard({
      groups: [makeGroup({ id: 100 }), makeGroup({ id: 101 })],
    });
    const result = removeGroup(board, 100);
    expect(result.groups).toHaveLength(1);
    expect(result.groups[0].id).toBe(101);
  });
});

// --- Column state helpers ---

describe('addColumn', () => {
  it('appends a new column to the board', () => {
    const board = makeBoard({ columns: [makeColumn({ id: 200 })] });
    const newCol = makeColumn({ id: 201, name: 'Priority' });
    const result = addColumn(board, newCol);
    expect(result.columns).toHaveLength(2);
    expect(result.columns[1].name).toBe('Priority');
  });

  it('does not duplicate a column that already exists', () => {
    const board = makeBoard({ columns: [makeColumn({ id: 200 })] });
    const dup = makeColumn({ id: 200, name: 'Dup' });
    const result = addColumn(board, dup);
    expect(result.columns).toHaveLength(1);
  });
});

describe('updateColumn', () => {
  it('updates the matching column in the board', () => {
    const board = makeBoard({ columns: [makeColumn({ id: 200, name: 'Old' })] });
    const updated = makeColumn({ id: 200, name: 'Renamed' });
    const result = updateColumn(board, updated);
    expect(result.columns[0].name).toBe('Renamed');
  });
});

describe('removeColumn', () => {
  it('removes the column by id', () => {
    const board = makeBoard({
      columns: [makeColumn({ id: 200 }), makeColumn({ id: 201 })],
    });
    const result = removeColumn(board, 200);
    expect(result.columns).toHaveLength(1);
    expect(result.columns[0].id).toBe(201);
  });
});
