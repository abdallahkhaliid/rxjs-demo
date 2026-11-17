## 2026-11-07T00:15:28Z
You are the Milestone 5 Remediation Worker (`worker_m5_remediation`).

## Working Directory
`c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m5_remediation\`

## Parent Orchestrator
Conversation ID: `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`

## Exclusive Write Scope
You have exclusive write ownership over:
- `src/app/features/module7-angular/*`
- `tests/m5-challenger-empirical.js`
Do NOT modify any files outside this scope.

## Mandatory Inputs (Read these first)
1. `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\ORIGINAL_REQUEST.md`
2. `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\PROJECT.md`
3. `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_fix_debounce\handoff.md`
4. `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_fix_teardown\handoff.md`
5. `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m5_fix_specs\handoff.md`

## MANDATORY INTEGRITY WARNING
> DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Detailed Tasks
1. **Fix `src/app/features/module7-angular/reactive-forms.component.ts`**:
   - In lines 6-8: Import `timer` from `'rxjs'` and `debounce` from `'rxjs/operators'`. Remove unused `debounceTime`.
   - In lines 132-137: Replace the flawed `switchMap(formVal => of(formVal).pipe(debounceTime(this.debounceDurationMs())))` with the canonical dynamic debounce:
     ```typescript
     // Dynamic debounce duration
     debounce(() => timer(this.debounceDurationMs())),
     ```
   - This ensures rapid keystrokes within the debounce window cancel previous timers and coalesce into exactly 1 HTTP save, saving ~99% network traffic.

2. **Fix `src/app/features/module7-angular/http-recipe.service.ts`**:
   - In `fetchWithResilientRetry` (around lines 100-129):
     Capture `const httpSub = this.http.get<SimulateErrorSuccessResponse>(...).subscribe({...});`
     and return the teardown handle:
     ```typescript
     return () => {
       httpSub.unsubscribe();
     };
     ```
   - This ensures consumer unsubscription mid-flight cleanly cancels the underlying Angular `HttpClient` request.

3. **Enhance `src/app/features/module7-angular/http-patterns.component.ts`**:
   - Track `retrySubscription` and `parallelSubscription` in the component class.
   - Cancel any prior active subscriptions before launching new ones in `triggerResilientFetch` and `triggerParallelAggregation`.
   - Cleanly unsubscribe them in `ngOnDestroy()`.

4. **Add Unit Tests to `src/app/features/module7-angular/module7.spec.ts`**:
   - In `describe('HttpRecipeService', ...)`: Add test `F39.B6: should abort underlying HTTP request when unsubscribed mid-flight from fetchWithResilientRetry` asserting `req.cancelled === true`.
   - In `describe('ReactiveFormsComponent', ...)`: Add test `F40.1 & F40.4: should debounce rapid consecutive keystrokes within debounce window and coalesce into exactly 1 HTTP PUT save` (using native async/await and setTimeout per the spec in explorer_m5_fix_specs handoff).
   - In `describe('HttpPatternsComponent', ...)`: Add component destruction teardown safety test.

5. **Update `tests/m5-challenger-empirical.js`**:
   - Line 29: Add `debounce` to `require('rxjs/operators')`.
   - Lines 120-126: Update `createImplementedReactiveFormsPipeline` to use `debounce(() => timer(debounceDurationMs))` to reflect the corrected implementation.

6. **Run Verification Commands**:
   Execute each command and capture full results:
   - `npx ng test --include="src/app/features/module7-angular/**/*.spec.ts" --watch=false --browsers=ChromeHeadless`
   - `node tests/m5-challenger-empirical.js`
   - `npx ng test --watch=false --browsers=ChromeHeadless`
   - `node tests/e2e/run-all-tests.js --milestone M5`
   - `node tests/e2e/run-all-tests.js`
   - `npx ng build --configuration development`

## Deliverables
- Write your comprehensive handoff report to `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\worker_m5_remediation\handoff.md`.
- Send a completion message via `send_message` with Recipient `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89` summarizing changes and all verification results.
