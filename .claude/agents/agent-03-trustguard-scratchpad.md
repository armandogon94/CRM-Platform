# Agent 03 — TrustGuard Scratchpad
## Working Notes & Technical Details

---

## File Inventory (Agent 03 Created)

### Backend — All verified, TypeScript compiles clean
```
backend/src/seeds/trustguard/
├── index.ts           (2,542 bytes) — orchestrator, can run standalone
├── workspace.ts       (4,184 bytes) — 20 users + workspace
├── boards.ts          (11,071 bytes) — 3 boards, 17 columns, 13 groups
├── policies-data.ts   (13,937 bytes) — 80 policy records
├── claims-data.ts     (11,908 bytes) — 50 claim records
├── prospects-data.ts  (8,322 bytes) — 30 underwriting records
└── automations.ts     (5,648 bytes) — 4 automation rules
```

### Frontend — Originally modified, then overwritten by other agents
Files I changed (now overwritten):
- `frontend/index.html` — title, favicon, theme-color
- `frontend/package.json` — name, port 13003
- `frontend/vite.config.ts` — port 13003
- `frontend/tailwind.config.js` — Navy blue color scale
- `frontend/src/styles/globals.css` — CSS variables
- `frontend/src/App.tsx` — TrustGuard branding
- `frontend/src/components/LoginPage.tsx` — Shield icon, trustguard credentials
- `frontend/src/components/Sidebar.tsx` — Insurance board icons
- `frontend/src/components/OverviewDashboard.tsx` — Insurance-specific dashboard
- `frontend/src/utils/api.ts` — trustguard_token storage key

### Backend package.json — seed script added
Added `"seed:trustguard": "ts-node src/seeds/trustguard/index.ts"` to scripts.
Other agents added their own seed scripts too (novapay, medvista, urbannest, etc.)

---

## TrustGuard Workspace Settings (JSONB)
```json
{
  "brandColor": "#1E3A5F",
  "secondaryColor": "#2D5F8A",
  "accentColor": "#4A90D9",
  "surfaceColor": "#F0F4F8",
  "industry": "insurance",
  "tagline": "Protection You Can Trust",
  "logo": "/assets/trustguard-logo.svg",
  "modules": ["claims", "policies", "underwriting", "prospects"]
}
```

## TrustGuard Tailwind Color Scale (Navy Blue)
```js
brand: {
  50:  '#EDF2F7',
  100: '#D4DFEC',
  200: '#A9BFD9',
  300: '#7E9FC6',
  400: '#4A90D9',
  500: '#2D5F8A',
  600: '#1E3A5F',  // <-- primary brand color
  700: '#182F4D',
  800: '#12243B',
  900: '#0C1929',
}
```

---

## Column Value Formats Used in Seed Data

### Status columns
```json
{ "labelId": "reported" }      // matches config.labels[].id
{ "labelId": "active" }
```

### Text columns
```json
{ "text": "CLM-20260001" }
{ "text": "POL-AU-00003" }
```

### Number columns
```json
{ "number": 8500 }            // claim amount in USD
{ "number": 350000 }          // coverage amount
```

### Date columns
```json
{ "date": "2026-03-28" }
```

### Person columns
```json
{ "userId": 5, "displayName": "Karen Liu" }
```

### Dropdown columns
```json
{ "selectedId": "auto" }      // matches config.options[].id
{ "selectedId": "high" }
```

---

## Inter-Agent Conflicts Observed

1. **Shared frontend directory:** The `frontend/` directory is shared by all industry agents. My TrustGuard branding was overwritten by a CraneStack (construction) agent. The pattern emerging is: each industry may need its own `frontends/{industry}/` directory (like `frontends/medvista/` which already exists).

2. **Frontend architecture changed:** When I started, the frontend used a single-page layout with `useState` for navigation. Another agent refactored it to use `react-router-dom` with routes (`/login`, `/boards`, `/boards/:id`). My components (`LoginPage`, `Sidebar`, `OverviewDashboard`) were written for the original architecture.

3. **API client changed:** Originally used `fetch` with a simple wrapper. Now uses `axios` with interceptors. Token storage key changed from my `trustguard_token` to a shared `crm_access_token`.

4. **Tailwind config changed:** I used a numeric scale (50-900) mapping to hex colors. The current config uses CSS variables (`var(--brand-primary)`) with named keys (`brand.primary`, `brand.secondary`, `brand.accent`).

---

## To Resume TrustGuard Frontend Work

If a future session needs to apply TrustGuard branding to the current frontend state:

1. **Create `frontends/trustguard/`** directory (copy from current `frontend/`)
2. **Apply CSS variables** in `globals.css`:
   ```css
   --brand-primary: #1E3A5F;
   --brand-secondary: #2D5F8A;
   --brand-accent: #4A90D9;
   ```
3. **Update `vite.config.ts`** port to 13003
4. **Update `package.json`** name and port
5. **Brand the LoginPage:** Shield icon, admin@trustguard.com, "TrustGuard" title
6. **Brand the Sidebar:** "T" logo, "TrustGuard", insurance board icons
7. **Brand the Dashboard/BoardListPage:** Insurance stats (policies, claims, underwriting)
8. **Update `index.html`** title to "TrustGuard CRM"

The backend seed data is complete and independent of the frontend. It will work with whatever frontend is used as long as the API routes serve the board/item data correctly.

---

## Verification Results

```
Policy count:   80 ✓ (grep -c "{ name:" policies-data.ts)
Claims count:   50 ✓ (grep -c "{ claimantName:" claims-data.ts)
Prospect count: 30 ✓ (grep -c "{ applicantName:" prospects-data.ts)
User count:     20 ✓ (grep -c "{ email:" workspace.ts)
Board count:     3 ✓ (Claims Pipeline, Policy Lifecycle, Underwriting Queue)
Automation count: 4 ✓
TypeScript errors in trustguard files: 0 ✓
```

---

## Key Decisions Made

1. **Policy number format:** `POL-{TYPE}-{5DIGITS}` where TYPE = AU/HM/LF/CM — makes it easy to visually identify policy type
2. **Claim number format:** `CLM-{8DIGITS}` starting from 20260001 — year-prefixed sequential
3. **Underwriting ID format:** `UW-{4DIGITS}` starting from 3001
4. **User distribution:** Weighted toward adjusters (5) and agents (6) as these are the roles with highest volume in insurance
5. **Senior underwriter pattern:** William Tanaka is both in the underwriter pool AND designated as the escalation target for high-risk applications
6. **Cross-board references:** Claims reference policy numbers (e.g., `POL-AU-00003`) enabling cross-board lookups via the automation system
