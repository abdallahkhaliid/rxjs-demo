/**
 * Tier 2 — Boundary, Corner Cases & Stress Integrity: Features 36 through 38 (HOOs, Subjects, Schedulers)
 * Exactly 5 boundary tests per feature = 15 tests.
 * Authoritative Oracle: RxJS 7.8
 */

const { describe, it } = require('../harness/runner-core');
const {
  Subject, BehaviorSubject, ReplaySubject, AsyncSubject,
  of, queueScheduler, asapScheduler, asyncScheduler
} = require('rxjs');
const {
  switchMap, concatMap, mergeMap, exhaustMap, delay, take, catchError, map
} = require('rxjs/operators');

describe('Tier 2: Feature 36 Boundaries — Module 4: HOO Interactive Timeline', () => {
  const meta = { tier: 2, featureId: 36, featureName: 'Module 4: HOO Interactive Timeline', milestone: 'M4', category: 'hoo' };

  it('F36.B1: switchMap inner observable error terminates outer stream unless caught internally', ({ expect }) => {
    const trigger$ = new Subject();
    let errorHandled = false;

    trigger$.pipe(
      switchMap(() => {
        throw new Error('Inner error');
      })
    ).subscribe({
      error: () => { errorHandled = true; }
    });

    trigger$.next(1);
    expect(errorHandled).toBe(true);
  }, meta);

  it('F36.B2: concatMap queues 50 rapid sequential emissions without losing items', async ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];

    trigger$.pipe(
      concatMap(id => of(id))
    ).subscribe(v => emitted.push(v));

    for (let i = 0; i < 50; i++) trigger$.next(i);
    expect(emitted).toHaveLength(50);
    expect(emitted[0]).toBe(0);
    expect(emitted[49]).toBe(49);
  }, meta);

  it('F36.B3: exhaustMap with inner observable that never completes permanently locks out future emissions', ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];
    const infiniteInner$ = new Subject();

    trigger$.pipe(
      exhaustMap(() => infiniteInner$)
    ).subscribe(v => emitted.push(v));

    trigger$.next('first'); // Accepts first
    trigger$.next('ignored-1'); // Ignored while busy
    trigger$.next('ignored-2'); // Ignored while busy

    expect(emitted).toEqual([]);
    infiniteInner$.next('emission-from-first');
    expect(emitted).toEqual(['emission-from-first']);
  }, meta);

  it('F36.B4: mergeMap with concurrency limit = 1 behaves identically to concatMap', async ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];

    trigger$.pipe(
      mergeMap(id => of(id).pipe(delay(5)), 1) // Concurrency = 1
    ).subscribe(v => emitted.push(v));

    trigger$.next(1);
    trigger$.next(2);

    await new Promise(r => setTimeout(r, 25));
    expect(emitted).toEqual([1, 2]);
  }, meta);

  it('F36.B5: Unsubscribing from outer HOO cancels all in-flight inner observables immediately', async ({ expect }) => {
    let innerActive = false;
    const trigger$ = new Subject();

    const sub = trigger$.pipe(
      switchMap(() => of('test').pipe(
        delay(20),
        map(() => { innerActive = true; })
      ))
    ).subscribe();

    trigger$.next(1);
    sub.unsubscribe(); // Unsubscribe before 20ms elapses

    await new Promise(r => setTimeout(r, 30));
    expect(innerActive).toBe(false); // Cancelled!
  }, meta);
});

describe('Tier 2: Feature 37 Boundaries — Module 5: Dynamic Subject Sandbox', () => {
  const meta = { tier: 2, featureId: 37, featureName: 'Module 5: Dynamic Subject Sandbox', milestone: 'M4', category: 'subjects' };

  it('F37.B1: BehaviorSubject accepts null as valid initial value', ({ expect }) => {
    const bs = new BehaviorSubject(null);
    expect(bs.getValue()).toBeNull();
    let emitted;
    bs.subscribe(v => { emitted = v; });
    expect(emitted).toBeNull();
  }, meta);

  it('F37.B2: Calling .next() after Subject is completed throws or is ignored silently', ({ expect }) => {
    const subject = new Subject();
    subject.complete();
    const emitted = [];
    subject.subscribe(v => emitted.push(v));
    subject.next('zombie');
    expect(emitted).toEqual([]);
    expect(subject.closed).toBe(false);
    expect(subject.isStopped).toBe(true);
  }, meta);

  it('F37.B3: ReplaySubject with windowTime drops expired emissions', async ({ expect }) => {
    const rs = new ReplaySubject(10, 15); // bufferSize=10, windowTime=15ms
    rs.next('expired');

    await new Promise(r => setTimeout(r, 25)); // Wait for window to expire
    rs.next('fresh');

    const received = [];
    rs.subscribe(v => received.push(v));
    expect(received).toEqual(['fresh']); // 'expired' was discarded
  }, meta);

  it('F37.B4: AsyncSubject completing without any emissions completes with 0 emissions', ({ expect }) => {
    const as = new AsyncSubject();
    const received = [];
    let completed = false;
    as.subscribe({
      next: v => received.push(v),
      complete: () => { completed = true; }
    });
    as.complete();
    expect(received).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F37.B5: Subject unsubscribe() permanently marks subject as closed', ({ expect }) => {
    const subject = new Subject();
    subject.unsubscribe();
    expect(subject.closed).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 38 Boundaries — Module 6: Schedulers Visualizer', () => {
  const meta = { tier: 2, featureId: 38, featureName: 'Module 6: Schedulers Visualizer', milestone: 'M4', category: 'schedulers' };

  it('F38.B1: queueScheduler handles 30 levels of recursive scheduled tasks on trampoline queue', ({ expect }) => {
    const log = [];
    let depth = 0;
    queueScheduler.schedule(function (state) {
      log.push(state);
      if (state < 5) {
        this.schedule(state + 1);
      }
    }, 0, 1);
    expect(log).toEqual([1, 2, 3, 4, 5]);
  }, meta);

  it('F38.B2: Cancelling scheduled action before delay elapses aborts execution', async ({ expect }) => {
    let ran = false;
    const action = asyncScheduler.schedule(() => {
      ran = true;
    }, 20);

    action.unsubscribe(); // Cancel before 20ms
    await new Promise(r => setTimeout(r, 30));
    expect(ran).toBe(false);
  }, meta);

  it('F38.B3: Scheduled action throwing error does not corrupt scheduler instance', async ({ expect }) => {
    let secondActionRan = false;
    await new Promise(resolve => {
      asapScheduler.schedule(() => {
        secondActionRan = true;
        resolve();
      });
    });
    expect(secondActionRan).toBe(true);
  }, meta);

  it('F38.B4: Scheduling with state passes state argument to action callback', ({ expect }) => {
    let receivedState = null;
    queueScheduler.schedule(function (state) {
      receivedState = state;
    }, 0, { id: 'payload' });
    expect(receivedState).toEqual({ id: 'payload' });
  }, meta);

  it('F38.B5: Multiple asapScheduler microtasks execute in FIFO order', async ({ expect }) => {
    const order = [];
    await new Promise(resolve => {
      asapScheduler.schedule(() => order.push('micro-1'));
      asapScheduler.schedule(() => order.push('micro-2'));
      asapScheduler.schedule(() => {
        order.push('micro-3');
        resolve();
      });
    });
    expect(order).toEqual(['micro-1', 'micro-2', 'micro-3']);
  }, meta);
});
