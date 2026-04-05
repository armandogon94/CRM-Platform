# Claude Code Instance Prompts — Quick Reference Index

**File**: `CLAUDE-CODE-INSTANCE-PROMPTS-13.md` (1,153 lines, ~44KB)

---

## Navigation Guide

### Agent 1: Core Platform (Foundation)
- **Role**: Build shared infrastructure for all 10 industries
- **Scope**: Express backend, PostgreSQL schema, EAV engine, 8 views, automations, WebSocket, React library
- **Key Deliverables**: Production-grade foundation code
- **Build Phases**: 4 phases (foundation → EAV → views/automations → polish)
- **Line Range**: 11–390

### Industry Agents (Agents 2–11)

| Agent | Industry | Port | Brand Color | Demo Data | Views/Templates | Automations |
|-------|----------|------|------------|-----------|----------------|-------------|
| 2 | NovaPay | 13001 | #2563EB | 75 merchants, 200 TX | Transaction, Onboarding, Compliance | 4 rules |
| 3 | MedVista | 13002 | #059669 | 100 patients, 60 appts | Patient, Scheduler, Claims | 4 rules |
| 4 | TrustGuard | 13003 | #1E3A5F | 80 policies, 50 claims | Claims, Policies, Underwriting | 4 rules |
| 5 | UrbanNest | 13004 | #D97706 | 60 listings, 80 leads | Lead Pipeline, Properties, Showings | 4 rules |
| 6 | SwiftRoute | 13005 | #7C3AED | 100 shipments, 50 routes | Shipments, Routes, Fleet | 4 rules |
| 7 | DentaFlow | 13006 | #06B6D4 | 80 patients, 50 appts | Patient Pipeline, Appointments, Treatments | 4 rules |
| 8 | JurisPath | 13007 | #166534 | 60 cases, 100 clients | Cases, Clients, Billing | 4 rules |
| 9 | TableSync | 13008 | #9F1239 | 70 items, 100 reservations | Reservations, Menu, Staff | 4 rules |
| 10 | CraneStack | 13009 | #EA580C | 12 projects, 30 equipment | Projects, Equipment, Subcontractors | 4 rules |
| 11 | EduPulse | 13010 | #6D28D9 | 100 students, 30 courses | Enrollment, Courses, Assignments | 4 rules |

---

## How to Use

1. **For Core Platform Development**:
   - Copy the Agent 1 prompt (lines 11–390)
   - Paste into a fresh Claude Code terminal
   - Follow the 4 build phases + Ralph Loop

2. **For Industry Customization**:
   - Copy the corresponding industry agent prompt (e.g., Agent 2 for NovaPay)
   - Paste into a fresh Claude Code terminal
   - Follow the deliverables checklist
   - Reference brand colors and demo data specs

3. **For Reference**:
   - Agents reference `CRM-MASTER-PLAN.md` for platform overview
   - Agents reference `INDUSTRY-BRANDING-CONTEXT.md` for company details
   - Agents reference `RALPH-LOOP-CONFIG.md` for quality process
   - All stored in `/13-CRM-Platform/plans/`

---

## Key Sections in Each Prompt

```
# Project Title
YOUR ROLE
PROJECT CONTEXT (overview of all 10 industries)
YOUR SPECIFIC SCOPE (boards, data, automations)
EXISTING CODE (what to review first)
ARCHITECTURE (tech stack, ports, conventions)
PLAN REFERENCE (which docs to read)
LOCAL MEMORY (where to track progress)
BUILD PHASES or DELIVERABLES
QUALITY — Ralph Loop (5-pass QA)
COORDINATION WITH OTHER AGENTS
DEFINITION OF DONE
```

---

## Quality Assurance Workflow

All agents run the **Ralph Loop** after completing phases:

1. **Pass 1: Functional Correctness** ✓ Code compiles, tests pass, happy path works
2. **Pass 2: Security Audit** ✓ No SQL injection, XSS, auth enforced
3. **Pass 3: Performance Review** ✓ <200ms API, <50ms WebSocket, no N+1 queries
4. **Pass 4: Reference Comparison (Monday.com)** ✓ UI/UX matches reference app
5. **Pass 5: Senior SWE Review** ✓ Architecture scalable, code DRY, errors handled

Reports saved to: `.claude/ralph-reports/`

---

## Success Metrics

**Core Platform Agent**:
- 0 breaking changes between phases
- >80% test coverage
- <300ms API response time for 100-item boards
- <50ms WebSocket broadcast latency
- All Ralph Loop passes

**Each Industry Agent**:
- Board templates functional + populated
- Seed data realistic (dates, amounts, names)
- Automations execute correctly
- Brand color applied throughout UI
- Ralph Loop Pass 1 & 2 complete

---

## File Location

```
/sessions/festive-magical-mendel/mnt/Deep Research Claude Code/13-CRM-Platform/plans/
├── CLAUDE-CODE-INSTANCE-PROMPTS-13.md  ← This file (11 complete prompts)
├── CRM-MASTER-PLAN.md                   ← Platform architecture & design
├── INDUSTRY-BRANDING-CONTEXT.md         ← Company profiles & details
├── RALPH-LOOP-CONFIG.md                 ← Quality assurance framework
└── PROMPTS-INDEX.md                     ← This index (navigation guide)
```

---

## Quick Start Commands

```bash
# For Core Platform agent:
# Copy prompt lines 11–390 and paste into new Claude Code session

# For NovaPay agent (example):
# Copy prompt lines 392–490 and paste into new Claude Code session

# Review existing code:
cd /13-CRM-Platform
cat .claude/memory.md                     # Past decisions
cat .claude/scratchpad.md                 # Current progress

# Run quality checks:
npm test -- --coverage                    # Unit tests
npm run lint                              # Code quality
docker-compose up                         # Local deployment
```

---

**Status**: Ready for agent deployment (2026-04-02)
