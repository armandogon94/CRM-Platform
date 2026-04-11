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

## Slice 4: Group Management UI
- [ ] Task 4.1: Integration tests for existing group routes (S)
- [ ] Task 4.2: GroupHeader component with inline editing (M)
- [ ] **Checkpoint: Slice 4** — rename, color, collapse, add, delete group

## Slice 5: Drag-and-Drop
- [ ] Task 5.1: DnD for items within/between groups (TableView) (M)
- [ ] Task 5.2: DnD for Kanban cards (M)
- [ ] Task 5.3: DnD for column reorder + group reorder (S)
- [ ] **Checkpoint: Slice 5** — drag items, cards, columns, groups

## Slice 6: Notification Routes + UI
- [ ] Task 6.1: NotificationService + routes (M)
- [ ] Task 6.2: Add Notification type + WS listener (S)
- [ ] Task 6.3: NotificationBell component (M)
- [ ] **Checkpoint: Slice 6 / Phase 3A Complete** — full end-to-end verification

---

**Total: 19 tasks across 6 slices with 6 checkpoints**
**Estimated new test cases: ~77**
**New files: ~24 | Modified files: ~16**
