# Port Allocation — Project 13: CRM Platform

> All host-exposed ports are globally unique across all 16 projects so every project can run simultaneously. See `../PORT-MAP.md` for the full map.

## Current Assignments

| Service | Host Port | Container Port | File |
|---------|-----------|---------------|------|
| Core CRM API (Express) | **13000** | 13000 | docker-compose.yml |
| NovaPay Frontend | **13001** | 13001 | docker-compose.yml |
| MedVista Frontend | **13002** | 13002 | docker-compose.yml |
| TrustGuard Frontend | **13003** | 13003 | docker-compose.yml |
| UrbanNest Frontend | **13004** | 13004 | docker-compose.yml |
| SwiftRoute Frontend | **13005** | 13005 | docker-compose.yml |
| DentaFlow Frontend | **13006** | 13006 | docker-compose.yml |
| JurisPath Frontend | **13007** | 13007 | docker-compose.yml |
| TableSync Frontend | **13008** | 13008 | docker-compose.yml |
| CraneStack Frontend | **13009** | 13009 | docker-compose.yml |
| EduPulse Frontend | **13010** | 13010 | docker-compose.yml |
| PostgreSQL | **5438** | 5432 | docker-compose.yml |
| Redis | **6383** | 6379 | docker-compose.yml |

> **Why 13xxx?** This project has 11 services (1 backend + 10 industry frontends). The 13xxx range was chosen to give each service its own predictable port without needing a reverse proxy in dev. Each Vite frontend runs on its assigned port inside the container.

## Allowed Range for New Services

If you need to add a new service, use the `13xxx` range **only**:

| Type | Allowed Host Ports |
|------|--------------------|
| Frontend / UI | `13001 – 13099` (13001-13010 taken; use 13011+) |
| Backend / API (scaled instances) | `13101 – 13110` (reserved per CLAUDE.md) |
| PostgreSQL | `5438` (already assigned — do not spin up a second instance) |
| Redis | `6383` (already assigned — do not spin up a second instance) |

## Do Not Use

The `13xxx` range is reserved exclusively for this project and does not conflict with the 3xxx/8xxx convention used by other projects.

Still do not use:
- `3130-3139 / 8130-8139` → conventional slots for P13, kept free in case of future refactor
- `5432-5437` → Projects 02-05, 11, 12 PostgreSQL
- `5439` → Project 15 PostgreSQL
- `6379-6382` → Projects 02, 05, 10, 12 Redis
- `6384-6385` → Projects 15, 16 Redis
