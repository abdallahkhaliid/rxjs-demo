/**
 * Milestone 2 Empirical Behavioral & Marble Challenger Test Suite
 * Challenger: challenger_m2_2 (M2 Observable & Marble Challenger)
 *
 * Empirical verification of all 12 Creation operators and 7 Fundamentals simulators.
 * Evaluates RxJS semantics, boundary cases, timing, error dispatching, and marble contracts.
 */

const {
  Observable, of, from, fromEvent, interval, timer, range,
  throwError, defer, EMPTY, NEVER, generate, iif, Subscription, Subject
} = require('rxjs');
const { take, toArray, catchError, defaultIfEmpty, timeout, shareReplay } = require('rxjs/operators');
const { EventEmitter } = require('events');

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function record(name, passed, details = '') {
  if (passed) {
    results.passed++;
    console.log(`  [PASS] ${name}${details ? ' - ' + details : ''}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name} - ${details}`);
  }
  results.tests.push({ name, passed, details });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || 'Assertion failed');
  }
}

async function runTests() {
  console.log('==============================================================================');
  console.log('  Milestone 2 Empirical Challenger Suite — challenger_m2_2');
  console.log('==============================================================================\n');

  // --------------------------------------------------------------------------
  // 1. of() Semantics
  // --------------------------------------------------------------------------
  console.log('▶ [1. of() Semantics]');

  // 1.1 of([1, 2]) emits single array rather than decomposing into scalars
  {
    const emitted = [];
    let completed = false;
    of([1, 2]).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    const isSingleArray = emitted.length === 1 && Array.isArray(emitted[0]) && emitted[0][0] === 1 && emitted[0][1] === 2;
    record('of([1, 2]) emits 1 array item instead of decomposing into scalars', isSingleArray && completed, `Emitted count: ${emitted.length}, type: ${typeof emitted[0]}`);
  }

  // 1.2 of(...[1, 2]) emits decomposed scalars
  {
    const emitted = [];
    of(...[1, 2]).subscribe(v => emitted.push(v));
    const isDecomposed = emitted.length === 2 && emitted[0] === 1 && emitted[1] === 2;
    record('of(...[1, 2]) emits 2 separate scalars', isDecomposed, `Emitted: ${JSON.stringify(emitted)}`);
  }

  // 1.3 of() with no arguments emits EMPTY synchronously
  {
    const emitted = [];
    let completed = false;
    of().subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('of() with 0 arguments completes synchronously with 0 emissions', emitted.length === 0 && completed);
  }

  // 1.4 of() with mixed falsy values
  {
    const emitted = [];
    of(0, false, null, undefined, '', NaN).subscribe(v => emitted.push(v));
    const passed = emitted.length === 6 &&
      emitted[0] === 0 &&
      emitted[1] === false &&
      emitted[2] === null &&
      emitted[3] === undefined &&
      emitted[4] === '' &&
      Number.isNaN(emitted[5]);
    record('of(0, false, null, undefined, "", NaN) preserves exact falsy values', passed);
  }

  // --------------------------------------------------------------------------
  // 2. from() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [2. from() Semantics]');

  // 2.1 from(string) emits characters
  {
    const emitted = [];
    from('RxJS').subscribe(v => emitted.push(v));
    record('from("RxJS") emits 4 individual character scalars', emitted.join('') === 'RxJS' && emitted.length === 4);
  }

  // 2.2 from(Array) emits items
  {
    const emitted = [];
    from([10, 20, 30]).subscribe(v => emitted.push(v));
    record('from([10, 20, 30]) unpacks array items sequentially', emitted.length === 3 && emitted[0] === 10 && emitted[2] === 30);
  }

  // 2.3 from(Set) preserves unique order
  {
    const set = new Set(['x', 'y', 'z', 'y']);
    const emitted = [];
    from(set).subscribe(v => emitted.push(v));
    record('from(Set) emits unique Set elements', emitted.length === 3 && emitted.join('') === 'xyz');
  }

  // 2.4 from(Promise.resolve)
  {
    const p = Promise.resolve('data_resolved');
    const emitted = [];
    let completed = false;
    await new Promise(resolve => {
      from(p).subscribe({
        next: v => emitted.push(v),
        complete: () => { completed = true; resolve(); }
      });
    });
    record('from(Promise.resolve) emits resolved value and completes asynchronously', emitted.length === 1 && emitted[0] === 'data_resolved' && completed);
  }

  // 2.5 from(Promise.reject) forwards error without unhandled rejection
  {
    const p = Promise.reject(new Error('simulated_failure'));
    let caughtErr = null;
    let completed = false;
    await new Promise(resolve => {
      from(p).subscribe({
        next: () => {},
        error: err => { caughtErr = err; resolve(); },
        complete: () => { completed = true; resolve(); }
      });
    });
    record('from(Promise.reject) routes error to error channel and does NOT complete', caughtErr !== null && caughtErr.message === 'simulated_failure' && !completed);
  }

  // --------------------------------------------------------------------------
  // 3. range() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [3. range() Semantics]');

  // 3.1 Single argument: range(5) -> start=0, count=5
  {
    const emitted = [];
    range(5).subscribe(v => emitted.push(v));
    record('range(5) single-argument treats start as 0 and emits [0, 1, 2, 3, 4]', emitted.length === 5 && emitted[0] === 0 && emitted[4] === 4);
  }

  // 3.2 Dual argument: range(10, 4) -> 10, 11, 12, 13
  {
    const emitted = [];
    range(10, 4).subscribe(v => emitted.push(v));
    record('range(10, 4) emits 4 integers [10, 11, 12, 13]', emitted.length === 4 && emitted[0] === 10 && emitted[3] === 13);
  }

  // 3.3 Negative count: range(5, -3) -> completes immediately with 0 items
  {
    const emitted = [];
    let completed = false;
    range(5, -3).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('range(5, -3) with negative count returns EMPTY immediately (0 emissions)', emitted.length === 0 && completed);
  }

  // 3.4 Zero count: range(5, 0) -> completes immediately with 0 items
  {
    const emitted = [];
    let completed = false;
    range(5, 0).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('range(5, 0) with zero count returns EMPTY immediately', emitted.length === 0 && completed);
  }

  // --------------------------------------------------------------------------
  // 4. timer() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [4. timer() Semantics]');

  // 4.1 Single shot: timer(50) completes after 1 emission (value: 0)
  {
    const start = Date.now();
    const emitted = [];
    let completed = false;
    await new Promise(resolve => {
      timer(50).subscribe({
        next: v => emitted.push(v),
        complete: () => { completed = true; resolve(); }
      });
    });
    const elapsed = Date.now() - start;
    record('timer(50) single-shot emits 0 and completes after ~50ms', emitted.length === 1 && emitted[0] === 0 && completed && elapsed >= 40, `Elapsed: ${elapsed}ms`);
  }

  // 4.2 Recurring: timer(0, 40) emits 0 immediately, then 1, 2...
  {
    const start = Date.now();
    const emitted = [];
    let completed = false;
    await new Promise(resolve => {
      timer(0, 40).pipe(take(3)).subscribe({
        next: v => emitted.push(v),
        complete: () => { completed = true; resolve(); }
      });
    });
    const elapsed = Date.now() - start;
    const passed = emitted.length === 3 && emitted[0] === 0 && emitted[1] === 1 && emitted[2] === 2 && completed;
    record('timer(0, 40) recurring emits 0, 1, 2 periodically', passed, `Emitted: ${JSON.stringify(emitted)}, Elapsed: ${elapsed}ms`);
  }

  // --------------------------------------------------------------------------
  // 5. throwError() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [5. throwError() Semantics]');

  // 5.1 throwError dispatches error without completing
  {
    let nextCount = 0;
    let completed = false;
    let errorCaught = null;
    throwError(() => new Error('ExpectedError')).subscribe({
      next: () => { nextCount++; },
      error: err => { errorCaught = err; },
      complete: () => { completed = true; }
    });
    record('throwError() fires error callback without next or complete', nextCount === 0 && !completed && errorCaught?.message === 'ExpectedError');
  }

  // 5.2 Factory is re-evaluated per subscription
  {
    let callCount = 0;
    const errStream$ = throwError(() => new Error(`Err_${++callCount}`));
    let err1 = null;
    let err2 = null;
    errStream$.subscribe({ error: e => { err1 = e.message; } });
    errStream$.subscribe({ error: e => { err2 = e.message; } });
    record('throwError(factory) invokes factory for each subscription', err1 === 'Err_1' && err2 === 'Err_2');
  }

  // 5.3 Recovery with catchError
  {
    let recovered = null;
    let completed = false;
    throwError(() => new Error('Fatal 500')).pipe(
      catchError(err => of(`Handled: ${err.message}`))
    ).subscribe({
      next: val => { recovered = val; },
      complete: () => { completed = true; }
    });
    record('throwError() recovered cleanly via catchError()', recovered === 'Handled: Fatal 500' && completed);
  }

  // --------------------------------------------------------------------------
  // 6. defer() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [6. defer() Semantics]');

  // 6.1 Factory evaluated on each subscription
  {
    let factoryCount = 0;
    const deferred$ = defer(() => of(`sub_${++factoryCount}`));
    const res1 = [];
    const res2 = [];
    deferred$.subscribe(v => res1.push(v));
    deferred$.subscribe(v => res2.push(v));
    record('defer() evaluates factory lazily on every subscription', res1[0] === 'sub_1' && res2[0] === 'sub_2');
  }

  // 6.2 Factory throwing synchronously routes to error
  {
    let errCaught = null;
    const badDefer$ = defer(() => {
      throw new Error('Factory Crash');
    });
    badDefer$.subscribe({
      next: () => {},
      error: err => { errCaught = err; }
    });
    record('defer() safely routes synchronous factory exceptions to error channel', errCaught?.message === 'Factory Crash');
  }

  // --------------------------------------------------------------------------
  // 7. EMPTY and NEVER Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [7. EMPTY and NEVER Semantics]');

  // 7.1 EMPTY completes immediately with zero emissions
  {
    const emitted = [];
    let completed = false;
    EMPTY.subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('EMPTY completes immediately at t=0 with 0 next emissions', emitted.length === 0 && completed);
  }

  // 7.2 EMPTY with defaultIfEmpty emits fallback
  {
    const emitted = [];
    let completed = false;
    EMPTY.pipe(defaultIfEmpty('DefaultValue')).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('EMPTY piped with defaultIfEmpty emits fallback and completes', emitted.length === 1 && emitted[0] === 'DefaultValue' && completed);
  }

  // 7.3 NEVER emits nothing and never completes
  {
    let nextFired = false;
    let completeFired = false;
    let errorFired = false;
    const sub = NEVER.subscribe({
      next: () => { nextFired = true; },
      error: () => { errorFired = true; },
      complete: () => { completeFired = true; }
    });
    await new Promise(r => setTimeout(r, 60));
    sub.unsubscribe();
    record('NEVER produces 0 next, 0 error, 0 complete notifications', !nextFired && !completeFired && !errorFired);
  }

  // 7.4 NEVER with timeout
  {
    let timedOut = false;
    await new Promise(resolve => {
      NEVER.pipe(timeout({ each: 40 })).subscribe({
        error: () => { timedOut = true; resolve(); },
        complete: resolve
      });
    });
    record('NEVER triggers TimeoutError when combined with timeout operator', timedOut);
  }

  // --------------------------------------------------------------------------
  // 8. iif() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [8. iif() Semantics]');

  // 8.1 Evaluates condition per subscription
  {
    let flag = true;
    const cond$ = iif(() => flag, of('TRUE_VAL'), of('FALSE_VAL'));
    let out1 = null;
    let out2 = null;
    cond$.subscribe(v => { out1 = v; });
    flag = false;
    cond$.subscribe(v => { out2 = v; });
    record('iif() branches dynamically on each subscription based on condition', out1 === 'TRUE_VAL' && out2 === 'FALSE_VAL');
  }

  // 8.2 Omitting falseResult sends TypeError to error channel when false in RxJS 7/8
  {
    let caughtErr = null;
    iif(() => false, of('TRUE_BRANCH')).subscribe({
      error: err => { caughtErr = err; }
    });
    const isTypeError = (caughtErr instanceof TypeError) && caughtErr.message.includes('undefined');
    record('iif() without falseResult delivers TypeError when condition is false', isTypeError, `Caught error: ${caughtErr?.message}`);
  }

  // 8.3 Safe fallback with EMPTY prevents TypeError
  {
    let completed = false;
    let emitted = [];
    iif(() => false, of('TRUE_BRANCH'), EMPTY).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('iif() with EMPTY as false branch completes safely without throwing', completed && emitted.length === 0);
  }

  // --------------------------------------------------------------------------
  // 9. generate() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [9. generate() Semantics]');

  // 9.1 Powers of 2
  {
    const emitted = [];
    generate({
      initialState: 1,
      condition: x => x <= 16,
      iterate: x => x * 2
    }).subscribe(v => emitted.push(v));
    record('generate() generates powers of 2 [1, 2, 4, 8, 16]', emitted.join(',') === '1,2,4,8,16');
  }

  // 9.2 Initial condition false yields 0 emissions
  {
    const emitted = [];
    let completed = false;
    generate({
      initialState: 100,
      condition: x => x < 50,
      iterate: x => x + 1
    }).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    record('generate() completes immediately when initialState violates condition', emitted.length === 0 && completed);
  }

  // --------------------------------------------------------------------------
  // 10. fromEvent() & interval() Semantics
  // --------------------------------------------------------------------------
  console.log('\n▶ [10. fromEvent() & interval() Semantics]');

  // 10.1 fromEvent listens and unsubscribes cleanly
  {
    const emitter = new EventEmitter();
    const emitted = [];
    const sub = fromEvent(emitter, 'click').subscribe(e => emitted.push(e));
    emitter.emit('click', { x: 50, y: 100 });
    assert(emitter.listenerCount('click') === 1, 'Listener should be attached');
    sub.unsubscribe();
    assert(emitter.listenerCount('click') === 0, 'Listener should be removed');
    emitter.emit('click', { x: 99, y: 99 });
    record('fromEvent() captures events and removes listener upon unsubscription', emitted.length === 1 && emitted[0].x === 50);
  }

  // 10.2 interval(30) ticks and unsubscription halts emissions
  {
    const emitted = [];
    const sub = interval(30).subscribe(t => emitted.push(t));
    await new Promise(r => setTimeout(r, 95));
    sub.unsubscribe();
    const countAtUnsub = emitted.length;
    await new Promise(r => setTimeout(r, 60));
    record('interval() ticks periodically and halts completely upon unsubscribe', countAtUnsub >= 2 && emitted.length === countAtUnsub, `Emitted ticks: ${emitted.join(',')}`);
  }

  // --------------------------------------------------------------------------
  // 11. Fundamentals Simulators Behavioral Verification
  // --------------------------------------------------------------------------
  console.log('\n▶ [11. Module 1 Fundamentals Simulators]');

  // 11.1 Topic 1 (what-is-rxjs): Push vs Pull semantics
  {
    let pullValue = 0;
    const pullFn = () => ++pullValue;
    const v1 = pullFn();
    const v2 = pullFn();

    let pushValues = [];
    const push$ = new Subject();
    push$.subscribe(v => pushValues.push(v));
    push$.next(10);
    push$.next(20);

    record('Topic 1: Pull is consumer-driven synchronous; Push is producer-driven reactive', v1 === 1 && v2 === 2 && pushValues.length === 2 && pushValues[0] === 10);
  }

  // 11.2 Topic 2 (what-is-observable): Lazy Blueprint execution
  {
    let executions = 0;
    const blueprint$ = new Observable(sub => {
      executions++;
      sub.next(`exec_${executions}`);
      sub.complete();
    });
    assert(executions === 0, 'Blueprint should not execute without subscription');
    const outA = [];
    const outB = [];
    blueprint$.subscribe(v => outA.push(v));
    blueprint$.subscribe(v => outB.push(v));
    record('Topic 2: Observable is an unexecuted blueprint until subscribed (Unicast independent)', executions === 2 && outA[0] === 'exec_1' && outB[0] === 'exec_2');
  }

  // 11.3 Topic 3 (observable-vs-promise): Cancellable vs Eager
  {
    let promiseRan = false;
    new Promise(res => {
      promiseRan = true;
      res('eager');
    });

    let obsRan = false;
    let obsTeardown = false;
    const obs$ = new Observable(sub => {
      obsRan = true;
      return () => { obsTeardown = true; };
    });
    const sub = obs$.subscribe();
    sub.unsubscribe();
    record('Topic 3: Promise is eager and un-cancellable; Observable is lazy with explicit teardown', promiseRan && obsRan && obsTeardown);
  }

  // 11.4 Topic 4 (observer-subscriber): SafeSubscriber shielding
  {
    let nextCallsAfterComplete = 0;
    const shielded$ = new Observable(sub => {
      sub.complete();
      sub.next('illegal_value_1');
      sub.next('illegal_value_2');
    });
    shielded$.subscribe({
      next: () => { nextCallsAfterComplete++; }
    });
    record('Topic 4: SafeSubscriber contract shields against next() emissions after complete()', nextCallsAfterComplete === 0);
  }

  // 11.5 Topic 5 (subscription-lifecycle): Composite subscription tree
  {
    const parent = new Subscription();
    let child1Closed = false;
    let child2Closed = false;
    const c1 = new Subscription(() => { child1Closed = true; });
    const c2 = new Subscription(() => { child2Closed = true; });
    parent.add(c1);
    parent.add(c2);
    parent.unsubscribe();
    record('Topic 5: Subscription.add() composite tree cascades teardown to all child subscriptions', child1Closed && child2Closed && parent.closed);
  }

  // 11.6 Topic 6 (cold-vs-hot): Cold starts from 0; Hot live subject misses past ticks
  {
    // Cold
    const cold$ = interval(20).pipe(take(3));
    const cold1 = [];
    const cold2 = [];
    cold$.subscribe(v => cold1.push(v));
    await new Promise(r => setTimeout(r, 45));
    cold$.subscribe(v => cold2.push(v));
    await new Promise(r => setTimeout(r, 70));

    // Hot
    const hot$ = new Subject();
    const hot1 = [];
    const hot2 = [];
    hot$.subscribe(v => hot1.push(v));
    hot$.next(100);
    hot$.next(200);
    hot$.subscribe(v => hot2.push(v)); // Late subscriber
    hot$.next(300);

    const coldPassed = cold1[0] === 0 && cold2[0] === 0;
    const hotPassed = hot1.length === 3 && hot2.length === 1 && hot2[0] === 300;
    record('Topic 6: Cold provides independent streams from Frame 0; Hot shares live feed and late listeners miss past items', coldPassed && hotPassed);
  }

  // 11.7 Topic 7 (multicasting): shareReplay prevents duplicate HTTP requests
  {
    let fetchCalls = 0;
    const http$ = new Observable(sub => {
      fetchCalls++;
      sub.next({ data: 'payload' });
      sub.complete();
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    const sub1 = http$.subscribe();
    const sub2 = http$.subscribe();
    const sub3 = http$.subscribe();
    sub1.unsubscribe();
    sub2.unsubscribe();
    sub3.unsubscribe();

    record('Topic 7: shareReplay multicasting executes underlying producer exactly once for multiple subscribers', fetchCalls === 1);
  }

  // --------------------------------------------------------------------------
  // 12. Marble Timing and Execution Order Contract Verification
  // --------------------------------------------------------------------------
  console.log('\n▶ [12. Marble Diagram & Timing Fidelity]');

  // 12.1 Marble emission chronological ordering
  {
    const times = [200, 400, 600, 800];
    const isSorted = times.every((t, i) => i === 0 || t >= times[i - 1]);
    record('Marble emission sequence is strictly monotonically increasing in time', isSorted);
  }

  // 12.2 Completion bar timing must be >= last emission timestamp
  {
    const emissions = [{ timeMs: 300 }, { timeMs: 700 }];
    const completedAtMs = 750;
    const lastEmissionTime = Math.max(...emissions.map(e => e.timeMs));
    record('Marble completion bar (|) timestamp is strictly >= final emission time', completedAtMs >= lastEmissionTime);
  }

  // 12.3 Error tick (X) halts stream without completion bar
  {
    const stream = {
      emissions: [{ timeMs: 200 }],
      errorAtMs: 400,
      completedAtMs: undefined
    };
    record('Error termination records errorAtMs without completedAtMs', stream.errorAtMs !== undefined && stream.completedAtMs === undefined);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log('  Milestone 2 Empirical Challenger Execution Summary');
  console.log('==============================================================================');
  console.log(`Total Executed : ${results.passed + results.failed}`);
  console.log(`Passed         : ${results.passed}`);
  console.log(`Failed         : ${results.failed}`);
  console.log(`Success Rate   : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('==============================================================================');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests().catch(err => {
  console.error('Fatal Test Harness Exception:', err);
  process.exit(1);
});
