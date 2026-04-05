# CRM Platform

A high-fidelity Monday.com clone — multi-tenant work management CRM with runtime-configurable boards, 8 view types, visual automations, and 10 industry verticals.

[![Node.js 20+](https://img.shields.io/badge/Node.js-20+-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React 18](https://img.shields.io/badge/React-18+-61DAFB?logo=react&logoColor=black)](https://reactjs.org/)
[![PostgreSQL 15+](https://img.shields.io/badge/PostgreSQL-15+-4169E1?logo=postgresql&logoColor=white)](https://postgresql.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.6+-3178C6?logo=typescript&logoColor=white)](https://typescriptlang.org/)

## Core Differentiator

**Entity-Attribute-Value (EAV) system** allows users to create, customize, and manage unlimited column types (Status, Text, Number, Date, Person, Dropdown, Timeline, Files, Formulas) at runtime — exactly like Monday.com.

## Features

- **15 Dynamic Column Types** — Fully configurable per board via EAV
- **8 Board Views** — Table, Kanban, Calendar, Timeline/Gantt, Dashboard, Map, Chart, Form
- **Real-Time Collaboration** — WebSocket-powered live updates (Socket.io)
- **Visual Automation Builder** — 10-15 trigger/action templates with email, Slack, webhooks
- **Rich Demo Data** — 50-100 records per industry across all entities
- **Multi-Tenant Auth** — JWT with workspace isolation

## Industry Verticals

| Company | Sector | Brand Color |
|---------|--------|-------------|
| NovaPay | FinTech | #2563EB |
| MedVista | Healthcare | #059669 |
| TrustGuard | Insurance | #1E3A5F |
| UrbanNest | Real Estate | #D97706 |
| SwiftRoute | Logistics | #7C3AED |
| DentaFlow | Dental | #06B6D4 |
| JurisPath | Legal | #166534 |
| TableSync | Hospitality | #9F1239 |
| CraneStack | Construction | #EA580C |
| EduPulse | Education | #6D28D9 |

## Stack

| Component | Technology |
|-----------|-----------|
| Frontend | React 18 + TypeScript + Vite + Tailwind CSS |
| Backend | Node.js 20 + Express + Sequelize |
| Database | PostgreSQL 15+ (multi-tenant schema isolation) |
| Real-Time | Socket.io (WebSocket) |
| Auth | JWT (HS256) |
| Deployment | Docker Compose |

## Project Structure

```
├── backend/          # Express API + Sequelize ORM + seeds
├── frontend/         # Core CRM React app
├── frontends/        # Industry-specific branded frontends
│   ├── cranestack/
│   ├── dentaflow/
│   ├── tablesync/
│   ├── trustguard/
│   └── urbannest/
├── novapay/          # NovaPay vertical (FinTech)
├── plans/            # Architecture and design documents
└── docker-compose.yml
```

## Quick Start

```bash
# Start all services
docker-compose up -d

# Seed demo data for an industry
cd backend && npm run seed:novapay
```

## License

Private
