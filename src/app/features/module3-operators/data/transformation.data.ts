import { Observable, timer } from 'rxjs';
import {
  map,
  mapTo,
  pluck,
  scan,
  reduce,
  toArray,
  buffer,
  bufferCount,
  bufferTime,
  bufferToggle,
  bufferWhen,
  window,
  windowCount,
  windowTime,
  windowToggle,
  windowWhen,
  pairwise,
  groupBy,
  mergeMap
} from 'rxjs/operators';
import { OperatorDefinition } from '../operator-catalog.models';

export const TRANSFORMATION_OPERATORS: Record<string, OperatorDefinition> = {
  map: {
    id: 'map',
    name: 'map',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>',
    summary: 'Applies a given projection function to each value emitted by the source Observable, and emits the resulting values.',
    description: 'Similar to Array.prototype.map, map transforms each item in a stream sequentially and synchronously as it arrives, forwarding the returned value to downstream subscribers.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----3-----4-----|',
      operator: 'map(x => x * 10)',
      output: '--10----20----30----40----|'
    },
    marbleString: '-1--2--3--| -> map(x => x * 10) -> -10--20--30--|',
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      {
        id: 'multiplier',
        name: 'Multiplier (x * N)',
        type: 'number',
        defaultValue: 10,
        min: -10,
        max: 100,
        step: 1,
        unit: 'x',
        description: 'Multiplies each incoming numeric value by this multiplier.'
      }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [
        {
          id: 'multiplier',
          name: 'Multiplier',
          type: 'number',
          defaultValue: 10,
          min: -10,
          max: 100
        }
      ],
      description: 'Adjust the multiplier to see each emitted value multiplied instantly.'
    },
    initialMarbles: {
      inputStreams: [
        {
          id: 'src',
          label: 'source$',
          color: 'var(--color-primary-400)',
          emissions: [
            { id: 'm1', timeMs: 400, value: 1, displayLabel: '1' },
            { id: 'm2', timeMs: 800, value: 2, displayLabel: '2' },
            { id: 'm3', timeMs: 1200, value: 3, displayLabel: '3' }
          ],
          completedAtMs: 1500
        }
      ],
      outputStream: {
        id: 'out',
        label: 'map(x => x * 10)',
        color: 'var(--color-accent-400)',
        emissions: [
          { id: 'o1', timeMs: 400, value: 10, displayLabel: '10' },
          { id: 'o2', timeMs: 800, value: 20, displayLabel: '20' },
          { id: 'o3', timeMs: 1200, value: 30, displayLabel: '30' }
        ],
        completedAtMs: 1500
      }
    },
    codeSnippet: `import { of } from 'rxjs';
import { map } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(map(x => x * 10))
  .subscribe(console.log); // 10, 20, 30, 40, 50`,
    codeExample: `import { of } from 'rxjs';
import { map } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(map(x => x * 10))
  .subscribe(console.log); // 10, 20, 30, 40, 50`,
    useCases: [
      'Extracting nested response data from HTTP API responses (e.g. res => res.data)',
      'Formatting raw values for UI presentation (dates, currencies, names)',
      'Computing derived numerical metrics from stream telemetry'
    ],
    pitfalls: [
      'Do NOT return Observables from map(); that yields Observable<Observable<T>> (use switchMap instead)',
      'Avoid side effects in projection functions; use tap() instead'
    ],
    relatedOperators: ['mapTo', 'pluck', 'scan', 'switchMap'],
    docUrl: 'https://rxjs.dev/api/operators/map',
    comparison: {
      features: [
        { id: 'outputType', label: 'Output Type', description: 'What type is emitted downstream' },
        { id: 'accumulation', label: 'Accumulation', description: 'Remembers past values' },
        { id: 'flattening', label: 'Flattens Observables', description: 'Subscribes to inner streams' }
      ],
      items: [
        {
          id: 'map',
          name: 'map',
          badge: '1-to-1 Sync',
          recommendedUse: 'Transforming values synchronously item by item',
          characteristics: {
            outputType: { text: 'Projected value T -> R', status: 'positive' },
            accumulation: { text: 'No (stateless)', status: 'neutral' },
            flattening: { text: 'No (emits Observable instance)', status: 'negative' }
          }
        },
        {
          id: 'scan',
          name: 'scan',
          badge: 'Accumulative',
          recommendedUse: 'Managing stateful accumulation over stream items',
          characteristics: {
            outputType: { text: 'Accumulated state R', status: 'positive' },
            accumulation: { text: 'Yes (accumulates past emissions)', status: 'positive' },
            flattening: { text: 'No', status: 'neutral' }
          }
        }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if the projection function inside map() returns an Observable?',
        options: [
          { id: 'A', text: 'The inner Observable is automatically subscribed and flattened' },
          { id: 'B', text: 'The output stream emits the Observable instances themselves (Observable<Observable<T>>)' },
          { id: 'C', text: 'RxJS throws a runtime compilation error' },
          { id: 'D', text: 'The stream completes immediately' }
        ],
        correctOptionId: 'B',
        explanation: 'map() performs 1-to-1 synchronous value mapping. Returning an Observable creates a higher-order Observable. Use switchMap, mergeMap, or concatMap to flatten inner Observables.'
      }
    ],
    metadata: {

      name: 'map',
      category: 'Transformation',
      signature: 'map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>',
      summary: 'Applies a given projection function to each value emitted by the source Observable.',
      description: 'Transforms each item emitted by an Observable by applying a function to each item.',
      difficulty: 'beginner',
      useCases: ['Transforming HTTP response payloads', 'Computing derived coordinates or formatted strings'],
      pitfalls: ['Do not return Observables from map; use switchMap/mergeMap instead'],
      relatedOperators: ['mapTo', 'scan', 'switchMap'],
      docUrl: 'https://rxjs.dev/api/operators/map'
    },
    pipelineFactory: (source$, params) => {
      const mult = params['multiplier'] !== undefined ? params['multiplier'] : 10;
      return source$.pipe(map(x => (typeof x === 'number' ? x * mult : x)));
    }
  },

  mapTo: {
    id: 'mapTo',
    name: 'mapTo',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'mapTo<T, R>(value: R): OperatorFunction<T, R>',
    summary: 'Emits the given constant value on the output Observable every time the source Observable emits a value.',
    description: 'Maps every source emission to the exact same static value regardless of the source input. Deprecated in RxJS 7 in favor of map(() => value).',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----3-----|',
      operator: 'mapTo("CONST")',
      output: '--CONST-CONST-CONST-|'
    },
    marbleString: '-1--2--3--| -> mapTo("CONST") -> -C--C--C--|',
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      {
        id: 'constantValue',
        name: 'Constant Value',
        type: 'text',
        defaultValue: 'SAVED',
        description: 'The static value to emit for every source notification.'
      }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'constantValue', name: 'Constant Value', type: 'text', defaultValue: 'SAVED' }],
      description: 'Emits this constant string for every item emitted by the source.'
    },
    initialMarbles: {
      inputStreams: [
        {
          id: 'src',
          label: 'source$',
          emissions: [
            { id: '1', timeMs: 400, value: 1, displayLabel: '1' },
            { id: '2', timeMs: 800, value: 2, displayLabel: '2' }
          ]
        }
      ],
      outputStream: {
        id: 'out',
        label: 'mapTo("SAVED")',
        emissions: [
          { id: 'o1', timeMs: 400, value: 'SAVED', displayLabel: 'SAVED' },
          { id: 'o2', timeMs: 800, value: 'SAVED', displayLabel: 'SAVED' }
        ]
      }
    },
    codeSnippet: `import { of } from 'rxjs';
import { mapTo } from 'rxjs/operators';

of(1, 2, 3)
  .pipe(mapTo('SAVED'))
  .subscribe(console.log); // 'SAVED', 'SAVED', 'SAVED'`,
    codeExample: `import { of } from 'rxjs';
import { mapTo } from 'rxjs/operators';

of(1, 2, 3)
  .pipe(mapTo('SAVED'))
  .subscribe(console.log);`,
    useCases: [
      'Mapping button click events to a boolean true or save status',
      'Ignoring source emission payload when only the trigger matters'
    ],
    pitfalls: [
      'Deprecated in RxJS 7.8; use map(() => value) in modern codebases.'
    ],
    relatedOperators: ['map'],
    comparison: {
      features: [{ id: 'type', label: 'Projection', description: 'How value is determined' }],
      items: [
        { id: 'mapTo', name: 'mapTo', recommendedUse: 'Static constant emission', characteristics: { type: { text: 'Static value', status: 'neutral' } } },
        { id: 'map', name: 'map', recommendedUse: 'Dynamic or computed emission', characteristics: { type: { text: 'Dynamic function', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the modern RxJS 7+ replacement for mapTo(val)?',
        options: [
          { id: 'A', text: 'tap(() => val)' },
          { id: 'B', text: 'map(() => val)' },
          { id: 'C', text: 'startWith(val)' },
          { id: 'D', text: 'of(val)' }
        ],
        correctOptionId: 'B',
        explanation: 'mapTo is deprecated; writing map(() => val) avoids the extra operator overhead and improves bundle tree-shaking.'
      }
    ],
        isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of map(() => value).",
    modernAlternative: "map(() => value)",
    metadata: {

      name: 'mapTo',
      category: 'Transformation',
      signature: 'mapTo<T, R>(value: R): OperatorFunction<T, R>',
      summary: 'Emits the given constant value on every source emission.',
      description: 'Maps each source value to the specified constant.',
      difficulty: 'beginner',
      useCases: [
        "Mapping button click events to a static boolean flag or action type constant",
        "Ignoring source notification payloads when only the event occurrence matters (e.g. interval tick to 'REFRESH')"
      ],
      pitfalls: [
        "Deprecated in RxJS 7; use map(() => value) which improves tree-shaking and eliminates runtime overhead",
        "If emitting an object or array reference, all subscribers share the exact same reference; use map(() => ({ ... })) for unique instances"
      ],
      relatedOperators: ["map","startWith"],
      docUrl: "https://rxjs.dev/api/operators/mapTo",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of map(() => value).",
      modernAlternative: "map(() => value)"
    },
    pipelineFactory: (source$, params) => {
      const val = params['constantValue'] ?? 'SAVED';
      return source$.pipe(mapTo(val));
    }
  },

  pluck: {
    id: 'pluck',
    name: 'pluck',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'pluck<T, R>(...properties: string[]): OperatorFunction<T, R>',
    summary: 'Maps each source value to its specified nested property.',
    description: 'Retrieves the value of a specified nested property from each emitted object. Deprecated in RxJS 7 in favor of map(x => x?.prop).',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--{name: "Alice"}---{name: "Bob"}---|',
      operator: 'pluck("name")',
      output: '--"Alice"-----------"Bob"-----------|'
    },
    defaultSourcePreset: 'objects',
    parameters: [
      {
        id: 'property',
        name: 'Property Key',
        type: 'text',
        defaultValue: 'name',
        description: 'Key of the object property to extract.'
      }
    ],
    interactiveConfig: {
      sourcePreset: 'objects',
      params: [{ id: 'property', name: 'Property Key', type: 'text', defaultValue: 'name' }],
      description: 'Plucks the specified key from object emissions.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'users$', emissions: [{ id: '1', timeMs: 400, value: { name: 'Alice' }, displayLabel: '{Alice}' }] }],
      outputStream: { id: 'out', label: 'pluck("name")', emissions: [{ id: 'o1', timeMs: 400, value: 'Alice', displayLabel: 'Alice' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { pluck } from 'rxjs/operators';

of({ user: { name: 'Alice' } }, { user: { name: 'Bob' } })
  .pipe(pluck('user', 'name'))
  .subscribe(console.log); // 'Alice', 'Bob'`,
    codeExample: `import { of } from 'rxjs';
import { pluck } from 'rxjs/operators';

of({ user: { name: 'Alice' } })
  .pipe(pluck('user', 'name'))
  .subscribe(console.log);`,
    comparison: {
      features: [{ id: 'typeSafety', label: 'Type Safety', description: 'TypeScript typing' }],
      items: [
        { id: 'pluck', name: 'pluck', recommendedUse: 'Legacy property extraction', characteristics: { typeSafety: { text: 'Untyped string paths', status: 'negative' } } },
        { id: 'map', name: 'map', recommendedUse: 'Modern typed extraction', characteristics: { typeSafety: { text: 'Fully type-safe via optional chaining', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Why was pluck deprecated in RxJS 7?',
        options: [
          { id: 'A', text: 'It was too slow' },
          { id: 'B', text: 'TypeScript optional chaining map(x => x?.prop) provides better type safety and smaller bundles' },
          { id: 'C', text: 'It could not handle arrays' },
          { id: 'D', text: 'It caused memory leaks' }
        ],
        correctOptionId: 'B',
        explanation: 'JavaScript optional chaining (?.) and map(x => x?.prop) offer compile-time type checking and zero runtime operator overhead.'
      }
    ],
        useCases: [
      "Extracting a single nested property value from structured API response objects",
      "Navigating nested object hierarchies in legacy RxJS 6 applications"
    ],
    pitfalls: [
      "Deprecated in RxJS 7. Pluck uses untyped string paths which break TypeScript type checking; use map(x => x?.prop) instead",
      "Accessing non-existent properties on null or undefined objects can cause runtime errors in older environments"
    ],
    relatedOperators: ["map","distinctUntilKeyChanged"],
    docUrl: "https://rxjs.dev/api/operators/pluck",
    isDeprecated: true,
    deprecationNotice: "Deprecated in RxJS 7 in favor of map(x => x?.prop) with optional chaining for compile-time type safety.",
    modernAlternative: "map(x => x?.prop)",
    metadata: {

      name: 'pluck',
      category: 'Transformation',
      signature: 'pluck<T, R>(...properties: string[]): OperatorFunction<T, R>',
      summary: 'Extracts a specified nested property from each emitted object.',
      description: 'Maps each source value to its specified property.',
      difficulty: 'beginner',
      useCases: [
        "Extracting a single nested property value from structured API response objects",
        "Navigating nested object hierarchies in legacy RxJS 6 applications"
      ],
      pitfalls: [
        "Deprecated in RxJS 7. Pluck uses untyped string paths which break TypeScript type checking; use map(x => x?.prop) instead",
        "Accessing non-existent properties on null or undefined objects can cause runtime errors in older environments"
      ],
      relatedOperators: ["map","distinctUntilKeyChanged"],
      docUrl: "https://rxjs.dev/api/operators/pluck",
      isDeprecated: true,
      deprecationNotice: "Deprecated in RxJS 7 in favor of map(x => x?.prop) with optional chaining for compile-time type safety.",
      modernAlternative: "map(x => x?.prop)"
    },
    pipelineFactory: (source$, params) => {
      const prop = params['property'] ?? 'name';
      return source$.pipe(map(x => (x && typeof x === 'object' ? (x as any)[prop] : x)));
    }
  },

  scan: {
    id: 'scan',
    name: 'scan',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'scan<T, R>(accumulator: (acc: R, value: T, index: number) => R, seed?: R): OperatorFunction<T, R>',
    summary: 'Applies an accumulator function over the source Observable, and returns each intermediate result with an optional seed value.',
    description: 'Like Array.prototype.reduce, but emits the current accumulated state after EACH emission from the source stream. The foundational operator for reactive state management.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1-----2-----3-----4-----|',
      operator: 'scan((acc, x) => acc + x, 0)',
      output: '--1-----3-----6-----10----|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      {
        id: 'seed',
        name: 'Initial Seed',
        type: 'number',
        defaultValue: 0,
        description: 'Starting value for the accumulator.'
      }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'seed', name: 'Initial Seed', type: 'number', defaultValue: 0 }],
      description: 'Emits running accumulated total after each value.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'numbers$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'scan(acc + curr)', emissions: [{ id: 'o1', timeMs: 300, value: 1, displayLabel: '1' }, { id: 'o2', timeMs: 600, value: 3, displayLabel: '3' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { scan } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(scan((acc, curr) => acc + curr, 0))
  .subscribe(console.log); // 1, 3, 6, 10, 15`,
    codeExample: `import { of } from 'rxjs';
import { scan } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(scan((acc, curr) => acc + curr, 0))
  .subscribe(console.log);`,
    comparison: {
      features: [
        { id: 'emissionTiming', label: 'Emission Timing', description: 'When values are emitted' },
        { id: 'intermediateState', label: 'Intermediate State', description: 'Emits step-by-step state' }
      ],
      items: [
        { id: 'scan', name: 'scan', recommendedUse: 'Running state accumulation', characteristics: { emissionTiming: { text: 'On every item', status: 'positive' }, intermediateState: { text: 'Yes', status: 'positive' } } },
        { id: 'reduce', name: 'reduce', recommendedUse: 'Final single aggregated summary', characteristics: { emissionTiming: { text: 'Only upon completion', status: 'neutral' }, intermediateState: { text: 'No (suppressed)', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the primary difference between scan() and reduce()?',
        options: [
          { id: 'A', text: 'scan only works on strings, reduce on numbers' },
          { id: 'B', text: 'scan emits every intermediate accumulated value, while reduce emits only the final value upon stream completion' },
          { id: 'C', text: 'reduce emits on every item, scan emits at the end' },
          { id: 'D', text: 'scan does not support an initial seed' }
        ],
        correctOptionId: 'B',
        explanation: 'scan emits intermediate states making it ideal for reactive stores, while reduce waits for the source stream to complete.'
      }
    ],
        useCases: [
      "Managing stateful accumulation over stream items such as a running shopping cart total or game score",
      "Implementing Redux-style state reducers (acc, curr) => newState purely within RxJS pipelines",
      "Buffering a running history of previous values without completing the stream"
    ],
    pitfalls: [
      "Scan emits intermediate accumulator values on every item; if you only want the final accumulated value upon stream completion, use reduce() instead",
      "Always provide an explicit seed value when the accumulator type differs from the source emission type to avoid unexpected type coercion"
    ],
    relatedOperators: ["reduce","pairwise","toArray"],
    docUrl: "https://rxjs.dev/api/operators/scan",
    metadata: {

      name: 'scan',
      category: 'Transformation',
      signature: 'scan<T, R>(accumulator: (acc: R, value: T) => R, seed?: R): OperatorFunction<T, R>',
      summary: 'Applies accumulator function and emits intermediate results.',
      description: 'Useful for managing reactive state or running totals.',
      difficulty: 'intermediate',
      useCases: [
        "Managing stateful accumulation over stream items such as a running shopping cart total or game score",
        "Implementing Redux-style state reducers (acc, curr) => newState purely within RxJS pipelines",
        "Buffering a running history of previous values without completing the stream"
      ],
      pitfalls: [
        "Scan emits intermediate accumulator values on every item; if you only want the final accumulated value upon stream completion, use reduce() instead",
        "Always provide an explicit seed value when the accumulator type differs from the source emission type to avoid unexpected type coercion"
      ],
      relatedOperators: ["reduce","pairwise","toArray"],
      docUrl: "https://rxjs.dev/api/operators/scan"
    },
    pipelineFactory: (source$, params) => {
      const seed = params['seed'] !== undefined ? params['seed'] : 0;
      return source$.pipe(scan((acc, curr) => (typeof curr === 'number' ? acc + curr : curr), seed));
    }
  },

  reduce: {
    id: 'reduce',
    name: 'reduce',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'reduce<T, R>(accumulator: (acc: R, value: T, index: number) => R, seed?: R): OperatorFunction<T, R>',
    summary: 'Applies an accumulator function over the source Observable, and returns the accumulated result when the source completes.',
    description: 'Aggregates all values into a single summary emission emitted only when the source completes. If source never completes, reduce never emits.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1-----2-----3-----4-----|',
      operator: 'reduce((acc, x) => acc + x, 0)',
      output: '--------------------------10|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'seed', name: 'Seed', type: 'number', defaultValue: 0, description: 'Seed value' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'seed', name: 'Seed', type: 'number', defaultValue: 0 }],
      description: 'Accumulates sum and emits final total when completed.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'numbers$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }], completedAtMs: 800 }],
      outputStream: { id: 'out', label: 'reduce(sum)', emissions: [{ id: 'o1', timeMs: 800, value: 3, displayLabel: '3' }], completedAtMs: 800 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { reduce } from 'rxjs/operators';

of(1, 2, 3, 4)
  .pipe(reduce((acc, curr) => acc + curr, 0))
  .subscribe(console.log); // 10`,
    codeExample: `import { of } from 'rxjs';
import { reduce } from 'rxjs/operators';

of(1, 2, 3, 4)
  .pipe(reduce((acc, curr) => acc + curr, 0))
  .subscribe(console.log);`,
    comparison: {
      features: [{ id: 'wait', label: 'Waits for completion', description: 'Requires complete notification' }],
      items: [
        { id: 'reduce', name: 'reduce', recommendedUse: 'Total aggregation', characteristics: { wait: { text: 'Yes, mandatory', status: 'positive' } } },
        { id: 'scan', name: 'scan', recommendedUse: 'Real-time state', characteristics: { wait: { text: 'No, emits on each tick', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if you apply reduce() to an infinite Observable (like interval())?',
        options: [
          { id: 'A', text: 'It emits every 1 second' },
          { id: 'B', text: 'It never emits because the source never completes' },
          { id: 'C', text: 'It throws a StackOverflowError' },
          { id: 'D', text: 'It completes immediately with the seed' }
        ],
        correctOptionId: 'B',
        explanation: 'reduce requires a complete notification from the source to emit its accumulated result. On infinite streams, it never emits.'
      }
    ],
        useCases: [
      "Summing, averaging, or aggregating an entire finite stream series once the source completes",
      "Calculating total transferred byte count or payload checksum from a completed chunked stream",
      "Building an aggregated summary report from a finite batch of emitted telemetry items"
    ],
    pitfalls: [
      "Reduce will NEVER emit a value if the source Observable is infinite (e.g. interval() or DOM events); the source MUST complete",
      "If the source completes without emitting any items and no seed was provided, reduce emits an EmptyError"
    ],
    relatedOperators: ["scan","toArray"],
    docUrl: "https://rxjs.dev/api/operators/reduce",
    metadata: {

      name: 'reduce',
      category: 'Transformation',
      signature: 'reduce<T, R>(accumulator: (acc: R, value: T) => R, seed?: R): OperatorFunction<T, R>',
      summary: 'Emits single accumulated value upon stream completion.',
      description: 'Waits for completion then emits total.',
      difficulty: 'intermediate',
      useCases: [
        "Summing, averaging, or aggregating an entire finite stream series once the source completes",
        "Calculating total transferred byte count or payload checksum from a completed chunked stream",
        "Building an aggregated summary report from a finite batch of emitted telemetry items"
      ],
      pitfalls: [
        "Reduce will NEVER emit a value if the source Observable is infinite (e.g. interval() or DOM events); the source MUST complete",
        "If the source completes without emitting any items and no seed was provided, reduce emits an EmptyError"
      ],
      relatedOperators: ["scan","toArray"],
      docUrl: "https://rxjs.dev/api/operators/reduce"
    },
    pipelineFactory: (source$, params) => {
      const seed = params['seed'] !== undefined ? params['seed'] : 0;
      return source$.pipe(reduce((acc, curr) => (typeof curr === 'number' ? acc + curr : curr), seed));
    }
  },

  toArray: {
    id: 'toArray',
    name: 'toArray',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'toArray<T>(): OperatorFunction<T, T[]>',
    summary: 'Collects all source emissions into an array and emits that array when the source completes.',
    description: 'Buffers all emissions throughout the lifetime of the Observable and emits an array of all collected items as a single emission upon source completion.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--a-----b-----c-----|',
      operator: 'toArray()',
      output: '--------------------[a,b,c]|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Collects all emissions into one array upon completion.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }], completedAtMs: 800 }],
      outputStream: { id: 'out', label: 'toArray()', emissions: [{ id: 'o1', timeMs: 800, value: [1, 2], displayLabel: '[1, 2]' }], completedAtMs: 800 }
    },
    codeSnippet: `import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';

of('Angular', 'RxJS', 'TypeScript')
  .pipe(toArray())
  .subscribe(console.log); // ['Angular', 'RxJS', 'TypeScript']`,
    codeExample: `import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';

of(1, 2, 3).pipe(toArray()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'format', label: 'Output Structure', description: 'Emits item or collection' }],
      items: [
        { id: 'toArray', name: 'toArray', recommendedUse: 'Converting stream into array', characteristics: { format: { text: 'Single array on complete', status: 'positive' } } },
        { id: 'bufferCount', name: 'bufferCount', recommendedUse: 'Periodic batching into chunks', characteristics: { format: { text: 'Multiple chunk arrays', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When does toArray() emit the collected array?',
        options: [
          { id: 'A', text: 'On every new emission' },
          { id: 'B', text: 'When the source completes' },
          { id: 'C', text: 'After 10 items' },
          { id: 'D', text: 'Immediately upon subscription' }
        ],
        correctOptionId: 'B',
        explanation: 'toArray accumulates all items until the source completes, then emits the array.'
      }
    ],
        useCases: [
      "Collecting all emitted items of a completed stream into a single JavaScript array",
      "Converting streaming or paginated API results into an array for legacy chart or table components",
      "Simplifying unit tests by capturing all stream emissions into a single assertion array"
    ],
    pitfalls: [
      "toArray will never emit anything if the source Observable never completes",
      "Collecting massive or unbounded streams into an array can consume large amounts of memory and risk out-of-memory crashes"
    ],
    relatedOperators: ["reduce","bufferTime","scan"],
    docUrl: "https://rxjs.dev/api/operators/toArray",
    metadata: {

      name: 'toArray',
      category: 'Transformation',
      signature: 'toArray<T>(): OperatorFunction<T, T[]>',
      summary: 'Collects all source emissions into an array upon completion.',
      description: 'Gathers all stream items and emits single array.',
      difficulty: 'beginner',
      useCases: [
        "Collecting all emitted items of a completed stream into a single JavaScript array",
        "Converting streaming or paginated API results into an array for legacy chart or table components",
        "Simplifying unit tests by capturing all stream emissions into a single assertion array"
      ],
      pitfalls: [
        "toArray will never emit anything if the source Observable never completes",
        "Collecting massive or unbounded streams into an array can consume large amounts of memory and risk out-of-memory crashes"
      ],
      relatedOperators: ["reduce","bufferTime","scan"],
      docUrl: "https://rxjs.dev/api/operators/toArray"
    },
    pipelineFactory: source$ => source$.pipe(toArray())
  },

  buffer: {
    id: 'buffer',
    name: 'buffer',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'buffer<T>(closingNotifier: Observable<any>): OperatorFunction<T, T[]>',
    summary: 'Collects output values of the source Observable until closingNotifier emits, then emits buffered values.',
    description: 'Buffers values from the source Observable and emits them as an array whenever a secondary notifier Observable emits.',
    difficulty: 'intermediate',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Flush Buffer (closingNotifier$)',
    asciiMarble: {
      input:  '--1--2----3--4----|',
      secondaryInput: '-------N-------N--|',
      operator: 'buffer(closingNotifier$)',
      output: '-------[1,2]---[3,4]|'
    },
    defaultSourcePreset: 'interval',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [],
      description: 'Values accumulate in a buffer until the notifier signal is fired.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'buffer(notifier)', emissions: [{ id: 'o1', timeMs: 700, value: [1, 2], displayLabel: '[1, 2]' }] }
    },
    codeSnippet: `import { interval, fromEvent } from 'rxjs';
import { buffer } from 'rxjs/operators';

const clicks$ = fromEvent(document, 'click');
interval(1000)
  .pipe(buffer(clicks$))
  .subscribe(buffered => console.log('Emitted since last click:', buffered));`,
    codeExample: `import { Subject, of } from 'rxjs';
import { buffer } from 'rxjs/operators';

const closing$ = new Subject();
const src$ = of(1, 2, 3);
src$.pipe(buffer(closing$)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'flushTrigger', label: 'Flush Trigger', description: 'What causes buffer to emit' }],
      items: [
        { id: 'buffer', name: 'buffer', recommendedUse: 'Flush on external event', characteristics: { flushTrigger: { text: 'Observable notification', status: 'positive' } } },
        { id: 'bufferCount', name: 'bufferCount', recommendedUse: 'Flush on item count', characteristics: { flushTrigger: { text: 'Buffer size reached', status: 'positive' } } },
        { id: 'bufferTime', name: 'bufferTime', recommendedUse: 'Flush on periodic timer', characteristics: { flushTrigger: { text: 'Elapsed milliseconds', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What triggers buffer() to emit its accumulated items?',
        options: [
          { id: 'A', text: 'A fixed count of 5 items' },
          { id: 'B', text: 'An emission from the closingNotifier Observable' },
          { id: 'C', text: 'A 1000ms delay' },
          { id: 'D', text: 'An error from source' }
        ],
        correctOptionId: 'B',
        explanation: 'buffer collects all items until closingNotifier emits a next notification.'
      }
    ],
        useCases: [
      "Batching incoming telemetry logs or socket messages until a flush notifier fires",
      "Grouping user keystrokes or mouse clicks during an active recording window triggered by user actions",
      "Collecting incoming data packets until a timer or network idle signal indicates readiness"
    ],
    pitfalls: [
      "If the closing notifier emits before the source emits any values, buffer emits an empty array `[]`",
      "If the closing notifier never emits, buffered items remain stored in memory indefinitely until source completion or unsubscription"
    ],
    relatedOperators: ["bufferCount","bufferTime","window"],
    docUrl: "https://rxjs.dev/api/operators/buffer",
    metadata: {

      name: 'buffer',
      category: 'Transformation',
      signature: 'buffer<T>(closingNotifier: Observable<any>): OperatorFunction<T, T[]>',
      summary: 'Collects output values until closingNotifier emits.',
      description: 'Buffers stream emissions until signaled.',
      difficulty: 'intermediate',
      useCases: [
        "Batching incoming telemetry logs or socket messages until a flush notifier fires",
        "Grouping user keystrokes or mouse clicks during an active recording window triggered by user actions",
        "Collecting incoming data packets until a timer or network idle signal indicates readiness"
      ],
      pitfalls: [
        "If the closing notifier emits before the source emits any values, buffer emits an empty array `[]`",
        "If the closing notifier never emits, buffered items remain stored in memory indefinitely until source completion or unsubscription"
      ],
      relatedOperators: ["bufferCount","bufferTime","window"],
      docUrl: "https://rxjs.dev/api/operators/buffer"
    },
    pipelineFactory: (source$, _, context) => {
      const notifier$ = context.notifier$ || timer(1200);
      return source$.pipe(buffer(notifier$));
    }
  },

  bufferCount: {
    id: 'bufferCount',
    name: 'bufferCount',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'bufferCount<T>(bufferSize: number, startBufferEvery?: number): OperatorFunction<T, T[]>',
    summary: 'Buffers the source Observable values until the size hits the specified bufferSize.',
    description: 'Collects values until bufferSize items are gathered, then emits the array. Optional startBufferEvery allows overlapping or skipping buffers.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      operator: 'bufferCount(2)',
      output: '-----[1,2]---[3,4]-[5]|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'bufferSize', name: 'Buffer Size', type: 'number', defaultValue: 2, min: 1, max: 10, description: 'Number of items per buffer chunk.' }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'bufferSize', name: 'Buffer Size', type: 'number', defaultValue: 2, min: 1, max: 10 }],
      description: 'Bundles items into chunks of specified size.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'bufferCount(2)', emissions: [{ id: 'o1', timeMs: 400, value: [1, 2], displayLabel: '[1, 2]' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { bufferCount } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(bufferCount(2))
  .subscribe(console.log); // [1, 2], [3, 4], [5]`,
    codeExample: `import { of } from 'rxjs';
import { bufferCount } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(bufferCount(2)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'chunking', label: 'Chunking Strategy', description: 'How items are grouped' }],
      items: [
        { id: 'bufferCount', name: 'bufferCount', recommendedUse: 'Batching by count (e.g. pagination or bulk saves)', characteristics: { chunking: { text: 'Fixed size N', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'If a stream of 5 items is piped through bufferCount(2), what are the emitted buffers?',
        options: [
          { id: 'A', text: '[1, 2], [3, 4]' },
          { id: 'B', text: '[1, 2], [3, 4], [5]' },
          { id: 'C', text: '[1, 2, 3, 4, 5]' },
          { id: 'D', text: '[1], [2], [3], [4], [5]' }
        ],
        correctOptionId: 'B',
        explanation: 'When the stream completes, any remaining partial buffer is emitted as [5].'
      }
    ],
        useCases: [
      "Batching database insert operations or HTTP bulk uploads into chunks of size N (e.g. 50 records per request)",
      "Implementing pagination or chunked grid rendering from a streaming datasource",
      "Creating overlapping sliding windows of items using the startBufferEvery parameter"
    ],
    pitfalls: [
      "Upon stream completion, any remaining uncompleted buffer with fewer than bufferSize items is emitted; handle partial arrays downstream if necessary",
      "Setting startBufferEvery smaller than bufferSize creates overlapping buffers that duplicate emissions across multiple arrays"
    ],
    relatedOperators: ["buffer","bufferTime","pairwise"],
    docUrl: "https://rxjs.dev/api/operators/bufferCount",
    metadata: {

      name: 'bufferCount',
      category: 'Transformation',
      signature: 'bufferCount<T>(bufferSize: number, startBufferEvery?: number): OperatorFunction<T, T[]>',
      summary: 'Buffers values until size hits bufferSize.',
      description: 'Batches items into arrays of size N.',
      difficulty: 'beginner',
      useCases: [
        "Batching database insert operations or HTTP bulk uploads into chunks of size N (e.g. 50 records per request)",
        "Implementing pagination or chunked grid rendering from a streaming datasource",
        "Creating overlapping sliding windows of items using the startBufferEvery parameter"
      ],
      pitfalls: [
        "Upon stream completion, any remaining uncompleted buffer with fewer than bufferSize items is emitted; handle partial arrays downstream if necessary",
        "Setting startBufferEvery smaller than bufferSize creates overlapping buffers that duplicate emissions across multiple arrays"
      ],
      relatedOperators: ["buffer","bufferTime","pairwise"],
      docUrl: "https://rxjs.dev/api/operators/bufferCount"
    },
    pipelineFactory: (source$, params) => {
      const size = params['bufferSize'] ?? 2;
      return source$.pipe(bufferCount(size));
    }
  },

  bufferTime: {
    id: 'bufferTime',
    name: 'bufferTime',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'bufferTime<T>(bufferTimeSpan: number): OperatorFunction<T, T[]>',
    summary: 'Buffers the source Observable values for a specific time period.',
    description: 'Collects values emitted during a time window and emits the collected array periodically.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--a--b------c------|',
      operator: 'bufferTime(1000)',
      output: '-------[a,b]-----[c]|'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'bufferTimeSpan', name: 'Time Window (ms)', type: 'slider', defaultValue: 1000, min: 200, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'bufferTimeSpan', name: 'Time Window', type: 'slider', defaultValue: 1000 }],
      description: 'Emits buffers at periodic time intervals.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 'x', displayLabel: 'x' }] }],
      outputStream: { id: 'out', label: 'bufferTime(1000)', emissions: [{ id: 'o1', timeMs: 1000, value: ['x'], displayLabel: "['x']" }] }
    },
    codeSnippet: `import { interval } from 'rxjs';
import { bufferTime, take } from 'rxjs/operators';

interval(300)
  .pipe(bufferTime(1000), take(3))
  .subscribe(console.log); // [0, 1, 2], [3, 4, 5], ...`,
    codeExample: `import { interval } from 'rxjs';
import { bufferTime, take } from 'rxjs/operators';

interval(300).pipe(bufferTime(1000), take(3)).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'time', label: 'Timing', description: 'Periodic release' }],
      items: [
        { id: 'bufferTime', name: 'bufferTime', recommendedUse: 'Time-window batching (e.g. audit logs, click batching)', characteristics: { time: { text: 'Fixed millisecond interval', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What does bufferTime emit if NO items were emitted during the time window?',
        options: [
          { id: 'A', text: 'Nothing' },
          { id: 'B', text: 'An empty array []' },
          { id: 'C', text: 'null' },
          { id: 'D', text: 'It throws an error' }
        ],
        correctOptionId: 'B',
        explanation: 'bufferTime emits an empty array [] at each interval tick if no values arrived.'
      }
    ],
        useCases: [
      "Throttling high-frequency analytics events or click coordinates by sending batches to the server every 2 seconds",
      "Batching high-throughput WebSocket messages into periodic UI render frames to prevent browser lag",
      "Aggregating typing characters in burst intervals for chat activity indicators"
    ],
    pitfalls: [
      "Emits an empty array `[]` every interval if no source events occurred during that time window; filter out empty arrays using filter(arr => arr.length > 0) if needed",
      "Setting maxBufferSize in conjunction with bufferTimeSpan can cause buffers to emit earlier than the interval if the count cap is reached"
    ],
    relatedOperators: ["bufferCount","throttleTime","debounceTime"],
    docUrl: "https://rxjs.dev/api/operators/bufferTime",
    metadata: {

      name: 'bufferTime',
      category: 'Transformation',
      signature: 'bufferTime<T>(bufferTimeSpan: number): OperatorFunction<T, T[]>',
      summary: 'Buffers values for a specific time period.',
      description: 'Periodic time-based buffer collection.',
      difficulty: 'intermediate',
      useCases: [
        "Throttling high-frequency analytics events or click coordinates by sending batches to the server every 2 seconds",
        "Batching high-throughput WebSocket messages into periodic UI render frames to prevent browser lag",
        "Aggregating typing characters in burst intervals for chat activity indicators"
      ],
      pitfalls: [
        "Emits an empty array `[]` every interval if no source events occurred during that time window; filter out empty arrays using filter(arr => arr.length > 0) if needed",
        "Setting maxBufferSize in conjunction with bufferTimeSpan can cause buffers to emit earlier than the interval if the count cap is reached"
      ],
      relatedOperators: ["bufferCount","throttleTime","debounceTime"],
      docUrl: "https://rxjs.dev/api/operators/bufferTime"
    },
    pipelineFactory: (source$, params) => {
      const timeSpan = params['bufferTimeSpan'] ?? 1000;
      return source$.pipe(bufferTime(timeSpan));
    }
  },

  bufferToggle: {
    id: 'bufferToggle',
    name: 'bufferToggle',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'bufferToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>): OperatorFunction<T, T[]>',
    summary: 'Buffers values from the source Observable started by openings and closed by closingSelector.',
    description: 'Allows dynamic buffer windows controlled by starting and stopping signals.',
    difficulty: 'advanced',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Open Buffer Window (openings$)',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      secondaryInput: '----O-----C------|',
      operator: 'bufferToggle(open$, () => close$)',
      output: '----------[2,3]--|'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'closingDuration', name: 'Window Duration (ms)', type: 'slider', defaultValue: 1000, min: 300, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'closingDuration', name: 'Window Duration', type: 'slider', defaultValue: 1000 }],
      description: 'Buffers values only while the toggle window is open.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'bufferToggle', emissions: [{ id: 'o1', timeMs: 1400, value: [1], displayLabel: '[1]' }] }
    },
    codeSnippet: `import { interval, fromEvent } from 'rxjs';
import { bufferToggle } from 'rxjs/operators';

const mousedown$ = fromEvent(document, 'mousedown');
const mouseup$ = fromEvent(document, 'mouseup');

interval(100)
  .pipe(bufferToggle(mousedown$, () => mouseup$))
  .subscribe(events => console.log('Captured while mouse down:', events));`,
    codeExample: `import { interval, timer } from 'rxjs';
import { bufferToggle } from 'rxjs/operators';

interval(200).pipe(bufferToggle(timer(500), () => timer(1000))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'windowControl', label: 'Window Control', description: 'How window start/stop is managed' }],
      items: [
        { id: 'bufferToggle', name: 'bufferToggle', recommendedUse: 'Drag-and-drop or gesture capture', characteristics: { windowControl: { text: 'Independent open and close streams', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Can bufferToggle maintain multiple overlapping open buffer windows simultaneously?',
        options: [
          { id: 'A', text: 'No, only one window can be active' },
          { id: 'B', text: 'Yes, every emission from openings starts a new concurrent buffer window' },
          { id: 'C', text: 'Only if the source emits numbers' },
          { id: 'D', text: 'Only in RxJS 6' }
        ],
        correctOptionId: 'B',
        explanation: 'Each emission from openings creates an independent buffer that closes when its corresponding closingSelector Observable emits.'
      }
    ],
        useCases: [
      "Collecting drag-and-drop mouse movements strictly while mouse button is held down (openings on mousedown, closings on mouseup)",
      "Buffering chat messages only while the user is actively viewing a specific modal dialog or recording session",
      "Capturing incoming audio samples while a 'push-to-talk' key is pressed"
    ],
    pitfalls: [
      "Every opening notification spawns a separate closing Observable; multiple simultaneous open windows will duplicate emissions into multiple buffers",
      "If the closing selector throws an error or never emits, the buffer will continue accumulating in memory without flushing"
    ],
    relatedOperators: ["bufferWhen","buffer","windowToggle"],
    docUrl: "https://rxjs.dev/api/operators/bufferToggle",
    metadata: {

      name: 'bufferToggle',
      category: 'Transformation',
      signature: 'bufferToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>): OperatorFunction<T, T[]>',
      summary: 'Buffers values opened by openings and closed by closingSelector.',
      description: 'Dynamic buffer capture windows.',
      difficulty: 'advanced',
      useCases: [
        "Collecting drag-and-drop mouse movements strictly while mouse button is held down (openings on mousedown, closings on mouseup)",
        "Buffering chat messages only while the user is actively viewing a specific modal dialog or recording session",
        "Capturing incoming audio samples while a 'push-to-talk' key is pressed"
      ],
      pitfalls: [
        "Every opening notification spawns a separate closing Observable; multiple simultaneous open windows will duplicate emissions into multiple buffers",
        "If the closing selector throws an error or never emits, the buffer will continue accumulating in memory without flushing"
      ],
      relatedOperators: ["bufferWhen","buffer","windowToggle"],
      docUrl: "https://rxjs.dev/api/operators/bufferToggle"
    },
    pipelineFactory: (source$, params, context) => {
      const open$ = context.notifier$ || timer(400);
      const duration = params['closingDuration'] ?? 1000;
      return source$.pipe(bufferToggle(open$, () => timer(duration)));
    }
  },

  bufferWhen: {
    id: 'bufferWhen',
    name: 'bufferWhen',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'bufferWhen<T>(closingSelector: () => Observable<any>): OperatorFunction<T, T[]>',
    summary: 'Buffers the source values and uses a closingSelector factory to determine when to close, emit, and reset the buffer.',
    description: 'Immediately opens a buffer, calls closingSelector to get an Observable that signals when to close the buffer, emits it, and repeats.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--a--b----c--d----|',
      operator: 'bufferWhen(() => closing$)',
      output: '-------[a,b]----[c,d]|'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'closingTime', name: 'Closing Period (ms)', type: 'slider', defaultValue: 1000, min: 200, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'closingTime', name: 'Closing Period', type: 'slider', defaultValue: 1000 }],
      description: 'Dynamically produces new closing signals upon each buffer completion.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 'x', displayLabel: 'x' }] }],
      outputStream: { id: 'out', label: 'bufferWhen', emissions: [{ id: 'o1', timeMs: 1000, value: ['x'], displayLabel: "['x']" }] }
    },
    codeSnippet: `import { interval, timer } from 'rxjs';
import { bufferWhen } from 'rxjs/operators';

interval(200)
  .pipe(bufferWhen(() => timer(Math.random() * 1500 + 500)))
  .subscribe(batch => console.log('Random-sized batch:', batch));`,
    codeExample: `import { interval, timer } from 'rxjs';
import { bufferWhen } from 'rxjs/operators';

interval(200).pipe(bufferWhen(() => timer(1000))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'repeatCycle', label: 'Buffer Reset', description: 'Lifecycle of buffer' }],
      items: [
        { id: 'bufferWhen', name: 'bufferWhen', recommendedUse: 'Dynamic or variable-duration buffer cycles', characteristics: { repeatCycle: { text: 'Fresh closing selector called each cycle', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'When is closingSelector invoked in bufferWhen()?',
        options: [
          { id: 'A', text: 'Only once upon initial subscription' },
          { id: 'B', text: 'At subscription, and immediately after each buffer closes to produce the next closing signal' },
          { id: 'C', text: 'Whenever source errors' },
          { id: 'D', text: 'Never' }
        ],
        correctOptionId: 'B',
        explanation: 'bufferWhen calls closingSelector at subscription and after each emission to start the next window.'
      }
    ],
        useCases: [
      "Buffering sensor data where the batch interval duration varies dynamically depending on network load or battery state",
      "Flushing cached requests when a dynamic retry backoff timer expires",
      "Batching financial transactions with dynamic timeout windows determined by market volatility"
    ],
    pitfalls: [
      "The closing selector function is invoked immediately upon buffer initialization and again immediately after every flush; ensure the closing Observable actually emits or completes",
      "Returning EMPTY from the closing selector causes the buffer to complete immediately"
    ],
    relatedOperators: ["bufferToggle","buffer","windowWhen"],
    docUrl: "https://rxjs.dev/api/operators/bufferWhen",
    metadata: {

      name: 'bufferWhen',
      category: 'Transformation',
      signature: 'bufferWhen<T>(closingSelector: () => Observable<any>): OperatorFunction<T, T[]>',
      summary: 'Buffers source values using dynamic closingSelector factory.',
      description: 'Factory-driven buffer reset cycle.',
      difficulty: 'advanced',
      useCases: [
        "Buffering sensor data where the batch interval duration varies dynamically depending on network load or battery state",
        "Flushing cached requests when a dynamic retry backoff timer expires",
        "Batching financial transactions with dynamic timeout windows determined by market volatility"
      ],
      pitfalls: [
        "The closing selector function is invoked immediately upon buffer initialization and again immediately after every flush; ensure the closing Observable actually emits or completes",
        "Returning EMPTY from the closing selector causes the buffer to complete immediately"
      ],
      relatedOperators: ["bufferToggle","buffer","windowWhen"],
      docUrl: "https://rxjs.dev/api/operators/bufferWhen"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['closingTime'] ?? 1000;
      return source$.pipe(bufferWhen(() => timer(ms)));
    }
  },

  window: {
    id: 'window',
    name: 'window',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'window<T>(windowBoundaries: Observable<any>): OperatorFunction<T, Observable<T>>',
    summary: 'Branch out the source Observable values as a nested Observable whenever windowBoundaries emits.',
    description: 'Similar to buffer, but instead of emitting an array of buffered items, it emits a nested Observable stream of items for each window.',
    difficulty: 'advanced',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Split Window (windowBoundaries$)',
    asciiMarble: {
      input:  '--1--2----3--4----|',
      secondaryInput: '-------W-------W--|',
      operator: 'window(windowBoundaries$)',
      output: '-------w1------w2-| (where w1 emits 1, 2)'
    },
    defaultSourcePreset: 'interval',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [],
      description: 'Emits an Observable window whenever signaled.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'window', emissions: [{ id: 'o1', timeMs: 800, value: [1], displayLabel: 'win([1])' }] }
    },
    codeSnippet: `import { interval, fromEvent } from 'rxjs';
import { window, mergeMap, toArray } from 'rxjs/operators';

const clicks$ = fromEvent(document, 'click');

interval(1000)
  .pipe(
    window(clicks$),
    mergeMap(win$ => win$.pipe(toArray()))
  )
  .subscribe(batch => console.log('Window emissions:', batch));`,
    codeExample: `import { interval, timer } from 'rxjs';
import { window, mergeMap, toArray } from 'rxjs/operators';

interval(300).pipe(window(timer(1000)), mergeMap(w$ => w$.pipe(toArray()))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'output', label: 'Output Type', description: 'Array vs Nested Observable' }],
      items: [
        { id: 'window', name: 'window', recommendedUse: 'Nested observable streaming per window', characteristics: { output: { text: 'Observable<T>', status: 'positive' } } },
        { id: 'buffer', name: 'buffer', recommendedUse: 'Direct array of values per window', characteristics: { output: { text: 'Array T[]', status: 'neutral' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What is the key difference between buffer() and window()?',
        options: [
          { id: 'A', text: 'buffer emits an array (T[]), whereas window emits a nested Observable (Observable<T>)' },
          { id: 'B', text: 'window only works on the browser window object' },
          { id: 'C', text: 'buffer is asynchronous, window is synchronous' },
          { id: 'D', text: 'window was removed in RxJS 7' }
        ],
        correctOptionId: 'A',
        explanation: 'window emits an Observable<T> for each branch, allowing real-time processing of items within that window before it closes.'
      }
    ],
        useCases: [
      "Splitting a continuous stream into nested Observables based on boundary notifier emissions",
      "Processing subgroups of stream emissions with dedicated downstream pipeline operators (like take, scan) per window",
      "Subscribing to and canceling inner stream processors dynamically without tearing down the parent source"
    ],
    pitfalls: [
      "Window emits nested Observables (Observable<Observable<T>>), not arrays; you must subscribe or flatten each inner window (e.g. via mergeAll, concatMap)",
      "Failing to subscribe to an emitted inner window before the next window opens may cause dropped emissions"
    ],
    relatedOperators: ["buffer","windowCount","windowTime"],
    docUrl: "https://rxjs.dev/api/operators/window",
    metadata: {

      name: 'window',
      category: 'Transformation',
      signature: 'window<T>(windowBoundaries: Observable<any>): OperatorFunction<T, Observable<T>>',
      summary: 'Branches source values into nested Observables based on boundary emissions.',
      description: 'Emits Observable per window.',
      difficulty: 'advanced',
      useCases: [
        "Splitting a continuous stream into nested Observables based on boundary notifier emissions",
        "Processing subgroups of stream emissions with dedicated downstream pipeline operators (like take, scan) per window",
        "Subscribing to and canceling inner stream processors dynamically without tearing down the parent source"
      ],
      pitfalls: [
        "Window emits nested Observables (Observable<Observable<T>>), not arrays; you must subscribe or flatten each inner window (e.g. via mergeAll, concatMap)",
        "Failing to subscribe to an emitted inner window before the next window opens may cause dropped emissions"
      ],
      relatedOperators: ["buffer","windowCount","windowTime"],
      docUrl: "https://rxjs.dev/api/operators/window"
    },
    pipelineFactory: (source$, _, context) => {
      const notifier$ = context.notifier$ || timer(1200);
      return source$.pipe(
        window(notifier$),
        mergeMap(win$ => win$.pipe(toArray()))
      );
    }
  },

  windowCount: {
    id: 'windowCount',
    name: 'windowCount',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'windowCount<T>(windowSize: number, startWindowEvery?: number): OperatorFunction<T, Observable<T>>',
    summary: 'Branch out the source Observable values as a nested Observable with each window containing windowSize values.',
    description: 'Divides stream into nested Observable windows of size N.',
    difficulty: 'intermediate',
    asciiMarble: {
      input:  '--1--2--3--4--5--|',
      operator: 'windowCount(2)',
      output: '----w1----w2---w3| (each w is an Observable)'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [
      { id: 'windowSize', name: 'Window Size', type: 'number', defaultValue: 2, min: 1, max: 10 }
    ],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [{ id: 'windowSize', name: 'Window Size', type: 'number', defaultValue: 2 }],
      description: 'Splits source into nested Observables of specified item count.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 200, value: 1, displayLabel: '1' }, { id: '2', timeMs: 400, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'windowCount(2)', emissions: [{ id: 'o1', timeMs: 400, value: [1, 2], displayLabel: 'win([1, 2])' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { windowCount, mergeMap, toArray } from 'rxjs/operators';

of(1, 2, 3, 4, 5)
  .pipe(
    windowCount(2),
    mergeMap(w$ => w$.pipe(toArray()))
  )
  .subscribe(console.log); // [1, 2], [3, 4], [5]`,
    codeExample: `import { of } from 'rxjs';
import { windowCount, mergeMap, toArray } from 'rxjs/operators';

of(1, 2, 3, 4, 5).pipe(windowCount(2), mergeMap(w$ => w$.pipe(toArray()))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'branch', label: 'Branching Strategy', description: 'Nested Observable vs array' }],
      items: [
        { id: 'windowCount', name: 'windowCount', recommendedUse: 'Count-based nested stream splitting', characteristics: { branch: { text: 'Observable<T> of count N', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What operator do you use to convert the nested Observable emitted by windowCount into an array?',
        options: [
          { id: 'A', text: 'toArray() inside mergeMap()' },
          { id: 'B', text: 'mapTo()' },
          { id: 'C', text: 'filter()' },
          { id: 'D', text: 'debounceTime()' }
        ],
        correctOptionId: 'A',
        explanation: 'Pipe each inner window Observable through toArray() inside a higher-order flattening operator like mergeMap.'
      }
    ],
        useCases: [
      "Partitioning a sequence of items into nested streams of exact count N for independent downstream processing",
      "Creating sliding windows of nested Observables to run localized statistical calculations across sliding sequences",
      "Routing batches of jobs to separate worker threads in chunks of N"
    ],
    pitfalls: [
      "Each window must be handled downstream; if inner Observables are not flattened or subscribed, memory leaks can occur",
      "Inner windows complete when their count is reached, which triggers completion callbacks on any subscribed inner pipelines"
    ],
    relatedOperators: ["bufferCount","window","windowTime"],
    docUrl: "https://rxjs.dev/api/operators/windowCount",
    metadata: {

      name: 'windowCount',
      category: 'Transformation',
      signature: 'windowCount<T>(windowSize: number, startWindowEvery?: number): OperatorFunction<T, Observable<T>>',
      summary: 'Splits source into nested Observables of size windowSize.',
      description: 'Count-based windowing.',
      difficulty: 'intermediate',
      useCases: [
        "Partitioning a sequence of items into nested streams of exact count N for independent downstream processing",
        "Creating sliding windows of nested Observables to run localized statistical calculations across sliding sequences",
        "Routing batches of jobs to separate worker threads in chunks of N"
      ],
      pitfalls: [
        "Each window must be handled downstream; if inner Observables are not flattened or subscribed, memory leaks can occur",
        "Inner windows complete when their count is reached, which triggers completion callbacks on any subscribed inner pipelines"
      ],
      relatedOperators: ["bufferCount","window","windowTime"],
      docUrl: "https://rxjs.dev/api/operators/windowCount"
    },
    pipelineFactory: (source$, params) => {
      const size = params['windowSize'] ?? 2;
      return source$.pipe(
        windowCount(size),
        mergeMap(w$ => w$.pipe(toArray()))
      );
    }
  },

  windowTime: {
    id: 'windowTime',
    name: 'windowTime',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'windowTime<T>(windowTimeSpan: number): OperatorFunction<T, Observable<T>>',
    summary: 'Branch out the source Observable values as a nested Observable periodically each windowTimeSpan.',
    description: 'Creates a new Observable window every windowTimeSpan milliseconds.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--a--b------c------|',
      operator: 'windowTime(1000)',
      output: '-------w1------w2--|'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'windowTimeSpan', name: 'Window Span (ms)', type: 'slider', defaultValue: 1000, min: 200, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'windowTimeSpan', name: 'Window Span', type: 'slider', defaultValue: 1000 }],
      description: 'Periodically branches emissions into fresh Observable windows.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'windowTime(1000)', emissions: [{ id: 'o1', timeMs: 1000, value: [1], displayLabel: 'win([1])' }] }
    },
    codeSnippet: `import { interval } from 'rxjs';
import { windowTime, mergeMap, toArray, take } from 'rxjs/operators';

interval(300)
  .pipe(
    windowTime(1000),
    mergeMap(w$ => w$.pipe(toArray())),
    take(3)
  )
  .subscribe(console.log);`,
    codeExample: `import { interval } from 'rxjs';
import { windowTime, mergeMap, toArray } from 'rxjs/operators';

interval(300).pipe(windowTime(1000), mergeMap(w$ => w$.pipe(toArray()))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'type', label: 'Window Type', description: 'Window timing' }],
      items: [
        { id: 'windowTime', name: 'windowTime', recommendedUse: 'Time-framed reactive stream branching', characteristics: { type: { text: 'Observable window per time span', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens to the previous window when a new windowTime window opens?',
        options: [
          { id: 'A', text: 'It completes' },
          { id: 'B', text: 'It errors out' },
          { id: 'C', text: 'It stays open forever' },
          { id: 'D', text: 'It emits undefined' }
        ],
        correctOptionId: 'A',
        explanation: 'When the time duration elapses, the current window Observable sends a complete notification.'
      }
    ],
        useCases: [
      "Segmenting a 24/7 telemetry feed into 1-minute nested Observable windows for time-bucketed aggregation",
      "Sampling user interactions into rolling time slices to calculate moving averages without collecting giant arrays",
      "Implementing time-based rate limiters with rolling time windows"
    ],
    pitfalls: [
      "Inner windows emit at each time interval even if the source was completely silent, emitting empty nested Observables",
      "Unsubscribed inner windows will continue their timer lifecycles unless properly unsubscribed or merged"
    ],
    relatedOperators: ["bufferTime","window","windowToggle"],
    docUrl: "https://rxjs.dev/api/operators/windowTime",
    metadata: {

      name: 'windowTime',
      category: 'Transformation',
      signature: 'windowTime<T>(windowTimeSpan: number): OperatorFunction<T, Observable<T>>',
      summary: 'Branch out values as nested Observables periodically.',
      description: 'Time-based nested Observable windows.',
      difficulty: 'advanced',
      useCases: [
        "Segmenting a 24/7 telemetry feed into 1-minute nested Observable windows for time-bucketed aggregation",
        "Sampling user interactions into rolling time slices to calculate moving averages without collecting giant arrays",
        "Implementing time-based rate limiters with rolling time windows"
      ],
      pitfalls: [
        "Inner windows emit at each time interval even if the source was completely silent, emitting empty nested Observables",
        "Unsubscribed inner windows will continue their timer lifecycles unless properly unsubscribed or merged"
      ],
      relatedOperators: ["bufferTime","window","windowToggle"],
      docUrl: "https://rxjs.dev/api/operators/windowTime"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['windowTimeSpan'] ?? 1000;
      return source$.pipe(
        windowTime(ms),
        mergeMap(w$ => w$.pipe(toArray()))
      );
    }
  },

  windowToggle: {
    id: 'windowToggle',
    name: 'windowToggle',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'windowToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>): OperatorFunction<T, Observable<T>>',
    summary: 'Branch out source values as nested Observables started by openings and closed by closingSelector.',
    description: 'Dynamic Observable window branch controller.',
    difficulty: 'advanced',
    hasNotifierTrigger: true,
    notifierLabel: '⚡ Open Window (openings$)',
    asciiMarble: {
      input:  '--1--2--3--4--|',
      secondaryInput: '----O-----C---|',
      operator: 'windowToggle(open$, () => close$)',
      output: '-------w1-----|'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'closingDuration', name: 'Window Span (ms)', type: 'slider', defaultValue: 1000, min: 300, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'closingDuration', name: 'Window Span', type: 'slider', defaultValue: 1000 }],
      description: 'Branches into nested Observables opened and closed by external streams.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'windowToggle', emissions: [{ id: 'o1', timeMs: 1400, value: [1], displayLabel: 'win([1])' }] }
    },
    codeSnippet: `import { interval, timer } from 'rxjs';
import { windowToggle, mergeMap, toArray } from 'rxjs/operators';

interval(200)
  .pipe(
    windowToggle(timer(500), () => timer(1000)),
    mergeMap(w$ => w$.pipe(toArray()))
  )
  .subscribe(console.log);`,
    codeExample: `import { interval, timer } from 'rxjs';
import { windowToggle, mergeMap, toArray } from 'rxjs/operators';

interval(200).pipe(windowToggle(timer(500), () => timer(1000)), mergeMap(w$ => w$.pipe(toArray()))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'control', label: 'Control', description: 'Stream gating' }],
      items: [
        { id: 'windowToggle', name: 'windowToggle', recommendedUse: 'Interactive window stream gating', characteristics: { control: { text: 'Observable pair open/close', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What does closingSelector return in windowToggle?',
        options: [
          { id: 'A', text: 'A boolean' },
          { id: 'B', text: 'An Observable that signals when that specific window should close' },
          { id: 'C', text: 'A number' },
          { id: 'D', text: 'A string' }
        ],
        correctOptionId: 'B',
        explanation: 'closingSelector takes the opening emission and returns an Observable whose next/complete closes that window.'
      }
    ],
        useCases: [
      "Opening a nested processing stream only when user enters a specific application mode and closing it on exit",
      "Streaming audio or video frames into an encoder Observable strictly between recording start and stop signals",
      "Monitoring server metrics only during scheduled high-traffic operational windows"
    ],
    pitfalls: [
      "If multiple opening emissions occur before previous closings, multiple concurrent inner Observables will be active simultaneously",
      "Closing selectors that fail to emit will cause inner windows to stay open indefinitely"
    ],
    relatedOperators: ["bufferToggle","windowWhen","window"],
    docUrl: "https://rxjs.dev/api/operators/windowToggle",
    metadata: {

      name: 'windowToggle',
      category: 'Transformation',
      signature: 'windowToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>): OperatorFunction<T, Observable<T>>',
      summary: 'Branch values into nested Observables opened/closed by streams.',
      description: 'Toggleable stream windows.',
      difficulty: 'advanced',
      useCases: [
        "Opening a nested processing stream only when user enters a specific application mode and closing it on exit",
        "Streaming audio or video frames into an encoder Observable strictly between recording start and stop signals",
        "Monitoring server metrics only during scheduled high-traffic operational windows"
      ],
      pitfalls: [
        "If multiple opening emissions occur before previous closings, multiple concurrent inner Observables will be active simultaneously",
        "Closing selectors that fail to emit will cause inner windows to stay open indefinitely"
      ],
      relatedOperators: ["bufferToggle","windowWhen","window"],
      docUrl: "https://rxjs.dev/api/operators/windowToggle"
    },
    pipelineFactory: (source$, params, context) => {
      const open$ = context.notifier$ || timer(400);
      const duration = params['closingDuration'] ?? 1000;
      return source$.pipe(
        windowToggle(open$, () => timer(duration)),
        mergeMap(w$ => w$.pipe(toArray()))
      );
    }
  },

  windowWhen: {
    id: 'windowWhen',
    name: 'windowWhen',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'windowWhen<T>(closingSelector: () => Observable<any>): OperatorFunction<T, Observable<T>>',
    summary: 'Branch out values as nested Observables with closing determined by closingSelector factory.',
    description: 'Dynamic Observable window creation with factory closing selector.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--a--b----c--d----|',
      operator: 'windowWhen(() => close$)',
      output: '-------w1------w2-|'
    },
    defaultSourcePreset: 'interval',
    parameters: [
      { id: 'closingTime', name: 'Closing Period (ms)', type: 'slider', defaultValue: 1000, min: 200, max: 3000, step: 100, unit: 'ms' }
    ],
    interactiveConfig: {
      sourcePreset: 'interval',
      params: [{ id: 'closingTime', name: 'Closing Period', type: 'slider', defaultValue: 1000 }],
      description: 'Dynamically produces new closing signals for window boundaries.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 400, value: 1, displayLabel: '1' }] }],
      outputStream: { id: 'out', label: 'windowWhen', emissions: [{ id: 'o1', timeMs: 1000, value: [1], displayLabel: 'win([1])' }] }
    },
    codeSnippet: `import { interval, timer } from 'rxjs';
import { windowWhen, mergeMap, toArray } from 'rxjs/operators';

interval(200)
  .pipe(
    windowWhen(() => timer(1000)),
    mergeMap(w$ => w$.pipe(toArray()))
  )
  .subscribe(console.log);`,
    codeExample: `import { interval, timer } from 'rxjs';
import { windowWhen, mergeMap, toArray } from 'rxjs/operators';

interval(200).pipe(windowWhen(() => timer(1000)), mergeMap(w$ => w$.pipe(toArray()))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'cycle', label: 'Window Cycle', description: 'How new windows start' }],
      items: [
        { id: 'windowWhen', name: 'windowWhen', recommendedUse: 'Sequential self-resetting window streams', characteristics: { cycle: { text: 'New window immediately upon previous close', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'Does windowWhen allow gaps between windows?',
        options: [
          { id: 'A', text: 'Yes' },
          { id: 'B', text: 'No, closing one window immediately opens the next window' },
          { id: 'C', text: 'Only if specified in options' },
          { id: 'D', text: 'Only on error' }
        ],
        correctOptionId: 'B',
        explanation: 'windowWhen immediately starts the next window as soon as the previous closingSelector Observable emits.'
      }
    ],
        useCases: [
      "Partitioning a continuous stream with dynamically calculated time spans based on payload volume or system load",
      "Splitting event logs into dynamic windows where each window duration is determined by previous emission attributes",
      "Creating dynamic sliding analysis windows for financial ticker analysis"
    ],
    pitfalls: [
      "The closing selector is invoked immediately when each window starts; if the selector emits synchronously, windows will open and close instantaneously in a rapid loop",
      "Inner Observables must be consumed downstream to avoid unhandled emissions"
    ],
    relatedOperators: ["bufferWhen","windowToggle","window"],
    docUrl: "https://rxjs.dev/api/operators/windowWhen",
    metadata: {

      name: 'windowWhen',
      category: 'Transformation',
      signature: 'windowWhen<T>(closingSelector: () => Observable<any>): OperatorFunction<T, Observable<T>>',
      summary: 'Branch values into nested Observables via dynamic factory.',
      description: 'Factory-governed window streams.',
      difficulty: 'advanced',
      useCases: [
        "Partitioning a continuous stream with dynamically calculated time spans based on payload volume or system load",
        "Splitting event logs into dynamic windows where each window duration is determined by previous emission attributes",
        "Creating dynamic sliding analysis windows for financial ticker analysis"
      ],
      pitfalls: [
        "The closing selector is invoked immediately when each window starts; if the selector emits synchronously, windows will open and close instantaneously in a rapid loop",
        "Inner Observables must be consumed downstream to avoid unhandled emissions"
      ],
      relatedOperators: ["bufferWhen","windowToggle","window"],
      docUrl: "https://rxjs.dev/api/operators/windowWhen"
    },
    pipelineFactory: (source$, params) => {
      const ms = params['closingTime'] ?? 1000;
      return source$.pipe(
        windowWhen(() => timer(ms)),
        mergeMap(w$ => w$.pipe(toArray()))
      );
    }
  },

  pairwise: {
    id: 'pairwise',
    name: 'pairwise',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'pairwise<T>(): OperatorFunction<T, [T, T]>',
    summary: 'Groups pairs of consecutive emissions together and emits them as an array of two values.',
    description: 'Puts the current value and previous value together as a 2-tuple [previous, current]. The first emission occurs on the second source item.',
    difficulty: 'beginner',
    asciiMarble: {
      input:  '--1-----2-----3-----4-----|',
      operator: 'pairwise()',
      output: '--------[1,2]-[2,3]-[3,4]-|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Emits [previous, current] pairs of consecutive emissions.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'source$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }, { id: '3', timeMs: 900, value: 3, displayLabel: '3' }] }],
      outputStream: { id: 'out', label: 'pairwise()', emissions: [{ id: 'o1', timeMs: 600, value: [1, 2], displayLabel: '[1, 2]' }, { id: 'o2', timeMs: 900, value: [2, 3], displayLabel: '[2, 3]' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { pairwise } from 'rxjs/operators';

of('first', 'second', 'third')
  .pipe(pairwise())
  .subscribe(console.log); // ['first', 'second'], ['second', 'third']`,
    codeExample: `import { of } from 'rxjs';
import { pairwise } from 'rxjs/operators';

of(1, 2, 3, 4).pipe(pairwise()).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'delta', label: 'Delta Calculation', description: 'Comparing consecutive values' }],
      items: [
        { id: 'pairwise', name: 'pairwise', recommendedUse: 'Comparing current value against previous value (delta)', characteristics: { delta: { text: 'Direct [prev, curr] tuple', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What happens if a stream emitting only ONE value is piped into pairwise()?',
        options: [
          { id: 'A', text: 'It emits [value, undefined]' },
          { id: 'B', text: 'It completes without emitting any values' },
          { id: 'C', text: 'It throws an error' },
          { id: 'D', text: 'It emits [value, value]' }
        ],
        correctOptionId: 'B',
        explanation: 'pairwise requires at least two consecutive emissions. If only one item is emitted before completion, it completes with zero emissions.'
      }
    ],
        useCases: [
      "Comparing consecutive values to determine direction of change (e.g. stock price rising or falling: [prev, curr])",
      "Calculating delta coordinates or velocity from consecutive mouse/touch movements (curr.x - prev.x)",
      "Detecting navigation transitions in single-page applications ([previousRoute, currentRoute])"
    ],
    pitfalls: [
      "Pairwise will NOT emit anything until the source has emitted at least TWO values; a single-item stream will complete with 0 emissions",
      "If the source emits only once and completes, downstream subscribers will receive no notifications without error"
    ],
    relatedOperators: ["scan","bufferCount","distinctUntilChanged"],
    docUrl: "https://rxjs.dev/api/operators/pairwise",
    metadata: {

      name: 'pairwise',
      category: 'Transformation',
      signature: 'pairwise<T>(): OperatorFunction<T, [T, T]>',
      summary: 'Groups pairs of consecutive emissions as [prev, curr].',
      description: 'Pairs consecutive stream emissions.',
      difficulty: 'beginner',
      useCases: [
        "Comparing consecutive values to determine direction of change (e.g. stock price rising or falling: [prev, curr])",
        "Calculating delta coordinates or velocity from consecutive mouse/touch movements (curr.x - prev.x)",
        "Detecting navigation transitions in single-page applications ([previousRoute, currentRoute])"
      ],
      pitfalls: [
        "Pairwise will NOT emit anything until the source has emitted at least TWO values; a single-item stream will complete with 0 emissions",
        "If the source emits only once and completes, downstream subscribers will receive no notifications without error"
      ],
      relatedOperators: ["scan","bufferCount","distinctUntilChanged"],
      docUrl: "https://rxjs.dev/api/operators/pairwise"
    },
    pipelineFactory: source$ => source$.pipe(pairwise())
  },

  groupBy: {
    id: 'groupBy',
    name: 'groupBy',
    category: 'transformation',
    categoryDisplayName: 'Transformation',
    signature: 'groupBy<T, K>(keySelector: (value: T) => K): OperatorFunction<T, GroupedObservable<K, T>>',
    summary: 'Groups the items emitted by an Observable according to a specified criterion, and emits these grouped items as GroupedObservables.',
    description: 'Partitions a stream into multiple sub-streams based on a key selector function. Each sub-stream is a GroupedObservable possessing a .key property.',
    difficulty: 'advanced',
    asciiMarble: {
      input:  '--{k:A,v:1}--{k:B,v:2}--{k:A,v:3}--|',
      operator: 'groupBy(x => x.k)',
      output: '--gA(1, 3)---gB(2)-------------------|'
    },
    defaultSourcePreset: 'sync_numbers',
    parameters: [],
    interactiveConfig: {
      sourcePreset: 'sync_numbers',
      params: [],
      description: 'Partitions incoming numbers into even and odd groups.'
    },
    initialMarbles: {
      inputStreams: [{ id: 'src', label: 'numbers$', emissions: [{ id: '1', timeMs: 300, value: 1, displayLabel: '1' }, { id: '2', timeMs: 600, value: 2, displayLabel: '2' }] }],
      outputStream: { id: 'out', label: 'groupBy', emissions: [{ id: 'o1', timeMs: 300, value: { group: 'odd', items: [1] }, displayLabel: 'odd:[1]' }] }
    },
    codeSnippet: `import { of } from 'rxjs';
import { groupBy, mergeMap, toArray } from 'rxjs/operators';

of(
  { type: 'fruit', name: 'apple' },
  { type: 'vegetable', name: 'carrot' },
  { type: 'fruit', name: 'banana' }
)
  .pipe(
    groupBy(item => item.type),
    mergeMap(group$ => group$.pipe(toArray()))
  )
  .subscribe(console.log);`,
    codeExample: `import { of } from 'rxjs';
import { groupBy, mergeMap, toArray } from 'rxjs/operators';

of(1, 2, 3, 4).pipe(groupBy(x => x % 2 === 0 ? 'even' : 'odd'), mergeMap(g$ => g$.pipe(toArray()))).subscribe(console.log);`,
    comparison: {
      features: [{ id: 'substreams', label: 'Sub-Streams', description: 'Stream partitioning' }],
      items: [
        { id: 'groupBy', name: 'groupBy', recommendedUse: 'Demultiplexing streams by category or user ID', characteristics: { substreams: { text: 'GroupedObservable with key property', status: 'positive' } } }
      ]
    },
    quiz: [
      {
        id: 'q1',
        question: 'What special property is attached to the Observables emitted by groupBy()?',
        options: [
          { id: 'A', text: '.id' },
          { id: 'B', text: '.key' },
          { id: 'C', text: '.groupName' },
          { id: 'D', text: '.index' }
        ],
        correctOptionId: 'B',
        explanation: 'groupBy emits GroupedObservables, each having a readonly key property matching the value returned by keySelector.'
      }
    ],
        useCases: [
      "Partitioning a mixed stream of user events by event type (e.g. 'click', 'scroll', 'keypress') into separate sub-streams",
      "Routing WebSocket messages to dedicated per-user or per-channel handlers based on a message channel ID",
      "Segmenting server logs by severity level ('INFO', 'WARN', 'ERROR') for segregated alerting pipelines"
    ],
    pitfalls: [
      "By default, group Observables never complete unless the main source completes; unbounded grouping keys can lead to memory leaks if durationSelector is omitted",
      "Each group is a GroupedObservable; you must flatten them (e.g. using mergeMap(group$ => group$.pipe(...))) to consume items"
    ],
    relatedOperators: ["filter","buffer","scan"],
    docUrl: "https://rxjs.dev/api/operators/groupBy",
    metadata: {

      name: 'groupBy',
      category: 'Transformation',
      signature: 'groupBy<T, K>(keySelector: (value: T) => K): OperatorFunction<T, GroupedObservable<K, T>>',
      summary: 'Groups items into GroupedObservables by key selector.',
      description: 'Partitions stream into keyed sub-streams.',
      difficulty: 'advanced',
      useCases: [
        "Partitioning a mixed stream of user events by event type (e.g. 'click', 'scroll', 'keypress') into separate sub-streams",
        "Routing WebSocket messages to dedicated per-user or per-channel handlers based on a message channel ID",
        "Segmenting server logs by severity level ('INFO', 'WARN', 'ERROR') for segregated alerting pipelines"
      ],
      pitfalls: [
        "By default, group Observables never complete unless the main source completes; unbounded grouping keys can lead to memory leaks if durationSelector is omitted",
        "Each group is a GroupedObservable; you must flatten them (e.g. using mergeMap(group$ => group$.pipe(...))) to consume items"
      ],
      relatedOperators: ["filter","buffer","scan"],
      docUrl: "https://rxjs.dev/api/operators/groupBy"
    },
    pipelineFactory: source$ =>
      source$.pipe(
        groupBy(x => (typeof x === 'number' ? (x % 2 === 0 ? 'even' : 'odd') : (x && x.type ? x.type : 'general'))),
        mergeMap(g$ => g$.pipe(toArray(), map(items => ({ group: g$.key, items }))))
      )
  }
};
