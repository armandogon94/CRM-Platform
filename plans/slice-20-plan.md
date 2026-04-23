# Implementation Plan: Slice 20 — CRUD UI Wiring Across Industry Frontends

**Spec reference:** `SPEC.md` §Slice 20 (lines 1372–1556)
**Size:** L
**Estimated tasks:** 14 tasks across 5 phases
**Prerequisite:** Slices 16 (shared library), 17 (seed data), 18 (industry shells), 19 (E2E infra), 19.6 (NovaPay router migration), 19.7 (Status normalization — commits `21aad33`, `d470ffb`) all merged.

---

## Overview

Wire end-to-end CRUD (create item, inline-edit column value, delete item, create board) through the UI of three reference industry shells — NovaPay, MedVista, JurisPath — by mounting the already-built shared-library components (`FormView`, `ColumnEditor`, `BoardListPage` with New Board dialog) and threading CRUD callbacks through to the REST API. No new backend work. Add a `<Toast>` component to the shared library so error paths stop silently swallowing failures. Twelve new Playwright specs (4 flows × 3 industries) prove the slice end-to-end.

**Pragmatic grounding:** Pre-plan reading showed the shared components are MORE ready than the spec assumed. `KanbanView` already exposes `onItemCreate`, `onItemUpdate`, `onItemDelete` as props and renders an inline add-item form at the bottom of each lane. `TableView` already wires `editingCell` state + mounts `ColumnEditor`. What's actually missing: (a) Kanban card kebab menu for delete, (b) typed `api.items.*` client methods, (c) `useBoard` mutation functions, (d) `<Toast>` component, (e) per-industry App.tsx wiring, (f) E2E specs.

## Architecture Decisions

- **Contract-first:** Phase A locks the Toast API + typed `api.items.*` interface in shared lib BEFORE any industry wiring starts. This lets Phase C (per-industry wiring) parallelize safely.
- **No backend changes:** This slice is pure UI. All endpoints exist. Backend test suite re-runs as regression check only.
- **TDD at every task:** Each task starts with a failing test (RED), implements minimum code to pass (GREEN), refactors if needed, commits atomically. No implementation lands without a test.
- **Optimistic updates, surgical:** Only inline-edit on Table cells is optimistic. Create and delete use loading → server-echo round-trip per spec §4.
- **RBAC gating via a single hook:** `useCanEdit()` returns booleans per affordance. Single source of truth for "show New Board button", "show delete", etc. Avoids scattering `user.role === 'admin'` checks across the codebase.
- **Max 5 files per task** (tighter than the spec's ~10) — keeps each task a single focused session.
- **Parallelization via worktrees:** Phase C tasks (3 industries) and Phase D tasks (6 spec files) are embarrassingly parallel after Phase A+B land. Dispatch as background subagents on Opus with `isolation: "worktree"`.

---

## Dependency Graph

```
Phase A — Shared-library foundation (sequential)
  A1  Toast component + ToastProvider + useToast hook
  A2  Typed api.items.* client methods
  A3  useBoard mutations (createItem, updateItemValue, deleteItem)
  A4  useCanEdit() RBAC hook
           │
           ▼
Phase B — Shared UI affordances (sequential)
  B1  KanbanView card kebab + delete confirmation
  B2  BoardListPage error-toast wiring (replace silent catch)
           │
           ▼
Phase C — Per-industry wiring (parallel — 3 worktrees)
  C1  NovaPay: ToastProvider + CRUD callbacks + RBAC gating
  C2  MedVista: ToastProvider + CRUD + BoardListPage adoption + RBAC
  C3  JurisPath: ToastProvider + CRUD + BoardListPage adoption + RBAC
           │
           ▼
Phase D — E2E specs (parallel — 3 worktrees)
  D1  Fixture matrix + create-item-kanban + create-item-form specs
  D2  inline-edit-status + delete-item specs
  D3  create-board + rbac-viewer specs
           │
           ▼
Phase E — Verification (sequential)
  E1  Full test sweep: @crm/shared + backend + all 3 industries typecheck
  E2  12/12 E2E specs green across 3 industries + visual baseline clean
  E3  Make targets (e2e:slice-20, test:shared) + SPEC success-criteria tickbox
```

---

## Phase A — Shared-library foundation

### Task A1: `<Toast>` component + `<ToastProvider>` + `useToast()` hook

**Description:** Add a toast notification primitive to the shared library. Stack of dismissable banners, bottom-right, 5s default auto-dismiss. Consumed via a context hook. Every error path in the slice will emit toasts through this.

**RED → GREEN flow:**
1. Write `Toast.test.tsx` with 12 cases covering: show/dismiss/variants (success/error/info/warning), auto-close timer, persistent (null autoCloseMs), keyboard a11y (Escape dismisses focused toast), role attributes (`role="status"` vs `role="alert"`), stack ordering, dismiss button aria-label.
2. Implement `Toast.tsx` + `ToastProvider.tsx` satisfying the contract.

**Acceptance criteria:**
- [ ] `useToast().show({ variant: 'error', title: 'Failed' })` renders a toast that auto-dismisses in 5s
- [ ] Error/warning toasts have `role="alert"`; success/info have `role="status"`
- [ ] Dismiss button has `aria-label="Dismiss notification"`
- [ ] Passing `autoCloseMs: null` keeps the toast until explicitly dismissed
- [ ] Escape key dismisses the most-recent toast
- [ ] Multiple toasts stack vertically, newest at bottom

**Verification:**
- [ ] `cd frontends/_shared && npm test -- Toast` — all 12 cases pass
- [ ] `cd frontends/_shared && npm run typecheck` — clean

**Dependencies:** None. This is the foundation.

**Files touched (3):**
- `frontends/_shared/src/components/common/Toast.tsx` (new)
- `frontends/_shared/src/components/common/ToastProvider.tsx` (new, exports `useToast`)
- `frontends/_shared/src/__tests__/Toast.test.tsx` (new)

**Size:** S

---

### Task A2: Typed `api.items.*` and `api.boards.*` client methods

**Description:** Add typed mutation helpers to the shared `api.ts` so industry App.tsx files and hooks have a consistent, typechecked surface. Currently `api.ts` has a generic `request()` + barebones `api` object; no typed item/board mutations exist.

**RED → GREEN flow:**
1. Write `api.items.test.ts` — RED. Mock `fetch` globally, verify request shape + URL + body for `createItem`, `updateItemValues`, `deleteItem`, `createBoard`.
2. Extend `api.ts` with typed methods returning `ApiResponse<T>` matching the backend's `successResponse`/`paginatedResponse` envelope.

**Acceptance criteria:**
- [ ] `api.items.create({ boardId, groupId, name, values })` POSTs to `/items` with JSON body
- [ ] `api.items.updateValues(itemId, values)` PUTs to `/items/:id/values` with `{ values: [...] }`
- [ ] `api.items.delete(itemId)` DELETEs to `/items/:id`
- [ ] `api.boards.create({ name, description, workspaceId, boardType })` POSTs to `/boards`
- [ ] Every method returns `Promise<ApiResponse<T>>` — never throws; surfaces errors via `success: false`
- [ ] Test mocks fetch and asserts: method, URL, body shape, content-type header, Authorization header when token present

**Verification:**
- [ ] `cd frontends/_shared && npm test -- api.items` — all cases pass
- [ ] `cd frontends/_shared && npm run typecheck` — clean

**Dependencies:** None (can parallelize with A1 but kept sequential for commit atomicity).

**Files touched (2):**
- `frontends/_shared/src/utils/api.ts` (modify — add typed methods)
- `frontends/_shared/src/__tests__/api.items.test.ts` (new)

**Size:** S

---

### Task A3: `useBoard` mutation helpers

**Description:** Extend `useBoard.ts` with `createItem`, `updateItemValue`, `deleteItem` mutation functions that wrap `api.items.*`, emit toasts on error, and apply optimistic updates for inline-edit only. This is the single call-site every industry's App.tsx uses.

**RED → GREEN flow:**
1. Write `useBoard.mutations.test.tsx` — RED. Render a consumer component, trigger each mutation, assert: network call made, optimistic state applied (for `updateItemValue`), error toast emitted on failure, rollback on failure.
2. Add mutations to `useBoard.ts`.

**Acceptance criteria:**
- [ ] `createItem({ groupId, name, values })` calls `api.items.create`; on success, does NOT locally mutate state (Socket.io echo appends); on error, emits toast with error message
- [ ] `updateItemValue(itemId, columnId, value)` applies the change locally, fires `api.items.updateValues`; on error, rolls back + emits toast
- [ ] `deleteItem(itemId)` removes from local state optimistically, fires `api.items.delete`; on error, re-inserts + emits toast
- [ ] Mutations are stable references (`useCallback`) so consumer re-renders don't re-fire
- [ ] Errors from `api.*` (`success: false`) are surfaced, not swallowed

**Verification:**
- [ ] `cd frontends/_shared && npm test -- useBoard.mutations` — all cases pass
- [ ] `cd frontends/_shared && npm run typecheck` — clean

**Dependencies:** A1 (uses `useToast`), A2 (uses `api.items.*`).

**Files touched (3):**
- `frontends/_shared/src/hooks/useBoard.ts` (modify)
- `frontends/_shared/src/__tests__/useBoard.mutations.test.tsx` (new)
- `frontends/_shared/src/hooks/__fixtures__/mockWebSocket.ts` (optional — if useBoard needs WS stubbed for mutation tests)

**Size:** M

---

### Task A4: `useCanEdit()` RBAC hook

**Description:** Single source of truth for affordance visibility across the slice. Returns booleans per action based on the RBAC matrix in the spec (§ RBAC UI matrix). Lives in shared lib so every industry uses it identically.

**RED → GREEN flow:**
1. Write `useCanEdit.test.tsx` — RED. Render with each of the 4 roles (admin, manager, member, viewer) and assert the returned matrix matches the spec table exactly.
2. Implement in a new file `frontends/_shared/src/hooks/useCanEdit.ts`.

**Acceptance criteria:**
- [ ] Returns `{ canCreateBoard, canCreateItem, canEditInline, canDelete }` — all booleans
- [ ] `admin` + `manager` → all `true`
- [ ] `member` → `canCreateBoard=false`, rest `true`
- [ ] `viewer` → all `false`
- [ ] Derived from `useAuth().user.role` (existing auth context)
- [ ] Stable reference (memoized on role)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- useCanEdit` — 4 role cases pass
- [ ] `cd frontends/_shared && npm run typecheck` — clean

**Dependencies:** None (reads from existing auth context).

**Files touched (2):**
- `frontends/_shared/src/hooks/useCanEdit.ts` (new)
- `frontends/_shared/src/__tests__/useCanEdit.test.tsx` (new)

**Size:** XS

---

### ✅ Checkpoint: Phase A foundation

- [ ] A1–A4 all merged to `main` as separate commits
- [ ] `cd frontends/_shared && npm test && npm run typecheck` — 100% green
- [ ] Existing shared tests (theme, status from 19.7) still pass — no regressions
- [ ] Review with human before proceeding to Phase B

---

## Phase B — Shared UI affordances

### Task B1: KanbanView card kebab menu + delete confirmation

**Description:** Add a 3-dot kebab menu to each Kanban card that opens a dropdown with a `Delete` option. Clicking Delete opens a confirmation modal ("Delete {item.name}? This cannot be undone."). Confirmation calls `onItemDelete(itemId)`. Only renders if `onItemDelete` prop is provided (keeps callers that don't want delete affordance untouched).

**RED → GREEN flow:**
1. Write `KanbanView.delete.test.tsx` — RED. Render with items + `onItemDelete` mock, click kebab → assert menu opens, click delete → assert confirmation modal, confirm → assert `onItemDelete` called with correct itemId, cancel → assert it was NOT called.
2. Add kebab + confirmation UI to `KanbanView.tsx`.

**Acceptance criteria:**
- [ ] Kebab (⋮) icon visible in top-right of every card when `onItemDelete` is provided
- [ ] Kebab click opens a menu with `Delete` option (future-extensible to duplicate, move, etc.)
- [ ] Delete click opens a confirmation modal with the item name interpolated
- [ ] Confirm fires `onItemDelete(itemId)` exactly once; cancel fires nothing
- [ ] Confirmation modal has `role="dialog"` + `aria-labelledby` + focus-trap
- [ ] Escape closes the modal without calling `onItemDelete`
- [ ] Kebab button has `aria-label="Item actions"`

**Verification:**
- [ ] `cd frontends/_shared && npm test -- KanbanView.delete` — all cases pass
- [ ] `cd frontends/_shared && npm run typecheck` — clean

**Dependencies:** Phase A complete (not strictly required but cleaner commit order).

**Files touched (3):**
- `frontends/_shared/src/components/board/KanbanView.tsx` (modify)
- `frontends/_shared/src/components/common/ConfirmDialog.tsx` (new — reusable across future slices)
- `frontends/_shared/src/__tests__/KanbanView.delete.test.tsx` (new)

**Size:** M

---

### Task B2: `BoardListPage` error-toast wiring

**Description:** Replace the silent `catch` at `BoardListPage.tsx:42` with a toast emission. Today: `catch { // Handle error silently }`. New: emit an error toast with the server message. Also: surface network failures (fetch rejection) via toast.

**RED → GREEN flow:**
1. Write `BoardListPage.test.tsx` — RED. Mount with mocked `api.boards.create` that returns `{ success: false, error: 'Duplicate name' }`, trigger create, assert toast was emitted + dialog stays open + form values preserved.
2. Wire `useToast()` into `handleCreateBoard`.

**Acceptance criteria:**
- [ ] On `api.boards.create` failure (`success: false`): emit error toast with server's `error` message, keep dialog open, preserve typed name + description
- [ ] On network rejection (fetch throws): emit generic "Could not create board" error toast
- [ ] On success: close dialog, reset form, call `refreshBoards()` (existing behavior preserved)
- [ ] No silent `catch` blocks remain in this file

**Verification:**
- [ ] `cd frontends/_shared && npm test -- BoardListPage` — all cases pass
- [ ] Grep confirms no `// Handle error silently` strings in `frontends/_shared/src/`

**Dependencies:** A1 (`useToast`), A2 (`api.boards.create`).

**Files touched (2):**
- `frontends/_shared/src/pages/BoardListPage.tsx` (modify)
- `frontends/_shared/src/__tests__/BoardListPage.test.tsx` (new)

**Size:** S

---

### ✅ Checkpoint: Phase B affordances

- [ ] B1 + B2 merged
- [ ] `cd frontends/_shared && npm test && npm run typecheck` — 100% green
- [ ] No silent catch blocks anywhere in `frontends/_shared/src/`
- [ ] Review with human before Phase C industry fanout

---

## Phase C — Per-industry wiring (parallelizable via worktrees)

Tasks C1–C3 can execute in parallel as isolated worktrees on Opus. Each touches only its own `frontends/<industry>/src/App.tsx` + (for MedVista/JurisPath) adoption of `BoardListPage`. Zero cross-industry file conflict.

### Task C1: NovaPay CRUD wiring

**Description:** Mount `<ToastProvider>` at the app root. Thread `createItem`, `updateItemValue`, `deleteItem` from `useBoard` through to the BoardView component. Gate CRUD affordances behind `useCanEdit()`. NovaPay is router-based so integration is on `BoardPage` + `BoardListPage` routes.

**RED → GREEN flow:**
1. Write an E2E smoke spec in `e2e/specs/slice-20/_c1_novapay_smoke.spec.ts` — RED (but tolerate failure; Phase D replaces this). Or write a vitest integration test at `frontends/novapay/src/__tests__/App.crud.test.tsx` asserting the wiring renders and the mutations are invocable.
2. Wire `<ToastProvider>` + mutations into `App.tsx`. Pass callbacks down to `BoardPage`.

**Acceptance criteria:**
- [ ] `<ToastProvider>` wraps the app below `<BrowserRouter>` so every route has toast access
- [ ] BoardView receives `onItemCreate`, `onItemUpdate`, `onItemDelete` props from `useBoard()` mutations
- [ ] New Board dialog toasts on create-error (inherits from B2 automatically — verify)
- [ ] Manual smoke: login as admin@novapay.com, open a board, click `+ Add item` in a Kanban lane → item persists after refresh

**Verification:**
- [ ] `cd frontends/novapay && npx tsc --noEmit` — clean
- [ ] `cd frontends/novapay && npm run build` — succeeds
- [ ] Manual smoke in browser (Phase D E2E is the authoritative check)

**Dependencies:** Phase A + B complete.

**Files touched (2):**
- `frontends/novapay/src/App.tsx` (modify)
- `frontends/novapay/src/components/BoardPage.tsx` (modify — thread props to BoardView) OR equivalent wrapper

**Size:** S

---

### Task C2: MedVista CRUD wiring + BoardListPage adoption

**Description:** Same as C1, but MedVista uses state-based nav. Adopt `BoardListPage` from the shared library, replacing the current inline board-list rendering. Gate affordances via `useCanEdit()`.

**Acceptance criteria:**
- [ ] `<ToastProvider>` wraps the app
- [ ] MedVista imports `BoardListPage` from `@crm/shared/pages/BoardListPage`
- [ ] Clicking a board in the sidebar OR list navigates via `activeView` state — preserves state-nav pattern
- [ ] CRUD callbacks wired identically to C1
- [ ] Brand color `#059669` still applied via existing theme prop

**Verification:**
- [ ] `cd frontends/medvista && npx tsc --noEmit` — clean
- [ ] `cd frontends/medvista && npm run build` — succeeds

**Dependencies:** Phase A + B complete. Can run in parallel with C1.

**Files touched (3):**
- `frontends/medvista/src/App.tsx` (modify)
- `frontends/medvista/src/components/BoardListPage.tsx` (delete or redirect to shared — note in commit)
- `frontends/medvista/src/components/Sidebar.tsx` (modify — "New Board" button calls into shared dialog)

**Size:** M

---

### Task C3: JurisPath CRUD wiring + BoardListPage adoption

**Description:** Same shape as C2. JurisPath's 3 boards have distinct status/workflow semantics (cases, clients, invoices — each with different `Status` column options) — this task proves the shared components handle domain variance without special-casing.

**Acceptance criteria:**
- [ ] `<ToastProvider>` wraps the app
- [ ] BoardListPage adopted from shared library
- [ ] CRUD works on all 3 JurisPath boards (cases, clients, invoices)
- [ ] Status edits render the correct per-board option set (New/Intake/Active vs. Draft/Sent/Paid etc.)

**Verification:**
- [ ] `cd frontends/jurispath && npx tsc --noEmit` — clean
- [ ] `cd frontends/jurispath && npm run build` — succeeds

**Dependencies:** Phase A + B complete. Can run in parallel with C1 + C2.

**Files touched (3):**
- `frontends/jurispath/src/App.tsx` (modify)
- `frontends/jurispath/src/components/BoardListPage.tsx` (delete or redirect)
- `frontends/jurispath/src/components/Sidebar.tsx` (modify)

**Size:** M

---

### ✅ Checkpoint: Phase C industry wiring

- [ ] C1, C2, C3 merged as separate commits
- [ ] All 3 industries typecheck + build clean
- [ ] Manual smoke on each: login as admin, create an item, edit a status, delete an item, create a board — all work
- [ ] `@crm/shared` tests still 100% green (no shared-lib regression)
- [ ] Review with human before E2E phase

---

## Phase D — E2E specs (parallelizable via worktrees)

Tasks D1–D3 split 6 spec files across 3 worktrees. Each spec is parameterized by the industry matrix from `e2e/fixtures/slice-20-industries.ts` so one spec file exercises all 3 industries.

### Task D1: Slice-20 fixture matrix + create-item flows

**Description:** Create the parameterized fixture matrix (NovaPay + MedVista + JurisPath, with per-industry admin credentials and primary board names). Write Playwright specs for Flow A (Kanban `+ Add item`) and Flow B (Table group `+ Add item` via FormView).

**Acceptance criteria:**
- [ ] `e2e/fixtures/slice-20-industries.ts` exports `INDUSTRIES: IndustryFixture[]` with 3 entries
- [ ] Each fixture has: `slug`, `port`, `adminEmail`, `adminPassword`, `primaryBoardName`, `brandColor`
- [ ] `create-item-kanban.spec.ts` runs across all 3: login → navigate to primary board → click Kanban `+ Add item` → type name → confirm → assert item appears in lane
- [ ] `create-item-form.spec.ts` runs across all 3: table view → group `+ Add item` → FormView modal → fill fields → submit → assert row appears
- [ ] Both specs clean up after themselves (delete the created item in `afterEach`) to avoid fixture drift

**Verification:**
- [ ] `cd e2e && npx playwright test slice-20/create-item-kanban slice-20/create-item-form` — 6/6 pass (2 specs × 3 industries)

**Dependencies:** Phase C complete (UI must exist for E2E to pass).

**Files touched (3):**
- `e2e/fixtures/slice-20-industries.ts` (new)
- `e2e/specs/slice-20/create-item-kanban.spec.ts` (new)
- `e2e/specs/slice-20/create-item-form.spec.ts` (new)

**Size:** M

---

### Task D2: Inline-edit-status + delete-item E2E specs

**Description:** Flow C (status cell edit) and Flow D (Kanban card delete). Both specs use the D1 fixture matrix.

**Acceptance criteria:**
- [ ] `inline-edit-status.spec.ts`: table view → click status cell → select new option → assert cell text changes → reload → assert persists
- [ ] `delete-item.spec.ts`: Kanban card → kebab → Delete → confirm modal → confirm → assert card removed → reload → assert still removed
- [ ] Each spec creates its own item in `beforeEach` to be status-edited or deleted (deterministic — doesn't depend on seed data)
- [ ] Real-time check: a second Playwright browser context observes the change within 2s of the first action

**Verification:**
- [ ] `cd e2e && npx playwright test slice-20/inline-edit-status slice-20/delete-item` — 6/6 pass

**Dependencies:** Phase C complete. Runs in parallel with D1 + D3.

**Files touched (2):**
- `e2e/specs/slice-20/inline-edit-status.spec.ts` (new)
- `e2e/specs/slice-20/delete-item.spec.ts` (new)

**Size:** M

---

### Task D3: create-board + rbac-viewer E2E specs

**Description:** Flow E (create board from sidebar) and the RBAC gating proof spec (viewer role sees no CRUD affordances).

**Acceptance criteria:**
- [ ] `create-board.spec.ts`: sidebar → New Board → dialog → fill name + description → submit → assert board appears in sidebar → clean up in afterEach
- [ ] `rbac-viewer.spec.ts`: login as `viewer@<industry>.com` → assert none of these are visible: `+ Add item` buttons, kebab menus, status cells as editable (they render read-only), New Board button
- [ ] Viewer seed credentials must exist — task adds `viewer@novapay.com`, `viewer@medvista.com`, `viewer@jurispath.com` to respective seeds if missing

**Verification:**
- [ ] `cd e2e && npx playwright test slice-20/create-board slice-20/rbac-viewer` — 6/6 pass

**Dependencies:** Phase C complete. Runs in parallel with D1 + D2. MAY require seed update (note in plan if viewer role missing in seeds — check during red-test phase).

**Files touched (≤4):**
- `e2e/specs/slice-20/create-board.spec.ts` (new)
- `e2e/specs/slice-20/rbac-viewer.spec.ts` (new)
- `backend/src/seeds/novapay/workspace.ts` (modify — add viewer user if missing)
- `backend/src/seeds/medvista/workspace.ts` (modify — if missing)
- `backend/src/seeds/jurispath/workspace.ts` (modify — if missing)

> If all 3 seeds already have a viewer user, last 3 files drop out — re-scope to M size. Check upfront in the task.

**Size:** M (could be L if all 3 seeds need viewer users — split into D3a/D3b if so)

---

### ✅ Checkpoint: Phase D E2E

- [ ] D1, D2, D3 merged
- [ ] `cd e2e && npx playwright test slice-20/` — 12/12 specs pass (or 6/6 specs × 3 industries = 18/18 if matrix counts as separate runs)
- [ ] No flakes across 3 consecutive runs
- [ ] Review with human before verification phase

---

## Phase E — Verification

### Task E1: Full cross-project test sweep

**Description:** Run every test surface and produce a one-page verification log in `plans/slice-20-verification.md` (matches format of `slice-19c-verification.md`).

**Acceptance criteria:**
- [ ] `cd frontends/_shared && npm test` — all tests pass, count ≥ current count + 40 (new Toast/FormView/ColumnEditor/BoardListPage/useBoard.mutations/useCanEdit cases)
- [ ] `cd backend && npm test` — same pass/fail ratio as before Slice 20 (no regressions)
- [ ] `cd frontends/novapay && npx tsc --noEmit` — clean
- [ ] `cd frontends/medvista && npx tsc --noEmit` — clean
- [ ] `cd frontends/jurispath && npx tsc --noEmit` — clean
- [ ] `cd frontends/_shared && npx tsc --noEmit` — clean
- [ ] All 4 build commands succeed

**Verification:** Log saved at `plans/slice-20-verification.md`.

**Dependencies:** Phase D complete.

**Files touched (1):**
- `plans/slice-20-verification.md` (new)

**Size:** XS

---

### Task E2: Visual regression sweep (Slice 19B)

**Description:** Re-run the Slice 19B snapshot suite. Expected: green (admin user sees same affordances they already saw; new `+ Add item` buttons were already in the shared components and so were present in baselines). If any snapshots update, document why in `plans/slice-20-verification.md`.

**Acceptance criteria:**
- [ ] `cd e2e && npx playwright test --config=playwright.visual.config.ts` — 0 diffs OR all diffs documented as expected
- [ ] Snapshot updates (if any) committed with prefix `test(visual): update baseline after Slice 20 <reason>`

**Dependencies:** E1 complete.

**Files touched:** Snapshot baselines in `e2e/visual/__snapshots__/` (if any updates needed).

**Size:** XS (assuming green) / S (if baselines update)

---

### Task E3: Make targets + SPEC tick-off

**Description:** Add the two Make targets from the spec; tick the SPEC §Slice 20 success criteria checkboxes.

**Acceptance criteria:**
- [ ] `Makefile` has `e2e:slice-20` target that seeds 3 industries + runs `slice-20/` Playwright directory
- [ ] `Makefile` has `test:shared` target that runs `cd frontends/_shared && npm test`
- [ ] `make e2e:slice-20` — exit 0
- [ ] `make test:shared` — exit 0
- [ ] SPEC.md §Slice 20 success-criteria checkboxes all checked (edit in place)

**Dependencies:** E1, E2 complete.

**Files touched (2):**
- `Makefile` (modify — add 2 targets)
- `SPEC.md` (modify — tick checkboxes)

**Size:** XS

---

### ✅ Checkpoint: Slice 20 complete

- [ ] All 14 tasks merged as atomic commits on `main`
- [ ] `plans/slice-20-verification.md` shows green on all success criteria
- [ ] SPEC.md §Slice 20 success criteria all ticked
- [ ] Git log shows: 4 Phase-A + 2 Phase-B + 3 Phase-C + 3 Phase-D + 3 Phase-E = 15 commits (some tasks may be split into multiple commits per TDD cycle)
- [ ] Ready to ship: `/review plans/slice-20-plan.md`

---

## Risks and Mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Shared-lib regressions break all 3 industries simultaneously | High | Phase A + B lands BEFORE any industry wiring. Shared tests must be 100% green before Phase C starts. |
| Optimistic inline-edit masks server errors | Medium | Mandatory rollback + toast on server error in A3. E2E spec D2 explicitly tests the rollback path (inject a 422 via API contract override). |
| E2E flakiness from Socket.io echo timing | Medium | Use `expect.poll()` with 2s ceiling. Slice 19 already proved the pattern works for real-time flows. |
| Viewer seed users don't exist → D3 grows | Low | Quick grep upfront (30 sec check). Resize D3 before red phase if needed. |
| Per-industry BoardListPage adoption conflicts with existing components | Medium | C2 + C3 explicitly DELETE the old industry-local BoardListPage files in their commits. No back-compat shim. |
| `member` role UI-gating confuses users seeing different buttons than admin | Low (demo scope) | Documented in spec; deferred to Slice 22 collaboration work. |
| Playwright parallelization (workers:4) causes DB contention across the 3 industries | Medium | `e2e:slice-20` target runs specs against one industry at a time — honors the user's "max 1 industry at a time" constraint from Slice 19.7. |

---

## Open Questions

*None.* Every spec-level open question was resolved in SPEC.md §Slice 20. If implementation surfaces a new question, stop and update the spec before proceeding (see `spec-driven-development.keeping-the-spec-alive`).

---

## Parallelization Strategy

Phase A → Phase B is **strictly sequential** (4 then 2 tasks).

Phase C can spawn **3 parallel background agents on Opus** after Phase B merges:

```
Agent C1 (worktree novapay-crud):   "Implement Task C1 from plans/slice-20-plan.md"
Agent C2 (worktree medvista-crud):  "Implement Task C2 from plans/slice-20-plan.md"
Agent C3 (worktree jurispath-crud): "Implement Task C3 from plans/slice-20-plan.md"
```

Phase D can spawn **3 more parallel agents** after Phase C merges:

```
Agent D1 (worktree slice20-e2e-create): Tasks D1
Agent D2 (worktree slice20-e2e-edit):   Tasks D2
Agent D3 (worktree slice20-e2e-board):  Tasks D3
```

Cherry-pick commits back to `main` after each wave. This pattern matched Slice 19/19B/19C and delivered ~3x time savings.

Phase E is sequential (each task gates the next) and fast (<30 min total).

---

## Todo Checklist (copy into work sessions)

```
Phase A — Foundation (sequential)
- [ ] A1: Toast component + useToast hook
- [ ] A2: Typed api.items.* + api.boards.create
- [ ] A3: useBoard mutations (create/update/delete)
- [ ] A4: useCanEdit() RBAC hook
- [ ] Checkpoint A: @crm/shared 100% green, typecheck clean

Phase B — Shared UI (sequential)
- [ ] B1: KanbanView kebab + ConfirmDialog
- [ ] B2: BoardListPage toast-on-error
- [ ] Checkpoint B: @crm/shared 100% green, no silent catches in src/

Phase C — Per-industry (parallel x3)
- [ ] C1: NovaPay wiring
- [ ] C2: MedVista wiring + BoardListPage adoption
- [ ] C3: JurisPath wiring + BoardListPage adoption
- [ ] Checkpoint C: 3 industries typecheck+build clean, manual smoke green

Phase D — E2E (parallel x3)
- [ ] D1: Fixture matrix + create-item specs (2)
- [ ] D2: Inline-edit + delete specs (2)
- [ ] D3: Create-board + RBAC-viewer specs (2)
- [ ] Checkpoint D: 12/12 Playwright specs green, no flakes

Phase E — Verification (sequential)
- [ ] E1: Full test sweep + verification log
- [ ] E2: Visual regression pass
- [ ] E3: Make targets + SPEC tickboxes
- [ ] Checkpoint: Slice 20 shipped → /review
```

---

**Next step after this plan is approved:** `/build A1` — begin TDD implementation of the Toast component.
