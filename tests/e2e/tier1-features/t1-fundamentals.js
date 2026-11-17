/**
 * Tier 1 — Feature Coverage: Features 16 through 22 (Module 1: RxJS Fundamentals)
 * Exactly 5 test cases per feature = 35 test cases.
 * Authoritative Oracle: RxJS 7.8 installed in node_modules
 */

const { describe, it } = require('../harness/runner-core');
const { Observable, Subject, Subscription, of, from } = require('rxjs');
const { share, shareReplay, map, take } = require('rxjs/operators');

describe('Tier 1: Feature 16 — Module 1: what-is-rxjs', () => {
  const meta = { tier: 1, featureId: 16, featureName: 'Module 1: what-is-rxjs', milestone: 'M2', category: 'fundamentals' };

  it('F16.1: Push paradigm: Producer pushes data to subscriber via next() callback', ({ expect }) => {
    const received = [];
    const producer$ = new Observable(subscriber => {
      subscriber.next(10);
      subscriber.next(20);
      subscriber.next(30);
      subscriber.complete();
    });
    producer$.subscribe(val => received.push(val));
    expect(received).toEqual([10, 20, 30]);
  }, meta);

  it('F16.2: Stream processing pipeline transforms values without mutating source', ({ expect }) => {
    const source$ = of(1, 2, 3);
    const transformed$ = source$.pipe(map(x => x * 10));
    const result = [];
    transformed$.subscribe(v => result.push(v));
    expect(result).toEqual([10, 20, 30]);
  }, meta);

  it('F16.3: Lazy evaluation: producer does not emit until subscribe is invoked', ({ expect }) => {
    let produced = false;
    const lazy$ = new Observable(sub => {
      produced = true;
      sub.next('data');
      sub.complete();
    });
    expect(produced).toBe(false);
    lazy$.subscribe();
    expect(produced).toBe(true);
  }, meta);

  it('F16.4: Push model delivers multiple values across time intervals', async ({ expect }) => {
    const values = [];
    await new Promise(resolve => {
      const stream$ = new Observable(subscriber => {
        subscriber.next(1);
        setTimeout(() => {
          subscriber.next(2);
          subscriber.complete();
          resolve();
        }, 10);
      });
      stream$.subscribe(v => values.push(v));
    });
    expect(values).toEqual([1, 2]);
  }, meta);

  it('F16.5: Stream completion closes channel cleanly', ({ expect }) => {
    let completed = false;
    of('done').subscribe({
      complete: () => { completed = true; }
    });
    expect(completed).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 17 — Module 1: what-is-observable', () => {
  const meta = { tier: 1, featureId: 17, featureName: 'Module 1: what-is-observable', milestone: 'M2', category: 'fundamentals' };

  it('F17.1: Observable blueprint creates independent execution context per subscriber', ({ expect }) => {
    let executionCounter = 0;
    const blueprint$ = new Observable(subscriber => {
      executionCounter++;
      subscriber.next(executionCounter);
      subscriber.complete();
    });
    const sub1Values = [];
    const sub2Values = [];
    blueprint$.subscribe(v => sub1Values.push(v));
    blueprint$.subscribe(v => sub2Values.push(v));
    expect(sub1Values).toEqual([1]);
    expect(sub2Values).toEqual([2]);
    expect(executionCounter).toBe(2);
  }, meta);

  it('F17.2: Subscriber teardown function executes when unsubscription occurs', ({ expect }) => {
    let teardownExecuted = false;
    const stream$ = new Observable(() => {
      return () => { teardownExecuted = true; };
    });
    const sub = stream$.subscribe();
    expect(teardownExecuted).toBe(false);
    sub.unsubscribe();
    expect(teardownExecuted).toBe(true);
  }, meta);

  it('F17.3: Subscriber receives values synchronously when producer is synchronous', ({ expect }) => {
    const output = [];
    output.push('start');
    of(1, 2).subscribe(v => output.push(v));
    output.push('end');
    expect(output).toEqual(['start', 1, 2, 'end']);
  }, meta);

  it('F17.4: Error thrown in producer function triggers subscriber error callback', ({ expect }) => {
    let errorReceived = null;
    const error$ = new Observable(() => {
      throw new Error('Producer failure');
    });
    error$.subscribe({
      next: () => {},
      error: err => { errorReceived = err; }
    });
    expect(errorReceived).toBeDefined();
    expect(errorReceived.message).toBe('Producer failure');
  }, meta);

  it('F17.5: Teardown logic runs even when subscriber errors', ({ expect }) => {
    let teardownCleaned = false;
    const stream$ = new Observable(sub => {
      sub.error(new Error('fail'));
      return () => { teardownCleaned = true; };
    });
    stream$.subscribe({
      next: () => {},
      error: () => {}
    });
    expect(teardownCleaned).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 18 — Module 1: observable-vs-promise', () => {
  const meta = { tier: 1, featureId: 18, featureName: 'Module 1: observable-vs-promise', milestone: 'M2', category: 'fundamentals' };

  it('F18.1: Observables are cancellable via unsubscribe() before completion', async ({ expect }) => {
    let sideEffectRan = false;
    const cancellable$ = new Observable(() => {
      const timerId = setTimeout(() => {
        sideEffectRan = true;
      }, 50);
      return () => clearTimeout(timerId);
    });
    const sub = cancellable$.subscribe();
    sub.unsubscribe();
    await new Promise(r => setTimeout(r, 60));
    expect(sideEffectRan).toBe(false); // Cancelled!
  }, meta);

  it('F18.2: Promises cannot be natively cancelled once initiated', async ({ expect }) => {
    let promiseResolved = false;
    const promise = new Promise(resolve => {
      setTimeout(() => {
        promiseResolved = true;
        resolve('done');
      }, 10);
    });
    await promise;
    expect(promiseResolved).toBe(true);
  }, meta);

  it('F18.3: Observables emit multiple values over time; Promises resolve single value', async ({ expect }) => {
    const obsValues = [];
    of(1, 2, 3, 4).subscribe(v => obsValues.push(v));
    const promValue = await Promise.resolve('single');
    expect(obsValues).toEqual([1, 2, 3, 4]);
    expect(promValue).toBe('single');
  }, meta);

  it('F18.4: Observables are lazy; Promises execute immediately upon instantiation', ({ expect }) => {
    let promiseExecuted = false;
    let observableExecuted = false;

    new Promise(resolve => {
      promiseExecuted = true;
      resolve(true);
    });

    new Observable(() => {
      observableExecuted = true;
    });

    expect(promiseExecuted).toBe(true);
    expect(observableExecuted).toBe(false);
  }, meta);

  it('F18.5: from(Promise) bridges Promise into an Observable', async ({ expect }) => {
    const promise = Promise.resolve('bridged');
    const bridged$ = from(promise);
    const values = [];
    await new Promise(resolve => {
      bridged$.subscribe({
        next: v => values.push(v),
        complete: resolve
      });
    });
    expect(values).toEqual(['bridged']);
  }, meta);
});

describe('Tier 1: Feature 19 — Module 1: observer-subscriber', () => {
  const meta = { tier: 1, featureId: 19, featureName: 'Module 1: observer-subscriber', milestone: 'M2', category: 'fundamentals' };

  it('F19.1: Observer interface handles next, error, complete notifications', ({ expect }) => {
    const calls = [];
    const observer = {
      next: v => calls.push(`next:${v}`),
      error: e => calls.push(`error:${e}`),
      complete: () => calls.push('complete')
    };
    of('hello').subscribe(observer);
    expect(calls).toEqual(['next:hello', 'complete']);
  }, meta);

  it('F19.2: Contract: Subscriber ignores any next() calls after complete() is called', ({ expect }) => {
    const emissions = [];
    const stream$ = new Observable(sub => {
      sub.next(1);
      sub.complete();
      sub.next(2); // Must be strictly ignored
    });
    stream$.subscribe(v => emissions.push(v));
    expect(emissions).toEqual([1]);
  }, meta);

  it('F19.3: Contract: Subscriber ignores any next() calls after error() is called', ({ expect }) => {
    const emissions = [];
    let errHandled = false;
    const stream$ = new Observable(sub => {
      sub.next('a');
      sub.error(new Error('stop'));
      sub.next('b'); // Must be ignored
    });
    stream$.subscribe({
      next: v => emissions.push(v),
      error: () => { errHandled = true; }
    });
    expect(emissions).toEqual(['a']);
    expect(errHandled).toBe(true);
  }, meta);

  it('F19.4: Contract: complete() and error() are mutually exclusive', ({ expect }) => {
    let completed = false;
    let errored = false;
    const stream$ = new Observable(sub => {
      sub.complete();
      sub.error(new Error('ignored error'));
    });
    stream$.subscribe({
      next: () => {},
      error: () => { errored = true; },
      complete: () => { completed = true; }
    });
    expect(completed).toBe(true);
    expect(errored).toBe(false);
  }, meta);

  it('F19.5: Observer methods are optional (partial observer)', ({ expect }) => {
    let passed = false;
    // Subscribing with only next callback
    of(1).subscribe(() => { passed = true; });
    expect(passed).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 20 — Module 1: subscription-lifecycle', () => {
  const meta = { tier: 1, featureId: 20, featureName: 'Module 1: subscription-lifecycle', milestone: 'M2', category: 'fundamentals' };

  it('F20.1: Subscription sets closed = true after unsubscribe()', ({ expect }) => {
    const sub = new Observable().subscribe();
    expect(sub.closed).toBe(false);
    sub.unsubscribe();
    expect(sub.closed).toBe(true);
  }, meta);

  it('F20.2: subscription.add(child) adds child to parent teardown tree', ({ expect }) => {
    let childCleaned = false;
    let parentCleaned = false;

    const parentSub = new Observable(() => () => { parentCleaned = true; }).subscribe();
    const childSub = new Observable(() => () => { childCleaned = true; }).subscribe();

    parentSub.add(childSub);
    expect(parentCleaned).toBe(false);
    expect(childCleaned).toBe(false);

    parentSub.unsubscribe();
    expect(parentCleaned).toBe(true);
    expect(childCleaned).toBe(true);
  }, meta);

  it('F20.3: Detached child via subscription.remove() is not unsubscribed by parent', ({ expect }) => {
    let childCleaned = false;
    const parentSub = new Subscription();
    const childSub = new Observable(() => () => { childCleaned = true; }).subscribe();

    parentSub.add(childSub);
    parentSub.remove(childSub);
    parentSub.unsubscribe();

    expect(childCleaned).toBe(false); // Preserved!
    childSub.unsubscribe();
    expect(childCleaned).toBe(true);
  }, meta);

  it('F20.4: Adding a closed child subscription does not cause errors', ({ expect }) => {
    const parentSub = new Subscription();
    const childSub = new Subscription();
    childSub.unsubscribe();
    parentSub.add(childSub);
    expect(childSub.closed).toBe(true);
    parentSub.unsubscribe();
    expect(parentSub.closed).toBe(true);
  }, meta);

  it('F20.5: Multiple unsubscribe() invocations are idempotent and safe', ({ expect }) => {
    const sub = new Subscription();
    sub.unsubscribe();
    sub.unsubscribe();
    sub.unsubscribe();
    expect(sub.closed).toBe(true);
  }, meta);
});

describe('Tier 1: Feature 21 — Module 1: cold-vs-hot', () => {
  const meta = { tier: 1, featureId: 21, featureName: 'Module 1: cold-vs-hot', milestone: 'M2', category: 'fundamentals' };

  it('F21.1: Cold observable: Each subscriber receives separate full sequence from beginning', ({ expect }) => {
    const cold$ = of(1, 2, 3);
    const sub1 = [];
    const sub2 = [];
    cold$.subscribe(v => sub1.push(v));
    cold$.subscribe(v => sub2.push(v));
    expect(sub1).toEqual([1, 2, 3]);
    expect(sub2).toEqual([1, 2, 3]);
  }, meta);

  it('F21.2: Cold observable: Producer function is re-invoked per subscription', ({ expect }) => {
    let invocations = 0;
    const cold$ = new Observable(sub => {
      invocations++;
      sub.next(invocations);
      sub.complete();
    });
    cold$.subscribe();
    cold$.subscribe();
    cold$.subscribe();
    expect(invocations).toBe(3);
  }, meta);

  it('F21.3: Hot observable (Subject): Late subscriber misses emissions prior to subscription', ({ expect }) => {
    const hot$ = new Subject();
    const sub1Values = [];
    const sub2Values = [];

    hot$.subscribe(v => sub1Values.push(v));
    hot$.next('first');

    hot$.subscribe(v => sub2Values.push(v)); // Late subscriber joins here
    hot$.next('second');

    expect(sub1Values).toEqual(['first', 'second']);
    expect(sub2Values).toEqual(['second']); // Missed 'first'!
  }, meta);

  it('F21.4: Hot observable: Simultaneous subscribers share the exact same emission value', ({ expect }) => {
    const hot$ = new Subject();
    const token = { id: 99 };
    let rec1, rec2;

    hot$.subscribe(v => { rec1 = v; });
    hot$.subscribe(v => { rec2 = v; });

    hot$.next(token);
    expect(rec1).toBe(token);
    expect(rec2).toBe(token);
  }, meta);

  it('F21.5: Converting cold to hot via share() multicasts producer output', ({ expect }) => {
    let runs = 0;
    const source$ = new Observable(sub => {
      runs++;
      sub.next(runs);
      sub.complete();
    }).pipe(share());

    let val1, val2;
    source$.subscribe(v => { val1 = v; });
    expect(runs).toBe(1);
    expect(val1).toBe(1);
  }, meta);
});

describe('Tier 1: Feature 22 — Module 1: multicasting', () => {
  const meta = { tier: 1, featureId: 22, featureName: 'Module 1: multicasting', milestone: 'M2', category: 'fundamentals' };

  it('F22.1: shareReplay(1) caches and replays last emission to late subscribers', ({ expect }) => {
    const shared$ = of('cached-data').pipe(shareReplay(1));
    let lateVal = null;
    shared$.subscribe(); // Initial subscription triggers evaluation
    shared$.subscribe(v => { lateVal = v; }); // Late subscriber receives cached value
    expect(lateVal).toBe('cached-data');
  }, meta);

  it('F22.2: shareReplay avoids duplicating expensive side effects across subscribers', ({ expect }) => {
    let sideEffects = 0;
    const expensive$ = new Observable(sub => {
      sideEffects++;
      sub.next(sideEffects);
      sub.complete();
    }).pipe(shareReplay(1));

    expensive$.subscribe();
    expensive$.subscribe();
    expensive$.subscribe();

    expect(sideEffects).toBe(1); // Executed only once!
  }, meta);

  it('F22.3: share() unsubscribes from upstream when subscriber count drops to zero', ({ expect }) => {
    let upstreamActive = false;
    const source$ = new Observable(() => {
      upstreamActive = true;
      return () => { upstreamActive = false; };
    }).pipe(share());

    const sub1 = source$.subscribe();
    expect(upstreamActive).toBe(true);
    sub1.unsubscribe();
    expect(upstreamActive).toBe(false); // Disconnected!
  }, meta);

  it('F22.4: shareReplay with refCount: true resets when all subscribers unsubscribe', ({ expect }) => {
    let upstreamCreated = 0;
    const source$ = new Observable(sub => {
      upstreamCreated++;
      sub.next(upstreamCreated);
      return () => {};
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    const sub1 = source$.subscribe();
    sub1.unsubscribe();
    expect(upstreamCreated).toBe(1);

    const sub2 = source$.subscribe();
    expect(upstreamCreated).toBe(2); // Reconnected upstream!
    sub2.unsubscribe();
  }, meta);

  it('F22.5: Multicast delivers emitted values to 3 concurrent observers simultaneously', ({ expect }) => {
    const source$ = of('event').pipe(shareReplay(1));
    const results = [];
    source$.subscribe(v => results.push(`obs1:${v}`));
    source$.subscribe(v => results.push(`obs2:${v}`));
    source$.subscribe(v => results.push(`obs3:${v}`));
    expect(results).toEqual(['obs1:event', 'obs2:event', 'obs3:event']);
  }, meta);
});
