import { ComparisonData, QuizQuestion } from '../../core/models';
import { SubjectTopicData, SubjectType } from './module5.models';

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
      },
      {
        id: 'q-subj-4',
        question: 'What fundamental difference distinguishes a Subject from a cold Observable?',
        options: [
          { id: 'a', text: 'A Subject can only emit numbers, while Observables emit any type.' },
          { id: 'b', text: 'A cold Observable creates an independent execution per subscriber, while a Subject multicasts a single execution to all subscribers.' },
          { id: 'c', text: 'A Subject does not support pipe() operators.' },
          { id: 'd', text: 'A cold Observable cannot be unsubscribed from.' }
        ],
        correctOptionId: 'b',
        explanation: 'Cold Observables are unicast: each subscription triggers an independent producer execution. A Subject is multicast: all subscribers share the exact same producer and execution path.'
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
      },
      {
        id: 'q-bs-4',
        question: 'When is calling .getValue() on a BehaviorSubject considered an architectural anti-pattern?',
        options: [
          { id: 'a', text: 'When used inside a unit test assertion.' },
          { id: 'b', text: 'When used in an action handler to read state procedurally instead of piping reactive streams.' },
          { id: 'c', text: 'Whenever the value is a string.' },
          { id: 'd', text: 'Only when the BehaviorSubject has completed.' }
        ],
        correctOptionId: 'b',
        explanation: 'Excessive procedural reading via .getValue() breaks unidirectional reactive flow and can lead to race conditions; streams should be transformed using operators.'
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
      },
      {
        id: 'q-rs-4',
        question: 'What is a key difference between BehaviorSubject and ReplaySubject(1)?',
        options: [
          { id: 'a', text: 'BehaviorSubject cannot emit objects.' },
          { id: 'b', text: 'BehaviorSubject requires a mandatory initial value upon creation, whereas ReplaySubject(1) starts empty.' },
          { id: 'c', text: 'ReplaySubject(1) does not support late subscribers.' },
          { id: 'd', text: 'There is no difference; they are identical.' }
        ],
        correctOptionId: 'b',
        explanation: 'BehaviorSubject requires an initial seed value, ensuring an immediate emission on subscription from moment zero. ReplaySubject(1) starts empty until the first .next() is called.'
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
      },
      {
        id: 'q-as-4',
        question: 'Which JavaScript native construct does an AsyncSubject most closely resemble in semantics?',
        options: [
          { id: 'a', text: 'Generator function' },
          { id: 'b', text: 'Promise' },
          { id: 'c', text: 'EventEmitter' },
          { id: 'd', text: 'WeakMap' }
        ],
        correctOptionId: 'b',
        explanation: 'Like a Promise, an AsyncSubject produces at most one final resolved value upon completion and permanently caches that resolution for future subscribers.'
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
