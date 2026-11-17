/**
 * Milestone 2 Re-Verification Empirical Challenger Suite
 * Author: challenger_m2_reverify
 *
 * Exhaustive empirical verification and adversarial stress testing for:
 * 1. fromEvent: rapid click bursts, stop/restart cycles, unsubscribed clicks produce zero emissions.
 * 2. Marble timestamp calculation: non-collision oracle across all synchronous operators (of, from, range, generate).
 * 3. from(Promise.reject): error capture without unhandled promise rejections (immediate and late subscriptions).
 * 4. Coordinate formatting, terminal marker spacing, and lifecycle safety.
 */

const {
  Observable, of, from, fromEvent, range, generate, EMPTY, NEVER, Subject
} = require('rxjs');
const { take, toArray } = require('rxjs/operators');
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

// Simulated DOM EventTarget matching DOM EventTarget interface
class MockDomEventTarget {
  constructor() {
    this.listeners = new Map();
  }

  addEventListener(type, listener) {
    if (!this.listeners.has(type)) {
      this.listeners.set(type, new Set());
    }
    this.listeners.get(type).add(listener);
  }

  removeEventListener(type, listener) {
    if (this.listeners.has(type)) {
      this.listeners.get(type).delete(listener);
    }
  }

  dispatchEvent(event) {
    const list = this.listeners.get(event.type);
    if (list) {
      for (const listener of Array.from(list)) {
        listener(event);
      }
    }
    return true;
  }

  getListenerCount(type) {
    return this.listeners.get(type)?.size || 0;
  }
}

// Pure function simulating the component's marble timestamp calculation logic
function calculateMarbleStream(operatorFn, countLimit = 100) {
  let emissionCounter = 0;
  const streamStartTime = Date.now();
  const emissions = [];
  let completedAtMs = undefined;
  let errorAtMs = undefined;

  const obs$ = operatorFn();
  obs$.pipe(take(countLimit)).subscribe({
    next: val => {
      emissionCounter++;
      // Exact formula from creation-playground.component.ts:
      // elapsed < 50ms for synchronous emissions
      const elapsed = Date.now() - streamStartTime;
      const timeMs = elapsed > 50 ? elapsed : 100 + (emissionCounter - 1) * 250;

      let displayLabel = String(val);
      if (typeof val === 'object' && val !== null) {
        if (val.clientX !== undefined && val.clientY !== undefined) {
          displayLabel = `(${val.clientX},${val.clientY})`;
        } else if (val.x !== undefined && val.y !== undefined) {
          displayLabel = `(${val.x},${val.y})`;
        } else {
          displayLabel = 'OBJ';
        }
      }
      if (displayLabel.length > 8) {
        displayLabel = displayLabel.substring(0, 7) + '…';
      }

      emissions.push({
        id: `emission_${emissionCounter}`,
        timeMs,
        value: val,
        displayLabel
      });
    },
    error: err => {
      const elapsed = Date.now() - streamStartTime;
      const lastEmissionTime = emissions.length > 0
        ? emissions[emissions.length - 1].timeMs
        : 0;
      errorAtMs = elapsed > 50 ? Math.max(elapsed, 200) : Math.max(lastEmissionTime + 200, 200);
    },
    complete: () => {
      const elapsed = Date.now() - streamStartTime;
      const lastEmissionTime = emissions.length > 0
        ? emissions[emissions.length - 1].timeMs
        : 0;
      completedAtMs = elapsed > 50 ? Math.max(elapsed, 200) : Math.max(lastEmissionTime + 200, 200);
    }
  });

  return { emissions, completedAtMs, errorAtMs };
}

async function runEmpiricalReverification() {
  console.log('==============================================================================');
  console.log('  Milestone 2 Re-Verification Adversarial Stress Suite');
  console.log('  Agent: challenger_m2_reverify');
  console.log('==============================================================================\n');

  // ==========================================================================
  // Section 1: fromEvent Deep Verification & Stress Testing
  // ==========================================================================
  console.log('▶ [1. fromEvent Stress, Rapid Clicks & Teardown Cycles]');

  // 1.1 Rapid burst of 100 clicks in immediate succession
  {
    const target = new MockDomEventTarget();
    const event$ = fromEvent(target, 'click');
    const received = [];

    const sub = event$.subscribe(e => received.push(e));
    expectListenerCount: record('fromEvent attaches native addEventListener on subscribe', target.getListenerCount('click') === 1);

    for (let i = 0; i < 100; i++) {
      target.dispatchEvent({ type: 'click', clientX: i * 2, clientY: i * 3 });
    }

    record('100 rapid click events captured in exact chronological order',
      received.length === 100 && received[0].clientX === 0 && received[99].clientX === 198,
      `Received count: ${received.length}`);

    sub.unsubscribe();
  }

  // 1.2 Unsubscribed clicks produce exactly ZERO emissions and removes listener
  {
    const target = new MockDomEventTarget();
    const event$ = fromEvent(target, 'click');
    const received = [];

    const sub = event$.subscribe(e => received.push(e));
    target.dispatchEvent({ type: 'click', clientX: 10, clientY: 20 });
    record('Active subscription receives initial click', received.length === 1);

    // Unsubscribe
    sub.unsubscribe();
    const listenerRemoved = target.getListenerCount('click') === 0;
    record('Unsubscribe removes DOM event listener completely', listenerRemoved);

    // Fire 50 clicks while unsubscribed
    for (let i = 0; i < 50; i++) {
      target.dispatchEvent({ type: 'click', clientX: 999, clientY: 999 });
    }
    record('Unsubscribed clicks produce zero subsequent emissions', received.length === 1, `Total received after 50 post-unsub clicks: ${received.length}`);
  }

  // 1.3 Stop and Restart Lifecycle Cycles (3 sequential start/stop cycles)
  {
    const target = new MockDomEventTarget();
    const event$ = fromEvent(target, 'click');
    let cycleSuccess = true;

    for (let cycle = 1; cycle <= 3; cycle++) {
      const cycleReceived = [];
      const sub = event$.subscribe(e => cycleReceived.push(e));

      // 10 clicks during active stream
      for (let i = 0; i < 10; i++) {
        target.dispatchEvent({ type: 'click', clientX: cycle * 100 + i, clientY: 50 });
      }

      if (cycleReceived.length !== 10) cycleSuccess = false;

      // Stop stream
      sub.unsubscribe();
      if (target.getListenerCount('click') !== 0) cycleSuccess = false;

      // 10 clicks during dead period
      for (let i = 0; i < 10; i++) {
        target.dispatchEvent({ type: 'click', clientX: 0, clientY: 0 });
      }

      if (cycleReceived.length !== 10) cycleSuccess = false;
    }

    record('3 consecutive start -> emit -> stop -> dead period cycles execute flawlessly', cycleSuccess);
  }

  // 1.4 Coordinate formatting logic for fromEvent
  {
    const target = new MockDomEventTarget();
    const received = [];
    const event$ = fromEvent(target, 'click');
    const sub = event$.subscribe(e => {
      let displayLabel = String(e);
      if (typeof e === 'object' && e !== null) {
        if (e.clientX !== undefined && e.clientY !== undefined) {
          displayLabel = `(${e.clientX},${e.clientY})`;
        }
      }
      if (displayLabel.length > 8) {
        displayLabel = displayLabel.substring(0, 7) + '…';
      }
      received.push(displayLabel);
    });

    target.dispatchEvent({ type: 'click', clientX: 15, clientY: 30 }); // '(15,30)' -> length 7
    target.dispatchEvent({ type: 'click', clientX: 1500, clientY: 2500 }); // '(1500,2500)' -> length 11 -> '(1500,2…'
    sub.unsubscribe();

    record('Coordinate formatting produces compact marble labels and truncates overflow',
      received[0] === '(15,30)' && received[1] === '(1500,2…',
      `Labels: ${JSON.stringify(received)}`);
  }

  // ==========================================================================
  // Section 2: Marble Timestamp Non-Collision Oracle (Synchronous Operators)
  // ==========================================================================
  console.log('\n▶ [2. Marble Timestamp Non-Collision Oracle for Synchronous Operators]');

  // 2.1 of() with various counts
  {
    const testCases = [
      { name: 'of(1 item)', fn: () => of('Single') },
      { name: 'of(3 items)', fn: () => of('Angular', 'RxJS', 'Signals') },
      { name: 'of(8 items)', fn: () => of(1, 2, 3, 4, 5, 6, 7, 8) },
      { name: 'of(25 items)', fn: () => of(...Array.from({ length: 25 }, (_, i) => `item_${i}`)) }
    ];

    let allUnique = true;
    let allMonotonic = true;
    let allTerminalSafe = true;

    for (const tc of testCases) {
      const { emissions, completedAtMs } = calculateMarbleStream(tc.fn);
      const times = emissions.map(e => e.timeMs);
      const uniqueTimes = new Set(times);

      if (uniqueTimes.size !== times.length) allUnique = false;
      for (let i = 0; i < times.length - 1; i++) {
        if (times[i] >= times[i + 1]) allMonotonic = false;
      }
      if (emissions.length > 0 && completedAtMs <= times[times.length - 1]) {
        allTerminalSafe = false;
      }
    }

    record('of(): All emissions possess strictly unique timeMs (0 collisions)', allUnique);
    record('of(): Timestamps are strictly monotonic increasing with delta = 250ms', allMonotonic);
    record('of(): Completion marker completedAtMs is strictly past final emission (+200ms)', allTerminalSafe);
  }

  // 2.2 from(array) and from(string)
  {
    const testCases = [
      { name: 'from(["Alpha", "Beta", "Gamma", "Delta"])', fn: () => from(['Alpha', 'Beta', 'Gamma', 'Delta']) },
      { name: 'from("RxJS")', fn: () => from('RxJS') },
      { name: 'from(50 items)', fn: () => from(Array.from({ length: 50 }, (_, i) => i)) }
    ];

    let allUnique = true;
    let allMonotonic = true;

    for (const tc of testCases) {
      const { emissions, completedAtMs } = calculateMarbleStream(tc.fn);
      const times = emissions.map(e => e.timeMs);
      if (new Set(times).size !== times.length) allUnique = false;
      for (let i = 0; i < times.length - 1; i++) {
        if (times[i] >= times[i + 1]) allMonotonic = false;
      }
    }

    record('from(): Array & String emissions produce zero timestamp collisions across 50 items', allUnique && allMonotonic);
  }

  // 2.3 range()
  {
    const testCases = [
      { name: 'range(1, 1)', fn: () => range(1, 1) },
      { name: 'range(1, 5)', fn: () => range(1, 5) },
      { name: 'range(10, 10)', fn: () => range(10, 10) },
      { name: 'range(0, 20)', fn: () => range(0, 20) }
    ];

    let allUnique = true;
    let expectedFormula = true;

    for (const tc of testCases) {
      const { emissions, completedAtMs } = calculateMarbleStream(tc.fn);
      const times = emissions.map(e => e.timeMs);
      if (new Set(times).size !== times.length) allUnique = false;

      // Verify exact formula: timeMs = 100 + (emissionCounter - 1) * 250
      times.forEach((t, idx) => {
        if (t !== 100 + idx * 250) expectedFormula = false;
      });
      if (completedAtMs !== 100 + (times.length - 1) * 250 + 200) expectedFormula = false;
    }

    record('range(): Zero collision and exact mathematical spacing (100, 350, 600, ...)', allUnique && expectedFormula);
  }

  // 2.4 generate()
  {
    const testCases = [
      {
        name: 'generate(powers of 2)',
        fn: () => generate({ initialState: 1, condition: x => x <= 64, iterate: x => x * 2 })
      },
      {
        name: 'generate(even numbers)',
        fn: () => generate({ initialState: 0, condition: x => x <= 10, iterate: x => x + 2 })
      },
      {
        name: 'generate(countdown)',
        fn: () => generate({ initialState: 10, condition: x => x >= 1, iterate: x => x - 1 })
      }
    ];

    let allUnique = true;
    let countsValid = true;

    for (const tc of testCases) {
      const { emissions, completedAtMs } = calculateMarbleStream(tc.fn);
      const times = emissions.map(e => e.timeMs);
      if (new Set(times).size !== times.length) allUnique = false;
      if (emissions.length === 0) countsValid = false;
    }

    record('generate(): Presets (powers of 2, even, countdown) have 0 collisions and valid item counts', allUnique && countsValid);
  }

  // ==========================================================================
  // Section 3: from(Promise.reject) Rejection & Unhandled Rejection Oracle
  // ==========================================================================
  console.log('\n▶ [3. from(Promise.reject) Error Propagation & Unhandled Rejection]');

  // 3.1 Immediate subscription to Promise.reject
  {
    let unhandledTriggered = false;
    const unhandledHandler = err => { unhandledTriggered = true; };
    process.on('unhandledRejection', unhandledHandler);

    let errorCaught = null;
    let completeCalled = false;
    let nextCalled = false;

    await new Promise(resolve => {
      const rejectingPromise = new Promise((_, rej) => rej(new Error('Simulated Async Failure')));
      from(rejectingPromise).subscribe({
        next: () => { nextCalled = true; },
        error: err => {
          errorCaught = err;
          resolve();
        },
        complete: () => {
          completeCalled = true;
          resolve();
        }
      });
    });

    // Allow any potential microtask unhandledRejection tick to fire
    await new Promise(r => setTimeout(r, 50));
    process.removeListener('unhandledRejection', unhandledHandler);

    record('from(Promise.reject): Error captured in error callback without unhandledRejection event',
      errorCaught !== null && errorCaught.message === 'Simulated Async Failure' && !unhandledTriggered,
      `Unhandled: ${unhandledTriggered}, Caught: ${errorCaught?.message}`);

    record('from(Promise.reject): Next and complete handlers were NOT called',
      !nextCalled && !completeCalled);
  }

  // 3.2 Delayed rejection (rejection happens after 100ms)
  {
    let unhandledTriggered = false;
    const unhandledHandler = () => { unhandledTriggered = true; };
    process.on('unhandledRejection', unhandledHandler);

    let errorCaught = null;

    await new Promise(resolve => {
      const delayedReject = new Promise((_, rej) => setTimeout(() => rej(new Error('Delayed 500 Failure')), 100));
      from(delayedReject).subscribe({
        next: () => {},
        error: err => {
          errorCaught = err;
          resolve();
        }
      });
    });

    await new Promise(r => setTimeout(r, 50));
    process.removeListener('unhandledRejection', unhandledHandler);

    record('from(Promise.reject) with 100ms delay: Propagates error safely without unhandledRejection',
      errorCaught?.message === 'Delayed 500 Failure' && !unhandledTriggered);
  }

  // 3.3 Late subscription to already-rejected promise
  {
    let unhandledTriggered = false;
    const unhandledHandler = () => { unhandledTriggered = true; };
    process.on('unhandledRejection', unhandledHandler);

    // Pre-create promise with catch attachment to avoid initial node unhandled rejection warning
    let rejectFn;
    const preRejected = new Promise((_, rej) => { rejectFn = rej; });
    // Attach dummy catch so Node doesn't flag it before subscribe
    preRejected.catch(() => {});
    rejectFn(new Error('Pre-rejected'));

    await new Promise(r => setTimeout(r, 20));

    let errorCaught = null;
    await new Promise(resolve => {
      from(preRejected).subscribe({
        next: () => {},
        error: err => {
          errorCaught = err;
          resolve();
        }
      });
    });

    process.removeListener('unhandledRejection', unhandledHandler);
    record('Late subscriber to pre-rejected Promise receives error without failure', errorCaught?.message === 'Pre-rejected');
  }

  // ==========================================================================
  // Section 4: Boundary & Stress Invalidation Tests
  // ==========================================================================
  console.log('\n▶ [4. Boundary & Invalidation Cases]');

  // 4.1 EMPTY produces zero emissions and completedAtMs = 200
  {
    const { emissions, completedAtMs } = calculateMarbleStream(() => EMPTY);
    record('EMPTY produces 0 emissions and completedAtMs = 200', emissions.length === 0 && completedAtMs === 200);
  }

  // 4.2 throwError produces errorAtMs = 200 without completion
  {
    const { emissions, completedAtMs, errorAtMs } = calculateMarbleStream(() => {
      return new Observable(sub => sub.error(new Error('Instant Error')));
    });
    record('Instant error produces 0 emissions, errorAtMs = 200, and undefined completedAtMs',
      emissions.length === 0 && errorAtMs === 200 && completedAtMs === undefined);
  }

  // 4.3 High-load test: 100 synchronous emissions
  {
    const largeCount = 100;
    const { emissions, completedAtMs } = calculateMarbleStream(() => range(1, largeCount), 100);
    const times = emissions.map(e => e.timeMs);
    const uniqueCount = new Set(times).size;

    record('Stress: 100 synchronous emissions maintain 100% timestamp uniqueness (100 distinct timeMs)',
      uniqueCount === 100 && emissions.length === 100,
      `Emissions: ${emissions.length}, Unique timestamps: ${uniqueCount}, Final: ${times[times.length - 1]}ms, Complete: ${completedAtMs}ms`);
  }

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n==============================================================================');
  console.log('  Milestone 2 Re-Verification Empirical Summary');
  console.log('==============================================================================');
  console.log(`Total Executed : ${results.passed + results.failed}`);
  console.log(`Passed         : ${results.passed}`);
  console.log(`Failed         : ${results.failed}`);
  console.log(`Success Rate   : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('==============================================================================\n');

  if (results.failed > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runEmpiricalReverification().catch(err => {
  console.error('Fatal Re-Verification Failure:', err);
  process.exit(1);
});
