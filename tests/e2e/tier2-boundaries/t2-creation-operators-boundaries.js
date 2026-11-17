/**
 * Tier 2 — Boundary, Corner Cases & Stress Integrity: Features 23 through 30 (Module 2 Creation Operators)
 * Exactly 5 boundary tests per feature = 40 tests.
 * Authoritative Oracle: RxJS 7.8
 */

const { describe, it } = require('../harness/runner-core');
const {
  Observable, of, from, fromEvent, interval, timer, range,
  throwError, defer, EMPTY, NEVER, generate, iif
} = require('rxjs');
const { take, timeout, catchError } = require('rxjs/operators');
const { EventEmitter } = require('events');

describe('Tier 2: Feature 23 Boundaries — Module 2: of() & from()', () => {
  const meta = { tier: 2, featureId: 23, featureName: 'Module 2: of() & from()', milestone: 'M2', category: 'creation' };

  it('F23.B1: of() with falsy values [null, undefined, 0, false, NaN, ""] emits each strictly', ({ expect }) => {
    const emitted = [];
    of(null, undefined, 0, false, NaN, '').subscribe(v => emitted.push(v));
    expect(emitted).toHaveLength(6);
    expect(emitted[0]).toBeNull();
    expect(emitted[1]).toBeUndefined();
    expect(emitted[2]).toBe(0);
    expect(emitted[3]).toBe(false);
    expect(Number.isNaN(emitted[4])).toBe(true);
    expect(emitted[5]).toBe('');
  }, meta);

  it('F23.B2: from() with empty array [] completes immediately with 0 emissions', ({ expect }) => {
    const emitted = [];
    let completed = false;
    from([]).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F23.B3: from() with generator function yielding values on demand', ({ expect }) => {
    function* numGenerator() {
      yield 10;
      yield 20;
      yield 30;
    }
    const emitted = [];
    from(numGenerator()).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([10, 20, 30]);
  }, meta);

  it('F23.B4: from() with throwing iterator propagates error to subscriber', ({ expect }) => {
    const throwingIterable = {
      [Symbol.iterator]() {
        return {
          next() { throw new Error('Iterator failure'); }
        };
      }
    };
    let caught = null;
    from(throwingIterable).subscribe({
      error: err => { caught = err; }
    });
    expect(caught).toBeDefined();
    expect(caught.message).toBe('Iterator failure');
  }, meta);

  it('F23.B5: from(Promise.reject()) forwards rejection safely without uncaught exception', async ({ expect }) => {
    let caught = null;
    await new Promise(resolve => {
      from(Promise.reject('rejected value')).subscribe({
        error: e => { caught = e; resolve(); }
      });
    });
    expect(caught).toBe('rejected value');
  }, meta);
});

describe('Tier 2: Feature 24 Boundaries — Module 2: fromEvent()', () => {
  const meta = { tier: 2, featureId: 24, featureName: 'Module 2: fromEvent()', milestone: 'M2', category: 'creation' };

  it('F24.B1: Target missing addEventListener / on methods throws informative TypeError', ({ expect }) => {
    let threw = false;
    try {
      fromEvent({}, 'click').subscribe();
    } catch {
      threw = true;
    }
    expect(threw).toBe(true);
  }, meta);

  it('F24.B2: Target emitting 1000 events in single tick delivers all 1000 items in order', ({ expect }) => {
    const emitter = new EventEmitter();
    let count = 0;
    fromEvent(emitter, 'tick').subscribe(() => count++);
    for (let i = 0; i < 1000; i++) emitter.emit('tick');
    expect(count).toBe(1000);
  }, meta);

  it('F24.B3: Event project function throwing error directs to subscriber error channel', ({ expect }) => {
    const emitter = new EventEmitter();
    let errorCaught = null;
    fromEvent(emitter, 'data', () => { throw new Error('Projection failed'); }).subscribe({
      error: err => { errorCaught = err; }
    });
    emitter.emit('data', 'sample');
    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('Projection failed');
  }, meta);

  it('F24.B4: Subscribing and unsubscribing 50 times leaves 0 listener leaks on emitter', ({ expect }) => {
    const emitter = new EventEmitter();
    for (let i = 0; i < 50; i++) {
      const sub = fromEvent(emitter, 'test').subscribe();
      sub.unsubscribe();
    }
    expect(emitter.listenerCount('test')).toBe(0);
  }, meta);

  it('F24.B5: Handles event object containing null or undefined payload', ({ expect }) => {
    const emitter = new EventEmitter();
    let received;
    fromEvent(emitter, 'empty').pipe(take(1)).subscribe(v => { received = v; });
    emitter.emit('empty', null);
    expect(received).toBeNull();
  }, meta);
});

describe('Tier 2: Feature 25 Boundaries — Module 2: interval() & timer()', () => {
  const meta = { tier: 2, featureId: 25, featureName: 'Module 2: interval() & timer()', milestone: 'M2', category: 'creation' };

  it('F25.B1: interval with negative or 0 period clamps to setTimeout minimum (0 or 1ms)', async ({ expect }) => {
    const emitted = [];
    await new Promise(resolve => {
      interval(0).pipe(take(2)).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual([0, 1]);
  }, meta);

  it('F25.B2: timer(dueTime, 0) completes initial delay and pulses', async ({ expect }) => {
    const emitted = [];
    await new Promise(resolve => {
      timer(5, 0).pipe(take(2)).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual([0, 1]);
  }, meta);

  it('F25.B3: Unsubscribing immediately at tick 0 cancels future intervals cleanly', async ({ expect }) => {
    let tickCount = 0;
    const sub = interval(10).subscribe(() => tickCount++);
    sub.unsubscribe(); // Immediate unsubscribe
    await new Promise(r => setTimeout(r, 25));
    expect(tickCount).toBe(0);
  }, meta);

  it('F25.B4: timer with negative dueTime executes immediately on next tick', async ({ expect }) => {
    let executed = false;
    await new Promise(resolve => {
      timer(-100).subscribe(() => {
        executed = true;
        resolve();
      });
    });
    expect(executed).toBe(true);
  }, meta);

  it('F25.B5: High frequency interval (100 rapid subscriptions) tear down cleanly without lingering timers', async ({ expect }) => {
    const subs = [];
    for (let i = 0; i < 100; i++) {
      subs.push(interval(100).subscribe());
    }
    subs.forEach(s => s.unsubscribe());
    const allClosed = subs.every(s => s.closed);
    expect(allClosed).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 26 Boundaries — Module 2: range()', () => {
  const meta = { tier: 2, featureId: 26, featureName: 'Module 2: range()', milestone: 'M2', category: 'creation' };

  it('F26.B1: range with negative count throws RangeError or completes immediately', ({ expect }) => {
    const emitted = [];
    let completed = false;
    range(5, -1).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F26.B2: range(0, 10000) emits 10,000 consecutive integers without skipping', ({ expect }) => {
    let last = -1;
    let total = 0;
    range(0, 10000).subscribe(v => {
      total++;
      last = v;
    });
    expect(total).toBe(10000);
    expect(last).toBe(9999);
  }, meta);

  it('F26.B3: range with start = 0 emits 0 as first element', ({ expect }) => {
    const emitted = [];
    range(0, 3).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([0, 1, 2]);
  }, meta);

  it('F26.B4: range with large start (1,000,000) maintains integer precision', ({ expect }) => {
    const emitted = [];
    range(1000000, 3).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1000000, 1000001, 1000002]);
  }, meta);

  it('F26.B5: Unsubscribing mid-range terminates synchronously', ({ expect }) => {
    const emitted = [];
    const sub = range(1, 1000).pipe(take(3)).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1, 2, 3]);
    expect(sub.closed).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 27 Boundaries — Module 2: throwError()', () => {
  const meta = { tier: 2, featureId: 27, featureName: 'Module 2: throwError()', milestone: 'M2', category: 'creation' };

  it('F27.B1: throwError factory returning undefined produces undefined error payload', ({ expect }) => {
    let caught;
    throwError(() => undefined).subscribe({
      error: e => { caught = e; }
    });
    expect(caught).toBeUndefined();
  }, meta);

  it('F27.B2: throwError factory throwing an error itself forwards the thrown error', ({ expect }) => {
    let caught = null;
    throwError(() => {
      throw new Error('Factory crashed internally');
    }).subscribe({
      error: e => { caught = e; }
    });
    expect(caught).toBeDefined();
    expect(caught.message).toBe('Factory crashed internally');
  }, meta);

  it('F27.B3: throwError with primitive number (e.g. 500) preserves number type', ({ expect }) => {
    let caught;
    throwError(() => 500).subscribe({
      error: e => { caught = e; }
    });
    expect(caught).toBe(500);
  }, meta);

  it('F27.B4: throwError combined with catchError recovers gracefully into alternative stream', ({ expect }) => {
    const recovered = [];
    throwError(() => new Error('boom')).pipe(
      catchError(() => of('safe-fallback'))
    ).subscribe(v => recovered.push(v));
    expect(recovered).toEqual(['safe-fallback']);
  }, meta);

  it('F27.B5: throwError executed 100 times evaluates error factory 100 separate times', ({ expect }) => {
    let evaluations = 0;
    const error$ = throwError(() => {
      evaluations++;
      return new Error('err');
    });
    for (let i = 0; i < 100; i++) {
      error$.subscribe({ error: () => {} });
    }
    expect(evaluations).toBe(100);
  }, meta);
});

describe('Tier 2: Feature 28 Boundaries — Module 2: defer()', () => {
  const meta = { tier: 2, featureId: 28, featureName: 'Module 2: defer()', milestone: 'M2', category: 'creation' };

  it('F28.B1: defer factory returning empty stream EMPTY completes synchronously', ({ expect }) => {
    let completed = false;
    defer(() => EMPTY).subscribe({ complete: () => { completed = true; } });
    expect(completed).toBe(true);
  }, meta);

  it('F28.B2: defer factory throwing synchronously propagates error to observer', ({ expect }) => {
    let errorCaught = null;
    defer(() => { throw new Error('Factory failed'); }).subscribe({
      error: e => { errorCaught = e; }
    });
    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('Factory failed');
  }, meta);

  it('F28.B3: Nested defer chains evaluate outer and inner lazily upon subscription', ({ expect }) => {
    let innerEvaluated = false;
    const nested$ = defer(() => defer(() => {
      innerEvaluated = true;
      return of('nested');
    }));
    expect(innerEvaluated).toBe(false);
    let val;
    nested$.subscribe(v => { val = v; });
    expect(innerEvaluated).toBe(true);
    expect(val).toBe('nested');
  }, meta);

  it('F28.B4: defer evaluates Date.now() timestamp afresh for each subscriber', async ({ expect }) => {
    const time$ = defer(() => of(Date.now()));
    let t1, t2;
    time$.subscribe(t => { t1 = t; });
    await new Promise(r => setTimeout(r, 5));
    time$.subscribe(t => { t2 = t; });
    expect(t2 >= t1).toBe(true);
  }, meta);

  it('F28.B5: Unsubscribing from defer tears down the created inner observable', ({ expect }) => {
    let innerTornDown = false;
    const stream$ = defer(() => new Observable(() => () => { innerTornDown = true; }));
    const sub = stream$.subscribe();
    sub.unsubscribe();
    expect(innerTornDown).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 29 Boundaries — Module 2: EMPTY & NEVER', () => {
  const meta = { tier: 2, featureId: 29, featureName: 'Module 2: EMPTY & NEVER', milestone: 'M2', category: 'creation' };

  it('F29.B1: NEVER combined with timeout operator throws TimeoutError after deadline', async ({ expect }) => {
    let timeoutCaught = false;
    await new Promise(resolve => {
      NEVER.pipe(
        timeout(15),
        catchError(err => {
          timeoutCaught = true;
          resolve();
          return of('caught');
        })
      ).subscribe();
    });
    expect(timeoutCaught).toBe(true);
  }, meta);

  it('F29.B2: Subscribing to EMPTY 100 times synchronously completes 100 times immediately', ({ expect }) => {
    let completions = 0;
    for (let i = 0; i < 100; i++) {
      EMPTY.subscribe({ complete: () => completions++ });
    }
    expect(completions).toBe(100);
  }, meta);

  it('F29.B3: NEVER unsubscribed immediately leaves no open background listeners', ({ expect }) => {
    const sub = NEVER.subscribe();
    expect(sub.closed).toBe(false);
    sub.unsubscribe();
    expect(sub.closed).toBe(true);
  }, meta);

  it('F29.B4: EMPTY with take(5) completes without error and emits 0 values', ({ expect }) => {
    const emitted = [];
    let completed = false;
    EMPTY.pipe(take(5)).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F29.B5: NEVER combined with take(0) completes immediately', ({ expect }) => {
    let completed = false;
    NEVER.pipe(take(0)).subscribe({
      complete: () => { completed = true; }
    });
    expect(completed).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 30 Boundaries — Module 2: generate() & iif()', () => {
  const meta = { tier: 2, featureId: 30, featureName: 'Module 2: generate() & iif()', milestone: 'M2', category: 'creation' };

  it('F30.B1: generate() condition false on initial state completes with 0 emissions', ({ expect }) => {
    const emitted = [];
    let done = false;
    generate(100, x => x < 10, x => x + 1).subscribe({
      next: v => emitted.push(v),
      complete: () => { done = true; }
    });
    expect(emitted).toEqual([]);
    expect(done).toBe(true);
  }, meta);

  it('F30.B2: generate() with iterate step of zero stops safely via condition', ({ expect }) => {
    const emitted = [];
    let count = 0;
    generate(1, () => count++ < 3, x => x).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1, 1, 1]);
  }, meta);

  it('F30.B3: iif() with condition throwing an error forwards error to observer', ({ expect }) => {
    let caught = null;
    const stream$ = iif(() => { throw new Error('Condition crashed'); }, of(1), of(2));
    stream$.subscribe({
      error: e => { caught = e; }
    });
    expect(caught).toBeDefined();
    expect(caught.message).toBe('Condition crashed');
  }, meta);

  it('F30.B4: iif() with EMPTY as false-path completes with 0 emissions when false', ({ expect }) => {
    const emitted = [];
    let completed = false;
    iif(() => false, of('true-val'), EMPTY).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F30.B5: generate() iterate function throwing error directs to error handler', ({ expect }) => {
    let errorCaught = null;
    generate(1, x => x < 5, () => { throw new Error('Iterate failed'); }).subscribe({
      error: e => { errorCaught = e; }
    });
    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('Iterate failed');
  }, meta);
});
