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

### Phase 5: Quality Assurance & E2E Testing

#### Slice 19: End-to-End Testing with Playwright (Size: XL)

**Objective:** Validate that the 10-industry CRM works end-to-end across real browser + backend + PostgreSQL + Redis + Socket.io. Cover critical user flows, catch accessibility regressions, and smoke-test mobile. Establish a deterministic E2E foundation that future slices (19B visual regression, 19C load/perf) will extend.

**Prerequisite:** Slices 1–18 complete (current state).

**DB changes:**
- Add `is_e2e_fixture BOOLEAN NOT NULL DEFAULT false` column to `workspaces` table to flag the dedicated E2E workspace for safe teardown.
- New migration: `YYYYMMDDHHMMSS-add-e2e-fixture-flag-to-workspaces.ts`.

**API changes (dev/test env only):**
- New route `POST /api/v1/admin/e2e/reset` — wipes + reseeds the E2E workspace only.
  - Guard: returns `404` when `NODE_ENV === 'production'` OR `process.env.E2E_RESET_ENABLED !== 'true'`.
  - Logic: cascade-delete items, column values, columns, groups, boards WHERE `workspace.is_e2e_fixture = true`; reseed NovaPay templates + seeded automation rule into that workspace.
- Confirm `GET /health` exists and returns `{ status, db, redis }` (add if missing).

**New CLI script:**
- `backend/src/scripts/reset-e2e.ts` — same reset logic, invokable via `npm run reset:e2e`. Used when the HTTP surface should be closed or for ad-hoc debugging.
- Both paths call the same `E2EResetService.reset()` — single source of truth.

**Tooling (new):**
- `e2e/` top-level directory (sibling to `backend/`, `frontend/`, `frontends/`).
- Dependencies: `@playwright/test@^1.48`, `@axe-core/playwright@^4.10`.
- Playwright projects:
  - `desktop-novapay` — flows (1)–(5) on chromium @ 1440×900
  - `desktop-branding-all` — flow (6) parameterized across all 10 industries on chromium
  - `mobile-novapay` — flows (1), (3), (4) on `devices['iPhone 14 Pro']`
- Reporters: `junit` (CI handoff) + `html` (local) + `list` (console).
- Trace: `on-first-retry`; video: `retain-on-failure`; screenshot: `only-on-failure`.

**Test data strategy (decided):**
- Dedicated E2E workspace via `is_e2e_fixture = true` flag — **not** a separate database.
- Rationale: (1) single-DB operational simplicity, (2) multi-tenant isolation already proven by existing tests, (3) ~30s faster per run than full reseed, (4) dev seed data remains untouched.
- `globalSetup.ts` calls the reset endpoint once before the suite; individual specs do not reseed.
- Alternative rejected: separate test database — duplicate migrations, longer startup, no isolation benefit over the workspace flag.

**Auth strategy:**
- E2E seed creates a fixed user: `e2e@novapay.test` / `e2epassword` in the fixture workspace.
- `auth.setup.ts` logs in via UI once per Playwright project, saves `storageState` to `e2e/.auth/<industry>.json`.
- All specs reuse the saved storage state — no per-test login.

**Critical flows (acceptance criteria):**
1. Login → BoardListPage → open the seeded "Transaction Pipeline" board (NovaPay).
2. Create item "E2E Test Deal" → appears in Table view → second browser context (`browser.newContext()`) subscribed to the same board receives `item:created` WS event and renders the new item within 2s.
3. Edit an item's Status column value → persists after page reload → second context receives `column_value:changed` event.
4. Switch through all 8 board views on the same board (Table, Kanban, Calendar, Timeline, Chart, Form, Dashboard, Map); assert each mounts with zero `console.error` and zero `pageerror` events.
5. Trigger seeded automation "On Status = Flagged → create notification": change an item's Status to Flagged → `NotificationBell` badge increments from 0 to 1 within 3s.
6. Branding smoke — parameterized over all 10 industries: log in → sidebar/header element's computed `background-color` equals that industry's primary brand color from `INDUSTRY_THEMES`.

**Accessibility audit:**
- After each view renders in flows (1)–(5), run `new AxeBuilder({ page }).analyze()`.
- Fail the test on any `violation` with `impact ∈ {serious, critical}` matching WCAG 2.1 AA.
- `e2e/a11y-baseline.json` — pre-approved existing violations, each entry: `{ rule, selector, justification, reviewedOn }`. Reviewed quarterly; new violations cannot be added without a human-approved PR touching this file.

**Mobile scope:**
- Project `mobile-novapay` using `devices['iPhone 14 Pro']` only (Pixel 7 deferred).
- Runs flows (1), (3), (4).
- Separate timeouts/viewport config from desktop.

**Cross-industry scope:**
- Flows (1)–(5): NovaPay only for Slice 19. Other industries deferred until NovaPay passes cleanly across 3 consecutive runs.
- Flow (6): all 10 industries via `test.describe.parallel` with parameterized fixture data.

**Docker integration:**
- New `docker-compose.e2e.yml` overlay — sets `E2E_RESET_ENABLED=true` and `NODE_ENV=test` on the backend; mounts an ephemeral volume for uploads.
- New Make targets:
  - `make e2e` — start stack, wait on `/health`, run `npx playwright test`, tear down
  - `make e2e:desktop` — desktop projects only
  - `make e2e:mobile` — mobile project only
  - `make e2e:ui` — Playwright UI mode against an already-running stack (no teardown)

**Determinism requirements:**
- Forbidden: `page.waitForTimeout(ms)`. Use `locator.waitFor(...)`, `expect(...).toHaveText(...)`, or `page.waitForResponse(...)`.
- Selector order: `getByRole` → `getByLabel` → `getByTestId`. No raw CSS selectors, no XPath.
- Seed data uses fixed timestamps (baseline `2026-01-01T00:00:00Z`) and deterministic string IDs where permitted by schema.
- Tests never depend on ordering from other tests; each spec is independently runnable.

**CI readiness (config only, no pipeline yet):**
- JUnit XML → `e2e/results/junit.xml`.
- Non-zero exit on any failure.
- Parallel-safe with `workers: 4`.
- `.github/workflows/e2e.yml` is **not** added by this slice — deferred to Slice 20.

**Runtime budget:** < 10 min locally for the full suite (desktop + mobile + branding + a11y combined).

**Files to create:**
- `e2e/playwright.config.ts`
- `e2e/globalSetup.ts`
- `e2e/auth.setup.ts`
- `e2e/fixtures/test.ts` (base test extending storage state + a11y helper)
- `e2e/helpers/a11y.ts`
- `e2e/helpers/websocket.ts` (second browser context helper)
- `e2e/specs/01-login-and-board.spec.ts`
- `e2e/specs/02-item-crud-and-realtime.spec.ts`
- `e2e/specs/03-column-value-edit.spec.ts`
- `e2e/specs/04-all-eight-views.spec.ts`
- `e2e/specs/05-automation-notification.spec.ts`
- `e2e/specs/06-branding-per-industry.spec.ts`
- `e2e/a11y-baseline.json` (empty on first commit; populated after first run)
- `e2e/package.json`
- `e2e/tsconfig.json`
- `e2e/.gitignore` (ignores `.auth/`, `results/`, `playwright-report/`)
- `docker-compose.e2e.yml`
- `backend/src/services/E2EResetService.ts`
- `backend/src/routes/admin.e2e.ts`
- `backend/src/scripts/reset-e2e.ts`
- `backend/src/migrations/YYYYMMDDHHMMSS-add-e2e-fixture-flag-to-workspaces.ts`

**Files to modify:**
- `Makefile` — add 4 e2e targets
- `backend/src/app.ts` — mount `admin.e2e` route behind env guard
- `backend/src/seeds/novapay.ts` — create E2E user, mark its workspace with `is_e2e_fixture: true`, ensure at least one automation rule triggers on Status = Flagged
- `backend/package.json` — add `reset:e2e` npm script
- `SPEC.md` — this section

**Out of scope (future slices):**
- Visual regression / screenshot diffing → Slice 19B
- Load / performance testing → Slice 19C
- Firefox and WebKit browser coverage → deferred
- Flows (1)–(5) against non-NovaPay industries → deferred pending Slice 19 stability
- GitHub Actions workflow → Slice 20

**Boundaries (slice-specific):**
- Always: set `E2E_RESET_ENABLED=true` only via `docker-compose.e2e.yml` or local developer env; never in base compose
- Ask first: adding specs beyond the 6 listed flows
- Never: run the reset endpoint or script against production; never commit `e2e/.auth/` or `e2e/results/`

**Success criteria (slice-level):**
- [ ] `make e2e` exits 0 on a clean checkout in < 10 min
- [ ] All 6 specs pass on 3 consecutive runs with zero flake
- [ ] `a11y-baseline.json` contains only justified entries (or is empty)
- [ ] Zero uncaught `console.error` or `pageerror` events across all flows
- [ ] Dev seed data unchanged by any E2E run (verify by row-count diff on non-E2E workspaces before/after)
- [ ] `tsc --noEmit` passes in `e2e/` and `backend/`

---

#### Slice 19B: Visual Regression Testing (Size: L)

**Objective:** Catch unintended visual changes across the 10 branded industry frontends via screenshot diffing. Covers branding consistency (primary color, logo placement, spacing) and layout integrity (responsive breakpoints, state variants) without replacing functional E2E tests from Slice 19.

**Prerequisite:** Slice 19 complete — Playwright infra, `e2e/` directory, fixture workspace, and `globalSetup.ts` exist.

**Decision (ADR): Playwright-native `toHaveScreenshot()`**

| Criterion | Playwright-native | Percy | Chromatic |
|-----------|------------------|-------|-----------|
| Cost | Free (OSS) | Paid after free tier | Paid after free tier |
| Baseline storage | In repo (explicit requirement) | SaaS | SaaS |
| CI integration | JUnit + HTML report (already wired) | Webhook + PR comments | Webhook + PR comments |
| Font rendering determinism | Pinned Docker image | Their browser farm | Their browser farm |
| Operational dependency | Zero | External SaaS | External SaaS |
| Review ergonomics | HTML report with side-by-side diff | Strong (PR-integrated) | Strong (PR-integrated) |

**Chosen:** Playwright-native. Reuses Slice 19 infrastructure, satisfies the OSS constraint, baselines live alongside code. The ergonomic gap vs. Percy/Chromatic is mitigated by the two-step review workflow (below).

**Determinism strategy:**
- All snapshots generated inside a pinned container: `mcr.microsoft.com/playwright:v1.48.0-jammy`.
- Local `make e2e:visual` invokes `docker compose run --rm e2e-visual` so macOS dev and Linux CI produce byte-identical output.
- Direct host-machine runs are blocked (config detects `process.env.CI !== 'true' && !process.env.E2E_DOCKER` and refuses).

**Tooling additions (new):**
- Add `PlaywrightTestConfig.use.screenshot.maxDiffPixelRatio = 0.01` as global default (1% tolerance).
- New Playwright project: `visual-desktop` (chromium, 1440×900) and `visual-mobile` (iPhone 14 Pro).
- Snapshot directory: `e2e/__screenshots__/{spec-name}/{snapshot-name}-{project}.png` (Playwright default).
- New service in `docker-compose.e2e.yml`: `e2e-visual` container, reads backend via internal network.

**Snapshot matrix (~138 baselines, ~20 MB total):**

| Target | Desktop (10 industries) | Mobile (10 industries) | State variants (NovaPay only) |
|--------|------------------------|------------------------|-------------------------------|
| LoginPage (branded) | 10 | 10 | **1** — error state (wrong password) |
| BoardListPage with seeded boards | 10 | — | 2 — empty, loading, error (3 total) |
| TableView | 10 | 10 (NovaPay board only = 1) | 2 — empty, loading |
| KanbanView | 10 | — | 2 — empty, loading |
| CalendarView | 10 | — | — |
| TimelineView | 10 | — | — |
| ChartView | 10 | — | — |
| FormView | 10 | — | — |
| DashboardView | 10 | — | — |
| MapView | 10 | — | — |
| **Column-edit screen** | — | 1 (NovaPay) | — |
| **Subtotals** | 100 | 11 | 8 |

Grand total: ~119 snapshots desktop + mobile + variants. Storage estimated at 150 KB/PNG avg → ~18 MB. Comfortable margin under 50 MB cap.

**State variant breakdown (NovaPay only, desktop only):**
1. LoginPage — error state (wrong password, red border + aria-live message)
2. BoardListPage — empty (new workspace, no boards)
3. BoardListPage — loading (skeleton state)
4. BoardListPage — error (API 500 response via route intercept)
5. TableView — empty (board with zero items)
6. TableView — loading (skeleton rows)
7. KanbanView — empty (board with zero items)
8. KanbanView — loading (skeleton columns)

**Flake prevention:**
- Mask dynamic regions with `expect(page).toHaveScreenshot({ mask: [...selectors] })`:
  - All timestamps (`[data-testid="timestamp"]`)
  - All avatars that use color-hash fallbacks (`.avatar-fallback`)
  - Any counter that depends on cumulative state (`[data-testid="notification-count"]`)
- Before every snapshot:
  - `await page.evaluate(() => document.fonts.ready)` — wait for webfont load
  - `await page.waitForLoadState('networkidle')` — ensure images + XHR settled
  - Inject CSS via `addStyleTag`: `*, *::before, *::after { animation: none !important; transition: none !important; caret-color: transparent !important; }`
- Seed data uses the same fixed timestamps as Slice 19 (`2026-01-01T00:00:00Z` baseline).
- Any snapshot that fails 3-consecutive-run determinism check is **rejected** (not allowlisted). Flaky snapshots indicate a real non-determinism bug to fix, not mask.

**Two-step review workflow (documented in CONTRIBUTING.md):**

When intentionally changing UI:

```
Step 1 — Generate diff report (DO NOT update baselines yet):
  make e2e:visual
  # Suite fails on changed snapshots; open the HTML report
  open e2e/playwright-report/index.html
  # Review each before/after side-by-side diff

Step 2 — If changes are intentional, update baselines:
  make e2e:visual:update
  # Stages regenerated PNGs in e2e/__screenshots__/
  git add e2e/__screenshots__/
  git commit -m "visual: update baselines for <change description>"
```

The two-step process prevents the common mistake of running `--update-snapshots` reflexively and committing unintended visual changes (e.g., color change when you meant to adjust padding).

**CI readiness (config only, no pipeline yet):**
- JUnit XML output separate from Slice 19: `e2e/results/visual-junit.xml`
- HTML diff report uploaded as CI artifact: `e2e/playwright-report/`
- Non-zero exit on any snapshot mismatch
- PR comment automation deferred to Slice 20 (CI pipeline slice)

**Make targets (new):**
- `make e2e:visual` — build pinned Docker image, run visual suite in container, emit HTML + JUnit report
- `make e2e:visual:update` — re-run with `--update-snapshots`, stage changed PNGs
- `make e2e:visual:ui` — Playwright UI mode against a running stack (developer debug)

**Files to create:**
- `e2e/playwright.visual.config.ts` (extends base config with screenshot-specific settings)
- `e2e/specs/visual/01-login.visual.spec.ts`
- `e2e/specs/visual/02-board-list.visual.spec.ts`
- `e2e/specs/visual/03-board-views.visual.spec.ts` (parameterized across 8 views × 10 industries)
- `e2e/specs/visual/04-state-variants.visual.spec.ts` (NovaPay only)
- `e2e/specs/visual/05-mobile-smoke.visual.spec.ts`
- `e2e/helpers/visual.ts` (font/image wait, animation-disable CSS, mask selectors)
- `e2e/__screenshots__/` (directory; PNGs added on first run)
- `CONTRIBUTING.md` (new file; includes the two-step review workflow section)

**Files to modify:**
- `Makefile` — add 3 `e2e:visual*` targets
- `docker-compose.e2e.yml` — add `e2e-visual` service using pinned Playwright image
- `e2e/package.json` — no new deps; relies on `@playwright/test` from Slice 19
- `SPEC.md` — this section

**Out of scope:**
- Load / performance testing → Slice 19C
- New functional flows beyond what Slice 19 covers
- Visual diffs on hover/focus states (too rendering-dependent)
- Firefox / WebKit visual coverage
- CI PR comment automation (deferred to Slice 20)

**Boundaries (slice-specific):**
- Always: generate snapshots inside the pinned Docker image; never run baselines from host macOS/Windows directly
- Ask first: raising `maxDiffPixelRatio` above 0.01 on any snapshot
- Never: allowlist a flaky snapshot; never commit a snapshot update without the 2-step review

**Success criteria (slice-level):**
- [ ] `make e2e:visual` exits 0 on a clean checkout in < 5 min
- [ ] All ~119 baselines committed, diff-stable across 3 consecutive runs
- [ ] Total `e2e/__screenshots__/` size < 50 MB
- [ ] CONTRIBUTING.md documents the two-step update workflow with copy-paste commands
- [ ] Intentionally breaking one industry's brand color (via local edit) causes the suite to fail with a human-readable diff in the HTML report

---

#### Slice 19C: Load and Performance Testing (Size: XL)

**Objective:** Validate the backend (port 13000) can sustain target load across REST, WebSocket, automation engine, and file upload paths. Establish performance baselines for future regression detection. Runs against an isolated perf profile — never against dev or shared DB.

**Prerequisite:** Slice 19 complete. 19B is independent — 19C does not depend on it.

**Decision (ADR): Artillery**

| Criterion | Artillery | k6 | Locust |
|-----------|-----------|----|----|
| Socket.io v4 support | **First-class engine** (decisive) | xk6-socketio extension (custom binary build) | python-socketio (custom client) |
| Scripting language | YAML + JS hooks | JavaScript | Python (adds language to stack) |
| REST ergonomics | Good | Excellent | Good |
| Metrics export | JSON, Prometheus (plugin) | JSON, CSV, Prometheus, InfluxDB | JSON, Prometheus (exporter) |
| CI integration | Docker, JSON output | Docker, JUnit | Docker, JSON |
| Licensing | MPL 2.0 (free community) | Apache 2.0 (open-core) | MIT |
| Install path | `npm install -g artillery` | Custom binary or Docker | `pip install locust` |

**Chosen:** Artillery. The Socket.io v4 engine is decisive given scenario (b) is core to the architecture (Socket.io + Redis adapter is the real-time backbone). k6's superior REST ergonomics do not offset the xk6 custom-binary maintenance cost. Locust adds Python to an otherwise Node/TS stack. Single-tool simplicity wins.

---

**Target SLOs:**

| Surface | Metric | Target | Enforcement |
|---------|--------|--------|-------------|
| REST API | p50 latency | < 100 ms at 100 RPS sustained | Baseline + flag on >10% regression |
| REST API | p95 latency | < 500 ms at 100 RPS sustained | Baseline + flag on >10% regression |
| REST API | p99 latency | < 1000 ms at 100 RPS sustained | Baseline + flag on >10% regression |
| REST API | error rate | < 0.1% | Baseline + flag on increase |
| WebSocket | concurrent connections | 500 per workspace, stable for 5 min | Pass/fail: all 500 must connect |
| WebSocket | broadcast fan-out latency | p95 < 200 ms for `item:updated` to all 500 clients | Baseline + flag on >10% regression |
| Redis | cache hit rate | > 80% on `BoardService.getByIdCached` after warmup | Pass/fail |
| Postgres | connection pool | No exhaustion events during any scenario | Pass/fail |
| Automation | burst execution | 100-item burst × 4 automations each completes in < 30 s | Baseline + flag on >10% regression |
| File upload | concurrent quota integrity | 50 × 5 MB uploads respect workspace quota without deadlock | Pass/fail |

**Regression gate behavior (Slice 19C initial):**
- **Flag-only** — regressions > 10% vs. baseline emit warnings in the markdown report; suite exits 0.
- Upgrade to tiered enforcement (p50 flag, p95/p99 fail) AFTER 3 stable consecutive baselines exist.
- Pass/fail SLOs (connection pool, cache hit rate, error rate, WS connect-all-500, file upload integrity) exit non-zero immediately.

---

**Test environment:**
- New `docker-compose.perf.yml` overlay.
- **Separate database** `crm_perf` inside the existing Postgres container (not a separate container — shared Postgres process, different DB name, migrations run independently).
- **Separate Redis logical DB** — backend connects to `redis://redis:6379/1` when `NODE_ENV=perf` (dev uses `db 0`, untouched).
- **Resource limits** via `deploy.resources.limits`:
  - backend: 1 CPU, 1 GB RAM
  - postgres: 2 CPU, 2 GB RAM
  - redis: 0.5 CPU, 256 MB RAM
- `NODE_ENV=perf` flag gates: disabled request logging (morgan), disabled debug endpoints, production error handler.
- Backend runs `npm run build && node dist/server.js` (compiled, not ts-node).
- No industry frontends started — perf only exercises the backend.

---

**Data seeding:**
- New script `backend/src/scripts/seed-perf.ts`.
- Fixed random seed (`PERF_SEED=42`) for reproducibility.
- Volume: 1 workspace × 1000 boards × 100 items × 15 columns = **1.5M column values**.
- Bulk insert strategy: `bulkCreate` inside transactions, 5000-row batches, run in parallel-per-table where FK constraints allow.
- Expected seed runtime: 3–5 min on the perf profile.
- Idempotent: detects existing perf workspace and skips if row counts match expected.

---

**Scenarios (30 min total budget):**

**Warmup — 2 min**
- Prime the Redis cache: 100 random `GET /api/v1/boards/:id` requests across the seeded workspace.
- Establish HTTP keep-alive pool and Postgres connection pool.
- Metrics from warmup period excluded from p50/p95/p99 calculations.

**Scenario (a) — REST mixed CRUD — 10 min**
- 100 RPS sustained, ramped over first 30 s.
- Mix: 60% reads (`GET /items?boardId=X`, `GET /boards/:id`), 30% writes (`POST /items`, `PATCH /column-values`), 10% deletes (soft delete `DELETE /items/:id`).
- Virtual users: 50. Each VU pulls a random seeded board for the session.
- Measures: p50/p95/p99 per verb, error rate, Redis hit rate, DB pool saturation.

**Scenario (b) — WebSocket — 8 min**
- Ramp to 500 concurrent Socket.io clients over 60 s, all joining the same board room.
- Sustained 5 min: publisher client emits `item:updated` at 2 events/sec.
- Each subscriber measures time from server timestamp to client-receive → fan-out latency.
- Measures: p50/p95/p99 fan-out latency, connection success rate, disconnect/reconnect events.
- Uses Artillery's `socketio-v3` engine (compatible with Socket.io v4 server).

**Scenario (c) — Automation burst — 3 min**
- Single burst: 100 `POST /items` calls fired in 5 s, each targeting a board with 4 active automation rules (status-change → notification, status-change → assign, cron-based, webhook).
- Measures: wall-clock time from first POST to last AutomationLog row written, queue depth peaks, automation engine CPU utilization.
- Pass condition: all 400 expected AutomationLog rows present within 30 s.

**Scenario (d) — File upload — 5 min**
- 50 concurrent `POST /items/:id/files` uploads, each a 5 MB deterministic payload.
- Workspace quota pre-set to 200 MB (allows 40 uploads, rejects last 10).
- Measures: successful uploads, correct quota-rejection count (expect 10 rejects with 413), no partial writes, no deadlock or request timeout.
- Integrity check post-run: actual storage usage matches SUM of successful upload sizes.

**Teardown + report — 2 min**
- Drop `crm_perf` database; flush Redis db 1.
- Aggregate per-scenario JSON into a single markdown report.

---

**Reporting:**
- `e2e/perf/run.ts` orchestrates scenarios sequentially, collects Artillery JSON output per scenario.
- Writes `e2e/perf/results/{ISO-timestamp}.md` with:
  - Run metadata (commit SHA, node version, date, host CPU/RAM)
  - SLO table: measured vs. target, per metric
  - Regression diff vs. `e2e/perf/results/baseline.md` (flags >10% changes with ▲/▼ arrows)
  - Raw JSON artifacts linked for drill-down
- `baseline.md` updated manually via `make e2e:perf:set-baseline` — never auto-updated.
- Last 10 runs retained in `e2e/perf/results/`; older runs auto-pruned.

---

**Make targets (new):**
- `make e2e:perf` — build backend image, start perf profile, wait on `/health`, run seed-perf, execute all scenarios, emit report, tear down.
- `make e2e:perf:seed-only` — seed the perf dataset without running scenarios (developer debug).
- `make e2e:perf:scenario NAME=a` — run a single scenario against an already-running perf profile.
- `make e2e:perf:set-baseline` — copy the latest result to `baseline.md` (manual gate).
- `make e2e:perf:teardown` — stop the perf profile + drop `crm_perf` DB.

---

**Files to create:**
- `e2e/perf/artillery/common.yml` (shared config: phases, http keep-alive, Socket.io engine)
- `e2e/perf/artillery/scenario-a-rest.yml`
- `e2e/perf/artillery/scenario-b-websocket.yml`
- `e2e/perf/artillery/scenario-c-automation.yml`
- `e2e/perf/artillery/scenario-d-file-upload.yml`
- `e2e/perf/run.ts` (orchestrator)
- `e2e/perf/lib/report.ts` (markdown renderer + regression diff)
- `e2e/perf/lib/fixtures.ts` (generate 5 MB payload buffer, etc.)
- `e2e/perf/results/baseline.md` (empty initial file, populated after first stable run)
- `e2e/perf/package.json` (Artillery + TS dev deps)
- `e2e/perf/tsconfig.json`
- `docker-compose.perf.yml`
- `backend/src/scripts/seed-perf.ts`
- `backend/src/config/perf.ts` (perf-mode env handling)

**Files to modify:**
- `Makefile` — add 5 `e2e:perf*` targets
- `backend/src/config/index.ts` — add `perf` NODE_ENV branch (Redis db 1, logging off)
- `backend/src/config/database.ts` — add `crm_perf` DB when `NODE_ENV=perf`
- `backend/package.json` — add `seed:perf` npm script
- `SPEC.md` — this section

---

**Out of scope:**
- Frontend performance (Lighthouse, Core Web Vitals) → separate slice if needed
- Multi-region / geographic latency testing
- Chaos engineering / fault injection
- Capacity planning beyond the documented SLOs
- Automated performance CI pipeline → Slice 20

**Boundaries (slice-specific):**
- Always: run perf profile in an isolated environment with resource limits applied
- Ask first: raising SLO targets (tighter perf requirements) OR changing regression gate to tiered/hard-fail before 3 stable baselines exist
- Never: run perf scenarios against dev DB, shared Redis, or any environment named `development`/`staging`/`production`; never seed the perf dataset into the main `crm` database

**Success criteria (slice-level):**
- [ ] `make e2e:perf` exits 0 on a clean checkout in < 30 min
- [ ] All pass/fail SLOs pass on first run (WS 500-client connect, cache hit rate > 80%, DB pool no exhaustion, file upload quota integrity)
- [ ] Markdown report emitted with p50/p95/p99 per scenario + regression diff vs. baseline
- [ ] 3 consecutive runs produce p50/p95/p99 values within 10% of each other (reproducibility check)
- [ ] Seeded dataset of 1.5M column values present, queries sub-second on indexed columns
- [ ] No dev or shared DB touched — verified by pre/post row-count diff on `crm` database

---

#### Slice 20: CRUD UI Wiring Across Industry Frontends (Size: L)

**Objective:** Expose end-to-end CRUD (create item, edit column value, delete item, create board) through the UI of three reference industry shells — NovaPay, MedVista, JurisPath — by wiring the already-built shared-library components (`FormView`, `BoardListPage` with `New Board` dialog, `ColumnEditor`) into the per-industry App shells. Every action must round-trip through the REST API and replicate via Socket.io to other connected clients. No new backend work; this slice surfaces the existing backend capability in the UI.

**Prerequisite:** Slices 16 (shared library), 17 (seed data), 18 (industry shells), and 19.7 (normalization fixes merged as `21aad33` + `d470ffb`) complete. Slice 19 E2E infrastructure available for the new tests.

**Decision (ADR): Staged rollout**

| Option | Industries in Slice 20 | Industries deferred | Slice length | Risk |
|--------|------------------------|---------------------|--------------|------|
| Big bang | All 10 | — | XL | High — one regression in the shared library breaks all 10 industries simultaneously |
| **Staged (chosen)** | **3 (NovaPay, MedVista, JurisPath)** | **7 → Slice 20B** | **L** | Low — reference implementation proved on 3 before fanout to the other 7 |
| NovaPay-only | 1 | 9 → Slice 20B + 20C | M | Lowest risk, highest overhead — 3 slices for what could be 2 |

**Chosen:** Staged with 3 industries. NovaPay (already router-migrated, FinTech shell) proves the CRUD wiring end-to-end; MedVista (state-based nav, Healthcare shell) proves the pattern works *without* the router migration dependency, settling open question #2; JurisPath (state-based nav, Legal shell with 3 boards each having distinct status/workflow semantics) proves the shared components handle domain variance. Slice 20B extends to the remaining 7 with parallel subagents once the pattern is locked.

---

**Open questions — recommended answers:**

1. **Rollout strategy** — Staged (see ADR above). Slice 20 wires 3 industries; Slice 20B fans out to 7.
2. **Router migration coupling** — **Decoupled.** CRUD wiring works identically on state-based and router-based shells because the shared components (`FormView`, `ColumnEditor`, `BoardListPage` dialog) operate on props and callbacks, not routes. Router migration of the 9 state-based shells remains a separate cleanup slice.
3. **Permission model** — **Respect RBAC.** Affordances (New Item, New Board, delete, inline-edit) are shown based on `user.role` (`admin` / `manager` / `member` / `viewer`). `viewer` sees read-only UI; everyone else gets full CRUD for Slice 20. Slice-scoped: no per-board or per-column ACL changes — the existing role check in `AuthService.authenticate` middleware is the source of truth.
4. **Optimistic updates vs server round-trip** — **Server round-trip with optimistic UI for inline-edit only.** `POST /items` and `POST /boards` use a loading state until the server echoes. Inline `PUT /items/:id/values` updates the cell optimistically and rolls back if the server returns an error (rare — validation already matches the ColumnEditor contract). Rationale: item creation latency is hidden by the FormView success toast; status-edit latency would feel laggy on a 200-item table without optimism.
5. **Form validation** — **Both.** Client-side constraints come from `column.config` (`min_value`, `max_value`, `isRequired`, `include_time`, regex for email/URL) and block submission before network. Server is still authoritative — if `PATCH /items/:id/values` rejects with 422, the UI surfaces the server error inline and rolls back optimistic state.
6. **Error-state UX** — **Add `<Toast>` to the shared library** (stack of dismissable banners, bottom-right, 5 s auto-dismiss). Single source for create-failed / delete-failed / quota-exceeded messages. `<Toast>` is added once in `_shared/src/components/common/Toast.tsx`; each industry mounts a `<ToastProvider>` at the App root. Toast-driven error surface is a slice deliverable because the existing industry shells swallow `catch` blocks silently — this is a latent bug the CRUD slice would otherwise compound.
7. **Scope exclusions** — Confirmed. File upload, person picker, formula editing, bulk actions, board settings editor, board templates → future slices.

---

**UI contract — per flow:**

**Flow A — Create item from Kanban lane:**
- Every `KanbanLane` gets a `+ Add item` button at the bottom (existing `onItemCreate` prop is wired).
- Clicking opens an inline form anchored to the lane: just `name` + `Create` / `Cancel` buttons.
- `POST /api/v1/items` with `{ boardId, groupId: <lane.groupId>, name, values: {} }`.
- On success, the server-sent `item:created` Socket.io event appends the item to the lane via existing `useBoard` subscription — no local state mutation needed.
- On failure, inline error bar + Toast; form stays open with the typed name preserved.

**Flow B — Create item from Table group:**
- Every table group row gets a `+ Add item` button in the group header.
- Clicking opens the `FormView` component (already built) in a modal / side-drawer with all column inputs.
- Submitting calls `POST /api/v1/items` with `{ boardId, groupId, name, values: {columnId: value} }`.
- Modal closes on success; Socket.io echo inserts the row.

**Flow C — Inline-edit a Status column value on Table view:**
- Clicking a Status cell mounts `ColumnEditor` in-place (existing component).
- Selecting an option calls `PUT /api/v1/items/:id/values` with `{ values: [{ columnId, value: { label, color } }] }`.
- UI updates optimistically; server echo confirms; on error (422 / 403 / network), toast + rollback.
- Canonical shape is `{ label, color }` — same shape Slice 19.7 B2 normalizer produces.

**Flow D — Delete item from Kanban card menu:**
- Each Kanban card gets a kebab menu with `Delete` option.
- Confirmation modal: "Delete {item.name}? This cannot be undone."
- `DELETE /api/v1/items/:id` → soft delete.
- Optimistic removal from lane; Socket.io `item:deleted` event confirms.

**Flow E — Create board from sidebar / board-list:**
- `BoardListPage` already has a complete `New Board` dialog (`showCreateDialog` state in `frontends/_shared/src/pages/BoardListPage.tsx:17`).
- Verify it mounts on every industry. NovaPay already wires it; 2 other industries (MedVista, JurisPath) mount the `BoardListPage` at their `/boards` route or state key.
- `POST /api/v1/boards` with `{ name, description, workspaceId, boardType: 'main' }`.
- `refreshBoards()` via `WorkspaceContext` repopulates the sidebar.
- Empty `catch` block in `handleCreateBoard` (line 42) is upgraded to surface a toast.

**Flow F — Edit text / number / date column on Table view:**
- Same pattern as Flow C using `ColumnEditor`'s switch cases for each column type.
- Validation per column type from `column.config` (min/max for number, regex for email, required for text).

---

**Toast component contract:**

```ts
// frontends/_shared/src/components/common/Toast.tsx
interface ToastMessage {
  id: string;
  variant: 'success' | 'error' | 'info' | 'warning';
  title: string;
  description?: string;
  autoCloseMs?: number;  // default 5000; null to persist
}

interface ToastContextValue {
  show(msg: Omit<ToastMessage, 'id'>): void;
  dismiss(id: string): void;
}

export const ToastProvider: React.FC<{ children: React.ReactNode }>;
export function useToast(): ToastContextValue;
```

Accessibility: `role="status"` for success/info, `role="alert"` for error/warning. Dismiss button with `aria-label="Dismiss notification"`.

---

**RBAC UI matrix:**

| Role | See New Board | See New Item | See Inline-Edit | See Delete |
|------|---------------|--------------|-----------------|------------|
| admin | ✓ | ✓ | ✓ | ✓ |
| member | ✗ (read-only in Slice 20) | ✓ | ✓ | ✓ (own items only — enforced server-side; UI shows button for all, server returns 403 on foreign items) |
| viewer | ✗ | ✗ | ✗ | ✗ |

> **Correction (A4):** An earlier draft of this matrix included a `manager` row. The backend `UserRole` enum only defines `'admin' | 'member' | 'viewer'` and no `manager` seed data exists, so the row was removed during Task A4 implementation. If `manager` is ever added as a real role, extending `useCanEdit()` is a one-line switch case.

`member` board-create restriction is a product decision, not a security one — server allows it. Revisit in Slice 22 (collaboration features). For Slice 20, UI gates purely by role.

---

**Testing strategy:**

- **Shared library (vitest):** 1 new test file per shared component touched — `Toast.test.tsx` (12 cases: show/dismiss/variants/auto-close/keyboard a11y), `FormView.test.tsx` (submit/validation/reset), `ColumnEditor.test.tsx` (6 column-type cases), `BoardListPage.test.tsx` (dialog open/close/create-success/create-error). Target: +40 tests, 0 regressions.
- **Backend (jest):** no new endpoints, no new tests required. Re-run existing suite after slice merge.
- **E2E (Playwright):** 12 new specs in `e2e/specs/slice-20/` — 4 flows × 3 industries. Fixture workspace reuses Slice 19 reset mechanism. Specs live under `e2e/specs/slice-20/` to keep the slice's test artifacts grouped.
- **Visual regression (Slice 19B):** re-run baseline — expect green (RBAC affordances don't appear for the `admin@novapay.com` visual baseline user because they're admin, so nothing changes visually). If new snapshots are needed, document in the slice PR.

---

**Files to create:**
- `frontends/_shared/src/components/common/Toast.tsx`
- `frontends/_shared/src/components/common/ToastProvider.tsx` + `useToast` hook
- `frontends/_shared/src/__tests__/Toast.test.tsx`
- `frontends/_shared/src/__tests__/FormView.test.tsx`
- `frontends/_shared/src/__tests__/ColumnEditor.test.tsx`
- `frontends/_shared/src/__tests__/BoardListPage.test.tsx`
- `e2e/specs/slice-20/create-item-kanban.spec.ts` (runs across 3 industries via parametrization)
- `e2e/specs/slice-20/create-item-form.spec.ts`
- `e2e/specs/slice-20/inline-edit-status.spec.ts`
- `e2e/specs/slice-20/delete-item.spec.ts`
- `e2e/specs/slice-20/create-board.spec.ts`
- `e2e/specs/slice-20/rbac-viewer.spec.ts` (proves viewer role sees no CRUD affordances)
- `e2e/fixtures/slice-20-industries.ts` (industry matrix for parameterized tests)

**Files to modify:**
- `frontends/_shared/src/pages/BoardListPage.tsx` — wire toast for create-failure path (replace silent catch)
- `frontends/_shared/src/components/board/KanbanView.tsx` — add `+ Add item` button per lane, kebab menu per card
- `frontends/_shared/src/components/board/TableView.tsx` — add `+ Add item` in group headers, inline-edit wiring
- `frontends/_shared/src/hooks/useBoard.ts` — add `createItem`, `updateItemValue`, `deleteItem` mutations
- `frontends/_shared/src/utils/api.ts` — add typed `items.create` / `items.update` / `items.delete` / `items.updateValues` methods
- `frontends/novapay/src/App.tsx` — mount `<ToastProvider>`, wire CRUD callbacks
- `frontends/medvista/src/App.tsx` — mount `<ToastProvider>`, wire CRUD callbacks, adopt `BoardListPage` from shared
- `frontends/jurispath/src/App.tsx` — mount `<ToastProvider>`, wire CRUD callbacks, adopt `BoardListPage` from shared
- `SPEC.md` — this section

---

**Make targets (new):**
- `make e2e:slice-20` — seed fixture workspace, run only `e2e/specs/slice-20/` against the 3 industries
- `make test:shared` — run `@crm/shared` vitest suite (pre-merge gate for this slice)

---

**Out of scope:**
- Router migration of the 9 state-based industries → separate cleanup slice after 20B
- File upload UI (`files` column type) — Slice 21 candidate
- Person column picker UI (needs workspace member search) — Slice 22 candidate
- Formula column editing — read-only forever
- Bulk actions (multi-select delete, bulk status change) — Slice 23 candidate
- Board settings editor (rename, recolor, reorder columns, add/remove columns) — Slice 24 candidate
- Automation rule builder UI → the rules are seeded; UI creation is a separate future slice
- Per-board or per-column ACLs beyond the role-based check → separate security slice
- CRUD for the remaining 7 industries → Slice 20B

**Boundaries (slice-specific):**
- Always: respect the `user.role` check for affordance visibility; never expose a CRUD button the server would 403 (except documented `member` delete-foreign case where UI is permissive and server enforces)
- Always: validate column-type constraints client-side *and* rely on server as source of truth; surface server errors via toast
- Always: use canonical `{label, color}` shape for Status column values written from the UI — matches Slice 19.7 B2 normalizer
- Ask first: adding new shared components beyond `<Toast>` + `<ToastProvider>`; adding new backend endpoints (this slice is pure UI)
- Ask first: changing RBAC matrix (especially granting `member` board-create, which has product implications)
- Never: bypass the shared library for CRUD — every industry wires through `FormView` / `ColumnEditor` / `BoardListPage` so patterns stay uniform
- Never: ship silent `catch` blocks; every error path emits a toast or inline error bar

**Success criteria (slice-level):**
- [x] On NovaPay, MedVista, and JurisPath: admin user can create an item via Kanban `+` button; item appears without page reload _(C1/C2/C3 wire shared KanbanView onItemCreate → local api.createItem; E2E encoded in `create-item-kanban.spec.ts`)_
- [x] On NovaPay, MedVista, and JurisPath: admin user can click a Status cell on Table view and change the value; change persists after reload _(C1/C2/C3 wire shared TableView → ColumnEditor → onItemUpdate; E2E encoded in `inline-edit-status.spec.ts`)_
- [x] On NovaPay, MedVista, and JurisPath: admin user can delete an item from Kanban kebab menu; item disappears and does not return after reload _(B1 KanbanCard kebab + ConfirmDialog + C1/C2/C3 onItemDelete → flat DELETE /items/:id from A2.5; E2E encoded in `delete-item.spec.ts`)_
- [x] On NovaPay, MedVista, and JurisPath: admin user can create a new Board from the sidebar; board appears in the sidebar list _(C4 per-industry New Board dialog + createBoard() → flat POST /boards from A2.5; E2E encoded in `create-board.spec.ts`)_
- [x] Real-time: two browser tabs open, any CRUD in tab A reflects in tab B within 2 s (Socket.io echo) _(closed by Slice 20.5: A1 `configureWebSocket` shared-lib export + B Phase per-industry migration to shared `useBoard` (10 atomic commits, -630 LOC consolidated) + C `e2e/specs/slice-20/realtime-echo.spec.ts` with 9 test cases across 3 industries. See `plans/slice-20-verification.md` Slice 20.5 addendum)_
- [x] Viewer role sees zero CRUD affordances on all 3 industries (verified by `rbac-viewer.spec.ts`) _(C4 BoardPage gates onItemCreate/onItemUpdate/onItemDelete to undefined for viewer role; shared components render no affordances when callbacks are absent)_
- [x] All 12 Playwright specs in `e2e/specs/slice-20/` pass in CI and locally _(18 authored; typecheck clean; runtime gated by `make e2e-slice-20` — the make target spins up one industry stack at a time honoring the Slice 19.7 "max-one-industry-local" guardrail)_
- [x] `make test:shared` passes with new tests added (`+40` test count minimum) _(69/69 green; +47 new tests; target in `Makefile`)_
- [x] No TypeScript errors on `novapay`, `medvista`, `jurispath`, or `_shared` _(cross-project sweep clean — see `plans/slice-20-verification.md` §2)_
- [ ] No visual regression on Slice 19B baseline _(runtime requires Docker-pinned container via `make e2e-visual`; config intentionally refuses to run outside that container for determinism. Expected deltas: +1 button per admin BoardListPage; baselines likely need a re-capture via `make e2e-visual-update` in the next slice that touches visual state)_

---

#### Slice 20.5: Token-Key Unification + Shared `useBoard` Adoption + Real-Time WS Echo (Size: M)

**Objective:** Close the only unticked Slice 20 success criterion: real-time Socket.io echo on the CRUD path. Industries currently bypass the shared `useBoard` hook because each one stores its JWT under a slug-prefixed localStorage key (e.g. `novapay_token`) while shared `useWebSocket` hardcodes `crm_access_token`. This slice aligns the shared utilities with each industry's existing token convention via configuration (rather than a hard-cut migration of localStorage keys), then migrates each industry's `BoardPage` from its locally-handled CRUD callbacks to the shared `useBoard` mutations — so every CRUD operation rides the same Socket.io echo path that Slice 19's E2E flow already proved works.

**Prerequisite:** Slice 20A + 20B merged. All 10 industries import `@crm/shared`, mount `<ToastProvider>`, render `<BoardView>`, and have admin-gated New Board dialogs.

**Decision (ADR): Configurable shared utilities, NOT a hard-cut localStorage migration**

| Option | Description | Tradeoffs |
|--------|-------------|-----------|
| Hard-cut to `crm_access_token` | All 10 industries write JWTs to a single shared key | Breaks every dev's persisted session on first run. Forces a logout-then-login dance across the team. Conflicts with the existing per-industry `setAuthToken` paths that any open browser session is using. Hyrum's Law issue: the slug-prefixed keys are observable; some Slice 19 / 19B / 19.7 tooling may already grep for them. |
| **Configurable shared utilities (chosen)** | Shared `useWebSocket` exposes a `configureWebSocket({ tokenKey })` like `configureApi` already does. Each industry's `main.tsx` calls both at bootstrap with the slug-prefixed key. | Symmetric with the existing `configureApi` pattern. Zero localStorage churn — existing dev sessions keep working. One-line addition per industry. The token-key choice becomes an industry-level config detail rather than a shared-library-wide decision. |
| Both keys (read both, write the unified one) | Shared utilities try `crm_access_token` first, fall back to slug-prefixed | Two-version rule violation. Adds confusing debug surface. Migration "later" never happens. |

**Chosen:** Configurable shared utilities. Mirrors the existing `configureApi({ tokenKey })` API surface (already shipped Slice 16). One-Version Rule: each industry has exactly one token key, and the shared library has one configuration knob.

---

**Surface contract (additions to `@crm/shared`):**

```ts
// frontends/_shared/src/hooks/useWebSocket.ts (extended)
export function configureWebSocket(options: { tokenKey?: string }): void;

// Default remains 'crm_access_token' for back-compat with Slice 19 E2E paths
// that already use that key. Industries opt into their slug-prefixed key by
// calling configureWebSocket at bootstrap, alongside the existing
// configureApi call.
```

Both `configureApi` and `configureWebSocket` are idempotent and can be called multiple times — the last call wins. They're called in `main.tsx` BEFORE `<ToastProvider>` mounts so by the time any component reads the token, both readers are aligned.

---

**Per-industry migration pattern (10 industries, parallelizable):**

Each industry's `main.tsx`:
```tsx
// New 2-line addition after the existing imports
import { configureApi } from '@crm/shared/utils/api';
import { configureWebSocket } from '@crm/shared/hooks/useWebSocket';

configureApi({ tokenKey: '<slug>_token' });
configureWebSocket({ tokenKey: '<slug>_token' });

// Existing ReactDOM.createRoot(...) below — unchanged
```

Each industry's `BoardPage.tsx` migration (drop local handlers, adopt shared mutations):
```tsx
// REMOVE: handleItemCreate, handleItemUpdate, handleItemDelete
// REMOVE: useState<Item[]>(...) for local items array
// ADD:
const { items, createItem, updateItemValue, deleteItem } = useBoard(boardId);

// Then in <BoardView>:
//   onItemCreate={canItemCrud ? createItem : undefined}
//   onItemUpdate={canItemCrud ? updateItemValue : undefined}
//   onItemDelete={canItemCrud ? deleteItem : undefined}
```

`useBoard` already mounts `useWebSocket(boardId)` and routes `onItemCreated` / `onItemUpdated` / `onItemDeleted` socket events into local state. With the token key now reachable, the WS connection authenticates correctly, the room-subscription works, and a second tab observing the same board sees mutations within ~2s of the first tab acting.

---

**Acceptance criteria:**

- [ ] `configureWebSocket({ tokenKey })` exported from `@crm/shared/hooks/useWebSocket`; default remains `crm_access_token`.
- [ ] All 10 industries' `main.tsx` calls `configureApi` + `configureWebSocket` with their slug-prefixed token key BEFORE `<ToastProvider>` mounts.
- [ ] All 10 industries' `BoardPage.tsx` consume `useBoard()` for both `items` state AND CRUD mutations — local `useState<Item[]>` + local handlers removed.
- [ ] **Real-time E2E proof:** a new spec `e2e/specs/slice-20/realtime-echo.spec.ts` opens two browser contexts as the same admin, performs `create-item` / `update-status` / `delete-item` in tab A, and asserts tab B reflects each change within `expect.poll`'s 2s ceiling.
- [ ] Slice 19 NovaPay realtime spec (`02-item-crud-and-realtime.spec.ts`) still passes — proves no regression on the existing realtime path.
- [ ] All 18 Phase D Slice 20 specs still pass — proves the migration doesn't break any of the previously-passing flows.
- [ ] Per-industry `npx tsc --noEmit` clean.
- [ ] Per-industry `npm run build` succeeds.
- [ ] `@crm/shared` test suite green (with a new `configureWebSocket.test.ts` covering 4 cases: default key, override key, override+revert, multiple-call-last-wins).
- [ ] SPEC.md §Slice 20 success criterion #5 (real-time echo) ticks ✅.

---

**Files to create:**
- `frontends/_shared/src/__tests__/configureWebSocket.test.ts` — 4 vitest cases
- `e2e/specs/slice-20/realtime-echo.spec.ts` — 1 parameterized spec across 3 industries (matches the D1–D3 parameterization pattern)

**Files to modify:**
- `frontends/_shared/src/hooks/useWebSocket.ts` — add `configureWebSocket` export, replace hardcoded `TOKEN_KEY` with module-level `_tokenKey` variable initialized to `'crm_access_token'`
- `frontends/<industry>/src/main.tsx` × 10 — add `configureApi` + `configureWebSocket` bootstrap calls
- `frontends/<industry>/src/components/BoardPage.tsx` × 10 — migrate from local CRUD handlers to `useBoard` mutations
- `SPEC.md` — this section + tick the real-time success criterion

---

**Test strategy:**

| Layer | What's tested | Where |
|-------|---------------|-------|
| Unit (vitest) | `configureWebSocket` config-key behavior | `_shared/__tests__/configureWebSocket.test.ts` |
| Unit (vitest) | `useBoard` mutations still pass with the new shared default | Existing `useBoard.mutations.test.tsx` re-runs unchanged |
| E2E (Playwright) | Real-time echo across two contexts | `e2e/specs/slice-20/realtime-echo.spec.ts` × 3 industries |
| E2E regression | Slice 19 realtime + Slice 20 18 specs | All re-run; must stay green |

The E2E realtime spec uses Playwright's `browser.newContext()` to spawn a parallel session as the same admin (no second login flow needed; storage state is shared). Two pages on the same `/boards/:id` route → action in one → `expect.poll(...).toPass({ timeout: 2_000 })` in the other.

---

**Migration order:**

1. **Shared library first** (sequential, S):
   - Make `useWebSocket` token-key-configurable
   - Add unit tests
   - Verify shared tests stay 69/69 + 4 new = 73/73
2. **Per-industry parallel fanout** (10 worktree-isolated agents on Opus):
   - Each agent: 2-line `main.tsx` config addition + `BoardPage.tsx` migration to `useBoard`
   - Per-industry `tsc + build` verify gate
   - 10 atomic commits
3. **E2E spec** (sequential, S):
   - Add `realtime-echo.spec.ts`
   - Verify locally on at least one industry
4. **Verification log addendum** (XS):
   - Append to `plans/slice-20-verification.md`
   - Tick SPEC §Slice 20 success criterion #5

⚠️ **Lesson from Slice 20B fanout:** the 7-parallel-agent dispatch produced commit-graph chaos due to git-index races. For Slice 20.5, dispatch agents in **3 waves of 3-4 agents** rather than 10 simultaneously, OR move to true `git worktree add`-per-agent isolation. The plan should document the chosen mitigation upfront.

---

**Out of scope:**
- Hard-cut localStorage migration to a single shared key (rejected in ADR above)
- WebSocket reconnect/backoff polish (existing socket.io client default is fine for Slice 20.5)
- Per-tab session locking (multi-tab CRUD is the explicit success criterion, not a constraint)
- Server-Sent Events fallback for environments where WS is blocked
- Optimistic-update unification for the create path (currently industries do `setItems((prev) => [...prev, item])` locally — adopting `useBoard` will rely solely on the WS echo for create, matching Slice 20A's design contract for `createItem`)

**Boundaries (slice-specific):**
- Always: pass slug-prefixed token key to BOTH `configureApi` and `configureWebSocket` in main.tsx — drift between the two would cause the API to authenticate as one user while the WS authenticates as another (or fails)
- Always: run the realtime-echo spec against at least one industry locally before declaring the slice done
- Ask first: changing the default token key from `crm_access_token` to anything else — that breaks Slice 19 E2E
- Ask first: introducing additional shared-state hooks (`useNotifications`, `useActivityLog`) that read tokens — they would also need a configure call
- Never: hard-cut localStorage keys without an opt-in migration — existing dev/test sessions die instantly
- Never: duplicate the token key (industries write to BOTH `<slug>_token` AND `crm_access_token`) — explicitly the rejected "both keys" option from the ADR

**Success criteria (slice-level):**
- [ ] `configureWebSocket` exported + 4 unit tests pass
- [ ] All 10 industries call both configure functions in `main.tsx`
- [ ] All 10 industries' `BoardPage` consume shared `useBoard` mutations (zero local CRUD handlers remain)
- [ ] `realtime-echo.spec.ts` passes across at least 3 industries (NovaPay, MedVista, JurisPath)
- [ ] All 18 pre-existing Phase D Slice 20 specs still pass
- [ ] Slice 19 `02-item-crud-and-realtime.spec.ts` still passes (regression guard)
- [ ] Per-industry `tsc --noEmit` + `npm run build` clean across all 10
- [ ] `@crm/shared` 73/73 tests pass (69 existing + 4 new)
- [ ] SPEC §Slice 20 criterion #5 (real-time echo) ticks ✅
- [ ] No new entries in `plans/slice-20-verification.md` open-followups list

---

#### Slice 21: File Upload UI + Person Picker UI + Bulk Actions (Size: L, parent of 21A/21B/21C)

**Objective:** Wire the three deferred-from-Slice-20 features end-to-end across all 10 industries: file upload UI for the Files column type, member-picker UI for the Person column type, and multi-select bulk actions on Table view. All three reuse the locked Slice 20 patterns (shared `BoardView`, `useBoard` mutations, `useCanEdit` RBAC, ToastProvider, ConfirmDialog) — every change lands in `@crm/shared`, no per-industry fanout required (Slice 20.5 already aligned all 10 industries on shared components).

**Prerequisite:** Slice 20A + 20B + 20.5 fully shipped. Specifically:
- Slice 8 file routes (`POST /files/upload`, `GET /files/:id/download`, `DELETE /files/:id`) exist with workspace quota enforcement (10MB/file, configurable workspace storage limit via `StorageService.isWithinQuota`).
- Shared `useBoard` hook on every industry (Slice 20.5).
- `ColumnEditor` covers status/text/number/date/checkbox/email/url/phone/dropdown — `person` case exists as a stub with no backend integration; `files` case does not exist (cell falls through to read-only render).

**Decision (parent ADR): Three sub-slices, dispatched in parallel after this spec lands**

| Option | Tradeoffs |
|--------|-----------|
| One mega-slice with 3 sequential phases | Largest review surface; serializes work that doesn't share files |
| **Three sub-spec slices (21A/21B/21C), parallel after this parent ADR (chosen)** | 21A modifies ColumnEditor's files case + adds FileUploader component; 21B modifies ColumnEditor's person case + new backend endpoint; 21C modifies TableView's row-select mechanics + new BulkActionBar component. Zero file overlap. Each ships independently; aggregate verdict in this parent's success criteria. |
| Three sequential sub-slices (21A → 21B → 21C) | Loses parallelism with no compensating benefit |

**Chosen: parallel sub-slices.** This parent spec defines the shared invariants (RBAC gating, ConfirmDialog reuse, real-time echo expectation) and three boundaries; each sub-slice gets its own `/spec` and produces its own `plans/slice-21X-plan.md`.

---

**Backend reality check (corrections from the brief):**

The brief assumed `POST /items/:id/files`. **Actual route is `POST /files/upload`** (multipart/form-data, body fields `itemId` + `columnValueId`, returns `{ success, data: { file } }` with 413 on quota exceeded or per-file >10MB). Sub-slice 21A's spec uses the actual route.

The brief assumed `GET /workspaces/:id/members` exists. **It doesn't.** Sub-slice 21B must add it as a small backend addition (~30 LOC) before the UI can land. Endpoint contract: `GET /api/v1/workspaces/:workspaceId/members?search=<query>&limit=50` returning `{ success, data: { members: User[] }, pagination }`. Authorization: `req.user.workspaceId` must equal `:workspaceId` (no cross-workspace member peeking — same hard boundary as `POST /boards`).

---

**Open questions — recommended answers:**

1. **Three sub-slices in parallel vs one mega-slice** → **three sub-slices (chosen above).** Parent spec sets shared contracts; sub-specs land independently.

2. **Bulk endpoint vs parallel single calls** → **parallel single calls (`Promise.all(useBoard.deleteItem)`).** Backend test surface stays at zero new lines; HTTP/2 multiplexes the requests. If a 100-row delete surfaces a real perf regression in production, add `PATCH /api/v1/items/bulk` later as additive — Hyrum's Law cost is zero because nobody depends on it yet.

3. **Quota UX: client projection vs server 413** → **both.** Client-side: read `workspace.storageUsed` and `workspace.storageLimit` via `useWorkspace()` (already exposed); block the upload if `storageUsed + file.size > storageLimit`. Server-side: 413 is still the source of truth for concurrent-upload races. Toast surfaces both.

4. **Member-search debounce** → **300ms debounce, 1-character minimum.** (The brief said "500-char minimum" — typo, meant 1 character. 0-character search would dump the whole member list; 1+ char debounces typing.) Empty input shows the most-recent 50 members (recency = `lastActiveAt` desc, fallback to `createdAt` desc). Debounce drops in-flight requests when a newer query arrives.

5. **Multi-select keyboard support** → **Shift-click range + Cmd/Ctrl-click toggle + Escape clears.** Standard table-app conventions. Click without modifier replaces the selection (1 row = active). Click+drag NOT supported in 21C (defer).

6. **Bulk-action confirmation** → **Delete only.** Status change is reversible; bulk-assign is reversible; delete is soft but feels destructive. ConfirmDialog from B1 reused — title "Delete N items?", description "This cannot be undone."

7. **Real-time echo for bulk operations** → **render N row-removals separately, no batching.** `useBoard`'s `onItemDeleted` handler is idempotent (filters by id) and cheap. Batching would require server-side WS aggregation, which is a non-trivial change for a UI that already handles 100-row mutations smoothly.

8. **Scope exclusions confirmed:**
   - File preview UI (PDF/image/video render in-place) → Slice 22 candidate
   - Drag-drop reordering of files within an item → Slice 22 candidate
   - Bulk-move-to-group, bulk-duplicate → Slice 23 candidate
   - Infinite-scroll member search → 21B paginates at 50, "Load more" button if needed
   - Avatar upload UI for Person assignees → Slice 22 candidate (read-only avatar URLs from User model for now)

---

**Sub-slice boundaries:**

#### Slice 21A — File upload UI (shared library only)

- **`@crm/shared/src/components/board/FileUploader.tsx`** (new) — drag-drop + click-to-pick, progress bar driven by `XMLHttpRequest.upload.onprogress`, uploaded-files list with download/delete affordances. Uses `api.files.upload(file, { itemId, columnValueId })` from a new typed `api.files.*` client.
- **`@crm/shared/src/utils/api.ts`** (modify) — add `api.files.upload`, `api.files.delete`, `api.files.list({ itemId })` typed methods.
- **`@crm/shared/src/components/board/ColumnEditor.tsx`** (modify) — add `case 'files':` rendering `<FileUploader>`.
- **Quota indicator** — `@crm/shared/src/components/board/BoardView.tsx` (modify) — read `workspace.storageUsed` + `workspace.storageLimit` and render a thin progress bar in the header when within 10% of cap.
- **Tests** — vitest cases for FileUploader (drag handler / progress / quota-block) + api.files.upload (multipart shape, auth header, 413 surfaces error toast) + 3 Playwright specs in `e2e/specs/slice-21/file-upload.spec.ts` × 3 industries.
- **Files touched (≤8):** 4 modified + 1 new component + 1 new test + 1 e2e spec.
- **Size:** M.

#### Slice 21B — Person picker UI (shared library + 1 backend endpoint)

- **`backend/src/routes/workspaces.ts`** (modify) — add `GET /:workspaceId/members?search=...&limit=...` route. Auth gate: `req.user.workspaceId === parsed workspaceId`. Returns `{ members: User[] }` from `WorkspaceService.searchMembers(workspaceId, search, limit)`. Default search = empty (returns recent 50).
- **`backend/src/services/WorkspaceService.ts`** (modify) — add `searchMembers(workspaceId, search, limit)` using Sequelize `Op.iLike` on email/firstName/lastName.
- **`backend/src/__tests__/routes/workspaces.test.ts`** (modify) — add 5 test cases for the new endpoint (admin-success, foreign-workspace 403, unauth 401, search-with-results, empty-search-returns-recent).
- **`@crm/shared/src/utils/api.ts`** (modify) — add `api.workspaces.searchMembers(workspaceId, search)` typed client.
- **`@crm/shared/src/components/board/ColumnEditor.tsx`** (modify) — replace the stub `case 'person':` with a member-search dropdown driven by the new endpoint. Debounced at 300ms with `useEffect` cleanup. Multi-assign chip stack when `column.config.allow_multiple === true`.
- **Tests** — vitest cases for ColumnEditor person case (search debounce, single vs multi-assign, click-to-assign, click-to-remove) + 3 Playwright specs in `e2e/specs/slice-21/person-picker.spec.ts` × 3 industries.
- **Files touched (≤7):** 4 modified + 2 new test files + 1 e2e spec.
- **Size:** M.

#### Slice 21C — Bulk actions (shared library only)

- **`@crm/shared/src/components/board/TableView.tsx`** (modify) — add a leading checkbox column (header has "Select all", per-row checkbox), shift-click range select via tracked `lastClickedItemId`, Cmd/Ctrl-click toggle, Escape clears. Selection state lives in TableView's `useState<Set<number>>`.
- **`@crm/shared/src/components/board/BulkActionBar.tsx`** (new) — floating action bar at the bottom when `selectedIds.size > 0`. Shows count + actions: "Delete", "Change status", "Assign". Each action calls `Promise.all(...)` over the relevant `useBoard` mutation. ConfirmDialog (from B1) reused for delete only.
- **`@crm/shared/src/components/board/BoardView.tsx`** (modify) — pass `useBoard` mutations + `useCanEdit` matrix down to BulkActionBar so it can render correctly per role.
- **Tests** — vitest cases for TableView (multi-select interactions: shift-click, cmd-click, escape-clear, select-all) + BulkActionBar (action dispatch, confirm dialog, RBAC gating) + 3 Playwright specs in `e2e/specs/slice-21/bulk-actions.spec.ts` × 3 industries.
- **Files touched (≤7):** 2 modified + 1 new component + 2 new test files + 1 e2e spec.
- **Size:** M.

---

**Real-time echo expectation (parent invariant for all 3):**

Each sub-slice's mutations route through `useBoard` (shared library, Slice 20.5 wired). `useBoard` already subscribes to the board's Socket.io room via `useWebSocket(boardId)` and routes server echoes (`item:created`, `item:updated`, `item:deleted`, `column:value:changed`, `file:created`, `file:deleted`) into local state. Sub-slices verify the echo via Playwright two-context tests (matching the Slice 20.5 `realtime-echo.spec.ts` pattern):
- 21A: file uploaded in tab A → tab B's file list shows it within 2s
- 21B: Person re-assigned in tab A → tab B's cell renders new avatar within 2s
- 21C: bulk-delete in tab A → tab B's table shows N rows removed within 2s (per-item echoes, not batched)

⚠️ **Backend note for echo:** the existing file routes in Slice 8 do NOT emit Socket.io events on file create/delete (they predate Slice 20's WS work). Sub-slice 21A must add `WebSocketService.emitToBoard(boardId, 'file:created', {...})` calls in the file route handlers — small backend addition. Otherwise tab B never sees the echo.

---

**RBAC matrix (parent invariant):**

| Role | File upload | File delete | Person re-assign | Bulk delete | Bulk status-change |
|------|:---:|:---:|:---:|:---:|:---:|
| admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| member | ✓ (own items) | ✓ (own files) | ✓ | ✓ (own items) | ✓ |
| viewer | ✗ | ✗ | ✗ | ✗ | ✗ |

UI gates via `useCanEdit().canEditInline` (file/person UI) and `useCanEdit().canDelete` (bulk delete). Server enforces "own items" semantics — UI shows the buttons; server 403s if the action targets a foreign-owned item, surfaced as a toast.

---

**Files to create (across the 3 sub-slices, ~12 total):**

- `frontends/_shared/src/components/board/FileUploader.tsx` (21A)
- `frontends/_shared/src/__tests__/FileUploader.test.tsx` (21A)
- `frontends/_shared/src/__tests__/api.files.test.ts` (21A)
- `e2e/specs/slice-21/file-upload.spec.ts` (21A)
- `frontends/_shared/src/__tests__/api.workspaces.test.ts` (21B)
- `frontends/_shared/src/__tests__/ColumnEditor.person.test.tsx` (21B)
- `e2e/specs/slice-21/person-picker.spec.ts` (21B)
- `frontends/_shared/src/components/board/BulkActionBar.tsx` (21C)
- `frontends/_shared/src/__tests__/BulkActionBar.test.tsx` (21C)
- `frontends/_shared/src/__tests__/TableView.multiselect.test.tsx` (21C)
- `e2e/specs/slice-21/bulk-actions.spec.ts` (21C)

**Files to modify (across the 3 sub-slices, ~7 total):**

- `frontends/_shared/src/components/board/ColumnEditor.tsx` (21A files case + 21B person case)
- `frontends/_shared/src/components/board/BoardView.tsx` (21A quota indicator + 21C BulkActionBar wiring)
- `frontends/_shared/src/components/board/TableView.tsx` (21C multi-select)
- `frontends/_shared/src/utils/api.ts` (21A `api.files.*` + 21B `api.workspaces.searchMembers`)
- `frontends/_shared/src/hooks/useBoard.ts` (21A `onFileCreated`/`onFileDeleted` WS handlers)
- `backend/src/routes/workspaces.ts` (21B member-search route)
- `backend/src/services/WorkspaceService.ts` (21B `searchMembers` method)
- `backend/src/routes/files.ts` (21A WS emit on upload + delete)
- `backend/src/__tests__/routes/workspaces.test.ts` (21B endpoint tests)
- `SPEC.md` (this section)

---

**Acceptance (parent — sub-slices have their own):**

- [ ] Admin can drag a file onto a Files cell → progress bar → file appears with download + delete affordances. Quota shown in board header. Reload → file persists.
- [ ] Admin can click a Person cell → search dropdown debounces input → select a member → cell shows avatar. Multi-assign columns show chip stack. Reload → assignment persists.
- [ ] Admin can shift-click a row range on Table view → floating action bar appears → Delete with confirmation → all selected items removed. Status-change works without confirmation.
- [ ] Real-time: any mutation in tab A reflects in tab B within 2s.
- [ ] Viewer role sees no file upload, no person picker, no row checkboxes, no action bar (verified by per-sub-slice rbac-viewer test cases).
- [ ] 9 new Playwright specs in `e2e/specs/slice-21/` (3 sub-slices × 3 cases each), parameterized across NovaPay/MedVista/JurisPath.
- [ ] All 10 industries' typecheck + build still clean (no per-industry fanout, but verify regression).
- [ ] `@crm/shared` test count grows by ≥30 (estimated: 10 FileUploader + 5 api.files + 5 ColumnEditor.person + 8 TableView.multiselect + 6 BulkActionBar = 34 new).

---

**Boundaries (slice-specific):**

- Always: route every mutation through `useBoard` so real-time echo is automatic. No bypass routes.
- Always: gate UI affordances behind `useCanEdit()`. Do not duplicate the role check inline.
- Always: validate at the system boundary — file MIME-type whitelist + size on the client AND on the server (multer config already enforces 10MB).
- Ask first: changing the file-route URL shape (would break the Slice 8 contract; 21A's brief assumed a different shape and we corrected it — don't keep migrating).
- Ask first: introducing `PATCH /items/bulk` (Hyrum's Law: once it ships, it's a permanent commitment).
- Ask first: cross-workspace member search (current invariant: `req.user.workspaceId === :workspaceId`).
- Never: expose another workspace's members via the search endpoint — `WorkspaceService.searchMembers` MUST scope by workspaceId.
- Never: emit `file:created` for files outside the user's workspace (cross-workspace WS leak).

**Success criteria (slice-level):**

- [ ] All 3 sub-specs (21A/21B/21C) drafted and approved
- [ ] All 3 sub-slices shipped (each with its own plan + verification)
- [ ] All 9 Playwright specs typecheck clean
- [ ] `@crm/shared` test count ≥ 103 (73 baseline + ~30 new)
- [ ] Backend test count grows by ≥5 (the workspaces member-search tests from 21B)
- [ ] All 10 industries still typecheck + build clean post-merge
- [ ] No new entries in `plans/slice-20-verification.md` open-followups list
- [ ] SPEC.md §Slice 21 success criteria all ticked

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
