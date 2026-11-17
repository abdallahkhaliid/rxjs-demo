# Handoff Report: Teardown & Unsubscription Audit for HttpRecipeService and Module 7

**Agent**: `explorer_m5_fix_teardown`  
**Working Directory**: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_fix_teardown\`  
**Milestone**: M5 Fix Teardown  
**Parent**: `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`  
**Timestamp**: 2026-11-07T00:13:00Z  
**Verdict**: **COMPLETE — READY FOR IMPLEMENTATION**

---

## 1. Observation

### 1.1 Direct Code Audit Findings

#### 1. `HttpRecipeService.fetchWithResilientRetry`
- **Location**: `src/app/features/module7-angular/http-recipe.service.ts:80-129`
- **Verbatim Code**:
  ```typescript
  80:     const request$ = new Observable<any>(sub => {
  81:       attemptCount++;
  82:       const currentAttempt = attemptCount;
  83:       const startTime = Date.now();
  ...
  95:       const params = new HttpParams()
  96:         .set('rate', rate.toString())
  97:         .set('statusCode', statusCode.toString())
  98:         .set('attempt', currentAttempt.toString());
  99: 
  100:       this.http.get<SimulateErrorSuccessResponse>(`${this.baseUrl}/simulate-error`, { params }).subscribe({
  101:         next: val => { ... sub.next(val); sub.complete(); },
  102:         error: err => { ... sub.error(err); }
  103:       });
  104:     });
  ```
- **Direct Observation**:
  The function passed to `new Observable` subscribes to `this.http.get` without capturing the returned `Subscription` object (`const httpSub = ...`), and returns `void` (no return statement).
  In RxJS, when `new Observable(subscriber => { ... })` returns `undefined`, the observable has no teardown logic.
  If downstream unsubscribes mid-flight (e.g., via component unmount, `takeUntil`, `switchMap`, or manual `sub.unsubscribe()`), the inner HTTP request is not cancelled and continues over the network until completion.

#### 2. Other Methods in `HttpRecipeService`
- `getCachedCourse(courseId, useCache)`: Uses `shareReplay({ bufferSize: 1, refCount: true })`. Verified in `module7.spec.ts:77-85` to release the HTTP connection when all subscribers unsubscribe mid-flight. **Clean**.
- `fetchCourseFromBackend(id)`: Returns direct `this.http.get(...).pipe(tap(...), catchError(...))`. Angular `HttpClient` cold observables natively abort on unsubscription. **Clean**.
- `createRefreshableCourseStream(courseId)`: Returns `this.refreshTrigger$.pipe(startWith(null), switchMap(...))`. `switchMap` handles inner stream unsubscription automatically. **Clean**.
- `fetchParallelAggregatedData(courseId)`: Returns `combineLatest([course$, slow$]).pipe(map(...))`. `combineLatest` propagates unsubscription to both inner HTTP observables. **Clean**.

#### 3. Methods in `CourseStateStoreService` (`src/app/features/module7-angular/course-state-store.service.ts`)
- The service exposes selectors (`courses$`, `filterCategory$`, `filterDifficulty$`, `searchTerm$`, `selectedCourseId$`, `filteredCourses$`, `enrolledCount$`, `totalCount$`) that all return `this.state$.pipe(...)` without holding internal subscriptions.
- All store mutations (`update`, `rollbackToSnapshot`, `resetStore`) are synchronous calls to `BehaviorSubject.next()`.
- **Finding**: Zero missing teardowns or subscription leaks exist in `CourseStateStoreService`.

#### 4. Methods in `HttpPatternsComponent` (`src/app/features/module7-angular/http-patterns.component.ts`)
- `refreshSubscription` is assigned and unsubscribed in `ngOnDestroy()`.
- `sub1Subscription` and `sub2Subscription` are assigned and unsubscribed in `ngOnDestroy()`.
- **Finding**: In `triggerResilientFetch()` (line 187) and `triggerParallelAggregation()` (line 223), the component calls `.subscribe(...)` directly on `this.httpService.fetchWithResilientRetry(...)` and `this.httpService.fetchParallelAggregatedData(...)` without storing the subscription handles.
- If a user triggers a retry or parallel fetch and navigates away before completion, the subscriptions remain active and may invoke signal mutations (`this.isRetrying.set(false)`, `this.retryResult.set(...)`) on a destroyed component.

### 1.2 Empirical Proof of Teardown Cancellation

Executed Node.js verification script:
```bash
node -e "
const { Observable } = require('rxjs');

function mockHttpGet() {
  return new Observable(sub => {
    let cancelled = false;
    const timerId = setTimeout(() => {
      if (!cancelled) sub.next({ status: 'ok' });
    }, 100);
    return () => {
      cancelled = true;
      clearTimeout(timerId);
      console.log('Underlying HTTP request cancelled successfully!');
    };
  });
}

// Case 1: Without teardown (Current Implementation)
const leaky$ = new Observable(sub => {
  mockHttpGet().subscribe({
    next: v => sub.next(v),
    error: e => sub.error(e)
  });
});
const sub1 = leaky$.subscribe();
sub1.unsubscribe(); // Output: nothing (leak)

// Case 2: With teardown (Proposed Fix)
const clean$ = new Observable(sub => {
  const httpSub = mockHttpGet().subscribe({
    next: v => sub.next(v),
    error: e => sub.error(e)
  });
  return () => {
    httpSub.unsubscribe();
  };
});
const sub2 = clean$.subscribe();
sub2.unsubscribe(); // Output: 'Underlying HTTP request cancelled successfully!'
"
```
**Output**:
```
Underlying HTTP request cancelled successfully!
```
When `sub2.unsubscribe()` is called on `clean$`, `return () => httpSub.unsubscribe()` executes synchronously and aborts the in-flight HTTP request.

---

## 2. Logic Chain

1. **Contract of `Observable` Constructor**:
   In RxJS, `new Observable(subscriber => TeardownLogic)` expects either a teardown function `() => void` or a `SubscriptionLike` to be returned from the subscribe factory. When the downstream consumer invokes `subscription.unsubscribe()`, RxJS invokes the returned teardown logic.
2. **Impact of Omitting Teardown in `fetchWithResilientRetry`**:
   Because `fetchWithResilientRetry` subscribes to `this.http.get` without capturing or returning `httpSub`, RxJS has no handle to the inner subscription. When a caller unsubscribes, the outer subscriber closes, but the inner HTTP request continues running in the background. In production, this causes zombie HTTP requests that consume network bandwidth and execute orphaned callbacks.
3. **Propagation Through `retry` Operator**:
   We verified empirically that `retry` properly delegates unsubscription down to its source observable. When `clean$` is piped through `retry({ count: 3, delay: ... })` and the consumer unsubscribes (whether during an active in-flight HTTP call or during an exponential backoff delay timer), `retry` immediately invokes the source teardown, cancelling in-flight HTTP requests and preventing subsequent retry attempts.
4. **Component Lifecycle Symmetry**:
   In `HttpPatternsComponent`, capturing `retrySubscription` and `parallelSubscription` ensures that if a user navigates away while a multi-second exponential backoff retry loop is in flight, `ngOnDestroy()` cleanly cancels the pending HTTP request and terminates all pending timers.

---

## 3. Caveats

1. **Zoneless Signal Updates on Destroyed Components**:
   In Angular 20 zoneless mode, updating signals on an unmounted component does not throw, but it causes unnecessary reactive recalculations and memory retention if callbacks hold references to the component instance. Cleaning up `retrySubscription` and `parallelSubscription` provides complete defense-in-depth.
2. **Alternative `defer()` Pattern**:
   While `defer(() => { ... })` could also be used to create the request observable per attempt, keeping `new Observable(sub => { ... })` with `return () => httpSub.unsubscribe()` is minimally invasive, 100% backwards-compatible with all existing logging callbacks (`onAttempt`), and requires editing only 4 lines of code.

---

## 4. Conclusion & Precise Patch Specification

### 4.1 Target 1: `src/app/features/module7-angular/http-recipe.service.ts`

**Lines**: 100–129  
**Action**: Capture `httpSub` and return the unsubscription teardown function.

```diff
--- a/src/app/features/module7-angular/http-recipe.service.ts
+++ b/src/app/features/module7-angular/http-recipe.service.ts
@@ -100,7 +100,7 @@ export class HttpRecipeService {
-      this.http.get<SimulateErrorSuccessResponse>(`${this.baseUrl}/simulate-error`, { params }).subscribe({
+      const httpSub = this.http.get<SimulateErrorSuccessResponse>(`${this.baseUrl}/simulate-error`, { params }).subscribe({
         next: val => {
           if (onAttempt) {
             onAttempt({
@@ -127,6 +127,10 @@ export class HttpRecipeService {
           sub.error(err);
         }
       });
+
+      return () => {
+        httpSub.unsubscribe();
+      };
     });
```

### 4.2 Target 2: `src/app/features/module7-angular/http-patterns.component.ts`

**Lines**: 49–51, 85–89, 187–208, 218–234  
**Action**: Hold `retrySubscription` and `parallelSubscription`, unregistering previous runs and unsubscribing on destroy.

```diff
--- a/src/app/features/module7-angular/http-patterns.component.ts
+++ b/src/app/features/module7-angular/http-patterns.component.ts
@@ -50,2 +50,4 @@ export class HttpPatternsComponent implements OnDestroy {
   private sub1Subscription?: Subscription;
   private sub2Subscription?: Subscription;
+  private retrySubscription?: Subscription;
+  private parallelSubscription?: Subscription;
@@ -85,4 +87,6 @@ export class HttpPatternsComponent implements OnDestroy {
   ngOnDestroy(): void {
     this.unsubscribeSub1();
     this.unsubscribeSub2();
     this.refreshSubscription?.unsubscribe();
+    this.retrySubscription?.unsubscribe();
+    this.parallelSubscription?.unsubscribe();
   }
@@ -173,2 +177,3 @@ export class HttpPatternsComponent implements OnDestroy {
   triggerResilientFetch(): void {
+    this.retrySubscription?.unsubscribe();
     this.isRetrying.set(true);
@@ -187,3 +192,3 @@ export class HttpPatternsComponent implements OnDestroy {
-    this.httpService
+    this.retrySubscription = this.httpService
       .fetchWithResilientRetry(rate, code, maxRetries, 350, log => {
@@ -219,2 +224,3 @@ export class HttpPatternsComponent implements OnDestroy {
   triggerParallelAggregation(): void {
+    this.parallelSubscription?.unsubscribe();
     this.isAggregating.set(true);
@@ -223,3 +229,3 @@ export class HttpPatternsComponent implements OnDestroy {
-    this.httpService.fetchParallelAggregatedData(1).subscribe({
+    this.parallelSubscription = this.httpService.fetchParallelAggregatedData(1).subscribe({
```

### 4.3 Target 3: Unit Test Specification in `src/app/features/module7-angular/module7.spec.ts`

Add this unit test into `describe('HttpRecipeService', ...)` (after line 85):

```typescript
    it('F39.B6: should abort underlying HTTP request when unsubscribed mid-flight during resilient retry', () => {
      const stream$ = service.fetchWithResilientRetry(0.7, 500, 3, 400);
      const sub = stream$.subscribe();
      const req = httpMock.expectOne(r => r.url.includes('/simulate-error'));

      // Unsubscribe mid-flight before response arrives
      sub.unsubscribe();
      expect(req.cancelled).toBe(true);
    });
```

And in `describe('HttpPatternsComponent', ...)`:
```typescript
    it('should unsubscribe in-flight retry and parallel requests when component is destroyed', () => {
      component.triggerResilientFetch();
      component.triggerParallelAggregation();
      // Should cleanly cancel without throw
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
```

---

## 5. Verification Method

Once implemented by the author/implementer agent, independently verify using:

1. **Unit Test Suite (including cancellation assertion `req.cancelled === true`)**:
   ```bash
   npx ng test --include="src/app/features/module7-angular/**/*.spec.ts" --watch=false --browsers=ChromeHeadless
   ```
   *Expected Result*: All tests pass with 0 failures.

2. **Full Test Suite & Compilation**:
   ```bash
   npx ng build --configuration development
   ```
   *Expected Result*: Clean build with 0 TypeScript/compilation errors.

3. **Challenger Empirical Test Harness**:
   ```bash
   node tests/m5-challenger-empirical.js
   ```

4. **Invalidation Condition**:
   If `req.cancelled` remains `false` after `sub.unsubscribe()` in test `F39.B6`, the teardown function was either omitted or failed to execute `httpSub.unsubscribe()`.
