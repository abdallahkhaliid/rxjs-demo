# Project: RxJS Learning Platform

## Architecture
A modern, standalone, zoneless Angular 20 educational web application built with clean architecture, hand-crafted SCSS design system, and Express 5.3 REST backend.

```
                              ┌──────────────────────────────────┐
                              │       Angular 20 Shell           │
                              │  (Topbar + Sidenav + Breadcrumb) │
                              └────────────────┬─────────────────┘
                                               │ Lazy Routing
                     ┌─────────────────────────┼─────────────────────────┐
                     ▼                         ▼                         ▼
         ┌───────────────────────┐ ┌───────────────────────┐ ┌───────────────────────┐
         │ Modules 1-3 (Curric.) │ │ Modules 4-6 (Visual.) │ │ Modules 7-8 (Ang+Proj)│
         │ - Fundamentals (7)    │ │ - Higher-Order (4)    │ │ - Angular Integration │
         │ - Creation Ops (12)   │ │ - Subjects Sandbox (4)│ │ - 6 Mini-Projects     │
         │ - Operator Cat. (65)  │ │ - Schedulers (4)      │ │                       │
         └───────────┬───────────┘ └───────────┬───────────┘ └───────────┬───────────┘
                     │                         │                         │
                     └─────────────────────────┼─────────────────────────┘
                                               ▼
                              ┌──────────────────────────────────┐
                              │   Shared Interactive Component   │
                              │ - code-block (highlight.js)      │
                              │ - output-console                 │
                              │ - svg marble-diagram             │
                              │ - operator-card                  │
                              │ - comparison-table               │
                              │ - playground-wrapper             │
                              │ - quiz-block                     │
                              └────────────────┬─────────────────┘
                                               │
                                               ▼
                              ┌──────────────────────────────────┐
                              │  Express 5 REST API Backend      │
                              │  - GET /api/courses/:id          │
                              │  - PUT /api/courses/:id          │
                              │  - GET /api/lessons?filter=...   │
                              │  - GET /api/slow?delay=2000      │
                              │  - GET /api/simulate-error?rate= │
                              └──────────────────────────────────┘
```

## Feature Inventory
Every feature from user requirements and the survey phase is assigned to a milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Highlight.js Installation | Install highlight.js package for syntax highlighting | M1 | R1 |
| 2 | Google Fonts CDN | Load Inter & JetBrains Mono fonts via CDN in index.html | M1 | R1 |
| 3 | Dark Theme SCSS Tokens | Token hierarchy in src/styles/_tokens.scss (colors, borders, spacing, typography) | M1 | R1 |
| 4 | Shell Layout | Responsive shell with sticky Topbar, collapsible Sidenav, and Breadcrumbs | M1 | R1 |
| 5 | CodeBlockComponent | Standalone syntax-highlighted code block with line numbers and copy button | M1 | R1 |
| 6 | OutputConsoleComponent | Standalone reactive stream logging console with colored tags, pause, clear | M1 | R1 |
| 7 | MarbleDiagramComponent | Standalone SVG marble diagram animation with scrubber, completion, error ticks | M1 | R1 |
| 8 | OperatorCardComponent | Standalone metadata card with signature, use cases, category badge, pitfalls | M1 | R1 |
| 9 | ComparisonTableComponent | Standalone comparative matrix for operators and concepts | M1 | R1 |
| 10 | PlaygroundWrapperComponent | Standalone harness with Concept, Code, Visual Demo, Comparison, Quiz tabs | M1 | R1 |
| 11 | QuizBlockComponent | Standalone interactive quiz with instant feedback, explanations, score | M1 | R1 |
| 12 | Express API: /api/slow | GET /api/slow with configurable delay parameter (0-15s) | M1 | R2 |
| 13 | Express API: /api/simulate-error | GET /api/simulate-error with configurable failure rate parameter (0.0-1.0) | M1 | R2 |
| 14 | Express API: Lessons search patch | Make courseId optional in /api/lessons search filter | M1 | R2 |
| 15 | Angular HTTP Client Setup | Configure provideHttpClient(withFetch()) in app.config.ts | M1 | R1, R4 |
| 16 | Module 1: what-is-rxjs | Concept, code, push vs pull timeline demo, comparison, quiz | M2 | R3 |
| 17 | Module 1: what-is-observable | Blueprint execution, lazy evaluation demo, comparison, quiz | M2 | R3 |
| 18 | Module 1: observable-vs-promise | Side-by-side cancellation and multi-value demo, comparison, quiz | M2 | R3 |
| 19 | Module 1: observer-subscriber | Observer interface, subscriber contract enforcement demo, quiz | M2 | R3 |
| 20 | Module 1: subscription-lifecycle | Teardown tree visualizer, sub.add() leak demo, quiz | M2 | R3 |
| 21 | Module 1: cold-vs-hot | Unicast vs multicast subscription timing demo, quiz | M2 | R3 |
| 22 | Module 1: multicasting | Sharing expensive producer execution demo, quiz | M2 | R3 |
| 23 | Module 2: of() & from() | Synchronous array, promise, iterable emission demos | M2 | R3 |
| 24 | Module 2: fromEvent() | DOM event stream capture with interactive coordinates | M2 | R3 |
| 25 | Module 2: interval() & timer() | Configurable period and delay periodic pulse demos | M2 | R3 |
| 26 | Module 2: range() | Sequential range emission demo | M2 | R3 |
| 27 | Module 2: throwError() | Error factory and stack trace error marble demo | M2 | R3 |
| 28 | Module 2: defer() | Per-subscriber dynamic factory evaluation demo | M2 | R3 |
| 29 | Module 2: EMPTY & NEVER | Instant completion vs infinite stream demos | M2 | R3 |
| 30 | Module 2: generate() & iif() | Declarative loop and conditional stream switching demos | M2 | R3 |
| 31 | Module 3: Transformation (18 ops) | map, mapTo, pluck, scan, reduce, toArray, buffer, bufferCount, bufferTime, bufferToggle, bufferWhen, window, windowCount, windowTime, windowToggle, windowWhen, pairwise, groupBy | M3 | R3 |
| 32 | Module 3: Filtering (19 ops) | filter, take, takeLast, takeUntil, takeWhile, skip, skipLast, skipUntil, skipWhile, distinct, distinctUntilChanged, distinctUntilKeyChanged, debounce, debounceTime, throttle, throttleTime, audit, auditTime, sample | M3 | R3 |
| 33 | Module 3: Combination (11 ops) | combineLatest, concat, merge, forkJoin, zip, race, withLatestFrom, startWith, endWith, concatAll, mergeAll | M3 | R3 |
| 34 | Module 3: Utility (12 ops) | tap, delay, delayWhen, timeout, timeInterval, timestamp, finalize, repeat, repeatWhen, retry, retryWhen, dematerialize | M3 | R3 |
| 35 | Module 3: Multicasting (5 ops) | share, shareReplay, multicast, publish, refCount | M3 | R3 |
| 36 | Module 4: HOO Interactive Timeline | switchMap, mergeMap, concatMap, exhaustMap timeline with 4 request lifecycle states: cancelled, queued, ignored, completed | M4 | R3 |
| 37 | Module 5: Dynamic Subject Sandbox | 3 independent observers with subscribe/unsubscribe, live emission controller, and side-by-side comparison of Subject, BehaviorSubject, ReplaySubject, AsyncSubject | M4 | R3 |
| 38 | Module 6: Schedulers Visualizer | Event loop execution order visualizer for queueScheduler, asapScheduler, asyncScheduler, animationFrameScheduler | M4 | R3 |
| 39 | Module 7: Angular HTTP Patterns | Express backend integration, shareReplay caching, exponential backoff retry | M5 | R4 |
| 40 | Module 7: Reactive Forms | Debounced input, valueChanges auto-save, distinctUntilChanged | M5 | R4 |
| 41 | Module 7: Lifecycle with takeUntilDestroyed | Angular 20 DestroyRef teardown and memory leak avoidance simulator | M5 | R4 |
| 42 | Module 7: BehaviorSubject State Store | Reactive store with action dispatching, selectors, and signal bridging via toSignal | M5 | R4 |
| 43 | Module 8: Search Autocomplete | Lesson search hitting GET /api/lessons?filter=... with debounceTime + distinctUntilChanged + switchMap | M5 | R4 |
| 44 | Module 8: Live Dashboard | interval + combineLatest + scan streaming simulated system telemetry | M5 | R4 |
| 45 | Module 8: Shopping Cart | BehaviorSubject + scan + combineLatest dynamic cart with promo discounts | M5 | R4 |
| 46 | Module 8: HTTP Request Manager | Direct benchmark comparing all 4 flattening operators on same Express scenario | M5 | R4 |
| 47 | Module 8: Polling System | timer + switchMap + takeUntil + retry with tab visibility suspension | M5 | R4 |
| 48 | Module 8: Multi-Step Form Wizard | valueChanges + combineLatest + debounceTime + exhaustMap registration wizard | M5 | R4 |
| 49 | R5: Progress Tracking | LocalStorage progress store, module completion badges, topbar progress widget | M6 | R5 |
| 50 | R5: Global Search & Command Palette | Ctrl+K / '/' modal search indexing all topics, operators, and mini-projects | M6 | R5 |
| 51 | R5: Keyboard Navigation | j/k topic navigation, arrow navigation, escape shortcuts | M6 | R5 |
| 52 | R5: Full E2E Test Acceptance | 100% pass across all E2E test tiers (Tiers 1-4) and adversarial hardening | M6 | R5 |

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Shell, Design System & Express APIs | Highlight.js, SCSS tokens, 7 shared standalone components, Shell layout, Express API extensions (/api/slow, /api/simulate-error, lessons fix), HttpClient provider | none | DONE |
| M2 | Fundamentals & Creation Operators | Module 1 (7 fundamentals topics) and Module 2 (12 creation operators) with interactive playgrounds, SVG marble diagrams, and quizzes | M1 | DONE |
| M3 | Operator Catalog (65 Operators) | Module 3: 18 Transformation, 19 Filtering, 11 Combination, 12 Utility, 5 Multicasting operators with operator cards, interactive demos, and quizzes | M1 | DONE |
| M4 | Higher-Order, Subjects & Schedulers | Module 4 (animated HOO timeline: cancelled, queued, ignored, completed), Module 5 (dynamic Subject sandbox with 3 observers), Module 6 (Schedulers event loop visualizer) | M1 | DONE |
| M5 | Angular Integration & 6 Mini-Projects | Module 7 (HTTP patterns, Reactive Forms, takeUntilDestroyed, BehaviorSubject store) and Module 8 (Search Autocomplete, Live Dashboard, Shopping Cart, HTTP Request Manager, Polling System, Multi-Step Form) | M1 | DONE |
| M6 | Polish, Navigation & E2E Pass | Progress tracking, global search (Ctrl+K), keyboard navigation, 100% E2E test suite pass across all tiers, adversarial coverage hardening | M2, M3, M4, M5 | DONE |

## Interface Contracts

### 1. Code Block Component (`app-code-block`)
- Selector: `app-code-block`
- Inputs:
  - `code: input.required<string>()`
  - `language: input<string>('typescript')`
  - `title: input<string>('')`
  - `showLineNumbers: input<boolean>(true)`
  - `highlightLines: input<number[]>([])`

### 2. Output Console Component (`app-output-console`)
- Selector: `app-output-console`
- Inputs:
  - `title: input<string>('Live Stream Output')`
  - `entries: input<ConsoleEntry[]>([])`
  - `isStreaming: input<boolean>(false)`
  - `maxEntries: input<number>(200)`
- Outputs:
  - `clear: output<void>()`
  - `pause: output<boolean>()`
  - `replay: output<void>()`
- Data Model:
  ```typescript
  export type ConsoleEntryType = 'next' | 'error' | 'complete' | 'subscribe' | 'unsubscribe' | 'info';
  export interface ConsoleEntry {
    id: string;
    timestamp: number;
    relativeMs: number;
    type: ConsoleEntryType;
    streamName?: string;
    value?: any;
    description?: string;
  }
  ```

### 3. Marble Diagram Component (`app-marble-diagram`)
- Selector: `app-marble-diagram`
- Inputs:
  - `inputStreams: input.required<MarbleStream[]>()`
  - `operatorName: input<string>('')`
  - `outputStream: input<MarbleStream | null>(null)`
  - `durationMs: input<number>(5000)`
  - `isPlaying: input<boolean>(false)`
- Data Model:
  ```typescript
  export interface MarbleEmission {
    id: string;
    timeMs: number;
    value: any;
    displayLabel: string;
    color?: string;
  }
  export interface MarbleStream {
    id: string;
    label: string;
    color?: string;
    emissions: MarbleEmission[];
    completedAtMs?: number;
    errorAtMs?: number;
  }
  ```

### 4. Operator Card Component (`app-operator-card`)
- Selector: `app-operator-card`
- Inputs:
  - `operator: input.required<OperatorMetadata>()`
  - `showPlaygroundLink: input<boolean>(true)`

### 5. Comparison Table Component (`app-comparison-table`)
- Selector: `app-comparison-table`
- Inputs:
  - `data: input.required<ComparisonData>()`
  - `highlightColumnId: input<string | null>(null)`

### 6. Playground Wrapper Component (`app-playground-wrapper`)
- Selector: `app-playground-wrapper`
- Inputs:
  - `title: input.required<string>()`
  - `subtitle: input<string>('')`
  - `category: input<string>('')`
  - `difficulty: input<'beginner' | 'intermediate' | 'advanced'>('beginner')`
  - `topicId: input<string>('')`
  - `availableTabs: input<PlaygroundTab[]>(['concept', 'code', 'visual', 'comparison', 'quiz'])`
  - `activeTab: model<PlaygroundTab>('concept')`
- Projection Slots: `[slot=concept]`, `[slot=code]`, `[slot=visual]`, `[slot=comparison]`, `[slot=quiz]`

### 7. Quiz Block Component (`app-quiz-block`)
- Selector: `app-quiz-block`
- Inputs:
  - `questions: input.required<QuizQuestion[]>()`
  - `topicId: input<string>('')`
- Outputs:
  - `completed: output<QuizScore>()`

### 8. Express Backend Extension Contracts
- `GET /api/slow?delay=2000&tag=test`:
  - Response 200: `{ status: 'success', delay: number, tag: string, elapsedMs: number, data: { message: string, serverTime: string } }`
- `GET /api/simulate-error?rate=0.3&statusCode=500&attempt=1`:
  - Response 200: `{ status: 'success', rate: number, randomRoll: number, attempt: number, message: string, data: any }`
  - Response 500: `{ status: 'error', statusCode: number, rate: number, randomRoll: number, attempt: number, code: 'SIMULATED_TRANSIENT_ERROR', message: string }`
- `GET /api/lessons?filter=...`:
  - When `courseId` is omitted, searches across all lessons where `description` includes filter.

## Code Layout
```
src/
├── app/
│   ├── core/
│   │   ├── layout/
│   │   │   ├── shell.component.ts|html|scss
│   │   │   ├── topbar.component.ts|html|scss
│   │   │   ├── sidenav.component.ts|html|scss
│   │   │   └── breadcrumbs.component.ts|html|scss
│   │   ├── services/
│   │   │   ├── progress.service.ts
│   │   │   ├── search.service.ts
│   │   │   └── lessons.service.ts
│   │   └── models/
│   ├── shared/
│   │   └── components/
│   │       ├── code-block/
│   │       ├── output-console/
│   │       ├── marble-diagram/
│   │       ├── operator-card/
│   │       ├── comparison-table/
│   │       ├── playground-wrapper/
│   │       └── quiz-block/
│   ├── features/
│   │   ├── module1-fundamentals/
│   │   ├── module2-creation/
│   │   ├── module3-operators/
│   │   ├── module4-higher-order/
│   │   ├── module5-subjects/
│   │   ├── module6-schedulers/
│   │   ├── module7-angular/
│   │   └── module8-mini-projects/
│   ├── app.config.ts
│   ├── app.routes.ts
│   └── app.ts
├── styles/
│   ├── _tokens.scss
│   ├── _reset.scss
│   ├── _typography.scss
│   ├── _components.scss
│   ├── _highlight-theme.scss
│   └── styles.scss
server/
├── server.ts
├── db-data.ts
├── get-course.route.ts
├── save-course-route.ts
├── search-lessons.route.ts
├── slow.route.ts
└── simulate-error.route.ts
```
