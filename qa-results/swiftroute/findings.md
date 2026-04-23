# SwiftRoute QA — Slice 19.7

**Slug:** `swiftroute`
**Port:** 13005
**Admin user:** `admin@swiftroute.com`
**Brand primary:** `#7c3aed`

## Result Summary

- Passed: **9**
- Warnings: **4**
- Failed: **1**
- Console errors captured: **0**
- Page errors captured: **0**

## Steps

- [x] 1. Login page renders
- [x] 2. Post-login redirect + session persists
- [ ] 3. Dashboard/Overview renders — _No recognisable dashboard heading — industry may land on a different route_
- [ ] 4. Navigate to board — _Neither 'Shipments' nor fallback board buttons found_
- [ ] 5. Kanban view toggle — _Kanban button not found_
- [ ] 6. Search input — _No search input detected_
- [x] 7. Switch to second board
- [x] 8. Automations panel opens
- [ ] 9. Automation trigger — _No Trigger buttons found_
- [x] 10. Logout returns to login page
- [x]   Console + page errors — _0 / 0_
- [x] T2-1. API login
- [x] T2-2. POST /workspaces/:wsId/boards — _status=201 id=null_
- [x] T2-6. GET /notifications — _status=200_

## Console errors

_None_

## Page errors

_None_

## Artifacts

- Screenshots: `qa-results/swiftroute/screenshots/` (10 PNGs)
- API log: `qa-results/swiftroute/api-log.json` (3 requests)
