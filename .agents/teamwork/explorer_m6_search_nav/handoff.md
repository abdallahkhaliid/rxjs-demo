# Handoff Report: Global Search Command Palette & Keyboard Navigation Architecture (Milestone 6)

**Author**: Explorer 2 (`explorer_m6_search_nav`)  
**Target Milestone**: Milestone 6 (Polish, Navigation & Verification — Features F50 & F51)  
**Date**: 2026-11-07  

---

## 1. Observation

### 1.1 Existing Layout and Shell Architecture
- **`src/app/core/layout/shell.component.html` (lines 1–19)**:
  Hosts `TopbarComponent`, `SidenavComponent`, `BreadcrumbsComponent`, and `<router-outlet />`. Currently neither `SearchPaletteComponent` nor keyboard navigation listeners are mounted at the shell level.
- **`src/app/core/layout/topbar.component.html` (lines 58–131) and `topbar.component.ts` (lines 24–78)**:
  `TopbarComponent` currently contains an inline prototype search modal dialog (`<div class="search-modal-backdrop">...</div>`) with basic search input and keyboard handling for `Ctrl+K`, `Escape`, `ArrowUp`, `ArrowDown`, and `Enter`.
- **`src/app/core/layout/topbar.component.scss` (lines 181–354)**:
  173 lines of SCSS dedicated to the search modal are directly embedded in `topbar.component.scss`.

### 1.2 Existing Search Service & Navigation Data
- **`src/app/core/services/search.service.ts` (lines 4–133)**:
  Defines `MODULE_NAV_DATA` with 8 `ModuleNavGroup` entries. However, Module 3 (`id: 'module3'`) contains only 5 coarse category links (`transformation`, `filtering`, `combination`, `utility`, `multicasting-ops`). None of the 65 individual operators in Module 3 are indexed in `MODULE_NAV_DATA`!
- **`src/app/core/services/search.service.ts` (lines 143–158)**:
  `searchableItems` computed signal currently only flattens `MODULE_NAV_DATA` topics (yielding only 48 items), completely missing all individual operators.
- **`src/app/core/services/search.service.spec.ts` (lines 18–22)**:
  Verifies that `searchableItems().length` is greater than 40.

### 1.3 Module Route Definitions & Catalog Structure
- **Module 1**: `src/app/features/module1-fundamentals/module1.routes.ts` defines 7 routes:
  `what-is-rxjs`, `what-is-observable`, `observable-vs-promise`, `observer-subscriber`, `subscription-lifecycle`, `cold-vs-hot`, `multicasting`.
- **Module 2**: `src/app/features/module2-creation/module2.routes.ts` defines 12 routes:
  `of`, `from`, `from-event`, `interval`, `timer`, `range`, `throw-error`, `defer`, `empty`, `never`, `generate`, `iif`.
- **Module 3**: `src/app/features/module3-operators/module3.routes.ts` defines routes `:category` and `:category/:operatorId`.
  In `src/app/features/module3-operators/data/`:
  - `transformation.data.ts`: 18 operators (`map`, `mapTo`, `pluck`, `scan`, `reduce`, `toArray`, `buffer`, `bufferCount`, `bufferTime`, `bufferToggle`, `bufferWhen`, `window`, `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, `pairwise`, `groupBy`).
  - `filtering.data.ts`: 19 operators (`filter`, `take`, `takeLast`, `takeUntil`, `takeWhile`, `skip`, `skipLast`, `skipUntil`, `skipWhile`, `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged`, `debounce`, `debounceTime`, `throttle`, `throttleTime`, `audit`, `auditTime`, `sample`).
  - `combination.data.ts`: 11 operators (`combineLatest`, `concat`, `merge`, `forkJoin`, `zip`, `race`, `withLatestFrom`, `startWith`, `endWith`, `concatAll`, `mergeAll`).
  - `utility.data.ts`: 12 operators (`tap`, `delay`, `delayWhen`, `timeout`, `timeInterval`, `timestamp`, `finalize`, `repeat`, `repeatWhen`, `retry`, `retryWhen`, `dematerialize`).
  - `multicasting.data.ts`: 5 operators (`share`, `shareReplay`, `multicast`, `publish`, `refCount`).
  Total in Module 3: 65 operators.
- **Module 4**: `src/app/features/module4-higher-order/module4.routes.ts` defines 5 routes:
  `overview`, `switch-map`, `merge-map`, `concat-map`, `exhaust-map`.
- **Module 5**: `src/app/features/module5-subjects/module5.routes.ts` defines 4 routes:
  `sandbox`, `behavior-subject`, `replay-subject`, `async-subject`.
- **Module 6**: `src/app/features/module6-schedulers/module6.routes.ts` defines 5 routes:
  `visualizer`, `queue`, `asap`, `async`, `animation-frame`.
- **Module 7**: `src/app/features/module7-angular/module7.routes.ts` defines 4 routes:
  `http-patterns`, `reactive-forms`, `lifecycle`, `state-store`.
- **Module 8**: `src/app/features/module8-mini-projects/module8.routes.ts` defines 6 routes:
  `search-autocomplete`, `live-dashboard`, `shopping-cart`, `http-manager`, `polling-system`, `multistep-form`.

### 1.4 Breadcrumbs and Sidenav Consumers
- **`src/app/core/layout/breadcrumbs.component.ts` (lines 49–67)**:
  Finds matching topic by checking `currentGroup.topics.find(t => t.path === topicPath)`. For Module 3 routes with 3 segments (`/module3/transformation/map`), line 60 evaluates `/${segments[0]}/${segments[1]}`, which matches the category hub rather than the individual operator.
- **`src/app/core/layout/sidenav.component.ts` (lines 10–58)**:
  Renders curriculum modules based on `searchService.navGroups()`.

### 1.5 Baseline Build
- `npx ng build --configuration development` executed synchronously and completed with 0 errors (application bundle generated in 28.7s).

---

## 2. Logic Chain

1. **Shortcomings of Current Inline Implementation**:
   - The search dialog is tightly coupled inside `TopbarComponent`. This prevents reuse, makes testing difficult, and clutters the topbar template and style files.
   - Extracting the dialog into a dedicated standalone `SearchPaletteComponent` in `src/app/core/components/search-palette/` achieves separation of concerns, complies with the project's standalone component architecture, and allows host-level mounting in `ShellComponent`.
2. **Lightweight Search Catalog Data Architecture**:
   - Module 3 operators contain large execution pipelines, SVG marble definitions, and quiz data. Directly importing `module3.data.ts` into a core service would force eager bundle inclusion of Module 3 data inside the main app bundle, defeating lazy loading.
   - Therefore, creating a lightweight, optimized search catalog data file `src/app/core/data/search-catalog.data.ts` provides all 113 searchable items with metadata (`id`, `title`, `category`, `route`, `description`, `tags`, `type`, `difficulty`, `moduleNumber`) without importing executable code or large objects.
   - This catalog directly feeds `SearchService.searchableItems`, expanding search coverage from 48 items to 113 items.
3. **Command Palette Enhancements**:
   - Keyboard triggers: `Ctrl+K`, `Cmd+K`, and `/` (when outside inputs).
   - Category filtering & grouping: Results grouped by Category/Module with badges.
   - Clear query button (`✕`) in the search input.
   - Query tokenization with weighted scoring (title match > keyword tag match > description match).
   - Auto-scroll active item into view (`scrollIntoView({ block: 'nearest' })`) as user presses `ArrowUp` or `ArrowDown`.
4. **Keyboard Navigation Architecture & Focus Guards**:
   - `KeyboardNavigationService` must provide sequential traversal (`j` or `ArrowRight` -> next topic, `k` or `ArrowLeft` -> previous topic).
   - A critical requirement is avoiding interference with playground inputs: any key event originating from an `HTMLInputElement`, `HTMLTextAreaElement`, `HTMLSelectElement`, `[contenteditable="true"]`, or `.code-editor`/`app-code-block` must be strictly ignored.
   - Keystroke `?` triggers a dedicated **Keyboard Shortcuts Cheatsheet Modal** (`ShortcutsDialogComponent`).
5. **Shell Integration**:
   - `ShellComponent` mounts `<app-search-palette />` and `<app-shortcuts-dialog />`.
   - `TopbarComponent` search trigger button delegates to `searchService.openSearch()`.
   - `KeyboardNavigationService` is injected at root/shell level and listens to global window keydown events.

---

## 3. Caveats

1. **Linear Curriculum Order vs Granular 113-Route Traversal**:
   - Navigating sequentially via `j`/`k` through all 65 individual operators in Module 3 is supported by providing the full 108/113 route sequence. However, learners may also want to jump between major curriculum topics. The recommended sequential route array includes all distinct playable routes in curriculum order (108 routes).
2. **Breadcrumb 3-Segment Resolution**:
   - Breadcrumbs currently match 2 segments (`/module/topic`). In Module 3, routes have 3 segments (`/module3/:category/:operatorId`). Updating `BreadcrumbsComponent` to check the expanded catalog for 3-segment paths will display the operator name in breadcrumbs.
3. **No External Libraries**:
   - In accordance with R1 constraints, all dialog animations, backdrop blur, focus trapping, and modal styling must use pure SCSS tokens and Angular zoneless signals without Angular Material or CDK overlay.

---

## 4. Conclusion & Architectural Specifications

### 4.1 Search Catalog Data Model (`src/app/core/models/index.ts`)

```typescript
export type SearchItemType = 
  | 'concept' 
  | 'creation' 
  | 'transformation' 
  | 'filtering' 
  | 'combination' 
  | 'utility' 
  | 'multicasting' 
  | 'higher-order' 
  | 'subject' 
  | 'scheduler' 
  | 'angular' 
  | 'project';

export interface SearchCatalogItem {
  id: string;
  title: string;
  category: string;
  moduleNumber: number;
  route: string;
  path: string; // alias for backward compatibility with SearchResult
  description: string;
  tags: string[];
  type: SearchItemType;
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
}
```

---

### 4.2 Complete Search Index Inventory (113 Items)

Below is the complete catalogue of all platform topics, lessons, operators, and mini-projects:

#### Module 1: Fundamentals (7 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `what-is-rxjs` | What is RxJS? | `/module1/what-is-rxjs` | Module 1: Fundamentals | Core reactive programming principles, push vs pull data architecture, stream pipelines | `['push', 'pull', 'reactive', 'streams', 'fundamentals', 'async', 'observer']` |
| `what-is-observable` | What is an Observable? | `/module1/what-is-observable` | Module 1: Fundamentals | Lazy blueprints for data delivery, subscriber execution function invocation | `['observable', 'lazy', 'execution', 'producer', 'function', 'blueprint']` |
| `observable-vs-promise` | Observable vs Promise | `/module1/observable-vs-promise` | Module 1: Fundamentals | Comparison: multiple emissions vs single value, lazy evaluation vs eager, cancellability | `['promise', 'vs', 'comparison', 'cancellation', 'eager', 'lazy', 'multivalue']` |
| `observer-subscriber` | Observer & Subscriber | `/module1/observer-subscriber` | Module 1: Fundamentals | Observer interface contract (next, error, complete), SafeSubscriber wrapping | `['observer', 'subscriber', 'next', 'error', 'complete', 'safesubscriber', 'contract']` |
| `subscription-lifecycle` | Subscription Lifecycle | `/module1/subscription-lifecycle` | Module 1: Fundamentals | Unsubscribing, teardown logic, subscription trees with sub.add(), memory leak prevention | `['subscription', 'unsubscribe', 'teardown', 'leak', 'add', 'closed']` |
| `cold-vs-hot` | Cold vs Hot Observables | `/module1/cold-vs-hot` | Module 1: Fundamentals | Unicast independent producers (cold) vs shared multicast producers (hot) | `['cold', 'hot', 'unicast', 'multicast', 'producer', 'timing', 'sharing']` |
| `multicasting` | Multicasting Fundamentals | `/module1/multicasting` | Module 1: Fundamentals | Sharing expensive background producer executions across multiple concurrent subscribers | `['multicast', 'share', 'connectable', 'subject', 'broadcast', 'fanout']` |

#### Module 2: Creation Operators (12 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `of` | of() | `/module2/of` | Module 2: Creation Operators | Synchronously emits specified arguments in sequence and completes immediately | `['of', 'creation', 'sync', 'static', 'arguments', 'sequence']` |
| `from` | from() | `/module2/from` | Module 2: Creation Operators | Converts an Array, Promise, Iterable, or Observable-like object into a stream | `['from', 'creation', 'array', 'promise', 'iterable', 'convert', 'async']` |
| `from-event` | fromEvent() | `/module2/from-event` | Module 2: Creation Operators | Creates an Observable from DOM events, Node EventEmitter, or jQuery events | `['fromEvent', 'dom', 'events', 'click', 'mousemove', 'listener', 'addeventlistener']` |
| `interval` | interval() | `/module2/interval` | Module 2: Creation Operators | Emits sequential numbers periodically at specified millisecond intervals | `['interval', 'timer', 'periodic', 'ticker', 'counter', 'heartbeat']` |
| `timer` | timer() | `/module2/timer` | Module 2: Creation Operators | Emits a single value after an initial delay, optionally emitting periodically thereafter | `['timer', 'delay', 'initial', 'periodic', 'timeout', 'schedule']` |
| `range` | range() | `/module2/range` | Module 2: Creation Operators | Synchronously emits a sequence of integers within a specified range | `['range', 'numbers', 'sequence', 'loop', 'integers', 'count']` |
| `throw-error` | throwError() | `/module2/throw-error` | Module 2: Creation Operators | Creates an Observable that immediately sends an error notification to the subscriber | `['throwError', 'error', 'exception', 'factory', 'fail', 'notification']` |
| `defer` | defer() | `/module2/defer` | Module 2: Creation Operators | Dynamically creates an Observable per subscriber at the time of subscription | `['defer', 'lazy', 'factory', 'dynamic', 'per-subscriber', 'evaluation']` |
| `empty` | EMPTY | `/module2/empty` | Module 2: Creation Operators | Emits no items and immediately issues a complete notification | `['empty', 'complete', 'noop', 'silent', 'instant']` |
| `never` | NEVER | `/module2/never` | Module 2: Creation Operators | Emits no items, never completes, and never throws an error | `['never', 'infinite', 'silent', 'pending', 'dormant']` |
| `generate` | generate() | `/module2/generate` | Module 2: Creation Operators | Declarative loop generator stream with initial state, condition, iteration, result selector | `['generate', 'loop', 'for-loop', 'state', 'iteration', 'declarative']` |
| `iif` | iif() | `/module2/iif` | Module 2: Creation Operators | Decides at subscription time which of two Observables to subscribe to based on condition | `['iif', 'conditional', 'if-else', 'branch', 'switch', 'ternary']` |

#### Module 3: Operator Catalog (65 Operators + 5 Category Hubs)

**Category Hubs (5 items)**:
- `m3-transformation` | Transformation Operators | `/module3/transformation` | Module 3: Operator Catalog | 18 Operators to map, buffer, window, and accumulate values across stream lifecycles | `['transformation', 'map', 'buffer', 'window', 'scan', 'operators']`
- `m3-filtering` | Filtering Operators | `/module3/filtering` | Module 3: Operator Catalog | 19 Operators to filter, rate-limit, debounce, sample, and deduplicate stream values | `['filtering', 'filter', 'take', 'debounce', 'throttle', 'operators']`
- `m3-combination` | Combination Operators | `/module3/combination` | Module 3: Operator Catalog | 11 Operators to combine, merge, concatenate, zip, and race multiple observable streams | `['combination', 'combineLatest', 'concat', 'merge', 'forkJoin', 'operators']`
- `m3-utility` | Utility Operators | `/module3/utility` | Module 3: Operator Catalog | 12 Operators to inspect with tap, delay, timeout, retry, repeat, and manage lifecycles | `['utility', 'tap', 'delay', 'retry', 'timeout', 'operators']`
- `m3-multicasting` | Multicasting Operators | `/module3/multicasting` | Module 3: Operator Catalog | 5 Operators to share executions, replay caches, and multicast to concurrent subscribers | `['multicasting', 'share', 'shareReplay', 'multicast', 'hot', 'operators']`

**Transformation (18 operators)**:
1. `map` | `map` | `/module3/transformation/map` | Transformation | Applies projection function to each emitted value synchronously | `['transform', 'project', 'math', 'convert', 'array']`
2. `mapTo` | `mapTo` | `/module3/transformation/mapTo` | Transformation | Emits a constant static value whenever source emits (deprecated) | `['constant', 'static', 'map', 'deprecated']`
3. `pluck` | `pluck` | `/module3/transformation/pluck` | Transformation | Selects nested properties from emitted objects (deprecated) | `['property', 'pluck', 'object', 'key', 'deprecated']`
4. `scan` | `scan` | `/module3/transformation/scan` | Transformation | Encapsulates running state, emitting accumulated intermediate values | `['accumulator', 'state', 'reduce', 'history', 'running']`
5. `reduce` | `reduce` | `/module3/transformation/reduce` | Transformation | Aggregates all values, emits only final total upon source completion | `['aggregate', 'sum', 'final', 'complete', 'fold']`
6. `toArray` | `toArray` | `/module3/transformation/toArray` | Transformation | Collects all emitted values into a single array emitted on completion | `['array', 'batch', 'collect', 'aggregate']`
7. `buffer` | `buffer` | `/module3/transformation/buffer` | Transformation | Collects values into array until closing notifier stream emits | `['buffer', 'batch', 'notifier', 'collect']`
8. `bufferCount` | `bufferCount` | `/module3/transformation/bufferCount` | Transformation | Buffers fixed count of values before emission | `['buffer', 'chunk', 'count', 'window', 'batch']`
9. `bufferTime` | `bufferTime` | `/module3/transformation/bufferTime` | Transformation | Buffers values during periodic time intervals | `['buffer', 'time', 'batch', 'interval', 'clock']`
10. `bufferToggle` | `bufferToggle` | `/module3/transformation/bufferToggle` | Transformation | Opens buffer on open stream, closes on closing stream | `['toggle', 'open', 'close', 'dynamic', 'buffer']`
11. `bufferWhen` | `bufferWhen` | `/module3/transformation/bufferWhen` | Transformation | Buffers values using dynamic factory notifier | `['dynamic', 'notifier', 'factory', 'buffer']`
12. `window` | `window` | `/module3/transformation/window` | Transformation | Branch source into nested Observable windows using closing notifier | `['window', 'nested', 'observable', 'branch']`
13. `windowCount` | `windowCount` | `/module3/transformation/windowCount` | Transformation | Branch source into nested Observable windows of size N | `['window', 'count', 'chunk', 'nested']`
14. `windowTime` | `windowTime` | `/module3/transformation/windowTime` | Transformation | Branch source into nested Observable windows by time span | `['window', 'time', 'nested', 'duration']`
15. `windowToggle` | `windowToggle` | `/module3/transformation/windowToggle` | Transformation | Branch source into nested Observable windows with open/close signals | `['window', 'toggle', 'open', 'close']`
16. `windowWhen` | `windowWhen` | `/module3/transformation/windowWhen` | Transformation | Branch source into nested Observable windows using closing factory | `['window', 'factory', 'dynamic']`
17. `pairwise` | `pairwise` | `/module3/transformation/pairwise` | Transformation | Groups consecutive emissions into [previous, current] tuples | `['pairwise', 'tuple', 'delta', 'previous', 'consecutive']`
18. `groupBy` | `groupBy` | `/module3/transformation/groupBy` | Transformation | Splits stream into GroupedObservables by key selector | `['groupBy', 'partition', 'keys', 'group', 'classify']`

**Filtering (19 operators)**:
19. `filter` | `filter` | `/module3/filtering/filter` | Filtering | Emits only values that satisfy a boolean predicate function | `['filter', 'predicate', 'condition', 'allow']`
20. `take` | `take` | `/module3/filtering/take` | Filtering | Emits first N values and then completes | `['take', 'first', 'limit', 'head', 'count']`
21. `takeLast` | `takeLast` | `/module3/filtering/takeLast` | Filtering | Emits last N values only after source completes | `['takeLast', 'tail', 'recent', 'final']`
22. `takeUntil` | `takeUntil` | `/module3/filtering/takeUntil` | Filtering | Emits values until notifier Observable emits | `['takeUntil', 'teardown', 'cancel', 'destroy', 'stop']`
23. `takeWhile` | `takeWhile` | `/module3/filtering/takeWhile` | Filtering | Emits values as long as predicate evaluates to true | `['takeWhile', 'predicate', 'condition', 'terminate']`
24. `skip` | `skip` | `/module3/filtering/skip` | Filtering | Skips the first N values emitted by source | `['skip', 'ignore', 'drop', 'offset']`
25. `skipLast` | `skipLast` | `/module3/filtering/skipLast` | Filtering | Skips the last N values emitted by source | `['skipLast', 'delay', 'trailing', 'drop']`
26. `skipUntil` | `skipUntil` | `/module3/filtering/skipUntil` | Filtering | Ignores values until notifier Observable emits | `['skipUntil', 'gate', 'wait', 'trigger']`
27. `skipWhile` | `skipWhile` | `/module3/filtering/skipWhile` | Filtering | Skips values as long as predicate evaluates to true | `['skipWhile', 'dropWhile', 'condition']`
28. `distinct` | `distinct` | `/module3/filtering/distinct` | Filtering | Filters duplicate values across entire stream history | `['distinct', 'unique', 'set', 'dedup']`
29. `distinctUntilChanged` | `distinctUntilChanged` | `/module3/filtering/distinctUntilChanged` | Filtering | Filters consecutive duplicate values | `['distinctUntilChanged', 'dedup', 'consecutive', 'change']`
30. `distinctUntilKeyChanged` | `distinctUntilKeyChanged` | `/module3/filtering/distinctUntilKeyChanged` | Filtering | Filters consecutive values with same object property | `['key', 'property', 'dedup', 'consecutive']`
31. `debounce` | `debounce` | `/module3/filtering/debounce` | Filtering | Delays emission, discarding intermediate values until duration stream completes | `['debounce', 'rate-limit', 'idle', 'dynamic']`
32. `debounceTime` | `debounceTime` | `/module3/filtering/debounceTime` | Filtering | Discards emissions until silence period of N ms passes | `['debounceTime', 'typeahead', 'rate-limit', 'delay', 'input']`
33. `throttle` | `throttle` | `/module3/filtering/throttle` | Filtering | Emits value then silences emissions for dynamic duration stream | `['throttle', 'rate-limit', 'sample', 'gate']`
34. `throttleTime` | `throttleTime` | `/module3/filtering/throttleTime` | Filtering | Emits value then silences subsequent emissions for N ms | `['throttleTime', 'rate-limit', 'scroll', 'burst']`
35. `audit` | `audit` | `/module3/filtering/audit` | Filtering | Ignores emissions for duration stream, then emits most recent value | `['audit', 'trailing', 'rate-limit', 'dynamic']`
36. `auditTime` | `auditTime` | `/module3/filtering/auditTime` | Filtering | Ignores emissions for N ms, then emits most recent value | `['auditTime', 'trailing', 'rate-limit', 'timer']`
37. `sample` | `sample` | `/module3/filtering/sample` | Filtering | Emits most recent value whenever sample notifier stream emits | `['sample', 'periodic', 'snapshot', 'probe']`

**Combination (11 operators)**:
38. `combineLatest` | `combineLatest` | `/module3/combination/combineLatest` | Combination | Combines latest values from multiple Observables whenever any emits | `['combineLatest', 'combine', 'latest', 'tuple', 'forms']`
39. `concat` | `concat` | `/module3/combination/concat` | Combination | Subscribes to next stream only after current stream completes in sequence | `['concat', 'sequential', 'queue', 'append']`
40. `merge` | `merge` | `/module3/combination/merge` | Combination | Concurrently interleaves multiple streams into a single composite stream | `['merge', 'concurrent', 'interleave', 'fan-in']`
41. `forkJoin` | `forkJoin` | `/module3/combination/forkJoin` | Combination | Awaits all input streams to complete, then emits tuple of their final values | `['forkJoin', 'parallel', 'complete', 'all', 'promise-all']`
42. `zip` | `zip` | `/module3/combination/zip` | Combination | Combines emissions with identical 1-to-1 index matching | `['zip', 'lockstep', 'pairs', 'index']`
43. `race` | `race` | `/module3/combination/race` | Combination | Subscribes to multiple streams; keeps the first to emit and cancels others | `['race', 'winner', 'fastest', 'first']`
44. `withLatestFrom` | `withLatestFrom` | `/module3/combination/withLatestFrom` | Combination | Combines source with latest values from secondary streams upon source emission | `['withLatestFrom', 'sample', 'combine', 'auxiliary']`
45. `startWith` | `startWith` | `/module3/combination/startWith` | Combination | Prepends initial default items to the beginning of the stream | `['startWith', 'initial', 'seed', 'prepend', 'default']`
46. `endWith` | `endWith` | `/module3/combination/endWith` | Combination | Appends trailing items right before completion | `['endWith', 'trailing', 'append', 'final']`
47. `concatAll` | `concatAll` | `/module3/combination/concatAll` | Combination | Flattens higher-order streams sequentially in FIFO order | `['concatAll', 'flatten', 'sequential', 'higher-order']`
48. `mergeAll` | `mergeAll` | `/module3/combination/mergeAll` | Combination | Flattens higher-order streams concurrently up to max concurrency | `['mergeAll', 'flatten', 'concurrent', 'higher-order']`

**Utility (12 operators)**:
49. `tap` | `tap` | `/module3/utility/tap` | Utility | Transparent side-effect inspector for debugging, logging, or notifications | `['tap', 'side-effect', 'debug', 'log', 'spy', 'inspect']`
50. `delay` | `delay` | `/module3/utility/delay` | Utility | Shifts all emissions forward in time by specified duration | `['delay', 'time', 'shift', 'latency', 'sleep']`
51. `delayWhen` | `delayWhen` | `/module3/utility/delayWhen` | Utility | Delays each emission according to a dynamic duration Observable | `['delayWhen', 'dynamic', 'latency', 'schedule']`
52. `timeout` | `timeout` | `/module3/utility/timeout` | Utility | Throws error if source does not emit within specified time threshold | `['timeout', 'deadline', 'watchdog', 'heartbeat']`
53. `timeInterval` | `timeInterval` | `/module3/utility/timeInterval` | Utility | Records elapsed time between consecutive emissions | `['timeInterval', 'elapsed', 'delta', 'benchmark']`
54. `timestamp` | `timestamp` | `/module3/utility/timestamp` | Utility | Attaches system epoch timestamp to each emitted value | `['timestamp', 'clock', 'telemetry', 'date']`
55. `finalize` | `finalize` | `/module3/utility/finalize` | Utility | Executes cleanup callback when stream completes, errors, or un-subscribes | `['finalize', 'cleanup', 'finally', 'teardown', 'loader']`
56. `repeat` | `repeat` | `/module3/utility/repeat` | Utility | Resubscribes to source upon successful completion up to N times | `['repeat', 'resubscribe', 'loop', 'cycle']`
57. `repeatWhen` | `repeatWhen` | `/module3/utility/repeatWhen` | Utility | Resubscribes to source when notifier stream emits upon completion | `['repeatWhen', 'dynamic', 'loop', 'resubscribe']`
58. `retry` | `retry` | `/module3/utility/retry` | Utility | Resubscribes to source on error with optional delay, count, resetOnSuccess | `['retry', 'error', 'backoff', 'resilience', 'recover']`
59. `retryWhen` | `retryWhen` | `/module3/utility/retryWhen` | Utility | Resubscribes to source on error according to notifier stream emissions | `['retryWhen', 'dynamic', 'error', 'backoff']`
60. `dematerialize` | `dematerialize` | `/module3/utility/dematerialize` | Utility | Converts stream of Notification objects back into real stream events | `['dematerialize', 'notification', 'meta', 'unwrap']`

**Multicasting (5 operators)**:
61. `share` | `share` | `/module3/multicasting/share` | Multicasting | Multicasts original Observable as long as there is >= 1 subscriber | `['share', 'multicast', 'hot', 'refCount', 'broadcast']`
62. `shareReplay` | `shareReplay` | `/module3/multicasting/shareReplay` | Multicasting | Multicasts stream and replays buffer of recent emissions to new subscribers | `['shareReplay', 'cache', 'replay', 'buffer', 'memoize', 'http']`
63. `multicast` | `multicast` | `/module3/multicasting/multicast` | Multicasting | Creates ConnectableObservable using specified Subject factory (deprecated) | `['multicast', 'connectable', 'connect', 'subject', 'deprecated']`
64. `publish` | `publish` | `/module3/multicasting/publish` | Multicasting | Wraps source into ConnectableObservable using standard Subject (deprecated) | `['publish', 'connectable', 'share', 'broadcast', 'deprecated']`
65. `refCount` | `refCount` | `/module3/multicasting/refCount` | Multicasting | Automates connection and disconnection based on active subscriber count (deprecated) | `['refCount', 'auto-connect', 'lifecycle', 'reference', 'deprecated']`

#### Module 4: Higher-Order Observables (5 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `hoo-overview` | HOO Overview & Lifecycle | `/module4/overview` | Module 4: Higher-Order | Higher-order stream flattening concepts and request lifecycle states | `['higher-order', 'hoo', 'lifecycle', 'flattening', 'inner', 'outer']` |
| `switchMap` | switchMap | `/module4/switch-map` | Module 4: Higher-Order | Cancels active inner stream upon new outer emission; switches to latest | `['switchMap', 'cancel', 'autocomplete', 'search', 'latest', 'switch']` |
| `mergeMap` | mergeMap | `/module4/merge-map` | Module 4: Higher-Order | Concurrent inner stream execution with interleaved emissions | `['mergeMap', 'flatMap', 'concurrent', 'parallel', 'fan-out']` |
| `concatMap` | concatMap | `/module4/concat-map` | Module 4: Higher-Order | Queues inner streams sequentially in FIFO order without cancellation | `['concatMap', 'queue', 'sequential', 'fifo', 'order', 'save']` |
| `exhaustMap` | exhaustMap | `/module4/exhaust-map` | Module 4: Higher-Order | Ignores outer emissions while current inner stream is pending | `['exhaustMap', 'ignore', 'login', 'submit', 'lock', 'throttle']` |

#### Module 5: Subjects Sandbox (4 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `subject-sandbox` | Subject Sandbox | `/module5/sandbox` | Module 5: Subjects | Dynamic multicasting sandbox with 3 observers and live emission controller | `['sandbox', 'subject', 'dynamic', 'observer', 'multicast', 'broadcast']` |
| `behavior-subject` | BehaviorSubject Deep Dive | `/module5/behavior-subject` | Module 5: Subjects | Holds current value, requires initial value, replays current value to new subscribers | `['behaviorSubject', 'state', 'current', 'initial', 'store', 'value']` |
| `replay-subject` | ReplaySubject Deep Dive | `/module5/replay-subject` | Module 5: Subjects | Replays buffer of historical values to new subscribers with buffer size and window | `['replaySubject', 'history', 'buffer', 'cache', 'window', 'replay']` |
| `async-subject` | AsyncSubject Deep Dive | `/module5/async-subject` | Module 5: Subjects | Emits only its final value upon completion to all subscribers | `['asyncSubject', 'final', 'complete', 'single', 'last']` |

#### Module 6: Schedulers Visualizer (5 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `schedulers-visualizer` | Event Loop Visualizer | `/module6/visualizer` | Module 6: Schedulers | Execution order visualizer across queue, asap, async, and animationFrame | `['schedulers', 'event-loop', 'microtask', 'macrotask', 'visualizer', 'execution']` |
| `queue-scheduler` | queueScheduler | `/module6/queue` | Module 6: Schedulers | Synchronous recursive trampoline execution preventing call stack overflow | `['queueScheduler', 'trampoline', 'sync', 'recursion', 'stack']` |
| `asap-scheduler` | asapScheduler | `/module6/asap` | Module 6: Schedulers | Microtask queue scheduling executed asynchronously before render | `['asapScheduler', 'microtask', 'promise', 'tick', 'fast']` |
| `async-scheduler` | asyncScheduler | `/module6/async` | Module 6: Schedulers | Macrotask scheduling via setTimeout / setInterval | `['asyncScheduler', 'macrotask', 'setTimeout', 'time', 'interval']` |
| `animation-frame-scheduler` | animationFrameScheduler | `/module6/animation-frame` | Module 6: Schedulers | Synchronized with browser window repaint cycle via requestAnimationFrame | `['animationFrameScheduler', 'requestAnimationFrame', 'animation', 'render', 'repaint', 'smooth']` |

#### Module 7: RxJS in Angular (4 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `http-patterns` | HTTP Patterns & Caching | `/module7/http-patterns` | Module 7: Angular | Express backend integration, shareReplay caching, exponential retry backoff | `['http', 'angular', 'shareReplay', 'cache', 'retry', 'backoff', 'express']` |
| `reactive-forms` | Reactive Forms | `/module7/reactive-forms` | Module 7: Angular | Debounced inputs, valueChanges auto-save, distinctUntilChanged | `['forms', 'reactive', 'valueChanges', 'debounceTime', 'distinctUntilChanged', 'auto-save']` |
| `lifecycle-teardown` | Lifecycle & takeUntilDestroyed | `/module7/lifecycle` | Module 7: Angular | Angular 20 DestroyRef teardown and memory leak avoidance simulator | `['lifecycle', 'destroyRef', 'takeUntilDestroyed', 'leak', 'cleanup', 'signals']` |
| `state-management` | BehaviorSubject State Store | `/module7/state-store` | Module 7: Angular | Reactive state store with action dispatching, selectors, toSignal bridging | `['state', 'store', 'behaviorSubject', 'toSignal', 'action', 'selector', 'signals']` |

#### Module 8: Real-World Mini-Projects (6 items)
| ID | Title | Route | Category | Description | Tags / Keywords |
|---|---|---|---|---|---|
| `search-autocomplete` | 1. Search Autocomplete | `/module8/search-autocomplete` | Module 8: Mini-Projects | Live Express /api/lessons search with debounceTime + distinctUntilChanged + switchMap | `['autocomplete', 'search', 'typeahead', 'lessons', 'switchMap', 'debounceTime']` |
| `live-dashboard` | 2. Live Dashboard | `/module8/live-dashboard` | Module 8: Mini-Projects | interval + combineLatest + scan streaming simulated system telemetry | `['dashboard', 'telemetry', 'combineLatest', 'scan', 'metrics', 'streaming']` |
| `shopping-cart` | 3. Shopping Cart | `/module8/shopping-cart` | Module 8: Mini-Projects | BehaviorSubject + scan + combineLatest dynamic cart with promo discounts | `['cart', 'shopping', 'ecommerce', 'behaviorSubject', 'scan', 'discounts']` |
| `http-request-manager` | 4. HTTP Request Manager | `/module8/http-manager` | Module 8: Mini-Projects | Direct benchmark comparing switchMap, mergeMap, concatMap, exhaustMap | `['http-manager', 'benchmark', 'comparison', 'flattening', 'requests', 'parallel']` |
| `polling-system` | 5. Polling System | `/module8/polling-system` | Module 8: Mini-Projects | timer + switchMap + takeUntil + retry with tab visibility suspension | `['polling', 'heartbeat', 'visibility', 'tab', 'retry', 'suspension']` |
| `multistep-form` | 6. Multi-Step Form Wizard | `/module8/multistep-form` | Module 8: Mini-Projects | valueChanges + combineLatest + debounceTime + exhaustMap registration wizard | `['wizard', 'multistep', 'form', 'exhaustMap', 'validation', 'registration']` |

**Total Inventory Summary**:
- Module 1: 7
- Module 2: 12
- Module 3: 65 operators + 5 category hubs = 70
- Module 4: 5
- Module 5: 4
- Module 6: 5
- Module 7: 4
- Module 8: 6
**Grand Total: 113 searchable items** (and 108 direct lesson/playground endpoints).

---

### 4.3 Command Palette Component (`SearchPaletteComponent`) Specification

**Target Location**: `src/app/core/components/search-palette/search-palette.component.ts|html|scss`

#### TypeScript Architecture:
```typescript
import {
  Component,
  inject,
  signal,
  computed,
  HostListener,
  ElementRef,
  viewChild,
  effect
} from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../services/search.service';
import { SearchCatalogItem } from '../../models';

@Component({
  selector: 'app-search-palette',
  standalone: true,
  templateUrl: './search-palette.component.html',
  styleUrl: './search-palette.component.scss'
})
export class SearchPaletteComponent {
  readonly searchService = inject(SearchService);
  private readonly router = inject(Router);

  readonly searchInputRef = viewChild<ElementRef<HTMLInputElement>>('searchInput');
  readonly selectedIndex = signal<number>(0);
  readonly selectedCategoryFilter = signal<string>('all');

  // Filtered results based on search query and category tab filter
  readonly filteredResults = computed<SearchCatalogItem[]>(() => {
    const raw = this.searchService.searchResults();
    const filter = this.selectedCategoryFilter();
    if (filter === 'all') return raw;
    return raw.filter(item => item.type === filter || item.category.toLowerCase().includes(filter));
  });

  // Grouped results for category headers in list
  readonly groupedResults = computed(() => {
    const items = this.filteredResults();
    const groups: { category: string; items: SearchCatalogItem[] }[] = [];
    const map = new Map<string, SearchCatalogItem[]>();

    for (const item of items) {
      if (!map.has(item.category)) {
        map.set(item.category, []);
      }
      map.get(item.category)!.push(item);
    }

    for (const [category, groupItems] of map.entries()) {
      groups.push({ category, items: groupItems });
    }
    return groups;
  });

  constructor() {
    // Auto-focus search input when palette opens
    effect(() => {
      if (this.searchService.isSearchOpen()) {
        this.selectedIndex.set(0);
        setTimeout(() => {
          this.searchInputRef()?.nativeElement?.focus();
        }, 50);
      }
    });
  }

  onInput(value: string): void {
    this.searchService.setQuery(value);
    this.selectedIndex.set(0);
  }

  clearQuery(): void {
    this.searchService.setQuery('');
    this.selectedIndex.set(0);
    this.searchInputRef()?.nativeElement?.focus();
  }

  setCategoryFilter(category: string): void {
    this.selectedCategoryFilter.set(category);
    this.selectedIndex.set(0);
  }

  close(): void {
    this.searchService.closeSearch();
  }

  selectItem(item: SearchCatalogItem): void {
    this.close();
    this.router.navigateByUrl(item.route);
  }

  handleKeyDown(event: KeyboardEvent): void {
    const items = this.filteredResults();
    if (event.key === 'Escape') {
      event.preventDefault();
      this.close();
      return;
    }

    if (items.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.selectedIndex.update(idx => (idx + 1) % items.length);
      this.scrollToActiveItem();
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.selectedIndex.update(idx => (idx - 1 + items.length) % items.length);
      this.scrollToActiveItem();
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const current = items[this.selectedIndex()];
      if (current) {
        this.selectItem(current);
      }
    }
  }

  private scrollToActiveItem(): void {
    setTimeout(() => {
      const activeEl = document.querySelector('.palette-item.selected');
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 10);
  }
}
```

#### HTML Template Blueprint (`search-palette.component.html`):
```html
@if (searchService.isSearchOpen()) {
  <div class="palette-backdrop" (click)="close()">
    <div class="palette-dialog" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-label="Global Command Palette">
      
      <!-- Search Input Bar -->
      <div class="palette-header">
        <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
        </svg>

        <input
          #searchInput
          class="palette-input"
          type="text"
          [value]="searchService.searchQuery()"
          (input)="onInput($any($event.target).value)"
          (keydown)="handleKeyDown($event)"
          placeholder="Search 113+ operators, lessons, recipes, or mini-projects... (e.g. switchMap, debounceTime, cache)"
          autocomplete="off"
          spellcheck="false"
        />

        @if (searchService.searchQuery().length > 0) {
          <button class="clear-btn" (click)="clearQuery()" type="button" aria-label="Clear search query">
            ✕
          </button>
        }

        <kbd class="esc-badge" (click)="close()">Esc</kbd>
      </div>

      <!-- Quick Filter Chips -->
      <div class="palette-filter-bar">
        <button [class.active]="selectedCategoryFilter() === 'all'" (click)="setCategoryFilter('all')">All ({{ searchService.searchResults().length }})</button>
        <button [class.active]="selectedCategoryFilter() === 'operator'" (click)="setCategoryFilter('operator')">Operators</button>
        <button [class.active]="selectedCategoryFilter() === 'concept'" (click)="setCategoryFilter('concept')">Concepts</button>
        <button [class.active]="selectedCategoryFilter() === 'angular'" (click)="setCategoryFilter('angular')">Angular</button>
        <button [class.active]="selectedCategoryFilter() === 'project'" (click)="setCategoryFilter('project')">Mini-Projects</button>
      </div>

      <!-- Palette Body -->
      <div class="palette-body">
        @if (filteredResults().length > 0) {
          <div class="results-container">
            <div class="results-count-banner">
              <span>{{ filteredResults().length }} result{{ filteredResults().length === 1 ? '' : 's' }} found</span>
            </div>

            <ul class="palette-list" role="listbox">
              @for (item of filteredResults(); track item.id; let i = $index) {
                <li
                  class="palette-item"
                  [class.selected]="i === selectedIndex()"
                  (click)="selectItem(item)"
                  (mouseenter)="selectedIndex.set(i)"
                  role="option"
                  [attr.aria-selected]="i === selectedIndex()"
                >
                  <div class="item-type-icon" [attr.data-type]="item.type">
                    @switch (item.type) {
                      @case ('creation') { ✨ }
                      @case ('transformation') { 🔄 }
                      @case ('filtering') { 🔍 }
                      @case ('combination') { 🔀 }
                      @case ('utility') { 🛠️ }
                      @case ('multicasting') { 📡 }
                      @case ('higher-order') { ⚡ }
                      @case ('subject') { 📦 }
                      @case ('scheduler') { ⏱️ }
                      @case ('angular') { 🅰️ }
                      @case ('project') { 🚀 }
                      @default { 💡 }
                    }
                  </div>

                  <div class="item-content">
                    <div class="item-headline">
                      <span class="item-title">{{ item.title }}</span>
                      <span class="item-category-badge">{{ item.category }}</span>
                      @if (item.difficulty) {
                        <span class="item-diff-badge" [class]="item.difficulty">{{ item.difficulty }}</span>
                      }
                    </div>
                    <p class="item-desc">{{ item.description }}</p>
                    @if (item.tags.length > 0) {
                      <div class="item-tags">
                        @for (tag of item.tags.slice(0, 4); track tag) {
                          <span class="item-tag">#{{ tag }}</span>
                        }
                      </div>
                    }
                  </div>

                  <span class="select-indicator">↵</span>
                </li>
              }
            </ul>
          </div>
        } @else if (searchService.searchQuery().trim().length > 0) {
          <div class="palette-empty-state">
            <div class="empty-icon">🔍</div>
            <h4>No matching topics or operators</h4>
            <p>No results found for "<strong>{{ searchService.searchQuery() }}</strong>"</p>
            <div class="empty-suggestions">
              <span>Try searching for:</span>
              <div class="suggestion-chips">
                <span class="chip" (click)="onInput('switchMap')">switchMap</span>
                <span class="chip" (click)="onInput('debounceTime')">debounceTime</span>
                <span class="chip" (click)="onInput('combineLatest')">combineLatest</span>
                <span class="chip" (click)="onInput('BehaviorSubject')">BehaviorSubject</span>
                <span class="chip" (click)="onInput('takeUntilDestroyed')">takeUntilDestroyed</span>
              </div>
            </div>
          </div>
        } @else {
          <!-- Empty Query Default State -->
          <div class="palette-default-state">
            <span class="section-label">Popular Searches & Quick Jumps</span>
            <div class="quick-jump-grid">
              <button class="quick-card" (click)="onInput('switchMap')">
                <span class="qc-icon">⚡</span>
                <span class="qc-title">switchMap</span>
                <span class="qc-desc">HOO timeline & cancellation</span>
              </button>
              <button class="quick-card" (click)="onInput('BehaviorSubject')">
                <span class="qc-icon">📦</span>
                <span class="qc-title">BehaviorSubject</span>
                <span class="qc-desc">Dynamic sandbox & state store</span>
              </button>
              <button class="quick-card" (click)="onInput('combineLatest')">
                <span class="qc-icon">🔀</span>
                <span class="qc-title">combineLatest</span>
                <span class="qc-desc">Multi-stream combination</span>
              </button>
              <button class="quick-card" (click)="onInput('takeUntilDestroyed')">
                <span class="qc-icon">🅰️</span>
                <span class="qc-title">takeUntilDestroyed</span>
                <span class="qc-desc">Angular 20 lifecycle teardown</span>
              </button>
              <button class="quick-card" (click)="onInput('Autocomplete')">
                <span class="qc-icon">🚀</span>
                <span class="qc-title">Autocomplete</span>
                <span class="qc-desc">Mini-project live backend search</span>
              </button>
            </div>
          </div>
        }
      </div>

      <!-- Footer Keyboard Hints -->
      <div class="palette-footer">
        <div class="footer-hint"><kbd>↑</kbd><kbd>↓</kbd> <span>Navigate</span></div>
        <div class="footer-hint"><kbd>↵</kbd> <span>Select</span></div>
        <div class="footer-hint"><kbd>Esc</kbd> <span>Close</span></div>
      </div>

    </div>
  </div>
}
```

#### SCSS Styling Architecture (`search-palette.component.scss`):
- Uses CSS variables from `src/styles/_tokens.scss`.
- Modal overlay with `background-color: var(--color-bg-overlay)` and `backdrop-filter: blur(8px)`.
- Container with `max-width: 640px`, `background-color: var(--color-bg-surface)`, `border: 1px solid var(--color-border-strong)`, `border-radius: var(--radius-xl)`, `box-shadow: var(--shadow-lg), var(--shadow-glow)`.
- Keyboard active highlight: `.palette-item.selected` styled with `background-color: var(--color-bg-surface-elevated)` and border left `2px solid var(--color-primary-500)`.
- Fluid entry animation: `@keyframes modalSlideDown { from { opacity: 0; transform: translateY(-16px); } to { opacity: 1; transform: translateY(0); } }`.

---

### 4.4 Keyboard Navigation Service (`KeyboardNavigationService`) Specification

**Target Location**: `src/app/core/services/keyboard-navigation.service.ts`

#### Key Capabilities:
1. **Ordered Linear Route Array**: Defines the exact sequential curriculum traversal path (Module 1 -> Module 2 -> Module 3 -> Module 4 -> Module 5 -> Module 6 -> Module 7 -> Module 8).
2. **Current Route Tracker**: Synchronizes with `Router.events` (`NavigationEnd`) to detect current active lesson index.
3. **Keystroke Handlers**:
   - `j` or `ArrowRight`: Navigate to next topic (`nextTopic()`).
   - `k` or `ArrowLeft`: Navigate to previous topic (`prevTopic()`).
   - `?`: Toggle keyboard shortcuts help modal (`toggleHelp()`).
   - `/` or `Ctrl+K` / `Cmd+K`: Open command palette (`searchService.openSearch()`).
   - `Esc`: Close open modal.
4. **Crucial Focus Guard**:
   ```typescript
   private isTypingTarget(target: EventTarget | null): boolean {
     if (!target || !(target instanceof HTMLElement)) return false;

     const tagName = target.tagName.toUpperCase();
     if (tagName === 'INPUT' || tagName === 'TEXTAREA' || tagName === 'SELECT') {
       return true;
     }

     if (target.isContentEditable) {
       return true;
     }

     if (
       target.closest('.monaco-editor') ||
       target.closest('.ace_editor') ||
       target.closest('app-code-block') ||
       target.closest('.code-editor') ||
       target.closest('[role="textbox"]') ||
       target.closest('.prevent-nav')
     ) {
       return true;
     }

     return false;
   }
   ```
5. **Shortcuts Cheatsheet Modal**:
   State managed via `readonly isHelpOpen = signal<boolean>(false)`. Rendered via `ShortcutsDialogComponent` or inline dialog in `ShellComponent`.

---

### 4.5 Shell Integration Architecture

1. **`src/app/core/layout/shell.component.ts`**:
   - Imports and declares `SearchPaletteComponent` and `ShortcutsDialogComponent`.
   - Injects `KeyboardNavigationService` so global keystroke listeners attach on app boot.
   - Updated template:
     ```html
     <div class="app-shell">
       <div class="app-topbar">
         <app-topbar (toggleSidenav)="toggleSidenav()" />
       </div>

       <div class="app-body">
         <div class="app-sidenav">
           <app-sidenav [isOpen]="isSidenavOpen()" (closeSidenav)="closeSidenav()" />
         </div>

         <main class="app-content">
           <app-breadcrumbs />
           <div class="app-viewport">
             <router-outlet />
           </div>
         </main>
       </div>

       <!-- Global Modals mounted at Shell root -->
       <app-search-palette />
       <app-shortcuts-dialog />
     </div>
     ```

2. **`src/app/core/layout/topbar.component.ts` & `topbar.component.html`**:
   - Remove inline search modal template (lines 58–131) and inline search styles (lines 181–354).
   - In `TopbarComponent`:
     - Keep search trigger button:
       ```html
       <button class="search-trigger-btn" (click)="searchService.openSearch()" type="button" aria-label="Open command palette">
         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
           <circle cx="11" cy="11" r="8"></circle>
           <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
         </svg>
         <span class="search-placeholder">Search operators, concepts...</span>
         <kbd class="search-shortcut">Ctrl K</kbd>
       </button>
       ```
     - Add shortcuts help button (`?`) to Topbar right section for quick access.

3. **`src/app/core/services/search.service.ts` Upgrades**:
   - Import `SEARCH_CATALOG` from `src/app/core/data/search-catalog.data.ts`.
   - Expose `readonly searchableItems = signal<SearchCatalogItem[]>(SEARCH_CATALOG)`.
   - Enhanced multi-field fuzzy token search matching query words across `title`, `category`, `description`, and `tags`.
   - Boost prefix match in title so exact operator names appear first.

---

## 5. Verification Method

### 5.1 Compilation Verification
Run the standard project build command:
```powershell
npx ng build --configuration development
```
**Expected Result**: Zero compilation errors, clean bundle generation.

### 5.2 Unit Test Verification
Run the unit test suite:
```powershell
npx ng test --watch=false --browsers=ChromeHeadless
```
Include automated test specs for:
1. **`SearchService`**:
   - `searchableItems().length` is 113.
   - Query for `'switchMap'` returns HOO switchMap first.
   - Query for `'cache'` returns `shareReplay` and `replaySubject` via tag matching.
   - Query for `'autocomplete'` returns Module 8 mini-project.
2. **`SearchPaletteComponent`**:
   - Opens when `searchService.openSearch()` is called.
   - Closes on `Escape` key.
   - Navigates index on `ArrowDown` and `ArrowUp`.
   - Navigates router on `Enter`.
   - Filters by category chip ('operator', 'concept', 'project', etc.).
3. **`KeyboardNavigationService`**:
   - Pressing `j` navigates to next curriculum route.
   - Pressing `k` navigates to previous curriculum route.
   - Typing `j` or `k` inside an `<input>` element does NOT trigger navigation.
   - Typing `j` or `k` inside a `<textarea>` or `[contenteditable]` does NOT trigger navigation.
   - Pressing `?` opens the shortcuts help modal.
   - Pressing `/` opens the search palette when focus is outside any text field.

### 5.3 Invalidation Conditions
- Any changes that break `searchService.navGroups()` will invalidate `SidenavComponent` and `BreadcrumbsComponent`. The data model maintains full backward compatibility.
- Bundling Module 3 data directly in Core will bloat initial bundle size; all 113 search catalog items must reside in the dedicated lightweight `search-catalog.data.ts`.
