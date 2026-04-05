# CRM Master Plan — Project 13
## High-Fidelity Monday.com Clone Platform

**Version**: 1.0
**Created**: 2026-04-02
**Status**: Locked-In Design Phase
**Architecture**: React + Node.js/Express + PostgreSQL
**Deployment**: Docker Compose (Local Dev, 13xxx Port Range)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Design Locked-In Specifications](#design-locked-in-specifications)
3. [Industry Companies & Brand Colors](#industry-companies--brand-colors)
4. [Core Technical Architecture](#core-technical-architecture)
5. [Entity-Attribute-Value (EAV) System](#entity-attribute-value-eav-system)
6. [Database Schema](#database-schema)
7. [Board Views & Visualization System](#board-views--visualization-system)
8. [Automations Engine](#automations-engine)
9. [Project Structure](#project-structure)
10. [API Route Architecture](#api-route-architecture)
11. [Naming Conventions & Standards](#naming-conventions--standards)
12. [Development & Deployment](#development--deployment)
13. [Quality & Testing Standards](#quality--testing-standards)

---

## Executive Summary

**Project 13** is a high-fidelity Monday.com clone — a multi-tenant, work-management CRM platform built on React, Node.js, and PostgreSQL. The platform's core differentiator is a **runtime-configurable Entity-Attribute-Value (EAV) system** that allows users to create, customize, and manage unlimited column types (Status, Text, Number, Date, Person, Dropdown, Timeline, Files, Formulas, etc.) at runtime—exactly like Monday.com.

The platform serves **10 vertically-integrated industries** (Finance, Healthcare, Insurance, Real Estate, Logistics, Dental, Legal, Hospitality, Construction, Education), each with its own branded interface, pre-built board templates, and industry-specific automations. A central CRM Core platform agent manages the base architecture; 10 specialized industry agents handle vertical customization and demand.

**Key Features**:
- **EAV-Driven Dynamic Columns**: 15 column types, fully configurable per board
- **8 Board Views**: Table, Kanban, Calendar, Timeline/Gantt, Dashboard, Map, Chart, Form
- **Real-Time Collaboration**: WebSocket-powered live updates on items, columns, and views
- **Visual Automation Builder**: 10-15 trigger/action templates with email, Slack, webhooks
- **Rich Demo Data**: 50-100 records per industry across all entities
- **Multi-Tenant Auth**: JWT, admin/admin default user, workspace isolation
- **Industry Templates**: 3-5 pre-built board templates per industry (seed data)

---

## Design Locked-In Specifications

### Technology Stack
| Component | Technology | Notes |
|-----------|-----------|-------|
| **Frontend** | React 18 + TypeScript | Hooks, Context API, Vite build |
| **Backend** | Node.js 20 + Express | RESTful API + WebSocket |
| **Database** | PostgreSQL 15+ | Multi-tenant schema isolation |
| **ORM/Query** | Sequelize or Knex.js | Transaction support, migrations |
| **Real-Time** | Socket.io or ws | WebSocket for live board updates |
| **Caching** | Redis (optional) | Session store, real-time events |
| **Auth** | JWT (HS256/RS256) | 1-hour access, 7-day refresh tokens |
| **File Storage** | Local disk (dev) / S3 (prod) | Soft limits: 10 MB per file, 500 MB per workspace |
| **Container** | Docker + Docker Compose | Local dev environment |
| **Code Quality** | TypeScript, ESLint, Prettier | Enforce consistency |
| **Testing** | Jest + React Testing Library | Unit, integration, E2E |

### Default Authentication
- **Admin Credentials**: `admin` / `admin`
- **Default Workspace**: "Main Workspace" (workspace_id = 1)
- **Auth Model**: Login required on all pages (redirect to /auth/login)
- **Token Storage**: HttpOnly cookies (refresh) + localStorage (access)
- **Session Duration**: 1 hour access, 7 days refresh

### UI/UX Theme
- **Base Design**: Monday.com-style layout (white content + purple sidebar)
- **Sidebar Navigation**: White background, collapsible, logo + workspace switcher
- **Main Content Area**: Clean white canvas with board view
- **Accent Colors**: Per-company brand color palette (see Industry Companies section)
- **Typography**: Inter/Roboto, 14px base, hierarchy via weight + size
- **Spacing**: 8px grid system (Tailwind-compatible)

### Deployment
- **Local Dev Only**: Docker Compose
- **Port Allocation** (13xxx range):
  - Core CRM API: `13000`
  - Industry Frontends: `13001–13010` (one per industry)
  - Industry API Instances: `13101–13110` (scaled per industry)
- **Data Persistence**: Docker volumes for PostgreSQL, local disk for uploads
- **Environment**: `.env` file (gitignored) with DB creds, JWT secret, Redis URL, API keys

---

## Industry Companies & Brand Colors

The platform serves **10 vertically-integrated industries** with dedicated frontends, pre-built templates, and industry-specific automations:

| # | Company | Industry | Brand Color | Port FE | Port API | Primary Use Case |
|---|---------|----------|-------------|---------|----------|------------------|
| 1 | **NovaPay** | FinTech | #2563EB (Blue) | 13001 | 13101 | Transaction pipelines, merchant onboarding, compliance |
| 2 | **MedVista** | Healthcare | #059669 (Green) | 13002 | 13102 | Patient management, appointment scheduling, claims |
| 3 | **TrustGuard** | Insurance | #1E3A5F (Navy) | 13003 | 13103 | Claims processing, policy management, underwriting |
| 4 | **UrbanNest** | Real Estate | #D97706 (Amber) | 13004 | 13104 | Property listings, lead pipeline, showings |
| 5 | **SwiftRoute** | Logistics | #7C3AED (Purple) | 13005 | 13105 | Shipment tracking, fleet management, routes |
| 6 | **DentaFlow** | Dental Clinic | #06B6D4 (Cyan) | 13006 | 13106 | Patient pipeline, treatment plans, appointments |
| 7 | **JurisPath** | Legal Firm | #166534 (Forest Green) | 13007 | 13107 | Case management, client intake, billing |
| 8 | **TableSync** | Hospitality | #9F1239 (Burgundy) | 13008 | 13108 | Reservations, staff scheduling, inventory |
| 9 | **CraneStack** | Construction | #EA580C (Orange) | 13009 | 13109 | Project pipeline, equipment, safety compliance |
| 10 | **EduPulse** | Education | #6D28D9 (Indigo) | 13010 | 13110 | Student enrollment, course management, events |

### Brand Color Application
- **Sidebar Accent**: Company brand color (top 10px bar)
- **Buttons & CTAs**: Brand color for primary actions
- **Status Labels**: Derived palette (lighter tints for non-critical, darker for urgent)
- **Charts & Data**: Brand color for primary series; neutral grays for secondary
- **Board Grouping**: Subtle brand color tint on group headers (Kanban, Timeline views)

---

## Core Technical Architecture

### System Topology (ASCII Diagram)

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL INTEGRATIONS                        │
│  Slack  │  Email  │  Webhooks  │  OAuth (Google, Microsoft)         │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     REACT FRONTEND LAYER (13001-13010)               │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────────────────────┐ │
│  │  NovaPay UI  │ │  MedVista UI  │ │  ...Industry Frontends...    │ │
│  │  (13001)     │ │  (13002)      │ │  (13003-13010)               │ │
│  └──────────────┘ └──────────────┘ └──────────────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Shared Components: Board, Kanban, Calendar, Timeline, etc.  │   │
│  │ Context: WorkspaceContext, AuthContext, BoardContext         │   │
│  │ Hooks: useBoard, useItems, useAutomations, useWebSocket      │   │
│  │ Styling: Tailwind + Brand Color Theming                      │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    HTTPS/WebSocket (Socket.io)
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│         EXPRESS API GATEWAY & BUSINESS LOGIC (13000)                 │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ Middleware Stack:                                             │  │
│  │  • helmet (security headers)                                 │  │
│  │  • cors (whitelist 13001-13010)                              │  │
│  │  • express-rate-limit (100 req/min per IP)                   │  │
│  │  • morgan (HTTP logging)                                     │  │
│  │  • auth (JWT verification, workspace isolation)              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                       │
│  ┌─────────────────┐ ┌─────────────────┐ ┌──────────────────────┐  │
│  │  Auth Routes    │ │  Board Routes   │ │  Column Routes       │  │
│  │  /auth/login    │ │  /boards        │ │  /columns            │  │
│  │  /auth/register │ │  /items         │ │  /column-values      │  │
│  │  /auth/logout   │ │  /views         │ │  /formulas           │  │
│  └─────────────────┘ └─────────────────┘ └──────────────────────┘  │
│                                                                       │
│  ┌──────────────────┐ ┌──────────────────┐ ┌─────────────────────┐ │
│  │ Automation Routes│ │ Activity Routes  │ │ File Routes         │ │
│  │ /automations     │ │ /activity-log    │ │ /attachments        │ │
│  │ /automation-logs │ │ /notifications   │ │ /upload             │ │
│  └──────────────────┘ └──────────────────┘ └─────────────────────┘ │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ EAV Engine:                                                  │   │
│  │  • ColumnTypeHandler (abstract)                              │   │
│  │  • Handlers: StatusHandler, TextHandler, NumberHandler...   │   │
│  │  • ColumnValueService (resolve, validate, serialize)        │   │
│  │  • FormulaEngine (compute derived columns)                   │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Automation Engine:                                            │   │
│  │  • TriggerEvaluator (checks row change, status change, etc.) │   │
│  │  • ActionExecutor (send email, notify user, webhook)         │   │
│  │  • Scheduler (recurring automations)                          │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ WebSocket Server (Socket.io):                                │   │
│  │  Events: item:created, item:updated, column:added,           │   │
│  │          column:value:changed, view:changed, etc.            │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                              │
                    Sequelize ORM / Connection Pooling
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│              POSTGRESQL DATABASE (Port 5432)                          │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Core Schemas:                                                │   │
│  │  • workspaces (multi-tenant container)                       │   │
│  │  • users, roles, permissions (RBAC)                          │   │
│  │  • boards, board_groups, board_items (graph structure)       │   │
│  │  • column_definitions, column_values (EAV backbone)          │   │
│  │  • board_views, board_view_settings (view state)             │   │
│  │  • automations, automation_logs (automation state)            │   │
│  │  • file_attachments, activity_log, tags                      │   │
│  │  • board_templates, board_subitems                           │   │
│  └─────────────────────────────────────────────────────────────┘   │
│  Indexing: compound indexes on workspace_id + resource_id            │
│  Partitioning: activity_log partitioned monthly by created_at        │
│  Replication: Write-ahead logging (WAL) for durability              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│          OPTIONAL: REDIS CACHE LAYER (Port 6379)                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Use Cases:                                                   │   │
│  │  • Session store (refresh tokens)                            │   │
│  │  • Real-time event queue (item updates)                      │   │
│  │  • Rate limit counters                                       │   │
│  │  • Computed column cache (formula results)                   │   │
│  │  TTL: 1 hour sessions, 5 min event queue, 30 min formulas   │   │
│  └─────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

### API Route Structure (RESTful, Versioned)

```
/api/v1/
├── auth/
│   ├── POST   /login             (email, password)
│   ├── POST   /logout            (invalidate token)
│   ├── POST   /refresh           (refresh token)
│   └── GET    /me                (current user profile)
│
├── workspaces/
│   ├── GET    /                  (list all accessible)
│   ├── POST   /                  (create, admin only)
│   ├── GET    /:id               (workspace details)
│   ├── PATCH  /:id               (update settings)
│   └── GET    /:id/members       (list workspace users)
│
├── workspaces/:workspace_id/
│   ├── boards/
│   │   ├── GET    /              (list all boards in workspace)
│   │   ├── POST   /              (create board)
│   │   ├── GET    /:id           (board details + columns)
│   │   ├── PATCH  /:id           (update title, settings)
│   │   ├── DELETE /:id           (soft delete)
│   │   │
│   │   └── /:board_id/
│   │       ├── items/
│   │       │   ├── GET    /      (list items, paginated, filtered)
│   │       │   ├── POST   /      (create item)
│   │       │   ├── GET    /:id   (item detail + all column values)
│   │       │   ├── PATCH  /:id   (update item fields)
│   │       │   ├── DELETE /:id   (soft delete item)
│   │       │   └── /:item_id/
│   │       │       └── subitems/
│   │       │           ├── GET    /
│   │       │           ├── POST   /
│   │       │           ├── DELETE /:subitem_id
│   │       │
│   │       ├── columns/
│   │       │   ├── GET    /      (list column definitions)
│   │       │   ├── POST   /      (add new column)
│   │       │   ├── PATCH  /:id   (rename, reorder, update settings)
│   │       │   └── DELETE /:id   (remove column from board)
│   │       │
│   │       ├── column-values/
│   │       │   ├── GET    /      (list all values for board)
│   │       │   ├── POST   /:item_id/:column_id (set value)
│   │       │   └── DELETE /:item_id/:column_id (clear value)
│   │       │
│   │       ├── views/
│   │       │   ├── GET    /      (list all saved views)
│   │       │   ├── POST   /      (create view: table, kanban, etc.)
│   │       │   ├── GET    /:id   (view config)
│   │       │   ├── PATCH  /:id   (update filters, sorts, grouping)
│   │       │   └── DELETE /:id   (remove view)
│   │       │
│   │       ├── groups/
│   │       │   ├── GET    /      (list groups in board)
│   │       │   ├── POST   /      (create group)
│   │       │   ├── PATCH  /:id   (rename, reorder)
│   │       │   └── DELETE /:id   (remove group)
│   │       │
│   │       └── attachments/
│   │           ├── POST   /upload (multipart form-data)
│   │           ├── DELETE /:id    (remove attachment)
│   │           └── GET    /:id    (download/stream file)
│   │
│   ├── automations/
│   │   ├── GET    /      (list templates + saved automations)
│   │   ├── POST   /      (create automation rule)
│   │   ├── PATCH  /:id   (enable/disable, update logic)
│   │   ├── DELETE /:id   (remove automation)
│   │   └── GET    /:id/logs (execution history)
│   │
│   ├── templates/
│   │   ├── GET    /      (list board templates for industry)
│   │   ├── POST   /:id/clone (create board from template)
│   │   ├── POST   /      (save custom template)
│   │   └── DELETE /:id   (remove custom template)
│   │
│   ├── activity-log/
│   │   └── GET    /      (paginated audit trail)
│   │
│   ├── notifications/
│   │   ├── GET    /      (list unread notifications)
│   │   ├── PATCH  /:id/read (mark as read)
│   │   └── DELETE /:id   (dismiss notification)
│   │
│   ├── users/
│   │   ├── GET    /      (list workspace members)
│   │   ├── POST   /      (invite user via email)
│   │   ├── PATCH  /:id/role (update role: viewer, editor, admin)
│   │   └── DELETE /:id   (remove from workspace)
│   │
│   └── settings/
│       ├── GET    /      (workspace settings)
│       └── PATCH  /      (update billing, features, branding)
```

### WebSocket Events (Socket.io)

```
// Emitted by server to connected clients in board namespace

ITEM EVENTS:
  • item:created { item_id, board_id, created_by, created_at, data }
  • item:updated { item_id, board_id, updated_fields, updated_by, updated_at }
  • item:deleted { item_id, board_id, deleted_by, deleted_at }
  • item:moved   { item_id, board_id, from_group_id, to_group_id, position }

COLUMN EVENTS:
  • column:added      { column_id, board_id, type, label, position }
  • column:updated    { column_id, board_id, settings_changed }
  • column:deleted    { column_id, board_id, deleted_by }
  • column:reordered  { board_id, column_order: [id, id, id...] }

VALUE EVENTS:
  • column-value:changed { item_id, column_id, old_value, new_value, user_id, timestamp }
  • column-value:formula-computed { item_id, column_id, computed_value }

VIEW EVENTS:
  • view:created  { view_id, board_id, view_type, created_by }
  • view:updated  { view_id, board_id, filters_changed, sorts_changed }
  • view:deleted  { view_id, board_id }

AUTOMATION EVENTS:
  • automation:executed { automation_id, board_id, trigger, action_result, timestamp }
  • automation:error    { automation_id, error_message, stack_trace }

GROUP EVENTS:
  • group:created   { group_id, board_id, label, position }
  • group:updated   { group_id, board_id, label_changed }
  • group:deleted   { group_id, board_id }
  • group:collapsed { group_id, collapsed: boolean, user_id }

COLLABORATION EVENTS:
  • user:viewing  { user_id, board_id, view_type, timestamp }
  • user:offline  { user_id, board_id }
```

---

## Entity-Attribute-Value (EAV) System

The **EAV (Entity-Attribute-Value) system** is the architectural centerpiece that enables Monday.com-like dynamic column management. Instead of rigid table schemas, EAV decouples column definitions from values, allowing runtime column creation/deletion without schema migration.

### EAV Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│ BOARD (entity)                                                  │
│  entity_id: 42, workspace_id: 1, title: "Sales Pipeline"      │
└─────────────────────────────────────────────────────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
        ┌──────────┐  ┌──────────┐  ┌──────────┐
        │ COLUMN   │  │ COLUMN   │  │ COLUMN   │
        │ DEF (A)  │  │ DEF (A)  │  │ DEF (A)  │
        ├──────────┤  ├──────────┤  ├──────────┤
        │ id: 1    │  │ id: 2    │  │ id: 3    │
        │ type:    │  │ type:    │  │ type:    │
        │ Status   │  │ Text     │  │ Date     │
        │ label:   │  │ label:   │  │ label:   │
        │ Status   │  │ Company  │  │ Deadline │
        └──────────┘  └──────────┘  └──────────┘
              │               │               │
              │      ┌────────┴───────┐      │
              │      │                │      │
        ┌─────▼──────▼────────────────▼──────┐
        │  ITEM (entity): ID 101              │
        │   entity_id: 101, board_id: 42      │
        │   name: "Acme Corp - $50K Deal"     │
        └────────────────────────────────────┘
              │         │         │
              │         │         │
        ┌─────▼───┐ ┌──▼──────┐ ┌─▼────────┐
        │ VALUE   │ │ VALUE   │ │ VALUE    │
        │ (E,A,V)│ │ (E,A,V) │ │ (E,A,V)  │
        ├────────┤ ├─────────┤ ├──────────┤
        │item_id │ │item_id  │ │item_id   │
        │: 101   │ │: 101    │ │: 101     │
        │col_id: │ │col_id:  │ │col_id:   │
        │1       │ │2        │ │3         │
        │value:  │ │value:   │ │value:    │
        │"Deal"  │ │"Acme"   │ │2026-05-30│
        └────────┘ └─────────┘ └──────────┘
```

### 15 Supported Column Types

| # | Type | Storage Type | Constraints | Indexing | Computed? |
|----|------|--------------|-------------|----------|-----------|
| 1 | **Status** | enum/string | Predefined options (max 20) | indexed | No |
| 2 | **Text** | varchar(500) / text | Optional multi-line flag | fulltext | No |
| 3 | **Number** | numeric(12,2) | Decimals, negative allowed | indexed | No |
| 4 | **Date** | date | ISO 8601, optional picker | indexed | No |
| 5 | **Person** | uuid (user_id) | Foreign key to users | indexed | No |
| 6 | **Dropdown** | enum/string | Multi-select flag, max 100 options | indexed | No |
| 7 | **Checkbox** | boolean | True/false, optional count | indexed | No |
| 8 | **Timeline** | jsonb `{start, end}` | Date range, validates start <= end | indexed (GIN) | No |
| 9 | **Files** | jsonb `[{file_id, name, size, mime}]` | Max 10 files per cell, 10MB each | GIN | No |
| 10 | **Link** | varchar(2048) | URL validation (http/https only) | indexed | No |
| 11 | **Phone** | varchar(20) | Strips non-digits, E.164 format | indexed | No |
| 12 | **Email** | varchar(255) | RFC 5322 validation | indexed | No |
| 13 | **Rating** | smallint (1–5) | Integer 1-5 only | indexed | No |
| 14 | **Formula** | depends on formula | Computed from other columns, cacheable | indexed | Yes (computed) |
| 15 | **Last Updated** | timestamp | Auto-populated on item change | indexed | Yes (system) |

### Column Definition Schema (column_definitions table)

```sql
CREATE TABLE column_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  column_type VARCHAR(50) NOT NULL CHECK (
    column_type IN (
      'status', 'text', 'number', 'date', 'person', 'dropdown',
      'checkbox', 'timeline', 'files', 'link', 'phone', 'email',
      'rating', 'formula', 'last_updated'
    )
  ),
  label VARCHAR(100) NOT NULL,
  description TEXT,
  position SMALLINT NOT NULL DEFAULT 0,  -- render order (0-indexed)
  is_primary BOOLEAN DEFAULT FALSE,      -- primary field (like "Name")
  is_locked BOOLEAN DEFAULT FALSE,       -- prevent edit/delete
  is_hidden BOOLEAN DEFAULT FALSE,       -- hide from table view
  settings JSONB,                        -- Type-specific config
  validation_rules JSONB,                -- JSON Schema for values
  formula_config JSONB,                  -- For formula columns only
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,                  -- Soft delete

  CONSTRAINT unique_label_per_board UNIQUE (board_id, label)
                                          WHERE deleted_at IS NULL,
  INDEX idx_board_position (board_id, position),
  INDEX idx_board_type (board_id, column_type)
);
```

### Settings JSONB Schema (Per Column Type)

```json
{
  "status": {
    "options": [
      {"label": "Not Started", "color": "#CCCCCC", "order": 0},
      {"label": "In Progress", "color": "#2563EB", "order": 1},
      {"label": "Done", "color": "#059669", "order": 2}
    ],
    "default_option": "Not Started",
    "allow_multiple": false
  },
  "text": {
    "max_length": 500,
    "is_multiline": true,
    "allow_markdown": false
  },
  "number": {
    "decimal_places": 2,
    "format": "currency|percentage|plain",
    "min_value": null,
    "max_value": null
  },
  "date": {
    "include_time": false,
    "timezone": "UTC"
  },
  "person": {
    "allow_multiple": false,
    "allow_external": false
  },
  "dropdown": {
    "options": [
      {"id": "opt1", "label": "High", "color": "#DC2626", "order": 0},
      {"id": "opt2", "label": "Medium", "color": "#F59E0B", "order": 1},
      {"id": "opt3", "label": "Low", "color": "#10B981", "order": 2}
    ],
    "allow_multiple": true,
    "default_option": null
  },
  "checkbox": {
    "label_when_checked": "Checked",
    "label_when_unchecked": "Unchecked"
  },
  "timeline": {
    "include_time": true,
    "show_weekends": true,
    "allow_zero_duration": false
  },
  "files": {
    "allowed_mime_types": ["*/*"],
    "max_file_size_mb": 10,
    "max_files_per_cell": 10
  },
  "link": {
    "show_preview": true,
    "allow_attachment": false
  },
  "phone": {
    "country_code": "US",
    "format": "E.164"
  },
  "email": {
    "allow_multiple": false
  },
  "rating": {
    "scale": 5,
    "allow_half_stars": false
  },
  "formula": {
    "expression": "IF({Status} = 'Done', 100, IF({Status} = 'In Progress', 50, 0))",
    "result_type": "number",
    "cache_ttl_seconds": 3600
  }
}
```

### Column Values Table (The "Value" in EAV)

```sql
CREATE TABLE column_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES board_items(id) ON DELETE CASCADE,
  column_id UUID NOT NULL REFERENCES column_definitions(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),  -- Denorm for speed
  board_id UUID NOT NULL,                                 -- Denorm for speed

  -- Storage: polymorphic, JSON for flexibility
  value JSONB,  -- Stores any type: string, number, bool, array, object

  -- Metadata
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_item_column UNIQUE (item_id, column_id),
  INDEX idx_board_column_values (board_id, column_id),
  INDEX idx_item_values (item_id),
  INDEX idx_column_values (column_id),
  INDEX idx_updated_at (updated_at DESC)
};
```

### EAV Sequence Diagram: Creating a New Column

```
User                   Frontend              Backend (Express)        DB (PostgreSQL)
 │                        │                         │                      │
 │ 1. Fill column form     │                         │                      │
 │ (name, type, settings)  │                         │                      │
 ├────────────────────────>│                         │                      │
 │                        │  2. POST /columns       │                      │
 │                        ├────────────────────────>│                      │
 │                        │                         │ 3. Validate input    │
 │                        │                         │    (type, label)     │
 │                        │                         │                      │
 │                        │                         │ 4. INSERT            │
 │                        │                         │    column_definitions│
 │                        │                         ├─────────────────────>│
 │                        │                         │                      │
 │                        │                         │ 5. Return new        │
 │                        │                         │    column_id=C42     │
 │                        │<────────────────────────┤<─────────────────────┤
 │ 6. Broadcast via       │                         │                      │
 │    WebSocket           │                         │                      │
 │<────────────────────────┤                         │                      │
 │                        │                         │ 6. Emit              │
 │                        │                         │    column:added      │
 │                        │<────────────────────────┤                      │
 │                        │                         │                      │
 │                        │ 7. All connected users  │                      │
 │                        │    receive event & re-  │                      │
 │                        │    render board UI      │                      │
 │                        │    (new column appears) │                      │
 │                        │                         │                      │
 │ 8. User dismisses      │                         │                      │
 │    success toast       │                         │                      │
 ▼                        ▼                         ▼                      ▼
```

### EAV Sequence Diagram: Reading a Board with Full Value Resolution

```
User                   Frontend              Backend (Express)        PostgreSQL
 │                        │                         │                      │
 │ 1. Navigate to board   │                         │                      │
 │    "Sales Pipeline"    │                         │                      │
 ├────────────────────────>│                         │                      │
 │                        │  2. GET /boards/42/items│                      │
 │                        │     ?limit=50&offset=0  │                      │
 │                        ├────────────────────────>│                      │
 │                        │                         │ 3. Query items       │
 │                        │                         │    SELECT id, name.. │
 │                        │                         ├─────────────────────>│
 │                        │                         │<─────────────────────┤
 │                        │                         │ 4. 50 items returned │
 │                        │                         │                      │
 │                        │                         │ 5. For each item:    │
 │                        │                         │    SELECT col VALUES │
 │                        │                         ├─────────────────────>│
 │                        │                         │<─────────────────────┤
 │                        │                         │ 6. JOIN with         │
 │                        │                         │    column_definitions│
 │                        │                         │    to resolve types  │
 │                        │                         │                      │
 │                        │                         │ 7. For formula cols: │
 │                        │                         │    Execute formula   │
 │                        │                         │    engine (compute   │
 │                        │                         │    derived values)   │
 │                        │                         │                      │
 │                        │ 8. Return rows:        │                      │
 │                        │ [{                      │                      │
 │                        │   id: 101,              │                      │
 │                        │   name: "Acme Deal",    │                      │
 │                        │   values: {             │                      │
 │                        │     status_col: "Deal",│                      │
 │                        │     text_col: "Acme",  │                      │
 │                        │     date_col: ISO date │                      │
 │                        │   }                     │                      │
 │                        │ }, ...]                │                      │
 │<────────────────────────┤<─────────────────────────┤                      │
 │                        │                         │                      │
 │ 9. Render table view   │                         │                      │
 │    with columns,       │                         │                      │
 │    values, formatting  │                         │                      │
 ▼                        ▼                         ▼                      ▼
```

### Column Type Handlers (Backend Service Layer)

```javascript
// Abstract base class
class ColumnTypeHandler {
  constructor(columnDef, settings) {
    this.columnDef = columnDef;
    this.settings = settings;
  }

  // Validate value conforms to type
  validate(value) {
    throw new Error('Not implemented');
  }

  // Serialize for DB storage (convert to JSON)
  serialize(value) {
    throw new Error('Not implemented');
  }

  // Deserialize from JSON for API response
  deserialize(jsonValue) {
    throw new Error('Not implemented');
  }

  // Format for UI display (e.g., phone number formatting)
  format(value) {
    return this.deserialize(value);
  }

  // Check if this column type supports filtering/sorting
  supportsFiltering() {
    return true;
  }

  // Return operators for this column (=, !=, >, <, contains, etc.)
  getOperators() {
    return ['=', '!=', 'contains', 'is_empty'];
  }
}

// Concrete implementations:
class StatusColumnHandler extends ColumnTypeHandler {
  validate(value) {
    const validOptions = this.settings.options.map(o => o.label);
    return validOptions.includes(value);
  }
  serialize(value) { return { status: value }; }
  deserialize(json) { return json?.status || null; }
}

class NumberColumnHandler extends ColumnTypeHandler {
  validate(value) {
    const num = parseFloat(value);
    if (isNaN(num)) return false;
    if (this.settings.min_value && num < this.settings.min_value) return false;
    if (this.settings.max_value && num > this.settings.max_value) return false;
    return true;
  }
  serialize(value) { return { number: parseFloat(value) }; }
  deserialize(json) { return json?.number; }
  format(value) {
    const num = this.deserialize(value);
    if (this.settings.format === 'currency') {
      return `$${num.toFixed(this.settings.decimal_places)}`;
    }
    return num.toString();
  }
}

class FormulaColumnHandler extends ColumnTypeHandler {
  // Formulas are read-only; computed on-the-fly
  async compute(item, allColumnValues, columnDefinitions) {
    // Use FormulaEngine to evaluate expression
  }
  validate() { return true; }  // Always valid; computed
  serialize() { throw new Error('Formulas are read-only'); }
}
```

---

## Database Schema

Complete PostgreSQL table definitions with indexes and constraints.

### 1. Core Multi-Tenant Tables

#### workspaces

```sql
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  avatar_url VARCHAR(2048),
  industry VARCHAR(50),  -- e.g., 'finance', 'healthcare'
  brand_color VARCHAR(7),  -- Hex color: #2563EB
  plan VARCHAR(50) DEFAULT 'free',  -- free, pro, enterprise
  max_boards INTEGER DEFAULT 10,
  max_items_per_board INTEGER DEFAULT 10000,
  max_automations INTEGER DEFAULT 5,
  is_active BOOLEAN DEFAULT TRUE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  INDEX idx_slug (slug),
  INDEX idx_industry (industry),
  INDEX idx_active (is_active),
  INDEX idx_created_at (created_at DESC)
);
```

#### users

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  email_verified BOOLEAN DEFAULT FALSE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  avatar_url VARCHAR(2048),
  phone VARCHAR(20),
  timezone VARCHAR(50) DEFAULT 'UTC',
  language VARCHAR(5) DEFAULT 'en',
  preferences JSONB DEFAULT '{}',  -- UI preferences, notification settings
  last_login_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_email (email),
  INDEX idx_active (is_active),
  INDEX idx_last_login (last_login_at DESC)
);
```

#### workspace_members

```sql
CREATE TABLE workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',  -- admin, editor, viewer, guest
  invited_by UUID REFERENCES users(id),
  invited_at TIMESTAMP,
  joined_at TIMESTAMP,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_workspace_member UNIQUE (workspace_id, user_id),
  INDEX idx_workspace_members (workspace_id),
  INDEX idx_user_workspaces (user_id),
  INDEX idx_role (role)
);
```

#### roles

```sql
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  permissions JSONB,  -- Array of permission strings
  is_system BOOLEAN DEFAULT FALSE,  -- System roles: admin, editor, viewer
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_role_name_per_workspace UNIQUE (workspace_id, name),
  INDEX idx_workspace_roles (workspace_id)
);
```

### 2. Board & Item Tables

#### boards

```sql
CREATE TABLE boards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  board_template_id UUID,
  item_count INTEGER DEFAULT 0,  -- Denormalized for quick stats
  column_count SMALLINT DEFAULT 0,
  view_type VARCHAR(50) DEFAULT 'table',
  is_pinned BOOLEAN DEFAULT FALSE,
  is_archived BOOLEAN DEFAULT FALSE,
  permissions JSONB DEFAULT '{"default": "editor"}',
  settings JSONB DEFAULT '{}',
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT unique_board_name_per_workspace UNIQUE (workspace_id, name)
                                              WHERE deleted_at IS NULL,
  INDEX idx_workspace_boards (workspace_id),
  INDEX idx_pinned_archived (is_pinned, is_archived),
  INDEX idx_created_at (created_at DESC)
);
```

#### board_items

```sql
CREATE TABLE board_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  workspace_id UUID NOT NULL REFERENCES workspaces(id),  -- Denorm
  group_id UUID REFERENCES board_groups(id),
  name VARCHAR(500) NOT NULL,
  position SMALLINT DEFAULT 0,  -- Order within group
  is_expanded BOOLEAN DEFAULT FALSE,
  parent_item_id UUID REFERENCES board_items(id) ON DELETE CASCADE,  -- For subitems
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  INDEX idx_board_items (board_id),
  INDEX idx_workspace_items (workspace_id),
  INDEX idx_group_position (group_id, position),
  INDEX idx_parent_item (parent_item_id),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_updated_at (updated_at DESC)
);
```

#### board_groups

```sql
CREATE TABLE board_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  label VARCHAR(100) NOT NULL,
  color VARCHAR(7),  -- Hex color
  position SMALLINT NOT NULL DEFAULT 0,
  is_collapsed BOOLEAN DEFAULT FALSE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  CONSTRAINT unique_group_label_per_board UNIQUE (board_id, label)
                                            WHERE deleted_at IS NULL,
  INDEX idx_board_groups (board_id, position)
);
```

#### board_subitems

```sql
CREATE TABLE board_subitems (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_item_id UUID NOT NULL REFERENCES board_items(id) ON DELETE CASCADE,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  position SMALLINT DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  INDEX idx_parent_items (parent_item_id),
  INDEX idx_completed (is_completed)
);
```

### 3. EAV Tables (Column Definitions & Values)

#### column_definitions

(Already shown above in EAV section)

#### column_values

(Already shown above in EAV section)

### 4. View & Visualization Tables

#### board_views

```sql
CREATE TABLE board_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  board_id UUID NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  view_type VARCHAR(50) NOT NULL CHECK (
    view_type IN ('table', 'kanban', 'calendar', 'timeline',
                  'dashboard', 'map', 'chart', 'form')
  ),
  is_default BOOLEAN DEFAULT FALSE,
  is_locked BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_default_view_per_board CHECK (
    NOT (is_default = TRUE AND id != (
      SELECT id FROM board_views v2
      WHERE v2.board_id = board_views.board_id
      AND v2.is_default = TRUE
      LIMIT 1
    ))
  ),
  INDEX idx_board_views (board_id),
  INDEX idx_view_type (view_type)
);
```

#### board_view_settings

```sql
CREATE TABLE board_view_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  view_id UUID NOT NULL REFERENCES board_views(id) ON DELETE CASCADE,

  -- Table view: column visibility, column order
  visible_columns UUID[] DEFAULT '{}',
  column_order UUID[] DEFAULT '{}',
  column_widths JSONB DEFAULT '{}',  -- {column_id: width_px, ...}

  -- Filtering
  filters JSONB DEFAULT '[]',  -- Array of {column_id, operator, value}

  -- Sorting
  sort_by JSONB DEFAULT '[]',  -- Array of {column_id, direction}

  -- Grouping (Kanban, Dashboard)
  group_by_column UUID,

  -- Pagination
  page_size INTEGER DEFAULT 50,

  -- Specific to view type (e.g., calendar date column)
  view_config JSONB DEFAULT '{}',

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_view_settings (view_id)
);
```

### 5. Automation Tables

#### automations

```sql
CREATE TABLE automations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id UUID,  -- NULL = workspace-level, otherwise board-specific
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT TRUE,

  -- Trigger: when does this automation fire?
  trigger_type VARCHAR(50),  -- item_created, status_changed, date_arrived, etc.
  trigger_config JSONB,      -- Specific to trigger_type

  -- Condition: optional gate
  condition_type VARCHAR(50),  -- AND, OR
  conditions JSONB DEFAULT '[]',  -- Array of conditions

  -- Action: what happens?
  action_type VARCHAR(50),  -- send_email, notify_user, webhook, etc.
  action_config JSONB,      -- Specific to action_type

  -- Recipe/template info
  recipe_id VARCHAR(100),   -- Link to template (e.g., "dental_status_notify")

  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP,

  INDEX idx_workspace_automations (workspace_id),
  INDEX idx_board_automations (board_id),
  INDEX idx_enabled (is_enabled)
);
```

#### automation_logs

```sql
CREATE TABLE automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  automation_id UUID NOT NULL REFERENCES automations(id) ON DELETE CASCADE,
  item_id UUID REFERENCES board_items(id),

  trigger_event VARCHAR(100),  -- Item that triggered
  action_performed VARCHAR(100),
  action_result VARCHAR(50),  -- success, failed, skipped
  error_message TEXT,

  execution_time_ms SMALLINT,  -- How long did action take?

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_automation_logs (automation_id),
  INDEX idx_created_at (created_at DESC),
  INDEX idx_result (action_result)
);
```

### 6. Notification & Activity Tables

#### notifications

```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES users(id),

  title VARCHAR(255) NOT NULL,
  message TEXT,
  type VARCHAR(50),  -- item_updated, item_assigned, automation_executed, etc.
  resource_type VARCHAR(50),  -- board, item, automation
  resource_id UUID,

  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMP,
  action_url VARCHAR(2048),

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_recipient_notifications (recipient_id),
  INDEX idx_is_read (is_read),
  INDEX idx_created_at (created_at DESC)
);
```

#### activity_log

```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  board_id UUID,
  item_id UUID,

  actor_id UUID NOT NULL REFERENCES users(id),
  action_type VARCHAR(100),  -- item_created, item_updated, column_added, etc.

  resource_type VARCHAR(50),  -- item, column, board, automation
  resource_id UUID,
  resource_name VARCHAR(255),

  changes JSONB,  -- {field: {old: X, new: Y}, ...}

  ip_address VARCHAR(45),
  user_agent TEXT,

  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  -- Partition by month for performance
  INDEX idx_workspace_activity (workspace_id),
  INDEX idx_board_activity (board_id),
  INDEX idx_actor_activity (actor_id),
  INDEX idx_action_type (action_type),
  INDEX idx_created_at (created_at DESC)
);
```

### 7. File & Attachment Tables

#### file_attachments

```sql
CREATE TABLE file_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  item_id UUID REFERENCES board_items(id) ON DELETE CASCADE,
  column_id UUID REFERENCES column_definitions(id) ON DELETE CASCADE,

  original_filename VARCHAR(255) NOT NULL,
  stored_filename VARCHAR(255) NOT NULL UNIQUE,
  mime_type VARCHAR(100),
  size_bytes INTEGER,

  upload_path VARCHAR(2048),  -- Local: ./uploads/ws-123/item-456/file.pdf
                              -- S3: s3://bucket/ws-123/item-456/file.pdf

  uploaded_by UUID NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP NOT NULL DEFAULT NOW(),

  is_archived BOOLEAN DEFAULT FALSE,
  archived_at TIMESTAMP,

  INDEX idx_item_attachments (item_id),
  INDEX idx_column_attachments (column_id),
  INDEX idx_workspace_attachments (workspace_id),
  INDEX idx_uploaded_at (uploaded_at DESC)
);
```

### 8. Template Tables

#### board_templates

```sql
CREATE TABLE board_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID,  -- NULL = global/system template
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),  -- fintech, healthcare, realestate, etc.

  -- Denormalized template config
  template_config JSONB,  -- {columns: [...], groups: [...], automations: [...]}

  thumbnail_url VARCHAR(2048),
  is_system BOOLEAN DEFAULT FALSE,
  is_public BOOLEAN DEFAULT FALSE,

  usage_count INTEGER DEFAULT 0,

  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_category (category),
  INDEX idx_system (is_system),
  INDEX idx_usage (usage_count DESC)
);
```

### 9. Tag Tables

#### tags

```sql
CREATE TABLE tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  color VARCHAR(7),

  CONSTRAINT unique_tag_per_workspace UNIQUE (workspace_id, name),
  INDEX idx_workspace_tags (workspace_id)
);
```

#### item_tags

```sql
CREATE TABLE item_tags (
  item_id UUID NOT NULL REFERENCES board_items(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES tags(id) ON DELETE CASCADE,

  PRIMARY KEY (item_id, tag_id),
  INDEX idx_tag_items (tag_id)
);
```

### 10. Session Table (for JWT refresh tokens)

#### sessions

```sql
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(500) NOT NULL UNIQUE,
  ip_address VARCHAR(45),
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),

  INDEX idx_user_sessions (user_id),
  INDEX idx_expires_at (expires_at)
);
```

---

## Board Views & Visualization System

### 8 Supported Board Views

#### 1. Table View (Default)
- Spreadsheet-like grid
- Rows = items, columns = columns
- Sortable columns, filterable
- Inline editing
- Frozen header
- Column resizing/reordering

#### 2. Kanban View
- Cards grouped by Status column
- Drag-drop cards between groups
- Customizable card preview (which columns to show)
- Lane collapsing
- Item count per lane

#### 3. Calendar View
- Month/week/day view
- Items plotted by Date column
- Drag-drop to change date
- Color-coded by Status or other column
- Click item to view details modal

#### 4. Timeline/Gantt View
- Horizontal timeline on X-axis
- Items on Y-axis
- Timeline column = bar duration
- Drag bars to adjust dates
- Milestones/dependencies optional
- % complete indicator (from Progress column if exists)

#### 5. Dashboard View
- Widget-based analytics
- Widget types: Bar Chart, Pie Chart, Number Card, Battery, Table
- Grouping: by any column
- Stacking: multiple series
- Filters apply to all widgets
- Editable widget layout

#### 6. Map View
- Geographic pins (requires Location data)
- Cluster pins by zoom level
- Click pin to view item details
- Filter by region

#### 7. Chart View
- Standalone chart: bar, line, pie, area
- X-axis grouping, Y-axis aggregation
- Multi-series stacking
- Legend, labels
- Export as PNG/SVG

#### 8. Form View
- Public intake form (shareable link)
- Converts form submissions to board items
- Field mapping: form input → column
- Email notifications on submission
- Captcha protection

---

## Automations Engine

### Automation Architecture

```
┌──────────────────────────────────┐
│ Automation Trigger               │
│ (Item created, Status changed)   │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ Condition Evaluation             │
│ (AND/OR logic: if X then Y)      │
└─────────────┬────────────────────┘
              │
              ▼
┌──────────────────────────────────┐
│ Action Execution                 │
│ (Send email, notify, webhook)    │
└──────────────────────────────────┘
```

### 15 Built-In Automation Templates

1. **Status Change Trigger** → Notify User (e.g., "When status = Approved, notify Finance Lead")
2. **Status Change Trigger** → Email (e.g., "When status = Rejected, email applicant")
3. **Date Arrival** → Move to Group (e.g., "When deadline arrives, move to 'Overdue'")
4. **Item Created** → Set Person (e.g., "When item created, assign to creator")
5. **Item Created** → Send Notification (e.g., "When item created, notify board owner")
6. **Status Change** → Update Related Item (e.g., "When order status = Shipped, update tracking #")
7. **Recurring Trigger** → Create Item (e.g., "Every Monday at 9am, create weekly standup item")
8. **Column Value Changed** → Push Notification (e.g., "When budget column > $100K, push alert")
9. **Person Assigned** → Send Email (e.g., "When person assigned, email them the task details")
10. **File Uploaded** → Webhook (e.g., "When document uploaded, POST to compliance system")
11. **Dropdown Selected** → Update Multiple Columns (e.g., "When priority = High, set status to Review")
12. **Formula Computed** → Send Notification (e.g., "When profit margin < 10%, notify sales")
13. **Item Completed** → Archive & Create Next (e.g., "When item marked done, archive and create follow-up")
14. **External Webhook** → Create/Update Item (e.g., "When Zapier sends webhook, create item")
15. **Time-Based** → Cleanup (e.g., "Delete items older than 90 days in 'Archive' group")

### Industry-Specific Automation Recipes

**NovaPay (FinTech)**:
- When transaction status = Approved, send confirmation email + update balance
- When merchant KYC = Verified, auto-create onboarding checklist
- Daily: reconcile transactions against ledger

**MedVista (Healthcare)**:
- When patient status = Confirmed, send appointment reminder 24h before
- When insurance claim = Denied, notify patient + create appeal task
- Daily: send discharge summaries to records dept

**DentaFlow (Dental)**:
- When treatment = Completed, generate receipt + send to patient
- When appointment = No-show, send follow-up email + offer rescheduling
- Weekly: remind hygienists of upcoming treatment plans

**JurisPath (Legal)**:
- When case status = Trial Date Set, auto-create pre-trial checklist
- When document uploaded = Court Filing, send to court via API
- When invoice due date arrives, send payment reminder email

---

## Project Structure

```
13-CRM-Platform/
│
├── core/                                 # Core Platform (Agent: CRM Core)
│   ├── docker-compose.yml               # Services: API, DB, Redis, Minio
│   │
│   ├── backend/
│   │   ├── src/
│   │   │   ├── app.ts                  # Express app setup
│   │   │   ├── config.ts               # Environment, secrets
│   │   │   ├── database.ts             # Sequelize init
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts             # JWT verification, workspace isolation
│   │   │   │   ├── error-handler.ts    # Global error handling
│   │   │   │   └── request-logger.ts   # Morgan + custom logging
│   │   │   │
│   │   │   ├── routes/
│   │   │   │   ├── auth.routes.ts
│   │   │   │   ├── workspaces.routes.ts
│   │   │   │   ├── boards.routes.ts
│   │   │   │   ├── items.routes.ts
│   │   │   │   ├── columns.routes.ts
│   │   │   │   ├── column-values.routes.ts
│   │   │   │   ├── views.routes.ts
│   │   │   │   ├── automations.routes.ts
│   │   │   │   ├── attachments.routes.ts
│   │   │   │   ├── activity.routes.ts
│   │   │   │   └── notifications.routes.ts
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── User.ts
│   │   │   │   ├── Workspace.ts
│   │   │   │   ├── Board.ts
│   │   │   │   ├── BoardItem.ts
│   │   │   │   ├── BoardGroup.ts
│   │   │   │   ├── ColumnDefinition.ts
│   │   │   │   ├── ColumnValue.ts
│   │   │   │   ├── BoardView.ts
│   │   │   │   ├── Automation.ts
│   │   │   │   ├── FileAttachment.ts
│   │   │   │   ├── ActivityLog.ts
│   │   │   │   ├── Notification.ts
│   │   │   │   └── Session.ts
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts     # Login, register, token refresh
│   │   │   │   ├── board.service.ts    # CRUD boards
│   │   │   │   ├── item.service.ts     # CRUD items
│   │   │   │   ├── column.service.ts   # CRUD column_definitions
│   │   │   │   ├── view.service.ts     # CRUD & filter application
│   │   │   │   ├── file.service.ts     # Upload, store, retrieve
│   │   │   │   ├── automation.service.ts
│   │   │   │   └── activity.service.ts
│   │   │   │
│   │   │   ├── eav/                   # EAV Engine (Core Differentiator)
│   │   │   │   ├── column-type-handler.ts      # Abstract base class
│   │   │   │   ├── handlers/
│   │   │   │   │   ├── status.handler.ts
│   │   │   │   │   ├── text.handler.ts
│   │   │   │   │   ├── number.handler.ts
│   │   │   │   │   ├── date.handler.ts
│   │   │   │   │   ├── person.handler.ts
│   │   │   │   │   ├── dropdown.handler.ts
│   │   │   │   │   ├── checkbox.handler.ts
│   │   │   │   │   ├── timeline.handler.ts
│   │   │   │   │   ├── files.handler.ts
│   │   │   │   │   ├── link.handler.ts
│   │   │   │   │   ├── phone.handler.ts
│   │   │   │   │   ├── email.handler.ts
│   │   │   │   │   ├── rating.handler.ts
│   │   │   │   │   ├── formula.handler.ts
│   │   │   │   │   └── last-updated.handler.ts
│   │   │   │   ├── column-value.service.ts     # Get/set/validate values
│   │   │   │   ├── formula-engine.ts           # Compute derived columns
│   │   │   │   └── eav-resolver.ts             # Convert DB JSON → typed objects
│   │   │   │
│   │   │   ├── automations/           # Automation Engine
│   │   │   │   ├── trigger-evaluator.ts        # Check if automation should fire
│   │   │   │   ├── condition-evaluator.ts      # Evaluate AND/OR logic
│   │   │   │   ├── action-executor.ts          # Execute action (send email, etc.)
│   │   │   │   ├── scheduler.ts                # Background job runner
│   │   │   │   └── recipes/                    # Industry-specific templates
│   │   │   │       ├── fintech-recipes.json
│   │   │   │       ├── healthcare-recipes.json
│   │   │   │       └── ... (all 10 industries)
│   │   │   │
│   │   │   ├── websocket/
│   │   │   │   ├── socket-server.ts            # Socket.io setup
│   │   │   │   ├── events.ts                   # Event handlers
│   │   │   │   └── namespaces/
│   │   │   │       ├── board.namespace.ts      # /board namespace
│   │   │   │       └── notification.namespace.ts
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── validators.ts
│   │   │   │   ├── formatters.ts
│   │   │   │   ├── jwt-helper.ts
│   │   │   │   ├── pagination.ts
│   │   │   │   └── file-helper.ts
│   │   │   │
│   │   │   └── types/
│   │   │       ├── index.ts
│   │   │       ├── board.types.ts
│   │   │       ├── column.types.ts
│   │   │       ├── automation.types.ts
│   │   │       └── api.types.ts
│   │   │
│   │   ├── migrations/
│   │   │   ├── 001-create-workspaces.ts
│   │   │   ├── 002-create-users.ts
│   │   │   ├── 003-create-boards.ts
│   │   │   ├── 004-create-column-definitions.ts
│   │   │   ├── 005-create-column-values.ts
│   │   │   ├── 006-create-automations.ts
│   │   │   ├── 007-create-activity-log.ts
│   │   │   ├── 008-add-indexes.ts
│   │   │   └── 009-seed-demo-data.ts
│   │   │
│   │   ├── seeds/
│   │   │   ├── index.ts
│   │   │   └── demo-data.json          # 50-100 records per entity
│   │   │
│   │   ├── .env.example
│   │   ├── .eslintrc.json
│   │   ├── tsconfig.json
│   │   ├── jest.config.js
│   │   └── package.json
│   │
│   └── frontend/
│       ├── src/
│       │   ├── main.tsx                # Vite entry
│       │   ├── App.tsx
│       │   ├── index.css               # Tailwind + custom styles
│       │   │
│       │   ├── components/
│       │   │   ├── common/
│       │   │   │   ├── Sidebar.tsx
│       │   │   │   ├── TopBar.tsx
│       │   │   │   ├── Modal.tsx
│       │   │   │   ├── Toast.tsx
│       │   │   │   ├── Loader.tsx
│       │   │   │   └── ContextMenu.tsx
│       │   │   │
│       │   │   ├── auth/
│       │   │   │   ├── LoginPage.tsx
│       │   │   │   └── LogoutButton.tsx
│       │   │   │
│       │   │   ├── board/
│       │   │   │   ├── BoardHeader.tsx
│       │   │   │   ├── BoardActions.tsx
│       │   │   │   ├── BoardSettings.tsx
│       │   │   │   ├── ViewSwitcher.tsx
│       │   │   │   └── ViewToolbar.tsx
│       │   │   │
│       │   │   ├── views/
│       │   │   │   ├── TableView.tsx            # Main grid view
│       │   │   │   ├── KanbanView.tsx
│       │   │   │   ├── CalendarView.tsx
│       │   │   │   ├── TimelineView.tsx
│       │   │   │   ├── DashboardView.tsx
│       │   │   │   ├── MapView.tsx
│       │   │   │   ├── ChartView.tsx
│       │   │   │   └── FormView.tsx
│       │   │   │
│       │   │   ├── column/
│       │   │   │   ├── ColumnHeader.tsx         # Drag-drop header
│       │   │   │   ├── ColumnTypeSelector.tsx
│       │   │   │   ├── ColumnSettingsModal.tsx
│       │   │   │   └── ColumnValue/
│       │   │   │       ├── TextCell.tsx
│       │   │   │       ├── StatusCell.tsx
│       │   │   │       ├── DateCell.tsx
│       │   │   │       ├── PersonCell.tsx
│       │   │   │       ├── DropdownCell.tsx
│       │   │   │       ├── CheckboxCell.tsx
│       │   │   │       ├── TimelineCell.tsx
│       │   │   │       ├── FilesCell.tsx
│       │   │   │       ├── LinkCell.tsx
│       │   │   │       ├── PhoneCell.tsx
│       │   │   │       ├── EmailCell.tsx
│       │   │   │       ├── RatingCell.tsx
│       │   │   │       └── FormulaCell.tsx
│       │   │   │
│       │   │   ├── item/
│       │   │   │   ├── ItemRow.tsx
│       │   │   │   ├── ItemCard.tsx              # For Kanban
│       │   │   │   ├── ItemModal.tsx
│       │   │   │   ├── ItemForm.tsx
│       │   │   │   └── ItemActions.tsx
│       │   │   │
│       │   │   ├── automation/
│       │   │   │   ├── AutomationList.tsx
│       │   │   │   ├── AutomationBuilder.tsx     # Visual builder
│       │   │   │   ├── TriggerSelector.tsx
│       │   │   │   ├── ConditionBuilder.tsx
│       │   │   │   ├── ActionSelector.tsx
│       │   │   │   └── RecipeTemplates.tsx
│       │   │   │
│       │   │   ├── workspace/
│       │   │   │   ├── WorkspaceSwitcher.tsx
│       │   │   │   ├── WorkspaceSettings.tsx
│       │   │   │   └── MemberManagement.tsx
│       │   │   │
│       │   │   └── filters/
│       │   │       ├── FilterBar.tsx
│       │   │       ├── FilterDropdown.tsx
│       │   │       └── SortDropdown.tsx
│       │   │
│       │   ├── views/                           # Page-level views
│       │   │   ├── LoginPage.tsx
│       │   │   ├── DashboardPage.tsx
│       │   │   ├── BoardPage.tsx
│       │   │   └── SettingsPage.tsx
│       │   │
│       │   ├── hooks/
│       │   │   ├── useBoard.ts                  # Fetch board + items
│       │   │   ├── useItems.ts                  # CRUD items
│       │   │   ├── useColumns.ts                # CRUD columns
│       │   │   ├── useViews.ts                  # CRUD views
│       │   │   ├── useAutomations.ts
│       │   │   ├── useWebSocket.ts              # Real-time updates
│       │   │   ├── usePagination.ts
│       │   │   ├── useAuth.ts
│       │   │   └── useToast.ts
│       │   │
│       │   ├── contexts/
│       │   │   ├── AuthContext.tsx              # Current user + token
│       │   │   ├── WorkspaceContext.tsx         # Current workspace
│       │   │   ├── BoardContext.tsx             # Current board + items cache
│       │   │   ├── ThemeContext.tsx             # Brand color, dark mode
│       │   │   └── NotificationContext.tsx      # Toast/notification queue
│       │   │
│       │   ├── services/
│       │   │   ├── api.ts                       # Axios instance + endpoints
│       │   │   ├── websocket.ts                 # Socket.io client
│       │   │   ├── storage.ts                   # localStorage helpers
│       │   │   └── auth-service.ts              # Token management
│       │   │
│       │   ├── theme/
│       │   │   ├── colors.ts                    # Brand color map
│       │   │   ├── tailwind.config.js
│       │   │   └── globals.css
│       │   │
│       │   ├── types/
│       │   │   ├── index.ts
│       │   │   ├── board.types.ts
│       │   │   ├── column.types.ts
│       │   │   ├── api.types.ts
│       │   │   └── automation.types.ts
│       │   │
│       │   └── utils/
│       │       ├── api-helpers.ts
│       │       ├── formatters.ts
│       │       ├── validators.ts
│       │       └── date-helpers.ts
│       │
│       ├── .env.example
│       ├── .eslintrc.json
│       ├── tsconfig.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       ├── postcss.config.js
│       └── package.json
│
├── industries/                                   # Industry-Specific Overrides
│   ├── novapay/
│   │   ├── frontend/                            # NovaPay-branded frontend
│   │   │   ├── src/components/...               # FinTech-specific components
│   │   │   ├── src/theme/colors-novapay.ts      # Brand color overrides
│   │   │   ├── src/hooks/useNovaPay.ts
│   │   │   └── src/services/novapay-api.ts
│   │   ├── backend/                             # NovaPay-specific services
│   │   │   ├── src/services/merchant.service.ts
│   │   │   ├── src/services/transaction.service.ts
│   │   │   ├── src/automations/fintech-recipes.ts
│   │   │   └── src/seeds/novapay-demo-data.json
│   │   ├── docker-compose.override.yml          # Scale specific services
│   │   └── industry.config.json
│   │
│   ├── medvista/                                # (Healthcare)
│   │   ├── frontend/
│   │   ├── backend/
│   │   └── industry.config.json
│   │
│   ├── trustguard/                              # (Insurance)
│   ├── urbannest/                               # (Real Estate)
│   ├── swiftroute/                              # (Logistics)
│   ├── dentaflow/                               # (Dental)
│   ├── jurispath/                               # (Legal)
│   ├── tablesync/                               # (Hospitality)
│   ├── cranestack/                              # (Construction)
│   ├── edupulse/                                # (Education)
│   │
│   └── industry.config.js                       # Global industry registry
│
├── plans/
│   ├── CRM-MASTER-PLAN.md                       # This file
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── API-ROUTES.md
│   ├── EAV-SYSTEM.md
│   ├── DEPLOYMENT.md
│   └── TESTING-STRATEGY.md
│
├── docs/
│   ├── QUICKSTART.md                            # Docker Compose setup
│   ├── COLUMN-TYPES.md                          # EAV column reference
│   ├── AUTOMATION-RECIPES.md                    # Industry templates
│   └── API.md                                   # API documentation
│
└── .gitignore
    .env.example
    README.md
```

---

## API Route Architecture

All routes are prefixed with `/api/v1/`. See [Core Technical Architecture](#core-technical-architecture) for full route tree.

### Authentication Flow

```
1. POST /auth/login
   Request: { email, password }
   Response: {
     access_token: "eyJhbGc...",      // 1-hour JWT
     refresh_token: "long_token_...",  // 7-day refresh token
     user: { id, email, name, ... }
   }

2. Store tokens in browser:
   - access_token → localStorage
   - refresh_token → HttpOnly cookie (secure, SameSite)

3. Attach to all requests:
   Authorization: Bearer {access_token}

4. On token expiry (401 response):
   POST /auth/refresh
   Request: { refresh_token }
   Response: { access_token: "new_token..." }
```

### Pagination & Filtering

```
GET /api/v1/workspaces/:id/boards/:board_id/items
  ?limit=50
  &offset=0
  &sort=created_at:desc
  &filter[status]=Done
  &filter[date][gte]=2026-01-01
  &filter[date][lte]=2026-03-01

Response: {
  data: [{ item }, ...],
  pagination: {
    limit: 50,
    offset: 0,
    total: 1243,
    page: 1,
    pages: 25
  }
}
```

---

## Naming Conventions & Standards

### Database
- **Tables**: `snake_case`, plural nouns (users, boards, column_definitions)
- **Columns**: `snake_case`, data type appended for clarity (_id, _at, _count)
- **Indexes**: `idx_{table}_{column(s)}`
- **Foreign Keys**: `{referenced_table}_id`
- **Booleans**: `is_*` or `has_*` prefix
- **Timestamps**: `created_at`, `updated_at`, `deleted_at`

### Backend
- **Files**: `snake-case.ts` for services, `camelCase.ts` for utilities
- **Classes**: `PascalCase` (ColumnTypeHandler, BoardService)
- **Functions**: `camelCase` (validateEmail, getBoard)
- **Constants**: `UPPER_SNAKE_CASE`
- **Types/Interfaces**: `PascalCase` (BoardItem, ColumnType)
- **Environment Variables**: `UPPER_SNAKE_CASE` (JWT_SECRET, DB_HOST)

### Frontend
- **Components**: `PascalCase.tsx` (TableView.tsx, ItemModal.tsx)
- **Hooks**: `useXxx.ts` (useBoard.ts, useItems.ts)
- **Contexts**: `XxxContext.tsx` (AuthContext.tsx, BoardContext.tsx)
- **CSS Classes**: BEM or Tailwind utility classes
- **Props Interfaces**: `Xxx Props` (TableViewProps)

### API Routes
- **Resource routes**: `/api/v1/{resource}/{id}/{nested}`
- **Action verbs**: `POST` (create), `PATCH` (update), `DELETE` (remove), `GET` (read)
- **Query params**: `?limit=`, `?offset=`, `?sort=`, `?filter[name]=`

---

## Development & Deployment

### Local Development Setup

```bash
# 1. Clone & install
git clone <repo>
cd 13-CRM-Platform/core
npm install  # Backend
cd ../core/frontend && npm install  # Frontend

# 2. Environment setup
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Docker Compose (DB, Redis)
docker-compose up -d

# 4. Migrations & seeds
cd backend && npm run migrate && npm run seed

# 5. Start services
npm run dev:backend  # Terminal 1: Port 13000
npm run dev:frontend # Terminal 2: Port 13001

# 6. Access application
http://localhost:13001
Admin: admin / admin
```

### Docker Compose Services

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    ports: ["5432:5432"]
    environment:
      POSTGRES_USER: crm_user
      POSTGRES_PASSWORD: crm_password
      POSTGRES_DB: crm_db

  redis:
    image: redis:7
    ports: ["6379:6379"]

  minio:  # S3-compatible storage for files
    image: minio/minio
    ports: ["9000:9000", "9001:9001"]
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin

  # In production: separate containers per industry frontend
```

### Ports

```
13000 — CRM Core API (Express)
13001 — NovaPay Frontend
13002 — MedVista Frontend
13003 — TrustGuard Frontend
13004 — UrbanNest Frontend
13005 — SwiftRoute Frontend
13006 — DentaFlow Frontend
13007 — JurisPath Frontend
13008 — TableSync Frontend
13009 — CraneStack Frontend
13010 — EduPulse Frontend
13101 — NovaPay API Instance
13102 — MedVista API Instance
... (13103–13110)
```

---

## Quality & Testing Standards

### TypeScript
- **tsconfig.json**: `strict: true`, `noImplicitAny: true`, `noUnusedLocals: true`
- **Type coverage goal**: 100% on services, 80%+ on components
- **No `any` types** unless explicitly justified with comments

### Linting & Formatting
- **ESLint**: Airbnb config extended with TypeScript rules
- **Prettier**: 2-space indent, 120-char line length, trailing commas
- **Pre-commit hook**: Lint, format, test before commit

### Testing
- **Unit Tests**: Jest + Supertest (backend), Jest + RTL (frontend)
- **Coverage Goals**: 80% overall, 90% on services/models
- **E2E Tests**: Cypress or Playwright (critical flows)
- **Test Files**: `*.test.ts` or `*.spec.ts`

### Code Structure
- **Services**: Business logic, no HTTP concerns
- **Routes**: HTTP concerns only (req, res), delegate to services
- **Components**: Presentation, props-driven, minimal state
- **Hooks**: Reusable stateful logic
- **No circular dependencies** (ESLint plugin: `eslint-plugin-import`)

### Security
- **Helmet**: Secure HTTP headers
- **Rate Limiting**: 100 req/min per IP
- **CORS**: Whitelist 13001-13010 (industry frontends)
- **SQL Injection**: Parameterized queries (Sequelize ORM)
- **XSS**: React auto-escapes, Content Security Policy headers
- **CSRF**: SameSite cookies, CSRF tokens on state-changing requests
- **Input Validation**: Joi/Zod schemas on all endpoints

---

## Summary

**Project 13 — CRM Master Plan** is a comprehensive specification for a Monday.com-clone platform that balances:

1. **Flexibility** (EAV system allows unlimited column types & runtime configuration)
2. **Scale** (Multi-tenant PostgreSQL, 50-100 record demo data per entity)
3. **Industry Fit** (10 verticals with dedicated branding, templates, automations)
4. **Developer Experience** (TypeScript, clean architecture, comprehensive documentation)
5. **User Experience** (8 visualization views, real-time WebSocket, intuitive automation builder)

The **EAV system** is the architectural centerpiece—it decouples column definitions from values, enabling the Monday.com-like flexibility that makes this platform powerful.

The **automation engine** provides business value through industry-specific recipes (e.g., "Dental: When patient status = Confirmed, notify hygienist").

The **multi-tenant architecture** with workspace isolation ensures data security while supporting growth.

Development roadmap:
- **Phase 1** (Weeks 1-4): Core API + EAV system + Table view
- **Phase 2** (Weeks 5-8): Remaining views (Kanban, Calendar, Timeline)
- **Phase 3** (Weeks 9-12): Automation engine + industry recipes
- **Phase 4** (Weeks 13+): Industry-specific frontends + advanced features

---

**End of CRM Master Plan**
