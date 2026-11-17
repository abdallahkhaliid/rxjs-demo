## 2026-11-06T16:00:01Z

You are worker_m5_projects. Your working directory is:
c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m5_projects\

Your parent is: eeaaecb4-0936-4b3f-96eb-a9d07aa8df89

MANDATORY FIRST STEP:
Read c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md before doing any other work. Do not skip or summarize.

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

EXCLUSIVE WRITE BOUNDARIES:
You own and may ONLY modify or create files within:
`src/app/features/module8-mini-projects/*`
You MUST NOT edit files in `module7-angular` or any other module!

ARCHITECTURE & SPECIFICATIONS:
Read the comprehensive architectural blueprints produced by our explorers:
1. Primary Blueprint: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_module8\handoff.md`
2. Test Specs & Zoneless Rules: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_tests\handoff.md`
3. `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`

TASKS:
Implement Module 8 (6 Real-World Mini-Projects) with 100% production-grade quality:
1. `module8.models.ts`: Domain models for all 6 projects (Search, Telemetry, Cart, Request Manager, Polling, Form Wizard).
2. `module8.data.ts`: Educational content, code snippets, comparison tables, catalogs, and quizzes for all 6 mini-projects.
3. 4 Dedicated Domain Services in `services/`:
   - `cart.service.ts`: BehaviorSubject actions (`ADD`, `REMOVE`, `UPDATE_QTY`, `CLEAR`) + `scan(cartReducer, [])`, `combineLatest([items$, coupon$])` calculating subtotal, discount, tax, total with float rounding protection and quantity clamp >= 1 (F45).
   - `telemetry.service.ts`: `combineLatest` aggregating CPU, Memory, Network; sliding 15-point window via `scan`; `NaN` and clamp [0, 100]; alert triggers (CPU > 75%, Mem > 85%); play/pause gating via switchMap (F44).
   - `polling.service.ts`: `timer(0, intervalMs)` (clamped >= 500ms); tab visibility suspension via `fromEvent(document, 'visibilitychange')`; exponential backoff retry; debounced manual refresh; clean `takeUntil(stop$)` (F47).
   - `form-wizard.service.ts`: 3-step registration state store; debounced draft auto-save; corrupted JSON draft recovery; dynamic role-based filtering; step navigation clamping [1, 3]; `exhaustMap` submission to prevent double-submit (F48).
4. 6 Standalone Components inside `app-playground-wrapper` across all 5 slots (`concept`, `code`, `visual`, `comparison`, `quiz`):
   - `components/search-autocomplete/search-autocomplete.component.ts|html|scss` (F43: debounceTime(300), distinctUntilChanged, switchMap GET /api/lessons, loading spinner, hit count, empty query bypass, inner catchError, capped at 10 items)
   - `components/live-dashboard/live-dashboard.component.ts|html|scss` (F44: SVG sparklines, live gauges, alert banners, speed slider)
   - `components/shopping-cart/shopping-cart.component.ts|html|scss` (F45: product grid, cart drawer/table, coupon input RXJS20/DEV50, checkout modal)
   - `components/http-manager/http-manager.component.ts|html|scss` (F46: 4-way benchmark switchMap vs concatMap vs mergeMap vs exhaustMap against Express /api/slow & /api/simulate-error, lifecycle states QUEUED/ACTIVE/COMPLETED/CANCELLED/IGNORED)
   - `components/polling-system/polling-system.component.ts|html|scss` (F47: interval selector, live poll counter, visibility toggle simulator, manual refresh, error retry visualization)
   - `components/multistep-form/multistep-form.component.ts|html|scss` (F48: 3-step wizard with step indicator, validation, role switcher, draft resume, final submit with exhaustMap)
5. `module8.routes.ts`: Update routes with lazy loading for all 6 projects, plus alias redirect `{ path: 'mini-projects/:project', redirectTo: ':project' }`.
6. `module8.spec.ts`: Comprehensive Karma unit test suite covering services and components (minimum 30 tests, all passing).

VERIFICATION REQUIREMENTS:
Run:
- `npx ng test --watch=false --browsers=ChromeHeadless` (must pass 100% with no regressions)
- `npx ng build --configuration development` (must exit 0 with 0 compilation errors)
- `node tests/e2e/run-all-tests.js --milestone M5` (must pass 100%)

DELIVERABLE:
Write `handoff.md` in your working directory documenting:
- Files modified/created
- Verified commands and output (tests passed, build status)
- Key architectural implementations
Update `progress.md` and send message to parent `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`.
