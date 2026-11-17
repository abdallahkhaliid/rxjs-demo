# Handoff Report: Module 7 Unit Test Specifications for Debounce Coalescing and Mid-Flight HTTP Abort

**Agent**: `explorer_m5_fix_specs`  
**Working Directory**: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_fix_specs\`  
**Milestone**: M5  
**Parent**: `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`  
**Timestamp**: 2026-11-07T00:13:30Z  
**Type**: Hard Handoff (Investigation & Specification Complete)

---

## 1. Observation

### 1.1 Codebase Context & Existing Test Infrastructure
- **Zoneless Angular 20 Architecture**: As observed in `package.json:25-37` and `src/app/features/module7-angular/module7.spec.ts:1-6,41,199,328,434`, the project operates purely without `zone.js` (`provideZonelessChangeDetection()`). Consequently, `fakeAsync` and `tick` from `@angular/core/testing` are not available without importing Zone.js test shims.
- **Async Pattern in `module7.spec.ts`**: Existing asynchronous timing tests in `module7.spec.ts` (lines 116, 121, 126, 597) use standard native promises with `setTimeout`:
  ```typescript
  // module7.spec.ts:116
  await new Promise(r => setTimeout(r, 40));
  ```
  Running Karma headless tests confirms the baseline suite passes 41/41 tests in 1.62 seconds:
  ```bash
  npx ng test --include="src/app/features/module7-angular/**/*.spec.ts" --watch=false --browsers=ChromeHeadless
  # Chrome Headless 156.0.0.0 (Windows 10): Executed 41 of 41 SUCCESS (1.621 secs)
  ```

### 1.2 Observed Target 1: `ReactiveFormsComponent` Auto-Save Pipeline Defect
- **File**: `src/app/features/module7-angular/reactive-forms.component.ts:132-137`
- **Verbatim Code**:
  ```typescript
  // Dynamic debounce duration
  switchMap(formVal =>
    of(formVal).pipe(
      debounceTime(this.debounceDurationMs())
    )
  ),
  ```
- **Observed Behavior**:
  `of(formVal)` emits and synchronously completes. When an inner observable completes while `debounceTime` has a pending value, `debounceTime` flushes that value immediately. As verified empirically:
  ```bash
  node -e "const { Subject, of } = require('rxjs'); const { switchMap, debounceTime } = require('rxjs/operators'); const s = new Subject(); let count = 0; s.pipe(switchMap(v => of(v).pipe(debounceTime(400)))).subscribe(() => count++); s.next('a'); setTimeout(() => s.next('b'), 30); setTimeout(() => s.next('c'), 60); setTimeout(() => s.next('d'), 90); setTimeout(() => s.next('e'), 120); setTimeout(() => console.log('Count at 200ms:', count), 200);"
  # Output: Count at 200ms: 5
  ```
  Every rapid keystroke triggers a save immediately without waiting for the 400ms quiet window.
- **Correct Operator Pattern**:
  `debounce(() => timer(this.debounceDurationMs()))`.
  Empirically verified:
  ```bash
  node -e "const { Subject, timer } = require('rxjs'); const { debounce } = require('rxjs/operators'); const s = new Subject(); let count = 0; s.pipe(debounce(() => timer(400))).subscribe(() => count++); s.next('a'); setTimeout(() => s.next('b'), 30); setTimeout(() => s.next('c'), 60); setTimeout(() => s.next('d'), 90); setTimeout(() => s.next('e'), 120); setTimeout(() => console.log('Count at 200ms:', count), 200); setTimeout(() => console.log('Count at 550ms:', count), 550);"
  # Output:
  # Count at 200ms: 0
  # Count at 550ms: 1
  ```

### 1.3 Observed Target 2: `HttpRecipeService.fetchWithResilientRetry` Missing Unsubscription Teardown
- **File**: `src/app/features/module7-angular/http-recipe.service.ts:80-129`
- **Verbatim Code**:
  ```typescript
  const request$ = new Observable<any>(sub => {
    ...
    this.http.get<SimulateErrorSuccessResponse>(`${this.baseUrl}/simulate-error`, { params }).subscribe({
      next: val => { ... sub.next(val); sub.complete(); },
      error: err => { ... sub.error(err); }
    });
  });
  ```
- **Observed Behavior**:
  The `new Observable` constructor initiates `this.http.get` but does NOT return a teardown function (`return () => httpSub.unsubscribe()`). When a consumer unsubscribes mid-flight, the Angular `HttpClient` request remains uncancelled (`req.cancelled === false`).
- **Contrast with Working Benchmark in `module7.spec.ts:77-85`**:
  ```typescript
  it('F39.B3: should properly release connection when unsubscribed mid-flight (refCount: true)', () => {
    const stream$ = service.getCachedCourse(1, true);
    const sub = stream$.subscribe();
    const req = httpMock.expectOne('http://localhost:9000/api/courses/1');

    sub.unsubscribe();
    expect(req.cancelled).toBe(true);
  });
  ```

---

## 2. Logic Chain

1. **Test Environment Compatibility**:
   In Angular 20 Zoneless mode, `fakeAsync` is unavailable without Zone.js. The testing framework relies on native promises and timers (`async/await new Promise(r => setTimeout(r, ms))`) or Jasmine's `jasmine.clock()`. Because existing tests throughout `module7.spec.ts` consistently and reliably use `async/await` with native micro/macrotasks without mock clock leakage or WebSocket test runner conflicts, formulating asynchronous tests using `async/await` with short, deterministic timeouts is the safest, most idiomatic approach. We also formulate the `jasmine.clock()` variant for completeness.

2. **Debounce Coalescing Test Case Logic (`F40.1 & F40.4`)**:
   - `ReactiveFormsComponent` defaults to `debounceDurationMs = 400` and `autoSaveEnabled = true`.
   - When 5 rapid keystrokes are emitted to `component.form.get('title')` spaced by 25ms (spanning 100ms total, well inside 400ms):
     - `telemetry().keystrokesCount` increments to 5 synchronously.
     - `saveStatus()` transitions to `'typing'`.
     - At elapsed time 100ms (< 400ms debounce), **zero** HTTP requests have been dispatched (`telemetry().httpRequestsCount === 0` and `httpMock.expectNone(...)`).
   - After waiting 500ms (> 400ms debounce quiet period from the last keystroke):
     - Debounce timer fires downstream.
     - Form validity checks pass.
     - Exactly **one** HTTP PUT request is dispatched to `http://localhost:9000/api/courses/1` containing the final value (`'Mastering RxJS Patterns in Angular ABCDE'`).
     - `httpRequestsCount` increments to 1.
     - `req.flush(...)` completes the save, setting `saveStatus()` to `'saved'`, `cancelledRequestsCount` to 0, and `efficiencyPercentage()` to 80% (`(5 - 1) / 5 * 100`).
     - No subsequent requests exist (`httpMock.expectNone(...)`).

3. **Mid-Flight Unsubscription Abort Test Case Logic (`F39.B6`)**:
   - `service.fetchWithResilientRetry(0.7, 500, 3, 400)` creates an observable wrapping the HTTP attempt.
   - Subscribing triggers the inner `this.http.get(...)` immediately.
   - `httpMock.expectOne(...)` captures the in-flight HTTP request. At this point `req.cancelled === false`.
   - Calling `sub.unsubscribe()` terminates the subscriber.
   - With the proper teardown function `return () => httpSub.unsubscribe();` in `new Observable`, unsubscription cascades into `httpSub.unsubscribe()`, which signals `HttpClientTestingBackend` to cancel the request.
   - `expect(req.cancelled).toBe(true)` verifies that the underlying network request was aborted.

---

## 3. Specifications and Code Additions for `module7.spec.ts`

### 3.1 Addition 1: Mid-Flight HTTP Abort Test in `HttpRecipeService`
- **Target File**: `src/app/features/module7-angular/module7.spec.ts`
- **Location**: Insert inside `describe('HttpRecipeService', ...)` immediately following line 134 (after `F39.2 & F39.B2`).

```typescript
    it('F39.B6: should abort underlying HTTP request when unsubscribed mid-flight from fetchWithResilientRetry', () => {
      const stream$ = service.fetchWithResilientRetry(0.7, 500, 3, 400);
      const sub = stream$.subscribe();

      // Intercept the in-flight HTTP request initiated for attempt 1
      const req = httpMock.expectOne(r => r.url.includes('/simulate-error'));
      expect(req.cancelled).toBe(false);

      // Unsubscribe mid-flight before the server responds or retries
      sub.unsubscribe();

      // Teardown must abort the underlying Angular HttpClient request
      expect(req.cancelled).toBe(true);
    });
```

---

### 3.2 Addition 2: Rapid Keystroke Debounce & Coalescing Test in `ReactiveFormsComponent`
- **Target File**: `src/app/features/module7-angular/module7.spec.ts`
- **Location**: Insert inside `describe('ReactiveFormsComponent', ...)` immediately after line 502 (after `should update debounce window when slider changes`).

#### Primary Specification (Native Async Promises & Macrotasks — Recommended):
```typescript
    it('F40.1 & F40.4: should debounce rapid consecutive keystrokes within debounce window and coalesce into exactly 1 HTTP PUT save', async () => {
      // 1. Initial baseline verification
      expect(component.telemetry().keystrokesCount).toBe(0);
      expect(component.telemetry().httpRequestsCount).toBe(0);
      expect(component.saveStatus()).toBe('pristine');
      httpMock.expectNone('http://localhost:9000/api/courses/1');

      // 2. Simulate rapid keystrokes: 5 characters typed with 25ms intervals (100ms total << 400ms debounce)
      const baseTitle = 'Mastering RxJS Patterns in Angular';
      const rapidKeystrokes = [' A', ' AB', ' ABC', ' ABCD', ' ABCDE'];

      for (const suffix of rapidKeystrokes) {
        component.form.get('title')?.setValue(`${baseTitle}${suffix}`);
        await new Promise(resolve => setTimeout(resolve, 25));
      }

      // 3. Immediately after typing burst, all 5 keystrokes are recorded, but ZERO HTTP requests sent
      expect(component.telemetry().keystrokesCount).toBe(5);
      expect(component.telemetry().httpRequestsCount).toBe(0);
      expect(component.saveStatus()).toBe('typing');
      httpMock.expectNone('http://localhost:9000/api/courses/1');

      // 4. Wait 500ms (> 400ms debounceDurationMs) for quiet window to elapse and timer to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Exactly 1 HTTP PUT request should be initiated with the latest coalesced payload
      const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.description).toBe('Mastering RxJS Patterns in Angular ABCDE');

      // 6. Complete HTTP save with 200 OK
      req.flush({ id: 1, description: 'Mastering RxJS Patterns in Angular ABCDE' });
      fixture.detectChanges();

      // 7. Verify final telemetry and component state
      expect(component.telemetry().keystrokesCount).toBe(5);
      expect(component.telemetry().httpRequestsCount).toBe(1);
      expect(component.telemetry().cancelledRequestsCount).toBe(0);
      expect(component.saveStatus()).toBe('saved');
      expect(component.efficiencyPercentage()).toBe(80); // (5 - 1) / 5 * 100 = 80%

      // 8. Confirm no subsequent pending requests
      httpMock.expectNone('http://localhost:9000/api/courses/1');
    });
```

#### Alternative Specification (Jasmine Mock Clock):
For scenarios where zero real-time delay is preferred:
```typescript
    it('F40.1 & F40.4: should debounce rapid consecutive keystrokes using jasmine.clock', () => {
      jasmine.clock().install();
      try {
        expect(component.telemetry().keystrokesCount).toBe(0);
        expect(component.telemetry().httpRequestsCount).toBe(0);

        const baseTitle = 'Mastering RxJS Patterns in Angular';
        for (let i = 1; i <= 5; i++) {
          component.form.get('title')?.setValue(`${baseTitle} ${i}`);
          jasmine.clock().tick(25);
        }

        // 5 * 25ms = 125ms < 400ms debounce
        expect(component.telemetry().keystrokesCount).toBe(5);
        expect(component.telemetry().httpRequestsCount).toBe(0);
        httpMock.expectNone('http://localhost:9000/api/courses/1');

        // Advance mock clock past 400ms debounce threshold
        jasmine.clock().tick(400);

        const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
        expect(req.request.method).toBe('PUT');
        expect(req.request.body.description).toBe(`${baseTitle} 5`);
        req.flush({ id: 1, description: `${baseTitle} 5` });

        expect(component.telemetry().httpRequestsCount).toBe(1);
        expect(component.saveStatus()).toBe('saved');
        expect(component.efficiencyPercentage()).toBe(80);
      } finally {
        jasmine.clock().uninstall();
      }
    });
```

---

## 4. Required Source Code Fixes (For Implementing Agent Reference)

To allow the formulated tests to pass, the implementer must apply these two localized changes:

### 4.1 Fix in `src/app/features/module7-angular/reactive-forms.component.ts`
1. **Imports** (`line 6-7`):
   Ensure `timer` is imported from `'rxjs'` and `debounce` is imported from `'rxjs/operators'`.
2. **Auto-Save Pipeline** (`lines 132-137`):
   Replace:
   ```typescript
   // Dynamic debounce duration
   switchMap(formVal =>
     of(formVal).pipe(
       debounceTime(this.debounceDurationMs())
     )
   ),
   ```
   With:
   ```typescript
   // Dynamic debounce duration
   debounce(() => timer(this.debounceDurationMs())),
   ```

### 4.2 Fix in `src/app/features/module7-angular/http-recipe.service.ts`
1. **Teardown return** (`lines 100-129`):
   Capture the subscription `const httpSub = this.http.get<SimulateErrorSuccessResponse>(...).subscribe({...});` and return the teardown:
   ```typescript
   return () => {
     httpSub.unsubscribe();
   };
   ```

---

## 5. Caveats

1. **Pre-Fix Failure Expected**: In the current codebase prior to applying the two fixes, both tests are guaranteed to fail:
   - The debounce test will fail at step 3 because `of(formVal)` flushes immediately, incrementing `httpRequestsCount` to 5 and initiating 5 requests.
   - The unsubscription test will fail because `req.cancelled` remains `false`.
2. **Zone.js Dependency Avoidance**: The primary async Promise + setTimeout pattern was explicitly selected because it does not require `fakeAsync` or `zone.js` and does not risk polluting the global scheduler in ChromeHeadless.
3. **Execution Time**: The primary test runs in ~600ms, maintaining the total suite execution time well below 3 seconds.

---

## 6. Conclusion

The specifications for both requested unit test cases are fully formulated, verified against RxJS semantics, and designed specifically for Angular 20 Zoneless testing with Karma and ChromeHeadless:
1. `F40.1 & F40.4`: Verifies that 5 rapid consecutive keystrokes within 100ms when debounce is 400ms result in 0 early network requests and are coalesced into exactly 1 HTTP PUT save.
2. `F39.B6`: Verifies that unsubscription from `HttpRecipeService.fetchWithResilientRetry` mid-flight triggers teardown and aborts the underlying Angular HTTP request.

---

## 7. Verification Method

Once the implementer applies the source code fixes and inserts the test cases into `module7.spec.ts`:

1. **Execute Headless Unit Tests**:
   ```bash
   npx ng test --include="src/app/features/module7-angular/**/*.spec.ts" --watch=false --browsers=ChromeHeadless
   ```
   *Expected Result*: Executed 43 of 43 SUCCESS (all existing 41 + 2 new tests pass).

2. **Run Empirical Challenge Suite**:
   ```bash
   node tests/m5-challenger-empirical.js
   ```
   *Expected Result*: 18 of 18 passed (including `CRITICAL CHALLENGE: ReactiveFormsComponent auto-save debounce under 100 rapid changes`).

3. **Verify Development Build**:
   ```bash
   npx ng build --configuration development
   ```
   *Expected Result*: Zero compilation errors, all 4 lazy chunks emitted.
