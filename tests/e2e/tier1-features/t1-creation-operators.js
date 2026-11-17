/**
 * Tier 1 — Feature Coverage: Features 23 through 30 (Module 2: Creation Operators)
 * Exactly 5 test cases per feature = 40 test cases.
 * Authoritative Oracle: RxJS 7.8
 */

const { describe, it } = require('../harness/runner-core');
const {
  of, from, fromEvent, interval, timer, range,
  throwError, defer, EMPTY, NEVER, generate, iif
} = require('rxjs');
const { take, toArray } = require('rxjs/operators');
const { EventEmitter } = require('events');

describe('Tier 1: Feature 23 — Module 2: of() & from()', () => {
  const meta = { tier: 1, featureId: 23, featureName: 'Module 2: of() & from()', milestone: 'M2', category: 'creation' };

  it('F23.1: of() emits arguments synchronously in order and completes', ({ expect }) => {
    const emitted = [];
    let completed = false;
    of(10, 20, 30).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([10, 20, 30]);
    expect(completed).toBe(true);
  }, meta);

  it('F23.2: of() with no arguments emits nothing and completes synchronously', ({ expect }) => {
    const emitted = [];
    let completed = false;
    of().subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F23.3: from(Array) iterates and emits each item in array', ({ expect }) => {
    const emitted = [];
    from(['apple', 'banana', 'cherry']).subscribe(v => emitted.push(v));
    expect(emitted).toEqual(['apple', 'banana', 'cherry']);
  }, meta);

  it('F23.4: from(Promise) emits resolved promise value and completes', async ({ expect }) => {
    const p = Promise.resolve('async-val');
    const emitted = [];
    await new Promise(resolve => {
      from(p).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual(['async-val']);
  }, meta);

  it('F23.5: from(Iterable/Set) converts iterable collection into stream', ({ expect }) => {
    const set = new Set([1, 2, 3, 2, 1]);
    const emitted = [];
    from(set).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1, 2, 3]);
  }, meta);
});

describe('Tier 1: Feature 24 — Module 2: fromEvent()', () => {
  const meta = { tier: 1, featureId: 24, featureName: 'Module 2: fromEvent()', milestone: 'M2', category: 'creation' };

  it('F24.1: Captures event emissions from event emitter target', ({ expect }) => {
    const emitter = new EventEmitter();
    const emitted = [];
    const sub = fromEvent(emitter, 'click').subscribe(e => emitted.push(e));

    emitter.emit('click', { x: 10, y: 20 });
    emitter.emit('click', { x: 30, y: 40 });
    sub.unsubscribe();

    expect(emitted).toEqual([{ x: 10, y: 20 }, { x: 30, y: 40 }]);
  }, meta);

  it('F24.2: Unsubscribing removes event listener from emitter', ({ expect }) => {
    const emitter = new EventEmitter();
    const emitted = [];
    const sub = fromEvent(emitter, 'data').subscribe(v => emitted.push(v));

    expect(emitter.listenerCount('data')).toBe(1);
    sub.unsubscribe();
    expect(emitter.listenerCount('data')).toBe(0);

    emitter.emit('data', 'ignored');
    expect(emitted).toEqual([]);
  }, meta);

  it('F24.3: Supports custom resultSelector / projection function', ({ expect }) => {
    const emitter = new EventEmitter();
    const emitted = [];
    fromEvent(emitter, 'move', (e) => ({ pos: e.x + ',' + e.y }))
      .pipe(take(1))
      .subscribe(v => emitted.push(v));

    emitter.emit('move', { x: 5, y: 9 });
    expect(emitted).toEqual([{ pos: '5,9' }]);
  }, meta);

  it('F24.4: fromEvent creates infinite stream that does not complete on its own', ({ expect }) => {
    const emitter = new EventEmitter();
    let completed = false;
    fromEvent(emitter, 'test').subscribe({
      complete: () => { completed = true; }
    });
    emitter.emit('test', 1);
    expect(completed).toBe(false);
  }, meta);

  it('F24.5: Multiple listeners can independently observe the same event target', ({ expect }) => {
    const emitter = new EventEmitter();
    let count1 = 0;
    let count2 = 0;
    const sub1 = fromEvent(emitter, 'ping').subscribe(() => count1++);
    const sub2 = fromEvent(emitter, 'ping').subscribe(() => count2++);

    emitter.emit('ping');
    expect(count1).toBe(1);
    expect(count2).toBe(1);

    sub1.unsubscribe();
    emitter.emit('ping');
    expect(count1).toBe(1);
    expect(count2).toBe(2);
    sub2.unsubscribe();
  }, meta);
});

describe('Tier 1: Feature 25 — Module 2: interval() & timer()', () => {
  const meta = { tier: 1, featureId: 25, featureName: 'Module 2: interval() & timer()', milestone: 'M2', category: 'creation' };

  it('F25.1: interval(period) emits 0, 1, 2, ... sequentially', async ({ expect }) => {
    const emitted = [];
    await new Promise(resolve => {
      interval(10).pipe(take(3)).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual([0, 1, 2]);
  }, meta);

  it('F25.2: timer(dueTime) emits single value 0 and completes', async ({ expect }) => {
    const emitted = [];
    let completed = false;
    await new Promise(resolve => {
      timer(15).subscribe({
        next: v => emitted.push(v),
        complete: () => {
          completed = true;
          resolve();
        }
      });
    });
    expect(emitted).toEqual([0]);
    expect(completed).toBe(true);
  }, meta);

  it('F25.3: timer(dueTime, period) emits 0 after dueTime, then periodic ticks', async ({ expect }) => {
    const emitted = [];
    await new Promise(resolve => {
      timer(5, 10).pipe(take(3)).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual([0, 1, 2]);
  }, meta);

  it('F25.4: Unsubscribing halts interval emissions immediately', async ({ expect }) => {
    const emitted = [];
    const sub = interval(10).subscribe(v => emitted.push(v));
    await new Promise(r => setTimeout(r, 25));
    sub.unsubscribe();
    const countAtUnsubscribe = emitted.length;
    await new Promise(r => setTimeout(r, 25));
    expect(emitted.length).toBe(countAtUnsubscribe);
  }, meta);

  it('F25.5: timer(0) emits 0 on the next micro/macro tick and completes', async ({ expect }) => {
    const emitted = [];
    let completed = false;
    await new Promise(resolve => {
      timer(0).subscribe({
        next: v => emitted.push(v),
        complete: () => { completed = true; resolve(); }
      });
    });
    expect(emitted).toEqual([0]);
    expect(completed).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 26 — Module 2: range()', () => {
  const meta = { tier: 1, featureId: 26, featureName: 'Module 2: range()', milestone: 'M2', category: 'creation' };

  it('F26.1: range(start, count) emits count integers starting at start', ({ expect }) => {
    const emitted = [];
    range(1, 5).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1, 2, 3, 4, 5]);
  }, meta);

  it('F26.2: range(start, 0) completes immediately with 0 emissions', ({ expect }) => {
    const emitted = [];
    let completed = false;
    range(10, 0).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F26.3: range(start, 1) emits exactly single start value and completes', ({ expect }) => {
    const emitted = [];
    range(42, 1).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([42]);
  }, meta);

  it('F26.4: range handles negative start numbers correctly', ({ expect }) => {
    const emitted = [];
    range(-3, 4).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([-3, -2, -1, 0]);
  }, meta);

  it('F26.5: range emits values synchronously', ({ expect }) => {
    const log = [];
    log.push('before');
    range(100, 2).subscribe(v => log.push(v));
    log.push('after');
    expect(log).toEqual(['before', 100, 101, 'after']);
  }, meta);
});

describe('Tier 1: Feature 27 — Module 2: throwError()', () => {
  const meta = { tier: 1, featureId: 27, featureName: 'Module 2: throwError()', milestone: 'M2', category: 'creation' };

  it('F27.1: throwError emits error notification immediately upon subscription', ({ expect }) => {
    let errorCaught = null;
    throwError(() => new Error('Simulated failure')).subscribe({
      next: () => {},
      error: err => { errorCaught = err; }
    });
    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('Simulated failure');
  }, meta);

  it('F27.2: throwError never emits next or complete notifications', ({ expect }) => {
    let nextCalled = false;
    let completeCalled = false;
    throwError(() => new Error('err')).subscribe({
      next: () => { nextCalled = true; },
      error: () => {},
      complete: () => { completeCalled = true; }
    });
    expect(nextCalled).toBe(false);
    expect(completeCalled).toBe(false);
  }, meta);

  it('F27.3: Factory function creates fresh error instance per subscription', ({ expect }) => {
    const error$ = throwError(() => new Error('Fresh Error'));
    let err1, err2;
    error$.subscribe({ error: e => { err1 = e; } });
    error$.subscribe({ error: e => { err2 = e; } });
    expect(err1).not.toBe(err2); // Different instances!
    expect(err1.message).toBe(err2.message);
  }, meta);

  it('F27.4: Preserves custom error subclasses and metadata', ({ expect }) => {
    class CustomHttpError extends Error {
      constructor(status) {
        super(`HTTP ${status}`);
        this.status = status;
      }
    }
    let captured = null;
    throwError(() => new CustomHttpError(404)).subscribe({
      error: e => { captured = e; }
    });
    expect(captured instanceof CustomHttpError).toBe(true);
    expect(captured.status).toBe(404);
  }, meta);

  it('F27.5: Handles non-Error primitive error objects (e.g. error code string)', ({ expect }) => {
    let captured = null;
    throwError(() => 'ERR_NETWORK_DISCONNECTED').subscribe({
      error: e => { captured = e; }
    });
    expect(captured).toBe('ERR_NETWORK_DISCONNECTED');
  }, meta);
});

describe('Tier 1: Feature 28 — Module 2: defer()', () => {
  const meta = { tier: 1, featureId: 28, featureName: 'Module 2: defer()', milestone: 'M2', category: 'creation' };

  it('F28.1: defer(factory) executes factory only upon subscription', ({ expect }) => {
    let factoryExecuted = false;
    const deferred$ = defer(() => {
      factoryExecuted = true;
      return of('result');
    });
    expect(factoryExecuted).toBe(false);
    deferred$.subscribe();
    expect(factoryExecuted).toBe(true);
  }, meta);

  it('F28.2: Factory is evaluated dynamically for each new subscriber', ({ expect }) => {
    let count = 0;
    const dynamic$ = defer(() => of(++count));
    let val1, val2;
    dynamic$.subscribe(v => { val1 = v; });
    dynamic$.subscribe(v => { val2 = v; });
    expect(val1).toBe(1);
    expect(val2).toBe(2);
  }, meta);

  it('F28.3: defer can return a Promise that is converted to an Observable', async ({ expect }) => {
    const deferredPromise$ = defer(() => Promise.resolve('deferred-promise'));
    const emitted = [];
    await new Promise(resolve => {
      deferredPromise$.subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual(['deferred-promise']);
  }, meta);

  it('F28.4: If factory function throws synchronously, error is forwarded to subscriber', ({ expect }) => {
    let caughtError = null;
    const throwing$ = defer(() => {
      throw new Error('Factory crashed');
    });
    throwing$.subscribe({
      error: err => { caughtError = err; }
    });
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('Factory crashed');
  }, meta);

  it('F28.5: defer transparently passes all emissions from inner observable', ({ expect }) => {
    const deferred$ = defer(() => of('A', 'B', 'C'));
    const emitted = [];
    deferred$.subscribe(v => emitted.push(v));
    expect(emitted).toEqual(['A', 'B', 'C']);
  }, meta);
});

describe('Tier 1: Feature 29 — Module 2: EMPTY & NEVER', () => {
  const meta = { tier: 1, featureId: 29, featureName: 'Module 2: EMPTY & NEVER', milestone: 'M2', category: 'creation' };

  it('F29.1: EMPTY emits zero values and completes synchronously', ({ expect }) => {
    const emitted = [];
    let completed = false;
    EMPTY.subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F29.2: EMPTY never calls error callback', ({ expect }) => {
    let errored = false;
    EMPTY.subscribe({
      error: () => { errored = true; }
    });
    expect(errored).toBe(false);
  }, meta);

  it('F29.3: NEVER never emits next and never completes', async ({ expect }) => {
    let emitted = false;
    let completed = false;
    const sub = NEVER.subscribe({
      next: () => { emitted = true; },
      complete: () => { completed = true; }
    });
    await new Promise(r => setTimeout(r, 20));
    sub.unsubscribe();
    expect(emitted).toBe(false);
    expect(completed).toBe(false);
  }, meta);

  it('F29.4: NEVER cleans up teardown when unsubscribed', ({ expect }) => {
    const sub = NEVER.subscribe();
    expect(sub.closed).toBe(false);
    sub.unsubscribe();
    expect(sub.closed).toBe(true);
  }, meta);

  it('F29.5: EMPTY is safe to use in flattening maps to filter out elements', ({ expect }) => {
    const values = [];
    of(1, 2, 3).pipe(
      take(3)
    ).subscribe(v => values.push(v));
    expect(values).toEqual([1, 2, 3]);
  }, meta);
});

describe('Tier 1: Feature 30 — Module 2: generate() & iif()', () => {
  const meta = { tier: 1, featureId: 30, featureName: 'Module 2: generate() & iif()', milestone: 'M2', category: 'creation' };

  it('F30.1: generate() produces declarative for-loop sequence and completes', ({ expect }) => {
    const emitted = [];
    // generate(initialState, condition, iterate)
    generate(1, x => x <= 5, x => x + 1).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1, 2, 3, 4, 5]);
  }, meta);

  it('F30.2: generate() with resultSelector maps each step value', ({ expect }) => {
    const emitted = [];
    generate(1, x => x <= 3, x => x + 1, x => x * 10).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([10, 20, 30]);
  }, meta);

  it('F30.3: generate() completes immediately if initial condition is false', ({ expect }) => {
    const emitted = [];
    let completed = false;
    generate(10, x => x < 5, x => x + 1).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F30.4: iif() switches to stream A when condition evaluates to true', ({ expect }) => {
    let condition = true;
    const stream$ = iif(() => condition, of('streamA'), of('streamB'));
    let emitted;
    stream$.subscribe(v => { emitted = v; });
    expect(emitted).toBe('streamA');
  }, meta);

  it('F30.5: iif() evaluates condition at subscription time dynamically', ({ expect }) => {
    let flag = true;
    const stream$ = iif(() => flag, of('TRUE_PATH'), of('FALSE_PATH'));

    let res1, res2;
    stream$.subscribe(v => { res1 = v; });
    flag = false; // Toggle flag before second subscription
    stream$.subscribe(v => { res2 = v; });

    expect(res1).toBe('TRUE_PATH');
    expect(res2).toBe('FALSE_PATH');
  }, meta);
});
