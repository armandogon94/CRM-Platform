# Implementation Plan: Slice 21B — Person picker UI

**Spec reference:** `SPEC.md` §Slice 21B (lines 1972–2092)
**Parent context:** `SPEC.md` §Slice 21 (lines 1713–1888) — RBAC + WS-echo invariants
**Size:** M
**Estimated tasks:** 4 phases / 8 tasks (1 backend + 2 shared + 1 UI rewrite + 1 E2E + 1 verification)
**Estimated wall-clock:** ~45 min single-threaded

**Predecessor:** Slice 20.5 fully shipped — all 10 industries consume `@crm/shared` (`useBoard`, `BoardView`, `ColumnEditor`, `configureApi`, `configureWebSocket`). Editing the shared `ColumnEditor` propagates to every industry on next build, no per-industry fanout needed.

---

## Overview

Replace the stubbed `case 'person':` branch in shared `ColumnEditor` with a debounced member-search dropdown driven by a brand-new `GET /workspaces/:id/members` endpoint. Backend ships first because the UI consumes it. Single-assign vs multi-assign is driven by `column.config.allow_multiple` — single replaces the cell value on click; multi adds to a chip stack with X-to-remove and "Clear all". 300ms debounce, 1-character minimum, empty input returns the 50 most-recently-active members. The shared change reaches all 10 industries automatically; E2E covers 3 (NovaPay, MedVista, JurisPath) per the existing matrix.

## Architecture decisions

- **ADR 21B-1 (spec): ILIKE on email + firstName + lastName, OR-joined, no fuzzy** — Postgres ILIKE is fast on indexed columns. If member counts ever exceed ~10K, revisit with a trigram GIN index; defer the index migration until explain-plan shows seq scan.
- **ADR 21B-2 (spec): Empty search returns the 50 most-recent members, not "type to search"** — empty is the default state on picker open; showing recent assignees lets users click without typing in small workspaces.
- **Plan-level: backend first, single-thread** — UI consumes the new endpoint; shipping the UI rewrite without the route would break every industry's person column at once. Single-thread (no per-industry fanout) because the shared library is the authoritative consumer post-Slice-20.5.
- **Plan-level: `useDebounce` lives in `_shared/src/hooks`** — same neighborhood as `useWebSocket`, `useBoard`. Avoids a per-industry copy and keeps cancel-on-unmount logic centralized.
- **Plan-level: search response uses a strict allowlist** — `attributes: ['id','email','firstName','lastName','avatar','role']`. Sequelize `attributes` allowlist (not `exclude`) prevents future schema additions from leaking sensitive fields by default.
- **Plan-level: `isActive: true` filter on search** — deactivated users stay assigned (don't break legacy assignments) but aren't returned by search. Spec's "Never search across deactivated" boundary.

## Dependency graph

```
Phase A — Backend (1 task, sequential)
  A1  WorkspaceService.searchMembers + GET /workspaces/:id/members route
        + 5 jest cases (auth, RBAC, empty, ILIKE, allowlist)
        │
        ▼
Phase B — Shared client + hook (2 tasks, sequential)
  B1  api.workspaces.searchMembers typed method + 4 vitest cases
  B2  useDebounce hook + 3 vitest cases (debounce, cancel-on-unmount, last-wins)
        │
        ▼
Phase C — ColumnEditor person rewrite (1 task, sequential)
  C1  Replace stub `case 'person':` with member-search dropdown
        + 5 vitest cases (single-assign, multi-assign chip, fallback avatar,
          escape closes, viewer read-only)
        │
        ▼
Phase D — E2E + verification (2 tasks, sequential)
  D1  person-picker.spec.ts: 3 cases × 3 industries = 9 tests
  D2  Verification log addendum + SPEC §Slice 21B acceptance ticks
```

Phase A → B sequencing is mandatory: shared client and hook target an endpoint that must already exist for integration smoke. Phase B → C: the rewrite imports `api.workspaces.searchMembers` and `useDebounce`. Phase C → D: E2E drives the rewritten UI.

---

## Task list

### Phase A — Backend

#### Task A1: `WorkspaceService.searchMembers` + member-search route

**Description:** Add a new instance method `WorkspaceService.searchMembers(workspaceId, search, limit=50)` that returns `{ members, total }`. Wire `GET /api/v1/workspaces/:workspaceId/members?search=&limit=` to it with `requireAuth` middleware and a manual workspace-scope check (`req.user.workspaceId === parseInt(req.params.workspaceId)` else 403). Empty search returns 50 most-recently-active members ordered by `lastActiveAt DESC NULLS LAST, createdAt DESC`. Non-empty search ILIKEs over email + firstName + lastName, OR-joined. Always filter `isActive: true` and use a strict `attributes` allowlist.

**RED → GREEN flow:**
1. Add 5 cases to `backend/src/__tests__/routes/workspaces.test.ts`: (a) 401 unauthenticated, (b) 403 foreign workspace, (c) 200 + 50 recents on empty `?search=`, (d) 200 + ILIKE-filtered list on `?search=alice`, (e) response payload never contains `passwordHash` / `refreshToken`. RED — route + service don't exist.
2. Implement `WorkspaceService.searchMembers` per the spec snippet. Use `User.findAndCountAll` with the allowlisted `attributes` array.
3. Add the route handler in `backend/src/routes/workspaces.ts`. GREEN.
4. Refactor: extract the `Op.or` clause into a helper if it grows; keep route handler under 30 lines.

**Acceptance criteria:**
- [ ] `GET /workspaces/:id/members` returns 200 with `{ success, data: { members }, pagination }`
- [ ] Empty search returns ≤ 50 members ordered by recency
- [ ] Non-empty search uses `Op.iLike` on email/firstName/lastName, OR-joined
- [ ] `req.user.workspaceId !== :workspaceId` → 403
- [ ] No auth → 401
- [ ] `passwordHash`, `refreshToken` never in response
- [ ] `isActive: false` users excluded from results

**Verification:**
- [ ] `cd backend && npm test -- routes/workspaces` — 5/5 new + existing green
- [ ] `cd backend && npm test` — 511/512 (pre-existing flake unchanged)
- [ ] `cd backend && npx tsc --noEmit` clean

**Dependencies:** None.

**Files touched (3):**
- `backend/src/routes/workspaces.ts` (modify — add member-search route)
- `backend/src/services/WorkspaceService.ts` (modify — add `searchMembers`)
- `backend/src/__tests__/routes/workspaces.test.ts` (modify — 5 new cases)

**Estimated scope:** M.

---

### ✅ Checkpoint: Phase A complete

- [ ] A1 merged to `main`
- [ ] `cd backend && npm test` green
- [ ] Manual curl: `curl -H "Authorization: Bearer <admin-token>" http://localhost:13000/api/v1/workspaces/1/members?search=ali` returns ILIKE-filtered list
- [ ] No `passwordHash` in response (jq verify)

---

### Phase B — Shared client + hook

#### Task B1: `api.workspaces.searchMembers` typed method

**Description:** Add `searchMembers(workspaceId, search?, limit?)` to the `api.workspaces` namespace in `frontends/_shared/src/utils/api.ts`. Returns `Promise<ApiResponse<{ members: User[] }>>`. Builds the querystring with `URLSearchParams` (skips `search` param when empty so the backend hits the recents path). Uses the existing `request<T>` helper for token, base URL, and error envelope handling.

**RED → GREEN flow:**
1. Add 4 cases to `frontends/_shared/src/__tests__/api.workspaces.test.ts` (new file): (a) calls `GET /workspaces/:id/members` with no query when `search` omitted, (b) appends `search=alice` when provided, (c) appends `limit=20` when provided, (d) returns the `success: true, data` envelope unchanged. Mock `fetch`. RED — method doesn't exist.
2. Implement the method. GREEN.

**Acceptance criteria:**
- [ ] `api.workspaces.searchMembers(1)` → `GET /workspaces/1/members`
- [ ] `api.workspaces.searchMembers(1, 'alice')` → `GET /workspaces/1/members?search=alice`
- [ ] `api.workspaces.searchMembers(1, 'a', 20)` → `GET /workspaces/1/members?search=a&limit=20`
- [ ] Token from `configureApi({ tokenKey })` used for `Authorization` header (regression guard for Slice 20.5)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run api.workspaces` — 4/4 pass
- [ ] `cd frontends/_shared && npm test -- --run` — full suite green
- [ ] `npx tsc --noEmit` clean

**Dependencies:** A1 merged.

**Files touched (2):**
- `frontends/_shared/src/utils/api.ts` (modify — add `searchMembers`)
- `frontends/_shared/src/__tests__/api.workspaces.test.ts` (new — 4 cases)

**Estimated scope:** S.

---

#### Task B2: `useDebounce` hook

**Description:** Add a 6-line `useDebounce<T>(value: T, delayMs: number): T` hook to `frontends/_shared/src/hooks/useDebounce.ts`. Internally `useState<T>(value)` + `useEffect` that schedules `setTimeout` and returns a cleanup that `clearTimeout`s. Cancel-on-unmount is the load-bearing detail — without it, a typing-then-navigate-away flow leaks timers and may setState on an unmounted component.

**RED → GREEN flow:**
1. Add 3 cases to `frontends/_shared/src/__tests__/useDebounce.test.tsx` (new): (a) returns initial value synchronously, (b) updates only after `delayMs` of stable input (use `vi.useFakeTimers()` + `act()`), (c) cleanup cancels pending timer when component unmounts (assert no setState after unmount via `console.error` spy or `--restoreMocks`). RED — hook doesn't exist.
2. Implement the hook. GREEN.

**Acceptance criteria:**
- [ ] First render returns the input value with no delay
- [ ] Rapid input changes within `delayMs` produce only one trailing emission
- [ ] Unmounting before timer fires does NOT call `setState` (verified by spy or via React's test environment warning)
- [ ] Hook signature: `useDebounce<T>(value: T, delayMs: number): T`

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run useDebounce` — 3/3 pass
- [ ] No `act(...) was not wrapped` warnings in test output
- [ ] `npx tsc --noEmit` clean

**Dependencies:** None within Phase B (could run parallel to B1, but kept sequential for plan simplicity).

**Files touched (2):**
- `frontends/_shared/src/hooks/useDebounce.ts` (new)
- `frontends/_shared/src/__tests__/useDebounce.test.tsx` (new — 3 cases)

**Estimated scope:** XS.

---

### ✅ Checkpoint: Phase B complete

- [ ] B1 + B2 merged
- [ ] `cd frontends/_shared && npm test -- --run` — full suite green (existing + 7 new)
- [ ] `npx tsc --noEmit` clean
- [ ] No regressions on `useBoard`, `useWebSocket`, `configureApi` tests

---

### Phase C — ColumnEditor person rewrite

#### Task C1: Replace stub `case 'person':` with member-search dropdown

**Description:** Rewrite the stub person branch in `frontends/_shared/src/components/board/ColumnEditor.tsx` per the spec snippet. Render: search `<input>` at the top, scrollable result list below (rows = `<PersonAvatar>` + name + email), chip stack at the bottom for current assignees (multi-assign only). Wire `useDebounce(search, 300)`, `useEffect` → `api.workspaces.searchMembers`, click handler that branches on `column.config?.allow_multiple`. Single-assign click: `onChange(member)` and close. Multi-assign click: `onChange([...current, member])`, capped at 20 with toast on overflow. X on chip removes; "Clear all" link wipes the array. Click outside / Escape closes. Viewer role: render avatars only, no picker (existing role-gate prop `readOnly` already plumbed through ColumnEditor).

**RED → GREEN flow:**
1. Add 5 cases to `frontends/_shared/src/__tests__/ColumnEditor.person.test.tsx` (new): (a) renders 50 recent members on open with empty search, (b) typing `alice` debounces 300ms then re-fetches with `search=alice`, (c) single-assign click calls `onChange(member)` once and closes, (d) multi-assign click adds chip and DOES NOT close; X removes chip, (e) `readOnly=true` (viewer) renders avatars but no input. Mock `api.workspaces.searchMembers`. RED — current `case 'person':` is a stub.
2. Rewrite the branch. Reuse existing `<PersonAvatar>` from `frontends/_shared/src/components/PersonAvatar.tsx`.
3. Refactor: extract `<MemberSearchDropdown>` sub-component if the branch exceeds ~80 LOC; keep close.

**Acceptance criteria:**
- [ ] Picker shows 50 most-recent on open
- [ ] 300ms debounce; cancels in-flight on new keystroke (verified via `useDebounce` semantics — only the last value triggers the effect)
- [ ] Single-assign: click replaces value + closes
- [ ] Multi-assign: click adds chip, max 20, toast on overflow, X removes, "Clear all" wipes
- [ ] `user.avatar === null` falls back to `<PersonAvatar>` initials + hash color
- [ ] Click outside / Escape closes without saving
- [ ] `readOnly` (viewer) renders avatars only, no input or list
- [ ] No `passwordHash` keys ever rendered (regression guard — DOM scrub in test)

**Verification:**
- [ ] `cd frontends/_shared && npm test -- --run ColumnEditor.person` — 5/5 pass
- [ ] `cd frontends/_shared && npm test -- --run` — full suite green
- [ ] `npx tsc --noEmit` clean
- [ ] Manual smoke on NovaPay (Docker up): admin opens any board with person column → picker works for single + multi assign

**Dependencies:** B1 + B2 merged (imports both).

**Files touched (2):**
- `frontends/_shared/src/components/board/ColumnEditor.tsx` (modify — person case rewrite)
- `frontends/_shared/src/__tests__/ColumnEditor.person.test.tsx` (new — 5 cases)

**Estimated scope:** M.

---

### ✅ Checkpoint: Phase C complete

- [ ] C1 merged
- [ ] All 10 industries `npm run build` clean (rebuild after shared change)
- [ ] All 10 industries `npx tsc --noEmit` clean
- [ ] Manual smoke on at least one industry's person column

---

### Phase D — E2E + verification

#### Task D1: `person-picker.spec.ts`

**Description:** Add a Playwright spec at `e2e/specs/slice-21/person-picker.spec.ts` covering 3 cases × 3 industries (NovaPay, MedVista, JurisPath) = 9 tests. Cases: (1) open picker, type a known member's name, click them, assert cell value updated and WS echo to second tab within 2s; (2) multi-assign column, add 2 chips, remove 1 with X, assert final state; (3) viewer role logs in, person cell renders avatar but click does NOT open the picker. Same two-context pattern as Slice 20.5's `realtime-echo.spec.ts`.

**Acceptance criteria:**
- [ ] Spec file exists at `e2e/specs/slice-21/person-picker.spec.ts`
- [ ] 9 test cases (3 × 3) using the existing `selectedIndustries()` matrix
- [ ] WS echo asserted via `expect.poll` 2s timeout
- [ ] Viewer-role test uses an existing viewer fixture or creates one in `beforeAll`
- [ ] `cd e2e && npx tsc --noEmit` clean

**Verification:**
- [ ] Manual: `cd e2e && SLICE_21_INDUSTRIES=novapay npx playwright test specs/slice-21/person-picker --reporter=list` — 3/3 cases pass
- [ ] Slice 20.5 `realtime-echo.spec.ts` still passes (regression guard)

**Dependencies:** Phase C complete (real picker UI to drive).

**Files touched (1):**
- `e2e/specs/slice-21/person-picker.spec.ts` (new)

**Estimated scope:** M.

---

#### Task D2: Verification log addendum + SPEC ticks

**Description:** Append a Slice 21B section to `plans/slice-21-verification.md` (or create the file if absent) and tick all acceptance-criteria checkboxes in `SPEC.md` §Slice 21B. Verification log captures: A1 backend test count, B1+B2 shared test count, C1 ColumnEditor test count, D1 E2E status, total LOC delta.

**Acceptance criteria:**
- [ ] Verification log section appended with phase-by-phase test counts and commit SHAs
- [ ] All 9 acceptance-criteria checkboxes in SPEC §Slice 21B ticked `[x]` with traceability inline notes (commit + test path)

**Files touched (2):**
- `plans/slice-21-verification.md` (modify or new)
- `SPEC.md` (modify — tick §Slice 21B AC checkboxes)

**Estimated scope:** S.

---

### ✅ Checkpoint: Slice 21B complete

- [ ] All 8 tasks across A/B/C/D merged on `main`
- [ ] All Slice 21B SPEC acceptance criteria ticked
- [ ] Backend + shared + e2e suites all green
- [ ] Ready for `/review` then `/ship`

---

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| Cross-workspace member leak via path-param tampering | High (security) | A1 manually checks `req.user.workspaceId === parsed :workspaceId` and 403s. Test (b) in A1 RED-locks this behavior. Spec's "Never" boundary explicit. |
| `passwordHash` / `refreshToken` accidentally serialized in response | High (security) | Strict `attributes: ['id','email','firstName','lastName','avatar','role']` allowlist (not `exclude`). Test (e) in A1 scrubs response keys. C1 DOM scrub provides defense-in-depth. |
| `useDebounce` timer leak on unmount | Medium | B2 test (c) explicitly asserts no setState-after-unmount. Cleanup function returns `clearTimeout` (the load-bearing 1 line). |
| Multi-assign chip stack > 20 silently drops members | Medium | C1 caps at 20 with toast on overflow. Test (d) asserts the cap + toast call. Spec ADR — soft cap, ask before lifting. |
| Deactivated assignees disappear from existing person columns | Medium | `searchMembers` filters `isActive: true` ONLY for search; existing `column_values` rows still resolve via `User.findByPk` in render path (unchanged). Test gap: add D1 acceptance step verifying a previously-assigned deactivated user still renders an avatar (chip persists, just isn't searchable). |
| Shared `ColumnEditor` change ripples to all 10 industries unevenly | Low | Post-Slice-20.5, all 10 industries import the shared component. Single-source. C1 checkpoint runs `npm run build` across all 10 to confirm no industry-local override regression. |
| Backend ILIKE seq-scan on large workspaces | Low (current scale) | ADR 21B-1 defers the trigram index until explain-plan shows seq scan. Email already indexed by auth lookups. Open question carried for monitoring. |

## Open questions

1. **Should the picker show roles (admin/editor/viewer) inline?** Spec snippet returns `role` in the response but the rewrite snippet doesn't render it. Recommend: **render as a small label next to the name** for admin users only; viewers see no role label. Defer to C1 implementation review.
2. **Sort order in the result list when search is non-empty?** Spec orders by `lastActiveAt DESC` for empty; non-empty inherits. ILIKE relevance ranking is overkill. Recommend: **same recency order for both** — keep it simple.
3. **Should `useDebounce` AbortController-cancel the in-flight `fetch`?** Spec talks about cancelling pending requests; `useDebounce` only cancels pending timers. The result is functionally equivalent (the stale fetch still resolves but its `setMembers` call lands before the next debounced one — out-of-order risk on slow networks). Recommend: **add `AbortController` plumbing in C1** as a small extra; defer if it bloats the rewrite.
4. **(Carried)** Trigram GIN index migration timing — see Risk row above. Monitor explain-plan; revisit when any workspace > 5K members.

## Out of scope (per spec)

- Inline-create new member from picker — Slice 22 owns invite flow.
- Search across deactivated users — backend filters them out; existing assignments stay visible.
- Search across workspaces — no global member directory.
- Infinite-scroll pagination — 50-result hard cap; if a workspace has > 50 members, users must type to narrow.

## Parallelization strategy

**Single-threaded.** Reasons:

- Backend (A1) gates the UI (B1 imports `api.workspaces.searchMembers`, which calls A1's route).
- B1 and B2 are independent in principle, but B2 is XS (~5 min) — parallelizing saves nothing meaningful and adds branch-coordination cost.
- C1 imports both B1 and B2 — must wait.
- The shared library is the authoritative consumer post-Slice-20.5: editing `_shared/src/components/board/ColumnEditor.tsx` once propagates to all 10 industries on next `npm run build`. No per-industry fanout, no Wave 1/2/3 dispatch.
- E2E (D1) drives the rewritten UI — must wait for C1.

Total wall-clock: A1 (~15 min) → B1 (~5 min) → B2 (~5 min) → C1 (~12 min) → D1 (~5 min typecheck + manual run) → D2 (~3 min) ≈ 45 min serial.

---

## Todo checklist

```
Phase A — Backend (sequential)
- [ ] A1: WorkspaceService.searchMembers + GET /workspaces/:id/members + 5 jest cases

Phase B — Shared client + hook (sequential)
- [ ] B1: api.workspaces.searchMembers + 4 vitest cases
- [ ] B2: useDebounce hook + 3 vitest cases
- [ ] Checkpoint B: full _shared suite green

Phase C — ColumnEditor person rewrite (sequential)
- [ ] C1: replace stub `case 'person':` + 5 vitest cases
- [ ] Checkpoint C: 10 industries build clean

Phase D — E2E + verification (sequential)
- [ ] D1: person-picker.spec.ts (3 cases × 3 industries = 9 tests)
- [ ] D2: verification log addendum + SPEC §Slice 21B AC ticks
- [ ] Checkpoint: Slice 21B shipped
```

---

**Next step after this plan is approved:** `/build A1 from plans/slice-21b-plan.md` — start with the backend route + service (gates everything else).
