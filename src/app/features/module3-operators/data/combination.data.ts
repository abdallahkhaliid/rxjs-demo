import {
  Observable,
  of,
  combineLatest,
  concat,
  merge,
  forkJoin,
  zip,
  race
} from 'rxjs';
import {
  withLatestFrom,
  startWith,
  endWith,
  concatAll,
  mergeAll
} from 'rxjs/operators';
import { OperatorDefinition } from '../operator-catalog.models';

export const COMBINATION_OPERATORS: Record<string, OperatorDefinition> = {
  combineLatest: {
    id: 'combineLatest',
    name: 'combineLatest',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'combineLatest([obs1, obs2, ...]): Observable<[T1, T2, ...]>',
    summary: 'Combines multiple Observables to create an Observable whose values are calculated from the latest values of each of its input Observables.',
    description: 'Whenever ANY input Observable emits a value, it evaluates the latest value from each input Observable and emits them as a combined tuple.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1-----2-------|',
      secondaryInput: '----A-------B---|',
      operator: 'combineLatest([s1, s2])',
      output: '----[1,A]-[2,A]-[2,B]|'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Combines latest values whenever any source emits.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'source1$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 500, value: 2, displayLabel: '2' }] },
        { id: 'src_2', label: 'source2$', emissions: [{ id: '3', timeMs: 300, value: 'A', displayLabel: 'A' }] }
      ],
      outputStream: { id: 'out', label: 'combineLatest', emissions: [{ id: 'o1', timeMs: 300, value: [1, 'A'], displayLabel: '[1, A]' }, { id: 'o2', timeMs: 500, value: [2, 'A'], displayLabel: '[2, A]' }] }
    },
    codeSnippet: `import { of, combineLatest } from 'rxjs';

const numbers$ = of(1, 2);
const letters$ = of('A', 'B');

combineLatest([numbers$, letters$])
  .subscribe(console.log); // [2, 'A'], [2, 'B']`,
    codeExample: `import { of, combineLatest } from 'rxjs';

const a$ = of(1, 2);
const b$ = of('A', 'B');
combineLatest([a$, b$]).subscribe(console.log);`,
    comparison: {
      features: [
        { id: 'emissionCondition', label: 'Emission Trigger', description: 'What causes an emission' },
        { id: 'pairing', label: 'Pairing Mechanism', description: 'Index-based vs latest-value' }
      ],
      items: [
        { id: 'combineLatest', name: 'combineLatest', recommendedUse: 'Multi-filter forms, independent reactive inputs', characteristics: { emissionCondition: { text: 'Whenever ANY source emits (after all have emitted once)', status: 'positive' }, pairing: { text: 'Latest known value from each source', status: 'positive' } } },
        { id: 'zip', name: 'zip', recommendedUse: 'Strict index-matched pairing', characteristics: { emissionCondition: { text: 'Only when all sources emit a matching Nth item', status: 'neutral' }, pairing: { text: 'Strict 1st-to-1st, 2nd-to-2nd index matching', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When does combineLatest emit its very FIRST value?',
        options: [
          { id: 'A', text: 'When the first source emits' },
          { id: 'B', text: 'Only after EVERY source Observable has emitted at least once' },
          { id: 'C', text: 'When all sources complete' },
          { id: 'D', text: 'Immediately on subscription' }
        ],
        correctOptionId: 'B',
        explanation: 'combineLatest requires at least one value from every input stream before it can produce its first combined tuple.'
      }
    ],
        useCases: [
      "Combining multiple form input filters (e.g. search text, category dropdown, price slider) to compute filtered product results",
      "Evaluating authentication state and route permissions simultaneously to decide redirect destinations",
      "Calculating total order cost by combining item price stream with live currency exchange rate stream"
    ],
    pitfalls: [
      "combineLatest will NOT emit a single value until EVERY input Observable has emitted at least once; if one stream never emits, output remains silent forever",
      "Can suffer from 'glitches' (brief transient states) if multiple input streams update synchronously from the same root source"
    ],
    relatedOperators: ["forkJoin","withLatestFrom","zip"],
    docUrl: "https://rxjs.dev/api/operators/combineLatest",
    metadata: {

      name: 'combineLatest',
      category: 'Combination',
      signature: 'combineLatest([obs1, obs2]): Observable<[T1, T2]>',
      summary: 'Combines latest values whenever any source emits.',
      description: 'Standard multi-stream combination.',
      difficulty: 'intermediate',
      useCases: [
        "Combining multiple form input filters (e.g. search text, category dropdown, price slider) to compute filtered product results",
        "Evaluating authentication state and route permissions simultaneously to decide redirect destinations",
        "Calculating total order cost by combining item price stream with live currency exchange rate stream"
      ],
      pitfalls: [
        "combineLatest will NOT emit a single value until EVERY input Observable has emitted at least once; if one stream never emits, output remains silent forever",
        "Can suffer from 'glitches' (brief transient states) if multiple input streams update synchronously from the same root source"
      ],
      relatedOperators: ["forkJoin","withLatestFrom","zip"],
      docUrl: "https://rxjs.dev/api/operators/combineLatest"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('A', 'B');
      return combineLatest([source$, s2$]);
    }
  },

  concat: {
    id: 'concat',
    name: 'concat',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'concat(...observables): Observable<T>',
    summary: 'Concatenates multiple Observables together by sequentially emitting their values, one Observable after the other.',
    description: 'Subscribes to the first Observable, emits all its items until completion, and only THEN subscribes to the next Observable in line.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--|',
      secondaryInput: '---------3--4--|',
      operator: 'concat(s1, s2)',
      output: '--1--2---3--4--|'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Executes source streams sequentially in strict series.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'source1$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }], completedAtMs: 400 },
        { id: 'src_2', label: 'source2$', emissions: [{ id: '3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 800 }
      ],
      outputStream: { id: 'out', label: 'concat', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 400, value: 2, displayLabel: '2' }, { id: 'o3', timeMs: 600, value: 3, displayLabel: '3' }], completedAtMs: 800 }
    },
    codeSnippet: `import { of, concat } from 'rxjs';

const first$ = of(1, 2);
const second$ = of(3, 4);

concat(first$, second$)
  .subscribe(console.log); // 1, 2, 3, 4`,
    codeExample: `import { of, concat } from 'rxjs';

concat(of(1, 2), of(3, 4)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'order', label: 'Execution Order', description: 'Serial vs Concurrent' }],
      items: [
        { id: 'concat', name: 'concat', recommendedUse: 'Sequential task execution in order', characteristics: { order: { text: 'Strict serial order', status: 'positive' } } },
        { id: 'merge', name: 'merge', recommendedUse: 'Concurrent interleaved streams', characteristics: { order: { text: 'Concurrent as items arrive', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if the first Observable in concat() NEVER completes?',
        options: [
          { id: 'A', text: 'The second Observable is never subscribed to' },
          { id: 'B', text: 'The second Observable starts after a 5s timeout' },
          { id: 'C', text: 'They execute concurrently' },
          { id: 'D', text: 'RxJS throws an error' }
        ],
        correctOptionId: 'A',
        explanation: 'concat strictly waits for the preceding Observable to complete before subscribing to the next.'
      }
    ],
        useCases: [
      "Executing sequential operations in strict serial order (e.g. step 1, then step 2, then step 3)",
      "Emitting cached local data first, then fetching and emitting fresh remote data from server",
      "Playing an intro audio clip, followed by main podcast track, followed by outro"
    ],
    pitfalls: [
      "The second Observable will NEVER be subscribed to if the first Observable is infinite and never completes",
      "Errors in any upstream Observable immediately abort the sequence and prevent subsequent Observables from running"
    ],
    relatedOperators: ["merge","concatMap","startWith"],
    docUrl: "https://rxjs.dev/api/operators/concat",
    metadata: {

      name: 'concat',
      category: 'Combination',
      signature: 'concat(...observables): Observable<T>',
      summary: 'Emits values from streams sequentially in order.',
      description: 'Sequential concatenation operator.',
      difficulty: 'beginner',
      useCases: [
        "Executing sequential operations in strict serial order (e.g. step 1, then step 2, then step 3)",
        "Emitting cached local data first, then fetching and emitting fresh remote data from server",
        "Playing an intro audio clip, followed by main podcast track, followed by outro"
      ],
      pitfalls: [
        "The second Observable will NEVER be subscribed to if the first Observable is infinite and never completes",
        "Errors in any upstream Observable immediately abort the sequence and prevent subsequent Observables from running"
      ],
      relatedOperators: ["merge","concatMap","startWith"],
      docUrl: "https://rxjs.dev/api/operators/concat"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('X', 'Y');
      return concat(source$, s2$);
    }
  },

  merge: {
    id: 'merge',
    name: 'merge',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'merge(...observables): Observable<T>',
    summary: 'Turn multiple Observables into a single Observable by concurrently delivering emissions.',
    description: 'Subscribes to all source Observables simultaneously and forwards any emission from any source as soon as it arrives, interleaving values.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----|',
      secondaryInput: '----A-----B---|',
      operator: 'merge(s1, s2)',
      output: '--1-A---2-B---|'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Interleaves concurrent emissions into a single unified stream.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'source1$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 500, value: 2, displayLabel: '2' }] },
        { id: 'src_2', label: 'source2$', emissions: [{ id: '3', timeMs: 300, value: 'A', displayLabel: 'A' }, { id: '4', timeMs: 600, value: 'B', displayLabel: 'B' }] }
      ],
      outputStream: { id: 'out', label: 'merge', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 300, value: 'A', displayLabel: 'A' }, { id: 'o3', timeMs: 500, value: 2, displayLabel: '2' }, { id: 'o4', timeMs: 600, value: 'B', displayLabel: 'B' }] }
    },
    codeSnippet: `import { of, merge } from 'rxjs';

const s1$ = of('a', 'b');
const s2$ = of('c', 'd');

merge(s1$, s2$)
  .subscribe(console.log); // 'a', 'b', 'c', 'd'`,
    codeExample: `import { of, merge } from 'rxjs';

merge(of(1, 2), of(3, 4)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'concurrency', label: 'Concurrency', description: 'Parallel subscription' }],
      items: [
        { id: 'merge', name: 'merge', recommendedUse: 'Listening to multiple event sources (e.g. mouse + touch)', characteristics: { concurrency: { text: 'Fully concurrent', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When does a merge() stream complete?',
        options: [
          { id: 'A', text: 'When the first source completes' },
          { id: 'B', text: 'When ALL merged sources have completed' },
          { id: 'C', text: 'Immediately after the first emission' },
          { id: 'D', text: 'It never completes' }
        ],
        correctOptionId: 'B',
        explanation: 'merge remains active until every one of its constituent sources has emitted a complete notification.'
      }
    ],
        useCases: [
      "Combining multiple user interaction triggers (e.g. keyboard Enter key, button Click, and swipe gesture) into a unified action stream",
      "Aggregating incoming log messages from multiple microservices or WebSocket channels concurrently",
      "Listening to multiple sensor streams simultaneously and processing events in the exact order they arrive"
    ],
    pitfalls: [
      "Items from all streams interleave concurrently; merge does NOT preserve stream-by-stream grouping",
      "If any merged stream errors, the entire merged output terminates immediately unless catchError is applied to each input stream"
    ],
    relatedOperators: ["concat","race","mergeMap"],
    docUrl: "https://rxjs.dev/api/operators/merge",
    metadata: {

      name: 'merge',
      category: 'Combination',
      signature: 'merge(...observables): Observable<T>',
      summary: 'Interleaves concurrent streams as values arrive.',
      description: 'Concurrent stream merger.',
      difficulty: 'beginner',
      useCases: [
        "Combining multiple user interaction triggers (e.g. keyboard Enter key, button Click, and swipe gesture) into a unified action stream",
        "Aggregating incoming log messages from multiple microservices or WebSocket channels concurrently",
        "Listening to multiple sensor streams simultaneously and processing events in the exact order they arrive"
      ],
      pitfalls: [
        "Items from all streams interleave concurrently; merge does NOT preserve stream-by-stream grouping",
        "If any merged stream errors, the entire merged output terminates immediately unless catchError is applied to each input stream"
      ],
      relatedOperators: ["concat","race","mergeMap"],
      docUrl: "https://rxjs.dev/api/operators/merge"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('A', 'B');
      return merge(source$, s2$);
    }
  },

  forkJoin: {
    id: 'forkJoin',
    name: 'forkJoin',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'forkJoin(sources): Observable<any>',
    summary: 'Wait for Observables to complete and then combine last values they emitted; like Promise.all() for Observables.',
    description: 'Waits for all input Observables to complete, then emits a single dictionary or array containing the last value emitted by each Observable.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--3|',
      secondaryInput: '----A--B|',
      operator: 'forkJoin({ x: s1, y: s2 })',
      output: '---------{ x: 3, y: B }|'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Emits a single dictionary of final values once all sources complete.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'source1$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 3, displayLabel: '3' }], completedAtMs: 400 },
        { id: 'src_2', label: 'source2$', emissions: [{ id: '3', timeMs: 300, value: 'B', displayLabel: 'B' }], completedAtMs: 500 }
      ],
      outputStream: { id: 'out', label: 'forkJoin', emissions: [{ id: 'o1', timeMs: 500, value: { s1: 3, s2: 'B' }, displayLabel: '{s1:3, s2:B}' }], completedAtMs: 500 }
    },
    codeSnippet: `import { of, forkJoin } from 'rxjs';

const user$ = of({ id: 1, name: 'Alice' });
const permissions$ = of(['read', 'write']);

forkJoin({ user: user$, permissions: permissions$ })
  .subscribe(result => console.log(result));`,
    codeExample: `import { of, forkJoin } from 'rxjs';

forkJoin({ x: of(1, 2, 3), y: of('A', 'B') }).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'jsEquiv', label: 'JS Equivalent', description: 'Familiar JavaScript counterpart' }],
      items: [
        { id: 'forkJoin', name: 'forkJoin', recommendedUse: 'Parallel HTTP requests (e.g. loading initial page data)', characteristics: { jsEquiv: { text: 'Promise.all()', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if one of the Observables passed to forkJoin never completes?',
        options: [
          { id: 'A', text: 'It emits the values from the ones that completed' },
          { id: 'B', text: 'forkJoin will NEVER emit anything' },
          { id: 'C', text: 'It emits after 10 seconds' },
          { id: 'D', text: 'It throws an error' }
        ],
        correctOptionId: 'B',
        explanation: 'All input Observables must complete for forkJoin to determine the final value of each stream.'
      }
    ],
        useCases: [
      "Waiting for multiple parallel HTTP requests to complete and processing their combined final results (equivalent to Promise.all)",
      "Loading initial page bootstrap data (user profile, config settings, feature flags) simultaneously",
      "Submitting a batch of independent API mutations and waiting for all to succeed before displaying a confirmation toast"
    ],
    pitfalls: [
      "forkJoin only emits ONCE, when all input Observables complete; if ANY input Observable never completes, forkJoin will NEVER emit",
      "If any input Observable completes without emitting a single value, forkJoin completes without emitting; use defaultIfEmpty() on empty streams"
    ],
    relatedOperators: ["combineLatest","zip","concat"],
    docUrl: "https://rxjs.dev/api/operators/forkJoin",
    metadata: {

      name: 'forkJoin',
      category: 'Combination',
      signature: 'forkJoin(sources): Observable<any>',
      summary: 'Waits for all streams to complete and emits final values.',
      description: 'Promise.all for Observables.',
      difficulty: 'intermediate',
      useCases: [
        "Waiting for multiple parallel HTTP requests to complete and processing their combined final results (equivalent to Promise.all)",
        "Loading initial page bootstrap data (user profile, config settings, feature flags) simultaneously",
        "Submitting a batch of independent API mutations and waiting for all to succeed before displaying a confirmation toast"
      ],
      pitfalls: [
        "forkJoin only emits ONCE, when all input Observables complete; if ANY input Observable never completes, forkJoin will NEVER emit",
        "If any input Observable completes without emitting a single value, forkJoin completes without emitting; use defaultIfEmpty() on empty streams"
      ],
      relatedOperators: ["combineLatest","zip","concat"],
      docUrl: "https://rxjs.dev/api/operators/forkJoin"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('X', 'Y');
      return forkJoin({ s1: source$, s2: s2$ });
    }
  },

  zip: {
    id: 'zip',
    name: 'zip',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'zip(...observables): Observable<any[]>',
    summary: 'Combines multiple Observables to create an Observable whose values are calculated from the values, in order, of each of its input Observables.',
    description: 'Pairs values strictly by 1-to-1 index matching: 1st with 1st, 2nd with 2nd, etc. If one stream emits faster, its items are queued.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1----2----3----|',
      secondaryInput: '----A----B-------|',
      operator: 'zip(s1, s2)',
      output: '----[1,A]-[2,B]--|'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Pairs emissions strictly index-by-index in lockstep.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'source1$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }] },
        { id: 'src_2', label: 'source2$', emissions: [{ id: '3', timeMs: 300, value: 'A', displayLabel: 'A' }, { id: '4', timeMs: 500, value: 'B', displayLabel: 'B' }] }
      ],
      outputStream: { id: 'out', label: 'zip', emissions: [{ id: 'o1', timeMs: 300, value: [1, 'A'], displayLabel: '[1, A]' }, { id: 'o2', timeMs: 500, value: [2, 'B'], displayLabel: '[2, B]' }] }
    },
    codeSnippet: `import { of, zip } from 'rxjs';

const ages$ = of(27, 25, 29);
const names$ = of('Alice', 'Bob', 'Charlie');

zip(ages$, names$)
  .subscribe(([age, name]) => console.log(\`\${name} is \${age}\`));`,
    codeExample: `import { of, zip } from 'rxjs';

zip(of(1, 2), of('A', 'B')).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'pairing', label: 'Lockstep', description: 'Pairing mechanism' }],
      items: [
        { id: 'zip', name: 'zip', recommendedUse: 'Synchronizing parallel coordinates or lockstep streams', characteristics: { pairing: { text: 'Strict index matching (1:1)', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens in zip() if one source emits 100 items while the other emits only 2 items and completes?',
        options: [
          { id: 'A', text: 'It emits 2 zipped pairs and completes immediately' },
          { id: 'B', text: 'It emits 100 pairs with undefined' },
          { id: 'C', text: 'It errors out' },
          { id: 'D', text: 'It waits forever' }
        ],
        correctOptionId: 'A',
        explanation: 'zip can only pair up to the length of the shortest stream, after which no further pairs can ever be formed.'
      }
    ],
        useCases: [
      "Pairing inputs index-for-index (e.g. pairing 1st keypress with 1st click, 2nd with 2nd)",
      "Synchronizing dual-channel sensor pulses where every reading on channel A corresponds to a companion reading on channel B",
      "Zipping data rows with corresponding header columns to construct structured objects"
    ],
    pitfalls: [
      "If one stream emits much faster than the other, zip buffers emissions indefinitely waiting for corresponding pairs, risking memory leaks",
      "Zip completes as soon as any input stream completes and its remaining buffered pairs are exhausted"
    ],
    relatedOperators: ["combineLatest","forkJoin","pairwise"],
    docUrl: "https://rxjs.dev/api/operators/zip",
    metadata: {

      name: 'zip',
      category: 'Combination',
      signature: 'zip(...observables): Observable<any[]>',
      summary: 'Pairs emissions strictly index-by-index in lockstep.',
      description: 'Index-matched stream zipper.',
      difficulty: 'intermediate',
      useCases: [
        "Pairing inputs index-for-index (e.g. pairing 1st keypress with 1st click, 2nd with 2nd)",
        "Synchronizing dual-channel sensor pulses where every reading on channel A corresponds to a companion reading on channel B",
        "Zipping data rows with corresponding header columns to construct structured objects"
      ],
      pitfalls: [
        "If one stream emits much faster than the other, zip buffers emissions indefinitely waiting for corresponding pairs, risking memory leaks",
        "Zip completes as soon as any input stream completes and its remaining buffered pairs are exhausted"
      ],
      relatedOperators: ["combineLatest","forkJoin","pairwise"],
      docUrl: "https://rxjs.dev/api/operators/zip"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('A', 'B');
      return zip(source$, s2$);
    }
  },

  race: {
    id: 'race',
    name: 'race',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'race(...observables): Observable<T>',
    summary: 'The Observable from the list that first emits an item to the observer will be the one that is mirrored and all others unsubscribed.',
    description: 'Winner-takes-all operator. As soon as any input Observable emits a next or error notification, all other competitor streams are immediately unsubscribed.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '----1-----2---|',
      secondaryInput: '--A-----B-----|',
      operator: 'race(s1, s2)',
      output: '--A-----B-----| (s2 won the race)'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Mirrors the first stream to emit and unhooks all losers.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'slow$', emissions: [{ id: '1', timeMs: 400, value: 'slow', displayLabel: 'slow' }] },
        { id: 'src_2', label: 'fast$', emissions: [{ id: '2', timeMs: 200, value: 'fast', displayLabel: 'fast' }] }
      ],
      outputStream: { id: 'out', label: 'race', emissions: [{ id: 'o1', timeMs: 200, value: 'fast', displayLabel: 'fast' }] }
    },
    codeSnippet: `import { timer, race, map } from 'rxjs';

const serverA$ = timer(200).pipe(map(() => 'Server A response'));
const serverB$ = timer(50).pipe(map(() => 'Server B response'));

race(serverA$, serverB$)
  .subscribe(winner => console.log('Fastest server:', winner));`,
    codeExample: `import { timer, race, of } from 'rxjs';

race(timer(100), of('immediate')).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'winner', label: 'Competitor Policy', description: 'What happens to losing streams' }],
      items: [
        { id: 'race', name: 'race', recommendedUse: 'Redundant fallback servers, fastest CDN fallback', characteristics: { winner: { text: 'Immediately cancels all losing streams', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens to losing Observables in race() once a winner emits?',
        options: [
          { id: 'A', text: 'They are immediately unsubscribed' },
          { id: 'B', text: 'They continue running in background' },
          { id: 'C', text: 'They emit at the end' },
          { id: 'D', text: 'They throw an error' }
        ],
        correctOptionId: 'A',
        explanation: 'race unsubscribes from all competitor streams as soon as the first stream emits.'
      }
    ],
        useCases: [
      "Implementing request timeouts by racing an HTTP request against a timer() stream",
      "Selecting the fastest responding CDN mirror or cache source and discarding slower alternatives",
      "Listening to user confirmation vs dialog auto-dismiss countdown, letting whichever happens first win"
    ],
    pitfalls: [
      "Whichever Observable emits first 'wins' the race; all other competing Observables are immediately unsubscribed and canceled",
      "If the winning Observable later errors, the error is propagated downstream; the runner-up streams are not revived"
    ],
    relatedOperators: ["timeout","merge","withLatestFrom"],
    docUrl: "https://rxjs.dev/api/operators/race",
    metadata: {

      name: 'race',
      category: 'Combination',
      signature: 'race(...observables): Observable<T>',
      summary: 'Mirrors the first stream that emits and unsubscribes the rest.',
      description: 'Fastest-stream winner selection.',
      difficulty: 'intermediate',
      useCases: [
        "Implementing request timeouts by racing an HTTP request against a timer() stream",
        "Selecting the fastest responding CDN mirror or cache source and discarding slower alternatives",
        "Listening to user confirmation vs dialog auto-dismiss countdown, letting whichever happens first win"
      ],
      pitfalls: [
        "Whichever Observable emits first 'wins' the race; all other competing Observables are immediately unsubscribed and canceled",
        "If the winning Observable later errors, the error is propagated downstream; the runner-up streams are not revived"
      ],
      relatedOperators: ["timeout","merge","withLatestFrom"],
      docUrl: "https://rxjs.dev/api/operators/race"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('WINNER');
      return race(source$, s2$);
    }
  },

  withLatestFrom: {
    id: 'withLatestFrom',
    name: 'withLatestFrom',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'withLatestFrom(...inputs): OperatorFunction<T, [T, ...Inputs]>',
    summary: 'Combines the source Observable with other Observables to create an Observable whose values are calculated from the latest values of each, only when the source emits.',
    description: 'Auxiliary stream sampler. Emits ONLY when the PRIMARY source emits. Emissions from auxiliary streams do NOT trigger output emissions on their own.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1------2------|',
      secondaryInput: '----A-------B---|',
      operator: 's1$.pipe(withLatestFrom(s2$))',
      output: '---------[2,A]--|'
    },
    defaultSourcePreset: 'sync_numbers',
    defaultSource2Preset: 'words',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Combines with auxiliary stream only when primary emits.'
    },
    initialMarbles: {
      inputStreams: [
        { id: 'src_1', label: 'primary$', emissions: [{ id: '1', timeMs: 400, value: 1, displayLabel: '1' }] },
        { id: 'src_2', label: 'aux$', emissions: [{ id: '2', timeMs: 200, value: 'INIT', displayLabel: 'INIT' }] }
      ],
      outputStream: { id: 'out', label: 'withLatestFrom', emissions: [{ id: 'o1', timeMs: 400, value: [1, 'INIT'], displayLabel: '[1, INIT]' }] }
    },
    codeSnippet: `import { fromEvent, interval } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';

const clicks$ = fromEvent(document, 'click');
const timer$ = interval(1000);

clicks$
  .pipe(withLatestFrom(timer$))
  .subscribe(([click, second]) => console.log('Clicked at second:', second));`,
    codeExample: `import { of } from 'rxjs';
import { withLatestFrom } from 'rxjs/operators';

of(1, 2).pipe(withLatestFrom(of('A'))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'trigger', label: 'Trigger Stream', description: 'Which stream drives emissions' }],
      items: [
        { id: 'withLatestFrom', name: 'withLatestFrom', recommendedUse: 'Button click reading current form value or store state', characteristics: { trigger: { text: 'Primary source only', status: 'positive' } } },
        { id: 'combineLatest', name: 'combineLatest', recommendedUse: 'Reactive updates when ANY stream changes', characteristics: { trigger: { text: 'Any source stream', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'If the secondary stream emits 100 times without the primary source emitting, how many times does withLatestFrom emit?',
        options: [
          { id: 'A', text: '0 times' },
          { id: 'B', text: '100 times' },
          { id: 'C', text: '1 time' },
          { id: 'D', text: 'It throws an error' }
        ],
        correctOptionId: 'A',
        explanation: 'withLatestFrom ONLY emits when the primary source emits. Auxiliary emissions simply update the cached latest value.'
      }
    ],
        useCases: [
      "Sampling secondary state (e.g. current auth token or user settings) only when a primary action occurs (e.g. user clicks 'Submit')",
      "Annotating click events with the latest form values without triggering on form value changes",
      "Attaching current GPS coordinates to photo capture events"
    ],
    pitfalls: [
      "withLatestFrom will NOT emit anything if the secondary Observable has not emitted at least one value before the primary stream emits",
      "Changes in the secondary Observable do NOT cause emissions; only the primary source triggers downstream notifications"
    ],
    relatedOperators: ["combineLatest","sample","zip"],
    docUrl: "https://rxjs.dev/api/operators/withLatestFrom",
    metadata: {

      name: 'withLatestFrom',
      category: 'Combination',
      signature: 'withLatestFrom(aux$): OperatorFunction<T, [T, Aux]>',
      summary: 'Combines latest values but emits ONLY when primary emits.',
      description: 'Primary-driven auxiliary sampler.',
      difficulty: 'intermediate',
      useCases: [
        "Sampling secondary state (e.g. current auth token or user settings) only when a primary action occurs (e.g. user clicks 'Submit')",
        "Annotating click events with the latest form values without triggering on form value changes",
        "Attaching current GPS coordinates to photo capture events"
      ],
      pitfalls: [
        "withLatestFrom will NOT emit anything if the secondary Observable has not emitted at least one value before the primary stream emits",
        "Changes in the secondary Observable do NOT cause emissions; only the primary source triggers downstream notifications"
      ],
      relatedOperators: ["combineLatest","sample","zip"],
      docUrl: "https://rxjs.dev/api/operators/withLatestFrom"
    },
    pipelineFactory: (source$, _, context) => {
      const s2$ = context.source2$ || of('AUX');
      return source$.pipe(withLatestFrom(s2$));
    }
  },

  startWith: {
    id: 'startWith',
    name: 'startWith',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'startWith<T, D>(...values: D[]): OperatorFunction<T, T | D>',
    summary: 'Returns an Observable that, at the moment of subscription, will synchronously emit the provided values before emitting items from source.',
    description: 'Prepends initial seed values to an Observable sequence immediately upon subscription, making it ideal for providing initial UI state.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '-------1-----2-----|',
      operator: 'startWith(0)',
      output: '0------1-----2-----|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'initialVal', name: 'Initial Seed Value', type: 'text', defaultValue: 'INITIAL_STATE' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'initialVal', name: 'Initial Seed', type: 'text', defaultValue: 'INITIAL_STATE' }],
      description: 'Prepends the specified seed value synchronously at subscription.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'startWith(0)', emissions: [{ id: 'o0', timeMs: 0, value: 0, displayLabel: '0' }, { id: 'o1', timeMs: 400, value: 1, displayLabel: '1' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { startWith } from 'rxjs/operators';

of(1, 2, 3)
  .pipe(startWith(0))
  .subscribe(console.log); // 0, 1, 2, 3`,
    codeExample: `import { of } from 'rxjs';
import { startWith } from 'rxjs/operators';

of(10, 20).pipe(startWith(0)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'timing', label: 'Injection Point', description: 'Beginning vs End of stream' }],
      items: [
        { id: 'startWith', name: 'startWith', recommendedUse: 'Setting initial dropdown value or loading state', characteristics: { timing: { text: 'Head (at subscription t=0)', status: 'positive' } } },
        { id: 'endWith', name: 'endWith', recommendedUse: 'Emitting completion sentinel or final status', characteristics: { timing: { text: 'Tail (before complete)', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When is the value in startWith() emitted?',
        options: [
          { id: 'A', text: 'Synchronously upon subscription at t=0' },
          { id: 'B', text: 'After 1 second' },
          { id: 'C', text: 'When source completes' },
          { id: 'D', text: 'Only if source is empty' }
        ],
        correctOptionId: 'A',
        explanation: 'startWith emits all its argument values synchronously immediately when subscription begins, before any source values.'
      }
    ],
        useCases: [
      "Providing an initial placeholder or loading state value before async HTTP data arrives",
      "Setting the initial value for a counter, theme preference, or form dropdown",
      "Ensuring combineLatest emits immediately without waiting for a slow stream to fire its first value"
    ],
    pitfalls: [
      "startWith emits synchronously upon subscription; any operators placed before startWith in the pipe will not affect the prepended value",
      "Prepending multiple items startWith(a, b, c) emits them synchronously in that exact order"
    ],
    relatedOperators: ["endWith","concat","defaultIfEmpty"],
    docUrl: "https://rxjs.dev/api/operators/startWith",
    metadata: {

      name: 'startWith',
      category: 'Combination',
      signature: 'startWith(...values): OperatorFunction<T, T>',
      summary: 'Prepends initial values synchronously upon subscription.',
      description: 'Initial value injection operator.',
      difficulty: 'beginner',
      useCases: [
        "Providing an initial placeholder or loading state value before async HTTP data arrives",
        "Setting the initial value for a counter, theme preference, or form dropdown",
        "Ensuring combineLatest emits immediately without waiting for a slow stream to fire its first value"
      ],
      pitfalls: [
        "startWith emits synchronously upon subscription; any operators placed before startWith in the pipe will not affect the prepended value",
        "Prepending multiple items startWith(a, b, c) emits them synchronously in that exact order"
      ],
      relatedOperators: ["endWith","concat","defaultIfEmpty"],
      docUrl: "https://rxjs.dev/api/operators/startWith"
    },
    pipelineFactory: (source$, params) => {
      const v = params['initialVal'] ?? 'INITIAL_STATE';
      return source$.pipe(startWith(v));
    }
  },

  endWith: {
    id: 'endWith',
    name: 'endWith',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'endWith<T>(...values: any[]): OperatorFunction<T, T>',
    summary: 'Returns an Observable that will emit the specified items immediately before emitting a complete notification.',
    description: 'Appends specified values to the end of the stream right before completing.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----|',
      operator: 'endWith(99)',
      output: '--1-----2-----99|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'finalVal', name: 'Ending Value', type: 'text', defaultValue: 'FINAL_DONE' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'finalVal', name: 'Ending Value', type: 'text', defaultValue: 'FINAL_DONE' }],
      description: 'Appends specified value right before stream completion.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }], completedAtMs: 600 }],
      outputStream: { id: 'out', label: 'endWith(99)', emissions: [{ id: 'o1', timeMs: 300, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 600, value: 99, displayLabel: '99' }], completedAtMs: 600 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { endWith } from 'rxjs/operators';

of('Downloading...', 'Processing...')
  .pipe(endWith('Complete!'))
  .subscribe(console.log);`,
    codeExample: `import { of } from 'rxjs';
import { endWith } from 'rxjs/operators';

of(1, 2).pipe(endWith(99)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'terminal', label: 'Terminal Emission', description: 'Emits before complete' }],
      items: [
        { id: 'endWith', name: 'endWith', recommendedUse: 'Emitting completion indicators or trailing delimiters', characteristics: { terminal: { text: 'Emits right before complete notification', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does endWith emit if the source Observable errors out without completing?',
        options: [
          { id: 'A', text: 'Yes' },
          { id: 'B', text: 'No, endWith only emits on clean completion' },
          { id: 'C', text: 'Only in development mode' },
          { id: 'D', text: 'It emits undefined' }
        ],
        correctOptionId: 'B',
        explanation: 'endWith intercepts the complete notification. If an error occurs, the error is passed through directly.'
      }
    ],
        useCases: [
      "Appending a final 'COMPLETED' or summary emission right before the stream closes",
      "Displaying an end-of-feed indicator or footer marker when a paginated feed reaches completion",
      "Emitting a final cleanup state or teardown status to downstream subscribers"
    ],
    pitfalls: [
      "endWith will NEVER emit if the source Observable never completes (e.g. infinite streams or open Subjects)",
      "If the source errors, endWith will NOT emit; the error takes precedence"
    ],
    relatedOperators: ["startWith","finalize","concat"],
    docUrl: "https://rxjs.dev/api/operators/endWith",
    metadata: {

      name: 'endWith',
      category: 'Combination',
      signature: 'endWith(...values): OperatorFunction<T, T>',
      summary: 'Appends specified values right before completion.',
      description: 'Trailing value append operator.',
      difficulty: 'beginner',
      useCases: [
        "Appending a final 'COMPLETED' or summary emission right before the stream closes",
        "Displaying an end-of-feed indicator or footer marker when a paginated feed reaches completion",
        "Emitting a final cleanup state or teardown status to downstream subscribers"
      ],
      pitfalls: [
        "endWith will NEVER emit if the source Observable never completes (e.g. infinite streams or open Subjects)",
        "If the source errors, endWith will NOT emit; the error takes precedence"
      ],
      relatedOperators: ["startWith","finalize","concat"],
      docUrl: "https://rxjs.dev/api/operators/endWith"
    },
    pipelineFactory: (source$, params) => {
      const v = params['finalVal'] ?? 'FINAL_DONE';
      return source$.pipe(endWith(v));
    }
  },

  concatAll: {
    id: 'concatAll',
    name: 'concatAll',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'concatAll<T>(): OperatorFunction<Observable<T>, T>',
    summary: 'Converts a higher-order Observable into a first-order Observable by concatenating the inner Observables in order.',
    description: 'Flattens an Observable of Observables by subscribing to each inner Observable in strict sequential order only after the previous one completes.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--o1----o2---| (where o1=[1,2], o2=[3,4])',
      operator: 'concatAll()',
      output: '--1--2--3--4-|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Sequentially flattens higher-order Observable streams.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'inner1$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'concatAll', emissions: [{ id: 'o1', timeMs: 200, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 400, value: 2, displayLabel: '2' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { concatAll } from 'rxjs/operators';

const higherOrder$ = of(of(1, 2), of(3, 4));

higherOrder$
  .pipe(concatAll())
  .subscribe(console.log); // 1, 2, 3, 4`,
    codeExample: `import { of } from 'rxjs';
import { concatAll } from 'rxjs/operators';

of(of(1, 2), of(3, 4)).pipe(concatAll()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'flattening', label: 'Flattening Order', description: 'Serial vs Concurrent' }],
      items: [
        { id: 'concatAll', name: 'concatAll', recommendedUse: 'Queueing tasks to execute sequentially in order', characteristics: { flattening: { text: 'Sequential (waits for each inner stream)', status: 'positive' } } },
        { id: 'mergeAll', name: 'mergeAll', recommendedUse: 'Concurrent execution of all inner streams', characteristics: { flattening: { text: 'Concurrent', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is map(fn) followed by concatAll() equivalent to?',
        options: [
          { id: 'A', text: 'switchMap(fn)' },
          { id: 'B', text: 'concatMap(fn)' },
          { id: 'C', text: 'mergeMap(fn)' },
          { id: 'D', text: 'exhaustMap(fn)' }
        ],
        correctOptionId: 'B',
        explanation: 'concatMap is the combination of map() and concatAll().'
      }
    ],
        useCases: [
      "Flattening a higher-order Observable by subscribing to each inner Observable strictly sequentially",
      "Queuing file upload tasks or database write transactions so task N+1 starts only after task N completes",
      "Playing a queue of sequential animation clips or audio tracks"
    ],
    pitfalls: [
      "If an inner Observable never completes, concatAll hangs indefinitely and will never subscribe to subsequent inner Observables",
      "Buffers incoming inner Observables in memory while waiting for the current one to finish; high incoming volume can consume memory"
    ],
    relatedOperators: ["concatMap","mergeAll","switchAll"],
    docUrl: "https://rxjs.dev/api/operators/concatAll",
    metadata: {

      name: 'concatAll',
      category: 'Combination',
      signature: 'concatAll<T>(): OperatorFunction<Observable<T>, T>',
      summary: 'Flattens higher-order Observable sequentially.',
      description: 'Sequential stream flattener.',
      difficulty: 'advanced',
      useCases: [
        "Flattening a higher-order Observable by subscribing to each inner Observable strictly sequentially",
        "Queuing file upload tasks or database write transactions so task N+1 starts only after task N completes",
        "Playing a queue of sequential animation clips or audio tracks"
      ],
      pitfalls: [
        "If an inner Observable never completes, concatAll hangs indefinitely and will never subscribe to subsequent inner Observables",
        "Buffers incoming inner Observables in memory while waiting for the current one to finish; high incoming volume can consume memory"
      ],
      relatedOperators: ["concatMap","mergeAll","switchAll"],
      docUrl: "https://rxjs.dev/api/operators/concatAll"
    },
    pipelineFactory: source$ => of(source$, of(100, 200)).pipe(concatAll())
  },

  mergeAll: {
    id: 'mergeAll',
    name: 'mergeAll',
    category: 'combination',
    categoryDisplayName: 'Combination',
    signature: 'mergeAll<T>(concurrent?: number): OperatorFunction<Observable<T>, T>',
    summary: 'Converts a higher-order Observable into a first-order Observable which concurrently delivers all values that come from the inner Observables.',
    description: 'Flattens an Observable of Observables by subscribing concurrently to all inner Observables as they arrive.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--o1----o2---| (where o1=[A,B], o2=[1,2])',
      operator: 'mergeAll()',
      output: '--A--1--B--2-|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Concurrently flattens higher-order streams.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'inner1$', emissions: [{ id: '1', timeMs: 200, value: 'A', displayLabel: 'A' }] }],
      outputStream: { id: 'out', label: 'mergeAll', emissions: [{ id: 'o1', timeMs: 200, value: 'A', displayLabel: 'A' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { mergeAll } from 'rxjs/operators';

const higherOrder$ = of(of('a', 'b'), of('c', 'd'));

higherOrder$
  .pipe(mergeAll())
  .subscribe(console.log); // 'a', 'b', 'c', 'd'`,
    codeExample: `import { of } from 'rxjs';
import { mergeAll } from 'rxjs/operators';

of(of('a'), of('b')).pipe(mergeAll()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'equiv', label: 'Shorthand Equivalent', description: 'Combined operator' }],
      items: [
        { id: 'mergeAll', name: 'mergeAll', recommendedUse: 'Concurrent higher-order stream flattening', characteristics: { equiv: { text: 'map() + mergeAll() === mergeMap()', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is map(fn) followed by mergeAll() equivalent to?',
        options: [
          { id: 'A', text: 'mergeMap(fn)' },
          { id: 'B', text: 'switchMap(fn)' },
          { id: 'C', text: 'concatMap(fn)' },
          { id: 'D', text: 'exhaustMap(fn)' }
        ],
        correctOptionId: 'A',
        explanation: 'mergeMap(fn) is the combination of map(fn) and mergeAll().'
      }
    ],
        useCases: [
      "Concurrently subscribing to and flattening multiple inner Observables as they arrive",
      "Handling multiple concurrent WebSocket subscription feeds or parallel downloads",
      "Managing a pool of concurrent worker requests with the optional concurrency limit parameter"
    ],
    pitfalls: [
      "Without a concurrency limit, mergeAll subscribes to ALL incoming inner Observables simultaneously, which can overwhelm network connections",
      "Emissions from concurrent inner Observables interleave arbitrarily based on arrival timing"
    ],
    relatedOperators: ["mergeMap","concatAll","exhaustAll"],
    docUrl: "https://rxjs.dev/api/operators/mergeAll",
    metadata: {

      name: 'mergeAll',
      category: 'Combination',
      signature: 'mergeAll<T>(concurrent?: number): OperatorFunction<Observable<T>, T>',
      summary: 'Concurrently flattens higher-order Observables.',
      description: 'Concurrent stream flattener.',
      difficulty: 'advanced',
      useCases: [
        "Concurrently subscribing to and flattening multiple inner Observables as they arrive",
        "Handling multiple concurrent WebSocket subscription feeds or parallel downloads",
        "Managing a pool of concurrent worker requests with the optional concurrency limit parameter"
      ],
      pitfalls: [
        "Without a concurrency limit, mergeAll subscribes to ALL incoming inner Observables simultaneously, which can overwhelm network connections",
        "Emissions from concurrent inner Observables interleave arbitrarily based on arrival timing"
      ],
      relatedOperators: ["mergeMap","concatAll","exhaustAll"],
      docUrl: "https://rxjs.dev/api/operators/mergeAll"
    },
    pipelineFactory: source$ => of(source$, of('A', 'B')).pipe(mergeAll())
  }
};
