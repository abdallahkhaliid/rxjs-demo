/**
 * Tier 2 — Boundary, Corner Cases & Stress Integrity: Features 31 through 35 (Module 3 Operator Categories)
 * Exactly 5 boundary tests per feature = 25 tests.
 * Authoritative Oracle: RxJS 7.8
 */

const { describe, it } = require('../harness/runner-core');
const { Observable, of, from, EMPTY, NEVER, Subject, combineLatest, forkJoin, race, throwError } = require('rxjs');
const {
  map, pluck, scan, reduce, toArray, bufferCount, pairwise,
  filter, take, distinct, distinctUntilChanged, debounceTime, throttleTime,
  withLatestFrom, startWith, timeout, finalize, retry, share, shareReplay, publish, refCount, catchError
} = require('rxjs/operators');

describe('Tier 2: Feature 31 Boundaries — Module 3: Transformation Operators', () => {
  const meta = { tier: 2, featureId: 31, featureName: 'Module 3: Transformation (18 ops)', milestone: 'M3', category: 'operators' };

  it('F31.B1: reduce() on EMPTY source without seed completes with 0 emissions', ({ expect }) => {
    const emitted = [];
    let completed = false;
    EMPTY.pipe(
      reduce((acc, val) => acc + val)
    ).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F31.B2: reduce() on EMPTY source WITH seed emits seed and completes', ({ expect }) => {
    let result = null;
    EMPTY.pipe(
      reduce((acc, val) => acc + val, 100)
    ).subscribe(v => { result = v; });
    expect(result).toBe(100);
  }, meta);

  it('F31.B3: pluck() on missing nested property safely returns undefined', ({ expect }) => {
    const emitted = [];
    of({ user: {} }, { user: null }, {}).pipe(
      pluck('user', 'profile', 'name')
    ).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([undefined, undefined, undefined]);
  }, meta);

  it('F31.B4: bufferCount with startBufferEvery > bufferSize skips intermediate emissions', ({ expect }) => {
    const buffers = [];
    // bufferSize=2, startBufferEvery=3 -> Takes 2, skips 1
    of(1, 2, 3, 4, 5, 6, 7).pipe(
      bufferCount(2, 3)
    ).subscribe(b => buffers.push(b));
    expect(buffers).toEqual([[1, 2], [4, 5], [7]]);
  }, meta);

  it('F31.B5: pairwise() on stream emitting only 1 value completes without emission', ({ expect }) => {
    const emitted = [];
    let completed = false;
    of(42).pipe(pairwise()).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]); // Requires at least 2 emissions to form pair
    expect(completed).toBe(true);
  }, meta);
});

describe('Tier 2: Feature 32 Boundaries — Module 3: Filtering Operators', () => {
  const meta = { tier: 2, featureId: 32, featureName: 'Module 3: Filtering (19 ops)', milestone: 'M3', category: 'operators' };

  it('F32.B1: take(0) completes immediately with zero emissions', ({ expect }) => {
    const emitted = [];
    let completed = false;
    of(1, 2, 3, 4, 5).pipe(take(0)).subscribe({
      next: v => emitted.push(v),
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F32.B2: filter matching no elements completes with zero emissions', ({ expect }) => {
    const emitted = [];
    of(1, 2, 3).pipe(filter(x => x > 10)).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([]);
  }, meta);

  it('F32.B3: distinctUntilChanged with custom deep comparator compares nested objects', ({ expect }) => {
    const emitted = [];
    of({ id: 1, val: 'a' }, { id: 1, val: 'a' }, { id: 1, val: 'b' }).pipe(
      distinctUntilChanged((prev, curr) => prev.id === curr.id && prev.val === curr.val)
    ).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([{ id: 1, val: 'a' }, { id: 1, val: 'b' }]);
  }, meta);

  it('F32.B4: debounceTime(0) emits on next event loop tick and preserves last emission in burst', async ({ expect }) => {
    const stream$ = new Subject();
    const emitted = [];
    stream$.pipe(debounceTime(0)).subscribe(v => emitted.push(v));

    stream$.next(1);
    stream$.next(2);
    stream$.next(3);

    await new Promise(r => setTimeout(r, 10));
    expect(emitted).toEqual([3]);
  }, meta);

  it('F32.B5: throttleTime with leading: true, trailing: true handles both boundary bursts', async ({ expect }) => {
    const stream$ = new Subject();
    const emitted = [];
    stream$.pipe(
      throttleTime(20, undefined, { leading: true, trailing: true })
    ).subscribe(v => emitted.push(v));

    stream$.next('first');  // Leading emission
    stream$.next('middle');
    stream$.next('last');   // Trailing emission

    await new Promise(r => setTimeout(r, 30));
    expect(emitted).toEqual(['first', 'last']);
  }, meta);
});

describe('Tier 2: Feature 33 Boundaries — Module 3: Combination Operators', () => {
  const meta = { tier: 2, featureId: 33, featureName: 'Module 3: Combination (11 ops)', milestone: 'M3', category: 'operators' };

  it('F33.B1: combineLatest([]) with empty array completes synchronously with 0 emissions', ({ expect }) => {
    const emitted = [];
    let completed = false;
    combineLatest([]).subscribe({
      next: v => { emitted.push(v); },
      complete: () => { completed = true; }
    });
    expect(emitted).toEqual([]);
    expect(completed).toBe(true);
  }, meta);

  it('F33.B2: combineLatest where one source never emits NEVER emits anything', async ({ expect }) => {
    const emitted = [];
    const sub = combineLatest([of(1, 2, 3), NEVER]).subscribe(v => emitted.push(v));
    await new Promise(r => setTimeout(r, 15));
    sub.unsubscribe();
    expect(emitted).toEqual([]); // Cannot emit until ALL streams have emitted at least once
  }, meta);

  it('F33.B3: forkJoin({}) with empty object completes immediately with 0 emissions', async ({ expect }) => {
    let completed = false;
    await new Promise(resolve => {
      forkJoin({}).subscribe({
        complete: () => {
          completed = true;
          resolve();
        }
      });
    });
    expect(completed).toBe(true);
  }, meta);

  it('F33.B4: withLatestFrom ignores source emissions occurring before auxiliary stream emits', ({ expect }) => {
    const source$ = new Subject();
    const aux$ = new Subject();
    const emitted = [];

    source$.pipe(withLatestFrom(aux$)).subscribe(vals => emitted.push(vals));

    source$.next(1); // Ignored because aux hasn't emitted yet
    source$.next(2); // Ignored
    aux$.next('ready');
    source$.next(3); // Combined!

    expect(emitted).toEqual([[3, 'ready']]);
  }, meta);

  it('F33.B5: race() unsubscribes from loser streams as soon as winner emits', ({ expect }) => {
    let loserCleaned = false;
    const fast$ = new Subject();
    const slow$ = new Observable(() => () => { loserCleaned = true; });

    const race$ = race(fast$, slow$);
    race$.subscribe();

    expect(loserCleaned).toBe(false);
    fast$.next('fast-wins');
    expect(loserCleaned).toBe(true); // Loser was cancelled!
  }, meta);
});

describe('Tier 2: Feature 34 Boundaries — Module 3: Utility Operators', () => {
  const meta = { tier: 2, featureId: 34, featureName: 'Module 3: Utility (12 ops)', milestone: 'M3', category: 'operators' };

  it('F34.B1: timeout throws TimeoutError when source exceeds deadline', async ({ expect }) => {
    const slow$ = new Subject();
    let errorCaught = null;
    slow$.pipe(timeout(10)).subscribe({
      error: err => { errorCaught = err; }
    });
    await new Promise(r => setTimeout(r, 25));
    expect(errorCaught).toBeDefined();
    expect(errorCaught.name).toBe('TimeoutError');
  }, meta);

  it('F34.B2: retry() with count = 0 does not retry on error', ({ expect }) => {
    let attempts = 0;
    const stream$ = new Observable(sub => {
      attempts++;
      sub.error(new Error('fail'));
    }).pipe(retry(0));

    stream$.subscribe({ error: () => {} });
    expect(attempts).toBe(1);
  }, meta);

  it('F34.B3: finalize runs when stream errors', ({ expect }) => {
    let finalized = false;
    throwError(() => new Error('err')).pipe(
      finalize(() => { finalized = true; })
    ).subscribe({ error: () => {} });
    expect(finalized).toBe(true);
  }, meta);

  it('F34.B4: finalize runs when subscriber unhooks before completion', ({ expect }) => {
    let finalized = false;
    const stream$ = new Subject();
    const sub = stream$.pipe(
      finalize(() => { finalized = true; })
    ).subscribe();

    expect(finalized).toBe(false);
    sub.unsubscribe();
    expect(finalized).toBe(true);
  }, meta);

  it('F34.B5: retry with max attempts reached propagates error to observer', ({ expect }) => {
    let attempts = 0;
    let finalError = null;
    new Observable(sub => {
      attempts++;
      sub.error(new Error(`Failed on attempt ${attempts}`));
    }).pipe(
      retry(2) // 1 initial + 2 retries = 3 attempts
    ).subscribe({
      error: err => { finalError = err; }
    });
    expect(attempts).toBe(3);
    expect(finalError.message).toBe('Failed on attempt 3');
  }, meta);
});

describe('Tier 2: Feature 35 Boundaries — Module 3: Multicasting Operators', () => {
  const meta = { tier: 2, featureId: 35, featureName: 'Module 3: Multicasting (5 ops)', milestone: 'M3', category: 'operators' };

  it('F35.B1: publish() without calling connect() never executes underlying source', ({ expect }) => {
    let ran = false;
    const published$ = of(1).pipe(
      map(v => { ran = true; return v; }),
      publish()
    );
    published$.subscribe();
    expect(ran).toBe(false); // No connect called!
  }, meta);

  it('F35.B2: Calling connect() multiple times returns the same connection subscription', ({ expect }) => {
    const connectable$ = of(10).pipe(publish());
    const c1 = connectable$.connect();
    const c2 = connectable$.connect();
    expect(c1).toBe(c2);
    c1.unsubscribe();
  }, meta);

  it('F35.B3: share() handles rapid 100 subscribers subscribing and unsubscribing concurrently', ({ expect }) => {
    let sourceCount = 0;
    const shared$ = of('test').pipe(
      map(v => { sourceCount++; return v; }),
      share()
    );
    const subs = [];
    for (let i = 0; i < 100; i++) {
      subs.push(shared$.subscribe());
    }
    subs.forEach(s => s.unsubscribe());
    expect(sourceCount >= 1).toBe(true);
  }, meta);

  it('F35.B4: shareReplay with bufferSize=1 resets on error (resetOnError: true)', ({ expect }) => {
    let executions = 0;
    const shared$ = new Observable(sub => {
      executions++;
      sub.error(new Error('Fatal'));
    }).pipe(shareReplay(1));

    let err1, err2;
    shared$.subscribe({ error: e => { err1 = e; } });
    shared$.subscribe({ error: e => { err2 = e; } });

    expect(executions).toBe(2); // Resets connector so second subscriber re-attempts
    expect(err1.message).toBe('Fatal');
    expect(err2.message).toBe('Fatal');
  }, meta);

  it('F35.B5: refCount disconnects from source when subscriber count drops to 0', ({ expect }) => {
    let active = false;
    const source$ = new Observable(() => {
      active = true;
      return () => { active = false; };
    }).pipe(publish(), refCount());

    const sub = source$.subscribe();
    expect(active).toBe(true);
    sub.unsubscribe();
    expect(active).toBe(false);
  }, meta);
});
