# UrbanNest QA — Slice 19.7

**Slug:** `urbannest`
**Port:** 13004
**Admin user:** `admin@urbannest.com`
**Brand primary:** `#d97706`

## Result Summary

- Passed: **12**
- Warnings: **2**
- Failed: **0**
- Console errors captured: **0**
- Page errors captured: **0**

## Steps

- [x] 1. Login page renders
- [x] 2. Post-login redirect + session persists
- [ ] 3. Dashboard/Overview renders — _No recognisable dashboard heading — industry may land on a different route_
- [x] 4. Navigate to 'Listings'
- [x] 5. Kanban view toggle
- [x] 6. Search input accepts query
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

- Screenshots: `qa-results/urbannest/screenshots/` (10 PNGs)
- API log: `qa-results/urbannest/api-log.json` (3 requests)
