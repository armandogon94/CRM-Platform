# Phase 3A Implementation Plan — Core Platform Stabilization

> Full plan with all task details is in `.claude/plans/squishy-knitting-flask.md`
> This file is a quick-reference summary.

## Architecture Decisions (from decision.md)

- **WebSocket pattern**: emit AFTER transaction.commit(), never inside transaction
- **Filter/Sort**: Server-side via JSONB query operators on column_values table
- **DnD library**: react-beautiful-dnd (already installed at v13.1.1)
- **Notification delivery**: WebSocket push to user room + REST polling fallback
- **Test setup**: Vitest + RTL for frontend (new), Jest for backend (existing)

## Critical Discovery

**BoardPage.tsx has dead code**: imports `BoardView` component but renders an inline `TableView` instead. Task 2.3 fixes this — all views route through `BoardView` after the fix.

## Execution Order

```
Slice 1 (WebSocket) → foundational, enables real-time for all other slices
Slice 2 (Filter/Sort) → high user value, FilterPanel already built
Slice 3 (Column Mgmt) → backend already complete, UI only
Slice 4 (Group Mgmt) → backend already complete, UI only
Slice 5 (DnD) → needs WS from Slice 1 for optimistic reconciliation
Slice 6 (Notifications) → needs WS from Slice 1 for delivery
```

## Skills per Slice

| Slice | Primary Skill | Supporting Skills |
|-------|--------------|-------------------|
| 1: WebSocket | incremental-implementation | test-driven-development, source-driven-development |
| 2: Filter/Sort | incremental-implementation | test-driven-development, api-and-interface-design |
| 3: Column Mgmt | frontend-ui-engineering | test-driven-development |
| 4: Group Mgmt | frontend-ui-engineering | test-driven-development |
| 5: DnD | frontend-ui-engineering | test-driven-development, source-driven-development |
| 6: Notifications | incremental-implementation | test-driven-development, api-and-interface-design, frontend-ui-engineering |

## TDD Rhythm (every task)

1. **RED** — Write failing test describing desired behavior
2. **GREEN** — Implement minimum code to pass
3. **REFACTOR** — Clean up while green
4. **COMMIT** — Atomic commit: `feat:` or `test:` prefix, conventional style

## Verification Checkpoints

After each slice, verify:
- [ ] All existing 66 backend tests still pass
- [ ] New backend tests pass
- [ ] Frontend compiles with 0 TypeScript errors
- [ ] Frontend tests pass (after Slice 1 sets up Vitest)
- [ ] Docker stack starts cleanly
- [ ] Feature works end-to-end in browser
