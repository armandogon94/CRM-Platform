/**
 * Test factory helpers for generating consistent mock objects.
 */

export function createTestUser(overrides?: Partial<any>) {
  return {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'admin',
    workspaceId: 1,
    ...overrides,
  };
}

export function createTestBoard(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test Board',
    workspaceId: 1,
    boardType: 'main',
    description: null,
    settings: {},
    createdBy: 1,
    ...overrides,
  };
}

export function createTestItem(overrides?: Partial<any>) {
  return {
    id: 1,
    boardId: 1,
    groupId: 1,
    name: 'Test Item',
    position: 0,
    createdBy: 1,
    ...overrides,
  };
}

export function createTestGroup(overrides?: Partial<any>) {
  return {
    id: 1,
    boardId: 1,
    name: 'Test Group',
    color: '#579BFC',
    position: 0,
    ...overrides,
  };
}

export function createTestColumn(overrides?: Partial<any>) {
  return {
    id: 1,
    boardId: 1,
    name: 'Status',
    columnType: 'status',
    config: { labels: ['Done', 'Working on it', 'Stuck'] },
    position: 0,
    width: 150,
    isRequired: false,
    ...overrides,
  };
}

export function createTestColumnValue(overrides?: Partial<any>) {
  return {
    id: 1,
    itemId: 1,
    columnId: 1,
    value: 'Done',
    ...overrides,
  };
}

export function createTestView(overrides?: Partial<any>) {
  return {
    id: 1,
    boardId: 1,
    name: 'Main Table',
    viewType: 'table',
    isDefault: true,
    settings: {},
    createdBy: 1,
    ...overrides,
  };
}

export function createTestWorkspace(overrides?: Partial<any>) {
  return {
    id: 1,
    name: 'Test Workspace',
    slug: 'test-workspace',
    description: null,
    settings: {},
    createdBy: 1,
    ...overrides,
  };
}

export function createAuthUser(overrides?: Partial<any>) {
  return {
    id: 1,
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    role: 'admin' as const,
    workspaceId: 1,
    ...overrides,
  };
}
