# Handoff Report: Milestone 5 Test Specifications & Verification Requirements

**Agent**: `explorer_m5_tests`  
**Working Directory**: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_tests\`  
**Milestone**: Milestone 5 (Modules 7 and 8: Features F39 through F48)  
**Parent Conversation ID**: `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`  
**Timestamp**: 2026-11-06T18:00:00Z  

---

## 1. Observation

### 1.1 Authoritative Requirements & Codebase Audit
1. **`ORIGINAL_REQUEST.md` (Lines 27-36, 53-54)**:
   - **R4. Angular Integration & Real-World Mini-Projects**:
     - *Module 7 (RxJS in Angular)*: HTTP patterns against Express server, Reactive Forms auto-save, Component Lifecycle with `takeUntilDestroyed()`, State Management with BehaviorSubject store.
     - *Module 8 (Mini-Projects)*: 6 fully functional mini-projects:
       1. Search Autocomplete (hitting `GET /api/lessons?filter=...`)
       2. Live Dashboard (`interval` + `combineLatest` + `scan`)
       3. Shopping Cart (`BehaviorSubject` + `scan` + `combineLatest`)
       4. HTTP Request Manager (comparing `switchMap`, `concatMap`, `mergeMap`, `exhaustMap` on same scenario)
       5. Polling System (`timer` + `switchMap` + `takeUntil` + `retry`)
       6. Multi-Step Form (`valueChanges` + `combineLatest` + `debounceTime` + `exhaustMap`)
   - **Acceptance Criteria**:
     - Module 7 demonstrates HTTP patterns, Reactive Forms, lifecycle teardown, and reactive state management.
     - All 6 mini-projects in Module 8 are fully interactive and functional.
     - `npx ng build --configuration development` passes with zero compilation errors.

2. **`PROJECT.md` Feature Inventory (Lines 88-97)**:
   - Features F39 through F48 are mapped specifically to Milestone 5:
     - **F39**: Angular HTTP Patterns (Express backend integration, shareReplay caching, exponential backoff retry).
     - **F40**: Reactive Forms (Debounced input, valueChanges auto-save, distinctUntilChanged).
     - **F41**: Lifecycle with takeUntilDestroyed (Angular 20 DestroyRef teardown & leak simulator).
     - **F42**: BehaviorSubject State Store (Action dispatching, selectors, signal bridging via toSignal).
     - **F43**: Search Autocomplete (Lesson search hitting `GET /api/lessons?filter=...` with debounceTime + distinctUntilChanged + switchMap).
     - **F44**: Live Dashboard (interval + combineLatest + scan streaming simulated system telemetry).
     - **F45**: Shopping Cart (BehaviorSubject + scan + combineLatest dynamic cart with promo discounts).
     - **F46**: HTTP Request Manager (Direct benchmark comparing all 4 flattening operators on same Express scenario).
     - **F47**: Polling System (timer + switchMap + takeUntil + retry with tab visibility suspension).
     - **F48**: Multi-Step Form Wizard (valueChanges + combineLatest + debounceTime + exhaustMap registration wizard).

3. **Current Routes & Navigation Audit**:
   - `src/app/core/services/search.service.ts` (lines 104-132):
     - Module 7 routes registered:
       * `/module7/http-patterns` (`id: 'http-patterns'`, Title: `'HTTP Patterns & Caching'`)
       * `/module7/reactive-forms` (`id: 'reactive-forms'`, Title: `'Reactive Forms with Debounce'`)
       * `/module7/lifecycle` (`id: 'lifecycle-teardown'`, Title: `'Lifecycle & takeUntilDestroyed'`)
       * `/module7/state-store` (`id: 'state-management'`, Title: `'BehaviorSubject State Store'`)
     - Module 8 routes registered:
       * `/module8/search-autocomplete` (`id: 'search-autocomplete'`, Title: `'1. Search Autocomplete'`)
       * `/module8/live-dashboard` (`id: 'live-dashboard'`, Title: `'2. Live Telemetry Dashboard'`)
       * `/module8/shopping-cart` (`id: 'shopping-cart'`, Title: `'3. Reactive Shopping Cart'`)
       * `/module8/http-manager` (`id: 'http-request-manager'`, Title: `'4. HTTP Request Manager'`)
       * `/module8/polling-system` (`id: 'polling-system'`, Title: `'5. Polling & Tab Suspension'`)
       * `/module8/multistep-form` (`id: 'multistep-form'`, Title: `'6. Multi-Step Form Wizard'`)
   - `src/app/features/module7-angular/module7.routes.ts`: Currently points all 4 routes to `StubTopicComponent`.
   - `src/app/features/module8-mini-projects/module8.routes.ts`: Currently points all 6 routes to `StubTopicComponent`.

4. **Existing Verification Baseline**:
   - Command: `node tests/e2e/run-all-tests.js --milestone M5`
     * Result: **100 / 100 passed (100%) in 1.02s**.
     * Tier 1 (Coverage): 50 passed (5 per feature F39-F48).
     * Tier 2 (Boundaries): 50 passed (5 per feature F39-F48).
   - Command: `npx ng test --watch=false --browsers=ChromeHeadless`
     * Result: **229 / 229 passed (100%) in 9.3s**.
   - Command: `npx ng build --configuration development`
     * Result: **Exit code 0, 0 compilation errors**.

---

## 2. Logic Chain

1. **Dual Verification Architecture**:
   - The test infrastructure operates on two complementary tiers:
     - **Tier A (Node E2E Runner)**: Located in `tests/e2e/`. Runs headless Node tests using pure RxJS 7.8 against contract requirements. All 100 tests for M5 currently pass because they validate the algorithmic and operator logic.
     - **Tier B (Angular Karma Suite)**: Located in `src/app/**/*.spec.ts`. Runs within Chromium via ChromeHeadless using Angular 20 Zoneless testing primitives (`provideZonelessChangeDetection()`). Currently covers M1–M6 services and shared components (229 tests).
   - To achieve milestone completion, Module 7 and Module 8 must have corresponding Karma spec files that test the Angular components, templates, signals, forms, and service interactions.

2. **Zoneless Angular 20 Reactivity Invariants**:
   - In `app.config.ts`, `provideZonelessChangeDetection()` is enabled. `zone.js` is not loaded.
   - Consequently:
     - Changes to raw class variables do NOT trigger change detection.
     - Views update reactively via **Signals** (`signal()`, `computed()`, `model()`, `input()`), the **`async` pipe** (`source$ | async`), and **Template Event Bindings** (`(click)="..."`).
     - Any component logic that performs manual RxJS subscriptions (`.subscribe()`) updating view state must either:
       a. Write directly into an Angular Signal (e.g. `this.stateSignal.set(val)`), OR
       b. Use `toSignal(observable$, { initialValue })`, OR
       c. Inject `ChangeDetectorRef` and call `this.cdr.markForCheck()`.
     - In Jasmine unit tests, calling `fixture.detectChanges()` immediately triggers a zoneless template reconciliation pass.
     - For asynchronous debouncing, timers, and animations, `fakeAsync` is deprecated/problematic in pure zoneless environments; tests should use `jasmine.clock().install()` / `jasmine.clock().tick()` or native `await new Promise(r => setTimeout(r, ms))` or RxJS virtual time schedulers.

3. **Backend Integration & Isolation**:
   - Real backend endpoints run on Express (`server/server.ts` on port 9000):
     - `GET /api/courses/:id`
     - `PUT /api/courses/:id`
     - `GET /api/lessons?filter=...`
     * `GET /api/slow?delay=...&tag=...`
     * `GET /api/simulate-error?rate=...&attempt=...`
   - Angular services like `LessonsService` encapsulate these calls.
   - In unit tests, all components and services MUST use `provideHttpClientTesting()` and `HttpTestingController` to guarantee deterministic execution without requiring the Express server process.

---

## 3. Caveats

1. **Zone.js Absence**: Do NOT import or rely on `zone.js/testing` or `fakeAsync` in new spec files. Use standard asynchronous promises (`async/await` with `setTimeout`), `jasmine.clock()`, or RxJS marble/schedulers.
2. **Current Route Stubs**: `module7.routes.ts` and `module8.routes.ts` currently point to `StubTopicComponent`. When implementing components, routes must be updated to lazy-load the real components without altering the route paths (which are registered in `search.service.ts`).
3. **Timer Values in Tests**: Production debounce times (e.g., 300ms) should be configurable or testable with short durations (e.g., 15–50ms) or controlled via `jasmine.clock()` to prevent test suites from slowing down.

---

## 4. Conclusion & Test Specifications

### 4.1 Feature-by-Feature E2E Contract Matrix (F39–F48)

| Feature | Route Path | Component Selector | Primary Contract & Operator Pipeline | E2E Tier 1 Assertions | E2E Tier 2 Boundary Assertions | Key Cross-Feature Interactions |
|---|---|---|---|---|---|---|
| **F39: Angular HTTP Patterns** | `/module7/http-patterns` | `app-http-patterns-recipe` | `shareReplay({ bufferSize: 1, refCount: true })`, `retry({ count: 3, delay })`, `catchError`, `switchMap` refresh | F39.1: Caches response; single network call for multiple subscribers.<br>F39.2: Exponential backoff retries 500 errors 3 times.<br>F39.3: Fallback payload on failure.<br>F39.4: Refresh Subject refetches without extra subscriptions.<br>F39.5: Parallel requests via `combineLatest`/`forkJoin`. | F39.B1: Discriminates 4xx errors (does not retry 401/404).<br>F39.B2: Persistent 500 exhausts 3 retries (4 total calls).<br>F39.B3: Releases connection on mid-flight unsubscription.<br>F39.B4: Safe handling of malformed JSON payload.<br>F39.B5: Rapid manual refresh cancels prior calls via `switchMap`. | **T3.04**: `/api/simulate-error` resilience.<br>**T3.11**: Store + HTTP + Lifecycle cleanup. |
| **F40: Reactive Forms Auto-Save** | `/module7/reactive-forms` | `app-reactive-forms-recipe` | `valueChanges.pipe(debounceTime(300), distinctUntilChanged(), filter(valid), switchMap(save))` | F40.1: Debounces rapid keystrokes to single save.<br>F40.2: Suppresses duplicate value saves.<br>F40.3: Validates form before auto-save.<br>F40.4: `switchMap` cancels pending save on new input.<br>F40.5: Category field updates sub-category options reactively. | F40.B1: Handles 10,000 char input without lag.<br>F40.B2: `debounceTime(0)` + `distinctUntilChanged` suppresses duplicate.<br>F40.B3: Rejects empty/whitespace strings.<br>F40.B4: Completion of `valueChanges` does not break subscriber.<br>F40.B5: Serializes nested form structures cleanly. | **T3.06**: Auto-save to Express PUT `/api/courses/1`.<br>**T3.12**: Form + Wizard validation pipeline. |
| **F41: Lifecycle with takeUntilDestroyed** | `/module7/lifecycle` | `app-lifecycle-recipe` | Angular 20 `takeUntilDestroyed(destroyRef)` and subscription leak simulator | F41.1: Unhooks stream on component destruction.<br>F41.2: Demonstrates lingering unmanaged subscriptions.<br>F41.3: Runs teardown callback immediately on destroy.<br>F41.4: Halts background `interval` timers on destroy.<br>F41.5: Safe destruction when stream already completed. | F41.B1: Subscribing after destroy completes immediately.<br>F41.B2: Destroys active timer without handle leak.<br>F41.B3: Demonstrates unmanaged leak counter discrepancy.<br>F41.B4: Managed simulator demonstrates 0 leak balance.<br>F41.B5: Multiple destroy notifications do not throw. | **T3.13**: `takeUntilDestroyed` + Polling teardown. |
| **F42: BehaviorSubject State Store** | `/module7/state-store` | `app-state-store-recipe` | Custom immutable store: `_state$ = new BehaviorSubject(init)`, `select(selector).pipe(distinctUntilChanged())`, `update(updater)` | F42.1: Immutably initializes store state.<br>F42.2: `select()` emits current slice immediately.<br>F42.3: `update()` mutates state and notifies selectors.<br>F42.4: Selectors ignore changes to unrelated branches.<br>F42.5: Bridges store slice to Angular Signal. | F42.B1: Enforces state immutability on update.<br>F42.B2: Selecting undefined property returns undefined safely.<br>F42.B3: Identical primitive update does not emit.<br>F42.B4: Supports deep state slice selection (5 levels).<br>F42.B5: Unknown actions leave state unchanged. | **T3.10**: Wizard + Store coordination.<br>**T3.11**: Store + HTTP + Teardown. |
| **F43: Search Autocomplete Mini-Project** | `/module8/search-autocomplete` | `app-search-autocomplete` | `input$.pipe(map(trim), debounceTime(300), distinctUntilChanged(), switchMap(term => search(term).pipe(catchError)))` | F43.1: Debounces rapid keystrokes to single search.<br>F43.2: Discards duplicate queries after trim.<br>F43.3: Empty query returns empty array without HTTP call.<br>F43.4: Cancels slower in-flight search when newer search arrives.<br>F43.5: Backend error caught gracefully returning empty list. | F43.B1: Whitespace-only input triggers no search.<br>F43.B2: Special characters URL encoded.<br>F43.B3: Typing & deleting within debounce window triggers 0 calls.<br>F43.B4: Consecutive 500 errors do not break pipe.<br>F43.B5: Results capped at 10 items. | **T3.05**: Express `/api/lessons` integration.<br>**T4.05**: Typist error recovery workflow. |
| **F44: Live Dashboard Mini-Project** | `/module8/live-dashboard` | `app-live-dashboard` | `combineLatest([cpu$, mem$, net$]).pipe(scan((buf, pt) => [...buf.slice(-14), pt], []))` | F44.1: Aggregates CPU, Memory, and Network streams.<br>F44.2: Capped 15-point sliding window buffer.<br>F44.3: Evaluates threshold alerts (CPU > 75%, Mem > 85%).<br>F44.4: Play/Pause toggles stream collection.<br>F44.5: Metric values formatted with ISO timestamps. | F44.B1: NaN metrics sanitized to 0.<br>F44.B2: Negative metrics clamped to 0%.<br>F44.B3: Values > 100% clamped to 100%.<br>F44.B4: 1000 items through scan maintain 15 points.<br>F44.B5: Pausing freezes sparkline point updates. | **T3.07**: Live Dashboard + OutputConsole.<br>**T4.03**: Real-time Incident Detection & Pause. |
| **F45: Shopping Cart Mini-Project** | `/module8/shopping-cart` | `app-shopping-cart` | `action$.pipe(scan(cartReducer, []))`, `combineLatest([items$, coupon$]).pipe(map(computeSummary))` | F45.1: Action stream updates items list via scan reducer.<br>F45.2: REMOVE action deletes specified item.<br>F45.3: Combines items with coupon for reactive totals.<br>F45.4: Invalid coupon yields 0% discount.<br>F45.5: CLEAR action empties cart completely. | F45.B1: Removing non-existent ID leaves cart intact.<br>F45.B2: Quantity <= 0 clamped to minimum 1.<br>F45.B3: 2-decimal floating point rounding (0.1 + 0.2).<br>F45.B4: Expired coupon does not mutate items.<br>F45.B5: 100 items accumulate without degradation. | **T3.08**: Cart + MarbleDiagram mapping.<br>**T4.02**: Full E-Commerce Purchase journey. |
| **F46: HTTP Request Manager Mini-Project** | `/module8/http-manager` | `app-http-request-manager` | Side-by-side benchmark of `switchMap`, `concatMap`, `mergeMap`, and `exhaustMap` | F46.1: `switchMap` cancels older requests; only final completes.<br>F46.2: `concatMap` executes sequentially in FIFO order.<br>F46.3: `mergeMap` executes in parallel.<br>F46.4: `exhaustMap` accepts 1st; ignores while busy.<br>F46.5: Performance matrix captures throughput stats. | F46.B1: 100 rapid requests in `switchMap` completes only 99th.<br>F46.B2: `exhaustMap` accepts 1st immediately when idle.<br>F46.B3: `concatMap` survives inner error without losing past results.<br>F46.B4: Out-of-order responses in `mergeMap` resolve by latency.<br>F46.B5: 0 requests executed yields clean initial counters. | **T4.07**: Direct 4-Operator Benchmark comparison. |
| **F47: Polling System Mini-Project** | `/module8/polling-system` | `app-polling-system` | `isTabVisible$.pipe(switchMap(vis => vis ? timer(0, ms) : EMPTY))` with `retry` and `takeUntil(stop$)` | F47.1: Timer polling triggers periodic requests.<br>F47.2: Background tab visibility suspends polling.<br>F47.3: Manual refresh immediately fetches without breaking schedule.<br>F47.4: Transient error triggers retry backoff and recovers.<br>F47.5: Stop action completes and unhooks stream. | F47.B1: Rapid visibility toggling (20x) remains synchronized.<br>F47.B2: Polling interval clamped to minimum 500ms.<br>F47.B3: Offline server returns status without crashing poll loop.<br>F47.B4: Multiple simultaneous manual clicks debounced to 1 fetch.<br>F47.B5: Multiple stop calls safely unhook. | **T3.09**: Polling + Tab Visibility + Retry.<br>**T4.06**: Background tab suspension workflow. |
| **F48: Multi-Step Form Wizard Mini-Project** | `/module8/multistep-form` | `app-multistep-form-wizard` | Multi-step reactive wizard with `debounceTime(300)` draft storage and `exhaustMap` guarded submit | F48.1: Step 1 validates username and email format.<br>F48.2: Step 2 dynamically enables fields based on role.<br>F48.3: Form draft auto-saves with debouncing.<br>F48.4: `exhaustMap` prevents duplicate submissions.<br>F48.5: Stepper preserves draft on backward navigation. | F48.B1: Direct jump to Step 3 blocked if Steps 1-2 invalid.<br>F48.B2: Rapid double-click submit executes once.<br>F48.B3: Corrupted draft in storage falls back to fresh state.<br>F48.B4: Role change resets step 2 dependent fields.<br>F48.B5: Step number clamped between 1 and 3. | **T3.10**: Wizard + BehaviorSubject Store.<br>**T4.04**: Resilient registration workflow. |

---

### 4.2 Unit Test Blueprints for Karma (ChromeHeadless)

Every component must have a dedicated `.spec.ts` co-located in its folder. Below are the architectural blueprints and test case specifications:

#### 1. Module 7 Recipes Unit Tests

##### `http-patterns-recipe.component.spec.ts`
- **Component**: `HttpPatternsRecipeComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [HttpPatternsRecipeComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      LessonsService
    ]
  });
  ```
- **Test Cases**:
  1. `should initialize with default course fetch pipeline`: verify initial state, loading flag `false`.
  2. `should cache HTTP response across subscribers using shareReplay`: invoke fetch method twice, verify single HTTP request dispatched via `httpTestingController.expectOne('/api/courses/1')`.
  3. `should retry failed requests with exponential backoff on 500 error`: mock 2 consecutive 500 error responses followed by 200 OK, verify 3 total HTTP attempts and successful view update.
  4. `should not retry 404 client errors`: mock 404 response, verify exactly 1 attempt made, error caught and fallback UI rendered.
  5. `should handle manual refresh trigger`: invoke refresh method, verify pending call cancelled/re-triggered via `switchMap` and new HTTP request dispatched.
  6. `should combine course and lesson data in parallel`: trigger parallel fetch, flush `/api/courses/1` and `/api/lessons`, verify aggregate view model.

##### `reactive-forms-recipe.component.spec.ts`
- **Component**: `ReactiveFormsRecipeComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [ReactiveFormsRecipeComponent, ReactiveFormsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([])
    ]
  });
  ```
- **Test Cases**:
  1. `should initialize reactive form with default controls and validation`: check title, description, category, and subCategory controls.
  2. `should debounce rapid valueChanges before triggering auto-save`: emit 3 rapid value changes, advance clock/promise, verify auto-save HTTP PUT dispatched exactly once with the latest value.
  3. `should suppress auto-save when value does not change (distinctUntilChanged)`: emit identical form values consecutively, verify no extra HTTP call dispatched.
  4. `should skip auto-save when form is invalid`: set required field to empty string, verify auto-save pipeline filters it out and status remains `invalid`.
  5. `should cancel in-flight save when newer input arrives (switchMap)`: emit value 1, then value 2 before value 1 resolves, verify HTTP request for value 1 is cancelled.
  6. `should update sub-category options when parent category changes`: patch category control to `'operators'`, verify sub-category options dynamically populated.

##### `lifecycle-recipe.component.spec.ts`
- **Component**: `LifecycleRecipeComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [LifecycleRecipeComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([])
    ]
  });
  ```
- **Test Cases**:
  1. `should initialize simulator in clean state`: 0 active leaks, 0 open subscriptions.
  2. `should demonstrate subscription leak in unmanaged mode`: toggle unmanaged mode, trigger 3 simulated component mounts without teardown, assert leak counter is 3.
  3. `should automatically unhook streams in managed mode using takeUntilDestroyed`: toggle managed mode, mount component, trigger destroy/unmount, assert active subscription count drops to 0.
  4. `should halt background interval timer on component destroy`: start timer stream, trigger component teardown, assert no further emissions occur.
  5. `should log lifecycle events to output console`: inspect console entries signal/array to ensure mount, emission, and teardown events are recorded.

##### `state-store-recipe.component.spec.ts`
- **Component**: `StateStoreRecipeComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [StateStoreRecipeComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([])
    ]
  });
  ```
- **Test Cases**:
  1. `should initialize store with immutable default state`: verify count = 0, filter = 'ALL', theme = 'dark'.
  2. `should update state immutably upon action dispatch`: dispatch `increment`, verify state count = 1 while previous state object reference is unmodified.
  3. `should notify only affected selectors (distinctUntilChanged)`: spy on count selector and theme selector; dispatch `setTheme('light')`; assert theme selector emits but count selector does NOT emit.
  4. `should bridge selected slice to Angular Signal`: verify signal value matches store slice and updates reactively.
  5. `should handle unknown action types gracefully without mutating state`: dispatch unrecognized action, assert state identity is preserved.

---

#### 2. Module 8 Mini-Projects Unit Tests

##### `search-autocomplete.component.spec.ts`
- **Component**: `SearchAutocompleteComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [SearchAutocompleteComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      LessonsService
    ]
  });
  ```
- **Test Cases**:
  1. `should render search input and initial empty state`: query `input[data-testid="search-input"]`, assert empty results text.
  2. `should debounce user keystrokes by 300ms`: enter 'rx', then 'rxjs' in input within 100ms; advance 300ms; verify single call to `searchLessons('rxjs')`.
  3. `should not query backend when input is empty or whitespace`: input '   ', advance timer, assert `httpTestingController.expectNone`.
  4. `should cancel previous in-flight request when user types new query (switchMap)`: search 'slow', then 'fast'; flush 'fast' first; assert only 'fast' results displayed.
  5. `should display loading spinner during active HTTP request`: trigger search, assert `[data-testid="search-loading"]` is visible before flush, and hidden after flush.
  6. `should catch backend 500 errors gracefully and show safe notice`: flush 500 error; assert error state rendered without throwing unhandled rejection.

##### `live-dashboard.component.spec.ts`
- **Component**: `LiveDashboardComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [LiveDashboardComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([])
    ]
  });
  ```
- **Test Cases**:
  1. `should aggregate CPU, Memory, and Network telemetry via combineLatest`: push mock telemetry point, assert composite dashboard model updates.
  2. `should cap sliding history buffer at 15 points via scan`: push 20 sequential telemetry points, assert history length is 15 and earliest 5 points are dropped.
  3. `should display threshold alert banner when CPU > 75% or Memory > 85%`: push point `{ cpu: 82, mem: 50, net: 200 }`, assert `[data-testid="alert-banner"]` exists and contains 'High CPU'.
  4. `should toggle play/pause state and suspend stream updates`: click `[data-testid="toggle-play-btn"]` to pause; push tick; assert history point count does not increase.
  5. `should sanitize out-of-range metric values (NaN, negative, >100%)`: push `{ cpu: -10, mem: 150 }`, assert clamped to `{ cpu: 0, mem: 100 }`.

##### `shopping-cart.component.spec.ts`
- **Component**: `ShoppingCartComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [ShoppingCartComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([])
    ]
  });
  ```
- **Test Cases**:
  1. `should render product catalog and empty cart notice`: verify catalog items rendered with "Add to Cart" buttons.
  2. `should add item to cart and increment quantity on duplicate add`: click "Add" on item 1 twice, assert cart item quantity = 2.
  3. `should remove item when remove button clicked`: click remove on item 1, assert item is removed from cart list.
  4. `should apply valid promo coupon 'RXJS20' and compute 20% discount`: enter 'RXJS20', click apply, assert subtotal $100 yields $20 discount, 8% tax ($6.40), and total $86.40.
  5. `should reject invalid coupon without discount`: enter 'INVALID', assert discount is $0.00.
  6. `should clamp item quantity to minimum 1`: set quantity to 0 or negative, assert quantity remains 1.
  7. `should clear cart completely when clear button clicked`: click clear cart, assert cart list empty.

##### `http-request-manager.component.spec.ts`
- **Component**: `HttpRequestManagerComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [HttpRequestManagerComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      LessonsService
    ]
  });
  ```
- **Test Cases**:
  1. `should render 4 operator benchmark swimlanes`: verify switchMap, concatMap, mergeMap, and exhaustMap panels.
  2. `switchMap benchmark`: fire burst of 4 requests, verify only 4th request completes while first 3 are marked `cancelled`.
  3. `concatMap benchmark`: fire burst of 4 requests, verify requests execute sequentially in FIFO order (1 -> 2 -> 3 -> 4).
  4. `mergeMap benchmark`: fire burst of 4 requests, verify all 4 requests execute in parallel.
  5. `exhaustMap benchmark`: fire burst of 4 requests, verify request 1 is accepted and requests 2, 3, 4 are marked `ignored`.
  6. `should compute and display throughput statistics`: verify completed, cancelled, and ignored counters match benchmark results.

##### `polling-system.component.spec.ts`
- **Component**: `PollingSystemComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [PollingSystemComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([]),
      LessonsService
    ]
  });
  ```
- **Test Cases**:
  1. `should start polling with configurable interval`: assert periodic fetch triggered via timer.
  2. `should suspend polling when document tab becomes hidden`: simulate `document.visibilityState = 'hidden'`, assert polling stops and status reads 'Suspended'.
  3. `should resume polling immediately when tab becomes visible`: simulate `document.visibilityState = 'visible'`, assert polling resumes immediately.
  4. `should execute manual refresh without breaking periodic schedule`: click manual refresh button, verify immediate request dispatched and periodic loop continues.
  5. `should retry failed poll with backoff and show offline notice on permanent failure`: simulate network drop, verify retry attempt followed by offline status badge.
  6. `should clamp polling interval to minimum 500ms`: enter 100ms in interval input, assert clamped to 500ms.

##### `multistep-form-wizard.component.spec.ts`
- **Component**: `MultistepFormWizardComponent`
- **Imports & Providers**:
  ```typescript
  TestBed.configureTestingModule({
    imports: [MultistepFormWizardComponent, ReactiveFormsModule],
    providers: [
      provideZonelessChangeDetection(),
      provideHttpClient(),
      provideHttpClientTesting(),
      provideRouter([])
    ]
  });
  ```
- **Test Cases**:
  1. `should render Step 1 (Account Information) by default`: verify username and email inputs present; "Next" button disabled until valid.
  2. `should advance to Step 2 when Step 1 is valid`: fill valid username and email, click "Next", assert current step is 2.
  3. `should prevent direct step navigation if previous steps invalid`: attempt to click Step 3 tab while Step 1 is incomplete, assert blocked.
  4. `should auto-save form draft to localStorage with debouncing`: type into form controls, advance 300ms, assert localStorage item contains updated draft.
  5. `should guard submit button with exhaustMap to prevent double-submission`: click "Submit" twice rapidly, assert only single submission HTTP call is processed.
  6. `should preserve draft values when navigating Back`: navigate Step 1 -> Step 2 -> Back to Step 1, verify entered values are intact.

---

### 4.3 Mocking Recipes & Zoneless Change Detection Rules

#### Rule 1: Always Configure `provideZonelessChangeDetection()`
In zoneless Angular, every unit test configuration must provide `provideZonelessChangeDetection()`:
```typescript
beforeEach(async () => {
  await TestBed.configureTestingModule({
    imports: [MyComponent],
    providers: [
      provideZonelessChangeDetection(),
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting()
    ]
  }).compileComponents();
  fixture = TestBed.createComponent(MyComponent);
  component = fixture.componentInstance;
  fixture.detectChanges();
});
```

#### Rule 2: Synchronous View Updates via Signals
When interacting with component signals in tests:
```typescript
component.mySignalInput.set('new value');
fixture.detectChanges(); // Triggers zoneless template reconciliation
expect(fixture.nativeElement.textContent).toContain('new value');
```

#### Rule 3: `HttpTestingController` Deterministic Mocking
Never use real HTTP requests in tests. Always verify and flush mocks:
```typescript
const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
expect(req.request.method).toBe('GET');
req.flush({ id: 1, title: 'RxJS In Depth' });
fixture.detectChanges();
```
To test error handling:
```typescript
req.flush('Simulated 500', { status: 500, statusText: 'Internal Server Error' });
fixture.detectChanges();
```

#### Rule 4: Timer & Debounce Testing Without Zone.js
Do NOT use `fakeAsync` or `tick()` from `@angular/core/testing` as they depend on `Zone.js`. Instead, use either:
- **Jasmine Clock**:
  ```typescript
  jasmine.clock().install();
  component.onKeystroke('angular');
  jasmine.clock().tick(300);
  fixture.detectChanges();
  // assertions
  jasmine.clock().uninstall();
  ```
- **Async Promise with Short Timers**:
  ```typescript
  component.onKeystroke('angular');
  await new Promise(r => setTimeout(r, 25));
  fixture.detectChanges();
  // assertions
  ```

#### Rule 5: Lifecycle Teardown with `DestroyRef`
To test `takeUntilDestroyed`:
```typescript
const fixture = TestBed.createComponent(MyComponent);
// stream is active
fixture.destroy(); // Fires DestroyRef teardown
// assert stream has completed and unhooked
```

---

### 4.4 Verification Checklist

#### For Workers (Implementation Agents):
- [ ] Implement standalone components with SCSS design tokens (no external UI libraries).
- [ ] Wire all 4 Module 7 recipes into `src/app/features/module7-angular/` and replace `StubTopicComponent` in `module7.routes.ts`.
- [ ] Wire all 6 Module 8 mini-projects into `src/app/features/module8-mini-projects/` and replace `StubTopicComponent` in `module8.routes.ts`.
- [ ] Ensure all input elements, buttons, and state containers have standard `data-testid` and descriptive classes matching the matrix.
- [ ] Write co-located `*.spec.ts` files for all 10 components implementing the blueprint test cases.
- [ ] Run `npx ng build --configuration development` to ensure clean build.
- [ ] Run `npx ng test --watch=false --browsers=ChromeHeadless` to verify 100% test pass.
- [ ] Run `node tests/e2e/run-all-tests.js --milestone M5` to verify 100% E2E test pass.

#### For Reviewers:
- [ ] Verify zoneless compliance: No un-notified class variable mutations; all view state managed via Signals or `async` pipe.
- [ ] Verify no `zone.js` or `fakeAsync` imports in tests or production code.
- [ ] Verify `takeUntilDestroyed()` is used for all long-lived observable subscriptions in components.
- [ ] Verify all 10 routes in `search.service.ts` resolve to the newly implemented components.
- [ ] Verify SCSS follows project design tokens (`src/styles/_tokens.scss`).

#### For Challengers (Stress & Adversarial Testing):
- [ ] Stress-test search autocomplete: rapid typing and clearing, special characters (`<>&?`), rapid consecutive 500 error responses.
- [ ] Stress-test shopping cart: adding 100 items, negative quantity inputs, coupon edge cases, float rounding (`0.1 + 0.2`).
- [ ] Stress-test live dashboard: NaN inputs, negative percentages, buffer capping at 15 points with 1000 items.
- [ ] Stress-test HTTP request manager: 100 rapid concurrent clicks on `switchMap` and `exhaustMap`.
- [ ] Stress-test polling system: rapid tab visibility changes (20x), server unreachable fallback.
- [ ] Stress-test multi-step wizard: double-click submissions, localStorage quota or JSON corruption recovery.

#### For Auditors:
- [ ] Check Git status: only files in `src/app/features/module7-angular/` and `src/app/features/module8-mini-projects/` (plus route exports) should be added/modified. No stray files in `.agents/teamwork/`.
- [ ] Full E2E suite pass: `node tests/e2e/run-all-tests.js`.
- [ ] Full Karma suite pass: `npx ng test --watch=false --browsers=ChromeHeadless`.
- [ ] Clean build verification: `npx ng build --configuration development`.

---

## 5. Verification Method

To independently verify all findings and test specifications in this report:

1. **Verify E2E Milestone 5 Acceptance**:
   ```bash
   node tests/e2e/run-all-tests.js --milestone M5 --verbose
   ```
   *Expected*: Exactly 100 tests executed (50 in Tier 1, 50 in Tier 2), 0 failures, 100% pass.

2. **Verify Existing Angular Karma Suite**:
   ```bash
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected*: 229 tests pass successfully with 0 failures.

3. **Verify Development Build Compilation**:
   ```bash
   npx ng build --configuration development
   ```
   *Expected*: Build completes with exit code 0.

4. **Verify Routing & Navigation Alignment**:
   Inspect `src/app/core/services/search.service.ts` lines 104-132, `src/app/features/module7-angular/module7.routes.ts`, and `src/app/features/module8-mini-projects/module8.routes.ts`.

5. **Invalidation Conditions**:
   - Any test failure in `node tests/e2e/run-all-tests.js --milestone M5`.
   - Any compilation error during `npx ng build --configuration development`.
   - Any Karma test failure during `npx ng test --watch=false --browsers=ChromeHeadless`.
   - Any route mismatch between `search.service.ts` and `module7.routes.ts` / `module8.routes.ts`.
