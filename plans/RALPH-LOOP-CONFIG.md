# Ralph Loop: 5-Pass Quality Assurance Configuration

## Overview

The **Ralph Loop** is a continuous quality assurance framework that Claude Code agents execute after completing features, modules, or significant code changes. Named after the self-critical loop of improvement, it consists of 5 sequential passes, each with specific checklists and exit criteria.

The loop is **configurable** and can run in three modes:
1. **5-Pass Mode**: Execute all 5 passes once, report results
2. **Continuous Mode**: Keep looping until no more issues found (max N iterations)
3. **Disabled**: Skip QA (not recommended for production)

The agent can auto-fix issues it discovers or report them for human review, depending on severity and configuration.

---

## Configuration File: `ralph-loop.config.json`

```json
{
  "mode": "5-pass",
  "max_continuous_cycles": 10,
  "passes": {
    "functional": {
      "enabled": true,
      "blocking": true
    },
    "security": {
      "enabled": true,
      "blocking": true
    },
    "performance": {
      "enabled": true,
      "blocking": false
    },
    "reference_comparison": {
      "enabled": true,
      "blocking": false
    },
    "code_review": {
      "enabled": true,
      "blocking": false
    }
  },
  "auto_fix": true,
  "auto_fix_blocking_only": false,
  "report_format": "markdown",
  "report_path": "./ralph-reports/",
  "reference_app": "monday.com",
  "severity_threshold": "medium",
  "max_report_age_hours": 24,
  "compare_against_previous_run": true
}
```

### Configuration Options Explained:

- **mode**:
  - `"5-pass"` = Run all 5 passes once, then stop
  - `"continuous"` = Loop through all 5 passes repeatedly until no issues found or max cycles reached
  - `"disabled"` = Skip all QA (emergency only)

- **max_continuous_cycles**: Maximum iterations when in continuous mode (prevents infinite loops)

- **passes.*.enabled**: Whether to run this pass (all should be true for comprehensive QA)

- **passes.*.blocking**: If true, failing this pass halts further development until fixed

- **auto_fix**: Agent attempts to fix issues it finds automatically (set to false for review-only mode)

- **auto_fix_blocking_only**: If true, only auto-fix issues that would block further work

- **report_format**: Output format for QA reports ("markdown" or "json")

- **report_path**: Directory where reports are saved (creates timestamped files)

- **reference_app**: Which reference application to compare against
  - `"monday.com"` for CRM agents
  - `"odoo"` for ERP agents

- **severity_threshold**: Minimum severity to report
  - `"low"` = Report everything
  - `"medium"` = Skip low-severity items (default)
  - `"high"` = Only report high and critical issues

- **max_report_age_hours**: How many hours a report stays current before triggering a new QA run

- **compare_against_previous_run**: Track metrics against the last QA report to show improvement

---

## PASS 1: Functional Correctness

**Purpose**: Verify that the code compiles, runs, and implements the specified feature correctly.

**Blocking**: YES — The feature cannot proceed to the next pass if functional tests fail.

**Estimated Duration**: 30-45 minutes per module

### Functional Correctness Checklist (20 items):

- [ ] **Code Compilation**: TypeScript/JavaScript has no compilation errors; Python has no syntax errors
- [ ] **Runtime Startup**: Application starts without crashing; all required environment variables present
- [ ] **Existing Test Suite**: All pre-existing unit tests still pass (no regressions)
- [ ] **Feature Tests**: New feature passes all acceptance criteria tests defined in the plan
- [ ] **Happy Path**: Primary user flow works end-to-end (e.g., create deal → move to closed-won)
- [ ] **Empty State Handling**: App gracefully handles empty data (no "undefined is not iterable" errors)
- [ ] **Null/Undefined Values**: All edge cases with null, undefined, or missing data handled
- [ ] **Boundary Values**: Max length strings, max array sizes, max numbers handled correctly
- [ ] **API Response Validation**: API endpoints return correct HTTP status codes (200, 201, 404, 400, etc.)
- [ ] **API Response Data**: Response payloads match the documented schema
- [ ] **Database Consistency**: Data saved to database matches what was requested (no silent failures)
- [ ] **UI Rendering**: Frontend renders without layout breaks across Chrome, Firefox, Safari, Edge
- [ ] **Form Validation**: Required fields are enforced; invalid input is rejected with clear errors
- [ ] **Navigation**: All links, buttons, and menu items navigate to intended pages
- [ ] **Permissions Enforced**: Unauthorized users cannot access restricted data/features
- [ ] **Search/Filter**: Search and filter functionality returns expected results
- [ ] **Pagination**: List views paginate correctly; no duplicate or missing items across pages
- [ ] **Error Messages**: Error messages are user-friendly and actionable (not raw stack traces)
- [ ] **Browser Console**: No console errors or warnings in DevTools
- [ ] **Network Activity**: Network tab shows expected API calls with no failed requests

### Functional Verification Process:

1. **Run Full Test Suite**
   ```bash
   npm test -- --coverage
   # or
   pytest --cov
   ```
   Document coverage percentage. Target: >80% for core features, >60% for UI.

2. **Manual Testing Checklist** (agent manually walks through happy path and edge cases)
   - Start fresh (clear database or use test data)
   - Execute primary workflows
   - Test with invalid inputs
   - Verify error handling
   - Check responsive design on mobile viewport

3. **API Testing** (if applicable)
   - Use Postman / Insomnia collection to verify all endpoints
   - Test with valid and invalid payloads
   - Verify response codes and response structure

4. **Database Verification** (if applicable)
   - Run migrations successfully
   - Verify data integrity (no orphaned records)
   - Check indexes are created
   - Confirm rollback migrations work

5. **Cross-Browser Testing**
   - Chrome, Firefox, Safari, Edge (screenshot on each)
   - Mobile viewport (375px, 768px, 1024px)
   - Test interactive elements (drag-drop, forms, modals)

---

## PASS 2: Security Audit

**Purpose**: Identify and eliminate security vulnerabilities before the code reaches production.

**Blocking**: YES — Security issues must be resolved before deployment.

**Estimated Duration**: 45-60 minutes per module

### Security Audit Checklist (20 items):

**SQL Injection & Database Security:**
- [ ] All database queries use parameterized queries (Sequelize, Django ORM, TypeORM)
- [ ] No raw SQL concatenation with user input
- [ ] ORM methods used correctly (`.findBy()` with bound parameters, not string interpolation)
- [ ] Database connection uses encrypted credentials (env vars, not hardcoded)
- [ ] Password hashing uses bcrypt with appropriate salt rounds (12+)

**Cross-Site Scripting (XSS):**
- [ ] React components auto-escape by default (not using dangerouslySetInnerHTML)
- [ ] If dangerouslySetInnerHTML is used, input is sanitized with DOMPurify
- [ ] No user input displayed directly in `eval()` or `new Function()`
- [ ] Template strings don't execute user code
- [ ] Third-party user-generated content (markdown, HTML) is sanitized

**Cross-Site Request Forgery (CSRF):**
- [ ] All state-changing requests (POST, PUT, DELETE) include CSRF tokens
- [ ] Tokens are validated on the server
- [ ] SameSite cookie attribute set to "Strict" or "Lax"
- [ ] Cookies are HttpOnly and Secure flags enabled

**Authentication & Authorization:**
- [ ] All API routes protected (no unauthenticated access to sensitive data)
- [ ] JWT tokens validated on every request
- [ ] JWT expiration time is reasonable (15min-1hr for access tokens)
- [ ] Refresh tokens used for longer-term sessions (also time-limited)
- [ ] Failed login attempts rate-limited (no brute force)
- [ ] Role-based access control (RBAC) enforced at API level, not just frontend
- [ ] Users cannot access other users' data (e.g., can't view deals of another user)

**Sensitive Data Handling:**
- [ ] Passwords never logged or shown in error messages
- [ ] API keys not hardcoded or logged
- [ ] PII (phone, email, SSN) not exposed in error responses
- [ ] Error messages don't reveal system information (use generic "Something went wrong")
- [ ] Database backups encrypted at rest
- [ ] Credit card data not stored (PCI compliance) — use Stripe/payment gateway

**Dependencies & Vulnerabilities:**
- [ ] `npm audit` or `pip audit` run with no critical/high vulnerabilities
- [ ] Dependency versions pinned in lock files (package-lock.json, poetry.lock)
- [ ] Third-party libraries are from official sources (npm, PyPI)
- [ ] No deprecated dependencies in use

**File Upload Security** (if applicable):
- [ ] File type validated (whitelist allowed extensions)
- [ ] File size limited (e.g., max 10MB)
- [ ] Uploaded files stored outside webroot or served with correct Content-Type
- [ ] Filename sanitized (no path traversal attacks)
- [ ] Virus/malware scanning on uploaded files (ClamAV or third-party service)

**API Security:**
- [ ] API rate limiting enabled (e.g., 100 requests/minute per IP)
- [ ] CORS headers restrict origin (not `*` for public APIs)
- [ ] API versioning in place (v1, v2) for backward compatibility
- [ ] Secrets (API keys, database passwords) stored in environment variables only

### Security Verification Process:

1. **Code Review for Common Vulnerabilities**
   ```bash
   # Check for hardcoded secrets
   grep -r "password\|api_key\|secret" src/ --include="*.js" --include="*.ts" --include="*.py"

   # Check for dangerous functions
   grep -r "eval\|dangerouslySetInnerHTML\|raw_sql\|exec" src/
   ```

2. **Dependency Audit**
   ```bash
   npm audit --audit-level=moderate
   # or
   pip audit
   ```

3. **OWASP Top 10 Checklist**
   - A01:2021 – Broken Access Control
   - A02:2021 – Cryptographic Failures
   - A03:2021 – Injection
   - A04:2021 – Insecure Design
   - A05:2021 – Security Misconfiguration
   - A06:2021 – Vulnerable and Outdated Components
   - A07:2021 – Identification and Authentication Failures
   - A08:2021 – Software and Data Integrity Failures
   - A09:2021 – Logging and Monitoring Failures
   - A10:2021 – Server-Side Request Forgery (SSRF)

4. **Test with Malicious Input**
   - SQL injection payloads: `' OR '1'='1`, `'; DROP TABLE users; --`
   - XSS payloads: `<script>alert('xss')</script>`, `<img src=x onerror=alert('xss')>`
   - CSRF: Attempt to forge state-changing requests
   - Path traversal: `../../etc/passwd`

5. **Environment Configuration Review**
   - .env file exists and is gitignored
   - No secrets in .env.example (only descriptions)
   - Staging/production environments have different secrets
   - Database credentials are database-user, not admin

---

## PASS 3: Performance Review

**Purpose**: Identify and address performance bottlenecks before they affect user experience.

**Blocking**: NO — Performance issues can be addressed in future sprints, but should be documented.

**Estimated Duration**: 30-45 minutes per module

### Performance Review Checklist (20 items):

**Backend Performance:**
- [ ] N+1 query detection: Database queries don't repeat in loops (use eager loading with `.populate()` or `.select_related()`)
- [ ] Index coverage: Frequently queried columns have database indexes
- [ ] Query optimization: No full table scans for common queries
- [ ] API response time: Read endpoints <200ms, write endpoints <500ms (excluding external service calls)
- [ ] Database connection pooling: Configured and not exhausting connections
- [ ] Caching strategy: Frequently-accessed data (user permissions, config) cached in Redis or memory
- [ ] Background jobs: Long-running tasks (email, reports) use async job queues (Bull, Celery)
- [ ] Pagination: List endpoints return max 50-100 items per page (not unbounded)
- [ ] Database transactions: Long-running transactions broken up to reduce lock contention

**Frontend Performance:**
- [ ] Bundle size: JavaScript bundle <500KB gzipped, CSS <50KB gzipped
- [ ] Code splitting: Routes lazy-loaded, not all code in main bundle
- [ ] Image optimization: Images compressed; use next/image or similar for responsive images
- [ ] Render performance: React components don't re-render excessively (check DevTools Performance tab)
- [ ] Memory leaks: Event listeners cleaned up in useEffect cleanup
- [ ] Redux/state management: Selectors memoized to prevent unnecessary re-renders
- [ ] CSS-in-JS: No styles created in render (styled-components not recreating styles)
- [ ] Lighthouse score: >80 for Performance, >85 for Accessibility

**Real-time Communication** (if WebSocket/polling):
- [ ] WebSocket connections properly closed (cleanup in unmount)
- [ ] Reconnection logic prevents rapid reconnection storms
- [ ] Message queue prevents overwhelming the client
- [ ] Polling intervals reasonable (not <1 second)

**Database Performance:**
- [ ] Schema design normalized (no redundant data)
- [ ] Indexes created on foreign keys
- [ ] Slow query log monitored
- [ ] Query plans reviewed (`EXPLAIN` for SQL)

### Performance Verification Process:

1. **Backend Profiling**
   ```bash
   # Express: Use clinic.js
   clinic doctor -- node server.js
   # Django: Use django-silk or django-debug-toolbar
   # Monitor: Response times, database query counts, slow queries
   ```

2. **Frontend Bundle Analysis**
   ```bash
   npm run build
   npm run analyze  # Uses webpack-bundle-analyzer or similar
   # Check: Total bundle size, largest dependencies, unused code
   ```

3. **Load Testing** (optional, for high-traffic features)
   ```bash
   # k6 load test
   k6 run load-test.js
   # Check: API response times under load, error rates, connection limits
   ```

4. **Database Query Audit**
   - Run slow query log
   - Analyze query plans
   - Identify N+1 queries using auto-eager-loading or explicit .include()
   - Verify indexes exist on WHERE and JOIN clauses

5. **Lighthouse CI**
   ```bash
   lhci autorun
   # Check: Performance, Accessibility, Best Practices, SEO
   # Target: >80 performance, >85 accessibility
   ```

6. **Network Waterfall**
   - Open DevTools Network tab
   - Record page load
   - Identify slow requests, waterfall bottlenecks
   - Check for render-blocking resources

---

## PASS 4: Reference App Comparison

**Purpose**: Ensure the UI/UX matches industry-standard reference applications (Monday.com for CRM, Odoo for ERP).

**Blocking**: NO — Feature parity is important but can be iterated on.

**Estimated Duration**: 45-60 minutes per major component

### For CRM Agents (Reference: Monday.com)

**Board View Comparison:**
- [ ] Board view displays columns as cards (not grid)
- [ ] Items can be dragged between columns (supports multi-select drag)
- [ ] Status column automatically color-codes (e.g., "Closed-Won" = green, "Closed-Lost" = red)
- [ ] Inline editing: Click a cell to edit without opening modal
- [ ] Column headers show count of items in each column
- [ ] Sidebar collapses/expands (toggle arrow on left)
- [ ] Search/filter bar at top (accessible via Cmd+F or search icon)
- [ ] Grouping: Can group by column (Group by Status, Group by Owner)

**Interactions & Animations:**
- [ ] Drag-drop is smooth with visual feedback (cursor changes, ghost image)
- [ ] Column status changes update immediately (no page refresh)
- [ ] Color changes on status update are instant and visible
- [ ] Modal/form opens smoothly (no janky animations)
- [ ] Loading states shown (skeleton screens or spinners)
- [ ] Undo/redo available for item changes (Cmd+Z / Cmd+Y)

**Sidebar Navigation:**
- [ ] Shows all views (Board, Calendar, Table, etc.)
- [ ] Current view is highlighted
- [ ] Can create new view (+ button)
- [ ] Can delete/rename views (right-click context menu)
- [ ] Pinned views show at top (favorites)

**Column Types Behavior:**
- [ ] Status column: Dropdown with predefined options
- [ ] Person column: Search for contacts, show avatar
- [ ] Date column: Date picker on click
- [ ] Number column: Input validation (only numbers)
- [ ] Link column: Clickable links

**Automation Center (if applicable):**
- [ ] Visual automation builder (if X then Y)
- [ ] Prebuilt automation templates
- [ ] Can disable/enable automations
- [ ] Automation history/logs

### For ERP Agents (Reference: Odoo)

**App Switcher:**
- [ ] Top-left shows current app (Sales, Accounting, etc.)
- [ ] Clicking opens app drawer with all available apps
- [ ] Apps organized by category
- [ ] Search for apps within drawer

**Form View:**
- [ ] Two-column layout: main content on left, sidebar on right
- [ ] Fields organized in sections/tabs
- [ ] Save button always visible (sticky top or in form)
- [ ] Required fields marked with asterisk
- [ ] Chatter (comments/history) on right sidebar
- [ ] Action buttons (Send, Validate, etc.) in header

**List View:**
- [ ] Checkboxes to select multiple items
- [ ] Grouping by column (Group by Stage, Group by Team)
- [ ] Inline editing for simple fields
- [ ] Search/filter bar with saved filters
- [ ] Column customization (show/hide columns)
- [ ] Column sorting (click header to sort)

**Module Navigation:**
- [ ] Sidebar shows module structure (Sales > Quotes, Sales > Orders, etc.)
- [ ] Breadcrumbs show current location
- [ ] Favorites/starred items accessible at top

**Reports & Pivot Tables (if applicable):**
- [ ] Drag columns to rows/columns/values area
- [ ] Aggregation functions (Sum, Avg, Count, etc.)
- [ ] Export to Excel/CSV
- [ ] Interactive filtering

### Comparison Methodology:

1. **Screenshot Side-by-Side**
   - Open reference app (Monday.com / Odoo) in one window
   - Open your app in another window
   - Capture screenshots of identical feature
   - List visual/functional differences

2. **Feature Parity Checklist**
   - Create a checklist for each major feature
   - Mark implemented, not-implemented, partial
   - Document any deviations and rationale

3. **Interaction Testing**
   - Test drag-drop, inline editing, inline validation
   - Test filtering, searching, sorting
   - Compare smoothness and responsiveness

4. **Visual Consistency**
   - Compare color schemes, typography, spacing
   - Check button styles, form layouts, modals
   - Ensure brand guidelines are applied consistently

### Pass 4 Report Template:

```
## Component: Board View

### Visual Comparison:
[Screenshot: reference] vs [Screenshot: your app]

### Feature Parity:
- [x] Columns display as cards
- [x] Drag-drop between columns
- [ ] Status color-coding (Partial - colors are slightly different)
- [x] Inline editing

### Issues Found:
1. MEDIUM: Column spacing is tighter than Monday.com (causes readability issues)
2. LOW: Animation on drag is slightly slower (not critical but noticeable)

### Recommendations:
- Adjust column padding to match reference (48px instead of 32px)
- Increase drag animation duration from 150ms to 200ms
```

---

## PASS 5: Senior SWE Code Review

**Purpose**: Comprehensive code quality review ensuring maintainability, scalability, and adherence to best practices.

**Blocking**: NO — Code quality issues should be fixed but won't block release.

**Estimated Duration**: 60-90 minutes per 500 lines of code

### Code Review Checklist (25 items):

**Code Organization & Structure:**
- [ ] Files follow single responsibility principle (one concern per file)
- [ ] Related files grouped in directories (features, services, components)
- [ ] File names match exported class/function names (Dashboard.tsx exports Dashboard)
- [ ] Utility functions extracted to separate files, not scattered
- [ ] Constants defined in separate constants file, not hardcoded

**Naming Conventions:**
- [ ] Files: camelCase for components/functions, PascalCase for React components
- [ ] Variables: camelCase, descriptive (not `x`, `temp`, `data`)
- [ ] Functions: verb+noun format (`getUserById`, `calculateTotal`, not `get`, `calc`)
- [ ] Constants: UPPER_SNAKE_CASE for constants
- [ ] Classes: PascalCase
- [ ] Consistency across codebase (no `getUserData` and `fetchUser` for same purpose)

**DRY Principle:**
- [ ] No code duplication (reuse functions instead of copy-paste)
- [ ] Validation logic extracted to reusable validators
- [ ] API request logic uses a shared HTTP client
- [ ] Component props consistently named across similar components

**SOLID Principles:**
- [ ] Single Responsibility: Functions do one thing
- [ ] Open/Closed: Classes open for extension, closed for modification
- [ ] Liskov Substitution: Subclasses can replace parent classes
- [ ] Interface Segregation: Interfaces are focused (not bloated)
- [ ] Dependency Injection: Dependencies passed in, not hardcoded

**Error Handling:**
- [ ] Try-catch blocks present for risky operations (network, file I/O)
- [ ] Errors logged with context (not swallowed silently)
- [ ] User-facing error messages are friendly (not "ERR_CODE_500")
- [ ] Error boundaries in React (prevents white screen of death)
- [ ] Async errors handled (promise rejection handlers)

**Logging Strategy:**
- [ ] Structured logs (JSON format with timestamp, level, context)
- [ ] Log levels appropriate (DEBUG, INFO, WARN, ERROR, FATAL)
- [ ] No sensitive data logged (passwords, tokens, PII)
- [ ] Logs include request/user context (correlation IDs)
- [ ] Log statements removed from hot paths (performance)

**Type Safety:**
- [ ] TypeScript strict mode enabled (`strict: true`)
- [ ] No `any` types (use `unknown` with type guards if needed)
- [ ] All function parameters typed
- [ ] Return types explicit (not inferred)
- [ ] Interfaces used for object shapes (not loose objects)
- [ ] Union types instead of string literals without validation

**API & Contracts:**
- [ ] API endpoints documented (OpenAPI / Swagger)
- [ ] Request/response schemas defined and validated
- [ ] Backwards compatibility maintained (API versioning)
- [ ] Deprecation warnings for old endpoints
- [ ] API error codes documented

**Database & Migrations:**
- [ ] Migrations are atomic (succeed or fail completely)
- [ ] Migrations are reversible (down migration present)
- [ ] Schema changes don't break existing queries
- [ ] No schema changes that drop data without backup
- [ ] Migrations tested in staging before production

**Testing:**
- [ ] Unit tests for business logic (not just UI)
- [ ] Integration tests for API endpoints
- [ ] E2E tests for critical user flows
- [ ] Test coverage >80% for core, >60% for UI
- [ ] Tests are readable (clear test names, AAA pattern)
- [ ] No flaky tests (tests that sometimes fail)

**Documentation:**
- [ ] README with setup instructions
- [ ] Code comments for complex logic (not obvious comments)
- [ ] JSDoc/docstrings for public functions
- [ ] Architecture documentation (ARCHITECTURE.md)
- [ ] Environment variables documented (.env.example)

**Git & Commits:**
- [ ] Commits are atomic (one feature per commit, not one per file)
- [ ] Commit messages follow convention (feat:, fix:, docs:, etc.)
- [ ] No "debug" or "WIP" commits in main
- [ ] Branch protected (requires review, CI passing)
- [ ] PR description explains why the change (not just what)

### Senior SWE Code Review Process:

1. **Automated Code Quality Checks**
   ```bash
   # ESLint / Pylint
   eslint src/
   pylint src/

   # Prettier (formatting)
   prettier --check src/

   # TypeScript strict mode
   tsc --noEmit

   # Complexity analysis
   npm run analyze:complexity
   ```

2. **Manual Code Review**
   - Read through all modified files
   - Check logic flow (any obvious bugs?)
   - Verify error handling
   - Check for security issues
   - Assess code clarity

3. **Metrics & Trends**
   - Compare against previous sprints
   - Cyclomatic complexity (target: <10 per function)
   - Test coverage trend (should be increasing)
   - Number of code review comments (trend over time)

4. **Architecture Review**
   - Does the change fit the overall architecture?
   - Are new dependencies justified?
   - Could this be built differently?
   - Any breaking changes?

### Code Review Feedback Categories:

- **CRITICAL**: Security, crashes, data loss (must fix)
- **HIGH**: Logic errors, major refactoring needed (should fix)
- **MEDIUM**: Code quality, performance, maintainability (nice to fix)
- **LOW**: Style, minor improvements, nitpicks (can defer)
- **QUESTION**: Asking for clarification (provide context)
- **PRAISE**: Highlighting good approaches (morale boost)

---

## Ralph Loop Report Template

After completing all 5 passes, the agent generates a comprehensive markdown report. Save to `./ralph-reports/YYYY-MM-DD-HH-mm-ss.md`

```markdown
# Ralph Loop QA Report
**Generated**: 2026-04-02 14:30:00 UTC
**Module**: Sales Board View
**Agent**: Claude Code CRM Agent
**Config Mode**: 5-pass
**Overall Status**: PASSED WITH ISSUES

---

## Executive Summary

The Sales Board View feature has completed the Ralph Loop with **2 Blocking Issues** and **5 Non-Blocking Issues** identified.

**Status Breakdown**:
- ✅ Functional Correctness: PASSED
- ❌ Security Audit: FAILED (1 blocking issue)
- ⚠️ Performance Review: PASSED WITH ISSUES (2 medium issues)
- ✅ Reference Comparison: PASSED
- ⚠️ Code Review: PASSED WITH ISSUES (2 medium issues)

**Recommendation**: Address the blocking security issue before deployment. Performance and code quality improvements can be scheduled for next sprint.

---

## PASS 1: Functional Correctness

**Status**: ✅ PASSED

**Tests Run**: 45 unit tests, 12 integration tests, 3 E2E tests
**Coverage**: 87% (target: >80%)
**Duration**: 28 minutes

### Checklist Results:

| Item | Status | Notes |
|------|--------|-------|
| Code Compilation | ✅ | No TypeScript errors |
| Runtime Startup | ✅ | Server starts in 1.2s |
| Existing Test Suite | ✅ | All 45 tests passing |
| Feature Tests | ✅ | New board view tests: 12/12 passing |
| Happy Path | ✅ | Create deal → move to closed-won works |
| Empty State | ✅ | Empty board displays "No deals" message |
| Null Handling | ✅ | Null owner names display as "Unassigned" |
| Boundary Values | ✅ | 1000-character deal names render correctly |
| API Response Validation | ✅ | All endpoints return correct status codes |
| API Response Data | ✅ | Responses match OpenAPI schema |
| Database Consistency | ✅ | Deal status updates persist correctly |
| UI Rendering | ✅ | No layout breaks on Chrome, Firefox, Safari |
| Form Validation | ✅ | Required fields enforced |
| Navigation | ✅ | All links navigate correctly |
| Permissions | ✅ | Users can only see their own deals |
| Search/Filter | ✅ | Filtering by status works |
| Pagination | ✅ | 50 items per page, no duplicates |
| Error Messages | ✅ | Clear, actionable error messages |
| Browser Console | ✅ | No errors or warnings |
| Network Activity | ✅ | Expected 14 API calls, all successful |

### Issues Found: None

### Recommendation:
Feature is functionally complete and ready for security review.

---

## PASS 2: Security Audit

**Status**: ❌ FAILED (1 Blocking Issue)

**Tools Used**: npm audit, OWASP Top 10 checklist, code inspection
**Duration**: 52 minutes

### Checklist Results:

| Item | Status | Notes |
|------|--------|-------|
| SQL Injection | ✅ | All queries use parameterized ORM |
| Raw SQL | ✅ | No raw SQL concatenation found |
| ORM Usage | ✅ | Sequelize methods correct |
| Database Creds | ✅ | Stored in .env, not in code |
| Password Hashing | ✅ | bcrypt with 12 salt rounds |
| XSS Prevention | ✅ | React auto-escape, no dangerouslySetInnerHTML |
| eval() Usage | ✅ | No eval() or new Function() |
| CSRF Tokens | ❌ | **BLOCKING**: DELETE /deals/:id endpoint missing CSRF token |
| Token Validation | ✅ | CSRF tokens validated on POST/PUT |
| SameSite Cookies | ✅ | Set to "Strict" |
| HTTP-Only Cookies | ✅ | Flag enabled |
| JWT Validation | ✅ | Validated on every request |
| JWT Expiration | ✅ | 15 min access tokens, 7 day refresh |
| Login Rate Limiting | ✅ | 5 attempts per 15 minutes |
| RBAC Enforcement | ✅ | Checked at API level |
| Data Isolation | ✅ | Users can't access other users' deals |
| Password Logging | ✅ | Passwords never logged |
| API Keys | ✅ | No hardcoded keys |
| PII in Errors | ✅ | Error messages are generic |
| Dependency Audit | ✅ | 0 critical, 1 medium (outdated lodash) |
| File Uploads | N/A | Not applicable to this feature |

### Issues Found:

**BLOCKING - Issue #1: Missing CSRF Token on DELETE**
- **Location**: `src/routes/deals.ts` line 145
- **Severity**: CRITICAL
- **Description**: DELETE /deals/:id endpoint does not require CSRF token. An attacker could trick a user into deleting their own deals via a cross-site request.
- **Fix**: Add `csrf()` middleware to DELETE route
- **Auto-Fix**: Applied
  ```typescript
  router.delete('/:id', auth(), csrf(), dealsController.deleteDeal);
  ```

**MEDIUM - Issue #2: Lodash Dependency**
- **Location**: `package.json`
- **Severity**: MEDIUM
- **Description**: lodash v4.17.15 has vulnerability CVE-2021-23337. Latest is v4.17.21.
- **Fix**: `npm update lodash@latest`
- **Auto-Fix**: Applied

### Recommendation:
**Feature blocked until CSRF token issue is fixed.** Issue #1 has been auto-fixed. Re-run PASS 2 to verify.

---

## PASS 3: Performance Review

**Status**: ⚠️ PASSED WITH ISSUES (2 Medium Issues)

**Tools Used**: Lighthouse, DevTools Performance, database query analysis
**Duration**: 38 minutes

### Checklist Results:

| Item | Status | Notes |
|------|--------|-------|
| N+1 Query Detection | ⚠️ | 1 N+1 query found (see Issue #1) |
| Index Coverage | ✅ | All indexed columns have indexes |
| Query Optimization | ✅ | No full table scans detected |
| API Response Time | ✅ | Average 145ms (target: <200ms) |
| DB Connection Pool | ✅ | Pool size 10, no exhaustion |
| Caching | ⚠️ | User permissions cached, but company config not cached (see Issue #2) |
| Async Jobs | ✅ | Email notifications use Bull queue |
| Pagination | ✅ | 50 items per page |
| Transactions | ✅ | Short, atomic transactions |
| Bundle Size | ✅ | 420KB gzipped (target: <500KB) |
| Code Splitting | ✅ | Board view lazy-loaded |
| Image Optimization | ✅ | PNG, JPEG compressed |
| Render Performance | ✅ | Lighthouse Performance: 92 |
| Memory Leaks | ✅ | Event listeners cleaned up |
| Redux Selectors | ✅ | Memoized selectors |
| CSS-in-JS | ✅ | styled-components properly memoized |
| Lighthouse Score | ✅ | Performance 92, Accessibility 87 |
| WebSocket Cleanup | N/A | Not applicable |
| Polling Intervals | N/A | Not applicable |
| Schema Normalization | ✅ | Proper schema design |

### Issues Found:

**MEDIUM - Issue #1: N+1 Query on Board View Load**
- **Location**: `src/services/deals.ts` line 78 - `getDealsByStage()`
- **Severity**: MEDIUM (affects performance with >500 deals)
- **Description**: Loading board view fetches all deals, then fetches owner for each deal in a loop.
- **Query Count**: 1 (deals) + 47 (per deal owner) = 48 queries total
- **Fix**: Use `.populate('owner')` to eager-load owners in single query
- **Auto-Fix**: Applied
  ```typescript
  const deals = await Deal.find({ team: teamId }).populate('owner');
  ```
- **Impact**: Reduces board load time from 850ms to 180ms

**MEDIUM - Issue #2: Missing Cache for Company Config**
- **Location**: `src/middleware/companyConfig.ts`
- **Severity**: MEDIUM (affects all requests)
- **Description**: Company configuration fetched from database on every request instead of cached.
- **Frequency**: ~200 requests/minute in typical usage
- **Fix**: Cache in Redis with 1-hour TTL, invalidate on config update
- **Auto-Fix**: Applied (partial)
  ```typescript
  const cacheKey = `company:${req.user.companyId}:config`;
  const cached = await redis.get(cacheKey);
  if (cached) return JSON.parse(cached);
  ```
- **Impact**: Reduces database load, improves request time by ~50ms

### Recommendations:
- Both issues auto-fixed. Verify performance improvements in staging.
- Monitor slow query log after N+1 fix.
- Set up Redis cache invalidation on config updates.

---

## PASS 4: Reference App Comparison (Monday.com)

**Status**: ✅ PASSED

**Duration**: 48 minutes

### Board View Comparison:

| Feature | Reference | Your App | Status | Notes |
|---------|-----------|----------|--------|-------|
| Column Cards | Monday.com | ✅ | MATCH | Identical card-based layout |
| Drag-Drop | Monday.com | ✅ | MATCH | Smooth drag-drop between columns |
| Status Colors | Monday.com | ✅ | MATCH | Green, Red, Yellow, Blue color scheme |
| Inline Editing | Monday.com | ✅ | MATCH | Click to edit, ESC to cancel |
| Column Count | Monday.com | ✅ | MATCH | Shows count in header |
| Sidebar | Monday.com | ✅ | MATCH | Collapsible sidebar |
| Search/Filter | Monday.com | ✅ | MATCH | Top search bar with filters |
| Grouping | Monday.com | ✅ | MATCH | Group by Status, Owner, etc. |
| Undo/Redo | Monday.com | ❌ | MISSING | Not implemented (nice-to-have) |
| Multi-select | Monday.com | ⚠️ | PARTIAL | Select works but batch actions limited |

### Issues Found:

**LOW - Issue #1: Undo/Redo Not Implemented**
- **Severity**: LOW (nice-to-have, not in MVP)
- **Recommendation**: Schedule for future sprint

### Screenshot Comparison:
[Board view side-by-side: reference vs your app]
Visual match: 95% (colors, spacing, layout all match Monday.com)

### Recommendation:
Feature parity with Monday.com is excellent for MVP. Undo/Redo can be added later.

---

## PASS 5: Senior SWE Code Review

**Status**: ⚠️ PASSED WITH ISSUES (2 Medium Issues)

**Lines of Code Reviewed**: 2,847
**Review Time**: 67 minutes
**Automated Checks**: ESLint (0 errors), TypeScript strict (0 errors), Complexity (max 8)

### Checklist Results:

| Item | Status | Notes |
|------|--------|-------|
| Single Responsibility | ✅ | Files focused, good separation |
| File Organization | ✅ | Features grouped by domain |
| Naming Conventions | ✅ | camelCase/PascalCase consistent |
| DRY Principle | ⚠️ | 1 violation (see Issue #1) |
| SOLID Principles | ✅ | Good adherence overall |
| Error Handling | ✅ | Try-catch blocks present |
| Logging | ✅ | Structured JSON logs |
| Type Safety | ✅ | No `any` types, strict mode |
| API Documentation | ✅ | OpenAPI spec complete |
| DB Migrations | ✅ | Reversible, tested |
| Testing | ✅ | 87% coverage, good tests |
| Documentation | ✅ | README, comments adequate |
| Git Commits | ⚠️ | 1 issue (see Issue #2) |

### Issues Found:

**MEDIUM - Issue #1: Validation Logic Duplication**
- **Location**: `src/controllers/deals.ts` and `src/services/deals.ts`
- **Severity**: MEDIUM
- **Description**: Deal validation logic duplicated in two places. Changes require updates in both.
- **Fix**: Extract to `src/validators/dealValidator.ts`, reuse in both places
- **Auto-Fix**: Applied
- **Impact**: Improved maintainability, single source of truth

**MEDIUM - Issue #2: Commit Message Quality**
- **Location**: Git history, commits from 2026-04-01
- **Severity**: MEDIUM
- **Description**: Several commits with generic messages: "fix", "update", "work in progress"
- **Examples**:
  - `git commit -m "fix"` (line 145 change, what was fixed?)
  - `git commit -m "update deals"` (too vague)
- **Fix**: Reword commits to follow conventional commits
- **Examples**:
  - `fix(deals): prevent N+1 query on board load`
  - `refactor(deals): extract validation to separate module`
- **Auto-Fix**: Not applicable (rewriting history risky)
- **Recommendation**: Future commits must follow format

### Code Quality Metrics:

| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| Test Coverage | >80% | 87% | ✅ |
| Cyclomatic Complexity | <10 | max 8 | ✅ |
| Lines of Code (largest function) | <100 | 87 | ✅ |
| Type Coverage | 100% | 98% | ✅ |
| Duplication | <5% | 8% | ⚠️ |

### Architectural Review:

- **Architecture**: Feature-based layering (controller → service → repository) - ✅ Good
- **Scalability**: Ready for multi-tenant, easily extendable - ✅ Good
- **Maintainability**: Clear structure, easy to locate code - ✅ Good
- **Dependencies**: No circular dependencies detected - ✅ Good
- **Breaking Changes**: None - ✅ Good

### Recommendation:
Code quality is high. Address the validation duplication to improve long-term maintainability.

---

## Summary & Next Steps

### Issues Breakdown:

| Severity | Count | Status |
|----------|-------|--------|
| BLOCKING | 1 | ✅ Auto-fixed (CSRF token) |
| CRITICAL | 0 | — |
| HIGH | 0 | — |
| MEDIUM | 5 | ✅ 3 auto-fixed, ⚠️ 2 manual |
| LOW | 1 | Scheduled for future sprint |

### Overall Assessment:

**Status**: ✅ READY FOR DEPLOYMENT (after manual verification of auto-fixes)

The Sales Board View feature is functionally correct, secure, performant, and well-coded. All blocking issues have been automatically remediated.

### Deployment Checklist:

- [x] Security CSRF fix deployed
- [x] Dependency (lodash) updated
- [x] N+1 query optimized (verification needed)
- [x] Company config caching enabled
- [x] Validation logic consolidated
- [ ] Manual QA in staging environment
- [ ] Load test with 1000+ deals
- [ ] Stakeholder sign-off

### Post-Deployment:

- Monitor error rates and performance metrics
- Track CSRF token validation in logs
- Verify caching effectiveness (redis hit rate)
- Collect user feedback on board view UX

---

## Metrics for Next Sprint

| Metric | This Sprint | Target | Trend |
|--------|------------|--------|-------|
| Test Coverage | 87% | >85% | ↑ |
| Security Issues | 1 | 0 | — |
| Performance Issues | 2 | <2 | → |
| Code Duplication | 8% | <5% | ↑ |
| Lighthouse Performance | 92 | >85 | ✅ |

---

## Appendix: Tool Outputs

### ESLint Output:
(No errors, 0 warnings)

### TypeScript Strict Check:
(0 errors)

### npm audit:
(1 moderate vulnerability in lodash, fixed)

### Lighthouse Report:
- Performance: 92
- Accessibility: 87
- Best Practices: 92
- SEO: 95

---

**Report Generated By**: Claude Code CRM Agent
**Report ID**: ralph-20260402-143000
**Next Review Scheduled**: 2026-04-09 (weekly check-in)
```

---

## Integration with Agent System Prompts

### How to Embed Ralph Loop in Agent Instructions:

Add this section to each Claude Code agent's system prompt (after the main task description):

```
## QUALITY ASSURANCE: Ralph Loop

After completing any feature, module, or significant code change:

1. READ the ralph-loop.config.json in your project root
2. RUN the 5 passes in sequence:
   - PASS 1: Functional Correctness (BLOCKING)
   - PASS 2: Security Audit (BLOCKING)
   - PASS 3: Performance Review (NON-BLOCKING)
   - PASS 4: Reference App Comparison (NON-BLOCKING)
   - PASS 5: Senior SWE Code Review (NON-BLOCKING)

3. FOR EACH PASS:
   - Go through the checklist line by line
   - Mark items ✅ (pass) or ❌ (fail)
   - If blocking pass fails: Stop, fix issues, re-run pass
   - If non-blocking pass fails: Document issues, decide fix priority

4. AUTO-FIX eligible issues using provided solutions (if config.auto_fix = true)

5. GENERATE a Ralph Loop Report (see template above)

6. DECISION POINT:
   - If all blocking passes: Ready for deployment
   - If blocking issues remain: Cannot deploy until fixed
   - If non-blocking issues: Schedule for next sprint or hot-fix

7. SAVE the report to ./ralph-reports/YYYY-MM-DD-HH-mm-ss.md

## Self-Reflection Prompt (After Each Pass):

After completing each pass, answer these questions before moving to the next:

**Pass 1 Self-Reflection:**
"Have I verified that the code actually works as intended? Are there any edge cases I haven't tested? Are all the tests passing?"

**Pass 2 Self-Reflection:**
"Could an attacker exploit this code? Have I checked all the OWASP Top 10 items? Are secrets stored securely?"

**Pass 3 Self-Reflection:**
"Will users experience slow load times? Are there N+1 queries? Is the database being queried efficiently?"

**Pass 4 Self-Reflection:**
"Does the UI feel like the reference app? Would a user from Monday.com/Odoo feel at home using this feature?"

**Pass 5 Self-Reflection:**
"Is this code something I'd want to maintain 6 months from now? Would a new team member understand it? Are there obvious improvements?"
```

---

## Continuous Mode: Loop Management

When `mode` is set to `"continuous"`:

1. Complete all 5 passes
2. Review issues found
3. If issues exist with `severity >= threshold`:
   - Auto-fix if `auto_fix = true`
   - Run affected passes again
   - Repeat until no issues or `max_continuous_cycles` reached
4. Generate report showing all iterations and improvements

### Continuous Mode Example Output:

```
Cycle 1: Found 3 issues
  - Auto-fixed: 2 security, 1 performance
  - Re-running: PASS 2, PASS 3

Cycle 2: Found 1 issue
  - Auto-fixed: 1 performance
  - Re-running: PASS 3

Cycle 3: No issues found
  - All passes: ✅
  - Exiting loop (converged)
```

---

## Updating & Customizing Ralph Loop

To customize Ralph Loop for your project:

1. Modify `ralph-loop.config.json` (all options)
2. Adjust checklists in this file for domain-specific needs
3. Add or remove passes based on project requirements
4. Set `auto_fix: true/false` based on team preference
5. Configure severity thresholds appropriate for your stage (MVP vs production)

---

## Success Metrics

Track these over time to measure quality improvement:

- **Security Issues Found per Release**: Should trend toward 0
- **Test Coverage**: Should increase (target >85%)
- **Performance Regressions**: Should trend toward 0
- **Code Review Comments**: Should decrease (code quality improving)
- **Time in QA Loop**: Should stabilize (as issues are eliminated)
- **Production Bugs**: Should correlate with issues caught by Ralph Loop

---

**End of Ralph Loop Configuration**
