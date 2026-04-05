# CRM Core Platform API Schema

Complete API reference for all 10 industry agents. Every endpoint, request/response shape, WebSocket event, and column type is documented here.

**Base URL:** `http://localhost:13000/api/v1`

**Auth Header:** `Authorization: Bearer <accessToken>`

**Default Credentials:**

| Email                        | Password | Role         |
|------------------------------|----------|--------------|
| admin@crm-platform.com      | admin    | System Admin |
| manager@crm-platform.com    | demo123  | Member       |
| viewer@crm-platform.com     | demo123  | Viewer       |

---

## Response Envelope

All responses follow this envelope structure.

### Success

```json
{
  "success": true,
  "data": { ... },
  "message": "Operation successful",
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 125,
    "totalPages": 3
  }
}
```

The `pagination` field is only present on paginated list endpoints.

### Error

```json
{
  "success": false,
  "error": "Error message here"
}
```

HTTP status codes: `400` (bad request), `401` (unauthorized), `403` (forbidden), `404` (not found), `500` (server error).

---

## Authentication

No auth required except where noted.

### POST /auth/login

Authenticate a user and receive tokens.

**Request:**

```json
{
  "email": "admin@crm-platform.com",
  "password": "admin"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@crm-platform.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00.000Z"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/register

Register a new user account.

**Request:**

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "firstName": "Jane",
  "lastName": "Doe",
  "workspaceId": 1
}
```

`workspaceId` is optional. If provided, the user is added to that workspace on creation.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 4,
      "email": "user@example.com",
      "firstName": "Jane",
      "lastName": "Doe",
      "role": "member",
      "avatar": null,
      "createdAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### POST /auth/refresh

Exchange a refresh token for a new access token.

**Request:**

```json
{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

### POST /auth/logout

**Auth required.**

Invalidate the current session.

**Request:** No body required. Send the `Authorization` header.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Logged out successfully"
  }
}
```

### GET /auth/me

**Auth required.**

Retrieve the current authenticated user.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@crm-platform.com",
      "firstName": "Admin",
      "lastName": "User",
      "role": "admin",
      "avatar": null,
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

### PUT /auth/me

**Auth required.**

Update the current user's profile.

**Request:**

```json
{
  "firstName": "Updated",
  "lastName": "Name",
  "avatar": "https://example.com/avatar.png"
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "email": "admin@crm-platform.com",
      "firstName": "Updated",
      "lastName": "Name",
      "role": "admin",
      "avatar": "https://example.com/avatar.png",
      "createdAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

---

## Workspaces

All endpoints require authentication.

### GET /workspaces

List all workspaces the authenticated user has access to.

**Response:**

```json
{
  "success": true,
  "data": {
    "workspaces": [
      {
        "id": 1,
        "name": "My Workspace",
        "slug": "my-workspace",
        "description": "Main workspace",
        "settings": {},
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /workspaces/:id

Get a single workspace by ID.

**Response:**

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": 1,
      "name": "My Workspace",
      "slug": "my-workspace",
      "description": "Main workspace",
      "settings": {},
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /workspaces

**Admin only.**

Create a new workspace.

**Request:**

```json
{
  "name": "New Workspace",
  "slug": "new-workspace",
  "description": "Optional description"
}
```

`description` is optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": 2,
      "name": "New Workspace",
      "slug": "new-workspace",
      "description": "Optional description",
      "settings": {},
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT /workspaces/:id

**Admin only.**

Update an existing workspace.

**Request:**

```json
{
  "name": "Renamed Workspace",
  "description": "Updated description",
  "settings": { "theme": "dark" }
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "workspace": {
      "id": 1,
      "name": "Renamed Workspace",
      "slug": "my-workspace",
      "description": "Updated description",
      "settings": { "theme": "dark" },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### DELETE /workspaces/:id

**Admin only.**

Delete a workspace and all its boards, items, and associated data.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Workspace deleted successfully"
  }
}
```

---

## Boards

All endpoints require authentication and workspace access.

Base path: `/workspaces/:wsId/boards`

### GET /workspaces/:wsId/boards

List all boards in a workspace.

**Response:**

```json
{
  "success": true,
  "data": {
    "boards": [
      {
        "id": 1,
        "name": "Sales Pipeline",
        "description": "Track all deals",
        "workspaceId": 1,
        "settings": {},
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET /workspaces/:wsId/boards/:id

Get a single board with its groups, columns, and views included.

**Response:**

```json
{
  "success": true,
  "data": {
    "board": {
      "id": 1,
      "name": "Sales Pipeline",
      "description": "Track all deals",
      "workspaceId": 1,
      "settings": {},
      "groups": [
        {
          "id": 1,
          "name": "New Leads",
          "color": "#579BFC",
          "position": 0,
          "boardId": 1
        }
      ],
      "columns": [
        {
          "id": 1,
          "name": "Status",
          "columnType": "status",
          "config": {
            "labels": [
              { "label": "New", "color": "#C4C4C4" },
              { "label": "Working", "color": "#FDAB3D" },
              { "label": "Done", "color": "#00C875" }
            ]
          },
          "width": 150,
          "position": 0,
          "boardId": 1
        }
      ],
      "views": [
        {
          "id": 1,
          "name": "Main Table",
          "viewType": "table",
          "settings": {},
          "layoutJson": null,
          "boardId": 1
        }
      ],
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

### POST /workspaces/:wsId/boards

Create a new board.

**Request:**

```json
{
  "name": "Project Tracker",
  "description": "Track project milestones"
}
```

`description` is optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "board": {
      "id": 2,
      "name": "Project Tracker",
      "description": "Track project milestones",
      "workspaceId": 1,
      "settings": {},
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT /workspaces/:wsId/boards/:id

Update a board.

**Request:**

```json
{
  "name": "Updated Board Name",
  "description": "New description",
  "settings": { "defaultView": "kanban" }
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "board": {
      "id": 1,
      "name": "Updated Board Name",
      "description": "New description",
      "workspaceId": 1,
      "settings": { "defaultView": "kanban" },
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### DELETE /workspaces/:wsId/boards/:id

Delete a board and all its groups, columns, items, and views.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Board deleted successfully"
  }
}
```

### POST /workspaces/:wsId/boards/:id/duplicate

Duplicate a board including all groups, columns, and views (items are not duplicated).

**Response:**

```json
{
  "success": true,
  "data": {
    "board": {
      "id": 3,
      "name": "Sales Pipeline (copy)",
      "description": "Track all deals",
      "workspaceId": 1,
      "settings": {},
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

---

## Board Groups

Base path: `/workspaces/:wsId/boards/:boardId/groups`

### GET .../boards/:boardId/groups

List all groups in a board.

**Response:**

```json
{
  "success": true,
  "data": {
    "groups": [
      {
        "id": 1,
        "name": "New Leads",
        "color": "#579BFC",
        "position": 0,
        "boardId": 1
      },
      {
        "id": 2,
        "name": "Qualified",
        "color": "#00C875",
        "position": 1,
        "boardId": 1
      }
    ]
  }
}
```

### POST .../boards/:boardId/groups

Create a new group.

**Request:**

```json
{
  "name": "In Progress",
  "color": "#FDAB3D",
  "position": 2
}
```

`color` and `position` are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "group": {
      "id": 3,
      "name": "In Progress",
      "color": "#FDAB3D",
      "position": 2,
      "boardId": 1
    }
  }
}
```

### PUT .../boards/:boardId/groups/:id

Update a group.

**Request:**

```json
{
  "name": "Renamed Group",
  "color": "#E2445C",
  "position": 0
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "group": {
      "id": 1,
      "name": "Renamed Group",
      "color": "#E2445C",
      "position": 0,
      "boardId": 1
    }
  }
}
```

### DELETE .../boards/:boardId/groups/:id

Delete a group. Items in the group are moved to the first remaining group or deleted.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Group deleted successfully"
  }
}
```

### PUT .../boards/:boardId/groups/reorder

Reorder all groups in a board. Provide the full ordered list of group IDs.

**Request:**

```json
{
  "groupIds": [3, 1, 2]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "groups": [
      { "id": 3, "name": "In Progress", "color": "#FDAB3D", "position": 0, "boardId": 1 },
      { "id": 1, "name": "New Leads", "color": "#579BFC", "position": 1, "boardId": 1 },
      { "id": 2, "name": "Qualified", "color": "#00C875", "position": 2, "boardId": 1 }
    ]
  }
}
```

---

## Columns

Base path: `/workspaces/:wsId/boards/:boardId/columns`

### GET .../boards/:boardId/columns

List all columns in a board.

**Response:**

```json
{
  "success": true,
  "data": {
    "columns": [
      {
        "id": 1,
        "name": "Status",
        "columnType": "status",
        "config": {
          "labels": [
            { "label": "New", "color": "#C4C4C4" },
            { "label": "Working", "color": "#FDAB3D" },
            { "label": "Done", "color": "#00C875" }
          ]
        },
        "width": 150,
        "position": 0,
        "boardId": 1
      },
      {
        "id": 2,
        "name": "Deal Value",
        "columnType": "number",
        "config": { "decimals": 2, "prefix": "$" },
        "width": 120,
        "position": 1,
        "boardId": 1
      }
    ]
  }
}
```

### POST .../boards/:boardId/columns

Create a new column.

**Request:**

```json
{
  "name": "Priority",
  "columnType": "dropdown",
  "config": {
    "options": ["High", "Medium", "Low"],
    "multiple": false
  },
  "position": 2
}
```

`config` and `position` are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "column": {
      "id": 3,
      "name": "Priority",
      "columnType": "dropdown",
      "config": {
        "options": ["High", "Medium", "Low"],
        "multiple": false
      },
      "width": 150,
      "position": 2,
      "boardId": 1
    }
  }
}
```

### PUT .../boards/:boardId/columns/:id

Update a column.

**Request:**

```json
{
  "name": "Updated Name",
  "config": { "options": ["Critical", "High", "Medium", "Low"], "multiple": false },
  "width": 200,
  "position": 0
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "column": {
      "id": 3,
      "name": "Updated Name",
      "columnType": "dropdown",
      "config": { "options": ["Critical", "High", "Medium", "Low"], "multiple": false },
      "width": 200,
      "position": 0,
      "boardId": 1
    }
  }
}
```

### DELETE .../boards/:boardId/columns/:id

Delete a column and all its associated values across all items.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Column deleted successfully"
  }
}
```

### PUT .../boards/:boardId/columns/reorder

Reorder all columns in a board.

**Request:**

```json
{
  "columnIds": [2, 3, 1]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "columns": [
      { "id": 2, "name": "Deal Value", "columnType": "number", "position": 0, "boardId": 1 },
      { "id": 3, "name": "Priority", "columnType": "dropdown", "position": 1, "boardId": 1 },
      { "id": 1, "name": "Status", "columnType": "status", "position": 2, "boardId": 1 }
    ]
  }
}
```

---

## Items

Base path: `/workspaces/:wsId/boards/:boardId/items`

### GET .../boards/:boardId/items

List items in a board with pagination, filtering, and sorting.

**Query Parameters:**

| Parameter  | Type    | Default | Description                        |
|------------|---------|---------|------------------------------------|
| page       | number  | 1       | Page number                        |
| limit      | number  | 50      | Items per page (max 200)           |
| groupId    | number  | -       | Filter by group ID                 |
| search     | string  | -       | Search items by name               |
| sortBy     | string  | -       | Field to sort by                   |
| sortOrder  | string  | asc     | Sort direction: `asc` or `desc`    |

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Acme Corp Deal",
        "position": 0,
        "groupId": 1,
        "boardId": 1,
        "columnValues": [
          {
            "columnId": 1,
            "value": "Working"
          },
          {
            "columnId": 2,
            "value": 50000
          }
        ],
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-03-20T14:30:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 125,
      "totalPages": 3
    }
  }
}
```

### GET .../boards/:boardId/items/:id

Get a single item with all its column values.

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "name": "Acme Corp Deal",
      "position": 0,
      "groupId": 1,
      "boardId": 1,
      "columnValues": [
        { "columnId": 1, "value": "Working" },
        { "columnId": 2, "value": 50000 },
        { "columnId": 3, "value": "High" }
      ],
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-03-20T14:30:00.000Z"
    }
  }
}
```

### POST .../boards/:boardId/items

Create a new item.

**Request:**

```json
{
  "name": "New Lead - Beta Inc",
  "groupId": 1,
  "columnValues": [
    { "columnId": 1, "value": "New" },
    { "columnId": 2, "value": 25000 },
    { "columnId": 3, "value": "Medium" }
  ]
}
```

`groupId` is optional (defaults to the first group). `columnValues` is optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": 2,
      "name": "New Lead - Beta Inc",
      "position": 1,
      "groupId": 1,
      "boardId": 1,
      "columnValues": [
        { "columnId": 1, "value": "New" },
        { "columnId": 2, "value": 25000 },
        { "columnId": 3, "value": "Medium" }
      ],
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT .../boards/:boardId/items/:id

Update an item's name, position, or group.

**Request:**

```json
{
  "name": "Renamed Item",
  "position": 3,
  "groupId": 2
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "name": "Renamed Item",
      "position": 3,
      "groupId": 2,
      "boardId": 1,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### DELETE .../boards/:boardId/items/:id

Delete an item and all its column values.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "Item deleted successfully"
  }
}
```

### PUT .../boards/:boardId/items/:id/move

Move an item to a different group.

**Request:**

```json
{
  "groupId": 3
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": 1,
      "name": "Acme Corp Deal",
      "position": 0,
      "groupId": 3,
      "boardId": 1,
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT .../boards/:boardId/items/reorder

Reorder items within a board.

**Request:**

```json
{
  "itemIds": [3, 1, 2]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      { "id": 3, "position": 0 },
      { "id": 1, "position": 1 },
      { "id": 2, "position": 2 }
    ]
  }
}
```

---

## Column Values

Base path: `/workspaces/:wsId/boards/:boardId/items/:itemId/values`

### GET .../items/:itemId/values

Get all column values for an item.

**Response:**

```json
{
  "success": true,
  "data": {
    "values": [
      {
        "id": 1,
        "itemId": 1,
        "columnId": 1,
        "value": "Working",
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-03-20T14:30:00.000Z"
      },
      {
        "id": 2,
        "itemId": 1,
        "columnId": 2,
        "value": 50000,
        "createdAt": "2026-01-15T10:00:00.000Z",
        "updatedAt": "2026-03-20T14:30:00.000Z"
      }
    ]
  }
}
```

### PUT .../items/:itemId/values/:columnId

Update a single column value for an item.

**Request:**

```json
{
  "value": "Done"
}
```

The `value` field accepts different types depending on the column type. See the Column Types section for details.

**Response:**

```json
{
  "success": true,
  "data": {
    "columnValue": {
      "id": 1,
      "itemId": 1,
      "columnId": 1,
      "value": "Done",
      "createdAt": "2026-01-15T10:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT .../items/:itemId/values

Bulk update multiple column values for an item.

**Request:**

```json
{
  "values": [
    { "columnId": 1, "value": "Done" },
    { "columnId": 2, "value": 75000 },
    { "columnId": 3, "value": "High" }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "values": [
      { "id": 1, "itemId": 1, "columnId": 1, "value": "Done" },
      { "id": 2, "itemId": 1, "columnId": 2, "value": 75000 },
      { "id": 3, "itemId": 1, "columnId": 3, "value": "High" }
    ]
  }
}
```

---

## Board Views

Base path: `/workspaces/:wsId/boards/:boardId/views`

### GET .../boards/:boardId/views

List all views for a board.

**Response:**

```json
{
  "success": true,
  "data": {
    "views": [
      {
        "id": 1,
        "name": "Main Table",
        "viewType": "table",
        "settings": {},
        "layoutJson": null,
        "boardId": 1,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      },
      {
        "id": 2,
        "name": "Kanban",
        "viewType": "kanban",
        "settings": { "groupByColumnId": 1 },
        "layoutJson": null,
        "boardId": 1,
        "createdAt": "2026-01-01T00:00:00.000Z",
        "updatedAt": "2026-01-01T00:00:00.000Z"
      }
    ]
  }
}
```

### GET .../boards/:boardId/views/:id

Get a single view.

**Response:**

```json
{
  "success": true,
  "data": {
    "view": {
      "id": 1,
      "name": "Main Table",
      "viewType": "table",
      "settings": {},
      "layoutJson": null,
      "boardId": 1,
      "createdAt": "2026-01-01T00:00:00.000Z",
      "updatedAt": "2026-01-01T00:00:00.000Z"
    }
  }
}
```

### POST .../boards/:boardId/views

Create a new view.

**Request:**

```json
{
  "name": "Timeline View",
  "viewType": "timeline",
  "settings": { "dateColumnId": 5 },
  "layoutJson": { "zoom": "month" }
}
```

`settings` and `layoutJson` are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "view": {
      "id": 3,
      "name": "Timeline View",
      "viewType": "timeline",
      "settings": { "dateColumnId": 5 },
      "layoutJson": { "zoom": "month" },
      "boardId": 1,
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT .../boards/:boardId/views/:id

Update a view.

**Request:**

```json
{
  "name": "Updated View",
  "settings": { "dateColumnId": 5, "showWeekends": false },
  "layoutJson": { "zoom": "week" }
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "view": {
      "id": 3,
      "name": "Updated View",
      "viewType": "timeline",
      "settings": { "dateColumnId": 5, "showWeekends": false },
      "layoutJson": { "zoom": "week" },
      "boardId": 1,
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### DELETE .../boards/:boardId/views/:id

Delete a view.

**Response:**

```json
{
  "success": true,
  "data": {
    "message": "View deleted successfully"
  }
}
```

---

## Flat Convenience Routes

These routes are used by industry frontends to simplify common operations. They avoid deeply nested workspace paths.

### GET /boards?workspaceId=

List boards with columns, groups, and views included.

**Query Parameters:**

| Parameter   | Type   | Required | Description          |
|-------------|--------|----------|----------------------|
| workspaceId | number | yes      | Workspace to query   |

**Response:**

```json
{
  "success": true,
  "data": {
    "boards": [
      {
        "id": 1,
        "name": "Sales Pipeline",
        "description": "Track all deals",
        "workspaceId": 1,
        "columns": [ ... ],
        "groups": [ ... ],
        "views": [ ... ]
      }
    ]
  }
}
```

### GET /boards/:id

Get a single board with full details (columns, groups, views).

**Response:**

```json
{
  "success": true,
  "data": {
    "board": {
      "id": 1,
      "name": "Sales Pipeline",
      "description": "Track all deals",
      "workspaceId": 1,
      "columns": [ ... ],
      "groups": [ ... ],
      "views": [ ... ]
    }
  }
}
```

### GET /boards/:boardId/items

Get all items for a board with their column values. Supports the same query parameters as the nested items endpoint (page, limit, groupId, search, sortBy, sortOrder).

**Response:**

```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Acme Corp Deal",
        "position": 0,
        "groupId": 1,
        "boardId": 1,
        "columnValues": [
          { "columnId": 1, "value": "Working" },
          { "columnId": 2, "value": 50000 }
        ]
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 50,
      "total": 125,
      "totalPages": 3
    }
  }
}
```

### POST /items

Create a new item using the flat route. The `values` field uses a key-value map (columnId to value) instead of an array.

**Request:**

```json
{
  "boardId": 1,
  "name": "New Deal - Gamma LLC",
  "groupId": 2,
  "values": {
    "1": "New",
    "2": 30000,
    "3": "Low"
  }
}
```

`groupId` and `values` are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": 5,
      "name": "New Deal - Gamma LLC",
      "position": 0,
      "groupId": 2,
      "boardId": 1,
      "columnValues": [
        { "columnId": 1, "value": "New" },
        { "columnId": 2, "value": 30000 },
        { "columnId": 3, "value": "Low" }
      ],
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT /items/:id

Update an item using the flat route.

**Request:**

```json
{
  "name": "Updated Deal Name",
  "groupId": 3,
  "position": 1
}
```

All fields are optional.

**Response:**

```json
{
  "success": true,
  "data": {
    "item": {
      "id": 5,
      "name": "Updated Deal Name",
      "position": 1,
      "groupId": 3,
      "boardId": 1,
      "createdAt": "2026-04-02T12:00:00.000Z",
      "updatedAt": "2026-04-02T12:00:00.000Z"
    }
  }
}
```

### PUT /items/:id/values

Bulk update column values for an item using the flat route.

**Request:**

```json
{
  "values": [
    { "columnId": 1, "value": "Done" },
    { "columnId": 2, "value": 75000 }
  ]
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "values": [
      { "id": 10, "itemId": 5, "columnId": 1, "value": "Done" },
      { "id": 11, "itemId": 5, "columnId": 2, "value": 75000 }
    ]
  }
}
```

---

## WebSocket Events

Real-time updates via Socket.io on port 13000.

### Connection

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:13000', {
  auth: {
    token: accessToken
  }
});
```

### Subscribe to a Board

```javascript
socket.emit('board:subscribe', boardId);
```

### Unsubscribe from a Board

```javascript
socket.emit('board:unsubscribe', boardId);
```

### Incoming Events

Listen for these events after subscribing to a board:

#### item:created

Fired when a new item is added to the board.

```json
{
  "item": {
    "id": 5,
    "name": "New Item",
    "position": 0,
    "groupId": 1,
    "boardId": 1,
    "columnValues": [],
    "createdAt": "2026-04-02T12:00:00.000Z",
    "updatedAt": "2026-04-02T12:00:00.000Z"
  }
}
```

#### item:updated

Fired when an item's name, position, or group changes.

```json
{
  "item": {
    "id": 5,
    "name": "Updated Item",
    "position": 2,
    "groupId": 3,
    "boardId": 1,
    "createdAt": "2026-04-02T12:00:00.000Z",
    "updatedAt": "2026-04-02T12:05:00.000Z"
  }
}
```

#### item:deleted

Fired when an item is removed.

```json
{
  "itemId": 5,
  "boardId": 1
}
```

#### column:added

Fired when a new column is added to the board.

```json
{
  "column": {
    "id": 10,
    "name": "New Column",
    "columnType": "text",
    "config": {},
    "width": 150,
    "position": 5,
    "boardId": 1
  }
}
```

#### column:updated

Fired when a column's name, config, width, or position changes.

```json
{
  "column": {
    "id": 10,
    "name": "Renamed Column",
    "columnType": "text",
    "config": {},
    "width": 200,
    "position": 5,
    "boardId": 1
  }
}
```

#### column_value:changed

Fired when a cell value is updated.

```json
{
  "itemId": 1,
  "columnId": 2,
  "value": 75000
}
```

#### view:changed

Fired when a view's settings or layout changes.

```json
{
  "view": {
    "id": 1,
    "name": "Main Table",
    "viewType": "table",
    "settings": { "hiddenColumns": [3] },
    "layoutJson": null,
    "boardId": 1
  }
}
```

#### user:online

Fired when a user comes online.

```json
{
  "userId": 2
}
```

#### user:offline

Fired when a user goes offline.

```json
{
  "userId": 2
}
```

---

## Column Types

The `columnType` field accepts the following 15 values. Each type determines what `value` shapes are valid for column values and what `config` options are available.

### status

Predefined labels with colors. Value is the label string.

**Config:**

```json
{
  "labels": [
    { "label": "Done", "color": "#00C875" },
    { "label": "Working", "color": "#FDAB3D" },
    { "label": "Stuck", "color": "#E2445C" },
    { "label": "Not Started", "color": "#C4C4C4" }
  ]
}
```

**Value example:** `"Done"`

### text

Short single-line text. No special config.

**Config:** `{}`

**Value example:** `"Quick note about this item"`

### long_text

Multi-line rich text. No special config.

**Config:** `{}`

**Value example:** `"This is a longer description.\nIt can span multiple lines."`

### number

Numeric values with optional formatting.

**Config:**

```json
{
  "decimals": 2,
  "prefix": "$"
}
```

**Value example:** `50000`

### date

Date or datetime values.

**Config:**

```json
{
  "includeTime": true
}
```

**Value example:** `"2026-04-02"` or `"2026-04-02T14:30:00.000Z"`

### person

Reference to a user by ID.

**Config:** `{}`

**Value example:** `1` (user ID) or `[1, 2]` (multiple people)

### email

Email address.

**Config:** `{}`

**Value example:** `"contact@example.com"`

### phone

Phone number.

**Config:** `{}`

**Value example:** `"+1-555-123-4567"`

### dropdown

Selection from a predefined list.

**Config:**

```json
{
  "options": ["High", "Medium", "Low"],
  "multiple": false
}
```

**Value example:** `"High"` or `["High", "Medium"]` when `multiple: true`

### checkbox

Boolean toggle.

**Config:** `{}`

**Value example:** `true` or `false`

### url

Web URL.

**Config:** `{}`

**Value example:** `"https://example.com"`

### files

File attachments as an array of file objects.

**Config:** `{}`

**Value example:**

```json
[
  {
    "name": "proposal.pdf",
    "url": "https://storage.example.com/files/proposal.pdf",
    "size": 245000
  }
]
```

### formula

Computed column referencing other columns.

**Config:**

```json
{
  "expression": "{Price} * {Quantity}",
  "resultType": "number"
}
```

**Value:** Computed automatically. Read-only.

### timeline

Date range with start and end dates.

**Config:** `{}`

**Value example:**

```json
{
  "start": "2026-04-01",
  "end": "2026-04-30"
}
```

### rating

Star or numeric rating.

**Config:**

```json
{
  "maxRating": 5
}
```

**Value example:** `4`

---

## Quick Reference: Full URL Patterns

For nested routes, the full URL pattern is:

```
http://localhost:13000/api/v1/workspaces/:wsId/boards/:boardId/groups
http://localhost:13000/api/v1/workspaces/:wsId/boards/:boardId/columns
http://localhost:13000/api/v1/workspaces/:wsId/boards/:boardId/items
http://localhost:13000/api/v1/workspaces/:wsId/boards/:boardId/items/:itemId/values
http://localhost:13000/api/v1/workspaces/:wsId/boards/:boardId/views
```

For flat convenience routes:

```
http://localhost:13000/api/v1/boards
http://localhost:13000/api/v1/boards/:id
http://localhost:13000/api/v1/boards/:boardId/items
http://localhost:13000/api/v1/items
http://localhost:13000/api/v1/items/:id
http://localhost:13000/api/v1/items/:id/values
```

---

## Common Workflow Example

Here is a typical workflow an industry agent would follow to set up and populate a board:

```bash
# 1. Authenticate
TOKEN=$(curl -s -X POST http://localhost:13000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crm-platform.com","password":"admin"}' \
  | jq -r '.data.accessToken')

# 2. Get workspace
curl -s http://localhost:13000/api/v1/workspaces \
  -H "Authorization: Bearer $TOKEN" \
  | jq '.data.workspaces[0].id'

# 3. Create a board
curl -s -X POST http://localhost:13000/api/v1/workspaces/1/boards \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"My Industry Board","description":"Customized for this vertical"}'

# 4. Add columns
curl -s -X POST http://localhost:13000/api/v1/workspaces/1/boards/1/columns \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Status","columnType":"status","config":{"labels":[{"label":"Active","color":"#00C875"},{"label":"Inactive","color":"#E2445C"}]}}'

# 5. Create groups
curl -s -X POST http://localhost:13000/api/v1/workspaces/1/boards/1/groups \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name":"Active Clients","color":"#00C875"}'

# 6. Add items (using flat route)
curl -s -X POST http://localhost:13000/api/v1/items \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"boardId":1,"name":"Client ABC","groupId":1,"values":{"1":"Active"}}'

# 7. Update column values
curl -s -X PUT http://localhost:13000/api/v1/items/1/values \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"values":[{"columnId":1,"value":"Active"},{"columnId":2,"value":50000}]}'
```
