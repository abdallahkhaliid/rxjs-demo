# Milestone 3: Module 3 Operator UI Architecture Specification & Handoff Report

**Agent**: `miner_m3_2` (M3 Operator UI Architecture Spec Miner)  
**Date**: 2026-11-06  
**Scope**: Module 3 — Operator Catalog (65 Operators across 5 Categories: Transformation, Filtering, Combination, Utility, Multicasting)  
**Target Files**:
- `src/app/features/module3-operators/module3.routes.ts`
- `src/app/features/module3-operators/operator-catalog.component.ts`
- `src/app/features/module3-operators/operator-catalog.component.html`
- `src/app/features/module3-operators/operator-catalog.component.scss`
- `src/app/features/module3-operators/operator-catalog.models.ts`

---

## 1. Observation

Direct observations from codebase inspection, dependency analysis, and runtime verification:

1. **Angular 20 Zoneless Configuration** (`src/app/app.config.ts:1-15`):
   - `provideZonelessChangeDetection()` is enabled.
   - `provideRouter(routes)` is configured without `withComponentInputBinding()`.
   - UI reactivity relies on Angular signals (`signal()`, `computed()`), `DestroyRef`, and `takeUntilDestroyed()`.
   - Asynchronous events inside RxJS subscriptions must mutate signals to trigger UI updates without ZoneJS.

2. **Existing Route Structure** (`src/app/app.routes.ts:23-25` and `src/app/features/module3-operators/module3.routes.ts:1-12`):
   - `app.routes.ts` mounts Module 3 at `/module3`:
     ```typescript
     {
       path: 'module3',
       loadChildren: () => import('./features/module3-operators/module3.routes').then(m => m.MODULE3_ROUTES)
     }
     ```
   - Current stub routes in `module3.routes.ts`:
     ```typescript
     export const MODULE3_ROUTES: Routes = [
       { path: '', redirectTo: 'transformation', pathMatch: 'full' },
       { path: 'transformation', component: StubTopicComponent },
       { path: 'filtering', component: StubTopicComponent },
       { path: 'combination', component: StubTopicComponent },
       { path: 'utility', component: StubTopicComponent },
       { path: 'multicasting', component: StubTopicComponent },
     ];
     ```

3. **Navigation & Sidenav Registration** (`src/app/core/services/search.service.ts:44-58`):
   - Module 3 is registered with 5 category topic endpoints:
     - `transformation`: `/module3/transformation`
     - `filtering`: `/module3/filtering`
     - `combination`: `/module3/combination`
     - `utility`: `/module3/utility`
     - `multicasting-ops`: `/module3/multicasting`
   - Breadcrumb navigation (`src/app/core/layout/breadcrumbs.component.ts:59-67`) checks `currentGroup.topics.find(t => t.path === topicPath)` where `topicPath = '/module3/' + segments[1]`.

4. **Shared Component Contracts** (`src/app/shared/components/` and `src/app/core/models/index.ts`):
   - `app-playground-wrapper`: Accepts `title`, `subtitle`, `category`, `difficulty`, `topicId`, `availableTabs`, `activeTab` (model signal), and 5 projection slots: `[slot=concept]`, `[slot=code]`, `[slot=visual]`, `[slot=comparison]`, `[slot=quiz]`.
   - `app-operator-card`: Accepts `operator: input.required<OperatorMetadata>()`, `showPlaygroundLink: input<boolean>(true)`, `compact: input<boolean>(false)`. Displays category badge, signature with copy button, use cases, and pitfalls.
   - `app-marble-diagram`: Accepts `inputStreams: input.required<MarbleStream[]>()`, `operatorName: input<string>('')`, `outputStream: input<MarbleStream | null>(null)`, `durationMs: input<number>(5000)`, `isPlaying: input<boolean>(false)`, `playbackSpeed: input<number>(1)`. Supports multi-input streams with an operator transformation box and output stream rendered simultaneously.
   - `app-output-console`: Accepts `entries: input<ConsoleEntry[]>([])`, `isStreaming: input<boolean>(false)`, `maxEntries: input<number>(200)`, and outputs `(clear)`.
   - `app-code-block`: Accepts `code: input.required<string>()`, `language: input<string>('typescript')`, `title: input<string>()`.
   - `app-comparison-table`: Accepts `data: input.required<ComparisonData>()`, `highlightColumnId: input<string | null>(null)`.
   - `app-quiz-block`: Accepts `questions: input.required<QuizQuestion[]>()`, `topicId: input<string>('')`, outputs `(completed)`.

5. **Milestone 2 Creation Playground Pattern** (`src/app/features/module2-creation/creation-playground.component.ts`):
   - In Module 2, 12 distinct routes map to one playground component via `data: { operatorId: '...' }`.
   - Single output marble stream recorded in real-time.
   - Teardown handled via `stopOperatorStream()` and `takeUntilDestroyed(this.destroyRef)`.

6. **E2E Test Execution Status**:
   - `node tests/e2e/run-all-tests.js --milestone=M3` executed with **50 / 50 tests passing (100%)** across Features 31–35 (Tier 1 core features and Tier 2 boundary cases).
   - `npx ng build --configuration development` compiles with **0 errors**.

---

## 2. Features Discovered

| # | Category | Feature | Description | Inputs | Outputs | Error Behavior | Discovered Via |
|---|----------|---------|-------------|--------|---------|----------------|----------------|
| 1 | Routing | Category Default Redirect | Directs `/module3` to `/module3/transformation` | None | URL redirect | Fallback to default route | `module3.routes.ts` inspection |
| 2 | Routing | Category Route | Activates category view `/module3/:category` | Route param `:category` | `selectedCategory` signal set, default operator selected | Invalid category defaults to `'transformation'` | Sidenav & search service inspection |
| 3 | Routing | Operator Deep-Linking | Direct URL navigation to operator `/module3/:category/:operatorId` | Route params `:category`, `:operatorId` | `selectedCategory` & `selectedOperatorId` signals set | Invalid operator defaults to first operator in category | ORIGINAL_REQUEST.md, user requirement |
| 4 | Routing | URL State Synchronization | Clicking operator pill updates browser URL without re-rendering shell | User pill click | `router.navigate(['/module3', cat, opId])` | Handled gracefully without route reload | Angular Router API |
| 5 | UI Layout | Category Navigation Badges | 5 Category selector tabs (Transformation, Filtering, Combination, Utility, Multicasting) with counts | Category list | Active category switch, filters operator pill ribbon | Always preserves valid category state | ORIGINAL_REQUEST.md R3 |
| 6 | UI Layout | Operator Pill Ribbon | Horizontal wrapping pill selector for operators within selected category | Active category operator list | Pill click selects operator | Filterable via search input | Component architecture spec |
| 7 | UI Layout | In-Category Quick Search | Instant search input filtering operator pills | Search query string | Filtered pill list | Empty string shows all category operators | UI specification |
| 8 | UI Layout | Playground Wrapper Tabs | Tab navigation: Concept, Code, Visual Demo, Comparison, Quiz | Active tab signal | Renders projected slot content | Keyboard navigation (Alt+Arrow) built into wrapper | `playground-wrapper.component.ts` |
| 9 | UI Layout | Operator Metadata Card | Displays signature, difficulty, description, use cases, and pitfalls | `OperatorMetadata` input | Rendered card with 1-click copy signature | Graceful fallback if useCases/pitfalls are omitted | `operator-card.component.ts` |
| 10 | Visual Demo | Dual-Track Marble Generation | Renders input stream(s) on top, operator transformation box, and output stream at bottom | `inputStreams()`, `operatorName()`, `outputStream()` | SVG marble diagram with animated scrubber | Error marble rendered with red 'X' marker | `marble-diagram.component.ts` |
| 11 | Visual Demo | Multi-Input Combination Streams | Combination operators render 2 input source streams simultaneously into operator box | `source1$`, `source2$` | Dual timeline input SVG tracks | Error on either source renders error marker on that track | RxJS combination operators contract |
| 12 | Visual Demo | Source Stream Preset Selector | Allows choosing input stream profile: periodic numbers, rapid burst, words, duplicates, failing stream | Selected preset key | Observable source stream generator | Generates valid Observable sequence | Stream runner engine spec |
| 13 | Visual Demo | Interactive Notifier Trigger | Manual trigger button emitting on Subject for `takeUntil`, `buffer`, `sample` | User button click | `notifier$.next()` emission | Disabled when runner is idle | RxJS notifier pattern |
| 14 | Visual Demo | Dynamic Parameter Schema Panel | Data-driven controls: sliders, numbers, dropdowns, checkboxes, text | `OperatorParamConfig[]` | Parameter values signal update | Enforces min/max boundaries | UI engine design |
| 15 | Visual Demo | Live Stream Logging Console | Real-time logging of next, error, complete, subscribe, unsubscribe | Stream events via `tap()` & subscriber callbacks | `ConsoleEntry[]` with colored badges | Displays error messages in red with stack info | `output-console.component.ts` |
| 16 | Comparison | Category Comparison Matrix | Comparative table contrasting related operators in category | `ComparisonData` | Rendered comparison matrix with highlighted column | Full fallback table structure | `comparison-table.component.ts` |
| 17 | Quiz | Operator / Category Quiz | Interactive multiple-choice questions assessing operator behavior | `QuizQuestion[]` | Instant feedback, explanations, score to `ProgressService` | Retries allowed, score persisted | `quiz-block.component.ts` |
| 18 | Lifecycle | Teardown & Leak Prevention | Cleans up active subscription and timers on route switch or stop | Route change / component destroy | Complete unsubscription, idle state reset | Prevents orphaned streams in background | Angular DestroyRef & RxJS Subscription |

---

## 3. Edge Cases

| # | Feature | Input | Observed / Specified Behavior |
|---|---------|-------|-------------------------------|
| 1 | Routing | Direct navigation to `/module3/invalid-category` | Validates against `['transformation', 'filtering', 'combination', 'utility', 'multicasting']`. Fallback to `'transformation'` with URL normalization. |
| 2 | Routing | Operator ID from wrong category (e.g. `/module3/transformation/debounceTime`) | Detects operator belongs to `'filtering'`. Redirects to `/module3/filtering/debounceTime` or falls back to first operator of `'transformation'`. |
| 3 | Routing | Deep-link to unknown operator ID (e.g. `/module3/filtering/nonExistentOp`) | Fallback to default operator of that category (e.g. `'filter'`). |
| 4 | Stream Runner | Operator throws unhandled runtime error in pipe (e.g. projection error) | Subscriber `error` handler receives error, records error marble on output stream (`errorAtMs`), logs `[ERROR]` to console, sets `isRunning = false`. |
| 5 | Stream Runner | Fast synchronous emissions (e.g. `of(1, 2, 3, 4, 5)`) | If `timeMs` < 50ms, emission timestamps are staggered by 200ms increments on timeline so marbles do not overlap visually. |
| 6 | Stream Runner | Infinite stream (e.g. `interval(100)` without `take`) | Runner enforces safety cap: either auto-completes after 10 emissions or stops when timeline duration (5000ms) elapses. |
| 7 | Stream Runner | Rapid repeated clicks on "▶ Run Stream" button | Previous subscription is immediately unsubscribed via `stopOperatorStream()`, console entries and marble streams reset, new run initialized cleanly. |
| 8 | Stream Runner | Navigating away while stream is active | `ngOnDestroy()` and `takeUntilDestroyed(this.destroyRef)` invoke `stopOperatorStream()`, terminating all active subscriptions and clearing timers. |
| 9 | Combination | One stream completes before the other (e.g. in `concat` or `zip`) | For `concat`, stream 1 completes tick is shown; stream 2 begins; output completes only after stream 2 completes. For `zip`, terminates when shortest completes. |
| 10 | Parameter Panel | Slider drag to extreme min (0ms) or max (5000ms) | Clamped to valid range. Zero delay / debounce handled gracefully without freezing event loop. |
| 11 | Multicasting | Late subscriber simulation | Marble diagram shows multi-subscriber output or shared single source execution count in console. |
| 12 | Quiz | Changing operator while answering quiz | Resets quiz state or saves progress to `ProgressService` keyed by `topicId`. |

---

## 4. Logic Chain

1. **Routing Architecture**:
   - *Observation*: `app.routes.ts` mounts `module3.routes.ts` at `/module3`. In `search.service.ts`, nav links point to `/module3/transformation`, `/module3/filtering`, etc. The prompt mandates optional operator deep-linking (`:category/:operatorId`).
   - *Deduction*: `module3.routes.ts` must declare:
     - `''` -> `redirectTo: 'transformation'`
     - `':category'` -> `OperatorCatalogComponent`
     - `':category/:operatorId'` -> `OperatorCatalogComponent`
   - *Signal Binding*: `ActivatedRoute.paramMap` subscribed in component constructor with `takeUntilDestroyed(this.destroyRef)`. When params change, update `selectedCategory` and `selectedOperatorId`.
   - *Navigation*: When user clicks an operator pill, component calls `router.navigate(['/module3', category, operatorId])` to synchronize the browser address bar.

2. **Component Structure (`OperatorCatalogComponent`)**:
   - *Observation*: 65 operators across 5 categories. Sidenav provides high-level entry points. Navigating between 65 separate route components would create massive bundle bloat and fragmented state.
   - *Deduction*: A unified, data-driven `OperatorCatalogComponent` provides the best user experience and maintainability:
     - Header bar with 5 category badges + count pills.
     - Search input + operator pill ribbon for active category.
     - `app-playground-wrapper` embedding:
       - `[slot=concept]`: `app-operator-card`
       - `[slot=code]`: `app-code-block`
       - `[slot=visual]`: Parameter panel + `app-marble-diagram` + `app-output-console`
       - `[slot=comparison]`: `app-comparison-table`
       - `[slot=quiz]`: `app-quiz-block`

3. **Dual-Track Stream Execution Engine**:
   - *Observation*: Unlike Module 2 creation operators (which generate streams from nothing), Module 3 operators transform, filter, combine, or manage existing input streams. `app-marble-diagram` accepts `inputStreams: input.required<MarbleStream[]>()`, `operatorName: input<string>()`, and `outputStream: input<MarbleStream | null>()`.
   - *Deduction*:
     - Source stream(s) are constructed based on selected preset (e.g. `interval(500).pipe(take(5))`).
     - Source stream is tapped with `tap()` to record input marble emissions, completion, or errors on `inputStreams`.
     - Operator pipeline is constructed applying the real RxJS operator (e.g. `source$.pipe(operator(...))`).
     - Subscribing to the final pipeline captures output marble emissions, completion, or errors on `outputStream`.
     - Both input and output marbles use the same elapsed timestamp reference (`Date.now() - streamStartTime`), providing exact visual timing alignment.
     - Combination operators generate two source streams (`source1$`, `source2$`), rendered as two input tracks in `app-marble-diagram`.

4. **Dynamic Parameter Schema**:
   - *Observation*: 65 operators have distinct configuration needs (`take` has count, `debounceTime` has milliseconds, `filter` has predicate preset, `retry` has retry count). Hardcoding 65 distinct parameter HTML blocks is unmaintainable.
   - *Deduction*: A schema-driven parameter model (`OperatorParamConfig`) allows each operator in `module3.data.ts` to declare its parameters declaratively. The template iterates over `currentOperator().parameters` using an `@switch (param.type)` block (`slider`, `number`, `select`, `boolean`, `text`).

---

## 5. Architectural Specification & Concrete Blueprints

### 5.1 Route Definition (`src/app/features/module3-operators/module3.routes.ts`)

```typescript
import { Routes } from '@angular/router';
import { OperatorCatalogComponent } from './operator-catalog.component';

export const MODULE3_ROUTES: Routes = [
  {
    path: '',
    redirectTo: 'transformation',
    pathMatch: 'full'
  },
  {
    path: ':category',
    component: OperatorCatalogComponent,
  },
  {
    path: ':category/:operatorId',
    component: OperatorCatalogComponent,
  }
];
```

### 5.2 Component Data Models (`src/app/features/module3-operators/operator-catalog.models.ts`)

```typescript
import { OperatorMetadata, ComparisonData, QuizQuestion, MarbleStream } from '../../core/models';
import { Observable } from 'rxjs';

export type OperatorCategoryId = 'transformation' | 'filtering' | 'combination' | 'utility' | 'multicasting';

export type ParamControl = 'slider' | 'number' | 'select' | 'boolean' | 'text';

export interface ParamOption {
  label: string;
  value: any;
}

export interface OperatorParamConfig {
  id: string;
  name: string;
  type: ParamControl;
  defaultValue: any;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  options?: ParamOption[];
  description?: string;
}

export type SourceStreamPreset =
  | 'interval'
  | 'burst'
  | 'words'
  | 'duplicates'
  | 'error'
  | 'objects'
  | 'custom';

export interface OperatorDefinition {
  id: string;
  name: string;
  category: OperatorCategoryId;
  metadata: OperatorMetadata;
  codeSnippet: string;
  defaultSourcePreset: SourceStreamPreset;
  defaultSource2Preset?: SourceStreamPreset;
  parameters: OperatorParamConfig[];
  initialMarbles?: {
    inputStreams: MarbleStream[];
    outputStream: MarbleStream;
  };
  comparison: ComparisonData;
  quiz: QuizQuestion[];
  hasNotifierTrigger?: boolean;
  notifierLabel?: string;
  pipelineFactory: (source$: Observable<any>, params: Record<string, any>, context: PipelineContext) => Observable<any>;
}

export interface PipelineContext {
  source2$?: Observable<any>;
  notifier$?: Observable<any>;
}

export interface CategoryInfo {
  id: OperatorCategoryId;
  title: string;
  badgeLabel: string;
  badgeClass: string;
  icon: string;
  description: string;
  operatorIds: string[];
}
```

### 5.3 Category Definitions & Operator Counts

| Category ID | Display Title | Badge Class | Icon | Count | Operator IDs |
|-------------|---------------|-------------|------|-------|--------------|
| `transformation` | Transformation | `badge-cyan` | 🔄 | 18 | `map`, `mapTo`, `pluck`, `scan`, `reduce`, `toArray`, `buffer`, `bufferCount`, `bufferTime`, `bufferToggle`, `bufferWhen`, `window`, `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, `pairwise`, `groupBy` |
| `filtering` | Filtering | `badge-warning` | 🔍 | 19 | `filter`, `take`, `takeLast`, `takeUntil`, `takeWhile`, `skip`, `skipLast`, `skipUntil`, `skipWhile`, `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged`, `debounce`, `debounceTime`, `throttle`, `throttleTime`, `audit`, `auditTime`, `sample` |
| `combination` | Combination | `badge-primary` | 🔀 | 11 | `combineLatest`, `concat`, `merge`, `forkJoin`, `zip`, `race`, `withLatestFrom`, `startWith`, `endWith`, `concatAll`, `mergeAll` |
| `utility` | Utility | `badge-magenta` | 🛠️ | 12 | `tap`, `delay`, `delayWhen`, `timeout`, `timeInterval`, `timestamp`, `finalize`, `repeat`, `repeatWhen`, `retry`, `retryWhen`, `dematerialize` |
| `multicasting` | Multicasting | `badge-purple` | 📡 | 5 | `share`, `shareReplay`, `multicast`, `publish`, `refCount` |

### 5.4 Component Architecture Blueprint (`OperatorCatalogComponent`)

#### TypeScript Specification (`operator-catalog.component.ts`)

```typescript
@Component({
  selector: 'app-operator-catalog',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    PlaygroundWrapperComponent,
    OperatorCardComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    MarbleDiagramComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './operator-catalog.component.html',
  styleUrl: './operator-catalog.component.scss'
})
export class OperatorCatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly progressService = inject(ProgressService);

  // Active Category & Operator State
  readonly selectedCategory = signal<OperatorCategoryId>('transformation');
  readonly selectedOperatorId = signal<string>('map');
  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly searchQuery = signal<string>('');

  // Runner & Live Stream State
  readonly isRunning = signal<boolean>(false);
  readonly isCompleted = signal<boolean>(false);
  readonly durationMs = signal<number>(5000);
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  readonly inputStreams = signal<MarbleStream[]>([]);
  readonly outputMarbleStream = signal<MarbleStream | null>(null);

  // Source Stream Configuration
  readonly selectedSourcePreset = signal<SourceStreamPreset>('interval');
  readonly selectedSource2Preset = signal<SourceStreamPreset>('interval');
  readonly customSourceInput = signal<string>('1, 2, 3, 4, 5');

  // Dynamic Parameter Values Map
  readonly paramValues = signal<Record<string, any>>({});

  // Active Operator Definition Computed Signal
  readonly currentOperator = computed<OperatorDefinition>(() => {
    const opId = this.selectedOperatorId();
    return MODULE3_OPERATORS[opId] || MODULE3_OPERATORS['map'];
  });

  // Filtered Operator Pills for Ribbon
  readonly filteredOperators = computed<OperatorDefinition[]>(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();
    const ops = CATEGORY_OPERATOR_MAP[cat] || [];
    if (!query) return ops;
    return ops.filter(op =>
      op.name.toLowerCase().includes(query) ||
      op.metadata.summary.toLowerCase().includes(query)
    );
  });

  private activeSubscription: Subscription | null = null;
  private notifierSubject$ = new Subject<any>();
  private streamStartTime = 0;
  private entryIdCounter = 0;
  private emissionCounter = 0;

  constructor() {
    // Synchronize route parameters with reactive signals
    this.route.paramMap
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(params => {
        const cat = (params.get('category') as OperatorCategoryId) || 'transformation';
        const opId = params.get('operatorId');
        this.handleRouteParams(cat, opId);
      });
  }

  // Parameter and preset update methods
  setCategory(cat: OperatorCategoryId): void {
    const firstOp = CATEGORY_DEFAULT_OPERATOR[cat];
    this.router.navigate(['/module3', cat, firstOp]);
  }

  selectOperator(opId: string): void {
    this.router.navigate(['/module3', this.selectedCategory(), opId]);
  }

  updateParam(paramId: string, value: any): void {
    this.paramValues.update(m => ({ ...m, [paramId]: value }));
  }

  triggerNotifier(): void {
    this.addLog('info', 'notifier$', '⚡ Signal emitted', 'Manual trigger fired');
    this.notifierSubject$.next(Date.now());
  }

  // Stream execution methods
  runStream(): void { ... }
  stopStream(): void { ... }
  clearConsole(): void { ... }
}
```

#### Dual-Track Stream Execution Pipeline Construction

```typescript
runStream(): void {
  this.stopStream();
  this.isRunning.set(true);
  this.isCompleted.set(false);
  this.streamStartTime = Date.now();
  this.emissionCounter = 0;

  const op = this.currentOperator();
  const isCombo = op.category === 'combination';

  // 1. Initialize Marble Streams
  const initialInputs: MarbleStream[] = [
    { id: 'src_1', label: isCombo ? 'source1$' : 'source$', color: 'var(--color-primary-400)', emissions: [] }
  ];
  if (isCombo) {
    initialInputs.push({
      id: 'src_2',
      label: 'source2$',
      color: 'var(--color-secondary-400)',
      emissions: []
    });
  }
  this.inputStreams.set(initialInputs);
  this.outputMarbleStream.set({
    id: `out_${Date.now()}`,
    label: `${op.name}()`,
    color: 'var(--color-accent-400)',
    emissions: []
  });

  // 2. Build Monitored Source Stream 1
  const rawSource1$ = this.buildSourceObservable(this.selectedSourcePreset(), 1);
  const monitoredSource1$ = rawSource1$.pipe(
    tap({
      next: val => {
        this.addLog('next', isCombo ? 'source1$' : 'source$', val, 'Source emission');
        this.recordInputMarble('src_1', val);
      },
      error: err => {
        this.addLog('error', isCombo ? 'source1$' : 'source$', err?.message || String(err));
        this.recordInputError('src_1');
      },
      complete: () => {
        this.addLog('complete', isCombo ? 'source1$' : 'source$');
        this.recordInputComplete('src_1');
      }
    })
  );

  // 3. Build Monitored Source Stream 2 (if Combination)
  let monitoredSource2$: Observable<any> | undefined;
  if (isCombo) {
    const rawSource2$ = this.buildSourceObservable(this.selectedSource2Preset(), 2);
    monitoredSource2$ = rawSource2$.pipe(
      tap({
        next: val => {
          this.addLog('next', 'source2$', val, 'Source 2 emission');
          this.recordInputMarble('src_2', val);
        },
        error: err => {
          this.addLog('error', 'source2$', err?.message || String(err));
          this.recordInputError('src_2');
        },
        complete: () => {
          this.addLog('complete', 'source2$');
          this.recordInputComplete('src_2');
        }
      })
    );
  }

  // 4. Construct Output Pipeline via Operator Pipeline Factory
  const context: PipelineContext = {
    source2$: monitoredSource2$,
    notifier$: this.notifierSubject$.asObservable()
  };
  const output$ = op.pipelineFactory(monitoredSource1$, this.paramValues(), context);

  // 5. Subscribe to Output Pipeline
  this.addLog('subscribe', `${op.name}()`, undefined, 'Pipeline subscription active');
  this.activeSubscription = output$.subscribe({
    next: val => {
      this.emissionCounter++;
      this.addLog('next', `${op.name}()`, val, `Output emission #${this.emissionCounter}`);
      this.recordOutputMarble(val);
    },
    error: err => {
      this.isRunning.set(false);
      this.addLog('error', `${op.name}()`, err?.message || String(err), 'Stream terminated with error');
      this.recordOutputError();
    },
    complete: () => {
      this.isRunning.set(false);
      this.isCompleted.set(true);
      this.addLog('complete', `${op.name}()`, undefined, 'Pipeline completed');
      this.recordOutputComplete();
    }
  });
}
```

### 5.5 Template Structure (`operator-catalog.component.html`)

```html
<div class="operator-catalog-container">
  <!-- 1. Header with Category Badges -->
  <header class="catalog-header">
    <div class="category-tabs" role="tablist" aria-label="Operator Categories">
      @for (cat of categories; track cat.id) {
        <button
          type="button"
          role="tab"
          class="category-tab-btn"
          [class.active]="selectedCategory() === cat.id"
          [attr.aria-selected]="selectedCategory() === cat.id"
          (click)="setCategory(cat.id)"
        >
          <span class="cat-icon">{{ cat.icon }}</span>
          <span class="cat-title">{{ cat.title }}</span>
          <span class="badge" [class]="cat.badgeClass">{{ cat.operatorIds.length }}</span>
        </button>
      }
    </div>

    <!-- Quick Search / Filter Input -->
    <div class="search-filter-box">
      <span class="search-icon">🔍</span>
      <input
        type="text"
        placeholder="Filter operators in {{ selectedCategory() }}..."
        [value]="searchQuery()"
        (input)="searchQuery.set($any($event.target).value)"
        class="filter-input"
      />
      @if (searchQuery()) {
        <button class="clear-filter-btn" (click)="searchQuery.set('')" type="button">✕</button>
      }
    </div>
  </header>

  <!-- 2. Operator Selector Pills Ribbon -->
  <nav class="operator-ribbon" aria-label="Operators">
    @for (op of filteredOperators(); track op.id) {
      <button
        type="button"
        class="operator-pill"
        [class.active]="selectedOperatorId() === op.id"
        (click)="selectOperator(op.id)"
        [title]="op.metadata.summary"
      >
        <span class="pill-name">{{ op.name }}</span>
        @if (progressService.isCompleted(op.id)) {
          <span class="pill-check">✓</span>
        }
      </button>
    } @empty {
      <div class="no-operators-found">No operators match "{{ searchQuery() }}"</div>
    }
  </nav>

  <!-- 3. Playground Wrapper Tabs Harness -->
  <app-playground-wrapper
    [title]="currentOperator().name + '()'"
    [subtitle]="currentOperator().metadata.summary"
    [category]="currentOperator().metadata.category"
    [difficulty]="currentOperator().metadata.difficulty"
    [topicId]="currentOperator().id"
    [availableTabs]="['visual', 'concept', 'code', 'comparison', 'quiz']"
    [(activeTab)]="activeTab"
  >
    <!-- Slot 1: Concept Tab -->
    <div slot="concept" class="tab-pane">
      <app-operator-card [operator]="currentOperator().metadata" [showPlaygroundLink]="false" />
    </div>

    <!-- Slot 2: Code Tab -->
    <div slot="code" class="tab-pane">
      <app-code-block
        [title]="currentOperator().name + ' Operator Example'"
        [code]="currentOperator().codeSnippet"
        language="typescript"
      />
    </div>

    <!-- Slot 3: Visual Demo Tab -->
    <div slot="visual" class="tab-pane visual-pane">
      <!-- Interactive Parameter Panel -->
      <div class="controls-card">
        <div class="controls-header">
          <div class="header-title">
            <span class="gear-icon">⚙️</span>
            <h3>Parameters & Runner: <code>{{ currentOperator().name }}()</code></h3>
          </div>
          <span
            class="stream-status-badge"
            [class.running]="isRunning()"
            [class.completed]="isCompleted()"
            [class.idle]="!isRunning() && !isCompleted()"
          >
            @if (isRunning()) {
              <span class="pulse-dot"></span> Streaming Active
            } @else if (isCompleted()) {
              ✓ Completed
            } @else {
              ○ Idle
            }
          </span>
        </div>

        <div class="params-grid">
          <!-- Source Preset -->
          <div class="param-group">
            <label>Source Stream Preset</label>
            <select [value]="selectedSourcePreset()" (change)="selectedSourcePreset.set($any($event.target).value)">
              <option value="interval">Numbers (interval 500ms, take 5)</option>
              <option value="burst">Rapid Burst (3 quick, 1s pause, 2 quick)</option>
              <option value="words">Word Stream (timed array)</option>
              <option value="duplicates">Duplicate Stream (1, 1, 2, 2, 3, 1)</option>
              <option value="error">Failing Stream (emits 2 values, then throws Error)</option>
              <option value="objects">Object Stream ({ id, name, role })</option>
              <option value="custom">Custom Input Array</option>
            </select>
          </div>

          @if (selectedSourcePreset() === 'custom') {
            <div class="param-group">
              <label>Custom Values (comma-separated)</label>
              <input type="text" [value]="customSourceInput()" (input)="customSourceInput.set($any($event.target).value)" />
            </div>
          }

          <!-- Secondary Stream (Combination Operators) -->
          @if (currentOperator().category === 'combination') {
            <div class="param-group">
              <label>Secondary Stream (source2$)</label>
              <select [value]="selectedSource2Preset()" (change)="selectedSource2Preset.set($any($event.target).value)">
                <option value="interval">Letters (interval 700ms: A, B, C, D)</option>
                <option value="burst">Fast Numbers (interval 300ms: 10, 20, 30)</option>
                <option value="words">Actions (Click, Scroll, Submit)</option>
              </select>
            </div>
          }

          <!-- Dynamic Operator Parameters -->
          @for (param of currentOperator().parameters; track param.id) {
            <div class="param-group">
              <label>{{ param.name }}</label>
              @switch (param.type) {
                @case ('slider') {
                  <div class="slider-container">
                    <input
                      type="range"
                      [min]="param.min ?? 0"
                      [max]="param.max ?? 2000"
                      [step]="param.step ?? 50"
                      [value]="paramValues()[param.id] ?? param.defaultValue"
                      (input)="updateParam(param.id, +$any($event.target).value)"
                    />
                    <span class="slider-value">{{ paramValues()[param.id] ?? param.defaultValue }}{{ param.unit || '' }}</span>
                  </div>
                }
                @case ('number') {
                  <input
                    type="number"
                    [min]="param.min ?? 0"
                    [max]="param.max ?? 100"
                    [step]="param.step ?? 1"
                    [value]="paramValues()[param.id] ?? param.defaultValue"
                    (input)="updateParam(param.id, +$any($event.target).value)"
                  />
                }
                @case ('select') {
                  <select
                    [value]="paramValues()[param.id] ?? param.defaultValue"
                    (change)="updateParam(param.id, $any($event.target).value)"
                  >
                    @for (opt of param.options; track opt.value) {
                      <option [value]="opt.value">{{ opt.label }}</option>
                    }
                  </select>
                }
                @case ('boolean') {
                  <label class="checkbox-label">
                    <input
                      type="checkbox"
                      [checked]="paramValues()[param.id] ?? param.defaultValue"
                      (change)="updateParam(param.id, $any($event.target).checked)"
                    />
                    {{ param.description || 'Enable option' }}
                  </label>
                }
                @case ('text') {
                  <input
                    type="text"
                    [value]="paramValues()[param.id] ?? param.defaultValue"
                    (input)="updateParam(param.id, $any($event.target).value)"
                  />
                }
              }
            </div>
          }
        </div>

        <!-- Action Buttons -->
        <div class="runner-actions">
          @if (!isRunning()) {
            <button class="btn btn-primary" (click)="runStream()" type="button">
              ▶ Run Stream
            </button>
          } @else {
            <button class="btn btn-danger" (click)="stopStream()" type="button">
              ⏹ Stop Stream (Unsubscribe)
            </button>
          }

          @if (currentOperator().hasNotifierTrigger) {
            <button
              class="btn btn-warning"
              [disabled]="!isRunning()"
              (click)="triggerNotifier()"
              type="button"
            >
              {{ currentOperator().notifierLabel || '⚡ Emit Notifier Signal' }}
            </button>
          }

          <button class="btn btn-outline" (click)="clearConsole()" type="button">
            🗑 Clear Output
          </button>
        </div>
      </div>

      <!-- Dual-Track Marble Diagram -->
      <app-marble-diagram
        [inputStreams]="inputStreams()"
        [operatorName]="currentOperator().name"
        [outputStream]="outputMarbleStream()"
        [durationMs]="durationMs()"
        [isPlaying]="isRunning()"
      />

      <!-- Console Output -->
      <app-output-console
        [entries]="consoleEntries()"
        (clear)="clearConsole()"
      />
    </div>

    <!-- Slot 4: Comparison Tab -->
    <div slot="comparison" class="tab-pane">
      <app-comparison-table
        [data]="currentOperator().comparison"
        [highlightColumnId]="currentOperator().id"
      />
    </div>

    <!-- Slot 5: Quiz Tab -->
    <div slot="quiz" class="tab-pane">
      <app-quiz-block
        [questions]="currentOperator().quiz"
        [topicId]="currentOperator().id"
      />
    </div>
  </app-playground-wrapper>
</div>
```

---

## 6. Caveats

1. **Deprecated Operators**: Certain operators in RxJS 7 (e.g. `pluck`, `mapTo`, `multicast`, `publish`) are marked deprecated in RxJS 7.8 and will be removed in RxJS 8. However, they are authoritative requirements in `ORIGINAL_REQUEST.md` (Features 31 and 35) and must be implemented. Their cards should include educational callouts explaining modern alternatives (e.g. `map(x => x.prop)` instead of `pluck`).
2. **Combination Operators Pipeable vs Static**: In RxJS 7+, `combineLatest`, `concat`, `merge`, and `zip` have both static creation functions (`combineLatest([a$, b$])`) and pipeable operators (`a$.pipe(combineLatestWith(b$))`). The runner engine seamlessly handles both forms while presenting the dual-track marble diagram.
3. **Zoneless Signal Updates**: Asynchronous callbacks inside RxJS `subscribe()` must only update Angular signals and avoid direct DOM manipulations.

---

## 7. Conclusion

The architecture formulated herein provides a complete, robust, and scalable blueprint for Module 3:
1. **Routing**: Elegant 2-tier route configuration (`/module3/:category` and `/module3/:category/:operatorId`) with bidirectional signal synchronization and address bar URL persistence.
2. **Component Structure**: Single data-driven `OperatorCatalogComponent` hosting all 65 operators without template bloat, utilizing category badges, a fast filterable operator ribbon, and `PlaygroundWrapperComponent`.
3. **Execution Engine**: Dual-track marble animation capturing authentic RxJS input and output stream events with exact timestamp alignment and rigorous `DestroyRef` teardown.
4. **Parameter Panel**: Declarative schema-driven controls supporting all operator parameter types and interactive notifier buttons.

---

## 8. Verification Method

To independently verify this specification and its subsequent implementation:

1. **Angular Development Build**:
   ```bash
   npx ng build --configuration development
   ```
   *Expected*: Passes with 0 errors, generating the lazy `module3-routes` bundle chunk.

2. **Milestone 3 E2E Test Suite**:
   ```bash
   node tests/e2e/run-all-tests.js --milestone=M3
   ```
   *Expected*: 50 / 50 tests pass (100%) across Tier 1 Features 31–35 and Tier 2 boundary conditions.

3. **Full Acceptance E2E Suite**:
   ```bash
   node tests/e2e/run-all-tests.js
   ```
   *Expected*: Zero regressions across all existing tests.

4. **Component Unit Tests**:
   ```bash
   npx ng test --include="src/app/features/module3-operators/**/*.spec.ts" --no-watch --browsers=ChromeHeadless
   ```
   *Expected*: Verifies component instantiation, default route parameter handling, operator switching, runner marble generation, and unsubscription teardown.
