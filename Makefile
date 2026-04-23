# Makefile — Slice 19 G2
# Playwright E2E orchestration via docker compose overlay.
#
# Targets:
#   e2e          Full suite: postgres + redis + backend + all 10 frontends,
#                then `npx playwright test` (all projects).
#   e2e-desktop  postgres + redis + backend + 10 frontends, desktop projects only.
#   e2e-mobile   postgres + redis + backend + novapay-frontend, mobile project only.
#   e2e-ui       Playwright UI mode. Assumes stack is already running; no teardown.
#
# (Hyphenated variants replace the earlier colon-separated names — see
#  Slice 19 review fixes for rationale: colon-escaping breaks tab-completion
#  and IDE make-integrations.)
#
# All docker-compose recipes trap EXIT/INT/TERM and run `docker compose ... down -v`,
# which wipes containers AND the postgres volume. Each run starts from a clean DB —
# the E2E fixture workspace is re-seeded by Playwright's globalSetup project.
#
# The backend /health endpoint (added in Slice 19 A2) gates Playwright startup;
# we poll up to WAIT_SECS seconds before giving up.

SHELL := /bin/bash

COMPOSE := docker compose -f docker-compose.yml -f docker-compose.e2e.yml
HEALTH_URL := http://localhost:13000/health
WAIT_SECS := 30

# All 10 industry frontend services, as defined in docker-compose.yml.
INDUSTRY_FRONTENDS := \
	novapay-frontend \
	medvista-frontend \
	trustguard-frontend \
	urbannest-frontend \
	swiftroute-frontend \
	dentaflow-frontend \
	jurispath-frontend \
	tablesync-frontend \
	cranestack-frontend \
	edupulse-frontend

.PHONY: e2e e2e-desktop e2e-mobile e2e-ui

e2e:
	@set -e; \
	trap '$(COMPOSE) down -v' EXIT INT TERM; \
	$(COMPOSE) up -d --wait postgres redis; \
	$(COMPOSE) up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE) exec -T backend npm run seed; \
	$(COMPOSE) up -d $(INDUSTRY_FRONTENDS); \
	cd e2e && npx playwright test

e2e-desktop:
	@set -e; \
	trap '$(COMPOSE) down -v' EXIT INT TERM; \
	$(COMPOSE) up -d --wait postgres redis; \
	$(COMPOSE) up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE) exec -T backend npm run seed; \
	$(COMPOSE) up -d $(INDUSTRY_FRONTENDS); \
	cd e2e && npx playwright test --project=desktop-novapay --project=desktop-branding-all

e2e-mobile:
	@set -e; \
	trap '$(COMPOSE) down -v' EXIT INT TERM; \
	$(COMPOSE) up -d --wait postgres redis; \
	$(COMPOSE) up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE) exec -T backend npm run seed:novapay; \
	$(COMPOSE) up -d novapay-frontend; \
	cd e2e && npx playwright test --project=mobile-novapay

# UI mode: assumes the stack is already running. NO teardown.
e2e-ui:
	cd e2e && npx playwright test --ui
