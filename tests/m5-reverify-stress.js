/**
 * Milestone 5 Deep Empirical Stress & Re-Verification Harness
 * Author: challenger_m5_reverify_1 (Empirical Challenger: Critic & Specialist)
 *
 * Dedicated verification of:
 * 1. Critical Keystroke Debounce Coalescing:
 *    - 100 rapid inputs burst within 50ms into 400ms debounce pipeline
 *    - Timer cancellation and exactly 1 HTTP request after 400ms
 *    - Verification of 99% network request prevention
 * 2. HTTP Teardown & Mid-Flight Unsubscription:
 *    - fetchWithResilientRetry synchronous cancellation of underlying HTTP request
 *    - Cancellation during in-flight attempt 1, backoff timer delay, and in-flight attempt 2
 *    - Component unmounting / ngOnDestroy() teardown of retry backoff loops and parallel requests
 */

const {
  Observable, of, timer, Subject, BehaviorSubject, combineLatest, throwError
} = require('rxjs');
const {
  debounce, debounceTime, distinctUntilChanged, filter, switchMap, tap, catchError, delay, finalize, retry
} = require('rxjs/operators');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

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

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ============================================================================
// SUITE 1: KEYSTROKE DEBOUNCE COALESCING STRESS
// ============================================================================

async function testDebounceCoalescing() {
  console.log('\n' + '='.repeat(80));
  console.log('SUITE 1: Critical Keystroke Debounce Coalescing (100 rapid inputs in < 50ms)');
  console.log('='.repeat(80));

  // Test 1.1: 100 rapid inputs within 35ms (strictly < 50ms) into debounce(() => timer(400))
  {
    const valueChanges$ = new Subject();
    let httpRequestsInitiated = 0;
    let inFlightRequests = 0;
    let cancelledPriorRequests = 0;
    const executedPayloads = [];

    // Timing check points
    let reqCountAt50ms = -1;
    let reqCountAt200ms = -1;
    let reqCountAt350ms = -1;

    let debounceMs = 400;

    const pipeline$ = valueChanges$.pipe(
      // The exact reactive-forms.component.ts pipeline:
      debounce(() => timer(debounceMs)),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
      filter(val => val && val.autoSaveEnabled && val.isValid),
      tap(() => {
        if (inFlightRequests > 0) {
          cancelledPriorRequests++;
        }
        inFlightRequests++;
        httpRequestsInitiated++;
      }),
      switchMap(payload => {
        return of({ saved: true, payload }).pipe(
          delay(20),
          tap(() => {
            inFlightRequests = Math.max(0, inFlightRequests - 1);
            executedPayloads.push(payload);
          })
        );
      })
    );

    const sub = pipeline$.subscribe();

    const startTime = Date.now();
    // Burst 100 rapid distinct inputs within < 50ms
    for (let i = 0; i < 100; i++) {
      valueChanges$.next({
        title: `Reactive Architecture Keystroke ${i}`,
        description: `Description ${i}`,
        category: 'Frontend',
        subCategory: 'Angular',
        autoSaveEnabled: true,
        isValid: true
      });
    }
    const burstDurationMs = Date.now() - startTime;

    // Checkpoint immediately after burst
    reqCountAt50ms = httpRequestsInitiated;

    // Checkpoint at t = 200ms after burst
    await sleep(200);
    reqCountAt200ms = httpRequestsInitiated;

    // Checkpoint at t = 350ms after burst (still within 400ms debounce)
    await sleep(150);
    reqCountAt350ms = httpRequestsInitiated;

    // Wait until 400ms quiet window has fully elapsed (+150ms -> 500ms total) + 20ms HTTP latency
    await sleep(150);

    const finalHttpCount = httpRequestsInitiated;
    const finalPayload = executedPayloads[0];
    sub.unsubscribe();

    const preventedCount = 100 - finalHttpCount;
    const preventionEfficiency = (preventedCount / 100) * 100;

    const burstUnder50ms = burstDurationMs < 50;
    const zeroPremature = reqCountAt50ms === 0 && reqCountAt200ms === 0 && reqCountAt350ms === 0;
    const exactlyOneHttp = finalHttpCount === 1;
    const correctFinalPayload = finalPayload?.title === 'Reactive Architecture Keystroke 99';
    const ninetyNinePercentPrevented = preventionEfficiency >= 99.0;

    record(
      'Keystroke Burst Timing: 100 inputs dispatched within < 50ms',
      burstUnder50ms,
      `Burst duration = ${burstDurationMs}ms (target < 50ms)`
    );

    record(
      'Debounce Quiet Period: Zero premature HTTP requests triggered before 400ms',
      zeroPremature,
      `Requests at t=50ms: ${reqCountAt50ms}, at t=200ms: ${reqCountAt200ms}, at t=350ms: ${reqCountAt350ms}`
    );

    record(
      'HTTP Request Coalescing: Exactly 1 HTTP request initiated after 400ms with latest input',
      exactlyOneHttp && correctFinalPayload,
      `HTTP requests: ${finalHttpCount}, executed title: "${finalPayload?.title}"`
    );

    record(
      'Network Prevention Efficiency: Prevented 99% of unnecessary network calls',
      ninetyNinePercentPrevented,
      `Prevented ${preventedCount}/100 requests (${preventionEfficiency}% efficiency)`
    );
  }

  // Test 1.2: Contrast Oracle verification of flawed pattern
  {
    const valueChanges$ = new Subject();
    let flawedHttpCount = 0;

    // Flawed implementation from pre-remediation:
    const flawedSub = valueChanges$.pipe(
      switchMap(formVal =>
        of(formVal).pipe(
          debounceTime(400)
        )
      ),
      tap(() => flawedHttpCount++)
    ).subscribe();

    for (let i = 0; i < 100; i++) {
      valueChanges$.next({ i });
    }
    await sleep(50);
    flawedSub.unsubscribe();

    record(
      'Flawed Oracle Contrast: of(formVal).pipe(debounceTime(400)) incorrectly flushes 100 requests',
      flawedHttpCount === 100,
      `Observed ${flawedHttpCount} requests (flushes immediately on of() completion)`
    );
  }
}

// ============================================================================
// SUITE 2: HTTP TEARDOWN & MID-FLIGHT UNSUBSCRIPTION
// ============================================================================

function createMockHttpService() {
  const activeHttpSubscriptions = new Set();
  let nextHttpId = 1;

  function mockHttpGet(url, params) {
    return new Observable(sub => {
      const id = nextHttpId++;
      const info = { id, url, params, cancelled: false, completed: false };
      activeHttpSubscriptions.add(info);

      const timerId = setTimeout(() => {
        if (!info.cancelled) {
          info.completed = true;
          activeHttpSubscriptions.delete(info);
          if (params?.get && params.get('shouldError') === 'true') {
            const err = new Error(`HTTP ${params.get('statusCode') || 500} Error`);
            err.status = Number(params.get('statusCode')) || 500;
            sub.error(err);
          } else {
            sub.next({ status: 200, data: 'OK', id });
            sub.complete();
          }
        }
      }, 50); // 50ms server latency

      return () => {
        clearTimeout(timerId);
        info.cancelled = true;
        activeHttpSubscriptions.delete(info);
      };
    });
  }

  // Implementation matching http-recipe.service.ts
  function fetchWithResilientRetry(rate = 0.7, statusCode = 500, maxRetries = 3, baseDelayMs = 100, onAttempt) {
    let attemptCount = 0;

    const request$ = new Observable(sub => {
      attemptCount++;
      const currentAttempt = attemptCount;
      const startTime = Date.now();

      if (onAttempt) {
        onAttempt({ attempt: currentAttempt, timestamp: startTime, status: 'pending' });
      }

      const params = {
        get: (k) => {
          if (k === 'shouldError') return 'true';
          if (k === 'statusCode') return statusCode.toString();
          if (k === 'attempt') return currentAttempt.toString();
          return null;
        }
      };

      const httpSub = mockHttpGet('http://localhost:9000/api/simulate-error', params).subscribe({
        next: val => {
          if (onAttempt) onAttempt({ attempt: currentAttempt, timestamp: startTime, status: 'success' });
          sub.next(val);
          sub.complete();
        },
        error: err => {
          const errStatus = err.status || statusCode;
          if (onAttempt) onAttempt({ attempt: currentAttempt, timestamp: startTime, status: 'failed', statusCode: errStatus });
          sub.error(err);
        }
      });

      return () => {
        httpSub.unsubscribe();
      };
    });

    return request$.pipe(
      retry({
        count: maxRetries,
        delay: (err, retryAttempt) => {
          const status = err.status || statusCode;
          if (status >= 400 && status < 500) {
            throw err;
          }
          const delayTime = Math.pow(2, retryAttempt - 1) * baseDelayMs;
          return timer(delayTime);
        }
      }),
      catchError(err => {
        return of({
          fallback: true,
          status: 'recovered_fallback',
          statusCode: err.status || statusCode
        });
      })
    );
  }

  return {
    mockHttpGet,
    fetchWithResilientRetry,
    getActiveHttpSubscriptions: () => Array.from(activeHttpSubscriptions)
  };
}

async function testHttpTeardownAndUnsubscription() {
  console.log('\n' + '='.repeat(80));
  console.log('SUITE 2: HTTP Teardown & Mid-Flight Unsubscription');
  console.log('='.repeat(80));

  // Test 2.1: Mid-flight unsubscription during attempt 1 synchronously cancels underlying HTTP request
  {
    const service = createMockMock = createMockHttpService();
    const stream$ = service.fetchWithResilientRetry(1.0, 500, 3, 100);

    const sub = stream$.subscribe();

    // Verify attempt 1 HTTP request is active
    let active = service.getActiveHttpSubscriptions();
    const hadActiveReq = active.length === 1 && !active[0].cancelled;

    // Unsubscribe synchronously mid-flight
    sub.unsubscribe();

    active = service.getActiveHttpSubscriptions();
    const cleanlyAborted = active.length === 0;

    record(
      'F39.B6: fetchWithResilientRetry unsubscription synchronously aborts underlying HTTP request',
      hadActiveReq && cleanlyAborted,
      `Active before: ${hadActiveReq ? 1 : 0}, Active after unsubscription: ${active.length}`
    );
  }

  // Test 2.2: Mid-flight unsubscription during exponential backoff timer delay
  {
    const service = createMockHttpService();
    let attemptLogged = 0;

    const stream$ = service.fetchWithResilientRetry(1.0, 500, 3, 150, (log) => {
      attemptLogged = log.attempt;
    });

    const sub = stream$.subscribe();

    // Wait 60ms for attempt 1 to fail and enter backoff delay (150ms)
    await sleep(65);

    const attempt1Finished = attemptLogged === 1;
    let activeDuringDelay = service.getActiveHttpSubscriptions().length;

    // Now in backoff timer delay (between t=50ms and t=200ms). Unsubscribe mid-backoff!
    sub.unsubscribe();

    // Wait 200ms to verify attempt 2 is NEVER launched
    await sleep(200);

    const attempt2NeverLaunched = attemptLogged === 1;
    const zeroActiveAfterWait = service.getActiveHttpSubscriptions().length === 0;

    record(
      'F39.B6: Unsubscription during backoff timer delay cleanly aborts future retry attempts',
      attempt1Finished && attempt2NeverLaunched && zeroActiveAfterWait,
      `Logged attempts: ${attemptLogged} (attempt 2 never launched), Active HTTP: ${service.getActiveHttpSubscriptions().length}`
    );
  }

  // Test 2.3: Mid-flight unsubscription during attempt 2 in-flight execution
  {
    const service = createMockHttpService();
    let attempts = [];

    const stream$ = service.fetchWithResilientRetry(1.0, 500, 3, 50, (log) => {
      attempts.push({ attempt: log.attempt, status: log.status });
    });

    const sub = stream$.subscribe();

    // Timeline:
    // t=0..50ms: attempt 1 in flight -> fails at t=50ms
    // t=50..100ms: backoff delay (50ms)
    // t=100ms: attempt 2 launches -> in flight until t=150ms
    await sleep(120);

    let activeDuringAttempt2 = service.getActiveHttpSubscriptions();
    const attempt2InFlight = activeDuringAttempt2.length === 1 && activeDuringAttempt2[0].id === 2;

    // Unsubscribe during attempt 2 in flight
    sub.unsubscribe();

    const activeAfterSub2Cancel = service.getActiveHttpSubscriptions().length;

    // Wait 150ms to verify attempt 3 is never triggered
    await sleep(150);

    const maxAttemptReached = Math.max(...attempts.map(a => a.attempt));
    const cleanFinalState = maxAttemptReached === 2 && service.getActiveHttpSubscriptions().length === 0;

    record(
      'F39.B6: Unsubscription during attempt 2 cleanly aborts request #2 and cancels retry pipeline',
      attempt2InFlight && cleanFinalState,
      `Attempt 2 was in-flight: ${attempt2InFlight}, Max attempt launched: ${maxAttemptReached}`
    );
  }

  // Test 2.4: Component unmounting / ngOnDestroy() cancels pending retry loops and parallel aggregation
  {
    const service = createMockHttpService();

    // Mock component lifecycle
    class MockHttpPatternsComponent {
      constructor() {
        this.retrySub = null;
        this.parallelSub = null;
        this.isDestroyed = false;
        this.stateUpdatesAfterDestroy = 0;
      }

      startRetry() {
        this.retrySub = service.fetchWithResilientRetry(1.0, 500, 3, 100).subscribe({
          next: () => { if (this.isDestroyed) this.stateUpdatesAfterDestroy++; },
          error: () => { if (this.isDestroyed) this.stateUpdatesAfterDestroy++; }
        });
      }

      startParallel() {
        const course$ = service.mockHttpGet('http://localhost:9000/api/courses/1');
        const slow$ = service.mockHttpGet('http://localhost:9000/api/slow');
        this.parallelSub = combineLatest([course$, slow$]).subscribe({
          next: () => { if (this.isDestroyed) this.stateUpdatesAfterDestroy++; }
        });
      }

      ngOnDestroy() {
        this.isDestroyed = true;
        this.retrySub?.unsubscribe();
        this.parallelSub?.unsubscribe();
      }
    }

    const component = new MockHttpPatternsComponent();
    component.startRetry();
    component.startParallel();

    // 1 retry request + 2 parallel requests (course + slow) = 3 active HTTP connections
    let initialActive = service.getActiveHttpSubscriptions();
    const threeActive = initialActive.length === 3;

    // Destroy component mid-flight
    component.ngOnDestroy();

    // All 3 connections should be synchronously aborted
    let activeAfterDestroy = service.getActiveHttpSubscriptions();
    const zeroActive = activeAfterDestroy.length === 0;

    // Wait 150ms to ensure no callbacks execute post-destroy
    await sleep(150);

    const noZombieUpdates = component.stateUpdatesAfterDestroy === 0;

    record(
      'Component ngOnDestroy(): Cleanly aborts all active retry loops and parallel HTTP requests',
      threeActive && zeroActive && noZombieUpdates,
      `Active before destroy: ${initialActive.length}, Active after destroy: ${activeAfterDestroy.length}, Zombie updates: ${component.stateUpdatesAfterDestroy}`
    );
  }
}

// ============================================================================
// MAIN RUNNER
// ============================================================================

async function runAll() {
  await testDebounceCoalescing();
  await testHttpTeardownAndUnsubscription();

  console.log('\n' + '='.repeat(80));
  console.log(`TOTAL: ${results.passed} PASSED, ${results.failed} FAILED`);
  console.log('='.repeat(80));

  process.exit(results.failed > 0 ? 1 : 0);
}

runAll().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(2);
});
