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

**Total: 19 tasks across 6 slices with 6 checkpoints**
**Estimated new test cases: ~77**
**New files: ~24 | Modified files: ~16**
