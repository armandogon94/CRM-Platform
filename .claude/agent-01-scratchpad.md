# Agent 01 — NovaPay Scratchpad & Implementation Notes

## Session: 2026-04-02

### Exploration Phase

Before building anything, I explored the full project structure:

1. **Plans directory** (5 docs, ~285KB total):
   - `CRM-MASTER-PLAN.md` (85KB) — Complete architecture, EAV system, 15 column types, 8 view types
   - `INDUSTRY-BRANDING-CONTEXT.md` (60KB) — All 10 companies with full specs
   - `CLAUDE-CODE-INSTANCE-PROMPTS-13.md` (44KB) — 11 agent prompts
   - `RALPH-LOOP-CONFIG.md` (42KB) — 5-pass QA framework
   - `CALENDAR-SYNC-API-SPEC.md` (37KB) — CalDAV integration spec

2. **Pre-existing backend code** I found:
   - `backend/src/config/database.ts` — Sequelize PostgreSQL config (port 5432, db: crm_platform)
   - `backend/src/config/index.ts` — Full AppConfig with JWT, rate limiting, upload settings
   - `backend/src/models/` — 14 model files ALL already existed (not empty as initially reported)
   - `backend/src/models/index.ts` — Model associations fully defined
   - `backend/src/middleware/` — auth.ts, rbac.ts, errorHandler.ts, validate.ts
   - `backend/src/routes/auth.ts` — Full auth routes (login, register, refresh, me)
   - `backend/src/routes/index.ts` — Mounts auth, has placeholders for other routes
   - `backend/src/services/AuthService.ts` — Complete JWT auth with bcrypt
   - `backend/src/seeds/index.ts` — Core seed runner (Main Workspace + sample boards)
   - `backend/src/seeds/medvista/` — MedVista seeds existed
   - `backend/src/seeds/trustguard/` — TrustGuard seeds existed
   - `backend/src/seeds/urbannest/` — UrbanNest seeds existed

3. **Pre-existing frontend** (`frontend/`):
   - Configured for TrustGuard (port 13003, package name, API token key)
   - But App.tsx/Sidebar referenced MedVista (cross-contamination from another agent)
   - Had complete component set: LoginPage, Sidebar, BoardPage, BoardTable, KanbanView, OverviewDashboard, AutomationsPanel, StatusBadge
   - Used: React 18, TypeScript, Tailwind CSS, Vite, lucide-react icons

### Design Decisions

1. **Separate frontend directory** (`/novapay/` not `/frontend/`):
   - The existing `/frontend/` was already used by TrustGuard (port 13003)
   - Each industry gets its own frontend instance per the architecture spec
   - NovaPay at `/novapay/` with port 13001, consistent with the 13001-13010 port range

2. **Import from models index** (not individual model files):
   - All seed files use `import { Item, ColumnValue } from '../../models'` 
   - This ensures Sequelize associations (hasMany, belongsTo) are loaded
   - Individual model imports skip associations → broken eager loading

3. **Standalone seed runner**:
   - `novapay/index.ts` can run standalone via `npx ts-node src/seeds/novapay/index.ts`
   - Also exportable for the core seed runner to import
   - Does NOT modify the core `seeds/index.ts` file

4. **Column values stored as raw values** (not wrapped objects):
   - Merchant name: `value: "ShopWave Inc"` (string)
   - Amount: `value: 1500.00` (number)
   - Status: `value: "Settled"` (string matching status option label)
   - Risk score: `value: 42` (number)
   - This matches what the frontend cell renderer expects

5. **Transaction generation is pseudo-random**:
   - Uses `Math.random()` not a seeded PRNG
   - Each seed run produces slightly different transaction data
   - Merchant distribution is deterministic (round-robin across active merchants)
   - Card type distribution uses weighted random (40% Visa, 30% MC, etc.)

6. **Dashboard KPIs are FinTech-specific**:
   - Transaction Volume (sum of amounts)
   - Settlement Rate (% settled / total)
   - Fraud Rate (% disputed / total)
   - Active Merchants (count of API Active status)
   - These differ from MedVista's healthcare KPIs (patients, appointments, claims)

### File-by-File Implementation Notes

#### `workspace.ts`
- Creates workspace with NovaPay branding in settings JSONB
- 8 users with realistic names (diverse backgrounds)
- Returns `NovaPayContext` with all user IDs for downstream seeds
- Password hash uses bcrypt with 12 rounds (matching AuthService)

#### `boards.ts`
- Each `createXxxBoard()` function returns `BoardContext` = { boardId, groups, columns }
- Groups and columns stored as `Record<string, number>` (name → ID)
- Creates BoardView entries for each board (table default + kanban where applicable)
- Column configs use the exact JSONB schema from CRM-MASTER-PLAN.md

#### `merchants.ts`
- 75 merchants as hardcoded arrays (not generated) for realistic company names
- Each has: name, company (legal name), industry, status, risk, notes, monthlyVolume, email, setupDate
- Status distribution: ~60 API Active, ~5 KYC stages, ~3 Contract Signed, ~3 Submitted, 1 Rejected
- Monthly volumes range: $45K (Vintage Vinyl) to $1.85M (Metro Mart)
- Risk levels: ~55 Low, ~15 Medium, ~5 High
- Account managers assigned round-robin across manager, analyst, user

#### `transactions.ts`
- Generated dynamically from active merchants
- Amount ranges scaled by merchant monthly volume (higher volume = higher max amount)
- MCC codes mapped by industry (e.g., 5812 for food service, 5734 for SaaS)
- Risk scores correlated with status and merchant risk level
- Transaction IDs: TXN-010000 through TXN-010199
- Dates spread across last 90 days

#### `compliance.ts`
- 15 hand-written cases with detailed, realistic investigation notes
- Each case has: requirement, status, dueDate, caseType, priority, notes, merchantRef, group
- Case IDs: CMP-01001 through CMP-01015
- Assigned to compliance officer, risk analyst, and manager (round-robin)
- Dates: mix of past (complete), current (in progress), future (pending), and overdue

#### `automations.ts`
- 5 rules using existing Automation model trigger/action types
- triggerConfig and actionConfig use JSONB with descriptive fields
- All automations created as active (isActive: true)
- Templates reference column IDs from board context

### Existing Model Schema Summary (for reference)

Models use INTEGER auto-increment IDs (not UUID). Key fields:

```
User:        id, email, passwordHash, firstName, lastName, avatar, workspaceId, role, isActive
Workspace:   id, name, slug, description, settings(JSONB), createdBy
Board:       id, name, description, workspaceId, createdBy, boardType, isTemplate, settings(JSONB)
BoardGroup:  id, boardId, name, color, position, isCollapsed
Item:        id, boardId, groupId, name, position, createdBy
Column:      id, boardId, name, columnType(ENUM), config(JSONB), position, width, isRequired
ColumnValue: id, itemId, columnId, value(JSONB) — unique on (item_id, column_id)
BoardView:   id, boardId, name, viewType(ENUM), settings(JSONB), layoutJson, isDefault, createdBy
Automation:  id, boardId, name, triggerType(ENUM), triggerConfig(JSONB), actionType(ENUM), actionConfig(JSONB), isActive, createdBy
```

All models use: timestamps(true), underscored(true), paranoid(true/false for soft delete)

### Cross-Agent Coordination Notes

- **Agent 02 (MedVista)** created backend routes, services, and the server. Those routes are needed for NovaPay frontend to work.
- **Agent 03 (TrustGuard)** built the existing `/frontend/` directory. NovaPay has its own at `/novapay/`.
- The core `seeds/index.ts` DESTROYS all data before creating Main Workspace. Industry seeds must run AFTER core seeds.
- Each frontend uses a unique localStorage key for auth tokens to prevent cross-contamination.
- All industries share the same PostgreSQL database and core API at port 13000.
