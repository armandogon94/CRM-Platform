# Slice 19.7 — Comprehensive Cross-Industry QA

**Goal:** validate all 10 industry frontends end-to-end — UI rendering, data integrity, workflow functionality — using live browser automation + direct API calls. One industry at a time; clean slate per cycle.

## Constraints

- **Max 1 industry running on host at any time.** Before testing industry N+1, the industry N stack is fully torn down (`docker compose down -v`).
- **No extending the app** — this phase tests what exists. CRUD-UI gaps are flagged as findings, not fixed.
- **Artifacts preserved** — every industry produces screenshots + JSON test log under `qa-results/<industry>/`.

## Per-industry cycle (runs 10×)

### 1. Setup (~2–3 min)
```bash
# Fresh stack for this industry
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d --wait postgres redis
docker compose -f docker-compose.yml -f docker-compose.e2e.yml up -d backend
# Wait on /health
# Seed just this industry's workspace + users
docker compose -f ... exec -T backend npm run seed:<industry>
# Start only this industry's frontend
docker compose -f ... up -d <industry>-frontend
```

### 2. Tier 1 — UI tests via Playwright + screenshots (~8–10 min)

For each industry, the harness navigates through these steps and saves a screenshot at each:

| # | Step | Screenshot | Assertions |
|---|------|------------|-----------|
| 1 | Load login page (`/`) | `01-login.png` | Brand color visible; form has email + password; no console errors |
| 2 | Submit valid credentials (`admin@<company>.com` / `demo123`) | `02-post-login.png` | Redirects to dashboard; logout affordance visible |
| 3 | OverviewDashboard renders | `03-dashboard.png` | KPI numbers populated; seeded data visible |
| 4 | Click first board in sidebar | `04-board-table.png` | Board name in heading; items in table; columns labeled |
| 5 | Toggle to Kanban view | `05-board-kanban.png` | Items grouped by status; lane counts non-zero |
| 6 | Search for substring of a known item | `06-search.png` | Only matching items visible |
| 7 | Click 2nd board in sidebar | `07-board-2.png` | Different board loads; items replaced |
| 8 | Open Automations panel | `08-automations.png` | List of seeded automation rules |
| 9 | Trigger one automation | `09-triggered.png` + AutomationLog query | New AutomationLog row appears in DB |
| 10 | Logout | `10-logged-out.png` | Returns to login page |

### 3. Tier 2 — Backend API CRUD checks (~3–5 min)

Executed via `curl` / `fetch` against the live backend, with UI refresh after each step to confirm the data appears.

| # | Action | UI refresh check |
|---|--------|------------------|
| 1 | Create "Claude QA" user in this workspace via POST `/auth/register` | Not directly visible in UI; check backend echo |
| 2 | POST `/boards` — create "QA Test Board" | Reload UI → board appears in sidebar |
| 3 | POST `/items` — create "QA Test Item" on existing board | Reload UI → item in Table view |
| 4 | PUT `/column-values` — change status | Reload UI → status cell shows new label+color |
| 5 | DELETE `/items/:id` — remove the QA test item | Reload UI → item gone |
| 6 | Query `AutomationLog` rows created since start | Should match automation triggers fired during Tier 1 |

### 4. Findings collection

After each industry:
- `qa-results/<industry>/screenshots/` — 10 Tier-1 PNGs
- `qa-results/<industry>/api-log.json` — raw API request/response pairs for Tier 2
- `qa-results/<industry>/findings.md` — per-step pass/fail + bugs + console errors + a11y notes

### 5. Teardown (~30s)
```bash
docker compose -f docker-compose.yml -f docker-compose.e2e.yml down -v
```

## Cross-industry final report

After all 10 cycles, `plans/slice-19.7-qa-report.md` consolidates:

- **Per-industry quality score** (count of passed vs failed steps out of 16 total)
- **Common bugs** (issues present across multiple industries)
- **Per-industry unique issues**
- **Visual consistency matrix** (each industry's brand color + layout parity)
- **Backend quality** — verified via API CRUD round-trips working identically per industry
- **Deferred Tier 3 (CRUD-UI gap)** with explicit scope for a future slice

## The test user

Per-industry uses the seeded admin:
- NovaPay: `admin@novapay.com / demo123`
- MedVista: `admin@medvista.com / demo123`
- TrustGuard: `admin@trustguard.com / demo123`
- UrbanNest: `admin@urbannest.com / demo123`
- SwiftRoute: `admin@swiftroute.com / demo123`
- DentaFlow: `admin@dentaflow.com / demo123`
- JurisPath: `admin@jurispath.com / demo123`
- TableSync: `admin@tablesync.com / demo123`
- CraneStack: `admin@cranestack.com / demo123`
- EduPulse: `admin@edupulse.com / demo123`

For Tier 2 Create-User tests, each industry gets a `claude-qa@<company>.com` user added via API during the test run.

## Harness artifacts

Written once, reused 10×:
- `qa/harness/run-industry-qa.ts` — Playwright script parameterized by `INDUSTRY` env var
- `qa/harness/api-checks.ts` — curl/fetch-based Tier 2 checks
- `qa/harness/findings.ts` — shared types + report-writer

## Expected total runtime

~2.5 – 3.5 hours for all 10 industries + final report.
