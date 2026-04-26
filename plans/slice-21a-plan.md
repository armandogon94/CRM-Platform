# Implementation Plan: Slice 21A — File Upload UI

**Spec reference:** `SPEC.md` §Slice 21A (lines 1890–1971), parent invariants §Slice 21 (lines 1713–1888)
**Size:** M
**Estimated tasks:** 5 phases / 9 tasks (1 shared util + 2 component + 2 wire-in + 2 backend/hook + 1 E2E + 1 verification)
**Estimated wall-clock:** ~90 min single-threaded (no parallel waves — see §Parallelization strategy)

**Predecessor:** Slice 20A + 20B + 20.5 fully shipped. `@crm/shared` `BoardView`/`useBoard`/`useCanEdit`/`ToastProvider`/`ConfirmDialog` are locked. Slice 8 file routes (`POST /files/upload`, `GET /files/:id/download`, `DELETE /files/:id`) exist with multer 10MB-per-file enforcement and workspace-quota gating via `StorageService.isWithinQuota`.

---

## Overview

Make the `Files` column type interactive end-to-end: drag-drop or click-to-pick a file, upload via the existing Slice 8 multipart route with a live progress bar, and render the uploaded-files list with download/delete affordances. Add a workspace-storage quota indicator to `BoardView`'s header. Backend gains WebSocket emit on file create/delete (Slice 8 pre-dates Slice 20's WS work) so the existing Slice 20.5 two-tab echo invariant extends to files. All work lands in `@crm/shared` plus two backend touch-points — zero per-industry fanout (locked by Slice 20.5's shared adoption).

## Architecture decisions

- **ADR 21A-1 (from spec): XHR over fetch for upload progress.** `fetch()` does not surface upload progress events; `XMLHttpRequest.upload.onprogress` does. A single `uploadWithProgress(url, formData, onProgress)` helper in `api.ts` wraps XHR for the upload path only. Rest of `api.files.*` (list, delete) stays on `fetch`.
- **Plan-level: tests before implementation, every task.** Each task ships a failing vitest/jest case first (RED), minimum implementation to GREEN, refactor, then atomic commit. Mirrors Slice 20.5's per-task discipline.
- **Plan-level: route shape matches Slice 8, not the original brief.** The brief assumed `POST /items/:id/files`. Real route is `POST /files/upload` (multipart body with `itemId` + `columnValueId` fields, returns `{ success, data: { file } }`, 413 on quota/per-file overflow). Plan locks the actual route — no migration.
- **Plan-level: WebSocket echo is a NEW backend addition.** Slice 8 file routes never emitted Socket.io events. Phase D adds `WebSocketService.emitToBoard(item.boardId, 'file:created'|'file:deleted', ...)` to the file route handlers and matching `onFileCreated`/`onFileDeleted` handlers in `useBoard.ts`. Without this, tab B never observes file changes.
- **Plan-level: ConfirmDialog from Slice 20 B1 is reused for delete-file.** No new dialog component. `useToast` from B1 surfaces success/413/MIME errors.
- **Plan-level: commit-per-task, atomic.** Each task = 1 commit. ~9 commits total. Lessons from Slice 20.5: smaller commits = cheaper rollback if the WS-emit half breaks the existing file-route tests.

## Dependency graph

```
Phase A — Shared utility (1 task, sequential)
  A1  uploadWithProgress + api.files.{upload,list,delete} + 5 vitest cases
        │
        ▼
Phase B — FileUploader component (2 tasks, sequential)
  B1  FileUploader idle/hover/uploading/success/error states + 6 vitest cases
  B2  FileUploader quota projection + MIME whitelist + 4 more vitest cases
        │
        ▼
Phase C — Wire into shared board (2 tasks, sequential)
  C1  ColumnEditor case 'files' renders <FileUploader>
  C2  BoardView quota indicator (storageUsed/storageLimit progress bar)
        │
        ▼
Phase D — Backend WS emit + useBoard handlers (2 tasks, sequential)
  D1  backend/src/routes/files.ts emits file:created / file:deleted
  D2  useBoard.ts onFileCreated/onFileDeleted handlers
        │
        ▼
Phase E — E2E + verification (2 tasks, sequential)
  E1  e2e/specs/slice-21/file-upload.spec.ts (3 cases × 3 industries = 9)
  E2  Verification log addendum + SPEC §Slice 21A checkbox tick
```

A → B is mandatory: component cannot import `api.files` until A1 lands.
B → C is mandatory: ColumnEditor cannot mount FileUploader until it exists.
C → D is mandatory order for review clarity (UI lands first, WS echo second). Either order would work technically; chosen order keeps the diff small per commit.
D → E is mandatory: E2E two-tab spec needs WS emit live.

---

## Task list

### Phase A — Shared utility

#### Task A1: `uploadWithProgress` + `api.files.*` typed methods

**Description:** Add an `uploadWithProgress(url, formData, onProgress)` helper to `frontends/_shared/src/utils/api.ts` that wraps `XMLHttpRequest`, exposes `upload.onprogress` as a percentage callback, and resolves with the parsed JSON body on 2xx (rejects with `{ status, message }` on 4xx/5xx). Then add `api.files.upload(file, { itemId, columnValueId }, onProgress)` (multipart/form-data, calls `uploadWithProgress`), `api.files.list({ itemId })`, `api.files.delete(fileId)` (both fetch-based, auth header from current `_tokenKey`).

**RED → GREEN flow:**
1. Write `frontends/_shared/src/__tests__/api.files.test.ts` with 5 cases: (a) `upload` posts multipart with `itemId` + `columnValueId` + `file` fields, (b) `upload` calls `onProgress(percent)` from XHR `upload.onprogress` event, (c) `upload` rejects on 413 with the server's error message, (d) `list({ itemId })` GETs `/files?itemId=N` with auth header, (e) `delete(fileId)` DELETEs `/files/:id`. Use `vi.stubGlobal('XMLHttpRequest', mockXhr)` for the upload path; `fetchMock` for list/delete. RED — methods don't exist.
2. Implement `uploadWithProgress` + `api.files.{upload,list,delete}`. GREEN.
3. Refactor: extract auth-header builder if duplicated.

**Acceptance criteria:**
- [ ] `uploadWithProgress(url, formData, onProgress)` resolves with parsed JSON on 2xx
- [ ] Rejects with `{ status, message }` on non-2xx (413 included)
- [ ] `onProgress` invoked at least once during the mocked XHR `progress` event
- [ ] `api.files.upload` builds `FormData` with exactly 3 fields: `file`, `itemId`, `columnValueId` (the last is omitted when undefined)
- [ ] All three `api.files.*` methods include `Authorization: Bearer <token>` (read via current `_tokenKey`)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run api.files` — 5/5 pass
- [ ] `cd frontends/_shared && npm test -- --run` — 78/78 (73 baseline + 5 new)
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean

**Dependencies:** None (Slice 20.5 merged).

**Files touched (2):**
- `frontends/_shared/src/utils/api.ts` (modify — add `uploadWithProgress` + `api.files` namespace)
- `frontends/_shared/src/__tests__/api.files.test.ts` (new — 5 cases)

**Estimated scope:** S.

---

### ✅ Checkpoint: Phase A complete

- [ ] A1 merged to `main`
- [ ] `@crm/shared`: 78/78 tests pass
- [ ] No regression in Slice 20.5 realtime spec (regression guard)

---

### Phase B — FileUploader component

#### Task B1: FileUploader render-state machine

**Description:** Create `frontends/_shared/src/components/board/FileUploader.tsx` rendering the 5-state machine from §Slice 21A: idle / hovering / uploading / success / error. Drag-drop handler + click-to-pick `<input type="file">`. Calls `api.files.upload` from A1 with the progress callback bound to local React state. Renders the uploaded-files list with download link + delete button. Reuses `ConfirmDialog` from B1 for delete confirmation.

**RED → GREEN flow:**
1. Write `frontends/_shared/src/__tests__/FileUploader.test.tsx` with 6 cases: (a) idle renders drop zone + file list, (b) drag-over toggles `data-state="hovering"`, (c) successful upload transitions idle → uploading → success → idle, (d) progress bar reflects `onProgress` callback values, (e) delete button opens ConfirmDialog, (f) viewer-role (`canEditInline=false`) renders read-only (no drop zone, no delete buttons). Mock `api.files.upload` with `vi.fn()`. RED — component doesn't exist.
2. Implement FileUploader.tsx with `useState<UploadState>` machine + drag handlers + file-list render. GREEN.
3. Refactor: extract `<FileListItem>` sub-component if the list render exceeds ~30 lines.

**Acceptance criteria:**
- [ ] Component exports `FileUploaderProps` matching §Slice 21A spec interface (itemId, columnValueId?, files, workspaceStorage, onUploaded?, onDeleted?)
- [ ] All 5 states render distinct DOM (`data-state` attribute for testability)
- [ ] `useCanEdit().canEditInline === false` hides drop zone and delete buttons
- [ ] Delete affordance opens ConfirmDialog (B1) — no inline confirm
- [ ] Progress bar's `aria-valuenow` reflects current upload percent

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run FileUploader` — 6/6 pass
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean

**Dependencies:** A1.

**Files touched (2):**
- `frontends/_shared/src/components/board/FileUploader.tsx` (new)
- `frontends/_shared/src/__tests__/FileUploader.test.tsx` (new — 6 cases)

**Estimated scope:** M.

#### Task B2: Quota projection + MIME whitelist guard

**Description:** Extend FileUploader with two pre-upload guards: (1) client-side quota projection — block upload if `workspaceStorage.used + file.size > workspaceStorage.limit`, surface toast, no XHR fired; (2) MIME whitelist guard — reject files outside the spec's allowed list (`image/*`, `application/pdf`, `text/csv`, `text/plain`, office docs, zip, json), surface toast, no XHR fired.

**RED → GREEN flow:**
1. Add 4 cases to `FileUploader.test.tsx`: (g) drop a file that pushes total over `storageLimit` → toast + no `api.files.upload` call, (h) drop a `.exe` (MIME `application/x-msdownload`) → toast + no upload, (i) drop a `.pdf` → upload proceeds, (j) server 413 (after client checks pass) surfaces toast with server's error message. RED — guards not yet implemented.
2. Implement `validateFile(file, workspaceStorage)` helper inside FileUploader. GREEN.
3. Refactor: pull MIME whitelist into a shared constant `ALLOWED_MIME_TYPES` exportable for symmetry with the server-side multer config.

**Acceptance criteria:**
- [ ] Quota projection: `storageUsed + file.size > storageLimit` → no XHR, toast emitted
- [ ] MIME guard: file type not in whitelist → no XHR, toast emitted
- [ ] Both guards fire BEFORE `api.files.upload` is called (verified by `expect(api.files.upload).not.toHaveBeenCalled()`)
- [ ] Server 413 (concurrent-race case) still surfaces toast with server's `error.message`
- [ ] `<input type="file" accept="...">` reflects the same whitelist (browser-level filter)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run FileUploader` — 10/10 pass
- [ ] `cd frontends/_shared && npm test -- --run` — 88/88

**Dependencies:** B1.

**Files touched (1):**
- `frontends/_shared/src/components/board/FileUploader.tsx` (modify — add guards + constant)
- `frontends/_shared/src/__tests__/FileUploader.test.tsx` (modify — +4 cases)

**Estimated scope:** S.

---

### ✅ Checkpoint: Phase B complete

- [ ] FileUploader component fully tested (10 vitest cases)
- [ ] `@crm/shared`: 88/88 tests pass
- [ ] Component is unmounted in current builds (not yet wired into ColumnEditor) — no industry runtime impact yet

---

### Phase C — Wire into shared board

#### Task C1: ColumnEditor `case 'files':` renders FileUploader

**Description:** Add the missing `case 'files':` to `frontends/_shared/src/components/board/ColumnEditor.tsx` rendering `<FileUploader>` with the cell's current files (from `column.value`), the item's `id`, the column-value `id`, and the workspace-storage budget (from `useWorkspace()`). Optimistic update on `onUploaded` (append file locally) — WS echo from D2 will reconcile.

**RED → GREEN flow:**
1. Add 1 case to existing `ColumnEditor.test.tsx`: (k) cell with `column.type === 'files'` renders `<FileUploader>` with the right props (itemId, columnValueId, files array). RED — files case falls through.
2. Implement the case. GREEN.

**Acceptance criteria:**
- [ ] `case 'files':` exists and returns `<FileUploader>` with all required props
- [ ] Files cell that previously rendered read-only now renders the upload UI
- [ ] No regression in existing ColumnEditor cases (status/text/etc.)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run ColumnEditor` — all existing + 1 new pass
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean

**Dependencies:** B2.

**Files touched (2):**
- `frontends/_shared/src/components/board/ColumnEditor.tsx` (modify — add case)
- `frontends/_shared/src/__tests__/ColumnEditor.test.tsx` (modify — +1 case)

**Estimated scope:** XS.

#### Task C2: BoardView quota indicator

**Description:** Add a thin progress bar to `BoardView.tsx`'s header showing `workspace.storageUsed / workspace.storageLimit` with color thresholds (green <70%, yellow 70–90%, red >90%). Render only when `storageUsed / storageLimit > 0.5` to avoid header noise on empty workspaces.

**RED → GREEN flow:**
1. Add 2 cases to `BoardView.test.tsx`: (l) workspace at 80% storage → indicator visible, yellow color, (m) workspace at 30% storage → indicator hidden. RED.
2. Implement the indicator. GREEN.

**Acceptance criteria:**
- [ ] Progress bar renders only above 50% utilization
- [ ] Color reflects threshold (data-color attribute for testability: `green` | `yellow` | `red`)
- [ ] Text shows `X MB / Y MB` (rounded to 1 decimal MB)
- [ ] No regression in existing BoardView tests

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run BoardView` — all pass
- [ ] `cd frontends/_shared && npx tsc --noEmit` clean

**Dependencies:** C1.

**Files touched (2):**
- `frontends/_shared/src/components/board/BoardView.tsx` (modify — add indicator)
- `frontends/_shared/src/__tests__/BoardView.test.tsx` (modify — +2 cases)

**Estimated scope:** XS.

---

### ✅ Checkpoint: Phase C complete

- [ ] All 10 industries' `npx tsc --noEmit` still clean (regression guard — shared lib changes propagate)
- [ ] Manual smoke deferred to Phase E E2E

---

### Phase D — Backend WS emit + useBoard handlers

#### Task D1: Backend WS emit on file upload + delete

**Description:** Add `WebSocketService.emitToBoard(item.boardId, 'file:created', { file })` after successful `POST /files/upload` and `WebSocketService.emitToBoard(item.boardId, 'file:deleted', { fileId, itemId })` after successful `DELETE /files/:id` in `backend/src/routes/files.ts`. Lookup `item.boardId` via the existing `Item` model relation.

**RED → GREEN flow:**
1. Add 2 cases to `backend/src/__tests__/routes/files.test.ts`: (n) successful upload triggers `WebSocketService.emitToBoard` with `'file:created'` + the new file payload, (o) successful delete triggers `'file:deleted'` with fileId + itemId. Mock `WebSocketService.emitToBoard` with `jest.spyOn`. RED — emit calls don't exist.
2. Add the emit calls. GREEN.
3. Refactor: ensure emits are inside the success branch, after the DB transaction commits.

**Acceptance criteria:**
- [ ] `file:created` emitted on upload success, scoped to the item's boardId (NOT workspaceId)
- [ ] `file:deleted` emitted on delete success
- [ ] Existing 5xx / 4xx error paths do NOT emit
- [ ] All existing files-route tests still pass
- [ ] Emit happens AFTER quota update + DB commit (not before)

**Verification:**
- [ ] `cd backend && npm test -- --testPathPattern=routes/files` — all pass
- [ ] `cd backend && npm test` — full suite clean

**Dependencies:** C2 (UI side ready before backend WS so the echo has a consumer).

**Files touched (2):**
- `backend/src/routes/files.ts` (modify — add 2 emit calls)
- `backend/src/__tests__/routes/files.test.ts` (modify — +2 cases)

**Estimated scope:** S.

#### Task D2: `useBoard` `onFileCreated` / `onFileDeleted` handlers

**Description:** Extend `frontends/_shared/src/hooks/useBoard.ts` with two new socket-event handlers: `onFileCreated({ file })` appends the file to the matching item's column-value file list; `onFileDeleted({ fileId, itemId })` removes it. Both idempotent (filter by id, no double-apply on echo).

**RED → GREEN flow:**
1. Add 3 cases to `frontends/_shared/src/__tests__/useBoard.test.tsx`: (p) `file:created` echo appends to item's files, (q) `file:deleted` echo removes it, (r) duplicate `file:created` echo is idempotent (same fileId not appended twice). RED — handlers don't exist.
2. Implement handlers + register them with `useWebSocket`'s event router. GREEN.

**Acceptance criteria:**
- [ ] Both events update the relevant item's column-value files list
- [ ] Idempotent: re-applying same `file:created` doesn't duplicate
- [ ] Handlers respect the same workspace/board scoping as existing `item:*` handlers (no cross-board leak)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run useBoard` — all pass
- [ ] `cd frontends/_shared && npm test -- --run` — 91/91 (88 + 3 new)

**Dependencies:** D1 (server must emit before client handler is meaningful, but unit tests mock the socket so order is for ship-clarity not correctness).

**Files touched (2):**
- `frontends/_shared/src/hooks/useBoard.ts` (modify — add 2 handlers)
- `frontends/_shared/src/__tests__/useBoard.test.tsx` (modify — +3 cases)

**Estimated scope:** S.

---

### ✅ Checkpoint: Phase D complete

- [ ] Backend full suite green
- [ ] `@crm/shared`: 91/91 tests pass
- [ ] Manual two-tab smoke: file uploaded in tab A, list in tab B reflects within 2s

---

### Phase E — E2E + verification

#### Task E1: `file-upload.spec.ts` (3 cases × 3 industries)

**Description:** New Playwright spec at `e2e/specs/slice-21/file-upload.spec.ts` parameterized across NovaPay/MedVista/JurisPath (matches Slice 20A E2E coverage matrix). 3 cases per industry: (1) admin uploads via click-to-pick → file appears + reload-persists, (2) viewer sees no drop zone (read-only file list), (3) two-tab echo: admin uploads in tab A, tab B's file list shows new file within 2s.

**RED → GREEN flow:**
1. Write the spec with `expect.poll` for the 2s echo assertion. Mirror `realtime-echo.spec.ts` from Slice 20.5. afterEach cleans up via `api.files.delete`. RED on first run (no Docker stack assumption — typecheck-only gate).
2. Confirm typecheck passes. Manual run on at least NovaPay (gated by Docker stack-up — same constraint as Slice 20A E3).

**Acceptance criteria:**
- [ ] Spec file exists at `e2e/specs/slice-21/file-upload.spec.ts`
- [ ] 3 cases × 3 industries = 9 test entries
- [ ] Two-tab case uses `browser.newContext()` pattern from Slice 20.5
- [ ] `cd e2e && npx tsc --noEmit` clean
- [ ] Manual run on NovaPay (Docker up): all 3 NovaPay cases pass

**Verification:**
- [ ] `cd e2e && npx tsc --noEmit` clean
- [ ] `cd e2e && SLICE_21_INDUSTRIES=novapay npx playwright test specs/slice-21/file-upload --reporter=list` — 3/3 pass when Docker up

**Dependencies:** D2.

**Files touched (1):**
- `e2e/specs/slice-21/file-upload.spec.ts` (new)

**Estimated scope:** M.

#### Task E2: Verification log + SPEC tickbox

**Description:** Append a Slice 21A section to `plans/slice-20-verification.md` (or create `plans/slice-21a-verification.md` if a slice-21 log isn't started yet) documenting: per-task commit SHAs, total LOC delta (~+450 / −20), test-count delta (+15: 5 api.files + 10 FileUploader + 2 BoardView + 1 ColumnEditor + 3 useBoard, minus existing case counts already captured), Phase E manual-run status. Tick SPEC §Slice 21A acceptance criteria.

**Acceptance criteria:**
- [ ] Verification log entry includes all 9 task commit SHAs
- [ ] SPEC §Slice 21A 10 acceptance criteria all ticked with traceability notes
- [ ] All 10 industries: typecheck + build clean

**Files touched (2):**
- `plans/slice-21a-verification.md` (new) OR `plans/slice-20-verification.md` (modify — append §Slice 21A)
- `SPEC.md` (modify — tick §Slice 21A criteria)

**Estimated scope:** XS.

---

### ✅ Checkpoint: Slice 21A complete

- [ ] All 9 tasks merged (1 + 2 + 2 + 2 + 1 + 1)
- [ ] All 10 industries typecheck + build clean
- [ ] @crm/shared 91+/91+ tests pass
- [ ] Backend file-route tests still green
- [ ] SPEC §Slice 21A acceptance fully ticked
- [ ] Ready for `/review` or proceed to Slice 21B/21C in parallel

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| XHR upload progress un-mockable in vitest with default `fetch` mocking | High (blocks B1 RED test) | Vitest `vi.stubGlobal('XMLHttpRequest', mockXhr)` with a manual mock that exposes `upload.onprogress` setter + `dispatchEvent('progress', { loaded, total })`. Documented in test file's setup block. Alternative if blocked: `node-mocks-http` for the upload-test-only fixture. |
| Slice 8 file route returns shape differs from spec assumption | Medium | Phase A1's tests assert against the actual response (`{ success, data: { file } }`) — verified by reading `backend/src/routes/files.ts` before writing the test. |
| WS emit happens before DB commit → tab B sees file that doesn't exist server-side | Medium | D1 explicit acceptance: emit AFTER DB commit. Reviewer must confirm placement inside the success branch. |
| Optimistic-update + WS echo double-applies the same file in the cell | Low | useBoard's existing item handlers are already idempotent on `id`; D2's file handlers follow the same pattern. R3 vitest case (idempotent re-apply) gates this. |
| MIME whitelist drift between client (`ALLOWED_MIME_TYPES`) and server (multer config) | Low | B2's ALLOWED_MIME_TYPES exported from a shared constant; future Slice can import it on the backend if it becomes a sync risk. For now, both lists copy-paste-aligned with a code comment cross-referencing each. |
| 3 industries × 3 E2E cases × Docker dependency = runtime pass deferred | Medium | Same accepted constraint as Slice 20A E3 / 20.5 C1. Typecheck + manual run on NovaPay is the ship gate. |
| Quota indicator render-on-every-keystroke perf regression | Low | BoardView re-renders on `useWorkspace()` change; storageUsed updates only on file upload/delete, not on every keystroke. Verified by C2 test (m): 30% utilization → indicator hidden + no measurable perf delta. |

## Open questions

1. **Should `useWorkspace().storageUsed` refresh after a successful upload?** The spec says "yes" implicitly via the quota indicator updating. `useBoard.onFileCreated` could trigger a workspace re-fetch, OR the server could emit `workspace:storage:updated`. Recommend: **let onFileCreated incrementally update local `storageUsed`** (no extra round-trip; consistent with the WS-echo philosophy). If client/server drift surfaces in production, add a `workspace:storage:updated` event later — additive.
2. **Does the "retry badge" (error state, 30s) survive page reload?** Spec describes it as in-component state. Recommend: **no persistence** — reload clears retry badge. If user reloads they re-drop the file. Documented in B1 test setup.
3. **Should viewer role see the quota indicator?** Spec doesn't gate it. Recommend: **yes, render for all roles** — quota is a workspace-wide read, not a write affordance. C2 test does not check role.
4. **Carry to 21B/21C:** None. This slice is fully self-contained on the file domain. 21B (person picker) and 21C (bulk actions) share zero files with 21A — confirmed by the parent §Slice 21 boundary table.

---

## Parallelization strategy

**Single-threaded — no parallel waves.**

Unlike Slice 20.5 which fanned per-industry work across 3 waves of 4/3/3 agents, Slice 21A's entire surface lives in `@crm/shared` (8 of 9 tasks) plus one backend route file (D1) plus one E2E spec (E1). There is no per-industry fanout — Slice 20.5 already aligned all 10 industries on the shared `BoardView` / `useBoard` / `ColumnEditor`, so a single change to the shared lib propagates everywhere with zero per-industry edits.

Tasks within Phase B (B1 → B2) and Phase D (D1 → D2) are sequential by file overlap (both modify the same FileUploader.tsx and useBoard.ts respectively). Phase A → B → C → D → E is sequential by import-graph dependency. There is no opportunity for safe parallelism without introducing the same git-index race that bit Slice 20B.

**Total slice wall-clock: ~90 min** single-threaded, end to end.

---

## Todo checklist

```
Phase A — Shared utility (sequential)
- [ ] A1: uploadWithProgress + api.files.{upload,list,delete} + 5 vitest cases

Phase B — FileUploader component (sequential)
- [ ] B1: FileUploader render-state machine + 6 vitest cases
- [ ] B2: Quota projection + MIME whitelist + 4 vitest cases

Phase C — Wire into shared board (sequential)
- [ ] C1: ColumnEditor case 'files' + 1 vitest case
- [ ] C2: BoardView quota indicator + 2 vitest cases

Phase D — Backend WS emit + useBoard handlers (sequential)
- [ ] D1: backend/src/routes/files.ts emits file:created / file:deleted + 2 jest cases
- [ ] D2: useBoard.ts onFileCreated / onFileDeleted + 3 vitest cases

Phase E — E2E + verification (sequential)
- [ ] E1: file-upload.spec.ts (3 cases × 3 industries = 9)
- [ ] E2: Verification log + SPEC §Slice 21A tickbox
- [ ] Checkpoint: Slice 21A shipped — ready to review or dispatch 21B/21C in parallel
```

---

**Out of scope (per spec, restated):**
- Multi-file upload (one file per drop) — Slice 22 candidate
- Resumable uploads (10MB cap makes interruption rare) — deferred indefinitely
- File preview UI (inline PDF/image/video render) — Slice 22 candidate
- Drag-drop reordering of files within an item — Slice 22 candidate
- Avatar upload UI for Person assignees (Slice 21B's domain anyway) — Slice 22 candidate

---

**Next step after this plan is approved:** `/build A1 from plans/slice-21a-plan.md` — start with the shared `uploadWithProgress` helper (gates everything else).
