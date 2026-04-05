# Agent 01 — NovaPay CRM (FinTech) Memory

## Agent Identity
- **Agent Number**: 1
- **Industry**: NovaPay — Digital Payment Processing & FinTech
- **Brand Color**: #2563EB (Electric Blue)
- **Secondary Color**: #1E40AF (Dark Blue)
- **Accent Color**: #60A5FA (Light Blue)
- **Frontend Port**: 13001
- **API Port**: 13101 (optional, uses shared core API at 13000)
- **Model**: Claude Opus 4.6 (1M context)
- **Session Date**: 2026-04-02
- **Status**: Phase 1 & Phase 2 COMPLETE. Phase 3 (QA) pending.

---

## What Was Done (Complete)

### 1. Backend Seed Data (`backend/src/seeds/novapay/` — 7 files)

| File | Purpose | Key Details |
|------|---------|-------------|
| `workspace.ts` | Creates NovaPay workspace + 8 users | Exports `NovaPayContext` interface with all user IDs |
| `boards.ts` | Creates 3 boards with columns, groups, views | Exports `NovaPayBoards` and `BoardContext` interfaces |
| `merchants.ts` | 75 merchant records on Merchant Onboarding board | 20 e-commerce, 18 retail, 15 SaaS, 12 food service, 10 other |
| `transactions.ts` | 200 transaction records on Transaction Pipeline board | 180 settled/processing, 12 failed, 8 disputed |
| `compliance.ts` | 15 compliance cases on Compliance & Regulatory board | 8 KYC, 4 AML, 3 fraud investigations |
| `automations.ts` | 5 automation rules across boards | Risk alerts, settlement notifications, compliance reminders |
| `index.ts` | Seed orchestrator | Runnable standalone: `npx ts-node src/seeds/novapay/index.ts` |

**IMPORTANT**: All seed files import from `../../models` (the index with associations), NOT from individual model files. This ensures Sequelize associations are loaded.

### 2. NovaPay Frontend (`novapay/` — 22 files)

Complete Vite + React 18 + TypeScript + Tailwind CSS app at port 13001.

| File/Dir | Purpose |
|----------|---------|
| `package.json` | `@crm-platform/novapay-frontend`, scripts use --port 13001 |
| `vite.config.ts` | Port 13001, proxies `/api` to `http://localhost:13000` |
| `tailwind.config.js` | Brand color palette based on #2563EB |
| `index.html` | Title: "NovaPay CRM — Digital Payment Processing" |
| `src/App.tsx` | Main app with overview, board, and automations views |
| `src/main.tsx` | Entry point with AuthProvider |
| `src/context/AuthContext.tsx` | JWT auth with localStorage (`novapay_token` key) |
| `src/utils/api.ts` | API client, token stored as `novapay_token` |
| `src/styles/globals.css` | CSS variables: `--brand-primary: #2563EB` |
| `src/types/index.ts` | TypeScript interfaces for Board, Item, Column, etc. |
| `src/components/LoginPage.tsx` | NovaPay branded, defaults to admin@novapay.com |
| `src/components/Sidebar.tsx` | NovaPay logo "N", "Digital Payment Processing" tagline |
| `src/components/OverviewDashboard.tsx` | **FinTech KPIs**: Transaction Volume, Settlement Rate, Fraud Rate, Active Merchants |
| `src/components/BoardPage.tsx` | Table + Kanban view toggle with search/filter |
| `src/components/BoardTable.tsx` | Grouped table view with cell rendering for all column types |
| `src/components/KanbanView.tsx` | Status-based kanban with currency display on cards |
| `src/components/AutomationsPanel.tsx` | Lists automation rules with test triggers |
| `src/components/StatusBadge.tsx` | Reusable colored status badge component |
| `Dockerfile` | Multi-stage build → nginx static serving |

### 3. What Was NOT Modified (Core Platform Code)

I did NOT modify any of these pre-existing files:
- `backend/src/models/*` — All 14 models already existed
- `backend/src/models/index.ts` — Associations already defined
- `backend/src/config/database.ts` — Sequelize config
- `backend/src/config/index.ts` — App config
- `backend/src/middleware/*` — Auth, RBAC, error handling, validation
- `backend/src/routes/*` — Auth routes, route index
- `backend/src/services/AuthService.ts` — JWT auth service
- `backend/src/seeds/index.ts` — Core seed runner (creates Main Workspace)
- `frontend/*` — Shared/TrustGuard frontend (port 13003)
- `docker-compose.yml` — PostgreSQL + Redis + Backend orchestration

---

## Board Schema Reference

### Board 1: Transaction Pipeline

**Groups**: Pending Transactions, Processing, Settled, Failed / Declined, Disputed

**Columns** (8):
| # | Name | Type | Width | Config Notes |
|---|------|------|-------|-------------|
| 0 | Status | status | 140 | Pending, Processing, Settled, Failed, Disputed |
| 1 | Amount | number | 120 | format: currency, USD |
| 2 | Merchant | text | 180 | Merchant name reference |
| 3 | Transaction Date | date | 140 | include_time: true |
| 4 | Settlement Status | dropdown | 160 | Batch Pending, Settled, On Hold |
| 5 | Risk Score | number | 110 | 0-100 scale |
| 6 | Card Type | dropdown | 120 | Visa, Mastercard, Amex, Discover, ACH |
| 7 | MCC | text | 100 | Merchant Category Code |

**Views**: Main Table (default), Status Board (kanban)

### Board 2: Merchant Onboarding

**Groups**: Submitted, KYC In Progress, KYC Verified, Contract Signed, API Active, Rejected

**Columns** (9):
| # | Name | Type | Width | Config Notes |
|---|------|------|-------|-------------|
| 0 | Company Name | text | 200 | required |
| 1 | Application Status | status | 160 | 6 status options matching groups |
| 2 | Risk Assessment | dropdown | 140 | Low, Medium, High |
| 3 | Compliance Notes | long_text | 250 | |
| 4 | Setup Date | date | 130 | include_time: false |
| 5 | Monthly Volume | number | 150 | format: currency, USD |
| 6 | Industry | dropdown | 140 | E-Commerce, Retail, SaaS, Food Service, Healthcare, Travel, Other |
| 7 | Contact Email | email | 180 | |
| 8 | Account Manager | person | 150 | |

**Views**: Main Table (default), Onboarding Pipeline (kanban)

### Board 3: Compliance & Regulatory

**Groups**: KYC Reviews, AML Investigations, Fraud Cases, Regulatory Filings

**Columns** (8):
| # | Name | Type | Width | Config Notes |
|---|------|------|-------|-------------|
| 0 | Requirement | text | 220 | required |
| 1 | Status | status | 140 | Pending, In Progress, Complete, Overdue |
| 2 | Due Date | date | 130 | include_time: false |
| 3 | Assigned To | person | 150 | |
| 4 | Notes | long_text | 300 | |
| 5 | Case Type | dropdown | 140 | KYC, AML, Fraud, PCI-DSS, Regulatory |
| 6 | Priority | dropdown | 120 | Critical, High, Medium, Low |
| 7 | Merchant Reference | text | 160 | |

**Views**: Main Table (default)

---

## Automation Rules (5)

| # | Name | Board | Trigger | Action |
|---|------|-------|---------|--------|
| 1 | High-Risk Transaction Alert | Transaction Pipeline | Risk Score > 80 | Slack notification to risk analyst + compliance officer |
| 2 | Settlement Completion | Transaction Pipeline | Status → Settled | Email to account manager |
| 3 | Compliance Review Reminder | Compliance & Regulatory | Due date within 7 days | In-app notification to compliance officer |
| 4 | KYC Status Change | Merchant Onboarding | Status → KYC Verified | Create activity + append note |
| 5 | Fraud Alert Escalation | Transaction Pipeline | Status → Disputed | Slack notification + create compliance case |

---

## User Accounts (8)

| Email | Name | Role | Purpose |
|-------|------|------|---------|
| admin@novapay.com | Sarah Chen | admin | System administrator |
| ceo@novapay.com | Marcus Rivera | admin | Executive dashboards |
| manager@novapay.com | James Park | member | Department manager, account manager |
| analyst@novapay.com | Priya Sharma | member | Risk/data analyst |
| user@novapay.com | Alex Thompson | member | Regular employee |
| viewer@novapay.com | Emily Nakamura | viewer | Read-only guest |
| compliance@novapay.com | David Okafor | member | Compliance officer |
| risk@novapay.com | Lisa Gonzalez | member | Risk analyst |

**All passwords**: `demo123`

---

## Data Distribution

### Merchants (75 total)
- **E-Commerce (20)**: ShopWave, LuxeCart, GadgetVault, PetPalace, FreshThreads, BookNest, HomeHaven, VitaBoost, PixelPrint, ToyTrove, GreenGrocer, StyleVerse, TechDirect, ArtisanAlley, SneakerDrop, CleanHome, WineSelect, FitGear Pro, BabyBloom, OutdoorEdge
- **Retail (18)**: Metro Mart, UrbanWear, QuickStop, GreenLeaf Pharmacy, AutoParts Plus, Bloom Florals, SportZone, BrightSmile, PawsNClaws, TileWorld, Vintage Vinyl, LuxeJewels, FreshBake, KidZone, EcoMart, GoldenHarvest, TechHub, CraftCorner
- **SaaS (15)**: CloudSync, DataViz Labs, TaskFlow, SecureAuth360, MailPulse, HRNexus, ShipTrack, ChatBot AI, InvoiceNinja, FormStack Pro, CodeDeploy, LegalDocs AI, SurveyHero, ScheduleEase, PixelForge
- **Food Service (12)**: Bella Cucina, Dragon Wok, Sunrise Bakery, TacoFiesta, Burger Barn, SeaBreeze, GreenBowl, PizzaForge, SipNBrew, Noodle House, Smokehouse BBQ, CrispLeaf
- **Other (10)**: SwiftCab, WellnessFirst, TravelBee, ParkEase, TutorConnect, GymForge, EventSpark, LaundryNow, VetCare Plus, CharityBridge (rejected)

### Transactions (200 total)
- 180 successful (70% Settled, 30% Processing)
- 12 failed/declined (risk score 40-80)
- 8 disputed (risk score 70-100)
- Amount range: $10–$50,000
- Card distribution: 40% Visa, 30% Mastercard, 12% Amex, 8% Discover, 10% ACH
- Date range: last 90 days

### Compliance Cases (15 total)
- 8 KYC reviews (3 In Progress, 2 Complete, 1 Pending, 1 Overdue, 1 In Progress)
- 4 AML investigations (2 In Progress, 1 Pending, 1 Complete)
- 3 Fraud cases (2 In Progress, 1 Complete)

---

## Dependencies & Integration Points

### Depends On
- **Core Platform API** at port 13000 — all API calls proxy through Vite
- **PostgreSQL** at port 5432 — database `crm_platform`, user `crm_admin`
- **Sequelize models** in `backend/src/models/` with associations in `index.ts`
- **Auth system** — JWT tokens via `backend/src/services/AuthService.ts`

### Does NOT Depend On
- Redis (optional, not required for seeds or frontend)
- Other industry frontends (each is independent)

### Running NovaPay

```bash
# 1. Start database (requires Docker)
cd 13-CRM-Platform && docker compose up -d postgres

# 2. Sync database schema
cd backend && npx ts-node -e "import('./src/models').then(m => m.sequelize.sync())"

# 3. Run core seeds (creates Main Workspace)
npm run seed

# 4. Run NovaPay seeds
npx ts-node src/seeds/novapay/index.ts

# 5. Start backend API
npm run dev

# 6. Start NovaPay frontend (in separate terminal)
cd ../novapay && npm install && npm run dev
# → Opens at http://localhost:13001
```

---

## What's Left (Phase 3: QA + Testing)

- [ ] Verify all 3 board templates load without errors in browser
- [ ] Verify seed data appears correctly (dates sensible, amounts reasonable)
- [ ] Test automations execute on manual trigger
- [ ] Verify brand colors render correctly (#2563EB throughout)
- [ ] Run Ralph Loop Pass 1 (Functional Correctness)
- [ ] Run Ralph Loop Pass 2 (Security Audit)
- [ ] No seed data conflicts with other industries (NovaPay uses unique workspace slug "novapay")

---

## Known Issues / Notes

1. **Core seed runner** (`backend/src/seeds/index.ts`) clears ALL data before seeding the Main Workspace. Running it AFTER NovaPay seeds would wipe NovaPay data. Run core seeds FIRST, then NovaPay.
2. **Routes for boards/items** — The core platform routes are partially implemented (auth only). Agent 02 (MedVista) added flat convenience routes. NovaPay frontend expects these same flat routes (`/boards?workspaceId=X`, `/boards/:id/items`, etc.). If these routes don't exist in the backend, the frontend will show empty boards.
3. **Model associations** — Must import from `../../models` (the index), not individual model files, to ensure associations are loaded before queries.
4. **Frontend localStorage key** — NovaPay uses `novapay_token`, TrustGuard uses `trustguard_token`. This prevents cross-contamination between industry frontends on the same browser.
