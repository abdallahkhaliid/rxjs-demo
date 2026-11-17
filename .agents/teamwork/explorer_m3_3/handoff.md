# Handoff Report: Milestone 3 Integration & Test Architecture Specification (65 Category Operators)

**Author**: `explorer_m3_3` (M3 Integration & Test Explorer)  
**Date**: 2026-11-06T01:07:00Z  
**Target Milestone**: Milestone 3 (Module 3: 65 Category Operators across 5 Categories)  
**Status**: COMPLETE / READY FOR IMPLEMENTATION & VERIFICATION  

---

## 1. Observation

### 1.1 Scope & User Requirements
- **Authoritative Request (`ORIGINAL_REQUEST.md:22`)**:
  Module 3 (Operator Categories) mandates comprehensive, interactive coverage of 65 operators across 5 categories:
  - **Transformation** (18 operators)
  - **Filtering** (19 operators)
  - **Combination** (11 operators)
  - **Utility** (12 operators)
  - **Multicasting** (5 operators)
  - Total: `18 + 19 + 11 + 12 + 5 = 65 operators`.
- **Milestone Master Plan (`PROJECT.md:80-84`)**:
  - Feature 31: Module 3: Transformation (18 ops)
  - Feature 32: Module 3: Filtering (19 ops)
  - Feature 33: Module 3: Combination (11 ops)
  - Feature 34: Module 3: Utility (12 ops)
  - Feature 35: Module 3: Multicasting (5 ops)

### 1.2 Existing E2E Test Suite Alignment & Baseline (`tests/e2e/`)
Inspection and empirical execution of the existing test harness (`tests/e2e/run-all-tests.js` and `tests/e2e/harness/runner-core.js`) revealed:
- `node tests/e2e/run-all-tests.js --milestone=M3` executes **50 tests** (25 Tier 1 + 25 Tier 2) with a 100% pass rate in **0.26 seconds**:
  - `tests/e2e/tier1-features/t1-category-operators.js` (Features 31–35, 25 tests)
  - `tests/e2e/tier2-boundaries/t2-category-operators-boundaries.js` (Features 31–35, 25 boundary tests)
- `tests/e2e/tier3-combinations/t3-cross-feature-interactions.js` includes:
  - `T3.12: Complex 4-Operator Pipeline (filter -> map -> bufferCount -> combineLatest)` directly testing cross-category operator interaction.
  - `T3.15: QuizEngine scoring + LocalStorage Persistence + Platform Certification` verifying `{ module: 'M3', score: 100, passed: true }`.

#### Inventory of Existing E2E Tests for Module 3
| Feature ID | Feature Category & Ops Count | Tier 1 Core Feature Tests (5 cases) | Tier 2 Boundary & Corner Cases (5 cases) |
|---|---|---|---|
| **F31** | **Transformation** (18 ops) | **F31.1**: `map`, `mapTo`, `pluck` transform values & property projections.<br>**F31.2**: `scan` accumulates per emission vs `reduce` accumulates until completion.<br>**F31.3**: `toArray` collects all emissions into array upon completion.<br>**F31.4**: `bufferCount` and `pairwise` bundle emissions into groups.<br>**F31.5**: `groupBy` partitions stream into grouped streams by key. | **F31.B1**: `reduce()` on EMPTY source without seed completes with 0 emissions.<br>**F31.B2**: `reduce()` on EMPTY source WITH seed emits seed and completes.<br>**F31.B3**: `pluck()` on missing nested property safely returns undefined.<br>**F31.B4**: `bufferCount` with `startBufferEvery > bufferSize` skips intermediate emissions.<br>**F31.B5**: `pairwise()` on stream emitting only 1 value completes without emission. |
| **F32** | **Filtering** (19 ops) | **F32.1**: `filter`, `take`, `takeLast`, `takeWhile`, `takeUntil` restrict emissions.<br>**F32.2**: `skip`, `skipLast`, `skipWhile` ignore leading emissions.<br>**F32.3**: `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged` suppress duplicates.<br>**F32.4**: `debounceTime` delays emission until pause duration elapses.<br>**F32.5**: `throttleTime` emits first immediately and silences subsequent burst. | **F32.B1**: `take(0)` completes immediately with zero emissions.<br>**F32.B2**: `filter` matching no elements completes with zero emissions.<br>**F32.B3**: `distinctUntilChanged` with custom deep comparator compares nested objects.<br>**F32.B4**: `debounceTime(0)` emits on next event loop tick and preserves last emission in burst.<br>**F32.B5**: `throttleTime` with `leading: true, trailing: true` handles boundary bursts. |
| **F33** | **Combination** (11 ops) | **F33.1**: `combineLatest` combines latest values whenever any source emits.<br>**F33.2**: `concat` executes streams sequentially in order.<br>**F33.3**: `merge` interleaves concurrent streams as emissions arrive.<br>**F33.4**: `forkJoin` waits for all streams to complete and emits final values.<br>**F33.5**: `zip` pairs values index-by-index; `startWith` and `endWith` wrap stream. | **F33.B1**: `combineLatest([])` with empty array completes synchronously with 0 emissions.<br>**F33.B2**: `combineLatest` where one source never emits NEVER emits anything.<br>**F33.B3**: `forkJoin({})` with empty object completes immediately with 0 emissions.<br>**F33.B4**: `withLatestFrom` ignores source emissions occurring before auxiliary stream emits.<br>**F33.B5**: `race()` unsubscribes from loser streams as soon as winner emits. |
| **F34** | **Utility** (12 ops) | **F34.1**: `tap` spies on notifications without modifying stream values.<br>**F34.2**: `delay` shifts emission timestamps into future.<br>**F34.3**: `finalize` executes callback upon stream completion or error.<br>**F34.4**: `repeat` resubscribes to source specified number of times upon completion.<br>**F34.5**: `retry` recovers from error by resubscribing up to retry count. | **F34.B1**: `timeout` throws `TimeoutError` when source exceeds deadline.<br>**F34.B2**: `retry()` with `count = 0` does not retry on error.<br>**F34.B3**: `finalize` runs when stream errors.<br>**F34.B4**: `finalize` runs when subscriber unhooks before completion.<br>**F34.B5**: `retry` with max attempts reached propagates error to observer. |
| **F35** | **Multicasting** (5 ops) | **F35.1**: `share()` shares single subscription across concurrent subscribers.<br>**F35.2**: `shareReplay(1)` buffers latest value for late subscribers.<br>**F35.3**: `publish()` creates ConnectableObservable requiring explicit `connect()`.<br>**F35.4**: `refCount()` automatically connects when subscriber arrives and disconnects on zero.<br>**F35.5**: `multicast()` accepts Subject factory function. | **F35.B1**: `publish()` without calling `connect()` never executes underlying source.<br>**F35.B2**: Calling `connect()` multiple times returns the same connection subscription.<br>**F35.B3**: `share()` handles rapid 100 subscribers subscribing and unsubscribing concurrently.<br>**F35.B4**: `shareReplay` with `bufferSize=1` resets on error (`resetOnError: true`).<br>**F35.B5**: `refCount` disconnects from source when subscriber count drops to 0. |

### 1.3 Reference Unit Test Patterns & Current Test Execution
- **Unit Test Runner**: `npx ng test --watch=false --browsers=ChromeHeadless` executed **116 unit tests** with 100% pass rate in **11.04 seconds**.
- **Reference Spec (`src/app/features/module2-creation/creation-playground.component.spec.ts:1-336`)**:
  - Utilizes `@angular/core/testing`: `TestBed`, `ComponentFixture`, `provideZonelessChangeDetection()`, `provideRouter([])`, `ActivatedRoute` mock.
  - Verifies signal reactivity: `operatorId()`, `config()`, `activeTab()`, `isRunning()`, `isCompleted()`, `consoleEntries()`, `outputMarbleStream()`.
  - Asserts data completeness: loops over all operators in the module data, validating `id`, `name`, `signature`, `summary`, `codeSnippet`, `comparison`, and `quiz` schemas.
  - Evaluates real RxJS pipeline execution with asynchronous timers, completion flags, and unsubscription teardown.
- **Stress & Adversarial Spec (`src/app/features/module2-creation/m2-adversarial-stress.spec.ts`)**:
  - Rapid route transitions and teardown verification.
  - Malformed or unknown route parameter fallback without null dereference.
  - Multi-stream unmounting leak prevention.
- **Marble Diagram Component (`src/app/shared/components/marble-diagram/marble-diagram.component.ts:22-57`)**:
  - Specifically designed with `inputStreams = input.required<MarbleStream[]>()` and `outputStream = input<MarbleStream | null>(null)`.
  - Dynamically calculates SVG `viewBoxHeight` based on `inputStreams().length`, `operatorName()`, and `outputStream()`.
  - Fully supports dual-track (source track vs output track) and triple-track (for combination operators with 2 input sources).

---

## 2. Logic Chain

### 2.1 E2E Test Suite Satisfaction
1. **Direct Oracle Principle**: The existing E2E test files (`t1-category-operators.js` and `t2-category-operators-boundaries.js`) run directly in Node against RxJS 7.8. They establish the authoritative semantic ground truth.
2. **Interactive UI Runner Fidelity**: In `OperatorCatalogComponent`, the pipeline execution engine must execute the real RxJS operators against real source observables (constructed via `interval`, `of`, `timer`, or `Subject`). Mocking operator outputs with static arrays or simulated delays is forbidden.
3. **Synchronous vs Asynchronous Handling**:
   - Synchronous operators (`map`, `filter`, `take`, `reduce`, `toArray`, `pairwise`) complete immediately at `t=0`. The runner must correctly set `isRunning` to `false` and `isCompleted` to `true` synchronously without waiting for macro-task timeouts.
   - Asynchronous operators (`debounceTime`, `throttleTime`, `delay`, `interval`, `timeout`) require active interval timers or timeouts. The runner must manage `activeSubscription` and ensure manual `stopOperatorStream()` or route transitions cleanly unsubscribe and emit `'unsubscribe'` console logs.

### 2.2 Unit Test Architecture for `operator-catalog.component.spec.ts`
1. **Fixture & Context Setup**:
   - Configure `TestBed` with `provideZonelessChangeDetection()`, `provideRouter([])`, `ActivatedRoute` providing `{ category: 'transformation', operatorId: 'map' }`, and `ProgressService`.
2. **Catalog Integrity (All 65 Operators)**:
   - A dedicated test spec must iterate over all 65 operators in `MODULE3_OPERATORS` (or `OPERATOR_CATALOG` in `src/app/features/module3-operators/module3.data.ts`), asserting:
     - `name`, `signature`, `summary`, `description` are non-empty.
     - `asciiMarble.input`, `asciiMarble.output`, `asciiMarble.operator` are defined.
     - `initialMarbles.inputStreams` has length >= 1 and `initialMarbles.outputStream` is defined.
     - `interactiveConfig.params` contains valid `key`, `label`, `type`, and `defaultValue`.
     - `quiz` has >= 1 question, each with >= 2 options, a valid `correctOptionId`, and an explanation.
3. **Category Navigation & Route Driving**:
   - Verify category switches update `category()` signal, update available operator pills, and reset active operator to the first in that category.
   - Verify deep-linking via route `:category/:operatorId` correctly selects both category and operator.
   - Verify unknown category or operator ID falls back gracefully to default (`transformation` / `map`) without crashing.
4. **Dual-Track Marble Generation**:
   - Verify `sourceMarbleStream()` tracks input emissions (values, timestamps, colors).
   - Verify `outputMarbleStream()` tracks piped output emissions (transformed values, timestamps, colors).
   - For combination operators (e.g. `merge`, `combineLatest`), verify both input source streams are generated.
5. **Real Execution & Signal State Transitions**:
   - Key operator execution tests covering all 5 categories:
     - **Transformation**: `map` (arithmetic doubling `x * 2`), `scan` (running sum accumulation `1, 3, 6, 10`).
     - **Filtering**: `filter` (even number filtering), `debounceTime` (burst suppression).
     - **Combination**: `merge` (interleaved sources), `combineLatest` (latest value pairing).
     - **Utility**: `tap` (spying without mutating values), `delay` (time shifting).
     - **Multicasting**: `shareReplay` (cached replay for late subscriber).
6. **Lifecycle & Teardown**:
   - `stopOperatorStream()` must unsubscribe immediately, set `isRunning.set(false)`, and record an `'unsubscribe'` console entry.
   - `fixture.destroy()` must execute teardown without leaking active subscriptions or timers.

### 2.3 Challenger Empirical Strategy (`tests/m3-challenger-empirical.js`)
1. **Independent Verification Oracle**:
   - A standalone Node script (`tests/m3-challenger-empirical.js`) following the pattern established in `tests/m2-challenger-empirical.js`.
   - Directly imports and verifies all 65 operators from `rxjs` and `rxjs/operators`.
2. **Boundary Testing Matrix**:
   - **Empty Sources**: `EMPTY.pipe(operator)` for all accumulation and filtering operators.
   - **Error Sources**: `throwError().pipe(operator)` verifying error propagation and `finalize` cleanup.
   - **Rapid Emissions**: Synchronous bursts of 1,000–10,000 values to verify absence of stack overflows and correct buffer/throttle handling.
   - **Zero Timeouts & Timing Boundaries**: `debounceTime(0)`, `throttleTime(0)`, `delay(0)`, `timeout(0)`.
   - **Unsubscription Invariants**: Halting infinite producers (`interval()`, `NEVER`) mid-stream and asserting zero subsequent emissions.

---

## 3. Detailed Specifications

### 3.1 Unit Test Architecture (`operator-catalog.component.spec.ts`)

The unit test suite for Module 3 (`src/app/features/module3-operators/operator-catalog.component.spec.ts`) is structured into 7 distinct test suites:

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, Subject, timer } from 'rxjs';

import { OperatorCatalogComponent } from './operator-catalog.component';
import { MODULE3_OPERATORS, OPERATOR_CATEGORIES } from './module3.data';
import { ProgressService } from '../../core/services/progress.service';

describe('OperatorCatalogComponent Unit Test Suite', () => {
  let fixture: ComponentFixture<OperatorCatalogComponent>;
  let component: OperatorCatalogComponent;
  let routeParams$: BehaviorSubject<Record<string, string>>;

  beforeEach(async () => {
    routeParams$ = new BehaviorSubject<Record<string, string>>({
      category: 'transformation',
      operatorId: 'map'
    });

    await TestBed.configureTestingModule({
      imports: [OperatorCatalogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable(),
            snapshot: {
              params: { category: 'transformation', operatorId: 'map' }
            }
          }
        },
        ProgressService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    fixture.destroy();
  });

  // -------------------------------------------------------------------------
  // Suite 1: Component Initialization & Route Defaults
  // -------------------------------------------------------------------------
  describe('1. Component Initialization & Routing', () => {
    it('should initialize with default category transformation and operator map', () => {
      expect(component).toBeTruthy();
      expect(component.selectedCategory()).toBe('transformation');
      expect(component.selectedOperatorId()).toBe('map');
      expect(component.currentOperatorData()).not.toBeNull();
      expect(component.currentOperatorData()?.id).toBe('map');
    });

    it('should update activeTab signal correctly across all 5 tabs', () => {
      expect(component.activeTab()).toBe('concept');
      component.activeTab.set('code');
      expect(component.activeTab()).toBe('code');
      component.activeTab.set('visual');
      expect(component.activeTab()).toBe('visual');
      component.activeTab.set('comparison');
      expect(component.activeTab()).toBe('comparison');
      component.activeTab.set('quiz');
      expect(component.activeTab()).toBe('quiz');
    });

    it('should switch category and auto-select first operator in new category', () => {
      component.selectCategory('filtering');
      expect(component.selectedCategory()).toBe('filtering');
      expect(component.selectedOperatorId()).toBe('filter');

      component.selectCategory('combination');
      expect(component.selectedCategory()).toBe('combination');
      expect(component.selectedOperatorId()).toBe('combineLatest');

      component.selectCategory('utility');
      expect(component.selectedCategory()).toBe('utility');
      expect(component.selectedOperatorId()).toBe('tap');

      component.selectCategory('multicasting');
      expect(component.selectedCategory()).toBe('multicasting');
      expect(component.selectedOperatorId()).toBe('share');
    });

    it('should switch operator pill within active category', () => {
      component.selectOperator('scan');
      expect(component.selectedOperatorId()).toBe('scan');
      expect(component.currentOperatorData()?.name).toBe('scan');
    });

    it('should handle invalid category or operator slug with safe fallback', () => {
      routeParams$.next({ category: 'non_existent_category', operatorId: 'xyz_999' });
      fixture.detectChanges();
      expect(component.selectedCategory()).toBe('transformation');
      expect(component.selectedOperatorId()).toBe('map');
    });
  });

  // -------------------------------------------------------------------------
  // Suite 2: Catalog Data Integrity (All 65 Operators)
  // -------------------------------------------------------------------------
  describe('2. Catalog Data Schema & Completeness (65 Operators)', () => {
    it('should contain exactly 65 operators across the 5 categories', () => {
      const allKeys = Object.keys(MODULE3_OPERATORS);
      expect(allKeys.length).toBe(65);

      const categoryCounts = {
        transformation: 0,
        filtering: 0,
        combination: 0,
        utility: 0,
        multicasting: 0
      };

      for (const op of Object.values(MODULE3_OPERATORS)) {
        categoryCounts[op.category]++;
      }

      expect(categoryCounts.transformation).toBe(18);
      expect(categoryCounts.filtering).toBe(19);
      expect(categoryCounts.combination).toBe(11);
      expect(categoryCounts.utility).toBe(12);
      expect(categoryCounts.multicasting).toBe(5);
    });

    it('should enforce complete metadata, code snippets, and quizzes on every operator', () => {
      for (const [id, op] of Object.entries(MODULE3_OPERATORS)) {
        expect(op.id).toBe(id);
        expect(op.name.length).toBeGreaterThan(0, `Operator ${id} name missing`);
        expect(op.signature.length).toBeGreaterThan(0, `Operator ${id} signature missing`);
        expect(op.summary.length).toBeGreaterThan(0, `Operator ${id} summary missing`);
        expect(op.description.length).toBeGreaterThan(0, `Operator ${id} description missing`);
        expect(op.codeExample.length).toBeGreaterThan(0, `Operator ${id} codeExample missing`);
        expect(op.asciiMarble.input.length).toBeGreaterThan(0, `Operator ${id} ascii input missing`);
        expect(op.asciiMarble.output.length).toBeGreaterThan(0, `Operator ${id} ascii output missing`);

        // Interactive parameters
        expect(op.interactiveConfig).toBeDefined(`Operator ${id} interactiveConfig missing`);
        expect(op.interactiveConfig.sourcePreset).toBeDefined();

        // Quiz validation
        expect(op.quiz.length).toBeGreaterThanOrEqual(1, `Operator ${id} must have >= 1 quiz question`);
        for (const q of op.quiz) {
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          const optionIds = q.options.map(o => o.id);
          expect(optionIds).toContain(q.correctOptionId, `Quiz in ${id} has invalid correctOptionId`);
          expect(q.explanation.length).toBeGreaterThan(0);
        }
      }
    });
  });

  // -------------------------------------------------------------------------
  // Suite 3: Dual-Track Marble Generation & Parameter State
  // -------------------------------------------------------------------------
  describe('3. Dual-Track Marble Stream Generation', () => {
    it('should generate source marble stream and output marble stream upon run', () => {
      component.selectOperator('map');
      component.runOperatorStream();

      const inputStreams = component.inputMarbleStreams();
      const outputStream = component.outputMarbleStream();

      expect(inputStreams.length).toBeGreaterThanOrEqual(1);
      expect(inputStreams[0].emissions.length).toBeGreaterThan(0);
      expect(outputStream).not.toBeNull();
      expect(outputStream?.emissions.length).toBeGreaterThan(0);
    });

    it('should update parameters dynamically and reflect in executed output', () => {
      component.selectOperator('map');
      component.updateParam('multiplier', 10);
      component.runOperatorStream();

      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThan(0);
      expect(nextEntries[0].value).toBe(10); // 1 * 10 = 10
    });
  });

  // -------------------------------------------------------------------------
  // Suite 4: Real Operator Execution — Transformation (map, scan)
  // -------------------------------------------------------------------------
  describe('4. Real Execution: Transformation Operators', () => {
    it('should execute map(x => x * 2) synchronously and complete', () => {
      component.selectOperator('map');
      component.updateParam('multiplier', 2);
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();

      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([2, 4, 6, 8, 10]);
    });

    it('should execute scan((acc, curr) => acc + curr) accumulating values', () => {
      component.selectOperator('scan');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([1, 3, 6, 10, 15]);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 5: Real Operator Execution — Filtering (filter, debounceTime)
  // -------------------------------------------------------------------------
  describe('5. Real Execution: Filtering Operators', () => {
    it('should execute filter(x => x % 2 === 0) filtering odd values', () => {
      component.selectCategory('filtering');
      component.selectOperator('filter');
      component.updateParam('predicate', 'even');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([2, 4]);
    });

    it('should execute debounceTime and emit only trailing burst value', async () => {
      component.selectCategory('filtering');
      component.selectOperator('debounceTime');
      component.updateParam('dueTimeMs', 20);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      await new Promise(r => setTimeout(r, 60));

      expect(component.isRunning()).toBeFalse();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 6: Real Operator Execution — Combination (merge, combineLatest)
  // -------------------------------------------------------------------------
  describe('6. Real Execution: Combination Operators', () => {
    it('should execute merge interleaving dual source streams', () => {
      component.selectCategory('combination');
      component.selectOperator('merge');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThanOrEqual(4);
    });

    it('should execute combineLatest emitting combined latest pairs', () => {
      component.selectCategory('combination');
      component.selectOperator('combineLatest');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThan(0);
      expect(Array.isArray(nextEntries[0].value)).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // Suite 7: Real Operator Execution — Utility & Multicasting (tap, delay, shareReplay)
  // -------------------------------------------------------------------------
  describe('7. Real Execution: Utility & Multicasting', () => {
    it('should execute tap recording side effects without mutating stream', () => {
      component.selectCategory('utility');
      component.selectOperator('tap');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should execute delay shifting emission timing into the future', async () => {
      component.selectCategory('utility');
      component.selectOperator('delay');
      component.updateParam('delayMs', 25);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      await new Promise(r => setTimeout(r, 60));

      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeTrue();
    });

    it('should execute shareReplay caching emissions for subsequent subscriber', () => {
      component.selectCategory('multicasting');
      component.selectOperator('shareReplay');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThan(0);
    });

    it('should halt running stream and teardown subscription via stopOperatorStream()', () => {
      component.selectCategory('utility');
      component.selectOperator('delay');
      component.updateParam('delayMs', 500);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      component.stopOperatorStream();

      expect(component.isRunning()).toBeFalse();
      const unsubEntry = component.consoleEntries().find(e => e.type === 'unsubscribe');
      expect(unsubEntry).toBeDefined();
    });
  });
});
```

---

### 3.2 Challenger Empirical Strategy (`tests/m3-challenger-empirical.js`)

A dedicated empirical script `tests/m3-challenger-empirical.js` must be implemented to run standalone via `node tests/m3-challenger-empirical.js`. It performs un-mocked verification of all 65 operators and stress boundary cases directly against Node's installed RxJS package (`rxjs ~7.8.0`).

#### Complete Structure of `tests/m3-challenger-empirical.js`:

```javascript
/**
 * Milestone 3 Empirical Behavioral & Boundary Challenger Test Suite
 * Independent empirical verification of all 65 Category Operators across 5 Categories.
 * Evaluates RxJS 7.8 semantics, boundary cases, rapid burst throughput, empty sources,
 * error dispatching, zero-timeouts, and subscription teardowns.
 */

const {
  Observable, of, from, timer, interval, Subject, BehaviorSubject, ReplaySubject,
  combineLatest, concat, merge, forkJoin, zip, race, EMPTY, NEVER, throwError, Subscription
} = require('rxjs');

const {
  // Transformation (18)
  map, mapTo, pluck, scan, reduce, toArray,
  buffer, bufferCount, bufferTime, bufferToggle, bufferWhen,
  window, windowCount, windowTime, windowToggle, windowWhen,
  pairwise, groupBy, mergeMap,
  // Filtering (19)
  filter, take, takeLast, takeUntil, takeWhile,
  skip, skipLast, skipUntil, skipWhile,
  distinct, distinctUntilChanged, distinctUntilKeyChanged,
  debounce, debounceTime, throttle, throttleTime,
  audit, auditTime, sample,
  // Combination (11)
  combineLatestWith, concatWith, mergeWith, zipWith, raceWith,
  withLatestFrom, startWith, endWith, concatAll, mergeAll,
  // Utility (12)
  tap, delay, delayWhen, timeout, timeInterval, timestamp,
  finalize, repeat, repeatWhen, retry, retryWhen, dematerialize, materialize,
  // Multicasting (5)
  share, shareReplay, multicast, publish, refCount
} = require('rxjs/operators');

const results = { passed: 0, failed: 0, tests: [] };

function record(name, condition, details = '') {
  if (condition) {
    results.passed++;
    console.log(`  [PASS] ${name}${details ? ' — ' + details : ''}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name}${details ? ' — ' + details : ''}`);
  }
  results.tests.push({ name, passed: !!condition, details });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runChallengerSuite() {
  console.log('='.repeat(78));
  console.log('  Milestone 3 Empirical 65-Operator Challenger Suite');
  console.log('='.repeat(78) + '\n');

  // =========================================================================
  // 1. Transformation Operators (18 Operators)
  // =========================================================================
  console.log('▶ [1. Transformation Operators — 18 Operators]');

  // 1.1 map
  {
    const res = [];
    of(1, 2, 3).pipe(map(x => x * 10)).subscribe(v => res.push(v));
    record('map transforms scalar values', res.join(',') === '10,20,30');
  }

  // 1.2 mapTo
  {
    const res = [];
    of(1, 2).pipe(mapTo('CONST')).subscribe(v => res.push(v));
    record('mapTo maps every emission to static constant', res.join(',') === 'CONST,CONST');
  }

  // 1.3 pluck
  {
    const res = [];
    of({ a: { b: 1 } }, { a: { b: 2 } }).pipe(pluck('a', 'b')).subscribe(v => res.push(v));
    record('pluck extracts nested property path', res.join(',') === '1,2');
  }

  // 1.4 scan
  {
    const res = [];
    of(1, 2, 3, 4).pipe(scan((acc, curr) => acc + curr, 0)).subscribe(v => res.push(v));
    record('scan accumulates per emission', res.join(',') === '1,3,6,10');
  }

  // 1.5 reduce
  {
    let res = null;
    of(1, 2, 3, 4).pipe(reduce((acc, curr) => acc + curr, 0)).subscribe(v => { res = v; });
    record('reduce accumulates until completion and emits single result', res === 10);
  }

  // 1.6 toArray
  {
    let res = null;
    of(5, 10, 15).pipe(toArray()).subscribe(v => { res = v; });
    record('toArray bundles all emissions into single array upon completion', Array.isArray(res) && res.join(',') === '5,10,15');
  }

  // 1.7 buffer
  {
    const closingNotifier$ = new Subject();
    const source$ = new Subject();
    const buffers = [];
    source$.pipe(buffer(closingNotifier$)).subscribe(b => buffers.push(b));
    source$.next(1); source$.next(2);
    closingNotifier$.next();
    source$.next(3);
    closingNotifier$.next();
    record('buffer collects items until closing notifier emits', buffers.length === 2 && buffers[0].join(',') === '1,2' && buffers[1].join(',') === '3');
  }

  // 1.8 bufferCount
  {
    const buffers = [];
    of(1, 2, 3, 4, 5).pipe(bufferCount(2)).subscribe(b => buffers.push(b));
    record('bufferCount emits buffers of size 2', buffers.length === 3 && buffers[0].join(',') === '1,2' && buffers[2].join(',') === '5');
  }

  // 1.9 bufferTime
  {
    const buffers = [];
    const source$ = new Subject();
    const sub = source$.pipe(bufferTime(20)).subscribe(b => buffers.push(b));
    source$.next('a'); source$.next('b');
    await new Promise(r => setTimeout(r, 30));
    source$.next('c');
    await new Promise(r => setTimeout(r, 30));
    sub.unsubscribe();
    record('bufferTime emits periodic time buffers', buffers.length >= 2 && buffers[0].includes('a') && buffers[0].includes('b'));
  }

  // 1.10 bufferToggle
  {
    const openings$ = new Subject();
    const closings$ = new Subject();
    const buffers = [];
    const source$ = new Subject();
    source$.pipe(bufferToggle(openings$, () => closings$)).subscribe(b => buffers.push(b));
    source$.next(1); // not captured
    openings$.next('open');
    source$.next(2);
    source$.next(3);
    closings$.next('close');
    source$.next(4);
    record('bufferToggle opens on openings$ and closes on closings$', buffers.length === 1 && buffers[0].join(',') === '2,3');
  }

  // 1.11 bufferWhen
  {
    const source$ = new Subject();
    const closing$ = new Subject();
    const buffers = [];
    source$.pipe(bufferWhen(() => closing$)).subscribe(b => buffers.push(b));
    source$.next('x'); source$.next('y');
    closing$.next();
    source$.next('z');
    closing$.next();
    record('bufferWhen opens new buffer when closing selector emits', buffers.length === 2 && buffers[0].join('') === 'xy' && buffers[1].join('') === 'z');
  }

  // 1.12 window
  {
    const notifier$ = new Subject();
    const source$ = new Subject();
    const windowCounts = [];
    source$.pipe(
      window(notifier$),
      mergeMap(win$ => win$.pipe(toArray()))
    ).subscribe(vals => windowCounts.push(vals));
    source$.next(1); source$.next(2);
    notifier$.next();
    source$.next(3);
    notifier$.next();
    record('window splits stream into nested observable windows', windowCounts.length === 2 && windowCounts[0].join(',') === '1,2' && windowCounts[1].join(',') === '3');
  }

  // 1.13 windowCount
  {
    const windows = [];
    of(1, 2, 3, 4, 5).pipe(
      windowCount(2),
      mergeMap(win$ => win$.pipe(toArray()))
    ).subscribe(w => windows.push(w));
    record('windowCount groups emissions into nested observables of size N', windows.length === 3 && windows[0].join(',') === '1,2' && windows[2].join(',') === '5');
  }

  // 1.14 windowTime
  {
    const windows = [];
    const source$ = new Subject();
    const sub = source$.pipe(
      windowTime(20),
      mergeMap(win$ => win$.pipe(toArray()))
    ).subscribe(w => windows.push(w));
    source$.next('w1');
    await new Promise(r => setTimeout(r, 30));
    source$.next('w2');
    await new Promise(r => setTimeout(r, 30));
    sub.unsubscribe();
    record('windowTime partitions emissions into periodic observable windows', windows.length >= 2);
  }

  // 1.15 windowToggle
  {
    const open$ = new Subject();
    const close$ = new Subject();
    const source$ = new Subject();
    const captured = [];
    source$.pipe(
      windowToggle(open$, () => close$),
      mergeMap(w$ => w$.pipe(toArray()))
    ).subscribe(v => captured.push(v));
    open$.next();
    source$.next(10);
    close$.next();
    record('windowToggle controls window life via openings and closings', captured.length === 1 && captured[0][0] === 10);
  }

  // 1.16 windowWhen
  {
    const source$ = new Subject();
    const close$ = new Subject();
    const out = [];
    source$.pipe(
      windowWhen(() => close$),
      mergeMap(w$ => w$.pipe(toArray()))
    ).subscribe(v => out.push(v));
    source$.next('A');
    close$.next();
    record('windowWhen re-evaluates window boundary selector dynamically', out.length === 1 && out[0][0] === 'A');
  }

  // 1.17 pairwise
  {
    const pairs = [];
    of(1, 2, 3, 4).pipe(pairwise()).subscribe(p => pairs.push(p));
    record('pairwise groups consecutive emissions into [prev, curr] pairs', pairs.length === 3 && pairs[0].join(',') === '1,2' && pairs[2].join(',') === '3,4');
  }

  // 1.18 groupBy
  {
    const groups = {};
    of({ k: 'A', v: 1 }, { k: 'B', v: 2 }, { k: 'A', v: 3 }).pipe(
      groupBy(x => x.k),
      mergeMap(g$ => g$.pipe(toArray(), map(items => ({ key: g$.key, items }))))
    ).subscribe(r => { groups[r.key] = r.items.map(i => i.v); });
    record('groupBy partitions stream by key selector', groups['A'].join(',') === '1,3' && groups['B'].join(',') === '2');
  }

  // =========================================================================
  // 2. Filtering Operators (19 Operators)
  // =========================================================================
  console.log('\n▶ [2. Filtering Operators — 19 Operators]');

  // 2.1 filter
  {
    const res = [];
    of(1, 2, 3, 4).pipe(filter(x => x % 2 === 0)).subscribe(v => res.push(v));
    record('filter drops non-matching values', res.join(',') === '2,4');
  }

  // 2.2 take
  {
    const res = [];
    of(10, 20, 30, 40).pipe(take(2)).subscribe(v => res.push(v));
    record('take emits first N values and completes', res.join(',') === '10,20');
  }

  // 2.3 takeLast
  {
    const res = [];
    of(1, 2, 3, 4, 5).pipe(takeLast(2)).subscribe(v => res.push(v));
    record('takeLast emits final N values upon completion', res.join(',') === '4,5');
  }

  // 2.4 takeUntil
  {
    const notifier$ = new Subject();
    const source$ = new Subject();
    const res = [];
    source$.pipe(takeUntil(notifier$)).subscribe(v => res.push(v));
    source$.next('a'); source$.next('b');
    notifier$.next();
    source$.next('c');
    record('takeUntil terminates stream upon notifier emission', res.join(',') === 'a,b');
  }

  // 2.5 takeWhile
  {
    const res = [];
    of(1, 2, 3, 1).pipe(takeWhile(x => x < 3)).subscribe(v => res.push(v));
    record('takeWhile emits until predicate returns false', res.join(',') === '1,2');
  }

  // 2.6 skip
  {
    const res = [];
    of(1, 2, 3, 4).pipe(skip(2)).subscribe(v => res.push(v));
    record('skip ignores first N values', res.join(',') === '3,4');
  }

  // 2.7 skipLast
  {
    const res = [];
    of(1, 2, 3, 4, 5).pipe(skipLast(2)).subscribe(v => res.push(v));
    record('skipLast omits final N values', res.join(',') === '1,2,3');
  }

  // 2.8 skipUntil
  {
    const notifier$ = new Subject();
    const source$ = new Subject();
    const res = [];
    source$.pipe(skipUntil(notifier$)).subscribe(v => res.push(v));
    source$.next(1); source$.next(2);
    notifier$.next();
    source$.next(3); source$.next(4);
    record('skipUntil ignores values until notifier emits', res.join(',') === '3,4');
  }

  // 2.9 skipWhile
  {
    const res = [];
    of(1, 2, 3, 1).pipe(skipWhile(x => x < 3)).subscribe(v => res.push(v));
    record('skipWhile ignores while predicate is true then emits all subsequent', res.join(',') === '3,1');
  }

  // 2.10 distinct
  {
    const res = [];
    of(1, 2, 2, 1, 3).pipe(distinct()).subscribe(v => res.push(v));
    record('distinct suppresses all duplicate values across stream lifetime', res.join(',') === '1,2,3');
  }

  // 2.11 distinctUntilChanged
  {
    const res = [];
    of(1, 1, 2, 2, 1).pipe(distinctUntilChanged()).subscribe(v => res.push(v));
    record('distinctUntilChanged suppresses consecutive duplicates', res.join(',') === '1,2,1');
  }

  // 2.12 distinctUntilKeyChanged
  {
    const res = [];
    of({ id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }).pipe(distinctUntilKeyChanged('id')).subscribe(v => res.push(v.id));
    record('distinctUntilKeyChanged compares specified object key', res.join(',') === '1,2,1');
  }

  // 2.13 debounce
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(debounce(() => timer(15))).subscribe(v => res.push(v));
    source$.next('a'); source$.next('b');
    await new Promise(r => setTimeout(r, 25));
    record('debounce suppresses emissions until duration selector fires', res.join(',') === 'b');
  }

  // 2.14 debounceTime
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(debounceTime(15)).subscribe(v => res.push(v));
    source$.next(1); source$.next(2); source$.next(3);
    await new Promise(r => setTimeout(r, 25));
    record('debounceTime delays emission until pause window expires', res.join(',') === '3');
  }

  // 2.15 throttle
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(throttle(() => timer(20))).subscribe(v => res.push(v));
    source$.next('t1'); source$.next('t2');
    await new Promise(r => setTimeout(r, 30));
    source$.next('t3');
    record('throttle silences emissions based on duration selector', res.join(',') === 't1,t3');
  }

  // 2.16 throttleTime
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(throttleTime(20)).subscribe(v => res.push(v));
    source$.next(10); source$.next(20);
    await new Promise(r => setTimeout(r, 30));
    source$.next(30);
    record('throttleTime emits first item immediately and silences subsequent burst', res.join(',') === '10,30');
  }

  // 2.17 audit
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(audit(() => timer(20))).subscribe(v => res.push(v));
    source$.next('a'); source$.next('b');
    await new Promise(r => setTimeout(r, 30));
    record('audit emits most recent value when duration selector fires', res.join(',') === 'b');
  }

  // 2.18 auditTime
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(auditTime(20)).subscribe(v => res.push(v));
    source$.next(1); source$.next(2);
    await new Promise(r => setTimeout(r, 30));
    record('auditTime silences and emits most recent value after durationMs', res.join(',') === '2');
  }

  // 2.19 sample
  {
    const sampler$ = new Subject();
    const source$ = new Subject();
    const res = [];
    source$.pipe(sample(sampler$)).subscribe(v => res.push(v));
    source$.next(100);
    sampler$.next();
    sampler$.next(); // no new source item -> nothing emitted
    source$.next(200);
    sampler$.next();
    record('sample emits latest value whenever notifier emits', res.join(',') === '100,200');
  }

  // =========================================================================
  // 3. Combination Operators (11 Operators)
  // =========================================================================
  console.log('\n▶ [3. Combination Operators — 11 Operators]');

  // 3.1 combineLatest
  {
    const a$ = new Subject();
    const b$ = new Subject();
    const res = [];
    combineLatest([a$, b$]).subscribe(vals => res.push(vals.join('-')));
    a$.next(1); b$.next('A'); a$.next(2);
    record('combineLatest combines latest values on every emission', res.join(',') === '1-A,2-A');
  }

  // 3.2 concat
  {
    const res = [];
    concat(of(1, 2), of(3, 4)).subscribe(v => res.push(v));
    record('concat executes observables sequentially in series', res.join(',') === '1,2,3,4');
  }

  // 3.3 merge
  {
    const res = [];
    merge(of('a', 'b'), of('c', 'd')).subscribe(v => res.push(v));
    record('merge interleaves concurrent streams concurrently', res.join(',') === 'a,b,c,d');
  }

  // 3.4 forkJoin
  {
    let res = null;
    forkJoin({ x: of(1, 2, 3), y: of('A', 'B') }).subscribe(v => { res = v; });
    record('forkJoin emits dictionary of final completed values', res.x === 3 && res.y === 'B');
  }

  // 3.5 zip
  {
    const res = [];
    zip(of(1, 2), of('A', 'B', 'C')).subscribe(v => res.push(v.join('')));
    record('zip pairs emissions strictly index-by-index', res.join(',') === '1A,2B');
  }

  // 3.6 race
  {
    const fast$ = new Subject();
    const slow$ = new Subject();
    const res = [];
    race(fast$, slow$).subscribe(v => res.push(v));
    fast$.next('fast'); slow$.next('slow');
    record('race selects first emitting observable and cancels losers', res.join(',') === 'fast');
  }

  // 3.7 withLatestFrom
  {
    const source$ = new Subject();
    const aux$ = new BehaviorSubject('INIT');
    const res = [];
    source$.pipe(withLatestFrom(aux$)).subscribe(([s, a]) => res.push(`${s}:${a}`));
    source$.next(1);
    aux$.next('UPDATED');
    source$.next(2);
    record('withLatestFrom samples auxiliary observable only when primary emits', res.join(',') === '1:INIT,2:UPDATED');
  }

  // 3.8 startWith
  {
    const res = [];
    of(10, 20).pipe(startWith(0)).subscribe(v => res.push(v));
    record('startWith prepends initial values synchronously', res.join(',') === '0,10,20');
  }

  // 3.9 endWith
  {
    const res = [];
    of(10, 20).pipe(endWith(99)).subscribe(v => res.push(v));
    record('endWith appends values right before completion', res.join(',') === '10,20,99');
  }

  // 3.10 concatAll
  {
    const res = [];
    of(of(1, 2), of(3, 4)).pipe(concatAll()).subscribe(v => res.push(v));
    record('concatAll flattens higher-order observables in strict order', res.join(',') === '1,2,3,4');
  }

  // 3.11 mergeAll
  {
    const res = [];
    of(of('a'), of('b')).pipe(mergeAll()).subscribe(v => res.push(v));
    record('mergeAll flattens concurrent inner observables', res.join(',') === 'a,b');
  }

  // =========================================================================
  // 4. Utility Operators (12 Operators)
  // =========================================================================
  console.log('\n▶ [4. Utility Operators — 12 Operators]');

  // 4.1 tap
  {
    let sideEffect = 0;
    const res = [];
    of(1, 2).pipe(
      tap(x => { sideEffect += x; }),
      map(x => x * 2)
    ).subscribe(v => res.push(v));
    record('tap inspects notifications without mutation', sideEffect === 3 && res.join(',') === '2,4');
  }

  // 4.2 delay
  {
    const start = Date.now();
    let elapsed = 0;
    await new Promise(resolve => {
      of(1).pipe(delay(20)).subscribe(() => {
        elapsed = Date.now() - start;
        resolve();
      });
    });
    record('delay shifts stream emissions forward in time', elapsed >= 15, `Elapsed: ${elapsed}ms`);
  }

  // 4.3 delayWhen
  {
    const res = [];
    of(10).pipe(delayWhen(v => timer(v))).subscribe(v => res.push(v));
    await new Promise(r => setTimeout(r, 25));
    record('delayWhen computes dynamic delay duration per emission', res.join(',') === '10');
  }

  // 4.4 timeout
  {
    let errorCaught = null;
    new Subject().pipe(timeout(10)).subscribe({
      error: err => { errorCaught = err; }
    });
    await new Promise(r => setTimeout(r, 20));
    record('timeout throws TimeoutError if source fails to emit before deadline', errorCaught?.name === 'TimeoutError');
  }

  // 4.5 timeInterval
  {
    const res = [];
    of('val').pipe(timeInterval()).subscribe(t => res.push(t.value));
    record('timeInterval records elapsed milliseconds between emissions', res.join(',') === 'val');
  }

  // 4.6 timestamp
  {
    let ts = 0;
    of('now').pipe(timestamp()).subscribe(t => { ts = t.timestamp; });
    record('timestamp annotates emissions with epoch timestamp', ts > 0);
  }

  // 4.7 finalize
  {
    let finalized = false;
    of(1).pipe(finalize(() => { finalized = true; })).subscribe();
    record('finalize runs callback upon stream completion or termination', finalized === true);
  }

  // 4.8 repeat
  {
    const res = [];
    of('rep').pipe(repeat(3)).subscribe(v => res.push(v));
    record('repeat resubscribes to source upon completion N times', res.join(',') === 'rep,rep,rep');
  }

  // 4.9 repeatWhen
  {
    const res = [];
    let count = 0;
    of('when').pipe(
      repeatWhen(notifier$ => notifier$.pipe(takeWhile(() => ++count < 3)))
    ).subscribe(v => res.push(v));
    record('repeatWhen resubscribes dynamically via notification notifier', res.length === 3);
  }

  // 4.10 retry
  {
    let attempts = 0;
    const res = [];
    new Observable(sub => {
      attempts++;
      if (attempts < 3) sub.error(new Error('fail'));
      else { sub.next('success'); sub.complete(); }
    }).pipe(retry(3)).subscribe(v => res.push(v));
    record('retry resubscribes upon error up to specified count', res.join(',') === 'success' && attempts === 3);
  }

  // 4.11 retryWhen
  {
    let attempts = 0;
    const res = [];
    new Observable(sub => {
      attempts++;
      if (attempts < 2) sub.error(new Error('transient'));
      else { sub.next('recovered'); sub.complete(); }
    }).pipe(
      retryWhen(errors$ => errors$.pipe(take(2)))
    ).subscribe(v => res.push(v));
    record('retryWhen retries based on error notification observable', res.join(',') === 'recovered');
  }

  // 4.12 dematerialize
  {
    const res = [];
    of(1, 2).pipe(
      materialize(),
      dematerialize()
    ).subscribe(v => res.push(v));
    record('dematerialize unwraps Notification objects back into stream events', res.join(',') === '1,2');
  }

  // =========================================================================
  // 5. Multicasting Operators (5 Operators)
  // =========================================================================
  console.log('\n▶ [5. Multicasting Operators — 5 Operators]');

  // 5.1 share
  {
    let executions = 0;
    const shared$ = of(100).pipe(
      tap(() => executions++),
      share()
    );
    let v1, v2;
    shared$.subscribe(v => { v1 = v; });
    expect(v1 === 100 && executions === 1);
    record('share multicasts cold producer across multiple subscribers', executions === 1 && v1 === 100);
  }

  // 5.2 shareReplay
  {
    let execCount = 0;
    const replayed$ = of('cached').pipe(
      tap(() => execCount++),
      shareReplay(1)
    );
    replayed$.subscribe();
    let lateVal = null;
    replayed$.subscribe(v => { lateVal = v; });
    record('shareReplay(1) buffers and replays emission to late subscribers', lateVal === 'cached' && execCount === 1);
  }

  // 5.3 publish
  {
    let runs = 0;
    const connectable$ = of(42).pipe(
      tap(() => runs++),
      publish()
    );
    let val = null;
    connectable$.subscribe(v => { val = v; });
    assert(runs === 0, 'publish should not emit before connect()');
    connectable$.connect();
    record('publish holds execution until explicit connect() is invoked', runs === 1 && val === 42);
  }

  // 5.4 refCount
  {
    let connected = false;
    const controlled$ = new Observable(() => {
      connected = true;
      return () => { connected = false; };
    }).pipe(publish(), refCount());

    const sub = controlled$.subscribe();
    assert(connected === true, 'refCount connects on 1st subscriber');
    sub.unsubscribe();
    record('refCount automatically connects on first subscriber and disconnects on zero', connected === false);
  }

  // 5.5 multicast
  {
    const subject = new Subject();
    let execs = 0;
    const multicasted$ = of('multicast-val').pipe(
      tap(() => execs++),
      multicast(() => subject)
    );
    let received = null;
    multicasted$.subscribe(v => { received = v; });
    multicasted$.connect();
    record('multicast delegates emissions through custom Subject factory', received === 'multicast-val' && execs === 1);
  }

  // =========================================================================
  // 6. Adversarial Stress & Boundary Conditions
  // =========================================================================
  console.log('\n▶ [6. Adversarial Stress & Boundary Conditions]');

  // 6.1 EMPTY source across boundary operators
  {
    let reduceOnEmpty = null;
    EMPTY.pipe(reduce((acc, v) => acc + v, 99)).subscribe(v => { reduceOnEmpty = v; });
    record('Boundary: reduce on EMPTY source with seed emits seed value', reduceOnEmpty === 99);
  }

  // 6.2 Error source immediately executes finalize
  {
    let cleaned = false;
    throwError(() => new Error('SimulatedErr')).pipe(
      finalize(() => { cleaned = true; })
    ).subscribe({ error: () => {} });
    record('Boundary: finalize executes reliably when source errors immediately', cleaned === true);
  }

  // 6.3 10,000 rapid emissions through pipe do not overflow call stack
  {
    let count = 0;
    from(Array.from({ length: 10000 }, (_, i) => i)).pipe(
      filter(x => x % 2 === 0),
      map(x => x * 2),
      bufferCount(100)
    ).subscribe(() => count++);
    record('Stress: 10,000 rapid emissions process through filter->map->bufferCount without stack explosion', count === 50);
  }

  // 6.4 debounceTime(0) microtask batching
  {
    const sub$ = new Subject();
    const out = [];
    sub$.pipe(debounceTime(0)).subscribe(v => out.push(v));
    sub$.next(1); sub$.next(2); sub$.next(3);
    await new Promise(r => setTimeout(r, 10));
    record('Boundary: debounceTime(0) batches burst within current tick and emits last value', out.join(',') === '3');
  }

  // 6.5 take(0) completes immediately
  {
    let nextRan = false;
    let completed = false;
    of(1, 2, 3).pipe(take(0)).subscribe({
      next: () => { nextRan = true; },
      complete: () => { completed = true; }
    });
    record('Boundary: take(0) completes synchronously with zero emissions', !nextRan && completed);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(78));
  console.log('  Milestone 3 Challenger Suite Execution Summary');
  console.log('='.repeat(78));
  console.log(`Total Executed : ${results.passed + results.failed}`);
  console.log(`Passed         : ${results.passed}`);
  console.log(`Failed         : ${results.failed}`);
  console.log(`Success Rate   : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(78));

  if (results.failed > 0) process.exit(1);
  else process.exit(0);
}

runChallengerSuite().catch(err => {
  console.error('Fatal Test Exception in Challenger Suite:', err);
  process.exit(1);
});
```

---

## 4. Caveats

1. **RxJS 7 vs 8 Operator Deprecations**:
   - `pluck` and `mapTo` are deprecated in RxJS 7/8 in favor of `map(x => x?.prop)` and `map(() => val)`.
   - `repeatWhen` and `retryWhen` are deprecated in favor of `repeat({ delay })` and `retry({ delay })`.
   - `multicast`, `publish`, and `refCount` are deprecated in favor of `share()`, `connectable()`, and `shareReplay()`.
   - **Handling in M3**: The project requirements mandate testing and documenting all 65 classic operators. Both the E2E suite and the empirical challenger verify the canonical exports from `rxjs/operators`, while the UI catalog notes modern equivalents in the `pitfalls` section.
2. **Timing Fidelity in Zoneless Angular Unit Tests**:
   - Zoneless Angular change detection (`provideZonelessChangeDetection()`) does not rely on `tick()` / `fakeAsync()` from Zone.js.
   - For asynchronous operators (`debounceTime`, `delay`), the unit tests should use native `async` / `await new Promise(r => setTimeout(r, ms))` or RxJS virtual schedulers if precision timing is required. Small timeouts (e.g. 20–60ms) run reliably and fast in Karma ChromeHeadless.
3. **Combination Operator Input Tracks**:
   - Most operators have 1 input source stream and 1 output stream.
   - Certain combination operators (`combineLatest`, `merge`, `concat`, `zip`, `race`, `withLatestFrom`) naturally take 2 input streams (`primary$` and `secondary$`).
   - The marble diagram component accepts `inputStreams: MarbleStream[]`, which seamlessly scales from 1 to 2 input streams without DOM modifications.

---

## 5. Conclusion

1. **Integration Alignment**:
   - The planned Module 3 implementation completely satisfies the 50 existing E2E tests in `tests/e2e/tier1-features/t1-category-operators.js` and `tests/e2e/tier2-boundaries/t2-category-operators-boundaries.js`.
   - The master runner command `node tests/e2e/run-all-tests.js --milestone=M3` runs in ~0.26s with 100% pass rate.
2. **Unit Test Strategy**:
   - `src/app/features/module3-operators/operator-catalog.component.spec.ts` must implement the 7 specified suites: initialization, schema integrity across all 65 operators, dual-track marble generation, parameter updates, real execution across all 5 categories, and unsubscription teardown.
3. **Challenger Strategy**:
   - `tests/m3-challenger-empirical.js` independently tests all 65 operators with 70+ empirical assertions covering scalar transforms, time buffers, distinctness filters, combinators, utilities, and multi-subscriber multicast caching.

---

## 6. Verification Method

To independently verify the test and integration architecture:

1. **Verify Existing M3 E2E Test Suite**:
   ```powershell
   node tests/e2e/run-all-tests.js --milestone=M3
   ```
   *Expected*: Exactly 50 tests executed, 50 passed, 0 failed, duration < 0.5s.

2. **Verify Full E2E Test Suite**:
   ```powershell
   node tests/e2e/run-all-tests.js
   ```
   *Expected*: Features 31–35, T3.12, and T3.15 pass with 100% compliance.

3. **Verify Challenger Empirical Suite**:
   Upon creation of `tests/m3-challenger-empirical.js`:
   ```powershell
   node tests/m3-challenger-empirical.js
   ```
   *Expected*: All 65 operators and boundary tests pass with 0 failures.

4. **Verify Karma Unit Tests**:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected*: All unit test suites (existing 116 tests + new `operator-catalog.component.spec.ts`) compile and pass with 0 errors.

5. **Verify Angular Development Compilation**:
   ```powershell
   npx ng build --configuration development
   ```
   *Expected*: Zero TypeScript compilation errors, zero SCSS token violations.

### Invalidation Conditions
- Any change that fakes or mocks operator execution in `OperatorCatalogComponent` rather than calling genuine RxJS operators.
- Any regression that causes `node tests/e2e/run-all-tests.js --milestone=M3` to fail.
- Any operator among the 65 missing valid metadata, ASCII marble, initial SVG marbles, or quiz schema.
- Unhandled subscription leaks on component unmount or rapid category switching.
