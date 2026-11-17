import { Observable, timer } from 'rxjs';
import {
  filter,
  take,
  takeLast,
  takeUntil,
  takeWhile,
  skip,
  skipLast,
  skipUntil,
  skipWhile,
  distinct,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  debounce,
  debounceTime,
  throttle,
  throttleTime,
  audit,
  auditTime,
  sample
} from 'rxjs/operators';
import { OperatorDefinition } from '../operator-catalog.models';

export const FILTERING_OPERATORS: Record<string, OperatorDefinition> = {
  filter: {
    id: 'filter',
    name: 'filter',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'filter<T>(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>',
    summary: 'Filter items emitted by the source Observable by only emitting those that satisfy a specified predicate.',
    description: 'Similar to Array.prototype.filter, this operator evaluates each value against a boolean predicate. Only values where the predicate returns true are forwarded downstream.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----3-----4-----5--|',
      operator: 'filter(x => x % 2 === 0)',
      output: '--------2-----------4--------|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      {
        id: 'predicate',
        name: 'Filter Predicate',
        type: 'select',
        defaultValue: 'even',
        options: [
          { label: 'Even numbers only (x % 2 === 0)', value: 'even' },
          { label: 'Odd numbers only (x % 2 !== 0)', value: 'odd' },
          { label: 'Greater than 2 (x > 2)', value: 'gt2' }
        ],
        description: 'Predicate condition used to filter emissions.'
      }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'predicate', name: 'Predicate', type: 'select', defaultValue: 'even' }],
      description: 'Filters values according to chosen condition.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }, { id: '4', timeMs: 800, value: 4, displayLabel: '4' }] }],
      outputStream: { id: 'out', label: 'filter(even)', emissions: [{ id: 'o1', timeMs: 400, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 800, value: 4, displayLabel: '4' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(filter(x => x % 2 === 0))
  .subscribe(console.log); // 2, 4`,
    codeExample: `import { of } from 'rxjs';
import { filter } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(filter(x => x % 2 === 0)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'discard', label: 'Discard Policy', description: 'What happens to rejected items' }],
      items: [
        { id: 'filter', name: 'filter', recommendedUse: 'Conditional stream restriction', characteristics: { discard: { text: 'Silently dropped without terminating stream', status: 'positive' } } },
        { id: 'takeWhile', name: 'takeWhile', recommendedUse: 'Terminating on false predicate', characteristics: { discard: { text: 'Completes entire stream immediately', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What does filter() emit when the predicate returns false?',
        options: [
          { id: 'A', text: 'null' },
          { id: 'B', text: 'undefined' },
          { id: 'C', text: 'Nothing (the value is dropped and not emitted)', },
          { id: 'D', text: 'An error' }
        ],
        correctOptionId: 'C',
        explanation: 'filter() suppresses non-matching values completely without notifying downstream subscribers.'
      }
    ],
        useCases: [
      "Discarding invalid form values, null/undefined payloads, or unauthorized HTTP events",
      "Restricting keyboard shortcuts to specific keys (e.g. event => event.key === 'Enter')",
      "Routing data through conditional UI layers based on user role or permission flags"
    ],
    pitfalls: [
      "Filter does not complete the stream when a predicate returns false; it merely drops non-matching items. Use takeWhile() to complete the stream upon failing predicate",
      "Ensure the predicate is pure; running side effects inside filter predicates leads to unpredictable state bugs"
    ],
    relatedOperators: ["takeWhile","skipWhile","distinct"],
    docUrl: "https://rxjs.dev/api/operators/filter",
    metadata: {

      name: 'filter',
      category: 'Filtering',
      signature: 'filter<T>(predicate: (value: T) => boolean): OperatorFunction<T, T>',
      summary: 'Emits only values that satisfy the predicate.',
      description: 'Standard boolean filtering operator.',
      difficulty: 'beginner',
      useCases: [
        "Discarding invalid form values, null/undefined payloads, or unauthorized HTTP events",
        "Restricting keyboard shortcuts to specific keys (e.g. event => event.key === 'Enter')",
        "Routing data through conditional UI layers based on user role or permission flags"
      ],
      pitfalls: [
        "Filter does not complete the stream when a predicate returns false; it merely drops non-matching items. Use takeWhile() to complete the stream upon failing predicate",
        "Ensure the predicate is pure; running side effects inside filter predicates leads to unpredictable state bugs"
      ],
      relatedOperators: ["takeWhile","skipWhile","distinct"],
      docUrl: "https://rxjs.dev/api/operators/filter"
    },
    pipelineFactory: (source$, params) => {
      const pred = params['predicate'] ?? 'even';
      return source$.pipe(
        filter(x => {
          if (typeof x !== 'number') return true;
          if (pred === 'even') return x % 2 === 0;
          if (pred === 'odd') return x % 2 !== 0;
          if (pred === 'gt2') return x > 2;
          return true;
        })
      );
    }
  },

  take: {
    id: 'take',
    name: 'take',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'take<T>(count: number): OperatorFunction<T, T>',
    summary: 'Emits only the first count values emitted by the source Observable, then completes immediately.',
    description: 'Subscribes to source and emits up to count values. Once count values are emitted, it uncouples and completes synchronously, preventing resource leaks.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--10----20----30----40----|',
      operator: 'take(2)',
      output: '--10----20|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'count', name: 'Take Count', type: 'number', defaultValue: 2, min: 0, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'count', name: 'Take Count', type: 'number', defaultValue: 2 }],
      description: 'Limits stream to first N emissions and completes.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 10, displayLabel: '10' }, { id: '2', timeMs: 400, value: 20, displayLabel: '20' }, { id: '3', timeMs: 600, value: 30, displayLabel: '30' }] }],
      outputStream: { id: 'out', label: 'take(2)', emissions: [{ id: 'o1', timeMs: 200, value: 10, displayLabel: '10' }, { id: 'o2', timeMs: 400, value: 20, displayLabel: '20' }], completedAtMs: 400 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { take } from 'rxjs/operators';

of(10, 20, 30, 40)
  .pipe(take(2))
  .subscribe(console.log); // 10, 20`,
    codeExample: `import { of } from 'rxjs';
import { take } from 'rxjs/operators';

of(1, 2, 3, 4).pipe(take(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'position', label: 'Position Sampled', description: 'Head vs Tail' }],
      items: [
        { id: 'take', name: 'take', recommendedUse: 'Taking initial N items', characteristics: { position: { text: 'Head (first N)', status: 'positive' } } },
        { id: 'takeLast', name: 'takeLast', recommendedUse: 'Taking final N items upon completion', characteristics: { position: { text: 'Tail (last N)', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What does take(0) do?',
        options: [
          { id: 'A', text: 'Throws an ArgumentOutOfRange error' },
          { id: 'B', text: 'Emits 0' },
          { id: 'C', text: 'Completes synchronously with zero emissions' },
          { id: 'D', text: 'Emits all values' }
        ],
        correctOptionId: 'C',
        explanation: 'take(0) emits nothing and immediately sends a complete notification.'
      }
    ],
        useCases: [
      "Fetching an initial snapshot of data from a long-lived Observable (e.g. take(1) to read current user state once)",
      "Limiting search results or auto-suggest recommendations to top N matches",
      "Preventing memory leaks by automatically unsubscribing after a single HTTP or Signal emission"
    ],
    pitfalls: [
      "take(N) immediately completes the Observable as soon as N values are emitted, which triggers teardown logic upstream",
      "take(0) completes immediately and synchronously without emitting any values"
    ],
    relatedOperators: ["takeUntil","takeWhile","first"],
    docUrl: "https://rxjs.dev/api/operators/take",
    metadata: {

      name: 'take',
      category: 'Filtering',
      signature: 'take<T>(count: number): OperatorFunction<T, T>',
      summary: 'Emits only the first N values.',
      description: 'Takes first count items and unsubscribes.',
      difficulty: 'beginner',
      useCases: [
        "Fetching an initial snapshot of data from a long-lived Observable (e.g. take(1) to read current user state once)",
        "Limiting search results or auto-suggest recommendations to top N matches",
        "Preventing memory leaks by automatically unsubscribing after a single HTTP or Signal emission"
      ],
      pitfalls: [
        "take(N) immediately completes the Observable as soon as N values are emitted, which triggers teardown logic upstream",
        "take(0) completes immediately and synchronously without emitting any values"
      ],
      relatedOperators: ["takeUntil","takeWhile","first"],
      docUrl: "https://rxjs.dev/api/operators/take"
    },
    pipelineFactory: (source$, params) => {
      const cnt = params['count'] !== undefined ? params['count'] : 2;
      return source$.pipe(take(cnt));
    }
  },

  takeLast: {
    id: 'takeLast',
    name: 'takeLast',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'takeLast<T>(count: number): OperatorFunction<T, T>',
    summary: 'Waits for the source Observable to complete, then emits the last count values.',
    description: 'Buffers the most recent count values in an internal ring buffer. When source completes, it flushes the buffered items synchronously.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      operator: 'takeLast(2)',
      output: '-----------------4--5|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'count', name: 'Last N Count', type: 'number', defaultValue: 2, min: 1, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'count', name: 'Count', type: 'number', defaultValue: 2 }],
      description: 'Buffers values and emits the final N items upon completion.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 700 }],
      outputStream: { id: 'out', label: 'takeLast(2)', emissions: [{ id: 'o1', timeMs: 700, value: 2, displayLabel: '2' }, { id: 'o2', timeMs: 900, value: 3, displayLabel: '3' }], completedAtMs: 1100 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { takeLast } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(takeLast(2))
  .subscribe(console.log); // 4, 5`,
    codeExample: `import { of } from 'rxjs';
import { takeLast } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(takeLast(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'completeReq', label: 'Requires Completion', description: 'Waits for source completion' }],
      items: [
        { id: 'takeLast', name: 'takeLast', recommendedUse: 'Inspecting trailing stream items', characteristics: { completeReq: { text: 'Yes, mandatory', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if takeLast(3) is applied to an infinite stream like interval(100)?',
        options: [
          { id: 'A', text: 'It emits every 3 items' },
          { id: 'B', text: 'It never emits because the source never completes' },
          { id: 'C', text: 'It throws an OutOfMemoryError' },
          { id: 'D', text: 'It emits the first 3 items' }
        ],
        correctOptionId: 'B',
        explanation: 'takeLast must wait for the source to complete to determine which items are the final ones.'
      }
    ],
        useCases: [
      "Retrieving the final N items of a finite sequence (e.g. last 3 search queries before session end)",
      "Getting the tail lines of a completed log stream or terminal output",
      "Checking the final ending state transitions of an animation sequence"
    ],
    pitfalls: [
      "takeLast will NEVER emit anything until the source completes; on infinite streams (like interval() or DOM clicks), it will never emit",
      "Emissions from takeLast arrive in rapid synchronous succession upon source completion, not at their original emission times"
    ],
    relatedOperators: ["take","skipLast","reduce"],
    docUrl: "https://rxjs.dev/api/operators/takeLast",
    metadata: {

      name: 'takeLast',
      category: 'Filtering',
      signature: 'takeLast<T>(count: number): OperatorFunction<T, T>',
      summary: 'Emits last N values upon completion.',
      description: 'Tail sampling operator.',
      difficulty: 'intermediate',
      useCases: [
        "Retrieving the final N items of a finite sequence (e.g. last 3 search queries before session end)",
        "Getting the tail lines of a completed log stream or terminal output",
        "Checking the final ending state transitions of an animation sequence"
      ],
      pitfalls: [
        "takeLast will NEVER emit anything until the source completes; on infinite streams (like interval() or DOM clicks), it will never emit",
        "Emissions from takeLast arrive in rapid synchronous succession upon source completion, not at their original emission times"
      ],
      relatedOperators: ["take","skipLast","reduce"],
      docUrl: "https://rxjs.dev/api/operators/takeLast"
    },
    pipelineFactory: (source$, params) => {
      const cnt = params['count'] ?? 2;
      return source$.pipe(takeLast(cnt));
    }
  },

  takeUntil: {
    id: 'takeUntil',
    name: 'takeUntil',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'takeUntil<T>(notifier: Observable<any>): OperatorFunction<T, T>',
    summary: 'Emits values until a second Observable emits, then completes immediately.',
    description: 'The golden standard operator for declarative subscription teardown and avoiding memory leaks in Angular components.',
    difficulty: 'intermediate',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Emit Teardown Signal (notifier$)',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      secondaryInput: '-------S---------|',
      operator: 'takeUntil(notifier$)',
      output: '--1--2-|'
    },
    defaultSourcePreset: 'interval',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [],
      description: 'Stream emits until the notifier signal is fired, then tears down immediately.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'takeUntil(notifier)', emissions: [{ id: 'o1', timeMs: 300, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 600, value: 2, displayLabel: '2' }], completedAtMs: 700 }
    },
    codeSnippet: `import { interval, fromEvent } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const stopBtn = document.getElementById('stopBtn')!;
const stop$ = fromEvent(stopBtn, 'click');

interval(500)
  .pipe(takeUntil(stop$))
  .subscribe(console.log);`,
    codeExample: `import { interval, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

const destroy$ = new Subject<void>();
interval(500).pipe(takeUntil(destroy$)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'teardown', label: 'Teardown Pattern', description: 'Unsubscription pattern' }],
      items: [
        { id: 'takeUntil', name: 'takeUntil', recommendedUse: 'Declarative component unsubscription', characteristics: { teardown: { text: 'Automatic complete upon notifier emission', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Why should takeUntil() typically be the last operator in a pipe() chain?',
        options: [
          { id: 'A', text: 'To prevent subsequent operators from continuing to run or leaking inner subscriptions after cancellation' },
          { id: 'B', text: 'Because RxJS will fail to compile otherwise' },
          { id: 'C', text: 'To speed up HTTP requests' },
          { id: 'D', text: 'It has no effect on order' }
        ],
        correctOptionId: 'A',
        explanation: 'Placing takeUntil last guarantees that any upstream or inner operators are cleanly torn down when cancellation occurs.'
      }
    ],
        useCases: [
      "Unsubscribing from component streams when an Angular component destroys (takeUntil(this.destroy$))",
      "Canceling active background polling or file downloads when a user clicks 'Cancel' or navigates away",
      "Managing drag gestures by listening to mousemove until mouseup emits (mousemove$.pipe(takeUntil(mouseup$)))"
    ],
    pitfalls: [
      "Place takeUntil as the LAST operator in your pipe() chain so that teardown cleanups in preceding operators execute properly",
      "The notifier MUST emit a next notification (not just complete) to trigger unsubscription in standard RxJS 7"
    ],
    relatedOperators: ["takeWhile","skipUntil","take"],
    docUrl: "https://rxjs.dev/api/operators/takeUntil",
    metadata: {

      name: 'takeUntil',
      category: 'Filtering',
      signature: 'takeUntil<T>(notifier: Observable<any>): OperatorFunction<T, T>',
      summary: 'Emits values until notifier emits.',
      description: 'Declarative unsubscription operator.',
      difficulty: 'intermediate',
      useCases: [
        "Unsubscribing from component streams when an Angular component destroys (takeUntil(this.destroy$))",
        "Canceling active background polling or file downloads when a user clicks 'Cancel' or navigates away",
        "Managing drag gestures by listening to mousemove until mouseup emits (mousemove$.pipe(takeUntil(mouseup$)))"
      ],
      pitfalls: [
        "Place takeUntil as the LAST operator in your pipe() chain so that teardown cleanups in preceding operators execute properly",
        "The notifier MUST emit a next notification (not just complete) to trigger unsubscription in standard RxJS 7"
      ],
      relatedOperators: ["takeWhile","skipUntil","take"],
      docUrl: "https://rxjs.dev/api/operators/takeUntil"
    },
    pipelineFactory: (source$, _, context) => {
      const notifier$ = context.notifier$ || timer(1500);
      return source$.pipe(takeUntil(notifier$));
    }
  },

  takeWhile: {
    id: 'takeWhile',
    name: 'takeWhile',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'takeWhile<T>(predicate: (value: T, index: number) => boolean, inclusive = false): OperatorFunction<T, T>',
    summary: 'Emits values emitted by the source Observable so long as each value satisfies the specified predicate.',
    description: 'Completes the Observable sequence as soon as the predicate returns false. The inclusive flag allows emitting the first failing item.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--3--1--|',
      operator: 'takeWhile(x => x < 3)',
      output: '--1--2|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'threshold', name: 'Max Value (< N)', type: 'number', defaultValue: 3, min: 1, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'threshold', name: 'Threshold', type: 'number', defaultValue: 3 }],
      description: 'Emits values until an item reaches or exceeds the threshold.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }] }],
      outputStream: { id: 'out', label: 'takeWhile(x < 3)', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 400, value: 2, displayLabel: '2' }], completedAtMs: 600 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

of(1, 2, 3, 1, 2)
  .pipe(takeWhile(x => x < 3))
  .subscribe(console.log); // 1, 2`,
    codeExample: `import { of } from 'rxjs';
import { takeWhile } from 'rxjs/operators';

of(1, 2, 3, 1).pipe(takeWhile(x => x < 3)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'behavior', label: 'Behavior on False', description: 'Response to failing predicate' }],
      items: [
        { id: 'takeWhile', name: 'takeWhile', recommendedUse: 'Prefix condition gating', characteristics: { behavior: { text: 'Completes stream permanently', status: 'positive' } } },
        { id: 'filter', name: 'filter', recommendedUse: 'Per-item condition test', characteristics: { behavior: { text: 'Drops item and continues listening', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'If source emits [1, 2, 5, 2, 1] with takeWhile(x => x < 3), what values emit?',
        options: [
          { id: 'A', text: '[1, 2, 2, 1]' },
          { id: 'B', text: '[1, 2]' },
          { id: 'C', text: '[1, 2, 5]' },
          { id: 'D', text: '[5]' }
        ],
        correctOptionId: 'B',
        explanation: 'Once 5 violates the condition (x < 3), takeWhile completes immediately and ignores any subsequent matching values.'
      }
    ],
        useCases: [
      "Streaming game tick events while player health remains above 0 (takeWhile(hp => hp > 0))",
      "Polling server job status until status changes from 'PENDING' to 'COMPLETED'",
      "Reading values from a paginated API stream while page.hasMore === true"
    ],
    pitfalls: [
      "By default, takeWhile drops the value that failed the predicate; use the inclusive flag takeWhile(predicate, true) if you need the terminating item emitted",
      "Once the predicate returns false, takeWhile completes the stream; it will never resume even if subsequent source emissions would satisfy the predicate"
    ],
    relatedOperators: ["filter","takeUntil","skipWhile"],
    docUrl: "https://rxjs.dev/api/operators/takeWhile",
    metadata: {

      name: 'takeWhile',
      category: 'Filtering',
      signature: 'takeWhile<T>(predicate: (value: T) => boolean): OperatorFunction<T, T>',
      summary: 'Emits values while predicate returns true.',
      description: 'Terminating prefix filter.',
      difficulty: 'beginner',
      useCases: [
        "Streaming game tick events while player health remains above 0 (takeWhile(hp => hp > 0))",
        "Polling server job status until status changes from 'PENDING' to 'COMPLETED'",
        "Reading values from a paginated API stream while page.hasMore === true"
      ],
      pitfalls: [
        "By default, takeWhile drops the value that failed the predicate; use the inclusive flag takeWhile(predicate, true) if you need the terminating item emitted",
        "Once the predicate returns false, takeWhile completes the stream; it will never resume even if subsequent source emissions would satisfy the predicate"
      ],
      relatedOperators: ["filter","takeUntil","skipWhile"],
      docUrl: "https://rxjs.dev/api/operators/takeWhile"
    },
    pipelineFactory: (source$, params) => {
      const th = params['threshold'] ?? 3;
      return source$.pipe(takeWhile(x => (typeof x === 'number' ? x < th : true)));
    }
  },

  skip: {
    id: 'skip',
    name: 'skip',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'skip<T>(count: number): OperatorFunction<T, T>',
    summary: 'Returns an Observable that skips the first count items emitted by the source Observable.',
    description: 'Ignores the leading count items from the stream, and begins forwarding items starting with emission count + 1.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      operator: 'skip(2)',
      output: '--------3--4--5--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'count', name: 'Skip Count', type: 'number', defaultValue: 2, min: 0, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'count', name: 'Skip Count', type: 'number', defaultValue: 2 }],
      description: 'Ignores initial N emissions.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }] }],
      outputStream: { id: 'out', label: 'skip(2)', emissions: [{ id: 'o1', timeMs: 600, value: 3, displayLabel: '3' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { skip } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(skip(2))
  .subscribe(console.log); // 3, 4, 5`,
    codeExample: `import { of } from 'rxjs';
import { skip } from 'rxjs/operators';

of(1, 2, 3, 4).pipe(skip(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'offset', label: 'Offset Filter', description: 'Starting position' }],
      items: [
        { id: 'skip', name: 'skip', recommendedUse: 'Skipping initial seed or header rows', characteristics: { offset: { text: 'Drops initial N items', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When is skip(1) commonly used in Angular reactive programming?',
        options: [
          { id: 'A', text: 'To ignore the initial synchronous value emitted by a BehaviorSubject or form control' },
          { id: 'B', text: 'To double all numbers' },
          { id: 'C', text: 'To cancel an HTTP request' },
          { id: 'D', text: 'To wait 1 second' }
        ],
        correctOptionId: 'A',
        explanation: 'BehaviorSubject emits its initial value immediately on subscription. skip(1) allows listening only to subsequent user updates.'
      }
    ],
        useCases: [
      "Ignoring the initial default or placeholder value emitted by a BehaviorSubject or form control",
      "Skipping table header rows when parsing CSV or streaming file lines",
      "Bypassing the initial setup event of a sensor or hardware stream"
    ],
    pitfalls: [
      "If the source emits fewer than N items in total before completing, skip will complete with zero emissions",
      "Negative skip counts throw an ArgumentOutOfRangeError in strict RxJS runtimes"
    ],
    relatedOperators: ["take","skipUntil","skipWhile"],
    docUrl: "https://rxjs.dev/api/operators/skip",
    metadata: {

      name: 'skip',
      category: 'Filtering',
      signature: 'skip<T>(count: number): OperatorFunction<T, T>',
      summary: 'Skips first count items.',
      description: 'Prefix skipping operator.',
      difficulty: 'beginner',
      useCases: [
        "Ignoring the initial default or placeholder value emitted by a BehaviorSubject or form control",
        "Skipping table header rows when parsing CSV or streaming file lines",
        "Bypassing the initial setup event of a sensor or hardware stream"
      ],
      pitfalls: [
        "If the source emits fewer than N items in total before completing, skip will complete with zero emissions",
        "Negative skip counts throw an ArgumentOutOfRangeError in strict RxJS runtimes"
      ],
      relatedOperators: ["take","skipUntil","skipWhile"],
      docUrl: "https://rxjs.dev/api/operators/skip"
    },
    pipelineFactory: (source$, params) => {
      const cnt = params['count'] ?? 2;
      return source$.pipe(skip(cnt));
    }
  },

  skipLast: {
    id: 'skipLast',
    name: 'skipLast',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'skipLast<T>(count: number): OperatorFunction<T, T>',
    summary: 'Skip a specified number of values at the end of an Observable sequence.',
    description: 'Delays emission by an internal queue of size count so that when source completes, the last count items are dropped.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      operator: 'skipLast(2)',
      output: '--------1--2--3--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'count', name: 'Skip Last N', type: 'number', defaultValue: 2, min: 1, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'count', name: 'Skip Last N', type: 'number', defaultValue: 2 }],
      description: 'Omits the final N emissions of the stream.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }] }],
      outputStream: { id: 'out', label: 'skipLast(2)', emissions: [{ id: 'o1', timeMs: 600, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { skipLast } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(skipLast(2))
  .subscribe(console.log); // 1, 2, 3`,
    codeExample: `import { of } from 'rxjs';
import { skipLast } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(skipLast(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'tail', label: 'Tail Handling', description: 'How tail is trimmed' }],
      items: [
        { id: 'skipLast', name: 'skipLast', recommendedUse: 'Dropping trailing footer or summary items', characteristics: { tail: { text: 'Drops last N items', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Why does skipLast introduce a delay of count emissions?',
        options: [
          { id: 'A', text: 'It needs to buffer items to know if a given item will turn out to be one of the last N' },
          { id: 'B', text: 'It uses setTimeout internally' },
          { id: 'C', text: 'It waits for network responses' },
          { id: 'D', text: 'It does not delay emissions' }
        ],
        correctOptionId: 'A',
        explanation: 'Because streams are asynchronous, skipLast cannot know which items are the final N until completion.'
      }
    ],
        useCases: [
      "Ignoring trailing footer rows or EOF marker emissions from a completed data stream",
      "Omitting the last N historical records when preparing a trailing data comparison",
      "Discarding trailing debounce artifacts upon batch process termination"
    ],
    pitfalls: [
      "skipLast introduces an internal queue delay: it cannot emit item X until N subsequent items have arrived from the source",
      "On infinite streams, items are delayed by N emissions; on finite streams with fewer than N items, nothing is ever emitted"
    ],
    relatedOperators: ["takeLast","skip","take"],
    docUrl: "https://rxjs.dev/api/operators/skipLast",
    metadata: {

      name: 'skipLast',
      category: 'Filtering',
      signature: 'skipLast<T>(count: number): OperatorFunction<T, T>',
      summary: 'Skips last count values at the end of stream.',
      description: 'Tail suppression operator.',
      difficulty: 'intermediate',
      useCases: [
        "Ignoring trailing footer rows or EOF marker emissions from a completed data stream",
        "Omitting the last N historical records when preparing a trailing data comparison",
        "Discarding trailing debounce artifacts upon batch process termination"
      ],
      pitfalls: [
        "skipLast introduces an internal queue delay: it cannot emit item X until N subsequent items have arrived from the source",
        "On infinite streams, items are delayed by N emissions; on finite streams with fewer than N items, nothing is ever emitted"
      ],
      relatedOperators: ["takeLast","skip","take"],
      docUrl: "https://rxjs.dev/api/operators/skipLast"
    },
    pipelineFactory: (source$, params) => {
      const cnt = params['count'] ?? 2;
      return source$.pipe(skipLast(cnt));
    }
  },

  skipUntil: {
    id: 'skipUntil',
    name: 'skipUntil',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'skipUntil<T>(notifier: Observable<any>): OperatorFunction<T, T>',
    summary: 'Returns an Observable that skips items emitted by the source until a second Observable emits.',
    description: 'Ignores all emissions until the secondary notifier emits its first value, after which all subsequent source emissions are passed through.',
    difficulty: 'intermediate',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Start Passing Emissions (notifier$)',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      secondaryInput: '-------S---------|',
      operator: 'skipUntil(notifier$)',
      output: '----------4--5---|'
    },
    defaultSourcePreset: 'interval',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [],
      description: 'Ignores emissions until the notifier signal fires.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }, { id: '3', timeMs: 900, value: 3, displayLabel: '3' }] }],
      outputStream: { id: 'out', label: 'skipUntil', emissions: [{ id: 'o1', timeMs: 900, value: 3, displayLabel: '3' }] }
    },
    codeSnippet: `import { interval, fromEvent } from 'rxjs';
import { skipUntil } from 'rxjs/operators';

const startBtn = document.getElementById('startBtn')!;
const start$ = fromEvent(startBtn, 'click');

interval(500)
  .pipe(skipUntil(start$))
  .subscribe(console.log);`,
    codeExample: `import { interval, Subject } from 'rxjs';
import { skipUntil } from 'rxjs/operators';

const trigger$ = new Subject();
interval(300).pipe(skipUntil(trigger$)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'gate', label: 'Stream Gating', description: 'When gate opens' }],
      items: [
        { id: 'skipUntil', name: 'skipUntil', recommendedUse: 'Delayed activation on external event', characteristics: { gate: { text: 'Opens gate on notifier emission', status: 'positive' } } },
        { id: 'takeUntil', name: 'takeUntil', recommendedUse: 'Cancellation on external event', characteristics: { gate: { text: 'Closes gate on notifier emission', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if the notifier Observable never emits in skipUntil()?',
        options: [
          { id: 'A', text: 'All items are emitted' },
          { id: 'B', text: 'Zero items are emitted; the stream completes when the source completes' },
          { id: 'C', text: 'It throws an error' },
          { id: 'D', text: 'It emits only the last item' }
        ],
        correctOptionId: 'B',
        explanation: 'If notifier never emits, the gate never opens, and no source items will ever be emitted.'
      }
    ],
        useCases: [
      "Suppressing telemetry or user interaction streams until application initialization or authentication completes",
      "Ignoring mousemove coordinates until a mousedown event initiates a dragging operation",
      "Delaying chart updates until initial 3D canvas rendering is fully ready"
    ],
    pitfalls: [
      "All source values emitted before the notifier emits are permanently discarded",
      "If the notifier Observable completes without emitting a next value, skipUntil will discard ALL source values for the stream's entire lifetime"
    ],
    relatedOperators: ["takeUntil","skip","skipWhile"],
    docUrl: "https://rxjs.dev/api/operators/skipUntil",
    metadata: {

      name: 'skipUntil',
      category: 'Filtering',
      signature: 'skipUntil<T>(notifier: Observable<any>): OperatorFunction<T, T>',
      summary: 'Skips items until notifier emits.',
      description: 'Stream gating operator.',
      difficulty: 'intermediate',
      useCases: [
        "Suppressing telemetry or user interaction streams until application initialization or authentication completes",
        "Ignoring mousemove coordinates until a mousedown event initiates a dragging operation",
        "Delaying chart updates until initial 3D canvas rendering is fully ready"
      ],
      pitfalls: [
        "All source values emitted before the notifier emits are permanently discarded",
        "If the notifier Observable completes without emitting a next value, skipUntil will discard ALL source values for the stream's entire lifetime"
      ],
      relatedOperators: ["takeUntil","skip","skipWhile"],
      docUrl: "https://rxjs.dev/api/operators/skipUntil"
    },
    pipelineFactory: (source$, _, context) => {
      const notifier$ = context.notifier$ || timer(600);
      return source$.pipe(skipUntil(notifier$));
    }
  },

  skipWhile: {
    id: 'skipWhile',
    name: 'skipWhile',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'skipWhile<T>(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>',
    summary: 'Returns an Observable that skips all items emitted by the source as long as a specified condition holds true.',
    description: 'Skips items until predicate returns false for the first time. From that moment forward, ALL subsequent items are emitted without re-checking.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--3--1--|',
      operator: 'skipWhile(x => x < 3)',
      output: '--------3--1--|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'threshold', name: 'Skip While (< N)', type: 'number', defaultValue: 3, min: 1, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'threshold', name: 'Threshold', type: 'number', defaultValue: 3 }],
      description: 'Skips leading items that satisfy condition, then emits all subsequent values.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 3, displayLabel: '3' }, { id: '4', timeMs: 800, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'skipWhile(x < 3)', emissions: [{ id: 'o1', timeMs: 600, value: 3, displayLabel: '3' }, { id: 'o2', timeMs: 800, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { skipWhile } from 'rxjs/operators';

of(1, 2, 3, 1, 2)
  .pipe(skipWhile(x => x < 3))
  .subscribe(console.log); // 3, 1, 2`,
    codeExample: `import { of } from 'rxjs';
import { skipWhile } from 'rxjs/operators';

of(1, 2, 3, 1).pipe(skipWhile(x => x < 3)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'latch', label: 'Latch Behavior', description: 'Predicate re-evaluation' }],
      items: [
        { id: 'skipWhile', name: 'skipWhile', recommendedUse: 'Prefix skipping', characteristics: { latch: { text: 'Disables predicate permanently after first false', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does skipWhile continue checking the predicate after the first failing item?',
        options: [
          { id: 'A', text: 'Yes, it checks every item' },
          { id: 'B', text: 'No, once the condition fails, all remaining items are mirrored directly' },
          { id: 'C', text: 'Only on numbers' },
          { id: 'D', text: 'Only in RxJS 7' }
        ],
        correctOptionId: 'B',
        explanation: 'skipWhile is a one-way gate. Once an emission produces false, the gate stays open permanently.'
      }
    ],
        useCases: [
      "Ignoring sensor readings while temperature is below an operating threshold, then recording all subsequent data",
      "Bypassing pre-roll or loading frames until the stream payload signals the start of actual content",
      "Ignoring initial zero-value or uncalibrated readings from IoT devices"
    ],
    pitfalls: [
      "Once the predicate returns false for the first time, skipWhile mirrors ALL subsequent items without ever checking the predicate again",
      "If the predicate is always true, no items will ever be emitted even if thousands of source events occur"
    ],
    relatedOperators: ["takeWhile","filter","skipUntil"],
    docUrl: "https://rxjs.dev/api/operators/skipWhile",
    metadata: {

      name: 'skipWhile',
      category: 'Filtering',
      signature: 'skipWhile<T>(predicate: (value: T) => boolean): OperatorFunction<T, T>',
      summary: 'Skips items while predicate is true.',
      description: 'One-way prefix skipping.',
      difficulty: 'beginner',
      useCases: [
        "Ignoring sensor readings while temperature is below an operating threshold, then recording all subsequent data",
        "Bypassing pre-roll or loading frames until the stream payload signals the start of actual content",
        "Ignoring initial zero-value or uncalibrated readings from IoT devices"
      ],
      pitfalls: [
        "Once the predicate returns false for the first time, skipWhile mirrors ALL subsequent items without ever checking the predicate again",
        "If the predicate is always true, no items will ever be emitted even if thousands of source events occur"
      ],
      relatedOperators: ["takeWhile","filter","skipUntil"],
      docUrl: "https://rxjs.dev/api/operators/skipWhile"
    },
    pipelineFactory: (source$, params) => {
      const th = params['threshold'] ?? 3;
      return source$.pipe(skipWhile(x => (typeof x === 'number' ? x < th : false)));
    }
  },

  distinct: {
    id: 'distinct',
    name: 'distinct',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'distinct<T, K>(keySelector?: (value: T) => K, flushes?: Observable<any>): OperatorFunction<T, T>',
    summary: 'Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from previous items.',
    description: 'Maintains an internal Set of all past emissions across the lifetime of the stream, suppressing any value seen previously.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--2--1--3--|',
      operator: 'distinct()',
      output: '--1--2--------3--|'
    },
    defaultSourcePreset: 'duplicates',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'duplicates',
      params: [],
      description: 'Suppresses all duplicates across the lifetime of the stream.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }, { id: '3', timeMs: 600, value: 2, displayLabel: '2' }, { id: '4', timeMs: 800, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'distinct()', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 400, value: 2, displayLabel: '2' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { distinct } from 'rxjs/operators';

of(1, 2, 2, 1, 3, 2, 4)
  .pipe(distinct())
  .subscribe(console.log); // 1, 2, 3, 4`,
    codeExample: `import { of } from 'rxjs';
import { distinct } from 'rxjs/operators';

of(1, 2, 2, 1, 3).pipe(distinct()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'memory', label: 'Memory Retention', description: 'Tracks whole history vs consecutive' }],
      items: [
        { id: 'distinct', name: 'distinct', recommendedUse: 'Full lifetime uniqueness', characteristics: { memory: { text: 'Unbounded Set of all values', status: 'neutral' } } },
        { id: 'distinctUntilChanged', name: 'distinctUntilChanged', recommendedUse: 'Consecutive deduplication', characteristics: { memory: { text: 'Only remembers last single value (O(1))', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is a potential memory risk when using distinct() on infinite streams?',
        options: [
          { id: 'A', text: 'The internal Set grows without bound if the stream emits many unique values' },
          { id: 'B', text: 'It creates thread locks' },
          { id: 'C', text: 'It closes the connection' },
          { id: 'D', text: 'There is no memory risk' }
        ],
        correctOptionId: 'A',
        explanation: 'distinct() retains every unique item in an internal Set. Use flushes notifier or distinctUntilChanged if stream is unbounded.'
      }
    ],
        useCases: [
      "Filtering out duplicate search queries or unique user IDs across an entire user session",
      "Extracting unique tags or categories from a streaming catalog feed",
      "Ensuring each analytics event ID is processed exactly once"
    ],
    pitfalls: [
      "Distinct maintains an internal Set of all past emissions for the lifetime of the stream; in long-running streams with unbounded unique values, this causes memory leaks",
      "Use the optional flushes Observable parameter to periodically clear the internal Set if used in long-lived applications"
    ],
    relatedOperators: ["distinctUntilChanged","distinctUntilKeyChanged","filter"],
    docUrl: "https://rxjs.dev/api/operators/distinct",
    metadata: {

      name: 'distinct',
      category: 'Filtering',
      signature: 'distinct<T, K>(keySelector?: (value: T) => K): OperatorFunction<T, T>',
      summary: 'Emits items that are distinct across entire stream.',
      description: 'Global deduplication operator.',
      difficulty: 'intermediate',
      useCases: [
        "Filtering out duplicate search queries or unique user IDs across an entire user session",
        "Extracting unique tags or categories from a streaming catalog feed",
        "Ensuring each analytics event ID is processed exactly once"
      ],
      pitfalls: [
        "Distinct maintains an internal Set of all past emissions for the lifetime of the stream; in long-running streams with unbounded unique values, this causes memory leaks",
        "Use the optional flushes Observable parameter to periodically clear the internal Set if used in long-lived applications"
      ],
      relatedOperators: ["distinctUntilChanged","distinctUntilKeyChanged","filter"],
      docUrl: "https://rxjs.dev/api/operators/distinct"
    },
    pipelineFactory: source$ => source$.pipe(distinct())
  },

  distinctUntilChanged: {
    id: 'distinctUntilChanged',
    name: 'distinctUntilChanged',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'distinctUntilChanged<T, K>(comparator?: (previous: K, current: K) => boolean, keySelector?: (value: T) => K): OperatorFunction<T, T>',
    summary: 'Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from previous item.',
    description: 'Compares each emitted item against the IMMEDIATELY preceding item using strict equality (===). Consecutive duplicate emissions are suppressed.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--1--2--2--1--|',
      operator: 'distinctUntilChanged()',
      output: '--1-----2-----1--|'
    },
    defaultSourcePreset: 'duplicates',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'duplicates',
      params: [],
      description: 'Suppresses consecutive identical values.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 1, displayLabel: '1' }, { id: '3', timeMs: 600, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'distinctUntilChanged()', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 600, value: 2, displayLabel: '2' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

of(1, 1, 2, 2, 3, 1)
  .pipe(distinctUntilChanged())
  .subscribe(console.log); // 1, 2, 3, 1`,
    codeExample: `import { of } from 'rxjs';
import { distinctUntilChanged } from 'rxjs/operators';

of(1, 1, 2, 2, 1).pipe(distinctUntilChanged()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'memory', label: 'Memory Footprint', description: 'Space complexity' }],
      items: [
        { id: 'distinctUntilChanged', name: 'distinctUntilChanged', recommendedUse: 'Form input changes, UI state update deduplication', characteristics: { memory: { text: 'O(1) minimal memory', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'If the stream emits [1, 1, 2, 1], what does distinctUntilChanged() emit?',
        options: [
          { id: 'A', text: '[1, 2]' },
          { id: 'B', text: '[1, 2, 1]' },
          { id: 'C', text: '[1]' },
          { id: 'D', text: '[2, 1]' }
        ],
        correctOptionId: 'B',
        explanation: 'Only consecutive identical emissions are suppressed. The final 1 emits because the immediately preceding item was 2.'
      }
    ],
        useCases: [
      "Suppressing redundant HTTP search requests when input text has not actually changed",
      "Preventing unnecessary Angular component re-renders when a reactive store state property remains identical",
      "Filtering out duplicate consecutive GPS coordinate updates when stationary"
    ],
    pitfalls: [
      "Uses triple-equals (===) by default, so object literals { id: 1 } with identical content but different references are NOT considered duplicates; provide a custom comparator",
      "Only suppresses CONSECUTIVE duplicates; if value A is followed by B then A again, the second A WILL emit"
    ],
    relatedOperators: ["distinct","distinctUntilKeyChanged","debounceTime"],
    docUrl: "https://rxjs.dev/api/operators/distinctUntilChanged",
    metadata: {

      name: 'distinctUntilChanged',
      category: 'Filtering',
      signature: 'distinctUntilChanged<T>(): OperatorFunction<T, T>',
      summary: 'Emits items distinct from previous item.',
      description: 'Consecutive deduplication.',
      difficulty: 'beginner',
      useCases: [
        "Suppressing redundant HTTP search requests when input text has not actually changed",
        "Preventing unnecessary Angular component re-renders when a reactive store state property remains identical",
        "Filtering out duplicate consecutive GPS coordinate updates when stationary"
      ],
      pitfalls: [
        "Uses triple-equals (===) by default, so object literals { id: 1 } with identical content but different references are NOT considered duplicates; provide a custom comparator",
        "Only suppresses CONSECUTIVE duplicates; if value A is followed by B then A again, the second A WILL emit"
      ],
      relatedOperators: ["distinct","distinctUntilKeyChanged","debounceTime"],
      docUrl: "https://rxjs.dev/api/operators/distinctUntilChanged"
    },
    pipelineFactory: source$ => source$.pipe(distinctUntilChanged())
  },

  distinctUntilKeyChanged: {
    id: 'distinctUntilKeyChanged',
    name: 'distinctUntilKeyChanged',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'distinctUntilKeyChanged<T, K extends keyof T>(key: K): OperatorFunction<T, T>',
    summary: 'Returns an Observable that emits all items emitted by the source Observable that are distinct by comparison from previous item using a property key.',
    description: 'Compares the specified property on consecutive emitted objects and suppresses emissions when that property has not changed.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--{id:1}--{id:1}--{id:2}--{id:1}--|',
      operator: 'distinctUntilKeyChanged("id")',
      output: '--{id:1}----------{id:2}--{id:1}--|'
    },
    defaultSourcePreset: 'objects',
    parameters: [
      { id: 'key', name: 'Key Property', type: 'text', defaultValue: 'id' }
    ],
    interactiveConfig: {
      sourcePreset: 'objects',
      params: [{ id: 'key', name: 'Key Property', type: 'text', defaultValue: 'id' }],
      description: 'Suppresses consecutive object emissions when the specified key is unchanged.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'objects$', emissions: [{ id: '1', timeMs: 200, value: { id: 1 }, displayLabel: '{id:1}' }, { id: '2', timeMs: 400, value: { id: 1 }, displayLabel: '{id:1}' }] }],
      outputStream: { id: 'out', label: 'distinctUntilKeyChanged("id")', emissions: [{ id: 'o1', timeMs: 200, value: { id: 1 }, displayLabel: '{id:1}' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { distinctUntilKeyChanged } from 'rxjs/operators';

of({ id: 1, name: 'A' }, { id: 1, name: 'B' }, { id: 2, name: 'C' })
  .pipe(distinctUntilKeyChanged('id'))
  .subscribe(console.log); // { id: 1, name: 'A' }, { id: 2, name: 'C' }`,
    codeExample: `import { of } from 'rxjs';
import { distinctUntilKeyChanged } from 'rxjs/operators';

of({ id: 1 }, { id: 1 }, { id: 2 }).pipe(distinctUntilKeyChanged('id')).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'objectKey', label: 'Key Tracking', description: 'Targeted property check' }],
      items: [
        { id: 'distinctUntilKeyChanged', name: 'distinctUntilKeyChanged', recommendedUse: 'Entity ID or status field change detection', characteristics: { objectKey: { text: 'Convenient shorthand for property comparison', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is distinctUntilKeyChanged("name") equivalent to?',
        options: [
          { id: 'A', text: 'distinctUntilChanged((a, b) => a.name === b.name)' },
          { id: 'B', text: 'map(x => x.name)' },
          { id: 'C', text: 'filter(x => x.name)' },
          { id: 'D', text: 'pluck("name")' }
        ],
        correctOptionId: 'A',
        explanation: 'distinctUntilKeyChanged is a convenient shorthand for distinctUntilChanged with a comparator checking the specified key.'
      }
    ],
        useCases: [
      "Suppressing consecutive object emissions where a primary key (e.g. user.id or item.status) has not changed",
      "Ignoring UI state emissions when only irrelevant background flags changed while the active route ID stayed identical",
      "Filtering audio track change events when track ID remains identical"
    ],
    pitfalls: [
      "Like distinctUntilChanged, it only compares the immediate previous emission with the current one, not the full history",
      "Throws a runtime TypeError if an emitted item is null or undefined; use filter(Boolean) before this operator"
    ],
    relatedOperators: ["distinctUntilChanged","pluck","filter"],
    docUrl: "https://rxjs.dev/api/operators/distinctUntilKeyChanged",
    metadata: {

      name: 'distinctUntilKeyChanged',
      category: 'Filtering',
      signature: 'distinctUntilKeyChanged<T, K extends keyof T>(key: K): OperatorFunction<T, T>',
      summary: 'Emits items distinct by specified key property.',
      description: 'Key-based consecutive deduplication.',
      difficulty: 'intermediate',
      useCases: [
        "Suppressing consecutive object emissions where a primary key (e.g. user.id or item.status) has not changed",
        "Ignoring UI state emissions when only irrelevant background flags changed while the active route ID stayed identical",
        "Filtering audio track change events when track ID remains identical"
      ],
      pitfalls: [
        "Like distinctUntilChanged, it only compares the immediate previous emission with the current one, not the full history",
        "Throws a runtime TypeError if an emitted item is null or undefined; use filter(Boolean) before this operator"
      ],
      relatedOperators: ["distinctUntilChanged","pluck","filter"],
      docUrl: "https://rxjs.dev/api/operators/distinctUntilKeyChanged"
    },
    pipelineFactory: (source$, params) => {
      const k = (params['key'] ?? 'id') as any;
      return source$.pipe(distinctUntilKeyChanged(k));
    }
  },

  debounce: {
    id: 'debounce',
    name: 'debounce',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'debounce<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>',
    summary: 'Emits a notification from the source Observable only after a particular time span determined by another Observable has passed without another source emission.',
    description: 'Dynamic rate limiter that delays source emissions and cancels pending emissions whenever a new source item arrives before durationSelector emits.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--a-b------c----|',
      operator: 'debounce(() => timer(20))',
      output: '-----b-------c--|'
    },
    defaultSourcePreset: 'burst',
    parameters: [
      { id: 'durationMs', name: 'Debounce Duration (ms)', type: 'slider', defaultValue: 300, min: 50, max: 1000, step: 50, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'burst',
      params: [{ id: 'durationMs', name: 'Duration', type: 'slider', defaultValue: 300 }],
      description: 'Suppresses rapid bursts using dynamic Observable duration selector.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 100, value: 'a', displayLabel: 'a' }, { id: '2', timeMs: 200, value: 'b', displayLabel: 'b' }] }],
      outputStream: { id: 'out', label: 'debounce()', emissions: [{ id: 'o1', timeMs: 500, value: 'b', displayLabel: 'b' }] }
    },
    codeSnippet: `import { fromEvent, timer } from 'rxjs';
import { debounce } from 'rxjs/operators';

const input = document.querySelector('input')!;
fromEvent(input, 'input')
  .pipe(debounce(() => timer(300)))
  .subscribe(console.log);`,
    codeExample: `import { Subject, timer } from 'rxjs';
import { debounce } from 'rxjs/operators';

const src$ = new Subject();
src$.pipe(debounce(() => timer(200))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'flexibility', label: 'Flexibility', description: 'Fixed time vs dynamic Observable' }],
      items: [
        { id: 'debounce', name: 'debounce', recommendedUse: 'Variable or item-dependent pause windows', characteristics: { flexibility: { text: 'Dynamic Observable selector', status: 'positive' } } },
        { id: 'debounceTime', name: 'debounceTime', recommendedUse: 'Fixed millisecond pause windows', characteristics: { flexibility: { text: 'Fixed millisecond constant', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When is the value emitted in debounce()?',
        options: [
          { id: 'A', text: 'Immediately when source emits' },
          { id: 'B', text: 'When the durationSelector Observable emits, provided no newer source emission arrived in the meantime' },
          { id: 'C', text: 'Only upon complete' },
          { id: 'D', text: 'On every tick' }
        ],
        correctOptionId: 'B',
        explanation: 'Each new source item resets the duration timer. The most recent item is only emitted once the duration completes without interruption.'
      }
    ],
        useCases: [
      "Debouncing search inputs where the wait duration is dynamic (e.g. shorter pause for fast typers, longer for complex searches)",
      "Suppressing window resize recalculations with dynamic delay based on current CPU workload",
      "Buffering user scroll events with a duration determined by an auxiliary animation stream"
    ],
    pitfalls: [
      "The duration selector function must return an Observable or Promise; if it returns a primitive, a runtime error occurs",
      "If source completes before the duration selector emits, the pending item is emitted immediately upon completion"
    ],
    relatedOperators: ["debounceTime","throttle","audit"],
    docUrl: "https://rxjs.dev/api/operators/debounce",
    metadata: {

      name: 'debounce',
      category: 'Filtering',
      signature: 'debounce<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>',
      summary: 'Emits item only after durationSelector Observable emits.',
      description: 'Dynamic debounce operator.',
      difficulty: 'advanced',
      useCases: [
        "Debouncing search inputs where the wait duration is dynamic (e.g. shorter pause for fast typers, longer for complex searches)",
        "Suppressing window resize recalculations with dynamic delay based on current CPU workload",
        "Buffering user scroll events with a duration determined by an auxiliary animation stream"
      ],
      pitfalls: [
        "The duration selector function must return an Observable or Promise; if it returns a primitive, a runtime error occurs",
        "If source completes before the duration selector emits, the pending item is emitted immediately upon completion"
      ],
      relatedOperators: ["debounceTime","throttle","audit"],
      docUrl: "https://rxjs.dev/api/operators/debounce"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['durationMs'] ?? 300;
      return source$.pipe(debounce(() => timer(ms)));
    }
  },

  debounceTime: {
    id: 'debounceTime',
    name: 'debounceTime',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'debounceTime<T>(dueTime: number, scheduler?: SchedulerLike): OperatorFunction<T, T>',
    summary: 'Emits a notification from the source Observable only after a particular time span has passed without another source emission.',
    description: 'The standard operator for search autocomplete boxes and resize/scroll rate limiting. Drops intermediate emissions and only emits the last value after silence.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--a-b-c---------d-----|',
      operator: 'debounceTime(300)',
      output: '--------c-----------d-|'
    },
    defaultSourcePreset: 'burst',
    parameters: [
      { id: 'dueTimeMs', name: 'Due Time (ms)', type: 'slider', defaultValue: 300, min: 20, max: 1000, step: 20, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'burst',
      params: [{ id: 'dueTimeMs', name: 'Due Time', type: 'slider', defaultValue: 300 }],
      description: 'Delays emission until the specified silence pause has elapsed.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'input$', emissions: [{ id: '1', timeMs: 100, value: 'a', displayLabel: 'a' }, { id: '2', timeMs: 250, value: 'b', displayLabel: 'b' }, { id: '3', timeMs: 400, value: 'c', displayLabel: 'c' }] }],
      outputStream: { id: 'out', label: 'debounceTime(300)', emissions: [{ id: 'o1', timeMs: 700, value: 'c', displayLabel: 'c' }] }
    },
    codeSnippet: `import { fromEvent } from 'rxjs';
import { debounceTime, map, distinctUntilChanged } from 'rxjs/operators';

const searchInput = document.querySelector('input')!;
fromEvent(searchInput, 'input')
  .pipe(
    map((e: any) => e.target.value),
    debounceTime(300),
    distinctUntilChanged()
  )
  .subscribe(query => console.log('Search query:', query));`,
    codeExample: `import { Subject } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

const typing$ = new Subject<string>();
typing$.pipe(debounceTime(300)).subscribe(console.log);`,
    comparison: {
      features: [
        { id: 'strategy', label: 'Rate-Limit Strategy', description: 'When emission occurs' },
        { id: 'leading', label: 'Leading Emission', description: 'Emits first item immediately' }
      ],
      items: [
        { id: 'debounceTime', name: 'debounceTime', recommendedUse: 'Search autocomplete, typeahead search', characteristics: { strategy: { text: 'Waits for pause in typing', status: 'positive' }, leading: { text: 'No (trailing only)', status: 'neutral' } } },
        { id: 'throttleTime', name: 'throttleTime', recommendedUse: 'Scroll handling, button double-click spam prevention', characteristics: { strategy: { text: 'Emits immediately then locks out for period', status: 'positive' }, leading: { text: 'Yes (immediate response)', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Why is debounceTime(300) standard for search autocomplete inputs?',
        options: [
          { id: 'A', text: 'It prevents firing an API request on every keystroke while user is still typing' },
          { id: 'B', text: 'It caches the HTTP response' },
          { id: 'C', text: 'It converts strings to uppercase' },
          { id: 'D', text: 'It automatically retries errors' }
        ],
        correctOptionId: 'A',
        explanation: 'debounceTime waits until the user pauses typing for 300ms before triggering the search request, drastically reducing server load.'
      }
    ],
        useCases: [
      "Waiting for user to pause typing in a search input (e.g. 300ms) before triggering an API autocomplete request",
      "Preventing double-click accidental duplicate form submissions",
      "Rate-limiting window resize or scroll recalculations to run only after movement stops"
    ],
    pitfalls: [
      "DebounceTime discards all intermediate values during the quiet window, emitting only the latest value once the window expires",
      "If events arrive continuously without any pause greater than the specified duration, debounceTime will NEVER emit until source completion"
    ],
    relatedOperators: ["debounce","throttleTime","auditTime"],
    docUrl: "https://rxjs.dev/api/operators/debounceTime",
    metadata: {

      name: 'debounceTime',
      category: 'Filtering',
      signature: 'debounceTime<T>(dueTime: number): OperatorFunction<T, T>',
      summary: 'Emits value after dueTime passes without another emission.',
      description: 'Standard debounce timing operator.',
      difficulty: 'beginner',
      useCases: [
        "Waiting for user to pause typing in a search input (e.g. 300ms) before triggering an API autocomplete request",
        "Preventing double-click accidental duplicate form submissions",
        "Rate-limiting window resize or scroll recalculations to run only after movement stops"
      ],
      pitfalls: [
        "DebounceTime discards all intermediate values during the quiet window, emitting only the latest value once the window expires",
        "If events arrive continuously without any pause greater than the specified duration, debounceTime will NEVER emit until source completion"
      ],
      relatedOperators: ["debounce","throttleTime","auditTime"],
      docUrl: "https://rxjs.dev/api/operators/debounceTime"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['dueTimeMs'] ?? 300;
      return source$.pipe(debounceTime(ms));
    }
  },

  throttle: {
    id: 'throttle',
    name: 'throttle',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'throttle<T>(durationSelector: (value: T) => Observable<any>, config?: ThrottleConfig): OperatorFunction<T, T>',
    summary: 'Emits a value from the source Observable, then ignores subsequent source values for a duration determined by another Observable.',
    description: 'Dynamic throttle operator that suppresses subsequent values during the silence window returned by durationSelector.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--a-b-c---d-e---|',
      operator: 'throttle(() => timer(300))',
      output: '--a-------d-----|'
    },
    defaultSourcePreset: 'burst',
    parameters: [
      { id: 'durationMs', name: 'Throttle Window (ms)', type: 'slider', defaultValue: 300, min: 50, max: 1000, step: 50, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'burst',
      params: [{ id: 'durationMs', name: 'Window', type: 'slider', defaultValue: 300 }],
      description: 'Suppresses emissions during the duration selector window.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'clicks$', emissions: [{ id: '1', timeMs: 100, value: 'c1', displayLabel: 'c1' }, { id: '2', timeMs: 200, value: 'c2', displayLabel: 'c2' }] }],
      outputStream: { id: 'out', label: 'throttle', emissions: [{ id: 'o1', timeMs: 100, value: 'c1', displayLabel: 'c1' }] }
    },
    codeSnippet: `import { fromEvent, timer } from 'rxjs';
import { throttle } from 'rxjs/operators';

const clicks$ = fromEvent(document, 'click');
clicks$
  .pipe(throttle(() => timer(1000)))
  .subscribe(console.log);`,
    codeExample: `import { Subject, timer } from 'rxjs';
import { throttle } from 'rxjs/operators';

const src$ = new Subject();
src$.pipe(throttle(() => timer(300))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'dynamic', label: 'Dynamic Rate Limit', description: 'Observable window selector' }],
      items: [
        { id: 'throttle', name: 'throttle', recommendedUse: 'Dynamic rate limit windows based on emission value', characteristics: { dynamic: { text: 'Observable factory', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'By default, does throttle emit the leading or trailing value of the throttle duration?',
        options: [
          { id: 'A', text: 'Leading: true, Trailing: false' },
          { id: 'B', text: 'Leading: false, Trailing: true' },
          { id: 'C', text: 'Both leading and trailing' },
          { id: 'D', text: 'Neither' }
        ],
        correctOptionId: 'A',
        explanation: 'Default configuration is { leading: true, trailing: false }, emitting the first item immediately and discarding intermediate values.'
      }
    ],
        useCases: [
      "Emitting the first click immediately to trigger UI feedback, then ignoring subsequent clicks while a dynamic promise or lock Observable resolves",
      "Throttling network sync requests with dynamic cool-down periods governed by server response headers",
      "Rate-limiting game fire actions based on weapon cool-down timers"
    ],
    pitfalls: [
      "By default { leading: true, trailing: false }, so any emissions occurring during the throttle window are silently discarded",
      "Configure { leading: true, trailing: true } if you need the final trailing emission delivered after the cool-down expires"
    ],
    relatedOperators: ["throttleTime","debounce","audit"],
    docUrl: "https://rxjs.dev/api/operators/throttle",
    metadata: {

      name: 'throttle',
      category: 'Filtering',
      signature: 'throttle<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>',
      summary: 'Emits item then silences subsequent items via Observable duration.',
      description: 'Dynamic throttle operator.',
      difficulty: 'advanced',
      useCases: [
        "Emitting the first click immediately to trigger UI feedback, then ignoring subsequent clicks while a dynamic promise or lock Observable resolves",
        "Throttling network sync requests with dynamic cool-down periods governed by server response headers",
        "Rate-limiting game fire actions based on weapon cool-down timers"
      ],
      pitfalls: [
        "By default { leading: true, trailing: false }, so any emissions occurring during the throttle window are silently discarded",
        "Configure { leading: true, trailing: true } if you need the final trailing emission delivered after the cool-down expires"
      ],
      relatedOperators: ["throttleTime","debounce","audit"],
      docUrl: "https://rxjs.dev/api/operators/throttle"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['durationMs'] ?? 300;
      return source$.pipe(throttle(() => timer(ms)));
    }
  },

  throttleTime: {
    id: 'throttleTime',
    name: 'throttleTime',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'throttleTime<T>(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig): OperatorFunction<T, T>',
    summary: 'Emits a value from the source Observable, then ignores subsequent source values for duration milliseconds.',
    description: 'Immediate-response rate limiter. The first value is forwarded instantly; any subsequent emissions within duration ms are ignored.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--a-b-c---d-e---|',
      operator: 'throttleTime(300)',
      output: '--a-------d-----|'
    },
    defaultSourcePreset: 'burst',
    parameters: [
      { id: 'durationMs', name: 'Duration (ms)', type: 'slider', defaultValue: 300, min: 50, max: 1000, step: 50, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'burst',
      params: [{ id: 'durationMs', name: 'Duration', type: 'slider', defaultValue: 300 }],
      description: 'Emits first item immediately, then ignores values for duration ms.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'clicks$', emissions: [{ id: '1', timeMs: 100, value: '1', displayLabel: '1' }, { id: '2', timeMs: 200, value: '2', displayLabel: '2' }, { id: '3', timeMs: 600, value: '3', displayLabel: '3' }] }],
      outputStream: { id: 'out', label: 'throttleTime(300)', emissions: [{ id: 'o1', timeMs: 100, value: '1', displayLabel: '1' }, { id: 'o2', timeMs: 600, value: '3', displayLabel: '3' }] }
    },
    codeSnippet: `import { fromEvent } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

const button = document.querySelector('button')!;
fromEvent(button, 'click')
  .pipe(throttleTime(1000))
  .subscribe(() => console.log('Button clicked (guarded against spam)'));`,
    codeExample: `import { Subject } from 'rxjs';
import { throttleTime } from 'rxjs/operators';

const src$ = new Subject();
src$.pipe(throttleTime(300)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'spamGuard', label: 'Spam Prevention', description: 'Immediate response + lockout' }],
      items: [
        { id: 'throttleTime', name: 'throttleTime', recommendedUse: 'Button click submission, preventing duplicate transactions', characteristics: { spamGuard: { text: 'Executes immediately then protects window', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'How can you configure throttleTime to emit BOTH the leading and trailing item of a burst?',
        options: [
          { id: 'A', text: 'throttleTime(1000, asyncScheduler, { leading: true, trailing: true })' },
          { id: 'B', text: 'throttleTime(1000, "both")' },
          { id: 'C', text: 'Using throttleTime twice' },
          { id: 'D', text: 'It cannot be done' }
        ],
        correctOptionId: 'A',
        explanation: 'Passing { leading: true, trailing: true } emits the immediate first item AND the last item emitted within the throttle window.'
      }
    ],
        useCases: [
      "Limiting button clicks to at most once per 1000ms while guaranteeing immediate first-click execution",
      "Sampling high-frequency scroll or mousemove events at 60 FPS (approx. 16ms intervals)",
      "Rate-limiting API telemetry pings to a maximum rate (e.g. 1 per second)"
    ],
    pitfalls: [
      "Defaults to { leading: true, trailing: false }; if the user makes a final edit during the silence window, that final value will be lost unless trailing: true is passed",
      "Does not delay the initial emission (unlike debounceTime), making it unsuitable for search autocomplete where you want to wait for typing to stop"
    ],
    relatedOperators: ["throttle","debounceTime","auditTime"],
    docUrl: "https://rxjs.dev/api/operators/throttleTime",
    metadata: {

      name: 'throttleTime',
      category: 'Filtering',
      signature: 'throttleTime<T>(duration: number): OperatorFunction<T, T>',
      summary: 'Emits first item then ignores subsequent items for duration.',
      description: 'Immediate rate-limiter operator.',
      difficulty: 'beginner',
      useCases: [
        "Limiting button clicks to at most once per 1000ms while guaranteeing immediate first-click execution",
        "Sampling high-frequency scroll or mousemove events at 60 FPS (approx. 16ms intervals)",
        "Rate-limiting API telemetry pings to a maximum rate (e.g. 1 per second)"
      ],
      pitfalls: [
        "Defaults to { leading: true, trailing: false }; if the user makes a final edit during the silence window, that final value will be lost unless trailing: true is passed",
        "Does not delay the initial emission (unlike debounceTime), making it unsuitable for search autocomplete where you want to wait for typing to stop"
      ],
      relatedOperators: ["throttle","debounceTime","auditTime"],
      docUrl: "https://rxjs.dev/api/operators/throttleTime"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['durationMs'] ?? 300;
      return source$.pipe(throttleTime(ms));
    }
  },

  audit: {
    id: 'audit',
    name: 'audit',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'audit<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>',
    summary: 'Ignores source values for a duration determined by another Observable, then emits the most recent value from the source.',
    description: 'When an item arrives, audit silences output and starts a duration timer. When the timer fires, the most recent value received during that window is emitted.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--a-b-c---------d-----|',
      operator: 'audit(() => timer(300))',
      output: '--------c-----------d-|'
    },
    defaultSourcePreset: 'burst',
    parameters: [
      { id: 'durationMs', name: 'Audit Window (ms)', type: 'slider', defaultValue: 300, min: 50, max: 1000, step: 50, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'burst',
      params: [{ id: 'durationMs', name: 'Audit Window', type: 'slider', defaultValue: 300 }],
      description: 'Emits the most recent value after durationSelector fires.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 100, value: 'a', displayLabel: 'a' }, { id: '2', timeMs: 250, value: 'b', displayLabel: 'b' }] }],
      outputStream: { id: 'out', label: 'audit()', emissions: [{ id: 'o1', timeMs: 400, value: 'b', displayLabel: 'b' }] }
    },
    codeSnippet: `import { fromEvent, timer } from 'rxjs';
import { audit } from 'rxjs/operators';

const moves$ = fromEvent(document, 'mousemove');
moves$
  .pipe(audit(() => timer(200)))
  .subscribe(console.log);`,
    codeExample: `import { Subject, timer } from 'rxjs';
import { audit } from 'rxjs/operators';

const src$ = new Subject();
src$.pipe(audit(() => timer(200))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'timing', label: 'Emission Timing', description: 'When value is emitted' }],
      items: [
        { id: 'audit', name: 'audit', recommendedUse: 'Sampling high-frequency continuous events (pointermove, scroll)', characteristics: { timing: { text: 'Emits most recent item when duration expires', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the key difference between audit() and debounce()?',
        options: [
          { id: 'A', text: 'New emissions reset the timer in debounce(), whereas in audit() the timer continues running until expiration' },
          { id: 'B', text: 'audit is deprecated' },
          { id: 'C', text: 'debounce only works on numbers' },
          { id: 'D', text: 'audit emits the first item' }
        ],
        correctOptionId: 'A',
        explanation: 'In debounce(), every new arrival resets the silence timer. In audit(), the timer runs for a fixed window and then emits the latest value.'
      }
    ],
        useCases: [
      "Sampling the most recent sensor reading when an external hardware strobe or clock pulse fires",
      "Capturing the final scroll position within dynamic animation frame duration selector windows",
      "Recording the most recent cursor position before a canvas snapshot trigger"
    ],
    pitfalls: [
      "Unlike throttle, audit NEVER emits on the leading edge; it silences output until the duration Observable emits, then emits the most recent value",
      "If the source completes while an audit window is active, the pending value is dropped and never emitted"
    ],
    relatedOperators: ["auditTime","throttle","sample"],
    docUrl: "https://rxjs.dev/api/operators/audit",
    metadata: {

      name: 'audit',
      category: 'Filtering',
      signature: 'audit<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>',
      summary: 'Ignores values for duration, then emits most recent value.',
      description: 'Windowed trailing emission operator.',
      difficulty: 'advanced',
      useCases: [
        "Sampling the most recent sensor reading when an external hardware strobe or clock pulse fires",
        "Capturing the final scroll position within dynamic animation frame duration selector windows",
        "Recording the most recent cursor position before a canvas snapshot trigger"
      ],
      pitfalls: [
        "Unlike throttle, audit NEVER emits on the leading edge; it silences output until the duration Observable emits, then emits the most recent value",
        "If the source completes while an audit window is active, the pending value is dropped and never emitted"
      ],
      relatedOperators: ["auditTime","throttle","sample"],
      docUrl: "https://rxjs.dev/api/operators/audit"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['durationMs'] ?? 300;
      return source$.pipe(audit(() => timer(ms)));
    }
  },

  auditTime: {
    id: 'auditTime',
    name: 'auditTime',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'auditTime<T>(duration: number, scheduler?: SchedulerLike): OperatorFunction<T, T>',
    summary: 'Ignores source values for duration milliseconds, then emits the most recent value from the source Observable.',
    description: 'Fixed-duration trailing sampling operator. Ideal for sampling mousemove or canvas drawing coordinates.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--a-b-c---------d-----|',
      operator: 'auditTime(300)',
      output: '--------c-----------d-|'
    },
    defaultSourcePreset: 'burst',
    parameters: [
      { id: 'durationMs', name: 'Duration (ms)', type: 'slider', defaultValue: 300, min: 50, max: 1000, step: 50, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'burst',
      params: [{ id: 'durationMs', name: 'Duration', type: 'slider', defaultValue: 300 }],
      description: 'Ignores emissions for duration ms then emits most recent value.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 100, value: 1, displayLabel: '1' }, { id: '2', timeMs: 250, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'auditTime(300)', emissions: [{ id: 'o1', timeMs: 400, value: 2, displayLabel: '2' }] }
    },
    codeSnippet: `import { fromEvent } from 'rxjs';
import { auditTime } from 'rxjs/operators';

const scroll$ = fromEvent(window, 'scroll');
scroll$
  .pipe(auditTime(100))
  .subscribe(() => console.log('Sampled scroll position:', window.scrollY));`,
    codeExample: `import { Subject } from 'rxjs';
import { auditTime } from 'rxjs/operators';

const src$ = new Subject();
src$.pipe(auditTime(200)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'sampling', label: 'Sampling Logic', description: 'Sample on timer expiration' }],
      items: [
        { id: 'auditTime', name: 'auditTime', recommendedUse: 'High-frequency scroll and resize handlers', characteristics: { sampling: { text: 'Emits last value at end of interval', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does auditTime emit a value if NO source items arrived during the duration?',
        options: [
          { id: 'A', text: 'Yes, it emits null' },
          { id: 'B', text: 'No, auditTime is only activated when a source item arrives' },
          { id: 'C', text: 'It emits undefined' },
          { id: 'D', text: 'It emits the value from the previous window' }
        ],
        correctOptionId: 'B',
        explanation: 'auditTime only starts its timer when triggered by an incoming source emission.'
      }
    ],
        useCases: [
      "Ignoring burst emissions and emitting only the latest value after a fixed duration (e.g. sampling window resize dimensions every 200ms)",
      "Updating a real-time price dashboard with the latest ticker price every 500ms without queuing stale updates",
      "Capturing the latest scroll position at periodic intervals during continuous scrolling"
    ],
    pitfalls: [
      "AuditTime does NOT emit immediately on the first event; it always waits for the timer duration to expire before emitting",
      "If the source Observable completes during the wait window, the pending value will NOT be emitted"
    ],
    relatedOperators: ["audit","throttleTime","debounceTime"],
    docUrl: "https://rxjs.dev/api/operators/auditTime",
    metadata: {

      name: 'auditTime',
      category: 'Filtering',
      signature: 'auditTime<T>(duration: number): OperatorFunction<T, T>',
      summary: 'Ignores values for duration, then emits most recent value.',
      description: 'Time-windowed trailing sampling.',
      difficulty: 'intermediate',
      useCases: [
        "Ignoring burst emissions and emitting only the latest value after a fixed duration (e.g. sampling window resize dimensions every 200ms)",
        "Updating a real-time price dashboard with the latest ticker price every 500ms without queuing stale updates",
        "Capturing the latest scroll position at periodic intervals during continuous scrolling"
      ],
      pitfalls: [
        "AuditTime does NOT emit immediately on the first event; it always waits for the timer duration to expire before emitting",
        "If the source Observable completes during the wait window, the pending value will NOT be emitted"
      ],
      relatedOperators: ["audit","throttleTime","debounceTime"],
      docUrl: "https://rxjs.dev/api/operators/auditTime"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['durationMs'] ?? 300;
      return source$.pipe(auditTime(ms));
    }
  },

  sample: {
    id: 'sample',
    name: 'sample',
    category: 'filtering',
    categoryDisplayName: 'Filtering',
    signature: 'sample<T>(notifier: Observable<any>): OperatorFunction<T, T>',
    summary: 'Emits the most recently emitted value from the source Observable whenever another Observable emits.',
    description: 'Samples the source stream whenever notifier emits. If no new source value arrived since the last sample, nothing is emitted.',
    difficulty: 'intermediate',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Sample Source Now (notifier$)',
    asciiMarble: {
      input:  '--a----b------c----|',
      secondaryInput: '----S------S----S--|',
      operator: 'sample(notifier$)',
      output: '----a------b----c--|'
    },
    defaultSourcePreset: 'interval',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [],
      description: 'Emits the latest value whenever the notifier signal emits.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 100, displayLabel: '100' }, { id: '2', timeMs: 500, value: 200, displayLabel: '200' }] }],
      outputStream: { id: 'out', label: 'sample()', emissions: [{ id: 'o1', timeMs: 300, value: 100, displayLabel: '100' }, { id: 'o2', timeMs: 600, value: 200, displayLabel: '200' }] }
    },
    codeSnippet: `import { interval, fromEvent } from 'rxjs';
import { sample } from 'rxjs/operators';

const clicks$ = fromEvent(document, 'click');
interval(100)
  .pipe(sample(clicks$))
  .subscribe(val => console.log('Value when clicked:', val));`,
    codeExample: `import { Subject } from 'rxjs';
import { sample } from 'rxjs/operators';

const src$ = new Subject();
const trigger$ = new Subject();
src$.pipe(sample(trigger$)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'unconsumed', label: 'Unconsumed Values', description: 'Handling duplicate samples without new items' }],
      items: [
        { id: 'sample', name: 'sample', recommendedUse: 'Sampling latest value only when changed', characteristics: { unconsumed: { text: 'Suppressed if no new value arrived', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if notifier emits twice in a row without any source emissions between them?',
        options: [
          { id: 'A', text: 'It emits the same source value twice' },
          { id: 'B', text: 'The second notifier emission produces nothing because no new value arrived' },
          { id: 'C', text: 'It emits null' },
          { id: 'D', text: 'It completes' }
        ],
        correctOptionId: 'B',
        explanation: 'sample tracks whether a new value has arrived since the last sample. If not, the notifier emission is ignored.'
      }
    ],
        useCases: [
      "Sampling the current state of a form or game character whenever a periodic 1-second pulse or 'Save' button is clicked",
      "Reading the current temperature reading exactly when a camera shutter trigger fires",
      "Recording telemetry data points synchronized to a master clock stream"
    ],
    pitfalls: [
      "Sample will NOT emit if the source has not emitted any new values since the last notifier emission (no duplicate sampling)",
      "Values emitted by the source between sample ticks are discarded; only the most recent value is kept"
    ],
    relatedOperators: ["audit","withLatestFrom","debounce"],
    docUrl: "https://rxjs.dev/api/operators/sample",
    metadata: {

      name: 'sample',
      category: 'Filtering',
      signature: 'sample<T>(notifier: Observable<any>): OperatorFunction<T, T>',
      summary: 'Emits most recent value whenever notifier emits.',
      description: 'External sampling operator.',
      difficulty: 'intermediate',
      useCases: [
        "Sampling the current state of a form or game character whenever a periodic 1-second pulse or 'Save' button is clicked",
        "Reading the current temperature reading exactly when a camera shutter trigger fires",
        "Recording telemetry data points synchronized to a master clock stream"
      ],
      pitfalls: [
        "Sample will NOT emit if the source has not emitted any new values since the last notifier emission (no duplicate sampling)",
        "Values emitted by the source between sample ticks are discarded; only the most recent value is kept"
      ],
      relatedOperators: ["audit","withLatestFrom","debounce"],
      docUrl: "https://rxjs.dev/api/operators/sample"
    },
    pipelineFactory: (source$, _, context) => {
      const notifier$ = context.notifier$ || timer(800);
      return source$.pipe(sample(notifier$));
    }
  }
};
