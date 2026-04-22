/**
 * NovaPay E2E User + Fixture Workspace Tests — Slice 19, Task B1
 *
 * Verifies that seedNovaPay() creates:
 *  1. An `e2e@novapay.test` user whose password hash validates against 'e2epassword'
 *  2. That user's workspace has `isE2eFixture === true`
 *  3. Dev admin `admin@crm-platform.com` seed remains unaffected (non-fixture)
 *  4. Running the seed twice produces exactly one fixture workspace (idempotent)
 *
 * Follows the mock pattern used by seed-registry.test.ts / E2EResetService.test.ts:
 * we mock the `models` module so no actual Postgres is required. Every created
 * row lives in an in-memory Map so we can assert uniqueness + idempotency.
 */

import bcrypt from 'bcryptjs';

// ─── In-memory stores that mimic User / Workspace tables ────────────────────
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

const workspaces = new Map<number, WorkspaceRow>();
const users = new Map<number, UserRow>();
let nextWorkspaceId = 1;
let nextUserId = 1;

function matchesWhere<T extends object>(row: T, where: Partial<T> | undefined): boolean {
  if (!where) return true;
  return Object.entries(where).every(
    ([k, v]) => (row as unknown as Record<string, unknown>)[k] === v
  );
}

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
        if (matchesWhere(row, opts.where)) {
          Object.assign(row, values);
        }
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
      const result: WorkspaceRow[] = [];
      for (const row of workspaces.values()) {
        if (matchesWhere(row, opts?.where)) result.push(row);
      }
      return result;
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

  return {
    Workspace: WorkspaceMock,
    User: UserMock,
    // Seed index.ts pulls sequelize from this module when run standalone.
    sequelize: { authenticate: jest.fn(), sync: jest.fn(), close: jest.fn() },
  };
});

// Stub out the non-target seed stages so the test only exercises the workspace+user wiring.
jest.mock('../../seeds/novapay/boards', () => ({
  seedNovaPayBoards: jest.fn(async () => ({
    transactionBoard: { boardId: 1, groups: {}, columns: {} },
    onboardingBoard: { boardId: 2, groups: {}, columns: {} },
    complianceBoard: { boardId: 3, groups: {}, columns: {} },
  })),
}));
jest.mock('../../seeds/novapay/merchants', () => ({ seedMerchants: jest.fn(async () => undefined) }));
jest.mock('../../seeds/novapay/transactions', () => ({ seedTransactions: jest.fn(async () => undefined) }));
jest.mock('../../seeds/novapay/compliance', () => ({ seedCompliance: jest.fn(async () => undefined) }));
jest.mock('../../seeds/novapay/automations', () => ({ seedAutomations: jest.fn(async () => undefined) }));

// Simulate that the dev admin from seeds/index.ts has already been seeded in
// a non-fixture "Main Workspace". seedNovaPay() must not touch it.
async function ensureDevAdminSeeded(): Promise<void> {
  const { Workspace, User } = await import('../../models');
  // Only create once per test file run.
  const existing = await (User as unknown as { findOne: (o: unknown) => Promise<unknown> }).findOne({
    where: { email: 'admin@crm-platform.com' },
  });
  if (existing) return;

  const mainWorkspace = (await (Workspace as unknown as {
    create: (a: Record<string, unknown>) => Promise<WorkspaceRow>;
  }).create({
    name: 'Main Workspace',
    slug: 'main-workspace',
    description: 'The primary workspace for the CRM platform.',
    settings: {},
    isE2eFixture: false,
  })) as WorkspaceRow;

  const passwordHash = await bcrypt.hash('admin', 12);
  await (User as unknown as {
    create: (a: Record<string, unknown>) => Promise<UserRow>;
  }).create({
    email: 'admin@crm-platform.com',
    passwordHash,
    firstName: 'System',
    lastName: 'Admin',
    role: 'admin',
    workspaceId: mainWorkspace.id,
    isActive: true,
  });
}

describe('NovaPay seed — E2E user + fixture workspace (Slice 19 B1)', () => {
  beforeEach(() => {
    workspaces.clear();
    users.clear();
    nextWorkspaceId = 1;
    nextUserId = 1;
    jest.clearAllMocks();
  });

  it('creates an e2e@novapay.test user whose password hashes to "e2epassword"', async () => {
    await ensureDevAdminSeeded();
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();

    const { User } = await import('../../models');
    const e2eUser = await (User as unknown as {
      findOne: (o: unknown) => Promise<UserRow | null>;
    }).findOne({ where: { email: 'e2e@novapay.test' } });

    expect(e2eUser).not.toBeNull();
    expect(e2eUser!.passwordHash).toBeTruthy();
    const passwordMatches = await bcrypt.compare('e2epassword', e2eUser!.passwordHash);
    expect(passwordMatches).toBe(true);
  });

  it('ties the e2e user to a workspace with isE2eFixture === true', async () => {
    await ensureDevAdminSeeded();
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();

    const { User, Workspace } = await import('../../models');
    const e2eUser = await (User as unknown as {
      findOne: (o: unknown) => Promise<UserRow | null>;
    }).findOne({ where: { email: 'e2e@novapay.test' } });

    expect(e2eUser).not.toBeNull();
    expect(e2eUser!.role).toBe('admin');

    const ws = await (Workspace as unknown as {
      findOne: (o: unknown) => Promise<WorkspaceRow | null>;
    }).findOne({ where: { id: e2eUser!.workspaceId as number } });

    expect(ws).not.toBeNull();
    expect(ws!.isE2eFixture).toBe(true);
  });

  it('leaves the dev admin user untouched in a non-fixture workspace', async () => {
    await ensureDevAdminSeeded();
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();

    const { User, Workspace } = await import('../../models');
    const devAdmin = await (User as unknown as {
      findOne: (o: unknown) => Promise<UserRow | null>;
    }).findOne({ where: { email: 'admin@crm-platform.com' } });

    expect(devAdmin).not.toBeNull();
    const ws = await (Workspace as unknown as {
      findOne: (o: unknown) => Promise<WorkspaceRow | null>;
    }).findOne({ where: { id: devAdmin!.workspaceId as number } });

    expect(ws).not.toBeNull();
    // Non-fixture: isE2eFixture must be false (model default), never true.
    expect(ws!.isE2eFixture).toBe(false);
  });

  it('is idempotent: running seedNovaPay twice yields exactly one fixture workspace', async () => {
    await ensureDevAdminSeeded();
    const { seedNovaPay } = await import('../../seeds/novapay');
    await seedNovaPay();
    await seedNovaPay();

    const { Workspace, User } = await import('../../models');
    const fixtureWorkspaces = await (Workspace as unknown as {
      findAll: (o: unknown) => Promise<WorkspaceRow[]>;
    }).findAll({ where: { isE2eFixture: true } });

    expect(fixtureWorkspaces).toHaveLength(1);

    // E2E user should also be unique.
    const allUsers = Array.from(users.values()).filter((u) => u.email === 'e2e@novapay.test');
    expect(allUsers).toHaveLength(1);

    // And the e2e user must belong to the single fixture workspace.
    const e2eUser = await (User as unknown as {
      findOne: (o: unknown) => Promise<UserRow | null>;
    }).findOne({ where: { email: 'e2e@novapay.test' } });
    expect(e2eUser!.workspaceId).toBe(fixtureWorkspaces[0].id);
  });
});
