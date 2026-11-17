# Review & Adversarial Stress Report: Module 4 (HOO Timeline) & Module 5 (Subject Sandbox)

**Reviewer**: `reviewer_m4_1`  
**Roles**: reviewer, critic  
**Target Modules**:
- Module 4: Higher-Order Observables (`src/app/features/module4-higher-order/`)
- Module 5: Subjects & Multicasting (`src/app/features/module5-subjects/`)  
**Verdict**: **APPROVE**  
**Integrity Assessment**: **NO INTEGRITY VIOLATIONS DETECTED** (No dummy facades, no hardcoded cheating, genuine RxJS & Angular 20 implementations)

---

## 1. Observation

### 1.1 Source Code Verification
1. **Module 4 Implementation (`src/app/features/module4-higher-order/`)**:
   - `module4.models.ts` (Lines 1–63): Full type definitions for `HooLifecycleState` (`'active' | 'queued' | 'cancelled' | 'ignored' | 'completed'`), `HooOperatorType`, `HooTimelineRequest`, `HooTimelineOutputEmission`, `HooTimelineSnapshot`, and `HooOperatorConfig`.
   - `module4.data.ts` (Lines 1–350+): Detailed pedagogical content, anti-patterns, marble rules, error handling code snippets using `catchError`, Angular 20 Zoneless signal patterns, master comparison matrix with 8 architectural dimensions, and 16 quiz questions (4 per operator).
   - `hoo-timeline-engine.service.ts` (Lines 1–363): `@Injectable({ providedIn: 'root' })` service and pure `TimelineStateTracker`. Implements genuine state transitions for `switchMap` (preemptive cancellation of active requests), `concatMap` (FIFO queuing and automatic promotion upon completion), `mergeMap` (concurrency limit slot enforcement, queuing excess, interleaved completions), and `exhaustMap` (dropping outer emissions while an inner is active).
   - `hoo-timeline-visualizer.component.ts`, `.html`, `.scss`: Renders animated swimlanes styled according to request state:
     - `cancelled`: Red / dashed border (`--color-danger-border`, `opacity: 0.8`)
     - `queued`: Yellow / dashed border (`--color-warning-border`, `rgba(245, 158, 11, 0.08)`)
     - `ignored`: Gray / faded (`opacity: 0.45`, dimmed)
     - `completed`: Green / solid (`--color-success-border`, `rgba(16, 185, 129, 0.08)`)
     - Chronological output stream displaying emitted marbles in arrival sequence.
   - `hoo-playground.component.ts`, `.html`, `.scss`: Standalone playground embedded in `app-playground-wrapper` across 5 tabs (`concept`, `code`, `visual`, `comparison`, `quiz`). Provides delay slider (500ms–5000ms), concurrency limit slider (for `mergeMap`), single trigger, 3-request burst trigger, custom payload trigger, teardown unsubscription simulation, and reset.
   - `hoo-overview.component.ts`: Hosts synchronized **4-Way Comparison Race Demo** executing 3 identical requests across 4 parallel engines (`switchMap`, `mergeMap`, `concatMap`, `exhaustMap`) concurrently.
   - `module4.routes.ts`: Maps `/module4/overview`, `/module4/switch-map`, `/module4/merge-map`, `/module4/concat-map`, and `/module4/exhaust-map`.

2. **Module 5 Implementation (`src/app/features/module5-subjects/`)**:
   - `module5.models.ts` (Lines 1–79): Comprehensive types for `SubjectType`, `ObserverId` ('A' | 'B' | 'C'), `ObserverStatus`, `EmissionSource` ('live' | 'replay' | 'status'), `ObserverViewModel`, `SubjectStatusModel`, and `SubjectTopicData`.
   - `module5.data.ts` (Lines 1–460): Comprehensive curriculum for sandbox, `behavior-subject`, `replay-subject`, and `async-subject`. 16 interactive quiz questions (4 per topic) and master comparison table across 9 architectural dimensions.
   - `subject-sandbox.component.ts` (Lines 1–538): Standalone sandbox instantiating genuine RxJS instances (`Subject`, `BehaviorSubject`, `ReplaySubject`, `AsyncSubject`). Controls a 3-observer fleet (`Observer A`, `Observer B`, `Observer C`) with independent subscribe/unsubscribe toggles and separate output logs.
   - Replay vs Live Discrimination: Employs synchronous execution stack detection (`isSubscribingSync = true; sub = currentSubject.subscribe(...); isSubscribingSync = false;`). Any emissions arriving synchronously during `.subscribe()` are accurately tagged as `[REPLAY]`, while subsequent emissions are tagged as `[LIVE]`.
   - Controller actions: `.next()`, `.error()`, `.complete()`, `.unsubscribe()` (close), and `resetSandbox()`. Configurable seed values (including `null` seed) and `ReplaySubject` buffer size / window time toggles.
   - `subject-detail.component.ts`, `.html`, `.scss`: Deep-dive topic views for `behavior-subject` (`.getValue()` state store), `replay-subject` (history buffer & expiration), and `async-subject` (completion gating).
   - `module5.routes.ts`: Lazy-loaded routing for `/module5/sandbox`, `/module5/behavior-subject`, `/module5/replay-subject`, and `/module5/async-subject`.

### 1.2 Independent Build & Test Execution
1. **Karma Unit Test Suite**:
   ```
   Command: npx ng test --watch=false --browsers=ChromeHeadless
   Output:
   Chrome Headless 156.0.0.0 (Windows 10): Executed 229 of 229 SUCCESS (13.201 secs / 12.634 secs)
   TOTAL: 229 SUCCESS
   Exit Code: 0
   ```
   All 30 tests in `hoo-timeline.spec.ts` and 20 tests in `subject-sandbox.component.spec.ts` & `subject-detail.component.spec.ts` passed cleanly.

2. **Angular Development Compilation**:
   ```
   Command: npx ng build --configuration development
   Output:
   Lazy chunk files    | Names          |  Raw size
   chunk-ZSZ7HMV7.js   | module5-routes | 247.29 kB
   chunk-YHNGDTXY.js   | module4-routes | 184.44 kB
   Application bundle generation complete. [15.402 seconds]
   Exit Code: 0
   ```

3. **E2E Acceptance Test Suite**:
   ```
   Command: node tests/e2e/run-all-tests.js
   Output:
   Total Executed : 543 / 543
   Passed         : 543
   Failed         : 0
   Milestone M4   : 30 / 30 passed (100.0%)
   Milestone M5   : 100 / 100 passed (100.0%)
   Exit Code: 0
   ```

---

## 2. Logic Chain

1. **Integrity Validation**:
   - Checked source code for hardcoded mock returns, fake timing arrays, or facade classes designed only to appease tests.
   - Observation: `HooTimelineEngineService` dynamically maintains request maps, calculates elapsed progress, evaluates available slots based on configurable concurrency, and pushes outputs upon actual completion.
   - Observation: `SubjectSandboxComponent` uses genuine RxJS classes (`new Subject()`, `new BehaviorSubject()`, `new ReplaySubject()`, `new AsyncSubject()`) and subscribes real observer callbacks.
   - Deduction: Both implementations are authentic, functional systems, not cosmetic facades.

2. **Lifecycle State Transition Compliance**:
   - The user request and dispatch mandate tracking 4 visual lifecycle states: `cancelled`, `queued`, `ignored`, `completed`.
   - In `HooTimelineEngineService`:
     - When `switchMap` fires a new request, existing active requests transition to `state = 'cancelled'`.
     - When `concatMap` fires while an inner is active, new requests enter `state = 'queued'`, dequeuing in FIFO order upon completion.
     - When `mergeMap` hits concurrency limit `N`, incoming requests enter `state = 'queued'`. When concurrency is set to 1, behavior is strictly identical to `concatMap` (F36.B4).
     - When `exhaustMap` receives an emission while an inner is running, incoming requests enter `state = 'ignored'` without queuing.
     - Upon request duration completion, requests transition to `state = 'completed'` and push an emission marble to the chronological output stream.
   - Visualizer CSS confirms accurate styling: red dashed (`cancelled`), yellow dashed (`queued`), gray faded (`ignored`), green solid (`completed`).

3. **Observer Fleet & Replay Discrimination Compliance**:
   - The user request requires a 3-observer fleet (A, B, C) with independent controls and live vs replay detection.
   - Observation: `observers` signal manages distinct observer view models for A, B, and C with independent `subscribeObserver(id)` and `unsubscribeObserver(id)` handlers.
   - Replay vs live discrimination relies on JavaScript's synchronous call-stack execution: `BehaviorSubject` and `ReplaySubject` push buffered values synchronously during `.subscribe()`. Setting `isSubscribingSync = true` during the `.subscribe()` call reliably tags all immediate buffer values as `source: 'replay'`. Once the call returns, `isSubscribingSync = false`, ensuring subsequent emissions pushed via `.next()` are tagged as `source: 'live'`.
   - UI templates render dedicated terminal viewports with `[LIVE]` and `[REPLAY]` badges for each observer.

4. **Resource Management & Teardown**:
   - Both modules implement clean unsubscription in `ngOnDestroy`:
     - `HooPlaygroundComponent`: unsubscribes router events, aborts in-flight HTTP calls, and stops the simulation timer.
     - `SubjectSandboxComponent`: tears down all observer subscriptions and cleans up the active Subject instance without leaking memory or throwing unhandled errors.

---

## 3. Adversarial Stress & Edge Case Challenges

| Challenge / Scenario | Expected Behavior | Actual Behavior | Result |
|---|---|---|---|
| **Zero / Negative Concurrency Limit on `mergeMap`** | Must clamp to minimum valid concurrency of 1 without hanging queue. | `Math.max(1, limit)` enforces limit >= 1. `checkQueue()` safely executes. | **PASS** |
| **Zero / Negative Duration Slider Input** | Must clamp to a safe minimum delay without zero-division errors. | `Math.max(200, ms)` ensures duration >= 200ms. Progress calculates cleanly. | **PASS** |
| **Rapid Burst Triggering (30+ requests in `mergeMap`)** | Active pool capped at concurrency limit; remaining requests queued without drop. | 2 active slots filled, 28 requests queued. On completion, items promote sequentially. | **PASS** |
| **Subscription to Errored Subject** | Late observer should receive error notification immediately without crashing. | Observer `error` callback invoked synchronously; status marked as `error`. | **PASS** |
| **Subscription to Completed Subject** | Late observer receives complete notification immediately with 0 new live emissions. | Observer `complete` callback invoked; status marked as `completed`. | **PASS** |
| **`BehaviorSubject` Initialized with `null`** | Must accept `null` as valid initial emission, not treat as undefined. | Verified in unit test F37.B1: `.getValue()` returns `null`; observer receives `null`. | **PASS** |
| **`ReplaySubject` Window Time Expiration** | Expired emissions beyond windowTime must be pruned before late subscriber connects. | Verified in unit test F37.B3: 20ms window prunes 35ms-old emission, delivering only fresh items. | **PASS** |
| **`AsyncSubject` Emits Multiple Values then Completes** | Observers must only receive the final emission upon completion. | Verified in unit test F37.4: Emitted 10, 20, 30 -> observer receives only `30`. | **PASS** |
| **Outer Stream Teardown (`takeUntilDestroyed`)** | All in-flight inner requests immediately transition to `cancelled`. | `cancelAllActive()` cancels all active and queued requests, halts ticker. | **PASS** |

---

## 4. Caveats

1. **Zoneless Test Compatibility**:
   - The application runs zoneless (`provideZonelessChangeDetection()`). Unit tests intentionally use `async / await` with `setTimeout` promises rather than `fakeAsync` / `tick`, guaranteeing complete independence from `zone.js`.
2. **Backend API Fallback**:
   - The live API toggle connects to Express `/api/slow`. When running purely client-side without the Express server running, the high-precision simulated engine handles all visualizer operations deterministically.

---

## 5. Conclusion

**Verdict: APPROVE**

Both Module 4 (`src/app/features/module4-higher-order/`) and Module 5 (`src/app/features/module5-subjects/`) fully satisfy all user requirements and dispatch criteria:
- Module 4: Preemptive cancellation (`switchMap`), sequential queuing (`concatMap`), concurrency-controlled parallelism (`mergeMap`), and busy-state dropping (`exhaustMap`) with the 4 animated request lifecycle states (`cancelled`, `queued`, `ignored`, `completed`). Includes 4-way comparison race, delay & concurrency sliders, burst triggers, and clean unsubscription.
- Module 5: 3-observer fleet (Observer A, B, C) with independent controls, dedicated streams, precise `[LIVE]` vs `[REPLAY]` tagging, controller triggers (Next, Error, Complete, Reset, Close), and full coverage across all 4 Subject types (`Subject`, `BehaviorSubject`, `ReplaySubject`, `AsyncSubject`).
- Build & Test: Zero errors in development build (`npx ng build --configuration development`), 229 / 229 unit tests passing (`npx ng test`), and 543 / 543 E2E acceptance tests passing.

---

## 6. Verification Method

To independently reproduce this verification:

1. **Unit Test Suite**:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected*: `TOTAL: 229 SUCCESS`, Exit code 0.

2. **Angular Development Compilation**:
   ```powershell
   npx ng build --configuration development
   ```
   *Expected*: `Application bundle generation complete`, Exit code 0.

3. **E2E Acceptance Suite**:
   ```powershell
   node tests/e2e/run-all-tests.js
   ```
   *Expected*: `Total Executed : 543 / 543`, `Passed : 543`, Exit code 0.
