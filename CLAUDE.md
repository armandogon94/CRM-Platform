# CLAUDE.md — CRM Platform (Project 13)

> **Port allocation:** See [PORTS.md](PORTS.md) before changing any docker-compose ports. The 13xxx range is reserved exclusively for this project. All other port ranges belong to other projects.

## Project Overview

High-fidelity Monday.com-inspired CRM with a fully dynamic **Entity-Attribute-Value (EAV) system** for 10 vertically-integrated industries. Multi-tenant, real-time collaboration, 8 board views, visual automations, and pre-built templates. Serves FinTech, Healthcare, Insurance, Real Estate, Logistics, Dental, Legal, Hospitality, Construction, and Education sectors.

---

## Git Commit Rules

CRITICAL: Follow these rules on every commit.

```
- Commit as Armando Gonzalez (armandogon94@gmail.com)
- Do NOT add "Co-Authored-By: Claude" or any AI co-author credits
- Use conventional commit messages: feat:, fix:, refactor:, docs:, test:, chore:
- Keep commits atomic (one logical change per commit)
```

---

## Required Reading (in order)

**Read ALL plan files before writing code.** They contain architecture specs, EAV schemas, automation templates, and implementation-ready code examples.

| # | Document | Purpose |
|---|----------|---------|
| 1 | **CRM-MASTER-PLAN.md** | Core architecture, tech stack, EAV system (15 types), 8 board views, port allocation, database schema |
| 2 | **INDUSTRY-BRANDING-CONTEXT.md** | 10 companies, brand colors, user roles, demo data specs, cross-platform consistency |
| 3 | **RALPH-LOOP-CONFIG.md** | 5-pass QA framework: functional, security, performance, reference comparison, code review |
| 4 | **CALENDAR-SYNC-API-SPEC.md** | Bidirectional calendar sync between CRM and ERP, webhook + polling fallback |
| 5 | **CLAUDE-CODE-INSTANCE-PROMPTS-13.md** | 11 agent prompts: 1 core + 10 industry, scope definitions, deliverables |
| 6 | **PROMPTS-INDEX.md** | Master index of all agent prompts |

**Agent Memory** (in `.claude/agents/`): Deliverables, scratchpads, and progress from agents 1-10.

---

## Tech Stack

| Component | Technology | Notes |
|-----------|-----------|-------|
| **Frontend** | React 18 + TypeScript + Vite + Tailwind | Hooks, Context API, Socket.io client |
| **Backend** | Node.js 20 + Express + Sequelize | RESTful API, WebSocket, middleware stack |
| **Database** | PostgreSQL 15+ | Multi-tenant, EAV backbone, soft deletes |
| **Real-Time** | Socket.io | Live board updates, item changes, notifications |
| **Auth** | JWT (HS256) | 1-hour access, 7-day refresh, HttpOnly cookies |
| **File Storage** | Local disk (dev) / S3 (prod) | 10 MB file limit, 500 MB workspace limit |
| **Container** | Docker Compose | Local dev, volumes for DB + uploads |
| **Code Quality** | TypeScript, ESLint, Prettier | Strict mode enforced |
| **Testing** | Jest + React Testing Library | Unit, integration, E2E |

---

## The 10 Industries

| # | Company | Sector | Brand Color | FE Port | API Port |
|---|---------|--------|-------------|---------|----------|
| 1 | NovaPay | FinTech | #2563EB | 13001 | 13101 |
| 2 | MedVista | Healthcare | #059669 | 13002 | 13102 |
| 3 | TrustGuard | Insurance | #1E3A5F | 13003 | 13103 |
| 4 | UrbanNest | Real Estate | #D97706 | 13004 | 13104 |
| 5 | SwiftRoute | Logistics | #7C3AED | 13005 | 13105 |
| 6 | DentaFlow | Dental | #06B6D4 | 13006 | 13106 |
| 7 | JurisPath | Legal | #166534 | 13007 | 13107 |
| 8 | TableSync | Hospitality | #9F1239 | 13008 | 13108 |
| 9 | CraneStack | Construction | #EA580C | 13009 | 13109 |
| 10 | EduPulse | Education | #6D28D9 | 13010 | 13110 |

---

## Agent Architecture

**11 agents total:** 1 core + 10 industry specialists.

- **Agent 1 (Core)**: Express backend, PostgreSQL schema, EAV engine, WebSocket, auth, shared utilities
- **Agents 2-11 (Industries 1-10)**: React frontends, industry templates, branded UI, demo data seeding, automations

Each industry agent manages its own branded frontend, pre-built templates (3-5 per industry), and demo data (50-100 records).

---

## Key Features

- **15 Column Types**: Status, Text, LongText, Number, Date, Person, Email, Phone, Dropdown, Checkbox, URL, Files, Formula, Timeline, Rating
- **8 Board Views**: Table, Kanban, Calendar, Timeline/Gantt, Dashboard, Map, Chart, Form
- **EAV System**: Runtime-configurable columns, no schema migrations needed
- **Real-Time Updates**: WebSocket for live item changes, notifications, board sync
- **Visual Automations**: 10-15 trigger/action templates (email, Slack, webhooks)
- **Board Templates**: 3-5 industry-specific templates per company (pre-seeded)
- **Rich Demo Data**: 50-100 records per industry with realistic workflows
- **Multi-Tenant**: JWT auth, workspace isolation, RBAC
- **Default User**: admin / admin

---

## Port Allocation (13xxx Range)

| Service | Port | Purpose |
|---------|------|---------|
| Core CRM API | 13000 | Express backend, all industries share |
| NovaPay FE | 13001 | React frontend (FinTech) |
| MedVista FE | 13002 | React frontend (Healthcare) |
| TrustGuard FE | 13003 | React frontend (Insurance) |
| UrbanNest FE | 13004 | React frontend (Real Estate) |
| SwiftRoute FE | 13005 | React frontend (Logistics) |
| DentaFlow FE | 13006 | React frontend (Dental) |
| JurisPath FE | 13007 | React frontend (Legal) |
| TableSync FE | 13008 | React frontend (Hospitality) |
| CraneStack FE | 13009 | React frontend (Construction) |
| EduPulse FE | 13010 | React frontend (Education) |
| Industry APIs | 13101-13110 | Scaled API instances (optional) |
| PostgreSQL | 5432 | Database |

---

## Quality Standards

**5-Pass Ralph Loop** (after every feature):

1. **Functional Pass**: Feature works as specified, no regressions
2. **Security Pass**: No SQL injection, XSS, auth bypasses, secrets in code
3. **Performance Pass**: Load times under 3s, queries optimized, bundle < 500KB
4. **Reference Comparison**: Output matches Monday.com conventions
5. **Code Review**: TypeScript strict, ESLint clean, tests pass, naming consistent

---

## Project Structure

`backend/` (Express API) → `src/` with middleware, routes, controllers, models (Sequelize), services (EAV engine, automations, WebSocket), migrations, seeds, utils. `frontend/` (Core React) → components, context, pages, hooks, styles. `frontends/` → 10 industry-branded apps (novapay through edupulse). `plans/` → Architecture docs. `.claude/` → Agent memories + API schema.

---

## Important Conventions

- **EAV Pattern**: All column values stored in `column_values` table with JSON serialization
- **Multi-Tenant**: Workspace ID in every query, row-level security at DB layer
- **WebSocket Events**: item:created, item:updated, column:changed, board:sync (broadcast to workspace subscribers)
- **Auth**: JWT in Authorization header, refresh token in HttpOnly cookie, 1-hour access expiry
- **Soft Deletes**: All tables have `deleted_at` timestamp, queries filter WHERE deleted_at IS NULL
- **Timestamps**: created_at, updated_at, deleted_at (ISO 8601), created_by, updated_by (user_id)

---

## Key Commands

```bash
make dev              # Start all services (Docker Compose up)
make seed             # Seed demo data for all industries
make seed:INDUSTRY    # Seed single industry (e.g., make seed:novapay)
make test             # Run Jest + React Testing Library
make build            # Build frontend + backend production bundles
make lint             # ESLint + TypeScript strict check
make ralph            # Run 5-pass Ralph Loop QA
make clean            # Stop containers, prune volumes
make logs:backend     # Tail backend logs
make logs:postgres    # Tail database logs
```

---

## API Base URL & Auth

```
Base: http://localhost:13000/api/v1
Default user: admin@crm-platform.com / admin
Auth header: Authorization: Bearer {accessToken}
WebSocket: ws://localhost:13000/socket.io
```

See `.claude/API_SCHEMA.md` for complete endpoint reference.

**Status**: Locked-in design phase. Core platform ready for agent implementation.

**Last Updated**: 2026-04-02
