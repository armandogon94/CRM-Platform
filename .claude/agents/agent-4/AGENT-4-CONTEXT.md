# Agent 4 — Project Context & Architecture Reference

## Project 13 — CRM Platform Architecture

This is a Monday.com clone — a multi-tenant work-management platform. Each "industry vertical" gets its own workspace, boards, users, and branding.

### Tech Stack
- **Backend:** Express.js + TypeScript + Sequelize ORM + PostgreSQL 15
- **Frontend:** React 18 + TypeScript + TailwindCSS + Vite
- **Real-time:** Socket.io
- **Auth:** JWT (bcryptjs, 12 rounds)
- **Container:** Docker Compose (PostgreSQL + Redis + Backend)

### Core Data Model (EAV Pattern)
```
Workspace → Users
          → Boards → BoardGroups (swim lanes)
                   → Columns (column definitions with type + config JSON)
                   → Items (rows/cards)
                     → ColumnValues (one per item-column pair, value as JSON)
                   → BoardViews (table, kanban, calendar, timeline, etc.)
                   → Automations (trigger + action configs as JSON)
```

### Seed Data Pattern
Each industry creates its own directory under `backend/src/seeds/<name>/`:
- `workspace.ts` — Creates workspace + users, returns context object with IDs
- `boards.ts` — Creates boards, groups, columns, views; returns board context with IDs
- Data files — Create items and column values referencing board context
- `automations.ts` — Creates automation rules referencing board columns
- `index.ts` — Orchestrates all of the above in order

The context objects pass IDs down the chain so data files can reference the correct board/column/group IDs.

### Industry Verticals (Port Allocation)
```
13000  — Shared backend API
13001  — NovaPay (FinTech) #2563EB
13002  — MedVista (Healthcare) #059669
13003  — TrustGuard (Insurance) #1E3A5F
13004  — UrbanNest (Real Estate) #D97706  ← Agent 4
13005  — SwiftRoute (Logistics) #7C3AED
13006  — DentaFlow (Dental) #06B6D4
13007  — JurisPath (Legal) #166534
13008  — TableSync (Hospitality) #9F1239
13009  — CraneStack (Construction) #EA580C
13010  — EduPulse (Education) #6D28D9
```

### Key Model Files
- `backend/src/models/Board.ts` — boardType, isTemplate, settings (JSONB)
- `backend/src/models/Column.ts` — columnType enum (15 types), config (JSONB)
- `backend/src/models/ColumnValue.ts` — value (JSONB), item_id + column_id composite
- `backend/src/models/Automation.ts` — triggerType (5 types), actionType (8 types)
- `backend/src/models/BoardView.ts` — viewType enum (8 types), settings (JSONB)
- `backend/src/models/Workspace.ts` — settings (JSONB) for brand color, logo, etc.

### Column Types Available
status, text, long_text, number, date, person, email, phone, dropdown, checkbox, url, files, formula, timeline, rating

### Automation Trigger Types
on_item_created, on_item_updated, on_status_changed, on_date_reached, on_recurring

### Automation Action Types
send_email, send_notification, set_column_value, create_subitem, send_slack_message, create_activity, increment_number, update_status

### Frontend Shared Directory Issue
The `frontend/` directory at project root is shared among all agents. Each agent overwrites the branding. For persistent per-industry frontends, use `frontends/<name>/` (only medvista, dentaflow, swiftroute exist so far). UrbanNest's frontend branding was applied to the shared `frontend/` directory but may be overwritten.
