/**
 * Slice 20 E2E industry matrix (D1 + D2 + D3 consume this).
 *
 * Each fixture describes one of the three reference industries wired
 * with CRUD in Phase C (NovaPay C1 / MedVista C2 / JurisPath C3). Specs
 * iterate over this list and parameterize test.describe blocks per
 * industry so one spec file covers all 3 shells.
 *
 * Assumptions (enforced upstream by the make target orchestrator, NOT
 * this file):
 *   - The backend (port 13000) is running and the industry's seed data
 *     is present in the `crm` DB.
 *   - Only ONE industry frontend is expected to be up at a time per the
 *     user's "max-1-industry-local" constraint (Slice 19.7 QA finding);
 *     the make target spins each up before running its specs.
 *   - Admin users exist with password `demo123` — this is the seed
 *     convention enforced by backend/src/seeds/<industry>/workspace.ts
 *     (see Slice 19.7 cranestack fix for the precedent).
 *
 * If a spec runs against an industry whose frontend isn't reachable,
 * it will hard-fail on the initial page.goto — intentional. The
 * orchestrator treats an unreachable industry as a test failure, not
 * a skip, so misconfigured runs are visible immediately.
 */

export interface IndustryFixture {
  /** Directory name under `frontends/` and workspace slug. */
  slug: string;
  /** Full base URL where the industry's Vite dev server serves from. */
  baseURL: string;
  /** Seeded admin email — this user has full CRUD affordances. */
  adminEmail: string;
  /** Seeded admin password (unified to `demo123` in Slice 19.7). */
  adminPassword: string;
  /** Board name the spec navigates to. Must match the seed's primary board. */
  primaryBoardName: string;
  /**
   * localStorage key where the industry's AuthContext persists the JWT.
   * Each industry forked its own api.ts, so the keys diverge — the
   * spec reads this key after login to collect the token for REST
   * cleanup calls.
   */
  tokenKey: string;
  /** Brand primary color (hex) — optional visual check in some specs. */
  brandColor: string;
}

// Slice 20B B1-1: expanded from 3 → 10 entries in port order.
// All 10 industries now have @crm/shared integrated, BoardPage migrated to
// the shared BoardView, ToastProvider mounted at app root, and an admin-
// only "New Board" dialog in OverviewDashboard. The Phase D specs iterate
// over this list unchanged (see selectedIndustries() below).
export const SLICE_20_INDUSTRIES: IndustryFixture[] = [
  {
    slug: 'novapay',
    baseURL: 'http://localhost:13001',
    adminEmail: 'admin@novapay.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Transaction Pipeline',
    tokenKey: 'novapay_token',
    brandColor: '#2563EB',
  },
  {
    slug: 'medvista',
    baseURL: 'http://localhost:13002',
    adminEmail: 'admin@medvista.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Patient Pipeline',
    tokenKey: 'medvista_token',
    brandColor: '#059669',
  },
  {
    slug: 'trustguard',
    baseURL: 'http://localhost:13003',
    adminEmail: 'admin@trustguard.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Claims Pipeline',
    tokenKey: 'trustguard_token',
    brandColor: '#1E3A5F',
  },
  {
    slug: 'urbannest',
    baseURL: 'http://localhost:13004',
    adminEmail: 'admin@urbannest.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Lead Pipeline',
    tokenKey: 'urbannest_token',
    brandColor: '#D97706',
  },
  {
    slug: 'swiftroute',
    baseURL: 'http://localhost:13005',
    adminEmail: 'admin@swiftroute.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Shipment Tracker',
    tokenKey: 'swiftroute_token',
    brandColor: '#7C3AED',
  },
  {
    slug: 'dentaflow',
    baseURL: 'http://localhost:13006',
    adminEmail: 'admin@dentaflow.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Patient Pipeline',
    tokenKey: 'dentaflow_token',
    brandColor: '#06B6D4',
  },
  {
    slug: 'jurispath',
    baseURL: 'http://localhost:13007',
    adminEmail: 'admin@jurispath.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Case Management',
    tokenKey: 'jurispath_token',
    brandColor: '#166534',
  },
  {
    slug: 'tablesync',
    baseURL: 'http://localhost:13008',
    adminEmail: 'admin@tablesync.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Reservation Board',
    tokenKey: 'tablesync_token',
    brandColor: '#9F1239',
  },
  {
    slug: 'cranestack',
    baseURL: 'http://localhost:13009',
    adminEmail: 'admin@cranestack.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Project Pipeline',
    tokenKey: 'cranestack_token',
    brandColor: '#EA580C',
  },
  {
    slug: 'edupulse',
    baseURL: 'http://localhost:13010',
    adminEmail: 'admin@edupulse.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Student Enrollment',
    tokenKey: 'edupulse_token',
    brandColor: '#6D28D9',
  },
];

/**
 * Resolve a single fixture by slug. Throws if unknown — better than
 * silently skipping when a typo hits CI.
 */
export function findIndustry(slug: string): IndustryFixture {
  const match = SLICE_20_INDUSTRIES.find((i) => i.slug === slug);
  if (!match) {
    throw new Error(
      `Unknown Slice 20 industry slug "${slug}". Valid: ${SLICE_20_INDUSTRIES.map(
        (i) => i.slug
      ).join(', ')}`
    );
  }
  return match;
}

export const API_BASE_URL =
  process.env.E2E_API_BASE_URL ?? 'http://localhost:13000/api/v1';

/**
 * Selects the subset of fixtures the current test run should exercise.
 *
 * Driven by the `SLICE_20_INDUSTRIES` env var (comma-separated slugs).
 * Unset → run all three. The per-industry orchestrator (see Makefile
 * target `e2e:slice-20`) sets this to the one industry whose stack it
 * brought up, honoring the single-industry-at-a-time constraint.
 */
export function selectedIndustries(): IndustryFixture[] {
  const raw = process.env.SLICE_20_INDUSTRIES?.trim();
  if (!raw) return SLICE_20_INDUSTRIES;
  const slugs = raw.split(',').map((s) => s.trim()).filter(Boolean);
  return slugs.map(findIndustry);
}
