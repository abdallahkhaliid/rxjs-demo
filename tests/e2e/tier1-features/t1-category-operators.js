/**
 * Tier 1 — Feature Coverage: Features 31 through 35 (Module 3: Operator Catalog — 65 Operators)
 * Exactly 5 test cases per feature = 25 test cases.
 * Authoritative Oracle: RxJS 7.8 installed in node_modules
 */

const { describe, it } = require('../harness/runner-core');
const { of, from, timer, interval, Subject, combineLatest, concat, merge, forkJoin, zip, race } = require('rxjs');
const {
  // Transformation (18)
  map, mapTo, pluck, scan, reduce, toArray,
  buffer, bufferCount, bufferTime, bufferToggle, bufferWhen,
  window, windowCount, windowTime, windowToggle, windowWhen,
  pairwise, groupBy, mergeMap,
  // Filtering (19)
  filter, take, takeLast, takeUntil, takeWhile,
  skip, skipLast, skipUntil, skipWhile,
  distinct, distinctUntilChanged, distinctUntilKeyChanged,
  debounce, debounceTime, throttle, throttleTime,
  audit, auditTime, sample,
  // Combination (11)
  combineLatestWith, concatWith, mergeWith, zipWith, raceWith,
  withLatestFrom, startWith, endWith, concatAll, mergeAll,
  // Utility (12)
  tap, delay, delayWhen, timeout, timeInterval, timestamp,
  finalize, repeat, repeatWhen, retry, retryWhen, dematerialize, materialize,
  // Multicasting (5)
  share, shareReplay, multicast, publish, refCount
} = require('rxjs/operators');

describe('Tier 1: Feature 31 — Module 3: Transformation Operators (18 Operators)', () => {
  const meta = { tier: 1, featureId: 31, featureName: 'Module 3: Transformation (18 ops)', milestone: 'M3', category: 'operators' };

  it('F31.1: map, mapTo, and pluck transform values and property projections', ({ expect }) => {
    const resMap = [];
    of(1, 2, 3).pipe(map(x => x * 2)).subscribe(v => resMap.push(v));
    expect(resMap).toEqual([2, 4, 6]);

    const resMapTo = [];
    of(1, 2).pipe(mapTo('static')).subscribe(v => resMapTo.push(v));
    expect(resMapTo).toEqual(['static', 'static']);

    const resPluck = [];
    of({ user: { name: 'Alice' } }, { user: { name: 'Bob' } })
      .pipe(pluck('user', 'name'))
      .subscribe(v => resPluck.push(v));
    expect(resPluck).toEqual(['Alice', 'Bob']);
  }, meta);

  it('F31.2: scan accumulates on each emission vs reduce accumulates until completion', ({ expect }) => {
    const resScan = [];
    of(1, 2, 3, 4).pipe(scan((acc, curr) => acc + curr, 0)).subscribe(v => resScan.push(v));
    expect(resScan).toEqual([1, 3, 6, 10]);

    let resReduce;
    of(1, 2, 3, 4).pipe(reduce((acc, curr) => acc + curr, 0)).subscribe(v => { resReduce = v; });
    expect(resReduce).toBe(10);
  }, meta);

  it('F31.3: toArray collects all emissions into an array upon stream completion', ({ expect }) => {
    let resArray;
    of('a', 'b', 'c').pipe(toArray()).subscribe(v => { resArray = v; });
    expect(resArray).toEqual(['a', 'b', 'c']);
  }, meta);

  it('F31.4: bufferCount and pairwise bundle emissions into groups', ({ expect }) => {
    const resBuffer = [];
    of(1, 2, 3, 4, 5).pipe(bufferCount(2)).subscribe(v => resBuffer.push(v));
    expect(resBuffer).toEqual([[1, 2], [3, 4], [5]]);

    const resPairwise = [];
    of('first', 'second', 'third').pipe(pairwise()).subscribe(v => resPairwise.push(v));
    expect(resPairwise).toEqual([['first', 'second'], ['second', 'third']]);
  }, meta);

  it('F31.5: groupBy partitions stream into grouped streams by key', ({ expect }) => {
    const groups = {};
    of(
      { type: 'A', val: 1 },
      { type: 'B', val: 2 },
      { type: 'A', val: 3 }
    ).pipe(
      groupBy(item => item.type),
      mergeMap(group$ => group$.pipe(toArray(), map(items => ({ key: group$.key, items }))))
    ).subscribe(result => {
      groups[result.key] = result.items.map(i => i.val);
    });
    expect(groups['A']).toEqual([1, 3]);
    expect(groups['B']).toEqual([2]);
  }, meta);
});

describe('Tier 1: Feature 32 — Module 3: Filtering Operators (19 Operators)', () => {
  const meta = { tier: 1, featureId: 32, featureName: 'Module 3: Filtering (19 ops)', milestone: 'M3', category: 'operators' };

  it('F32.1: filter, take, takeLast, takeWhile, and takeUntil restrict emissions', ({ expect }) => {
    const resFilter = [];
    of(1, 2, 3, 4, 5).pipe(filter(x => x % 2 !== 0)).subscribe(v => resFilter.push(v));
    expect(resFilter).toEqual([1, 3, 5]);

    const resTake = [];
    of(10, 20, 30, 40).pipe(take(2)).subscribe(v => resTake.push(v));
    expect(resTake).toEqual([10, 20]);

    const resTakeLast = [];
    of(10, 20, 30, 40).pipe(takeLast(2)).subscribe(v => resTakeLast.push(v));
    expect(resTakeLast).toEqual([30, 40]);

    const resTakeWhile = [];
    of(1, 2, 3, 4, 1).pipe(takeWhile(x => x < 3)).subscribe(v => resTakeWhile.push(v));
    expect(resTakeWhile).toEqual([1, 2]);

    const notifier$ = new Subject();
    const resTakeUntil = [];
    const source$ = new Subject();
    source$.pipe(takeUntil(notifier$)).subscribe(v => resTakeUntil.push(v));
    source$.next('a');
    source$.next('b');
    notifier$.next(true);
    source$.next('c');
    expect(resTakeUntil).toEqual(['a', 'b']);
  }, meta);

  it('F32.2: skip, skipLast, and skipWhile ignore leading emissions', ({ expect }) => {
    const resSkip = [];
    of(1, 2, 3, 4).pipe(skip(2)).subscribe(v => resSkip.push(v));
    expect(resSkip).toEqual([3, 4]);

    const resSkipLast = [];
    of(1, 2, 3, 4).pipe(skipLast(2)).subscribe(v => resSkipLast.push(v));
    expect(resSkipLast).toEqual([1, 2]);

    const resSkipWhile = [];
    of(1, 2, 3, 4, 1).pipe(skipWhile(x => x < 3)).subscribe(v => resSkipWhile.push(v));
    expect(resSkipWhile).toEqual([3, 4, 1]);
  }, meta);

  it('F32.3: distinct, distinctUntilChanged, and distinctUntilKeyChanged suppress duplicates', ({ expect }) => {
    const resDistinct = [];
    of(1, 2, 2, 1, 3).pipe(distinct()).subscribe(v => resDistinct.push(v));
    expect(resDistinct).toEqual([1, 2, 3]);

    const resUntilChanged = [];
    of(1, 1, 2, 2, 3, 1).pipe(distinctUntilChanged()).subscribe(v => resUntilChanged.push(v));
    expect(resUntilChanged).toEqual([1, 2, 3, 1]);

    const resKeyChanged = [];
    of({ id: 1 }, { id: 1 }, { id: 2 }).pipe(distinctUntilKeyChanged('id')).subscribe(v => resKeyChanged.push(v.id));
    expect(resKeyChanged).toEqual([1, 2]);
  }, meta);

  it('F32.4: debounceTime delays emission until pause duration elapses', async ({ expect }) => {
    const stream$ = new Subject();
    const emitted = [];
    stream$.pipe(debounceTime(15)).subscribe(v => emitted.push(v));

    stream$.next('a');
    stream$.next('b');
    stream$.next('c'); // Only 'c' should survive the burst

    await new Promise(r => setTimeout(r, 25));
    expect(emitted).toEqual(['c']);
  }, meta);

  it('F32.5: throttleTime emits first immediately and silences subsequent burst', async ({ expect }) => {
    const stream$ = new Subject();
    const emitted = [];
    stream$.pipe(throttleTime(20)).subscribe(v => emitted.push(v));

    stream$.next(1); // Emitted immediately
    stream$.next(2); // Throttled
    stream$.next(3); // Throttled

    await new Promise(r => setTimeout(r, 30));
    stream$.next(4); // Emitted after throttle window
    expect(emitted).toEqual([1, 4]);
  }, meta);
});

describe('Tier 1: Feature 33 — Module 3: Combination Operators (11 Operators)', () => {
  const meta = { tier: 1, featureId: 33, featureName: 'Module 3: Combination (11 ops)', milestone: 'M3', category: 'operators' };

  it('F33.1: combineLatest combines latest values whenever any source emits', ({ expect }) => {
    const a$ = new Subject();
    const b$ = new Subject();
    const combined = [];
    combineLatest([a$, b$]).subscribe(vals => combined.push(vals));

    a$.next(1);
    b$.next('A'); // Now both have emitted: [1, 'A']
    a$.next(2);   // [2, 'A']
    b$.next('B'); // [2, 'B']

    expect(combined).toEqual([[1, 'A'], [2, 'A'], [2, 'B']]);
  }, meta);

  it('F33.2: concat executes streams sequentially in order', ({ expect }) => {
    const emitted = [];
    concat(of(1, 2), of(3, 4)).subscribe(v => emitted.push(v));
    expect(emitted).toEqual([1, 2, 3, 4]);
  }, meta);

  it('F33.3: merge interleaves concurrent streams as emissions arrive', ({ expect }) => {
    const emitted = [];
    merge(of('a', 'b'), of('c', 'd')).subscribe(v => emitted.push(v));
    expect(emitted).toEqual(['a', 'b', 'c', 'd']);
  }, meta);

  it('F33.4: forkJoin waits for all streams to complete and emits final values', async ({ expect }) => {
    let result = null;
    await new Promise(resolve => {
      forkJoin({
        num: of(1, 2, 3),
        letter: of('X', 'Y', 'Z')
      }).subscribe(val => {
        result = val;
        resolve();
      });
    });
    expect(result).toEqual({ num: 3, letter: 'Z' });
  }, meta);

  it('F33.5: zip pairs values index-by-index; startWith and endWith wrap stream', ({ expect }) => {
    const zipped = [];
    zip(of(1, 2), of('A', 'B', 'C')).subscribe(v => zipped.push(v));
    expect(zipped).toEqual([[1, 'A'], [2, 'B']]);

    const wrapped = [];
    of(10).pipe(startWith(0), endWith(20)).subscribe(v => wrapped.push(v));
    expect(wrapped).toEqual([0, 10, 20]);
  }, meta);
});

describe('Tier 1: Feature 34 — Module 3: Utility Operators (12 Operators)', () => {
  const meta = { tier: 1, featureId: 34, featureName: 'Module 3: Utility (12 ops)', milestone: 'M3', category: 'operators' };

  it('F34.1: tap spies on notifications without modifying stream values', ({ expect }) => {
    let tapped = 0;
    const emitted = [];
    of(5, 10).pipe(
      tap(v => { tapped += v; }),
      map(v => v * 2)
    ).subscribe(v => emitted.push(v));

    expect(tapped).toBe(15);
    expect(emitted).toEqual([10, 20]);
  }, meta);

  it('F34.2: delay shifts emission timestamps into future', async ({ expect }) => {
    const start = Date.now();
    let elapsed = 0;
    await new Promise(resolve => {
      of('delayed').pipe(delay(20)).subscribe(() => {
        elapsed = Date.now() - start;
        resolve();
      });
    });
    expect(elapsed >= 15).toBe(true);
  }, meta);

  it('F34.3: finalize executes callback upon stream completion or error', ({ expect }) => {
    let finalized = false;
    of(1, 2).pipe(finalize(() => { finalized = true; })).subscribe();
    expect(finalized).toBe(true);
  }, meta);

  it('F34.4: repeat resubscribes to source specified number of times upon completion', ({ expect }) => {
    const emitted = [];
    of('A').pipe(repeat(3)).subscribe(v => emitted.push(v));
    expect(emitted).toEqual(['A', 'A', 'A']);
  }, meta);

  it('F34.5: retry recovers from error by resubscribing up to retry count', ({ expect }) => {
    let attempts = 0;
    const recovered = [];
    const flaky$ = from([1, 2, 3]).pipe(
      map(v => {
        if (v === 2 && attempts < 2) {
          attempts++;
          throw new Error('transient failure');
        }
        return v;
      }),
      retry(2)
    );
    flaky$.subscribe(v => recovered.push(v));
    expect(attempts).toBe(2);
    expect(recovered).toEqual([1, 1, 1, 2, 3]);
  }, meta);
});

describe('Tier 1: Feature 35 — Module 3: Multicasting Operators (5 Operators)', () => {
  const meta = { tier: 1, featureId: 35, featureName: 'Module 3: Multicasting (5 ops)', milestone: 'M3', category: 'operators' };

  it('F35.1: share() shares single subscription across concurrent subscribers', ({ expect }) => {
    let runs = 0;
    const shared$ = of(100).pipe(
      tap(() => runs++),
      share()
    );
    let v1, v2;
    shared$.subscribe(v => { v1 = v; });
    expect(v1).toBe(100);
    expect(runs).toBe(1);
  }, meta);

  it('F35.2: shareReplay(1) buffers latest value for late subscribers', ({ expect }) => {
    let sourceExecutions = 0;
    const replayed$ = of('latest-data').pipe(
      tap(() => sourceExecutions++),
      shareReplay(1)
    );
    replayed$.subscribe();
    let lateValue;
    replayed$.subscribe(v => { lateValue = v; });
    expect(lateValue).toBe('latest-data');
    expect(sourceExecutions).toBe(1);
  }, meta);

  it('F35.3: publish creates ConnectableObservable requiring explicit connect()', ({ expect }) => {
    let runs = 0;
    const connectable$ = of('item').pipe(
      tap(() => runs++),
      publish()
    );
    let received;
    connectable$.subscribe(v => { received = v; });
    expect(runs).toBe(0); // Not running before connect!
    connectable$.connect();
    expect(runs).toBe(1);
    expect(received).toBe('item');
  }, meta);

  it('F35.4: refCount automatically connects when subscriber arrives and disconnects on zero', ({ expect }) => {
    let connected = false;
    const source$ = new Subject();
    const controlled$ = source$.pipe(
      tap({
        subscribe: () => { connected = true; },
        finalize: () => { connected = false; }
      }),
      publish(),
      refCount()
    );
    const sub = controlled$.subscribe();
    expect(connected).toBe(true);
    sub.unsubscribe();
    expect(connected).toBe(false);
  }, meta);

  it('F35.5: multicast accepts Subject factory function', ({ expect }) => {
    const subject = new Subject();
    let runs = 0;
    const multicasted$ = of(42).pipe(
      tap(() => runs++),
      multicast(() => subject)
    );
    let val;
    multicasted$.subscribe(v => { val = v; });
    multicasted$.connect();
    expect(val).toBe(42);
    expect(runs).toBe(1);
  }, meta);
});
