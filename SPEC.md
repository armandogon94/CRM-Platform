# Spec: CRM Platform Phase 3+ (Project 13)

## Objective

Complete the CRM Platform from its current Phase 1+2 state (core API, EAV engine, 6/8 board views) to a production-ready, multi-tenant, real-time work management platform across 10 industry verticals. The platform is a high-fidelity Monday.com clone with runtime-configurable columns (EAV), 8 board views, visual automations, and real-time collaboration.

**Users:** Admin, CEO, Manager, Member, Viewer roles across 10 industry companies (NovaPay, MedVista, TrustGuard, UrbanNest, SwiftRoute, DentaFlow, JurisPath, TableSync, CraneStack, EduPulse).

**Success looks like:** All 18 vertical slices implemented with TDD, Docker-based development, 80%+ test coverage, 10 branded industry frontends sharing a component library, and a working automation engine.

---

## Tech Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| Frontend | React + TypeScript + Vite + Tailwind | 18.2 / 5.3 / 5.0 / 3.4 |
| Backend | Node.js + Express + Sequelize | 20 / 4.21 / 6.37 |
| Database | PostgreSQL | 15 |
| Cache/Queue | Redis + BullMQ | 7 / 5.x |
| Real-Time | Socket.io | 4.8 |
| Auth | JWT (HS256) | 9.0 |
| Maps | Leaflet + react-leaflet | 1.9 / 4.2 |
| DnD | react-beautiful-dnd | 13.1 |
| Charts | Recharts | 2.10 |
| Testing | Jest + Vitest + RTL + MSW + Playwright | latest |
| Container | Docker Compose | v2 |

---

## Commands

```bash
# Development
docker-compose up -d                     # Start full stack (postgres, redis, backend, 10 frontends)
docker-compose up -d postgres redis      # Start DB + cache only (for backend-only dev)
docker-compose exec backend npm run dev  # Backend dev server with hot reload (port 13000)
docker-compose logs -f backend           # Tail backend logs

# Testing
docker-compose exec backend npm test                    # Backend unit + integration tests
docker-compose exec backend npm test -- --coverage      # With coverage report
cd frontend && npx vitest                               # Frontend tests
cd frontend && npx vitest --coverage                    # Frontend coverage
npx playwright test                                     # E2E tests (full stack must be running)

# Database
docker-compose exec backend npx sequelize db:migrate    # Run migrations
docker-compose exec backend npm run seed                # Seed all industries
docker-compose exec backend npm run seed:novapay        # Seed single industry

# Build
cd backend && npm run build              # Compile TypeScript
cd frontend && npm run build             # Vite production build

# Quality
cd backend && npx tsc --noEmit           # Type check backend
cd frontend && npx tsc --noEmit          # Type check frontend
```

---

## Project Structure

```
13-CRM-Platform/
├── SPEC.md                              # This file
├── decision.md                          # 10 autonomous design decisions
├── CLAUDE.md                            # Project instructions
├── PORTS.md                             # Port allocation reference
├── docker-compose.yml                   # Full stack (13 services)
├── docker-compose.test.yml              # Test environment (NEW)
├── backend/
│   ├── src/
│   │   ├── server.ts                    # Entry point + WebSocket init
│   │   ├── app.ts                       # Express app config
│   │   ├── config/
│   │   │   ├── index.ts                 # App config from env
│   │   │   ├── database.ts              # Sequelize connection
│   │   │   └── multer.ts               # File upload config (NEW)
│   │   ├── models/                      # 14 Sequelize models
│   │   ├── services/
│   │   │   ├── AuthService.ts
│   │   │   ├── WorkspaceService.ts
│   │   │   ├── BoardService.ts
│   │   │   ├── BoardGroupService.ts
│   │   │   ├── ColumnService.ts
│   │   │   ├── ItemService.ts
│   │   │   ├── ColumnValueService.ts
│   │   │   ├── BoardViewService.ts
│   │   │   ├── WebSocketService.ts
│   │   │   ├── NotificationService.ts   # NEW (Slice 6)
│   │   │   ├── RedisService.ts          # NEW (Slice 13)
│   │   │   ├── StorageService.ts        # NEW (Slice 8)
│   │   │   ├── AutomationEngine.ts      # NEW (Slice 7)
│   │   │   ├── TriggerEvaluator.ts      # NEW (Slice 7)
│   │   │   └── ActionExecutor.ts        # NEW (Slice 7)
│   │   ├── routes/
│   │   │   ├── index.ts                 # Main router
│   │   │   ├── auth.ts
│   │   │   ├── workspaces.ts
│   │   │   ├── boards.ts
│   │   │   ├── boardGroups.ts
│   │   │   ├── columns.ts
│   │   │   ├── items.ts
│   │   │   ├── columnValues.ts
│   │   │   ├── boardViews.ts
│   │   │   ├── automations.ts
│   │   │   ├── notifications.ts         # NEW (Slice 6)
│   │   │   ├── files.ts                 # NEW (Slice 8)
│   │   │   └── activityLogs.ts          # NEW (Slice 9)
│   │   ├── eav/
│   │   │   ├── ColumnTypeHandler.ts     # Abstract base
│   │   │   ├── index.ts                 # Handler registry
│   │   │   └── handlers/               # 15 handlers + LocationHandler (NEW)
│   │   ├── middleware/
│   │   ├── migrations/                  # NEW (Slice 12)
│   │   ├── seeds/                       # 10 industry seed dirs
│   │   ├── types/
│   │   ├── utils/
│   │   └── __tests__/
│   │       ├── middleware/
│   │       ├── routes/
│   │       ├── services/
│   │       ├── eav/                     # NEW
│   │       └── factories/              # NEW - test data factories
│   ├── Dockerfile
│   ├── package.json
│   └── tsconfig.json
├── frontend/                            # Core React app (port 13001)
│   ├── src/
│   │   ├── main.tsx
│   │   ├── App.tsx
│   │   ├── components/
│   │   │   ├── board/
│   │   │   │   ├── BoardView.tsx        # View router
│   │   │   │   ├── TableView.tsx        # MODIFY (filter, DnD, column/group mgmt)
│   │   │   │   ├── KanbanView.tsx
│   │   │   │   ├── CalendarView.tsx
│   │   │   │   ├── TimelineView.tsx
│   │   │   │   ├── ChartView.tsx
│   │   │   │   ├── FormView.tsx
│   │   │   │   ├── DashboardView.tsx    # NEW (Slice 10)
│   │   │   │   ├── MapView.tsx          # NEW (Slice 11)
│   │   │   │   ├── ColumnManagement.tsx # NEW (Slice 3)
│   │   │   │   ├── GroupHeader.tsx      # NEW (Slice 4)
│   │   │   │   ├── ActivityFeed.tsx     # NEW (Slice 9)
│   │   │   │   ├── ColumnRenderer.tsx
│   │   │   │   └── ColumnEditor.tsx
│   │   │   ├── layout/
│   │   │   │   ├── MainLayout.tsx
│   │   │   │   └── Sidebar.tsx
│   │   │   └── common/
│   │   │       ├── NotificationBell.tsx # NEW (Slice 6)
│   │   │       ├── FilterPanel.tsx      # MODIFY (Slice 2)
│   │   │       ├── SortPanel.tsx        # MODIFY (Slice 2)
│   │   │       └── ...existing
│   │   ├── context/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── types/
│   │   ├── utils/
│   │   └── __tests__/                   # NEW
│   └── package.json
├── frontends/
│   ├── _shared/                         # NEW (Slice 16) — shared component library
│   ├── novapay/
│   ├── medvista/
│   ├── trustguard/
│   ├── urbannest/
│   ├── swiftroute/
│   ├── dentaflow/
│   ├── jurispath/
│   ├── tablesync/
│   ├── cranestack/
│   └── edupulse/
└── plans/                               # Architecture documents
```

---

## Code Style

TypeScript strict mode throughout. Naming conventions:

```typescript
// Backend service method pattern (existing — follow this)
class ItemService {
  async list(boardId: number, options: ListOptions): Promise<PaginatedResult<Item>> {
    const { page = 1, limit = 50, search, filters, sortBy, sortOrder } = options;
    // ... query with Sequelize
  }

  async create(data: CreateItemDTO): Promise<Item> {
    const transaction = await sequelize.transaction();
    try {
      const item = await Item.create(data, { transaction });
      await transaction.commit();
      // WebSocket broadcast AFTER commit (Slice 1 pattern)
      wsService.emitToBoard(item.boardId, 'item:created', item);
      return item;
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// Frontend component pattern (existing — follow this)
const TableView: React.FC<TableViewProps> = ({ board, items, onItemUpdate }) => {
  // hooks at top
  const { refreshItems } = useBoard(board.id);
  
  // handlers
  const handleCellEdit = async (itemId: number, columnId: number, value: any) => {
    await api.put(`/boards/${board.id}/items/${itemId}/values/${columnId}`, { value });
    refreshItems();
  };

  return (
    <div className="overflow-x-auto">
      {/* Tailwind utility classes, no CSS modules */}
    </div>
  );
};
```

**Conventions:**
- Backend: `PascalCase` for classes/types, `camelCase` for functions/variables, `UPPER_SNAKE_CASE` for constants
- Frontend: `PascalCase` for components, `camelCase` for hooks/functions, `kebab-case` for CSS classes
- Database: `snake_case` tables and columns, plural nouns, `_id` suffix for FKs, `_at` for timestamps
- Files: Backend services `PascalCase.ts`, routes `camelCase.ts`, frontend components `PascalCase.tsx`
- Imports: Absolute imports preferred, no barrel files (direct imports to specific files)

---

## Testing Strategy

**Framework:** Tiered pyramid (see decision.md #10 for full rationale)

| Level | Tool | Runs Against | Target |
|-------|------|-------------|--------|
| Unit | Jest + ts-jest | Mocked Sequelize | EAV handlers, middleware, utils, automation evaluators |
| Integration | Jest + Supertest | Real Postgres (Docker) | Route-level CRUD, auth, WebSocket, automation execution |
| Frontend | Vitest + RTL + MSW | Mock API | Component rendering, interactions, board views, hooks |
| E2E | Playwright | Full Docker stack | 5-10 critical user journeys |

**Coverage target:** 80%+ on backend services and routes, 70%+ on frontend components.

**Test file locations:**
- Backend: `backend/src/__tests__/{category}/{TestName}.test.ts`
- Frontend: Co-located `ComponentName.test.tsx` alongside component files
- E2E: `e2e/{journey-name}.spec.ts`

**TDD cycle for every slice:**
1. RED — Write failing test that describes desired behavior
2. GREEN — Write minimum code to pass
3. REFACTOR — Clean up while keeping tests green
4. COMMIT — Atomic commit with `test:` or `feat:` prefix

---

## Boundaries

### Always Do
- Run `npm test` before every commit
- Follow the existing TypeScript strict mode configuration
- Validate inputs at API boundaries (route level)
- Use transactions for multi-table mutations
- Broadcast WebSocket events after transaction commits (not before)
- Soft-delete (set `deleted_at`) instead of hard-delete
- Filter by `workspaceId` in every query (multi-tenant isolation)
- Write the failing test first (TDD)

### Ask First
- Adding new npm dependencies beyond those specified in this spec
- Changing the Docker Compose service topology
- Modifying the port allocation (13xxx range)
- Altering the JWT authentication strategy
- Changing Sequelize model relationships

### Never Do
- Commit `.env` files or secrets
- Use `sequelize.sync()` in production or test (use migrations)
- Skip tests to "save time"
- Hard-delete data (always soft-delete)
- Execute automation actions inside the HTTP request cycle (always enqueue)
- Add `Co-Authored-By` to commits

---

## What Exists (Phases 1+2)

### Backend — Complete
- Express server on port 13000 with middleware stack (helmet, cors, compression, rate-limit, morgan)
- 14 Sequelize models with associations, soft deletes, JSONB fields
- JWT auth (register, login, refresh, logout, me) with bcrypt (12 rounds)
- RBAC middleware (admin, member, viewer)
- Full CRUD for: workspaces, boards, board groups, columns, items, column values, board views, automations
- 15 EAV column type handlers (Status through Rating) with validate/serialize/deserialize/format/aggregate/search/compare
- WebSocketService class with emitToBoard/emitToWorkspace/emitToUser/isUserOnline (initialized, NOT wired to routes)
- Docker Compose with postgres:15, redis:7, backend, 10 frontend containers
- 6 test suites, 66 passing tests (auth service, auth middleware, RBAC, error handler, auth routes, response utils)
- 10 industry seed directories (exist, need expansion)
- Multer installed (not configured)

### Frontend — Mostly Complete
- React 18 + Vite + Tailwind + TypeScript strict
- Auth context (login/register/logout, token persistence in localStorage)
- Workspace context (auto-fetch workspace + boards)
- useWebSocket hook (listens for item:created/updated/deleted, column_value:changed)
- useBoard hook (fetches board + items with pagination)
- 6 working board views: Table, Kanban, Calendar, Timeline, Chart, Form
- 2 placeholder views: Dashboard ("coming soon"), Map ("coming soon")
- 15 column types in ColumnRenderer + ColumnEditor
- Sidebar with board list, user menu, collapse toggle
- Filter/Sort panel UI (buttons exist, logic not wired)
- react-beautiful-dnd installed (not used)
- recharts working in ChartView
- 0 frontend tests

### Industry Frontends — Minimal Prototypes
- 9 directories in frontends/ (medvista, cranestack, dentaflow, edupulse, jurispath, novapay, swiftroute, tablesync, trustguard)
- Each has basic App.tsx with useState for view switching (no React Router)
- No WebSocket, no charts, no DnD, no routing
- Demo/prototype stage only

---

## What Needs to Be Built — 18 Vertical Slices

### Phase 3A: Core Platform Stabilization

#### Slice 1: WebSocket Wiring into CRUD Routes (Size: M)

**Objective:** Make real-time collaboration work. When user A creates/updates/deletes an item, user B sees it instantly.

**DB changes:** None

**API changes:**
- After `ItemService.create/update/delete` commits → `wsService.emitToBoard(boardId, 'item:created|updated|deleted', data)`
- After `ColumnValueService.upsert/delete` commits → `wsService.emitToBoard(boardId, 'column_value:changed', data)`
- After `BoardGroupService.create/update/delete` commits → `wsService.emitToBoard(boardId, 'group:created|updated|deleted', data)`
- After `ColumnService.create/update/delete` commits → `wsService.emitToBoard(boardId, 'column:created|updated|deleted', data)`

**UI changes:**
- `useBoard` hook: update local items/groups/columns state when WS events arrive (the callbacks are already defined in useWebSocket, just need to wire them to state updates)

**Tests:**
- Integration: Create item via API → assert Socket.io client receives `item:created` event with correct payload
- Integration: Update column value via API → assert `column_value:changed` event received
- Frontend: Mock WS event → assert useBoard state updates

**Files to modify:**
- `backend/src/services/ItemService.ts`
- `backend/src/services/ColumnValueService.ts`
- `backend/src/services/BoardGroupService.ts`
- `backend/src/services/ColumnService.ts`
- `frontend/src/hooks/useBoard.ts`

---

#### Slice 2: Filter/Sort Functionality (Size: M)

**Objective:** Make the existing Filter/Sort panel UI functional. Users can filter items by column values and sort by any column.

**DB changes:** None (uses existing `BoardView.settings` JSONB for saved filters)

**API changes:**
- Extend `ItemService.list()` to accept `filters` param: `filters=[{"columnId":5,"operator":"equals","value":"Done"}]`
- Supported operators: `equals`, `not_equals`, `contains`, `not_contains`, `gt`, `lt`, `gte`, `lte`, `is_empty`, `is_not_empty`, `between`
- Build dynamic WHERE clauses using Sequelize JSONB operators against `column_values.value`
- Extend `BoardViewService.update()` to save filter presets in `settings.savedFilters[]`

**UI changes:**
- `FilterPanel`: Column selector dropdown, operator picker, value input (type-aware — date picker for date columns, dropdown for status columns, etc.)
- `SortPanel`: Column selector, direction toggle (asc/desc)
- Board toolbar: Active filter count badge, "Clear all" button
- URL sync: Filter state serialized to URL query params for shareable links

**Tests:**
- Integration: Create items with various statuses → filter by status "Done" → assert only matching items returned
- Integration: Create items with numbers → filter by `gt:100` → assert correct subset
- Integration: Sort by date column → assert correct order
- Frontend: Render FilterPanel → select column → select operator → enter value → assert API called with correct params

**Files to modify:**
- `backend/src/services/ItemService.ts`
- `frontend/src/components/common/FilterPanel.tsx`
- `frontend/src/components/common/SortPanel.tsx`
- `frontend/src/hooks/useBoard.ts`
- `frontend/src/pages/BoardPage.tsx`

---

#### Slice 3: Column Management UI (Size: S)

**Objective:** Users can add, rename, delete, and configure columns from the board UI.

**DB changes:** None (column CRUD routes already exist)

**API changes:** None (verify existing column routes work correctly with integration tests)

**UI changes:**
- "+" button in table header row to add new column
- Column type picker modal (15 types with icons and descriptions)
- Column header context menu: Rename, Configure (opens type-specific settings), Delete
- Type-specific config forms (e.g., Status: manage label/color options; Number: set decimal precision, prefix/suffix; Dropdown: manage options list)

**Tests:**
- Integration: Verify column CRUD routes return correct responses
- Frontend: Render table → click "+" → select type → assert API call to create column
- Frontend: Right-click column header → click "Rename" → type new name → assert API call
- Frontend: Right-click column header → click "Delete" → confirm → assert API call

**Files to create:**
- `frontend/src/components/board/ColumnManagement.tsx`
- `frontend/src/components/board/ColumnTypePickerModal.tsx`
- `frontend/src/components/board/ColumnConfigModal.tsx`

**Files to modify:**
- `frontend/src/components/board/TableView.tsx`

---

#### Slice 4: Group Management UI (Size: S)

**Objective:** Users can create, rename, delete, recolor, collapse, and reorder groups.

**DB changes:** None (group CRUD routes already exist)

**API changes:** None (verify existing group routes work correctly)

**UI changes:**
- Enhanced group header: color indicator, name (click to rename inline), collapse chevron, context menu
- Context menu: Change Color (color picker), Rename, Delete (with confirmation — moves items to another group)
- "Add Group" button at bottom of board
- Collapse/expand animation

**Tests:**
- Integration: Verify group CRUD routes
- Frontend: Click group name → edit inline → blur → assert API call
- Frontend: Click "Add Group" → enter name → assert new group appears

**Files to create:**
- `frontend/src/components/board/GroupHeader.tsx`
- `frontend/src/components/board/ColorPicker.tsx`

**Files to modify:**
- `frontend/src/components/board/TableView.tsx`
- `frontend/src/components/board/KanbanView.tsx`

---

#### Slice 5: Drag-and-Drop (Size: L)

**Objective:** Enable drag-and-drop for items (within/between groups), group reorder, and column reorder in Table and Kanban views.

**DB changes:** None (position fields already exist on items, groups, columns)

**API changes:**
- Verify `PUT /items/:id` supports `position` and `groupId` updates
- Verify `PUT /columns/:id/reorder` works
- Add `PUT /groups/:id/reorder` if missing

**UI changes:**
- Table view: `DragDropContext` wrapping the board, items as `Draggable`, groups as `Droppable`
- Kanban view: Lanes as `Droppable`, cards as `Draggable`
- Column headers: `Draggable` for reorder
- Optimistic UI: Move item in local state immediately, reconcile on API response
- Visual feedback: Drop placeholder, drag handle icon, highlight drop target

**Tests:**
- Integration: PUT item with new position → assert item moved
- Integration: PUT item with new groupId → assert item moved to different group
- Frontend: Simulate drag event → assert local state updated → assert API called

**Files to modify:**
- `frontend/src/components/board/TableView.tsx` (major changes)
- `frontend/src/components/board/KanbanView.tsx` (major changes)
- `backend/src/services/ItemService.ts` (verify reorder logic)
- `backend/src/services/BoardGroupService.ts` (add reorder if missing)

---

#### Slice 6: Notification Routes + UI (Size: M)

**Objective:** Users receive and view notifications. Automations and system events create notifications.

**DB changes:** None (Notification model already exists)

**API changes:**
- `GET /api/v1/notifications` — paginated, for current user, supports `?unreadOnly=true`
- `PUT /api/v1/notifications/:id/read` — mark single as read
- `PUT /api/v1/notifications/read-all` — mark all as read
- `GET /api/v1/notifications/unread-count` — returns `{ count: number }`

**UI changes:**
- Notification bell icon in top bar (MainLayout header)
- Unread count badge (red circle with number)
- Dropdown panel showing recent notifications (title, message, timestamp, read/unread indicator)
- Click notification → mark as read + navigate to `linkUrl` if present
- "Mark all as read" button
- WebSocket: listen for `notification:created` event → push to local notification state + increment badge

**Tests:**
- Integration: Create notification → GET list → assert it appears
- Integration: Mark as read → GET list → assert isRead is true
- Integration: Unread count endpoint → assert correct count
- Frontend: Render NotificationBell → mock WS event → assert badge increments
- Frontend: Click notification → assert mark-as-read API called

**Files to create:**
- `backend/src/services/NotificationService.ts`
- `backend/src/routes/notifications.ts`
- `frontend/src/components/common/NotificationBell.tsx`
- `frontend/src/components/common/NotificationPanel.tsx`

**Files to modify:**
- `backend/src/routes/index.ts` (register new routes)
- `frontend/src/components/layout/MainLayout.tsx` (add bell to header)

---

### Phase 3B: Advanced Features

#### Slice 7: Automation Execution Engine (Size: XL)

**Objective:** Build the engine that evaluates triggers and executes actions when data changes.

**DB changes:**
- Add `last_triggered_at` column to `automations` table (via migration)

**API changes:**
- Extend `POST /api/v1/automations/:id/trigger` to actually execute the automation (currently a stub)
- Add `GET /api/v1/automations/:id/logs` — paginated automation execution logs

**New backend services:**
- `AutomationEngine.ts` — BullMQ worker that processes automation jobs
  - Initializes BullMQ queue `automation-jobs` using existing Redis
  - `evaluate(triggerType, context)` — queries active automations for the board, runs TriggerEvaluator
  - Worker processes jobs: runs ActionExecutor, creates AutomationLog
- `TriggerEvaluator.ts` — pure function pattern matching
  - `matches(triggerConfig, eventContext): boolean`
  - Supports: `on_item_created` (match boardId), `on_item_updated` (match specific fields), `on_status_changed` (match old→new status), `on_date_reached` (compare date columns), `on_recurring` (cron expression)
- `ActionExecutor.ts` — strategy pattern
  - `execute(actionType, actionConfig, context): Promise<ActionResult>`
  - Action types: `send_notification` (create Notification record), `set_column_value` (update cell), `create_activity` (log entry), `update_status` (change status column), `send_email` (placeholder/log in dev), `send_slack_message` (placeholder/log in dev), `create_subitem` (create linked item), `increment_number` (increment number column)

**Integration points:**
- `ItemService.create()` → after commit → `automationEngine.evaluate('on_item_created', { boardId, item })`
- `ItemService.update()` → after commit → `automationEngine.evaluate('on_item_updated', { boardId, item, changes })`
- `ColumnValueService.upsert()` → if status column → `automationEngine.evaluate('on_status_changed', { boardId, itemId, columnId, oldValue, newValue })`

**UI changes:**
- Automation list on board settings: show name, trigger, action, active/inactive toggle, last triggered time
- Execution log viewer: show recent AutomationLog entries with status (success/failure/skipped)

**Tests:**
- Unit: TriggerEvaluator with various trigger configs and event contexts
- Unit: Each ActionExecutor strategy (set_column_value, send_notification, etc.)
- Integration: Create automation → create item → assert AutomationLog created with success
- Integration: Create automation with condition → create non-matching item → assert AutomationLog with skipped

**New dependencies:** `bullmq@^5.0.0`

**Files to create:**
- `backend/src/services/AutomationEngine.ts`
- `backend/src/services/TriggerEvaluator.ts`
- `backend/src/services/ActionExecutor.ts`

**Files to modify:**
- `backend/src/services/ItemService.ts`
- `backend/src/services/ColumnValueService.ts`
- `backend/src/routes/automations.ts`
- `backend/src/server.ts` (initialize BullMQ worker)

---

#### Slice 8: File Upload Routes (Size: M)

**Objective:** Upload, download, and delete files attached to items or column values.

**DB changes:** None (FileAttachment model already exists)

**API changes:**
- `POST /api/v1/files/upload` — multipart form upload, creates FileAttachment record
  - Body: `file` (binary), `workspaceId`, `itemId?`, `columnValueId?`
  - Validates: MIME type whitelist, 10MB size limit, workspace storage quota (500MB)
  - Returns: FileAttachment object with download URL
- `GET /api/v1/files/:id/download` — stream file with auth + workspace membership check
- `DELETE /api/v1/files/:id` — soft delete file record + remove from disk
- `GET /api/v1/files?itemId=X` — list files for an item

**New backend service:**
- `StorageService.ts` — interface with `LocalStorageService` implementation
  - `save(file, workspaceId): Promise<{ filePath, fileSize }>`
  - `stream(filePath): ReadStream`
  - `delete(filePath): Promise<void>`
  - `getWorkspaceUsage(workspaceId): Promise<number>` — sum of fileSize for workspace

**Multer config:**
- Destination: `./uploads/{workspaceId}/{yyyy}/{mm}/`
- Filename: `{uuid}.{ext}`
- Limits: 10MB per file
- MIME whitelist: `image/*`, `application/pdf`, `application/msword`, `application/vnd.openxmlformats*`, `text/plain`, `text/csv`, `application/zip`

**UI changes:**
- ColumnEditor for `files` type: File picker button, upload progress indicator, file list with name + size + delete
- ColumnRenderer for `files` type: File icons with name, click to download

**Tests:**
- Integration: Upload file → assert FileAttachment created, file exists on disk
- Integration: Download file → assert correct content returned
- Integration: Upload exceeding 10MB → assert 413 error
- Integration: Upload to workspace at quota → assert 413 error
- Frontend: Mock file input → assert upload API called → assert file appears in list

**Files to create:**
- `backend/src/services/StorageService.ts`
- `backend/src/routes/files.ts`
- `backend/src/config/multer.ts`

**Files to modify:**
- `backend/src/routes/index.ts`
- `frontend/src/components/board/ColumnEditor.tsx` (files type)
- `frontend/src/components/board/ColumnRenderer.tsx` (files type)

---

#### Slice 9: Activity Log Routes + UI (Size: S)

**Objective:** Users can view a timeline of all changes made to a board.

**DB changes:** None (ActivityLog model exists, services already create log entries)

**API changes:**
- `GET /api/v1/workspaces/:wid/activity` — paginated, filterable by `entityType`, `action`, `userId`, `dateRange`
- `GET /api/v1/boards/:bid/activity` — activity for a specific board (all entities within it)

**UI changes:**
- `ActivityFeed` component: Timeline view showing "User X created item Y", "User X changed status to Done", etc.
- Slide-out panel from board page (triggered by Activity icon in toolbar)
- Entries show: user avatar, action description, timestamp (relative — "2 hours ago"), entity link

**Tests:**
- Integration: Perform CRUD operations → query activity log → assert entries exist with correct data
- Frontend: Render ActivityFeed with mock data → assert entries rendered correctly

**Files to create:**
- `backend/src/routes/activityLogs.ts`
- `frontend/src/components/board/ActivityFeed.tsx`

**Files to modify:**
- `backend/src/routes/index.ts`
- `frontend/src/pages/BoardPage.tsx` (add activity panel toggle)

---

#### Slice 10: Dashboard View (Size: L)

**Objective:** Replace the "coming soon" Dashboard placeholder with a configurable widget grid.

**DB changes:** None (uses existing `BoardView.layoutJson` JSONB)

**API changes:**
- `GET /api/v1/boards/:bid/aggregates` — returns aggregated data for KPI widgets
  - Response: `{ statusCounts: { [label]: count }, totalItems, itemsByGroup: {...} }`
  - Uses EAV handler `getAggregates()` methods

**UI changes:**
- `DashboardView` component with CSS Grid layout
- 4 widget types:
  1. **KPICard** — shows count by status (e.g., "12 Working On It") with colored indicator
  2. **ChartWidget** — wraps existing ChartView with column selector
  3. **ActivityWidget** — wraps ActivityFeed component (from Slice 9)
  4. **SummaryTable** — top N items by chosen column
- Widget management: "Add Widget" button, widget type picker, remove widget (X button)
- Layout stored in `BoardView.layoutJson` as `[{ type, config, gridArea }]`
- Default layout: 2 KPI cards + 1 chart + 1 activity feed

**Tests:**
- Integration: Aggregates endpoint returns correct counts
- Frontend: Render DashboardView with mock board → assert KPI cards show correct numbers
- Frontend: Add widget → assert layoutJson updated via API

**Dependencies:** Slice 9 (ActivityFeed component)

**Files to create:**
- `frontend/src/components/board/DashboardView.tsx`
- `frontend/src/components/board/widgets/KPICard.tsx`
- `frontend/src/components/board/widgets/ChartWidget.tsx`
- `frontend/src/components/board/widgets/ActivityWidget.tsx`
- `frontend/src/components/board/widgets/SummaryTable.tsx`

**Files to modify:**
- `frontend/src/components/board/BoardView.tsx` (replace placeholder)
- `backend/src/routes/boards.ts` (add aggregates endpoint)
- `backend/src/services/BoardService.ts` (add getAggregates method)

---

#### Slice 11: Map View (Size: L)

**Objective:** Replace the "coming soon" Map placeholder with a Leaflet map showing items with location data.

**DB changes:**
- Add `location` to column type ENUM (via migration)

**API changes:** None (uses existing column value CRUD — location is just another EAV type)

**New EAV handler:**
- `LocationHandler.ts` — validates `{ address: string, lat: number, lng: number }`, formats as address string, search by address text

**UI changes:**
- `MapView` component with react-leaflet
  - OpenStreetMap tiles (free, no API key)
  - Pins placed at `(lat, lng)` from location column values
  - Pin popup shows item name + key column values
  - Click pin → navigate to item in table view
  - If no location column on board → show "Add a Location column to use Map view" prompt
- `ColumnEditor` for location type: address text input + lat/lng fields (or geocode button)
- `ColumnRenderer` for location type: address text with map pin icon

**Tests:**
- Unit: LocationHandler validate/serialize/deserialize
- Frontend: Render MapView with mock items containing location data → assert pins rendered
- Frontend: Render MapView with no location column → assert setup prompt shown

**New dependencies:** `leaflet@^1.9.0`, `react-leaflet@^4.2.0`, `@types/leaflet@^1.9.0`

**Files to create:**
- `backend/src/eav/handlers/LocationHandler.ts`
- `frontend/src/components/board/MapView.tsx`

**Files to modify:**
- `backend/src/eav/index.ts` (register LocationHandler)
- `frontend/src/components/board/BoardView.tsx` (replace placeholder)
- `frontend/src/components/board/ColumnEditor.tsx` (add location type)
- `frontend/src/components/board/ColumnRenderer.tsx` (add location type)

---

### Phase 3C: Infrastructure

#### Slice 12: Sequelize Migrations Baseline (Size: M)

**Objective:** Transition from `sequelize.sync()` to proper migration-based schema management.

**Steps:**
1. Start fresh Postgres → run sync() → `pg_dump --schema-only` → capture DDL
2. Create `20260411000000-baseline.js` migration wrapping the DDL
3. Add `.sequelizerc` pointing to correct config paths
4. Insert baseline into `SequelizeMeta` on existing databases
5. Remove `sync()` call from `config/database.ts`
6. Update Docker entrypoint to run `npx sequelize-cli db:migrate` before server start
7. Create migration for Slice 7 (`last_triggered_at` on automations) and Slice 11 (`location` type)

**Tests:**
- Run migrations against empty database → compare schema with expected
- Run seed → assert data created correctly

**Files to create:**
- `backend/src/migrations/20260411000000-baseline.js`
- `backend/.sequelizerc`

**Files to modify:**
- `backend/src/config/database.ts` (remove sync)
- `docker-compose.yml` (update backend command)

---

#### Slice 13: Redis Caching Layer (Size: M)

**Objective:** Cache board metadata for fast loads. Add Redis adapter for Socket.io.

**New service:**
- `RedisService.ts` — singleton wrapping `ioredis`
  - `get<T>(key): Promise<T | null>`
  - `set(key, value, ttlSeconds): Promise<void>`
  - `del(key): Promise<void>`
  - `invalidatePattern(pattern): Promise<void>` — for `board:*` style invalidation

**Cache strategy:**
- `BoardService.getById()` → check `board:{id}` cache first → if miss, query DB + cache for 300s
- Invalidate `board:{id}` on: board update, column create/update/delete, group create/update/delete, view create/update/delete
- Socket.io Redis adapter for horizontal scaling readiness

**New dependencies:** `ioredis@^5.0.0`, `@socket.io/redis-adapter@^8.0.0`

**Tests:**
- Integration: Fetch board (cold) → fetch again (cached, faster) → mutate column → fetch again (invalidated, fresh data)

**Files to create:**
- `backend/src/services/RedisService.ts`

**Files to modify:**
- `backend/src/services/BoardService.ts` (add cache-aside)
- `backend/src/services/WebSocketService.ts` (add Redis adapter)
- `backend/src/server.ts` (initialize RedisService)

---

#### Slice 14: Backend Test Coverage Push (Size: L)

**Objective:** Reach 80%+ backend test coverage.

**New test infrastructure:**
- `docker-compose.test.yml` with `crm_platform_test` database
- `backend/src/__tests__/factories/` with factory functions: `createTestUser()`, `createTestBoard()`, `createTestItem()`, etc.
- `backend/src/__tests__/setup.ts` — connects to test DB, runs sync({ force: true })

**Test files to create:**
- `backend/src/__tests__/services/ItemService.test.ts`
- `backend/src/__tests__/services/ColumnValueService.test.ts`
- `backend/src/__tests__/services/BoardService.test.ts`
- `backend/src/__tests__/services/BoardGroupService.test.ts`
- `backend/src/__tests__/services/ColumnService.test.ts`
- `backend/src/__tests__/services/WorkspaceService.test.ts`
- `backend/src/__tests__/services/BoardViewService.test.ts`
- `backend/src/__tests__/services/NotificationService.test.ts`
- `backend/src/__tests__/services/AutomationEngine.test.ts`
- `backend/src/__tests__/routes/boards.routes.test.ts`
- `backend/src/__tests__/routes/items.routes.test.ts`
- `backend/src/__tests__/routes/columns.routes.test.ts`
- `backend/src/__tests__/routes/notifications.routes.test.ts`
- `backend/src/__tests__/routes/files.routes.test.ts`
- `backend/src/__tests__/eav/handlers.test.ts` (all 15+1 handlers)

---

#### Slice 15: Frontend Test Coverage (Size: L)

**Objective:** Add Vitest + RTL + MSW to frontend, reach 70%+ coverage.

**New dev dependencies:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `jsdom`

**Test infrastructure:**
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts` (RTL matchers, MSW server setup)
- `frontend/src/test/mocks/handlers.ts` (MSW request handlers for all API endpoints)

**Test files to create:**
- `frontend/src/components/board/TableView.test.tsx`
- `frontend/src/components/board/KanbanView.test.tsx`
- `frontend/src/components/board/CalendarView.test.tsx`
- `frontend/src/components/board/DashboardView.test.tsx`
- `frontend/src/components/board/ColumnRenderer.test.tsx`
- `frontend/src/components/board/ColumnEditor.test.tsx`
- `frontend/src/components/board/FilterPanel.test.tsx`
- `frontend/src/components/common/NotificationBell.test.tsx`
- `frontend/src/hooks/useBoard.test.ts`
- `frontend/src/hooks/useWebSocket.test.ts`
- `frontend/src/context/AuthContext.test.tsx`
- `frontend/src/pages/LoginPage.test.tsx`
- `frontend/src/pages/BoardPage.test.tsx`

---

### Phase 4: Industry Frontends

#### Slice 16: Shared Component Library Extraction (Size: XL)

**Objective:** Extract reusable components from core frontend into `frontends/_shared/` for all 10 industry frontends.

**Components to extract:**
- All board views (Table, Kanban, Calendar, Timeline, Chart, Form, Dashboard, Map)
- ColumnRenderer, ColumnEditor
- Layout components (MainLayout, Sidebar)
- Common components (StatusBadge, PersonAvatar, FilterPanel, SortPanel, NotificationBell)
- Hooks (useBoard, useBoards, useWebSocket)
- Context providers (AuthContext, WorkspaceContext)
- Utils (api.ts)
- Types (index.ts)

**Theme config interface:**
```typescript
interface ThemeConfig {
  primaryColor: string;      // e.g., "#2563EB" for NovaPay
  secondaryColor: string;
  companyName: string;       // e.g., "NovaPay"
  logo?: string;             // path to logo image
  sidebarLabels?: Record<string, string>;  // e.g., { boards: "Pipelines" }
}
```

**Docker changes:** Add volume mount `./frontends/_shared:/app/_shared:ro` to each frontend container

---

#### Slice 17: Industry Board Templates + Seed Data (Size: XL)

**Objective:** Create 3-5 board templates per industry with 50-200 realistic records each.

**Per industry (example — NovaPay FinTech):**
- Templates: Transaction Pipeline, Merchant Onboarding, Compliance Tracker, Risk Dashboard, Settlement Board
- Each template: pre-defined columns (status, text, number, date, person as appropriate), groups, and default view
- Seed data: 50-100 items with realistic names, amounts, dates, statuses
- 4 automation rules: e.g., "When transaction status changes to Flagged → create notification for compliance officer"

**Repeat for all 10 industries** using the company profiles from `INDUSTRY-BRANDING-CONTEXT.md`.

---

#### Slice 18: Industry Frontend Production Quality (Size: XL)

**Objective:** Upgrade all 9 industry frontends from minimal prototypes to production quality.

**Per industry frontend:**
- Add `react-router-dom` routing (board list, board detail, settings)
- Import all shared components from `../_shared/`
- Apply theme config (brand colors from INDUSTRY-BRANDING-CONTEXT.md)
- Add full dependency set (recharts, react-beautiful-dnd, socket.io-client, date-fns)
- Wire WebSocket for real-time updates
- Industry-specific landing page / overview dashboard
- Match port allocation (13001-13010)

---

## Success Criteria

- [ ] All 18 vertical slices implemented and working
- [ ] 80%+ backend test coverage (Jest --coverage)
- [ ] 70%+ frontend test coverage (Vitest --coverage)
- [ ] All 8 board views functional (no "coming soon" placeholders)
- [ ] Real-time collaboration works (item changes broadcast via WebSocket)
- [ ] Automation engine executes triggers and actions (verifiable via AutomationLog)
- [ ] Filter and sort work on all column types
- [ ] Drag-and-drop works in Table and Kanban views
- [ ] File upload/download works with size limits enforced
- [ ] Notifications display in real-time via WebSocket
- [ ] 10 industry frontends running with brand themes on ports 13001-13010
- [ ] Full Docker stack starts cleanly with `docker-compose up`
- [ ] Zero TypeScript compilation errors on all projects
- [ ] All seeds run successfully, populating demo data
- [ ] Database managed via migrations (no sync())

---

## Workflow Phases & Suggested Prompts

### Current Phase: SPEC (this document)

**Next phase: PLAN**

Copy and paste this to start the next phase:

```
/plan Break down Phase 3A (Slices 1-6) from SPEC.md into ordered TDD tasks. Each slice should have RED (write failing test) → GREEN (implement) → REFACTOR → COMMIT steps. Vertical slices only — each task delivers end-to-end functionality. Reference decision.md for architectural choices. Docker-based testing with real Postgres. Skills: planning-and-task-breakdown (primary), incremental-implementation, test-driven-development, context-engineering.
```

After Phase 3A plan is approved and built:

```
/plan Break down Phase 3B (Slices 7-11) from SPEC.md into ordered TDD tasks. Same TDD rhythm. Reference decision.md for automation engine (BullMQ), file upload (StorageService), dashboard (widget grid), and map view (Leaflet) decisions.
```

After Phase 3B:

```
/plan Break down Phase 3C (Slices 12-15) from SPEC.md into ordered TDD tasks. Focus: migrations baseline, Redis caching, backend test push to 80%+, frontend test setup with Vitest + MSW.
```

After Phase 3C:

```
/plan Break down Phase 4 (Slices 16-18) from SPEC.md into ordered TDD tasks. Focus: shared component library extraction, 10 industry templates + seed data, industry frontend production quality.
```
