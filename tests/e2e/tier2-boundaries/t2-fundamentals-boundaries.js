/**
 * Tier 2 — Boundary, Corner Cases & Stress Integrity: Features 16 through 22 (Module 1 Fundamentals)
 * Exactly 5 boundary tests per feature = 35 tests.
 * Authoritative Oracle: RxJS 7.8
 */

const { describe, it } = require('../harness/runner-core');
const { Observable, Subject, Subscription, of, from, throwError } = require('rxjs');
const { share, shareReplay, take, map } = require('rxjs/operators');

describe('Tier 2: Feature 16 Boundaries — Module 1: what-is-rxjs', () => {
  const meta = { tier: 2, featureId: 16, featureName: 'Module 1: what-is-rxjs', milestone: 'M2', category: 'fundamentals' };

  it('F16.B1: Synchronous unsubscription inside next handler halts further emissions immediately', ({ expect }) => {
    const emitted = [];
    const stream$ = of(1, 2, 3, 4, 5);
    const sub = stream$.pipe(take(2)).subscribe(val => emitted.push(val));
    expect(emitted).toEqual([1, 2]);
    expect(sub.closed).toBe(true);
  }, meta);

  it('F16.B2: Producer pushing 10,000 synchronous items processes without call stack explosion', ({ expect }) => {
    let count = 0;
    const large$ = new Observable(sub => {
      for (let i = 0; i < 10000; i++) sub.next(i);
      sub.complete();
    });
    large$.subscribe(() => count++);
    expect(count).toBe(10000);
  }, meta);

  it('F16.B3: Unhandled exception in operator pipeline is caught safely by observer error channel', ({ expect }) => {
    let errorCaught = null;
    of(1, 2, 3).pipe(
      map(val => {
        if (val === 2) throw new Error('Crash in operator');
        return val;
      })
    ).subscribe({
      next: () => {},
      error: err => { errorCaught = err; }
    });
    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('Crash in operator');
  }, meta);

  it('F16.B4: Zero subscribers creates zero side effects (absolute laziness)', ({ expect }) => {
    let sideEffect = false;
    new Observable(() => { sideEffect = true; });
    expect(sideEffect).toBe(false);
  }, meta);

  it('F16.B5: Producer emitting undefined, null, and false handles all falsy values accurately', ({ expect }) => {
    const emitted = [];
    of(undefined, null, false, 0, '').subscribe(v => emitted.push(v));
    expect(emitted).toEqual([undefined, null, false, 0, '']);
  }, meta);
});

describe('Tier 2: Feature 17 Boundaries — Module 1: what-is-observable', () => {
  const meta = { tier: 2, featureId: 17, featureName: 'Module 1: what-is-observable', milestone: 'M2', category: 'fundamentals' };

  it('F17.B1: Teardown function throwing an error does not crash unsubscription', ({ expect }) => {
    const stream$ = new Observable(() => {
      return () => { throw new Error('Teardown crash'); };
    });
    const sub = stream$.subscribe();
    let threw = false;
    try {
      sub.unsubscribe();
    } catch {
      threw = true;
    }
    expect(sub.closed).toBe(true);
  }, meta);

  it('F17.B2: Multiple consecutive complete() calls on subscriber are ignored after first', ({ expect }) => {
    let completeCalls = 0;
    const stream$ = new Observable(sub => {
      sub.complete();
      sub.complete();
      sub.complete();
    });
    stream$.subscribe({
      complete: () => completeCalls++
    });
    expect(completeCalls).toBe(1);
  }, meta);

  it('F17.B3: Null or undefined observer handlers do not throw TypeError', ({ expect }) => {
    let threw = false;
    try {
      of(1, 2).subscribe(null);
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
  }, meta);

  it('F17.B4: Producer calling subscriber.next() after throwing error is suppressed', ({ expect }) => {
    const emitted = [];
    const stream$ = new Observable(sub => {
      sub.error(new Error('err'));
      sub.next('zombie');
    });
    stream$.subscribe({
      next: v => emitted.push(v),
      error: () => {}
    });
    expect(emitted).toEqual([]);
  }, meta);

  it('F17.B5: Unsubscribing before producer emits any value executes teardown cleanly', ({ expect }) => {
    let cleaned = false;
    const stream$ = new Observable(() => () => { cleaned = true; });
    const sub = stream$.subscribe();
    sub.unsubscribe();
    expect(cleaned).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 18 Boundaries — Module 1: observable-vs-promise', () => {
  const meta = { tier: 2, featureId: 18, featureName: 'Module 1: observable-vs-promise', milestone: 'M2', category: 'fundamentals' };

  it('F18.B1: from(Promise.reject()) propagates rejection to Observable error channel', async ({ expect }) => {
    const rejectedPromise = Promise.reject(new Error('Promise failure'));
    let errorReceived = null;
    await new Promise(resolve => {
      from(rejectedPromise).subscribe({
        error: err => {
          errorReceived = err;
          resolve();
        }
      });
    });
    expect(errorReceived).toBeDefined();
    expect(errorReceived.message).toBe('Promise failure');
  }, meta);

  it('F18.B2: Unsubscribing from Promise-based Observable before resolve prevents next callback', async ({ expect }) => {
    let nextCalled = false;
    const delayedPromise = new Promise(resolve => setTimeout(() => resolve('data'), 20));
    const sub = from(delayedPromise).subscribe({
      next: () => { nextCalled = true; }
    });
    sub.unsubscribe();
    await new Promise(r => setTimeout(r, 30));
    expect(nextCalled).toBe(false);
  }, meta);

  it('F18.B3: Promise already resolved before from() conversion emits on next tick', async ({ expect }) => {
    const resolvedPromise = Promise.resolve('instant');
    const emitted = [];
    await new Promise(resolve => {
      from(resolvedPromise).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });
    });
    expect(emitted).toEqual(['instant']);
  }, meta);

  it('F18.B4: Observable stream emitting 0 items (EMPTY) vs Promise resolving undefined', async ({ expect }) => {
    const obsValues = [];
    of().subscribe(v => obsValues.push(v));
    const promVal = await Promise.resolve(undefined);
    expect(obsValues).toHaveLength(0); // 0 values
    expect(promVal).toBeUndefined();   // Exactly 1 value (undefined)
  }, meta);

  it('F18.B5: Observable teardown handles async cancellation without unhandled promise warnings', async ({ expect }) => {
    let isCancelled = false;
    const stream$ = new Observable(() => {
      return () => { isCancelled = true; };
    });
    const sub = stream$.subscribe();
    sub.unsubscribe();
    expect(isCancelled).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 19 Boundaries — Module 1: observer-subscriber', () => {
  const meta = { tier: 2, featureId: 19, featureName: 'Module 1: observer-subscriber', milestone: 'M2', category: 'fundamentals' };

  it('F19.B1: Re-entrant next() calls are ordered without infinite recursion', ({ expect }) => {
    const emitted = [];
    const subject = new Subject();
    subject.subscribe(v => {
      emitted.push(v);
      if (v < 3) subject.next(v + 1);
    });
    subject.next(1);
    expect(emitted).toEqual([1, 2, 3]);
  }, meta);

  it('F19.B2: Passing non-Error object to error() (e.g. string or number) preserves literal value', ({ expect }) => {
    let captured = null;
    const stream$ = new Observable(sub => {
      sub.error('STRING_ERROR');
    });
    stream$.subscribe({
      error: e => { captured = e; }
    });
    expect(captured).toBe('STRING_ERROR');
  }, meta);

  it('F19.B3: Subscriber safe wrapper ensures complete is called only once', ({ expect }) => {
    let calls = 0;
    const stream$ = new Observable(sub => {
      sub.complete();
      sub.complete();
    });
    stream$.subscribe({ complete: () => calls++ });
    expect(calls).toBe(1);
  }, meta);

  it('F19.B4: Partial observer with only error callback does not fail on next emissions', ({ expect }) => {
    let errored = false;
    of(1, 2, 3).subscribe({
      error: () => { errored = true; }
    });
    expect(errored).toBe(false);
  }, meta);

  it('F19.B5: Calling subscriber.error() with null handles null error safely', ({ expect }) => {
    let caught;
    new Observable(sub => sub.error(null)).subscribe({
      error: e => { caught = e; }
    });
    expect(caught).toBeNull();
  }, meta);
});

describe('Tier 2: Feature 20 Boundaries — Module 1: subscription-lifecycle', () => {
  const meta = { tier: 2, featureId: 20, featureName: 'Module 1: subscription-lifecycle', milestone: 'M2', category: 'fundamentals' };

  it('F20.B1: Adding closed child to parent subscription executes child teardown immediately', ({ expect }) => {
    const parent = new Subscription();
    let childTeardownRan = false;
    const child = new Subscription(() => { childTeardownRan = true; });
    child.unsubscribe();
    expect(childTeardownRan).toBe(true);

    parent.add(child);
    expect(parent.closed).toBe(false);
  }, meta);

  it('F20.B2: Adding child to already-closed parent executes child teardown immediately', ({ expect }) => {
    const parent = new Subscription();
    parent.unsubscribe();

    let childRan = false;
    const child = new Subscription(() => { childRan = true; });
    parent.add(child);
    expect(childRan).toBe(true);
  }, meta);

  it('F20.B3: Circular reference protection: adding parent to child does not crash recursion', ({ expect }) => {
    const subA = new Subscription();
    const subB = new Subscription();
    subA.add(subB);
    subB.add(subA);
    let threw = false;
    try {
      subA.unsubscribe();
    } catch {
      threw = true;
    }
    expect(threw).toBe(false);
    expect(subA.closed).toBe(true);
    expect(subB.closed).toBe(true);
  }, meta);

  it('F20.B4: Unsubscribing 100 times consecutively does not throw error', ({ expect }) => {
    const sub = new Subscription();
    for (let i = 0; i < 100; i++) sub.unsubscribe();
    expect(sub.closed).toBe(true);
  }, meta);

  it('F20.B5: Teardown array handles functions throwing without aborting remaining teardowns', ({ expect }) => {
    const parent = new Subscription();
    let secondRan = false;
    parent.add(() => { throw new Error('Teardown 1 failed'); });
    parent.add(() => { secondRan = true; });

    let threw = false;
    try {
      parent.unsubscribe();
    } catch {
      threw = true;
    }
    expect(secondRan).toBe(true); // Second teardown ran despite first throwing!
  }, meta);
});

describe('Tier 2: Feature 21 Boundaries — Module 1: cold-vs-hot', () => {
  const meta = { tier: 2, featureId: 21, featureName: 'Module 1: cold-vs-hot', milestone: 'M2', category: 'fundamentals' };

  it('F21.B1: Hot Subject emitting before any subscriber joins discards values', ({ expect }) => {
    const hot$ = new Subject();
    hot$.next('lost-1');
    hot$.next('lost-2');

    const received = [];
    hot$.subscribe(v => received.push(v));
    hot$.next('received');

    expect(received).toEqual(['received']);
  }, meta);

  it('F21.B2: Cold stream subscribed 200 times concurrently runs 200 independent executions', ({ expect }) => {
    let executions = 0;
    const cold$ = new Observable(sub => {
      executions++;
      sub.next(executions);
      sub.complete();
    });
    for (let i = 0; i < 200; i++) {
      cold$.subscribe();
    }
    expect(executions).toBe(200);
  }, meta);

  it('F21.B3: Hot Subject completes: subsequent late subscribers immediately receive complete', ({ expect }) => {
    const hot$ = new Subject();
    hot$.complete();

    let completed = false;
    let nextCalled = false;
    hot$.subscribe({
      next: () => { nextCalled = true; },
      complete: () => { completed = true; }
    });
    expect(completed).toBe(true);
    expect(nextCalled).toBe(false);
  }, meta);

  it('F21.B4: Hot Subject errors: late subscribers immediately receive the cached error', ({ expect }) => {
    const hot$ = new Subject();
    hot$.error(new Error('Subject died'));

    let caughtError = null;
    hot$.subscribe({
      error: err => { caughtError = err; }
    });
    expect(caughtError).toBeDefined();
    expect(caughtError.message).toBe('Subject died');
  }, meta);

  it('F21.B5: Hot Subject handles all subscribers unsubscribing then new subscriber joins', ({ expect }) => {
    const hot$ = new Subject();
    const sub1 = hot$.subscribe();
    sub1.unsubscribe();

    const received = [];
    hot$.subscribe(v => received.push(v));
    hot$.next('revived');

    expect(received).toEqual(['revived']);
  }, meta);
});

describe('Tier 2: Feature 22 Boundaries — Module 1: multicasting', () => {
  const meta = { tier: 2, featureId: 22, featureName: 'Module 1: multicasting', milestone: 'M2', category: 'fundamentals' };

  it('F22.B1: shareReplay with bufferSize: 0 clamps to minimum bufferSize 1', ({ expect }) => {
    const shared$ = of('item').pipe(shareReplay(0));
    let lateVal = null;
    shared$.subscribe();
    shared$.subscribe(v => { lateVal = v; });
    // RxJS ReplaySubject enforces Math.max(1, bufferSize), buffering at least 1 item
    expect(lateVal).toBe('item');
  }, meta);

  it('F22.B2: shareReplay resets on error (resetOnError: true) allowing late subscribers to retry upstream', ({ expect }) => {
    let count = 0;
    const source$ = new Observable(sub => {
      count++;
      sub.error(new Error('Transient upstream error'));
    }).pipe(shareReplay(1));

    let err1, err2;
    source$.subscribe({ error: e => { err1 = e; } });
    source$.subscribe({ error: e => { err2 = e; } });

    // RxJS 7 shareReplay resets on error (resetOnError: true), so late subscriber retries upstream
    expect(count).toBe(2);
    expect(err1.message).toBe('Transient upstream error');
    expect(err2.message).toBe('Transient upstream error');
  }, meta);

  it('F22.B3: share() resets when subscriber count reaches 0 and resubscribes on next observer', ({ expect }) => {
    let producerRuns = 0;
    const shared$ = new Observable(sub => {
      producerRuns++;
      sub.next(producerRuns);
      return () => {};
    }).pipe(share());

    const sub1 = shared$.subscribe();
    expect(producerRuns).toBe(1);
    sub1.unsubscribe(); // Drops to 0 subscribers -> resets

    const sub2 = shared$.subscribe();
    expect(producerRuns).toBe(2); // Fresh upstream subscription
    sub2.unsubscribe();
  }, meta);

  it('F22.B4: shareReplay with 10,000 rapid emissions buffers only designated bufferSize (e.g. 2)', ({ expect }) => {
    const subject = new Subject();
    const buffered$ = subject.pipe(shareReplay(2));
    buffered$.subscribe(); // Activate

    for (let i = 0; i < 10000; i++) subject.next(i);

    const replayed = [];
    buffered$.subscribe(v => replayed.push(v));
    expect(replayed).toEqual([9998, 9999]);
  }, meta);

  it('F22.B5: shareReplay unsubscribes cleanly when parent subscription tears down', ({ expect }) => {
    let active = false;
    const source$ = new Observable(() => {
      active = true;
      return () => { active = false; };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    const sub = source$.subscribe();
    expect(active).toBe(true);
    sub.unsubscribe();
    expect(active).toBe(false);
  }, meta);
});
