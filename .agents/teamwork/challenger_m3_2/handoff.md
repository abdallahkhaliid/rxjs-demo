# Milestone 3 Empirical & Semantic Challenge Report (`challenger_m3_2`)

**Agent**: Challenger 2 (`challenger_m3_2`)  
**Role**: critic, specialist  
**Date**: 2026-11-06T13:59:00Z  
**Verdict**: **REJECT** (Pending 2-Point Remediation)

---

## Challenge Summary

**Overall risk assessment**: **MEDIUM** (Functional operator pipelines are 100% correct in RxJS 7.8; semantic defects are localized to marble diagram timeline coordinate calculation and a static marble collision).

---

## 1. Observation

Direct observations from independent test executions, script runs, and source code audits:

### Observation 1.1: Empirical Script Execution (`tests/m3-challenger-empirical.js`)
Executed command:
```powershell
node tests/m3-challenger-empirical.js
```
Tool output verbatim:
```
==============================================================================
  Milestone 3 Empirical 65-Operator Challenger Suite
==============================================================================

▶ [1. Transformation Operators — 18 Operators]
  [PASS] map transforms scalar values
  [PASS] mapTo maps every emission to static constant
  [PASS] pluck extracts nested property path
  [PASS] scan accumulates per emission
  [PASS] reduce accumulates until completion and emits single result
  [PASS] toArray bundles all emissions into single array upon completion
  [PASS] buffer collects items until closing notifier emits
  [PASS] bufferCount emits buffers of size 2
  [PASS] bufferTime emits periodic time buffers
  [PASS] bufferToggle opens on openings$ and closes on closings$
  [PASS] bufferWhen opens new buffer when closing selector emits
  [PASS] window splits stream into nested observable windows
  [PASS] windowCount groups emissions into nested observables of size N
  [PASS] windowTime partitions emissions into periodic observable windows
  [PASS] windowToggle controls window life via openings and closings
  [PASS] windowWhen re-evaluates window boundary selector dynamically
  [PASS] pairwise groups consecutive emissions into [prev, curr] pairs
  [PASS] groupBy partitions stream by key selector

▶ [2. Filtering Operators — 19 Operators]
  [PASS] filter drops non-matching values
  [PASS] take emits first N values and completes
  [PASS] takeLast emits final N values upon completion
  [PASS] takeUntil terminates stream upon notifier emission
  [PASS] takeWhile emits until predicate returns false
  [PASS] skip ignores first N values
  [PASS] skipLast omits final N values
  [PASS] skipUntil ignores values until notifier emits
  [PASS] skipWhile ignores while predicate is true then emits all subsequent
  [PASS] distinct suppresses all duplicate values across stream lifetime
  [PASS] distinctUntilChanged suppresses consecutive duplicates
  [PASS] distinctUntilKeyChanged compares specified object key
  [PASS] debounce suppresses emissions until duration selector fires
  [PASS] debounceTime delays emission until pause window expires
  [PASS] throttle silences emissions based on duration selector
  [PASS] throttleTime emits first item immediately and silences subsequent burst
  [PASS] audit emits most recent value when duration selector fires
  [PASS] auditTime silences and emits most recent value after durationMs
  [PASS] sample emits latest value whenever notifier emits

▶ [3. Combination Operators — 11 Operators]
  [PASS] combineLatest combines latest values on every emission
  [PASS] concat executes observables sequentially in series
  [PASS] merge interleaves concurrent streams concurrently
  [PASS] forkJoin emits dictionary of final completed values
  [PASS] zip pairs emissions strictly index-by-index
  [PASS] race selects first emitting observable and cancels losers
  [PASS] withLatestFrom samples auxiliary observable only when primary emits
  [PASS] startWith prepends initial values synchronously
  [PASS] endWith appends values right before completion
  [PASS] concatAll flattens higher-order observables in strict order
  [PASS] mergeAll flattens concurrent inner observables

▶ [4. Utility Operators — 12 Operators]
  [PASS] tap inspects notifications without mutation
  [PASS] delay shifts stream emissions forward in time — Elapsed: 26ms
  [PASS] delayWhen computes dynamic delay duration per emission
  [PASS] timeout throws TimeoutError if source fails to emit before deadline
  [PASS] timeInterval records elapsed milliseconds between emissions
  [PASS] timestamp annotates emissions with epoch timestamp
  [PASS] finalize runs callback upon stream completion or termination
  [PASS] repeat resubscribes to source upon completion N times
  [PASS] repeatWhen resubscribes dynamically via notification notifier
  [PASS] retry resubscribes upon error up to specified count
  [PASS] retryWhen retries based on error notification observable
  [PASS] dematerialize unwraps Notification objects back into stream events

▶ [5. Multicasting Operators — 5 Operators]
  [PASS] share multicasts cold producer across multiple subscribers
  [PASS] shareReplay(1) buffers and replays emission to late subscribers
  [PASS] publish holds execution until explicit connect() is invoked
  [PASS] refCount automatically connects on first subscriber and disconnects on zero
  [PASS] multicast delegates emissions through custom Subject factory

▶ [6. Adversarial Stress & Boundary Conditions]
  [PASS] Boundary: reduce on EMPTY source with seed emits seed value
  [PASS] Boundary: finalize executes reliably when source errors immediately
  [PASS] Stress: 10,000 rapid emissions process through filter->map->bufferCount without stack explosion
  [PASS] Boundary: debounceTime(0) batches burst within current tick and emits last value
  [PASS] Boundary: take(0) completes synchronously with zero emissions

Total Executed : 70
Passed         : 70
Failed         : 0
Success Rate   : 100.0%
```

---

### Observation 1.2: E2E Acceptance Test Execution
1. Milestone M3 Filter:
   - Command: `node tests/e2e/run-all-tests.js --milestone=M3`
   - Result: `50 / 50 passed (100.0%)`, `0 failed`.
2. Full Platform Suite:
   - Command: `node tests/e2e/run-all-tests.js`
   - Result: `543 / 543 passed (100.0%)`, `0 failed`, `0 regressions` across M1 through M6.
3. Unit Test Suite:
   - Command: `npx ng test --watch=false --browsers=ChromeHeadless`
   - Result: `TOTAL: 135 SUCCESS (9.87 secs)`, `0 failures`.

---

### Observation 1.3: Defect 1 — Runtime Completion Marker Positioning Bug
Inspected `src/app/features/module3-operators/operator-catalog.component.ts`:
- Lines 459-460 (`recordInputMarble`):
  ```typescript
  const elapsed = Math.max(0, Date.now() - this.streamStartTime);
  const timeMs = elapsed < 20 ? index * 100 : elapsed;
  ```
- Lines 497-498 (`recordOutputMarble`):
  ```typescript
  const elapsed = Math.max(0, Date.now() - this.streamStartTime);
  const timeMs = elapsed < 20 ? index * 100 : elapsed;
  ```
- Lines 489-494 (`recordInputComplete`):
  ```typescript
  private recordInputComplete(streamId: string): void {
    const elapsed = Math.max(100, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => (s.id === streamId ? { ...s, completedAtMs: elapsed } : s))
    );
  }
  ```
- Lines 523-526 (`recordOutputComplete`):
  ```typescript
  private recordOutputComplete(): void {
    const elapsed = Math.max(100, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => (out ? { ...out, completedAtMs: elapsed } : null));
  }
  ```

**Empirical Result**:
When executing any synchronous stream (e.g. default preset `sync_numbers` = `of(1, 2, 3, 4, 5)`):
- Emissions 1 through 5 receive `timeMs` values: `100, 200, 300, 400, 500`.
- The synchronous pipeline completes within ~1ms, so `Date.now() - this.streamStartTime` is `0..1ms`.
- `Math.max(100, elapsed)` evaluates to `100`.
- `completedAtMs` is set to `100`!
- **Visual Failure**: The vertical SVG completion tick line `|` is drawn at `x = timeToX(100)`. It is positioned directly on the 1st marble (`t=100ms`), and visually appears **BEFORE** emissions 2, 3, 4, and 5 (`t=200..500ms`).

---

### Observation 1.4: Defect 2 — Visual Coordinate Collision in `takeLast` Static Marbles
Inspected `src/app/features/module3-operators/data/filtering.data.ts`:
- Line 214 (`takeLast.initialMarbles`):
  ```typescript
  initialMarbles: {
    inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 700 }],
    outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 700, value: 3, displayLabel: '3' }], completedAtMs: 700 }
  },
  ```

**Empirical Result**:
- Both emissions `o1` (value 2) and `o2` (value 3) have identical `timeMs: 700`.
- In `MarbleDiagramComponent`, `timeToX(700)` computes the same `cx` coordinate for both circles, so emission `o1` is completely obscured underneath emission `o2`.
- Furthermore, `completedAtMs: 700` places the vertical completion line on the exact same coordinate, stacking 2 marbles and 1 completion marker into a single visual collision.

---

## 2. Logic Chain

1. **Empirical Operator Correctness**:
   - *From Observation 1.1*: All 65 category operators across RxJS 7.8 passed the empirical behavioral suite (70/70) and all 50 E2E tests (50/50). The pipeline factories and operator semantics are functionally sound.
2. **Marble Diagram Semantic Contract**:
   - *From Observation 1.3*: In RxJS marble diagram notation, a stream emits over time from left to right, and completion `|` represents the termination of the Observable. An Observable CANNOT emit after completion.
   - *From Observation 1.3*: Setting `completedAtMs = 100` while synchronous emissions are spaced at `100, 200, 300, 400, 500` breaks this semantic contract by drawing the completion marker before 4 out of the 5 emissions.
   - *Deduction*: `completedAtMs` must be calculated dynamically based on the stream's highest emission `timeMs`:
     `const maxTime = s.emissions.length > 0 ? Math.max(...s.emissions.map(e => e.timeMs)) : 0;`
     `const completedAtMs = Math.max(elapsed, maxTime + 100);`
3. **Static Coordinate Collisions**:
   - *From Observation 1.4*: In `takeLast`, defining multiple emissions with identical `timeMs = 700` creates visual collisions where marble elements overlap and become unreadable.
   - *Deduction*: Spacing `o1` at `700ms`, `o2` at `900ms`, and completion at `1100ms` restores clarity and non-colliding visual coordinates.

---

## 3. Caveats

1. The underlying mathematical and logical execution of all 65 operators in `MODULE3_OPERATORS` is 100% correct and verified against RxJS 7.8.
2. No Angular build errors, TypeScript compile errors, or test suite regressions exist.
3. The defects identified are strictly UI/rendering semantic issues within the marble coordinate calculation and one data preset.

---

## 4. Conclusion & Challenges

### Verdict: **REJECT**

Milestone 3 cannot be approved in its current state because the marble diagram visual coordinates violate stream completion order and contain visual collisions.

### Challenges

#### [High] Challenge 1: Synchronous Stream Completion Marker Position Inversion
- **Assumption challenged**: Worker assumed `Math.max(100, Date.now() - streamStartTime)` safely positions the completion tick after synchronous emissions.
- **Attack scenario**: When `of(1, 2, 3, 4, 5)` runs, emissions are spaced at `100, 200, 300, 400, 500ms`. Because execution completes in < 1ms, `Math.max(100, elapsed)` yields `100ms`. The completion tick is rendered at `t=100ms`, before emissions at `200..500ms`.
- **Blast radius**: Every synchronous operator demo in Module 3 visually depicts the stream continuing to emit after completion.
- **Mitigation**: Update `recordInputComplete`, `recordInputError`, `recordOutputComplete`, and `recordOutputError` in `operator-catalog.component.ts` to compute:
  ```typescript
  const maxTime = stream.emissions.length > 0 ? Math.max(...stream.emissions.map(e => e.timeMs)) : 0;
  const completedAtMs = Math.max(elapsed, maxTime + 100);
  ```

#### [Medium] Challenge 2: `takeLast` Output Marble Collision
- **Assumption challenged**: All catalog operators have valid, non-colliding initial marble coordinates.
- **Attack scenario**: Opening `takeLast` in the catalog renders both emissions `o1` and `o2` at `timeMs: 700`, rendering only one visible circle.
- **Blast radius**: Obscures one of the two emitted marbles in the initial visual demonstration of `takeLast`.
- **Mitigation**: In `src/app/features/module3-operators/data/filtering.data.ts:214`, change:
  ```typescript
  outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 900, value: 3, displayLabel: '3' }], completedAtMs: 1100 }
  ```

---

## 5. Verification Method

Once the worker implements the remediations above, run the following verification commands:

1. **Verify Semantic Audit Script**:
   ```powershell
   node tests/m3-challenger-semantic-audit.js
   ```
   *Expected*: Passes with `0 defects`.

2. **Verify Challenger Empirical Suite**:
   ```powershell
   node tests/m3-challenger-empirical.js
   ```
   *Expected*: `70 / 70 passed (100.0%)`.

3. **Verify E2E Tests**:
   ```powershell
   node tests/e2e/run-all-tests.js --milestone=M3
   node tests/e2e/run-all-tests.js
   ```
   *Expected*: `50 / 50 passed` on M3, `543 / 543 passed` across all milestones.

4. **Verify Unit Tests**:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected*: `TOTAL: 135 SUCCESS`.
