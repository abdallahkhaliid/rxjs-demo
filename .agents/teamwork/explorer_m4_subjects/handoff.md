# Module 5: Subjects & Multicasting Sandbox Architecture Handoff

## 1. Observation

### 1.1 Existing Codebase & Routing Infrastructure
- **Routing Configuration** (`src/app/features/module5-subjects/module5.routes.ts:1-11`):
  ```typescript
  import { Routes } from '@angular/router';
  import { StubTopicComponent } from '../stub-topic.component';

  export const MODULE5_ROUTES: Routes = [
    { path: '', redirectTo: 'sandbox', pathMatch: 'full' },
    { path: 'sandbox', component: StubTopicComponent },
    { path: 'behavior-subject', component: StubTopicComponent },
    { path: 'replay-subject', component: StubTopicComponent },
    { path: 'async-subject', component: StubTopicComponent },
  ];
  ```
  All 4 routes currently reference `StubTopicComponent` (`src/app/features/stub-topic.component.ts:1-68`), which merely renders a placeholder.

- **Navigation & Sidenav Registry** (`src/app/core/services/search.service.ts:75-87`):
  ```typescript
  {
    id: 'module5',
    moduleNumber: 5,
    title: 'Subjects Sandbox',
    description: 'Dynamic multicasting with Subject, BehaviorSubject, ReplaySubject, and AsyncSubject',
    icon: '📡',
    basePath: '/module5',
    topics: [
      { id: 'subject-sandbox', title: 'Interactive Subject Sandbox', path: '/module5/sandbox', category: 'Subjects', difficulty: 'intermediate' },
      { id: 'behavior-subject', title: 'BehaviorSubject Deep Dive', path: '/module5/behavior-subject', category: 'Subjects', difficulty: 'beginner' },
      { id: 'replay-subject', title: 'ReplaySubject Deep Dive', path: '/module5/replay-subject', category: 'Subjects', difficulty: 'intermediate' },
      { id: 'async-subject', title: 'AsyncSubject Deep Dive', path: '/module5/async-subject', category: 'Subjects', difficulty: 'intermediate' },
    ]
  }
  ```

- **Shared Standalone Components** (`src/app/shared/components/index.ts:1-8`):
  Available standalone components ready for reuse:
  - `PlaygroundWrapperComponent` (`app-playground-wrapper`): handles header, difficulty badges, completion tracking via `ProgressService`, and slots (`slot="concept"`, `slot="code"`, `slot="visual"`, `slot="comparison"`, `slot="quiz"`).
  - `CodeBlockComponent` (`app-code-block`): syntax highlighting with highlight.js, copy to clipboard.
  - `OutputConsoleComponent` (`app-output-console`): streaming log viewer with timestamp offsets, filtering, clear, and pause actions.
  - `ComparisonTableComponent` (`app-comparison-table`): responsive feature comparison matrix.
  - `QuizBlockComponent` (`app-quiz-block`): interactive multi-choice quiz with scoring and explanations.

### 1.2 Test Harness & Behavioral Oracles
- **Tier 1 Feature Tests** (`tests/e2e/tier1-features/t1-hoo-subjects-schedulers.js:133-205`):
  - `F37.1`: Standard `Subject` only delivers emissions occurring **after** observer subscription.
  - `F37.2`: `BehaviorSubject` requires initial value and replays current value immediately upon subscription, with `.getValue()` returning current state.
  - `F37.3`: `ReplaySubject(N)` buffers and replays last N values to new subscribers.
  - `F37.4`: `AsyncSubject` emits **only** the final value upon `.complete()`.
  - `F37.5`: Fleet of 3 observers subscribing and unsubscribing independently, each receiving only emissions during their active window.
- **Tier 2 Boundary Tests** (`tests/e2e/tier2-boundaries/t2-hoo-subjects-schedulers-boundaries.js:101-154`):
  - `F37.B1`: `BehaviorSubject` accepts `null` as valid initial value (`bs.getValue() === null`).
  - `F37.B2`: Calling `.next()` after Subject is completed throws or is ignored silently (`subject.isStopped === true`, no errors crashing application).
  - `F37.B3`: `ReplaySubject` with `windowTime` drops expired emissions.
  - `F37.B4`: `AsyncSubject` completing without any emissions completes with 0 emissions.
  - `F37.B5`: Subject `unsubscribe()` permanently marks subject as closed (`subject.closed === true`).
- **Empirical Execution**:
  Command: `node tests/e2e/run-all-tests.js --filter="Feature 37"`
  Result: 10 / 10 passed (100.0%).
- **Build Verification**:
  Command: `npx ng build --configuration development`
  Result: Success in 11.37s with 0 errors.

---

## 2. Logic Chain

1. **Architectural Pattern Consistency**:
   - In Module 1 (`FundamentalTopicComponent`) and Module 2 (`CreationPlaygroundComponent`), a single cohesive component handles all routes within the module via route data injection (`topicId`).
   - For Module 5, creating `SubjectSandboxComponent` in `src/app/features/module5-subjects/subject-sandbox.component.ts` enables a unified dynamic sandbox where users can freely test all 4 Subject types in the `/sandbox` route, while also providing deep-dive curriculum views for `/behavior-subject`, `/replay-subject`, and `/async-subject` that preset the subject type, concept notes, code samples, and targeted quizzes.

2. **Multi-Observer Fleet Mechanics**:
   - The user dispatch requires 3 independent observers: **Observer A**, **Observer B**, and **Observer C**.
   - Each observer requires independent "Subscribe" and "Unsubscribe" buttons, connection state badges (`Connected`, `Idle`, `Completed`, `Error`), received emission counters, and a dedicated scrolling output stream panel.
   - When an observer subscribes to `BehaviorSubject` or `ReplaySubject`, buffered values are delivered **synchronously** during the `.subscribe()` invocation. By setting a transient synchronous flag (`isSubscribingSync = true`) during subscription, the UI can mark buffered items as `[REPLAY]` and subsequent live pushes as `[LIVE]`. This provides immediate, unmistakable visual feedback explaining late subscriber behavior.

3. **Controller & Boundary Capabilities**:
   - Controller requires:
     - `Next(value)`: text input with auto-increment counter + quick presets ("Item 1", "User Event", "State Update", "Payload").
     - `Error(err)`: error message input + error emit trigger.
     - `Complete()`: completes the subject.
     - `Reset`: re-instantiates subject and resets observers.
     - Parameter controls: initial value (and `null` toggle) for `BehaviorSubject`, bufferSize (1, 2, 3, 5, 10) and windowTime (0, 1000ms, 2500ms, 5000ms) for `ReplaySubject`.
     - Advanced boundary trigger: "Close Subject (.unsubscribe())" to demonstrate `closed === true` (F37.B5).

4. **Curriculum & Verification Matrix**:
   - `module5.data.ts` will provide `MODULE5_TOPICS` covering:
     1. `sandbox`: Interactive sandbox comparing all 4 Subject variants.
     2. `behavior-subject`: State store pattern, initial values, `.getValue()`.
     3. `replay-subject`: History buffering, windowTime cache, memory leak caveats.
     4. `async-subject`: HTTP/Promise caching, completion requirement.
   - A unified `SUBJECT_COMPARISON_TABLE` contrasts all 4 subjects across 8 technical dimensions.
   - 4 interactive quizzes (3-4 questions each) test conceptual mastery.

---

## 3. Caveats

1. **ReplaySubject WindowTime in Fast UI Demos**:
   - WindowTime expiration requires real elapsed wall-clock time. In automated unit tests, `setTimeout` or Jasmine clock must be used to verify boundary F37.B3.
2. **Subject.closed vs Subject.isStopped**:
   - In RxJS 7.8, `.complete()` or `.error()` sets `subject.isStopped = true`, but `subject.closed` remains `false`. Only calling `subject.unsubscribe()` directly sets `subject.closed = true`. The UI explicitly displays both flags so learners understand the difference.
3. **No External UI Dependencies**:
   - Hand-crafted SCSS using existing CSS variables (`--color-surface-1`, `--color-surface-2`, `--color-primary`, `--color-border-subtle`, etc.) ensures strict zero-dependency alignment.

---

## 4. Conclusion & Concrete Blueprint

The worker implementer must create and update the following 5 files in `src/app/features/module5-subjects/`:

```
src/app/features/module5-subjects/
├── module5.data.ts                       # Educational data, topics, quizzes, comparison table
├── subject-sandbox.component.ts         # Reactive sandbox engine with 3 observers
├── subject-sandbox.component.html       # 5-slot layout with 3-column observer fleet
├── subject-sandbox.component.scss       # Theme tokens, responsive grid, status badges
├── subject-sandbox.component.spec.ts    # Comprehensive unit tests (F37.1-F37.5, F37.B1-F37.B5)
└── module5.routes.ts                    # Route definitions pointing to SubjectSandboxComponent
```

### 4.1 File Specification: `module5.data.ts`
Path: `src/app/features/module5-subjects/module5.data.ts`

```typescript
import { ComparisonData, QuizQuestion } from '../../core/models';

export type SubjectType = 'Subject' | 'BehaviorSubject' | 'ReplaySubject' | 'AsyncSubject';
export type ObserverId = 'A' | 'B' | 'C';
export type ObserverStatus = 'idle' | 'connected' | 'completed' | 'error';
export type EmissionSource = 'live' | 'replay';

export interface ObserverLogItem {
  id: string;
  timestamp: number;
  relativeMs: number;
  type: 'next' | 'error' | 'complete' | 'subscribed' | 'unsubscribed';
  value?: any;
  source?: EmissionSource;
  displayValue: string;
}

export interface ObserverViewModel {
  id: ObserverId;
  name: string;
  color: string;
  status: ObserverStatus;
  subscriptionTime: number | null;
  emissions: ObserverLogItem[];
  totalReceived: number;
}

export interface SubjectTopicData {
  id: string;
  subjectType: SubjectType;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  concept: {
    summary: string;
    pillarsTitle?: string;
    pillars?: { title: string; description: string }[];
    sections: { title: string; content: string }[];
    takeaways: string[];
  };
  code: {
    title: string;
    code: string;
    language: string;
    highlightLines?: number[];
  };
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  demo: {
    title: string;
    description: string;
  };
}

export const SUBJECT_COMPARISON_TABLE: ComparisonData = {
  features: [
    { id: 'initialValue', label: 'Initial Value Required', description: 'Must a value be provided on construction?' },
    { id: 'lateSub', label: 'Late Subscriber Behavior', description: 'What does a subscriber receive if it joins after emissions occurred?' },
    { id: 'bufferSize', label: 'Memory Buffer Size', description: 'How many historical emissions are cached?' },
    { id: 'timeWindow', label: 'Time Window Expiration', description: 'Supports discarding emissions older than windowTimeMs?' },
    { id: 'emissionTiming', label: 'Emission Timing', description: 'When are values pushed to active observers?' },
    { id: 'syncAccess', label: 'Synchronous Access (.getValue())', description: 'Can you synchronously read current value without subscribing?' },
    { id: 'postComplete', label: 'Post-Complete Behavior', description: 'What happens to subscribers joining after .complete()?' },
    { id: 'useCases', label: 'Primary Use Cases', description: 'Optimal architectural scenario' },
    { id: 'pitfall', label: 'Common Pitfalls', description: 'Anti-patterns and gotchas' }
  ],
  items: [
    {
      id: 'Subject',
      name: 'Subject',
      badge: 'Event Bus',
      recommendedUse: 'Stateless event multicasting, decoupled user actions, button clicks',
      characteristics: {
        initialValue: { text: 'No (starts empty)', status: 'neutral' },
        lateSub: { text: 'Receives nothing emitted before subscription', status: 'negative' },
        bufferSize: { text: '0 (No historical memory)', status: 'negative' },
        timeWindow: { text: 'Not applicable', status: 'neutral' },
        emissionTiming: { text: 'Immediate live push on .next()', status: 'positive' },
        syncAccess: { text: 'No (no value cache)', status: 'negative' },
        postComplete: { text: 'Immediately sends complete/error to late subscribers; drops new next()', status: 'neutral' },
        useCases: { text: 'Decoupled component communication, UI event dispatching, action triggers', status: 'positive' },
        pitfall: { text: 'Late subscribers miss events if emitted before subscription mounts', status: 'negative' }
      }
    },
    {
      id: 'BehaviorSubject',
      name: 'BehaviorSubject',
      badge: 'State Store',
      recommendedUse: 'Representing state over time: current user, auth status, theme, reactive store',
      characteristics: {
        initialValue: { text: 'Yes (Mandatory on constructor, accepts null)', status: 'positive' },
        lateSub: { text: 'Immediately receives the single current / latest value', status: 'positive' },
        bufferSize: { text: '1 (Current value only)', status: 'positive' },
        timeWindow: { text: 'Not applicable', status: 'neutral' },
        emissionTiming: { text: 'Immediate on subscribe + immediate live push on .next()', status: 'positive' },
        syncAccess: { text: 'Yes, via .getValue() synchronously', status: 'positive' },
        postComplete: { text: 'Sends complete/error to late subscribers; drops new next()', status: 'neutral' },
        useCases: { text: 'Application state management, auth stores, active tab, form status', status: 'positive' },
        pitfall: { text: 'Overusing .getValue() procedurally instead of reactive stream piping', status: 'negative' }
      }
    },
    {
      id: 'ReplaySubject',
      name: 'ReplaySubject',
      badge: 'History Buffer',
      recommendedUse: 'Replaying past history: chat message logs, reconnect buffers, telemetry caches',
      characteristics: {
        initialValue: { text: 'No (starts empty, buffer fills on next())', status: 'neutral' },
        lateSub: { text: 'Replays last N buffered values in order (and honors windowTime)', status: 'positive' },
        bufferSize: { text: 'Configurable N (1, 2, 10, or Infinity)', status: 'positive' },
        timeWindow: { text: 'Supported via (bufferSize, windowTimeMs)', status: 'positive' },
        emissionTiming: { text: 'Replays buffer immediately on subscribe + live push on .next()', status: 'positive' },
        syncAccess: { text: 'No public .getValue() (must subscribe to read)', status: 'negative' },
        postComplete: { text: 'Replays buffered values, then sends complete to late subscribers', status: 'positive' },
        useCases: { text: 'WebSocket reconnection buffers, navigation trails, chat logs', status: 'positive' },
        pitfall: { text: 'Unbounded bufferSize = Infinity can cause memory leaks in long streams', status: 'negative' }
      }
    },
    {
      id: 'AsyncSubject',
      name: 'AsyncSubject',
      badge: 'Promise / HTTP Cache',
      recommendedUse: 'Caching a single async result upon completion (similar to an ES6 Promise)',
      characteristics: {
        initialValue: { text: 'No (starts empty)', status: 'neutral' },
        lateSub: { text: 'Receives the cached final value and complete notification', status: 'positive' },
        bufferSize: { text: '1 (stores only the final value)', status: 'neutral' },
        timeWindow: { text: 'Not applicable', status: 'neutral' },
        emissionTiming: { text: 'Emits ONLY when .complete() is called; nothing before', status: 'neutral' },
        syncAccess: { text: 'No public .getValue()', status: 'negative' },
        postComplete: { text: 'Replays the final value and complete to all future subscribers', status: 'positive' },
        useCases: { text: 'HTTP GET response caching, expensive one-time calculations', status: 'positive' },
        pitfall: { text: 'If .complete() is never called, subscribers wait indefinitely with 0 emissions', status: 'negative' }
      }
    }
  ]
};

export const MODULE5_TOPICS: Record<string, SubjectTopicData> = {
  'sandbox': {
    id: 'sandbox',
    subjectType: 'Subject',
    title: 'Interactive Subject Sandbox',
    subtitle: 'Multicast engine playground comparing Subject, BehaviorSubject, ReplaySubject, and AsyncSubject',
    category: 'Subjects & Multicasting',
    difficulty: 'intermediate',
    concept: {
      summary: 'A Subject in RxJS is both an Observable and an Observer simultaneously. It enables multicasting—broadcasting the same execution to multiple listening Observers—bridging the gap between cold unicast streams and hot shared state.',
      pillarsTitle: 'Core Subject Tenets',
      pillars: [
        {
          title: 'Multicast vs. Unicast',
          description: 'Standard cold Observables create an isolated producer per subscriber. Subjects share a single internal observer registry, multicasting emissions to all active listeners.'
        },
        {
          title: 'Dual Identity',
          description: 'A Subject implements Observer (.next, .error, .complete) so it can consume streams, and extends Observable (.subscribe, .pipe) so others can listen.'
        },
        {
          title: 'Lifecycle Termination',
          description: 'Once a Subject emits an error or completion, its internal isStopped flag becomes true. Subsequent .next() calls are silently dropped.'
        }
      ],
      sections: [
        {
          title: 'Why Multicasting Matters',
          content: 'In client applications, multiple widgets often need the exact same stream (e.g. current user, notification ticker). Multicasting avoids duplicate HTTP calls and coordinates decoupled components.'
        },
        {
          title: 'Late Subscriber Dilemma',
          content: 'Standard Subjects do not remember past events. If Observer B subscribes after Item 1 is emitted, Observer B misses Item 1 completely. Variants like BehaviorSubject and ReplaySubject solve this dilemma.'
        }
      ],
      takeaways: [
        'Subject emits only to observers active at the moment of emission.',
        'BehaviorSubject requires an initial value and always stores the current value.',
        'ReplaySubject buffers up to N past emissions (with optional windowTime).',
        'AsyncSubject emits only the final emission upon completion.'
      ]
    },
    code: {
      title: 'Subject Multi-Observer Fleet',
      language: 'typescript',
      highlightLines: [6, 10, 14, 18],
      code: `import { Subject } from 'rxjs';

// 1. Create a standard Subject
const subject$ = new Subject<string>();

// 2. Observer A subscribes early
subject$.subscribe(val => console.log('Observer A:', val));

// 3. Emit first item
subject$.next('Emission 1'); // Observer A receives 'Emission 1'

// 4. Observer B subscribes late
subject$.subscribe(val => console.log('Observer B:', val));

// 5. Emit second item
subject$.next('Emission 2'); // Both A and B receive 'Emission 2'
// Note: Observer B never receives 'Emission 1'!`
    },
    comparison: SUBJECT_COMPARISON_TABLE,
    quiz: [
      {
        id: 'q-subj-1',
        question: 'What happens when a late subscriber subscribes to a standard RxJS Subject after values have been emitted?',
        options: [
          { id: 'a', text: 'It receives all previously emitted values in order.' },
          { id: 'b', text: 'It receives only the single latest emitted value.' },
          { id: 'c', text: 'It receives nothing that was emitted before its subscription time.' },
          { id: 'd', text: 'The Subject throws an error because late subscriptions are illegal.' }
        ],
        correctOptionId: 'c',
        explanation: 'Standard Subjects maintain no memory buffer; they only deliver emissions occurring strictly after the subscription is registered.'
      },
      {
        id: 'q-subj-2',
        question: 'What is the consequence of calling subject.complete() on an active Subject?',
        options: [
          { id: 'a', text: 'Subsequent calls to subject.next() are delivered only to existing subscribers.' },
          { id: 'b', text: 'All active observers receive the complete notification and subsequent .next() calls are ignored.' },
          { id: 'c', text: 'The Subject is reset and reopens on the next call to .next().' },
          { id: 'd', text: 'An exception is thrown immediately.' }
        ],
        correctOptionId: 'b',
        explanation: 'Calling .complete() sets isStopped = true. Active observers receive the complete notification, and subsequent .next() calls are silently ignored.'
      },
      {
        id: 'q-subj-3',
        question: 'How does calling subject.unsubscribe() differ from calling subject.complete()?',
        options: [
          { id: 'a', text: 'There is no difference; they are aliases.' },
          { id: 'b', text: 'complete() sets isStopped = true, whereas subject.unsubscribe() sets closed = true and destroys internal subscriber references.' },
          { id: 'c', text: 'unsubscribe() notifies subscribers with complete.' },
          { id: 'd', text: 'unsubscribe() only unhooks one observer.' }
        ],
        correctOptionId: 'b',
        explanation: 'Calling .unsubscribe() on the Subject itself terminates the subject permanently and marks subject.closed = true. It should generally only be called when tearing down the Subject.'
      }
    ],
    demo: {
      title: 'Multicast Subject Sandbox Controls',
      description: 'Subscribe and unsubscribe Observers A, B, and C independently, emit values, and compare live vs. replay delivery.'
    }
  },
  'behavior-subject': {
    id: 'behavior-subject',
    subjectType: 'BehaviorSubject',
    title: 'BehaviorSubject Deep Dive',
    subtitle: 'Stateful multicasting with mandatory initial value and synchronous .getValue() inspection',
    category: 'Subjects & Multicasting',
    difficulty: 'beginner',
    concept: {
      summary: 'BehaviorSubject represents a value that changes over time. It requires an initial value upon construction and ensures every subscriber immediately receives the current value upon subscription, followed by any future updates.',
      pillarsTitle: 'State Store Architecture',
      pillars: [
        {
          title: 'Mandatory Seed Value',
          description: 'A BehaviorSubject can never be empty. It must be instantiated with a seed value (which can be null, undefined, or a data object).'
        },
        {
          title: 'Synchronous Value Inspection',
          description: 'Unlike standard Subjects, BehaviorSubject exposes .getValue(), returning the current snapshot synchronously without subscribing.'
        },
        {
          title: 'Immediate Replay',
          description: 'New subscribers do not need to wait for the next event; they immediately receive the latest state upon subscription.'
        }
      ],
      sections: [
        {
          title: 'Primary Use Case: Reactive State Stores',
          content: 'In Angular applications, BehaviorSubject is the canonical building block for local services managing state (e.g. current user, theme, shopping cart) before or alongside Angular Signals.'
        },
        {
          title: 'The .getValue() Anti-Pattern',
          content: 'While .getValue() is convenient, relying on it extensively leads to procedural programming. Prefer composing streams using pipe() and operators to maintain reactive data flow.'
        }
      ],
      takeaways: [
        'Always requires an initial value in constructor: new BehaviorSubject(initialValue).',
        'Late subscribers immediately receive the latest value upon subscribing.',
        'Synchronous inspection is possible via .getValue().',
        'Accepts null as a valid initial value.'
      ]
    },
    code: {
      title: 'Reactive Auth Store with BehaviorSubject',
      language: 'typescript',
      highlightLines: [4, 9, 14, 18],
      code: `import { BehaviorSubject, Observable } from 'rxjs';

interface User { id: string; name: string; }

// 1. Mandatory initial seed value (null = unauthenticated)
const currentUser$ = new BehaviorSubject<User | null>(null);

// 2. Observer A connects immediately -> receives null
currentUser$.subscribe(user => console.log('Observer A:', user));

// 3. User logs in
currentUser$.next({ id: 'u1', name: 'Alice' });

// 4. Observer B connects late -> immediately receives Alice!
currentUser$.subscribe(user => console.log('Observer B:', user));

// 5. Synchronous read
console.log('Current value snapshot:', currentUser$.getValue());`
    },
    comparison: SUBJECT_COMPARISON_TABLE,
    quiz: [
      {
        id: 'q-bs-1',
        question: 'Why does new BehaviorSubject() require an initial value argument?',
        options: [
          { id: 'a', text: 'Because TypeScript compiler requires all constructor parameters to be defined.' },
          { id: 'b', text: 'Because BehaviorSubject guarantees that any subscriber will immediately receive a value upon subscription.' },
          { id: 'c', text: 'To determine the generic type of emissions.' },
          { id: 'd', text: 'It does not require an argument; it defaults to undefined.' }
        ],
        correctOptionId: 'b',
        explanation: 'BehaviorSubject guarantees that there is always a current value ready to push to any subscriber the moment they connect.'
      },
      {
        id: 'q-bs-2',
        question: 'Is new BehaviorSubject(null) valid in RxJS?',
        options: [
          { id: 'a', text: 'No, RxJS throws a NullArgumentException at runtime.' },
          { id: 'b', text: 'Yes, null is a valid value, and late subscribers receive null until another value is emitted.' },
          { id: 'c', text: 'Only if TypeScript strictNullChecks is disabled.' },
          { id: 'd', text: 'Yes, but .getValue() will return undefined instead of null.' }
        ],
        correctOptionId: 'b',
        explanation: 'null is a legitimate initial value, frequently used in state stores to denote an empty or uninitialized state.'
      },
      {
        id: 'q-bs-3',
        question: 'What does a late subscriber receive if BehaviorSubject has emitted values "A", "B", and "C"?',
        options: [
          { id: 'a', text: 'All three values: "A", "B", "C".' },
          { id: 'b', text: 'Only the initial value.' },
          { id: 'c', text: 'Only the latest value: "C".' },
          { id: 'd', text: 'Nothing until the next emission arrives.' }
        ],
        correctOptionId: 'c',
        explanation: 'BehaviorSubject has a buffer size of exactly 1; it stores and replays only the single latest value.'
      }
    ],
    demo: {
      title: 'BehaviorSubject State Machine',
      description: 'Observe how Observer B and C immediately catch up to the current state upon subscribing.'
    }
  },
  'replay-subject': {
    id: 'replay-subject',
    subjectType: 'ReplaySubject',
    title: 'ReplaySubject Deep Dive',
    subtitle: 'Buffering historical emissions with configurable buffer size and windowTime expiration',
    category: 'Subjects & Multicasting',
    difficulty: 'intermediate',
    concept: {
      summary: 'ReplaySubject records multiple historical emissions and replays them to new subscribers upon connection. It supports specifying both buffer size (maximum count) and window time (maximum age in milliseconds).',
      pillarsTitle: 'History Buffer Dynamics',
      pillars: [
        {
          title: 'Configurable Buffer Depth',
          description: 'Set bufferSize (e.g. 2, 3, 5) to limit how many items are remembered, preventing unbounded memory growth.'
        },
        {
          title: 'Time-Window Eviction',
          description: 'Provide windowTime (in milliseconds) to automatically evict stale items, ensuring late subscribers only receive fresh data.'
        },
        {
          title: 'Replay Even After Complete',
          description: 'Unlike standard Subjects, ReplaySubject continues to replay its buffered values to late subscribers even after .complete() has been called.'
        }
      ],
      sections: [
        {
          title: 'ReplaySubject vs. BehaviorSubject',
          content: 'BehaviorSubject always requires an initial seed value and stores only 1 value. ReplaySubject starts empty, does not require an initial value, and can buffer N values.'
        },
        {
          title: 'Preventing Memory Leaks',
          content: 'Instantiating new ReplaySubject() without arguments defaults bufferSize to Infinity. In a long-running stream, this causes a severe memory leak. Always specify bufferSize and/or windowTime.'
        }
      ],
      takeaways: [
        'Buffers N items and replays them in chronological order to late subscribers.',
        'Does NOT require an initial value.',
        'Supports windowTimeMs parameter to drop expired emissions.',
        'Continues to replay buffered items even after stream completes.'
      ]
    },
    code: {
      title: 'ReplaySubject with Buffer Size & Window Time',
      language: 'typescript',
      highlightLines: [4, 9, 14, 18],
      code: `import { ReplaySubject } from 'rxjs';

// 1. Buffer up to 2 items within a 2000ms window
const replay$ = new ReplaySubject<string>(2, 2000);

// 2. Emit 3 items in succession
replay$.next('Log 1');
replay$.next('Log 2');
replay$.next('Log 3');

// 3. Late subscriber joins
// Receives only 'Log 2' and 'Log 3' (buffer size = 2)
replay$.subscribe(val => console.log('Late Sub:', val));

// 4. Stream completes
replay$.complete();

// 5. Very late subscriber joins after completion
// Still receives 'Log 2' and 'Log 3' followed by complete!
replay$.subscribe(val => console.log('Post-complete Sub:', val));`
    },
    comparison: SUBJECT_COMPARISON_TABLE,
    quiz: [
      {
        id: 'q-rs-1',
        question: 'What is the default buffer size if new ReplaySubject() is invoked with no arguments?',
        options: [
          { id: 'a', text: '1 item' },
          { id: 'b', text: '10 items' },
          { id: 'c', text: 'Infinity (unbounded buffer)' },
          { id: 'd', text: '0 items' }
        ],
        correctOptionId: 'c',
        explanation: 'Calling new ReplaySubject() with no arguments buffers all emissions indefinitely (bufferSize = Infinity), which can cause memory leaks in production.'
      },
      {
        id: 'q-rs-2',
        question: 'If a ReplaySubject(2, 50) emitted "A" at 0ms, "B" at 30ms, and "C" at 60ms: what does an observer subscribing at 70ms receive?',
        options: [
          { id: 'a', text: '["A", "B", "C"]' },
          { id: 'b', text: '["B", "C"] because both are within the last 50ms and bufferSize is 2.' },
          { id: 'c', text: '["C"] only.' },
          { id: 'd', text: 'Nothing, because 70ms exceeds the 50ms window.' }
        ],
        correctOptionId: 'b',
        explanation: 'At 70ms, 70 - 50 = 20ms window threshold. "B" (at 30ms) and "C" (at 60ms) are newer than 20ms, so both qualify and satisfy bufferSize 2.'
      },
      {
        id: 'q-rs-3',
        question: 'What happens when an observer subscribes to a ReplaySubject(2) that has already completed?',
        options: [
          { id: 'a', text: 'The observer receives only the complete notification.' },
          { id: 'b', text: 'The observer throws an ObjectUnsubscribedError.' },
          { id: 'c', text: 'The observer receives the last 2 buffered values, followed by the complete notification.' },
          { id: 'd', text: 'The observer hangs indefinitely.' }
        ],
        correctOptionId: 'c',
        explanation: 'ReplaySubject preserves its buffer across completion, replaying stored items to late subscribers before delivering the complete notification.'
      }
    ],
    demo: {
      title: 'ReplaySubject Buffer Inspector',
      description: 'Configure bufferSize (1, 2, 3) and windowTime, emit multiple items, and subscribe late to observe history playback.'
    }
  },
  'async-subject': {
    id: 'async-subject',
    subjectType: 'AsyncSubject',
    title: 'AsyncSubject Deep Dive',
    subtitle: 'Promise-like multicasting emitting only the single final value upon stream completion',
    category: 'Subjects & Multicasting',
    difficulty: 'intermediate',
    concept: {
      summary: 'AsyncSubject is a specialized Subject that emits only its last value, and only when the execution completes. If the stream never completes, it never emits. It closely mirrors the behavior of an ES6 Promise.',
      pillarsTitle: 'Completion-Gated Execution',
      pillars: [
        {
          title: 'Complete Trigger Required',
          description: 'No matter how many .next() calls occur, observers receive zero emissions until .complete() is explicitly executed.'
        },
        {
          title: 'Final Value Only',
          description: 'Only the very last argument passed to .next() before completion is delivered. All earlier emissions are overwritten and discarded.'
        },
        {
          title: 'Zero-Emission Edge Case',
          description: 'If .complete() is called without any preceding .next() calls, the AsyncSubject completes immediately with 0 emissions.'
        }
      ],
      sections: [
        {
          title: 'Analogy: The ES6 Promise of RxJS',
          content: 'An AsyncSubject behaves like a Promise: it settles once (on completion), delivers a single final result, and caches that result permanently for any future subscriber.'
        },
        {
          title: 'Primary Use Case: HTTP Response Caching',
          content: 'Used when an asynchronous operation produces intermediate progress updates but consumers only care about the final resolved payload.'
        }
      ],
      takeaways: [
        'Emits only the final value, and ONLY after .complete() is called.',
        'If .complete() is called without prior emissions, it completes with 0 items.',
        'If .error(err) is called, it emits only the error; no values are sent.',
        'Late subscribers joining after completion still receive the cached final value.'
      ]
    },
    code: {
      title: 'AsyncSubject HTTP Response Simulation',
      language: 'typescript',
      highlightLines: [4, 9, 14, 18],
      code: `import { AsyncSubject } from 'rxjs';

// 1. Create AsyncSubject
const asyncSubject$ = new AsyncSubject<string>();

// 2. Observer A subscribes early
asyncSubject$.subscribe(val => console.log('Observer A:', val));

// 3. Multiple intermediate emissions
asyncSubject$.next('Fetch Progress: 25%');
asyncSubject$.next('Fetch Progress: 75%');
asyncSubject$.next('Final Response Payload 200 OK');

// Nothing emitted yet! Observers receive 0 values.

// 4. Complete the stream
asyncSubject$.complete();
// Observer A receives: 'Final Response Payload 200 OK' followed by complete!

// 5. Observer B subscribes late (after complete)
asyncSubject$.subscribe(val => console.log('Observer B:', val));
// Observer B also receives: 'Final Response Payload 200 OK'`
    },
    comparison: SUBJECT_COMPARISON_TABLE,
    quiz: [
      {
        id: 'q-as-1',
        question: 'When does an AsyncSubject emit a value to its active subscribers?',
        options: [
          { id: 'a', text: 'Immediately on every .next() call.' },
          { id: 'b', text: 'Only when .complete() is invoked, emitting strictly the last value.' },
          { id: 'c', text: 'After a debounce timeout of 300ms.' },
          { id: 'd', text: 'Only when .unsubscribe() is called on the subject.' }
        ],
        correctOptionId: 'b',
        explanation: 'AsyncSubject waits until completion before delivering the single last value emitted via .next().'
      },
      {
        id: 'q-as-2',
        question: 'What happens if an AsyncSubject receives .complete() without any preceding .next() calls?',
        options: [
          { id: 'a', text: 'It emits undefined, then completes.' },
          { id: 'b', text: 'It throws an EmptyError.' },
          { id: 'c', text: 'It completes with zero emissions.' },
          { id: 'd', text: 'It waits indefinitely until a value is provided.' }
        ],
        correctOptionId: 'c',
        explanation: 'Calling .complete() on an empty AsyncSubject notifies subscribers of completion without emitting any values (F37.B4).'
      },
      {
        id: 'q-as-3',
        question: 'If an error occurs on an AsyncSubject that has already received 3 .next() values, what do observers receive?',
        options: [
          { id: 'a', text: 'The last value, followed by the error.' },
          { id: 'b', text: 'Only the error; no values are emitted.' },
          { id: 'c', text: 'All 3 values, then the error.' },
          { id: 'd', text: 'The error is suppressed.' }
        ],
        correctOptionId: 'b',
        explanation: 'If an AsyncSubject errors, it never completes successfully, so the pending final value is discarded and only the error is pushed.'
      }
    ],
    demo: {
      title: 'AsyncSubject Completion Demo',
      description: 'Emit multiple values to see that observers receive nothing until the "Complete()" trigger is fired.'
    }
  }
};

// Aliases for topic resolution
MODULE5_TOPICS['subject-sandbox'] = MODULE5_TOPICS['sandbox'];
```

---

### 4.2 File Specification: `subject-sandbox.component.ts`
Path: `src/app/features/module5-subjects/subject-sandbox.component.ts`

```typescript
import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { Subject, BehaviorSubject, ReplaySubject, AsyncSubject, Subscription } from 'rxjs';

import { ConsoleEntry, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import {
  MODULE5_TOPICS,
  SubjectType,
  ObserverId,
  ObserverViewModel,
  ObserverLogItem,
  SubjectTopicData,
  EmissionSource
} from './module5.data';

export interface SubjectStatusModel {
  isStopped: boolean;
  hasError: boolean;
  errorMessage?: string;
  isCompleted: boolean;
  isClosed: boolean;
  currentValue?: any;
  emissionCount: number;
  activeSubscriberCount: number;
}

@Component({
  selector: 'app-subject-sandbox',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './subject-sandbox.component.html',
  styleUrl: './subject-sandbox.component.scss'
})
export class SubjectSandboxComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  // Active topic & tab signals
  readonly topicId = signal<string>('sandbox');
  readonly activeTab = signal<PlaygroundTab>('visual');

  // Selected Subject Type & Parameters
  readonly selectedSubjectType = signal<SubjectType>('Subject');
  readonly behaviorInitialValue = signal<string>('Initial State');
  readonly behaviorInitialIsNull = signal<boolean>(false);
  readonly replayBufferSize = signal<number>(2);
  readonly replayWindowTimeMs = signal<number>(0); // 0 = infinite

  // Controller Inputs
  readonly nextValueInput = signal<string>('Message 1');
  readonly nextValueCounter = signal<number>(1);
  readonly errorMessageInput = signal<string>('Simulated Subject Error');

  // Observers Fleet (A, B, C)
  readonly observers = signal<Record<ObserverId, ObserverViewModel>>({
    A: { id: 'A', name: 'Observer A', color: 'var(--color-obs-a, #38bdf8)', status: 'idle', subscriptionTime: null, emissions: [], totalReceived: 0 },
    B: { id: 'B', name: 'Observer B', color: 'var(--color-obs-b, #a855f7)', status: 'idle', subscriptionTime: null, emissions: [], totalReceived: 0 },
    C: { id: 'C', name: 'Observer C', color: 'var(--color-obs-c, #10b981)', status: 'idle', subscriptionTime: null, emissions: [], totalReceived: 0 }
  });

  // Global Console Logs for app-output-console
  readonly consoleEntries = signal<ConsoleEntry[]>([]);

  // Subject Status
  readonly subjectStatus = signal<SubjectStatusModel>({
    isStopped: false,
    hasError: false,
    isCompleted: false,
    isClosed: false,
    currentValue: undefined,
    emissionCount: 0,
    activeSubscriberCount: 0
  });

  // Active Topic Data
  readonly topic = computed<SubjectTopicData | null>(() => {
    const id = this.topicId();
    return MODULE5_TOPICS[id] || MODULE5_TOPICS['sandbox'] || null;
  });

  // Internal RxJS State
  private currentSubject: Subject<any> | null = null;
  private observerSubscriptions: Record<ObserverId, Subscription | null> = {
    A: null,
    B: null,
    C: null
  };
  private sandboxStartTime = Date.now();
  private entryIdCounter = 0;
  private emissionCounter = 0;

  ngOnInit(): void {
    // Read route data
    this.route.data.subscribe(data => {
      if (data && data['topicId']) {
        this.topicId.set(data['topicId']);
      }
      if (data && data['subjectType']) {
        this.selectedSubjectType.set(data['subjectType']);
      } else {
        // Infer from topicId if available
        const id = this.topicId();
        if (id === 'behavior-subject') this.selectedSubjectType.set('BehaviorSubject');
        else if (id === 'replay-subject') this.selectedSubjectType.set('ReplaySubject');
        else if (id === 'async-subject') this.selectedSubjectType.set('AsyncSubject');
      }
      this.initSubjectInstance();
    });
  }

  ngOnDestroy(): void {
    this.teardownAllSubscriptions();
    if (this.currentSubject && !this.currentSubject.closed) {
      try { this.currentSubject.unsubscribe(); } catch {}
    }
  }

  // --- Subject Initialization ---
  initSubjectInstance(): void {
    this.teardownAllSubscriptions();
    this.resetObserverFleet();
    this.sandboxStartTime = Date.now();
    this.emissionCounter = 0;

    const type = this.selectedSubjectType();
    this.currentSubject = this.createSubjectInstance(type);
    this.refreshSubjectStatus();

    this.logConsole('info', `Created new ${type} instance`, 'System');
  }

  private createSubjectInstance(type: SubjectType): Subject<any> {
    switch (type) {
      case 'Subject':
        return new Subject<any>();
      case 'BehaviorSubject': {
        const initVal = this.behaviorInitialIsNull() ? null : this.behaviorInitialValue();
        return new BehaviorSubject<any>(initVal);
      }
      case 'ReplaySubject': {
        const buf = this.replayBufferSize();
        const win = this.replayWindowTimeMs() > 0 ? this.replayWindowTimeMs() : undefined;
        return new ReplaySubject<any>(buf, win);
      }
      case 'AsyncSubject':
        return new AsyncSubject<any>();
    }
  }

  // --- Observer Controls ---
  subscribeObserver(id: ObserverId): void {
    if (this.observerSubscriptions[id]) return; // Already subscribed
    if (!this.currentSubject) return;

    const now = Date.now();
    const relMs = now - this.sandboxStartTime;

    this.logConsole('subscribe', `Observer ${id} subscribed`, `Observer ${id}`);

    // Update observer status to 'connected'
    this.updateObserverState(id, obs => ({
      ...obs,
      status: 'connected',
      subscriptionTime: relMs,
      emissions: [
        ...obs.emissions,
        {
          id: `sub-${++this.entryIdCounter}`,
          timestamp: now,
          relativeMs: relMs,
          type: 'subscribed',
          displayValue: `Subscribed to ${this.selectedSubjectType()}`
        }
      ]
    }));

    // Synchronous replay detection flag
    let isSubscribingSync = true;

    try {
      const sub = this.currentSubject.subscribe({
        next: (val) => {
          const emitNow = Date.now();
          const emitRelMs = emitNow - this.sandboxStartTime;
          const source: EmissionSource = isSubscribingSync ? 'replay' : 'live';

          this.logConsole('next', val, `Observer ${id}`);

          this.updateObserverState(id, obs => ({
            ...obs,
            totalReceived: obs.totalReceived + 1,
            emissions: [
              ...obs.emissions,
              {
                id: `emit-${++this.entryIdCounter}`,
                timestamp: emitNow,
                relativeMs: emitRelMs,
                type: 'next',
                value: val,
                source,
                displayValue: this.formatValue(val)
              }
            ]
          }));
        },
        error: (err) => {
          const errNow = Date.now();
          const errRelMs = errNow - this.sandboxStartTime;
          const errMsg = err instanceof Error ? err.message : String(err);

          this.logConsole('error', errMsg, `Observer ${id}`);

          this.updateObserverState(id, obs => ({
            ...obs,
            status: 'error',
            emissions: [
              ...obs.emissions,
              {
                id: `err-${++this.entryIdCounter}`,
                timestamp: errNow,
                relativeMs: errRelMs,
                type: 'error',
                value: errMsg,
                displayValue: `Error: ${errMsg}`
              }
            ]
          }));

          this.observerSubscriptions[id] = null;
          this.refreshSubjectStatus();
        },
        complete: () => {
          const compNow = Date.now();
          const compRelMs = compNow - this.sandboxStartTime;

          this.logConsole('complete', 'Stream Completed', `Observer ${id}`);

          this.updateObserverState(id, obs => ({
            ...obs,
            status: 'completed',
            emissions: [
              ...obs.emissions,
              {
                id: `comp-${++this.entryIdCounter}`,
                timestamp: compNow,
                relativeMs: compRelMs,
                type: 'complete',
                displayValue: 'Completed'
              }
            ]
          }));

          this.observerSubscriptions[id] = null;
          this.refreshSubjectStatus();
        }
      });

      isSubscribingSync = false;
      this.observerSubscriptions[id] = sub;
    } catch (e: any) {
      isSubscribingSync = false;
      this.logConsole('error', `Subscription failed: ${e.message}`, `Observer ${id}`);
    }

    this.refreshSubjectStatus();
  }

  unsubscribeObserver(id: ObserverId): void {
    const sub = this.observerSubscriptions[id];
    if (!sub) return;

    sub.unsubscribe();
    this.observerSubscriptions[id] = null;

    const now = Date.now();
    const relMs = now - this.sandboxStartTime;

    this.logConsole('unsubscribe', `Observer ${id} unsubscribed`, `Observer ${id}`);

    this.updateObserverState(id, obs => ({
      ...obs,
      status: 'idle',
      emissions: [
        ...obs.emissions,
        {
          id: `unsub-${++this.entryIdCounter}`,
          timestamp: now,
          relativeMs: relMs,
          type: 'unsubscribed',
          displayValue: 'Unsubscribed (Disconnected)'
        }
      ]
    }));

    this.refreshSubjectStatus();
  }

  // --- Controller Actions ---
  emitNext(): void {
    if (!this.currentSubject) return;

    if (this.currentSubject.isStopped || this.currentSubject.closed) {
      this.logConsole('info', 'Call to .next() ignored: Subject is completed, errored, or closed.', 'Controller');
      return;
    }

    const val = this.nextValueInput();
    this.emissionCounter++;

    this.logConsole('info', `Subject.next("${val}")`, 'Controller');
    this.currentSubject.next(val);

    // Increment message counter for smooth user interaction
    this.nextValueCounter.update(c => c + 1);
    this.nextValueInput.set(`Message ${this.nextValueCounter()}`);

    this.refreshSubjectStatus();
  }

  emitError(): void {
    if (!this.currentSubject || this.currentSubject.isStopped || this.currentSubject.closed) {
      this.logConsole('info', 'Call to .error() ignored: Subject is stopped or closed.', 'Controller');
      return;
    }

    const msg = this.errorMessageInput() || 'Simulated Subject Error';
    this.logConsole('error', `Subject.error("${msg}")`, 'Controller');
    this.currentSubject.error(new Error(msg));

    this.refreshSubjectStatus();
  }

  emitComplete(): void {
    if (!this.currentSubject || this.currentSubject.isStopped || this.currentSubject.closed) {
      this.logConsole('info', 'Call to .complete() ignored: Subject is stopped or closed.', 'Controller');
      return;
    }

    this.logConsole('complete', 'Subject.complete() called', 'Controller');
    this.currentSubject.complete();

    this.refreshSubjectStatus();
  }

  closeSubjectViaUnsubscribe(): void {
    if (!this.currentSubject) return;
    this.logConsole('info', 'Calling subject.unsubscribe() directly (sets closed = true)', 'Controller');
    this.currentSubject.unsubscribe();
    this.teardownAllSubscriptions();
    this.refreshSubjectStatus();
  }

  resetSandbox(): void {
    this.initSubjectInstance();
    this.nextValueCounter.set(1);
    this.nextValueInput.set('Message 1');
  }

  selectSubjectType(type: SubjectType): void {
    if (this.selectedSubjectType() === type) return;
    this.selectedSubjectType.set(type);
    this.initSubjectInstance();
  }

  setPresetValue(preset: string): void {
    this.nextValueInput.set(preset);
  }

  setNullInitial(isNull: boolean): void {
    this.behaviorInitialIsNull.set(isNull);
    if (this.selectedSubjectType() === 'BehaviorSubject') {
      this.initSubjectInstance();
    }
  }

  setReplayBufferSize(size: number): void {
    this.replayBufferSize.set(size);
    if (this.selectedSubjectType() === 'ReplaySubject') {
      this.initSubjectInstance();
    }
  }

  setReplayWindowTime(timeMs: number): void {
    this.replayWindowTimeMs.set(timeMs);
    if (this.selectedSubjectType() === 'ReplaySubject') {
      this.initSubjectInstance();
    }
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  // --- Helper Methods ---
  private refreshSubjectStatus(): void {
    if (!this.currentSubject) return;

    let currVal: any = undefined;
    if (this.selectedSubjectType() === 'BehaviorSubject' && 'getValue' in this.currentSubject) {
      try { currVal = (this.currentSubject as BehaviorSubject<any>).getValue(); } catch {}
    }

    const activeSubs = Object.values(this.observerSubscriptions).filter(s => s !== null).length;

    this.subjectStatus.set({
      isStopped: !!this.currentSubject.isStopped,
      hasError: !!this.currentSubject.hasError,
      errorMessage: this.currentSubject.thrownError ? String(this.currentSubject.thrownError.message || this.currentSubject.thrownError) : undefined,
      isCompleted: !!this.currentSubject.isStopped && !this.currentSubject.hasError,
      isClosed: !!this.currentSubject.closed,
      currentValue: currVal,
      emissionCount: this.emissionCounter,
      activeSubscriberCount: activeSubs
    });
  }

  private teardownAllSubscriptions(): void {
    (['A', 'B', 'C'] as ObserverId[]).forEach(id => {
      if (this.observerSubscriptions[id]) {
        try { this.observerSubscriptions[id]?.unsubscribe(); } catch {}
        this.observerSubscriptions[id] = null;
      }
    });
  }

  private resetObserverFleet(): void {
    this.observers.set({
      A: { id: 'A', name: 'Observer A', color: 'var(--color-obs-a, #38bdf8)', status: 'idle', subscriptionTime: null, emissions: [], totalReceived: 0 },
      B: { id: 'B', name: 'Observer B', color: 'var(--color-obs-b, #a855f7)', status: 'idle', subscriptionTime: null, emissions: [], totalReceived: 0 },
      C: { id: 'C', name: 'Observer C', color: 'var(--color-obs-c, #10b981)', status: 'idle', subscriptionTime: null, emissions: [], totalReceived: 0 }
    });
  }

  private updateObserverState(id: ObserverId, updater: (prev: ObserverViewModel) => ObserverViewModel): void {
    const current = { ...this.observers() };
    if (current[id]) {
      current[id] = updater(current[id]);
      this.observers.set(current);
    }
  }

  private logConsole(type: ConsoleEntry['type'], value: any, streamName?: string): void {
    const now = Date.now();
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: now,
      relativeMs: now - this.sandboxStartTime,
      type,
      streamName,
      value
    };
    this.consoleEntries.update(list => [...list, entry]);
  }

  formatValue(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'object') {
      try { return JSON.stringify(val); } catch { return String(val); }
    }
    return String(val);
  }
}
```

---

### 4.3 Component Template & Styling Structure
Paths:
- `src/app/features/module5-subjects/subject-sandbox.component.html`
- `src/app/features/module5-subjects/subject-sandbox.component.scss`

#### HTML Structure Highlights:
1. **Playground Wrapper Integration**:
   `<app-playground-wrapper [title]="data.title" [subtitle]="data.subtitle" [category]="data.category" [difficulty]="data.difficulty" [topicId]="data.id" [(activeTab)]="activeTab">`
2. **Tab 1: Concept Slot** (`slot="concept"`):
   Renders `data.concept.summary`, `pillars-grid`, `deep-dive-card` list, and `takeaways-card`.
3. **Tab 2: Code Slot** (`slot="code"`):
   `<app-code-block [title]="data.code.title" [code]="data.code.code" [language]="data.code.language" [highlightLines]="data.code.highlightLines || []" />`
4. **Tab 3: Visual Demo Slot** (`slot="visual"`):
   - **Subject Type Pills**: 4 pill buttons (`Subject`, `BehaviorSubject`, `ReplaySubject`, `AsyncSubject`) with `.active` styling.
   - **Configuration Bar**:
     * If `BehaviorSubject`: Input field for initial value + checkbox for `null` seed value.
     * If `ReplaySubject`: Buffer size selector pills (`1`, `2`, `3`, `5`) + Window time selector (`None`, `1000ms`, `2500ms`, `5000ms`).
     * Status chip bar: `State: Active / Stopped / Closed`, `Subscribers: N/3`, `Current Value: ...`.
   - **Command Center Bar**:
     * Input `nextValueInput` + `Emit Next` button (`(click)="emitNext()"`).
     * Quick preset buttons: "Item 1", "Alert", "Payload".
     * Error input + `Emit Error` button (`(click)="emitError()"`).
     * `Complete` button (`(click)="emitComplete()"`).
     * `Reset` button (`(click)="resetSandbox()"`).
     * Advanced boundary button: `Close Subject (.unsubscribe())`.
   - **3-Observer Fleet Panel** (CSS Grid `.observer-fleet-grid`):
     * 3 columns: Card A, Card B, Card C.
     * Card Header: Observer Title with colored indicator dot, status badge (`Connected`, `Idle`, `Completed`, `Error`), and items count badge.
     * Control Buttons:
       - `Subscribe` button (`(click)="subscribeObserver(obs.id)"`, disabled when `obs.status === 'connected'`).
       - `Unsubscribe` button (`(click)="unsubscribeObserver(obs.id)"`, disabled when `obs.status !== 'connected'`).
     * Emission Stream Log:
       - Scrolling list of `obs.emissions`.
       - Each entry shows `+{{ item.relativeMs }}ms`, source badge (`[LIVE]` in green, `[REPLAY]` in amber, `[STATUS]` in blue/purple), and value.
       - Empty state prompt when no emissions have arrived.
   - **Sandbox Multicast Output Console**:
     `<app-output-console title="Unified Multicast Timeline" [entries]="consoleEntries()" (clear)="clearConsole()" />`
5. **Tab 4: Comparison Slot** (`slot="comparison"`):
   `<app-comparison-table [data]="data.comparison" title="Subjects & Multicasting Comparison Matrix" />`
6. **Tab 5: Quiz Slot** (`slot="quiz"`):
   `<app-quiz-block [questions]="data.quiz" title="Module 5 Knowledge Check" />`

#### SCSS Theme & Grid Highlights:
- Colors:
  - Observer A: `#38bdf8` (Cyan)
  - Observer B: `#a855f7` (Purple)
  - Observer C: `#10b981` (Emerald)
- Grid layout:
  ```scss
  .observer-fleet-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 1.25rem;
    margin-top: 1.5rem;

    @media (max-width: 992px) {
      grid-template-columns: 1fr;
    }
  }
  ```
- Terminal look for observer stream logs:
  ```scss
  .observer-stream-viewport {
    background: var(--color-surface-2, #111827);
    border: 1px solid var(--color-border-subtle, #1f2937);
    border-radius: 8px;
    height: 240px;
    overflow-y: auto;
    font-family: var(--font-mono, monospace);
    font-size: 0.8125rem;
    padding: 0.75rem;
  }
  ```

---

### 4.4 File Specification: `module5.routes.ts`
Path: `src/app/features/module5-subjects/module5.routes.ts`

```typescript
import { Routes } from '@angular/router';
import { SubjectSandboxComponent } from './subject-sandbox.component';

export const MODULE5_ROUTES: Routes = [
  { path: '', redirectTo: 'sandbox', pathMatch: 'full' },
  {
    path: 'sandbox',
    component: SubjectSandboxComponent,
    data: { topicId: 'sandbox', subjectType: 'Subject' }
  },
  {
    path: 'behavior-subject',
    component: SubjectSandboxComponent,
    data: { topicId: 'behavior-subject', subjectType: 'BehaviorSubject' }
  },
  {
    path: 'replay-subject',
    component: SubjectSandboxComponent,
    data: { topicId: 'replay-subject', subjectType: 'ReplaySubject' }
  },
  {
    path: 'async-subject',
    component: SubjectSandboxComponent,
    data: { topicId: 'async-subject', subjectType: 'AsyncSubject' }
  }
];
```

---

### 4.5 File Specification: `subject-sandbox.component.spec.ts`
Path: `src/app/features/module5-subjects/subject-sandbox.component.spec.ts`

```typescript
import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SubjectSandboxComponent } from './subject-sandbox.component';
import { MODULE5_TOPICS } from './module5.data';
import { ProgressService } from '../../core/services/progress.service';

describe('SubjectSandboxComponent', () => {
  let component: SubjectSandboxComponent;
  let fixture: ComponentFixture<SubjectSandboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectSandboxComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ topicId: 'sandbox', subjectType: 'Subject' }),
            snapshot: { data: { topicId: 'sandbox', subjectType: 'Subject' } }
          }
        },
        ProgressService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectSandboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create the component with default topic sandbox and Subject type', () => {
    expect(component).toBeTruthy();
    expect(component.topicId()).toBe('sandbox');
    expect(component.selectedSubjectType()).toBe('Subject');
    expect(component.topic()).not.toBeNull();
  });

  it('F37.1 Alignment: Standard Subject only delivers emissions occurring AFTER observer subscription', () => {
    component.selectSubjectType('Subject');

    // Observer A subscribes early
    component.subscribeObserver('A');

    // Emit 1
    component.nextValueInput.set('Val 1');
    component.emitNext();

    // Observer B subscribes late (after Val 1)
    component.subscribeObserver('B');

    // Emit 2
    component.nextValueInput.set('Val 2');
    component.emitNext();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    const obsB = component.observers()['B'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsA).toEqual(['Val 1', 'Val 2']);
    expect(obsB).toEqual(['Val 2']); // Observer B missed Val 1!
  });

  it('F37.2 Alignment: BehaviorSubject requires initial value and replays current value immediately', () => {
    component.behaviorInitialValue.set('Initial State');
    component.selectSubjectType('BehaviorSubject');

    expect(component.subjectStatus().currentValue).toBe('Initial State');

    // Observer A subscribes -> receives initial state immediately
    component.subscribeObserver('A');
    let obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    expect(obsA).toEqual(['Initial State']);

    // Emit updated
    component.nextValueInput.set('Updated State');
    component.emitNext();

    obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    expect(obsA).toEqual(['Initial State', 'Updated State']);
    expect(component.subjectStatus().currentValue).toBe('Updated State');
  });

  it('F37.3 Alignment: ReplaySubject(N) buffers and replays last N values to new subscribers', () => {
    component.setReplayBufferSize(2);
    component.selectSubjectType('ReplaySubject');

    component.nextValueInput.set('A');
    component.emitNext();
    component.nextValueInput.set('B');
    component.emitNext();
    component.nextValueInput.set('C');
    component.emitNext();

    // Observer B subscribes late
    component.subscribeObserver('B');
    const obsB = component.observers()['B'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsB).toEqual(['B', 'C']); // Last 2 items buffered
  });

  it('F37.4 Alignment: AsyncSubject emits only the final value upon completion', () => {
    component.selectSubjectType('AsyncSubject');

    component.subscribeObserver('A');

    component.nextValueInput.set('10');
    component.emitNext();
    component.nextValueInput.set('20');
    component.emitNext();
    component.nextValueInput.set('30');
    component.emitNext();

    let obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.length).toBe(0); // Nothing emitted before complete!

    component.emitComplete();

    obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.map(e => e.value)).toEqual(['30']); // Only final value!
  });

  it('F37.5 Alignment: Fleet of 3 observers subscribing and unsubscribing independently', () => {
    component.selectSubjectType('Subject');

    // A and B subscribe
    component.subscribeObserver('A');
    component.subscribeObserver('B');

    component.nextValueInput.set('Msg 1');
    component.emitNext();

    // A unhooks, C joins
    component.unsubscribeObserver('A');
    component.subscribeObserver('C');

    component.nextValueInput.set('Msg 2');
    component.emitNext();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    const obsB = component.observers()['B'].emissions.filter(e => e.type === 'next').map(e => e.value);
    const obsC = component.observers()['C'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsA).toEqual(['Msg 1']);
    expect(obsB).toEqual(['Msg 1', 'Msg 2']);
    expect(obsC).toEqual(['Msg 2']);
  });

  it('F37.B1 Alignment: BehaviorSubject accepts null as valid initial value', () => {
    component.setNullInitial(true);
    component.selectSubjectType('BehaviorSubject');

    expect(component.subjectStatus().currentValue).toBeNull();

    component.subscribeObserver('A');
    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    expect(obsA).toEqual([null]);
  });

  it('F37.B2 Alignment: Calling .next() after Subject is completed throws or is ignored silently', () => {
    component.selectSubjectType('Subject');
    component.subscribeObserver('A');

    component.emitComplete();
    expect(component.subjectStatus().isCompleted).toBe(true);
    expect(component.subjectStatus().isStopped).toBe(true);

    // Calling next after complete should not crash
    component.nextValueInput.set('zombie');
    component.emitNext();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.length).toBe(0);
  });

  it('F37.B3 Alignment: ReplaySubject with windowTime drops expired emissions', fakeAsync(() => {
    component.setReplayBufferSize(10);
    component.setReplayWindowTime(20); // 20ms window
    component.selectSubjectType('ReplaySubject');

    component.nextValueInput.set('expired');
    component.emitNext();

    tick(30); // Let 30ms elapse (exceeding 20ms window)

    component.nextValueInput.set('fresh');
    component.emitNext();

    component.subscribeObserver('A');
    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsA).toEqual(['fresh']); // 'expired' was pruned
  }));

  it('F37.B4 Alignment: AsyncSubject completing without any emissions completes with 0 emissions', () => {
    component.selectSubjectType('AsyncSubject');
    component.subscribeObserver('A');

    component.emitComplete();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.length).toBe(0);
    expect(component.observers()['A'].status).toBe('completed');
  });

  it('F37.B5 Alignment: Subject unsubscribe() permanently marks subject as closed', () => {
    component.selectSubjectType('Subject');
    component.closeSubjectViaUnsubscribe();

    expect(component.subjectStatus().isClosed).toBe(true);
  });

  it('should validate educational data structure in MODULE5_TOPICS', () => {
    const requiredTopics = ['sandbox', 'behavior-subject', 'replay-subject', 'async-subject'];
    for (const key of requiredTopics) {
      const t = MODULE5_TOPICS[key];
      expect(t).toBeDefined(`Topic ${key} must exist`);
      expect(t.concept.summary.length).toBeGreaterThan(0);
      expect(t.concept.takeaways.length).toBeGreaterThan(0);
      expect(t.code.code.length).toBeGreaterThan(0);
      expect(t.quiz.length).toBeGreaterThanOrEqual(3);
      for (const q of t.quiz) {
        expect(q.options.map(o => o.id)).toContain(q.correctOptionId);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});
```

---

## 5. Verification Method

### 5.1 Verification Commands
1. **Compilation Check**:
   ```powershell
   npx ng build --configuration development
   ```
   *Expected Result*: Clean build with 0 TypeScript/Angular compiler errors.

2. **Feature 37 E2E Suite Execution**:
   ```powershell
   node tests/e2e/run-all-tests.js --filter="Feature 37"
   ```
   *Expected Result*: 10 / 10 tests passed (100.0%):
   - `F37.1` to `F37.5` in `t1-hoo-subjects-schedulers.js`
   - `F37.B1` to `F37.B5` in `t2-hoo-subjects-schedulers-boundaries.js`

3. **Angular Unit Test Execution**:
   ```powershell
   npm test -- --watch=false --include=src/app/features/module5-subjects/*.spec.ts
   ```
   *Expected Result*: All 11 unit tests pass.

### 5.2 Verification Files to Inspect
- `src/app/features/module5-subjects/module5.data.ts`
- `src/app/features/module5-subjects/subject-sandbox.component.ts`
- `src/app/features/module5-subjects/subject-sandbox.component.html`
- `src/app/features/module5-subjects/subject-sandbox.component.scss`
- `src/app/features/module5-subjects/subject-sandbox.component.spec.ts`
- `src/app/features/module5-subjects/module5.routes.ts`

### 5.3 Invalidation Conditions
- Any TypeScript error during `npx ng build`.
- Any failure in `F37.1 - F37.5` or `F37.B1 - F37.B5`.
- Observer stream logs failing to distinguish synchronous buffer replays (`[REPLAY]`) from live emissions (`[LIVE]`).
- Missing or misaligned route URLs in `module5.routes.ts`.
