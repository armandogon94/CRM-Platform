# Makefile — Slice 19 G2 + Slice 19B C1 + Slice 19C G1
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
# Slice 19C perf targets (activate docker-compose.perf.yml overlay with `--profile perf`):
#   e2e-perf            Full happy path: perf stack up → /health wait → seed-perf →
#                       build + run orchestrator (all 4 scenarios) → trap-based teardown.
#   e2e-perf-seed-only  Boots perf stack, seeds crm_perf, leaves stack running (dev debug).
#                       NO teardown — tear down manually with `make e2e-perf-teardown`.
#   e2e-perf-scenario   Runs a single scenario (NAME=a|b|c|d) against an ALREADY-RUNNING
#                       perf stack with `--short`. No startup, no teardown.
#   e2e-perf-set-baseline
#                       Interactive `[y/N]` prompt; copies the newest report in
#                       e2e/perf/results/ to baseline.md. Never auto-commits.
#   e2e-perf-teardown   Stops perf profile and wipes postgres + redis volumes
#                       (drops crm_perf DB and flushes Redis db 1 via volume wipe).
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
COMPOSE_PERF := docker compose -f docker-compose.yml -f docker-compose.perf.yml
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

.PHONY: e2e e2e-desktop e2e-mobile e2e-ui e2e-visual e2e-visual-update e2e-visual-ui \
	e2e-perf e2e-perf-seed-only e2e-perf-scenario e2e-perf-set-baseline e2e-perf-teardown \
	test-shared e2e-slice-20

# ─────────────────────────────────────────────────────────────────────
# Slice 20 — CRUD UI wiring (SPEC §Slice 20)
# ─────────────────────────────────────────────────────────────────────

# Run the @crm/shared Vitest suite — pre-merge gate for Phase A/B
# additions (Toast, useBoard mutations, useCanEdit, KanbanCard kebab,
# BoardListPage toast wiring). Fast: ~1s total, no Docker.
test-shared:
	cd frontends/_shared && npm test -- --run

# Run Phase D (Slice 20 E2E) specs against all three migrated industries
# one at a time, honoring the "max one industry running locally" guardrail
# from the Slice 19.7 QA session. For each slug:
#   1. Bring up postgres + redis + backend
#   2. Wait for /health
#   3. Seed JUST that industry (seed:<slug>)
#   4. Bring up that industry's frontend
#   5. Run e2e/specs/slice-20/ with SLICE_20_INDUSTRIES filtering to that
#      slug so the fixture matrix runs exactly one iteration per flow
#   6. `down -v` teardown before moving to the next industry
#
# Individual slugs can be exercised via `make e2e-slice-20 SLUGS=novapay`.
SLUGS ?= novapay medvista jurispath
e2e-slice-20:
	@set -e; \
	for slug in $(SLUGS); do \
		echo "────────────────────────────────────────"; \
		echo " Slice 20 E2E — $$slug"; \
		echo "────────────────────────────────────────"; \
		$(COMPOSE) up -d --wait postgres redis; \
		$(COMPOSE) up -d backend; \
		for i in $$(seq 1 $(WAIT_SECS)); do \
			if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
			sleep 1; \
		done; \
		curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; $(COMPOSE) down -v; exit 1; }; \
		$(COMPOSE) exec -T backend npm run seed:$$slug; \
		$(COMPOSE) up -d $$slug-frontend; \
		sleep 5; \
		(cd e2e && SLICE_20_INDUSTRIES=$$slug npx playwright test specs/slice-20/ --reporter=list) || { $(COMPOSE) down -v; exit 1; }; \
		$(COMPOSE) down -v; \
	done

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

# ─── Slice 19C: Performance suite targets ───────────────────────────────────
#
# These targets activate the `perf` profile of docker-compose.perf.yml
# (Slice 19C C1), which layers resource limits, compiled-mode backend,
# Redis db 1, and the crm_perf database over the base compose. The suite
# runs Artillery scenarios (Slice 19C E1–E4) orchestrated by e2e/perf/run.ts
# (F1) after a 5-minute seed (B2).
#
# All perf targets assume the perf overlay is the ONLY way the perf stack
# starts — `--profile perf` is mandatory. Without it, the overlay's
# service gates emit dependency errors by design (safety signal).
#
# The full target (`e2e-perf`) traps EXIT/INT/TERM and tears the stack
# down with `down -v`, which wipes BOTH the postgres volume (drops
# crm_perf DB) and the redis volume (flushes db 1). Developer debug
# targets (`e2e-perf-seed-only`, `e2e-perf-scenario`) deliberately omit
# teardown so the stack can be inspected between runs.

# Full happy path. Builds the orchestrator, runs all 4 scenarios, tears
# down on any exit path. Budget: ~30 min on commodity hardware.
e2e-perf:
	@set -e; \
	trap '$(COMPOSE_PERF) --profile perf down -v' EXIT INT TERM; \
	$(COMPOSE_PERF) --profile perf up -d --wait postgres redis; \
	$(COMPOSE_PERF) --profile perf up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE_PERF) --profile perf exec -T backend npm run seed:perf; \
	(cd e2e/perf && npm run build && node dist/run.js)

# Developer debug: boots the perf stack, runs the seeder, THEN STOPS.
# No orchestrator run, no teardown. The developer is responsible for
# cleanup via `make e2e-perf-teardown` (or plain docker compose down).
e2e-perf-seed-only:
	@set -e; \
	$(COMPOSE_PERF) --profile perf up -d --wait postgres redis; \
	$(COMPOSE_PERF) --profile perf up -d backend; \
	for i in $$(seq 1 $(WAIT_SECS)); do \
		if curl -sfS $(HEALTH_URL) >/dev/null 2>&1; then break; fi; \
		sleep 1; \
	done; \
	curl -sfS $(HEALTH_URL) >/dev/null || { echo "backend /health never came up"; exit 1; }; \
	$(COMPOSE_PERF) --profile perf exec -T backend npm run seed:perf; \
	echo ""; \
	echo "────────────────────────────────────────────────────────────────"; \
	echo "Stack running with perf seed. Tear down manually: make e2e-perf-teardown"; \
	echo "────────────────────────────────────────────────────────────────"

# Runs ONE scenario (NAME=a|b|c|d) against an already-running perf stack.
# Uses run.ts's `--scenarios=<id>` and `--short` flags so the scenario
# executes its short YAML environment (fast smoke, not the full profile).
# NO startup, NO teardown — caller is expected to have the stack up.
e2e-perf-scenario:
	@test "$(NAME)" = "a" || test "$(NAME)" = "b" || test "$(NAME)" = "c" || test "$(NAME)" = "d" || \
		(echo "NAME must be a, b, c, or d (got \"$(NAME)\")"; exit 1)
	@set -e; \
	(cd e2e/perf && npm run build && node dist/run.js --scenarios=$(NAME) --short)

# Interactive baseline refresh. Prompts `[y/N]`; on `y`/`Y`, copies the
# newest markdown report in e2e/perf/results/ to baseline.md. Never
# auto-commits — the user reviews the diff and commits manually per
# SPEC §Slice 19C "baseline.md updated manually — never auto-updated."
e2e-perf-set-baseline:
	@read -p "Copy latest result to baseline.md? [y/N] " reply; \
	case "$$reply" in \
		y|Y) \
			latest=$$(ls -t e2e/perf/results/*.md 2>/dev/null | grep -v '/baseline.md$$' | head -1); \
			if [ -z "$$latest" ]; then \
				echo "No result markdown files found in e2e/perf/results/."; \
				exit 1; \
			fi; \
			cp "$$latest" e2e/perf/results/baseline.md; \
			echo "Baseline updated from $$latest. Review the diff and commit manually." ;; \
		*) echo "Aborted." ;; \
	esac

# Stops the perf profile and wipes volumes. `down -v` removes the
# postgres volume (dropping crm_perf) and the redis volume (flushing
# db 1) in one shot — explicit SQL DROP / FLUSHDB would be redundant.
e2e-perf-teardown:
	$(COMPOSE_PERF) --profile perf down -v
