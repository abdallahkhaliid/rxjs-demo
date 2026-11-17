import { Observable, timer } from 'rxjs';
import {
  tap,
  delay,
  delayWhen,
  timeout,
  timeInterval,
  timestamp,
  finalize,
  repeat,
  repeatWhen,
  retry,
  retryWhen,
  dematerialize,
  materialize,
  takeWhile,
  take
} from 'rxjs/operators';
import { OperatorDefinition } from '../operator-catalog.models';

export const UTILITY_OPERATORS: Record<string, OperatorDefinition> = {
  tap: {
    id: 'tap',
    name: 'tap',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'tap<T>(observerOrNext?: Partial<Observer<T>> | ((value: T) => void)): OperatorFunction<T, T>',
    summary: 'Used to perform side-effects for notifications from the source Observable.',
    description: 'Intercepts next, error, and complete notifications without altering the items or the timing of the stream. Primary tool for debugging, logging, and external mutations.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----3-----|',
      operator: 'tap(x => console.log(x))',
      output: '--1-----2-----3-----| (unmodified)'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'logPrefix', name: 'Log Tag', type: 'text', defaultValue: '[SPY]' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'logPrefix', name: 'Log Tag', type: 'text', defaultValue: '[SPY]' }],
      description: 'Spies on stream emissions without altering values.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'tap()', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 400, value: 2, displayLabel: '2' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { tap, map } from 'rxjs/operators';

of(1, 2, 3)
  .pipe(
    tap(val => console.log('Before transform:', val)),
    map(val => val * 10),
    tap(val => console.log('After transform:', val))
  )
  .subscribe();`,
    codeExample: `import { of } from 'rxjs';
import { tap } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(tap(x => console.log(x))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'mutation', label: 'Stream Mutation', description: 'Changes stream values' }],
      items: [
        { id: 'tap', name: 'tap', recommendedUse: 'Telemetry, logging, triggering UI side-effects', characteristics: { mutation: { text: 'Pure side-effect (zero stream mutation)', status: 'positive' } } },
        { id: 'map', name: 'map', recommendedUse: 'Value transformation', characteristics: { mutation: { text: 'Transforms values 1-to-1', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does the value returned by the callback in tap() affect downstream subscribers?',
        options: [
          { id: 'A', text: 'Yes, downstream receives the returned value' },
          { id: 'B', text: 'No, tap ignores return values and always forwards the original source item unmodified' },
          { id: 'C', text: 'Only if it returns a Promise' },
          { id: 'D', text: 'Only in RxJS 6' }
        ],
        correctOptionId: 'B',
        explanation: 'tap() is strictly transparent. It ignores any return value from its handler.'
      }
    ],
        useCases: [
      "Performing side effects such as logging emissions, setting external loading flags, or caching values in local variables",
      "Debugging stream pipelines by inspecting notifications without mutating or altering stream data",
      "Triggering analytics telemetry or external UI animations alongside data flow"
    ],
    pitfalls: [
      "Do not mutate emission objects inside tap; mutating objects breaks purity and causes difficult-to-trace bugs downstream",
      "tap does not transform values; the returned value from tap's callback is completely ignored by RxJS"
    ],
    relatedOperators: ["map","finalize","delay"],
    docUrl: "https://rxjs.dev/api/operators/tap",
    metadata: {

      name: 'tap',
      category: 'Utility',
      signature: 'tap(observerOrNext): OperatorFunction<T, T>',
      summary: 'Performs side-effects without mutating values.',
      description: 'Stream spying and side-effect operator.',
      difficulty: 'beginner',
      useCases: [
        "Performing side effects such as logging emissions, setting external loading flags, or caching values in local variables",
        "Debugging stream pipelines by inspecting notifications without mutating or altering stream data",
        "Triggering analytics telemetry or external UI animations alongside data flow"
      ],
      pitfalls: [
        "Do not mutate emission objects inside tap; mutating objects breaks purity and causes difficult-to-trace bugs downstream",
        "tap does not transform values; the returned value from tap's callback is completely ignored by RxJS"
      ],
      relatedOperators: ["map","finalize","delay"],
      docUrl: "https://rxjs.dev/api/operators/tap"
    },
    pipelineFactory: (source$, params) => {
      const tag = params['logPrefix'] ?? '[SPY]';
      return source$.pipe(tap(x => console.debug(`${tag}:`, x)));
    }
  },

  delay: {
    id: 'delay',
    name: 'delay',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'delay<T>(due: number | Date, scheduler?: SchedulerLike): OperatorFunction<T, T>',
    summary: 'Delays the emission of items from the source Observable by a given timeout or until a given Date.',
    description: 'Time-shifts each emission forward by the specified number of milliseconds while preserving the relative time intervals between emissions.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----|',
      operator: 'delay(500)',
      output: '-------1-----2|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'delayMs', name: 'Delay Duration (ms)', type: 'slider', defaultValue: 500, min: 20, max: 2000, step: 20, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'delayMs', name: 'Delay Duration', type: 'slider', defaultValue: 500 }],
      description: 'Shifts emission timestamps into the future.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'delay(500)', emissions: [{ id: 'o1', timeMs: 700, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

console.log('Start');
of('Delayed message')
  .pipe(delay(1000))
  .subscribe(msg => console.log(msg)); // Emits after 1 second`,
    codeExample: `import { of } from 'rxjs';
import { delay } from 'rxjs/operators';

of(1, 2, 3).pipe(delay(500)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'timing', label: 'Shift Strategy', description: 'How timing is modified' }],
      items: [
        { id: 'delay', name: 'delay', recommendedUse: 'Simulating network latency, animations', characteristics: { timing: { text: 'Shifts entire stream timeline by N ms', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does delay() modify error notifications from the source?',
        options: [
          { id: 'A', text: 'Yes, errors are delayed by the same duration' },
          { id: 'B', text: 'No, error notifications pass through immediately without any delay' },
          { id: 'C', text: 'Errors are swallowed' },
          { id: 'D', text: 'Errors are converted to completions' }
        ],
        correctOptionId: 'B',
        explanation: 'delay shifts next emissions and complete notifications, but errors are propagated immediately.'
      }
    ],
        useCases: [
      "Shifting all emissions forward in time by a fixed millisecond delay for animation sequencing or simulated latency",
      "Debouncing tooltips or popover dismissals by delaying the hide action",
      "Throttling automated UI tour steps to allow users time to read instructional banners"
    ],
    pitfalls: [
      "delay shifts the timing of emissions but does NOT delay stream subscription; source subscription occurs immediately",
      "Errors from the source are NOT delayed; errors pass through immediately to downstream subscribers"
    ],
    relatedOperators: ["delayWhen","debounceTime","timer"],
    docUrl: "https://rxjs.dev/api/operators/delay",
    metadata: {

      name: 'delay',
      category: 'Utility',
      signature: 'delay(dueMs): OperatorFunction<T, T>',
      summary: 'Shifts emission timestamps into the future.',
      description: 'Time shifting operator.',
      difficulty: 'beginner',
      useCases: [
        "Shifting all emissions forward in time by a fixed millisecond delay for animation sequencing or simulated latency",
        "Debouncing tooltips or popover dismissals by delaying the hide action",
        "Throttling automated UI tour steps to allow users time to read instructional banners"
      ],
      pitfalls: [
        "delay shifts the timing of emissions but does NOT delay stream subscription; source subscription occurs immediately",
        "Errors from the source are NOT delayed; errors pass through immediately to downstream subscribers"
      ],
      relatedOperators: ["delayWhen","debounceTime","timer"],
      docUrl: "https://rxjs.dev/api/operators/delay"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['delayMs'] ?? 500;
      return source$.pipe(delay(ms));
    }
  },

  delayWhen: {
    id: 'delayWhen',
    name: 'delayWhen',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'delayWhen<T>(delayDurationSelector: (value: T, index: number) => Observable<any>): OperatorFunction<T, T>',
    summary: 'Delays the emission of items from the source Observable by a given time span determined by the emissions of another Observable.',
    description: 'Dynamic per-item delay operator. Evaluates delayDurationSelector for each incoming value and emits that value when the returned Observable emits.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--1-----2-----|',
      operator: 'delayWhen(x => timer(x * 100))',
      output: '---1------2---|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'factor', name: 'Delay Multiplier (ms)', type: 'slider', defaultValue: 100, min: 20, max: 500, step: 20, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'factor', name: 'Factor', type: 'slider', defaultValue: 100 }],
      description: 'Delays each emission based on its own value.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'delayWhen', emissions: [{ id: 'o1', timeMs: 400, value: 2, displayLabel: '2' }] }
    },
    codeSnippet: `import { of, timer } from 'rxjs';
import { delayWhen } from 'rxjs/operators';

of(1, 2, 3)
  .pipe(delayWhen(val => timer(val * 300)))
  .subscribe(console.log);`,
    codeExample: `import { of, timer } from 'rxjs';
import { delayWhen } from 'rxjs/operators';

of(1, 2).pipe(delayWhen(v => timer(v * 100))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'perItem', label: 'Per-Item Timing', description: 'Individual item delays' }],
      items: [
        { id: 'delayWhen', name: 'delayWhen', recommendedUse: 'Per-item dynamic delays (e.g. prioritized queue delivery)', characteristics: { perItem: { text: 'Independent duration per item', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Can delayWhen cause emissions to arrive out of their original source order?',
        options: [
          { id: 'A', text: 'Yes, if a later item is assigned a shorter delay than an earlier item' },
          { id: 'B', text: 'No, RxJS always preserves original order' },
          { id: 'C', text: 'Only in web workers' },
          { id: 'D', text: 'Only when using promises' }
        ],
        correctOptionId: 'A',
        explanation: 'Because each item is delayed independently, an item with a shorter delay will be emitted before an earlier item with a longer delay.'
      }
    ],
        useCases: [
      "Delaying each emission by a dynamic duration computed per item (e.g. delaying heavy items longer than light items)",
      "Holding back emissions until a dynamic external resource (such as token refresh or animation finish) signals completion",
      "Staggering notification delivery based on notification priority"
    ],
    pitfalls: [
      "The duration selector must return an Observable; the item is delayed until that duration Observable emits its first value",
      "If the duration selector Observable completes without emitting a next value, the delayed item is immediately released downstream"
    ],
    relatedOperators: ["delay","debounce","bufferWhen"],
    docUrl: "https://rxjs.dev/api/operators/delayWhen",
    metadata: {

      name: 'delayWhen',
      category: 'Utility',
      signature: 'delayWhen(selector): OperatorFunction<T, T>',
      summary: 'Delays items based on dynamic duration selector.',
      description: 'Per-item dynamic delay operator.',
      difficulty: 'advanced',
      useCases: [
        "Delaying each emission by a dynamic duration computed per item (e.g. delaying heavy items longer than light items)",
        "Holding back emissions until a dynamic external resource (such as token refresh or animation finish) signals completion",
        "Staggering notification delivery based on notification priority"
      ],
      pitfalls: [
        "The duration selector must return an Observable; the item is delayed until that duration Observable emits its first value",
        "If the duration selector Observable completes without emitting a next value, the delayed item is immediately released downstream"
      ],
      relatedOperators: ["delay","debounce","bufferWhen"],
      docUrl: "https://rxjs.dev/api/operators/delayWhen"
    },
    pipelineFactory: (source$, params) => {
      const f = params['factor'] ?? 100;
      return source$.pipe(delayWhen(x => timer(typeof x === 'number' ? x * f : 100)));
    }
  },

  timeout: {
    id: 'timeout',
    name: 'timeout',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'timeout<T>(due: number | TimeoutConfig<T>): OperatorFunction<T, T>',
    summary: 'Errors if Observable does not emit a value within specified timeout period.',
    description: 'Guards against hung connections or silent failures. If source fails to emit within the deadline, it terminates with a TimeoutError.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--------------------|',
      operator: 'timeout(1000)',
      output: '--1----------# (TimeoutError)'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'dueMs', name: 'Timeout Limit (ms)', type: 'slider', defaultValue: 1000, min: 200, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'dueMs', name: 'Timeout Limit', type: 'slider', defaultValue: 1000 }],
      description: 'Raises TimeoutError if deadline expires without emission.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'timeout(1000)', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }], errorAtMs: 1200 }
    },
    codeSnippet: `import { of, timer } from 'rxjs';
import { timeout, delay } from 'rxjs/operators';

of('Fast response')
  .pipe(
    delay(2000), // Takes 2 seconds
    timeout(1000) // Timeout after 1 second
  )
  .subscribe({
    next: console.log,
    error: err => console.error('Caught timeout:', err.name) // TimeoutError
  });`,
    codeExample: `import { timer } from 'rxjs';
import { timeout } from 'rxjs/operators';

timer(2000).pipe(timeout(1000)).subscribe({ error: console.error });`,
    comparison: {
      features: [{ id: 'recovery', label: 'Fallback Support', description: 'Custom fallback on timeout' }],
      items: [
        { id: 'timeout', name: 'timeout', recommendedUse: 'HTTP SLA enforcement, hung socket prevention', characteristics: { recovery: { text: 'Configurable withTimeout fallback or error', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What error is thrown when timeout limit is exceeded?',
        options: [
          { id: 'A', text: 'TimeoutError' },
          { id: 'B', text: 'NetworkError' },
          { id: 'C', text: 'HttpError' },
          { id: 'D', text: 'RangeError' }
        ],
        correctOptionId: 'A',
        explanation: 'RxJS raises a TimeoutError with an info object detailing the elapsed duration and deadline.'
      }
    ],
        useCases: [
      "Aborting slow HTTP API requests if the server fails to respond within a specified deadline (e.g. 5000ms)",
      "Detecting dropped WebSocket heartbeats or stalled Bluetooth device connections",
      "Falling back to cached data or alternative services when primary data source is unresponsive"
    ],
    pitfalls: [
      "By default, timeout throws a TimeoutError when the time elapses without an emission, terminating the stream; provide with fallback Observable if you want graceful recovery",
      "Timeout resets its countdown timer on EVERY emission; in a multi-value stream, it enforces maximum inter-emission duration"
    ],
    relatedOperators: ["race","catchError","retry"],
    docUrl: "https://rxjs.dev/api/operators/timeout",
    metadata: {

      name: 'timeout',
      category: 'Utility',
      signature: 'timeout(due): OperatorFunction<T, T>',
      summary: 'Errors if source does not emit within timeout.',
      description: 'SLA timeout guard.',
      difficulty: 'intermediate',
      useCases: [
        "Aborting slow HTTP API requests if the server fails to respond within a specified deadline (e.g. 5000ms)",
        "Detecting dropped WebSocket heartbeats or stalled Bluetooth device connections",
        "Falling back to cached data or alternative services when primary data source is unresponsive"
      ],
      pitfalls: [
        "By default, timeout throws a TimeoutError when the time elapses without an emission, terminating the stream; provide with fallback Observable if you want graceful recovery",
        "Timeout resets its countdown timer on EVERY emission; in a multi-value stream, it enforces maximum inter-emission duration"
      ],
      relatedOperators: ["race","catchError","retry"],
      docUrl: "https://rxjs.dev/api/operators/timeout"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['dueMs'] ?? 1000;
      return source$.pipe(timeout(ms));
    }
  },

  timeInterval: {
    id: 'timeInterval',
    name: 'timeInterval',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'timeInterval<T>(scheduler?: SchedulerLike): OperatorFunction<T, TimeInterval<T>>',
    summary: 'Emits an object containing the current value, and the time that has elapsed since the previous value was emitted.',
    description: 'Annotates each emitted item with an interval property expressing the elapsed milliseconds since the immediately preceding item.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--a-----b-----c---|',
      operator: 'timeInterval()',
      output: '--{val:a,int:200}--{val:b,int:400}--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Measures elapsed milliseconds between consecutive emissions.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 'x', displayLabel: 'x' }, { id: '2', timeMs: 600, value: 'y', displayLabel: 'y' }] }],
      outputStream: { id: 'out', label: 'timeInterval()', emissions: [{ id: 'o1', timeMs: 200, value: { value: 'x', interval: 200 }, displayLabel: '{x, 200ms}' }, { id: 'o2', timeMs: 600, value: { value: 'y', interval: 400 }, displayLabel: '{y, 400ms}' }] }
    },
    codeSnippet: `import { interval } from 'rxjs';
import { timeInterval, take } from 'rxjs/operators';

interval(500)
  .pipe(timeInterval(), take(3))
  .subscribe(({ value, interval }) =>
    console.log(\`Item \${value} arrived after \${interval}ms\`)
  );`,
    codeExample: `import { of } from 'rxjs';
import { timeInterval } from 'rxjs/operators';

of(1, 2).pipe(timeInterval()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'metric', label: 'Measured Metric', description: 'Delta vs Absolute time' }],
      items: [
        { id: 'timeInterval', name: 'timeInterval', recommendedUse: 'Measuring inter-arrival latency, typing speed', characteristics: { metric: { text: 'Elapsed delta between emissions (ms)', status: 'positive' } } },
        { id: 'timestamp', name: 'timestamp', recommendedUse: 'Epoch auditing and absolute logging', characteristics: { metric: { text: 'Absolute wall-clock epoch timestamp', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the interval measured against for the FIRST emitted value?',
        options: [
          { id: 'A', text: '0' },
          { id: 'B', text: 'The time elapsed since subscription began' },
          { id: 'C', text: 'The epoch time' },
          { id: 'D', text: 'undefined' }
        ],
        correctOptionId: 'B',
        explanation: 'For the first item, interval measures elapsed time between the start of subscription and that first emission.'
      }
    ],
        useCases: [
      "Measuring the elapsed time between consecutive user clicks to detect double-click or typing cadence",
      "Profiling network latency and packet jitter in real-time streaming connections",
      "Monitoring time intervals between sensor pulses to calculate rotational speed or pulse rate"
    ],
    pitfalls: [
      "Transforms emissions into { value: T, interval: number } objects, wrapping your original data type",
      "The interval for the very first emission is measured relative to the moment of subscription"
    ],
    relatedOperators: ["timestamp","pairwise","delay"],
    docUrl: "https://rxjs.dev/api/operators/timeInterval",
    metadata: {

      name: 'timeInterval',
      category: 'Utility',
      signature: 'timeInterval(): OperatorFunction<T, TimeInterval<T>>',
      summary: 'Emits item annotated with elapsed time since previous emission.',
      description: 'Delta timing measurement operator.',
      difficulty: 'intermediate',
      useCases: [
        "Measuring the elapsed time between consecutive user clicks to detect double-click or typing cadence",
        "Profiling network latency and packet jitter in real-time streaming connections",
        "Monitoring time intervals between sensor pulses to calculate rotational speed or pulse rate"
      ],
      pitfalls: [
        "Transforms emissions into { value: T, interval: number } objects, wrapping your original data type",
        "The interval for the very first emission is measured relative to the moment of subscription"
      ],
      relatedOperators: ["timestamp","pairwise","delay"],
      docUrl: "https://rxjs.dev/api/operators/timeInterval"
    },
    pipelineFactory: source$ => source$.pipe(timeInterval())
  },

  timestamp: {
    id: 'timestamp',
    name: 'timestamp',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'timestamp<T>(scheduler?: SchedulerLike): OperatorFunction<T, Timestamp<T>>',
    summary: 'Attaches a timestamp to each item emitted by an Observable indicating when it was emitted.',
    description: 'Wraps each emission in an object { value: T, timestamp: number } with the epoch timestamp in milliseconds when it was dispatched.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--a-----b-----|',
      operator: 'timestamp()',
      output: '--{val:a,ts:1700}--{val:b,ts:2100}--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Attaches wall-clock epoch timestamp to every emission.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 'log', displayLabel: 'log' }] }],
      outputStream: { id: 'out', label: 'timestamp()', emissions: [{ id: 'o1', timeMs: 300, value: { value: 'log', timestamp: 1700000000 }, displayLabel: '{log, epoch}' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { timestamp } from 'rxjs/operators';

of('OrderCreated', 'PaymentCaptured')
  .pipe(timestamp())
  .subscribe(({ value, timestamp }) => {
    console.log(\`Event \${value} at \${new Date(timestamp).toISOString()}\`);
  });`,
    codeExample: `import { of } from 'rxjs';
import { timestamp } from 'rxjs/operators';

of(1, 2).pipe(timestamp()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'info', label: 'Metadata Added', description: 'Timing metadata' }],
      items: [
        { id: 'timestamp', name: 'timestamp', recommendedUse: 'Audit trails, telemetry logging, sensor recording', characteristics: { info: { text: 'Epoch milliseconds (Date.now())', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the structure of the object emitted by timestamp()?',
        options: [
          { id: 'A', text: '{ value: T, timestamp: number }' },
          { id: 'B', text: '{ data: T, time: Date }' },
          { id: 'C', text: '[T, number]' },
          { id: 'D', text: 'T' }
        ],
        correctOptionId: 'A',
        explanation: 'timestamp emits an object with value and timestamp (number representing milliseconds since epoch).'
      }
    ],
        useCases: [
      "Attaching accurate epoch timestamps (Date.now()) to incoming event emissions for audit trails or logging",
      "Synchronizing distributed client events with server telemetry timelines",
      "Benchmarking processing pipeline stage latencies"
    ],
    pitfalls: [
      "Wraps emitted values in { value: T, timestamp: number } objects, altering downstream type signatures",
      "Timestamp uses the local client machine's clock by default; clock skew across different clients must be considered"
    ],
    relatedOperators: ["timeInterval","tap","map"],
    docUrl: "https://rxjs.dev/api/operators/timestamp",
    metadata: {

      name: 'timestamp',
      category: 'Utility',
      signature: 'timestamp(): OperatorFunction<T, Timestamp<T>>',
      summary: 'Attaches epoch timestamp to each emission.',
      description: 'Wall-clock timestamping.',
      difficulty: 'beginner',
      useCases: [
        "Attaching accurate epoch timestamps (Date.now()) to incoming event emissions for audit trails or logging",
        "Synchronizing distributed client events with server telemetry timelines",
        "Benchmarking processing pipeline stage latencies"
      ],
      pitfalls: [
        "Wraps emitted values in { value: T, timestamp: number } objects, altering downstream type signatures",
        "Timestamp uses the local client machine's clock by default; clock skew across different clients must be considered"
      ],
      relatedOperators: ["timeInterval","tap","map"],
      docUrl: "https://rxjs.dev/api/operators/timestamp"
    },
    pipelineFactory: source$ => source$.pipe(timestamp())
  },

  finalize: {
    id: 'finalize',
    name: 'finalize',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'finalize<T>(callback: () => void): OperatorFunction<T, T>',
    summary: 'Call a specified function when the source terminates on complete or error.',
    description: 'The try...finally equivalent for RxJS observables. Guarantees callback execution when the stream completes, errors, or is unsubscribed.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--3--|',
      operator: 'finalize(() => cleanup())',
      output: '--1--2--3--| (cleanup runs)'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Runs cleanup callback upon completion, error, or unsubscription.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }], completedAtMs: 400 }],
      outputStream: { id: 'out', label: 'finalize()', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }], completedAtMs: 400 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { finalize } from 'rxjs/operators';

let isLoading = true;

of('Data loaded')
  .pipe(
    finalize(() => {
      isLoading = false;
      console.log('Spinner dismissed!');
    })
  )
  .subscribe(console.log);`,
    codeExample: `import { of } from 'rxjs';
import { finalize } from 'rxjs/operators';

of(1, 2).pipe(finalize(() => console.log('Finalized'))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'cleanup', label: 'Guaranteed Cleanup', description: 'Runs in all terminal paths' }],
      items: [
        { id: 'finalize', name: 'finalize', recommendedUse: 'Hiding loading spinners, closing file handles, resetting flags', characteristics: { cleanup: { text: 'Runs on complete, error, AND manual unsubscribe', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does finalize() execute if the consumer manually unsubscribes before the stream completes?',
        options: [
          { id: 'A', text: 'Yes, finalize executes upon any unsubscription or termination' },
          { id: 'B', text: 'No, only on clean completion' },
          { id: 'C', text: 'Only on error' },
          { id: 'D', text: 'Only in Angular services' }
        ],
        correctOptionId: 'A',
        explanation: 'finalize executes whenever the subscription is disposed, regardless of whether it was complete, error, or manual cancellation.'
      }
    ],
        useCases: [
      "Resetting loading spinners and progress bars regardless of whether an HTTP request succeeded, failed, or was cancelled (isBusy = false)",
      "Releasing acquired system resources, closing database handles, or clearing memory buffers",
      "Logging final session metrics upon user unsubscription or route navigation"
    ],
    pitfalls: [
      "finalize executes callback function upon any teardown (complete, error, OR unsubscribe); it does NOT indicate successful completion",
      "Finalize callback takes no parameters; it cannot inspect whether the stream errored or completed normally"
    ],
    relatedOperators: ["tap","endWith","catchError"],
    docUrl: "https://rxjs.dev/api/operators/finalize",
    metadata: {

      name: 'finalize',
      category: 'Utility',
      signature: 'finalize(callback): OperatorFunction<T, T>',
      summary: 'Executes callback when stream completes, errors, or unbinds.',
      description: 'Stream disposal and cleanup operator.',
      difficulty: 'beginner',
      useCases: [
        "Resetting loading spinners and progress bars regardless of whether an HTTP request succeeded, failed, or was cancelled (isBusy = false)",
        "Releasing acquired system resources, closing database handles, or clearing memory buffers",
        "Logging final session metrics upon user unsubscription or route navigation"
      ],
      pitfalls: [
        "finalize executes callback function upon any teardown (complete, error, OR unsubscribe); it does NOT indicate successful completion",
        "Finalize callback takes no parameters; it cannot inspect whether the stream errored or completed normally"
      ],
      relatedOperators: ["tap","endWith","catchError"],
      docUrl: "https://rxjs.dev/api/operators/finalize"
    },
    pipelineFactory: source$ => source$.pipe(finalize(() => console.debug('Stream finalized')))
  },

  repeat: {
    id: 'repeat',
    name: 'repeat',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'repeat<T>(countOrConfig?: number | RepeatConfig): OperatorFunction<T, T>',
    summary: 'Returns an Observable that will resubscribe to the source Observable when the source completes.',
    description: 'Resubscribes to the source Observable up to count times after it completes cleanly.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--a--b--|',
      operator: 'repeat(2)',
      output: '--a--b----a--b--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'count', name: 'Repeat Count', type: 'number', defaultValue: 2, min: 1, max: 5 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'count', name: 'Repeat Count', type: 'number', defaultValue: 2 }],
      description: 'Resubscribes upon completion up to specified count.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 'x', displayLabel: 'x' }], completedAtMs: 300 }],
      outputStream: { id: 'out', label: 'repeat(2)', emissions: [{ id: 'o1', timeMs: 200, value: 'x', displayLabel: 'x' }, { id: 'o2', timeMs: 500, value: 'x', displayLabel: 'x' }], completedAtMs: 600 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { repeat } from 'rxjs/operators';

of('ping')
  .pipe(repeat(3))
  .subscribe(console.log); // 'ping', 'ping', 'ping'`,
    codeExample: `import { of } from 'rxjs';
import { repeat } from 'rxjs/operators';

of(1, 2).pipe(repeat(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'trigger', label: 'Resubscription Trigger', description: 'Error vs Complete' }],
      items: [
        { id: 'repeat', name: 'repeat', recommendedUse: 'Looping streams upon successful completion', characteristics: { trigger: { text: 'Complete notification', status: 'positive' } } },
        { id: 'retry', name: 'retry', recommendedUse: 'Recovering from network or API errors', characteristics: { trigger: { text: 'Error notification', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does repeat() resubscribe if the source Observable emits an ERROR?',
        options: [
          { id: 'A', text: 'Yes' },
          { id: 'B', text: 'No, repeat only resubscribes on complete; use retry() for error recovery' },
          { id: 'C', text: 'Only if count > 5' },
          { id: 'D', text: 'Only in RxJS 7' }
        ],
        correctOptionId: 'B',
        explanation: 'repeat only listens for complete notifications. If an error is thrown, it passes through directly.'
      }
    ],
        useCases: [
      "Restarting a completed workflow or stream sequence a fixed number of times",
      "Implementing recurring background polling by re-subscribing to an HTTP request upon completion",
      "Replaying an onboarding demonstration sequence upon completion"
    ],
    pitfalls: [
      "repeat ONLY resubscribes upon complete; if the source errors, repeat will NOT catch the error (use retry instead)",
      "Using repeat() without arguments on a synchronously completing source will cause an infinite synchronous loop that freezes the browser thread"
    ],
    relatedOperators: ["repeatWhen","retry","delay"],
    docUrl: "https://rxjs.dev/api/operators/repeat",
    metadata: {

      name: 'repeat',
      category: 'Utility',
      signature: 'repeat(count): OperatorFunction<T, T>',
      summary: 'Resubscribes upon complete N times.',
      description: 'Looping resubscription operator.',
      difficulty: 'beginner',
      useCases: [
        "Restarting a completed workflow or stream sequence a fixed number of times",
        "Implementing recurring background polling by re-subscribing to an HTTP request upon completion",
        "Replaying an onboarding demonstration sequence upon completion"
      ],
      pitfalls: [
        "repeat ONLY resubscribes upon complete; if the source errors, repeat will NOT catch the error (use retry instead)",
        "Using repeat() without arguments on a synchronously completing source will cause an infinite synchronous loop that freezes the browser thread"
      ],
      relatedOperators: ["repeatWhen","retry","delay"],
      docUrl: "https://rxjs.dev/api/operators/repeat"
    },
    pipelineFactory: (source$, params) => {
      const c = params['count'] ?? 2;
      return source$.pipe(repeat(c));
    }
  },

  repeatWhen: {
    id: 'repeatWhen',
    name: 'repeatWhen',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'repeatWhen<T>(notifier: (notifications: Observable<void>) => Observable<any>): OperatorFunction<T, T>',
    summary: 'Returns an Observable that mirrors the source Observable with the exception of a complete.',
    description: 'Dynamic resubscription operator. When source completes, it passes a notification to the notifier factory. Deprecated in RxJS 7 in favor of repeat({ delay }).',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--1--2--|',
      operator: 'repeatWhen(notifs => ...)',
      output: '--1--2----1--2--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Resubscribes based on dynamic notification stream.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'repeatWhen', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { of, timer } from 'rxjs';
import { repeatWhen, take } from 'rxjs/operators';

of('Hello')
  .pipe(
    repeatWhen(completed$ => completed$.pipe(take(2)))
  )
  .subscribe(console.log);`,
    codeExample: `import { of } from 'rxjs';
import { repeatWhen, take } from 'rxjs/operators';

of(1).pipe(repeatWhen(n$ => n$.pipe(take(2)))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'modern', label: 'Modern Alternative', description: 'RxJS 7+ syntax' }],
      items: [
        { id: 'repeatWhen', name: 'repeatWhen', recommendedUse: 'Legacy dynamic repeat', characteristics: { modern: { text: 'repeat({ delay: () => timer(...) })', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the recommended modern replacement for repeatWhen in RxJS 7+?',
        options: [
          { id: 'A', text: 'repeat({ delay }) config object' },
          { id: 'B', text: 'retryWhen' },
          { id: 'C', text: 'takeUntil' },
          { id: 'D', text: 'whileLoop' }
        ],
        correctOptionId: 'A',
        explanation: 'RxJS 7 added the repeat({ delay }) configuration object to replace repeatWhen with a simpler API.'
      }
    ],
        useCases: [
      "Re-subscribing to a completed stream when an external notifier (e.g. 'Refresh' button or window focus) emits",
      "Implementing complex legacy repeat schedules with dynamic delays"
    ],
    pitfalls: [
      "Deprecated in RxJS 7 in favor of repeat({ delay: () => notifier$ }) which provides a clearer, less error-prone API",
      "The notifier function receives an Observable of completion notifications; if that notifier completes, the repeat sequence terminates permanently"
    ],
    relatedOperators: ["repeat","retryWhen","retry"],
    docUrl: "https://rxjs.dev/api/operators/repeatWhen",
    isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of repeat({ delay: (count) => notifier$ }).",
    modernAlternative: "repeat({ delay: (count) => notifier$ })",
    metadata: {

      name: 'repeatWhen',
      category: 'Utility',
      signature: 'repeatWhen(notifier): OperatorFunction<T, T>',
      summary: 'Resubscribes based on dynamic notification stream.',
      description: 'Dynamic repetition operator.',
      difficulty: 'advanced',
      useCases: [
        "Re-subscribing to a completed stream when an external notifier (e.g. 'Refresh' button or window focus) emits",
        "Implementing complex legacy repeat schedules with dynamic delays"
      ],
      pitfalls: [
        "Deprecated in RxJS 7 in favor of repeat({ delay: () => notifier$ }) which provides a clearer, less error-prone API",
        "The notifier function receives an Observable of completion notifications; if that notifier completes, the repeat sequence terminates permanently"
      ],
      relatedOperators: ["repeat","retryWhen","retry"],
      docUrl: "https://rxjs.dev/api/operators/repeatWhen",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of repeat({ delay: (count) => notifier$ }).",
      modernAlternative: "repeat({ delay: (count) => notifier$ })"
    },
    pipelineFactory: source$ => {
      let count = 0;
      return source$.pipe(repeatWhen(n$ => n$.pipe(takeWhile(() => ++count < 2))));
    }
  },

  retry: {
    id: 'retry',
    name: 'retry',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'retry<T>(countOrConfig?: number | RetryConfig): OperatorFunction<T, T>',
    summary: 'Returns an Observable that mirrors the source Observable with the exception of an error.',
    description: 'The foundation for resilient HTTP and socket communication. Automatically resubscribes to the source stream when an error occurs, up to count attempts.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--# (error)',
      operator: 'retry(2)',
      output: '--1--2----1--2--3--|'
    },
    defaultSourcePreset: 'error',
    parameters: [
      { id: 'count', name: 'Retry Attempts', type: 'number', defaultValue: 2, min: 0, max: 5 }
    ],
    interactiveConfig: {
      sourcePreset: 'error',
      params: [{ id: 'count', name: 'Attempts', type: 'number', defaultValue: 2 }],
      description: 'Resubscribes upon error up to specified attempt count.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }], errorAtMs: 400 }],
      outputStream: { id: 'out', label: 'retry(2)', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 600, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { throwError, of } from 'rxjs';
import { retry, catchError } from 'rxjs/operators';

let attempts = 0;
const flakyHttp$ = of('success');

flakyHttp$
  .pipe(
    retry(3),
    catchError(err => of('Fallback data after 3 failed attempts'))
  )
  .subscribe(console.log);`,
    codeExample: `import { of, throwError } from 'rxjs';
import { retry } from 'rxjs/operators';

let tries = 0;
new Observable(sub => {
  if (++tries < 2) sub.error('fail');
  else { sub.next('ok'); sub.complete(); }
}).pipe(retry(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'backoff', label: 'Exponential Backoff', description: 'Delay between attempts' }],
      items: [
        { id: 'retry', name: 'retry', recommendedUse: 'Transient error retry with optional delay config', characteristics: { backoff: { text: 'Supported via retry({ delay: 1000 })', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if all retry attempts are exhausted and the stream errors again?',
        options: [
          { id: 'A', text: 'The error is propagated to the observer error callback' },
          { id: 'B', text: 'It completes quietly' },
          { id: 'C', text: 'It retries forever' },
          { id: 'D', text: 'It emits null' }
        ],
        correctOptionId: 'A',
        explanation: 'Once the maximum attempts are reached, retry ceases recovery and forwards the final error downstream.'
      }
    ],
        useCases: [
      "Automatically retrying failed HTTP requests up to N times to recover from transient network blips",
      "Re-establishing dropped WebSocket connections with exponential backoff (retry({ count: 3, delay: ... }))",
      "Retrying flaky third-party API calls before falling back to cached offline data"
    ],
    pitfalls: [
      "Do not retry non-idempotent HTTP mutations (e.g. POST /charge-card) without deduplication keys, as retries may charge users multiple times",
      "If max retry count is exhausted, retry propagates the final error downstream unless caught by catchError"
    ],
    relatedOperators: ["retryWhen","repeat","catchError"],
    docUrl: "https://rxjs.dev/api/operators/retry",
    metadata: {

      name: 'retry',
      category: 'Utility',
      signature: 'retry(count): OperatorFunction<T, T>',
      summary: 'Resubscribes upon error up to specified count.',
      description: 'Error recovery operator.',
      difficulty: 'beginner',
      useCases: [
        "Automatically retrying failed HTTP requests up to N times to recover from transient network blips",
        "Re-establishing dropped WebSocket connections with exponential backoff (retry({ count: 3, delay: ... }))",
        "Retrying flaky third-party API calls before falling back to cached offline data"
      ],
      pitfalls: [
        "Do not retry non-idempotent HTTP mutations (e.g. POST /charge-card) without deduplication keys, as retries may charge users multiple times",
        "If max retry count is exhausted, retry propagates the final error downstream unless caught by catchError"
      ],
      relatedOperators: ["retryWhen","repeat","catchError"],
      docUrl: "https://rxjs.dev/api/operators/retry"
    },
    pipelineFactory: (source$, params) => {
      const c = params['count'] ?? 2;
      return source$.pipe(retry(c));
    }
  },

  retryWhen: {
    id: 'retryWhen',
    name: 'retryWhen',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'retryWhen<T>(notifier: (errors: Observable<any>) => Observable<any>): OperatorFunction<T, T>',
    summary: 'Returns an Observable that mirrors the source Observable with the exception of an error.',
    description: 'Dynamic error recovery. Passes errors to a notifier factory Observable that controls when and whether to retry. Deprecated in RxJS 7 in favor of retry({ delay }).',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--1--# (error)',
      operator: 'retryWhen(errors$ => ...)',
      output: '--1-------1--|'
    },
    defaultSourcePreset: 'error',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'error',
      params: [],
      description: 'Retries based on dynamic error notifier observable.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }], errorAtMs: 300 }],
      outputStream: { id: 'out', label: 'retryWhen', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { throwError, timer } from 'rxjs';
import { retryWhen, take } from 'rxjs/operators';

throwError(() => new Error('Simulated'))
  .pipe(
    retryWhen(errors$ => errors$.pipe(take(2)))
  )
  .subscribe({
    error: err => console.log('Final error caught')
  });`,
    codeExample: `import { of } from 'rxjs';
import { retryWhen, take } from 'rxjs/operators';

of(1).pipe(retryWhen(e$ => e$.pipe(take(2)))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'modern', label: 'Modern Equivalent', description: 'RxJS 7+ syntax' }],
      items: [
        { id: 'retryWhen', name: 'retryWhen', recommendedUse: 'Legacy dynamic retry logic', characteristics: { modern: { text: 'retry({ delay: (err, count) => timer(count * 1000) })', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the modern RxJS 7+ replacement for retryWhen?',
        options: [
          { id: 'A', text: 'retry({ delay: (err, retryCount) => timer(...) })' },
          { id: 'B', text: 'repeat()' },
          { id: 'C', text: 'catchError()' },
          { id: 'D', text: 'throwError()' }
        ],
        correctOptionId: 'A',
        explanation: 'retry({ delay }) allows dynamic delays and condition checks without the complexities of higher-order notifier streams.'
      }
    ],
        useCases: [
      "Implementing custom error handling backoff strategies in legacy RxJS 6 applications",
      "Retrying a failed stream only when a specific 'Reconnect' user button is clicked"
    ],
    pitfalls: [
      "Deprecated in RxJS 7 in favor of retry({ delay: (err, retryCount) => timer(...) }) which simplifies backoff configuration",
      "If the notifier stream errors, that error is passed downstream and retries cease immediately"
    ],
    relatedOperators: ["retry","repeatWhen","catchError"],
    docUrl: "https://rxjs.dev/api/operators/retryWhen",
    isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of retry({ delay: (error, count) => notifier$ }) or retry({ count, delay, resetOnSuccess: true }).",
    modernAlternative: "retry({ delay: (error, count) => notifier$ })",
    metadata: {

      name: 'retryWhen',
      category: 'Utility',
      signature: 'retryWhen(notifier): OperatorFunction<T, T>',
      summary: 'Retries based on dynamic error notifier stream.',
      description: 'Dynamic error retry operator.',
      difficulty: 'advanced',
      useCases: [
        "Implementing custom error handling backoff strategies in legacy RxJS 6 applications",
        "Retrying a failed stream only when a specific 'Reconnect' user button is clicked"
      ],
      pitfalls: [
        "Deprecated in RxJS 7 in favor of retry({ delay: (err, retryCount) => timer(...) }) which simplifies backoff configuration",
        "If the notifier stream errors, that error is passed downstream and retries cease immediately"
      ],
      relatedOperators: ["retry","repeatWhen","catchError"],
      docUrl: "https://rxjs.dev/api/operators/retryWhen",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of retry({ delay: (error, count) => notifier$ }) or retry({ count, delay, resetOnSuccess: true }).",
      modernAlternative: "retry({ delay: (error, count) => notifier$ })"
    },
    pipelineFactory: source$ => source$.pipe(retryWhen(errors$ => errors$.pipe(take(2))))
  },

  dematerialize: {
    id: 'dematerialize',
    name: 'dematerialize',
    category: 'utility',
    categoryDisplayName: 'Utility',
    signature: 'dematerialize<N extends Notification<any>>(): OperatorFunction<N, ValueFromNotification<N>>',
    summary: 'Converts an Observable of Notification objects into the actual emissions that they represent.',
    description: 'The inverse of materialize(). Unwraps Notification instances (N, E, C) into real stream next, error, and complete events.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--N(1)---N(2)---C---|',
      operator: 'dematerialize()',
      output: '--1------2------|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Unwraps Notification objects back into real stream events.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'notifications$', emissions: [{ id: '1', timeMs: 200, value: 'Notification(1)', displayLabel: 'N(1)' }] }],
      outputStream: { id: 'out', label: 'dematerialize()', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { of, Notification } from 'rxjs';
import { dematerialize } from 'rxjs/operators';

const notifA = Notification.createNext('A');
const notifB = Notification.createNext('B');
const notifC = Notification.createComplete();

of(notifA, notifB, notifC)
  .pipe(dematerialize())
  .subscribe(console.log); // 'A', 'B'`,
    codeExample: `import { of } from 'rxjs';
import { materialize, dematerialize } from 'rxjs/operators';

of(1, 2).pipe(materialize(), dematerialize()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'inverse', label: 'Inverse Operator', description: 'Counterpart operator' }],
      items: [
        { id: 'dematerialize', name: 'dematerialize', recommendedUse: 'Replaying recorded Notification events', characteristics: { inverse: { text: 'materialize() converts events to Notification objects', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What types of Notification objects does dematerialize() unwrap?',
        options: [
          { id: 'A', text: 'Next ("N"), Error ("E"), and Complete ("C") notifications' },
          { id: 'B', text: 'Only HTTP responses' },
          { id: 'C', text: 'Browser push notifications' },
          { id: 'D', text: 'DOM event objects' }
        ],
        correctOptionId: 'A',
        explanation: 'dematerialize turns RxJS Notification metadata objects back into real stream notifications.'
      }
    ],
        useCases: [
      "Unwrapping serialized Notification objects (next, error, complete) back into actual stream emissions",
      "Replaying recorded stream sessions stored in IndexedDB or sent across Web Workers",
      "Implementing custom marble testing harnesses or meta-stream visualizers"
    ],
    pitfalls: [
      "Source MUST emit RxJS Notification instances; emitting regular objects or primitives causes a runtime TypeError",
      "An error Notification encountered in the source stream causes dematerialize to emit an error notification downstream and terminate"
    ],
    relatedOperators: ["map","toArray","tap"],
    docUrl: "https://rxjs.dev/api/operators/dematerialize",
    metadata: {

      name: 'dematerialize',
      category: 'Utility',
      signature: 'dematerialize(): OperatorFunction<Notification<T>, T>',
      summary: 'Unwraps Notification objects into actual stream emissions.',
      description: 'Notification deserializer.',
      difficulty: 'advanced',
      useCases: [
        "Unwrapping serialized Notification objects (next, error, complete) back into actual stream emissions",
        "Replaying recorded stream sessions stored in IndexedDB or sent across Web Workers",
        "Implementing custom marble testing harnesses or meta-stream visualizers"
      ],
      pitfalls: [
        "Source MUST emit RxJS Notification instances; emitting regular objects or primitives causes a runtime TypeError",
        "An error Notification encountered in the source stream causes dematerialize to emit an error notification downstream and terminate"
      ],
      relatedOperators: ["map","toArray","tap"],
      docUrl: "https://rxjs.dev/api/operators/dematerialize"
    },
    pipelineFactory: source$ => source$.pipe(materialize(), dematerialize())
  }
};
