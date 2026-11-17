# Handoff Report — Explorer Survey 3: RxJS Curriculum, Operator Taxonomy & Mini-Projects Specification

## 1. Observation

### 1.1 Codebase & Dependency Observations
Direct examination of the workspace reveals the following confirmed facts:
- **Angular Version & Config**: `package.json` specifies `"@angular/core": "^20.3.0"`, `"@angular/common": "^20.3.0"`, `"@angular/router": "^20.3.0"`, and `"@angular/forms": "^20.3.0"`. Standalone components with signals and modern injection (`inject()`, `DestroyRef`, `takeUntilDestroyed()`) are natively supported.
- **RxJS Version & Distribution**: `package.json` line 34 specifies `"rxjs": "~7.8.0"`. Direct inspection of `node_modules/rxjs/dist/types/index.d.ts` and `node_modules/rxjs/dist/types/operators/index.d.ts` confirms:
  - Creation operators: `of`, `from`, `fromEvent`, `interval`, `timer`, `range`, `throwError`, `defer`, `EMPTY`, `NEVER`, `generate`, `iif` are exported directly from `rxjs`.
  - Subject types: `Subject`, `BehaviorSubject`, `ReplaySubject`, `AsyncSubject` are exported from `rxjs`.
  - Schedulers: `asyncScheduler`, `queueScheduler`, `asapScheduler`, `animationFrameScheduler` are exported from `rxjs`.
  - All requested 65 operators across Transformation, Filtering, Combination, Utility, and Multicasting are present in the installed package.
- **Express Backend Infrastructure**: Direct inspection of `server/server.ts` and `server/search-lessons.route.ts` shows:
  - Port: Default port `9000` (`http://localhost:9000`).
  - Active routes:
    - `GET /api/courses/:id` (`server/get-course.route.ts`)
    - `PUT /api/courses/:id` (`server/save-course-route.ts`)
    - `GET /api/lessons` (`server/search-lessons.route.ts`), which parses `courseId`, `filter`, `sortOrder`, `pageNumber`, and `pageSize`.
  - Required endpoint additions per R2: `GET /api/slow?delay=2000` and `GET /api/simulate-error?rate=0.3`.
- **Existing App Structure**: `src/app/app.ts` is a root standalone component (`imports: [RouterOutlet]`) with `app.routes.ts` ready for lazy-loaded route hierarchy.

### 1.2 User Requirements Breakdown (R3, R4, R5)
From `ORIGINAL_REQUEST.md` and `DISPATCH.md`:
- **Module 1 (Fundamentals)**: 7 core topics: `what-is-rxjs`, `what-is-observable`, `observable-vs-promise`, `observer-subscriber`, `subscription-lifecycle`, `cold-vs-hot`, `multicasting`.
- **Module 2 (Creation Operators)**: 12 operators: `of`, `from`, `fromEvent`, `interval`, `timer`, `range`, `throwError`, `defer`, `EMPTY`, `NEVER`, `generate`, `iif`.
- **Module 3 (Operator Categories)**: Exactly 65 operators categorized as:
  - Transformation (18 operators)
  - Filtering (19 operators)
  - Combination (11 operators)
  - Utility (12 operators)
  - Multicasting (5 operators)
- **Module 4 (Higher-Order Observables)**: Interactive comparison of `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` with animated timeline showing request lifecycles (`cancelled`, `queued`, `ignored`, `completed`).
- **Module 5 (Subjects)**: Dynamic observer sandbox (subscribe/unsubscribe, emit) + side-by-side comparison of `Subject`, `BehaviorSubject`, `ReplaySubject`, `AsyncSubject`.
- **Module 6 (Schedulers)**: Execution order visualizer demos for `asyncScheduler`, `queueScheduler`, `asapScheduler`, `animationFrameScheduler`.
- **Module 7 (RxJS in Angular)**: HTTP patterns with Express server, Reactive Forms, Lifecycle with `takeUntilDestroyed()`, State Management BehaviorSubject store, advanced patterns.
- **Module 8 (6 Mini-Projects)**:
  1. Search Autocomplete (`GET /api/lessons?filter=...`)
  2. Live Dashboard (`interval + combineLatest + scan`)
  3. Shopping Cart (`BehaviorSubject + scan + combineLatest`)
  4. HTTP Request Manager (`switchMap` vs `mergeMap` vs `concatMap` vs `exhaustMap`)
  5. Polling System (`timer + switchMap + takeUntil + retry`)
  6. Multi-Step Form (`valueChanges + combineLatest + debounceTime`)
- **R5 (Polish, Navigation, and Verification)**: Progress tracking, quizzes, global search, keyboard navigation.

---

## 2. Logic Chain

### 2.1 Complete Operator Taxonomy Specification (65 Operators in Module 3)
To ensure complete coverage without overlap with dedicated deep-dive modules (Creation in Module 2, Higher-Order in Module 4, Subjects in Module 5), the 65 operators are partitioned into 5 distinct categories matching standard RxJS 7.8 definitions:

#### Category 1: Transformation Operators (18 Operators)
1. `map<T, R>(project: (value: T, index: number) => R)`: Maps each emitted value to a projected value.
2. `mapTo<R>(value: R)`: Maps each emitted item to a static constant value.
3. `pluck<T, R>(...properties: string[])`: Extracts nested object properties by key string.
4. `scan<T, R>(accumulator: (acc: R, value: T, index: number) => R, seed?: R)`: Emits accumulated value on every emission (continuous state accumulation).
5. `reduce<T, R>(accumulator: (acc: R, value: T, index: number) => R, seed?: R)`: Accumulates values and emits only the final single value upon source completion.
6. `toArray<T>()`: Collects all emissions into a JavaScript array and emits on completion.
7. `buffer<T>(closingNotifier: Observable<any>)`: Collects incoming values into an array buffer until closing notifier emits.
8. `bufferCount<T>(bufferSize: number, startBufferEvery?: number)`: Collects values into arrays of specified size.
9. `bufferTime<T>(bufferTimeSpan: number, bufferCreationInterval?: number, maxBufferSize?: number)`: Buffers values for a duration of milliseconds.
10. `bufferToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>)`: Buffers values opening when opening observable emits and closing when closing observable emits.
11. `bufferWhen<T>(closingSelector: () => Observable<any>)`: Buffers values using dynamic factory function to determine buffer closure.
12. `window<T>(windowBoundaries: Observable<any>)`: Branch source into nested Observable streams whenever boundary emits.
13. `windowCount<T>(windowSize: number, startWindowEvery?: number)`: Branches source into nested Observables every N items.
14. `windowTime<T>(windowTimeSpan: number, windowCreationInterval?: number, maxWindowSize?: number)`: Branches source into nested Observables based on time spans.
15. `windowToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>)`: Branches into nested Observables based on open/close triggers.
16. `windowWhen<T>(closingSelector: () => Observable<any>)`: Branches into nested Observables using factory-provided closing observables.
17. `pairwise<T>()`: Groups consecutive pairs `[previous, current]` into a 2-tuple.
18. `groupBy<T, K>(keySelector: (value: T) => K)`: Splits single Observable into `GroupedObservable` streams partitioned by key.

#### Category 2: Filtering Operators (19 Operators)
1. `filter<T>(predicate: (value: T, index: number) => boolean)`: Emits values passing boolean condition.
2. `take<T>(count: number)`: Emits first N values then completes immediately.
3. `takeLast<T>(count: number)`: Emits last N values upon source completion.
4. `takeUntil<T>(notifier: Observable<any>)`: Emits values until notifier emits, then completes.
5. `takeWhile<T>(predicate: (value: T, index: number) => boolean, inclusive?: boolean)`: Emits while predicate is true, completing on first false.
6. `skip<T>(count: number)`: Skips first N values and emits the rest.
7. `skipLast<T>(count: number)`: Skips the final N values before completion.
8. `skipUntil<T>(notifier: Observable<any>)`: Ignores values until notifier emits, then forwards all subsequent values.
9. `skipWhile<T>(predicate: (value: T, index: number) => boolean)`: Ignores values while predicate is true, then emits all remaining values.
10. `distinct<T, K>(keySelector?: (value: T) => K)`: Emits only values not previously seen across entire stream history.
11. `distinctUntilChanged<T, K>(comparator?: (prev: K, curr: K) => boolean, keySelector?: (value: T) => K)`: Emits value only if different from the immediately preceding value.
12. `distinctUntilKeyChanged<T, K extends keyof T>(key: K)`: Emits object only if the value at property `key` differs from preceding emission.
13. `debounce<T>(durationSelector: (value: T) => Observable<any>)`: Emits value only after dynamic duration observable completes without new emissions.
14. `debounceTime<T>(dueTime: number)`: Emits value only after quiet pause of `dueTime` milliseconds.
15. `throttle<T>(durationSelector: (value: T) => Observable<any>, config?: ThrottleConfig)`: Emits first value, silences emissions for dynamic duration.
16. `throttleTime<T>(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig)`: Emits first value, silences subsequent emissions for `duration` ms.
17. `audit<T>(durationSelector: (value: T) => Observable<any>)`: Silences emissions, then emits latest value when duration observable emits.
18. `auditTime<T>(duration: number)`: Silences emissions, then emits most recent value after `duration` ms.
19. `sample<T>(notifier: Observable<any>)`: Emits the most recently emitted source value whenever notifier observable emits.

#### Category 3: Combination Operators (11 Operators)
1. `combineLatestWith<T, A extends readonly unknown[]>(...otherSources: A)` / `combineLatest`: Emits array combining latest values from all streams whenever any stream emits.
2. `concatWith<T, A extends readonly unknown[]>(...otherSources: A)` / `concat`: Sequentially executes observables, subscribing to next only after previous completes.
3. `mergeWith<T, A extends readonly unknown[]>(...otherSources: A)` / `merge`: Subscribes concurrently to all streams, forwarding values as they arrive.
4. `forkJoin<T extends Record<string, Observable<any>> | Observable<any>[]>`: Waits for all source streams to complete, then emits object/array of their final values.
5. `zipWith<T, A extends readonly unknown[]>(...otherSources: A)` / `zip`: Combines values pairwise index-by-index (1st with 1st, 2nd with 2nd).
6. `raceWith<T, A extends readonly unknown[]>(...otherSources: A)` / `race`: First observable to emit a value wins; other observables are cancelled.
7. `withLatestFrom<T, R>(...inputs: Observable<any>[])`: Whenever source emits, combines its value with current latest value from auxiliary streams.
8. `startWith<T, D>(...values: D[])`: Prepends synchronous initial values before source stream begins emitting.
9. `endWith<T, D>(...values: D[])`: Appends terminal values right before source stream completes.
10. `concatAll<T>()`: Flattens higher-order Observable by subscribing to each inner Observable in strict sequential order.
11. `mergeAll<T>(concurrent?: number)`: Flattens higher-order Observable by subscribing concurrently to inner Observables up to concurrency limit.

#### Category 4: Utility Operators (12 Operators)
1. `tap<T>(observer?: Partial<Observer<T>> | ((value: T) => void))`: Transparent side-effect spy without altering values or stream flow.
2. `delay<T>(due: number | Date)`: Delays emission of every item by fixed time offset.
3. `delayWhen<T>(delayDurationSelector: (value: T) => Observable<any>)`: Delays each value based on dynamically calculated duration observable.
4. `timeout<T, M>(config: number | TimeoutConfig<T, M>)`: Throws TimeoutError or switches to fallback if emission doesn't occur within threshold.
5. `timeInterval<T>()`: Measures and records time interval elapsed between consecutive emissions.
6. `timestamp<T>()`: Records epoch millisecond timestamp alongside each emitted value `{ value: T, timestamp: number }`.
7. `finalize<T>(callback: () => void)`: Invoked when stream terminates (completes, errors, or unsubscription teardown).
8. `repeat<T>(countOrConfig?: number | RepeatConfig)`: Resubscribes to source observable upon completion.
9. `repeatWhen<T>(notifier: (notifications: Observable<void>) => Observable<any>)`: Resubscribes to source upon completion triggered by notifier stream.
10. `retry<T>(countOrConfig?: number | RetryConfig)`: Resubscribes to source upon error, supporting count and exponential backoff delay.
11. `retryWhen<T>(notifier: (errors: Observable<any>) => Observable<any>)`: Resubscribes to source upon error triggered by notifier stream.
12. `dematerialize<T>()`: Converts stream of `Notification<T>` objects back into raw `next`, `error`, `complete` stream events.

#### Category 5: Multicasting Operators (5 Operators)
1. `share<T>(config?: ShareConfig<T>)`: Automatically multicasts source with standard Subject, connecting on first subscriber and resetting when subscribers drop to zero.
2. `shareReplay<T>(configOrBufferSize?: number | ShareReplayConfig)`: Shares single subscription and caches `bufferSize` emissions for late subscribers; prevents duplicate HTTP requests.
3. `multicast<T, R>(subjectOrSubjectFactory: Subject<T> | (() => Subject<T>))`: Shares source using designated Subject factory, returning `ConnectableObservable`.
4. `publish<T>()`: Multicasts source using an underlying `Subject`, requiring explicit `.connect()`.
5. `refCount<T>()`: Automatically connects a `ConnectableObservable` when subscribers >= 1 and disconnects when subscribers reach 0.

---

### 2.2 Module 1: Fundamentals Specification (7 Topics)
Each topic has a 5-part structure (Concept, Code, Visual Demo, Comparison, Quiz):

| Topic | Key Concept | Interactive Visual Demo | Code Snippet | Key Quiz Question |
|---|---|---|---|---|
| `what-is-rxjs` | Reactive programming paradigm; event streams over time; push vs pull model | Interactive stream timeline showing events pushed over time with timestamps and velocity | `interval(1000).pipe(map(x => x * 2))` | Q: How does push model differ from pull? A: Producer pushes values to Consumer when ready. |
| `what-is-observable` | Lazy evaluation blueprint; subscription executes producer; teardown cleans up resources | Play/Pause/Trigger next, error, complete events with active subscriber counter | `new Observable(sub => { sub.next(1); return () => cleanup(); })` | Q: When does Observable code execute? A: Only when `.subscribe()` is called. |
| `observable-vs-promise` | Eager vs Lazy; 1 value vs stream of values; cancellable vs non-cancellable | Side-by-side execution: Promise (immediate single resolve) vs Observable (cancellable multi-emission) | `const p = new Promise(...); const o = new Observable(...);` | Q: Which is cancellable natively? A: Observable via `unsubscribe()`. |
| `observer-subscriber` | Observer interface `{next, error, complete}`; Subscriber wrapper enforcing RxJS contract | Attempting to call `next` after `complete`; inspection of error vs complete mutual exclusivity | `observer = { next: v => log(v), error: e => err(e), complete: () => done() }` | Q: Can `next` emit after `complete`? A: No, contract guarantees complete is final. |
| `subscription-lifecycle` | Disposable execution context; composite subscriptions (`sub.add()`); memory leak risk | Tree visualizer of parent and child subscriptions; single unsubscribe tears down entire tree | `const sub = o$.subscribe(); sub.add(child$); sub.unsubscribe();` | Q: What happens to child subscriptions when parent unsubscribes? A: All children unsubscribe recursively. |
| `cold-vs-hot` | Cold: independent producer per subscriber (unicast). Hot: shared producer (multicast) | Two subscribers joining at T=0s and T=3s; Cold restarts from 0, Hot joins mid-stream | `const cold$ = interval(1000); const hot$ = fromEvent(btn, 'click');` | Q: Is `HttpClient.get()` cold or hot? A: Cold (separate HTTP request per subscribe). |
| `multicasting` | Turning cold into hot; sharing expensive producer execution across consumers | Unicast vs Multicast: 3 subscribers trigger 3 network calls vs 1 shared network call | `source$.pipe(shareReplay(1))` | Q: Why use `shareReplay(1)` on HTTP streams? A: Avoids duplicate requests across templates. |

---

### 2.3 Module 2: Creation Operators (12 Operators)

| Operator | Configurable Parameters | Marble Animation Description | Code Template | Quiz Question |
|---|---|---|---|---|
| `of` | Values list (e.g. `[10, 20, 30]`) | Synchronous sequence marbles at t=0ms followed immediately by `\|` | `of(10, 20, 30)` | Q: Does `of` emit synchronously? A: Yes. |
| `from` | Input type (`Array`, `Promise`, `Set`, `Generator`) | Array emits synchronously; Promise delays until resolved; Generator emits on pull | `from([1, 2, 3])` | Q: What does `from(Promise)` emit? A: The resolved Promise value. |
| `fromEvent` | Target element, event name (`click`, `input`, `mousemove`) | Real-time marble generated dynamically on user interaction with coordinates | `fromEvent(btn, 'click')` | Q: Does `fromEvent` complete automatically? A: No, infinite stream. |
| `interval` | Period (ms, default: 1000, slider: 100-3000ms) | Regular periodic ticks `(0, 1, 2, 3...)` spaced evenly on timeline | `interval(1000)` | Q: What is the first emitted value? A: 0 (after initial delay). |
| `timer` | DueTime (ms), optional Period (ms) | Initial delay phase (dotted line) then single emission or periodic pulse | `timer(2000, 500)` | Q: How to trigger single delayed emission? A: `timer(delay)`. |
| `range` | Start number, Count of emissions | Rapid sequential integers from start to start+count-1, then `\|` | `range(1, 5)` | Q: What does `range(5, 3)` emit? A: 5, 6, 7. |
| `throwError` | Error factory message | Red 'X' error marble immediately on timeline at t=0ms | `throwError(() => new Error('Failed'))` | Q: Why use factory function in throwError? A: Fresh stack trace per subscriber. |
| `defer` | Factory type (Date.now(), random id, dynamic promise) | Distinct values generated at distinct subscription moments | `defer(() => of(Date.now()))` | Q: Does `defer` re-run factory for each subscriber? A: Yes, per subscription. |
| `EMPTY` | None | Instant completion bar `\|` without any value marbles | `EMPTY` | Q: How many values does `EMPTY` emit? A: Zero. |
| `NEVER` | None | Continuous line stretching infinitely without marbles or completion | `NEVER` | Q: When does `NEVER` complete? A: Never. |
| `generate` | Initial state, condition, iterate function | Evaluated values matching loop condition until condition returns false | `generate(1, x => x <= 16, x => x * 2)` | Q: What is `generate` equivalent to? A: A declarative `for` loop. |
| `iif` | Condition boolean toggle | Switches between Stream A and Stream B at subscription moment | `iif(() => cond, streamA$, streamB$)` | Q: When is `iif` condition evaluated? A: At subscription time. |

---

### 2.4 Module 4: Higher-Order Observables & Animated Lifecycle Timeline
The interactive timeline must accurately display the 4 distinct request lifecycle states:

```
+-----------------------------------------------------------------------------------------+
| Request Lifecycle States in Higher-Order Observables                                    |
|                                                                                         |
|  State        Visual Representation       Color / Tag     When It Occurs               |
|  ----------   -------------------------   -------------   ----------------------------  |
|  Active       Horizontal pulsing progress 🔵 [ACTIVE]     Inner request in-flight      |
|  Queued       Striped waiting bar         🟡 [QUEUED]     Waiting in queue (concatMap) |
|  Cancelled    Strikethrough / slashed bar 🔴 [CANCELLED]  Aborted by newer (switchMap) |
|  Ignored      Muted dashed outline        ⚪ [IGNORED]    Dropped when busy (exhaustMap)|
|  Completed    Solid fill with pill icon   🟢 [COMPLETED]  Successfully resolved        |
+-----------------------------------------------------------------------------------------+
```

#### Detailed Scenario Comparison:
- **Scenario**: User triggers 3 rapid button clicks at $t = 0.0s$, $t = 0.8s$, $t = 1.6s$. Each inner HTTP request takes $1.5s$ to complete.
- **`switchMap` Timeline**:
  - $t=0.0s$: Req 1 starts $\rightarrow$ **Active**.
  - $t=0.8s$: Req 2 arrives $\rightarrow$ Req 1 is **Cancelled**! Req 2 starts $\rightarrow$ **Active**.
  - $t=1.6s$: Req 3 arrives $\rightarrow$ Req 2 is **Cancelled**! Req 3 starts $\rightarrow$ **Active**.
  - $t=3.1s$: Req 3 finishes $\rightarrow$ **Completed** (emits value 3).
  - *Final Output*: Only 1 emission (value 3). Total duration: 3.1s.
- **`concatMap` Timeline**:
  - $t=0.0s$: Req 1 starts $\rightarrow$ **Active**.
  - $t=0.8s$: Req 2 arrives $\rightarrow$ Req 1 active $\rightarrow$ Req 2 is **Queued**.
  - $t=1.5s$: Req 1 completes $\rightarrow$ **Completed** (emits value 1). Req 2 transitions from **Queued** to **Active**.
  - $t=1.6s$: Req 3 arrives $\rightarrow$ Req 2 active $\rightarrow$ Req 3 is **Queued**.
  - $t=3.0s$: Req 2 completes $\rightarrow$ **Completed** (emits value 2). Req 3 transitions from **Queued** to **Active**.
  - $t=4.5s$: Req 3 completes $\rightarrow$ **Completed** (emits value 3).
  - *Final Output*: 3 emissions in order (1, 2, 3). Total duration: 4.5s.
- **`mergeMap` Timeline**:
  - $t=0.0s$: Req 1 starts $\rightarrow$ **Active**.
  - $t=0.8s$: Req 2 arrives $\rightarrow$ Req 2 starts in parallel $\rightarrow$ **Active** (2 concurrent requests).
  - $t=1.5s$: Req 1 completes $\rightarrow$ **Completed** (emits value 1).
  - $t=1.6s$: Req 3 arrives $\rightarrow$ Req 3 starts in parallel $\rightarrow$ **Active**.
  - $t=2.3s$: Req 2 completes $\rightarrow$ **Completed** (emits value 2).
  - $t=3.1s$: Req 3 completes $\rightarrow$ **Completed** (emits value 3).
  - *Final Output*: 3 emissions in arrival order (1, 2, 3). Total duration: 3.1s.
- **`exhaustMap` Timeline**:
  - $t=0.0s$: Req 1 starts $\rightarrow$ **Active**.
  - $t=0.8s$: Req 2 arrives $\rightarrow$ Req 1 is active $\rightarrow$ Req 2 is **Ignored / Dropped**.
  - $t=1.5s$: Req 1 completes $\rightarrow$ **Completed** (emits value 1).
  - $t=1.6s$: Req 3 arrives $\rightarrow$ No active inner request $\rightarrow$ Req 3 starts $\rightarrow$ **Active**.
  - $t=3.1s$: Req 3 completes $\rightarrow$ **Completed** (emits value 3).
  - *Final Output*: 2 emissions (1, 3). Total duration: 3.1s.

---

### 2.5 Module 5: Subjects Dynamic Sandbox & Comparison Matrix

#### Subject Types Comparison Matrix:
| Subject Type | Requires Initial Value? | Caches Value? | When Does It Emit to Late Subscribers? | Memory Footprint | Primary Use Case |
|---|---|---|---|---|---|
| `Subject` | No | No | Never; only receives emissions happening *after* subscription | Low | Event bus, button click triggers, action dispatchers |
| `BehaviorSubject` | Yes (`initialValue`) | Yes (last 1 value via `.getValue()`) | Immediately emits current value upon subscription | Medium | Store state, active user profile, theme preference |
| `ReplaySubject` | No (optional `bufferSize`, `windowTime`) | Yes (up to `bufferSize` items within `windowTime`) | Immediately replays up to `bufferSize` past items | Higher | Caching recent history, route navigation breadcrumbs |
| `AsyncSubject` | No | Yes (last 1 value only) | Emits last value *only* when `.complete()` is called | Minimal | Asynchronous computations, Promise-like single results |

#### Dynamic Sandbox Architecture:
- **Sandbox Controls**:
  - Subject Type Picker: `Subject` | `BehaviorSubject` | `ReplaySubject` | `AsyncSubject`.
  - Configuration Inputs:
    - Initial value input (for `BehaviorSubject`).
    - Buffer size slider (1 to 10) and window time slider (ms) (for `ReplaySubject`).
  - Emission Dispatcher:
    - Text/number value input.
    - Buttons: `next(val)`, `error(err)`, `complete()`, `reset()`.
  - Observers Fleet:
    - Observer 1, Observer 2, Observer 3 cards.
    - Independent `Subscribe` / `Unsubscribe` buttons per observer.
    - Live marble feed per observer showing timestamp, received values, and termination status.
    - Side-by-side verification: User emits values 1, 2, subscribes Observer 2, emits 3. Observer 1 sees [1, 2, 3]; Observer 2 sees:
      - With `Subject`: [3]
      - With `BehaviorSubject`: [2, 3]
      - With `ReplaySubject(2)`: [1, 2, 3]
      - With `AsyncSubject`: Nothing until complete, then [3].

---

### 2.6 Module 6: Schedulers Execution Order Visualizer

#### The 4 Core Schedulers:
1. `queueScheduler`:
   - Execution mechanism: Synchronous execution on trampoline queue. If no task is executing, runs immediately; if already running, queues task to avoid stack overflow in recursive iterations.
2. `asapScheduler`:
   - Execution mechanism: Microtask queue (`Promise.resolve().then()` or `MutationObserver`). Runs after current synchronous block but before browser repaint and macrotasks.
3. `asyncScheduler`:
   - Execution mechanism: Macrotask queue (`setInterval` / `setTimeout`). Runs on the next event loop tick after microtasks and rendering.
4. `animationFrameScheduler`:
   - Execution mechanism: `window.requestAnimationFrame()`. Runs right before the browser's next screen repaint (~16.6ms at 60Hz).

#### Visualizer Demo Architecture:
- **Predict & Step Execution Mode**:
  - Visual layout representing the JavaScript Event Loop:
    - `[Call Stack (Sync)]` $\rightarrow$ `[Microtask Queue (asap)]` $\rightarrow$ `[Animation Frame Queue]` $\rightarrow$ `[Macrotask Queue (async)]`.
  - Interactive test script:
    ```ts
    console.log('1: Synchronous start');
    asyncScheduler.schedule(() => console.log('2: asyncScheduler (Macrotask)'));
    asapScheduler.schedule(() => console.log('3: asapScheduler (Microtask)'));
    animationFrameScheduler.schedule(() => console.log('4: animationFrameScheduler (Repaint)'));
    queueScheduler.schedule(() => console.log('5: queueScheduler (Sync Queue)'));
    console.log('6: Synchronous end');
    ```
  - Execution Output Order:
    1. `1: Synchronous start`
    2. `5: queueScheduler (Sync Queue)`
    3. `6: Synchronous end`
    4. `3: asapScheduler (Microtask)`
    5. `4: animationFrameScheduler (Repaint)`
    6. `2: asyncScheduler (Macrotask)`
  - Stepper controls: "Step Forward", "Play Animation", "Reset". Visual tokens highlight each queue as it dequeues into the execution log.

---

### 2.7 Module 7: RxJS in Angular Specification
Covers modern Angular 20 best practices with standalone components, signals interoperability, and Express API integration:

#### 1. HTTP Communication with Express
- Express integration endpoints:
  - `GET /api/courses/1`
  - `PUT /api/courses/1`
  - `GET /api/lessons?courseId=1&filter=...`
  - `GET /api/slow?delay=2000`
  - `GET /api/simulate-error?rate=0.3`
- Architecture:
  - Caching with `shareReplay({ bufferSize: 1, refCount: true })`.
  - Resilient retry policy with exponential backoff:
    ```ts
    this.http.get<Course>('/api/courses/1').pipe(
      retry({
        count: 3,
        delay: (error, retryCount) => timer(retryCount * 1000)
      }),
      catchError(err => of(FALLBACK_COURSE))
    )
    ```
  - Refresh trigger pattern: `refresh$ = new Subject<void>()` merged with initial request.

#### 2. Reactive Forms
- Real-time form validation and auto-save:
  ```ts
  form.valueChanges.pipe(
    debounceTime(400),
    distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),
    filter(() => form.valid),
    switchMap(formData => this.http.put('/api/courses/1', formData))
  )
  ```
- Cross-field reactive dependencies: Field B options filtered reactively via `fieldA.valueChanges.pipe(startWith(fieldA.value), switchMap(...))`.

#### 3. Component Lifecycle & Teardown with `takeUntilDestroyed`
- Angular 20 teardown mechanics:
  - Inside constructor / field initializer: `takeUntilDestroyed()` (implicitly captures current injection context).
  - Outside constructor (e.g. methods): Pass explicit `DestroyRef`: `takeUntilDestroyed(this.destroyRef)`.
  - Elimination of `ngOnDestroy` boilerplate and memory leaks.
  - Interactive simulator: Memory leak counter showing unmanaged subscriptions accumulating across component mount/unmount vs cleanly destroyed subscriptions.

#### 4. Reactive State Management (BehaviorSubject Store)
- Architecture:
  - State interface: `interface AppState { user: User | null; theme: 'dark' | 'light'; notifications: string[] }`.
  - Store class:
    - Private `_state$ = new BehaviorSubject<AppState>(initialState)`.
    - Public `state$ = this._state$.asObservable()`.
    - Selector method: `select<K>(key: K): Observable<AppState[K]>` using `pipe(map(s => s[key]), distinctUntilChanged())`.
    - Reducer update method: `update(partial: Partial<AppState>)`.
  - Bridging to Angular 20 Signals: `readonly userSignal = toSignal(this.store.select('user'))`.

---

### 2.8 Module 8: 6 Mini-Projects Detailed Specification

```
+----------------------------------------------------------------------------------------------------+
| Module 8: Mini-Projects Architecture Overview                                                      |
|                                                                                                    |
|  #   Mini-Project             Core Operator Pipeline                    Backend / Data Source      |
|  --  -----------------------  ----------------------------------------  -------------------------- |
|  1   Search Autocomplete      debounceTime + distinctUntilChanged +     Express /api/lessons?filter|
|                               switchMap + catchError                                               |
|  2   Live Dashboard           interval + combineLatest + scan           Simulated Real-Time Streams|
|  3   Shopping Cart            BehaviorSubject + scan + combineLatest    Reactive In-Memory Store   |
|  4   HTTP Request Manager     switchMap vs concatMap vs mergeMap vs     Express /api/slow?delay=2s |
|                               exhaustMap side-by-side execution                                    |
|  5   Polling System           timer + switchMap + takeUntil + retry     Express /api/courses/1     |
|                               with tab visibility awareness                                        |
|  6   Multi-Step Form Wizard   valueChanges + combineLatest +            In-Memory Wizard State     |
|                               debounceTime + exhaustMap                                            |
+----------------------------------------------------------------------------------------------------+
```

#### Detailed Mini-Project Specs:
1. **Search Autocomplete**:
   - **Input**: Search text input with clear button.
   - **Data Source**: Express endpoint `http://localhost:9000/api/lessons?courseId=1&filter={term}&pageSize=5`.
   - **Pipeline**:
     ```ts
     searchTerm$.pipe(
       map(term => term.trim()),
       debounceTime(300),
       distinctUntilChanged(),
       tap(() => this.loading.set(true)),
       switchMap(term => term ? this.lessonsService.search(term).pipe(
         catchError(() => of({ lessons: [], total: 0 }))
       ) : of({ lessons: [], total: 0 })),
       tap(() => this.loading.set(false))
     )
     ```
   - **UI Details**: Result list with highlighted search terms, active result selection, keyboard navigation (`ArrowUp`/`ArrowDown`/`Enter`), loading spinner, empty state.

2. **Live Dashboard**:
   - **Metrics Feeds**:
     - CPU usage stream: `interval(1000).pipe(map(() => Math.floor(20 + Math.random() * 60)))`
     - Memory usage stream: `interval(1400).pipe(map(() => Math.floor(40 + Math.random() * 45)))`
     - Network I/O stream: `interval(800).pipe(map(() => Math.floor(100 + Math.random() * 800)))`
   - **Aggregation Pipeline**:
     ```ts
     combineLatest([cpu$, mem$, net$]).pipe(
       map(([cpu, mem, net]) => ({ cpu, mem, net, time: new Date().toLocaleTimeString() })),
       scan((history, current) => [...history.slice(-14), current], [] as MetricPoint[])
     )
     ```
   - **UI Details**: SVG sparklines / area charts, warning badges when CPU > 75%, live counter pills, play/pause toggle stream.

3. **Shopping Cart**:
   - **Data Types**: `interface CartItem { id: number; name: string; price: number; qty: number }`.
   - **Action Stream**: `action$ = new Subject<CartAction>()` (`ADD`, `REMOVE`, `UPDATE_QTY`, `CLEAR`).
   - **Coupon Stream**: `coupon$ = new BehaviorSubject<string>('')`.
   - **Pipeline**:
     ```ts
     items$ = action$.pipe(
       scan((items, action) => cartReducer(items, action), [] as CartItem[]),
       shareReplay(1)
     );
     summary$ = combineLatest([items$, coupon$]).pipe(
       map(([items, coupon]) => computeSummary(items, coupon)),
       shareReplay(1)
     );
     ```
   - **UI Details**: Product catalog cards with "Add to Cart", reactive cart drawer, quantity steppers, discount promo code validation (e.g. 'RXJS20' for 20% off), tax/shipping dynamic breakdown.

4. **HTTP Request Manager**:
   - **Scenario**: Direct side-by-side benchmark executing 4 concurrent requests to Express `GET /api/slow?delay=1500`.
   - **Trigger**: "Send 4 Rapid Requests" button emitting IDs [1, 2, 3, 4] with 300ms interval.
   - **4 Execution Cards**:
     - Card A (`switchMap`): Emits only the 4th request response; requests 1, 2, 3 cancelled.
     - Card B (`concatMap`): Emits all 4 responses sequentially in 6.0 seconds.
     - Card C (`mergeMap`): Emits all 4 responses concurrently in ~1.8 seconds.
     - Card D (`exhaustMap`): Emits only the 1st request response; requests 2, 3, 4 ignored.
   - **UI Details**: Side-by-side cards with live timers, active/queued/cancelled/ignored status counters, and summary comparison table.

5. **Polling System**:
   - **Scenario**: Continuous polling of server status with tab visibility awareness and exponential retry backoff.
   - **Pipeline**:
     ```ts
     const tabVisible$ = fromEvent(document, 'visibilitychange').pipe(
       map(() => !document.hidden),
       startWith(!document.hidden)
     );
     const pollTrigger$ = tabVisible$.pipe(
       switchMap(visible => visible ? timer(0, pollIntervalMs) : EMPTY)
     );
     const data$ = merge(pollTrigger$, manualRefresh$).pipe(
       switchMap(() => this.http.get('/api/courses/1').pipe(
         retry({ count: 3, delay: (err, count) => timer(count * 1000) }),
         catchError(err => of({ error: err.message }))
       )),
       takeUntil(this.stopPolling$)
     );
     ```
   - **UI Details**: Interval slider (1s - 15s), Tab status indicator ("Active / Polling" vs "Hidden / Suspended"), Manual "Poll Now" button, visual retry countdown timer upon error.

6. **Multi-Step Form Wizard**:
   - **Steps**:
     - Step 1: User Account (`username`, `email`, `role`).
     - Step 2: Course Preferences (reactively enabled based on selected role: Beginner vs Advanced tracks).
     - Step 3: Confirmation & Submit.
   - **Pipeline**:
     - Auto-save draft: `form.valueChanges.pipe(debounceTime(500), tap(v => localStorage.setItem('wizard_draft', JSON.stringify(v))))`.
     - Step validation stream: `stepValid$ = currentStep$.pipe(switchMap(s => getStepStatus$(s)))`.
     - Submit handler: `submit$.pipe(exhaustMap(data => this.submitRegistration(data)))` (prevents double submission).
   - **UI Details**: Stepper progress bar, persistent draft indicator, back/next buttons with reactive disabled states, submission status alert.

---

### 2.9 R5: Polish, Navigation, Quizzes, and Verification Specifications

#### 1. Progress Tracking
- **Data Model**:
  ```ts
  interface UserProgress {
    completedTopics: Record<string, boolean>; // e.g. { 'what-is-rxjs': true, 'of': true }
    quizScores: Record<string, number>;      // e.g. { 'module-1': 100, 'module-2': 85 }
    lastVisitedRoute: string;
  }
  ```
- **Storage**: Synced to `localStorage.getItem('rxjs_platform_progress')`.
- **UI Elements**: Progress percentage indicator in topbar and sidebar header, checkmarks next to completed curriculum items, overall mastery badge.

#### 2. Quiz Engine & Question Catalog
- Reusable `quiz-block` component parameters:
  - Input: `questions: QuizQuestion[]`
  - Output: `quizCompleted: EventEmitter<{ score: number, passed: boolean }>`
- Minimum 3 questions per module (24 questions minimum platform-wide). Example question bank structure:
  - Module 1: Push vs Pull, Observables vs Promises cancellation, Cold vs Hot multicasting.
  - Module 2: `of` vs `from` with arrays, `timer(0)` vs `of(0)`, `defer` per-subscriber evaluation.
  - Module 3: `scan` vs `reduce`, `debounceTime` vs `throttleTime`, `combineLatest` initial emission requirement.
  - Module 4: Why `switchMap` cancels inner observables, why `exhaustMap` ignores concurrent triggers.
  - Module 5: `BehaviorSubject` vs `Subject` initial value, `AsyncSubject` completion requirement.
  - Module 6: Execution order of `asapScheduler` vs `asyncScheduler`.
  - Module 7: Benefits of `takeUntilDestroyed()`, `shareReplay` leak prevention with `refCount: true`.
  - Module 8: Autocomplete `distinctUntilChanged` purpose, polling cancellation on tab hide.

#### 3. Global Search & Command Palette
- **Trigger**: Click search in topbar or press `/` or `Ctrl+K` / `Cmd+K`.
- **Search Scope**: All 8 modules, 7 fundamentals topics, 12 creation operators, 65 category operators, 4 HOOs, 4 subjects, 4 schedulers, 6 mini-projects.
- **Search Index Schema**: `{ id: string; title: string; category: string; description: string; route: string; keywords: string[] }`.
- **Keyboard interaction**: `ArrowDown`/`ArrowUp` to highlight result, `Enter` to route, `Esc` to close.

#### 4. Keyboard Navigation
- `j` or `ArrowRight`: Navigate to next topic in curriculum order.
- `k` or `ArrowLeft`: Navigate to previous topic in curriculum order.
- `/` or `Ctrl+K`: Open global search palette.
- `Ctrl+Enter`: Run/trigger active playground execution.
- `Esc`: Close search palette or active modal.

---

## 3. Caveats
1. **RxJS 7 vs 8 Operator Deprecations**:
   - `pluck` is deprecated in RxJS 7.8 and will be removed in RxJS 8 in favor of `map(x => x.prop)`. It must be clearly highlighted with a "Deprecated in v8" educational badge in Module 3.
   - `concatMapTo`, `mergeMapTo`, `switchMapTo` are similarly deprecated in favor of arrow function projections (`concatMap(() => inner$)`).
   - `toPromise()` is deprecated in favor of `firstValueFrom()` / `lastValueFrom()`.
2. **Express Server Route Nuance**:
   - `server/search-lessons.route.ts` line 20 checks `lesson.courseId === courseId`. If `courseId` is omitted, `Number(undefined)` becomes `NaN`, yielding no matches. Mini-project 1 and Module 7 must pass `courseId=1` alongside `filter` or the server route can be enhanced to make `courseId` optional.
3. **Schedulers in Different JavaScript Environments**:
   - `animationFrameScheduler` relies on `window.requestAnimationFrame`. If executed in Node.js (SSR or unit test runner without DOM mock), it falls back to `AsyncScheduler`.
4. **Browser Tab Background Throttling**:
   - Browsers aggressively throttle `setInterval` / `timer` in background tabs. Module 8's Polling System specifically accounts for this by checking `document.visibilitychange` to suspend timers cleanly rather than relying on unthrottled background execution.

---

## 4. Conclusion
This analysis delivers the complete, authoritative specification for Requirements R3, R4, and R5:
1. **Curriculum Topology**: 8 Modules comprehensively structured with 100% standalone lazy-loaded Angular 20 components.
2. **Complete 65-Operator Catalog in Module 3**:
   - 18 Transformation: `map`, `mapTo`, `pluck`, `scan`, `reduce`, `toArray`, `buffer`, `bufferCount`, `bufferTime`, `bufferToggle`, `bufferWhen`, `window`, `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, `pairwise`, `groupBy`.
   - 19 Filtering: `filter`, `take`, `takeLast`, `takeUntil`, `takeWhile`, `skip`, `skipLast`, `skipUntil`, `skipWhile`, `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged`, `debounce`, `debounceTime`, `throttle`, `throttleTime`, `audit`, `auditTime`, `sample`.
   - 11 Combination: `combineLatestWith` / `combineLatest`, `concatWith` / `concat`, `mergeWith` / `merge`, `forkJoin`, `zipWith` / `zip`, `raceWith` / `race`, `withLatestFrom`, `startWith`, `endWith`, `concatAll`, `mergeAll`.
   - 12 Utility: `tap`, `delay`, `delayWhen`, `timeout`, `timeInterval`, `timestamp`, `finalize`, `repeat`, `repeatWhen`, `retry`, `retryWhen`, `dematerialize`.
   - 5 Multicasting: `share`, `shareReplay`, `multicast`, `publish`, `refCount`.
3. **Interactive Visualizers**:
   - Module 4 Higher-Order Observables animated timeline explicitly tracking the 4 lifecycle states (`cancelled`, `queued`, `ignored`, `completed`).
   - Module 5 dynamic Subject sandbox with 3 independent observers and live emissions.
   - Module 6 Scheduler execution order visualizer simulating the JavaScript Event Loop.
4. **Real-World Integration & 6 Mini-Projects**:
   - Module 7 integrating Express HTTP patterns, Reactive Forms, `takeUntilDestroyed()` teardown, and BehaviorSubject store.
   - Module 8 delivering 6 production-grade mini-projects (Search Autocomplete, Live Dashboard, Shopping Cart, HTTP Request Manager, Polling System, Multi-Step Form).
5. **Polish & Navigation**:
   - LocalStorage progress tracking, 24+ curated quiz questions, `/` or `Ctrl+K` global search palette, and keyboard navigation shortcuts.

---

## 5. Verification Method

### 5.1 Verification Commands
To independently verify the facts and imports referenced in this specification:
1. **RxJS Operator Availability**:
   ```powershell
   node -e "const rxjs = require('rxjs'); const ops = require('rxjs/operators'); console.log('RxJS exports:', Object.keys(rxjs).length, 'Operators exports:', Object.keys(ops).length);"
   ```
2. **Express Server Route Health**:
   ```powershell
   # Start server:
   npm run server
   # Verify existing endpoints:
   curl http://localhost:9000/api/courses/1
   curl "http://localhost:9000/api/lessons?courseId=1&filter=what"
   ```
3. **Angular Compilation Check**:
   ```powershell
   npx ng build --configuration development
   ```

### 5.2 Files to Inspect
- `package.json`: Angular 20 and RxJS 7.8 dependencies.
- `node_modules/rxjs/dist/types/index.d.ts`: Available types and operator signatures.
- `server/server.ts` & `server/search-lessons.route.ts`: Existing Express route contracts.
- `.agents/teamwork/explorer_survey_3/BRIEFING.md`: State, decisions, and constraints.
- `.agents/teamwork/explorer_survey_3/progress.md`: Liveness heartbeat and milestone tracking.

### 5.3 Invalidation Conditions
- If RxJS version is changed from 7.8 to 8.x, operators deprecated in v7 (`pluck`, `mapTo`, etc.) will need migration to their modern function equivalents.
- If Express server port or route structure is altered, mini-project API contracts must be updated accordingly.
