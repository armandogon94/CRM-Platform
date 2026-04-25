# Implementation Plan: Slice 20.5 — Token-Key Unification + Shared `useBoard` Adoption

**Spec reference:** `SPEC.md` §Slice 20.5 (lines 1558–1712)
**Size:** M
**Estimated tasks:** 5 phases / 14 tasks (1 shared + 10 per-industry + 1 E2E + 1 verification + 1 SPEC tick)
**Estimated wall-clock:** ~30 min via 3-wave fanout for the per-industry work

**Predecessor:** Slice 20A + 20B fully shipped (commit `cdaa3f2` and prior). All 10 industries import `@crm/shared`, mount `<ToastProvider>`, render shared `<BoardView>`, have admin-gated New Board dialogs, and have viewer-role gating.

---

## Overview

Close the only open Slice 20 success criterion (real-time WS echo on CRUD path). Approach: make `@crm/shared/hooks/useWebSocket` token-key configurable (mirroring the existing `configureApi({ tokenKey })` API), then migrate each industry's `BoardPage` from local CRUD handlers to the shared `useBoard` mutations. Net code change is mostly deletion (each industry sheds ~80 LOC of duplicated handler logic in exchange for ~5 LOC of `useBoard` consumption).

Key constraint: the Slice 20B 7-parallel fanout caused git-index race chaos. Slice 20.5's 10-industry per-industry work runs in **3 sequential waves** (4 + 3 + 3) instead of 10 parallel — same wall-clock guarantee per agent (~3 min each), zero collision risk.

## Architecture decisions

- **Configurable `useWebSocket` token key (ADR in spec)** — mirrors `configureApi`. Industries call `configureWebSocket({ tokenKey })` at boot. No localStorage migration. Default key remains `crm_access_token` so Slice 19 E2E paths stay green.
- **3-wave per-industry fanout**, not full parallel — direct lesson from Slice 20B chaos. Wave size = 4/3/3 keeps dispatch simple while bounding the worst-case index-race surface.
- **No backend changes** — token verification logic + Socket.io auth handshake are unchanged. This is purely a client-side wiring slice.
- **`BoardPage` migration deletes more code than it adds** — local `handleItemCreate`, `handleItemUpdate`, `handleItemDelete`, local `useState<Item[]>`, local `useEffect` items-mirror, etc. all go away. Replaced by destructuring `useBoard(boardId)`.
- **E2E proof uses Playwright's two-context pattern** — same admin in two `browser.newContext()` instances, mutate in tab A, `expect.poll` for 2s in tab B. Across NovaPay + MedVista + JurisPath as the spec-defined verification subset.

## Dependency graph

```
Phase A — Shared library (1 task, sequential)
  A1  configureWebSocket export + 4 vitest cases
        │
        ▼
Phase B — Per-industry migration (3 waves of 4/3/3 = 10 tasks)
  Wave 1 (parallel × 4):  novapay, medvista, trustguard, urbannest
  Wave 2 (parallel × 3):  swiftroute, dentaflow, jurispath
  Wave 3 (parallel × 3):  tablesync, cranestack, edupulse
        │
        ▼
Phase C — E2E proof (1 task, sequential)
  C1  realtime-echo.spec.ts (3 industries)
        │
        ▼
Phase D — Verification + SPEC tickbox (2 tasks, sequential)
  D1  Cross-project sweep + verification log addendum
  D2  SPEC §Slice 20 success criterion #5 ticked
```

Phase A → B sequencing is mandatory: industries can't `configureWebSocket(...)` until A1 exports it.
Phase B → C sequencing is mandatory: realtime spec needs at least one industry migrated.
Phase B intra-wave: parallel; inter-wave: sequential (for race-condition mitigation).

---

## Task list

### Phase A — Shared library

#### Task A1: `configureWebSocket` export + tests

**Description:** Add a `configureWebSocket({ tokenKey })` function to `frontends/_shared/src/hooks/useWebSocket.ts` that mirrors the existing `configureApi` pattern. Replace the hardcoded `TOKEN_KEY = 'crm_access_token'` with a module-level `_tokenKey` variable initialized to that same default — preserves Slice 19 E2E behavior. Read the variable inside the socket connection logic, not the constant.

**RED → GREEN flow:**
1. Write `frontends/_shared/src/__tests__/configureWebSocket.test.ts` — 4 cases: (a) default key is `crm_access_token`, (b) override changes the read key, (c) revert override restores default, (d) multiple calls last-wins. Mock `localStorage` directly; don't actually open a socket. RED — function doesn't exist.
2. Implement `configureWebSocket` + replace hardcoded `TOKEN_KEY` constant with mutable `_tokenKey` variable. GREEN.

**Acceptance criteria:**
- [ ] `configureWebSocket({ tokenKey: 'foo_token' })` causes the next `localStorage.getItem` call inside the socket auth path to read `foo_token`, not `crm_access_token`
- [ ] Default behavior unchanged when `configureWebSocket` is never called
- [ ] Function is idempotent (multiple calls last-wins)
- [ ] Function signature matches `configureApi`'s shape (object arg, optional `tokenKey` field)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run configureWebSocket` — 4/4 pass
- [ ] `cd frontends/_shared && npm test -- --run` — 73/73 (69 existing + 4 new)
- [ ] `npx tsc --noEmit` clean

**Dependencies:** None (Slice 20B all merged).

**Files touched (2):**
- `frontends/_shared/src/hooks/useWebSocket.ts` (modify — add export, replace constant)
- `frontends/_shared/src/__tests__/configureWebSocket.test.ts` (new)

**Estimated scope:** S.

---

### ✅ Checkpoint: Phase A complete

- [ ] A1 merged to `main`
- [ ] `cd frontends/_shared && npm test -- --run` — 73/73 green
- [ ] Slice 19 NovaPay realtime spec still passes if run (regression guard)
- [ ] Review with human before Phase B fanout

---

### Phase B — Per-industry migration (3 waves)

Each per-industry task produces **1 atomic commit** in the agent's worktree. Files touched per industry: `main.tsx` (config calls) + `BoardPage.tsx` (useBoard adoption). 2 files, S size each.

**Wave 1 (parallel × 4):** `novapay`, `medvista`, `trustguard`, `urbannest`

#### Task B1-N (template, applied to each industry)

**Description:** Migrate one industry's bootstrap + BoardPage to use shared `useBoard`.

**Per-industry changes:**

`frontends/<industry>/src/main.tsx` — add 2 config calls before `<ToastProvider>` mount:
```tsx
import { configureApi } from '@crm/shared/utils/api';
import { configureWebSocket } from '@crm/shared/hooks/useWebSocket';

configureApi({ tokenKey: '<slug>_token' });
configureWebSocket({ tokenKey: '<slug>_token' });

// Existing render below — unchanged
```

`frontends/<industry>/src/components/BoardPage.tsx` — replace local handlers with `useBoard` mutations:
```tsx
// REMOVE:
//   - const [items, setItems] = useState<Item[]>(...)
//   - const [board, setBoard] = useState<Board | null>(null)
//   - const handleItemCreate, handleItemUpdate, handleItemDelete (local definitions)
//   - useEffect for initial board+items fetch
//   - the props-mirror useEffect (state-based industries) OR Promise.all fetch (router-based)
//
// REPLACE WITH:
import { useBoard } from '@crm/shared/hooks/useBoard';

const {
  board,
  items,
  loading,
  createItem,
  updateItemValue,
  deleteItem,
} = useBoard(boardId);

// Then in <BoardView>:
//   onItemCreate={canItemCrud ? createItem : undefined}
//   onItemUpdate={canItemCrud ? updateItemValue : undefined}
//   onItemDelete={canItemCrud ? deleteItem : undefined}
```

**Acceptance criteria:**
- [ ] `main.tsx` calls both `configureApi` and `configureWebSocket` with `<slug>_token`
- [ ] `BoardPage.tsx` imports `useBoard` from `@crm/shared/hooks/useBoard`
- [ ] Local CRUD handlers (`handleItemCreate`, `handleItemUpdate`, `handleItemDelete`) removed
- [ ] Local `useState<Item[]>` for items removed (now sourced from `useBoard`)
- [ ] Existing search/filter logic (`searchQuery`) unchanged — still client-side filter on `items`
- [ ] `currentView` synthesis logic preserved (still derived from local `viewMode` toggle)
- [ ] RBAC role-gate (`canItemCrud`) still applied at the BoardView prop boundary

**Verification (per industry):**
- [ ] `cd frontends/<industry> && npx tsc --noEmit` — clean
- [ ] `cd frontends/<industry> && npm run build` — succeeds
- [ ] Manual smoke (deferred to Phase C E2E): admin creates an item → second tab sees it within 2s

**Dependencies:** A1 merged.

**Files touched (2):**
- `frontends/<industry>/src/main.tsx`
- `frontends/<industry>/src/components/BoardPage.tsx`

**Estimated scope:** S per industry.

#### Wave roster

| Wave | Industries | Dispatch order |
|------|------------|----------------|
| 1 | NovaPay, MedVista, TrustGuard, UrbanNest | parallel × 4 |
| 2 | SwiftRoute, DentaFlow, JurisPath | parallel × 3 (after Wave 1 complete) |
| 3 | TableSync, CraneStack, EduPulse | parallel × 3 (after Wave 2 complete) |

Between waves: cherry-pick stragglers if any worktree-branch commits didn't auto-land on main.

---

### ✅ Checkpoint: Phase B complete

- [ ] All 10 atomic per-industry commits on main
- [ ] All 10 industries `npx tsc --noEmit` clean
- [ ] All 10 industries `npm run build` succeeds
- [ ] `@crm/shared` 73/73 still green (no regression)
- [ ] Manual smoke on at least one industry: open two tabs, mutate in tab A, see in tab B
- [ ] Review with human before Phase C E2E

---

### Phase C — E2E proof

#### Task C1: realtime-echo.spec.ts

**Description:** Add a Playwright spec that opens two browser contexts as the same admin user, performs CRUD in tab A, and asserts tab B reflects each change within 2s. Spec parameterized across 3 industries (NovaPay, MedVista, JurisPath) following the existing D1–D3 fixture-matrix pattern.

**Spec outline:**
```ts
for (const industry of selectedIndustries().slice(0, 3)) {  // novapay/medvista/jurispath
  test.describe(`Real-time WS echo — ${industry.slug}`, () => {
    test.use({ baseURL: industry.baseURL });

    test('create-item echoes to second tab within 2s', async ({ page, browser }) => {
      // Tab A: login + open primary board
      // Tab B: new context, login same admin, open same board
      const ctxB = await browser.newContext({ baseURL: industry.baseURL });
      const pageB = await ctxB.newPage();

      // Mutation in tab A: create an item via REST so we have a known target
      // OR drive the UI: click + Add item, type name, confirm
      // Then assert in tab B: page B's Kanban/Table shows the item
      await expect.poll(
        async () => await pageB.getByText(itemName).count(),
        { timeout: 2_000, intervals: [200] }
      ).toBeGreaterThan(0);
    });

    test('update-status echoes', async (...) => { ... });
    test('delete-item echoes', async (...) => { ... });
  });
}
```

**Acceptance criteria:**
- [ ] Spec file exists at `e2e/specs/slice-20/realtime-echo.spec.ts`
- [ ] 3 test cases per industry (create, update, delete) × 3 industries = 9 test cases
- [ ] Each test: action in tab A → `expect.poll` in tab B with 2s timeout
- [ ] afterEach cleans up created items via REST DELETE
- [ ] Spec typechecks: `cd e2e && npx tsc --noEmit` clean

**Verification:**
- [ ] Manual run on NovaPay (Docker stack up): `cd e2e && SLICE_20_INDUSTRIES=novapay npx playwright test specs/slice-20/realtime-echo --reporter=list` — all 3 cases pass
- [ ] Slice 19 `02-item-crud-and-realtime.spec.ts` still passes (regression guard)

**Dependencies:** Phase B complete (industries actually emit WS events on the new path).

**Files touched (1):**
- `e2e/specs/slice-20/realtime-echo.spec.ts` (new)

**Estimated scope:** M.

---

### ✅ Checkpoint: Phase C complete

- [ ] realtime-echo.spec.ts merged
- [ ] At least one industry's runtime pass verified locally (others gated by Docker stack-up — same constraint as Slice 20A's E3)

---

### Phase D — Verification + SPEC tickbox

#### Task D1: Cross-project sweep + verification log addendum

**Description:** Run the full verification matrix and append a Slice 20.5 section to `plans/slice-20-verification.md`.

**Acceptance criteria:**
- [ ] `@crm/shared`: 73/73 tests pass
- [ ] Backend: 581/582 (pre-existing flake unchanged)
- [ ] All 10 industries: typecheck + build clean
- [ ] `e2e/`: typecheck clean
- [ ] Verification log appended with: Phase A unit-test count, Phase B per-industry commit table, Phase C E2E status, total LOC delta (expected: net negative — more deletions than additions across BoardPages)

**Files touched (1):**
- `plans/slice-20-verification.md`

**Estimated scope:** S.

#### Task D2: SPEC §Slice 20 criterion #5 tick

**Description:** Update SPEC.md §Slice 20 success criterion #5 (real-time echo) from `[ ]` to `[x]` with traceability note.

**Acceptance criteria:**
- [ ] Criterion #5 ticked
- [ ] Inline note cites: A1 commit + Phase B commit count + C1 spec path

**Files touched (1):**
- `SPEC.md`

**Estimated scope:** XS.

---

### ✅ Checkpoint: Slice 20.5 complete

- [ ] All 14 tasks merged (1 + 10 + 1 + 1 + 1)
- [ ] All 10 of SPEC §Slice 20's success criteria now tick (the last unticked one — #5 — is closed)
- [ ] Slice 20 family (20A + 20B + 20.5) fully shipped — 50+ atomic commits on main
- [ ] Ready for `/review` or `/ship`

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Slice 20B-style git-index race during Phase B | High (just lived through it) | 3-wave fanout (4/3/3) bounds the simultaneous-agent count to 4 max, halves race surface vs 7-at-once. Each wave waits for the previous to fully land before dispatch. |
| `useBoard`'s WS handlers conflict with industry's existing socket setup | Medium | Industries' AuthContext currently doesn't open its own socket — only NovaPay had a socket-related path in App.tsx (used to track connection status, not item events). Will check during the agent's per-industry recon. If a conflict surfaces, the local socket gets removed (single source of truth = useBoard). |
| Initial board fetch through useBoard differs from industries' current behavior | Medium | useBoard's `useEffect` initial-load path follows the same `GET /boards/:id` + `GET /boards/:id/items?page=1&limit=50` pattern that local handlers used. Behavior should be byte-identical for the user. |
| Token-key drift between configureApi and configureWebSocket | Low | Both calls are in main.tsx adjacent — visual review on each PR catches mismatches. Spec's "Always" boundary explicitly forbids drift. |
| useBoard's optimistic update for inline-edit double-applies with WS echo | Low | useBoard already handles this — the WS `onItemUpdated` handler in useBoard.ts uses `updateItem(prev, updated)` which is idempotent on `id`. Verified via existing useBoard.mutations.test.tsx. |
| 9 E2E test cases × 3 industries needs Docker — runtime pass deferred again | Medium | Same as Slice 20A E3. Acceptable: typecheck + manual run on one industry is sufficient ship gate. |

## Open questions

1. **Should the realtime-echo spec also run on the other 7 industries?** Spec proposes NovaPay/MedVista/JurisPath as the canonical 3 (matches the Slice 20A E2E coverage matrix). Adding the other 7 doubles the spec's runtime + adds no new code-path coverage (every industry consumes `useBoard` identically post-Phase-B). Recommend: **stick with 3** for MVP, expand later if a regression surfaces in production.

2. **Do we delete the local `useEffect` board-fetch in Phase B, or keep it as a fallback?** `useBoard` does its own fetch. Keeping the local one means double-fetch on mount. Recommend: **delete the local fetch** entirely — `useBoard` is authoritative.

3. **Should we add an `expect.poll` sub-utility to e2e/helpers/?** The pattern is repeated across the 9 cases. Recommend: **defer** — DAMP-over-DRY for tests; the 3-line poll is more readable inline than behind a helper.

---

## Parallelization strategy

Phase A is sequential (1 task).

Phase B is **3 waves of parallel agents on Opus**:

```
Wave 1 (4 agents, ~3 min wall-clock):
  Agent B1-novapay (worktree slice-20.5-novapay)
  Agent B1-medvista
  Agent B1-trustguard
  Agent B1-urbannest

  ↓ wait for all 4 to land on main, cherry-pick stragglers

Wave 2 (3 agents, ~3 min):
  Agent B1-swiftroute
  Agent B1-dentaflow
  Agent B1-jurispath

  ↓ wait

Wave 3 (3 agents, ~3 min):
  Agent B1-tablesync
  Agent B1-cranestack
  Agent B1-edupulse
```

Total Phase B wall-clock: ~10 min including inter-wave coordination.

Phase C + D run sequentially (single-threaded), ~5 min each.

**Total slice wall-clock: ~30 min** (matches spec estimate).

---

## Todo checklist

```
Phase A — Shared library (sequential)
- [ ] A1: configureWebSocket export + 4 vitest cases

Phase B — Per-industry migration (3 waves)
Wave 1:
- [ ] B1-novapay
- [ ] B1-medvista
- [ ] B1-trustguard
- [ ] B1-urbannest
Wave 2:
- [ ] B1-swiftroute
- [ ] B1-dentaflow
- [ ] B1-jurispath
Wave 3:
- [ ] B1-tablesync
- [ ] B1-cranestack
- [ ] B1-edupulse
- [ ] Checkpoint B: 10 atomic commits, all 10 industries clean

Phase C — E2E proof (sequential)
- [ ] C1: realtime-echo.spec.ts (3 industries × 3 cases = 9 tests)

Phase D — Verification (sequential)
- [ ] D1: verification log addendum
- [ ] D2: SPEC §Slice 20 criterion #5 ticked
- [ ] Checkpoint: Slice 20.5 shipped — all 10 SPEC §Slice 20 criteria ticked
```

---

**Next step after this plan is approved:** `/build A1 from plans/slice-20.5-plan.md` — start with the shared-library configurable export (small, gates everything else).
