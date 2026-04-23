# Makefile — Slice 19 G2 + Slice 19B C1
# Playwright E2E orchestration via docker compose overlay.
#
# Targets:
#   e2e                 Full suite: postgres + redis + backend + all 10 frontends,
#                       then `npx playwright test` (all projects).
#   e2e-desktop         postgres + redis + backend + 10 frontends, desktop projects only.
#   e2e-mobile          postgres + redis + backend + novapay-frontend, mobile project only.
#   e2e-ui              Playwright UI mode. Assumes stack is already running; no teardown.
#   e2e-visual          Visual regression suite in pinned Playwright container
#                       (backend + redis + postgres + novapay-frontend); tears down after.
#   e2e-visual-update   Same as e2e-visual but passes --update-snapshots to regenerate
#                       baselines; prints a two-step review reminder before exit.
#   e2e-visual-ui       Boots visual stack and prints Playwright UI-mode instructions;
#                       NO teardown — developer is expected to tear down manually.
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

.PHONY: e2e e2e-desktop e2e-mobile e2e-ui e2e-visual e2e-visual-update e2e-visual-ui

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

# ─── Slice 19B: Visual regression targets ────────────────────────────────────
#
# These targets activate the `visual` docker-compose profile which brings up
# the pinned Playwright container (`e2e-visual`) defined in
# docker-compose.e2e.yml. The container default command runs
# `npx playwright test --config=playwright.visual.config.ts` against the
# backend on the internal docker network.
#
# Only the novapay-frontend is started — visual specs only cover NovaPay's
# login page and post-auth navigation (the visual suite is intentionally
# scoped narrower than the functional e2e suite).

# Run visual suite: no flags, fails on any baseline diff, tears down stack.
e2e-visual:
	@set -e; \
	trap '$(COMPOSE) --profile visual down -v' EXIT INT TERM; \
	$(COMPOSE) up -d --wait postgres redis; \
	$(COMPOSE) up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE) exec -T backend npm run seed:novapay; \
	$(COMPOSE) up -d novapay-frontend; \
	sleep 3; \
	$(COMPOSE) --profile visual run --rm e2e-visual

# Regenerate baselines. Appends --update-snapshots to the container's default
# command. Prints a two-step review reminder BEFORE the trap tears down.
e2e-visual-update:
	@set -e; \
	trap '$(COMPOSE) --profile visual down -v' EXIT INT TERM; \
	$(COMPOSE) up -d --wait postgres redis; \
	$(COMPOSE) up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE) exec -T backend npm run seed:novapay; \
	$(COMPOSE) up -d novapay-frontend; \
	sleep 3; \
	$(COMPOSE) --profile visual run --rm e2e-visual \
		npx playwright test --config=playwright.visual.config.ts -- --update-snapshots; \
	echo "" >&2; \
	echo "────────────────────────────────────────────────────────────────" >&2; \
	echo "Visual baselines updated." >&2; \
	echo "NOW: review e2e/playwright-report-visual/index.html before committing." >&2; \
	echo "Then: git add e2e/__screenshots__/ && git commit" >&2; \
	echo "────────────────────────────────────────────────────────────────" >&2

# UI mode against running stack. Boots backend+frontend but does NOT tear
# down — the developer opens Playwright UI in another terminal and Ctrl-Cs
# when done, then cleans up manually.
e2e-visual-ui:
	@set -e; \
	$(COMPOSE) up -d --wait postgres redis; \
	$(COMPOSE) up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE) exec -T backend npm run seed:novapay; \
	$(COMPOSE) up -d novapay-frontend; \
	sleep 3; \
	echo ""; \
	echo "────────────────────────────────────────────────────────────────"; \
	echo "Stack is running. In another terminal:"; \
	echo "  cd e2e && npx playwright test --config=playwright.visual.config.ts --ui"; \
	echo ""; \
	echo "Ctrl-C to stop when done, then tear the stack down manually:"; \
	echo "  docker compose -f docker-compose.yml -f docker-compose.e2e.yml \\"; \
	echo "    --profile visual down --volumes"; \
	echo "────────────────────────────────────────────────────────────────"
