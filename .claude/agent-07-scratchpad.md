# Agent 07 — JurisPath Scratchpad

## Session Date: 2026-04-02

---

## Files Created (Complete List)

### Backend: `13-CRM-Platform/backend/src/seeds/jurispath/`
1. `workspace.ts` — JurisPathContext interface, 28 users, workspace with brandColor #166534
2. `boards.ts` — JurisPathBoards/BoardContext interfaces, 3 boards with groups/columns/views
3. `cases.ts` — 60 cases: 20 litigation, 20 corporate, 12 IP, 8 other (closed)
4. `clients.ts` — 100 clients: 35 corporate, 35 litigation, 30 IP (ALL_CLIENTS export)
5. `invoices.ts` — 50 invoices: 8 draft, 15 sent, 20 paid, 7 overdue
6. `automations.ts` — 4 rules (due diligence, invoice reminder, conflict check, case closure)
7. `index.ts` — seedJurisPath() orchestrator with standalone runner

### Frontend: `13-CRM-Platform/frontends/jurispath/`
8. `package.json` — @crm-platform/jurispath-frontend, port 13007
9. `index.html` — theme-color #166534, title "JurisPath CRM"
10. `vite.config.ts` — port 13007, /api proxy to localhost:13000
11. `tailwind.config.js` — brand color palette (50-900) based on #166534
12. `tsconfig.json` — ES2020, bundler module resolution, @/* alias
13. `postcss.config.js` — tailwindcss + autoprefixer
14. `Dockerfile` — dev/build/prod stages, port 13007
15. `src/main.tsx` — React entry with AuthProvider
16. `src/vite-env.d.ts` — Vite types reference
17. `src/styles/globals.css` — CSS vars (#166534), btn-primary, card, status-badge
18. `src/types/index.ts` — Full TypeScript interfaces (User, Board, Item, etc.)
19. `src/utils/api.ts` — API client with jurispath_token localStorage key
20. `src/context/AuthContext.tsx` — Auth state management
21. `src/hooks/useBoards.ts` — useBoards/useBoard hooks
22. `src/App.tsx` — Main app with "Loading JurisPath..." and "JurisPath boards" text
23. `src/components/LoginPage.tsx` — Scale icon, admin@jurispath.com default
24. `src/components/Sidebar.tsx` — "J" logo, Briefcase/UserPlus/Receipt icons
25. `src/components/OverviewDashboard.tsx` — Legal-specific: case pipeline, intake, billing
26. `src/components/BoardPage.tsx` — Table/Kanban toggle (shared pattern)
27. `src/components/BoardTable.tsx` — Grouped table with cell renderers (shared pattern)
28. `src/components/KanbanView.tsx` — Status-based kanban columns (shared pattern)
29. `src/components/AutomationsPanel.tsx` — Automation cards with test button (shared pattern)
30. `src/components/StatusBadge.tsx` — Colored status pills (shared pattern)

### Modified Files
31. `13-CRM-Platform/backend/src/seeds/index.ts` — Added JurisPath import + call (lines 602, 616)

---

## Board Schema Details

### Board 1: Case Management
**Groups**: Intake, Discovery, Motions, Trial, Closed
**Columns**:
- Status (status) — Intake/Discovery/Motions/Trial/Closed
- Client (person)
- Lead Attorney (person)
- Case Type (dropdown) — Litigation/Corporate/IP/Other
- Filing Date (date)
- Completion Date (date)
- Case Notes (long_text)
**Views**: Main Table, Case Pipeline (kanban)

### Board 2: Client Intake
**Groups**: Inquiry, Consultation, Engaged, Completed
**Columns**:
- Client Name (text, required)
- Contact Info (text)
- Matter Type (dropdown) — Litigation/Corporate/IP
- Status (status) — Inquiry/Consultation/Engaged/Completed
- Initial Consultation (date)
- Assigned Attorney (person)
- Intake Notes (long_text)
**Views**: Main Table, Intake Pipeline (kanban)

### Board 3: Billing Tracker
**Groups**: Draft, Sent, Paid, Overdue
**Columns**:
- Invoice Number (text, required)
- Client (text)
- Amount (number, currency USD)
- Hours (number, plain with 1 decimal)
- Status (status) — Draft/Sent/Paid/Overdue
- Due Date (date)
- Matter Reference (text)
- Billing Attorney (person)
**Views**: Main Table, Collections Board (kanban)

---

## Automation Details

### 1. Document Due Diligence — Phase Transition Tasks
- **Trigger**: on_status_changed on Case Management Status column
- **Action**: create_activity with phase-specific task lists
- **Notifies**: Managing Partner, Paralegal

### 2. Invoice Reminder — 30 Day Follow-Up
- **Trigger**: on_date_reached on Billing Tracker Due Date (when status=Sent)
- **Action**: send_notification (email) to Billing Manager
- **Auto-updates**: Status to Overdue after 30 days past due

### 3. Conflict Check — New Client Screening
- **Trigger**: on_item_created on Client Intake board
- **Action**: send_notification (in_app) to Admin, Managing Partner, Paralegal
- **Cross-references**: Case Management board for conflicts

### 4. Case Closure — Archive & Final Processing
- **Trigger**: on_status_changed on Case Management Status → Closed
- **Action**: send_notification (email) to Managing Partner, Billing Manager, Paralegal
- **Workflow**: Generate final invoice, archive files, send thank-you letter, update conflict DB

---

## User Roster (28 total)

### Admin & Leadership (2)
- admin@jurispath.com — Victoria Harrington (admin)
- managing.partner@jurispath.com — Robert Caldwell (admin)

### Partners (5)
- e.montague@jurispath.com — Eleanor Montague
- j.nakamura@jurispath.com — James Nakamura
- s.okafor@jurispath.com — Samuel Okafor
- d.reyes@jurispath.com — Diana Reyes
- m.chen@jurispath.com — Michael Chen

### Senior Associates (10)
- a.petrov, l.washington, k.tanaka, n.oconnor, r.gupta
- c.dubois, h.kim, t.morales, f.hassan, b.steiner

### Associates (8)
- j.martinez, e.wright, a.singh, p.novak
- s.blake, d.lee, o.torres, w.park

### Support (3)
- paralegal@jurispath.com — Grace Mitchell (member)
- billing@jurispath.com — Marcus Rivera (member)
- viewer@jurispath.com — Guest Viewer (viewer)

---

## Reference: Patterns Used

### Seed Pattern (from NovaPay reference)
```
workspace.ts → Context interface with user IDs
boards.ts → Board creation with groups, columns, views
[data].ts → Item + ColumnValue bulk creation
automations.ts → Automation model creation
index.ts → Orchestrator with timing
```

### Frontend Pattern (from MedVista reference)
```
Same component structure, swap:
- Brand name/icon/colors
- Board icon mapping
- Dashboard metrics (board-specific stat cards + progress bars)
- LocalStorage token key
- Port number
```

### Color Palette (Forest Green #166534)
```
50:  #F0FDF4    400: #4ADE80    800: #0F3D22
100: #DCFCE7    500: #22C55E    900: #052E16
200: #BBF7D0    600: #166534 ← PRIMARY
300: #86EFAC    700: #14532D
```

---

## Potential Follow-Up Work
1. Run `npm install` in `frontends/jurispath/`
2. Add port 13007 to CORS_ORIGINS in `backend/.env`
3. Add JurisPath service to `docker-compose.yml`
4. Run `npm run seed` to populate database
5. Run Ralph Loop Pass 1 & 2 for QA
6. Update `PORT-MAP.md` with port 13007 entry
