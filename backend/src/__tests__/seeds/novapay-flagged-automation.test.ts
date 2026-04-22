/**
 * NovaPay Status=Flagged → notification automation — Slice 19 Task B2
 *
 * Flow 5 of the E2E suite (SPEC.md §Slice 19 "Critical flows"): changing an
 * item's Status to "Flagged" in the fixture workspace must produce an in-app
 * notification for the E2E user. This test guards that the seeder wires the
 * corresponding automation rule into the fixture workspace — and ONLY the
 * fixture workspace — so the main NovaPay demo is never side-effected by
 * E2E-only configuration.
 *
 * Mocking follows the pattern established by `novapay-e2e-user.test.ts`
 * (Task B1): in-memory Maps stand in for Workspace / User / Board / Column /
 * Automation so the assertions focus on seeder behaviour, not Postgres.
 *
 * Field-name contract (see `Automation.ts`, `TriggerEvaluator.ts`,
 * `ActionExecutor.ts`):
 *   trigger  → `triggerType: 'on_status_changed'`, `triggerConfig.toStatus === 'Flagged'`
 *   action   → `actionType: 'send_notification'`, `actionConfig.userId === <e2e user id>`
 */

import { NOVAPAY_E2E_EMAIL, NOVAPAY_E2E_WORKSPACE_SLUG } from '../../seeds/novapay/workspace';

// ─── In-memory row shapes ────────────────────────────────────────────────────
interface WorkspaceRow {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  settings: Record<string, unknown>;
  createdBy: number | null;
  isE2eFixture: boolean;
}

interface UserRow {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'member' | 'viewer';
  workspaceId: number | null;
  isActive: boolean;
}

interface BoardRow {
  id: number;
  name: string;
  description: string | null;
  workspaceId: number;
  createdBy: number;
  boardType: string;
  settings: Record<string, unknown>;
}

interface ColumnRow {
  id: number;
  boardId: number;
  name: string;
  columnType: string;
  position: number;
  width: number;
  config: Record<string, unknown>;
}

interface AutomationRow {
  id: number;
  boardId: number;
  name: string;
  triggerType: string;
  triggerConfig: Record<string, unknown>;
  actionType: string;
  actionConfig: Record<string, unknown>;
  isActive: boolean;
  createdBy: number;
}

const workspaces = new Map<number, WorkspaceRow>();
const users = new Map<number, UserRow>();
const boards = new Map<number, BoardRow>();
const columns = new Map<number, ColumnRow>();
const automations = new Map<number, AutomationRow>();

let nextWorkspaceId = 1;
let nextUserId = 1;
let nextBoardId = 1;
let nextColumnId = 1;
let nextAutomationId = 1;

function matchesWhere<T extends object>(row: T, where: Partial<T> | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(
    ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v
  );
}

// ─── Model mocks ─────────────────────────────────────────────────────────────
jest.mock('../../models', () => {
  const WorkspaceMock = {
    create: jest.fn(async (attrs: Partial<WorkspaceRow>) => {
      const row: WorkspaceRow = {
        id: nextWorkspaceId++,
        name: attrs.name ?? '',
        slug: attrs.slug ?? '',
        description: attrs.description ?? null,
        settings: attrs.settings ?? {},
        createdBy: attrs.createdBy ?? null,
        isE2eFixture: attrs.isE2eFixture ?? false,
      };
      workspaces.set(row.id, row);
      return row;
    }),
    update: jest.fn(async (values: Partial<WorkspaceRow>, opts: { where: Partial<WorkspaceRow> }) => {
      for (const row of workspaces.values()) {
        if (matchesWhere(row, opts.where)) Object.assign(row, values);
      }
      return [1];
    }),
    findOne: jest.fn(async (opts: { where: Partial<WorkspaceRow> }) => {
      for (const row of workspaces.values()) {
        if (matchesWhere(row, opts.where)) return row;
      }
      return null;
    }),
    findAll: jest.fn(async (opts?: { where?: Partial<WorkspaceRow> }) => {
      const out: WorkspaceRow[] = [];
      for (const row of workspaces.values()) {
        if (matchesWhere(row, opts?.where)) out.push(row);
      }
      return out;
    }),
    findOrCreate: jest.fn(async (opts: { where: Partial<WorkspaceRow>; defaults?: Partial<WorkspaceRow> }) => {
      for (const row of workspaces.values()) {
        if (matchesWhere(row, opts.where)) return [row, false];
      }
      const attrs = { ...opts.defaults, ...opts.where };
      const row: WorkspaceRow = {
        id: nextWorkspaceId++,
        name: attrs.name ?? '',
        slug: attrs.slug ?? '',
        description: attrs.description ?? null,
        settings: attrs.settings ?? {},
        createdBy: attrs.createdBy ?? null,
        isE2eFixture: attrs.isE2eFixture ?? false,
      };
      workspaces.set(row.id, row);
      return [row, true];
    }),
  };

  const UserMock = {
    create: jest.fn(async (attrs: Partial<UserRow>) => {
      const row: UserRow = {
        id: nextUserId++,
        email: attrs.email ?? '',
        passwordHash: attrs.passwordHash ?? '',
        firstName: attrs.firstName ?? '',
        lastName: attrs.lastName ?? '',
        role: attrs.role ?? 'member',
        workspaceId: attrs.workspaceId ?? null,
        isActive: attrs.isActive ?? true,
      };
      users.set(row.id, row);
      return row;
    }),
    findOne: jest.fn(async (opts: { where: Partial<UserRow> }) => {
      for (const row of users.values()) {
        if (matchesWhere(row, opts.where)) return row;
      }
      return null;
    }),
    findOrCreate: jest.fn(async (opts: { where: Partial<UserRow>; defaults?: Partial<UserRow> }) => {
      for (const row of users.values()) {
        if (matchesWhere(row, opts.where)) return [row, false];
      }
      const attrs = { ...opts.defaults, ...opts.where };
      const row: UserRow = {
        id: nextUserId++,
        email: attrs.email ?? '',
        passwordHash: attrs.passwordHash ?? '',
        firstName: attrs.firstName ?? '',
        lastName: attrs.lastName ?? '',
        role: attrs.role ?? 'member',
        workspaceId: attrs.workspaceId ?? null,
        isActive: attrs.isActive ?? true,
      };
      users.set(row.id, row);
      return [row, true];
    }),
  };

  const BoardMock = {
    create: jest.fn(async (attrs: Partial<BoardRow>) => {
      const row: BoardRow = {
        id: nextBoardId++,
        name: attrs.name ?? '',
        description: attrs.description ?? null,
        workspaceId: attrs.workspaceId ?? 0,
        createdBy: attrs.createdBy ?? 0,
        boardType: attrs.boardType ?? 'main',
        settings: attrs.settings ?? {},
      };
      boards.set(row.id, row);
      return row;
    }),
    findOne: jest.fn(async (opts: { where: Partial<BoardRow> }) => {
      for (const row of boards.values()) {
        if (matchesWhere(row, opts.where)) return row;
      }
      return null;
    }),
    findAll: jest.fn(async (opts?: { where?: Partial<BoardRow> }) => {
      const out: BoardRow[] = [];
      for (const row of boards.values()) {
        if (matchesWhere(row, opts?.where)) out.push(row);
      }
      return out;
    }),
    findOrCreate: jest.fn(async (opts: { where: Partial<BoardRow>; defaults?: Partial<BoardRow> }) => {
      for (const row of boards.values()) {
        if (matchesWhere(row, opts.where)) return [row, false];
      }
      const attrs = { ...opts.defaults, ...opts.where };
      const row: BoardRow = {
        id: nextBoardId++,
        name: attrs.name ?? '',
        description: attrs.description ?? null,
        workspaceId: attrs.workspaceId ?? 0,
        createdBy: attrs.createdBy ?? 0,
        boardType: attrs.boardType ?? 'main',
        settings: attrs.settings ?? {},
      };
      boards.set(row.id, row);
      return [row, true];
    }),
  };

  const ColumnMock = {
    create: jest.fn(async (attrs: Partial<ColumnRow>) => {
      const row: ColumnRow = {
        id: nextColumnId++,
        boardId: attrs.boardId ?? 0,
        name: attrs.name ?? '',
        columnType: attrs.columnType ?? 'text',
        position: attrs.position ?? 0,
        width: attrs.width ?? 120,
        config: attrs.config ?? {},
      };
      columns.set(row.id, row);
      return row;
    }),
    findOne: jest.fn(async (opts: { where: Partial<ColumnRow> }) => {
      for (const row of columns.values()) {
        if (matchesWhere(row, opts.where)) return row;
      }
      return null;
    }),
    findOrCreate: jest.fn(async (opts: { where: Partial<ColumnRow>; defaults?: Partial<ColumnRow> }) => {
      for (const row of columns.values()) {
        if (matchesWhere(row, opts.where)) return [row, false];
      }
      const attrs = { ...opts.defaults, ...opts.where };
      const row: ColumnRow = {
        id: nextColumnId++,
        boardId: attrs.boardId ?? 0,
        name: attrs.name ?? '',
        columnType: attrs.columnType ?? 'text',
        position: attrs.position ?? 0,
        width: attrs.width ?? 120,
        config: attrs.config ?? {},
      };
      columns.set(row.id, row);
      return [row, true];
    }),
  };

  const AutomationMock = {
    create: jest.fn(async (attrs: Partial<AutomationRow>) => {
      const row: AutomationRow = {
        id: nextAutomationId++,
        boardId: attrs.boardId ?? 0,
        name: attrs.name ?? '',
        triggerType: attrs.triggerType ?? '',
        triggerConfig: attrs.triggerConfig ?? {},
        actionType: attrs.actionType ?? '',
        actionConfig: attrs.actionConfig ?? {},
        isActive: attrs.isActive ?? true,
        createdBy: attrs.createdBy ?? 0,
      };
      automations.set(row.id, row);
      return row;
    }),
    findAll: jest.fn(async (opts?: { where?: Partial<AutomationRow> }) => {
      const out: AutomationRow[] = [];
      for (const row of automations.values()) {
        if (matchesWhere(row, opts?.where)) out.push(row);
      }
      return out;
    }),
    findOne: jest.fn(async (opts: { where: Partial<AutomationRow> }) => {
      for (const row of automations.values()) {
        if (matchesWhere(row, opts.where)) return row;
      }
      return null;
    }),
  };

  return {
    Workspace: WorkspaceMock,
    User: UserMock,
    Board: BoardMock,
    BoardGroup: { create: jest.fn(async () => ({ id: 1 })) },
    BoardView: { create: jest.fn(async () => ({ id: 1 })) },
    Column: ColumnMock,
    Automation: AutomationMock,
    sequelize: { authenticate: jest.fn(), sync: jest.fn(), close: jest.fn() },
  };
});

// Stub non-target seeders so we isolate the automation seeder path.
// (The real seedAutomations runs against the main NovaPay workspace using
// ctx.adminId etc.; we want to verify only the fixture-workspace rule, so we
// let the real automations module run but keep non-target seeders quiet.)
jest.mock('../../seeds/novapay/boards', () => ({
  seedNovaPayBoards: jest.fn(async () => ({
    transactionBoard: { boardId: 1, groups: {}, columns: { Status: 999 } },
    onboardingBoard: { boardId: 2, groups: {}, columns: {} },
    complianceBoard: { boardId: 3, groups: {}, columns: { 'Due Date': 998 } },
  })),
}));
jest.mock('../../seeds/novapay/merchants', () => ({ seedMerchants: jest.fn(async () => undefined) }));
jest.mock('../../seeds/novapay/transactions', () => ({ seedTransactions: jest.fn(async () => undefined) }));
jest.mock('../../seeds/novapay/compliance', () => ({ seedCompliance: jest.fn(async () => undefined) }));

describe('NovaPay seed — Status=Flagged → notification automation (Slice 19 B2)', () => {
  beforeEach(() => {
    workspaces.clear();
    users.clear();
    boards.clear();
    columns.clear();
    automations.clear();
    nextWorkspaceId = 1;
    nextUserId = 1;
    nextBoardId = 1;
    nextColumnId = 1;
    nextAutomationId = 1;
    jest.clearAllMocks();
    jest.resetModules();
  });

  it('creates exactly one active Flagged→notification automation in the fixture workspace', async () => {
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();

    // Locate the fixture workspace (must exist per B1).
    const fixtureWs = Array.from(workspaces.values()).find(
      (w) => w.slug === NOVAPAY_E2E_WORKSPACE_SLUG
    );
    expect(fixtureWs).toBeDefined();
    expect(fixtureWs!.isE2eFixture).toBe(true);

    const fixtureBoardIds = new Set(
      Array.from(boards.values())
        .filter((b) => b.workspaceId === fixtureWs!.id)
        .map((b) => b.id)
    );

    // Pick out the Flagged automations scoped to any fixture-workspace board.
    const flaggedRules = Array.from(automations.values()).filter(
      (a) =>
        a.triggerType === 'on_status_changed' &&
        (a.triggerConfig as { toStatus?: string }).toStatus === 'Flagged' &&
        fixtureBoardIds.has(a.boardId)
    );

    expect(flaggedRules).toHaveLength(1);
    expect(flaggedRules[0].isActive).toBe(true);
  });

  it('wires the notification action to the E2E user in the fixture workspace', async () => {
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();

    const e2eUser = Array.from(users.values()).find((u) => u.email === NOVAPAY_E2E_EMAIL);
    expect(e2eUser).toBeDefined();

    const fixtureWs = Array.from(workspaces.values()).find(
      (w) => w.slug === NOVAPAY_E2E_WORKSPACE_SLUG
    );
    expect(fixtureWs).toBeDefined();

    const fixtureBoardIds = new Set(
      Array.from(boards.values())
        .filter((b) => b.workspaceId === fixtureWs!.id)
        .map((b) => b.id)
    );

    const flaggedRule = Array.from(automations.values()).find(
      (a) =>
        a.triggerType === 'on_status_changed' &&
        (a.triggerConfig as { toStatus?: string }).toStatus === 'Flagged' &&
        fixtureBoardIds.has(a.boardId)
    );
    expect(flaggedRule).toBeDefined();

    // Action contract (see ActionExecutor.sendNotification): `userId` targets
    // the recipient. Must point at the seeded E2E user, not another user.
    expect(flaggedRule!.actionType).toBe('send_notification');
    const actionConfig = flaggedRule!.actionConfig as { userId?: number; workspaceId?: number };
    expect(actionConfig.userId).toBe(e2eUser!.id);
    expect(actionConfig.workspaceId).toBe(fixtureWs!.id);
  });

  it('scopes the rule to the fixture workspace (main NovaPay workspace untouched)', async () => {
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();

    const fixtureWs = Array.from(workspaces.values()).find(
      (w) => w.slug === NOVAPAY_E2E_WORKSPACE_SLUG
    );
    const mainWs = Array.from(workspaces.values()).find(
      (w) => w.slug === 'novapay'
    );
    expect(fixtureWs).toBeDefined();
    expect(mainWs).toBeDefined();

    const mainBoardIds = new Set(
      Array.from(boards.values())
        .filter((b) => b.workspaceId === mainWs!.id)
        .map((b) => b.id)
    );

    // No Flagged automation on a main-workspace board (the fixture rule is
    // E2E-only; the main workspace has its own unrelated automations).
    const mainFlaggedRules = Array.from(automations.values()).filter(
      (a) =>
        a.triggerType === 'on_status_changed' &&
        (a.triggerConfig as { toStatus?: string }).toStatus === 'Flagged' &&
        mainBoardIds.has(a.boardId)
    );
    expect(mainFlaggedRules).toHaveLength(0);
  });

  it('is idempotent: running seedNovaPay twice yields exactly one Flagged rule', async () => {
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();
    await seedNovaPay();

    const fixtureWs = Array.from(workspaces.values()).find(
      (w) => w.slug === NOVAPAY_E2E_WORKSPACE_SLUG
    );
    expect(fixtureWs).toBeDefined();

    const fixtureBoardIds = new Set(
      Array.from(boards.values())
        .filter((b) => b.workspaceId === fixtureWs!.id)
        .map((b) => b.id)
    );

    const flaggedRules = Array.from(automations.values()).filter(
      (a) =>
        a.triggerType === 'on_status_changed' &&
        (a.triggerConfig as { toStatus?: string }).toStatus === 'Flagged' &&
        fixtureBoardIds.has(a.boardId)
    );

    expect(flaggedRules).toHaveLength(1);
  });
});
