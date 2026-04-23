# NovaPay QA — Slice 19.7

**Slug:** `novapay`
**Port:** 13001
**Admin user:** `admin@novapay.com`
**Brand primary:** `#2563eb`

## Result Summary

- Passed: **13**
- Warnings: **1**
- Failed: **0**
- Console errors captured: **0**
- Page errors captured: **0**

## Steps

- [x] 1. Login page renders
- [x] 2. Post-login redirect + session persists
- [x] 3. Dashboard/Overview renders
- [x] 4. Navigate to 'Transaction Pipeline'
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

- Screenshots: `qa-results/novapay/screenshots/` (10 PNGs)
- API log: `qa-results/novapay/api-log.json` (3 requests)
