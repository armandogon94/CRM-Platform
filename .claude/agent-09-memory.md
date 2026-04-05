# Agent 09 — TableSync CRM (Restaurant Hospitality)

## Identity
- **Agent Number:** 9
- **Project:** 13-CRM-Platform
- **Industry Client:** TableSync — Restaurant/Hospitality
- **Brand Color:** #9F1239 (Burgundy/Wine Red)
- **Frontend Port:** 13008
- **Session Date:** 2026-04-02

---

## What Was Accomplished

### Backend Seed Data (COMPLETED - All files created and verified)

All seed files live at: `backend/src/seeds/tablesync/`

| File | Records | Status |
|------|---------|--------|
| `workspace.ts` | 1 workspace + 10 users | DONE |
| `boards.ts` | 3 board templates with columns/groups/views | DONE |
| `reservations-data.ts` | 100 reservation records | DONE |
| `menu-data.ts` | 70 menu items (18 appetizers, 24 entrees, 14 desserts, 14 beverages) | DONE |
| `staff-data.ts` | 50 staff schedule records | DONE |
| `automations.ts` | 4 automation rules | DONE |
| `index.ts` | Orchestrator (standalone runnable) | DONE |

### Workspace Users (10 total)
| Email | Name | Role |
|-------|------|------|
| admin@tablesync.com | Marco DeLuca | admin |
| gm@tablesync.com | Sofia Ramirez | admin |
| host@tablesync.com | Aiden Park | member |
| chef@tablesync.com | Isabella Moretti | member |
| souschef@tablesync.com | Kenji Tanaka | member |
| bar@tablesync.com | Olivia Chen | member |
| serverlead@tablesync.com | Daniel Okafor | member |
| events@tablesync.com | Carmen Vasquez | member |
| staff@tablesync.com | Liam Torres | member |
| viewer@tablesync.com | Natalie Kim | viewer |

### Board Templates (3)

1. **Reservation Board** — 6 columns (Guest Name/Person, Status/6-option, Party Size/Number, Reservation Time/Date+time, Table/Dropdown 1-20, Special Notes/LongText), 6 groups, 3 views (Table, Kanban, Calendar)
2. **Menu Management** — 6 columns (Dish Name/Text, Category/Dropdown 4-option, Price/Currency, Available/Checkbox, Ingredients/LongText, Photo/Files), 4 groups, 2 views (Table, Kanban)
3. **Staff Schedule** — 6 columns (Staff Member/Person, Role/Dropdown 5-option, Shift Date/Date, Start Time/Date+time, End Time/Date+time, Status/4-option), 4 groups, 3 views (Table, Calendar, Kanban by Role)

### Automations (4)
1. **Reservation Confirmation** — Status Requested→Confirmed triggers email+SMS
2. **Table Ready Alert** — 30 min before reservation time, notify host
3. **Staff Shift Reminder** — 2 hours before shift start, send reminder
4. **Post-Service Follow-Up** — Status→Completed triggers feedback survey email (60 min delay)

### Docker Compose
- Added `tablesync-frontend` service on port 13008 in `docker-compose.yml`

---

## Frontend Branding Status: OVERWRITTEN BY ANOTHER AGENT

**IMPORTANT:** After I completed all TableSync frontend branding (Sidebar, LoginPage, OverviewDashboard, App.tsx, tailwind.config.js, globals.css, vite.config.ts), another agent (likely CraneStack/construction agent) overwrote all frontend files with their own branding. The current state of the shared `frontend/` directory is:

- **Current branding:** CraneStack Construction (NOT TableSync)
- **Current vite port:** 13001 (was 13008 when I set it)
- **Current tailwind:** Uses CSS variable approach (`var(--brand-primary)`) — different from the numeric palette I set
- **Current LoginPage:** admin@cranestack.com
- **Current Sidebar:** CraneStack with HardHat icon
- **Current OverviewDashboard:** Construction-themed (Project Pipeline, Equipment Tracker, etc.)
- **Current App.tsx:** Completely rewritten with React Router (Routes/Route pattern) — different from the original single-page layout

### What Needs to Be Done to Restore TableSync Frontend

The frontend directory is SHARED between industry instances. Two approaches:

**Option A (Recommended):** Create a dedicated `frontends/tablesync/` directory (like `frontends/medvista/` exists) with TableSync-specific frontend code. This is the pattern the project already uses for medvista.

**Option B:** Use environment variables to make the shared frontend dynamically brand itself. The current CSS variable approach in globals.css (`--brand-primary`, etc.) supports this — each docker service could inject different CSS variables.

### TableSync Frontend Branding Spec (to re-apply)
- **Brand color palette (rose/burgundy):**
  - 50: #FFF1F2, 100: #FFE4E6, 200: #FECDD3, 300: #FDA4AF
  - 400: #FB7185, 500: #F43F5E, 600: #E11D48, 700: #BE123C
  - 800: #9F1239 (primary), 900: #881337
- **CSS Variables:** --brand-primary: #9F1239, --brand-secondary: #881337, --brand-accent: #FB7185
- **Vite port:** 13008
- **Sidebar:** Logo "TS", Title "TableSync", Subtitle "Restaurant Management", Icons: CalendarClock, UtensilsCrossed, Users
- **Login:** UtensilsCrossed icon, "TableSync", "Restaurant Reservation & Management", admin@tablesync.com / demo123
- **Dashboard boards:** Reservation Board, Menu Management, Staff Schedule
- **Dashboard stats:** Confirmed Reservations, Currently Seated, Staff On Schedule, No-Shows, 20 Active Tables

---

## Key Architecture Notes

- The CRM platform uses a single shared backend (port 13000) with industry-specific seeds
- Each industry gets its own frontend instance on a unique port (13001-13010)
- The existing pattern uses `frontends/<industry>/` directories (see medvista)
- Seed data runs standalone: `npx ts-node src/seeds/tablesync/index.ts`
- Default password for all demo users: `demo123`
- Models use Sequelize ORM, EAV pattern for column values (JSONB)
- 15 column types supported, 8 view types
- Automations use trigger/action pattern with JSONB configs

## Files I Created
```
backend/src/seeds/tablesync/
├── index.ts          (orchestrator)
├── workspace.ts      (workspace + 10 users)
├── boards.ts         (3 board templates)
├── reservations-data.ts  (100 records)
├── menu-data.ts      (70 records)
├── staff-data.ts     (50 records)
└── automations.ts    (4 rules)
```

## Files I Modified (later overwritten by other agents)
```
frontend/tailwind.config.js       → OVERWRITTEN (now CraneStack)
frontend/src/styles/globals.css   → OVERWRITTEN (now CraneStack)
frontend/vite.config.ts           → OVERWRITTEN (now port 13001)
frontend/src/App.tsx              → OVERWRITTEN (now React Router)
frontend/src/components/Sidebar.tsx         → OVERWRITTEN (now CraneStack)
frontend/src/components/LoginPage.tsx       → OVERWRITTEN (now CraneStack)
frontend/src/components/OverviewDashboard.tsx → OVERWRITTEN (now CraneStack)
docker-compose.yml                → tablesync-frontend service ADDED (may still be present)
```
