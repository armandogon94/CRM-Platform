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
    slug: 'jurispath',
    baseURL: 'http://localhost:13007',
    adminEmail: 'admin@jurispath.com',
    adminPassword: 'demo123',
    primaryBoardName: 'Case Management',
    tokenKey: 'jurispath_token',
    brandColor: '#166534',
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
