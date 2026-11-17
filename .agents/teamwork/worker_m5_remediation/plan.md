# Worker M5 Remediation Plan

## Objective
Apply robust RxJS fixes to `src/app/features/module7-angular/*` and verification suites per Explorer handoffs:
1. `reactive-forms.component.ts`: Replace flawed `switchMap(of().pipe(debounceTime()))` with canonical `debounce(() => timer(this.debounceDurationMs()))`.
2. `http-recipe.service.ts`: Capture `const httpSub = ...` and return `() => httpSub.unsubscribe()` in `fetchWithResilientRetry`.
3. `http-patterns.component.ts`: Cleanly retain and unsubscribe `retrySubscription` and `parallelSubscription` in `ngOnDestroy()`.
4. `module7.spec.ts`: Add `F40.1 & F40.4` (rapid keystroke debounce coalescing to 1 HTTP request) and `F39.B6` (mid-flight resilient retry unsubscription abort).
5. `tests/m5-challenger-empirical.js`: Synchronize `createImplementedReactiveFormsPipeline` with `debounce(() => timer(debounceDurationMs))`.
6. Run comprehensive verification suite (Karma, empirical harness, E2E runner, ng build).
