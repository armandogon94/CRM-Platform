/**
 * seed-perf — deterministic perf-DB seeder (Slice 19C, Task B1).
 *
 * Seeds a single `perf-workspace` with N boards × 100 items × 15 columns
 * of column values into `crm_perf`. B1 establishes the schema + idempotency
 * contract at smoke scale (10 boards). B2 scales to 1000 boards × 100
 * items = 1.5M column values by wiring larger batches and chunked
 * transactions — the CLI default is already 1000 in anticipation.
 *
 * Determinism: a seeded Mulberry32 PRNG keyed on `PERF_SEED` (default 42)
 * drives every random choice (item names, status values, numbers, etc.).
 * Re-running the seeder against the same DB is a no-op when the observed
 * row counts match the target; this keeps `make e2e:perf` idempotent.
 *
 * The script is safe to `require()` from tests — all side effects sit
 * behind `main()` and the `require.main === module` guard at the bottom.
 */

import bcrypt from 'bcryptjs';
import {
  Workspace,
  User,
  Board,
  BoardGroup,
  Column,
  Item,
  ColumnValue,
} from '../models';

/** CLI-facing options. `boards` defaults to 1000 (B2 scale). */
export interface SeedPerfOptions {
  /** Number of boards to seed. Defaults to 1000. Smoke tests pass 10. */
  boards?: number;
}

const DEFAULT_BOARDS = 1000;
const ITEMS_PER_BOARD = 100;
const COLUMNS_PER_BOARD = 15;
const BATCH_SIZE = 5000;
const PROGRESS_EVERY = 100;

const PERF_WORKSPACE_NAME = 'perf-workspace';
const PERF_WORKSPACE_SLUG = 'perf-workspace';
const PERF_ADMIN_EMAIL = 'perf-admin@perf.test';

/**
 * Parse `--boards=N` from `process.argv`. Returns undefined when the flag
 * is absent so the caller can fall back to `opts.boards` or the default.
 */
function parseBoardsFlag(argv: readonly string[]): number | undefined {
  for (const arg of argv) {
    const match = /^--boards=(\d+)$/.exec(arg);
    if (match) {
      const n = Number.parseInt(match[1], 10);
      if (Number.isFinite(n) && n > 0) return n;
    }
  }
  return undefined;
}

/**
 * Mulberry32 — tiny seeded PRNG. Same seed produces the same float
 * sequence across runs and across Node versions (unlike Math.random).
 */
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Fixed column layout — 15 cols mixing Status, Text, Number, Date, Person. */
interface PerfColumnDef {
  name: string;
  columnType:
    | 'status'
    | 'text'
    | 'number'
    | 'date'
    | 'person';
  config: Record<string, unknown>;
}

const PERF_COLUMN_DEFS: readonly PerfColumnDef[] = [
  { name: 'Status',      columnType: 'status', config: { options: [
    { label: 'New',     color: '#94A3B8', order: 0 },
    { label: 'Working', color: '#FCD34D', order: 1 },
    { label: 'Stuck',   color: '#F87171', order: 2 },
    { label: 'Done',    color: '#34D399', order: 3 },
  ], default_option: 'New' } },
  { name: 'Title',       columnType: 'text',   config: {} },
  { name: 'Notes',       columnType: 'text',   config: {} },
  { name: 'Priority',    columnType: 'status', config: { options: [
    { label: 'Low',    color: '#34D399', order: 0 },
    { label: 'Medium', color: '#FCD34D', order: 1 },
    { label: 'High',   color: '#F87171', order: 2 },
  ], default_option: 'Medium' } },
  { name: 'Amount',      columnType: 'number', config: { format: 'currency', decimal_places: 2, currency: 'USD' } },
  { name: 'Quantity',    columnType: 'number', config: { format: 'plain', decimal_places: 0 } },
  { name: 'Score',       columnType: 'number', config: { format: 'plain', decimal_places: 0, min_value: 0, max_value: 100 } },
  { name: 'Start Date',  columnType: 'date',   config: { include_time: false } },
  { name: 'Due Date',    columnType: 'date',   config: { include_time: false } },
  { name: 'Reviewed At', columnType: 'date',   config: { include_time: true } },
  { name: 'Owner',       columnType: 'person', config: { allow_multiple: false } },
  { name: 'Reviewer',    columnType: 'person', config: { allow_multiple: false } },
  { name: 'Reference',   columnType: 'text',   config: {} },
  { name: 'Tag',         columnType: 'text',   config: {} },
  { name: 'Category',    columnType: 'status', config: { options: [
    { label: 'Alpha', color: '#2563EB', order: 0 },
    { label: 'Beta',  color: '#7C3AED', order: 1 },
    { label: 'Gamma', color: '#059669', order: 2 },
  ], default_option: 'Alpha' } },
];

/** Generate a deterministic column value matching the type. */
function generateColumnValue(
  def: PerfColumnDef,
  rand: () => number,
  adminId: number
): unknown {
  switch (def.columnType) {
    case 'status': {
      const opts = (def.config.options as { label: string }[]) ?? [];
      return { label: opts[Math.floor(rand() * opts.length)]?.label ?? 'New' };
    }
    case 'text':
      return { text: `val-${Math.floor(rand() * 1_000_000).toString(36)}` };
    case 'number':
      return { number: Math.floor(rand() * 10_000) };
    case 'date': {
      // Deterministic date between 2025-01-01 and 2026-12-31
      const start = Date.UTC(2025, 0, 1);
      const end = Date.UTC(2026, 11, 31);
      const ts = start + Math.floor(rand() * (end - start));
      return { date: new Date(ts).toISOString().slice(0, 10) };
    }
    case 'person':
      return { userId: adminId };
  }
}

/**
 * Main entry point. Returns void; exits are handled by the outer guard
 * so callers (tests) can observe side effects without terminating the
 * process.
 */
export async function main(opts: SeedPerfOptions = {}): Promise<void> {
  const flagBoards = parseBoardsFlag(process.argv);
  const boards = flagBoards ?? opts.boards ?? DEFAULT_BOARDS;
  const seed = Number(process.env.PERF_SEED ?? 42);

  const expectedItems = boards * ITEMS_PER_BOARD;
  const expectedColumnValues = boards * ITEMS_PER_BOARD * COLUMNS_PER_BOARD;

  console.log(
    `[seed-perf] starting — boards=${boards}, items=${expectedItems}, ` +
      `column_values=${expectedColumnValues}, seed=${seed}`
  );

  // Idempotency — if the workspace + boards + items already match the
  // target, return early without issuing further writes.
  const existingWorkspace = await Workspace.findOne({ where: { slug: PERF_WORKSPACE_SLUG } });
  if (existingWorkspace) {
    const existingBoardCount = await Board.count({ where: { workspaceId: existingWorkspace.id } });
    const existingItemCount = await Item.count({});
    if (existingBoardCount === boards && existingItemCount === expectedItems) {
      process.stdout.write('[seed-perf] idempotent skip — row counts match expected.\n');
      reportMemory();
      return;
    }
  }

  // Fresh RNG for every invocation so the same seed → the same row shape.
  const rand = mulberry32(seed);

  const tStart = Date.now();

  // ─── Workspace + admin user (findOrCreate for safety) ────────────────
  const passwordHash = await bcrypt.hash('perfpassword', 12);

  const [workspace] = await Workspace.findOrCreate({
    where: { slug: PERF_WORKSPACE_SLUG },
    defaults: {
      name: PERF_WORKSPACE_NAME,
      slug: PERF_WORKSPACE_SLUG,
      description: 'Isolated workspace for perf-DB seeding (Slice 19C).',
      settings: { industry: 'perf' },
      // This is NOT the e2e fixture — a separate perf dataset.
      isE2eFixture: false,
    },
  });

  const [admin] = await User.findOrCreate({
    where: { email: PERF_ADMIN_EMAIL },
    defaults: {
      email: PERF_ADMIN_EMAIL,
      passwordHash,
      firstName: 'Perf',
      lastName: 'Admin',
      role: 'admin',
      workspaceId: workspace.id,
      isActive: true,
    },
  });

  // ─── Per-board loop ──────────────────────────────────────────────────
  // B1 runs 10 boards in a single surrounding flow; B2 will chunk
  // transactions per-batch to keep peak memory bounded at 1000 boards.
  let pendingItems: Array<{
    boardId: number;
    groupId: number;
    name: string;
    position: number;
    createdBy: number;
  }> = [];
  let pendingValues: Array<{
    itemId: number;
    columnId: number;
    value: unknown;
  }> = [];

  const flushItems = async (): Promise<void> => {
    if (pendingItems.length === 0) return;
    await Item.bulkCreate(pendingItems);
    pendingItems = [];
  };

  const flushValues = async (): Promise<void> => {
    if (pendingValues.length === 0) return;
    await ColumnValue.bulkCreate(pendingValues);
    pendingValues = [];
  };

  for (let b = 0; b < boards; b++) {
    const board = await Board.create({
      name: `perf-board-${b + 1}`,
      description: `Perf board ${b + 1}`,
      workspaceId: workspace.id,
      createdBy: admin.id,
      boardType: 'main',
      settings: { perf: true },
    });

    const group = await BoardGroup.create({
      boardId: board.id,
      name: 'All items',
      color: '#579BFC',
      position: 0,
    });

    const columns = [];
    for (let c = 0; c < PERF_COLUMN_DEFS.length; c++) {
      const def = PERF_COLUMN_DEFS[c];
      const column = await Column.create({
        boardId: board.id,
        name: def.name,
        columnType: def.columnType,
        position: c,
        width: 150,
        config: def.config,
      });
      columns.push(column);
    }

    // Items for this board — create them now so we have IDs for values.
    const itemRecords = [];
    for (let i = 0; i < ITEMS_PER_BOARD; i++) {
      itemRecords.push({
        boardId: board.id,
        groupId: group.id,
        name: `item-${b + 1}-${i + 1}-${Math.floor(rand() * 1_000_000).toString(36)}`,
        position: i,
        createdBy: admin.id,
      });
    }
    const createdItems = await Item.bulkCreate(itemRecords);

    // Column values — 15 per item × 100 items = 1500 per board.
    for (const item of createdItems) {
      for (const col of columns) {
        const def = PERF_COLUMN_DEFS.find((d) => d.name === col.name)!;
        pendingValues.push({
          itemId: item.id,
          columnId: col.id,
          value: generateColumnValue(def, rand, admin.id),
        });
        if (pendingValues.length >= BATCH_SIZE) await flushValues();
      }
    }

    if ((b + 1) % PROGRESS_EVERY === 0) {
      console.log(`[seed-perf] progress — ${b + 1}/${boards} boards seeded`);
    }
  }

  await flushItems();
  await flushValues();

  const elapsedMs = Date.now() - tStart;
  process.stderr.write(
    `[seed-perf] complete — boards=${boards} elapsed=${elapsedMs}ms\n`
  );
  reportMemory();
}

/** Best-effort peak heap reporter. Written to stderr so stdout stays clean. */
function reportMemory(): void {
  const mem = process.memoryUsage();
  const heapMb = (mem.heapUsed / 1024 / 1024).toFixed(1);
  const rssMb = (mem.rss / 1024 / 1024).toFixed(1);
  process.stderr.write(`[seed-perf] peak heap=${heapMb} MB, rss=${rssMb} MB\n`);
}

// Auto-run only when invoked directly (ts-node src/scripts/seed-perf.ts).
if (require.main === module) {
  main()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
