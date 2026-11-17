# Handoff Report: Milestone 2 Integration & Testing Specification (Modules 1 & 2)

**Author**: `explorer_m2_3` (M2 Integration & Test Explorer)  
**Date**: 2026-11-05T23:42:00Z  
**Target Milestone**: Milestone 2 (RxJS Fundamentals & Creation Operators)  
**Status**: COMPLETE  

---

## 1. Observation

### 1.1 Existing E2E Test Suite Analysis (`tests/e2e/`)
Inspection of `tests/e2e/run-all-tests.js` and `tests/e2e/runner.ts` reveals a comprehensive test harness verifying 52 features across 4 tiers. Modules 1 and 2 are covered by 150 test cases across Tier 1 and Tier 2:
- Executing `node tests/e2e/run-all-tests.js --milestone M2` runs **150 tests** (75 Tier 1 + 75 Tier 2) with a 100% pass rate in **0.53 seconds**.
- The tests reside in:
  - `tests/e2e/tier1-features/t1-fundamentals.js` (Features 16–22, 35 tests)
  - `tests/e2e/tier1-features/t1-creation-operators.js` (Features 23–30, 40 tests)
  - `tests/e2e/tier2-boundaries/t2-fundamentals-boundaries.js` (Features 16–22, 35 tests)
  - `tests/e2e/tier2-boundaries/t2-creation-operators-boundaries.js` (Features 23–30, 40 tests)

#### Verbatim Test Case Inventory for Module 1 (RxJS Fundamentals)
| Feature ID | Feature Title | Tier 1 (Core Requirements) | Tier 2 (Boundary & Corner Cases) |
|---|---|---|---|
| **F16** | `what-is-rxjs` | **F16.1**: Push paradigm next() callback<br>**F16.2**: Stream processing pipeline transforms without mutating source<br>**F16.3**: Lazy evaluation: no emit until subscribe<br>**F16.4**: Push model delivers multiple values over time<br>**F16.5**: Stream completion closes channel cleanly | **F16.B1**: Synchronous unsubscription inside next handler halts emissions<br>**F16.B2**: 10,000 synchronous items process without stack explosion<br>**F16.B3**: Unhandled exception in pipeline caught by error channel<br>**F16.B4**: Zero subscribers creates zero side effects<br>**F16.B5**: Emitting undefined, null, false handles falsy values |
| **F17** | `what-is-observable` | **F17.1**: Blueprint creates independent execution context per subscriber<br>**F17.2**: Subscriber teardown executes on unsubscription<br>**F17.3**: Synchronous producer emits synchronously<br>**F17.4**: Error in producer triggers subscriber error callback<br>**F17.5**: Teardown runs even when subscriber errors | **F17.B1**: Teardown error does not crash unsubscription<br>**F17.B2**: Multiple complete() calls ignored after first<br>**F17.B3**: Null/undefined observer handlers do not throw TypeError<br>**F17.B4**: next() after error() is suppressed<br>**F17.B5**: Unsubscribing before emissions executes teardown cleanly |
| **F18** | `observable-vs-promise` | **F18.1**: Observables are cancellable via unsubscribe()<br>**F18.2**: Promises cannot be natively cancelled once initiated<br>**F18.3**: Observables emit multi-value over time; Promises resolve single<br>**F18.4**: Observables lazy; Promises eager upon instantiation<br>**F18.5**: from(Promise) bridges Promise to Observable | **F18.B1**: from(Promise.reject()) propagates rejection to error channel<br>**F18.B2**: Unsubscribing before resolve prevents next callback<br>**F18.B3**: Resolved Promise emits on next tick<br>**F18.B4**: Observable 0 items (EMPTY) vs Promise resolving undefined<br>**F18.B5**: Observable teardown handles async cancellation cleanly |
| **F19** | `observer-subscriber` | **F19.1**: Observer interface handles next, error, complete<br>**F19.2**: Subscriber ignores next() after complete()<br>**F19.3**: Subscriber ignores next() after error()<br>**F19.4**: complete() and error() are mutually exclusive<br>**F19.5**: Observer methods are optional (partial observer) | **F19.B1**: Re-entrant next() calls ordered without infinite recursion<br>**F19.B2**: Non-Error object passed to error() preserves literal value<br>**F19.B3**: Safe subscriber wrapper ensures complete() called once<br>**F19.B4**: Partial observer with only error callback does not fail<br>**F19.B5**: Calling subscriber.error(null) handles null safely |
| **F20** | `subscription-lifecycle` | **F20.1**: Subscription sets closed = true after unsubscribe()<br>**F20.2**: subscription.add(child) adds to teardown tree<br>**F20.3**: Detached child via remove() not unsubscribed by parent<br>**F20.4**: Adding closed child subscription does not cause error<br>**F20.5**: Multiple unsubscribe() calls are idempotent | **F20.B1**: Adding closed child executes child teardown immediately<br>**F20.B2**: Adding child to closed parent executes teardown immediately<br>**F20.B3**: Circular reference protection: subA.add(subB), subB.add(subA)<br>**F20.B4**: Unsubscribing 100 times consecutively does not throw<br>**F20.B5**: Teardown array handles error without aborting rest |
| **F21** | `cold-vs-hot` | **F21.1**: Cold observable: separate full sequence per subscriber<br>**F21.2**: Producer function re-invoked per subscription<br>**F21.3**: Hot Subject: late subscriber misses prior emissions<br>**F21.4**: Simultaneous subscribers share exact same emission value<br>**F21.5**: share() multicasts cold producer output | **F21.B1**: Hot Subject emitting before subscriber discards values<br>**F21.B2**: Cold stream subscribed 200 times runs 200 executions<br>**F21.B3**: Hot Subject completed: late subscriber gets complete<br>**F21.B4**: Hot Subject errored: late subscriber gets cached error<br>**F21.B5**: Hot Subject handles all unsubscribe then re-subscribe |
| **F22** | `multicasting` | **F22.1**: shareReplay(1) caches and replays last emission<br>**F22.2**: shareReplay avoids duplicating expensive side effects<br>**F22.3**: share() unsubscribes upstream when subscribers reach 0<br>**F22.4**: shareReplay({refCount: true}) resets when count is 0<br>**F22.5**: Multicast delivers to 3 concurrent observers | **F22.B1**: shareReplay(0) clamps to minimum bufferSize 1<br>**F22.B2**: shareReplay resets on error (resetOnError: true)<br>**F22.B3**: share() resets on 0 subscribers and resubscribes on next<br>**F22.B4**: shareReplay(2) with 10,000 rapid emissions buffers last 2<br>**F22.B5**: shareReplay tears down cleanly on parent unsubscribe |

#### Verbatim Test Case Inventory for Module 2 (Creation Operators)
| Feature ID | Feature Title | Tier 1 (Core Requirements) | Tier 2 (Boundary & Corner Cases) |
|---|---|---|---|
| **F23** | `of` & `from` | **F23.1**: of() emits arguments synchronously in order and completes<br>**F23.2**: of() with no arguments emits nothing and completes<br>**F23.3**: from(Array) iterates and emits each item in array<br>**F23.4**: from(Promise) emits resolved promise value and completes<br>**F23.5**: from(Iterable/Set) converts iterable collection into stream | **F23.B1**: of(null, undefined, 0, false, NaN, "") emits each strictly<br>**F23.B2**: from([]) completes immediately with 0 emissions<br>**F23.B3**: from(generator) yields values on demand<br>**F23.B4**: from(throwingIterable) propagates error to subscriber<br>**F23.B5**: from(Promise.reject()) forwards rejection safely |
| **F24** | `fromEvent` | **F24.1**: Captures event emissions from event emitter target<br>**F24.2**: Unsubscribing removes event listener from emitter<br>**F24.3**: Supports custom resultSelector / projection function<br>**F24.4**: fromEvent creates infinite stream that does not complete<br>**F24.5**: Multiple listeners independently observe same emitter | **F24.B1**: Target missing addEventListener/on throws TypeError<br>**F24.B2**: Target emitting 1000 events delivers all in order<br>**F24.B3**: Event projection throwing error directs to error channel<br>**F24.B4**: 50 subscribe/unsubscribe cycles leaves 0 listener leaks<br>**F24.B5**: Handles event object containing null/undefined payload |
| **F25** | `interval` & `timer` | **F25.1**: interval(period) emits 0, 1, 2, ... sequentially<br>**F25.2**: timer(dueTime) emits single value 0 and completes<br>**F25.3**: timer(dueTime, period) emits 0 then periodic ticks<br>**F25.4**: Unsubscribing halts interval emissions immediately<br>**F25.5**: timer(0) emits 0 on next tick and completes | **F25.B1**: interval(0) or negative clamps to setTimeout min (0/1ms)<br>**F25.B2**: timer(dueTime, 0) completes initial delay and pulses<br>**F25.B3**: Immediate unsubscribe at tick 0 cancels future intervals<br>**F25.B4**: timer with negative dueTime executes on next tick<br>**F25.B5**: 100 rapid interval subscriptions tear down cleanly |
| **F26** | `range` | **F26.1**: range(start, count) emits count integers starting at start<br>**F26.2**: range(start, 0) completes immediately with 0 emissions<br>**F26.3**: range(start, 1) emits single start value and completes<br>**F26.4**: range handles negative start numbers correctly<br>**F26.5**: range emits values synchronously | **F26.B1**: range with negative count completes with 0 emissions<br>**F26.B2**: range(0, 10000) emits 10,000 integers without skipping<br>**F26.B3**: range with start = 0 emits 0 as first element<br>**F26.B4**: range(1000000, 3) maintains integer precision<br>**F26.B5**: Unsubscribing mid-range terminates synchronously |
| **F27** | `throwError` | **F27.1**: throwError emits error notification immediately<br>**F27.2**: throwError never emits next or complete notifications<br>**F27.3**: Factory creates fresh error instance per subscription<br>**F27.4**: Preserves custom error subclasses and metadata<br>**F27.5**: Handles non-Error primitive error objects (e.g. string) | **F27.B1**: throwError factory returning undefined emits undefined<br>**F27.B2**: Factory throwing error itself forwards the thrown error<br>**F27.B3**: throwError with primitive number (500) preserves number<br>**F27.B4**: throwError + catchError recovers into alternative stream<br>**F27.B5**: 100 subscriptions evaluate error factory 100 separate times |
| **F28** | `defer` | **F28.1**: defer(factory) executes factory only upon subscription<br>**F28.2**: Factory evaluated dynamically for each new subscriber<br>**F28.3**: defer can return a Promise converted to Observable<br>**F28.4**: If factory throws synchronously, error forwarded to observer<br>**F28.5**: defer transparently passes all emissions from inner stream | **F28.B1**: Factory returning EMPTY completes synchronously<br>**F28.B2**: Factory throwing synchronously propagates error to observer<br>**F28.B3**: Nested defer chains evaluate lazily upon subscription<br>**F28.B4**: defer evaluates Date.now() timestamp afresh per subscriber<br>**F28.B5**: Unsubscribing tears down created inner observable |
| **F29** | `EMPTY` & `NEVER` | **F29.1**: EMPTY emits zero values and completes synchronously<br>**F29.2**: EMPTY never calls error callback<br>**F29.3**: NEVER never emits next and never completes<br>**F29.4**: NEVER cleans up teardown when unsubscribed<br>**F29.5**: EMPTY is safe in flattening maps to filter elements | **F29.B1**: NEVER + timeout operator throws TimeoutError after deadline<br>**F29.B2**: Subscribing to EMPTY 100 times completes 100 times<br>**F29.B3**: NEVER unsubscribed immediately leaves no open listeners<br>**F29.B4**: EMPTY with take(5) completes with 0 emissions<br>**F29.B5**: NEVER combined with take(0) completes immediately |
| **F30** | `generate` & `iif` | **F30.1**: generate() produces declarative for-loop sequence<br>**F30.2**: generate() with resultSelector maps each step value<br>**F30.3**: generate() completes immediately if condition false<br>**F30.4**: iif() switches to stream A when condition is true<br>**F30.5**: iif() evaluates condition at subscription time dynamically | **F30.B1**: generate() condition false initially completes 0 emissions<br>**F30.B2**: generate() with iterate step 0 stops safely via condition<br>**F30.B3**: iif() with condition throwing forwards error to observer<br>**F30.B4**: iif() with EMPTY as false-path completes with 0 emissions<br>**F30.B5**: generate() iterate function throwing directs to error |

---

### 1.2 Navigation and Routing Architecture

Direct observation of the routing pipeline:
1. **Root Routing (`src/app/app.routes.ts`)**:
   - Lines 10–21:
     ```typescript
     { path: '', redirectTo: 'module1/what-is-rxjs', pathMatch: 'full' },
     { path: 'module1', loadChildren: () => import('./features/module1-fundamentals/module1.routes').then(m => m.MODULE1_ROUTES) },
     { path: 'module2', loadChildren: () => import('./features/module2-creation/module2.routes').then(m => m.MODULE2_ROUTES) },
     ```
2. **Sidenav Integration (`src/app/core/layout/sidenav.component.ts` & `html`)**:
   - Injects `SearchService` and renders `searchService.navGroups()`.
   - Lines 30–55 in `sidenav.component.html`:
     ```html
     @for (topic of module.topics; track topic.id) {
       <li class="topic-item">
         <a [routerLink]="topic.path" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }" class="topic-link">
     ```
   - Topic completion badges reflect `progressService.isCompleted(topic.id)`.
3. **Module Navigation Registry (`src/app/core/services/search.service.ts`)**:
   - Module 1 Topics (lines 13–19):
     - `what-is-rxjs` (`/module1/what-is-rxjs`)
     - `what-is-observable` (`/module1/what-is-observable`)
     - `observable-vs-promise` (`/module1/observable-vs-promise`)
     - `observer-subscriber` (`/module1/observer-subscriber`)
     - `subscription-lifecycle` (`/module1/subscription-lifecycle`)
     - `cold-vs-hot` (`/module1/cold-vs-hot`)
     - `multicasting` (`/module1/multicasting`)
   - Module 2 Topics (lines 30–41):
     - `of` (`/module2/of`)
     - `from` (`/module2/from`)
     - `fromEvent` (`/module2/from-event`)
     - `interval` (`/module2/interval`)
     - `timer` (`/module2/timer`)
     - `range` (`/module2/range`)
     - `throwError` (`/module2/throw-error`)
     - `defer` (`/module2/defer`)
     - `empty` (`/module2/empty`)
     - `never` (`/module2/never`)
     - `generate` (`/module2/generate`)
     - `iif` (`/module2/iif`)
4. **Current Route Files (`module1.routes.ts` & `module2.routes.ts`)**:
   - Both currently route to `StubTopicComponent` (`src/app/features/stub-topic.component.ts`).
   - `module1.routes.ts` has 7 paths; `module2.routes.ts` has 12 paths.

---

### 1.3 Karma Test Suite Inspection

Executing `npx ng test --watch=false --browsers=ChromeHeadless` runs **72 specs** in ChromeHeadless with **0 failures**:
- All component specs in `src/app/shared/components/` successfully test signals, inputs, outputs, and edge cases.
- `provideZonelessChangeDetection()` is already used across all shared component specs (e.g., line 16 of `playground-wrapper.component.spec.ts`).

---

## 2. Logic Chain

1. **E2E Test Alignment**: The 150 E2E tests for M2 in `tests/e2e/tier1-features/` and `tests/e2e/tier2-boundaries/` serve as the **authoritative requirement oracle** for the behavior of every topic and operator. The interactive visual demos must faithfully reflect these exact behaviors (e.g. `of()` completes synchronously, `throwError()` evaluates its factory dynamically, `shareReplay` caches the last emission, etc.).
2. **Component Architecture Decision**:
   - Developing 19 separate components (7 for M1 + 12 for M2) requires ~76 files with ~80% duplicated boilerplate for `PlaygroundWrapperComponent` projection slots (`concept`, `code`, `visual`, `comparison`, `quiz`), signal declarations (`consoleEntries`, `marbleStreams`), and lifecycle cleanup.
   - Conversely, a **Data-Driven Architecture** with:
     - `FundamentalTopicComponent` driven by `module1.data.ts`
     - `CreationPlaygroundComponent` driven by `module2.data.ts`
     reduces file count from 76 to ~10 files, centralizes all content into type-safe data registries, enforces 100% UI/UX consistency, and establishes the blueprint for Module 3 (65 operators).
3. **Karma Testing in Zoneless Angular**:
   - In Zoneless mode (`provideZonelessChangeDetection()`), change detection does not rely on Zone.js task tracking. Calling `fixture.detectChanges()` manually flushes signals and updates DOM.
   - Unsubscription safety is paramount: tests must assert that when components are destroyed or when users stop a stream, subscriptions are closed (`sub.closed === true`) and timers cleared.
   - Signal assertions must inspect `activeTab()`, `isCompleted()`, `consoleEntries()`, `inputStreams()`, `outputStream()`, and parameter models directly.

---

## 3. Caveats

1. **Route Slugs vs Operator IDs**: In `search.service.ts` and `module2.routes.ts`, hyphenated slugs are used for `from-event` and `throw-error`. In the data registry, the operator IDs are `fromEvent` and `throwError`. The route resolver / component must map `from-event` ↔ `fromEvent` and `throw-error` ↔ `throwError`.
2. **DOM Event Cleanup for `fromEvent`**: In `fromEvent`, binding to DOM element events in an Angular component requires using an element reference (`@ViewChild` or template reference variable) and unsubscribing cleanly on component destruction to prevent event listener leaks.
3. **Timer Mocking in Karma**: When testing async operators like `interval` and `timer` in Karma, use Jasmine's `done` callback with short intervals (e.g. 5ms), or `fakeAsync`/`tick`. Ensure unsubscriptions run in `afterEach()` to avoid Karma timeout warnings.

---

## 4. Conclusion & Concrete Architectural Recommendations

### 4.1 Recommended File Architecture for Milestone 2

```
src/app/features/
├── module1-fundamentals/
│   ├── fundamental-topic.component.ts    # Standalone topic component hosting the 5 tabs
│   ├── fundamental-topic.component.html  # Clean template projecting into app-playground-wrapper
│   ├── fundamental-topic.component.scss  # Scoped styling (parameters, control bar, visual layout)
│   ├── fundamental-topic.component.spec.ts # Comprehensive Karma spec
│   ├── module1.data.ts                   # Authoritative catalog of all 7 topics
│   └── module1.routes.ts                 # Explicit routing to FundamentalTopicComponent
└── module2-creation/
    ├── creation-playground.component.ts  # Standalone operator playground component
    ├── creation-playground.component.html # Template with OperatorCard, params, console, marbles
    ├── creation-playground.component.scss # Scoped styling
    ├── creation-playground.component.spec.ts # Comprehensive Karma spec
    ├── module2.data.ts                   # Authoritative catalog of all 12 creation operators
    └── module2.routes.ts                 # Explicit routing to CreationPlaygroundComponent
```

### 4.2 Data Model Specifications

#### Module 1 Topic Data Model (`module1.data.ts`)
```typescript
export interface FundamentalTopicData {
  id: string; // e.g. 'what-is-rxjs', 'observable-vs-promise'
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concept: {
    summary: string;
    keyPoints: string[];
    deepDive: string;
    pitfall?: string;
  };
  code: {
    title: string;
    code: string;
    language: string;
    highlightLines?: number[];
  };
  comparison: ComparisonData; // Matches ComparisonTableComponent contract
  quiz: QuizQuestion[];       // Matches QuizBlockComponent contract
  demo: {
    description: string;
    defaultParams?: Record<string, any>;
    actions: { id: string; label: string; style?: 'primary' | 'secondary' | 'danger' }[];
  };
}
```

#### Module 2 Operator Data Model (`module2.data.ts`)
```typescript
export interface CreationOperatorData {
  id: string; // 'of', 'from', 'fromEvent', 'interval', 'timer', 'range', 'throwError', 'defer', 'empty', 'never', 'generate', 'iif'
  routeSlug: string; // 'of', 'from', 'from-event', 'interval', etc.
  operator: OperatorMetadata; // Matches OperatorCardComponent contract
  codeSnippet: (params: Record<string, any>) => string;
  parameters: {
    name: string;
    label: string;
    type: 'text' | 'number' | 'boolean' | 'select';
    default: any;
    options?: { label: string; value: any }[];
  }[];
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  initialMarbles: MarbleStream[];
}
```

### 4.3 Routing Implementations

#### `module1.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { FundamentalTopicComponent } from './fundamental-topic.component';

export const MODULE1_ROUTES: Routes = [
  { path: '', redirectTo: 'what-is-rxjs', pathMatch: 'full' },
  { path: 'what-is-rxjs', component: FundamentalTopicComponent, data: { topicId: 'what-is-rxjs' } },
  { path: 'what-is-observable', component: FundamentalTopicComponent, data: { topicId: 'what-is-observable' } },
  { path: 'observable-vs-promise', component: FundamentalTopicComponent, data: { topicId: 'observable-vs-promise' } },
  { path: 'observer-subscriber', component: FundamentalTopicComponent, data: { topicId: 'observer-subscriber' } },
  { path: 'subscription-lifecycle', component: FundamentalTopicComponent, data: { topicId: 'subscription-lifecycle' } },
  { path: 'cold-vs-hot', component: FundamentalTopicComponent, data: { topicId: 'cold-vs-hot' } },
  { path: 'multicasting', component: FundamentalTopicComponent, data: { topicId: 'multicasting' } },
];
```

#### `module2.routes.ts`
```typescript
import { Routes } from '@angular/router';
import { CreationPlaygroundComponent } from './creation-playground.component';

export const MODULE2_ROUTES: Routes = [
  { path: '', redirectTo: 'of', pathMatch: 'full' },
  { path: 'of', component: CreationPlaygroundComponent, data: { operatorId: 'of' } },
  { path: 'from', component: CreationPlaygroundComponent, data: { operatorId: 'from' } },
  { path: 'from-event', component: CreationPlaygroundComponent, data: { operatorId: 'fromEvent' } },
  { path: 'interval', component: CreationPlaygroundComponent, data: { operatorId: 'interval' } },
  { path: 'timer', component: CreationPlaygroundComponent, data: { operatorId: 'timer' } },
  { path: 'range', component: CreationPlaygroundComponent, data: { operatorId: 'range' } },
  { path: 'throw-error', component: CreationPlaygroundComponent, data: { operatorId: 'throwError' } },
  { path: 'defer', component: CreationPlaygroundComponent, data: { operatorId: 'defer' } },
  { path: 'empty', component: CreationPlaygroundComponent, data: { operatorId: 'empty' } },
  { path: 'never', component: CreationPlaygroundComponent, data: { operatorId: 'never' } },
  { path: 'generate', component: CreationPlaygroundComponent, data: { operatorId: 'generate' } },
  { path: 'iif', component: CreationPlaygroundComponent, data: { operatorId: 'iif' } },
];
```

### 4.4 Karma Testing Requirements Blueprint

For each component spec (`fundamental-topic.component.spec.ts` & `creation-playground.component.spec.ts`):
1. **TestBed Configuration**:
   ```typescript
   await TestBed.configureTestingModule({
     imports: [FundamentalTopicComponent], // or CreationPlaygroundComponent
     providers: [
       provideZonelessChangeDetection(),
       provideRouter([]),
       ProgressService
     ]
   }).compileComponents();
   ```
2. **Zoneless Signal Assertions**:
   - Assert `activeTab()` changes cleanly when `selectTab()` is called.
   - Assert `consoleEntries()` starts empty and populates with expected `{ type, value, timestamp }` entries during stream execution.
   - Assert `outputStream()` signals contain marble emissions with mapped time/labels.
3. **Execution & Teardown Verification**:
   - Verify clicking "Run" subscribes and emits values.
   - Verify clicking "Stop" or unmounting component sets active subscription `closed === true`.
   - Verify unsubscription prevents further logs to `consoleEntries()`.
4. **Data Integrity Testing**:
   - Add unit specs for `module1.data.ts` and `module2.data.ts`:
     - Every topic/operator must contain at least 1 comparison feature and item.
     - Every quiz must contain at least 3 questions with matching `correctOptionId` present in `options`.
     - Code snippets must not be empty.

---

## 5. Verification Method

To verify the integration and architecture independently:

1. **E2E Acceptance Command**:
   ```bash
   node tests/e2e/run-all-tests.js --milestone M2
   ```
   *Expected*: All 150 tests pass in < 1s.

2. **Karma Unit Test Execution**:
   ```bash
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected*: All existing 72 specs + new M1 & M2 specs pass with 0 failures.

3. **Angular Development Build**:
   ```bash
   npx ng build --configuration development
   ```
   *Expected*: Zero TypeScript or Angular compilation errors; lazy chunks generated for `module1` and `module2`.
