# Agent 09 — Scratchpad / Continuation Notes

## Session 1 — 2026-04-02

### Current State Summary
- **Backend seeds:** 100% complete, untouched by other agents, ready to run
- **Frontend branding:** 0% — overwritten by CraneStack agent, needs to be redone
- **Docker compose:** tablesync-frontend service was added, verify it survived

### TODO for Next Session

#### Priority 1: Create dedicated TableSync frontend
The shared `frontend/` dir is being used by multiple agents. The correct pattern is:

1. Create `frontends/tablesync/` directory (copy from `frontend/` as base)
2. Apply all TableSync branding to that isolated copy
3. Update docker-compose to point `tablesync-frontend` service at `./frontends/tablesync/`
4. Ensure vite.config.ts in that dir uses port 13008

#### Priority 2: Verify docker-compose still has tablesync-frontend
Another agent may have modified docker-compose.yml. Check that the tablesync-frontend service block is still present and correct.

#### Priority 3: Run seed and test
1. Ensure backend can import `seedTableSync` from `seeds/tablesync/index`
2. Run the seed against a live database
3. Verify all 100 reservations, 70 menu items, 50 staff records load
4. Verify 4 automations created
5. Test frontend loads boards and displays data

#### Priority 4: Ralph Loop Pass
- Ensure all boards load with demo data
- Verify seed data is realistic (menu items, pricing, reservation times)
- Check automations are functional
- Confirm brand color #9F1239 applied throughout

---

### Data Verification Counts (verified via grep)
| Data Type | Target | Actual | Status |
|-----------|--------|--------|--------|
| Menu items | 70 | 70 | PASS |
| Reservations | 100 | 100 | PASS |
| Staff schedules | 50 | 50 | PASS |
| Automations | 4 | 4 | PASS |
| Users | 10 | 10 | PASS |
| Boards | 3 | 3 | PASS |

### Reservation Status Breakdown
| Status | Count |
|--------|-------|
| Requested | 15 |
| Confirmed | 25 |
| Seated | 10 |
| Completed | 35 |
| No-Show | 8 |
| Cancelled | 7 |
| **Total** | **100** |

### Menu Category Breakdown
| Category | Count |
|----------|-------|
| Appetizers | 18 |
| Entrees | 24 |
| Desserts | 14 |
| Beverages | 14 |
| **Total** | **70** |

### Staff Schedule Status Breakdown
| Status | Count |
|--------|-------|
| Scheduled | 15 |
| Confirmed | 15 |
| Completed | 15 |
| Called Out | 5 |
| **Total** | **50** |

---

### Key Design Decisions Made

1. **Table dropdown:** Created 20 tables with color coding (green for tables 1-6, blue 7-12, purple 13-16, yellow 17-20) to indicate dining zones
2. **Reservation data:** Mix of dates from March 26 through April 10, 2026 to show historical + upcoming bookings
3. **Staff names:** Used 15 unique staff members who appear across multiple shifts (realistic — same people work different days)
4. **Menu pricing:** Realistic upscale dining prices ($5-$52 range, with most entrees $24-$48)
5. **Automation delay:** Post-service follow-up has 60-minute delay to avoid sending survey immediately
6. **Views:** Each board has 2-3 views (Table default + Kanban + Calendar where relevant)

### TableSync Brand Identity
- **Company:** TableSync
- **Tagline:** "Every Seat, Perfectly Timed"
- **Industry:** Hospitality (restaurants, dining)
- **Primary Color:** #9F1239 (Burgundy/Wine Red — Tailwind rose-800)
- **Secondary Color:** #881337 (rose-900)
- **Accent Color:** #FB7185 (rose-400)
- **Logo Initial:** "TS"
- **Icon Theme:** UtensilsCrossed (login), CalendarClock (reservations), UtensilsCrossed (menu), Users (staff)
