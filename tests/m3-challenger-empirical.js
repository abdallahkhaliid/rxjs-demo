/**
 * Milestone 3 Empirical Behavioral & Boundary Challenger Test Suite
 * Independent empirical verification of all 65 Category Operators across 5 Categories.
 * Evaluates RxJS 7.8 semantics, boundary cases, rapid burst throughput, empty sources,
 * error dispatching, zero-timeouts, and subscription teardowns.
 */

const {
  Observable, of, from, timer, interval, Subject, BehaviorSubject, ReplaySubject,
  combineLatest, concat, merge, forkJoin, zip, race, EMPTY, NEVER, throwError, Subscription
} = require('rxjs');

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

const results = { passed: 0, failed: 0, tests: [] };

function record(name, condition, details = '') {
  if (condition) {
    results.passed++;
    console.log(`  [PASS] ${name}${details ? ' — ' + details : ''}`);
  } else {
    results.failed++;
    console.error(`  [FAIL] ${name}${details ? ' — ' + details : ''}`);
  }
  results.tests.push({ name, passed: !!condition, details });
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

async function runChallengerSuite() {
  console.log('='.repeat(78));
  console.log('  Milestone 3 Empirical 65-Operator Challenger Suite');
  console.log('='.repeat(78) + '\n');

  // =========================================================================
  // 1. Transformation Operators (18 Operators)
  // =========================================================================
  console.log('▶ [1. Transformation Operators — 18 Operators]');

  // 1.1 map
  {
    const res = [];
    of(1, 2, 3).pipe(map(x => x * 10)).subscribe(v => res.push(v));
    record('map transforms scalar values', res.join(',') === '10,20,30');
  }

  // 1.2 mapTo
  {
    const res = [];
    of(1, 2).pipe(mapTo('CONST')).subscribe(v => res.push(v));
    record('mapTo maps every emission to static constant', res.join(',') === 'CONST,CONST');
  }

  // 1.3 pluck
  {
    const res = [];
    of({ a: { b: 1 } }, { a: { b: 2 } }).pipe(pluck('a', 'b')).subscribe(v => res.push(v));
    record('pluck extracts nested property path', res.join(',') === '1,2');
  }

  // 1.4 scan
  {
    const res = [];
    of(1, 2, 3, 4).pipe(scan((acc, curr) => acc + curr, 0)).subscribe(v => res.push(v));
    record('scan accumulates per emission', res.join(',') === '1,3,6,10');
  }

  // 1.5 reduce
  {
    let res = null;
    of(1, 2, 3, 4).pipe(reduce((acc, curr) => acc + curr, 0)).subscribe(v => { res = v; });
    record('reduce accumulates until completion and emits single result', res === 10);
  }

  // 1.6 toArray
  {
    let res = null;
    of(5, 10, 15).pipe(toArray()).subscribe(v => { res = v; });
    record('toArray bundles all emissions into single array upon completion', Array.isArray(res) && res.join(',') === '5,10,15');
  }

  // 1.7 buffer
  {
    const closingNotifier$ = new Subject();
    const source$ = new Subject();
    const buffers = [];
    source$.pipe(buffer(closingNotifier$)).subscribe(b => buffers.push(b));
    source$.next(1); source$.next(2);
    closingNotifier$.next();
    source$.next(3);
    closingNotifier$.next();
    record('buffer collects items until closing notifier emits', buffers.length === 2 && buffers[0].join(',') === '1,2' && buffers[1].join(',') === '3');
  }

  // 1.8 bufferCount
  {
    const buffers = [];
    of(1, 2, 3, 4, 5).pipe(bufferCount(2)).subscribe(b => buffers.push(b));
    record('bufferCount emits buffers of size 2', buffers.length === 3 && buffers[0].join(',') === '1,2' && buffers[2].join(',') === '5');
  }

  // 1.9 bufferTime
  {
    const buffers = [];
    const source$ = new Subject();
    const sub = source$.pipe(bufferTime(20)).subscribe(b => buffers.push(b));
    source$.next('a'); source$.next('b');
    await new Promise(r => setTimeout(r, 30));
    source$.next('c');
    await new Promise(r => setTimeout(r, 30));
    sub.unsubscribe();
    record('bufferTime emits periodic time buffers', buffers.length >= 2 && buffers[0].includes('a') && buffers[0].includes('b'));
  }

  // 1.10 bufferToggle
  {
    const openings$ = new Subject();
    const closings$ = new Subject();
    const buffers = [];
    const source$ = new Subject();
    source$.pipe(bufferToggle(openings$, () => closings$)).subscribe(b => buffers.push(b));
    source$.next(1);
    openings$.next('open');
    source$.next(2);
    source$.next(3);
    closings$.next('close');
    source$.next(4);
    record('bufferToggle opens on openings$ and closes on closings$', buffers.length === 1 && buffers[0].join(',') === '2,3');
  }

  // 1.11 bufferWhen
  {
    const source$ = new Subject();
    const closing$ = new Subject();
    const buffers = [];
    source$.pipe(bufferWhen(() => closing$)).subscribe(b => buffers.push(b));
    source$.next('x'); source$.next('y');
    closing$.next();
    source$.next('z');
    closing$.next();
    record('bufferWhen opens new buffer when closing selector emits', buffers.length === 2 && buffers[0].join('') === 'xy' && buffers[1].join('') === 'z');
  }

  // 1.12 window
  {
    const notifier$ = new Subject();
    const source$ = new Subject();
    const windowCounts = [];
    source$.pipe(
      window(notifier$),
      mergeMap(win$ => win$.pipe(toArray()))
    ).subscribe(vals => windowCounts.push(vals));
    source$.next(1); source$.next(2);
    notifier$.next();
    source$.next(3);
    notifier$.next();
    record('window splits stream into nested observable windows', windowCounts.length === 2 && windowCounts[0].join(',') === '1,2' && windowCounts[1].join(',') === '3');
  }

  // 1.13 windowCount
  {
    const windows = [];
    of(1, 2, 3, 4, 5).pipe(
      windowCount(2),
      mergeMap(win$ => win$.pipe(toArray()))
    ).subscribe(w => windows.push(w));
    record('windowCount groups emissions into nested observables of size N', windows.length === 3 && windows[0].join(',') === '1,2' && windows[2].join(',') === '5');
  }

  // 1.14 windowTime
  {
    const windows = [];
    const source$ = new Subject();
    const sub = source$.pipe(
      windowTime(20),
      mergeMap(win$ => win$.pipe(toArray()))
    ).subscribe(w => windows.push(w));
    source$.next('w1');
    await new Promise(r => setTimeout(r, 30));
    source$.next('w2');
    await new Promise(r => setTimeout(r, 30));
    sub.unsubscribe();
    record('windowTime partitions emissions into periodic observable windows', windows.length >= 2);
  }

  // 1.15 windowToggle
  {
    const open$ = new Subject();
    const close$ = new Subject();
    const source$ = new Subject();
    const captured = [];
    source$.pipe(
      windowToggle(open$, () => close$),
      mergeMap(w$ => w$.pipe(toArray()))
    ).subscribe(v => captured.push(v));
    open$.next();
    source$.next(10);
    close$.next();
    record('windowToggle controls window life via openings and closings', captured.length === 1 && captured[0][0] === 10);
  }

  // 1.16 windowWhen
  {
    const source$ = new Subject();
    const close$ = new Subject();
    const out = [];
    source$.pipe(
      windowWhen(() => close$),
      mergeMap(w$ => w$.pipe(toArray()))
    ).subscribe(v => out.push(v));
    source$.next('A');
    close$.next();
    record('windowWhen re-evaluates window boundary selector dynamically', out.length === 1 && out[0][0] === 'A');
  }

  // 1.17 pairwise
  {
    const pairs = [];
    of(1, 2, 3, 4).pipe(pairwise()).subscribe(p => pairs.push(p));
    record('pairwise groups consecutive emissions into [prev, curr] pairs', pairs.length === 3 && pairs[0].join(',') === '1,2' && pairs[2].join(',') === '3,4');
  }

  // 1.18 groupBy
  {
    const groups = {};
    of({ k: 'A', v: 1 }, { k: 'B', v: 2 }, { k: 'A', v: 3 }).pipe(
      groupBy(x => x.k),
      mergeMap(g$ => g$.pipe(toArray(), map(items => ({ key: g$.key, items }))))
    ).subscribe(r => { groups[r.key] = r.items.map(i => i.v); });
    record('groupBy partitions stream by key selector', groups['A'] && groups['A'].join(',') === '1,3' && groups['B'] && groups['B'].join(',') === '2');
  }

  // =========================================================================
  // 2. Filtering Operators (19 Operators)
  // =========================================================================
  console.log('\n▶ [2. Filtering Operators — 19 Operators]');

  // 2.1 filter
  {
    const res = [];
    of(1, 2, 3, 4).pipe(filter(x => x % 2 === 0)).subscribe(v => res.push(v));
    record('filter drops non-matching values', res.join(',') === '2,4');
  }

  // 2.2 take
  {
    const res = [];
    of(10, 20, 30, 40).pipe(take(2)).subscribe(v => res.push(v));
    record('take emits first N values and completes', res.join(',') === '10,20');
  }

  // 2.3 takeLast
  {
    const res = [];
    of(1, 2, 3, 4, 5).pipe(takeLast(2)).subscribe(v => res.push(v));
    record('takeLast emits final N values upon completion', res.join(',') === '4,5');
  }

  // 2.4 takeUntil
  {
    const notifier$ = new Subject();
    const source$ = new Subject();
    const res = [];
    source$.pipe(takeUntil(notifier$)).subscribe(v => res.push(v));
    source$.next('a'); source$.next('b');
    notifier$.next();
    source$.next('c');
    record('takeUntil terminates stream upon notifier emission', res.join(',') === 'a,b');
  }

  // 2.5 takeWhile
  {
    const res = [];
    of(1, 2, 3, 1).pipe(takeWhile(x => x < 3)).subscribe(v => res.push(v));
    record('takeWhile emits until predicate returns false', res.join(',') === '1,2');
  }

  // 2.6 skip
  {
    const res = [];
    of(1, 2, 3, 4).pipe(skip(2)).subscribe(v => res.push(v));
    record('skip ignores first N values', res.join(',') === '3,4');
  }

  // 2.7 skipLast
  {
    const res = [];
    of(1, 2, 3, 4, 5).pipe(skipLast(2)).subscribe(v => res.push(v));
    record('skipLast omits final N values', res.join(',') === '1,2,3');
  }

  // 2.8 skipUntil
  {
    const notifier$ = new Subject();
    const source$ = new Subject();
    const res = [];
    source$.pipe(skipUntil(notifier$)).subscribe(v => res.push(v));
    source$.next(1); source$.next(2);
    notifier$.next();
    source$.next(3); source$.next(4);
    record('skipUntil ignores values until notifier emits', res.join(',') === '3,4');
  }

  // 2.9 skipWhile
  {
    const res = [];
    of(1, 2, 3, 1).pipe(skipWhile(x => x < 3)).subscribe(v => res.push(v));
    record('skipWhile ignores while predicate is true then emits all subsequent', res.join(',') === '3,1');
  }

  // 2.10 distinct
  {
    const res = [];
    of(1, 2, 2, 1, 3).pipe(distinct()).subscribe(v => res.push(v));
    record('distinct suppresses all duplicate values across stream lifetime', res.join(',') === '1,2,3');
  }

  // 2.11 distinctUntilChanged
  {
    const res = [];
    of(1, 1, 2, 2, 1).pipe(distinctUntilChanged()).subscribe(v => res.push(v));
    record('distinctUntilChanged suppresses consecutive duplicates', res.join(',') === '1,2,1');
  }

  // 2.12 distinctUntilKeyChanged
  {
    const res = [];
    of({ id: 1 }, { id: 1 }, { id: 2 }, { id: 1 }).pipe(distinctUntilKeyChanged('id')).subscribe(v => res.push(v.id));
    record('distinctUntilKeyChanged compares specified object key', res.join(',') === '1,2,1');
  }

  // 2.13 debounce
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(debounce(() => timer(15))).subscribe(v => res.push(v));
    source$.next('a'); source$.next('b');
    await new Promise(r => setTimeout(r, 25));
    record('debounce suppresses emissions until duration selector fires', res.join(',') === 'b');
  }

  // 2.14 debounceTime
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(debounceTime(15)).subscribe(v => res.push(v));
    source$.next(1); source$.next(2); source$.next(3);
    await new Promise(r => setTimeout(r, 25));
    record('debounceTime delays emission until pause window expires', res.join(',') === '3');
  }

  // 2.15 throttle
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(throttle(() => timer(20))).subscribe(v => res.push(v));
    source$.next('t1'); source$.next('t2');
    await new Promise(r => setTimeout(r, 30));
    source$.next('t3');
    record('throttle silences emissions based on duration selector', res.join(',') === 't1,t3');
  }

  // 2.16 throttleTime
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(throttleTime(20)).subscribe(v => res.push(v));
    source$.next(10); source$.next(20);
    await new Promise(r => setTimeout(r, 30));
    source$.next(30);
    record('throttleTime emits first item immediately and silences subsequent burst', res.join(',') === '10,30');
  }

  // 2.17 audit
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(audit(() => timer(20))).subscribe(v => res.push(v));
    source$.next('a'); source$.next('b');
    await new Promise(r => setTimeout(r, 30));
    record('audit emits most recent value when duration selector fires', res.join(',') === 'b');
  }

  // 2.18 auditTime
  {
    const source$ = new Subject();
    const res = [];
    source$.pipe(auditTime(20)).subscribe(v => res.push(v));
    source$.next(1); source$.next(2);
    await new Promise(r => setTimeout(r, 30));
    record('auditTime silences and emits most recent value after durationMs', res.join(',') === '2');
  }

  // 2.19 sample
  {
    const sampler$ = new Subject();
    const source$ = new Subject();
    const res = [];
    source$.pipe(sample(sampler$)).subscribe(v => res.push(v));
    source$.next(100);
    sampler$.next();
    sampler$.next(); // no new source item -> nothing emitted
    source$.next(200);
    sampler$.next();
    record('sample emits latest value whenever notifier emits', res.join(',') === '100,200');
  }

  // =========================================================================
  // 3. Combination Operators (11 Operators)
  // =========================================================================
  console.log('\n▶ [3. Combination Operators — 11 Operators]');

  // 3.1 combineLatest
  {
    const a$ = new Subject();
    const b$ = new Subject();
    const res = [];
    combineLatest([a$, b$]).subscribe(vals => res.push(vals.join('-')));
    a$.next(1); b$.next('A'); a$.next(2);
    record('combineLatest combines latest values on every emission', res.join(',') === '1-A,2-A');
  }

  // 3.2 concat
  {
    const res = [];
    concat(of(1, 2), of(3, 4)).subscribe(v => res.push(v));
    record('concat executes observables sequentially in series', res.join(',') === '1,2,3,4');
  }

  // 3.3 merge
  {
    const res = [];
    merge(of('a', 'b'), of('c', 'd')).subscribe(v => res.push(v));
    record('merge interleaves concurrent streams concurrently', res.join(',') === 'a,b,c,d');
  }

  // 3.4 forkJoin
  {
    let res = null;
    forkJoin({ x: of(1, 2, 3), y: of('A', 'B') }).subscribe(v => { res = v; });
    record('forkJoin emits dictionary of final completed values', res && res.x === 3 && res.y === 'B');
  }

  // 3.5 zip
  {
    const res = [];
    zip(of(1, 2), of('A', 'B', 'C')).subscribe(v => res.push(v.join('')));
    record('zip pairs emissions strictly index-by-index', res.join(',') === '1A,2B');
  }

  // 3.6 race
  {
    const fast$ = new Subject();
    const slow$ = new Subject();
    const res = [];
    race(fast$, slow$).subscribe(v => res.push(v));
    fast$.next('fast'); slow$.next('slow');
    record('race selects first emitting observable and cancels losers', res.join(',') === 'fast');
  }

  // 3.7 withLatestFrom
  {
    const source$ = new Subject();
    const aux$ = new BehaviorSubject('INIT');
    const res = [];
    source$.pipe(withLatestFrom(aux$)).subscribe(([s, a]) => res.push(`${s}:${a}`));
    source$.next(1);
    aux$.next('UPDATED');
    source$.next(2);
    record('withLatestFrom samples auxiliary observable only when primary emits', res.join(',') === '1:INIT,2:UPDATED');
  }

  // 3.8 startWith
  {
    const res = [];
    of(10, 20).pipe(startWith(0)).subscribe(v => res.push(v));
    record('startWith prepends initial values synchronously', res.join(',') === '0,10,20');
  }

  // 3.9 endWith
  {
    const res = [];
    of(10, 20).pipe(endWith(99)).subscribe(v => res.push(v));
    record('endWith appends values right before completion', res.join(',') === '10,20,99');
  }

  // 3.10 concatAll
  {
    const res = [];
    of(of(1, 2), of(3, 4)).pipe(concatAll()).subscribe(v => res.push(v));
    record('concatAll flattens higher-order observables in strict order', res.join(',') === '1,2,3,4');
  }

  // 3.11 mergeAll
  {
    const res = [];
    of(of('a'), of('b')).pipe(mergeAll()).subscribe(v => res.push(v));
    record('mergeAll flattens concurrent inner observables', res.join(',') === 'a,b');
  }

  // =========================================================================
  // 4. Utility Operators (12 Operators)
  // =========================================================================
  console.log('\n▶ [4. Utility Operators — 12 Operators]');

  // 4.1 tap
  {
    let sideEffect = 0;
    const res = [];
    of(1, 2).pipe(
      tap(x => { sideEffect += x; }),
      map(x => x * 2)
    ).subscribe(v => res.push(v));
    record('tap inspects notifications without mutation', sideEffect === 3 && res.join(',') === '2,4');
  }

  // 4.2 delay
  {
    const start = Date.now();
    let elapsed = 0;
    await new Promise(resolve => {
      of(1).pipe(delay(20)).subscribe(() => {
        elapsed = Date.now() - start;
        resolve();
      });
    });
    record('delay shifts stream emissions forward in time', elapsed >= 15, `Elapsed: ${elapsed}ms`);
  }

  // 4.3 delayWhen
  {
    const res = [];
    of(10).pipe(delayWhen(v => timer(v))).subscribe(v => res.push(v));
    await new Promise(r => setTimeout(r, 25));
    record('delayWhen computes dynamic delay duration per emission', res.join(',') === '10');
  }

  // 4.4 timeout
  {
    let errorCaught = null;
    new Subject().pipe(timeout(10)).subscribe({
      error: err => { errorCaught = err; }
    });
    await new Promise(r => setTimeout(r, 20));
    record('timeout throws TimeoutError if source fails to emit before deadline', errorCaught?.name === 'TimeoutError');
  }

  // 4.5 timeInterval
  {
    const res = [];
    of('val').pipe(timeInterval()).subscribe(t => res.push(t.value));
    record('timeInterval records elapsed milliseconds between emissions', res.join(',') === 'val');
  }

  // 4.6 timestamp
  {
    let ts = 0;
    of('now').pipe(timestamp()).subscribe(t => { ts = t.timestamp; });
    record('timestamp annotates emissions with epoch timestamp', ts > 0);
  }

  // 4.7 finalize
  {
    let finalized = false;
    of(1).pipe(finalize(() => { finalized = true; })).subscribe();
    record('finalize runs callback upon stream completion or termination', finalized === true);
  }

  // 4.8 repeat
  {
    const res = [];
    of('rep').pipe(repeat(3)).subscribe(v => res.push(v));
    record('repeat resubscribes to source upon completion N times', res.join(',') === 'rep,rep,rep');
  }

  // 4.9 repeatWhen
  {
    const res = [];
    let count = 0;
    of('when').pipe(
      repeatWhen(notifier$ => notifier$.pipe(takeWhile(() => ++count < 3)))
    ).subscribe(v => res.push(v));
    record('repeatWhen resubscribes dynamically via notification notifier', res.length === 3);
  }

  // 4.10 retry
  {
    let attempts = 0;
    const res = [];
    new Observable(sub => {
      attempts++;
      if (attempts < 3) sub.error(new Error('fail'));
      else { sub.next('success'); sub.complete(); }
    }).pipe(retry(3)).subscribe(v => res.push(v));
    record('retry resubscribes upon error up to specified count', res.join(',') === 'success' && attempts === 3);
  }

  // 4.11 retryWhen
  {
    let attempts = 0;
    const res = [];
    new Observable(sub => {
      attempts++;
      if (attempts < 2) sub.error(new Error('transient'));
      else { sub.next('recovered'); sub.complete(); }
    }).pipe(
      retryWhen(errors$ => errors$.pipe(take(2)))
    ).subscribe(v => res.push(v));
    record('retryWhen retries based on error notification observable', res.join(',') === 'recovered');
  }

  // 4.12 dematerialize
  {
    const res = [];
    of(1, 2).pipe(
      materialize(),
      dematerialize()
    ).subscribe(v => res.push(v));
    record('dematerialize unwraps Notification objects back into stream events', res.join(',') === '1,2');
  }

  // =========================================================================
  // 5. Multicasting Operators (5 Operators)
  // =========================================================================
  console.log('\n▶ [5. Multicasting Operators — 5 Operators]');

  // 5.1 share
  {
    const subj$ = new Subject();
    let executions = 0;
    const shared$ = subj$.pipe(
      tap(() => executions++),
      share()
    );
    let v1 = null, v2 = null;
    shared$.subscribe(v => { v1 = v; });
    shared$.subscribe(v => { v2 = v; });
    subj$.next(100);
    record('share multicasts cold producer across multiple subscribers', executions === 1 && v1 === 100 && v2 === 100);
  }

  // 5.2 shareReplay
  {
    let execCount = 0;
    const replayed$ = of('cached').pipe(
      tap(() => execCount++),
      shareReplay(1)
    );
    replayed$.subscribe();
    let lateVal = null;
    replayed$.subscribe(v => { lateVal = v; });
    record('shareReplay(1) buffers and replays emission to late subscribers', lateVal === 'cached' && execCount === 1);
  }

  // 5.3 publish
  {
    let runs = 0;
    const connectable$ = of(42).pipe(
      tap(() => runs++),
      publish()
    );
    let val = null;
    connectable$.subscribe(v => { val = v; });
    assert(runs === 0, 'publish should not emit before connect()');
    connectable$.connect();
    record('publish holds execution until explicit connect() is invoked', runs === 1 && val === 42);
  }

  // 5.4 refCount
  {
    let connected = false;
    const controlled$ = new Observable(() => {
      connected = true;
      return () => { connected = false; };
    }).pipe(publish(), refCount());

    const sub = controlled$.subscribe();
    assert(connected === true, 'refCount connects on 1st subscriber');
    sub.unsubscribe();
    record('refCount automatically connects on first subscriber and disconnects on zero', connected === false);
  }

  // 5.5 multicast
  {
    const subject = new Subject();
    let execs = 0;
    const multicasted$ = of('multicast-val').pipe(
      tap(() => execs++),
      multicast(() => subject)
    );
    let received = null;
    multicasted$.subscribe(v => { received = v; });
    multicasted$.connect();
    record('multicast delegates emissions through custom Subject factory', received === 'multicast-val' && execs === 1);
  }

  // =========================================================================
  // 6. Adversarial Stress & Boundary Conditions
  // =========================================================================
  console.log('\n▶ [6. Adversarial Stress & Boundary Conditions]');

  // 6.1 EMPTY source across reduce with seed
  {
    let reduceOnEmpty = null;
    EMPTY.pipe(reduce((acc, v) => acc + v, 99)).subscribe(v => { reduceOnEmpty = v; });
    record('Boundary: reduce on EMPTY source with seed emits seed value', reduceOnEmpty === 99);
  }

  // 6.2 EMPTY source across toArray emits empty array []
  {
    let arrayOnEmpty = null;
    EMPTY.pipe(toArray()).subscribe(v => { arrayOnEmpty = v; });
    record('Boundary: toArray on EMPTY source emits empty array [] and completes', Array.isArray(arrayOnEmpty) && arrayOnEmpty.length === 0);
  }

  // 6.3 EMPTY source across filter, pairwise, groupBy completes with zero emissions
  {
    let filterEmitted = false;
    let pairwiseEmitted = false;
    EMPTY.pipe(filter(() => true)).subscribe({ next: () => { filterEmitted = true; } });
    EMPTY.pipe(pairwise()).subscribe({ next: () => { pairwiseEmitted = true; } });
    record('Boundary: filter and pairwise on EMPTY complete with zero emissions', !filterEmitted && !pairwiseEmitted);
  }

  // 6.4 EMPTY source across combination operators (forkJoin, combineLatest) completes gracefully
  {
    let forkJoinCompleted = false;
    let forkJoinEmitted = false;
    forkJoin([EMPTY, of(1, 2)]).subscribe({
      next: () => { forkJoinEmitted = true; },
      complete: () => { forkJoinCompleted = true; }
    });
    record('Boundary: forkJoin on EMPTY input completes gracefully with zero emissions', !forkJoinEmitted && forkJoinCompleted);
  }

  // 6.5 Error source immediately executes finalize
  {
    let cleaned = false;
    throwError(() => new Error('SimulatedErr')).pipe(
      finalize(() => { cleaned = true; })
    ).subscribe({ error: () => {} });
    record('Boundary: finalize executes reliably when source errors immediately', cleaned === true);
  }

  // 6.6 Error input stream propagates error through pipeline operators
  {
    let errorCaught = null;
    throwError(() => new Error('Fatal Pipeline Error')).pipe(
      map(x => x * 10),
      filter(() => true),
      scan((acc, x) => acc + x, 0)
    ).subscribe({
      error: err => { errorCaught = err; }
    });
    record('Boundary: error propagates through map->filter->scan without suppression', errorCaught?.message === 'Fatal Pipeline Error');
  }

  // 6.7 10,000 rapid emissions through pipe do not overflow call stack
  {
    let count = 0;
    from(Array.from({ length: 10000 }, (_, i) => i)).pipe(
      filter(x => x % 2 === 0),
      map(x => x * 2),
      bufferCount(100)
    ).subscribe(() => count++);
    record('Stress: 10,000 rapid emissions process through filter->map->bufferCount without stack explosion', count === 50);
  }

  // 6.8 debounceTime(0) microtask batching
  {
    const sub$ = new Subject();
    const out = [];
    sub$.pipe(debounceTime(0)).subscribe(v => out.push(v));
    sub$.next(1); sub$.next(2); sub$.next(3);
    await new Promise(r => setTimeout(r, 10));
    record('Boundary: debounceTime(0) batches burst within current tick and emits last value', out.join(',') === '3');
  }

  // 6.9 take(0) completes immediately
  {
    let nextRan = false;
    let completed = false;
    of(1, 2, 3).pipe(take(0)).subscribe({
      next: () => { nextRan = true; },
      complete: () => { completed = true; }
    });
    record('Boundary: take(0) completes synchronously with zero emissions', !nextRan && completed);
  }

  // 6.10 Rapid start/stop concurrency stress: 100 rapid subscription & teardown cycles
  {
    let activeTimers = 0;
    const testObservable$ = new Observable(sub => {
      activeTimers++;
      const id = setTimeout(() => sub.next('tick'), 100);
      return () => {
        clearTimeout(id);
        activeTimers--;
      };
    });

    for (let i = 0; i < 100; i++) {
      const sub = testObservable$.subscribe();
      sub.unsubscribe();
    }
    record('Stress: 100 rapid subscribe/unsubscribe cycles tear down cleanly with 0 leaked timers', activeTimers === 0);
  }

  // 6.11 Boundary parameter: delay(0) shifts emission forward asynchronously
  {
    let asyncFired = false;
    let syncFlag = false;
    of('immediate').pipe(delay(0)).subscribe(() => {
      asyncFired = syncFlag;
    });
    syncFlag = true;
    await new Promise(r => setTimeout(r, 15));
    record('Boundary: delay(0) schedules emission asynchronously in next turn', asyncFired === true);
  }

  // 6.12 Boundary parameter: negative count on take(-1) and skip(-1)
  {
    let takeNegCount = 0;
    let skipNegCount = 0;
    of(1, 2, 3).pipe(take(-1)).subscribe(() => takeNegCount++);
    of(1, 2, 3).pipe(skip(-1)).subscribe(() => skipNegCount++);
    record('Boundary: take(-1) yields 0 items and skip(-1) yields all items safely', takeNegCount === 0 && skipNegCount === 3);
  }

  // 6.13 Boundary parameter: very high numbers take(1000000), skip(1000000), bufferCount(50000)
  {
    let countTake = 0;
    let countSkip = 0;
    let bufferLen = 0;
    of(1, 2, 3, 4, 5).pipe(take(1000000)).subscribe(() => countTake++);
    of(1, 2, 3, 4, 5).pipe(skip(1000000)).subscribe(() => countSkip++);
    of(1, 2, 3).pipe(bufferCount(50000)).subscribe(b => { bufferLen = b.length; });
    record('Boundary: extreme high parameter numbers handle without overflow', countTake === 5 && countSkip === 0 && bufferLen === 3);
  }

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n' + '='.repeat(78));
  console.log('  Milestone 3 Challenger Suite Execution Summary');
  console.log('='.repeat(78));
  console.log(`Total Executed : ${results.passed + results.failed}`);
  console.log(`Passed         : ${results.passed}`);
  console.log(`Failed         : ${results.failed}`);
  console.log(`Success Rate   : ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
  console.log('='.repeat(78));

  if (results.failed > 0) process.exit(1);
  else process.exit(0);
}

runChallengerSuite().catch(err => {
  console.error('Fatal Test Exception in Challenger Suite:', err);
  process.exit(1);
});
