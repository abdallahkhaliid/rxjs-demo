# Architectural & Implementation Handoff: Module 8 (6 Real-World Mini-Projects)

## 1. Observation

Direct observations and evidence gathered from the codebase and test suites:

1. **Test Suite Requirements (Tier 1 & Tier 2 Specs)**:
   - `tests/e2e/tier1-features/t1-angular-mini-projects.js`:
     - **Feature 43 (Search Autocomplete)**: lines 350-446. Validates debounce of rapid keystrokes (`F43.1`), trimming & distinct query discard (`F43.2`), empty query bypassing backend returning `{ lessons: [] }` (`F43.3`), `switchMap` cancellation of slower in-flight search (`F43.4`), backend error resilience via `catchError` returning `{ lessons: [], total: 0 }` (`F43.5`).
     - **Feature 44 (Live Dashboard)**: lines 448-520. Validates `combineLatest` aggregating CPU, memory, network streams (`F44.1`), `scan` maintaining sliding window history capped at exactly 15 points (`[...history.slice(-14), point]`, `F44.2`), threshold alert logic (`cpu > 75` -> `CRITICAL_CPU`, `mem > 85` -> `CRITICAL_MEM`, `F44.3`), play/pause stream gating via `isPlaying$.pipe(switchMap(p => p ? tick$ : EMPTY))` (`F44.4`), ISO timestamp metadata formatting (`F44.5`).
     - **Feature 45 (Shopping Cart)**: lines 522-604. Validates action stream reducer via `scan(cartReducer, [])` for `ADD`, `REMOVE`, `UPDATE_QTY`, `CLEAR` (`F45.1`, `F45.2`, `F45.5`), `combineLatest([items$, coupon$])` calculating `subtotal`, `discount` (`RXJS20` = 20%), 8% `tax`, and `total` (`F45.3`), invalid coupon returning 0 discount (`F45.4`).
     - **Feature 46 (HTTP Request Manager)**: lines 606-693. Validates direct benchmark of all 4 flattening strategies: `switchMap` cancelling prior requests emitting final (`F46.1`), `concatMap` sequential FIFO execution (`F46.2`), `mergeMap` concurrent parallel execution (`F46.3`), `exhaustMap` accepting 1st and ignoring 2nd-4th while busy (`F46.4`), comparison metrics matrix capturing completed, cancelled, ignored, total duration (`F46.5`).
     - **Feature 47 (Polling System)**: lines 695-774. Validates periodic `timer(0, interval)` (`F47.1`), tab visibility suspension (`visible ? tick$ : EMPTY`, `F47.2`), manual refresh merging immediately (`F47.3`), transient error exponential backoff recovery via `retry(1)`/`retry({ delay: ... })` (`F47.4`), clean teardown via `takeUntil(stop$)` (`F47.5`).
     - **Feature 48 (Multi-Step Form Wizard)**: lines 776-842. Validates step 1 validation (`username` min 3 chars, `email` includes `@`, `F48.1`), dynamic field enablement based on selected role ('advanced' vs 'beginner', `F48.2`), auto-saving draft with debounce (`F48.3`), `exhaustMap` preventing duplicate submission on submit button (`F48.4`), backward navigation retaining draft state (`F48.5`).
   - `tests/e2e/tier2-boundaries/t2-angular-mini-projects-boundaries.js`:
     - **F43 Boundaries**: lines 294-370. Whitespace-only input (`"   "`) does not trigger search (`F43.B1`), special characters encoded via `encodeURIComponent` (`F43.B2`), rapid typing and deletion before debounce window triggers 0 network calls (`F43.B3`), consecutive 500 errors caught inside switchMap observable returning `[]` without crashing outer pipeline (`F43.B4`), result array capped at maximum 10 items (`F43.B5`).
     - **F44 Boundaries**: lines 372-420. `NaN` sanitized to 0 (`F44.B1`), negative values clamped to 0% (`F44.B2`), values >100 clamped to 100% (`F44.B3`), 1,000 emissions through scan capped at 15 points (`F44.B4`), paused dashboard halts all sparkline updates (`F44.B5`).
     - **F45 Boundaries**: lines 422-463. Removing non-existent ID leaves cart intact (`F45.B1`), quantity <= 0 clamped to minimum 1 (`F45.B2`), currency precision rounded to 2 decimals avoiding `0.1 + 0.2` float errors (`F45.B3`), invalid coupon code does not mutate cart items (`F45.B4`), 100 distinct items accumulate correctly (`F45.B5`).
     - **F46 Boundaries**: lines 464-516. 100 rapid concurrent triggers through `switchMap` completes only the final request (`F46.B1`), `exhaustMap` with zero active requests accepts 1st trigger immediately (`F46.B2`), `concatMap` error in one inner request handled without terminating prior results (`F46.B3`), out-of-order completion in `mergeMap` according to individual duration (`F46.B4`), metrics counter registers accurate 0 counts before execution (`F46.B5`).
     - **F47 Boundaries**: lines 518-578. Rapid visibility toggling leaves state synchronized (`F47.B1`), polling interval clamped to minimum 500ms (`F47.B2`), server unreachable returns `{ status: 'offline' }` without crashing poll loop (`F47.B3`), multiple simultaneous manual poll clicks debounced to single fetch (`F47.B4`), stop polling called multiple times safely unsubscribes (`F47.B5`).
     - **F48 Boundaries**: lines 579-638. Advancing to step 3 without steps 1 & 2 completed is blocked (`F48.B1`), double-clicking submit button within 1ms processed only once via `exhaustMap` (`F48.B2`), corrupted JSON draft in storage caught and replaced with fresh default state (`F48.B3`), role change resets step 2 fields to prevent invalid cross-role selections (`F48.B4`), step navigation clamped between 1 and 3 (`F48.B5`).

2. **Backend & Service Integration**:
   - `server/search-lessons.route.ts`: `GET /api/lessons?filter=...&pageNumber=0&pageSize=10` filters `LESSONS` by `description.includes(filter.toLowerCase())`.
   - `server/slow.route.ts`: `GET /api/slow?delay=2000&tag=default` waits `delay` ms and returns `{ status: 'success', delay, elapsedMs, ... }`.
   - `server/simulate-error.route.ts`: `GET /api/simulate-error?rate=0.3&statusCode=500&attempt=1` injects random failure based on rate.
   - `src/app/core/services/lessons.service.ts`: Already implements Angular HTTP client calls:
     - `searchLessons(filter, courseId, pageNumber, pageSize, sortOrder)`
     - `getSlow(delayMs, tag)`
     - `getSimulateError(rate, attempt, statusCode)`
   - `src/app/core/services/progress.service.ts`: Implements `saveQuizScore(topicId, score)` which auto-completes topics upon achieving >= 70% score.

3. **Routing & Current State**:
   - `src/app/features/module8-mini-projects/module8.routes.ts`: Currently routes all 6 endpoints (`search-autocomplete`, `live-dashboard`, `shopping-cart`, `http-manager`, `polling-system`, `multistep-form`) to `StubTopicComponent`.
   - `src/app/core/services/search.service.ts`: Registers Module 8 with the exact 6 topic paths:
     - `/module8/search-autocomplete`
     - `/module8/live-dashboard`
     - `/module8/shopping-cart`
     - `/module8/http-manager`
     - `/module8/polling-system`
     - `/module8/multistep-form`
   - `tests/e2e/tier1-features/t1-shell-design-api.js` (line 184): Deep nested route test tests `/module8/mini-projects/search-autocomplete`.

4. **Design System & Shared Components**:
   - `src/app/shared/components/`: Contains production components:
     - `app-playground-wrapper`: Tabbed container (`concept`, `code`, `visual`, `comparison`, `quiz`).
     - `app-code-block`: Syntax highlighted TypeScript/HTML/SCSS viewer with copy button.
     - `app-quiz-block`: Interactive quiz component emitting `(completed)="onQuizCompleted($event)"`.
     - `app-comparison-table`: Matrix comparison table.
     - `app-output-console`: Live reactive stream log viewer.
   - `src/styles/_tokens.scss`: Handcrafted dark tokens: `--color-bg-base` (`#0b0f19`), `--color-bg-surface` (`#111827`), `--color-bg-surface-elevated` (`#1e293b`), `--color-primary-500` (`#6366f1`), `--color-accent-magenta` (`#ec4899`), `--color-success` (`#10b981`), `--color-warning` (`#f59e0b`), `--color-danger` (`#ef4444`).

5. **Build & Test Baseline**:
   - E2E Test Suite (`node tests/e2e/run-all-tests.js`): 543 / 543 passed (100%).
   - Angular Compilation (`npx ng build --configuration development`): 0 errors, build completed in ~6.7s.

---

## 2. Logic Chain

1. **Standalone & Lazy-Loaded Architecture**:
   From Observation 3 and PROJECT.md, each of the 6 mini-projects must be implemented as a standalone Angular component lazy-loaded via `module8.routes.ts`. Replacing the `StubTopicComponent` references with dedicated, feature-rich project components will maintain 100% build validity while providing the full interactive implementations required by R4.

2. **Consistent Tabbed Experience via `PlaygroundWrapperComponent`**:
   From Observation 1 and 4, each project must provide all 5 canonical tabs (`concept`, `code`, `visual`, `comparison`, `quiz`):
   - `concept`: Architectural flow diagram, RxJS pipeline explanation, and reactive best practices.
   - `code`: Production TypeScript code with syntax highlighting using `app-code-block`.
   - `visual`: The interactive real-world application with rich controls, live telemetry, and state feedback.
   - `comparison`: Structural matrix comparing operator choices (e.g. `switchMap` vs `mergeMap`, polling vs websockets).
   - `quiz`: 3 interactive questions per project integrated with `ProgressService` for milestone certification.

3. **Strict E2E Behavioral Alignment**:
   From Observation 1, each project's internal reactive streams must implement the exact algorithms and boundary conditions tested by Tier 1 and Tier 2 tests:
   - Project 1: Trim, `debounceTime(300)` (with UI slider), `distinctUntilChanged`, empty check returning `of({ lessons: [], total: 0 })`, inner `catchError` returning empty list, capping at 10 items.
   - Project 2: `combineLatest` of 3 metrics, sanitizing `NaN` and clamping to [0, 100], sliding buffer of 15 points via `scan`, alert triggers (CPU > 75%, Mem > 85%), play/pause switchMap gating.
   - Project 3: `scan(cartReducer, [])`, `combineLatest([items$, coupon$])`, rounding with `Math.round(val * 100) / 100` avoiding float inaccuracies, quantity clamp to minimum 1.
   - Project 4: Identical batch requests tested across `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` against real Express `/api/slow` and `/api/simulate-error`, recording completed/cancelled/queued/ignored counters.
   - Project 5: `timer(0, intervalMs)` clamped to >= 500ms, `fromEvent(document, 'visibilitychange')` tab suspension, exponential backoff retry `retry({ delay: ... })`, inner `catchError` preventing poll crash, debounced manual refresh.
   - Project 6: Step validation, role-based topic filtering, draft auto-save with debounce, corrupted JSON draft rescue, step clamping [1, 3], role-change step 2 reset, `exhaustMap` preventing double-submission.

4. **Modular File Layout**:
   Structuring Module 8 with dedicated directories per project, plus central `module8.models.ts`, `module8.data.ts`, and dedicated domain services (`cart.service.ts`, `telemetry.service.ts`, `polling.service.ts`, `form-wizard.service.ts`) ensures clean separation of concerns, high maintainability, and zero code duplication.

---

## 3. Caveats

1. **Browser Visibility API in Headless / SSR Environments**:
   When testing or running without a DOM `document`, `fromEvent(document, 'visibilitychange')` must guard for `typeof document !== 'undefined'`. A simulated visibility toggle in the UI ensures full interactive demonstrability without relying on window blur.
2. **Timing in E2E Runner vs Interactive UI**:
   The E2E test runner tests pure RxJS pipeline constructs with mock delays (5ms - 30ms). The UI components should use production-grade timings (e.g. 300ms debounce, 1s-3s polling, 1s simulated server delays) while exposing configurable controls so users and testers can adjust the timing freely.
3. **Double-Nested Routes**:
   To support both `/module8/search-autocomplete` and the breadcrumb test `/module8/mini-projects/search-autocomplete`, `module8.routes.ts` should include a redirect or alias: `{ path: 'mini-projects/:project', redirectTo: ':project' }`.

---

## 4. Conclusion & Complete Implementation Blueprint

### 4.1 Target File Hierarchy

```
src/app/features/module8-mini-projects/
├── module8.routes.ts                          # Lazy routes + alias redirects
├── module8.models.ts                          # Comprehensive type contracts
├── module8.data.ts                            # Quizzes, concepts, comparison tables, catalogs
├── services/
│   ├── cart.service.ts                        # Shopping Cart store (scan + combineLatest)
│   ├── telemetry.service.ts                   # Real-time telemetry generator & aggregator
│   ├── polling.service.ts                     # Polling engine (timer + tab visibility + retry)
│   └── form-wizard.service.ts                 # Form wizard state store (debounce + exhaustMap)
└── components/
    ├── search-autocomplete/
    │   ├── search-autocomplete.component.ts
    │   ├── search-autocomplete.component.html
    │   └── search-autocomplete.component.scss
    ├── live-dashboard/
    │   ├── live-dashboard.component.ts
    │   ├── live-dashboard.component.html
    │   └── live-dashboard.component.scss
    ├── shopping-cart/
    │   ├── shopping-cart.component.ts
    │   ├── shopping-cart.component.html
    │   └── shopping-cart.component.scss
    ├── http-manager/
    │   ├── http-manager.component.ts
    │   ├── http-manager.component.html
    │   └── http-manager.component.scss
    ├── polling-system/
    │   ├── polling-system.component.ts
    │   ├── polling-system.component.html
    │   └── polling-system.component.scss
    └── multistep-form/
        ├── multistep-form.component.ts
        ├── multistep-form.component.html
        └── multistep-form.component.scss
```

---

### 4.2 Detailed Specifications per Component & Service

#### File 1: `src/app/features/module8-mini-projects/module8.models.ts`
Define clean interfaces for all 6 projects:
```typescript
import { Lesson, QuizQuestion, ComparisonData } from '../../core/models';

// 1. Search Autocomplete Models
export interface SearchAutocompleteState {
  query: string;
  results: Lesson[];
  totalResults: number;
  isLoading: boolean;
  errorMessage: string | null;
  activeRequests: number;
  cancelledRequests: number;
  completedRequests: number;
}

// 2. Live Dashboard Models
export type AlertStatus = 'NORMAL' | 'CRITICAL_CPU' | 'CRITICAL_MEM';

export interface TelemetryPoint {
  cpu: number;          // 0 - 100%
  mem: number;          // 0 - 100%
  net: number;          // MB/s
  timestamp: string;    // ISO string
  alertStatus: AlertStatus;
}

export interface MetricCardConfig {
  id: 'cpu' | 'mem' | 'net';
  title: string;
  unit: string;
  icon: string;
  warningThreshold: number;
  criticalThreshold: number;
}

// 3. Shopping Cart Models
export interface CatalogProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  originalPrice?: number;
  rating: number;
  badge?: string;
  icon: string;
  description: string;
}

export interface CartItem extends CatalogProduct {
  qty: number;
}

export type CartAction =
  | { type: 'ADD'; item: CatalogProduct; qty?: number }
  | { type: 'REMOVE'; id: number }
  | { type: 'UPDATE_QTY'; id: number; qty: number }
  | { type: 'CLEAR' };

export interface CartSummary {
  subtotal: number;
  discountRate: number;
  discount: number;
  tax: number;
  total: number;
  appliedCoupon: string | null;
  itemCount: number;
}

// 4. HTTP Request Manager Models
export type FlatteningStrategy = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';
export type RequestLifecycleStatus = 'idle' | 'queued' | 'active' | 'completed' | 'cancelled' | 'ignored' | 'error';

export interface BenchmarkRequestItem {
  id: number;
  tag: string;
  status: RequestLifecycleStatus;
  startTime?: number;
  endTime?: number;
  durationMs?: number;
  error?: string;
  responseSnippet?: string;
}

export interface StrategyBenchmarkResult {
  strategy: FlatteningStrategy;
  requests: BenchmarkRequestItem[];
  completedCount: number;
  cancelledCount: number;
  ignoredCount: number;
  queuedCount: number;
  totalElapsedMs: number;
  isRunning: boolean;
}

// 5. Polling System Models
export interface PollResultItem {
  pollId: number;
  timestamp: string;
  durationMs: number;
  status: 'ok' | 'offline' | 'retrying';
  attempt: number;
  itemsCount: number;
  snippet?: string;
  error?: string;
}

export interface PollingEngineState {
  isRunning: boolean;
  isTabVisible: boolean;
  intervalMs: number;
  pollCount: number;
  retryCount: number;
  lastLatencyMs: number;
  lastSuccessTimestamp: string | null;
  history: PollResultItem[];
}

// 6. Multi-Step Form Wizard Models
export type UserRole = 'beginner' | 'intermediate' | 'advanced';

export interface WizardStep1Data {
  username: string;
  email: string;
  fullName: string;
}

export interface WizardStep2Data {
  role: UserRole;
  topics: string[];
  experienceYears: number;
  newsletter: boolean;
}

export interface WizardStep3Data {
  agreedToTerms: boolean;
  notes: string;
}

export interface WizardFormData {
  currentStep: number;
  step1: WizardStep1Data;
  step2: WizardStep2Data;
  step3: WizardStep3Data;
  completedSteps: Record<number, boolean>;
}

// Project Topic Harness Data
export interface MiniProjectTopicConfig {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  conceptMarkdown: string;
  codeSnippet: string;
  comparisonData: ComparisonData;
  quizQuestions: QuizQuestion[];
}
```

---

#### File 2: `src/app/features/module8-mini-projects/module8.data.ts`
Contains the rich educational material, quizzes, catalog items, and comparison matrices for all 6 projects:
- **Search Autocomplete**:
  - Concept: Real-world typeahead design, why `switchMap` is essential for cancellation, how `catchError` inside inner observable preserves the outer stream, URL encoding safety.
  - Code: Production TypeScript snippet with `searchControl.valueChanges`, `map(t => t.trim())`, `debounceTime(300)`, `distinctUntilChanged()`, `switchMap(term => !term ? of([]) : ...catchError(...))`.
  - Comparison Table: `switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap` in search typeaheads.
  - Quiz: 3 questions on search cancellation, error handling placement, and debounce timing.
- **Live Dashboard**:
  - Concept: Multivariable stream telemetry, state accumulation via `scan` sliding window, alert evaluation logic, and subscription gating with `switchMap(playing => playing ? tick$ : EMPTY)`.
  - Code: Production snippet using `combineLatest`, `scan((history, point) => [...history.slice(-14), point])`, sanitizing `NaN` and clamping to [0, 100].
  - Comparison Table: `scan` vs `reduce`, `combineLatest` vs `zip` vs `forkJoin`.
  - Quiz: 3 questions on sliding window buffers, combining telemetry streams, and play/pause stream control.
- **Shopping Cart**:
  - Concept: Unidirectional data flow (Redux/MVI) with RxJS, action stream accumulation using `scan`, precision currency rounding (`Math.round(val * 100) / 100`), promo code combining.
  - Catalog: 4 items (RxJS Masterclass $79, Observables Deep Dive $49, Reactive Patterns Architecture $99, RxJS Testing Suite $39).
  - Promos: `RXJS20` (20% off), `DEV50` (50% off), `REACTIVE10` (10% off).
  - Comparison Table: `scan` Store vs `BehaviorSubject` State Service vs NgRx ComponentStore.
  - Quiz: 3 questions on action streams, coupon combination, and immutable reducers.
- **HTTP Request Manager**:
  - Concept: Side-by-side benchmark of all 4 flattening operators under rapid concurrent loads, lifecycle states (`QUEUED`, `ACTIVE`, `COMPLETED`, `CANCELLED`, `IGNORED`).
  - Code: Complete benchmark harness showing exact operator configurations.
  - Comparison Table: Direct matrix comparing Concurrency limit, Order preservation, Cancellation, and Use cases.
  - Quiz: 3 questions on flattening operator selection for API requests.
- **Polling System**:
  - Concept: Autonomous polling architecture, tab visibility suspension using `fromEvent(document, 'visibilitychange')`, exponential backoff retry with `retry({ delay: ... })`, graceful offline fallback.
  - Code: Polling pipeline merging periodic timer and debounced manual click, tab suspension, and inner error isolation.
  - Comparison Table: Short Polling vs Long Polling vs WebSockets vs Server-Sent Events (SSE).
  - Quiz: 3 questions on tab suspension, exponential backoff, and poll loop resilience.
- **Multi-Step Form Wizard**:
  - Concept: Multi-step registration wizard, central form state store, auto-saving drafts to LocalStorage with debounce, step validation gating, and `exhaustMap` on submit button to prevent double-submissions.
  - Code: Reactive form wizard with role-based dynamic field enabling, cross-step validation, and `exhaustMap` submission.
  - Comparison Table: Central Reactive Form Service vs Multiple FormGroups vs Route-Based Stepper.
  - Quiz: 3 questions on `exhaustMap` submission, draft auto-save debounce, and dynamic field resetting.

---

#### File 3: Domain Services in `src/app/features/module8-mini-projects/services/`

1. **`cart.service.ts`**:
   - `private readonly action$ = new Subject<CartAction>();`
   - `private readonly coupon$ = new BehaviorSubject<string>('');`
   - Reducer implementation adhering to `F45.1`, `F45.2`, `F45.5`, `F45.B1`, `F45.B2`.
   - Summary calculation adhering to `F45.3`, `F45.4`, `F45.B3`, `F45.B4`.
   - Methods: `addItem(item, qty?)`, `removeItem(id)`, `updateQuantity(id, qty)`, `clearCart()`, `applyCoupon(code)`.
   - Exposed observables: `cartItems$`, `cartSummary$`.

2. **`telemetry.service.ts`**:
   - Manages simulated hardware telemetry stream with CPU, Memory, Network metrics.
   - `isPlaying$` BehaviorSubject (default `true`).
   - `intervalSpeedMs$` BehaviorSubject (default `1000ms`, slider 200ms-2000ms).
   - Sanitization method ensuring `NaN` -> `0`, negative -> `0`, >100 -> `100` (`F44.B1`, `F44.B2`, `F44.B3`).
   - Sliding window buffer of 15 points (`F44.2`, `F44.B4`).
   - Alert status evaluation (`F44.3`).
   - Methods: `togglePlay()`, `setSpeed(ms)`, `injectSpike(metric, value)`.

3. **`polling.service.ts`**:
   - Tab visibility observable with fallback if `document` is undefined (`F47.2`, `F47.B1`).
   - Manual refresh subject debounced with `debounceTime(10)` (`F47.3`, `F47.B4`).
   - Configurable polling interval with minimum 500ms guard (`F47.B2`).
   - Exponential retry backoff on 500 errors (`F47.4`).
   - Offline fallback on network error (`F47.B3`).
   - Clean unhooking on stop (`F47.5`, `F47.B5`).
   - Methods: `startPolling()`, `stopPolling()`, `refreshNow()`, `setInterval(ms)`, `simulateTabHidden(hidden)`, `simulateBackendError(fail)`.

4. **`form-wizard.service.ts`**:
   - State BehaviorSubject containing `WizardFormData`.
   - Corrupted LocalStorage draft fallback (`F48.B3`).
   - Auto-save with debounce (`F48.3`).
   - Step clamping [1, 3] (`F48.B5`).
   - Step gating (`F48.B1`).
   - Dynamic role fields & role change reset (`F48.2`, `F48.B4`).
   - Step 1 validation (`F48.1`).
   - Submission stream with `exhaustMap` (`F48.4`, `F48.B2`).
   - Methods: `setStep(step)`, `updateStep1(data)`, `updateStep2(data)`, `updateStep3(data)`, `setRole(role)`, `submit()`, `reset()`.

---

#### File 4: Interactive Project Components

1. **`SearchAutocompleteComponent` (`components/search-autocomplete/`)**:
   - UI: Modern card layout with search bar, clear button, debounce time slider (100ms-800ms), "Simulate 500 Error" toggle.
   - Metric Badges: Keystrokes count, Network requests sent, Cancelled requests count, Active query.
   - Live Results Grid: Lesson cards with highlighted search query substrings (`<span class="hl">`), duration badge, course badge.
   - States: Loading shimmer/spinner, empty state with search tip, error alert with retry button.

2. **`LiveDashboardComponent` (`components/live-dashboard/`)**:
   - UI: System telemetry header with status badge (`ACTIVE STREAM` / `PAUSED`), "Inject Spike" button, play/pause toggle, interval slider.
   - 3 Telemetry Cards (CPU, Memory, Network):
     - Giant value percentage with trend icon.
     - Progress bar with dynamic color transitions (Green, Amber, Red).
     - SVG Mini Sparkline chart drawing the 15-point sliding history curve.
     - High, Low, and Current stats.
   - Threshold Alert Banner: Flashing warning when CPU > 75% or Memory > 85%.
   - Stream Log Console: Terminal-style real-time log.

3. **`ShoppingCartComponent` (`components/shopping-cart/`)**:
   - UI: 2-column e-commerce layout:
     - Left Column: Course/Book Catalog Grid with "Add to Cart" buttons.
     - Right Column: Shopping Cart Drawer with items, animated badge, quantity stepper (`-`, qty, `+`), line totals, delete button (`🗑️`).
     - Order Summary Card: Subtotal, Promo code field with tags (`RXJS20` for 20% off), Tax (8%), Grand Total.
     - "Clear Cart" and "Proceed to Checkout" buttons.
   - Modal Simulation: Simulated checkout flow with payment loading spinner and order confirmation receipt.

4. **`HttpManagerComponent` (`components/http-manager/`)**:
   - UI: Benchmark control console:
     - Batch size selector (4, 8, 10 requests).
     - Simulated delay slider (300ms to 2000ms).
     - "Run All 4 Strategies" trigger + individual operator test triggers.
     - "Reset" button.
   - 4 Strategy Columns Side-by-Side (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`):
     - Operator header with concurrency mode tag and live status badge.
     - Animated progress bar per request with status badges: `QUEUED` (yellow), `ACTIVE` (cyan pulse), `COMPLETED` (green check), `CANCELLED` (strikethrough gray), `IGNORED` (red badge).
     - Bottom metrics: Completed, Cancelled, Ignored, Total time.
   - Comparative Summary Table: Latency, Concurrency, Data Safety, Angular Best Practice.

5. **`PollingSystemComponent` (`components/polling-system/`)**:
   - UI: Telemetry status bar with live status indicator (`● ACTIVE POLLING`, `❚❚ TAB HIDDEN - SUSPENDED`, `■ STOPPED`, `⚠ RETRYING WITH BACKOFF`).
   - Controls: Start/Stop button, "Refresh Now" button, polling interval slider (500ms to 10s), "Simulate Tab Visibility" toggle, "Simulate Error" toggle.
   - Live Results Card: Latest fetched lessons from Express backend, latency badge, last updated timestamp.
   - History Log Table: Last 10 poll attempts with status code, attempt count, elapsed ms, and payload size.

6. **`MultistepFormComponent` (`components/multistep-form/`)**:
   - UI: Stepper header with 3 steps: `1. Account` -> `2. Preferences & Role` -> `3. Review & Submit`.
   - Step 1: Username, Email, Full Name inputs with reactive validation hints.
   - Step 2: Role selection (Beginner, Intermediate, Advanced) dynamically toggling topic interests; switching roles resets topics.
   - Step 3: Read-only summary cards of Steps 1 and 2, Terms checkbox, Submit button with spinner.
   - Controls: "← Back", "Next Step →" (disabled if invalid), "Submit Registration".
   - Draft Status Pill: Autosave indicator in corner.
   - Confirmation Screen: Congratulations badge with registered profile JSON snippet and "Start New" button.

---

#### File 5: `src/app/features/module8-mini-projects/module8.routes.ts`
Route configuration wiring all 6 standalone components and supporting deep-link aliases:
```typescript
import { Routes } from '@angular/router';

export const MODULE8_ROUTES: Routes = [
  { path: '', redirectTo: 'search-autocomplete', pathMatch: 'full' },
  {
    path: 'search-autocomplete',
    loadComponent: () =>
      import('./components/search-autocomplete/search-autocomplete.component').then(
        m => m.SearchAutocompleteComponent
      )
  },
  {
    path: 'live-dashboard',
    loadComponent: () =>
      import('./components/live-dashboard/live-dashboard.component').then(
        m => m.LiveDashboardComponent
      )
  },
  {
    path: 'shopping-cart',
    loadComponent: () =>
      import('./components/shopping-cart/shopping-cart.component').then(
        m => m.ShoppingCartComponent
      )
  },
  {
    path: 'http-manager',
    loadComponent: () =>
      import('./components/http-manager/http-manager.component').then(
        m => m.HttpManagerComponent
      )
  },
  {
    path: 'polling-system',
    loadComponent: () =>
      import('./components/polling-system/polling-system.component').then(
        m => m.PollingSystemComponent
      )
  },
  {
    path: 'multistep-form',
    loadComponent: () =>
      import('./components/multistep-form/multistep-form.component').then(
        m => m.MultistepFormComponent
      )
  },
  // Alias for deep-nested breadcrumb tests (/module8/mini-projects/:project)
  {
    path: 'mini-projects/:project',
    redirectTo: ':project'
  }
];
```

---

## 5. Verification Method

To independently verify the implementation:

1. **E2E Acceptance Test Suite**:
   Execute the project E2E test suite:
   ```powershell
   node tests/e2e/run-all-tests.js
   ```
   **Acceptance Criteria**:
   - All 543 tests pass (100%).
   - Specifically features `F43`, `F44`, `F45`, `F46`, `F47`, `F48` in `tests/e2e/tier1-features/t1-angular-mini-projects.js` pass with 0 failures.
   - Boundary tests in `tests/e2e/tier2-boundaries/t2-angular-mini-projects-boundaries.js` (`F43.B1` through `F48.B5`) pass with 0 failures.

2. **Angular Compilation & Bundle Verification**:
   Execute:
   ```powershell
   npx ng build --configuration development
   ```
   **Acceptance Criteria**:
   - Build completes with 0 errors and 0 warnings.
   - `module8-routes` and child component chunks are generated under `dist/rxjs-demo/`.

3. **Backend Integration Verification**:
   Verify the Express server endpoints:
   - `GET http://localhost:9000/api/lessons?filter=rxjs` returns status 200 and filtered lessons.
   - `GET http://localhost:9000/api/slow?delay=500` returns status 200 after 500ms.
   - `GET http://localhost:9000/api/simulate-error?rate=0.5` returns either 200 or 500.

4. **UI & Navigation Verification**:
   - Navigate to each of the 6 URLs in the browser:
     - `http://localhost:4200/module8/search-autocomplete`
     - `http://localhost:4200/module8/live-dashboard`
     - `http://localhost:4200/module8/shopping-cart`
     - `http://localhost:4200/module8/http-manager`
     - `http://localhost:4200/module8/polling-system`
     - `http://localhost:4200/module8/multistep-form`
   - Verify all 5 tabs (`concept`, `code`, `visual`, `comparison`, `quiz`) render smoothly.
   - Verify completing quizzes records progress in `ProgressService` and marks the topic checkmark in the sidenav.

---

## 6. Worker Execution Checklist

The worker agent should execute the following sequence:

- [ ] **Step 1**: Create `src/app/features/module8-mini-projects/module8.models.ts` with all shared interfaces.
- [ ] **Step 2**: Create `src/app/features/module8-mini-projects/module8.data.ts` with concepts, code snippets, comparison tables, quizzes, and catalog data.
- [ ] **Step 3**: Create domain services in `src/app/features/module8-mini-projects/services/`:
  - `cart.service.ts`
  - `telemetry.service.ts`
  - `polling.service.ts`
  - `form-wizard.service.ts`
- [ ] **Step 4**: Implement the 6 standalone components in `src/app/features/module8-mini-projects/components/`:
  - `search-autocomplete` (ts, html, scss)
  - `live-dashboard` (ts, html, scss)
  - `shopping-cart` (ts, html, scss)
  - `http-manager` (ts, html, scss)
  - `polling-system` (ts, html, scss)
  - `multistep-form` (ts, html, scss)
- [ ] **Step 5**: Update `src/app/features/module8-mini-projects/module8.routes.ts` to lazy-load all 6 components and configure the `mini-projects/:project` redirect.
- [ ] **Step 6**: Run `node tests/e2e/run-all-tests.js` to verify all 543 tests pass.
- [ ] **Step 7**: Run `npx ng build --configuration development` to verify clean compilation.
