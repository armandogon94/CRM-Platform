# Implementation Plan: Slice 21C — Bulk Actions

**Spec reference:** `SPEC.md` §Slice 21C (lines 2093–2195), parent §Slice 21 (lines 1713–1888)
**Size:** M
**Estimated tasks:** 5 phases / 7 tasks (1 hook + 1 multi-select state + 1 BulkActionBar + 1 wiring + 1 E2E + 1 verification + 1 SPEC tick)
**Estimated wall-clock:** ~75 min, single-threaded

**Predecessor:** Slice 20.5 fully shipped — every industry consumes shared `useBoard`. Slice 21B (Person picker) and 21A (File upload) are parallel siblings; this plan touches none of their files.

---

## Overview

Add multi-row selection to the shared `<TableView>` (checkbox column, click semantics, shift/Cmd modifiers, Escape) and a floating `<BulkActionBar>` that fires Delete / Change Status / Assign actions over the selection. Net change is purely client-side — every mutation is `Promise.all` over the existing per-item `useBoard.deleteItem` / `updateItemValue` routes, so backend test surface stays at zero. Three new `useBoard` wrappers (`bulkDelete`, `bulkUpdateValue`, `bulkAssign`) keep `<BulkActionBar>` ignorant of HTTP plumbing. RBAC gating is delegated to `<BoardView>`'s existing `useCanEdit()` plumbing — viewers see no checkboxes and no bar.

## Architecture decisions

- **Promise.all over per-item routes (parent ADR §Slice 21 OQ #2)** — no `PATCH /items/bulk` endpoint. Hyrum's Law cost is zero because no consumer depends on a bulk shape yet. HTTP/2 multiplexes the calls; 100-row delete is the worst realistic case.
- **ADR 21C-1: Visible-only "Select all"** — header checkbox selects the items currently rendered post-filter/post-search, not the underlying dataset. UNIT TESTED — easy regression target if someone "fixes" it to select-all-globally.
- **ADR 21C-2: Multi-group selection allowed** — selection set is flat `Set<number>` keyed on item id; no group-scoping. Bulk actions ignore group boundaries.
- **ADR 21C-3: Selection survives sort, clears on filter** — implemented via `useEffect` keyed on the filter parameters from `useBoard`. Sort is a render-order concern; filter genuinely hides rows.
- **ConfirmDialog reused from Slice 20B B1** — no new dialog component. "Delete N items?" with N interpolated.
- **Mixed-status union (spec OQ #1)** — bulk Status picker shows `unique(items[i].columnValues[statusColumnId].options)`. Some selected items will end up holding values not in their own column's option list — same already-tolerated behavior as Status columns.
- **No Cmd+A, no Delete-key shortcut (spec OQ #4)** — Cmd+A deferred to a future slice; Delete key is a footgun. Escape-to-clear is the only keyboard hook.
- **Selection state is ephemeral** — lives in `useState` inside `<TableView>`; no localStorage, no URL param.

## Dependency graph

```
Phase A — useBoard bulk wrappers (1 task)
  A1  bulkDelete / bulkUpdateValue / bulkAssign + 6 vitest cases
        │
        ▼
Phase B — TableView multi-select state (1 task)
  B1  selectedIds + lastClickedId + click handlers + Escape
      + filter-clears / sort-preserves effect + 8 vitest cases
        │
        ▼
Phase C — BulkActionBar standalone component (1 task)
  C1  <BulkActionBar /> + ConfirmDialog reuse + 6 vitest cases
        │
        ▼
Phase D — BoardView wiring (1 task)
  D1  Pass selectedIds + onClear + RBAC-gated mutations down;
      mount <BulkActionBar /> conditionally
        │
        ▼
Phase E — E2E + verification (3 tasks)
  E1  bulk-actions.spec.ts (3 cases × 3 industries = 9 tests)
  E2  Verification log addendum
  E3  SPEC §Slice 21C acceptance ticked
```

Each phase strictly precedes the next: B can't render the bar until A's wrappers exist; C can't render without B's selection contract; D can't wire without C's component; E exercises the assembled feature.

---

## Task list

### Phase A — useBoard bulk wrappers

#### Task A1: `bulkDelete` / `bulkUpdateValue` / `bulkAssign`

**Description:** Extend `frontends/_shared/src/hooks/useBoard.ts` with three thin wrappers that fan `Promise.allSettled` over the existing per-item mutations. Aggregate failures into a single toast (`"3 of 7 items couldn't be deleted"`), preserve per-item optimistic update + rollback (already in place). `bulkAssign` is a thin specialization of `bulkUpdateValue` for Person columns — passes `{ userIds: number[] }` as the value payload to match the existing person-column contract.

**RED → GREEN flow:**
1. Write `frontends/_shared/src/__tests__/useBoard.bulk.test.tsx` — 6 cases: (a) `bulkDelete` calls `deleteItem` N times, (b) all-success aggregates one success toast, (c) partial-failure renders `"X of Y …"` toast, (d) `bulkUpdateValue` fans `updateItemValue` per id, (e) `bulkAssign` passes `{ userIds }` shape, (f) empty `ids[]` is a no-op (no toast, no fetch). Mock `fetch` via existing test util. RED — wrappers don't exist.
2. Implement the three wrappers using `Promise.allSettled`. GREEN.
3. Refactor: extract `aggregateBulkToast(results, label)` helper if and only if all 3 wrappers share it line-for-line.

**Acceptance criteria:**
- [ ] `bulkDelete(ids)` → `Promise.allSettled(ids.map(deleteItem))`; one aggregated toast
- [ ] `bulkUpdateValue(ids, columnId, value)` → `Promise.allSettled(ids.map(id => updateItemValue(id, columnId, value)))`
- [ ] `bulkAssign(ids, columnId, userIds)` delegates to `bulkUpdateValue(ids, columnId, { userIds })`
- [ ] Empty `ids[]` is a no-op; no toast, no network
- [ ] Per-item optimistic update + rollback still fire (no regression on existing single-item mutations)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run useBoard` — existing + 6 new pass
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean

**Dependencies:** Slice 20.5 merged (already true).

**Files touched (2):**
- `frontends/_shared/src/hooks/useBoard.ts` (modify — add 3 wrappers)
- `frontends/_shared/src/__tests__/useBoard.bulk.test.tsx` (new)

**Estimated scope:** S.

---

### ✅ Checkpoint: Phase A complete
- [ ] A1 merged; `@crm/shared` test count grows by 6
- [ ] `useBoard` exports the 3 wrappers with documented signatures

---

### Phase B — TableView multi-select state

#### Task B1: selection state + click semantics + filter/sort effects

**Description:** Add `selectedIds: Set<number>` and `lastClickedId: number | null` `useState` to `<TableView>`. Wire the click matrix per spec: bare click replaces, Cmd/Ctrl toggles, Shift extends from `lastClickedId` (range computed against the *currently rendered visible* item order — same array `<TableView>` already maps over). Header checkbox toggles the visible set (ADR 21C-1). Escape clears. Filter-change clears (ADR 21C-3) via `useEffect` keyed on the filter inputs `<TableView>` already receives. Sort-change does NOT clear — the effect depends only on filter signals, not sort. Critical: cell-content clicks (status pill, date, etc.) `e.stopPropagation()` so inline edit still wins; only row whitespace + name cell + checkbox bubble to the row-select handler.

**RED → GREEN flow:**
1. Write `frontends/_shared/src/__tests__/TableView.multiselect.test.tsx` — 8 cases:
   1. Bare row click selects only that row (replaces prior selection).
   2. Cmd+click toggles; second Cmd+click on same row removes it.
   3. Shift+click from row 2 to row 5 selects rows 2–5 inclusive (range against current visible order).
   4. Header checkbox with empty selection → selects all visible.
   5. Header checkbox with all-visible-selected → clears.
   6. **ADR 21C-1 guard:** when filter hides rows 6–10, header checkbox selects rows 1–5 only (NOT 1–10). This is the easy regression target — explicit test required.
   7. **ADR 21C-3 guard part 1:** changing the filter prop clears `selectedIds`.
   8. **ADR 21C-3 guard part 2:** changing the sort prop preserves `selectedIds` (same set, different render order).
   Plus a sanity check that Escape clears. RED — state and handlers don't exist.
2. Implement state, click handlers, header checkbox, Escape listener, filter-keyed `useEffect`. GREEN.
3. Refactor: hoist the click-handler matrix into a small pure function `computeNextSelection(prev, clickedId, modifiers, lastClickedId, visibleIds)` to keep the JSX thin and the test target precise.

**Acceptance criteria:**
- [ ] All 7 click-semantic cases from spec match (bare/Cmd/Shift/header/Escape × visible-only)
- [ ] Filter prop change → selection clears (ADR 21C-3)
- [ ] Sort prop change → selection preserved (ADR 21C-3)
- [ ] Cell content `onClick` calls `stopPropagation()` so inline edit isn't broken (regression check: existing inline-edit test still green)
- [ ] `<TableView>` exposes `selectedIds` + `setSelectedIds` via prop callbacks (lift to parent — parent will mount the bar)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run TableView` — existing + 8 new pass
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean
- [ ] Existing inline-edit tests for status/text/date columns unchanged (no broken propagation)

**Dependencies:** A1.

**Files touched (2):**
- `frontends/_shared/src/components/board/TableView.tsx` (modify)
- `frontends/_shared/src/__tests__/TableView.multiselect.test.tsx` (new)

**Estimated scope:** M.

---

### ✅ Checkpoint: Phase B complete
- [ ] Selection state lives in TableView; bar consumer still TBD (Phase D)
- [ ] All 8 multiselect cases green; no inline-edit regression
- [ ] Visual: header checkbox renders; clicking does the right thing in storybook/devbuild

---

### Phase C — BulkActionBar standalone component

#### Task C1: `<BulkActionBar />` component

**Description:** Build `frontends/_shared/src/components/board/BulkActionBar.tsx` per spec contract. Bottom-fixed bar; left = "{N} selected" + Clear; center = three action buttons (Delete / Change status ↓ / Assign ↓). Delete opens shared `<ConfirmDialog>` (reused from B1). Status dropdown shows the **union** of options across selected items (spec OQ #1) — compute `Array.from(new Set(items.filter(i => selectedIds.has(i.id)).flatMap(i => statusColumn.options)))`. Assign dropdown reuses 21B's PersonPicker. Component is a pure consumer of props — no `useBoard` import; mutations come in as `onBulkDelete` / `onBulkUpdateStatus` / `onBulkAssign` callbacks (parent will pass RBAC-gated versions or `undefined` to hide buttons).

**RED → GREEN flow:**
1. Write `frontends/_shared/src/__tests__/BulkActionBar.test.tsx` — 6 cases:
   1. Renders nothing when `selectedIds.size === 0`.
   2. Renders `"3 selected"` and Clear link when 3 ids selected.
   3. Clear button calls `onClear`.
   4. Delete button opens ConfirmDialog with title `"Delete 3 items?"`; confirm calls `onBulkDelete([...])`; cancel does not.
   5. **Mixed-status union test:** selected items A (options [New, Done]) + B (options [Open, Closed]) → status dropdown shows all 4 options, deduped.
   6. RBAC: when `onBulkDelete` is `undefined`, Delete button does NOT render (parent gates by passing/withholding the prop).
   RED — component doesn't exist.
2. Implement the bar. GREEN.
3. Refactor for readability; no over-decomposition (single component + 1 helper for the union computation).

**Acceptance criteria:**
- [ ] Renders only when `selectedIds.size > 0`
- [ ] "{N} selected" interpolation correct
- [ ] Delete flow uses shared ConfirmDialog with "Delete N items?"
- [ ] Status dropdown options = union across selected items, deduped
- [ ] Assign dropdown uses PersonPicker (21B sibling — import is allowed since 21B lands in parallel; if 21B not yet merged at integration time, mock the import behind a stub and TODO comment)
- [ ] Buttons whose mutation prop is `undefined` are not rendered (RBAC respected)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run BulkActionBar` — 6/6 pass
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean

**Dependencies:** B1 (selection contract finalized).

**Files touched (2):**
- `frontends/_shared/src/components/board/BulkActionBar.tsx` (new)
- `frontends/_shared/src/__tests__/BulkActionBar.test.tsx` (new)

**Estimated scope:** M.

---

### ✅ Checkpoint: Phase C complete
- [ ] BulkActionBar standalone-renders correctly given mock props
- [ ] Mixed-status union test green (regression target)

---

### Phase D — BoardView wiring

#### Task D1: Mount BulkActionBar in BoardView with RBAC-gated mutations

**Description:** Modify `frontends/_shared/src/components/board/BoardView.tsx` to (a) lift `selectedIds` + `setSelectedIds` from TableView via callback props, (b) consume `bulkDelete` / `bulkUpdateValue` / `bulkAssign` from `useBoard()`, (c) gate via `useCanEdit()`: pass `onBulkDelete` only if `canDelete`, `onBulkUpdateStatus` / `onBulkAssign` only if `canEditInline`, (d) mount `<BulkActionBar />` next to `<TableView />` (only when current view is Table — bulk actions are TableView-only this slice). Wire `onClear={() => setSelectedIds(new Set())}`.

**RED → GREEN flow:**
1. Extend an existing `BoardView.test.tsx` (or write the smallest new spec) — 3 integration cases: (a) admin sees BulkActionBar after selecting a row; (b) viewer sees no checkboxes (gated upstream by passing `selectedIds={undefined}` or by TableView reading `canEditInline` — pick the cleaner of the two during implementation); (c) Kanban view does not render the bar even with selection. RED until D1 lands.
2. Wire props + gating. GREEN.
3. Refactor: confirm no `useBoard` import leaked into BulkActionBar (it should still be a pure consumer).

**Acceptance criteria:**
- [ ] Admin: select row → bar appears; click Delete → ConfirmDialog → bulk fires
- [ ] Admin: select rows → Change status → all selected items update via `Promise.all`
- [ ] Viewer: no checkbox column visible; no bar
- [ ] Kanban/Calendar/etc.: no bar (TableView-only this slice)
- [ ] Filter change clears selection AND hides the bar (since selection.size becomes 0)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run BoardView` — all green
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean
- [ ] Manual smoke on NovaPay: select 3 rows, bulk-delete, second tab sees 3 row-removals within 2s (per-item WS echo, parent §Slice 21 OQ #7)

**Dependencies:** A1, B1, C1.

**Files touched (1):**
- `frontends/_shared/src/components/board/BoardView.tsx`

**Estimated scope:** S.

---

### ✅ Checkpoint: Phase D complete
- [ ] End-to-end works on at least one industry locally
- [ ] No regression in single-item CRUD paths
- [ ] Review with human before E2E lands

---

### Phase E — E2E + verification + SPEC tick

#### Task E1: `bulk-actions.spec.ts`

**Description:** Playwright spec with 3 cases per industry (bulk-delete, bulk-status, bulk-assign) × 3 industries (NovaPay, MedVista, JurisPath) = 9 tests. Pattern matches Slice 20.5's `realtime-echo.spec.ts`: login as admin, open primary board, click 3 row checkboxes, fire action, assert UI reflects + (for delete) second tab observes 3 row-removals within 2s.

**Acceptance criteria:**
- [ ] Spec at `e2e/specs/slice-21/bulk-actions.spec.ts` (new directory if needed)
- [ ] 9 test cases parameterized over the 3-industry fixture matrix
- [ ] Cleanup via REST DELETE in afterEach
- [ ] Spec typechecks: `cd e2e && npx tsc --noEmit` clean

**Verification:**
- [ ] Manual run on NovaPay: `cd e2e && SLICE_21_INDUSTRIES=novapay npx playwright test specs/slice-21/bulk-actions --reporter=list` — 3/3 pass

**Files touched (1):** `e2e/specs/slice-21/bulk-actions.spec.ts` (new). **Scope:** M.

#### Task E2: Verification log addendum

Append a Slice 21C section to `plans/slice-21-verification.md` (create if absent): vitest count delta (+20: 6 + 8 + 6), file LOC delta, E2E status, manual smoke notes. **Files (1).** **Scope:** S.

#### Task E3: SPEC §Slice 21C acceptance criteria ticked

Update `SPEC.md` §Slice 21C acceptance checklist from `[ ]` to `[x]` with traceability notes citing A1/B1/C1/D1/E1 commit SHAs. **Files (1).** **Scope:** XS.

---

### ✅ Checkpoint: Slice 21C complete
- [ ] All 7 tasks merged, ~7 atomic commits
- [ ] All 11 SPEC §Slice 21C acceptance items ticked
- [ ] Slice 21 parent's bulk-actions sub-criterion closed
- [ ] Ready for `/review` or to await 21A/21B siblings before parent ship

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cell-content click handlers break inline edit due to missing `stopPropagation` | High (regresses 20A) | Test #B1 explicitly re-runs existing inline-edit specs after wiring; `computeNextSelection` is a pure function, easy to reason about |
| ADR 21C-1 silently regresses to "select-all-global" | Medium (footgun shipped to users) | Test B1.6 hard-asserts the visible-only behavior with a filter applied |
| ADR 21C-3 sort/filter distinction inverted (clears on sort, preserves on filter) | Medium | Tests B1.7 + B1.8 cover both halves; useEffect dep array review during PR |
| Status-union picker produces nonsense on heterogenous schemas | Low | Spec OQ #1 explicitly accepts unmatched values post-bulk; toast aggregator surfaces failures if validation rejects |
| 21B's PersonPicker not yet merged when C1 lands | Low | Stub the import behind a TODO + dynamic check; D1 wiring happens after both 21B and 21C-C1 land |
| Bulk delete of 100 items melts WS echo | Low (per-item echo is idempotent) | Parent OQ #7 already accepted N separate row-removal events; load-tested manually post-D1 |
| `Promise.allSettled` partial failure leaves UI in mixed state | Medium | Per-item optimistic-update path already rolls back individual failures; aggregate toast tells user "X of Y" |

## Open questions

1. **Should `bulkUpdateStatus` validate that selected items all share the same Status column id?** — Recommended: **no validation, trust the bar**. The bar passes one `columnId` (the user picked one Status column from one item's schema). Items without that column receive no-op updates server-side (per-item route returns 404 → Promise.allSettled records reject → aggregator toast). Cleaner than client-side schema diffing.
2. **Where does the keyboard `Escape` handler live — TableView or BoardView?** — Recommended: **TableView**, scoped to a `useEffect` that adds the listener only while `selectedIds.size > 0`. Avoids a global-listener footgun and keeps state colocated with the bar trigger.
3. **Should bar position be sticky-to-table or sticky-to-viewport?** — Recommended: **sticky-to-viewport bottom**, matching Linear/Notion. Spec OQ #3 already chose bottom; "viewport" vs "table-container" is a CSS detail — viewport wins because it remains visible even when the table scrolls vertically.

---

## Parallelization strategy

**Single-threaded.** Each phase strictly depends on the previous: A is a contract gate, B is the state owner, C is the consumer, D wires the two, E exercises the assembly. No industry fanout because all changes land in `@crm/shared` — Slice 20.5 already centralized every industry's `<BoardView>`/`<TableView>` consumption, so a single `@crm/shared` PR propagates to all 10 frontends at their next typecheck. Estimated wall-clock by phase: A=10m, B=20m, C=15m, D=10m, E1=15m, E2+E3=5m → **~75m total**. No race surface, no cross-agent coordination needed.

---

## Todo checklist

```
Phase A — useBoard bulk wrappers (sequential)
- [ ] A1: bulkDelete / bulkUpdateValue / bulkAssign + 6 vitest cases

Phase B — TableView multi-select state (sequential)
- [ ] B1: selectedIds + click matrix + filter/sort effects + 8 vitest cases

Phase C — BulkActionBar component (sequential)
- [ ] C1: <BulkActionBar /> standalone + 6 vitest cases (incl. mixed-status union)

Phase D — Wiring (sequential)
- [ ] D1: BoardView passes selectedIds + RBAC-gated mutations to bar; mount conditional on Table view

Phase E — E2E + verification (sequential)
- [ ] E1: bulk-actions.spec.ts (3 industries × 3 cases = 9 tests)
- [ ] E2: plans/slice-21-verification.md addendum
- [ ] E3: SPEC §Slice 21C acceptance ticked
- [ ] Checkpoint: 21C shipped — all 11 acceptance items closed
```

---

**Out of scope (re-stated from spec):**
- Cmd+A select-all (deferred to a follow-up)
- Delete-key keyboard shortcut for bulk delete (footgun — explicit non-goal)
- Bulk move-to-group, bulk duplicate (Slice 23)
- Backend `PATCH /items/bulk` endpoint (parent ADR rejected — Promise.all stays)
- Persisting selection across reloads (ephemeral by design)

**Next step after this plan is approved:** `/build A1 from plans/slice-21c-plan.md`.
