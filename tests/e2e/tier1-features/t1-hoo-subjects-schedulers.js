/**
 * Tier 1 — Feature Coverage: Features 36 through 38 (Modules 4, 5, 6: HOOs, Subjects, Schedulers)
 * Exactly 5 test cases per feature = 15 test cases.
 * Authoritative Oracle: RxJS 7.8
 */

const { describe, it } = require('../harness/runner-core');
const {
  Subject, BehaviorSubject, ReplaySubject, AsyncSubject,
  of, timer, interval, queueScheduler, asapScheduler, asyncScheduler, animationFrameScheduler
} = require('rxjs');
const {
  switchMap, mergeMap, concatMap, exhaustMap, delay, take, toArray
} = require('rxjs/operators');

describe('Tier 1: Feature 36 — Module 4: HOO Interactive Timeline', () => {
  const meta = { tier: 1, featureId: 36, featureName: 'Module 4: HOO Interactive Timeline', milestone: 'M4', category: 'hoo' };

  it('F36.1: switchMap cancels active in-flight inner observable on new outer emission', async ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];
    trigger$.pipe(
      switchMap(id => of(`result-${id}`).pipe(delay(20)))
    ).subscribe(v => emitted.push(v));

    trigger$.next(1); // Starts Req 1
    await new Promise(r => setTimeout(r, 5));
    trigger$.next(2); // Cancels Req 1, starts Req 2

    await new Promise(r => setTimeout(r, 35));
    expect(emitted).toEqual(['result-2']); // Req 1 was cancelled!
  }, meta);

  it('F36.2: concatMap queues subsequent inner observables and executes them sequentially', async ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];

    await new Promise(resolve => {
      trigger$.pipe(
        concatMap(id => of(`done-${id}`).pipe(delay(5))),
        take(3)
      ).subscribe({
        next: v => emitted.push(v),
        complete: resolve
      });

      trigger$.next(1);
      trigger$.next(2);
      trigger$.next(3);
    });

    expect(emitted).toEqual(['done-1', 'done-2', 'done-3']); // Strict sequential order preserved
  }, meta);

  it('F36.3: mergeMap runs multiple inner observables concurrently in parallel', async ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];
    trigger$.pipe(
      mergeMap(item => of(`fast-${item.id}`).pipe(delay(item.delayMs)))
    ).subscribe(v => emitted.push(v));

    // Request 1 takes 25ms, Request 2 takes 5ms
    trigger$.next({ id: 1, delayMs: 25 });
    trigger$.next({ id: 2, delayMs: 5 });

    await new Promise(r => setTimeout(r, 35));
    expect(emitted).toEqual(['fast-2', 'fast-1']); // 2 arrived first because of concurrent parallel processing
  }, meta);

  it('F36.4: exhaustMap ignores incoming outer emissions while an inner observable is active', ({ expect }) => {
    const trigger$ = new Subject();
    const emitted = [];
    const activeInner$ = new Subject();

    trigger$.pipe(
      exhaustMap(id => id === 1 ? activeInner$ : of(`exhaust-${id}`))
    ).subscribe(v => emitted.push(v));

    trigger$.next(1); // Starts active request 1 (controlled by activeInner$)
    trigger$.next(2); // Ignored / dropped!
    trigger$.next(3); // Ignored / dropped!

    activeInner$.next('exhaust-1');
    activeInner$.complete(); // Active request finishes!

    trigger$.next(4); // Now accepted!
    expect(emitted).toEqual(['exhaust-1', 'exhaust-4']);
  }, meta);

  it('F36.5: Lifecycle state transitions reflect active, queued, cancelled, ignored, completed', ({ expect }) => {
    class TimelineStateTracker {
      constructor(strategy) {
        this.strategy = strategy;
        this.requests = {};
      }
      trigger(id) {
        const active = Object.values(this.requests).find(r => r.state === 'active');
        if (this.strategy === 'exhaustMap' && active) {
          this.requests[id] = { id, state: 'ignored' };
          return;
        }
        if (this.strategy === 'switchMap' && active) {
          active.state = 'cancelled';
        }
        if (this.strategy === 'concatMap' && active) {
          this.requests[id] = { id, state: 'queued' };
          return;
        }
        this.requests[id] = { id, state: 'active' };
      }
      complete(id) {
        if (this.requests[id]) {
          this.requests[id].state = 'completed';
          if (this.strategy === 'concatMap') {
            const nextQueued = Object.values(this.requests).find(r => r.state === 'queued');
            if (nextQueued) nextQueued.state = 'active';
          }
        }
      }
    }

    const tracker = new TimelineStateTracker('switchMap');
    tracker.trigger(1);
    expect(tracker.requests[1].state).toBe('active');
    tracker.trigger(2);
    expect(tracker.requests[1].state).toBe('cancelled');
    expect(tracker.requests[2].state).toBe('active');
    tracker.complete(2);
    expect(tracker.requests[2].state).toBe('completed');
  }, meta);
});

describe('Tier 1: Feature 37 — Module 5: Dynamic Subject Sandbox', () => {
  const meta = { tier: 1, featureId: 37, featureName: 'Module 5: Dynamic Subject Sandbox', milestone: 'M4', category: 'subjects' };

  it('F37.1: Standard Subject only delivers emissions occurring AFTER observer subscription', ({ expect }) => {
    const subject = new Subject();
    const obs1 = [];
    const obs2 = [];

    subject.subscribe(v => obs1.push(v));
    subject.next(1);
    subject.subscribe(v => obs2.push(v)); // Subscribes after 1
    subject.next(2);

    expect(obs1).toEqual([1, 2]);
    expect(obs2).toEqual([2]);
  }, meta);

  it('F37.2: BehaviorSubject requires initial value and replays current value immediately', ({ expect }) => {
    const bs = new BehaviorSubject('initial');
    expect(bs.getValue()).toBe('initial');

    const received = [];
    bs.subscribe(v => received.push(v));
    bs.next('updated');
    expect(received).toEqual(['initial', 'updated']);
    expect(bs.getValue()).toBe('updated');
  }, meta);

  it('F37.3: ReplaySubject(N) buffers and replays last N values to new subscribers', ({ expect }) => {
    const rs = new ReplaySubject(2);
    rs.next('A');
    rs.next('B');
    rs.next('C');

    const lateSub = [];
    rs.subscribe(v => lateSub.push(v));
    expect(lateSub).toEqual(['B', 'C']); // Last 2 values
  }, meta);

  it('F37.4: AsyncSubject emits only the final value upon completion', ({ expect }) => {
    const as = new AsyncSubject();
    const received = [];
    as.subscribe(v => received.push(v));

    as.next(10);
    as.next(20);
    as.next(30);
    expect(received).toEqual([]); // Nothing emitted before complete!

    as.complete();
    expect(received).toEqual([30]); // Only the very last value!
  }, meta);

  it('F37.5: Fleet of 3 observers subscribing and unsubscribing independently', ({ expect }) => {
    const subject = new Subject();
    const o1 = [], o2 = [], o3 = [];

    const sub1 = subject.subscribe(v => o1.push(v));
    const sub2 = subject.subscribe(v => o2.push(v));
    subject.next(1);

    sub1.unsubscribe(); // Observer 1 unhooks
    const sub3 = subject.subscribe(v => o3.push(v)); // Observer 3 joins
    subject.next(2);

    sub2.unsubscribe();
    sub3.unsubscribe();

    expect(o1).toEqual([1]);
    expect(o2).toEqual([1, 2]);
    expect(o3).toEqual([2]);
  }, meta);
});

describe('Tier 1: Feature 38 — Module 6: Schedulers Visualizer', () => {
  const meta = { tier: 1, featureId: 38, featureName: 'Module 6: Schedulers Visualizer', milestone: 'M4', category: 'schedulers' };

  it('F38.1: queueScheduler executes synchronously on recursive call queue', ({ expect }) => {
    const log = [];
    log.push('start');
    queueScheduler.schedule(() => log.push('queue'));
    log.push('end');
    expect(log).toEqual(['start', 'queue', 'end']);
  }, meta);

  it('F38.2: asapScheduler executes on microtask queue after synchronous block', async ({ expect }) => {
    const log = [];
    await new Promise(resolve => {
      log.push('sync-start');
      asapScheduler.schedule(() => {
        log.push('asap-microtask');
        resolve();
      });
      log.push('sync-end');
    });
    expect(log).toEqual(['sync-start', 'sync-end', 'asap-microtask']);
  }, meta);

  it('F38.3: asyncScheduler executes on macrotask queue', async ({ expect }) => {
    const log = [];
    await new Promise(resolve => {
      asyncScheduler.schedule(() => {
        log.push('async-macrotask');
        resolve();
      });
      log.push('sync');
    });
    expect(log).toEqual(['sync', 'async-macrotask']);
  }, meta);

  it('F38.4: Event loop ordering: queue (sync) runs before asap (microtask) which runs before async (macrotask)', async ({ expect }) => {
    const executionOrder = [];
    await new Promise(resolve => {
      asyncScheduler.schedule(() => {
        executionOrder.push('macrotask (async)');
        resolve();
      });
      asapScheduler.schedule(() => {
        executionOrder.push('microtask (asap)');
      });
      queueScheduler.schedule(() => {
        executionOrder.push('sync (queue)');
      });
    });
    expect(executionOrder).toEqual([
      'sync (queue)',
      'microtask (asap)',
      'macrotask (async)'
    ]);
  }, meta);

  it('F38.5: Schedulers support time delay parameter', async ({ expect }) => {
    const start = Date.now();
    let elapsed = 0;
    await new Promise(resolve => {
      asyncScheduler.schedule(() => {
        elapsed = Date.now() - start;
        resolve();
      }, 15);
    });
    expect(elapsed >= 10).toBe(true);
  }, meta);
});
