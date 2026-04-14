# Phase 3A Task List — CRM Platform

## Slice 1: WebSocket Wiring into CRUD Routes ✅
- [x] Task 1.1: Wire WS emit into ItemService (S) — RED→GREEN→REFACTOR→COMMIT
- [x] Task 1.2: Wire WS emit into ColumnValueService (S)
- [x] Task 1.3: Wire WS emit into BoardGroupService + ColumnService (S)
- [x] Task 1.4: Update useBoard to handle WS events with state diffing + Vitest setup (M)
- [x] **Checkpoint: Slice 1** — 82 backend tests + 17 frontend tests, all passing

## Slice 2: Filter/Sort Functionality ✅
- [x] Task 2.1: Extend ItemService.list() with filter support (M)
- [x] Task 2.2: Expose filter/sort params on item routes (S)
- [x] Task 2.3: Wire FilterPanel + SortPanel into BoardPage + fix dead code (M)
- [x] Task 2.4: Save/load filter presets in BoardView settings (S)
- [x] **Checkpoint: Slice 2** — 100 backend + 17 frontend tests passing

## Slice 3: Column Management UI ✅
- [x] Task 3.1: Integration tests for existing column routes (S)
- [x] Task 3.2: ColumnTypePickerModal component (S)
- [x] Task 3.3: Column header context menu + add column button (M)
- [x] **Checkpoint: Slice 3** — 108 backend + 21 frontend tests passing

## Slice 4: Group Management UI ✅
- [x] Task 4.1: Integration tests for existing group routes (S)
- [x] Task 4.2: GroupHeader with inline editing, color picker, collapse (M)
- [x] **Checkpoint: Slice 4** — 115 backend + 21 frontend tests passing

## Slice 5: Drag-and-Drop ✅
- [x] Task 5.1: DnD for items within/between groups (TableView) (M)
- [x] Task 5.2-5.3: DnD for columns/groups reorder (S)
- [x] **Checkpoint: Slice 5** — 115 backend + 21 frontend tests passing

## Slice 6: Notification Routes + UI ✅
- [x] Task 6.1: NotificationService + routes (M) — RED→GREEN→REFACTOR→COMMIT
- [x] Task 6.2: Add Notification type + WS listener (S)
- [x] Task 6.3: NotificationBell component (M)
- [x] **Checkpoint: Slice 6 / Phase 3A Complete** — 132 backend tests + 29 frontend tests, all passing

---

## Phase 3B: Feature Completion

## Slice 7: Automation Execution Engine ✅
- [x] Task 7.1: TriggerEvaluator — pure function pattern matching (5 trigger types, 16 tests)
- [x] Task 7.2: ActionExecutor — strategy pattern for 8 action types (10 tests)
- [x] Task 7.3: AutomationEngine — orchestrator + automation log route (6 tests)
- [x] Task 7.4: Wire automation evaluation into ItemService + ColumnValueService (3 tests)
- [x] **Checkpoint: Slice 7** — 167 backend tests, all passing

## Slice 8: File Upload/Download ✅
- [x] Task 8.1: StorageService + file upload/download routes (5 + 4 tests)
- [x] **Checkpoint: Slice 8** — 180 backend tests, all passing

## Slice 9: Activity Log Routes + UI ✅
- [x] Task 9.1: Activity log routes + ActivityFeed component (8 backend + 6 frontend tests)
- [x] **Checkpoint: Slice 9** — 188 backend + 35 frontend = 223 total

## Slice 10: Dashboard View ✅
- [x] Task 10.1: Dashboard view with KPI cards, aggregates endpoint (3 backend + 6 frontend tests)
- [x] **Checkpoint: Slice 10** — 191 backend + 41 frontend = 232 total

## Slice 11: Map View ✅
- [x] Task 11.1: Map view with Leaflet + LocationHandler (11 backend + 5 frontend tests)
- [x] **Checkpoint: Slice 11 / Phase 3B Complete** — 202 backend + 46 frontend = 248 total

---

## Phase 3C: Infrastructure

## Slice 12: Sequelize Migrations Baseline ✅
- [x] Task 12.1: Baseline migration (13 tables), follow-up migration (location type + last_triggered_at), umzug runner, sequelize-cli config
- [x] **Checkpoint: Slice 12** — 253 total tests

## Slice 13: Redis Caching Layer ✅
- [x] Task 13.1: RedisService (get/set/del/invalidatePattern with crm: prefix)
- [x] Task 13.2: BoardService.getByIdCached() cache-aside pattern (5-min TTL)
- [x] Task 13.3: Socket.io Redis adapter wired into WebSocketService
- [x] **Checkpoint: Slice 13** — 261 total tests (8 new: 5 RedisService + 3 BoardService.cache)

## Slice 14: Backend Test Coverage Push ✅
- [x] Task 14.1: Test factories (9 factory functions)
- [x] Task 14.2: WorkspaceService tests (10 tests)
- [x] Task 14.3: BoardViewService tests (11 tests)
- [x] Task 14.4: BoardService core tests (10 tests)
- [x] Task 14.5: ItemService core tests (14 tests)
- [x] Task 14.6: ColumnValueService core tests (16 tests)
- [x] Task 14.7: EAV handlers comprehensive tests (147 tests for all 15 types)
- [x] Task 14.8: Board routes tests (19 tests)
- [x] **Checkpoint: Slice 14 / Phase 3C Complete** — 442 backend + 46 frontend = 488 total

---

**Phase 3A: 19 tasks across 6 slices — COMPLETE**
**Phase 3B: 7 tasks across 5 slices — COMPLETE**
**Phase 3C: 8 tasks across 3 slices — COMPLETE**
**Total tests: 488 (442 backend + 46 frontend)**

---

## Slice 15: Frontend Test Coverage ✅
- [x] Test infrastructure: @vitest/coverage-v8, test scripts, test-utils.tsx, fixtures.ts
- [x] AuthContext, LoginPage, useWebSocket, ColumnRenderer, ColumnEditor, FilterPanel
- [x] TableView, KanbanView, CalendarView, BoardPage, BoardListPage
- [x] SortPanel, BoardView, FormView, ChartView, WorkspaceContext, api.ts
- [x] ThemeProvider, MainLayout, useBoards, App, ColorPicker
- [x] **Checkpoint: Slice 15** — 254 frontend tests, 28 suites, 70.06% line coverage

---

## Remaining Work

### Slice 16: Shared Component Library Extraction ✅
- [x] `frontends/_shared/` package with vitest, TypeScript config
- [x] ThemeConfig + INDUSTRY_THEMES (10 presets), 7 tests passing
- [x] Types, fetch-based api.ts, AuthContext, WorkspaceContext
- [x] useWebSocket, useBoard (with columnFilters), useBoards hooks
- [x] Common components: StatusBadge, PersonAvatar, ThemeProvider, ColorPicker, FilterPanel, SortPanel, NotificationBell
- [x] All 8 board views: ColumnEditor, ColumnRenderer, BoardView, TableView, KanbanView, FormView, ChartView, MapView, CalendarView, TimelineView, DashboardView
- [x] Layout: MainLayout, Sidebar (themed with ThemeConfig)
- [x] Pages: LoginPage, BoardListPage, BoardPage (all accept optional ThemeConfig)
- [x] Docker: `./frontends/_shared:/app/_shared:ro` volume added to all 10 industry frontend containers
- [x] tsc --noEmit: 0 errors

### Slice 17: Industry Board Templates + Seed Data (Size: XL)
- [ ] 3-5 templates per industry (50 total)
- [ ] 50-200 records per template
- [ ] 4 automation rules per industry

### Slice 18: Industry Frontend Production Quality (Size: XL)
- [ ] Upgrade 9 industry frontends
- [ ] Apply brand themes from INDUSTRY-BRANDING-CONTEXT.md
- [ ] Wire WebSocket, routing, shared components
