# Milestone 2 — Module 1 Fundamentals: Architecture & Design Specification

## 1. Observation

### 1.1 Existing Codebase & Environment
- **Angular Version**: Angular 20.3.0 standalone, zoneless setup (`provideExperimentalZonelessChangeDetection()` or zoneless-ready primitives).
- **RxJS Version**: RxJS ~7.8.0.
- **Build Verification**: `npx ng build --configuration development` executed cleanly with 0 errors (build time: 4.036 seconds, initial chunk: 1.57 MB).
- **Existing Routes**: `src/app/features/module1-fundamentals/module1.routes.ts` currently maps all 7 topic paths (`what-is-rxjs`, `what-is-observable`, `observable-vs-promise`, `observer-subscriber`, `subscription-lifecycle`, `cold-vs-hot`, `multicasting`) to `StubTopicComponent`.
- **Navigation & Search**: `src/app/core/services/search.service.ts` (lines 12–20) already contains complete route metadata and category tags for all 7 topics under `MODULE_NAV_DATA`.
- **Progress Tracking**: `src/app/core/services/progress.service.ts` tracks topic completion and quiz scores in `localStorage` (`rxjs_platform_completed_topics`, `rxjs_platform_quiz_scores`).

### 1.2 Shared Interactive Components Verified
All 7 shared components in `src/app/shared/components/` are operational and export clean typed contracts:
1. `app-playground-wrapper`: Tab switcher (`concept`, `code`, `visual`, `comparison`, `quiz`), topic completion toggle, keyboard navigation (`Alt+ArrowLeft/Right`), slotted content projection.
2. `app-code-block`: Syntax-highlighted code via `highlight.js`, line numbering, line highlighting (`highlightLines`), copy-to-clipboard, collapsible container.
3. `app-output-console`: Live reactive stream log output, colored badges by entry type (`next`, `error`, `complete`, `subscribe`, `unsubscribe`, `info`), stream filtering, auto-scroll, pause/resume, copy log history.
4. `app-comparison-table`: Matrix comparison table accepting `ComparisonData` (`features` and `items`), with optional column highlighting.
5. `app-quiz-block`: Interactive quiz engine with immediate feedback, explanations, score calculation, pass threshold, and progress persistence via `ProgressService.saveQuizScore()`.
6. `app-marble-diagram`: Standalone SVG interactive stream animator.
7. `app-operator-card`: Metadata card for operator signatures, use cases, and pitfalls.

---

## 2. Logic Chain

1. **User Requirement R3 & Milestone 2 Scope**: Module 1 (Fundamentals) requires 7 interactive topic pages: `what-is-rxjs`, `what-is-observable`, `observable-vs-promise`, `observer-subscriber`, `subscription-lifecycle`, `cold-vs-hot`, and `multicasting`.
2. **Quality & Completeness Contract**: Every topic must provide all 5 standard playground tabs:
   - **Concept Tab**: In-depth theoretical explanation, architectural diagrams/cards, key takeaways.
   - **Code Tab**: Real-world TypeScript examples using `<app-code-block>` with syntax highlighting.
   - **Visual Demo Tab**: Engaging interactive simulator with reactive controls and live streaming output displayed in `<app-output-console>`.
   - **Comparison Tab**: Comparative matrix using `<app-comparison-table>` highlighting semantics, pros/cons, and lifecycle states.
   - **Quiz Tab**: Interactive multiple-choice knowledge check using `<app-quiz-block>` with explanatory feedback.
3. **Angular 20 Primitives Mandate**: All topic implementations must use Angular 20 signals (`signal()`, `computed()`), `inject()`, `DestroyRef`, and `takeUntilDestroyed()`. No deprecated RxJS patterns or Zone.js-dependent APIs.
4. **Modularity & Maintainability**: Placing each topic in its own directory under `src/app/features/module1-fundamentals/topics/<topic-name>/` with a dedicated component (`<topic-name>.component.ts`) and data file (`<topic-name>.data.ts`) ensures strict separation of concerns, clean git diffs, lazy-loadable route chunks, and easy unit testability.

---

## 3. Caveats

1. **Read-Only Explorer Scope**: This report is an architectural blueprint and design specification. Source code implementation must be performed by the implementer agent.
2. **SVG Marble Diagram in Fundamentals**: While `app-marble-diagram` exists, Module 1 topics focus on push vs pull, blueprint execution, cancellation, observer contracts, subscription trees, cold vs hot unicast/multicast, and caching. The primary visual engine for Module 1 is interactive state controls coupled with `<app-output-console>` and custom visualizer panels (e.g., subscription tree nodes, network request meters). Marble diagrams will be used extensively in Module 2 and Module 3.
3. **Zoneless Signal Updates**: All visual demos that emit values asynchronously via `setInterval`, `setTimeout`, or RxJS operators will update Angular signals directly; Angular 20's zoneless change detection automatically detects signal writes.

---

## 4. Conclusion & Complete Design Specification

### 4.1 Recommended Directory & File Structure
```
src/app/features/module1-fundamentals/
├── module1.routes.ts
└── topics/
    ├── what-is-rxjs/
    │   ├── what-is-rxjs.component.ts
    │   ├── what-is-rxjs.component.html
    │   ├── what-is-rxjs.component.scss
    │   └── what-is-rxjs.data.ts
    ├── what-is-observable/
    │   ├── what-is-observable.component.ts
    │   ├── what-is-observable.component.html
    │   ├── what-is-observable.component.scss
    │   └── what-is-observable.data.ts
    ├── observable-vs-promise/
    │   ├── observable-vs-promise.component.ts
    │   ├── observable-vs-promise.component.html
    │   ├── observable-vs-promise.component.scss
    │   └── observable-vs-promise.data.ts
    ├── observer-subscriber/
    │   ├── observer-subscriber.component.ts
    │   ├── observer-subscriber.component.html
    │   ├── observer-subscriber.component.scss
    │   └── observer-subscriber.data.ts
    ├── subscription-lifecycle/
    │   ├── subscription-lifecycle.component.ts
    │   ├── subscription-lifecycle.component.html
    │   ├── subscription-lifecycle.component.scss
    │   └── subscription-lifecycle.data.ts
    ├── cold-vs-hot/
    │   ├── cold-vs-hot.component.ts
    │   ├── cold-vs-hot.component.html
    │   ├── cold-vs-hot.component.scss
    │   └── cold-vs-hot.data.ts
    └── multicasting/
        ├── multicasting.component.ts
        ├── multicasting.component.html
        ├── multicasting.component.scss
        └── multicasting.data.ts
```

### 4.2 Updated Route Configuration (`module1.routes.ts`)
```typescript
import { Routes } from '@angular/router';

export const MODULE1_ROUTES: Routes = [
  { path: '', redirectTo: 'what-is-rxjs', pathMatch: 'full' },
  {
    path: 'what-is-rxjs',
    loadComponent: () =>
      import('./topics/what-is-rxjs/what-is-rxjs.component').then(m => m.WhatIsRxjsComponent)
  },
  {
    path: 'what-is-observable',
    loadComponent: () =>
      import('./topics/what-is-observable/what-is-observable.component').then(m => m.WhatIsObservableComponent)
  },
  {
    path: 'observable-vs-promise',
    loadComponent: () =>
      import('./topics/observable-vs-promise/observable-vs-promise.component').then(m => m.ObservableVsPromiseComponent)
  },
  {
    path: 'observer-subscriber',
    loadComponent: () =>
      import('./topics/observer-subscriber/observer-subscriber.component').then(m => m.ObserverSubscriberComponent)
  },
  {
    path: 'subscription-lifecycle',
    loadComponent: () =>
      import('./topics/subscription-lifecycle/subscription-lifecycle.component').then(m => m.SubscriptionLifecycleComponent)
  },
  {
    path: 'cold-vs-hot',
    loadComponent: () =>
      import('./topics/cold-vs-hot/cold-vs-hot.component').then(m => m.ColdVsHotComponent)
  },
  {
    path: 'multicasting',
    loadComponent: () =>
      import('./topics/multicasting/multicasting.component').then(m => m.MulticastingComponent)
  }
];
```

---

### 4.3 Detailed Specification for Each of the 7 Topics

---

#### Topic 1: `what-is-rxjs`
- **Route**: `/module1/what-is-rxjs`
- **Metadata**: Title: `What is RxJS?`, Category: `Fundamentals`, Difficulty: `beginner`, TopicId: `what-is-rxjs`

1. **Concept Tab Content**:
   - **Introduction**: RxJS (Reactive Extensions for JavaScript) is a library for composing asynchronous and event-based programs using observable sequences. It treats streams of events similarly to collections of items.
   - **The Three Foundational Pillars**:
     - *Observer Pattern*: Facilitates the publisher-subscriber relationship where multiple consumers observe changes without tight coupling.
     - *Iterator Pattern*: Enables progressive consumption over collections over time, shifting the model from synchronous pull to reactive push.
     - *Functional Programming*: Declarative, pure functions (operators like `map`, `filter`, `scan`) allowing deterministic pipelines without shared mutable state.
   - **Push vs. Pull Paradigm**:
     - *Pull System*: The Consumer determines when to receive data (e.g. standard functions `fn()`, ES6 Iterators/Generators `gen.next()`). The Producer is passive.
     - *Push System*: The Producer determines when to send data to the Consumer (e.g. DOM Event listeners, Promises, and RxJS Observables). The Consumer is notified reactively.
   - **Why RxJS in Modern Web & Angular**: Complex asynchronous scenarios: coordinating multiple HTTP requests, debouncing user input keystrokes, WebSocket event streams, retry strategies with exponential backoff, cancellation on component destroy.

2. **Code Tab Content**:
   ```typescript
   import { fromEvent, Observable } from 'rxjs';
   import { debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';

   // 1. Creating a Stream from DOM Events
   const searchInput = document.getElementById('search-input') as HTMLInputElement;

   const searchStream$ = fromEvent<InputEvent>(searchInput, 'input').pipe(
     // Extract input value
     map(event => (event.target as HTMLInputElement).value),
     // Discard empty queries
     filter(query => query.trim().length > 2),
     // Wait 300ms pause in user typing
     debounceTime(300),
     // Prevent duplicate emissions if text did not change
     distinctUntilChanged()
   );

   // 2. Subscribing to the pipeline
   const subscription = searchStream$.subscribe({
     next: (searchTerm) => console.log('Executing search for:', searchTerm),
     error: (err) => console.error('Stream failure:', err),
     complete: () => console.log('Stream completed')
   });
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Push vs Pull Reactive Studio*
   - **State**:
     - `pullCount = signal(0)`
     - `isPushing = signal(false)`
     - `consoleEntries = signal<ConsoleEntry[]>([])`
     - `pushIntervalId: any = null`
   - **Interactive Actions**:
     - **Button "Simulate Pull (Consumer Requests)"**: User clicks -> synchronously requests next value -> generates next sequential value -> logs:
       `type: 'next'`, `streamName: 'PULL-CONSUMER'`, `value: 'Item #${pullCount()}'`, `description: 'Consumer pulled data from generator'`.
     - **Button "Start Push Stream (Producer Emits)"**: Starts a 1000ms periodic timer where producer automatically generates telemetry data (e.g. CPU load, mouse coordinates) and pushes to consumer without consumer prompting.
       `type: 'next'`, `streamName: 'PUSH-PRODUCER'`, `value: 'Emitted: ${val}'`, `description: 'Producer pushed value asynchronously'`.
     - **Button "Stop Push Stream"**: Cleans up interval and emits `type: 'complete'`, `streamName: 'PUSH-PRODUCER'`.
   - **Layout**: Two side-by-side cards (Pull Model card with manual trigger; Push Model card with start/stop stream triggers), accompanied by `<app-output-console>`.

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `paradigm`: Communication Protocol
     - `producer`: Producer Status
     - `consumer`: Consumer Status
     - `values`: Value Multiplicity
     - `evaluation`: Evaluation Timing
     - `operators`: Operator Library
   - **Items**:
     - `Function`: Pull | Active/Synchronous | Decides when called | Exactly 1 | Eager/Call-time | None
     - `Generator`: Pull | Passive until queried | Calls `.next()` to pull | 0 to Infinite | Lazy on pull | Standard Iterators
     - `Promise`: Push | Active immediately | Passive receiver (.then) | Exactly 1 | Eager on creation | Limited (.then, .catch)
     - `RxJS Observable`: Push | Passive until subscribed | Passive listener (Observer) | 0 to Infinite | Lazy on subscription | 100+ Functional Operators

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: What is the key difference between a Pull and a Push data architecture?
     - *Options*:
       - A: Pull systems are always faster than Push systems
       - B: In Pull, the consumer decides when to receive data; in Push, the producer decides when to send data (Correct)
       - C: In Push, the consumer must query every millisecond
       - D: Promises are Pull while Observables are Push
     - *Explanation*: In pull systems (like functions and iterators), the consumer actively requests data when ready. In push systems (like RxJS Observables and DOM events), the producer emits data to subscribed consumers asynchronously.
   - **Q2**: Which three foundational design patterns are combined in RxJS?
     - *Options*:
       - A: Observer Pattern, Iterator Pattern, and Functional Programming (Correct)
       - B: Singleton, Factory, and Decorator Patterns
       - C: Model-View-Controller, State Machine, and Proxy
       - D: Redux, Microservices, and Event Sourcing
     - *Explanation*: RxJS blends the Observer pattern (for reactive notifications), the Iterator pattern (for sequential data traversal), and Functional Programming (for immutable, pipeable operator composition).
   - **Q3**: What happens when an Observable is defined without any `subscribe()` calls?
     - *Options*:
       - A: It starts executing immediately in the background
       - B: Nothing executes because Observables are lazy blueprints (Correct)
       - C: It throws an UnsubscribedStreamError
       - D: It buffers values indefinitely until memory is exhausted
     - *Explanation*: Observables are lazy collections. Declaring an Observable merely creates an execution blueprint; no values are emitted until an observer subscribes.
   - **Q4**: How do RxJS pipeable operators handle state mutations?
     - *Options*:
       - A: They mutate the input Observable directly in place
       - B: They are pure functions that return a new Observable without modifying the original stream (Correct)
       - C: They store global state inside window.RxJS
       - D: They require manual deep copying of the stream
     - *Explanation*: RxJS operators are pure functional constructs. Calling `.pipe()` returns a new Observable sequence, leaving the source stream untouched.

---

#### Topic 2: `what-is-observable`
- **Route**: `/module1/what-is-observable`
- **Metadata**: Title: `What is an Observable?`, Category: `Fundamentals`, Difficulty: `beginner`, TopicId: `what-is-observable`

1. **Concept Tab Content**:
   - **Definition**: An Observable is a lazily evaluated push collection that can deliver zero, one, or multiple values over time, either synchronously or asynchronously.
   - **Blueprint Metaphor**: An Observable is not a stream running in the background; it is a **recipe or blueprint**. Calling `new Observable(subscriber => { ... })` does nothing until someone calls `.subscribe()`.
   - **Synchronous vs. Asynchronous**: A common misconception is that Observables are asynchronous by definition. Observables are **sync by default** if the producer emits synchronously (e.g. `subscriber.next(1); subscriber.next(2); subscriber.complete()`). They only become async when combined with asynchronous primitives (timers, promises, event listeners).
   - **The Observable Notification Contract**:
     - 0 to N `next(value)` emissions.
     - Followed by at most **ONE** terminal notification: either `complete()` OR `error(err)`.
     - After `complete` or `error` is emitted, no subsequent `next` notifications can ever be received.
   - **Teardown Logic**: The subscriber function can return a cleanup function (or `Subscription`) which is executed upon unsubscription or stream termination.

2. **Code Tab Content**:
   ```typescript
   import { Observable } from 'rxjs';

   // Creating an Observable from scratch with synchronous & asynchronous phases
   const customStream$ = new Observable<string>((subscriber) => {
     console.log('--- Observable Execution Started ---');

     // Synchronous emission phase
     subscriber.next('Sync Value 1');
     subscriber.next('Sync Value 2');

     // Asynchronous emission phase
     const timerId = setTimeout(() => {
       subscriber.next('Async Value 3 (after 1000ms)');
       subscriber.complete(); // Terminal notification
     }, 1000);

     // Teardown logic: executed on unsubscribe or completion
     return () => {
       clearTimeout(timerId);
       console.log('--- Teardown: Cleared background timer ---');
     };
   });

   // Execution only begins when subscribe() is called!
   const sub = customStream$.subscribe({
     next: val => console.log('Received:', val),
     error: err => console.error('Error:', err),
     complete: () => console.log('Stream finished!')
   });
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Observable Blueprint & Independent Execution Lab*
   - **State**:
     - `subAActive = signal(false)`
     - `subBActive = signal(false)`
     - `subASubscription: Subscription | null = null`
     - `subBSubscription: Subscription | null = null`
     - `consoleEntries = signal<ConsoleEntry[]>([])`
   - **Interactive Actions**:
     - **Button "Create Blueprint"**: Logs `info`: "Observable blueprint instantiated: const stream$ = new Observable(...). Notice: 0 emissions produced yet!".
     - **Button "Subscribe Observer A"**: Subscribes Observer A. Observable immediately starts emitting tick 1, 2, 3 every 800ms. Entries logged with `streamName: 'OBSERVER-A'`.
     - **Button "Subscribe Observer B (Late)"**: Subscribes Observer B. Demonstrates independent unicast execution: Observer B starts from tick 1, even if Observer A is already at tick 4!
     - **Button "Unsubscribe A" / "Unsubscribe B"**: Invokes `.unsubscribe()` and logs teardown cleanup.
     - **Button "Trigger Stream Error"**: Forces `subscriber.error(new Error('Network drop'))` to demonstrate contract termination.

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `execution`: Execution Timing
     - `values`: Multiplicity
     - `synchronicity`: Synchronicity Support
     - `isolation`: Consumer Isolation
     - `lifecycle`: Disposal Mechanism
   - **Items**:
     - `Array`: Eager in-memory | Multiple (fixed size) | Synchronous only | Shared reference | Garbage collected
     - `Generator`: Lazy on pull | Multiple (stepped) | Synchronous / Async iterators | Shared iterator position | Iterator `.return()`
     - `RxJS Observable`: Lazy on push | 0 to Infinite | Synchronous OR Asynchronous | Independent per subscriber (unicast) | Explicit teardown function

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: Are RxJS Observables inherently asynchronous?
     - *Options*:
       - A: Yes, all Observables use setTimeout internally
       - B: No, Observables can deliver values synchronously or asynchronously depending on producer implementation (Correct)
       - C: Only Subject is asynchronous
       - D: Observables are only asynchronous when used inside Angular components
     - *Explanation*: Observables execute synchronously unless an asynchronous API (like `setInterval`, `Promise`, or scheduler) is explicitly utilized inside the producer.
   - **Q2**: What is guaranteed by the Observable Notification Contract?
     - *Options*:
       - A: An Observable must always emit at least one value
       - B: After emitting complete or error, an Observable will never emit any more next values (Correct)
       - C: Complete and error can be emitted together
       - D: Error events automatically retry the stream three times
     - *Explanation*: The Observable contract guarantees zero or more `next` notifications, terminated by at most one `complete` or one `error` event. After termination, no further events occur.
   - **Q3**: What does the return value of the `new Observable(subscriber => { ... })` callback represent?
     - *Options*:
       - A: The initial value to emit
       - B: The teardown/cleanup logic executed when the subscription is cancelled or closed (Correct)
       - C: The error handler function
       - D: The retry policy configuration
     - *Explanation*: The function returned by the subscriber callback is the teardown logic. RxJS executes this when the subscriber calls `.unsubscribe()` or when the stream terminates.
   - **Q4**: If two subscribers subscribe to the same plain Observable 5 seconds apart, what happens by default?
     - *Options*:
       - A: The second subscriber receives the same values at the same time as the first
       - B: Each subscriber triggers a separate, independent execution of the Observable function from the beginning (Correct)
       - C: The second subscriber throws a MultiSubscriptionError
       - D: The first subscriber is automatically cancelled
     - *Explanation*: By default, plain Observables are unicast and cold. Each subscription invokes the producer constructor function independently from scratch.

---

#### Topic 3: `observable-vs-promise`
- **Route**: `/module1/observable-vs-promise`
- **Metadata**: Title: `Observable vs Promise`, Category: `Comparison`, Difficulty: `beginner`, TopicId: `observable-vs-promise`

1. **Concept Tab Content**:
   - **The Core Dilemma**: Both Promises and Observables handle asynchronous operations in JavaScript, but their underlying architectures represent radically different paradigms.
   - **Key Dimension 1: Eagerness vs. Laziness**:
     - *Promise*: Eager. The executor function passed to `new Promise((resolve) => ...)` executes **immediately** upon creation, before `.then()` is called.
     - *Observable*: Lazy. The producer does not execute until `.subscribe()` is explicitly called.
   - **Key Dimension 2: Value Cardinality**:
     - *Promise*: Resolves to exactly one single value (or rejection). Cannot stream progress or continuous updates.
     - *Observable*: Emits 0, 1, or infinite values over time.
   - **Key Dimension 3: Cancellation**:
     - *Promise*: Non-cancellable by specification. Once initiated, the background operation cannot be cleanly aborted via Promise APIs.
     - *Observable*: Natively cancellable via `.unsubscribe()`. Unsubscribing halts producer execution, clears timers, aborts fetch requests, and frees memory.
   - **Key Dimension 4: Pipeline Transformation**:
     - *Promise*: Limited to `.then()`, `.catch()`, `.finally()`.
     - *Observable*: 100+ composable operators (`debounceTime`, `distinctUntilChanged`, `switchMap`, `retry`, `combineLatest`).

2. **Code Tab Content**:
   ```typescript
   import { Observable } from 'rxjs';

   // --- 1. PROMISE: Eager, single-value, non-cancellable ---
   const promise = new Promise<number>((resolve) => {
     console.log('Promise executor runs IMMEDIATELY upon creation!');
     setTimeout(() => resolve(42), 2000);
   });
   // Promise is already running here, even without .then()

   // --- 2. OBSERVABLE: Lazy, multi-value, cancellable ---
   const countdown$ = new Observable<number>((subscriber) => {
     console.log('Observable executor runs ONLY when subscribed!');
     let count = 5;

     const intervalId = setInterval(() => {
       subscriber.next(count);
       count--;
       if (count < 0) {
         clearInterval(intervalId);
         subscriber.complete();
       }
     }, 1000);

     // Teardown invoked on cancellation
     return () => {
       clearInterval(intervalId);
       console.log('Teardown: Interval cleared immediately upon unsubscription');
     };
   });

   // Subscribe and cancel after 2.5 seconds
   const sub = countdown$.subscribe(val => console.log('Tick:', val));
   setTimeout(() => sub.unsubscribe(), 2500);
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Dual Race & Cancellation Chamber (Promise vs. Observable)*
   - **UI Setup**: Two interactive side-by-side cards:
     - *Card A: Promise Execution Chamber*
       - "Start Eager Promise (3s countdown to resolve)"
       - "Try Cancel Promise" -> Button shows disabled/warning status: "Promises cannot be cancelled! Background executor will still finish."
       - Status badge: `Pending` -> `Resolved (42)`
     - *Card B: Observable Execution Chamber*
       - "Start Lazy Observable (5s countdown ticks 1..5)"
       - "Cancel Observable (Unsubscribe)" -> Enabled! Clicking immediately aborts the interval, runs teardown, and emits log: `[OBSERVABLE] Unsubscribed! Execution halted instantly at tick 2`.
   - **Console Output**: Live logs via `<app-output-console>` contrasting unpreventable Promise resolution against clean Observable cancellation.

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `eagerness`: Evaluation
     - `cardinality`: Value Cardinality
     - `cancellation`: Native Cancellation
     - `execution`: Execution Multiplicity
     - `operators`: Operator Library
     - `delivery`: Delivery Asynchrony
     - `retry`: Native Retry
   - **Items**:
     - `Promise`: Eager (executes on definition) | Exactly 1 value | No native cancellation | Multicast (shares resolved value) | Limited chaining (.then) | Always asynchronous microtask | No (manual recursion required)
     - `RxJS Observable`: Lazy (executes on subscribe) | 0, 1, or Multiple values | Native via `.unsubscribe()` | Unicast by default (multicast optional) | 100+ Composable pipe operators | Synchronous or Asynchronous | Native via `retry()`, `retryWhen()`

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: What happens when a Promise is created without calling `.then()`?
     - *Options*:
       - A: The executor function never executes
       - B: The executor function runs immediately regardless of `.then()` (Correct)
       - C: The JavaScript runtime throws an UnhandledPromiseWarning
       - D: It converts to an Observable
     - *Explanation*: Promises are eager. The executor callback passed to the Promise constructor begins execution synchronously the moment it is declared.
   - **Q2**: Can a Promise emit multiple values over time?
     - *Options*:
       - A: Yes, by calling resolve() multiple times
       - B: No, resolve() can only be called once; subsequent calls are silently ignored (Correct)
       - C: Yes, using async/await
       - D: Only when wrapped in an array
     - *Explanation*: A Promise represents a single eventual value or failure. Calling `resolve()` a second time has no effect.
   - **Q3**: How does unsubscription cancel an Observable HTTP request?
     - *Options*:
       - A: It crashes the Angular browser tab
       - B: It triggers the Observable teardown function, which aborts the underlying XMLHttpRequest/fetch request (Correct)
       - C: It tells the backend server to delete the database entry
       - D: It cannot cancel network requests
     - *Explanation*: In RxJS, unsubscription executes the teardown logic returned by the Observable producer, which in HTTP implementations invokes `AbortController.abort()` or `xhr.abort()`.
   - **Q4**: When should you prefer a Promise over an Observable?
     - *Options*:
       - A: For streaming WebSocket messages
       - B: For simple one-off asynchronous operations where cancellation, streaming, and complex operators are not required (Correct)
       - C: For handling user form input debouncing
       - D: Never; Promises are obsolete in modern JavaScript
     - *Explanation*: For simple, one-shot async operations (like simple dynamic imports or basic scripts) where no streaming, cancellation, or retries are needed, Promises offer simple async/await syntax.

---

#### Topic 4: `observer-subscriber`
- **Route**: `/module1/observer-subscriber`
- **Metadata**: Title: `Observer & Subscriber`, Category: `Fundamentals`, Difficulty: `beginner`, TopicId: `observer-subscriber`

1. **Concept Tab Content**:
   - **The Observer Interface**: An Observer is a simple consumer object containing three optional callback methods:
     ```typescript
     interface Observer<T> {
       next?: (value: T) => void;
       error?: (err: any) => void;
       complete?: () => void;
     }
     ```
   - **What is a Subscriber?**:
     - While an Observer is just a plain object with callbacks, a `Subscriber<T>` is an RxJS class that implements `Observer<T>` AND extends `Subscription`.
     - When you pass an Observer (or standalone callback functions) to `.subscribe()`, RxJS wraps it inside a `SafeSubscriber`.
   - **The SafeSubscriber Guardian**:
     1. *Enforces the Notification Contract*: If the producer calls `subscriber.next()` after `subscriber.complete()` or `subscriber.error()`, `SafeSubscriber` silently drops it.
     2. *Exception Shielding*: If the user's `next()` callback throws an uncaught exception, `SafeSubscriber` intercepts it, forwards it to the `error()` handler, and triggers automatic unsubscription to prevent zombie leaks.
     3. *Automatic Teardown*: Upon emitting `complete` or `error`, all resources and teardown callbacks are automatically triggered without requiring manual unsubscription.

2. **Code Tab Content**:
   ```typescript
   import { Observable, Observer, Subscriber } from 'rxjs';

   // 1. Defining a standard Observer object
   const myObserver: Observer<number> = {
     next: (val) => console.log('Observer received next:', val),
     error: (err) => console.error('Observer caught error:', err),
     complete: () => console.log('Observer completed!')
   };

   // 2. SafeSubscriber demonstration: Discarding illegal notifications
   const rogueStream$ = new Observable<number>((subscriber) => {
     subscriber.next(10);
     subscriber.next(20);
     subscriber.complete(); // Terminal notification

     // ILLEGAL: Emitting after completion!
     // SafeSubscriber silently drops this to protect downstream consumers
     subscriber.next(999);
     subscriber.error(new Error('Ignored error'));
   });

   rogueStream$.subscribe(myObserver);
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Observer Contract Enforcement & Exception Shield Sandbox*
   - **State**:
     - `isTerminated = signal(false)`
     - `simulationMode = signal<'normal' | 'throw_in_next'>('normal')`
     - `consoleEntries = signal<ConsoleEntry[]>([])`
   - **Interactive Actions**:
     - **Button "Emit Next Value"**: Sends `next(Math.random())`. If stream is not terminated, logs `type: 'next'`.
     - **Button "Emit Complete"**: Calls `complete()`. Marks stream terminated. Logs `type: 'complete'`.
     - **Button "Emit Error"**: Calls `error('Fatal error')`. Marks stream terminated. Logs `type: 'error'`.
     - **Button "Attempt Illegal Next() After Termination"**: User attempts to emit next after completion. UI highlights that `SafeSubscriber` blocks and discards it! Logs `type: 'info'`, `description: 'SafeSubscriber blocked illegal next() after stream completion.'`.
     - **Checkbox "Simulate uncaught error inside user next() callback"**: When enabled, the next emission throws `throw new Error('Crash in UI!')`. Demonstrates how `SafeSubscriber` catches the exception, routes it to `error()`, and closes the subscription safely.

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `nature`: Architecture Type
     - `teardown`: Disposable Capability
     - `contract`: Contract Enforcement
     - `exceptions`: Uncaught Exception Handling
     - `role`: Role in System
   - **Items**:
     - `Observer`: Plain JS Interface | No | No (passive callback consumer) | Unhandled crash if next() throws | Consumer interface
     - `Subscriber`: RxJS Class | Yes (extends Subscription) | Basic subscription tracking | Forwarded via pipeline | Bridge between source & sink
     - `SafeSubscriber`: Internal RxJS Wrapper | Yes (handles cleanup) | Yes (drops calls after termination) | Intercepts & routes to error() | Protective runtime shield

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: What happens if an Observable producer calls `subscriber.next(100)` after calling `subscriber.complete()`?
     - *Options*:
       - A: An UncaughtException crashes the browser
       - B: The SafeSubscriber safely intercepts and ignores the notification (Correct)
       - C: The complete state is reverted back to active
       - D: The subscriber reopens the stream
     - *Explanation*: SafeSubscriber enforces the Observable contract. Any notifications emitted after `complete()` or `error()` are discarded.
   - **Q2**: Which methods of the `Observer` interface are mandatory when subscribing?
     - *Options*:
       - A: All three: next, error, and complete
       - B: Only next is required; error and complete are optional
       - C: None; all three callbacks are optional (partial observer) (Correct)
       - D: next and error are mandatory
     - *Explanation*: In RxJS, all observer callbacks (`next`, `error`, `complete`) are optional. You can subscribe with `{}` or just `{ next: v => ... }`.
   - **Q3**: What is the structural relationship between `Subscriber`, `Observer`, and `Subscription`?
     - *Options*:
       - A: Subscriber implements Observer and extends Subscription (Correct)
       - B: Subscription extends Subscriber
       - C: Observer extends Subscriber
       - D: They are three independent, unrelated interfaces
     - *Explanation*: In RxJS, `Subscriber` implements the `Observer` interface (next, error, complete) and extends the `Subscription` class (unsubscribe, closed, add).
   - **Q4**: If a subscriber's `next` callback throws an uncaught JavaScript error, what does `SafeSubscriber` do?
     - *Options*:
       - A: Freezes the entire webpage
       - B: Catches the error, routes it to the observer's error handler, and unbinds resources (Correct)
       - C: Silently swallows the error and continues emitting
       - D: Retries the next callback 3 times
     - *Explanation*: `SafeSubscriber` provides exception shielding: if user code in `next` throws an unhandled error, it safely redirects execution to `error()` and terminates the subscription.

---

#### Topic 5: `subscription-lifecycle`
- **Route**: `/module1/subscription-lifecycle`
- **Metadata**: Title: `Subscription Lifecycle`, Category: `Fundamentals`, Difficulty: `intermediate`, TopicId: `subscription-lifecycle`

1. **Concept Tab Content**:
   - **The 4 Phases of Subscription**:
     1. *Instantiation & Execution*: `observable.subscribe()` instantiates a `Subscriber` and executes the producer function.
     2. *Active Streaming*: Producer pushes notifications to the subscriber over time.
     3. *Teardown / Unsubscription*: Either the producer completes/errors, or consumer calls `subscription.unsubscribe()`.
     4. *Closed State*: Subscription marks `closed: true`, cleans references, and releases event handlers.
   - **Composite Subscriptions (`sub.add()`)**:
     - `Subscription.prototype.add(childSub)` enables composing a hierarchical subscription tree.
     - Invoking `parent.unsubscribe()` cascades down the entire tree, unsubscribing every child and executing all registered teardown functions in reverse order.
   - **Memory Leaks in Angular SPAs**:
     - Subscriptions to long-lived Observables (router events, global state, `interval`, `fromEvent(document)`) retain component references in closures. If not torn down when the component is destroyed, the component instance cannot be garbage-collected.
   - **Modern Angular 20 Teardown Best Practices**:
     - `takeUntilDestroyed()`: Automatically binds unsubscription to Angular's `DestroyRef`.
     - `toSignal()`: Binds the Observable to an Angular Signal, managing unsubscription automatically.
     - `AsyncPipe`: Subscribes and unsubscribes declaratively in template bindings.

2. **Code Tab Content**:
   ```typescript
   import { Component, inject, DestroyRef, OnInit } from '@angular/core';
   import { interval, Subscription } from 'rxjs';
   import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

   @Component({
     selector: 'app-lifecycle-demo',
     standalone: true,
     template: `<div>Active Subscriptions Demo</div>`
   })
   export class LifecycleDemoComponent implements OnInit {
     private destroyRef = inject(DestroyRef);

     // Strategy 1: Angular 20 takeUntilDestroyed (Recommended!)
     // Automatically tears down when component is destroyed
     readonly timer$ = interval(1000).pipe(
       takeUntilDestroyed()
     ).subscribe(tick => console.log('Angular 20 Safe Tick:', tick));

     // Strategy 2: Composite Subscription Tree (Manual)
     private compositeSub = new Subscription();

     ngOnInit() {
       const sub1 = interval(500).subscribe(v => console.log('Sub1:', v));
       const sub2 = interval(1000).subscribe(v => console.log('Sub2:', v));

       // Add children to composite parent
       this.compositeSub.add(sub1);
       this.compositeSub.add(sub2);

       // Register custom cleanup function
       this.compositeSub.add(() => console.log('Custom resource teardown'));

       // Link to DestroyRef
       this.destroyRef.onDestroy(() => {
         // Single call tears down entire tree!
         this.compositeSub.unsubscribe();
       });
     }
   }
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Subscription Tree & Teardown Cascade Visualizer*
   - **Visual Elements**:
     - Visual tree representation:
       - Root Node: `Parent Composite Subscription` (Badge: Active/Closed)
       - Child Node 1: `Telemetry Stream (interval 600ms)`
       - Child Node 2: `Heartbeat Ping (interval 1200ms)`
       - Child Node 3: `DOM Resize Stream (fromEvent)`
     - Status dots: Green pulsing dot for active streams, gray for closed.
   - **Interactive Actions**:
     - **Button "Initialize Subscription Tree"**: Creates composite parent and adds all 3 child streams. Streams begin logging to `<app-output-console>`.
     - **Button "Unsubscribe Child 2 Only"**: Calls `child2.unsubscribe()`. Child 2 turns gray; Parent, Child 1, and Child 3 continue unaffected.
     - **Button "Unsubscribe Parent (Cascade Teardown)"**: Calls `parent.unsubscribe()`. Visual cascade triggers: all child nodes turn gray simultaneously, console logs:
       `[CASCADE] Parent unsubscribed! Closed Child 1, Child 2, Child 3 and executed 3 teardown hooks.`

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `mechanism`: Disposal Mechanism
     - `leakRisk`: Memory Leak Risk
     - `boilerplate`: Boilerplate Overhead
     - `zoneless`: Zoneless Compatible
     - `angularContext`: Injection Context Required
   - **Items**:
     - `Manual .unsubscribe()`: Individual variable per sub | High (easy to forget) | High (ngOnDestroy boilerplate) | Yes | No
     - `Subscription.add()`: Composite subscription tree | Medium (must call in onDestroy) | Moderate | Yes | No
     - `takeUntil(destroy$)`: Subject emission in ngOnDestroy | Medium (legacy Angular 2-15) | Moderate | Yes | No
     - `takeUntilDestroyed()`: Bound to DestroyRef | Zero (automated by Angular) | Minimal (1 line in pipe) | Yes | Yes (or pass DestroyRef)
     - `toSignal()`: Signal conversion | Zero (manages sub internally) | Lowest (declarative) | Yes | Yes (or pass Injector)

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: What happens to child subscriptions added via `parentSub.add(childSub)` when `parentSub.unsubscribe()` is called?
     - *Options*:
       - A: Child subscriptions continue running until completed
       - B: All child subscriptions and teardown callbacks are executed and closed automatically (Correct)
       - C: An error is thrown if child subscriptions are still active
       - D: Only the first child subscription is unsubscribed
     - *Explanation*: Composite subscriptions cascade unsubscription down to all children registered via `.add()`, closing all child subscriptions and executing cleanup functions.
   - **Q2**: What is the most common consequence of failing to unsubscribe from an infinite Observable in an Angular component?
     - *Options*:
       - A: The browser closes automatically
       - B: Memory leaks because closures keep the destroyed component instance in memory (Correct)
       - C: Angular compiles with an AOT error
       - D: HTTP requests fail with status 404
     - *Explanation*: Infinite observables retain references to component methods in their callback closures. If not unsubscribed, the garbage collector cannot collect the component, leading to cumulative memory leaks.
   - **Q3**: What requirement must be met when calling `takeUntilDestroyed()` without passing an explicit `DestroyRef`?
     - *Options*:
       - A: It must be called inside an injection context (e.g. field initializer or constructor) (Correct)
       - B: It can only be called in ngOnDestroy
       - C: It requires zone.js to be enabled
       - D: It must be used inside a Promise
     - *Explanation*: `takeUntilDestroyed()` injects `DestroyRef` by default. Therefore, if called without an explicit parameter, it must be executed within an active Angular injection context.
   - **Q4**: Is calling `.unsubscribe()` on an already closed subscription safe?
     - *Options*:
       - A: No, it throws an ObjectUnsubscribedError
       - B: Yes, unsubscription is idempotent; repeated calls are no-ops (Correct)
       - C: It causes a memory leak
       - D: It restarts the stream
     - *Explanation*: Calling `unsubscribe()` on a closed subscription is safe and idempotent in RxJS; it simply does nothing if `closed === true`.

---

#### Topic 6: `cold-vs-hot`
- **Route**: `/module1/cold-vs-hot`
- **Metadata**: Title: `Cold vs Hot Observables`, Category: `Fundamentals`, Difficulty: `intermediate`, TopicId: `cold-vs-hot`

1. **Concept Tab Content**:
   - **The Distinction**: The fundamental difference between Cold and Hot Observables lies in **where and when the data producer is created**.
   - **Cold Observables (Unicast)**:
     - The producer is instantiated **inside** the Observable for each subscriber.
     - Each subscriber gets their own independent execution and data stream starting from the beginning.
     - *Analogy*: Streaming a movie on Netflix. When you press play, the movie starts from 00:00 for you, regardless of who else is watching it.
     - *Examples*: `HttpClient.get()`, `of()`, `from()`, `interval()`, standard `new Observable(sub => ...)`.
   - **Hot Observables (Multicast)**:
     - The producer is created **outside** the Observable and runs whether or not there are any subscribers.
     - Subscribers share the same execution. Late subscribers **miss** earlier emissions.
     - *Analogy*: Attending a live music concert or listening to FM radio. If you arrive 30 minutes late, you missed the opening songs; you only hear what plays after you arrived.
     - *Examples*: `fromEvent(document, 'click')`, WebSocket messages, RxJS `Subject`, mouse move events.
   - **Warm Observables**:
     - A cold Observable converted into a hot/multicasted stream using operators like `share()` or `shareReplay()`.

2. **Code Tab Content**:
   ```typescript
   import { Observable, fromEvent, Subject } from 'rxjs';

   // --- 1. COLD OBSERVABLE (Producer inside) ---
   const cold$ = new Observable<number>((subscriber) => {
     // Producer created INSIDE: Unique random number per subscriber
     const randomValue = Math.random();
     subscriber.next(randomValue);
     subscriber.complete();
   });

   // Each subscription triggers a separate run:
   cold$.subscribe(v => console.log('Cold Sub 1:', v)); // e.g. 0.4281
   cold$.subscribe(v => console.log('Cold Sub 2:', v)); // e.g. 0.9124 (DIFFERENT!)

   // --- 2. HOT OBSERVABLE (Producer outside) ---
   // Producer created OUTSIDE: Shared event producer
   const clicks$ = fromEvent<MouseEvent>(document, 'click');

   // Both subscribers share the EXACT same mouse events:
   clicks$.subscribe(e => console.log('Hot Sub 1 click at:', e.clientX));
   clicks$.subscribe(e => console.log('Hot Sub 2 click at:', e.clientX));
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Cold vs Hot Synchronous Race Track*
   - **UI Design**: Split-screen interface:
     - *Left Track: Cold Stream (Movie on Demand)*
       - "Start Viewer 1" -> Starts stream from Frame 1, 2, 3...
       - "Start Viewer 2 (Late)" -> Viewer 2 begins from Frame 1 independently! Both streams run side-by-side with separate frame counters.
     - *Right Track: Hot Stream (Live Radio Broadcast)*
       - Global producer continuously broadcasts live tick numbers (1, 2, 3, 4...).
       - "Tune in Listener 3" -> Receives live tick #12.
       - "Tune in Listener 4 (Late)" -> Connects at tick #15, missing ticks 1-14 completely!
   - **Console Output**: Live logs via `<app-output-console>` tagged with `[COLD-V1]`, `[COLD-V2]`, `[HOT-L3]`, `[HOT-L4]`.

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `producerLocation`: Producer Origin
     - `dataSharing`: Data Distribution
     - `lateSubscribers`: Late Subscriber Experience
     - `resourceUsage`: Resource Allocation
     - `typicalUseCases`: Primary Use Cases
     - `typicalExamples`: Standard Examples
   - **Items**:
     - `Cold Observable`: Created inside Observable callback | Unicast (1:1 per subscriber) | Receives entire sequence from start | Multiplied per subscriber | HTTP requests, file reading, timers | `of()`, `from()`, `HttpClient`
     - `Hot Observable`: Created outside Observable callback | Multicast (1:N shared) | Misses earlier emissions (sees only future) | Shared single producer | User UI interactions, WebSockets, clock | `fromEvent()`, `Subject`, sensors
     - `Warm (Multicast)`: Cold source shared via operator | Multicast with optional replay buffer | Can replay N cached values via `shareReplay` | Shared across active subscribers | Cached HTTP requests, shared state | `share()`, `shareReplay()`

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: What defines whether an Observable is Cold or Hot?
     - *Options*:
       - A: Whether it uses TypeScript or JavaScript
       - B: Where the producer of data is created (inside the observable vs outside) (Correct)
       - C: The number of operators in the pipe
       - D: Whether it emits numbers or strings
     - *Explanation*: If the producer is created inside the subscription callback, it is Cold (unicast). If the producer exists outside and is shared, it is Hot (multicast).
   - **Q2**: Is Angular's `HttpClient.get()` cold or hot by default?
     - *Options*:
       - A: Hot, because the server is on the internet
       - B: Cold, because every subscriber triggers a new, separate HTTP request (Correct)
       - C: Warm, because it always caches responses
       - D: Neither; HttpClient does not return Observables
     - *Explanation*: `HttpClient` methods return cold Observables. Subscribing three times will execute three separate HTTP requests over the network.
   - **Q3**: What happens when a subscriber subscribes to a plain hot Subject that has already emitted 5 items?
     - *Options*:
       - A: The subscriber receives all 5 previous items
       - B: The subscriber only receives items emitted after the moment of subscription (Correct)
       - C: An error is thrown
       - D: The stream terminates immediately
     - *Explanation*: Standard hot streams (and plain `Subject`) do not store history. Late subscribers only observe events emitted after their subscription is active.
   - **Q4**: How can a cold Observable (like an HTTP call) be converted into a warm/shared Observable?
     - *Options*:
       - A: By wrapping it in `setTimeout()`
       - B: By using multicasting operators such as `share()` or `shareReplay()` (Correct)
       - C: By casting it to `Promise`
       - D: By calling `.subscribe()` twice
     - *Explanation*: Operators like `share()` and `shareReplay()` introduce an internal Subject that multicasts the single underlying cold execution to multiple subscribers.

---

#### Topic 7: `multicasting`
- **Route**: `/module1/multicasting`
- **Metadata**: Title: `Multicasting Fundamentals`, Category: `Fundamentals`, Difficulty: `advanced`, TopicId: `multicasting`

1. **Concept Tab Content**:
   - **The Multicasting Imperative**: In complex applications, multiple components frequently need the exact same streaming data (e.g., current user profile, configuration settings, WebSocket feeds). Without multicasting, each subscriber triggers separate executions of expensive operations (duplicated HTTP requests, redundant calculations).
   - **How Multicasting Operates**:
     - A Subject is inserted as an intermediary between the single source Observable and multiple consumer Observers.
     - The Subject subscribes to the source once (as an Observer) and broadcasts emissions out to all consumers (as an Observable).
   - **Evolution of Multicasting in RxJS**:
     - *Legacy RxJS (v5/v6)*: Complex operator soup: `multicast()`, `publish()`, `publishReplay()`, `publishBehavior()`, combined with `refCount()`.
     - *Modern RxJS (v7/v8)*: Unified into two primary operators:
       1. `share()`: Configurable multicasting with reset policies.
       2. `shareReplay({ bufferSize: 1, refCount: true })`: Caching the latest emission for late subscribers while properly cleaning up.
   - **The Critical `shareReplay` Memory Leak Trap**:
     - Calling `shareReplay(1)` defaults to `refCount: false` in RxJS 7!
     - When `refCount: false`, the underlying subscription is **never unsubscribed**, even when all component subscribers have unsubscribed!
     - Always use `shareReplay({ bufferSize: 1, refCount: true })` for safe lifecycle management in SPAs.

2. **Code Tab Content**:
   ```typescript
   import { Observable } from 'rxjs';
   import { shareReplay, share } from 'rxjs/operators';

   // --- ANTI-PATTERN: Unshared expensive producer ---
   const expensiveApiCall$ = new Observable<string>((subscriber) => {
     console.log('>>> EXECUTING EXPENSIVE NETWORK FETCH <<<');
     setTimeout(() => {
       subscriber.next(JSON.stringify({ userId: 101, role: 'Admin' }));
       subscriber.complete();
     }, 1000);
   });

   // Subscribing 3 times triggers 3 independent network requests!
   // expensiveApiCall$.subscribe();
   // expensiveApiCall$.subscribe();
   // expensiveApiCall$.subscribe();

   // --- SOLUTION: Multicasting with shareReplay ---
   const sharedProfile$ = expensiveApiCall$.pipe(
     // bufferSize: 1 caches latest emission for late subscribers
     // refCount: true safely unsubscribes from source when all subscribers leave
     shareReplay({ bufferSize: 1, refCount: true })
   );

   // Component A subscribes -> Triggers the 1 single network request
   sharedProfile$.subscribe(data => console.log('Header received:', data));

   // Component B subscribes later -> Instantly receives cached value with 0 network calls!
   sharedProfile$.subscribe(data => console.log('Sidebar received:', data));
   ```

3. **Visual Demo Tab Specification**:
   - **Simulator**: *Multicast Network Traffic & Cache Efficiency Chamber*
   - **Metric Dashboard**:
     - `Network Requests Made`: Number of simulated backend calls triggered.
     - `Subscribers Served`: Number of UI consumers currently listening.
     - `Bandwidth Saved`: Calculated percentage efficiency (`(Subscribers - Requests) / Subscribers * 100%`).
   - **Mode Switcher**:
     - Toggle: `Mode: Unicast (Unshared)` vs `Mode: Multicast (shareReplay)`
   - **Consumer Triggers**:
     - "Mount Nav Component"
     - "Mount User Avatar Component"
     - "Mount Settings Panel Component"
     - "Unmount All Components"
   - **Live Behavior**:
     - *In Unicast Mode*: Every mount button increments the Backend Requests counter (1, 2, 3) and shows a red warning badge: `Duplicate Network Calls Detected!`.
     - *In Multicast Mode*: First mount triggers 1 backend request. Subsequent mounts instantly receive cached data with 0 additional network calls! Green badge: `100% Shared Cache Hit`.
   - **Console Output**: Live logs via `<app-output-console>` displaying simulated HTTP timings, cache hits, and refCount increments/decrements.

4. **Comparison Tab Data (`ComparisonData`)**:
   - **Features**:
     - `caching`: Emission Caching
     - `lateArrivals`: Late Subscriber Reception
     - `refCountTeardown`: Unsubscribe on 0 Consumers
     - `leakRisk`: Memory Leak Risk
     - `bestFor`: Recommended Application
   - **Items**:
     - `Unshared Cold`: None | Waits for new trigger from start | Natural per-subscription cleanup | None | Isolated, unshared actions
     - `share()`: No cache (real-time only) | Misses prior emissions | Yes (resets on refCount: 0) | Low | Real-time event multicasting
     - `shareReplay({ refCount: true })`: Caches latest N items | Instantly receives cached value | Yes (cleans up when subscribers hit 0) | Low | HTTP caching & view state
     - `shareReplay({ refCount: false })`: Caches latest N items | Instantly receives cached value | No (remains permanently connected!) | High (zombie source leaks) | Immutable app configs only

5. **Quiz Tab Specification (`QuizQuestion[]`)**:
   - **Q1**: What architectural role does a Subject play in multicasting?
     - *Options*:
       - A: It replaces the browser network card
       - B: It acts as an intermediate bridge: an Observer to the source and an Observable to multiple downstream subscribers (Correct)
       - C: It converts synchronous code into Web Workers
       - D: It encrypts the data stream
     - *Explanation*: In multicasting, a Subject sits in the middle. It subscribes once to the source observable and fans out the emissions to multiple downstream observers.
   - **Q2**: Why is `shareReplay(1)` potentially dangerous in an Angular single-page application if `refCount` is not specified?
     - *Options*:
       - A: It causes a compilation error in Angular 20
       - B: In RxJS 7+, refCount defaults to false, meaning the source stream never unsubscribes even when all components destroy (Correct)
       - C: It can only store strings
       - D: It slows down garbage collection of static assets
     - *Explanation*: When `refCount` is false, `shareReplay` maintains its internal subscription to the source indefinitely, creating zombie subscriptions if components unmount.
   - **Q3**: If three Angular components concurrently subscribe to an HTTP request observable piped through `shareReplay({ bufferSize: 1, refCount: true })`, how many HTTP requests are made?
     - *Options*:
       - A: Three separate requests
       - B: Exactly one HTTP request (Correct)
       - C: Zero requests
       - D: Two requests
     - *Explanation*: `shareReplay` multicasts the initial execution. The first subscriber triggers the single network request, and the response is shared with all other subscribers.
   - **Q4**: What does the `bufferSize` option in `shareReplay` control?
     - *Options*:
       - A: The network socket buffer size in kilobytes
       - B: The maximum number of historical emissions recorded and replayed to new subscribers (Correct)
       - C: The number of subscribers allowed to connect
       - D: The timeout in milliseconds before retrying
     - *Explanation*: `bufferSize` designates how many previous emissions are retained in the replay buffer to be delivered immediately to subsequent late subscribers.

---

## 5. Verification Method

### 5.1 Compilation Verification
To verify code compilation across the entire project, run:
```bash
npx ng build --configuration development
```
*Expected Outcome*: Exit code 0, 0 compilation errors, clean generation of all lazy module chunks.

### 5.2 Unit Test Verification
To verify that shared components, services, and topic components pass unit tests, run:
```bash
npm test -- --watch=false --browsers=ChromeHeadless
```

### 5.3 Topic Playwright / Visual Acceptance Checks
Verify that navigating to each of the 7 routes renders all 5 interactive tabs:
1. `http://localhost:4200/module1/what-is-rxjs`
2. `http://localhost:4200/module1/what-is-observable`
3. `http://localhost:4200/module1/observable-vs-promise`
4. `http://localhost:4200/module1/observer-subscriber`
5. `http://localhost:4200/module1/subscription-lifecycle`
6. `http://localhost:4200/module1/cold-vs-hot`
7. `http://localhost:4200/module1/multicasting`

For every route:
- **Concept Tab**: Formatted cards, architectural breakdown, and key takeaways render clearly.
- **Code Tab**: Code snippet displays inside `<app-code-block>` with syntax highlighting and copy button.
- **Visual Demo Tab**: Interactive buttons trigger live emissions into `<app-output-console>` with correct colored tags and timestamps.
- **Comparison Tab**: Comparative table renders in `<app-comparison-table>` with distinct feature rows and column badges.
- **Quiz Tab**: `<app-quiz-block>` allows selecting answers, evaluating scores, showing explanations, and marking topic completion in `ProgressService`.

---

## 6. Implementation Handoff Checklist for Implementer Agent

When implementing Milestone 2 Module 1:
- [ ] Create 7 topic folders under `src/app/features/module1-fundamentals/topics/`.
- [ ] In each topic folder, create `<topic>.data.ts` exporting `comparisonData`, `quizQuestions`, and `codeSample`.
- [ ] In each topic folder, create `<topic>.component.ts`, `<topic>.component.html`, and `<topic>.component.scss` implementing the visual simulator and embedding the shared components.
- [ ] Update `src/app/features/module1-fundamentals/module1.routes.ts` with lazy `loadComponent` imports pointing to the 7 standalone components.
- [ ] Run `npx ng build --configuration development` to ensure clean compilation.
