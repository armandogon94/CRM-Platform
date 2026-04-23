# Cross-industry visual findings (Slice 19.7)

Findings that emerged from reviewing screenshots — beyond what the
automated harness can detect. Grouped by industry. See also the per-
industry `findings.md` for the harness's pass/fail log.

## NovaPay (port 13001)

**Shell:** has been migrated to react-router (Slice 19.6) — only industry with URL-driven navigation.

### Bugs

1. **`BoardListPage` item counts always show "0 items"** on every board card.
   - Root cause: `BoardListPage.tsx` sums `board.groups.reduce((acc, g) => acc + (g.items?.length || 0))`. The `GET /api/v1/boards` response returns groups WITHOUT items hydrated into them, so the sum is always 0.
   - Fix: either hydrate items into groups at the API layer, or switch the count logic to call a separate aggregates endpoint, or show a different stat (e.g. "3 groups" only).

2. **Table view — Status column renders empty** on every row.
   - Example: Transaction Pipeline board shows NAME, AMOUNT, MERCHANT, RISK SCORE populated, but the Status cell is blank for all 200 items.
   - Root cause suspected: seed creates items WITHOUT setting Status column values. The column definition exists (Kanban lanes reflect status values), but no ColumnValue rows link items to status options.
   - Fix: `seeds/novapay/transactions.ts` (or equivalent) should assign a status value (Pending / Processing / Settled / Failed) to each seeded transaction.

3. **Kanban view — all lanes show 0 items** despite 200 transactions existing.
   - Same root cause as #2: items have no Status column values, so they don't bucket into any status lane.
   - The lanes render correctly (Pending, Processing, Settled, Failed in their brand colors) — it's the assignment that's missing.

4. **Automations panel — shows "No Automations"** despite 5 seeded rules (risk alert, settlement completion, compliance reminder, KYC status, fraud escalation).
   - Likely `api.getAutomations(boardId)` returns data but the response shape doesn't match the frontend's expectations, OR the fetch fails silently. Needs network-tab inspection at runtime.
   - Separately, the Sidebar "Automations" icon uses a lightning bolt — clear.

### Good

- Sidebar branding: NovaPay logo + "Digital Payment Processing" tagline render clean on brand-blue background.
- User footer card shows Sarah Chen + email correctly.
- Seeded data in the Transaction Pipeline: real transaction names (TXN-010000 — ShopWave Inc), real amounts ($384.86, $13,512.15), real merchants, real dates, real risk scores (5, 26, 78, 12). **Seed data quality is strong.**
- Board navigation + URL transitions work end-to-end (post-migration).
- Logout works correctly; returns to login page.

## MedVista (port 13002)

**Shell:** state-based navigation (pre-19.6 pattern).

### Bugs

1. **Same "No Automations" bug as NovaPay** — panel empty despite 4 seeded rules.
2. **Label a11y** — login email/password inputs have no `htmlFor`/`id` association. (Fixed in NovaPay 19.6; likely present across all 9 industries — see cross-cutting findings.)
3. **Sidebar logout button was missing `aria-label`** — fixed during this QA pass (bulk added to all 9 industries).
4. **Missing seed auto-exec guard** — `npm run seed:medvista` was a no-op before this QA pass. Fixed — added `if (require.main === module)` block.

### Good

- **Patient Pipeline table view: perfect.** Real patient names (Philip Oduro, Amy Nakamura), avatars with initials in brand green, Status badges ("New"), Insurance Verified X/✓, realistic First Appointment dates, masked phone numbers. One of the cleanest demos.
- **Kanban view: perfect.** 4 lanes (New=15, Intake=15, Active=60, Discharge=hidden) with real patient name cards in each lane. Items correctly bucketed by status.
- Brand color `#059669` applied consistently across sidebar + logo badge + status dots.
- User footer: "Amanda Foster / admin@medvista.com".
- Sidebar domain tabs ("Patient Pipeline", "Appointment Scheduler", "Insurance Claims") all readable and industry-appropriate.

## Cross-cutting (affects most/all 10 industries)

**C1. Automations panel shows "No Automations" despite seeded rules.** Confirmed on NovaPay + MedVista. Likely present on all 10. Root cause suspected: `api.getAutomations(boardId)` call path or response shape mismatch. Needs browser-dev-tools inspection of the actual fetch during live runs.

**C2. Login form labels have no `htmlFor`/id association.** `getByLabel` fails — a11y violation. NovaPay's LoginPage was fixed during Slice 19.6; other 9 industries still have the unassociated-label pattern.

**C3. Sidebar logout button missing `aria-label`** — fixed during this QA pass. All 10 now have `aria-label="Sign out"` attribute.

**C4. Seed auto-exec guard missing on MedVista + UrbanNest** — fixed during this QA pass. Now consistent across all 10 seed modules.

