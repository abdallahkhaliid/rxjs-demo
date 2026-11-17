import { OperatorMetadata, ComparisonData, QuizQuestion, MarbleStream } from '../../core/models';

export interface CreationOperatorConfig {
  id: string;
  routeSlug: string;
  metadata: OperatorMetadata;
  codeSnippet: string;
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  initialMarbles: MarbleStream[];
  defaultParams?: Record<string, any>;
}

export const MODULE2_OPERATORS: Record<string, CreationOperatorConfig> = {
  'of': {
    id: 'of',
    routeSlug: 'of',
    metadata: {
      name: 'of',
      category: 'Creation',
      signature: 'of<T>(...values: T[]): Observable<T>',
      summary: 'Emits a sequence of values provided as arguments, then completes immediately.',
      description: 'Converts arguments into an Observable sequence. Each argument is emitted synchronously in the exact order specified, followed by an immediate complete notification. It does not unpack arrays or await promises.',
      difficulty: 'beginner',
      useCases: [
        'Emitting constant or mock values in unit tests',
        'Supplying default fallback data in reactive pipelines',
        'Returning an Observable from a synchronous function contract'
      ],
      pitfalls: [
        'Passing an array of([1, 2, 3]) emits 1 array item, NOT 3 separate items (use from() to unpack)',
        'Passing a Promise emits the Promise instance itself without awaiting its resolution',
        'All emissions occur synchronously on subscription unless wrapped with an async scheduler'
      ],
      marbleRules: [
        'Each argument corresponds to one marble emission at t=0',
        'A completion mark follows immediately after the final argument'
      ],
      relatedOperators: ['from', 'range', 'EMPTY'],
      docUrl: 'https://rxjs.dev/api/index/function/of'
    },
    codeSnippet: `import { of } from 'rxjs';

// of emits each argument sequentially and synchronously
const values$ = of('Angular', 'RxJS', 'Signals');

values$.subscribe({
  next: value => console.log('Emitted:', value),
  complete: () => console.log('of() sequence completed!')
});`,
    comparison: {
      features: [
        { id: 'unpacking', label: 'Collection Unpacking', description: 'How arrays are handled' },
        { id: 'promises', label: 'Promise Handling', description: 'Awaits resolution or emits instance' },
        { id: 'synchronicity', label: 'Delivery Model', description: 'Sync vs async emissions' },
        { id: 'completion', label: 'Completion Timing', description: 'When stream completes' }
      ],
      items: [
        {
          id: 'of',
          name: 'of(...)',
          badge: 'Varargs Primitive',
          recommendedUse: 'Emitting known arguments, constants, and mock objects directly',
          characteristics: {
            unpacking: { text: 'Emits array as single item', status: 'neutral' },
            promises: { text: 'Emits raw Promise object without awaiting', status: 'neutral' },
            synchronicity: { text: 'Synchronous by default', status: 'positive' },
            completion: { text: 'Completes immediately after last arg', status: 'positive' }
          }
        },
        {
          id: 'from',
          name: 'from(...)',
          badge: 'Unpacking Operator',
          recommendedUse: 'Iterating over arrays, Sets, Maps, and resolving native Promises',
          characteristics: {
            unpacking: { text: 'Unpacks and emits each element sequentially', status: 'positive' },
            promises: { text: 'Awaits Promise resolution and emits resolved value', status: 'positive' },
            synchronicity: { text: 'Sync for arrays; Async for Promises', status: 'positive' },
            completion: { text: 'Completes after all items or resolve', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'of_q1',
        question: 'What is emitted when calling of([1, 2, 3]) in RxJS?',
        options: [
          { id: 'a', text: 'Three numbers: 1, 2, then 3' },
          { id: 'b', text: 'A single Array object [1, 2, 3]' },
          { id: 'c', text: 'An error because arrays are invalid' },
          { id: 'd', text: 'Nothing until take() is added' }
        ],
        correctOptionId: 'b',
        explanation: 'of() emits each argument as-is without unpacking. To emit individual elements of an array, use from([1, 2, 3]).'
      },
      {
        id: 'of_q2',
        question: 'When does of() emit its complete notification?',
        options: [
          { id: 'a', text: 'Immediately after emitting the final argument' },
          { id: 'b', text: 'After a 1000ms delay' },
          { id: 'c', text: 'Never; of() streams are infinite' },
          { id: 'd', text: 'Only when manually unsubscribed' }
        ],
        correctOptionId: 'a',
        explanation: 'of() synchronously emits all provided arguments in order and terminates immediately with a complete notification.'
      },
      {
        id: 'of_q3',
        question: 'What happens when calling of() with no arguments?',
        options: [
          { id: 'a', text: 'Throws a TypeError' },
          { id: 'b', text: 'Completes immediately with zero next emissions (same as EMPTY)' },
          { id: 'c', text: 'Emits undefined' },
          { id: 'd', text: 'Hangs indefinitely' }
        ],
        correctOptionId: 'b',
        explanation: 'Calling of() without arguments returns an Observable that completes immediately without producing any next emissions.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_of',
        label: 'of("Angular", "RxJS", "Signals")',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 400, value: 'Angular', displayLabel: 'Angular', color: 'var(--color-marble-1)' },
          { id: 'm2', timeMs: 800, value: 'RxJS', displayLabel: 'RxJS', color: 'var(--color-marble-2)' },
          { id: 'm3', timeMs: 1200, value: 'Signals', displayLabel: 'Signals', color: 'var(--color-marble-3)' }
        ],
        completedAtMs: 1400
      }
    ]
  },

  'from': {
    id: 'from',
    routeSlug: 'from',
    metadata: {
      name: 'from',
      category: 'Creation',
      signature: 'from<T>(input: ObservableInput<T>): Observable<T>',
      summary: 'Converts an Array, Promise, Iterable, or AsyncIterable into an Observable stream.',
      description: 'Unpacks any valid JavaScript collection or asynchronous container into an Observable. Arrays, Sets, Maps, and strings emit each constituent item; Promises resolve their value and then complete, or forward rejections as stream errors.',
      difficulty: 'beginner',
      useCases: [
        'Transforming browser fetch() or Axios promises into Observables',
        'Flattening arrays into a stream of individual items',
        'Iterating over ES6 Sets, Maps, or Generator outputs reactively'
      ],
      pitfalls: [
        'Cannot cancel in-flight native Promises; unsubscribing stops listener but Promise still executes',
        'Passing non-iterable numbers or booleans throws an unobservable TypeError at runtime',
        'Strings are iterables: from("hello") emits 5 individual characters, not 1 string'
      ],
      marbleRules: [
        'Array elements are emitted consecutively',
        'Promise inputs emit when the promise resolves, then complete immediately',
        'Promise rejections emit an error tick (X)'
      ],
      relatedOperators: ['of', 'defer', 'fromEvent'],
      docUrl: 'https://rxjs.dev/api/index/function/from'
    },
    codeSnippet: `import { from } from 'rxjs';

// Example: Converting a Promise to an Observable
const fetchPromise = new Promise<string>((resolve) => {
  setTimeout(() => resolve('HTTP Response Data (200 OK)'), 1000);
});

const response$ = from(fetchPromise);

response$.subscribe({
  next: data => console.log('Resolved:', data),
  error: err => console.error('Rejected:', err),
  complete: () => console.log('Promise stream completed!')
});`,
    comparison: {
      features: [
        { id: 'inputTypes', label: 'Supported Inputs', description: 'Types accepted' },
        { id: 'asyncSupport', label: 'Promise Integration', description: 'How async promises resolve' },
        { id: 'stringBehavior', label: 'String Input', description: 'Handling of string primitives' }
      ],
      items: [
        {
          id: 'from',
          name: 'from(...)',
          recommendedUse: 'Converting arrays, iterables, and native promises to streams',
          characteristics: {
            inputTypes: { text: 'Array, Promise, Set, Map, Iterable', status: 'positive' },
            asyncSupport: { text: 'Awaits resolution, forwards errors', status: 'positive' },
            stringBehavior: { text: 'Emits character by character', status: 'neutral' }
          }
        },
        {
          id: 'of',
          name: 'of(...)',
          recommendedUse: 'Passing arguments directly without unpacking',
          characteristics: {
            inputTypes: { text: 'Any JavaScript values or objects', status: 'positive' },
            asyncSupport: { text: 'Emits Promise instance immediately without awaiting', status: 'neutral' },
            stringBehavior: { text: 'Emits whole string as single value', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'from_q1',
        question: 'What happens when from("RxJS") is subscribed to?',
        options: [
          { id: 'a', text: 'It emits "RxJS" once as a single string' },
          { id: 'b', text: 'It emits 4 separate characters: "R", "x", "J", "S"' },
          { id: 'c', text: 'It throws a TypeError because strings are not arrays' },
          { id: 'd', text: 'It converts to upper case' }
        ],
        correctOptionId: 'b',
        explanation: 'In JavaScript, strings are Iterables. from() iterates over any iterable, emitting one character per tick.'
      },
      {
        id: 'from_q2',
        question: 'How does from(Promise.reject(new Error("Failed"))) notify its subscriber?',
        options: [
          { id: 'a', text: 'Via the next callback with null' },
          { id: 'b', text: 'Via the error callback with the rejected error' },
          { id: 'c', text: 'By silently completing' },
          { id: 'd', text: 'By throwing an unhandled window error' }
        ],
        correctOptionId: 'b',
        explanation: 'from() converts Promise rejections into Observable error notifications forwarded to the subscriber error handler.'
      },
      {
        id: 'from_q3',
        question: 'Can you cleanly cancel an in-flight fetch Promise by unsubscribing from from(fetch(...))?',
        options: [
          { id: 'a', text: 'Yes, RxJS automatically sends an AbortSignal to fetch' },
          { id: 'b', text: 'No, native Promises are eager and non-cancellable; unsubscribing only detaches the observer' },
          { id: 'c', text: 'Only in Firefox' },
          { id: 'd', text: 'Yes, if wrapped with take(1)' }
        ],
        correctOptionId: 'b',
        explanation: 'Native Promises cannot be cancelled. Unsubscribing from from(promise) prevents the subscriber from receiving the result, but the Promise executor continues in the background.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_from',
        label: 'from(["Alpha", "Beta", "Gamma"])',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 300, value: 'Alpha', displayLabel: 'Alpha', color: 'var(--color-marble-1)' },
          { id: 'm2', timeMs: 600, value: 'Beta', displayLabel: 'Beta', color: 'var(--color-marble-2)' },
          { id: 'm3', timeMs: 900, value: 'Gamma', displayLabel: 'Gamma', color: 'var(--color-marble-3)' }
        ],
        completedAtMs: 1000
      }
    ]
  },

  'fromEvent': {
    id: 'fromEvent',
    routeSlug: 'from-event',
    metadata: {
      name: 'fromEvent',
      category: 'Creation',
      signature: 'fromEvent<T>(target: any, eventName: string, options?: EventListenerOptions): Observable<T>',
      summary: 'Creates an Observable from DOM events, Node EventEmitter events, or jQuery-style events.',
      description: 'Attaches an event listener to the given target upon subscription. Emits the native Event object whenever the target fires the event. Automatically invokes removeEventListener when unsubscribed, preventing memory leaks.',
      difficulty: 'beginner',
      useCases: [
        'Capturing user interactions: clicks, mouse movements, keyboard typing, window resize',
        'Building autocomplete, drag-and-drop, or drawing canvas applications',
        'Coordinating UI event streams with debouncing, throttling, or buffering'
      ],
      pitfalls: [
        'fromEvent NEVER completes on its own; failure to unsubscribe causes lingering event listeners and memory leaks',
        'Target element must exist at subscription time; passing null/undefined throws an immediate error',
        'In SSR / Zoneless Angular, ensure event targets are accessed safely within browser context'
      ],
      marbleRules: [
        'Emits whenever the user triggers an event on the target',
        'Timeline has no completion tick until the subscription is destroyed'
      ],
      relatedOperators: ['interval', 'defer'],
      docUrl: 'https://rxjs.dev/api/index/function/fromEvent'
    },
    codeSnippet: `import { fromEvent } from 'rxjs';
import { map } from 'rxjs/operators';

const button = document.getElementById('demo-target-btn')!;

// fromEvent attaches addEventListener and streams Click events
const clicks$ = fromEvent<MouseEvent>(button, 'click').pipe(
  map(event => ({ x: event.offsetX, y: event.offsetY }))
);

const subscription = clicks$.subscribe({
  next: coords => console.log(\`Clicked at X: \${coords.x}, Y: \${coords.y}\`),
  complete: () => console.log('Never called unless take/unsubscribe applied')
});`,
    comparison: {
      features: [
        { id: 'source', label: 'Event Target Support', description: 'Elements supported' },
        { id: 'teardown', label: 'Listener Cleanup', description: 'How removeEventListener is called' },
        { id: 'cardinality', label: 'Stream Duration', description: 'Finite vs infinite nature' }
      ],
      items: [
        {
          id: 'fromEvent',
          name: 'fromEvent(...)',
          recommendedUse: 'Standard DOM element, document, or window event capture',
          characteristics: {
            source: { text: 'DOM Elements, Document, Window, Node EventEmitter', status: 'positive' },
            teardown: { text: 'Automated removeEventListener on unsubscription', status: 'positive' },
            cardinality: { text: 'Infinite stream (never completes naturally)', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'fromEvent_q1',
        question: 'When does a fromEvent(button, "click") stream complete by default?',
        options: [
          { id: 'a', text: 'After 10 clicks' },
          { id: 'b', text: 'It never completes on its own (infinite stream)' },
          { id: 'c', text: 'When the button is clicked the first time' },
          { id: 'd', text: 'When the browser window loses focus' }
        ],
        correctOptionId: 'b',
        explanation: 'fromEvent streams are infinite. They never complete unless capped by operators like take(), takeUntil(), or explicitly unsubscribed.'
      },
      {
        id: 'fromEvent_q2',
        question: 'What occurs behind the scenes when a fromEvent subscription is unsubscribed?',
        options: [
          { id: 'a', text: 'The target DOM element is removed from the page' },
          { id: 'b', text: 'removeEventListener is automatically invoked, preventing memory leaks' },
          { id: 'c', text: 'An alert dialog is triggered' },
          { id: 'd', text: 'All mouse events are disabled' }
        ],
        correctOptionId: 'b',
        explanation: 'The teardown logic of fromEvent automatically removes the event listener from the target, ensuring no memory leaks occur.'
      },
      {
        id: 'fromEvent_q3',
        question: 'What error occurs if the first argument to fromEvent() is null or undefined?',
        options: [
          { id: 'a', text: 'Returns EMPTY silently' },
          { id: 'b', text: 'Throws a TypeError: target must have addEventListener or on' },
          { id: 'c', text: 'Logs a warning' },
          { id: 'd', text: 'Waits for element to appear' }
        ],
        correctOptionId: 'b',
        explanation: 'fromEvent requires an event target with addEventListener or on methods. Passing null or undefined throws a runtime TypeError.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_fromEvent',
        label: 'fromEvent(button, "click")',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 800, value: 'Click #1', displayLabel: 'Click 1', color: 'var(--color-marble-1)' },
          { id: 'm2', timeMs: 2200, value: 'Click #2', displayLabel: 'Click 2', color: 'var(--color-marble-2)' }
        ]
      }
    ]
  },

  'interval': {
    id: 'interval',
    routeSlug: 'interval',
    metadata: {
      name: 'interval',
      category: 'Creation',
      signature: 'interval(period: number = 0, scheduler?: SchedulerLike): Observable<number>',
      summary: 'Emits sequential ascending integers (0, 1, 2, 3...) spaced by a constant time interval.',
      description: 'Produces an infinite Observable sequence of numbers starting from 0. Waits for the first period interval before emitting 0, then continues ticking every period milliseconds. Uses asyncScheduler by default.',
      difficulty: 'beginner',
      useCases: [
        'Periodic heartbeat or telemetry polling against an API',
        'Elapsed time tickers, stopwatches, countdown timers',
        'Driving automated slide carousels or interval animation frames'
      ],
      pitfalls: [
        'First emission (0) is NOT immediate — it waits one full period before firing',
        'Infinite stream: will run forever and leak memory if not paired with take(), takeUntil(), or explicit unsubscribe',
        'Period values <= 0 run on browser clamp (minimum ~4ms) and can overwhelm the event loop'
      ],
      marbleRules: [
        'Silence between t=0 and t=period',
        'Regularly spaced marbles with values 0, 1, 2, 3...',
        'No completion bar (infinite stream)'
      ],
      relatedOperators: ['timer', 'range', 'defer'],
      docUrl: 'https://rxjs.dev/api/index/function/interval'
    },
    codeSnippet: `import { interval } from 'rxjs';
import { take } from 'rxjs/operators';

// Emits 0, 1, 2, 3... every 1000ms (first tick at t=1000ms)
const ticker$ = interval(1000).pipe(
  take(4) // Safeguard against unbounded execution
);

ticker$.subscribe({
  next: tick => console.log('Interval tick:', tick),
  complete: () => console.log('Interval sequence completed!')
});`,
    comparison: {
      features: [
        { id: 'initialDelay', label: 'Initial Emission Timing', description: 'When first emission 0 occurs' },
        { id: 'cardinality', label: 'Duration & Completion', description: 'Can it complete naturally' },
        { id: 'recurring', label: 'Recurring Pulses', description: 'Periodic ticking capability' }
      ],
      items: [
        {
          id: 'interval',
          name: 'interval(period)',
          recommendedUse: 'Basic periodic pulses where initial delay equals the period',
          characteristics: {
            initialDelay: { text: 'Waits 1 full period before 0', status: 'neutral' },
            cardinality: { text: 'Infinite stream (never completes on its own)', status: 'neutral' },
            recurring: { text: 'Ticks continuously every period ms', status: 'positive' }
          }
        },
        {
          id: 'timer',
          name: 'timer(dueTime, period)',
          badge: 'Flexible Timer',
          recommendedUse: 'Immediate-start tickers or custom initial delays',
          characteristics: {
            initialDelay: { text: 'Configurable (e.g. 0ms for immediate tick)', status: 'positive' },
            cardinality: { text: 'Single-shot if 1 arg; Infinite if 2 args', status: 'positive' },
            recurring: { text: 'Optional recurring period', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'interval_q1',
        question: 'When is the first value (0) emitted by interval(1000)?',
        options: [
          { id: 'a', text: 'Immediately at t=0ms' },
          { id: 'b', text: 'After 1000ms' },
          { id: 'c', text: 'After 500ms' },
          { id: 'd', text: 'When the component renders' }
        ],
        correctOptionId: 'b',
        explanation: 'interval(period) waits for one full period before producing its first emission (0). To emit immediately at t=0ms, use timer(0, period).'
      },
      {
        id: 'interval_q2',
        question: 'What is the most important safeguard when using interval() in an Angular component?',
        options: [
          { id: 'a', text: 'Using async pipe or takeUntilDestroyed() to prevent infinite memory leaks' },
          { id: 'b', text: 'Wrapping it in an async/await function' },
          { id: 'c', text: 'Limiting it to 10ms' },
          { id: 'd', text: 'Setting period to a negative number' }
        ],
        correctOptionId: 'a',
        explanation: 'Because interval produces an infinite stream, failing to unsubscribe on component destruction keeps the subscription active forever, leading to memory leaks.'
      },
      {
        id: 'interval_q3',
        question: 'What happens if you pass a negative period like interval(-5)?',
        options: [
          { id: 'a', text: 'It counts backwards' },
          { id: 'b', text: 'It clamps to browser minimum timeout (0-1ms) and runs as fast as possible' },
          { id: 'c', text: 'Throws an InvalidArgumentError' },
          { id: 'd', text: 'Returns EMPTY' }
        ],
        correctOptionId: 'b',
        explanation: 'Non-positive periods are passed to setTimeout/setInterval, which clamps them to 0 or minimum interval and rapidly emits numbers.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_interval',
        label: 'interval(1000).pipe(take(4))',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 1000, value: 0, displayLabel: '0', color: 'var(--color-marble-1)' },
          { id: 'm2', timeMs: 2000, value: 1, displayLabel: '1', color: 'var(--color-marble-2)' },
          { id: 'm3', timeMs: 3000, value: 2, displayLabel: '2', color: 'var(--color-marble-3)' },
          { id: 'm4', timeMs: 4000, value: 3, displayLabel: '3', color: 'var(--color-marble-4)' }
        ],
        completedAtMs: 4000
      }
    ]
  },

  'timer': {
    id: 'timer',
    routeSlug: 'timer',
    metadata: {
      name: 'timer',
      category: 'Creation',
      signature: 'timer(dueTime: number | Date, periodOrScheduler?: number | SchedulerLike): Observable<number>',
      summary: 'Waits for an initial due time, emits 0, then optionally behaves as a periodic interval.',
      description: 'Versatile timer operator. When called with one argument (dueTime), it emits 0 after the delay and immediately completes (single-shot). When called with a second argument (period), it emits 0 at dueTime and continues emitting incrementing numbers every period ms indefinitely.',
      difficulty: 'beginner',
      useCases: [
        'One-shot delayed execution (e.g. auto-dismiss toast alerts after 3000ms)',
        'Immediate-start intervals: timer(0, 1000) emits 0 right now and ticks every 1s',
        'Delayed-start polling: wait 5s for page to settle, then poll every 2s',
        'Exact clock time alarms: timer(new Date("2026-12-31T23:59:59"))'
      ],
      pitfalls: [
        'Calling timer(1000) completes immediately after 0; developers expecting recurring ticks must provide the period argument timer(1000, 1000)',
        'Negative period numbers cause immediate completion after 0',
        'Passing a past Date fires emission 0 on the very next scheduler tick'
      ],
      marbleRules: [
        'Single-shot: silence until dueTime, emission 0, then immediate complete (|)',
        'Recurring: emission 0 at dueTime, followed by 1, 2, 3... spaced by period'
      ],
      relatedOperators: ['interval', 'delay', 'defer'],
      docUrl: 'https://rxjs.dev/api/index/function/timer'
    },
    codeSnippet: `import { timer } from 'rxjs';
import { take } from 'rxjs/operators';

// Single-shot: emits 0 after 1200ms and completes immediately
const singleShot$ = timer(1200);

singleShot$.subscribe({
  next: val => console.log('Single-shot emitted:', val),
  complete: () => console.log('Single-shot completed immediately!')
});

// Recurring: starts immediately (0ms), then ticks every 800ms
const immediateInterval$ = timer(0, 800).pipe(take(4));
immediateInterval$.subscribe(n => console.log('Recurring tick:', n));`,
    comparison: {
      features: [
        { id: 'singleShot', label: 'Single-Shot Mode', description: 'Completing after 1 emission' },
        { id: 'recurring', label: 'Recurring Interval Mode', description: 'Periodic stream mode' },
        { id: 'dateTarget', label: 'Absolute Date Target', description: 'Support for Date timestamps' }
      ],
      items: [
        {
          id: 'timer',
          name: 'timer(due, period?)',
          recommendedUse: 'Delayed execution, auto-dismissals, immediate-start intervals',
          characteristics: {
            singleShot: { text: 'Yes: timer(delay) completes after 0', status: 'positive' },
            recurring: { text: 'Yes: timer(delay, period) ticks periodically', status: 'positive' },
            dateTarget: { text: 'Yes: accepts Date objects', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'timer_q1',
        question: 'What does timer(2000) do when called with only one argument?',
        options: [
          { id: 'a', text: 'Waits 2000ms, emits 0, and immediately completes' },
          { id: 'b', text: 'Emits 0, 1, 2... every 2000ms forever' },
          { id: 'c', text: 'Waits 2000ms, emits 2000, and stays open' },
          { id: 'd', text: 'Throws an error because period is missing' }
        ],
        correctOptionId: 'a',
        explanation: 'With a single argument, timer(dueTime) is single-shot: it waits dueTime, emits 0, and immediately sends complete.'
      },
      {
        id: 'timer_q2',
        question: 'How do you create an interval that emits immediately at t=0ms and then every 1 second?',
        options: [
          { id: 'a', text: 'interval(1000)' },
          { id: 'b', text: 'timer(0, 1000)' },
          { id: 'c', text: 'timer(1000, 0)' },
          { id: 'd', text: 'range(0, 1000)' }
        ],
        correctOptionId: 'b',
        explanation: 'timer(0, 1000) specifies dueTime=0 (fires on next tick immediately) and period=1000 (repeats every 1s).'
      },
      {
        id: 'timer_q3',
        question: 'What happens if a past Date is passed to timer(pastDate)?',
        options: [
          { id: 'a', text: 'Throws an InvalidDateError' },
          { id: 'b', text: 'Emits 0 on the very next scheduler tick and completes' },
          { id: 'c', text: 'Hangs forever' },
          { id: 'd', text: 'Returns EMPTY' }
        ],
        correctOptionId: 'b',
        explanation: 'If the target Date is in the past, timer treats the due time as 0, emitting 0 on the next tick.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_timer',
        label: 'timer(1200)',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 1200, value: 0, displayLabel: '0', color: 'var(--color-marble-1)' }
        ],
        completedAtMs: 1200
      }
    ]
  },

  'range': {
    id: 'range',
    routeSlug: 'range',
    metadata: {
      name: 'range',
      category: 'Creation',
      signature: 'range(start: number, count?: number, scheduler?: SchedulerLike): Observable<number>',
      summary: 'Emits a sequential range of integers starting from start up to count total items, then completes.',
      description: 'Emits count consecutive integers beginning with start. If count is omitted, start is treated as 0 and the argument is used as count (e.g. range(5) emits 0 to 4). If count is 0 or negative, it immediately completes without emitting any numbers (returns EMPTY).',
      difficulty: 'beginner',
      useCases: [
        'Iterating over page numbers for paginated API requests: range(1, totalPages)',
        'Generating sequential ID or index ranges for testing',
        'Batch job processing or parallel request generation'
      ],
      pitfalls: [
        'Second parameter is COUNT (number of items), NOT end value: range(1, 5) emits 1, 2, 3, 4, 5 (5 items), not ending at 4',
        'Calling range(5) with 1 argument starts at 0 (emits 0, 1, 2, 3, 4), NOT 1 to 5',
        'Negative count does not count backwards; it silently returns EMPTY'
      ],
      marbleRules: [
        'Emits start, start+1, ..., start+count-1',
        'Completes immediately after emitting the count-th number'
      ],
      relatedOperators: ['generate', 'interval', 'of'],
      docUrl: 'https://rxjs.dev/api/index/function/range'
    },
    codeSnippet: `import { range } from 'rxjs';

// Emits 5 sequential integers starting at 1: 1, 2, 3, 4, 5
const numbers$ = range(1, 5);

numbers$.subscribe({
  next: n => console.log('Range value:', n),
  complete: () => console.log('Range completed!')
});`,
    comparison: {
      features: [
        { id: 'args', label: 'Arguments Meaning', description: 'How parameters are interpreted' },
        { id: 'progression', label: 'Progression Type', description: 'Step arithmetic' },
        { id: 'zeroCount', label: 'Count <= 0 Handling', description: 'Edge case behavior' }
      ],
      items: [
        {
          id: 'range',
          name: 'range(start, count)',
          recommendedUse: 'Simple linear ascending integer series',
          characteristics: {
            args: { text: 'start integer, count total items', status: 'neutral' },
            progression: { text: 'Strict linear +1 step increments', status: 'neutral' },
            zeroCount: { text: 'Returns EMPTY immediately', status: 'positive' }
          }
        },
        {
          id: 'generate',
          name: 'generate(options)',
          badge: 'Reactive For-Loop',
          recommendedUse: 'Arbitrary loop logic (powers of 2, decrements, custom math)',
          characteristics: {
            args: { text: 'initialState, condition, iterate, resultSelector', status: 'positive' },
            progression: { text: 'Arbitrary custom mutations', status: 'positive' },
            zeroCount: { text: 'Stops when condition evaluates to false', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'range_q1',
        question: 'What is emitted by range(1, 5)?',
        options: [
          { id: 'a', text: '1, 2, 3, 4' },
          { id: 'b', text: '1, 2, 3, 4, 5 (5 items total)' },
          { id: 'c', text: '5 numbers starting from 0' },
          { id: 'd', text: 'An array of numbers' }
        ],
        correctOptionId: 'b',
        explanation: 'In range(start, count), the second parameter is the COUNT of numbers to emit, so range(1, 5) emits 1, 2, 3, 4, 5.'
      },
      {
        id: 'range_q2',
        question: 'What happens when calling range(5) with a single argument?',
        options: [
          { id: 'a', text: 'Emits 1, 2, 3, 4, 5' },
          { id: 'b', text: 'Emits 0, 1, 2, 3, 4 (start defaults to 0)' },
          { id: 'c', text: 'Throws an error' },
          { id: 'd', text: 'Emits 5' }
        ],
        correctOptionId: 'b',
        explanation: 'When count is omitted in range(N), RxJS treats start as 0 and the argument as count, emitting 0 to N-1.'
      },
      {
        id: 'range_q3',
        question: 'What is the output of range(10, -3)?',
        options: [
          { id: 'a', text: 'Counts backwards: 10, 9, 8' },
          { id: 'b', text: 'Completes immediately with 0 emissions (returns EMPTY)' },
          { id: 'c', text: 'Throws a RangeError' },
          { id: 'd', text: 'Emits -3' }
        ],
        correctOptionId: 'b',
        explanation: 'If count is <= 0, range() returns EMPTY immediately without producing any emissions.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_range',
        label: 'range(1, 5)',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 200, value: 1, displayLabel: '1', color: 'var(--color-marble-1)' },
          { id: 'm2', timeMs: 400, value: 2, displayLabel: '2', color: 'var(--color-marble-2)' },
          { id: 'm3', timeMs: 600, value: 3, displayLabel: '3', color: 'var(--color-marble-3)' },
          { id: 'm4', timeMs: 800, value: 4, displayLabel: '4', color: 'var(--color-marble-4)' },
          { id: 'm5', timeMs: 1000, value: 5, displayLabel: '5', color: 'var(--color-marble-5)' }
        ],
        completedAtMs: 1100
      }
    ]
  },

  'throwError': {
    id: 'throwError',
    routeSlug: 'throw-error',
    metadata: {
      name: 'throwError',
      category: 'Creation',
      signature: 'throwError(errorFactory: () => any): Observable<never>',
      summary: 'Creates an Observable that immediately terminates with an error created by an error factory.',
      description: 'Upon subscription, invokes the error factory to produce an error object and notifies the subscriber via the error callback. Never emits next values and never emits complete. Using a factory function ensures a fresh error and accurate stack trace for each subscriber.',
      difficulty: 'intermediate',
      useCases: [
        'Simulating HTTP error responses or server failures in mock testing',
        'Conditionally failing an inner stream in flattening operators (switchMap, concatMap)',
        'Testing resilience, catchError fallback, and retry strategies'
      ],
      pitfalls: [
        'Passing a plain Error instance throwError(new Error()) is deprecated in RxJS 7; always pass a factory () => new Error()',
        'Errors propagate synchronously on subscription by default, aborting subsequent operators unless caught by catchError()',
        'Never emits a complete notification; complete callbacks will not fire'
      ],
      marbleRules: [
        'No next emission circles on the timeline',
        'Terminates at subscription time with an error symbol (red X)'
      ],
      relatedOperators: ['EMPTY', 'defer'],
      docUrl: 'https://rxjs.dev/api/index/function/throwError'
    },
    codeSnippet: `import { throwError, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

// Recommended factory function captures accurate stack trace
const failing$ = throwError(() => new Error('Http 503: Service Unavailable'));

failing$.pipe(
  catchError(err => {
    console.warn('Caught and recovered from:', err.message);
    return of('Fallback Cache Data');
  })
).subscribe({
  next: data => console.log('Received:', data),
  error: err => console.error('Uncaught stream error:', err),
  complete: () => console.log('Stream finished gracefully!')
});`,
    comparison: {
      features: [
        { id: 'notifications', label: 'Emitted Notifications', description: 'Next/complete/error channels' },
        { id: 'factoryPattern', label: 'Factory Evaluation', description: 'How Error instance is created' },
        { id: 'recovery', label: 'Error Recovery', description: 'Can it be rescued' }
      ],
      items: [
        {
          id: 'throwError',
          name: 'throwError(() => err)',
          recommendedUse: 'Signaling failures and testing retry / catchError pipelines',
          characteristics: {
            notifications: { text: 'Only error() notification; zero next, zero complete', status: 'neutral' },
            factoryPattern: { text: 'Fresh error instance created per subscriber', status: 'positive' },
            recovery: { text: 'Recoverable via catchError() into alternative stream', status: 'positive' }
          }
        },
        {
          id: 'EMPTY',
          name: 'EMPTY',
          recommendedUse: 'Graceful silent completion without errors',
          characteristics: {
            notifications: { text: 'Only complete() notification; zero next, zero error', status: 'positive' },
            factoryPattern: { text: 'Constant singleton', status: 'positive' },
            recovery: { text: 'Not applicable (no error emitted)', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'throwError_q1',
        question: 'Why does RxJS 7 deprecate passing a plain Error object throwError(new Error()) in favor of a factory function?',
        options: [
          { id: 'a', text: 'Error factories reduce bundle size by 50%' },
          { id: 'b', text: 'Factory functions ensure a fresh Error instance and accurate stack trace are captured for every new subscriber' },
          { id: 'c', text: 'Plain errors cannot be thrown in TypeScript' },
          { id: 'd', text: 'It was a typo in the documentation' }
        ],
        correctOptionId: 'b',
        explanation: 'Creating the Error inside a factory function () => new Error(...) ensures each subscriber gets a fresh error object with an accurate stack trace reflecting the moment of subscription.'
      },
      {
        id: 'throwError_q2',
        question: 'Does throwError() ever invoke the subscriber complete() callback?',
        options: [
          { id: 'a', text: 'Yes, right after error()' },
          { id: 'b', text: 'No, error and complete are mutually exclusive terminal notifications' },
          { id: 'c', text: 'Only when retry() is used' },
          { id: 'd', text: 'Yes, if no error handler is provided' }
        ],
        correctOptionId: 'b',
        explanation: 'Under the Observable Notification Contract, error and complete are mutually exclusive terminal events. throwError only terminates via error.'
      },
      {
        id: 'throwError_q3',
        question: 'How can downstream consumers recover from a throwError() stream without crashing?',
        options: [
          { id: 'a', text: 'By using catchError() to return a fallback Observable' },
          { id: 'b', text: 'By wrapping the subscriber in try/catch' },
          { id: 'c', text: 'Errors cannot be recovered from in RxJS' },
          { id: 'd', text: 'By calling .unsubscribe()' }
        ],
        correctOptionId: 'a',
        explanation: 'The catchError operator intercepts upstream error notifications and replaces the errored stream with an alternative fallback Observable (e.g. of(fallback)).'
      }
    ],
    initialMarbles: [
      {
        id: 'out_throwError',
        label: 'throwError(() => new Error(...))',
        color: 'var(--color-danger)',
        emissions: [],
        errorAtMs: 300
      }
    ]
  },

  'defer': {
    id: 'defer',
    routeSlug: 'defer',
    metadata: {
      name: 'defer',
      category: 'Creation',
      signature: 'defer<R extends ObservableInput<any>>(observableFactory: () => R): Observable<ObservedValueOf<R>>',
      summary: 'Creates an Observable lazily by calling a factory function on each new subscription.',
      description: 'Does not instantiate the underlying Observable until an Observer subscribes. Every subscriber receives a freshly evaluated Observable produced by the factory. Essential for capturing dynamic timestamps, deferred Promise calls, and per-subscriber state.',
      difficulty: 'intermediate',
      useCases: [
        'Deferring Promise creation (e.g. fetch()) so the network call triggers only on subscription, not declaration',
        'Generating dynamic timestamps or UUIDs that must reflect the exact moment of subscription',
        'Choosing between different Observable sources at runtime per subscriber'
      ],
      pitfalls: [
        'Creating of(new Date()) without defer captures the date ONCE at declaration time, producing stale data for later subscribers',
        'If the factory function throws synchronously, defer catches it and forwards it as an error notification to the observer',
        'If the factory returns null/undefined, defer safely emits EMPTY instead of failing'
      ],
      marbleRules: [
        'Factory executes upon subscription',
        'Multiple subscriber timelines can exhibit different marble values or timing'
      ],
      relatedOperators: ['iif', 'from', 'of'],
      docUrl: 'https://rxjs.dev/api/index/function/defer'
    },
    codeSnippet: `import { defer, of } from 'rxjs';

// Factory executes FRESH on every subscription
const dynamicTimestamp$ = defer(() => {
  const stamp = new Date().toLocaleTimeString();
  return of(\`Subscription timestamp: \${stamp}\`);
});

// Subscriber 1
dynamicTimestamp$.subscribe(val => console.log('Sub 1:', val));

// Subscriber 2 (2 seconds later receives a new timestamp!)
setTimeout(() => {
  dynamicTimestamp$.subscribe(val => console.log('Sub 2:', val));
}, 2000);`,
    comparison: {
      features: [
        { id: 'factoryTiming', label: 'Factory Evaluation', description: 'When producer code executes' },
        { id: 'freshState', label: 'Per-Subscriber Freshness', description: 'Fresh state per subscriber' },
        { id: 'exceptionSafety', label: 'Factory Throw Handling', description: 'How synchronous throws are handled' }
      ],
      items: [
        {
          id: 'defer',
          name: 'defer(() => stream$)',
          recommendedUse: 'Dynamic timestamps, deferred Promise/fetch creation, fresh state per subscriber',
          characteristics: {
            factoryTiming: { text: 'Lazy: runs afresh on EVERY subscription', status: 'positive' },
            freshState: { text: '100% isolated fresh state per subscriber', status: 'positive' },
            exceptionSafety: { text: 'Catches sync throw and routes to error channel', status: 'positive' }
          }
        },
        {
          id: 'of',
          name: 'of(value)',
          recommendedUse: 'Static immutable values known at declaration time',
          characteristics: {
            factoryTiming: { text: 'Eager: evaluates value once on declaration', status: 'neutral' },
            freshState: { text: 'Shares the same captured value across all subscribers', status: 'neutral' },
            exceptionSafety: { text: 'Throws synchronously if argument expression fails', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'defer_q1',
        question: 'Why is defer(() => of(new Date())) superior to of(new Date()) for recording subscription time?',
        options: [
          { id: 'a', text: 'of(new Date()) captures the timestamp once at file load time, while defer evaluates new Date() afresh on each subscribe' },
          { id: 'b', text: 'defer() runs on a web worker' },
          { id: 'c', text: 'Date objects cannot be passed to of()' },
          { id: 'd', text: 'defer() formats the date to ISO automatically' }
        ],
        correctOptionId: 'a',
        explanation: 'of(new Date()) evaluates new Date() immediately when the line is read. defer(() => of(new Date())) waits until an observer subscribes before evaluating the date.'
      },
      {
        id: 'defer_q2',
        question: 'What happens if the factory function inside defer(() => ...) throws an uncaught JavaScript error?',
        options: [
          { id: 'a', text: 'Crashes the application unhandled' },
          { id: 'b', text: 'defer safely catches the error and notifies the subscriber via the error callback' },
          { id: 'c', text: 'Swallows the error and emits EMPTY' },
          { id: 'd', text: 'Retries 3 times' }
        ],
        correctOptionId: 'b',
        explanation: 'defer wraps the factory call in a try/catch. If the factory throws, defer routes the caught error to the subscriber error notification.'
      },
      {
        id: 'defer_q3',
        question: 'How does defer() help with Promise-based APIs like window.fetch()?',
        options: [
          { id: 'a', text: 'It converts HTTP headers automatically' },
          { id: 'b', text: 'It prevents the fetch network request from starting until someone actually subscribes to the stream' },
          { id: 'c', text: 'It enables HTTP caching' },
          { id: 'd', text: 'It increases network speed' }
        ],
        correctOptionId: 'b',
        explanation: 'Promises execute immediately upon creation. By wrapping fetch inside defer(() => from(fetch(...))), the fetch call is delayed until an observer subscribes.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_defer',
        label: 'defer(() => of("Fresh Token #" + rand))',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 400, value: 'Token #8192', displayLabel: '#8192', color: 'var(--color-marble-1)' }
        ],
        completedAtMs: 600
      }
    ]
  },

  'empty': {
    id: 'empty',
    routeSlug: 'empty',
    metadata: {
      name: 'EMPTY',
      category: 'Creation',
      signature: 'const EMPTY: Observable<never>',
      summary: 'A constant Observable that emits no items and immediately emits a complete notification.',
      description: 'Synchronous singleton Observable representing an already-completed empty stream. Does not emit any next values and never errors. Commonly used as a fallback return value to silence streams or filter out emissions.',
      difficulty: 'beginner',
      useCases: [
        'Swallowing errors silently in catchError(() => EMPTY)',
        'Filtering out unwanted items in mergeMap/switchMap by mapping to EMPTY',
        'Default branch in conditional streams: iif(() => allowed, data$, EMPTY)'
      ],
      pitfalls: [
        'Do not call empty() as a function; the function is deprecated in favor of the constant EMPTY',
        'In forkJoin([a$, EMPTY]), forkJoin will complete immediately with NO values because EMPTY never emitted an item',
        'Subscribers expecting at least one value will stall unless paired with defaultIfEmpty()'
      ],
      marbleRules: [
        'No emission marbles',
        'Completes immediately at t=0 with a vertical completion bar (|)'
      ],
      relatedOperators: ['NEVER', 'of', 'throwError'],
      docUrl: 'https://rxjs.dev/api/index/const/EMPTY'
    },
    codeSnippet: `import { EMPTY } from 'rxjs';
import { defaultIfEmpty } from 'rxjs/operators';

// EMPTY completes immediately with zero next values
EMPTY.subscribe({
  next: v => console.log('Never called:', v),
  complete: () => console.log('EMPTY completed synchronously!')
});

// Using defaultIfEmpty to provide a fallback value
EMPTY.pipe(
  defaultIfEmpty('Default value when stream is empty')
).subscribe(val => console.log('Fallback received:', val));`,
    comparison: {
      features: [
        { id: 'emissions', label: 'Next Values', description: 'Values emitted' },
        { id: 'terminal', label: 'Terminal State', description: 'Complete or Error' },
        { id: 'timing', label: 'Completion Timing', description: 'When complete fires' }
      ],
      items: [
        {
          id: 'EMPTY',
          name: 'EMPTY',
          badge: 'Silent Complete',
          recommendedUse: 'Filtering items in switchMap or swallowing errors in catchError',
          characteristics: {
            emissions: { text: '0 values (no next notifications)', status: 'neutral' },
            terminal: { text: 'Emits complete()', status: 'positive' },
            timing: { text: 'Synchronously at t=0ms', status: 'positive' }
          }
        },
        {
          id: 'NEVER',
          name: 'NEVER',
          badge: 'Infinite Silence',
          recommendedUse: 'Testing timeout scenarios and keeping streams open',
          characteristics: {
            emissions: { text: '0 values (no next notifications)', status: 'neutral' },
            terminal: { text: 'NEVER completes and NEVER errors', status: 'neutral' },
            timing: { text: 'Never terminates (infinite)', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'empty_q1',
        question: 'What notifications are emitted when subscribing to EMPTY?',
        options: [
          { id: 'a', text: 'Emits undefined, then complete' },
          { id: 'b', text: 'Emits complete synchronously; zero next emissions' },
          { id: 'c', text: 'Emits null' },
          { id: 'd', text: 'Throws an EmptyError' }
        ],
        correctOptionId: 'b',
        explanation: 'EMPTY emits zero next notifications and delivers a synchronous complete notification immediately upon subscription.'
      },
      {
        id: 'empty_q2',
        question: 'What happens if forkJoin([of(1), EMPTY]) is subscribed to?',
        options: [
          { id: 'a', text: 'Emits [1, undefined]' },
          { id: 'b', text: 'Completes immediately with NO emissions because forkJoin requires every input stream to emit at least one value' },
          { id: 'c', text: 'Emits [1]' },
          { id: 'd', text: 'Throws an error' }
        ],
        correctOptionId: 'b',
        explanation: 'forkJoin waits for all input streams to emit at least one value before completing. Since EMPTY completes with zero values, forkJoin completes immediately without emitting any result.'
      },
      {
        id: 'empty_q3',
        question: 'Why is the function call empty() deprecated in RxJS?',
        options: [
          { id: 'a', text: 'Because EMPTY is a static constant that needs no arguments or instantiation overhead' },
          { id: 'b', text: 'Because EMPTY was removed from JavaScript' },
          { id: 'c', text: 'To force developers to use null' },
          { id: 'd', text: 'It is not deprecated' }
        ],
        correctOptionId: 'a',
        explanation: 'The function call empty() is deprecated in favor of the singleton constant EMPTY, which avoids creating unnecessary objects.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_empty',
        label: 'EMPTY',
        color: 'var(--color-primary-500)',
        emissions: [],
        completedAtMs: 100
      }
    ]
  },

  'never': {
    id: 'never',
    routeSlug: 'never',
    metadata: {
      name: 'NEVER',
      category: 'Creation',
      signature: 'const NEVER: Observable<never>',
      summary: 'A constant Observable that emits no items, never errors, and never completes.',
      description: 'Represents infinite silence. Keeps the subscription open indefinitely without invoking next, error, or complete. Useful in testing timeout scenarios, preventing stream completion, and keeping long-lived observables active.',
      difficulty: 'beginner',
      useCases: [
        'Testing timeout scenarios: NEVER.pipe(timeout({ each: 2000 }))',
        'Preventing automatic disposal in combinators (e.g. concat(stream$, NEVER))',
        'Simulating an indefinite waiting or pending state in reactive UIs'
      ],
      pitfalls: [
        'Never disposes automatically; failure to unsubscribe causes permanent memory leaks',
        'Do not use the deprecated function never(); use the uppercase constant NEVER',
        'Any operator waiting for stream completion (e.g. toArray, forkJoin, last) will hang forever'
      ],
      marbleRules: [
        'Continuous infinite timeline line',
        'No marbles, no vertical complete tick, no error mark'
      ],
      relatedOperators: ['EMPTY', 'interval'],
      docUrl: 'https://rxjs.dev/api/index/const/NEVER'
    },
    codeSnippet: `import { NEVER } from 'rxjs';
import { timeout } from 'rxjs/operators';

// Infinite silence: no emissions, never completes
const silence$ = NEVER;

const sub = silence$.subscribe({
  next: v => console.log('Never called'),
  complete: () => console.log('Never called')
});

// Must be explicitly unsubscribed to prevent leaks
setTimeout(() => {
  sub.unsubscribe();
  console.log('Manually unsubscribed from NEVER');
}, 3000);`,
    comparison: {
      features: [
        { id: 'emissions', label: 'Next Emissions', description: 'Values delivered' },
        { id: 'completion', label: 'Completion', description: 'Will it complete' },
        { id: 'leakRisk', label: 'Memory Leak Risk', description: 'Requires manual teardown' }
      ],
      items: [
        {
          id: 'NEVER',
          name: 'NEVER',
          recommendedUse: 'Simulating indefinite waiting or testing timeout operators',
          characteristics: {
            emissions: { text: '0 values', status: 'neutral' },
            completion: { text: 'Never completes, never errors', status: 'neutral' },
            leakRisk: { text: 'High: MUST be unsubscribed manually', status: 'negative' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'never_q1',
        question: 'What happens when subscribing to NEVER?',
        options: [
          { id: 'a', text: 'It emits undefined' },
          { id: 'b', text: 'Nothing is emitted, and neither complete nor error are ever called' },
          { id: 'c', text: 'It completes after 1000ms' },
          { id: 'd', text: 'It throws a NeverError' }
        ],
        correctOptionId: 'b',
        explanation: 'NEVER represents infinite silence. It never emits next, complete, or error notifications.'
      },
      {
        id: 'never_q2',
        question: 'What happens to NEVER.pipe(timeout({ each: 2000 }))?',
        options: [
          { id: 'a', text: 'Completes successfully after 2000ms' },
          { id: 'b', text: 'Throws a TimeoutError after 2000ms because no value was emitted' },
          { id: 'c', text: 'Hangs forever' },
          { id: 'd', text: 'Emits 0' }
        ],
        correctOptionId: 'b',
        explanation: 'Because NEVER never emits, the timeout operator detects that the 2000ms deadline passed without an emission and dispatches a TimeoutError.'
      },
      {
        id: 'never_q3',
        question: 'Why does NEVER require careful unsubscription?',
        options: [
          { id: 'a', text: 'Because it keeps references active in memory forever without completing' },
          { id: 'b', text: 'Because it crashes the browser if open for 10 seconds' },
          { id: 'c', text: 'It does not require unsubscription' },
          { id: 'd', text: 'Because it mutates global state' }
        ],
        correctOptionId: 'a',
        explanation: 'Because NEVER never terminates on its own, any subscription that is not manually cancelled via unsubscribe() or takeUntil() will leak memory permanently.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_never',
        label: 'NEVER (Infinite Silence)',
        color: 'var(--color-text-muted)',
        emissions: []
      }
    ]
  },

  'generate': {
    id: 'generate',
    routeSlug: 'generate',
    metadata: {
      name: 'generate',
      category: 'Creation',
      signature: 'generate<T, S>(options: GenerateOptions<T, S>): Observable<T>',
      summary: 'Generates an Observable by running a state-driven loop (reactive for-loop).',
      description: 'Emulates a traditional for (let state = init; condition(state); state = iterate(state)) loop. Evaluates condition before each emission; while true, emits resultSelector(state) and updates state with iterate(). When condition is false, it completes.',
      difficulty: 'intermediate',
      useCases: [
        'Generating non-linear sequences: powers of 2, Fibonacci numbers, custom increments',
        'Mathematical progressions and coordinate grids',
        'Replacing imperative while/for loops with declarative Observable sequences'
      ],
      pitfalls: [
        'Omitting the condition property in options causes an infinite loop that freezes the browser UI thread!',
        'Multi-parameter signature generate(initial, cond, iter, res) is deprecated in v7; use the options object syntax',
        'Keep computations inside iterate and resultSelector lightweight to avoid frame drops'
      ],
      marbleRules: [
        'Emits values sequentially for each iteration satisfying condition',
        'Completes as soon as condition evaluates to false'
      ],
      relatedOperators: ['range', 'from', 'interval'],
      docUrl: 'https://rxjs.dev/api/index/function/generate'
    },
    codeSnippet: `import { generate } from 'rxjs';

// Generates powers of 2 using options object
const powersOfTwo$ = generate({
  initialState: 1,
  condition: x => x <= 64,
  iterate: x => x * 2,
  resultSelector: x => \`2^n = \${x}\`
});

powersOfTwo$.subscribe({
  next: val => console.log('Generated:', val),
  complete: () => console.log('Loop completed successfully!')
});`,
    comparison: {
      features: [
        { id: 'loopControl', label: 'Iteration Control', description: 'Condition and state mutation' },
        { id: 'transformation', label: 'Result Projection', description: 'Custom result selector' },
        { id: 'flexibility', label: 'Sequence Flexibility', description: 'Linear vs non-linear sequences' }
      ],
      items: [
        {
          id: 'generate',
          name: 'generate(options)',
          recommendedUse: 'Complex state progressions, non-linear sequences, powers of 2',
          characteristics: {
            loopControl: { text: 'Dynamic condition & iterate expressions', status: 'positive' },
            transformation: { text: 'Built-in resultSelector', status: 'positive' },
            flexibility: { text: 'Full Turing-complete loop logic', status: 'positive' }
          }
        },
        {
          id: 'range',
          name: 'range(start, count)',
          recommendedUse: 'Simple integer counting',
          characteristics: {
            loopControl: { text: 'Count-based fixed loop', status: 'neutral' },
            transformation: { text: 'Emits plain numbers (requires pipe map)', status: 'neutral' },
            flexibility: { text: 'Linear +1 only', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'generate_q1',
        question: 'Which imperative JavaScript structure does generate() mirror?',
        options: [
          { id: 'a', text: 'try / catch' },
          { id: 'b', text: 'for (let state = init; condition(state); state = iterate(state))' },
          { id: 'c', text: 'switch / case' },
          { id: 'd', text: 'JSON.stringify' }
        ],
        correctOptionId: 'b',
        explanation: 'generate() is designed as a declarative reactive for-loop, providing initialState, condition, iterate, and resultSelector.'
      },
      {
        id: 'generate_q2',
        question: 'What danger exists if the condition property is omitted in generate() without a scheduler?',
        options: [
          { id: 'a', text: 'Throws a SyntaxError' },
          { id: 'b', text: 'Creates an infinite synchronous loop that can freeze the browser thread' },
          { id: 'c', text: 'Emits only 1 item' },
          { id: 'd', text: 'Returns null' }
        ],
        correctOptionId: 'b',
        explanation: 'Without a condition, generate() continues iterating infinitely and synchronously, blocking the JavaScript main event loop.'
      },
      {
        id: 'generate_q3',
        question: 'What is emitted if initialState fails the condition immediately (e.g. generate(0, x => x < 0, ...))?',
        options: [
          { id: 'a', text: 'Emits 0 then completes' },
          { id: 'b', text: 'Completes immediately with 0 emissions' },
          { id: 'c', text: 'Throws an error' },
          { id: 'd', text: 'Emits null' }
        ],
        correctOptionId: 'b',
        explanation: 'generate evaluates the condition before each emission. If the condition is false initially, the stream completes with zero emissions.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_generate',
        label: 'generate({ init: 1, cond: x <= 64, iter: x * 2 })',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 200, value: 1, displayLabel: '1', color: 'var(--color-marble-1)' },
          { id: 'm2', timeMs: 400, value: 2, displayLabel: '2', color: 'var(--color-marble-2)' },
          { id: 'm3', timeMs: 600, value: 4, displayLabel: '4', color: 'var(--color-marble-3)' },
          { id: 'm4', timeMs: 800, value: 8, displayLabel: '8', color: 'var(--color-marble-4)' },
          { id: 'm5', timeMs: 1000, value: 16, displayLabel: '16', color: 'var(--color-marble-5)' },
          { id: 'm6', timeMs: 1200, value: 32, displayLabel: '32', color: 'var(--color-marble-6)' },
          { id: 'm7', timeMs: 1400, value: 64, displayLabel: '64', color: 'var(--color-marble-7)' }
        ],
        completedAtMs: 1500
      }
    ]
  },

  'iif': {
    id: 'iif',
    routeSlug: 'iif',
    metadata: {
      name: 'iif',
      category: 'Creation',
      signature: 'iif<T, F>(condition: () => boolean, trueResult: ObservableInput<T>, falseResult: ObservableInput<F>): Observable<T | F>',
      summary: 'Conditionally subscribes to one of two Observables based on a boolean condition evaluated at subscription time.',
      description: 'Calls the condition function when an observer subscribes. If true, subscribes to trueResult; if false, subscribes to falseResult. Re-evaluates for every new subscriber. Wrapped internally with defer().',
      difficulty: 'intermediate',
      useCases: [
        'Dynamic stream switching based on user login status or authorization role',
        'Feature flag toggling: streaming new experimental API vs legacy API',
        'Selecting between cached data vs fresh HTTP request'
      ],
      pitfalls: [
        'CRITICAL: If condition evaluates to false and falseResult was omitted, RxJS 7 throws a runtime TypeError ("You provided undefined where a stream was expected"). Always pass EMPTY as the fallback!',
        'The stream arguments are evaluated eagerly at function call unless wrapped in defer() or already cold',
        'For switching between more than two streams, use defer() with a switch statement instead'
      ],
      marbleRules: [
        'If condition is true, replicates trueResult marble stream',
        'If condition is false, replicates falseResult marble stream'
      ],
      relatedOperators: ['defer', 'EMPTY', 'of'],
      docUrl: 'https://rxjs.dev/api/index/function/iif'
    },
    codeSnippet: `import { iif, of, EMPTY } from 'rxjs';

let hasAccess = true;

// Evaluates hasAccess dynamically at subscription time
const access$ = iif(
  () => hasAccess,
  of('Access Granted: VIP Content Loaded'),
  EMPTY // Essential fallback: omitting this throws TypeError if false!
);

access$.subscribe({
  next: content => console.log('Result:', content),
  complete: () => console.log('Access check complete!')
});`,
    comparison: {
      features: [
        { id: 'evaluation', label: 'Condition Timing', description: 'When condition is checked' },
        { id: 'branches', label: 'Branches Supported', description: 'Number of targets' },
        { id: 'fallback', label: 'False Fallback Safety', description: 'Safety when false' }
      ],
      items: [
        {
          id: 'iif',
          name: 'iif(cond, true$, false$)',
          recommendedUse: 'Simple binary stream branching evaluated per subscriber',
          characteristics: {
            evaluation: { text: 'Evaluated at subscription time', status: 'positive' },
            branches: { text: 'Binary: exactly 2 branches', status: 'neutral' },
            fallback: { text: 'Must supply EMPTY if false branch is inactive', status: 'neutral' }
          }
        },
        {
          id: 'defer',
          name: 'defer(() => switch...)',
          badge: 'Multi-Branch Factory',
          recommendedUse: 'Complex switching between 3+ streams or dynamic calculation',
          characteristics: {
            evaluation: { text: 'Evaluated at subscription time', status: 'positive' },
            branches: { text: 'N-ary: switch or if/else if trees', status: 'positive' },
            fallback: { text: 'Can return EMPTY or custom stream', status: 'positive' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'iif_q1',
        question: 'What critical runtime error occurs in RxJS 7 if the condition in iif(() => false, of("A")) evaluates to false and falseResult was omitted?',
        options: [
          { id: 'a', text: 'It defaults to EMPTY safely' },
          { id: 'b', text: 'Throws TypeError: "You provided undefined where a stream was expected"' },
          { id: 'c', text: 'Emits null' },
          { id: 'd', text: 'Hangs indefinitely' }
        ],
        correctOptionId: 'b',
        explanation: 'In RxJS 7, omitting the falseResult argument when condition evaluates to false throws a TypeError. Always supply EMPTY as the third argument.'
      },
      {
        id: 'iif_q2',
        question: 'When is the condition callback in iif(() => condition, ...) evaluated?',
        options: [
          { id: 'a', text: 'Once at application startup' },
          { id: 'b', text: 'At subscription time, for every new subscriber' },
          { id: 'c', text: 'Every millisecond' },
          { id: 'd', text: 'When the stream completes' }
        ],
        correctOptionId: 'b',
        explanation: 'iif wraps the condition in defer(), ensuring the condition function is evaluated afresh each time an observer subscribes.'
      },
      {
        id: 'iif_q3',
        question: 'What should you use if you need to choose between three or more different Observable streams at runtime?',
        options: [
          { id: 'a', text: 'Nested iif calls or defer() with a JavaScript switch statement' },
          { id: 'b', text: 'range()' },
          { id: 'c', text: 'fromEvent()' },
          { id: 'd', text: 'NEVER' }
        ],
        correctOptionId: 'a',
        explanation: 'iif is designed for binary boolean conditions. For multiple branch targets, defer() with a switch statement is cleaner and more idiomatic.'
      }
    ],
    initialMarbles: [
      {
        id: 'out_iif',
        label: 'iif(() => hasAccess, VIP$, Guest$)',
        color: 'var(--color-primary-500)',
        emissions: [
          { id: 'm1', timeMs: 400, value: 'VIP Content', displayLabel: 'VIP', color: 'var(--color-success)' }
        ],
        completedAtMs: 600
      }
    ]
  }
};
