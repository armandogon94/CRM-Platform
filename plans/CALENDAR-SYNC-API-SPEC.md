# Calendar Sync API Specification

## Overview

This document defines a bidirectional calendar synchronization API that allows the CRM (Project 13) and ERP (Project 14) systems to exchange calendar events in real-time. The sync is optional—both systems work independently, but can opt-in to synchronization for a unified calendar experience.

**Key Design Goals:**
- Minimal coupling between systems (each system owns its own data)
- Real-time sync via webhooks with polling fallback
- Conflict-free event handling (last-write-wins with timestamps)
- iCalendar-compatible event format
- Stateless, REST-based API (suitable for microservice architecture)

**Timeline**: Events are synced within 5-30 seconds via webhook, or next polling cycle if webhook fails.

---

## Design Principles

### 1. Independence
- Each system maintains its own calendar database
- Sync is optional; systems function without it
- System A going down doesn't block System B

### 2. CalDAV-Inspired but Simplified
- Uses REST endpoints, not actual CalDAV protocol
- JSON payloads (easier than iCalendar XML for APIs)
- iCalendar-compatible field names for future interop

### 3. Conflict Resolution
- **Strategy**: Last-write-wins (LWW)
- **Timestamp**: `updated_at` ISO8601 field determines winner
- **Example**: If CRM updates event at 14:30:05 and ERP updates at 14:30:03, CRM's version wins
- **Assumption**: Server clocks are synchronized (NTP)

### 4. Event Model
- **Format**: iCalendar (RFC 5545) concepts in JSON
- **Extensibility**: `metadata` field for system-specific properties
- **Status**: confirmed, tentative, cancelled

### 5. Real-Time + Fallback
- **Primary**: Webhook notifications (5-second latency)
- **Fallback**: Polling endpoint (5-minute sync cycle)
- **Startup**: Full sync on first connection

---

## Architecture: Where Does the Sync Service Live?

### Option 1: Standalone Microservice (Recommended for larger deployments)

```
┌─────────────────┐         ┌──────────────────┐         ┌──────────────┐
│   CRM System    │         │ Sync Service     │         │ ERP System   │
│  (Node.js)      │◄────────│ (Node.js)        │────────►│  (Django)    │
│                 │         │ Port: 13500      │         │              │
│  POST /webhook  │         │                  │         │              │
│  Receives sync  │         │ SQLite/Postgres  │         │ POST /webhook│
│  notifications  │         │ Stores mapping:  │         │ Receives sync│
└─────────────────┘         │ crm_id ↔ erp_id │         │ notifications
                            └──────────────────┘         └──────────────┘
```

**Advantages:**
- Decoupled from both systems
- Can scale independently
- Single source of truth for sync state
- Easy to monitor/debug
- Supports multiple CRM/ERP instances

**Database**: SQLite (for hobby/single-server) or PostgreSQL (for production)

### Option 2: Embedded Sync Service

Sync logic runs inside each system (CRM and ERP directly exchange events).

**Advantages:**
- Simpler deployment (one less microservice)
- No new infrastructure

**Disadvantages:**
- Higher coupling
- Harder to debug (sync logic in two places)
- Can't add more systems later easily

**Recommendation**: Option 1 for production, Option 2 for MVP.

---

## API Endpoints

All endpoints return JSON. Base URL: `http://localhost:13500/api/sync` (or your sync service URL)

### 1. Calendar Registration

#### POST /calendars
Register a calendar for synchronization.

**Request:**
```json
{
  "system": "crm",
  "system_url": "https://crm.example.com",
  "calendar_name": "Sales Team",
  "webhook_endpoint": "https://crm.example.com/webhooks/calendar-sync",
  "api_key": "sk_live_abc123xyz"
}
```

**Response (201 Created):**
```json
{
  "sync_id": "sync_789abc",
  "calendar_id": "cal_def456",
  "system": "crm",
  "calendar_name": "Sales Team",
  "status": "active",
  "created_at": "2026-04-02T10:00:00Z",
  "last_sync_at": null,
  "webhook_endpoint": "https://crm.example.com/webhooks/calendar-sync",
  "next_full_sync_at": "2026-04-02T10:05:00Z"
}
```

**Error Cases:**
- 400: Invalid system (must be "crm" or "erp")
- 401: Invalid API key
- 409: Calendar already syncing

---

#### GET /calendars
List all registered synced calendars.

**Query Parameters:**
- `system` (optional): Filter by system ("crm" or "erp")
- `status` (optional): "active", "paused", "failed"

**Response:**
```json
{
  "data": [
    {
      "sync_id": "sync_789abc",
      "calendar_id": "cal_def456",
      "system": "crm",
      "calendar_name": "Sales Team",
      "status": "active",
      "last_sync_at": "2026-04-02T10:05:15Z",
      "event_count": 47,
      "next_sync_at": "2026-04-02T10:10:15Z"
    }
  ],
  "total": 1
}
```

---

#### DELETE /calendars/:sync_id
Unregister a calendar from synchronization. No more events will be synced.

**Response (200 OK):**
```json
{
  "sync_id": "sync_789abc",
  "status": "deleted",
  "deleted_at": "2026-04-02T11:00:00Z",
  "message": "Calendar sync removed. Existing events remain in both systems."
}
```

---

### 2. Event Synchronization

#### POST /events
Push event changes (create, update, delete) from one system to the other.

**Request:**
```json
{
  "sync_id": "sync_789abc",
  "events": [
    {
      "event_id": "uuid-1",
      "source_system": "crm",
      "source_id": "deal_12345",
      "action": "create",
      "title": "Call with Acme Corp",
      "description": "Discuss contract terms",
      "start_time": "2026-04-05T14:00:00Z",
      "end_time": "2026-04-05T15:00:00Z",
      "all_day": false,
      "location": "Zoom: https://zoom.us/j/123456",
      "attendees": [
        {
          "email": "john@crm.example.com",
          "name": "John Sales",
          "status": "accepted"
        },
        {
          "email": "jane@erp.example.com",
          "name": "Jane Johnson",
          "status": "tentative"
        }
      ],
      "recurrence_rule": null,
      "status": "confirmed",
      "created_at": "2026-04-02T09:30:00Z",
      "updated_at": "2026-04-02T09:30:00Z"
    }
  ]
}
```

**Response (202 Accepted):**
```json
{
  "status": "accepted",
  "processed": 1,
  "results": [
    {
      "event_id": "uuid-1",
      "synced_to": "erp",
      "synced_at": "2026-04-02T09:30:05Z",
      "synced_event_id": "erp_event_999",
      "sync_version": 1
    }
  ]
}
```

**Error Cases:**
- 400: Invalid event schema
- 401: Unauthorized sync_id
- 409: Conflict (conflicting update; see conflict resolution section)
- 422: Event validation failed (bad email, invalid time, etc.)

---

#### GET /events
Pull event changes since a timestamp. Used for polling fallback.

**Query Parameters:**
- `since` (required): ISO8601 timestamp (e.g., `2026-04-02T10:00:00Z`)
- `sync_id` (optional): Filter to specific sync
- `limit` (optional): Max events to return (default: 100, max: 1000)

**Response:**
```json
{
  "data": [
    {
      "event_id": "uuid-1",
      "source_system": "crm",
      "source_id": "deal_12345",
      "calendar_id": "cal_def456",
      "title": "Call with Acme Corp",
      "description": "Discuss contract terms",
      "start_time": "2026-04-05T14:00:00Z",
      "end_time": "2026-04-05T15:00:00Z",
      "all_day": false,
      "location": "Zoom",
      "attendees": [
        {
          "email": "john@crm.example.com",
          "name": "John Sales",
          "status": "accepted"
        }
      ],
      "recurrence_rule": null,
      "status": "confirmed",
      "created_at": "2026-04-02T09:30:00Z",
      "updated_at": "2026-04-02T09:30:00Z",
      "synced_at": "2026-04-02T09:30:05Z",
      "sync_version": 1,
      "metadata": {
        "crm_opportunity_id": "opp_123",
        "crm_owner_id": "user_456"
      }
    }
  ],
  "has_more": false,
  "next_cursor": null
}
```

---

#### GET /events/:event_id
Get a specific synced event.

**Response:**
```json
{
  "event_id": "uuid-1",
  "source_system": "crm",
  "source_id": "deal_12345",
  "title": "Call with Acme Corp",
  "start_time": "2026-04-05T14:00:00Z",
  "end_time": "2026-04-05T15:00:00Z",
  "sync_version": 1,
  "sync_history": [
    {
      "timestamp": "2026-04-02T09:30:05Z",
      "action": "created",
      "synced_from": "crm",
      "synced_to": "erp"
    },
    {
      "timestamp": "2026-04-02T10:00:00Z",
      "action": "updated",
      "synced_from": "erp",
      "synced_to": "crm",
      "field_changes": ["attendees"]
    }
  ]
}
```

---

### 3. Webhook Management

#### POST /webhooks
Register a webhook endpoint to receive real-time sync notifications.

**Request:**
```json
{
  "sync_id": "sync_789abc",
  "webhook_url": "https://crm.example.com/webhooks/calendar-sync",
  "events": ["event.created", "event.updated", "event.deleted"],
  "secret": "whsec_abc123"
}
```

**Response (201 Created):**
```json
{
  "webhook_id": "wh_123abc",
  "sync_id": "sync_789abc",
  "webhook_url": "https://crm.example.com/webhooks/calendar-sync",
  "status": "active",
  "created_at": "2026-04-02T10:00:00Z",
  "last_triggered_at": null,
  "delivery_count": 0
}
```

---

#### POST /webhooks/receive
Receive webhook notification. Called by sync service when events change.

**Request (from Sync Service to CRM/ERP):**
```json
{
  "webhook_id": "wh_123abc",
  "timestamp": "2026-04-02T10:05:12Z",
  "event_type": "event.updated",
  "sync_id": "sync_789abc",
  "event": {
    "event_id": "uuid-1",
    "source_system": "erp",
    "title": "Call with Acme Corp",
    "start_time": "2026-04-05T14:00:00Z",
    "updated_at": "2026-04-02T10:05:10Z"
  },
  "signature": "sha256=abc123def456..."
}
```

**Signature Verification** (HMAC-SHA256):
```
signature = HMAC-SHA256(
  secret: webhook_secret,
  message: webhook_id + timestamp + event_type + JSON(event)
)
```

**Expected Response (CRM/ERP returns 200):**
```json
{
  "status": "ok",
  "received_at": "2026-04-02T10:05:12Z",
  "processed": true
}
```

**Webhook Retry Logic** (if CRM/ERP returns 5xx or timeout):
- Retry 1: After 5 seconds
- Retry 2: After 30 seconds
- Retry 3: After 2 minutes
- Max retries: 5
- If all retries fail: Mark calendar sync as "degraded", alert admin

---

### 4. Health Check & Sync Status

#### GET /status
Check sync service health and last sync times.

**Response:**
```json
{
  "status": "healthy",
  "uptime_seconds": 86400,
  "timestamp": "2026-04-02T11:00:00Z",
  "syncs": {
    "active": 5,
    "paused": 1,
    "failed": 0
  },
  "events": {
    "total_synced": 1247,
    "pending": 0,
    "failed": 0
  },
  "webhooks": {
    "delivered": 1200,
    "failed": 5,
    "success_rate": "99.58%"
  },
  "database": {
    "status": "connected",
    "latency_ms": 2
  },
  "last_sync": {
    "sync_id": "sync_789abc",
    "synced_at": "2026-04-02T10:55:30Z",
    "event_count": 3
  }
}
```

---

## Event Schema (iCalendar-Inspired)

Complete JSON schema for calendar events:

```json
{
  "event_id": "uuid",
  "type": "Event",
  "source_system": "crm|erp",
  "source_id": "string",
  "calendar_id": "uuid",
  "title": "string (1-255 chars)",
  "description": "string (optional, <5000 chars)",
  "start_time": "ISO8601 with timezone, e.g. 2026-04-05T14:00:00-07:00",
  "end_time": "ISO8601 with timezone",
  "all_day": "boolean",
  "location": "string (optional)",
  "timezone": "IANA timezone, e.g. America/Los_Angeles (defaults to UTC if omitted)",
  "attendees": [
    {
      "email": "string (required)",
      "name": "string (optional)",
      "role": "organizer|attendee|optional (default: attendee)",
      "status": "accepted|declined|tentative|needs-action (default: needs-action)",
      "rsvp_required": "boolean (default: true)",
      "send_notification": "boolean (default: true)"
    }
  ],
  "recurrence_rule": "RRULE string from RFC 5545, or null for non-recurring",
  "recurrence_dates": ["ISO8601", "..."] (optional, for exception dates),
  "status": "confirmed|tentative|cancelled",
  "priority": "0-9 (0=none, 1=high, 5=normal, 9=low, default: 5)",
  "color": "string (e.g. 'red', 'blue', hex '#FF0000', default: 'blue')",
  "busy_status": "busy|free|tentative",
  "created_at": "ISO8601 UTC (system-managed)",
  "updated_at": "ISO8601 UTC (system-managed, determines conflict winner)",
  "deleted_at": "ISO8601 UTC (optional, soft-delete)",
  "synced_at": "ISO8601 UTC (last sync time, system-managed)",
  "sync_version": "integer (incremented on each sync)",
  "metadata": {
    "crm_opportunity_id": "string (CRM-specific data)",
    "crm_owner_id": "string",
    "erp_project_id": "string (ERP-specific data)",
    "erp_task_id": "string",
    "custom_field_1": "string"
  }
}
```

**Validation Rules:**
- `title`: Required, 1-255 characters
- `start_time`, `end_time`: Required, ISO8601 format
- `start_time` < `end_time` (unless all_day)
- `attendees[].email`: Valid email format
- `recurrence_rule`: Must be valid RRULE (RFC 5545)
- `timezone`: Must be valid IANA timezone (America/Los_Angeles, Europe/London, etc.)

---

## Sync Flows: ASCII Diagrams

### Flow 1: CRM Creates Event → ERP

```
CRM User Interface
        │
        └─ Create Event: "Call with Acme"
           │
           ▼
CRM Database (saves event)
           │
           └─ INSERT event (event_id: uuid-1)
              │
              ▼
CRM Express Middleware (onEventCreate hook)
           │
           └─ POST /api/sync/events
              │
              │ Request: {
              │   sync_id: sync_789abc,
              │   events: [{ event_id: uuid-1, action: "create", ... }]
              │ }
              │
              ▼
Sync Service (receives event)
           │
           ├─ Validate event schema ✓
           ├─ Check for conflicts (first sync, no conflicts)
           ├─ Store in sync DB: event_id_mapping = { crm: uuid-1 → erp: uuid-2 }
           │
           └─ Webhook to ERP: POST /webhooks/receive
              │
              │ {
              │   event_type: "event.created",
              │   event: { title: "Call with Acme", ... }
              │ }
              │
              ▼
ERP Django Signal (onWebhookReceived)
           │
           ├─ Validate signature (HMAC-SHA256) ✓
           ├─ Create event in ERP database
           ├─ Map source_id: uuid-1 (CRM) → uuid-2 (ERP)
           │
           ▼
ERP Webhook Response: { status: "ok" }
           │
           ▼
Sync Service (confirms delivery)
           │
           └─ Update sync_db: synced_at = 2026-04-02T10:05:12Z
              delivery_status = "success"

Timeline:
- t=0s: CRM creates event
- t=0.2s: Event posted to sync service
- t=0.3s: Sync validates and stores mapping
- t=0.5s: Webhook sent to ERP
- t=0.7s: ERP receives webhook, creates event
- t=0.8s: ERP returns 200 OK
- t=0.9s: Sync service marks as synced

Total latency: ~0.9 seconds
```

---

### Flow 2: ERP Updates Event → CRM

```
ERP User updates attendee (accept RSVP)
        │
        ▼
ERP Database (updates event)
        │
        └─ UPDATE event SET attendees = [...], updated_at = 2026-04-02T10:15:00Z
           │
           ▼
ERP Django Signal (onEventUpdate)
        │
        └─ POST /api/sync/events
           │
           │ Request: {
           │   sync_id: sync_789abc,
           │   events: [{
           │     event_id: uuid-2,
           │     source_id: "erp_event_999",
           │     source_system: "erp",
           │     action: "update",
           │     updated_at: 2026-04-02T10:15:00Z,
           │     field_changes: ["attendees"],
           │     ...
           │   }]
           │ }
           │
           ▼
Sync Service (receives update)
        │
        ├─ Look up sync mapping: uuid-2 (ERP) ↔ uuid-1 (CRM)
        ├─ Check last sync: CRM version updated_at = 2026-04-02T09:30:00Z
        ├─ Compare timestamps:
        │   └─ ERP updated_at = 2026-04-02T10:15:00Z (NEWER)
        │   └─ CRM updated_at = 2026-04-02T09:30:00Z (older)
        │   └─ ERP WINS (last-write-wins)
        │
        └─ Webhook to CRM: POST /webhooks/receive
           │
           │ {
           │   event_type: "event.updated",
           │   event: {
           │     event_id: uuid-1,
           │     source_system: "erp",
           │     source_id: uuid-2,
           │     attendees: [...accepted RSVP...],
           │     updated_at: 2026-04-02T10:15:00Z
           │   }
           │ }
           │
           ▼
CRM Express Middleware (onWebhookReceived)
        │
        ├─ Validate signature ✓
        ├─ Load event uuid-1 from DB
        ├─ Check timestamp: 2026-04-02T09:30:00Z < 2026-04-02T10:15:00Z ✓
        ├─ Update event: attendees = [...accepted...], updated_at = 2026-04-02T10:15:00Z
        │
        ▼
CRM Webhook Response: { status: "ok" }
        │
        ▼
Sync Service (confirms)
        │
        └─ Log: event uuid-1 synced from ERP, version 2

Timeline:
- t=0s: ERP user accepts RSVP
- t=0.1s: Event updated in ERP DB
- t=0.2s: Sync service receives update
- t=0.3s: Sync validates and prepares webhook
- t=0.4s: Webhook sent to CRM
- t=0.6s: CRM receives webhook, updates event
- t=0.7s: CRM returns 200 OK
- t=0.8s: Sync service marks as synced

Total latency: ~0.8 seconds
```

---

### Flow 3: Conflict Resolution (Both Systems Update Simultaneously)

```
Scenario: CRM and ERP both update same event within 2 seconds
Event: "Call with Acme" (uuid-1 in CRM, uuid-2 in ERP)

Timeline:
- t=0s: CRM user updates title → "Call with Acme & Competitors"
         CRM updates_at = 2026-04-02T10:15:00.100Z

- t=1s: ERP user updates title → "Acme Discussion - Q2 Planning"
         ERP updated_at = 2026-04-02T10:15:01.200Z

        Both systems try to sync simultaneously

Route 1: CRM sends to Sync Service first
        │
        ├─ Sync receives from CRM:
        │   └─ event_id: uuid-1, updated_at: 2026-04-02T10:15:00.100Z
        │   └─ title: "Call with Acme & Competitors"
        │
        ├─ Forwards to ERP via webhook
        │
        └─ Sync receives from ERP:
           └─ event_id: uuid-2, updated_at: 2026-04-02T10:15:01.200Z
           └─ title: "Acme Discussion - Q2 Planning"

Route 2: Sync Service detects conflict
        │
        ├─ Timestamp comparison:
        │   └─ CRM: 2026-04-02T10:15:00.100Z
        │   └─ ERP: 2026-04-02T10:15:01.200Z
        │   └─ ERP is LATER (winner)
        │
        ├─ Decision: Use ERP's title
        │
        └─ Send update to CRM:
           POST /webhooks/receive
           {
             event_type: "event.updated",
             event: {
               title: "Acme Discussion - Q2 Planning",
               updated_at: 2026-04-02T10:15:01.200Z,
               sync_version: 3
             },
             conflict_resolution: {
               strategy: "last-write-wins",
               winner: "erp",
               loser_timestamp: "2026-04-02T10:15:00.100Z"
             }
           }

Result:
- CRM's title: "Call with Acme & Competitors" → overwrit… no, ERP wins
- ERP's title: "Acme Discussion - Q2 Planning" ✓ (kept, both systems now have this)
- Sync log: Conflict detected, ERP version applied
- Admin notification: "Event conflict resolved using ERP version"
```

---

### Flow 4: Initial Full Sync (First Connection)

```
CRM Admin connects ERP for first time
        │
        └─ POST /api/sync/calendars
           {
             system: "crm",
             calendar_name: "Sales Team",
             webhook_endpoint: "https://crm.example.com/webhooks/..."
           }
           │
           ▼
Sync Service (receives registration)
        │
        ├─ Create sync record in DB (sync_id: sync_789abc)
        ├─ Status: "awaiting_full_sync"
        ├─ Schedule full sync job
        │
        └─ Respond to CRM: { sync_id: sync_789abc, status: "awaiting_full_sync" }
           │
           ▼
Sync Service (full sync job runs every 5 minutes)
        │
        ├─ Pull ALL events from CRM:
        │   └─ GET /calendars/{cal_id}/events (no time filter)
        │   └─ Returns: 347 events
        │
        ├─ Pull ALL events from ERP:
        │   └─ GET /calendars/{cal_id}/events
        │   └─ Returns: 289 events
        │
        ├─ De-duplication:
        │   └─ Match by: title + start_time + attendees
        │   └─ 145 events match (already exist in both)
        │   └─ 202 events unique to CRM
        │   └─ 144 events unique to ERP
        │
        ├─ Create mappings for matched events:
        │   └─ INSERT event_sync_mapping: crm_event_id ↔ erp_event_id
        │
        ├─ Sync unique events:
        │   └─ Push 202 CRM-only events to ERP
        │   └─ Push 144 ERP-only events to CRM
        │
        │   Batched push (to avoid overwhelming webhook):
        │   └─ Push in batches of 50 events
        │   └─ Wait for successful webhook ack
        │   └─ Continue next batch
        │
        ├─ Status updates:
        │   └─ After each batch: update_at sync_db
        │   └─ Emit webhook: { event_type: "sync.progress", progress: "50/346" }
        │
        ▼
After All Syncs Complete
        │
        └─ Update sync record:
           status = "active"
           last_sync_at = 2026-04-02T11:00:00Z
           event_mapping_count = 347 (CRM) + 289 (ERP) - 145 (duplicates) = 491 unique

           Send notification to both systems:
           {
             event_type: "sync.completed",
             summary: {
               events_synced: 346,
               crm_new: 202,
               erp_new: 144,
               duplicates_resolved: 145,
               duration_seconds: 180
             }
           }

Timeline:
- t=0s: CRM requests sync
- t=5s: Sync job starts (next scheduled run)
- t=8s: Pulled all events from both systems
- t=15s: De-duplication complete, mappings created
- t=20s: Begin pushing batches
- t=180s: All 346 events synced
- t=182s: Sync service sends completion notification

Future syncs (incremental):
- Every 5 minutes: polling GET /events?since=last_sync_at
- Real-time: webhooks when events created/updated/deleted
```

---

### Flow 5: Webhook Failure → Polling Fallback

```
Event Created in CRM
        │
        ├─ POST to Sync Service ✓ (sync records it)
        │
        ├─ Sync attempts webhook to ERP:
        │   └─ POST https://erp.example.com/webhooks/receive
        │   └─ Network timeout (ERP server down)
        │   └─ Retry 1: wait 5s, retry
        │   └─ Retry 2: wait 30s, retry
        │   └─ Retry 3: wait 2m, retry
        │   └─ All retries failed ✗
        │
        ├─ Update sync status: "degraded"
        │   └─ Send alert to admin: "ERP calendar sync failing"
        │
        └─ Event marked: synced_at = null, retry_count = 3

Meanwhile, ERP Server Comes Back Online
        │
        ├─ ERP system starts
        ├─ Express middleware checks sync status
        │
        └─ Manual sync trigger OR automatic polling:
           └─ GET /api/sync/events?since=2026-04-02T10:00:00Z
              (fetch all events created after last successful sync)

           Response includes:
           {
             data: [
               {
                 event_id: "uuid-1",
                 title: "Call with Acme",
                 created_at: "2026-04-02T10:05:00Z",
                 updated_at: "2026-04-02T10:05:00Z"
               },
               ... (all other events created while ERP was down)
             ]
           }

           ├─ ERP processes all missing events
           ├─ Creates them in local database
           ├─ Updates sync status: "active"
           │
           └─ Sync service detects ERP is back:
              └─ Update sync_db: status = "active"
              └─ Emit notification: "ERP calendar sync recovered"

Timeline:
- t=0s: CRM creates event
- t=0.2s: Posted to sync service
- t=1s: Webhook to ERP attempted (fails, network down)
- t=7s: Retry 1 (fails)
- t=40s: Retry 2 (fails)
- t=2m40s: Retry 3 (fails)
- t=2m50s: Sync status marked "degraded"
- t=15m: ERP server comes back online
- t=15m10s: ERP polls /api/sync/events?since=2026-04-02T10:00:00Z
- t=15m15s: Missing event retrieved via polling
- t=15m20s: Sync status restored to "active"

Result: Event eventually synced via polling fallback (15 minute delay)
Without polling, event would be lost (webhook exhausted retries)
```

---

## Implementation Notes

### CRM Side (Node.js/Express)

**Middleware Hook on Event CRUD:**
```typescript
// src/middleware/calendarSync.ts
import axios from 'axios';

const SYNC_SERVICE_URL = process.env.CALENDAR_SYNC_URL || 'http://localhost:13500/api/sync';

export const syncEventCreate = async (event: IEvent) => {
  try {
    await axios.post(`${SYNC_SERVICE_URL}/events`, {
      sync_id: process.env.SYNC_ID,
      events: [
        {
          event_id: event._id,
          source_system: 'crm',
          source_id: event._id,
          action: 'create',
          title: event.title,
          description: event.description,
          start_time: event.startTime,
          end_time: event.endTime,
          all_day: event.allDay,
          attendees: event.attendees,
          status: 'confirmed',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
      ]
    }, {
      headers: { 'Authorization': `Bearer ${process.env.SYNC_API_KEY}` }
    });
  } catch (error) {
    // Log error but don't block event creation
    console.error('Sync error:', error);
    // Queue for retry later
  }
};

// Hook in Express after saving event
router.post('/events', async (req, res) => {
  const event = new Event(req.body);
  await event.save();

  // Async sync (don't wait for response)
  syncEventCreate(event).catch(console.error);

  res.status(201).json(event);
});
```

**Webhook Receiver:**
```typescript
router.post('/webhooks/calendar-sync', async (req, res) => {
  const { event, signature } = req.body;

  // Verify signature
  const computed = crypto
    .createHmac('sha256', process.env.WEBHOOK_SECRET)
    .update(JSON.stringify(event))
    .digest('hex');

  if (signature !== computed) {
    return res.status(401).json({ error: 'Invalid signature' });
  }

  // Update or create event
  if (event.source_system === 'erp') {
    await Event.findByIdAndUpdate(event.event_id, {
      ...event,
      updated_at: new Date(event.updated_at),
      synced_at: new Date(),
    }, { upsert: true });
  }

  res.json({ status: 'ok' });
});
```

**Polling Fallback (runs every 5 minutes):**
```typescript
setInterval(async () => {
  const lastSync = await redis.get('calendar:last_sync');
  const since = lastSync || new Date(Date.now() - 24*60*60*1000).toISOString(); // default 24h ago

  const response = await axios.get(`${SYNC_SERVICE_URL}/events`, {
    params: { since, sync_id: process.env.SYNC_ID },
    headers: { 'Authorization': `Bearer ${process.env.SYNC_API_KEY}` }
  });

  for (const event of response.data.data) {
    if (event.source_system !== 'crm') {
      await Event.findByIdAndUpdate(event.event_id, event, { upsert: true });
    }
  }

  await redis.set('calendar:last_sync', new Date().toISOString());
}, 5 * 60 * 1000); // 5 minutes
```

---

### ERP Side (Django)

**Signal Handler on Event Save:**
```python
# erp/calendar/signals.py
from django.db.models.signals import post_save
from django.dispatch import receiver
import requests
import json

SYNC_SERVICE_URL = os.getenv('CALENDAR_SYNC_URL', 'http://localhost:13500/api/sync')

@receiver(post_save, sender=CalendarEvent)
def sync_event_to_crm(sender, instance, created, **kwargs):
    """Post event changes to sync service"""

    sync_id = os.getenv('SYNC_ID')
    api_key = os.getenv('SYNC_API_KEY')

    payload = {
        'sync_id': sync_id,
        'events': [{
            'event_id': str(instance.id),
            'source_system': 'erp',
            'source_id': str(instance.id),
            'action': 'create' if created else 'update',
            'title': instance.title,
            'description': instance.description,
            'start_time': instance.start_time.isoformat(),
            'end_time': instance.end_time.isoformat(),
            'all_day': instance.all_day,
            'attendees': [
                {
                    'email': att.email,
                    'name': att.get_full_name(),
                    'status': att.status
                } for att in instance.attendees.all()
            ],
            'status': 'confirmed',
            'created_at': instance.created_at.isoformat(),
            'updated_at': instance.updated_at.isoformat(),
        }]
    }

    try:
        requests.post(
            f'{SYNC_SERVICE_URL}/events',
            json=payload,
            headers={'Authorization': f'Bearer {api_key}'},
            timeout=5
        )
    except Exception as e:
        logger.error(f'Sync error: {e}')
        # Don't block event save, queue for retry

# In models.py
class CalendarEvent(models.Model):
    # ... fields ...

    def save(self, *args, **kwargs):
        super().save(*args, **kwargs)
        # Signal automatically fires here
```

**Webhook Receiver (Django view):**
```python
# erp/calendar/views.py
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods
from django.views.decorators.csrf import csrf_exempt
import hmac
import hashlib

@csrf_exempt
@require_http_methods(['POST'])
def calendar_webhook(request):
    """Receive calendar sync webhook from sync service"""

    import json
    data = json.loads(request.body)

    # Verify signature
    secret = os.getenv('WEBHOOK_SECRET')
    message = json.dumps(data['event'], sort_keys=True)
    expected_sig = hmac.new(
        secret.encode(),
        message.encode(),
        hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(data['signature'], expected_sig):
        return JsonResponse({'error': 'Invalid signature'}, status=401)

    # Update or create event
    event_data = data['event']
    if event_data.get('source_system') != 'erp':
        CalendarEvent.objects.update_or_create(
            id=event_data['event_id'],
            defaults={
                'title': event_data['title'],
                'description': event_data.get('description', ''),
                'start_time': event_data['start_time'],
                'end_time': event_data['end_time'],
                'all_day': event_data.get('all_day', False),
                'updated_at': event_data['updated_at'],
                'synced_at': now(),
            }
        )

    return JsonResponse({'status': 'ok'})
```

---

### Sync Service (Standalone Node.js)

**Database Schema (PostgreSQL):**
```sql
-- Sync registrations
CREATE TABLE calendar_syncs (
  sync_id UUID PRIMARY KEY,
  system VARCHAR(10) NOT NULL,  -- 'crm' or 'erp'
  system_url VARCHAR(255),
  calendar_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active',  -- active, paused, failed
  webhook_endpoint VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  last_sync_at TIMESTAMP,
  next_sync_at TIMESTAMP
);

-- Event mappings
CREATE TABLE event_sync_mappings (
  id UUID PRIMARY KEY,
  sync_id UUID REFERENCES calendar_syncs(sync_id),
  crm_event_id VARCHAR(255),
  erp_event_id VARCHAR(255),
  crm_source_id VARCHAR(255),
  erp_source_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  synced_at TIMESTAMP,
  sync_version INT DEFAULT 0,
  UNIQUE(crm_event_id, erp_event_id)
);

-- Sync history (for audit/debugging)
CREATE TABLE sync_history (
  id UUID PRIMARY KEY,
  sync_id UUID REFERENCES calendar_syncs(sync_id),
  event_id VARCHAR(255),
  action VARCHAR(50),  -- created, updated, deleted, conflict_resolved
  source_system VARCHAR(10),
  timestamp TIMESTAMP DEFAULT NOW(),
  details JSONB
);

CREATE INDEX idx_event_sync_mappings_sync_id ON event_sync_mappings(sync_id);
CREATE INDEX idx_event_sync_mappings_crm_event ON event_sync_mappings(crm_event_id);
CREATE INDEX idx_event_sync_mappings_erp_event ON event_sync_mappings(erp_event_id);
CREATE INDEX idx_sync_history_sync_id ON sync_history(sync_id);
```

---

## Error Handling & Status Codes

| Code | Meaning | Handling |
|------|---------|----------|
| 200 | Success | Proceed normally |
| 201 | Created | Sync record or event created |
| 202 | Accepted | Event queued for processing (async) |
| 400 | Bad Request | Invalid event schema, check field validation |
| 401 | Unauthorized | Invalid API key or sync_id, check credentials |
| 409 | Conflict | Conflicting update, last-write-wins applied, check response for winner |
| 422 | Unprocessable Entity | Event validation failed (bad email, invalid time), see response details |
| 429 | Rate Limited | Too many requests, wait before retrying |
| 500 | Server Error | Sync service error, retry with exponential backoff |
| 503 | Service Unavailable | Sync service down, fall back to polling |

---

## Environment Variables

**.env.sync-service:**
```
# Sync Service Config
PORT=13500
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@localhost:5432/calendar_sync

# CRM Config
CRM_URL=https://crm.example.com
CRM_API_KEY=sk_live_crm_xxx
CRM_WEBHOOK_SECRET=whsec_crm_yyy

# ERP Config
ERP_URL=https://erp.example.com
ERP_API_KEY=sk_live_erp_xxx
ERP_WEBHOOK_SECRET=whsec_erp_yyy

# Polling
POLLING_INTERVAL_MINUTES=5
FULL_SYNC_INTERVAL_HOURS=24

# Webhooks
WEBHOOK_RETRY_MAX=5
WEBHOOK_RETRY_BACKOFF_MS=5000
WEBHOOK_TIMEOUT_MS=10000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json
```

---

## Testing the Calendar Sync API

### Manual Test with cURL

**Register CRM calendar:**
```bash
curl -X POST http://localhost:13500/api/sync/calendars \
  -H "Content-Type: application/json" \
  -d '{
    "system": "crm",
    "system_url": "https://crm.example.com",
    "calendar_name": "Sales Team",
    "webhook_endpoint": "https://crm.example.com/webhooks/calendar-sync",
    "api_key": "sk_live_abc123"
  }'
```

**Push event:**
```bash
curl -X POST http://localhost:13500/api/sync/events \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk_live_abc123" \
  -d '{
    "sync_id": "sync_789abc",
    "events": [{
      "event_id": "uuid-1",
      "source_system": "crm",
      "source_id": "deal_12345",
      "action": "create",
      "title": "Call with Acme Corp",
      "start_time": "2026-04-05T14:00:00Z",
      "end_time": "2026-04-05T15:00:00Z",
      "status": "confirmed"
    }]
  }'
```

**Pull events since timestamp:**
```bash
curl -X GET "http://localhost:13500/api/sync/events?since=2026-04-02T10:00:00Z&sync_id=sync_789abc" \
  -H "Authorization: Bearer sk_live_abc123"
```

**Check sync status:**
```bash
curl http://localhost:13500/api/sync/status
```

---

## Monitoring & Observability

### Metrics to Track

- `calendar_events_synced_total` (counter): Total events synced
- `calendar_sync_latency_ms` (histogram): Time from event creation to sync complete
- `calendar_webhook_delivery_success_rate` (gauge): % of webhooks delivered
- `calendar_webhook_retry_count` (counter): Number of webhook retries
- `calendar_conflict_resolved_total` (counter): Conflicts resolved via last-write-wins
- `calendar_sync_database_latency_ms` (histogram): Database query latency

### Logs to Collect

```json
{
  "timestamp": "2026-04-02T10:05:00Z",
  "level": "info",
  "event_type": "event.synced",
  "sync_id": "sync_789abc",
  "event_id": "uuid-1",
  "source_system": "crm",
  "target_system": "erp",
  "action": "create",
  "latency_ms": 850,
  "status": "success"
}
```

---

## Security Considerations

1. **API Key Rotation**: Rotate keys quarterly, support multiple keys during rotation
2. **TLS Only**: All endpoints require HTTPS in production
3. **Rate Limiting**: 100 requests/minute per API key
4. **Signature Verification**: All webhooks signed with HMAC-SHA256
5. **Data Encryption**: PII in `attendees` and `location` fields encrypted at rest
6. **Access Control**: Only registered systems can sync events
7. **Audit Logging**: All sync operations logged with timestamp, actor, action

---

## Future Enhancements

1. **Bulk Operations**: Batch push/pull for >100 events
2. **Event Filtering**: Sync only certain types of events (e.g., "sales calls only")
3. **Timezone Support**: Proper handling of timezone differences between systems
4. **Recurring Event Exceptions**: Handle edits to single occurrences of recurring events
5. **Attendee Workflow**: Sync attendee responses (accepted/declined) with configurable routing
6. **File Attachments**: Store attachments (PDFs, images) for events
7. **Custom Fields**: Extensible metadata model for system-specific fields
8. **Performance Analytics**: Track which queries/webhooks are slowest, generate recommendations

---

**End of Calendar Sync API Specification**
