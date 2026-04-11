# Design Decisions — CRM Platform (Project 13)

> Autonomous decisions made during spec phase. Each documents the problem, options considered, chosen approach, and rationale.

---

## Decision 1: Automation Engine Architecture

**Problem:** The Automation model exists (trigger types, action types, config JSONB) but no execution engine. Need to evaluate triggers on data mutations and execute actions reliably.

**Options considered:**
- **(A) In-process, synchronous** — evaluate and execute inline in the CRUD service methods
- **(B) BullMQ job queue** — enqueue jobs after commit, process asynchronously via workers
- **(C) EventEmitter + setTimeout** — Node.js native event system with deferred execution

**Chosen: (B) BullMQ job queue**

**Rationale:**
- Redis 7 is already running in docker-compose but unused — zero new infrastructure
- Decouples HTTP response time from automation execution (slow email/webhook actions don't block API)
- BullMQ provides built-in retry with exponential backoff, dead-letter queues, and repeatable jobs (for `on_recurring` triggers)
- Repeatable jobs replace the need for a separate cron library for `on_date_reached` and `on_recurring` triggers
- AutomationLog records are created by the worker, giving execution traceability
- In dev, the worker runs in the same Node process; in production it can be a separate process

**New dependencies:** `bullmq@^5.0.0`

---

## Decision 2: Migration Strategy

**Problem:** Backend uses `sequelize.sync({ force: false })` for schema creation. No migration files exist. Need to transition to proper migrations without losing data.

**Options considered:**
- **(A) Generate migrations from models** — use `sequelize-auto-migrations` to diff models vs DB
- **(B) Baseline migration from pg_dump** — capture current DDL, wrap in a single migration
- **(C) Start fresh** — drop DB, create migrations from scratch

**Chosen: (B) Baseline migration from pg_dump**

**Rationale:**
- Safest path — captures the exact schema that sync() produced, including indexes and constraints
- Single `20260411000000-baseline.js` migration wrapping raw SQL from `pg_dump --schema-only`
- Mark as "already run" in `SequelizeMeta` on existing databases
- Replace `syncDatabase()` call with `sequelize db:migrate` in Docker entrypoint
- All future changes become individual migration files
- Option A is fragile (auto-migration tools often miss edge cases). Option C loses any existing data

**Steps:**
1. `docker-compose up -d postgres` → `pg_dump --schema-only crm_platform > baseline.sql`
2. Wrap in migration file
3. Insert into SequelizeMeta
4. Remove sync() from database.ts
5. Update Docker entrypoint to run migrations

---

## Decision 3: Redis Caching Scope

**Problem:** Redis 7 is running but unused. Need to decide what to cache and how to invalidate.

**Options considered:**
- **(A) Cache everything** — boards, items, column values, users
- **(B) Cache board metadata only** — board + columns + groups + views (the "schema" query)
- **(C) No application caching** — use Redis only for BullMQ and Socket.io adapter

**Chosen: (B) Cache board metadata only + Socket.io Redis adapter**

**Rationale:**
- Board detail (board + columns + groups + views) is fetched on every page load and involves 4+ JOINs. Cache key: `board:{id}`, TTL: 300s. Invalidate on any board/column/group/view mutation
- Items and column values change too frequently and have too many invalidation points — caching them creates more bugs than it solves
- `@socket.io/redis-adapter` ensures WebSocket events propagate correctly if the backend ever scales horizontally
- BullMQ already uses Redis internally — no additional configuration needed
- User data is low-volume and doesn't benefit from caching

**New dependencies:** `ioredis@^5.0.0`, `@socket.io/redis-adapter@^8.0.0`

---

## Decision 4: Dashboard View Design

**Problem:** Dashboard view is a placeholder ("coming soon"). Need to design a useful default dashboard that works for all industries.

**Options considered:**
- **(A) Fixed layout** — predetermined widgets, no customization
- **(B) Configurable widget grid** — user picks widgets and positions them
- **(C) Auto-generated summary** — analyze board data and generate relevant charts

**Chosen: (B) Configurable widget grid with 4 built-in widget types**

**Rationale:**
- The `BoardView.layoutJson` JSONB field already exists in the model — perfect for storing widget layout
- 4 widget types cover 90% of use cases without over-engineering:
  1. **KPI Cards** — count items by status column (e.g., "12 Working On It", "5 Done")
  2. **Chart Widget** — reuse existing ChartView component (recharts bar/pie)
  3. **Activity Feed** — recent ActivityLog entries for the board (requires Slice 9)
  4. **Summary Table** — top N items sorted by a chosen column
- CSS Grid for layout (no new dependency). Widget positions stored as `{ type, columnId?, gridArea, config }`
- Users can add/remove/rearrange widgets
- Option A is too rigid for 10 industries. Option C is complex and unpredictable

---

## Decision 5: Map View Library

**Problem:** Map view is a placeholder. Need a mapping library and a data strategy for pin placement.

**Options considered:**
- **(A) Mapbox GL JS** — powerful, beautiful, but requires API key and has usage costs
- **(B) Leaflet + OpenStreetMap** — free, open-source, well-supported, no API key
- **(C) Google Maps** — familiar but requires API key and billing

**Chosen: (B) Leaflet + OpenStreetMap via react-leaflet**

**Rationale:**
- Free, no API key, no usage costs — ideal for a demo/dev platform
- `react-leaflet` has excellent React integration
- OpenStreetMap tiles are sufficient for CRM pin visualization
- New EAV column type: `location` storing `{ address: string, lat: number, lng: number }`
- Geocoding: optional client-side via Nominatim (free, rate-limited at 1 req/s)
- If no location column exists on a board, Map view shows a setup prompt
- Mapbox/Google can be swapped in later by changing the tile provider

**New dependencies:** `leaflet@^1.9.0`, `react-leaflet@^4.2.0`, `@types/leaflet@^1.9.0`

---

## Decision 6: Drag-and-Drop Scope

**Problem:** `react-beautiful-dnd@13.1.1` is installed with types but not wired into any views. Need to decide which drag targets to support.

**Options considered:**
- **(A) Items only** — drag items within and between groups
- **(B) Items + groups** — also reorder groups (swim lanes)
- **(C) Items + groups + columns** — full drag-and-drop like Monday.com

**Chosen: (C) All three targets**

**Rationale:**
- Backend already has `position` fields and reorder endpoints for items, groups, and columns
- react-beautiful-dnd supports nested droppable areas
- Monday.com supports all three — matching the reference is a quality goal
- Implementation order: items (highest value) → groups → columns (progressive enhancement)
- Each drag target is a separate `DragDropContext` or nested `Droppable`
- Optimistic UI updates with server reconciliation via WebSocket (depends on Slice 1)

---

## Decision 7: File Upload Strategy

**Problem:** FileAttachment model exists with all fields but no upload/download routes. Multer is already a dependency.

**Options considered:**
- **(A) Direct upload to local disk** — simple, works in Docker
- **(B) Pre-signed URL upload to S3** — production-ready but complex for dev
- **(C) StorageService interface** — local disk in dev, S3 in production, behind an abstraction

**Chosen: (C) StorageService interface with local disk implementation**

**Rationale:**
- Multer is already installed — use it for multipart parsing
- `StorageService` interface with `save(file): Promise<string>` and `stream(path): ReadStream`
- `LocalStorageService` implements it for dev: saves to `./uploads/{workspaceId}/{yyyy}/{mm}/{uuid}.{ext}`
- S3 implementation can be added later without changing routes or controllers
- Limits enforced per CLAUDE.md: 10MB per file, 500MB per workspace
- Allowed MIME types: images (jpg, png, gif, webp, svg), documents (pdf, doc, docx, xls, xlsx, csv, txt), archives (zip)
- Download route checks workspace membership before streaming
- No signed URLs in dev — auth-gated `GET /api/v1/files/:id/download`

---

## Decision 8: Filter/Sort Architecture

**Problem:** Filter and Sort panels exist in the UI but are non-functional. Need to decide server-side vs client-side.

**Options considered:**
- **(A) Client-side only** — filter/sort the items array in React state
- **(B) Server-side only** — all filtering via API query params
- **(C) Server-side primary, client-side secondary** — API handles main filters, client handles quick sorts within loaded data

**Chosen: (B) Server-side filtering with URL query params**

**Rationale:**
- EAV data lives in `column_values` JSONB — filtering requires SQL-level queries against JSONB fields
- `ItemService.list()` already accepts `search`, `sortBy`, `sortOrder`, `groupId` — extend with `filters`
- Filter format: `filters=[{"columnId":5,"operator":"equals","value":"Done"}]` as base64-encoded query param
- Operators: `equals`, `not_equals`, `contains`, `not_contains`, `gt`, `lt`, `gte`, `lte`, `is_empty`, `is_not_empty`, `between`
- EAV handlers already have `search()` and `compare()` methods — use them to build WHERE clauses
- Saved filters stored in `BoardView.settings` JSONB (field already exists)
- Client-side-only fails with pagination (can't filter what you haven't loaded)

---

## Decision 9: Industry Frontend Strategy

**Problem:** 9 industry frontends exist as minimal prototypes (no routing, no charts, no WebSocket). Need to decide how to bring them to production quality.

**Options considered:**
- **(A) Copy main frontend 9 times** — customize each copy
- **(B) Monorepo with shared packages** — npm workspaces or pnpm workspaces
- **(C) Shared directory with volume mounts** — `frontends/_shared/` mounted into each container

**Chosen: (C) Shared directory with Docker volume mounts**

**Rationale:**
- 9 separate Docker containers are already defined in docker-compose.yml — this is the deployment model
- A `frontends/_shared/` directory contains all reusable components (board views, column renderers, hooks, contexts, layout)
- Each industry frontend imports from `../_shared/` via Vite alias (`@shared/*`)
- Each industry frontend provides a theme config: `{ primaryColor, secondaryColor, companyName, logo, sidebarConfig }`
- Industry-specific components stay in the industry directory
- Docker volume mount: `./frontends/_shared:/app/_shared:ro` in each frontend container
- Option A = 9x maintenance burden. Option B = complex monorepo setup that conflicts with existing Docker architecture
- This approach keeps the existing Docker architecture intact while sharing code

---

## Decision 10: Test Strategy

**Problem:** Only 6 backend test suites (66 tests), 0 frontend tests. Need to design a test pyramid that reaches 80%+ coverage.

**Options considered:**
- **(A) Mock everything** — fast tests but low confidence in integration
- **(B) Real database for all tests** — high confidence but slow
- **(C) Tiered pyramid** — unit (mocked) + integration (real DB) + frontend (MSW) + E2E (Playwright)

**Chosen: (C) Tiered test pyramid**

**Rationale:**

| Level | Tool | Database | Scope | Speed |
|-------|------|----------|-------|-------|
| Unit | Jest + ts-jest | Mocked Sequelize | EAV handlers, middleware, utils, TriggerEvaluator, ActionExecutor | Fast |
| Integration | Jest + Supertest | Real Postgres in Docker | Route-level CRUD, auth flows, automation execution, WebSocket events | Medium |
| Frontend | Vitest + React Testing Library | N/A (MSW mocks API) | Component rendering, user interactions, form submissions, board views | Fast |
| E2E | Playwright | Full Docker stack | Login, create board, add items, drag-and-drop, real-time updates | Slow |

- Add `docker-compose.test.yml` with a `crm_platform_test` database
- Integration tests run `sequelize.sync({ force: true })` before each suite (clean slate)
- Factory functions for test data creation (createTestUser, createTestBoard, etc.)
- MSW (Mock Service Worker) for frontend API mocking — intercepts fetch/axios at the network level
- 5-10 critical E2E journeys covering the golden paths
- CI runs: unit → integration → frontend → E2E (fail-fast ordering)

**New dev dependencies:** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `@testing-library/user-event`, `msw`, `@playwright/test`
