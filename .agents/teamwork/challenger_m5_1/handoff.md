# Milestone 5 Empirical Challenge & Stress Audit Report

**Author**: `challenger_m5_1` (Teamwork Empirical Challenger: Critic & Specialist)  
**Date**: 2026-11-07  
**Verdict**: **REJECT**

---

## 1. Observation

### 1.1 Automated Test Suite Baseline
1. Executed `node tests/e2e/run-all-tests.js --milestone M5`:
   ```
   Total Executed : 100 / 543
   Passed         : 100
   Failed         : 0
   Tier 1 (Feature Coverage)     : 50 / 50 passed (100.0%) [PASS]
   Tier 2 (Boundaries & Corners) : 50 / 50 passed (100.0%) [PASS]
   Total Duration : 1.07s
   ```
2. Executed `npx ng test --watch=false --browsers=ChromeHeadless`:
   ```
   Chrome Headless 156.0.0.0 (Windows 10): Executed 313 of 313 SUCCESS (11.431 secs / 11.078 secs)
   TOTAL: 313 SUCCESS
   ```

### 1.2 Critical Failure in ReactiveFormsComponent Debounce Auto-Save
In `src/app/features/module7-angular/reactive-forms.component.ts`, lines 132–137:
```typescript
132:       // Dynamic debounce duration
133:       switchMap(formVal =>
134:         of(formVal).pipe(
135:           debounceTime(this.debounceDurationMs())
136:         )
137:       ),
```
Followed by lines 164–167:
```typescript
164:         this.telemetry.update(t => ({
165:           ...t,
166:           httpRequestsCount: t.httpRequestsCount + 1
167:         }));
```
Followed by lines 171–180:
```typescript
171:       // F40.4: switchMap to HTTP save
172:       switchMap(payload => {
173:         return this.saveToBackend(payload).pipe(
174:           catchError(err => {
...
```
When executing `tests/m5-challenger-empirical.js` under 100 rapid keystrokes within a 400ms debounce window:
```
▶ [2. Rapid Keystroke & Debounce Stress]
  [FAIL] CRITICAL CHALLENGE: ReactiveFormsComponent auto-save debounce under 100 rapid changes (EXPECTED: 1 HTTP request) — Observed 100 HTTP requests initiated, 99 cancelled! (BUG: switchMap(of().pipe(debounceTime())) flushes on complete, emitting 100 requests instead of 1)
  [PASS] Oracle Contrast: Correct debounceTime pipeline reduces 100 rapid keystrokes to exactly 1 HTTP request — Observed 1 HTTP request(s) with correct debounceTime placement
```

Node.js verification command:
```bash
node -e "const { Subject, of } = require('rxjs'); const { switchMap, debounceTime } = require('rxjs/operators'); const s = new Subject(); let count = 0; s.pipe(switchMap(v => of(v).pipe(debounceTime(400)))).subscribe(() => count++); for (let i = 0; i < 100; i++) s.next(i); console.log('Emitted count:', count);"
```
Output:
```
Emitted count: 100
```

### 1.3 HTTP & Exponential Backoff Resilience (HttpRecipeService)
In `src/app/features/module7-angular/http-recipe.service.ts`:
- **500 Server Error Backoff**: Verified 1 initial attempt + 3 retries = 4 total attempts before fallback payload. Delays grew exponentially: attempt 1 = 30ms, attempt 2 = 59ms, attempt 3 = 111ms (with base 25ms, scaling as $2^{attempt-1} \times base$). Result: **PASS**.
- **4xx Client Errors**: 401 Unauthorized and 404 Not Found were immediately rejected without retry (exactly 1 attempt executed). Result: **PASS**.
- **shareReplay({ bufferSize: 1, refCount: true }) Teardown**: Verified that when 2 subscribers unsubscribe mid-flight before completion, the underlying source connection teardown executes immediately. Result: **PASS**.
- **Missing Teardown Flaw**: In `http-recipe.service.ts:80-129`, `fetchWithResilientRetry` wraps `this.http.get` in `new Observable(sub => { ... })` but does not return a teardown function (`return () => httpSub.unsubscribe()`). If a consumer unsubscribes mid-flight during the HTTP request, the HTTP request cannot be cancelled.

### 1.4 Search Autocomplete Component Stress (SearchAutocompleteComponent)
In `src/app/features/module8-mini-projects/components/search-autocomplete/search-autocomplete.component.ts:77-128`:
- 100 rapid keystrokes debounced to exactly 1 service request. Result: **PASS**.
- Empty and whitespace queries (`""`, `"   "`, `"\t\n  "`) bypass backend call and return `{ lessons: [], total: 0 }`. Result: **PASS**.
- Preemption: Slower in-flight queries are preempted and aborted when a newer query arrives. Result: **PASS**.

### 1.5 Polling & Tab Visibility API Stress (PollingService)
In `src/app/features/module8-mini-projects/services/polling.service.ts`:
- **50 Tab Visibility Toggles in 100ms**: Stream toggled rapidly between hidden and visible. Peak concurrent in-flight requests remained $\le 1$, and polling resumed cleanly without backlog buildup. Result: **PASS**.
- **Tab Hidden Suspension**: With tab hidden for 250ms, 0 poll ticks fired. Result: **PASS**.
- **Interval Clamping**: `sanitizePollingInterval` clamped 0ms, -100ms, and 200ms to minimum 500ms. Result: **PASS**.
- **Transient Failure Recovery**: Retry with 200ms backoff recovered successfully. Result: **PASS**.

---

## 2. Logic Chain

1. **Mission Requirement (Prompt Section 2)**:
   > "Test `ReactiveFormsComponent` auto-save: Feed 10,000 character rapid string and simulate 100 rapid changes within debounce window. Verify only 1 HTTP request is sent and duplicate values are suppressed."
2. **RxJS Behavior Specification**:
   `of(formVal)` emits `formVal` and synchronously completes. When an Observable source completes while a `debounceTime` timer is active, RxJS's `debounceTime` operator immediately flushes the latest pending value synchronously and completes downstream.
3. **Flawed Implementation (`reactive-forms.component.ts:133-137`)**:
   `switchMap(formVal => of(formVal).pipe(debounceTime(this.debounceDurationMs())))` does not buffer or delay values. Every value emitted by `form.valueChanges` completes `of(formVal)` in 0ms, causing `debounceTime` to emit synchronously.
4. **Impact on HTTP Traffic and Server Load**:
   Every single keystroke bypasses debouncing and reaches `tap(httpRequestsCount++)` and `switchMap(saveToBackend)`. When typing 100 characters in rapid succession, exactly 100 HTTP PUT requests are initiated to `http://localhost:9000/api/courses/1`. Although 99 in-flight requests are cancelled by `switchMap`, all 100 network requests were initiated over the network, defeating the fundamental purpose of input debouncing.
5. **Telemetry Discrepancy**:
   `telemetry().httpRequestsCount` reaches 100, and `efficiencyPercentage` calculates to 0% instead of >95%.
6. **Verdict Deduction**:
   Because Milestone 5 fails the core debounce verification requirement under rapid keystrokes, the implementation cannot be approved in its current state.

---

## 3. Caveats

- All unit tests in Karma (313/313) and E2E tests (100/100) passed because existing unit tests did not simulate rapid consecutive typing into `form.valueChanges` while asserting on `httpRequestsCount`.
- The Express backend server is verified running on port 9000 with functional endpoints (`/api/slow`, `/api/simulate-error`, `/api/lessons`, `/api/courses/1`).
- All other Module 7 and Module 8 features (State Store, Search Autocomplete, Polling System, HTTP Request Manager, Multi-Step Wizard, Shopping Cart, Live Dashboard) passed all adversarial stress challenges.

---

## 4. Conclusion

**Verdict: REJECT**

Milestone 5 cannot be approved due to a critical architectural flaw in `ReactiveFormsComponent`:
1. **Critical Defect**: `ReactiveFormsComponent` does not debounce form inputs; it initiates an HTTP request for every single keystroke due to `of(formVal).pipe(debounceTime(...))` flushing synchronously on completion.
2. **Secondary Defect**: `HttpRecipeService.fetchWithResilientRetry` lacks an unsubscription teardown return function in its `new Observable` constructor.

### Required Mitigation
In `src/app/features/module7-angular/reactive-forms.component.ts`, replace lines 132–137:
```typescript
// Replace lines 132-137:
switchMap(formVal =>
  of(formVal).pipe(
    debounceTime(this.debounceDurationMs())
  )
),
```
with either:
```typescript
// Option A: Direct RxJS debounce operator with timer factory
debounce(() => timer(this.debounceDurationMs())),
```
or:
```typescript
// Option B: switchMap with timer delay before emission
switchMap(formVal => timer(this.debounceDurationMs()).pipe(map(() => formVal))),
```
Both options correctly wait for `this.debounceDurationMs()` of quiet time, ensuring that 100 rapid keystrokes generate exactly **1** HTTP request.

---

## 5. Verification Method

1. Run the empirical stress harness:
   ```bash
   node tests/m5-challenger-empirical.js
   ```
   **Pass Condition**: All 18 tests pass (including `CRITICAL CHALLENGE: ReactiveFormsComponent auto-save debounce under 100 rapid changes (EXPECTED: 1 HTTP request)`).  
   **Current Status**: 17 PASSED, 1 FAILED (Exit Code 1).
2. Run standard Milestone 5 E2E suite:
   ```bash
   node tests/e2e/run-all-tests.js --milestone M5
   ```
3. Run Angular headless Karma test suite:
   ```bash
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
