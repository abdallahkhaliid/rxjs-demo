# Module 3: Operator Data Architecture & Catalog Specification (65 Operators)
**Author**: Explorer 1 (`explorer_m3_1`)  
**Date**: 2026-11-06  
**Status**: COMPLETE / READY FOR IMPLEMENTATION

---

## 1. Observation

### 1.1 Requirements & Context Analysis
- **Authoritative Request (`ORIGINAL_REQUEST.md:22`)**:
  Module 3 requires comprehensive coverage across 5 operator categories totaling 65 operators:
  - Transformation (18 operators)
  - Filtering (19 operators)
  - Combination (11 operators)
  - Utility (12 operators)
  - Multicasting (5 operators)
  Sum: `18 + 19 + 11 + 12 + 5 = 65 operators`.

- **Milestone Plan (`PROJECT.md:80-84, 109`)**:
  - Item 31: Module 3 Transformation (18 ops)
  - Item 32: Module 3 Filtering (19 ops)
  - Item 33: Module 3 Combination (11 ops)
  - Item 34: Module 3 Utility (12 ops)
  - Item 35: Module 3 Multicasting (5 ops)
  - Milestone M3 status: `IN_PROGRESS`

- **Navigation & Search Indexing (`src/app/core/services/search.service.ts:44-58`)**:
  `MODULE_NAV_DATA` registers Module 3 with 5 category topic routes:
  - `/module3/transformation`
  - `/module3/filtering`
  - `/module3/combination`
  - `/module3/utility`
  - `/module3/multicasting`

- **Shared Component Contracts (`src/app/core/models/index.ts:33-108`)**:
  - `OperatorMetadata`: Requires `name`, `category: OperatorCategory`, `signature`, `summary`, `description`, `difficulty: 'beginner' | 'intermediate' | 'advanced'`, optional `useCases`, `pitfalls`, `marbleRules`, `relatedOperators`, `docUrl`.
  - `MarbleStream`: Requires `id`, `label`, optional `color`, `emissions: MarbleEmission[]`, optional `completedAtMs`, `errorAtMs`.
  - `MarbleEmission`: Requires `id`, `timeMs`, `value`, `displayLabel`, optional `color`, `shape`.
  - `QuizQuestion`: Requires `id`, `question`, optional `codeSnippet`, `options: QuizOption[]`, `correctOptionId`, `explanation`.
  - `OperatorCardComponent` (`src/app/shared/components/operator-card/operator-card.component.ts:12-48`): Accepts `[operator]="OperatorMetadata"`, `[showPlaygroundLink]="boolean"`, emits `navigate(name)`.
  - `MarbleDiagramComponent` (`src/app/shared/components/marble-diagram/marble-diagram.component.ts:22-34`): Accepts `[inputStreams]="MarbleStream[]"`, `[outputStream]="MarbleStream | null"`, `[operatorName]="string"`, `[durationMs]="number"`, `[isPlaying]="boolean"`.

- **Precedent from Module 1 & Module 2 (`src/app/features/module2-creation/creation-playground.component.ts:257-383`)**:
  Module 2 utilized a structured `CreationOperatorConfig` record and an imperative `buildObservable()` runner mapping operator IDs and tunable signal parameters to real RxJS execution.

---

## 2. Logic Chain

1. **Uniform Data Model**: Rather than having disparate structures per category, all 65 operators must adhere to a single unified contract: `OperatorData`.
2. **Component Reusability**: To seamlessly feed `<app-operator-card>`, `<app-marble-diagram>`, `<app-code-block>`, and `<app-quiz-block>`, `OperatorData` must either contain or structurally satisfy `OperatorMetadata`, `initialMarbles`, `codeExample`, and `quiz: QuizQuestion[]`.
3. **Ascii & SVG Marble Parity**: Each operator needs an ASCII marble diagram representation (e.g., `--1--2--3--|`) for fast textual reference and documentation, alongside an `initialMarbles` configuration for the interactive SVG diagram.
4. **Interactive Parameter Schema**: Operators require dynamic parameter tuning in the UI (e.g. `multiplier` in `map`, `dueTimeMs` in `debounceTime`, `bufferSize` in `bufferCount`). A typed `InteractiveConfig` with `TunableParam[]` enables generic, declarative UI rendering (sliders, checkboxes, select dropdowns) without bespoke HTML per operator.
5. **Executable Pipeline Architecture**: The component runner should not resort to `eval()`. Instead, each operator must have an authentic execution recipe connecting a source stream (or streams for combination operators) to the real RxJS operator via an execution dispatcher function: `executeOperatorPipeline(operatorId, params, primary$, secondary$)`.
6. **RxJS 7.8 Compatibility**: Package dependencies indicate `rxjs: ~7.8.0`. Several operators (`mapTo`, `pluck`, `repeatWhen`, `retryWhen`, `multicast`, `publish`, `refCount`) are deprecated in RxJS 7/8 in favor of modern alternatives (`map`, `repeat({ delay })`, `retry({ delay })`, `share`). The data model documents both the canonical operator behavior and explicitly warns users about modern replacements in `pitfalls`.

---

## 3. TypeScript Interfaces & Data Models

The following TypeScript contracts are specified for `src/app/features/module3-operators/module3.data.ts`:

```typescript
import { OperatorMetadata, QuizQuestion, MarbleStream } from '../../core/models';
import { Observable } from 'rxjs';

export type Module3Category =
  | 'transformation'
  | 'filtering'
  | 'combination'
  | 'utility'
  | 'multicasting';

export type ParamType = 'number' | 'boolean' | 'select' | 'text';

export interface TunableParam {
  key: string;
  label: string;
  type: ParamType;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  options?: { label: string; value: any }[];
  description?: string;
}

export type SourceStreamPreset =
  | 'numbers_interval'    // periodic interval numbers (e.g. 1, 2, 3, 4, 5)
  | 'sync_numbers'        // of(1, 2, 3, 4, 5)
  | 'sync_strings'        // of('alpha', 'beta', 'gamma')
  | 'objects_stream'      // stream of user/entity objects
  | 'timer_stream'        // timer(due, period)
  | 'burst_stream'        // clustered rapid emissions for debounce/throttle
  | 'error_prone_stream'  // stream that emits then errors for retry testing
  | 'dual_streams';       // primary and secondary streams for combination

export interface InteractiveConfig {
  sourcePreset: SourceStreamPreset;
  params: TunableParam[];
  description: string;
  sourceStreamLabel?: string;
  secondaryStreamLabel?: string;
}

export interface AsciiMarble {
  input: string;
  secondaryInput?: string;
  operator: string;
  output: string;
}

export interface OperatorData {
  id: string;
  name: string;
  category: Module3Category;
  categoryDisplayName: 'Transformation' | 'Filtering' | 'Combination' | 'Utility' | 'Multicasting';
  signature: string;
  summary: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  asciiMarble: AsciiMarble;
  marbleString: string;
  initialMarbles: {
    inputStreams: MarbleStream[];
    outputStream: MarbleStream;
  };
  useCases: string[];
  pitfalls: string[];
  relatedOperators: string[];
  docUrl: string;
  codeExample: string;
  interactiveConfig: InteractiveConfig;
  quiz: QuizQuestion[];
  metadata: OperatorMetadata;
}
```

---

## 4. Pipeline Execution Architecture

To execute the pipelines authentically in the interactive runner, we define the standardized pipeline dispatcher:

```typescript
export interface PipelineExecutionSources {
  primary$: Observable<any>;
  secondary$?: Observable<any>;
}

export function buildSourceStreams(
  preset: SourceStreamPreset,
  customConfig?: Record<string, any>
): PipelineExecutionSources {
  // Dispatches to RxJS creation functions (interval, of, timer, etc.)
  // Handles dual streams for combination operators.
}

export function executeOperatorPipeline(
  operatorId: string,
  params: Record<string, any>,
  sources: PipelineExecutionSources
): Observable<any> {
  // Real RxJS pipeline execution with pipe() and the real operator
}
```

---

## 5. Complete Operator Catalog Specification (All 65 Operators)

Below is the complete specification for each of the 65 operators grouped by category.

### 5.1 Category 1: Transformation Operators (18 Operators)

#### 1. `map`
- **ID**: `map` | **Difficulty**: `beginner`
- **Signature**: `map<T, R>(project: (value: T, index: number) => R): OperatorFunction<T, R>`
- **Summary**: Applies a given projection function to each value emitted by the source Observable, and emits the resulting values.
- **Description**: Similar to Array.prototype.map, `map` transforms each item in a stream sequentially and synchronously as it arrives, forwarding the returned value to downstream subscribers.
- **ASCII Marble**:
  ```text
  Input:  --1-----2-----3-----4-----|
  Op:     map(x => x * 10)
  Output: --10----20----30----40----|
  ```
- **Marble String**: `-1--2--3--| -> map(x => x * 10) -> -10--20--30--|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 400, value: 1, displayLabel: '1' }, { timeMs: 800, value: 2, displayLabel: '2' }, { timeMs: 1200, value: 3, displayLabel: '3' }]` (complete: 1500ms)
  - Output: `[{ timeMs: 400, value: 10, displayLabel: '10' }, { timeMs: 800, value: 20, displayLabel: '20' }, { timeMs: 1200, value: 30, displayLabel: '30' }]` (complete: 1500ms)
- **Use Cases**:
  1. Extracting nested response data from HTTP API responses (e.g. `res => res.data`).
  2. Formatting raw data for UI presentation (e.g. dates, currencies, labels).
  3. Computing derived numerical metrics from incoming sensor telemetry.
- **Pitfalls**:
  1. Do NOT perform asynchronous calls or return Observables inside `map`; doing so creates an `Observable<Observable<T>>` (use `switchMap` or `mergeMap` instead).
  2. Avoid side effects inside the projection function; use `tap()` for logging or telemetry.
- **Related Operators**: `mapTo`, `pluck`, `scan`, `switchMap`
- **Doc URL**: `https://rxjs.dev/api/operators/map`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `multiplier`: `{ type: 'number', label: 'Multiplier (x * N)', defaultValue: 10, min: -10, max: 100, step: 1 }`
  - `description`: "Adjust the multiplier to see each emitted value multiplied instantly."
- **Pipeline Recipe**: `primary$.pipe(map(x => typeof x === 'number' ? x * (params['multiplier'] ?? 10) : x))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { map } from 'rxjs/operators';

  of(1, 2, 3, 4)
    .pipe(map(val => val * 10))
    .subscribe(console.log); // 10, 20, 30, 40
  ```
- **Quiz**:
  - Q: "What happens if the projection function inside `map()` returns an Observable?"
  - Options:
    - A: "The inner Observable is automatically subscribed to and flattened"
    - B: "The output stream emits the Observable instances themselves (a higher-order stream)"
    - C: "RxJS throws a runtime compilation error"
    - D: "The stream completes immediately"
  - Correct: `B`
  - Explanation: `map()` transforms values 1-to-1. If you return an Observable from `map`, you produce an `Observable<Observable<T>>`. To flatten inner streams, use `switchMap`, `mergeMap`, or `concatMap`.

---

#### 2. `mapTo`
- **ID**: `mapTo` | **Difficulty**: `beginner`
- **Signature**: `mapTo<T, R>(value: R): OperatorFunction<T, R>`
- **Summary**: Emits the given constant value on every emission from the source Observable.
- **Description**: Replaces every incoming emission with a static value. Note: In RxJS 7/8, `mapTo` is deprecated in favor of `map(() => value)`.
- **ASCII Marble**:
  ```text
  Input:  --1-----2-----3-----|
  Op:     mapTo('CLICK')
  Output: --CLICK-CLICK-CLICK-|
  ```
- **Marble String**: `-1--2--3--| -> mapTo('PING') -> -PING--PING--PING--|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 400, value: 1, displayLabel: '1' }, { timeMs: 800, value: 2, displayLabel: '2' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 400, value: 'PING', displayLabel: 'PING' }, { timeMs: 800, value: 'PING', displayLabel: 'PING' }]` (complete: 1200ms)
- **Use Cases**:
  1. Mapping user clicks or action triggers to a constant notification or enum action.
  2. Resetting state triggers (e.g., mapping any event to `null` or `true`).
- **Pitfalls**:
  1. Deprecated in RxJS 7. Use `map(() => constantValue)` instead.
  2. If the constant value is an object or array, all emissions share the exact same memory reference.
- **Related Operators**: `map`, `startWith`
- **Doc URL**: `https://rxjs.dev/api/operators/mapTo`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `constantValue`: `{ type: 'text', label: 'Constant Value', defaultValue: 'ACTIVE' }`
  - `description`: "Replaces every item emitted with this constant string."
- **Pipeline Recipe**: `primary$.pipe(mapTo(params['constantValue'] ?? 'ACTIVE'))`
- **Code Example**:
  ```typescript
  import { fromEvent } from 'rxjs';
  import { mapTo } from 'rxjs/operators';

  fromEvent(document, 'click')
    .pipe(mapTo('USER_CLICKED'))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "Why was `mapTo` deprecated in RxJS 7 in favor of `map(() => val)`?"
  - Options:
    - A: "`mapTo` did not support async schedulers"
    - B: "To reduce library bundle size and avoid subtle reference-sharing bugs with mutable objects"
    - C: "Because TypeScript cannot type-check strings"
    - D: "It was slower than `filter`"
  - Correct: `B`
  - Explanation: Passing an object to `mapTo({ status: 'ok' })` shares the single object instance across all emissions, risking accidental mutation. `map(() => ({ status: 'ok' }))` creates fresh objects and unifies the API.

---

#### 3. `pluck`
- **ID**: `pluck` | **Difficulty**: `beginner`
- **Signature**: `pluck<T, R>(...properties: string[]): OperatorFunction<T, R>`
- **Summary**: Maps each source value to its specified nested property.
- **Description**: Retrieves a nested property by string keys. Note: Deprecated in RxJS 7 in favor of `map(x => x?.prop)`.
- **ASCII Marble**:
  ```text
  Input:  --{u:'Alice'}--{u:'Bob'}--|
  Op:     pluck('u')
  Output: --'Alice'------'Bob'------|
  ```
- **Marble String**: `-{u:'Alice'}--{u:'Bob'}--| -> pluck('u') -> -Alice--Bob--|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 400, value: { u: 'Alice' }, displayLabel: '{u:Alice}' }, { timeMs: 800, value: { u: 'Bob' }, displayLabel: '{u:Bob}' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 400, value: 'Alice', displayLabel: 'Alice' }, { timeMs: 800, value: 'Bob', displayLabel: 'Bob' }]` (complete: 1200ms)
- **Use Cases**:
  1. Extracting `target.value` from DOM event streams.
  2. Picking specific keys from backend JSON payload objects.
- **Pitfalls**:
  1. Deprecated in RxJS 7. TypeScript compiler cannot reliably infer strict types or verify nested keys.
  2. Use optional chaining `map(obj => obj?.user?.name)` instead.
- **Related Operators**: `map`, `distinctUntilKeyChanged`
- **Doc URL**: `https://rxjs.dev/api/operators/pluck`
- **Interactive Config**:
  - `sourcePreset`: `'objects_stream'`
  - `params`:
    - `propertyKey`: `{ type: 'select', label: 'Object Property', defaultValue: 'name', options: [{ label: 'name', value: 'name' }, { label: 'role', value: 'role' }, { label: 'id', value: 'id' }] }`
  - `description`: "Plucks the chosen property from each stream object."
- **Pipeline Recipe**: `primary$.pipe(pluck(params['propertyKey'] ?? 'name'))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { pluck } from 'rxjs/operators';

  of({ id: 1, name: 'Alice' }, { id: 2, name: 'Bob' })
    .pipe(pluck('name'))
    .subscribe(console.log); // 'Alice', 'Bob'
  ```
- **Quiz**:
  - Q: "What is the idiomatic modern RxJS alternative to `pluck('user', 'address', 'city')`?"
  - Options:
    - A: "`filter(x => x.user.address.city)`"
    - B: "`map(x => x?.user?.address?.city)`"
    - C: "`scan(x => x.city)`"
    - D: "`select('city')`"
  - Correct: `B`
  - Explanation: Modern TypeScript and RxJS recommend `map(x => x?.user?.address?.city)` for full type safety, autocomplete, and optional chaining.

---

#### 4. `scan`
- **ID**: `scan` | **Difficulty**: `intermediate`
- **Signature**: `scan<T, R>(accumulator: (acc: R, value: T, index: number) => R, seed?: R): OperatorFunction<T, R>`
- **Summary**: Progressively applies an accumulator function over the source Observable, emitting each intermediate result.
- **Description**: The reactive equivalent of Array.prototype.reduce, but emits on every single source emission instead of waiting for completion. Perfect for managing accumulative local state.
- **ASCII Marble**:
  ```text
  Input:  --1-----2-----3-----4-----|
  Op:     scan((acc, curr) => acc + curr, 0)
  Output: --1-----3-----6-----10----|
  ```
- **Marble String**: `-1--2--3--4--| -> scan((acc, x) => acc + x, 0) -> -1--3--6--10--|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 300, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }, { timeMs: 900, value: 3, displayLabel: '3' }, { timeMs: 1200, value: 4, displayLabel: '4' }]` (complete: 1500ms)
  - Output: `[{ timeMs: 300, value: 1, displayLabel: '1' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 900, value: 6, displayLabel: '6' }, { timeMs: 1200, value: 10, displayLabel: '10' }]` (complete: 1500ms)
- **Use Cases**:
  1. Reactive state management (Redux/Store pattern: aggregating actions into an application state tree).
  2. Running totals, counters, shopping cart line-item aggregations.
  3. Tracking mouse trajectory or scroll delta over time.
- **Pitfalls**:
  1. If no seed is provided, the first source emission is emitted immediately as the initial accumulator value without running the accumulator function.
  2. Emits continuously; if you only want the final accumulated sum after the stream completes, use `reduce()`.
- **Related Operators**: `reduce`, `pairwise`, `bufferCount`
- **Doc URL**: `https://rxjs.dev/api/operators/scan`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `operation`: `{ type: 'select', label: 'Accumulator Mode', defaultValue: 'sum', options: [{ label: 'Running Sum (+)', value: 'sum' }, { label: 'Running Product (*)', value: 'multiply' }, { label: 'Running Max', value: 'max' }] }`
    - `seed`: `{ type: 'number', label: 'Initial Seed', defaultValue: 0, min: 0, max: 100, step: 1 }`
  - `description`: "Accumulates each value into a running aggregate and emits each intermediate step."
- **Pipeline Recipe**: `primary$.pipe(scan((acc: number, curr: number) => { if (params['operation'] === 'multiply') return (acc || 1) * curr; if (params['operation'] === 'max') return Math.max(acc, curr); return acc + curr; }, params['seed'] ?? 0))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { scan } from 'rxjs/operators';

  of(1, 2, 3, 4)
    .pipe(scan((acc, curr) => acc + curr, 0))
    .subscribe(console.log); // 1, 3, 6, 10
  ```
- **Quiz**:
  - Q: "How does `scan` differ from `reduce` in RxJS?"
  - Options:
    - A: "`scan` works only on numbers, `reduce` works on any type"
    - B: "`scan` emits every intermediate accumulated state; `reduce` emits only once when the source completes"
    - C: "`reduce` is synchronous while `scan` is asynchronous"
    - D: "`scan` requires an async scheduler"
  - Correct: `B`
  - Explanation: `scan` is an intermediate accumulator emitting after each step (ideal for streaming state). `reduce` waits for stream completion and emits only the single final accumulated value.

---

#### 5. `reduce`
- **ID**: `reduce` | **Difficulty**: `intermediate`
- **Signature**: `reduce<T, R>(accumulator: (acc: R, value: T, index: number) => R, seed?: R): OperatorFunction<T, R>`
- **Summary**: Applies an accumulator function over the source Observable, and emits the final accumulated result only when the source completes.
- **Description**: Collects all emissions from the source stream using an accumulator function and emits the final value as a single emission upon stream completion.
- **ASCII Marble**:
  ```text
  Input:  --1-----2-----3-----4-----|
  Op:     reduce((acc, curr) => acc + curr, 0)
  Output: --------------------------10|
  ```
- **Marble String**: `-1--2--3--4--| -> reduce((a,b) => a+b, 0) -> -------------10|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 300, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }, { timeMs: 900, value: 3, displayLabel: '3' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 1200, value: 6, displayLabel: '6' }]` (complete: 1200ms)
- **Use Cases**:
  1. Calculating aggregate summary metrics (grand totals, averages) over a bounded batch of records.
  2. Compiling completed batch responses into a single summary report.
- **Pitfalls**:
  1. NEVER emits if the source Observable does not complete (e.g. an open `interval()` or continuous event stream).
  2. If the source completes without emitting any values and no seed is provided, a `TypeError` (EmptyError) is thrown.
- **Related Operators**: `scan`, `toArray`, `count`
- **Doc URL**: `https://rxjs.dev/api/operators/reduce`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `seed`: `{ type: 'number', label: 'Seed Value', defaultValue: 0, min: 0, max: 100 }`
  - `description`: "Waits until the stream completes, then outputs the final accumulated value."
- **Pipeline Recipe**: `primary$.pipe(reduce((acc: number, curr: number) => acc + curr, params['seed'] ?? 0))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { reduce } from 'rxjs/operators';

  of(10, 20, 30)
    .pipe(reduce((total, val) => total + val, 0))
    .subscribe(console.log); // 60
  ```
- **Quiz**:
  - Q: "What happens if `reduce()` is applied to `interval(1000)` without an unsubscription or `take()` operator?"
  - Options:
    - A: "It emits a running sum every second"
    - B: "It errors immediately"
    - C: "It never emits any value because `interval()` is an infinite stream that never completes"
    - D: "It completes after emitting 0"
  - Correct: `C`
  - Explanation: `reduce()` buffers accumulation internally until the source stream sends a `complete` notification. Because `interval()` is infinite, `reduce()` will never emit unless capped (e.g., via `take()`).

---

#### 6. `toArray`
- **ID**: `toArray` | **Difficulty**: `beginner`
- **Signature**: `toArray<T>(): OperatorFunction<T, T[]>`
- **Summary**: Collects all source emissions into an array and emits that array when the source completes.
- **Description**: Accumulates all emissions into an in-memory array and delivers the array as a single next emission upon stream completion.
- **ASCII Marble**:
  ```text
  Input:  --1-----2-----3-----|
  Op:     toArray()
  Output: --------------------[1,2,3]|
  ```
- **Marble String**: `-1--2--3--| -> toArray() -> -------------[1,2,3]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 300, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }, { timeMs: 900, value: 3, displayLabel: '3' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 1200, value: [1, 2, 3], displayLabel: '[1,2,3]' }]` (complete: 1200ms)
- **Use Cases**:
  1. Converting a stream of paginated results or individual items into an array for rendering in an Angular table.
  2. Unit testing: capturing all emissions of an Observable sequence into a single array to assert against.
- **Pitfalls**:
  1. Like `reduce`, will never emit if the source never completes.
  2. Storing millions of stream items in an array can cause high heap memory usage.
- **Related Operators**: `reduce`, `bufferCount`
- **Doc URL**: `https://rxjs.dev/api/operators/toArray`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Collects all items from the stream and emits them as a single array when the stream completes."
- **Pipeline Recipe**: `primary$.pipe(toArray())`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { take, toArray } from 'rxjs/operators';

  interval(100)
    .pipe(take(4), toArray())
    .subscribe(console.log); // [0, 1, 2, 3]
  ```
- **Quiz**:
  - Q: "What is emitted by `toArray()` if the source Observable completes without emitting any items?"
  - Options:
    - A: "`null`"
    - B: "`undefined`"
    - C: "An empty array `[]`"
    - D: "An EmptyError exception"
  - Correct: `C`
  - Explanation: When the source completes with zero items, `toArray()` emits an empty array `[]` followed by completion.

---

#### 7. `buffer`
- **ID**: `buffer` | **Difficulty**: `intermediate`
- **Signature**: `buffer<T>(closingNotifier: Observable<any>): OperatorFunction<T, T[]>`
- **Summary**: Collects source values into an array until a `closingNotifier` Observable emits, then emits and resets the buffer.
- **Description**: Accumulates values in a buffer array and releases that buffer whenever the `closingNotifier` observable produces an emission.
- **ASCII Marble**:
  ```text
  Input:     --1--2----3--4----5--|
  Notifier:  -------N-------N----|
  Output:    -------[1,2]---[3,4]-|
  ```
- **Marble String**: `-1-2---3-4---| -> buffer(notifier$) -> -------[1,2]---[3,4]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 700, value: 3, displayLabel: '3' }, { timeMs: 900, value: 4, displayLabel: '4' }]` (complete: 1400ms)
  - Output: `[{ timeMs: 600, value: [1, 2], displayLabel: '[1,2]' }, { timeMs: 1100, value: [3, 4], displayLabel: '[3,4]' }]` (complete: 1400ms)
- **Use Cases**:
  1. Double/Triple click detection: buffering clicks until a 300ms silence timer notifier fires.
  2. Batching telemetry logs and flushing them when a timer or network flush signal emits.
- **Pitfalls**:
  1. If the notifier emits when no values have arrived from the source, an empty array `[]` is emitted.
  2. If the source completes, any un-emitted buffered values are emitted in a final array.
- **Related Operators**: `bufferCount`, `bufferTime`, `bufferWhen`, `window`
- **Doc URL**: `https://rxjs.dev/api/operators/buffer`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `notifierIntervalMs`: `{ type: 'number', label: 'Notifier Flush Interval (ms)', defaultValue: 1000, min: 300, max: 3000, step: 100 }`
  - `description`: "Flushes buffered values whenever the notifier stream ticks."
- **Pipeline Recipe**: `primary$.pipe(buffer(interval(params['notifierIntervalMs'] ?? 1000)))`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { buffer, take } from 'rxjs/operators';

  const source$ = interval(200);
  const notifier$ = interval(600);

  source$.pipe(buffer(notifier$), take(3)).subscribe(console.log);
  // [0, 1], [2, 3, 4], [5, 6, 7]
  ```
- **Quiz**:
  - Q: "What does `buffer(notifier$)` emit if `notifier$` emits while the internal buffer is empty?"
  - Options:
    - A: "Nothing (it ignores empty buffers)"
    - B: "An empty array `[]`"
    - C: "An error"
    - D: "The last emitted buffer again"
  - Correct: `B`
  - Explanation: Every emission from the `closingNotifier` flushes the current buffer, even if empty, producing `[]`.

---

#### 8. `bufferCount`
- **ID**: `bufferCount` | **Difficulty**: `beginner`
- **Signature**: `bufferCount<T>(bufferSize: number, startBufferEvery?: number): OperatorFunction<T, T[]>`
- **Summary**: Buffers a specified count of values before emitting and clearing the buffer.
- **Description**: Collects source values until the buffer reaches `bufferSize`. If `startBufferEvery` is provided, opens a new buffer every `startBufferEvery` emissions, enabling overlapping or sliding buffers.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--6--|
  Op:     bufferCount(2)
  Output: -----[1,2]-[3,4]-[5,6]|
  ```
- **Marble String**: `-1-2-3-4-5-6-| -> bufferCount(2) -> ---[1,2]-[3,4]-[5,6]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 400, value: [1, 2], displayLabel: '[1,2]' }, { timeMs: 800, value: [3, 4], displayLabel: '[3,4]' }]` (complete: 1000ms)
- **Use Cases**:
  1. Chunking continuous uploads into fixed-size batches (e.g. 50 items per bulk HTTP request).
  2. Moving window averages (e.g., `bufferCount(5, 1)` for a 5-item sliding window).
- **Pitfalls**:
  1. When `startBufferEvery < bufferSize`, buffers overlap and values are duplicated across emissions.
  2. When the source completes, any remaining items fewer than `bufferSize` are emitted as a final incomplete buffer.
- **Related Operators**: `buffer`, `bufferTime`, `windowCount`, `pairwise`
- **Doc URL**: `https://rxjs.dev/api/operators/bufferCount`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `bufferSize`: `{ type: 'number', label: 'Buffer Size', defaultValue: 3, min: 2, max: 6, step: 1 }`
    - `startBufferEvery`: `{ type: 'number', label: 'Start Buffer Every', defaultValue: 3, min: 1, max: 6, step: 1 }`
  - `description`: "Collects items into batches of size N, optionally sliding every M items."
- **Pipeline Recipe**: `primary$.pipe(bufferCount(params['bufferSize'] ?? 3, params['startBufferEvery'] ?? undefined))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { bufferCount } from 'rxjs/operators';

  of(1, 2, 3, 4, 5)
    .pipe(bufferCount(2))
    .subscribe(console.log); // [1, 2], [3, 4], [5]
  ```
- **Quiz**:
  - Q: "What output does `of(1, 2, 3, 4).pipe(bufferCount(3, 1))` produce?"
  - Options:
    - A: "`[1, 2, 3], [4]`"
    - B: "`[1, 2, 3], [2, 3, 4], [3, 4], [4]`"
    - C: "`[1, 2], [3, 4]`"
    - D: "`[1, 2, 3, 4]`"
  - Correct: `B`
  - Explanation: Because `startBufferEvery` is 1, a new buffer begins with every value, creating overlapping sliding buffers: `[1, 2, 3]`, then `[2, 3, 4]`, and the remaining tail buffers on completion.

---

#### 9. `bufferTime`
- **ID**: `bufferTime` | **Difficulty**: `intermediate`
- **Signature**: `bufferTime<T>(bufferTimeSpan: number, bufferCreationInterval?: number, maxBufferSize?: number): OperatorFunction<T, T[]>`
- **Summary**: Buffers values emitted within a specified periodic time interval into arrays.
- **Description**: Collects values from the source for a duration of `bufferTimeSpan` milliseconds, then emits the array and begins a new window.
- **ASCII Marble**:
  ```text
  Input:  --1--2-----3-----4--5--|
  Op:     bufferTime(1000)
  Output: ----------[1,2]---[3]---[4,5]|
  ```
- **Marble String**: `-1-2---3---4-5-| -> bufferTime(800) -> -------[1,2]----[3]---[4,5]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 900, value: 3, displayLabel: '3' }, { timeMs: 1400, value: 4, displayLabel: '4' }]` (complete: 1800ms)
  - Output: `[{ timeMs: 600, value: [1, 2], displayLabel: '[1,2]' }, { timeMs: 1200, value: [3], displayLabel: '[3]' }, { timeMs: 1800, value: [4], displayLabel: '[4]' }]` (complete: 1800ms)
- **Use Cases**:
  1. Throttling and batching high-frequency user actions (e.g. mouse move, keystrokes) to send to server every 2 seconds.
  2. Aggregating live stock ticker prices or financial ticks into 1-second candles.
- **Pitfalls**:
  1. Emits empty arrays `[]` periodically if no items were emitted during the time slice. Combine with `filter(buf => buf.length > 0)` to omit empty buffers.
- **Related Operators**: `buffer`, `bufferCount`, `windowTime`
- **Doc URL**: `https://rxjs.dev/api/operators/bufferTime`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `bufferTimeSpanMs`: `{ type: 'number', label: 'Time Span (ms)', defaultValue: 800, min: 200, max: 3000, step: 100 }`
  - `description`: "Batches values received in each time slice into an array."
- **Pipeline Recipe**: `primary$.pipe(bufferTime(params['bufferTimeSpanMs'] ?? 800))`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { bufferTime, take } from 'rxjs/operators';

  interval(150)
    .pipe(bufferTime(500), take(3))
    .subscribe(console.log); // [0, 1, 2], [3, 4, 5], [6, 7, 8]
  ```
- **Quiz**:
  - Q: "How can you prevent `bufferTime(1000)` from emitting empty arrays `[]` during idle periods?"
  - Options:
    - A: "`pipe(distinctUntilChanged())`"
    - B: "`pipe(filter(buffer => buffer.length > 0))`"
    - C: "`pipe(skip(1))`"
    - D: "`bufferTime` has a built-in `{ ignoreEmpty: true }` parameter"
  - Correct: `B`
  - Explanation: `bufferTime` strictly emits an array every interval regardless of contents. Appending `filter(b => b.length > 0)` cleanly drops empty buffers.

---

#### 10. `bufferToggle`
- **ID**: `bufferToggle` | **Difficulty**: `advanced`
- **Signature**: `bufferToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>): OperatorFunction<T, T[]>`
- **Summary**: Buffers values starting when `openings` emits and closing when the Observable returned by `closingSelector` emits.
- **Description**: Opens a buffer whenever the `openings` stream emits. The buffer stays open collecting source values until the observable returned by `closingSelector` emits.
- **ASCII Marble**:
  ```text
  Input:   --1--2--3--4--5--6--|
  Open:    ---O--------O-------|
  Close:   ------C--------C----|
  Output:  ------[2,3]----[5,6]|
  ```
- **Marble String**: `-1-2-3-4-5-6-| -> bufferToggle(open$, close$) -> ----[2,3]----[5,6]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }, { timeMs: 1000, value: 5, displayLabel: '5' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 700, value: [2, 3], displayLabel: '[2,3]' }]` (complete: 1200ms)
- **Use Cases**:
  1. Recording user telemetry only while mouse button is pressed (`mouseDown` opens, `mouseUp` closes).
  2. Capturing network packets during an active recording session toggle.
- **Pitfalls**:
  1. Source values that emit when NO buffer is currently open are permanently discarded.
  2. Multiple buffers can be open simultaneously if `openings` emits again before the first closing selector emits.
- **Related Operators**: `bufferWhen`, `windowToggle`
- **Doc URL**: `https://rxjs.dev/api/operators/bufferToggle`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `openDelayMs`: `{ type: 'number', label: 'Opening Delay (ms)', defaultValue: 400, min: 100, max: 1000, step: 50 }`
    - `closeDurationMs`: `{ type: 'number', label: 'Buffer Duration (ms)', defaultValue: 600, min: 200, max: 1500, step: 50 }`
  - `description`: "Opens buffer on schedule and closes it after the specified duration."
- **Pipeline Recipe**: `primary$.pipe(bufferToggle(timer(params['openDelayMs'] ?? 400, 1200), () => timer(params['closeDurationMs'] ?? 600)))`
- **Code Example**:
  ```typescript
  import { interval, timer } from 'rxjs';
  import { bufferToggle, take } from 'rxjs/operators';

  const source$ = interval(100);
  const openings$ = interval(500);

  source$
    .pipe(
      bufferToggle(openings$, () => timer(300)),
      take(3)
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What happens to source values that emit while no opening buffer is currently active in `bufferToggle`?"
  - Options:
    - A: "They are cached in a temporary queue"
    - B: "They are silently dropped and ignored"
    - C: "They trigger an immediate flush"
    - D: "The stream throws an unhandled error"
  - Correct: `B`
  - Explanation: `bufferToggle` only captures values while an active window created by `openings` is currently open. Emissions occurring between windows are discarded.

---

#### 11. `bufferWhen`
- **ID**: `bufferWhen` | **Difficulty**: `advanced`
- **Signature**: `bufferWhen<T>(closingSelector: () => Observable<any>): OperatorFunction<T, T[]>`
- **Summary**: Buffers values until the Observable returned by `closingSelector` emits, then immediately starts the next buffer.
- **Description**: Like `buffer`, but calls a factory function `closingSelector` on each cycle to dynamically determine when the next buffer should close.
- **ASCII Marble**:
  ```text
  Input:    --1--2----3--4----5--|
  Closing:  -------C-------C-----|
  Output:   -------[1,2]---[3,4]-|
  ```
- **Marble String**: `-1-2---3-4---| -> bufferWhen(() => timer(700)) -> -------[1,2]---[3,4]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 800, value: 3, displayLabel: '3' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 600, value: [1, 2], displayLabel: '[1,2]' }, { timeMs: 1200, value: [3], displayLabel: '[3]' }]` (complete: 1200ms)
- **Use Cases**:
  1. Buffering with dynamic or random intervals (e.g. exponential backoff flushes or adaptive network polling).
  2. Closing buffers based on external fluctuating thresholds.
- **Pitfalls**:
  1. `closingSelector` must return an Observable that emits or completes. If it never emits, the buffer will never flush.
- **Related Operators**: `buffer`, `bufferToggle`, `windowWhen`
- **Doc URL**: `https://rxjs.dev/api/operators/bufferWhen`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `windowMs`: `{ type: 'number', label: 'Buffer Duration (ms)', defaultValue: 700, min: 200, max: 2000, step: 100 }`
  - `description`: "Re-evaluates the closing selector factory for each consecutive buffer."
- **Pipeline Recipe**: `primary$.pipe(bufferWhen(() => timer(params['windowMs'] ?? 700)))`
- **Code Example**:
  ```typescript
  import { interval, timer } from 'rxjs';
  import { bufferWhen, take } from 'rxjs/operators';

  interval(100)
    .pipe(
      bufferWhen(() => timer(Math.random() * 500 + 200)),
      take(3)
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "When is the `closingSelector` function invoked in `bufferWhen`?"
  - Options:
    - A: "Only once when the stream is subscribed to"
    - B: "Immediately upon subscription, and immediately every time the previous buffer closes"
    - C: "Only when the source stream completes"
    - D: "On every single emission of the source"
  - Correct: `B`
  - Explanation: `closingSelector` is called initially to set up the boundary for the first buffer, and is invoked anew each time a buffer closes to establish the next closing notifier.

---

#### 12. `window`
- **ID**: `window` | **Difficulty**: `advanced`
- **Signature**: `window<T>(windowBoundaries: Observable<any>): OperatorFunction<T, Observable<T>>`
- **Summary**: Branches source values into nested Observables whenever `windowBoundaries` emits.
- **Description**: The higher-order Observable counterpart of `buffer`. Instead of collecting emissions into an array, it emits an `Observable<T>` representing the current window.
- **ASCII Marble**:
  ```text
  Input:     --1--2----3--4----5--|
  Boundary:  -------B-------B----|
  Output:    --w1----------w2---| (w1 emits 1, 2; w2 emits 3, 4)
  ```
- **Marble String**: `-1-2---3-4---| -> window(boundary$) -> -w1----w2---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 700, value: 3, displayLabel: '3' }]` (complete: 1100ms)
  - Output: `[{ timeMs: 0, value: 'Window#1', displayLabel: 'win#1' }, { timeMs: 500, value: 'Window#2', displayLabel: 'win#2' }]` (complete: 1100ms)
- **Use Cases**:
  1. Applying individual reactive transformations to distinct temporal windows without buffering the entire dataset in memory arrays.
  2. Piping inner windows into `switchMap`, `count()`, or `reduce()` independently.
- **Pitfalls**:
  1. Consumers must subscribe to inner Observables immediately; missing inner subscriptions leads to dropped data.
  2. Nested subscriptions must be properly torn down to avoid memory leaks.
- **Related Operators**: `buffer`, `windowCount`, `windowTime`
- **Doc URL**: `https://rxjs.dev/api/operators/window`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `boundaryMs`: `{ type: 'number', label: 'Boundary Interval (ms)', defaultValue: 900, min: 300, max: 2500, step: 100 }`
  - `description`: "Splits emissions into inner Observable windows every boundary tick."
- **Pipeline Recipe**: `primary$.pipe(window(interval(params['boundaryMs'] ?? 900)), mergeMap((win$, i) => win$.pipe(toArray(), map(items => `[Win #${i + 1}]: ${JSON.stringify(items)}`))))`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { window, mergeMap, toArray, take } from 'rxjs/operators';

  interval(200)
    .pipe(
      window(interval(600)),
      take(3),
      mergeMap(win$ => win$.pipe(toArray()))
    )
    .subscribe(console.log); // [0, 1], [2, 3, 4], [5, 6, 7]
  ```
- **Quiz**:
  - Q: "What is the primary difference between `buffer(boundary$)` and `window(boundary$)`?"
  - Options:
    - A: "`buffer` is asynchronous while `window` is synchronous"
    - B: "`buffer` emits arrays of collected values; `window` emits nested Observables that emit values as they occur"
    - C: "`window` only works with DOM events"
    - D: "`buffer` cancels upstream observables"
  - Correct: `B`
  - Explanation: `buffer` stores items in memory and emits an array upon closing. `window` emits an inner Observable immediately, allowing downstream consumers to process items reactively as they arrive.

---

#### 13. `windowCount`
- **ID**: `windowCount` | **Difficulty**: `intermediate`
- **Signature**: `windowCount<T>(windowSize: number, startWindowEvery?: number): OperatorFunction<T, Observable<T>>`
- **Summary**: Branches source values into nested Observables, emitting a new Observable every `startWindowEvery` items.
- **Description**: Emits an Observable that captures up to `windowSize` source emissions before completing.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--|
  Op:     windowCount(2)
  Output: --w1----w2----w3-|
  ```
- **Marble String**: `-1-2-3-4-| -> windowCount(2) -> -w1--w2-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 0, value: 'Win(0..1)', displayLabel: 'win#1' }, { timeMs: 400, value: 'Win(2..3)', displayLabel: 'win#2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Processing streams in sub-batches with full streaming semantics (e.g. calculating rolling averages without array allocation).
- **Pitfalls**:
  1. Forgetting to subscribe to the emitted inner Observable causes inner values to be lost.
- **Related Operators**: `bufferCount`, `window`, `windowTime`
- **Doc URL**: `https://rxjs.dev/api/operators/windowCount`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `windowSize`: `{ type: 'number', label: 'Window Size', defaultValue: 2, min: 1, max: 5, step: 1 }`
  - `description`: "Splits items into inner observables each holding at most N items."
- **Pipeline Recipe**: `primary$.pipe(windowCount(params['windowSize'] ?? 2), mergeMap((win$, i) => win$.pipe(toArray(), map(items => `[Win #${i + 1} (${items.length} items)]: ${JSON.stringify(items)}`))))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { windowCount, mergeMap, toArray } from 'rxjs/operators';

  of(1, 2, 3, 4, 5)
    .pipe(
      windowCount(2),
      mergeMap(w$ => w$.pipe(toArray()))
    )
    .subscribe(console.log); // [1, 2], [3, 4], [5]
  ```
- **Quiz**:
  - Q: "When does an inner Observable emitted by `windowCount(3)` complete?"
  - Options:
    - A: "Immediately when emitted"
    - B: "After emitting 3 values from the source, or when the source completes"
    - C: "Never, unless unsubscribed"
    - D: "Only when the outer stream completes"
  - Correct: `B`
  - Explanation: An inner window completes once it has forwarded its allotted `windowSize` items, or when the upstream source finishes.

---

#### 14. `windowTime`
- **ID**: `windowTime` | **Difficulty**: `intermediate`
- **Signature**: `windowTime<T>(windowTimeSpan: number): OperatorFunction<T, Observable<T>>`
- **Summary**: Branches source values into nested Observables based on a specified time duration.
- **Description**: Spawns a new inner Observable every `windowTimeSpan` milliseconds. Each inner Observable emits source values arriving during its window, then completes.
- **ASCII Marble**:
  ```text
  Input:  --1--2-----3-----4--|
  Op:     windowTime(1000)
  Output: --w1-------w2-------|
  ```
- **Marble String**: `-1-2---3---4-| -> windowTime(800) -> -w1-----w2---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 900, value: 3, displayLabel: '3' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 0, value: 'Win(0-800ms)', displayLabel: 'win#1' }, { timeMs: 800, value: 'Win(800-1600ms)', displayLabel: 'win#2' }]` (complete: 1200ms)
- **Use Cases**:
  1. Chunking continuous WebSocket streams into 5-second streaming sub-observables.
- **Pitfalls**:
  1. Windows are emitted on schedule even if no values arrive from the source.
- **Related Operators**: `bufferTime`, `window`, `windowCount`
- **Doc URL**: `https://rxjs.dev/api/operators/windowTime`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `timeSpanMs`: `{ type: 'number', label: 'Window Time Span (ms)', defaultValue: 800, min: 300, max: 2500, step: 100 }`
  - `description`: "Emits a new inner stream every timeSpan milliseconds."
- **Pipeline Recipe**: `primary$.pipe(windowTime(params['timeSpanMs'] ?? 800), mergeMap((w$, i) => w$.pipe(toArray(), map(items => `[Window @ ${i * (params['timeSpanMs'] ?? 800)}ms]: ${JSON.stringify(items)}`))))`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { windowTime, mergeMap, toArray, take } from 'rxjs/operators';

  interval(200)
    .pipe(
      windowTime(500),
      take(3),
      mergeMap(w$ => w$.pipe(toArray()))
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What does an inner Observable emitted by `windowTime(1000)` emit if the source produces zero items in that second?"
  - Options:
    - A: "It emits `null`"
    - B: "It emits nothing and terminates with a complete notification"
    - C: "It throws a TimeoutError"
    - D: "The inner window is not emitted at all"
  - Correct: `B`
  - Explanation: The inner Observable emits 0 next notifications, then completes when its time span expires.

---

#### 15. `windowToggle`
- **ID**: `windowToggle` | **Difficulty**: `advanced`
- **Signature**: `windowToggle<T, O>(openings: Observable<O>, closingSelector: (value: O) => Observable<any>): OperatorFunction<T, Observable<T>>`
- **Summary**: Branches source values into nested Observables opened by an openings stream and closed by closing streams.
- **Description**: Whenever `openings` emits, a new inner Observable is emitted downstream that captures source values until the observable returned by `closingSelector` emits.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--6--|
  Open:   ---O--------O-------|
  Output: ---w1-------w2------|
  ```
- **Marble String**: `-1-2-3-4-5-6-| -> windowToggle(open$, close$) -> ---w1----w2---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 300, value: 'ActiveWin', displayLabel: 'win#1' }]` (complete: 1000ms)
- **Use Cases**:
  1. Live audio/video streaming recording windows activated on user toggle.
- **Pitfalls**:
  1. Closing selector must be a pure function returning a fresh Observable per window.
- **Related Operators**: `bufferToggle`, `windowWhen`
- **Doc URL**: `https://rxjs.dev/api/operators/windowToggle`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `openDelayMs`: `{ type: 'number', label: 'Open Delay (ms)', defaultValue: 300, min: 100, max: 1000, step: 50 }`
    - `closeDurationMs`: `{ type: 'number', label: 'Window Duration (ms)', defaultValue: 500, min: 200, max: 1500, step: 50 }`
  - `description`: "Opens an inner observable window and closes it on schedule."
- **Pipeline Recipe**: `primary$.pipe(windowToggle(timer(params['openDelayMs'] ?? 300, 1000), () => timer(params['closeDurationMs'] ?? 500)), mergeMap((w$, i) => w$.pipe(toArray(), map(items => `[Captured in Win #${i + 1}]: ${JSON.stringify(items)}`))))`
- **Code Example**:
  ```typescript
  import { interval, timer } from 'rxjs';
  import { windowToggle, mergeMap, toArray, take } from 'rxjs/operators';

  interval(100)
    .pipe(
      windowToggle(interval(500), () => timer(300)),
      take(2),
      mergeMap(w$ => w$.pipe(toArray()))
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "When does an inner Observable spawned by `windowToggle` finish?"
  - Options:
    - A: "When the `closingSelector` observable emits or completes"
    - B: "Immediately upon the next source emission"
    - C: "Only when the parent source completes"
    - D: "After a fixed 500ms duration"
  - Correct: `A`
  - Explanation: The closing selector returns an Observable whose first emission or completion signals the end of that specific inner window.

---

#### 16. `windowWhen`
- **ID**: `windowWhen` | **Difficulty**: `advanced`
- **Signature**: `windowWhen<T>(closingSelector: () => Observable<any>): OperatorFunction<T, Observable<T>>`
- **Summary**: Branches source values into nested Observables, closing each when the Observable returned by `closingSelector` emits.
- **Description**: Continually emits inner Observables, closing the current inner Observable and immediately starting a new one whenever the Observable returned by `closingSelector` emits.
- **ASCII Marble**:
  ```text
  Input:    --1--2----3--4----5--|
  Closing:  -------C-------C-----|
  Output:   --w1----w2----------|
  ```
- **Marble String**: `-1-2-3-4-5-| -> windowWhen(() => timer(700)) -> -w1----w2---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 800, value: 3, displayLabel: '3' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 0, value: 'Window#1', displayLabel: 'win#1' }, { timeMs: 600, value: 'Window#2', displayLabel: 'win#2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Segmenting unbounded streaming event logs into variable-length event windows.
- **Pitfalls**:
  1. The closing selector function must return a valid Observable; if it returns `undefined` or throws, the stream crashes.
- **Related Operators**: `bufferWhen`, `windowToggle`, `window`
- **Doc URL**: `https://rxjs.dev/api/operators/windowWhen`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `windowMs`: `{ type: 'number', label: 'Window Span (ms)', defaultValue: 700, min: 200, max: 2000, step: 100 }`
  - `description`: "Rotates to a new inner Observable window every time the factory observable emits."
- **Pipeline Recipe**: `primary$.pipe(windowWhen(() => timer(params['windowMs'] ?? 700)), mergeMap((w$, i) => w$.pipe(toArray(), map(items => `[Window #${i + 1}]: ${JSON.stringify(items)}`))))`
- **Code Example**:
  ```typescript
  import { interval, timer } from 'rxjs';
  import { windowWhen, mergeMap, toArray, take } from 'rxjs/operators';

  interval(100)
    .pipe(
      windowWhen(() => timer(400)),
      take(3),
      mergeMap(w$ => w$.pipe(toArray()))
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What happens immediately when the closing selector Observable emits in `windowWhen`?"
  - Options:
    - A: "The outer stream terminates"
    - B: "The current inner Observable completes, and a new inner Observable is opened immediately"
    - C: "All values are buffered into an array"
    - D: "The stream pauses for 100ms"
  - Correct: `B`
  - Explanation: `windowWhen` operates seamlessly back-to-back: closing the current window triggers completion of that inner stream and immediately instantiates the next inner window.

---

#### 17. `pairwise`
- **ID**: `pairwise` | **Difficulty**: `intermediate`
- **Signature**: `pairwise<T>(): OperatorFunction<T, [T, T]>`
- **Summary**: Emits the previous and current values as a 2-element tuple `[prev, curr]` for each emission after the first.
- **Description**: Groups consecutive emissions into pairs. The first emission produces nothing; starting with the second emission, each new emission produces a pair consisting of the immediate predecessor and the current item.
- **ASCII Marble**:
  ```text
  Input:  --1----2----3----4----|
  Op:     pairwise()
  Output: ------[1,2]-[2,3]-[3,4]|
  ```
- **Marble String**: `-1--2--3--4--| -> pairwise() -> ----[1,2]-[2,3]-[3,4]|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 500, value: 2, displayLabel: '2' }, { timeMs: 800, value: 3, displayLabel: '3' }, { timeMs: 1100, value: 4, displayLabel: '4' }]` (complete: 1300ms)
  - Output: `[{ timeMs: 500, value: [1, 2], displayLabel: '[1,2]' }, { timeMs: 800, value: [2, 3], displayLabel: '[2,3]' }, { timeMs: 1100, value: [3, 4], displayLabel: '[3,4]' }]` (complete: 1300ms)
- **Use Cases**:
  1. Calculating delta / velocity (e.g., scroll direction: `currY - prevY`, or mouse movement speed).
  2. Route change tracking: comparing previous URL vs current URL in an Angular navigation listener.
  3. Form change diffing: detecting what specific field changed in a reactive form state.
- **Pitfalls**:
  1. If the source Observable only emits 1 value and completes, `pairwise()` emits NOTHING and completes immediately!
  2. Use `startWith(initialValue)` before `pairwise()` if you need an emission on the very first value.
- **Related Operators**: `scan`, `bufferCount`
- **Doc URL**: `https://rxjs.dev/api/operators/pairwise`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `withStartWith`: `{ type: 'boolean', label: 'Prepend startWith(0)?', defaultValue: false }`
  - `description`: "Pairs each emission with its previous sibling. Enable startWith to emit immediately on first item."
- **Pipeline Recipe**: `params['withStartWith'] ? primary$.pipe(startWith(0), pairwise()) : primary$.pipe(pairwise())`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { pairwise } from 'rxjs/operators';

  of(10, 20, 30, 40)
    .pipe(pairwise())
    .subscribe(console.log); // [10, 20], [20, 30], [30, 40]
  ```
- **Quiz**:
  - Q: "What is emitted by `of(100).pipe(pairwise())`?"
  - Options:
    - A: "`[100, 100]`"
    - B: "`[undefined, 100]`"
    - C: "Nothing (it completes immediately without any emissions)"
    - D: "`[100]`"
  - Correct: `C`
  - Explanation: `pairwise` requires at least 2 consecutive emissions to form its first tuple. A stream with only 1 emission completes with 0 emissions.

---

#### 18. `groupBy`
- **ID**: `groupBy` | **Difficulty**: `advanced`
- **Signature**: `groupBy<T, K>(keySelector: (value: T) => K): OperatorFunction<T, GroupedObservable<K, T>>`
- **Summary**: Groups source emissions into separate `GroupedObservable` streams based on a specified key.
- **Description**: Evaluates each incoming emission with `keySelector`. For each distinct key encountered, emits a `GroupedObservable<K, T>` whose `key` property holds the key and which emits all items belonging to that group.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--6--| (numbers)
  Op:     groupBy(x => x % 2 === 0 ? 'even' : 'odd')
  Output: --g1-g2-------------| (g1 emits 1,3,5; g2 emits 2,4,6)
  ```
- **Marble String**: `-1-2-3-4-| -> groupBy(x => x % 2) -> -g(odd)-g(even)-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 200, value: 'Group: odd', displayLabel: 'odd' }, { timeMs: 400, value: 'Group: even', displayLabel: 'even' }]` (complete: 1000ms)
- **Use Cases**:
  1. Splitting a unified message bus or WebSocket stream into dedicated per-channel or per-topic Observables.
  2. Batching incoming server events by user ID or category.
- **Pitfalls**:
  1. MEMORY LEAK RISK: If the key cardinality is infinite (e.g. unique UUIDs), `groupBy` retains internal group mappings indefinitely unless a `durationSelector` is supplied!
  2. Each emitted `GroupedObservable` must be subscribed to (typically via `mergeMap`).
- **Related Operators**: `buffer`, `partition`
- **Doc URL**: `https://rxjs.dev/api/operators/groupBy`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `groupCriterion`: `{ type: 'select', label: 'Grouping Rule', defaultValue: 'parity', options: [{ label: 'Even vs Odd', value: 'parity' }, { label: 'Modulo 3', value: 'mod3' }] }`
  - `description`: "Splits items into sub-streams grouped by key."
- **Pipeline Recipe**: `primary$.pipe(groupBy(x => params['groupCriterion'] === 'mod3' ? (x % 3) : (x % 2 === 0 ? 'EVEN' : 'ODD')), mergeMap(group$ => group$.pipe(toArray(), map(items => `[Key '${group$.key}']: ${items.join(', ')}`))))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { groupBy, mergeMap, toArray } from 'rxjs/operators';

  of(1, 2, 3, 4, 5, 6)
    .pipe(
      groupBy(x => (x % 2 === 0 ? 'even' : 'odd')),
      mergeMap(group$ =>
        group$.pipe(
          toArray(),
          map(items => ({ key: group$.key, items }))
        )
      )
    )
    .subscribe(console.log);
  // { key: 'odd', items: [1, 3, 5] }, { key: 'even', items: [2, 4, 6] }
  ```
- **Quiz**:
  - Q: "What is the critical danger of using `groupBy()` with an unbounded set of keys (e.g. timestamps or random GUIDs)?"
  - Options:
    - A: "The output stream automatically deadlocks"
    - B: "Memory leak, because RxJS keeps an internal reference to every GroupedObservable key created"
    - C: "It converts the stream to synchronous mode"
    - D: "It drops 50% of the emissions"
  - Correct: `B`
  - Explanation: `groupBy` maintains an internal map of all encountered keys. If the keys are unbounded, the map grows continuously, leaking memory unless managed by a `durationSelector`.

### 5.2 Category 2: Filtering Operators (19 Operators)

#### 19. `filter`
- **ID**: `filter` | **Difficulty**: `beginner`
- **Signature**: `filter<T>(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>`
- **Summary**: Emits only those values from the source Observable that satisfy a specified predicate condition.
- **Description**: Analogous to `Array.prototype.filter`. Evaluates each emission synchronously; if the predicate returns `true`, the value passes through; otherwise, it is suppressed.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--6--|
  Op:     filter(x => x % 2 === 0)
  Output: -----2-----4-----6--|
  ```
- **Marble String**: `-1-2-3-4-5-6-| -> filter(x => x % 2 === 0) -> ---2---4---6-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
- **Use Cases**:
  1. Filtering out empty search input strings (e.g. `filter(text => text.trim().length >= 3)`).
  2. Discarding invalid keyboard events or irrelevant router navigation cycles.
  3. Narrowing TypeScript types using user-defined type guards (`filter((val): val is User => val !== null)`).
- **Pitfalls**:
  1. Returning truthy/falsy non-booleans can cause unexpected typing; use explicit booleans or type guards.
  2. If the predicate throws an error, the error propagates downstream, terminating the stream.
- **Related Operators**: `takeWhile`, `skipWhile`, `distinctUntilChanged`
- **Doc URL**: `https://rxjs.dev/api/operators/filter`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `filterMode`: `{ type: 'select', label: 'Filter Rule', defaultValue: 'even', options: [{ label: 'Even numbers only', value: 'even' }, { label: 'Odd numbers only', value: 'odd' }, { label: 'Greater than 2', value: 'gt2' }] }`
  - `description`: "Filters stream emissions based on the selected condition."
- **Pipeline Recipe**: `primary$.pipe(filter(x => { if (params['filterMode'] === 'even') return x % 2 === 0; if (params['filterMode'] === 'odd') return x % 2 !== 0; return x > 2; }))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { filter } from 'rxjs/operators';

  of(1, 2, 3, 4, 5, 6)
    .pipe(filter(num => num % 2 === 0))
    .subscribe(console.log); // 2, 4, 6
  ```
- **Quiz**:
  - Q: "How does `filter()` behave when a custom TypeScript type guard `filter((x): x is string => typeof x === 'string')` is applied?"
  - Options:
    - A: "It converts numbers to strings"
    - B: "It filters runtime emissions and narrows the downstream TypeScript Observable type from Observable<any> to Observable<string>"
    - C: "It forces the stream to execute synchronously"
    - D: "It completes after the first string"
  - Correct: `B`
  - Explanation: RxJS `filter` has an overload signature supporting TypeScript type predicates (`value is TargetType`), providing runtime filtering and compile-time type narrowing.

---

#### 20. `take`
- **ID**: `take` | **Difficulty**: `beginner`
- **Signature**: `take<T>(count: number): OperatorFunction<T, T>`
- **Summary**: Emits only the first `count` values emitted by the source Observable, then completes immediately.
- **Description**: Counts emitted values from the source. Upon reaching `count`, emits the value, dispatches a `complete` notification, and immediately unsubscribes from the source to prevent further execution.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--|
  Op:     take(2)
  Output: --1--2|
  ```
- **Marble String**: `-1-2-3-4-5-| -> take(2) -> -1-2|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 800ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 400ms)
- **Use Cases**:
  1. Taking the first response from a long-polling or WebSocket stream and auto-closing.
  2. Emulating single-shot Promises from multi-value Observables (`take(1)`).
  3. Capping infinite generators (`interval()`).
- **Pitfalls**:
  1. If `count <= 0`, completes immediately with zero next emissions.
  2. Unsubscribing immediately cancels upstream producers; ensure that upstream teardown handles this gracefully.
- **Related Operators**: `takeUntil`, `takeWhile`, `first`, `skip`
- **Doc URL**: `https://rxjs.dev/api/operators/take`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `takeCount`: `{ type: 'number', label: 'Take Count', defaultValue: 3, min: 1, max: 6, step: 1 }`
  - `description`: "Limits the stream to the specified number of items, completing instantly after."
- **Pipeline Recipe**: `primary$.pipe(take(params['takeCount'] ?? 3))`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { take } from 'rxjs/operators';

  interval(500)
    .pipe(take(3))
    .subscribe({
      next: console.log,
      complete: () => console.log('Completed!')
    }); // 0, 1, 2, Completed!
  ```
- **Quiz**:
  - Q: "What happens when `take(3)` receives its 3rd value from an infinite source stream?"
  - Options:
    - A: "It emits the 3rd value and keeps the subscription active"
    - B: "It emits the 3rd value, emits complete, and immediately unsubscribes from the source"
    - C: "It buffers subsequent values"
    - D: "It resets its count back to 0"
  - Correct: `B`
  - Explanation: `take` enforces a hard limit. As soon as `count` is satisfied, it completes and unsubscribes from upstream producers.

---

#### 21. `takeLast`
- **ID**: `takeLast` | **Difficulty**: `intermediate`
- **Signature**: `takeLast<T>(count: number): OperatorFunction<T, T>`
- **Summary**: Emits only the last `count` values emitted by the source Observable upon stream completion.
- **Description**: Maintains an internal ring buffer of the last `count` items. When the source Observable completes, it synchronously flushes this buffer in order, followed by completion.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--|
  Op:     takeLast(2)
  Output: ----------------4-5|
  ```
- **Marble String**: `-1-2-3-4-5-| -> takeLast(2) -> -----------4-5|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 1000, value: 3, displayLabel: '3' }, { timeMs: 1050, value: 4, displayLabel: '4' }]` (complete: 1100ms)
- **Use Cases**:
  1. Inspecting the final status messages or trailing telemetry metrics of a completed batch job.
  2. Obtaining the final N items of an HTTP pagination stream.
- **Pitfalls**:
  1. Will NEVER emit anything if the source Observable does not complete!
- **Related Operators**: `take`, `skipLast`, `last`
- **Doc URL**: `https://rxjs.dev/api/operators/takeLast`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `takeLastCount`: `{ type: 'number', label: 'Last Count', defaultValue: 2, min: 1, max: 4, step: 1 }`
  - `description`: "Buffers emissions and delivers only the final N items when the stream completes."
- **Pipeline Recipe**: `primary$.pipe(takeLast(params['takeLastCount'] ?? 2))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { takeLast } from 'rxjs/operators';

  of(1, 2, 3, 4, 5)
    .pipe(takeLast(2))
    .subscribe(console.log); // 4, 5
  ```
- **Quiz**:
  - Q: "Why won't `takeLast(1)` work as expected on `fromEvent(button, 'click')`?"
  - Options:
    - A: "DOM clicks cannot be buffered"
    - B: "DOM event streams never complete naturally, so `takeLast` never emits"
    - C: "`takeLast` requires an async scheduler"
    - D: "Clicks require `debounceTime`"
  - Correct: `B`
  - Explanation: `takeLast` requires a `complete` notification to know when the final items have arrived. Because DOM event streams are infinite, `takeLast` will never flush.

---

#### 22. `takeUntil`
- **ID**: `takeUntil` | **Difficulty**: `intermediate`
- **Signature**: `takeUntil<T>(notifier: Observable<any>): OperatorFunction<T, T>`
- **Summary**: Emits values from the source until a second `notifier` Observable emits a value or completes.
- **Description**: Subscribes to the source and the `notifier`. Mirrors the source until the notifier emits its first item (or completes), at which point it emits `complete` and tears down the source subscription.
- **ASCII Marble**:
  ```text
  Input:     --1--2--3--4--5--|
  Notifier:  -------N---------|
  Output:    --1--2-|
  ```
- **Marble String**: `-1-2-3-4-5-| -> takeUntil(notifier$) -> -1-2-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 500ms)
- **Use Cases**:
  1. Component lifecycle teardown: unhooking subscriptions on component destroy (`destroy$.pipe(takeUntil(this.destroy$))`).
  2. Drag and drop: streaming `mouseMove$` with `takeUntil(mouseUp$)`.
  3. Cancelling ongoing intervals or polling when user navigates away or presses a cancel button.
- **Pitfalls**:
  1. Operator order: `takeUntil` should almost always be the last (or second to last before catchError) operator in a `pipe()` chain to prevent intermediate operator leakage.
- **Related Operators**: `takeWhile`, `skipUntil`, `takeUntilDestroyed`
- **Doc URL**: `https://rxjs.dev/api/operators/takeUntil`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `notifierDelayMs`: `{ type: 'number', label: 'Notifier Trigger Delay (ms)', defaultValue: 900, min: 300, max: 3000, step: 100 }`
  - `description`: "Terminates the stream the instant the notifier Observable emits."
- **Pipeline Recipe**: `primary$.pipe(takeUntil(timer(params['notifierDelayMs'] ?? 900)))`
- **Code Example**:
  ```typescript
  import { interval, timer } from 'rxjs';
  import { takeUntil } from 'rxjs/operators';

  const source$ = interval(200);
  const stop$ = timer(700);

  source$.pipe(takeUntil(stop$)).subscribe(console.log); // 0, 1, 2
  ```
- **Quiz**:
  - Q: "Why is it best practice in Angular to place `takeUntil` at the end of the `pipe(...)` sequence?"
  - Options:
    - A: "To guarantee that all intermediate operators (such as `switchMap` or `filter`) are unsubscribed immediately upon teardown"
    - B: "Because TypeScript cannot compile it anywhere else"
    - C: "To make it run on the microtask queue"
    - D: "To delay completion"
  - Correct: `A`
  - Explanation: If `takeUntil` precedes operators like `switchMap`, an inner subscription triggered by `switchMap` might continue executing after `takeUntil` has completed, causing an orphaned memory leak.

---

#### 23. `takeWhile`
- **ID**: `takeWhile` | **Difficulty**: `intermediate`
- **Signature**: `takeWhile<T>(predicate: (value: T, index: number) => boolean, inclusive?: boolean): OperatorFunction<T, T>`
- **Summary**: Emits values from the source as long as each value satisfies the specified predicate; completes once false.
- **Description**: Continues mirroring the source as long as each item satisfies `predicate(val)`. As soon as an item fails the condition, `takeWhile` completes and unsubscribes. If `inclusive: true`, it also emits that single failing item before completing.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--1--2--|
  Op:     takeWhile(x => x < 3)
  Output: --1--2|
  ```
- **Marble String**: `-1-2-4-1-2-| -> takeWhile(x => x < 3) -> -1-2|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 5, displayLabel: '5' }, { timeMs: 800, value: 1, displayLabel: '1' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
- **Use Cases**:
  1. Polling a status endpoint until status changes from 'PENDING' to 'COMPLETED'.
  2. Reading a stream of progress percentages until value reaches 100%.
- **Pitfalls**:
  1. Distinct from `filter`: Once `predicate` returns `false`, the stream completes permanently. It does NOT resume if future values would satisfy the condition.
- **Related Operators**: `takeUntil`, `filter`, `skipWhile`
- **Doc URL**: `https://rxjs.dev/api/operators/takeWhile`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `threshold`: `{ type: 'number', label: 'Condition (x < N)', defaultValue: 4, min: 1, max: 6, step: 1 }`
    - `inclusive`: `{ type: 'boolean', label: 'Inclusive (emit failing item)?', defaultValue: false }`
  - `description`: "Emits values while condition holds; completes immediately when condition fails."
- **Pipeline Recipe**: `primary$.pipe(takeWhile(x => x < (params['threshold'] ?? 4), params['inclusive'] ?? false))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { takeWhile } from 'rxjs/operators';

  of(1, 2, 5, 2, 1)
    .pipe(takeWhile(x => x < 3))
    .subscribe(console.log); // 1, 2
  ```
- **Quiz**:
  - Q: "How does `of(1, 2, 5, 1).pipe(takeWhile(x => x < 3))` differ from using `filter(x => x < 3)`?"
  - Options:
    - A: "They produce identical outputs"
    - B: "`takeWhile` completes at 5 and drops the second 1; `filter` checks all items and emits 1, 2, 1"
    - C: "`takeWhile` throws an error on 5"
    - D: "`filter` cannot handle numbers"
  - Correct: `B`
  - Explanation: `takeWhile` is a terminating operator. The moment a value fails the condition, the stream completes. `filter` tests every item independently across the lifetime of the stream.

---

#### 24. `skip`
- **ID**: `skip` | **Difficulty**: `beginner`
- **Signature**: `skip<T>(count: number): OperatorFunction<T, T>`
- **Summary**: Returns an Observable that skips the first `count` items emitted by the source Observable.
- **Description**: Ignores the first `count` values emitted by the source. All subsequent emissions are passed through directly.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--|
  Op:     skip(2)
  Output: --------3--4--5--|
  ```
- **Marble String**: `-1-2-3-4-5-| -> skip(2) -> -----3-4-5-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
- **Use Cases**:
  1. Ignoring the initial default value emitted by a `BehaviorSubject` or Angular form `valueChanges`.
  2. Bypassing header rows or metadata preambles in streamed datasets.
- **Pitfalls**:
  1. If `count` exceeds the total number of items emitted by the source, zero items will be emitted.
- **Related Operators**: `take`, `skipUntil`, `skipWhile`
- **Doc URL**: `https://rxjs.dev/api/operators/skip`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `skipCount`: `{ type: 'number', label: 'Skip Count', defaultValue: 2, min: 1, max: 5, step: 1 }`
  - `description`: "Ignores the first N items, then forwards all subsequent emissions."
- **Pipeline Recipe**: `primary$.pipe(skip(params['skipCount'] ?? 2))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { skip } from 'rxjs/operators';

  of('Initial', 'Update 1', 'Update 2')
    .pipe(skip(1))
    .subscribe(console.log); // 'Update 1', 'Update 2'
  ```
- **Quiz**:
  - Q: "What is a common real-world use case for `skip(1)` with a `BehaviorSubject` in Angular?"
  - Options:
    - A: "To speed up change detection"
    - B: "To ignore the initial synchronous seed value and only react to subsequent user updates"
    - C: "To prevent memory leaks"
    - D: "To convert it to an AsyncSubject"
  - Correct: `B`
  - Explanation: A `BehaviorSubject` always synchronously emits its current value upon subscription. Applying `skip(1)` ignores that initial seed so listeners only react to subsequent state changes.

---

#### 25. `skipLast`
- **ID**: `skipLast` | **Difficulty**: `intermediate`
- **Signature**: `skipLast<T>(count: number): OperatorFunction<T, T>`
- **Summary**: Skips the last `count` values emitted by the source Observable.
- **Description**: Holds an internal buffer of `count` items. When a new item arrives beyond `count`, the oldest item in the buffer is emitted. When the source completes, the remaining buffered items are discarded.
- **ASCII Marble**:
  ```text
  Input:  --1--2--3--4--5--|
  Op:     skipLast(2)
  Output: ------1--2--3---|
  ```
- **Marble String**: `-1-2-3-4-5-| -> skipLast(2) -> -----1-2-3---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 600, value: 1, displayLabel: '1' }, { timeMs: 800, value: 2, displayLabel: '2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Truncating footer or trailer records from fixed-length streamed files.
- **Pitfalls**:
  1. Introduces latency: an item cannot be emitted until `count` additional subsequent items have arrived from the source.
- **Related Operators**: `takeLast`, `skip`, `skipWhile`
- **Doc URL**: `https://rxjs.dev/api/operators/skipLast`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `skipCount`: `{ type: 'number', label: 'Skip Last Count', defaultValue: 2, min: 1, max: 4, step: 1 }`
  - `description`: "Withholds the final N items from emission upon stream completion."
- **Pipeline Recipe**: `primary$.pipe(skipLast(params['skipCount'] ?? 2))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { skipLast } from 'rxjs/operators';

  of(1, 2, 3, 4, 5)
    .pipe(skipLast(2))
    .subscribe(console.log); // 1, 2, 3
  ```
- **Quiz**:
  - Q: "Why does `skipLast(2)` introduce an emission delay on real-time streams?"
  - Options:
    - A: "It runs on `animationFrameScheduler`"
    - B: "It must buffer 2 items in advance to guarantee it can withhold the final 2 items when complete arrives"
    - C: "Because it throttles network calls"
    - D: "It requires garbage collection"
  - Correct: `B`
  - Explanation: Without knowing the future, `skipLast(N)` must hold N items in a queue, only discharging item K when item K+N has arrived.

---

#### 26. `skipUntil`
- **ID**: `skipUntil` | **Difficulty**: `intermediate`
- **Signature**: `skipUntil<T>(notifier: Observable<any>): OperatorFunction<T, T>`
- **Summary**: Discards items emitted by the source Observable until a second Observable emits an item.
- **Description**: Ignores all source emissions until the `notifier` Observable produces its first emission. From that moment forward, all source emissions are passed through.
- **ASCII Marble**:
  ```text
  Input:     --1--2--3--4--5--|
  Notifier:  -------N---------|
  Output:    --------3--4--5--|
  ```
- **Marble String**: `-1-2-3-4-5-| -> skipUntil(notifier$) -> -----3-4-5-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 600, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1000ms)
- **Use Cases**:
  1. Ignoring user interactions until an initialization handshake or authentication check completes.
  2. Suppressing sensors until a calibration phase completes.
- **Pitfalls**:
  1. If `notifier` completes without emitting any item, the entire source stream is discarded.
- **Related Operators**: `takeUntil`, `skip`, `skipWhile`
- **Doc URL**: `https://rxjs.dev/api/operators/skipUntil`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `notifierDelayMs`: `{ type: 'number', label: 'Unlock Delay (ms)', defaultValue: 700, min: 200, max: 2000, step: 100 }`
  - `description`: "Discards items until the notifier stream emits."
- **Pipeline Recipe**: `primary$.pipe(skipUntil(timer(params['notifierDelayMs'] ?? 700)))`
- **Code Example**:
  ```typescript
  import { interval, timer } from 'rxjs';
  import { skipUntil, take } from 'rxjs/operators';

  interval(200)
    .pipe(skipUntil(timer(500)), take(3))
    .subscribe(console.log); // 2, 3, 4
  ```
- **Quiz**:
  - Q: "What happens if the `notifier` Observable passed to `skipUntil()` completes without emitting any value?"
  - Options:
    - A: "All source items are immediately released"
    - B: "No items from the source are ever emitted"
    - C: "An error is thrown"
    - D: "The stream hangs indefinitely"
  - Correct: `B`
  - Explanation: `skipUntil` requires an explicit next emission from the notifier to turn on emission pass-through. If the notifier completes empty, the gate is never opened.

---

#### 27. `skipWhile`
- **ID**: `skipWhile` | **Difficulty**: `intermediate`
- **Signature**: `skipWhile<T>(predicate: (value: T, index: number) => boolean): OperatorFunction<T, T>`
- **Summary**: Returns an Observable that skips all items emitted by the source Observable as long as a specified condition is true; once false, emits all remaining items.
- **Description**: Evaluates each emission with `predicate`. As long as it returns `true`, emissions are dropped. The first time it returns `false`, `skipWhile` stops checking and passes that value and ALL subsequent values through without testing further.
- **ASCII Marble**:
  ```text
  Input:  --1--2--4--1--5--|
  Op:     skipWhile(x => x < 3)
  Output: --------4--1--5--|
  ```
- **Marble String**: `-1-2-4-1-5-| -> skipWhile(x => x < 3) -> -----4-1-5-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 4, displayLabel: '4' }, { timeMs: 800, value: 1, displayLabel: '1' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 600, value: 4, displayLabel: '4' }, { timeMs: 800, value: 1, displayLabel: '1' }]` (complete: 1000ms)
- **Use Cases**:
  1. Skipping empty leading lines or preparatory warmup telemetry until real data appears.
- **Pitfalls**:
  1. Once `predicate` returns `false`, `skipWhile` permanently stops filtering. Subsequent items that would satisfy the condition will STILL be emitted.
- **Related Operators**: `takeWhile`, `filter`, `skip`
- **Doc URL**: `https://rxjs.dev/api/operators/skipWhile`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `threshold`: `{ type: 'number', label: 'Skip condition (x < N)', defaultValue: 3, min: 1, max: 6, step: 1 }`
  - `description`: "Skips values until the condition fails, then emits all remaining values unconditionally."
- **Pipeline Recipe**: `primary$.pipe(skipWhile(x => x < (params['threshold'] ?? 3)))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { skipWhile } from 'rxjs/operators';

  of(1, 2, 5, 1, 2)
    .pipe(skipWhile(x => x < 3))
    .subscribe(console.log); // 5, 1, 2
  ```
- **Quiz**:
  - Q: "What is emitted by `of(1, 2, 4, 1).pipe(skipWhile(x => x < 3))`?"
  - Options:
    - A: "`4`"
    - B: "`4, 1`"
    - C: "`1, 2, 4, 1`"
    - D: "`1, 2`"
  - Correct: `B`
  - Explanation: Once 4 fails the condition `x < 3`, skipping permanently terminates. The subsequent value 1 is emitted without being tested.

---

#### 28. `distinct`
- **ID**: `distinct` | **Difficulty**: `intermediate`
- **Signature**: `distinct<T, K>(keySelector?: (value: T) => K, flushes?: Observable<any>): OperatorFunction<T, T>`
- **Summary**: Emits items from the source Observable that are distinct from all previously emitted items across the entire stream lifetime.
- **Description**: Keeps an internal `Set` of all values (or derived keys via `keySelector`) emitted since subscription. Only items not present in the Set are emitted.
- **ASCII Marble**:
  ```text
  Input:  --1--2--2--1--3--1--|
  Op:     distinct()
  Output: --1--2--------3-----|
  ```
- **Marble String**: `-1-2-2-1-3-1-| -> distinct() -> -1-2---3---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 2, displayLabel: '2' }, { timeMs: 800, value: 1, displayLabel: '1' }, { timeMs: 1000, value: 3, displayLabel: '3' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 1000, value: 3, displayLabel: '3' }]` (complete: 1200ms)
- **Use Cases**:
  1. De-duplicating click events or item IDs across an entire user session.
  2. Aggregating unique error codes encountered across multiple transactions.
- **Pitfalls**:
  1. MEMORY LEAK WARNING: In infinite streams with unbounded distinct values, the internal Set grows indefinitely! Use the `flushes` argument or `distinctUntilChanged` for high-frequency streams.
- **Related Operators**: `distinctUntilChanged`, `distinctUntilKeyChanged`, `filter`
- **Doc URL**: `https://rxjs.dev/api/operators/distinct`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Suppresses any value that has appeared at any point earlier in the stream."
- **Pipeline Recipe**: `primary$.pipe(map(x => x % 3), distinct())`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { distinct } from 'rxjs/operators';

  of(1, 2, 2, 1, 3, 2, 4)
    .pipe(distinct())
    .subscribe(console.log); // 1, 2, 3, 4
  ```
- **Quiz**:
  - Q: "What is the memory risk of using `distinct()` on an infinite stream?"
  - Options:
    - A: "It consumes stack space causing stack overflow"
    - B: "Its internal Set retains every distinct value forever, potentially leaking memory"
    - C: "It opens concurrent Web Workers"
    - D: "None, garbage collection clears it automatically"
  - Correct: `B`
  - Explanation: `distinct` retains all past distinct items in an internal JavaScript `Set`. On an unbounded stream, this Set continues expanding over time.

---

#### 29. `distinctUntilChanged`
- **ID**: `distinctUntilChanged` | **Difficulty**: `beginner`
- **Signature**: `distinctUntilChanged<T, K>(comparator?: (prev: K, curr: K) => boolean, keySelector?: (value: T) => K): OperatorFunction<T, T>`
- **Summary**: Emits items only if they differ from the immediately preceding item.
- **Description**: Compares current emission with the previous emission using strict equality (`===`) or a custom comparator function. Drops consecutive duplicates.
- **ASCII Marble**:
  ```text
  Input:  --1--1--2--2--1--1--|
  Op:     distinctUntilChanged()
  Output: --1-----2-----1-----|
  ```
- **Marble String**: `-1-1-2-2-1-1-| -> distinctUntilChanged() -> -1---2---1---|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }, { timeMs: 800, value: 2, displayLabel: '2' }, { timeMs: 1000, value: 1, displayLabel: '1' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }, { timeMs: 1000, value: 1, displayLabel: '1' }]` (complete: 1200ms)
- **Use Cases**:
  1. Autocomplete and search inputs: suppressing duplicate HTTP requests if the user typed and backspaced back to the same search query.
  2. Angular signal or reactive state stores: preventing redundant change detection cycles when state hasn't changed.
- **Pitfalls**:
  1. Object references: by default uses `===`. Two distinct object literals `{ id: 1 }` and `{ id: 1 }` are NOT equal under `===`. Provide a custom comparator `(a, b) => a.id === b.id`.
- **Related Operators**: `distinct`, `distinctUntilKeyChanged`, `filter`
- **Doc URL**: `https://rxjs.dev/api/operators/distinctUntilChanged`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Filters out consecutive duplicate values without maintaining historical sets."
- **Pipeline Recipe**: `primary$.pipe(map(x => Math.floor(x / 2)), distinctUntilChanged())`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { distinctUntilChanged } from 'rxjs/operators';

  of(1, 1, 2, 2, 3, 1, 1)
    .pipe(distinctUntilChanged())
    .subscribe(console.log); // 1, 2, 3, 1
  ```
- **Quiz**:
  - Q: "Why does `of({ id: 1 }, { id: 1 }).pipe(distinctUntilChanged())` emit both objects by default?"
  - Options:
    - A: "`distinctUntilChanged` does not work with objects"
    - B: "JavaScript checks object identity by reference (`===`), and separate object literals occupy different memory addresses"
    - C: "Because JSON serialization fails"
    - D: "Objects require an async scheduler"
  - Correct: `B`
  - Explanation: Default comparison is `(prev, curr) => prev === curr`. Different object instances fail `===` even if identical in fields. A custom comparator `(a, b) => a.id === b.id` is required.

---

#### 30. `distinctUntilKeyChanged`
- **ID**: `distinctUntilKeyChanged` | **Difficulty**: `beginner`
- **Signature**: `distinctUntilKeyChanged<T, K extends keyof T>(key: K, compare?: (x: T[K], y: T[K]) => boolean): OperatorFunction<T, T>`
- **Summary**: Emits items only if the specified property key differs from the immediately preceding item's key.
- **Description**: A convenience shortcut for `distinctUntilChanged((prev, curr) => prev[key] === curr[key])`.
- **ASCII Marble**:
  ```text
  Input:  --{k:1}--{k:1}--{k:2}--{k:1}--|
  Op:     distinctUntilKeyChanged('k')
  Output: --{k:1}---------{k:2}--{k:1}--|
  ```
- **Marble String**: `-{id:1}-{id:1}-{id:2}-| -> distinctUntilKeyChanged('id') -> -{id:1}-------{id:2}-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: { id: 1 }, displayLabel: '{id:1}' }, { timeMs: 400, value: { id: 1 }, displayLabel: '{id:1}' }, { timeMs: 600, value: { id: 2 }, displayLabel: '{id:2}' }]` (complete: 800ms)
  - Output: `[{ timeMs: 200, value: { id: 1 }, displayLabel: '{id:1}' }, { timeMs: 600, value: { id: 2 }, displayLabel: '{id:2}' }]` (complete: 800ms)
- **Use Cases**:
  1. Listening to state stream updates and reacting only when a specific slice property changes (e.g. `distinctUntilKeyChanged('status')`).
- **Pitfalls**:
  1. Only compares top-level keys; nested property inspection requires `distinctUntilChanged((a, b) => a.user.id === b.user.id)`.
- **Related Operators**: `distinctUntilChanged`, `pluck`
- **Doc URL**: `https://rxjs.dev/api/operators/distinctUntilKeyChanged`
- **Interactive Config**:
  - `sourcePreset`: `'objects_stream'`
  - `params`:
    - `propertyKey`: `{ type: 'select', label: 'Key to Compare', defaultValue: 'role', options: [{ label: 'role', value: 'role' }, { label: 'name', value: 'name' }] }`
  - `description`: "Emits when the specified key value changes compared to the previous item."
- **Pipeline Recipe**: `primary$.pipe(distinctUntilKeyChanged(params['propertyKey'] ?? 'role'))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { distinctUntilKeyChanged } from 'rxjs/operators';

  of(
    { id: 1, role: 'admin' },
    { id: 2, role: 'admin' },
    { id: 3, role: 'user' }
  )
    .pipe(distinctUntilKeyChanged('role'))
    .subscribe(console.log);
  // { id: 1, role: 'admin' }, { id: 3, role: 'user' }
  ```
- **Quiz**:
  - Q: "What is `distinctUntilKeyChanged('status')` equivalent to?"
  - Options:
    - A: "`distinctUntilChanged((a, b) => a.status === b.status)`"
    - B: "`pluck('status')`"
    - C: "`filter(x => x.status)`"
    - D: "`groupBy(x => x.status)`"
  - Correct: `A`
  - Explanation: `distinctUntilKeyChanged('status')` is syntactic sugar for `distinctUntilChanged` comparing the `status` property of consecutive items.

---

#### 31. `debounce`
- **ID**: `debounce` | **Difficulty**: `advanced`
- **Signature**: `debounce<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>`
- **Summary**: Emits a value from the source only after a duration determined by another Observable has passed without another emission.
- **Description**: When the source emits, `durationSelector` returns a notifier Observable. If another source value arrives before this notifier emits or completes, the pending value is dropped and a new notifier is created.
- **ASCII Marble**:
  ```text
  Input:     --1--2-------3---|
  Duration:  ----[--]-----[--]|
  Output:    -------2-------3-|
  ```
- **Marble String**: `-1-2-----3---| -> debounce(() => timer(400)) -> -----2-----3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 350, value: 2, displayLabel: '2' }, { timeMs: 900, value: 3, displayLabel: '3' }]` (complete: 1500ms)
  - Output: `[{ timeMs: 750, value: 2, displayLabel: '2' }, { timeMs: 1300, value: 3, displayLabel: '3' }]` (complete: 1500ms)
- **Use Cases**:
  1. Dynamic debouncing: adjusting the debounce delay dynamically based on the length or complexity of the input query string.
- **Pitfalls**:
  1. If values arrive faster than the duration Observable resolves, all intermediate values are discarded.
- **Related Operators**: `debounceTime`, `throttle`, `audit`
- **Doc URL**: `https://rxjs.dev/api/operators/debounce`
- **Interactive Config**:
  - `sourcePreset`: `'burst_stream'`
  - `params`:
    - `durationMs`: `{ type: 'number', label: 'Dynamic Delay (ms)', defaultValue: 300, min: 100, max: 1000, step: 50 }`
  - `description`: "Suppresses values until silence duration returned by durationSelector expires."
- **Pipeline Recipe**: `primary$.pipe(debounce(() => timer(params['durationMs'] ?? 300)))`
- **Code Example**:
  ```typescript
  import { fromEvent, timer } from 'rxjs';
  import { debounce } from 'rxjs/operators';

  const clicks$ = fromEvent(document, 'click');
  clicks$
    .pipe(debounce(() => timer(500)))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "How does `debounce(durationSelector)` differ from `debounceTime(dueTime)`?"
  - Options:
    - A: "`debounceTime` is deprecated"
    - B: "`debounce` allows dynamic, per-emission calculation of the silence window using an Observable"
    - C: "`debounce` is synchronous"
    - D: "`debounceTime` handles clicks only"
  - Correct: `B`
  - Explanation: `debounceTime` takes a fixed millisecond number, whereas `debounce` accepts a function `(val) => Observable<any>` allowing dynamic timeouts per item.

---

#### 32. `debounceTime`
- **ID**: `debounceTime` | **Difficulty**: `beginner`
- **Signature**: `debounceTime<T>(dueTime: number, scheduler?: SchedulerLike): OperatorFunction<T, T>`
- **Summary**: Emits a value from the source only after a specified time span has passed without another source emission.
- **Description**: Postpones emitting a value until `dueTime` milliseconds of silence have passed since the most recent source emission. Essential for rate-limiting rapid events.
- **ASCII Marble**:
  ```text
  Input:  --1-2-3--------4-----|
  Op:     debounceTime(400)
  Output: ---------3--------4--|
  ```
- **Marble String**: `-1-2-3-----4---| -> debounceTime(400) -> -------3----4-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 250, value: 2, displayLabel: '2' }, { timeMs: 400, value: 3, displayLabel: '3' }, { timeMs: 1100, value: 4, displayLabel: '4' }]` (complete: 1800ms)
  - Output: `[{ timeMs: 800, value: 3, displayLabel: '3' }, { timeMs: 1500, value: 4, displayLabel: '4' }]` (complete: 1800ms)
- **Use Cases**:
  1. Search autocomplete input field (waiting 300ms after user stops typing before making HTTP search).
  2. Window resize event throttling to recalculate layout only after user finishes dragging.
  3. Form auto-saving to local storage or backend.
- **Pitfalls**:
  1. In RxJS 7+, if the stream completes while a debounced value is pending, that final pending value IS emitted before completion.
- **Related Operators**: `debounce`, `throttleTime`, `auditTime`, `sampleTime`
- **Doc URL**: `https://rxjs.dev/api/operators/debounceTime`
- **Interactive Config**:
  - `sourcePreset`: `'burst_stream'`
  - `params`:
    - `dueTimeMs`: `{ type: 'number', label: 'Debounce Silence (ms)', defaultValue: 400, min: 100, max: 1500, step: 50 }`
  - `description`: "Waits for a pause of dueTimeMs without any new emissions before emitting the latest value."
- **Pipeline Recipe**: `primary$.pipe(debounceTime(params['dueTimeMs'] ?? 400))`
- **Code Example**:
  ```typescript
  import { fromEvent } from 'rxjs';
  import { debounceTime, map } from 'rxjs/operators';

  const input = document.getElementById('search-input') as HTMLInputElement;
  fromEvent(input, 'input')
    .pipe(
      map(e => (e.target as HTMLInputElement).value),
      debounceTime(300)
    )
    .subscribe(query => console.log('Searching for:', query));
  ```
- **Quiz**:
  - Q: "If a user types 'A', then 'AB' 100ms later, then 'ABC' 100ms later, how many values does `debounceTime(300)` emit?"
  - Options:
    - A: "3 values ('A', 'AB', 'ABC')"
    - B: "1 value ('ABC', 300ms after 'ABC' was typed)"
    - C: "0 values"
    - D: "2 values ('A' and 'ABC')"
  - Correct: `B`
  - Explanation: Each keystroke resets the 300ms countdown timer. Only after 300ms of user silence following 'ABC' will 'ABC' be emitted.

---

#### 33. `throttle`
- **ID**: `throttle` | **Difficulty**: `advanced`
- **Signature**: `throttle<T>(durationSelector: (value: T) => Observable<any>, config?: ThrottleConfig): OperatorFunction<T, T>`
- **Summary**: Emits a value from the source, then ignores subsequent values for a duration determined by another Observable.
- **Description**: By default (`{ leading: true, trailing: false }`), emits the first value immediately, then disables emissions until the duration Observable returned by `durationSelector` emits.
- **ASCII Marble**:
  ```text
  Input:  --1-2-3---4-5---|
  Op:     throttle(() => interval(500), { leading: true, trailing: false })
  Output: --1-------4-----|
  ```
- **Marble String**: `-1-2-3---4-5---| -> throttle(...) -> -1-------4-----|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 250, value: 2, displayLabel: '2' }, { timeMs: 700, value: 4, displayLabel: '4' }, { timeMs: 850, value: 5, displayLabel: '5' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 700, value: 4, displayLabel: '4' }]` (complete: 1200ms)
- **Use Cases**:
  1. Button double-click / rapid spam protection (submitting immediately on first click, ignoring clicks for 1s).
  2. Game loop input handling.
- **Pitfalls**:
  1. If `trailing: false`, the final emission in a burst is dropped.
- **Related Operators**: `throttleTime`, `debounce`, `audit`
- **Doc URL**: `https://rxjs.dev/api/operators/throttle`
- **Interactive Config**:
  - `sourcePreset`: `'burst_stream'`
  - `params`:
    - `leading`: `{ type: 'boolean', label: 'Leading (emit first immediately)', defaultValue: true }`
    - `trailing`: `{ type: 'boolean', label: 'Trailing (emit latest on close)', defaultValue: false }`
    - `durationMs`: `{ type: 'number', label: 'Throttle Window (ms)', defaultValue: 500, min: 200, max: 1500, step: 50 }`
  - `description`: "Throttles stream with configurable leading and trailing edges."
- **Pipeline Recipe**: `primary$.pipe(throttle(() => timer(params['durationMs'] ?? 500), { leading: params['leading'] ?? true, trailing: params['trailing'] ?? false }))`
- **Code Example**:
  ```typescript
  import { fromEvent, timer } from 'rxjs';
  import { throttle } from 'rxjs/operators';

  fromEvent(document, 'click')
    .pipe(throttle(() => timer(1000), { leading: true, trailing: false }))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What occurs when configuring `throttle` with `{ leading: true, trailing: true }`?"
  - Options:
    - A: "It emits both the very first item immediately and the latest item arrived during the silence window at the end"
    - B: "It doubles every emission"
    - C: "It crashes RxJS"
    - D: "It acts identical to `filter`"
  - Correct: `A`
  - Explanation: `{ leading: true, trailing: true }` fires immediately on the first event, silences intermediate emissions, and fires the most recent value once the window elapses.

---

#### 34. `throttleTime`
- **ID**: `throttleTime` | **Difficulty**: `intermediate`
- **Signature**: `throttleTime<T>(duration: number, scheduler?: SchedulerLike, config?: ThrottleConfig): OperatorFunction<T, T>`
- **Summary**: Emits a value from the source, then ignores subsequent values for a specified duration in milliseconds.
- **Description**: Limits emission rate to at most once per `duration` milliseconds. Supports `{ leading: boolean, trailing: boolean }` configuration.
- **ASCII Marble**:
  ```text
  Input:  --1-2-3-4-5-6---|
  Op:     throttleTime(600)
  Output: --1-------4-----|
  ```
- **Marble String**: `-1-2-3-4-5-6-| -> throttleTime(500) -> -1-----4-----|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 250, value: 2, displayLabel: '2' }, { timeMs: 400, value: 3, displayLabel: '3' }, { timeMs: 650, value: 4, displayLabel: '4' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 650, value: 4, displayLabel: '4' }]` (complete: 1000ms)
- **Use Cases**:
  1. Scroll event rate-limiting (e.g. updating sticky navigation or progress bar every 100ms without flooding the UI).
  2. Drag and drop coordinate sampling.
- **Pitfalls**:
  1. Default config is `{ leading: true, trailing: false }`. In scroll listeners, always use `{ leading: true, trailing: true }` so the final resting scroll position is never lost!
- **Related Operators**: `throttle`, `debounceTime`, `auditTime`
- **Doc URL**: `https://rxjs.dev/api/operators/throttleTime`
- **Interactive Config**:
  - `sourcePreset`: `'burst_stream'`
  - `params`:
    - `durationMs`: `{ type: 'number', label: 'Duration (ms)', defaultValue: 500, min: 100, max: 1500, step: 50 }`
    - `leading`: `{ type: 'boolean', label: 'Leading', defaultValue: true }`
    - `trailing`: `{ type: 'boolean', label: 'Trailing', defaultValue: false }`
  - `description`: "Limits emission frequency to once every durationMs."
- **Pipeline Recipe**: `primary$.pipe(throttleTime(params['durationMs'] ?? 500, undefined, { leading: params['leading'] ?? true, trailing: params['trailing'] ?? false }))`
- **Code Example**:
  ```typescript
  import { fromEvent } from 'rxjs';
  import { throttleTime } from 'rxjs/operators';

  fromEvent(window, 'scroll')
    .pipe(throttleTime(100, undefined, { leading: true, trailing: true }))
    .subscribe(() => console.log('Scroll position:', window.scrollY));
  ```
- **Quiz**:
  - Q: "Why should a window scroll listener usually configure `throttleTime` with `trailing: true`?"
  - Options:
    - A: "To keep scroll events on the GPU"
    - B: "To ensure the final scroll position is captured when the user stops scrolling"
    - C: "Because leading: true doesn't work in browsers"
    - D: "To prevent unsubscriptions"
  - Correct: `B`
  - Explanation: Without `trailing: true`, if the user stops scrolling within the throttle window, the final scroll offset is dropped, leaving UI indicators stuck in the second-to-last position.

---

#### 35. `audit`
- **ID**: `audit` | **Difficulty**: `advanced`
- **Signature**: `audit<T>(durationSelector: (value: T) => Observable<any>): OperatorFunction<T, T>`
- **Summary**: Emits the most recently emitted value from the source within a duration determined by another Observable.
- **Description**: Similar to `throttle` with `{ leading: false, trailing: true }`. When a source emission arrives, silence window begins; when `durationSelector` emits, the latest source value is emitted.
- **ASCII Marble**:
  ```text
  Input:  --1-2-3----4-5---|
  Op:     audit(() => timer(400))
  Output: -------3-------5-|
  ```
- **Marble String**: `-1-2-3---4-5-| -> audit(() => timer(400)) -> -----3-----5-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 250, value: 2, displayLabel: '2' }, { timeMs: 400, value: 3, displayLabel: '3' }]` (complete: 900ms)
  - Output: `[{ timeMs: 500, value: 3, displayLabel: '3' }]` (complete: 900ms)
- **Use Cases**:
  1. Sampling latest sensor telemetry at the conclusion of a dynamic measuring window.
- **Pitfalls**:
  1. Does NOT emit immediately upon the first arrival (unlike throttle with leading).
  2. If the source completes while an audit window is active, the pending value is dropped.
- **Related Operators**: `auditTime`, `throttle`, `sample`
- **Doc URL**: `https://rxjs.dev/api/operators/audit`
- **Interactive Config**:
  - `sourcePreset`: `'burst_stream'`
  - `params`:
    - `auditDurationMs`: `{ type: 'number', label: 'Audit Window (ms)', defaultValue: 400, min: 100, max: 1200, step: 50 }`
  - `description`: "Ignores values during the window, then emits the latest value at window end."
- **Pipeline Recipe**: `primary$.pipe(audit(() => timer(params['auditDurationMs'] ?? 400)))`
- **Code Example**:
  ```typescript
  import { fromEvent, timer } from 'rxjs';
  import { audit } from 'rxjs/operators';

  fromEvent(document, 'click')
    .pipe(audit(() => timer(1000)))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "How does `audit` differ from `debounce`?"
  - Options:
    - A: "`audit` uses fixed duration windows that do NOT reset when new values arrive; `debounce` resets its timer on every single emission"
    - B: "`audit` is synchronous"
    - C: "`debounce` cannot handle objects"
    - D: "`audit` only runs once"
  - Correct: `A`
  - Explanation: In `debounce`, every new emission restarts the countdown timer. In `audit`, the window duration is fixed once triggered by the first arrival, and emits the latest value when that fixed window completes.

---

#### 36. `auditTime`
- **ID**: `auditTime` | **Difficulty**: `intermediate`
- **Signature**: `auditTime<T>(duration: number, scheduler?: SchedulerLike): OperatorFunction<T, T>`
- **Summary**: Ignores source values for a duration in milliseconds, then emits the most recent value from the source Observable.
- **Description**: When a source item arrives, begins a timer for `duration` ms. When the timer expires, emits the most recent value emitted by the source during that duration.
- **ASCII Marble**:
  ```text
  Input:  --1-2-3------4-5----|
  Op:     auditTime(400)
  Output: -------3---------5--|
  ```
- **Marble String**: `-1-2-3---4-5-| -> auditTime(400) -> -----3-----5-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 250, value: 2, displayLabel: '2' }, { timeMs: 400, value: 3, displayLabel: '3' }, { timeMs: 800, value: 4, displayLabel: '4' }]` (complete: 1200ms)
  - Output: `[{ timeMs: 500, value: 3, displayLabel: '3' }, { timeMs: 1200, value: 4, displayLabel: '4' }]` (complete: 1200ms)
- **Use Cases**:
  1. Rate-limiting high frequency resize or mouse events when you only want the most recent state at fixed intervals.
- **Pitfalls**:
  1. If the stream completes before the duration expires, the pending value is lost.
- **Related Operators**: `audit`, `throttleTime`, `sampleTime`
- **Doc URL**: `https://rxjs.dev/api/operators/auditTime`
- **Interactive Config**:
  - `sourcePreset`: `'burst_stream'`
  - `params`:
    - `durationMs`: `{ type: 'number', label: 'Audit Duration (ms)', defaultValue: 400, min: 100, max: 1500, step: 50 }`
  - `description`: "Emits the latest value at the end of each durationMs window."
- **Pipeline Recipe**: `primary$.pipe(auditTime(params['durationMs'] ?? 400))`
- **Code Example**:
  ```typescript
  import { fromEvent } from 'rxjs';
  import { auditTime } from 'rxjs/operators';

  fromEvent(document, 'mousemove')
    .pipe(auditTime(200))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "When does `auditTime(500)` emit its first value if items arrive at t=100ms, t=200ms, and t=400ms?"
  - Options:
    - A: "At t=100ms"
    - B: "At t=600ms (100ms + 500ms duration), emitting the item from t=400ms"
    - C: "At t=500ms"
    - D: "At stream completion"
  - Correct: `B`
  - Explanation: The timer is triggered at t=100ms when the first value arrives. It waits 500ms (until t=600ms) and emits the newest item that arrived during that window (the t=400ms item).

---

#### 37. `sample`
- **ID**: `sample` | **Difficulty**: `intermediate`
- **Signature**: `sample<T>(notifier: Observable<any>): OperatorFunction<T, T>`
- **Summary**: Emits the most recently emitted value from the source Observable whenever another Observable (`notifier`) emits.
- **Description**: Whenever `notifier` emits, `sample` looks at the source. If the source has emitted a new value since the previous sample, that value is emitted downstream; otherwise, nothing is emitted.
- **ASCII Marble**:
  ```text
  Input:     --1---2-3---4---|
  Notifier:  ----N-----N---N-|
  Output:    ----1-----3---4-|
  ```
- **Marble String**: `-1---2-3---4-| -> sample(notifier$) -> ----1-----3---4-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 150, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 550, value: 3, displayLabel: '3' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 300, value: 1, displayLabel: '1' }, { timeMs: 700, value: 3, displayLabel: '3' }]` (complete: 1000ms)
- **Use Cases**:
  1. Sampling a fast-moving physical sensor reading only when a user presses a "Capture" or "Snapshot" button.
  2. Sampling game loop coordinates on animation frame ticks.
- **Pitfalls**:
  1. If `notifier` emits multiple times without any new values from the source, no duplicates are emitted.
- **Related Operators**: `sampleTime`, `audit`, `withLatestFrom`
- **Doc URL**: `https://rxjs.dev/api/operators/sample`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `sampleIntervalMs`: `{ type: 'number', label: 'Sample Tick (ms)', defaultValue: 700, min: 200, max: 2000, step: 100 }`
  - `description`: "Takes a snapshot of the source stream whenever the notifier stream ticks."
- **Pipeline Recipe**: `primary$.pipe(sample(interval(params['sampleIntervalMs'] ?? 700)))`
- **Code Example**:
  ```typescript
  import { interval, fromEvent } from 'rxjs';
  import { sample } from 'rxjs/operators';

  const timer$ = interval(100);
  const click$ = fromEvent(document, 'click');

  timer$.pipe(sample(click$)).subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What happens if the `sample` notifier emits twice in a row with no intervening source emissions?"
  - Options:
    - A: "The last value is emitted twice"
    - B: "The second notifier emission produces NO output"
    - C: "An error occurs"
    - D: "The stream completes"
  - Correct: `B`
  - Explanation: `sample` only emits if a *new* value has arrived from the source since the last sample tick. If no new value arrived, it suppresses output.

### 5.3 Category 3: Combination Operators (11 Operators)

#### 38. `combineLatest`
- **ID**: `combineLatest` | **Difficulty**: `intermediate`
- **Signature**: `combineLatest<T extends readonly unknown[]>(sources: [...ObservableInputTuple<T>]): Observable<T>` (Pipeable alias: `combineLatestWith`)
- **Summary**: Combines multiple Observables to create an Observable whose values are calculated from the latest values of each of its input Observables.
- **Description**: Waits for ALL input Observables to emit at least one value. Once all have emitted, whenever ANY source Observable emits a new value, `combineLatest` calculates and emits an array of the latest value from each source.
- **ASCII Marble**:
  ```text
  a$:       --1----2--------3---|
  b$:       ----A------B--------|
  Combined: ----[1,A]-[2,A]-[2,B]-[3,B]|
  ```
- **Marble String**: `a: -1--2--3-|; b: --A--B---| -> combineLatest([a, b]) -> --[1,A]-[2,A]-[2,B]-[3,B]|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`a$`): `[{ timeMs: 200, value: '1', displayLabel: '1' }, { timeMs: 600, value: '2', displayLabel: '2' }]` (complete: 1000ms)
    - Stream 2 (`b$`): `[{ timeMs: 400, value: 'A', displayLabel: 'A' }, { timeMs: 800, value: 'B', displayLabel: 'B' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 400, value: ['1', 'A'], displayLabel: '[1,A]' }, { timeMs: 600, value: ['2', 'A'], displayLabel: '[2,A]' }, { timeMs: 800, value: ['2', 'B'], displayLabel: '[2,B]' }]` (complete: 1000ms)
- **Use Cases**:
  1. Multi-field form evaluation (combining `username$`, `password$`, and `termsAccepted$` to determine `isFormValid$`).
  2. Master-detail views (combining `filterParams$` and `searchQuery$` to request filtered results).
  3. Live system telemetry dashboards (combining CPU, memory, and disk telemetry streams).
- **Pitfalls**:
  1. Will NEVER emit anything until EVERY participating stream emits at least one value! If one stream stays silent, downstream will never receive any emission.
  2. If any stream errors, `combineLatest` errors immediately.
- **Related Operators**: `withLatestFrom`, `forkJoin`, `zip`
- **Doc URL**: `https://rxjs.dev/api/index/function/combineLatest`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`:
    - `stream1PeriodMs`: `{ type: 'number', label: 'Stream 1 Period (ms)', defaultValue: 400, min: 200, max: 1500, step: 50 }`
    - `stream2PeriodMs`: `{ type: 'number', label: 'Stream 2 Period (ms)', defaultValue: 600, min: 200, max: 1500, step: 50 }`
  - `description`: "Combines latest values whenever either stream emits, once both have produced at least one value."
- **Pipeline Recipe**: `combineLatest([sources.primary$, sources.secondary$ ?? of('STATIC_B')])`
- **Code Example**:
  ```typescript
  import { timer, combineLatest } from 'rxjs';
  import { map, take } from 'rxjs/operators';

  const first$ = timer(0, 300).pipe(take(3), map(i => `A${i}`));
  const second$ = timer(150, 400).pipe(take(3), map(i => `B${i}`));

  combineLatest([first$, second$]).subscribe(console.log);
  // ['A0', 'B0'], ['A1', 'B0'], ['A1', 'B1'], etc.
  ```
- **Quiz**:
  - Q: "Why won't `combineLatest([streamA$, streamB$])` emit if `streamA$` has emitted 5 values but `streamB$` hasn't emitted yet?"
  - Options:
    - A: "`combineLatest` requires an explicit trigger"
    - B: "It requires all input streams to emit at least one value before emitting its first combination"
    - C: "Because `streamA$` must complete first"
    - D: "`combineLatest` only works with synchronous arrays"
  - Correct: `B`
  - Explanation: `combineLatest` cannot produce a valid combination tuple until it has at least one value from every single participating observable.

---

#### 39. `concat`
- **ID**: `concat` | **Difficulty**: `beginner`
- **Signature**: `concat<T extends readonly unknown[]>(...inputs: [...ObservableInputTuple<T>]): Observable<T[number]>` (Pipeable alias: `concatWith`)
- **Summary**: Sequentially concatenates multiple Observables by subscribing to the next one only after the previous one completes.
- **Description**: Executes streams in strict serialized FIFO order. Subscribes to the first stream; when it completes, subscribes to the second stream, and so on.
- **ASCII Marble**:
  ```text
  a$:     --1--2|
  b$:            --3--4|
  concat: --1--2----3--4|
  ```
- **Marble String**: `a: -1-2|; b: -3-4| -> concat(a, b) -> -1-2-3-4|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`a$`): `[{ timeMs: 200, value: 'A1', displayLabel: 'A1' }, { timeMs: 400, value: 'A2', displayLabel: 'A2' }]` (complete: 500ms)
    - Stream 2 (`b$`): `[{ timeMs: 200, value: 'B1', displayLabel: 'B1' }, { timeMs: 400, value: 'B2', displayLabel: 'B2' }]` (complete: 500ms)
  - Output: `[{ timeMs: 200, value: 'A1', displayLabel: 'A1' }, { timeMs: 400, value: 'A2', displayLabel: 'A2' }, { timeMs: 700, value: 'B1', displayLabel: 'B1' }, { timeMs: 900, value: 'B2', displayLabel: 'B2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Serializing queued sequential requests (e.g. Cache check -> Network fetch -> Fallback).
  2. Multi-step registration or setup wizard streams where Step 2 must never start until Step 1 completes.
- **Pitfalls**:
  1. DEADLOCK: If the first stream never completes (e.g. an infinite stream like `interval()`), the subsequent streams will NEVER be subscribed to!
- **Related Operators**: `concatAll`, `concatMap`, `merge`
- **Doc URL**: `https://rxjs.dev/api/index/function/concat`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`:
    - `stream1Count`: `{ type: 'number', label: 'Stream 1 Take Count', defaultValue: 2, min: 1, max: 4, step: 1 }`
  - `description`: "Plays Stream 1 to completion, then immediately begins playing Stream 2."
- **Pipeline Recipe**: `concat(sources.primary$.pipe(take(params['stream1Count'] ?? 2)), sources.secondary$ ?? of('B1', 'B2'))`
- **Code Example**:
  ```typescript
  import { of, concat } from 'rxjs';
  import { delay } from 'rxjs/operators';

  const step1$ = of('Step 1 complete');
  const step2$ = of('Step 2 complete').pipe(delay(500));

  concat(step1$, step2$).subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What happens to `streamB$` in `concat(streamA$, streamB$)` if `streamA$` never completes?"
  - Options:
    - A: "`streamB$` runs concurrently in the background"
    - B: "`streamB$` is never subscribed to and will never emit"
    - C: "RxJS throws a TimeoutError"
    - D: "`streamA$` is automatically cancelled after 5 seconds"
  - Correct: `B`
  - Explanation: `concat` strictly waits for the completion signal of the active stream before subscribing to the next. If streamA never completes, streamB remains un-subscribed forever.

---

#### 40. `merge`
- **ID**: `merge` | **Difficulty**: `beginner`
- **Signature**: `merge<T extends readonly unknown[]>(...inputs: [...ObservableInputTuple<T>]): Observable<T[number]>` (Pipeable alias: `mergeWith`)
- **Summary**: Concurrently blends multiple Observables into a single Observable stream, forwarding all emissions as they occur.
- **Description**: Subscribes to all input streams concurrently. Whenever any stream produces an emission, that emission is immediately forwarded downstream. Completes only when ALL inputs have completed.
- **ASCII Marble**:
  ```text
  a$:    --1----2----|
  b$:    ----A----B--|
  merge: --1-A--2-B--|
  ```
- **Marble String**: `a: -1--2-|; b: --A--B-| -> merge(a, b) -> -1-A-2-B-|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`a$`): `[{ timeMs: 200, value: '1', displayLabel: '1' }, { timeMs: 600, value: '2', displayLabel: '2' }]` (complete: 800ms)
    - Stream 2 (`b$`): `[{ timeMs: 400, value: 'A', displayLabel: 'A' }, { timeMs: 800, value: 'B', displayLabel: 'B' }]` (complete: 900ms)
  - Output: `[{ timeMs: 200, value: '1', displayLabel: '1' }, { timeMs: 400, value: 'A', displayLabel: 'A' }, { timeMs: 600, value: '2', displayLabel: '2' }, { timeMs: 800, value: 'B', displayLabel: 'B' }]` (complete: 900ms)
- **Use Cases**:
  1. Listening to multiple UI event sources (e.g. combining mouse clicks, touch taps, and keyboard enter key into a unified `submitAction$` stream).
  2. Blending multiple sensor feeds or WebSocket alert channels.
- **Pitfalls**:
  1. Unhandled errors: An error in ANY merged stream immediately terminates the entire merged stream and unhooks all others.
- **Related Operators**: `mergeAll`, `mergeMap`, `concat`, `race`
- **Doc URL**: `https://rxjs.dev/api/index/function/merge`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`:
    - `concurrency`: `{ type: 'number', label: 'Max Concurrent Streams', defaultValue: 2, min: 1, max: 4, step: 1 }`
  - `description`: "Interleaves emissions concurrently from all input streams."
- **Pipeline Recipe**: `merge(sources.primary$, sources.secondary$ ?? of('B1', 'B2'))`
- **Code Example**:
  ```typescript
  import { fromEvent, merge } from 'rxjs';
  import { map } from 'rxjs/operators';

  const clicks$ = fromEvent(document, 'click').pipe(map(() => 'CLICK'));
  const keydowns$ = fromEvent(document, 'keydown').pipe(map(() => 'KEY'));

  merge(clicks$, keydowns$).subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What is the difference between `merge(a$, b$)` and `concat(a$, b$)`?"
  - Options:
    - A: "`concat` runs streams concurrently; `merge` runs them sequentially"
    - B: "`merge` subscribes to all streams concurrently, interleaving values; `concat` subscribes to one stream at a time in sequence"
    - C: "`merge` only works with numbers"
    - D: "`concat` ignores errors"
  - Correct: `B`
  - Explanation: `merge` runs inputs concurrently in parallel. `concat` is strictly serialized, running stream B only after stream A has sent its completion signal.

---

#### 41. `forkJoin`
- **ID**: `forkJoin` | **Difficulty**: `intermediate`
- **Signature**: `forkJoin<T extends readonly unknown[]>(sources: [...ObservableInputTuple<T>]): Observable<T>`
- **Summary**: Waits for all input Observables to complete and then emits an array or dictionary of their final emitted values.
- **Description**: The RxJS equivalent of `Promise.all()`. Subscribes to all inputs; once EVERY input stream completes, emits a single tuple/dictionary containing the last value emitted by each stream, then completes.
- **ASCII Marble**:
  ```text
  a$:       --1--2|
  b$:       ----A--B--C|
  forkJoin: -----------[2,C]|
  ```
- **Marble String**: `a: -1-2|; b: --A-B-C| -> forkJoin([a, b]) -> ---------[2,C]|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`a$`): `[{ timeMs: 200, value: '1', displayLabel: '1' }, { timeMs: 400, value: '2', displayLabel: '2' }]` (complete: 500ms)
    - Stream 2 (`b$`): `[{ timeMs: 300, value: 'A', displayLabel: 'A' }, { timeMs: 600, value: 'B', displayLabel: 'B' }]` (complete: 800ms)
  - Output: `[{ timeMs: 800, value: ['2', 'B'], displayLabel: '[2,B]' }]` (complete: 800ms)
- **Use Cases**:
  1. Aggregating parallel HTTP requests on page load (e.g. `forkJoin({ user: getUser(), settings: getSettings() })`).
  2. Batch API operations where all sub-tasks must complete before proceeding.
- **Pitfalls**:
  1. SILENT COMPLETION GOTCHA: If ANY participating stream completes WITHOUT emitting at least one value (e.g. `EMPTY`), `forkJoin` completes immediately with NO emission!
  2. If any stream never completes (infinite stream), `forkJoin` will never emit.
- **Related Operators**: `combineLatest`, `zip`
- **Doc URL**: `https://rxjs.dev/api/index/function/forkJoin`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`:
    - `stream1DelayMs`: `{ type: 'number', label: 'Stream 1 Delay (ms)', defaultValue: 400, min: 100, max: 1500, step: 50 }`
    - `stream2DelayMs`: `{ type: 'number', label: 'Stream 2 Delay (ms)', defaultValue: 700, min: 100, max: 1500, step: 50 }`
  - `description`: "Waits for all streams to finish and delivers the final values of each in a single emission."
- **Pipeline Recipe**: `forkJoin([sources.primary$.pipe(take(2)), (sources.secondary$ ?? of('X', 'Y')).pipe(take(2))])`
- **Code Example**:
  ```typescript
  import { of, forkJoin } from 'rxjs';
  import { delay } from 'rxjs/operators';

  const user$ = of({ id: 1, name: 'Alice' }).pipe(delay(200));
  const permissions$ = of(['READ', 'WRITE']).pipe(delay(400));

  forkJoin({ user: user$, permissions: permissions$ })
    .subscribe(console.log);
  // { user: { id: 1, name: 'Alice' }, permissions: ['READ', 'WRITE'] }
  ```
- **Quiz**:
  - Q: "What happens if you pass `EMPTY` as one of the streams inside `forkJoin([httpGet$, EMPTY])`?"
  - Options:
    - A: "It emits `[response, null]`"
    - B: "It completes immediately with NO emissions at all"
    - C: "It throws an EmptyError exception"
    - D: "It retries the empty stream"
  - Correct: `B`
  - Explanation: `forkJoin` requires every single input stream to emit at least one value before completing. If any stream completes empty, `forkJoin` completes without emitting anything.

---

#### 42. `zip`
- **ID**: `zip` | **Difficulty**: `intermediate`
- **Signature**: `zip<T extends readonly unknown[]>(...inputs: [...ObservableInputTuple<T>]): Observable<T>` (Pipeable alias: `zipWith`)
- **Summary**: Pairs values from multiple Observables strictly by index: 1st with 1st, 2nd with 2nd, etc.
- **Description**: Waits for each source stream to emit its N-th item, combines those N-th items into a tuple array, and emits it downstream.
- **ASCII Marble**:
  ```text
  a$:   --1----2--------3---|
  b$:   ----A------B--------|
  zip:  ----[1,A]--[2,B]----|
  ```
- **Marble String**: `a: -1--2--3-|; b: --A--B---| -> zip(a, b) -> --[1,A]--[2,B]-|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`a$`): `[{ timeMs: 200, value: '1', displayLabel: '1' }, { timeMs: 500, value: '2', displayLabel: '2' }, { timeMs: 800, value: '3', displayLabel: '3' }]` (complete: 900ms)
    - Stream 2 (`b$`): `[{ timeMs: 300, value: 'A', displayLabel: 'A' }, { timeMs: 600, value: 'B', displayLabel: 'B' }]` (complete: 700ms)
  - Output: `[{ timeMs: 300, value: ['1', 'A'], displayLabel: '[1,A]' }, { timeMs: 600, value: ['2', 'B'], displayLabel: '[2,B]' }]` (complete: 700ms)
- **Use Cases**:
  1. Synchronizing step-by-step game player moves with turn timer ticks.
  2. Pairing coordinate inputs with corresponding timestamps index-for-index.
- **Pitfalls**:
  1. MEMORY BUFFERING: If stream A emits 1,000 items while stream B only emits 2 items, stream A's remaining 998 items are buffered in memory waiting for matching pairs!
- **Related Operators**: `combineLatest`, `withLatestFrom`
- **Doc URL**: `https://rxjs.dev/api/index/function/zip`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`: []
  - `description`: "Pairs items 1-to-1 strictly by index order across both streams."
- **Pipeline Recipe**: `zip(sources.primary$, sources.secondary$ ?? of('X', 'Y', 'Z'))`
- **Code Example**:
  ```typescript
  import { of, zip } from 'rxjs';

  const age$ = of(27, 25, 29);
  const name$ = of('Alice', 'Bob', 'Charlie');

  zip(name$, age$).subscribe(console.log);
  // ['Alice', 27], ['Bob', 25], ['Charlie', 29]
  ```
- **Quiz**:
  - Q: "What happens if Stream A emits 100 items but Stream B only emits 2 items in `zip(a$, b$)`?"
  - Options:
    - A: "All 100 items are emitted with undefined for B"
    - B: "Only 2 zipped pairs are emitted, and the remaining 98 items from A remain buffered in memory"
    - C: "An index out of bounds error occurs"
    - D: "Stream B is replayed repeatedly"
  - Correct: `B`
  - Explanation: `zip` strictly pairs index N of stream A with index N of stream B. Unmatched items are retained in memory queues waiting for corresponding partners.

---

#### 43. `race`
- **ID**: `race` | **Difficulty**: `intermediate`
- **Signature**: `race<T extends readonly unknown[]>(...inputs: [...ObservableInputTuple<T>]): Observable<T[number]>` (Pipeable alias: `raceWith`)
- **Summary**: Mirrors the first Observable to emit a next notification or error, cancelling all other competitors.
- **Description**: Subscribes to all input Observables simultaneously. The very first Observable to produce an emission (or error) "wins the race". All losing streams are immediately unsubscribed and discarded.
- **ASCII Marble**:
  ```text
  a$:   ----1----2----| (first emission at 400ms)
  b$:   --A----B------| (first emission at 200ms - WINS!)
  race: --A----B------|
  ```
- **Marble String**: `a: ----1--2-|; b: --A--B---| -> race(a, b) -> --A--B---|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`a$`): `[{ timeMs: 400, value: 'Slow_1', displayLabel: 'Slow' }]` (complete: 800ms)
    - Stream 2 (`b$`): `[{ timeMs: 200, value: 'Fast_1', displayLabel: 'Fast' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 'Fast_1', displayLabel: 'Fast' }]` (complete: 600ms)
- **Use Cases**:
  1. Fallback or timeout racing: racing a primary network request against a local cache or fallback timer.
  2. Requesting identical data from multiple mirror CDN servers and keeping the fastest response.
- **Pitfalls**:
  1. The loser is determined solely by the very first emission; once a winner is chosen, losers are cancelled and cannot take over later.
- **Related Operators**: `timeout`, `takeUntil`
- **Doc URL**: `https://rxjs.dev/api/index/function/race`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`:
    - `stream1DelayMs`: `{ type: 'number', label: 'Stream 1 Delay (ms)', defaultValue: 300, min: 100, max: 1500, step: 50 }`
    - `stream2DelayMs`: `{ type: 'number', label: 'Stream 2 Delay (ms)', defaultValue: 500, min: 100, max: 1500, step: 50 }`
  - `description`: "The stream that emits first wins; all other streams are unsubscribed immediately."
- **Pipeline Recipe**: `race(sources.primary$.pipe(delay(params['stream1DelayMs'] ?? 300)), (sources.secondary$ ?? of('Mirror_OK')).pipe(delay(params['stream2DelayMs'] ?? 500)))`
- **Code Example**:
  ```typescript
  import { race, timer } from 'rxjs';
  import { mapTo } from 'rxjs/operators';

  const fast$ = timer(200).pipe(mapTo('Fast Mirror Won!'));
  const slow$ = timer(800).pipe(mapTo('Slow Mirror Won!'));

  race(fast$, slow$).subscribe(console.log); // 'Fast Mirror Won!'
  ```
- **Quiz**:
  - Q: "What happens to the losing Observables in `race(a$, b$)` once the first value from the winning Observable arrives?"
  - Options:
    - A: "They are paused and resumed on error"
    - B: "They are immediately unsubscribed and disposed of"
    - C: "They are cached for future subscribers"
    - D: "They continue executing in background threads"
  - Correct: `B`
  - Explanation: `race` immediately calls `.unsubscribe()` on all competitor streams the instant any competitor emits its first event.

---

#### 44. `withLatestFrom`
- **ID**: `withLatestFrom` | **Difficulty**: `intermediate`
- **Signature**: `withLatestFrom<T, O extends readonly unknown[]>(...inputs: [...ObservableInputTuple<O>]): OperatorFunction<T, [T, ...O]>`
- **Summary**: Combines the source Observable with other Observables to create an Observable whose values are calculated from the latest values of each, only when the source emits.
- **Description**: Whenever the primary source stream emits, it samples the latest value from each of the secondary streams passed as arguments.
- **ASCII Marble**:
  ```text
  source$:        --1------2------3---|
  secondary$:     ----A-------B-------|
  withLatestFrom: ---------[2,A]--[3,B]|
  ```
- **Marble String**: `src: --1--2--3-|; sec: -A---B---| -> src.pipe(withLatestFrom(sec)) -> ----[2,A]-[3,B]|`
- **Initial Marbles**:
  - Input:
    - Stream 1 (`src$`): `[{ timeMs: 200, value: '1', displayLabel: '1' }, { timeMs: 500, value: '2', displayLabel: '2' }, { timeMs: 800, value: '3', displayLabel: '3' }]` (complete: 1000ms)
    - Stream 2 (`sec$`): `[{ timeMs: 350, value: 'A', displayLabel: 'A' }, { timeMs: 700, value: 'B', displayLabel: 'B' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 500, value: ['2', 'A'], displayLabel: '[2,A]' }, { timeMs: 800, value: ['3', 'B'], displayLabel: '[3,B]' }]` (complete: 1000ms)
- **Use Cases**:
  1. User action with background state (e.g. click event on "Save" button sampling current form state or auth token: `saveClicks$.pipe(withLatestFrom(formState$))`).
  2. Router navigation combined with active user preferences.
- **Pitfalls**:
  1. Emissions from secondary streams do NOT trigger output emissions!
  2. If the primary stream emits before the secondary stream has emitted at least once, that primary emission is dropped.
- **Related Operators**: `combineLatest`, `sample`
- **Doc URL**: `https://rxjs.dev/api/operators/withLatestFrom`
- **Interactive Config**:
  - `sourcePreset`: `'dual_streams'`
  - `params`:
    - `secondaryPeriodMs`: `{ type: 'number', label: 'Secondary Stream Interval (ms)', defaultValue: 500, min: 200, max: 1500, step: 50 }`
  - `description`: "Primary stream triggers emissions, sampling the latest value from the secondary stream."
- **Pipeline Recipe**: `sources.primary$.pipe(withLatestFrom(sources.secondary$ ?? interval(params['secondaryPeriodMs'] ?? 500)))`
- **Code Example**:
  ```typescript
  import { fromEvent, interval } from 'rxjs';
  import { withLatestFrom } from 'rxjs/operators';

  const clicks$ = fromEvent(document, 'click');
  const timer$ = interval(1000);

  clicks$
    .pipe(withLatestFrom(timer$))
    .subscribe(([event, count]) => console.log('Clicked at second:', count));
  ```
- **Quiz**:
  - Q: "Does an emission from the secondary Observable passed to `withLatestFrom` cause the output stream to emit?"
  - Options:
    - A: "Yes, just like `combineLatest`"
    - B: "No, emissions are strictly triggered by emissions from the primary source Observable"
    - C: "Only if the primary stream has completed"
    - D: "Only if leading: true is set"
  - Correct: `B`
  - Explanation: In `withLatestFrom`, the primary stream is the sole driver. Secondary streams are merely passive sources sampled on demand when the primary emits.

---

#### 45. `startWith`
- **ID**: `startWith` | **Difficulty**: `beginner`
- **Signature**: `startWith<T, D>(...values: D[]): OperatorFunction<T, T | D>`
- **Summary**: Emits the specified values synchronously upon subscription before the source Observable begins emitting.
- **Description**: Prepends constant seed values to the stream. Upon subscription, emits the values passed as arguments in order, then mirrors the source Observable.
- **ASCII Marble**:
  ```text
  source$:   ----1----2----3----|
  Op:        startWith(0)
  Output:    0---1----2----3----|
  ```
- **Marble String**: `-1-2-3-| -> startWith(0) -> 0-1-2-3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 400, value: 1, displayLabel: '1' }, { timeMs: 800, value: 2, displayLabel: '2' }]` (complete: 1000ms)
  - Output: `[{ timeMs: 50, value: 0, displayLabel: '0' }, { timeMs: 400, value: 1, displayLabel: '1' }, { timeMs: 800, value: 2, displayLabel: '2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Supplying default/loading state (e.g. `startWith({ loading: true, data: null })`).
  2. Priming reactive form `valueChanges` with the initial form values.
  3. Guaranteeing that `combineLatest` fires immediately upon subscription without waiting for slow producers.
- **Pitfalls**:
  1. Emitted synchronously during subscription: make sure downstream subscribers are prepared for immediate synchronous emissions.
- **Related Operators**: `endWith`, `concat`, `defaultIfEmpty`
- **Doc URL**: `https://rxjs.dev/api/operators/startWith`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `initialValue`: `{ type: 'text', label: 'Initial Value', defaultValue: 'INITIAL_STATE' }`
  - `description`: "Prepends this seed value immediately upon subscription."
- **Pipeline Recipe**: `primary$.pipe(startWith(params['initialValue'] ?? 'INITIAL_STATE'))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { startWith, delay } from 'rxjs/operators';

  of('Remote Data')
    .pipe(
      delay(1000),
      startWith('Loading...')
    )
    .subscribe(console.log); // 'Loading...', (after 1s) 'Remote Data'
  ```
- **Quiz**:
  - Q: "Why is `startWith()` commonly used before passing streams into `combineLatest()`?"
  - Options:
    - A: "To prevent memory leaks"
    - B: "To guarantee that the stream has an initial value so `combineLatest` doesn't block waiting for emissions"
    - C: "Because `combineLatest` requires string inputs"
    - D: "To enable cancellation"
  - Correct: `B`
  - Explanation: Because `combineLatest` requires at least one emission from every input stream to start, `startWith` primes streams with initial values, preventing the combined pipeline from stalling.

---

#### 46. `endWith`
- **ID**: `endWith` | **Difficulty**: `beginner`
- **Signature**: `endWith<T, D>(...values: D[]): OperatorFunction<T, T | D>`
- **Summary**: Emits the specified values immediately before the Observable sequence completes.
- **Description**: Appends static values to the end of the Observable sequence, emitting them synchronously just prior to forwarding the source stream's `complete` notification.
- **ASCII Marble**:
  ```text
  source$:  --1--2--3|
  Op:       endWith(99)
  Output:   --1--2--3--99|
  ```
- **Marble String**: `-1-2-3| -> endWith(99) -> -1-2-3-99|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 650, value: 99, displayLabel: '99' }]` (complete: 700ms)
- **Use Cases**:
  1. Emitting a completion indicator or final summary flag when an operation concludes.
  2. Resetting status or progress indicators to 'DONE' on sequence termination.
- **Pitfalls**:
  1. If the source errors or never completes, `endWith` values are NEVER emitted!
- **Related Operators**: `startWith`, `finalize`, `concat`
- **Doc URL**: `https://rxjs.dev/api/operators/endWith`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `endValue`: `{ type: 'text', label: 'Ending Value', defaultValue: 'STREAM_FINISHED' }`
  - `description`: "Appends this value right before the stream completes."
- **Pipeline Recipe**: `primary$.pipe(endWith(params['endValue'] ?? 'STREAM_FINISHED'))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { endWith } from 'rxjs/operators';

  of('Task 1', 'Task 2')
    .pipe(endWith('ALL TASKS COMPLETED'))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What happens if a source Observable errors before completion when using `endWith('DONE')`?"
  - Options:
    - A: "The error is suppressed and `'DONE'` is emitted"
    - B: "The error is emitted immediately, and `'DONE'` is never emitted"
    - C: "Both the error and `'DONE'` are emitted"
    - D: "The stream retries"
  - Correct: `B`
  - Explanation: `endWith` only triggers when receiving a `complete` notification. An error notification aborts the stream before completion can occur.

---

#### 47. `concatAll`
- **ID**: `concatAll` | **Difficulty**: `intermediate`
- **Signature**: `concatAll<T>(): OperatorFunction<ObservableInput<T>, T>`
- **Summary**: Converts a higher-order Observable into a first-order Observable by subscribing to each inner Observable in sequential order.
- **Description**: Collects inner Observables emitted by the source. Subscribes to the first inner Observable; once it completes, subscribes to the second, and so on. Equivalent to `mergeAll(1)`.
- **ASCII Marble**:
  ```text
  outer$:     --o1-------o2--------|
  inner o1:     -1--2|
  inner o2:                -3--4|
  concatAll:  ---1--2-------3--4---|
  ```
- **Marble String**: `outer -> concatAll() -> serialized inner values`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 'Inner#1', displayLabel: 'in#1' }, { timeMs: 500, value: 'Inner#2', displayLabel: 'in#2' }]` (complete: 700ms)
  - Output: `[{ timeMs: 300, value: '1A', displayLabel: '1A' }, { timeMs: 400, value: '1B', displayLabel: '1B' }, { timeMs: 600, value: '2A', displayLabel: '2A' }, { timeMs: 700, value: '2B', displayLabel: '2B' }]` (complete: 800ms)
- **Use Cases**:
  1. Serializing queued asynchronous operations generated over time.
  2. Processing file upload chunks in strict FIFO order.
- **Pitfalls**:
  1. If any inner Observable never completes, subsequent queued inner Observables are blocked indefinitely.
- **Related Operators**: `concatMap`, `mergeAll`, `concat`
- **Doc URL**: `https://rxjs.dev/api/operators/concatAll`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Flattens inner observables by executing them in strict sequential order."
- **Pipeline Recipe**: `primary$.pipe(map(id => of(`${id}-A`, `${id}-B`).pipe(delay(200))), concatAll())`
- **Code Example**:
  ```typescript
  import { of, interval } from 'rxjs';
  import { map, take, concatAll } from 'rxjs/operators';

  interval(500)
    .pipe(
      take(2),
      map(id => of(`${id}: part 1`, `${id}: part 2`)),
      concatAll()
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What is `concatAll()` functionally equivalent to?"
  - Options:
    - A: "`mergeAll(Infinity)`"
    - B: "`mergeAll(1)` (concurrency limit of 1)"
    - C: "`switchAll()`"
    - D: "`exhaustAll()`"
  - Correct: `B`
  - Explanation: `concatAll` flattens inner streams sequentially with a concurrency of 1, exactly like `mergeAll(1)`.

---

#### 48. `mergeAll`
- **ID**: `mergeAll` | **Difficulty**: `intermediate`
- **Signature**: `mergeAll<T>(concurrent: number = Infinity): OperatorFunction<ObservableInput<T>, T>`
- **Summary**: Converts a higher-order Observable into a first-order Observable by subscribing concurrently to all inner Observables.
- **Description**: Flattens inner Observables concurrently. As each inner Observable is emitted by the source, `mergeAll` subscribes to it (up to optional `concurrent` limit) and forwards all values to downstream consumers as they arrive.
- **ASCII Marble**:
  ```text
  outer$:    --o1----o2-----------|
  inner o1:    -A--B----C|
  inner o2:       -1--2----3|
  mergeAll:  ---A-1-B--2--C-3-----|
  ```
- **Marble String**: `outer -> mergeAll(concurrent) -> concurrent interleaved values`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 'Inner#1', displayLabel: 'in#1' }, { timeMs: 300, value: 'Inner#2', displayLabel: 'in#2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 350, value: 'A1', displayLabel: 'A1' }, { timeMs: 450, value: 'B1', displayLabel: 'B1' }, { timeMs: 550, value: 'A2', displayLabel: 'A2' }]` (complete: 800ms)
- **Use Cases**:
  1. Executing multiple concurrent HTTP downloads generated from a list of URLs.
  2. Blending multiple inner real-time socket connections concurrently.
- **Pitfalls**:
  1. Default concurrency is `Infinity`: firing hundreds of inner HTTP requests at once can overwhelm the browser or backend server.
- **Related Operators**: `mergeMap`, `concatAll`, `merge`
- **Doc URL**: `https://rxjs.dev/api/operators/mergeAll`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `concurrency`: `{ type: 'number', label: 'Max Concurrency', defaultValue: 2, min: 1, max: 4, step: 1 }`
  - `description`: "Flattens inner observables concurrently up to the specified concurrency limit."
- **Pipeline Recipe**: `primary$.pipe(map(id => of(`${id}-A`, `${id}-B`).pipe(delay(250))), mergeAll(params['concurrency'] ?? 2))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { map, mergeAll, delay } from 'rxjs/operators';

  of(1, 2, 3)
    .pipe(
      map(id => of(`Result ${id}`).pipe(delay(300))),
      mergeAll(2)
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What risk arises if `mergeAll()` is used without setting a concurrency limit on an unbounded stream?"
  - Options:
    - A: "Immediate stack overflow"
    - B: "Unbounded concurrent subscriptions (e.g. hundreds of simultaneous HTTP requests)"
    - C: "Loss of type inference"
    - D: "The stream terminates early"
  - Correct: `B`
  - Explanation: With default concurrency `Infinity`, every emitted inner Observable is subscribed to concurrently, which can saturate the browser's HTTP connection pool.

### 5.4 Category 4: Utility Operators (12 Operators)

#### 49. `tap`
- **ID**: `tap` | **Difficulty**: `beginner`
- **Signature**: `tap<T>(observerOrNext?: Partial<Observer<T>> | ((value: T) => void)): OperatorFunction<T, T>`
- **Summary**: Performs side effects for notifications on the source Observable without altering the values or stream timing.
- **Description**: Intercepts notifications (next, error, complete, subscribe, unsubscribe) to perform side effects (logging, debugging, updating external UI state) without modifying the values passed down the pipeline.
- **ASCII Marble**:
  ```text
  Input:   --1----2----3----|
  Op:      tap(x => console.log(x))
  Output:  --1----2----3----|
  ```
- **Marble String**: `-1-2-3-| -> tap(x => sideEffect(x)) -> -1-2-3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 800ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 800ms)
- **Use Cases**:
  1. Diagnostic logging and stream inspection without altering stream emissions.
  2. Mutating local component state or toggling a spinner (e.g. `tap({ finalize: () => this.isLoading = false })`).
  3. Writing to browser localStorage or analytics caches.
- **Pitfalls**:
  1. Unhandled errors thrown inside `tap` callbacks will cause the stream to error out and terminate!
  2. Avoid mutating the properties of emitted objects inside `tap()`.
- **Related Operators**: `finalize`, `map`
- **Doc URL**: `https://rxjs.dev/api/operators/tap`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `logTag`: `{ type: 'text', label: 'Side Effect Log Tag', defaultValue: '[TAP_AUDIT]' }`
  - `description`: "Executes a side-effect log for every emission without modifying values."
- **Pipeline Recipe**: `primary$.pipe(tap(val => console.log(`${params['logTag'] ?? '[TAP]'}: ${val}`)))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { tap, map } from 'rxjs/operators';

  of(1, 2, 3)
    .pipe(
      tap(x => console.log('Pre-transform:', x)),
      map(x => x * 10),
      tap(x => console.log('Post-transform:', x))
    )
    .subscribe();
  ```
- **Quiz**:
  - Q: "What happens if an unhandled error is thrown inside a `tap()` callback function?"
  - Options:
    - A: "RxJS silently catches and suppresses the error"
    - B: "The error propagates down the pipeline, causing the stream to fail with an error notification"
    - C: "The value is converted to `null`"
    - D: "The stream retries automatically"
  - Correct: `B`
  - Explanation: `tap` executes synchronously inside the notification lifecycle. If code inside `tap` throws, that exception is caught by RxJS and dispatched downstream as an unhandled error notification.

---

#### 50. `delay`
- **ID**: `delay` | **Difficulty**: `beginner`
- **Signature**: `delay<T>(due: number | Date, scheduler?: SchedulerLike): OperatorFunction<T, T>`
- **Summary**: Delays the emission of items from the source Observable by a given timeout in milliseconds.
- **Description**: Shifts all `next` emissions and the `complete` notification forward in time by the specified millisecond duration. Important note: error notifications are NOT delayed; errors propagate immediately.
- **ASCII Marble**:
  ```text
  Input:  --1----2----3----|
  Op:     delay(300)
  Output: -----1----2----3-|
  ```
- **Marble String**: `-1-2-3-| -> delay(300) -> ----1-2-3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 100, value: 1, displayLabel: '1' }, { timeMs: 300, value: 2, displayLabel: '2' }]` (complete: 500ms)
  - Output: `[{ timeMs: 400, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }]` (complete: 800ms)
- **Use Cases**:
  1. Simulating network latency in development and unit tests.
  2. Animating staggered entrance transitions in UI components.
  3. Postponing automatic dismissal notifications (e.g. auto-dismiss toast alerts after 4000ms).
- **Pitfalls**:
  1. Error notifications from the upstream source are NOT delayed; they are forwarded immediately to downstream subscribers.
- **Related Operators**: `delayWhen`, `throttleTime`, `debounceTime`
- **Doc URL**: `https://rxjs.dev/api/operators/delay`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `delayMs`: `{ type: 'number', label: 'Delay Duration (ms)', defaultValue: 500, min: 100, max: 2000, step: 100 }`
  - `description`: "Shifts all next and complete notifications forward by delayMs."
- **Pipeline Recipe**: `primary$.pipe(delay(params['delayMs'] ?? 500))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { delay } from 'rxjs/operators';

  of('Message arrived')
    .pipe(delay(1000))
    .subscribe(console.log); // Printed after 1000ms
  ```
- **Quiz**:
  - Q: "How does `delay(1000)` handle an error notification emitted by the upstream source Observable?"
  - Options:
    - A: "It delays the error by 1000ms"
    - B: "It swallows the error"
    - C: "It emits the error immediately without waiting for the 1000ms delay"
    - D: "It retries the source"
  - Correct: `C`
  - Explanation: By design in RxJS, `delay` shifts `next` values and `complete` notifications forward in time, but `error` notifications bypass the delay and propagate immediately.

---

#### 51. `delayWhen`
- **ID**: `delayWhen` | **Difficulty**: `intermediate`
- **Signature**: `delayWhen<T>(delayDurationSelector: (value: T, index: number) => Observable<any>): OperatorFunction<T, T>`
- **Summary**: Delays the emission of each item from the source Observable by a time span determined by another Observable.
- **Description**: For each item emitted by the source, calls `delayDurationSelector(val)` to get a notifier Observable. The source item is held back until that specific notifier Observable emits or completes.
- **ASCII Marble**:
  ```text
  Input:      --1------2------|
  Duration:   ---d1     -d2
  Output:     -----1----2-----|
  ```
- **Marble String**: `-1-2-| -> delayWhen(...) -> ---1---2-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 500, value: 1, displayLabel: '1' }, { timeMs: 800, value: 2, displayLabel: '2' }]` (complete: 900ms)
- **Use Cases**:
  1. Staggering emissions based on value priority or calculated load.
  2. Holding back data until an external resource becomes ready.
- **Pitfalls**:
  1. OUT-OF-ORDER EMISSIONS: If an earlier value's delay Observable lasts longer than a later value's delay Observable, the items will emit out of their original sequence order!
- **Related Operators**: `delay`, `debounce`
- **Doc URL**: `https://rxjs.dev/api/operators/delayWhen`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `delayFactor`: `{ type: 'number', label: 'Multiplier (value * N ms)', defaultValue: 200, min: 50, max: 500, step: 25 }`
  - `description`: "Delays each item by a duration proportional to its value."
- **Pipeline Recipe**: `primary$.pipe(delayWhen(val => timer(val * (params['delayFactor'] ?? 200))))`
- **Code Example**:
  ```typescript
  import { of, timer } from 'rxjs';
  import { delayWhen } from 'rxjs/operators';

  of(1, 2, 3)
    .pipe(delayWhen(val => timer(val * 300)))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "Can `delayWhen()` cause items to be emitted in a different order than they arrived from the source?"
  - Options:
    - A: "No, order is always strictly preserved"
    - B: "Yes, if the delay Observable for an earlier item takes longer to emit than the delay Observable for a later item"
    - C: "Only when using async schedulers"
    - D: "Only with negative numbers"
  - Correct: `B`
  - Explanation: Each emission runs an independent delay Observable. Whichever delay Observable completes first allows its corresponding item to be released first, which can reorder emissions.

---

#### 52. `timeout`
- **ID**: `timeout` | **Difficulty**: `intermediate`
- **Signature**: `timeout<T, M>(config: number | TimeoutConfig<T, M>): OperatorFunction<T, T>`
- **Summary**: Raises a TimeoutError if a specified time interval passes without any emission from the source Observable.
- **Description**: Monitored timeout guard. If `each` milliseconds elapse between consecutive source emissions (or before the first emission), it terminates with a `TimeoutError` or gracefully switches to a fallback stream if configured with `{ with: () => fallback$ }`.
- **ASCII Marble**:
  ```text
  Input:    --1-------2-----------| (gap > timeout)
  Op:       timeout(500)
  Output:   --1-------2-----(ERR)|
  ```
- **Marble String**: `-1---2--------| -> timeout(500) -> -1---2---(TimeoutError)|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (error: 800ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (error: 800ms)
- **Use Cases**:
  1. HTTP request watchdog: aborting hung backend requests after 5000ms.
  2. WebSocket heartbeat monitor: detecting lost socket connections when no ping arrives within 15 seconds.
- **Pitfalls**:
  1. The timeout interval checks the duration between EACH consecutive emission, not just the initial one (unless configured with `first: ms`).
  2. In RxJS 7+, always prefer the configuration object `{ each: 5000, with: () => fallback$ }`.
- **Related Operators**: `delay`, `retry`, `catchError`
- **Doc URL**: `https://rxjs.dev/api/operators/timeout`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `timeoutMs`: `{ type: 'number', label: 'Timeout Threshold (ms)', defaultValue: 600, min: 200, max: 2000, step: 50 }`
    - `withFallback`: `{ type: 'boolean', label: 'Use Fallback Stream on Timeout?', defaultValue: false }`
  - `description`: "Errors if the pause between emissions exceeds timeoutMs."
- **Pipeline Recipe**: `params['withFallback'] ? primary$.pipe(timeout({ each: params['timeoutMs'] ?? 600, with: () => of('FALLBACK_VALUE_AFTER_TIMEOUT') })) : primary$.pipe(timeout(params['timeoutMs'] ?? 600))`
- **Code Example**:
  ```typescript
  import { interval, of } from 'rxjs';
  import { timeout, catchError } from 'rxjs/operators';

  // Source emits every 1000ms, but timeout is 500ms
  interval(1000)
    .pipe(
      timeout(500),
      catchError(err => of('Request timed out gracefully'))
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "In modern RxJS 7+, how can you switch to a fallback Observable upon timeout without catching errors?"
  - Options:
    - A: "Using `timeout({ each: 1000, with: () => fallback$ })`"
    - B: "Using `timeoutFallback(1000, fallback$)`"
    - C: "Using `defaultIfEmpty(fallback$)`"
    - D: "Using `startWith(fallback$)`"
  - Correct: `A`
  - Explanation: RxJS 7 introduced the `with` factory property inside `TimeoutConfig`, enabling direct declarative fallback switching without throwing a `TimeoutError`.

---

#### 53. `timeInterval`
- **ID**: `timeInterval` | **Difficulty**: `intermediate`
- **Signature**: `timeInterval<T>(scheduler?: SchedulerLike): OperatorFunction<T, TimeInterval<T>>`
- **Summary**: Emits an object containing the current value and the time elapsed in milliseconds since the previous emission.
- **Description**: Wraps each source emission in a `{ value: T, interval: number }` object, where `interval` represents the duration in milliseconds between the previous emission and the current emission.
- **ASCII Marble**:
  ```text
  Input:   --1-------2----3---|
  Op:      timeInterval()
  Output:  --{v:1,i:200}-{v:2,i:600}-{v:3,i:300}|
  ```
- **Marble String**: `-1----2--3-| -> timeInterval() -> -{1,400ms}--{2,500ms}--{3,200ms}-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 600, value: 2, displayLabel: '2' }]` (complete: 800ms)
  - Output: `[{ timeMs: 200, value: '{v:1,i:200}', displayLabel: '200ms' }, { timeMs: 600, value: '{v:2,i:400}', displayLabel: '400ms' }]` (complete: 800ms)
- **Use Cases**:
  1. Profiling UI latency and network response intervals.
  2. Detecting rhythm or cadence in user inputs (e.g. typing speed or game rhythm mechanics).
- **Pitfalls**:
  1. Modifies the shape of the emitted data: consumers must read `.value` to access the original payload.
- **Related Operators**: `timestamp`, `timeout`
- **Doc URL**: `https://rxjs.dev/api/operators/timeInterval`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Measures and emits the elapsed milliseconds between consecutive emissions."
- **Pipeline Recipe**: `primary$.pipe(timeInterval(), map(item => `Value: ${item.value} (delta: ${item.interval}ms)`))`
- **Code Example**:
  ```typescript
  import { fromEvent } from 'rxjs';
  import { timeInterval } from 'rxjs/operators';

  fromEvent(document, 'click')
    .pipe(timeInterval())
    .subscribe(entry =>
      console.log(`Click occurred after ${entry.interval}ms of inactivity`)
    );
  ```
- **Quiz**:
  - Q: "What does `entry.interval` measure for the very first item emitted by `timeInterval()`?"
  - Options:
    - A: "`0` always"
    - B: "The time elapsed between subscription instantiation and the first emission"
    - C: "The system uptime"
    - D: "The time to stream completion"
  - Correct: `B`
  - Explanation: For the first emitted item, `timeInterval` measures the delta from the moment the consumer subscribed up until the first item arrived.

---

#### 54. `timestamp`
- **ID**: `timestamp` | **Difficulty**: `beginner`
- **Signature**: `timestamp<T>(scheduler?: SchedulerLike): OperatorFunction<T, Timestamp<T>>`
- **Summary**: Attaches a timestamp in milliseconds to each item emitted by an Observable.
- **Description**: Wraps each emitted item in an object containing `{ value: T, timestamp: number }`, where `timestamp` is the Unix epoch timestamp in milliseconds at the exact moment of emission.
- **ASCII Marble**:
  ```text
  Input:   --1-----2-----3-----|
  Op:      timestamp()
  Output:  --{v:1,t:1700...}-{v:2,t:1700...}-|
  ```
- **Marble String**: `-1-2-3-| -> timestamp() -> -{1,ts}-{2,ts}-{3,ts}-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 500, value: 2, displayLabel: '2' }]` (complete: 700ms)
  - Output: `[{ timeMs: 200, value: '{v:1,ts}', displayLabel: '{v:1,ts}' }, { timeMs: 500, value: '{v:2,ts}', displayLabel: '{v:2,ts}' }]` (complete: 700ms)
- **Use Cases**:
  1. Auditing, telemetry logging, and forensic time-series records for incoming sensor data.
  2. Ordering concurrent asynchronous events arriving from multiple sources.
- **Pitfalls**:
  1. Wraps the payload in an object; remember to unwrap `entry.value`.
- **Related Operators**: `timeInterval`, `tap`
- **Doc URL**: `https://rxjs.dev/api/operators/timestamp`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Attaches the current epoch timestamp to every emission."
- **Pipeline Recipe**: `primary$.pipe(timestamp(), map(item => `${item.value} @ ${new Date(item.timestamp).toLocaleTimeString()}`))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { timestamp } from 'rxjs/operators';

  of('Action completed')
    .pipe(timestamp())
    .subscribe(console.log);
  // { value: 'Action completed', timestamp: 1730854800000 }
  ```
- **Quiz**:
  - Q: "What structure does `timestamp()` emit?"
  - Options:
    - A: "Just the number timestamp"
    - B: "An object with `{ value: T, timestamp: number }`"
    - C: "A string date"
    - D: "A JavaScript Date instance"
  - Correct: `B`
  - Explanation: `timestamp` outputs an object with two properties: `value` (the original value) and `timestamp` (the epoch millisecond integer).

---

#### 55. `finalize`
- **ID**: `finalize` | **Difficulty**: `beginner`
- **Signature**: `finalize<T>(callback: () => void): OperatorFunction<T, T>`
- **Summary**: Calls a callback function when the Observable sequence terminates by complete, error, or unsubscription.
- **Description**: The reactive equivalent of `try...finally`. Guaranteed to execute when the stream terminates for ANY reason—whether it completed normally, failed with an unhandled error, or was explicitly cancelled/unsubscribed by the consumer.
- **ASCII Marble**:
  ```text
  Input:    --1--2--3| or --1--2--X
  Op:       finalize(() => cleanup())
  Callback: ---------(cleanup executed)
  ```
- **Marble String**: `-1-2-3| -> finalize(() => cleanup()) -> -1-2-3| (cleanup called)`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
- **Use Cases**:
  1. Turning off loading spinners or progress overlays regardless of whether an HTTP request succeeded or failed.
  2. Cleaning up native browser resources, timers, or WebSocket subscriptions.
- **Pitfalls**:
  1. The `finalize` callback takes no arguments and cannot access error objects or stream values.
  2. Do NOT emit values or return Observables from `finalize`; it is purely for teardown side-effects.
- **Related Operators**: `tap`, `catchError`
- **Doc URL**: `https://rxjs.dev/api/operators/finalize`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `cleanupMessage`: `{ type: 'text', label: 'Teardown Notice', defaultValue: 'RESOURCES_RELEASED' }`
  - `description`: "Guaranteed teardown hook: runs on complete, error, or manual unsubscription."
- **Pipeline Recipe**: `primary$.pipe(finalize(() => console.log(`[FINALIZE]: ${params['cleanupMessage'] ?? 'TEARDOWN'}`)))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { finalize, delay } from 'rxjs/operators';

  let isSubmitting = true;

  of('Saved')
    .pipe(
      delay(500),
      finalize(() => {
        isSubmitting = false;
        console.log('Spinner dismissed!');
      })
    )
    .subscribe();
  ```
- **Quiz**:
  - Q: "Does `finalize()` execute if the user manually unsubscribes before the stream completes or errors?"
  - Options:
    - A: "No, only on complete or error"
    - B: "Yes, `finalize` is guaranteed to execute whenever the subscription is torn down, including manual unsubscription"
    - C: "Only if configured with `{ onCancel: true }`"
    - D: "Only in zoneless Angular"
  - Correct: `B`
  - Explanation: `finalize` hooks directly into the subscription teardown logic. Unsubscribing manually immediately triggers all registered `finalize` callbacks.

---

#### 56. `repeat`
- **ID**: `repeat` | **Difficulty**: `intermediate`
- **Signature**: `repeat<T>(countOrConfig?: number | RepeatConfig): OperatorFunction<T, T>`
- **Summary**: Returns an Observable that repeats the stream of items emitted by the source Observable at most `count` times.
- **Description**: When the source Observable completes normally, `repeat` immediately resubscribes to the source from the beginning. Can repeat a fixed number of times or with configurable delay intervals.
- **ASCII Marble**:
  ```text
  Input:   --1--2|
  Op:      repeat(2)
  Output:  --1--2--1--2|
  ```
- **Marble String**: `-1-2| -> repeat(2) -> -1-2-1-2|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 500ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 700, value: 1, displayLabel: '1' }, { timeMs: 900, value: 2, displayLabel: '2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Periodic polling: repeating a completed HTTP GET request every 5 seconds (`repeat({ delay: 5000 })`).
  2. Replay actions and animations.
- **Pitfalls**:
  1. ONLY repeats on `complete`! If the source terminates with an `error`, `repeat` does NOT resubscribe (use `retry` for errors).
- **Related Operators**: `repeatWhen`, `retry`, `retryWhen`
- **Doc URL**: `https://rxjs.dev/api/operators/repeat`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `repeatCount`: `{ type: 'number', label: 'Repeat Count', defaultValue: 2, min: 1, max: 4, step: 1 }`
    - `delayMs`: `{ type: 'number', label: 'Inter-repeat Delay (ms)', defaultValue: 300, min: 50, max: 1000, step: 50 }`
  - `description`: "Resubscribes to the stream from the start upon completion."
- **Pipeline Recipe**: `primary$.pipe(take(2), repeat({ count: params['repeatCount'] ?? 2, delay: params['delayMs'] ?? 300 }))`
- **Code Example**:
  ```typescript
  import { of } from 'rxjs';
  import { repeat } from 'rxjs/operators';

  of('Ping')
    .pipe(repeat({ count: 3, delay: 500 }))
    .subscribe(console.log); // 'Ping', 'Ping', 'Ping'
  ```
- **Quiz**:
  - Q: "What happens if a stream fails with an error while using `repeat(3)`?"
  - Options:
    - A: "It repeats 3 times then throws"
    - B: "It does NOT repeat; `repeat` only resubscribes on `complete`, not on `error`"
    - C: "It converts the error into a next notification"
    - D: "It completes silently"
  - Correct: `B`
  - Explanation: `repeat` is exclusively for handling stream completion. To repeat or resubscribe upon stream error, use the `retry` operator.

---

#### 57. `repeatWhen`
- **ID**: `repeatWhen` | **Difficulty**: `advanced`
- **Signature**: `repeatWhen<T>(notifier: (notifications: Observable<void>) => Observable<any>): OperatorFunction<T, T>`
- **Summary**: Returns an Observable that mirrors the source, repeating the sequence whenever the notifier Observable emits.
- **Description**: Calls `notifier` with an Observable of completion notifications. Whenever the returned notifier Observable emits, `repeatWhen` resubscribes to the source. Deprecated in RxJS 7 in favor of `repeat({ delay: () => notifier$ })`.
- **ASCII Marble**:
  ```text
  Input:     --1--2|
  Notifier:        ---N
  Output:    --1--2----1--2|
  ```
- **Marble String**: `-1-2| -> repeatWhen(...) -> -1-2---1-2|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 500ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 800, value: 1, displayLabel: '1' }, { timeMs: 1000, value: 2, displayLabel: '2' }]` (complete: 1100ms)
- **Use Cases**:
  1. Repeating operations based on external events (e.g. repeat network sync when user clicks "Refresh").
- **Pitfalls**:
  1. Deprecated in RxJS 7. Use `repeat({ delay: (count) => ... })` instead.
  2. If the notifier completes, the repeated sequence completes permanently.
- **Related Operators**: `repeat`, `retryWhen`
- **Doc URL**: `https://rxjs.dev/api/operators/repeatWhen`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `delayMs`: `{ type: 'number', label: 'Notifier Delay (ms)', defaultValue: 500, min: 200, max: 1500, step: 50 }`
  - `description`: "Re-triggers the stream whenever the notifier factory stream emits."
- **Pipeline Recipe**: `primary$.pipe(take(2), repeatWhen(completed$ => completed$.pipe(delay(params['delayMs'] ?? 500), take(1))))`
- **Code Example**:
  ```typescript
  import { of, timer } from 'rxjs';
  import { repeatWhen, take } from 'rxjs/operators';

  of('Poll')
    .pipe(
      repeatWhen(completed$ => completed$.pipe(delay(1000), take(2)))
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What is the modern recommended RxJS 7+ alternative to `repeatWhen`?"
  - Options:
    - A: "`repeat({ delay: () => notifier$ })`"
    - B: "`loop()`"
    - C: "`recurse()`"
    - D: "`cycle()`"
  - Correct: `A`
  - Explanation: RxJS 7 updated `repeat` with a config object accepting a `delay` function, rendering `repeatWhen` deprecated while simplifying syntax.

---

#### 58. `retry`
- **ID**: `retry` | **Difficulty**: `intermediate`
- **Signature**: `retry<T>(countOrConfig?: number | RetryConfig): OperatorFunction<T, T>`
- **Summary**: Resubscribes to the source Observable up to `count` times if the source emits an error.
- **Description**: Intercepts error notifications. Instead of propagating the error, resubscribes to the source from the beginning in hopes that a transient error clears. In RxJS 7+, supports exponential backoff via `{ count, delay, resetOnSuccess }`.
- **ASCII Marble**:
  ```text
  Input:   --1--X (attempt 1) -> --1--X (attempt 2) -> --1--2| (success)
  Op:      retry(2)
  Output:  --1--------1--------1--2|
  ```
- **Marble String**: `-1-X -> (retry 1) -> -1-X -> (retry 2) -> -1-2| -> output: -1---1---1-2|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 'ERR', displayLabel: 'ERR' }]` (error: 450ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 650, value: 1, displayLabel: '1' }, { timeMs: 850, value: 2, displayLabel: '2' }]` (complete: 950ms)
- **Use Cases**:
  1. Automatic HTTP request retry for transient network hiccups (e.g. 503 Service Unavailable, 504 Gateway Timeout).
  2. Exponential backoff retry strategies with jitter.
- **Pitfalls**:
  1. Do NOT retry non-idempotent operations (e.g. credit card payment POST requests).
  2. Resubscribing re-executes the producer from the very beginning; if side-effects occurred before the error, they will happen again.
- **Related Operators**: `retryWhen`, `repeat`, `catchError`
- **Doc URL**: `https://rxjs.dev/api/operators/retry`
- **Interactive Config**:
  - `sourcePreset`: `'error_prone_stream'`
  - `params`:
    - `retryCount`: `{ type: 'number', label: 'Max Retries', defaultValue: 2, min: 1, max: 4, step: 1 }`
    - `backoffMs`: `{ type: 'number', label: 'Retry Delay (ms)', defaultValue: 300, min: 100, max: 1000, step: 50 }`
  - `description`: "Catches error and automatically resubscribes up to N times."
- **Pipeline Recipe**: `primary$.pipe(retry({ count: params['retryCount'] ?? 2, delay: params['backoffMs'] ?? 300, resetOnSuccess: true }))`
- **Code Example**:
  ```typescript
  import { of, throwError } from 'rxjs';
  import { mergeMap, retry } from 'rxjs/operators';

  let attempts = 0;
  const failingStream$ = of('req').pipe(
    mergeMap(() => {
      attempts++;
      if (attempts < 3) return throwError(() => new Error('Server Busy (503)'));
      return of('Success on Attempt 3');
    })
  );

  failingStream$
    .pipe(retry({ count: 3, delay: 200 }))
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "What does `resetOnSuccess: true` do inside `retry({ count: 2, resetOnSuccess: true })`?"
  - Options:
    - A: "It clears browser cookies"
    - B: "It resets the remaining retry counter back to its initial value (2) as soon as any emission succeeds"
    - C: "It restarts the Angular application"
    - D: "It resets the delay to 0"
  - Correct: `B`
  - Explanation: `resetOnSuccess: true` ensures that if a stream emits a valid next item after recovering from an error, the retry budget is replenished for future errors that might occur later in the stream.

---

#### 59. `retryWhen`
- **ID**: `retryWhen` | **Difficulty**: `advanced`
- **Signature**: `retryWhen<T>(notifier: (errors: Observable<any>) => Observable<any>): OperatorFunction<T, T>`
- **Summary**: Resubscribes to the source Observable when it errors based on a notifier Observable.
- **Description**: Passes an Observable of errors to a notifier factory function. Whenever the returned notifier Observable emits, `retryWhen` resubscribes to the source. Deprecated in RxJS 7 in favor of `retry({ delay: (err, count) => ... })`.
- **ASCII Marble**:
  ```text
  Input:   --1--X
  Retry:        --delay(400)---> --1--2|
  Output:  --1---------------------1--2|
  ```
- **Marble String**: `-1-X -> retryWhen(...) -> -1----1-2|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }]` (error: 300ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 700, value: 1, displayLabel: '1' }, { timeMs: 900, value: 2, displayLabel: '2' }]` (complete: 1000ms)
- **Use Cases**:
  1. Custom backoff retry schedules based on HTTP status code (e.g. retry 503 immediately, but delay 5000ms on 429 Too Many Requests).
- **Pitfalls**:
  1. Deprecated in RxJS 7. Use `retry({ delay: (error, retryCount) => timer(...) })`.
  2. If the notifier throws or emits an error, that error immediately terminates the stream.
- **Related Operators**: `retry`, `repeatWhen`, `catchError`
- **Doc URL**: `https://rxjs.dev/api/operators/retryWhen`
- **Interactive Config**:
  - `sourcePreset`: `'error_prone_stream'`
  - `params`:
    - `backoffDelayMs`: `{ type: 'number', label: 'Backoff Delay (ms)', defaultValue: 400, min: 100, max: 1200, step: 50 }`
  - `description`: "Re-subscribes upon error when the notifier stream produces a value."
- **Pipeline Recipe**: `primary$.pipe(retryWhen(errors$ => errors$.pipe(delay(params['backoffDelayMs'] ?? 400), take(2))))`
- **Code Example**:
  ```typescript
  import { of, throwError, timer } from 'rxjs';
  import { mergeMap, retryWhen, delayWhen } from 'rxjs/operators';

  let count = 0;
  of(1)
    .pipe(
      mergeMap(() => (++count < 3 ? throwError(() => 'Transient Err') : of('OK!'))),
      retryWhen(errors => errors.pipe(delayWhen(() => timer(300))))
    )
    .subscribe(console.log);
  ```
- **Quiz**:
  - Q: "Why was `retryWhen` deprecated in RxJS 7 in favor of `retry({ delay: ... })`?"
  - Options:
    - A: "It was too slow"
    - B: "To eliminate complex nested subject pipelines and provide simpler type-safe access to retry counts and errors"
    - C: "Because errors are no longer caught in RxJS"
    - D: "To remove timers from the core"
  - Correct: `B`
  - Explanation: `retryWhen` required managing an inner errors Observable with operators like `scan` to track retry counts. Modern `retry({ delay: (err, count) => timer(...) })` provides a clean, declarative callback.

---

#### 60. `dematerialize`
- **ID**: `dematerialize` | **Difficulty**: `advanced`
- **Signature**: `dematerialize<N extends Notification<any>>(): OperatorFunction<N, ObservedValueOf<N>>`
- **Summary**: Converts an Observable of Notification objects into the actual emissions that they represent.
- **Description**: The inverse of `materialize`. Takes a stream whose `next` emissions are RxJS `Notification` objects (representing `next(v)`, `error(e)`, or `complete()`) and converts them back into real stream notifications.
- **ASCII Marble**:
  ```text
  Input:  --N(1)--N(2)--C| (Notification objects)
  Op:     dematerialize()
  Output: --1-----2-----|
  ```
- **Marble String**: `-N(1)-N(2)-C| -> dematerialize() -> -1-2-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 'Notification(next: 1)', displayLabel: 'N(1)' }, { timeMs: 400, value: 'Notification(next: 2)', displayLabel: 'N(2)' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
- **Use Cases**:
  1. Serializing stream events across WebWorkers or WebSockets as plain objects, then rehydrating them into real RxJS emissions.
  2. Advanced marble test harness emulation.
- **Pitfalls**:
  1. Incoming items must strictly be instances of `Notification`. Passing arbitrary non-Notification objects throws a TypeError.
- **Related Operators**: `materialize`
- **Doc URL**: `https://rxjs.dev/api/operators/dematerialize`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Rehydrates materialized Notification instances into real stream emissions."
- **Pipeline Recipe**: `primary$.pipe(materialize(), delay(100), dematerialize())`
- **Code Example**:
  ```typescript
  import { of, Notification } from 'rxjs';
  import { dematerialize } from 'rxjs/operators';

  const notifications$ = of(
    Notification.createNext('Item A'),
    Notification.createNext('Item B'),
    Notification.createComplete()
  );

  notifications$.pipe(dematerialize()).subscribe({
    next: console.log,
    complete: () => console.log('Rehydrated complete!')
  });
  ```
- **Quiz**:
  - Q: "What operator is the direct inverse of `dematerialize()`?"
  - Options:
    - A: "`materialize()`"
    - B: "`toArray()`"
    - C: "`scan()`"
    - D: "`finalize()`"
  - Correct: `A`
  - Explanation: `materialize()` turns next, error, and complete notifications into `Notification` objects. `dematerialize()` takes those objects and unpacks them back into actual stream signals.

### 5.5 Category 5: Multicasting Operators (5 Operators)

#### 61. `share`
- **ID**: `share` | **Difficulty**: `intermediate`
- **Signature**: `share<T>(options?: ShareConfig<T>): OperatorFunction<T, T>`
- **Summary**: Returns an Observable that shares a single subscription to the underlying source across multiple subscribers.
- **Description**: The unified, modern multicasting operator in RxJS 7+. Multicasts emissions from a single source execution among multiple downstream subscribers. Automatically manages connection and unsubscription based on reference counting (`resetOnRefCountZero`, `resetOnComplete`, `resetOnError`).
- **ASCII Marble**:
  ```text
  Source:  --1----2----3----| (single producer execution)
  Sub 1:   --1----2----3----|
  Sub 2:   -------2----3----|
  ```
- **Marble String**: `source: -1-2-3-| -> share() -> sub1: -1-2-3-|; sub2: ---2-3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 800ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 800ms)
- **Use Cases**:
  1. Sharing expensive computations or network fetches among multiple component subscribers without duplicate executions.
  2. Creating hot streams from cold Observables.
- **Pitfalls**:
  1. Late subscribers: By default, `share()` does NOT replay past emissions to late subscribers (use `shareReplay` or `share({ connector: () => new ReplaySubject(1) })` if late subscribers need past values).
  2. If all subscribers unsubscribe and `resetOnRefCountZero: true`, the source is unsubscribed and torn down.
- **Related Operators**: `shareReplay`, `multicast`, `publish`, `refCount`
- **Doc URL**: `https://rxjs.dev/api/operators/share`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `resetOnRefCountZero`: `{ type: 'boolean', label: 'Reset when subscribers drop to 0', defaultValue: true }`
    - `resetOnComplete`: `{ type: 'boolean', label: 'Reset when source completes', defaultValue: true }`
  - `description`: "Shares a single source stream among multiple subscribers."
- **Pipeline Recipe**: `primary$.pipe(share({ resetOnRefCountZero: params['resetOnRefCountZero'] ?? true, resetOnComplete: params['resetOnComplete'] ?? true }))`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { share, take } from 'rxjs/operators';

  const shared$ = interval(1000).pipe(
    take(3),
    share()
  );

  shared$.subscribe(val => console.log('Subscriber A:', val));
  setTimeout(() => {
    shared$.subscribe(val => console.log('Subscriber B (late):', val));
  }, 1500);
  ```
- **Quiz**:
  - Q: "What does `share()` do when a new subscriber arrives while the source stream is already active?"
  - Options:
    - A: "It restarts the source from t=0"
    - B: "It receives current and future emissions without re-running the source producer from the beginning"
    - C: "It throws an error"
    - D: "It unsubscribes earlier subscribers"
  - Correct: `B`
  - Explanation: `share()` turns a cold Observable hot by multicasting a single active execution. Late subscribers receive whatever values are emitted from that moment forward.

---

#### 62. `shareReplay`
- **ID**: `shareReplay` | **Difficulty**: `intermediate`
- **Signature**: `shareReplay<T>(configOrBufferSize?: number | ShareReplayConfig): OperatorFunction<T, T>`
- **Summary**: Shares the source Observable and replays a specified buffer of past emissions to new late subscribers.
- **Description**: Connects to the source Observable, multicasts its emissions, and caches the last `bufferSize` values. Any subsequent subscriber receives the cached values immediately upon subscription, followed by live emissions.
- **ASCII Marble**:
  ```text
  Source:  --1--2--3|
  Sub 1:   --1--2--3|
  Sub 2:   ----------[2,3]| (late subscriber gets replayed cached values)
  ```
- **Marble String**: `source: -1-2-3| -> shareReplay(1) -> Sub 2 gets: -3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 700ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }, { timeMs: 600, value: 3, displayLabel: '3' }]` (complete: 700ms)
- **Use Cases**:
  1. Caching HTTP GET responses in Angular services (e.g. `getCourses().pipe(shareReplay({ bufferSize: 1, refCount: true }))`).
  2. Sharing current user authentication state or configuration profiles across multiple components.
- **Pitfalls**:
  1. CRITICAL ANGULAR MEMORY LEAK: Calling `shareReplay(1)` without `{ refCount: true }` prevents unsubscription! The underlying source stays connected forever even after all components destroy. ALWAYS use `shareReplay({ bufferSize: 1, refCount: true })`.
- **Related Operators**: `share`, `publishReplay`
- **Doc URL**: `https://rxjs.dev/api/operators/shareReplay`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `bufferSize`: `{ type: 'number', label: 'Replay Buffer Size', defaultValue: 1, min: 1, max: 4, step: 1 }`
    - `refCount`: `{ type: 'boolean', label: 'refCount (prevent memory leaks)', defaultValue: true }`
  - `description`: "Multicasts and caches past emissions for late subscribers."
- **Pipeline Recipe**: `primary$.pipe(shareReplay({ bufferSize: params['bufferSize'] ?? 1, refCount: params['refCount'] ?? true }))`
- **Code Example**:
  ```typescript
  import { HttpClient } from '@angular/common/http';
  import { inject } from '@angular/core';
  import { shareReplay } from 'rxjs/operators';

  // In an Angular service:
  const http = inject(HttpClient);
  const userProfile$ = http.get('/api/me').pipe(
    shareReplay({ bufferSize: 1, refCount: true })
  );
  ```
- **Quiz**:
  - Q: "Why is `shareReplay({ bufferSize: 1, refCount: true })` strongly recommended over `shareReplay(1)` in Angular services?"
  - Options:
    - A: "It runs faster"
    - B: "Without `refCount: true`, `shareReplay` holds an indefinite subscription to the source even after all subscribers have unsubscribed, causing memory leaks"
    - C: "Because TypeScript requires an object"
    - D: "To enable CORS"
  - Correct: `B`
  - Explanation: Without `refCount: true`, `shareReplay` does not unsubscribe from the source when subscriber count reaches 0. In long-lived Angular applications, this causes persistent memory leaks and orphaned connections.

---

#### 63. `multicast`
- **ID**: `multicast` | **Difficulty**: `advanced`
- **Signature**: `multicast<T>(subjectOrSubjectFactory: Subject<T> | (() => Subject<T>)): UnaryFunction<Observable<T>, ConnectableObservable<T>>`
- **Summary**: Shares a source Observable using an intermediate Subject, returning a `ConnectableObservable` that begins emitting only upon calling `.connect()`.
- **Description**: Classic RxJS multicasting architecture. Wraps the source with an intermediate Subject (Subject, BehaviorSubject, ReplaySubject). Returns a `ConnectableObservable` which does not subscribe to the source until `.connect()` is explicitly called. Deprecated in RxJS 7 in favor of `share()` or `connectable()`.
- **ASCII Marble**:
  ```text
  Source:     --1--2--3--|
  Connect():  ------^
  Subscribers:------1--2--3--|
  ```
- **Marble String**: `source: -1-2-3-| -> multicast(new Subject()) -> connectable$`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
- **Use Cases**:
  1. Manual control over when an observable begins executing (e.g. subscribing 3 consumers first, then calling `.connect()` so none miss the initial emission).
- **Pitfalls**:
  1. Deprecated in RxJS 7. Use `connectable(source$, { connector: () => new Subject() })` or `share()`.
  2. Forgetting to call `.connect()` results in subscribers waiting indefinitely without any emissions.
- **Related Operators**: `publish`, `refCount`, `share`, `connectable`
- **Doc URL**: `https://rxjs.dev/api/operators/multicast`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`:
    - `autoConnect`: `{ type: 'boolean', label: 'Call connect() automatically?', defaultValue: true }`
  - `description`: "Multicasts through an intermediate Subject, requiring .connect() or refCount()."
- **Pipeline Recipe**: `primary$.pipe(multicast(() => new Subject()), refCount())`
- **Code Example**:
  ```typescript
  import { interval, Subject, ConnectableObservable } from 'rxjs';
  import { multicast, take } from 'rxjs/operators';

  const multi$ = interval(500).pipe(
    take(3),
    multicast(new Subject())
  ) as ConnectableObservable<number>;

  multi$.subscribe(v => console.log('Sub A:', v));
  multi$.subscribe(v => console.log('Sub B:', v));

  // Explicitly initiate execution
  multi$.connect();
  ```
- **Quiz**:
  - Q: "What must be invoked on the `ConnectableObservable` returned by `multicast()` before the source Observable begins execution?"
  - Options:
    - A: "`.start()`"
    - B: "`.connect()`"
    - C: "`.run()`"
    - D: "`.pipe()`"
  - Correct: `B`
  - Explanation: A `ConnectableObservable` waits for an explicit `.connect()` call before subscribing to its underlying source Observable.

---

#### 64. `publish`
- **ID**: `publish` | **Difficulty**: `advanced`
- **Signature**: `publish<T>(): UnaryFunction<Observable<T>, ConnectableObservable<T>>`
- **Summary**: A thin wrapper around `multicast(new Subject())` that returns a `ConnectableObservable`.
- **Description**: Syntactic shortcut for `multicast(() => new Subject())`. Creates a `ConnectableObservable` that shares a single underlying subscription to the source. Deprecated in RxJS 7 in favor of `connectable()` or `share()`.
- **ASCII Marble**:
  ```text
  Source:     --1--2--3--|
  Connect():  ---^
  Output:     ---1--2--3--|
  ```
- **Marble String**: `source: -1-2-3-| -> publish() + connect() -> -1-2-3-|`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
- **Use Cases**:
  1. Synchronizing multiple observers before triggering stream execution.
- **Pitfalls**:
  1. Deprecated in RxJS 7. Use modern `connectable()` or `share()`.
- **Related Operators**: `multicast`, `refCount`, `share`
- **Doc URL**: `https://rxjs.dev/api/operators/publish`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Wraps source in ConnectableObservable via standard Subject."
- **Pipeline Recipe**: `primary$.pipe(publish(), refCount())`
- **Code Example**:
  ```typescript
  import { interval, ConnectableObservable } from 'rxjs';
  import { publish, take } from 'rxjs/operators';

  const published$ = interval(1000).pipe(
    take(3),
    publish()
  ) as ConnectableObservable<number>;

  published$.subscribe(console.log);
  published$.connect();
  ```
- **Quiz**:
  - Q: "What is `publish()` under the hood in RxJS?"
  - Options:
    - A: "A wrapper for `shareReplay`"
    - B: "A shortcut for `multicast(new Subject())`"
    - C: "An async scheduler"
    - D: "A WebSocket proxy"
  - Correct: `B`
  - Explanation: `publish()` is simply shorthand for `multicast(new Subject())`.

---

#### 65. `refCount`
- **ID**: `refCount` | **Difficulty**: `intermediate`
- **Signature**: `refCount<T>(): MonoTypeOperatorFunction<T>`
- **Summary**: Makes a ConnectableObservable automatically connect when the first subscriber arrives and disconnect when the last one leaves.
- **Description**: Reference-counting operator applied to a `ConnectableObservable`. When subscriber count increments from 0 to 1, it automatically calls `.connect()`. When subscriber count drops back to 0, it automatically unsubscribes from the source.
- **ASCII Marble**:
  ```text
  Sub 1 (+1):  --1--2--3--| (auto connects at t=0)
  Sub 2 (+1):  -----2--3--|
  Unsub all:   -----------| (auto disconnects when refCount = 0)
  ```
- **Marble String**: `connectable$ -> refCount() -> auto connect on 1st sub, auto teardown on 0 subs`
- **Initial Marbles**:
  - Input: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
  - Output: `[{ timeMs: 200, value: 1, displayLabel: '1' }, { timeMs: 400, value: 2, displayLabel: '2' }]` (complete: 600ms)
- **Use Cases**:
  1. Automating the lifecycle of multicasted streams so developers don't have to manually call `.connect()` or store connection subscriptions.
- **Pitfalls**:
  1. Deprecated in RxJS 7 when used in combination with deprecated `publish()` or `multicast()`. Use modern `share({ resetOnRefCountZero: true })` instead.
- **Related Operators**: `multicast`, `publish`, `share`
- **Doc URL**: `https://rxjs.dev/api/operators/refCount`
- **Interactive Config**:
  - `sourcePreset`: `'numbers_interval'`
  - `params`: []
  - `description`: "Automates connect() when refCount > 0 and disconnects when refCount = 0."
- **Pipeline Recipe**: `primary$.pipe(publish(), refCount())`
- **Code Example**:
  ```typescript
  import { interval } from 'rxjs';
  import { publish, refCount, take } from 'rxjs/operators';

  // Automatically connects on first subscription and disconnects on teardown
  const autoShared$ = interval(1000).pipe(
    take(5),
    publish(),
    refCount()
  );

  const sub = autoShared$.subscribe(console.log);
  // Auto-disconnects after 2500ms
  setTimeout(() => sub.unsubscribe(), 2500);
  ```
- **Quiz**:
  - Q: "When does `refCount()` call `connect()` on an underlying ConnectableObservable?"
  - Options:
    - A: "Immediately when created"
    - B: "When the subscriber count increments from 0 to 1"
    - C: "When the source completes"
    - D: "Only when invoked manually"
  - Correct: `B`
  - Explanation: `refCount()` tracks the count of active subscribers. As soon as the first consumer subscribes (count becomes 1), it connects to the source. When all consumers unsubscribe (count becomes 0), it unhooks.

---

## 6. Implementation Architecture & Code Organization Guidelines

### 6.1 Recommended Directory & File Structure
Given that 65 operators with complete metadata, quizzes, and diagrams form a substantial dataset (~4,000 lines of code), the recommended layout for `src/app/features/module3-operators/` is modular:

```text
src/app/features/module3-operators/
├── data/
│   ├── index.ts                     # Aggregates and exports all 65 operators & maps
│   ├── transformation.data.ts       # 18 Transformation operators
│   ├── filtering.data.ts            # 19 Filtering operators
│   ├── combination.data.ts          # 11 Combination operators
│   ├── utility.data.ts              # 12 Utility operators
│   └── multicasting.data.ts         # 5 Multicasting operators
├── services/
│   └── operator-runner.service.ts   # buildSourceStreams() & executeOperatorPipeline()
├── operator-catalog.component.ts    # Main catalog page with category tabs, search & filters
├── operator-playground.component.ts # Dedicated deep-dive playground per operator
├── module3.data.ts                  # Root data barrel: MODULE3_OPERATORS, OPERATORS_BY_CATEGORY
└── module3.routes.ts                # Lazy routes for /module3/:category & /module3/:category/:operatorId
```

### 6.2 Master Data Model Exports (`module3.data.ts`)
```typescript
import { MODULE3_TRANSFORMATION_OPERATORS } from './data/transformation.data';
import { MODULE3_FILTERING_OPERATORS } from './data/filtering.data';
import { MODULE3_COMBINATION_OPERATORS } from './data/combination.data';
import { MODULE3_UTILITY_OPERATORS } from './data/utility.data';
import { MODULE3_MULTICASTING_OPERATORS } from './data/multicasting.data';
import { OperatorData, Module3Category } from './data/models';

export * from './data/models';

export const MODULE3_OPERATORS: Record<string, OperatorData> = {
  ...MODULE3_TRANSFORMATION_OPERATORS,
  ...MODULE3_FILTERING_OPERATORS,
  ...MODULE3_COMBINATION_OPERATORS,
  ...MODULE3_UTILITY_OPERATORS,
  ...MODULE3_MULTICASTING_OPERATORS
};

export const OPERATORS_BY_CATEGORY: Record<Module3Category, OperatorData[]> = {
  transformation: Object.values(MODULE3_TRANSFORMATION_OPERATORS),
  filtering: Object.values(MODULE3_FILTERING_OPERATORS),
  combination: Object.values(MODULE3_COMBINATION_OPERATORS),
  utility: Object.values(MODULE3_UTILITY_OPERATORS),
  multicasting: Object.values(MODULE3_MULTICASTING_OPERATORS)
};

export const CATEGORY_METADATA: Record<Module3Category, { title: string; count: number; description: string; icon: string }> = {
  transformation: { title: 'Transformation', count: 18, description: 'Transform values, aggregate state, and window streams over time', icon: '🔄' },
  filtering: { title: 'Filtering', count: 19, description: 'Prune, debounce, throttle, and sample stream emissions', icon: '⚡' },
  combination: { title: 'Combination', count: 11, description: 'Blend, concatenate, pair, and race multiple stream sources', icon: '🔀' },
  utility: { title: 'Utility', count: 12, description: 'Perform side-effects, delay, timeout, repeat, and retry operations', icon: '🛠️' },
  multicasting: { title: 'Multicasting', count: 5, description: 'Share executions, replay caches, and manage connection lifecycles', icon: '📡' }
};
```

---

## 7. Caveats

1. **RxJS 7.8 Deprecations**: Operators `mapTo`, `pluck`, `repeatWhen`, `retryWhen`, `multicast`, `publish`, and `refCount` have deprecation notices in RxJS 7+. In this specification, their historical and functional behavior is fully preserved and authentically implemented, with clear notes and quizzes highlighting the recommended modern alternatives (`map`, `repeat({ delay })`, `retry({ delay })`, and `share`).
2. **Combination Operators Pipeable vs Creation**: In RxJS 7, `combineLatest`, `concat`, `merge`, `zip`, and `race` exist as creation functions taking arrays/tuples of Observables, while their pipeable equivalents are named `combineLatestWith`, `concatWith`, `mergeWith`, `zipWith`, and `raceWith`. The pipeline runner and code examples use creation functions or pipeable equivalents appropriately.
3. **Infinite Stream Safety**: Operators like `reduce`, `toArray`, and `takeLast` require a completed stream to emit. The pipeline runner must ensure that input sources for these operators are bounded (e.g. capped with `take(N)`) so that demo animations complete within the 4000ms diagram timeframe.

---

## 8. Conclusion

The data architecture for **Module 3: Operators by Category (65 Operators Total)** is completely defined and validated:
- All 65 operators are categorized according to the project specifications:
  - Transformation: 18 operators
  - Filtering: 19 operators
  - Combination: 11 operators
  - Utility: 12 operators
  - Multicasting: 5 operators
- The `OperatorData` contract satisfies all requirements of existing shared components: `<app-operator-card>`, `<app-marble-diagram>`, `<app-code-block>`, and `<app-quiz-block>`.
- ASCII and SVG marble diagrams, authentic execution recipes, tunable UI parameter configurations, real-world use cases, common pitfalls, and conceptual multiple-choice quiz questions are fully specified for every operator.
- Implementation teams can proceed directly with coding `module3.data.ts` and the Module 3 playground UI without ambiguity.

---

## 9. Verification Method

To independently verify this specification:
1. **Count Verification**:
   Inspect Section 5 to confirm the presence of all 65 unique operator IDs:
   - Category 1 (Transformation): 18 operators (`map` through `groupBy`)
   - Category 2 (Filtering): 19 operators (`filter` through `sample`)
   - Category 3 (Combination): 11 operators (`combineLatest` through `mergeAll`)
   - Category 4 (Utility): 12 operators (`tap` through `dematerialize`)
   - Category 5 (Multicasting): 5 operators (`share` through `refCount`)
   Total: `18 + 19 + 11 + 12 + 5 = 65`.
2. **Contract Compatibility**:
   Compare `OperatorData.metadata` with `OperatorMetadata` in `src/app/core/models/index.ts:43-55`. All required properties (`name`, `category`, `signature`, `summary`, `description`, `difficulty`) match exactly.
3. **Build Health**:
   Execute `npx ng build --configuration development` to ensure the project compiles with 0 errors. Verified: Build completed successfully in 8.11s with code 0.
