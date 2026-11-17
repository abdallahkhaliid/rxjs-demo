# Module 4 (Higher-Order Observables) Architecture Blueprint & Handoff Report

## 1. Observation

Direct code and test observations from repository analysis:

1. **Routing and Navigation Baseline**:
   - In `src/app/features/module4-higher-order/module4.routes.ts` (lines 4–11):
     ```typescript
     export const MODULE4_ROUTES: Routes = [
       { path: '', redirectTo: 'overview', pathMatch: 'full' },
       { path: 'overview', component: StubTopicComponent },
       { path: 'switch-map', component: StubTopicComponent },
       { path: 'merge-map', component: StubTopicComponent },
       { path: 'concat-map', component: StubTopicComponent },
       { path: 'exhaust-map', component: StubTopicComponent },
     ];
     ```
   - In `src/app/core/services/search.service.ts` (lines 60–73):
     ```typescript
     id: 'module4',
     moduleNumber: 4,
     title: 'Higher-Order Observables',
     description: 'Flattening strategies: switchMap, mergeMap, concatMap, exhaustMap',
     icon: '🔀',
     basePath: '/module4',
     topics: [
       { id: 'hoo-overview', title: 'HOO Overview & Lifecycle', path: '/module4/overview', category: 'HOO', difficulty: 'intermediate' },
       { id: 'switchMap', title: 'switchMap', path: '/module4/switch-map', category: 'HOO', difficulty: 'intermediate' },
       { id: 'mergeMap', title: 'mergeMap', path: '/module4/merge-map', category: 'HOO', difficulty: 'intermediate' },
       { id: 'concatMap', title: 'concatMap', path: '/module4/concat-map', category: 'HOO', difficulty: 'intermediate' },
       { id: 'exhaustMap', title: 'exhaustMap', path: '/module4/exhaust-map', category: 'HOO', difficulty: 'intermediate' },
     ]
     ```
   - In `src/app/app.routes.ts` (line 28):
     `{ path: 'module4', loadChildren: () => import('./features/module4-higher-order/module4.routes').then(m => m.MODULE4_ROUTES) }`

2. **Authoritative E2E Test Constraints**:
   - In `tests/e2e/tier1-features/t1-hoo-subjects-schedulers.js`:
     - **F36.1**: `switchMap` cancels active in-flight inner observable on new outer emission (`trigger$.next(1)` at t=0ms with 20ms delay, `trigger$.next(2)` at t=5ms cancels req 1; only `result-2` emits).
     - **F36.2**: `concatMap` queues subsequent inner observables and executes them sequentially in strict FIFO order (`['done-1', 'done-2', 'done-3']`).
     - **F36.3**: `mergeMap` runs multiple inner observables concurrently in parallel (Req 1 with 25ms delay, Req 2 with 5ms delay -> `['fast-2', 'fast-1']`).
     - **F36.4**: `exhaustMap` ignores incoming outer emissions while an inner observable is active (Req 2 and 3 dropped; Req 4 accepted once Req 1 completes -> `['exhaust-1', 'exhaust-4']`).
     - **F36.5**: `TimelineStateTracker` verifies state transitions across `active`, `queued`, `cancelled`, `ignored`, and `completed`.
   - In `tests/e2e/tier2-boundaries/t2-hoo-subjects-schedulers-boundaries.js`:
     - **F36.B1**: `switchMap` inner observable error terminates outer stream unless caught internally with `catchError()`.
     - **F36.B2**: `concatMap` queues 50 rapid sequential emissions without losing items.
     - **F36.B3**: `exhaustMap` with inner observable that never completes permanently locks out future emissions.
     - **F36.B4**: `mergeMap(project, 1)` with concurrency limit = 1 behaves identically to `concatMap`.
     - **F36.B5**: Unsubscribing from outer HOO cancels all in-flight inner observables immediately.
   - In `tests/e2e/tier3-combinations/t3-cross-feature-interactions.js` (lines 58–77):
     - **T3.03**: Express `/api/slow` endpoint integrated with HOO Timeline (`switchMap` cancellation vs `concatMap` queue).
   - In `tests/e2e/tier4-scenarios/t4-real-world-scenarios.js` (lines 267–328):
     - **T4.07**: Scenario 7 benchmarks all 4 operators with identical 4-request burst (`switchMap` yields `['res-4']`, `concatMap` yields `['res-1', 'res-2', 'res-3', 'res-4']`, `mergeMap` yields all 4 concurrent, `exhaustMap` yields `['res-1']`).

3. **Shared Design System Tokens and Components**:
   - In `src/styles/_tokens.scss`:
     - `--color-danger`: `#ef4444`, `--color-danger-bg`: `rgba(239, 68, 68, 0.12)`, `--color-danger-border`: `rgba(239, 68, 68, 0.3)`
     - `--color-warning`: `#f59e0b`, `--color-warning-bg`: `rgba(245, 158, 11, 0.12)`, `--color-warning-border`: `rgba(245, 158, 11, 0.3)`
     - `--color-success`: `#10b981`, `--color-success-bg`: `rgba(16, 185, 129, 0.12)`, `--color-success-border`: `rgba(16, 185, 129, 0.3)`
     - `--color-primary-500`: `#6366f1`, `--color-accent-cyan`: `#06b6d4`, `--color-text-muted`: `#64748b`
   - In `src/app/shared/components/`:
     - `app-playground-wrapper` (`PlaygroundWrapperComponent`) with 5 slots: `concept`, `code`, `visual`, `comparison`, `quiz`
     - `app-code-block` (`CodeBlockComponent`): syntax highlighting via highlight.js
     - `app-output-console` (`OutputConsoleComponent`): live console with timestamp, type badge, auto-scroll, clear/copy
     - `app-marble-diagram` (`MarbleDiagramComponent`): SVG timeline with emissions, scrubber, playback controls
     - `app-comparison-table` (`ComparisonTableComponent`): multi-column comparison table with column highlighting
     - `app-quiz-block` (`QuizBlockComponent`): interactive multiple-choice quiz tracking progress

4. **Build and Verification Baseline**:
   - Command `npx ng build --configuration development` compiles with 0 errors.
   - Command `node tests/e2e/run-all-tests.js` passes 543 / 543 tests (100%).

---

## 2. Logic Chain

1. **Mapping Operators & The Flattening Challenge**:
   - An Observable emitting inner Observables produces `Observable<Observable<T>>`. To subscribe to values without pyramid-of-doom subscriptions, RxJS provides flattening operators.
   - The 4 core strategies diverge strictly on how they manage concurrent inner streams:
     - `switchMap`: Concurrency = 1. Preempts (cancels) active inner on new outer emission.
     - `concatMap`: Concurrency = 1. Queues new outer emissions in FIFO queue until active completes.
     - `mergeMap`: Concurrency = N (default `Infinity`). Subscribes immediately in parallel; queues when limit N is reached. When N=1, behaves identically to `concatMap`.
     - `exhaustMap`: Concurrency = 1. Drops (ignores) new outer emissions completely while active inner is running.

2. **Lifecycle State Machine Formalization**:
   - To visualize concurrency and inner stream lifecycle, each request belongs to one of 5 distinct states:
     - `queued`: Request is waiting for an execution slot. (Amber, dashed/striped border, clock icon).
     - `active`: Request is currently executing its inner timer/HTTP request. (Blue/Cyan, glowing, animated progress bar).
     - `cancelled`: Request was active but was aborted before completion due to preemption or stream teardown. (Red, dashed border, strike-through, red tag).
     - `ignored`: Request arrived while the operator was locked, so it was dropped immediately without queuing or starting. (Faded gray, opacity: 0.4, slashed circle).
     - `completed`: Request finished successfully and emitted its value to the output stream. (Solid green, checkmark, emitted value badge).

3. **Interactive Control Requirements**:
   - **Concurrency Limit**: Essential for `mergeMap`. Setting concurrency = 1 visually proves the equivalence of `mergeMap(..., 1)` and `concatMap(...)` (F36.B4). Concurrency 2-5 demonstrates parallel batch execution.
   - **Simulated Delay Slider**: Range 500ms–5000ms. Allows the user to slow down execution to observe race conditions and queueing in real time.
   - **Trigger Modes**:
     - *Single Request*: Triggers 1 emission.
     - *Burst Trigger (3 rapid requests)*: Emits 3 requests in rapid succession (e.g. at t=0, t=100ms, t=200ms) with distinct identifiers, immediately exposing the behavioral divergence of the 4 operators.
     - *Custom Outer Emission*: Enables custom input labels/payloads and custom inner durations.
     - *Reset / Teardown*: Aborts active requests, proving `takeUntilDestroyed()` / cancellation semantics (F36.B5).

4. **Integration with Shared Components**:
   - `HooPlaygroundComponent` uses `app-playground-wrapper` across 5 tabs:
     - Tab `concept`: Deep dive into operator mechanics, marble diagrams, use cases, anti-patterns, and inner error resilience (`catchError`).
     - Tab `code`: Production-grade TypeScript examples highlighting standard usage, inner error handling, and Angular Zoneless Signals / `takeUntilDestroyed()`.
     - Tab `visual`: The animated concurrent timeline (`app-hoo-timeline-visualizer`) + interactive controls + `app-marble-diagram` + `app-output-console`.
     - Tab `comparison`: `app-comparison-table` highlighting the current operator's column against the other three.
     - Tab `quiz`: `app-quiz-block` with 4-5 rigorous questions per operator testing edge cases, concurrency, and memory safety.
   - `HooOverviewComponent`:
     - High-level concept intro, decision tree flowchart ("Which flattening operator do I need?"), 4 operator summary cards with quick-links, and an interactive **4-Way Comparison Race Demo** executing the same 3 requests simultaneously across `switchMap`, `mergeMap`, `concatMap`, and `exhaustMap`.

---

## 3. Caveats

- **No external animation libraries**: All timeline animations and progress bars are implemented using Angular Signals, pure CSS transitions, and SVG/HTML5 progress bars to maintain zero bundle bloat and 100% adherence to project architecture.
- **Express Backend vs Local Simulation**: The visualizer defaults to high-precision local timer simulation for instantaneous responsiveness and deterministic unit testing, while providing a toggle to issue real HTTP calls to Express `GET /api/slow?delay=...` to satisfy full-stack integration requirements.
- **Zoneless Signal Architecture**: All state in `HooPlaygroundComponent` and `HooTimelineEngine` must remain pure Signals/RxJS interop (`signal()`, `computed()`, `DestroyRef`, `takeUntilDestroyed`) without `ChangeDetectorRef` or Zone.js assumptions.

---

## 4. Conclusion & Technical Specifications

The architecture for Module 4 consists of 7 modular files under `src/app/features/module4-higher-order/`:

```
src/app/features/module4-higher-order/
├── hoo-timeline.models.ts                  # TypeScript interfaces and state types
├── hoo-timeline-engine.ts                  # Pure deterministic state transition engine
├── hoo-timeline-engine.spec.ts             # Unit tests for the state transition engine
├── module4.data.ts                         # Complete metadata, comparison matrix, code snippets, quizzes
├── module4.routes.ts                       # Lazy-loaded child routing definitions
├── components/
│   └── timeline-visualizer/
│       ├── hoo-timeline-visualizer.component.ts    # Standalone visual timeline swimlane
│       ├── hoo-timeline-visualizer.component.html  # Swimlane tracks, progress bars, lifecycle badges
│       └── hoo-timeline-visualizer.component.scss  # Token-driven CSS, states (cancelled, queued, ignored, completed)
├── hoo-playground.component.ts             # 5-tab playground wrapper component
├── hoo-playground.component.html
├── hoo-playground.component.scss
├── hoo-playground.component.spec.ts        # Unit test suite for playground component
├── hoo-overview.component.ts               # Module 4 overview with 4-way comparison race demo
├── hoo-overview.component.html
├── hoo-overview.component.scss
└── hoo-overview.component.spec.ts          # Unit test suite for overview component
```

### 4.1 Data Models (`hoo-timeline.models.ts`)

```typescript
export type HooLifecycleState = 'active' | 'queued' | 'cancelled' | 'ignored' | 'completed';

export type HooOperatorType = 'switchMap' | 'mergeMap' | 'concatMap' | 'exhaustMap';

export interface HooTimelineRequest {
  id: number;
  label: string;
  state: HooLifecycleState;
  durationMs: number;
  elapsedMs: number;
  progress: number; // 0 to 100%
  startTime: number;
  activeStartTime?: number;
  endTime?: number;
  emittedValue?: any;
  cancelReason?: string;
  color: string;
}

export interface HooTimelineOutputEmission {
  id: string;
  requestId: number;
  timeMs: number;
  value: any;
  displayLabel: string;
  color: string;
}

export interface HooTimelineSnapshot {
  operator: HooOperatorType;
  concurrencyLimit: number;
  requests: HooTimelineRequest[];
  activeCount: number;
  queuedCount: number;
  completedCount: number;
  cancelledCount: number;
  ignoredCount: number;
  outputs: HooTimelineOutputEmission[];
  isRunning: boolean;
}

export interface HooOperatorConfig {
  id: HooOperatorType;
  routeSlug: string;
  title: string;
  subtitle: string;
  concurrencyDefault: number;
  concurrencyMin: number;
  concurrencyMax: number;
  allowConcurrencyControl: boolean;
  codeSnippet: string;
  errorHandlingSnippet: string;
  angularPatternSnippet: string;
}
```

### 4.2 State Transition Engine (`hoo-timeline-engine.ts`)

```typescript
import {
  HooLifecycleState,
  HooOperatorType,
  HooTimelineRequest,
  HooTimelineOutputEmission,
  HooTimelineSnapshot
} from './hoo-timeline.models';

const REQUEST_COLORS = [
  'var(--color-marble-1)',
  'var(--color-marble-2)',
  'var(--color-marble-3)',
  'var(--color-marble-4)',
  'var(--color-marble-5)',
  'var(--color-marble-6)',
  'var(--color-marble-7)',
  'var(--color-marble-8)'
];

export class HooTimelineEngine {
  private requests: Map<number, HooTimelineRequest> = new Map();
  private outputs: HooTimelineOutputEmission[] = [];
  private nextId = 1;
  private operator: HooOperatorType = 'switchMap';
  private concurrencyLimit = 1; // 1 for switchMap/concatMap/exhaustMap; configurable for mergeMap
  private defaultDurationMs = 2000;
  private timelineClockMs = 0;

  constructor(initialOperator: HooOperatorType = 'switchMap', concurrency: number = 1) {
    this.operator = initialOperator;
    this.concurrencyLimit = concurrency;
  }

  setOperator(op: HooOperatorType): void {
    this.operator = op;
    if (op === 'mergeMap') {
      if (this.concurrencyLimit <= 1) this.concurrencyLimit = 2; // Default mergeMap concurrency to 2
    } else {
      this.concurrencyLimit = 1;
    }
    this.reset();
  }

  setConcurrencyLimit(limit: number): void {
    this.concurrencyLimit = Math.max(1, limit);
    this.checkQueue();
  }

  setDefaultDuration(ms: number): void {
    this.defaultDurationMs = Math.max(200, ms);
  }

  trigger(label?: string, durationMs?: number, payload?: any): HooTimelineRequest {
    const id = this.nextId++;
    const duration = durationMs ?? this.defaultDurationMs;
    const color = REQUEST_COLORS[(id - 1) % REQUEST_COLORS.length];
    const reqLabel = label || `Request #${id}`;

    const newReq: HooTimelineRequest = {
      id,
      label: reqLabel,
      state: 'queued', // will be evaluated immediately below
      durationMs: duration,
      elapsedMs: 0,
      progress: 0,
      startTime: this.timelineClockMs,
      emittedValue: payload ?? `res-${id}`,
      color
    };

    const activeList = this.getActiveRequests();

    switch (this.operator) {
      case 'switchMap':
        // Cancel any currently active request
        if (activeList.length > 0) {
          activeList.forEach(act => {
            act.state = 'cancelled';
            act.endTime = this.timelineClockMs;
            act.cancelReason = `Superseded by Req #${id}`;
          });
        }
        newReq.state = 'active';
        newReq.activeStartTime = this.timelineClockMs;
        break;

      case 'concatMap':
        if (activeList.length > 0) {
          newReq.state = 'queued';
        } else {
          newReq.state = 'active';
          newReq.activeStartTime = this.timelineClockMs;
        }
        break;

      case 'mergeMap':
        if (activeList.length < this.concurrencyLimit) {
          newReq.state = 'active';
          newReq.activeStartTime = this.timelineClockMs;
        } else {
          newReq.state = 'queued';
        }
        break;

      case 'exhaustMap':
        if (activeList.length > 0) {
          newReq.state = 'ignored';
          newReq.endTime = this.timelineClockMs;
          newReq.cancelReason = `Ignored: Active inner Req #${activeList[0].id} in flight`;
        } else {
          newReq.state = 'active';
          newReq.activeStartTime = this.timelineClockMs;
        }
        break;
    }

    this.requests.set(id, newReq);
    return newReq;
  }

  triggerBurst(count: number = 3, staggerMs: number = 100): HooTimelineRequest[] {
    const list: HooTimelineRequest[] = [];
    for (let i = 0; i < count; i++) {
      const req = this.trigger(`Burst Req #${this.nextId}`);
      list.push(req);
    }
    return list;
  }

  tick(deltaMs: number): void {
    this.timelineClockMs += deltaMs;
    const activeList = this.getActiveRequests();

    for (const req of activeList) {
      req.elapsedMs += deltaMs;
      req.progress = Math.min(100, Math.round((req.elapsedMs / req.durationMs) * 100));

      if (req.elapsedMs >= req.durationMs) {
        this.complete(req.id);
      }
    }
  }

  complete(id: number): void {
    const req = this.requests.get(id);
    if (!req || req.state !== 'active') return;

    req.state = 'completed';
    req.progress = 100;
    req.endTime = this.timelineClockMs;

    this.outputs.push({
      id: `out-${id}-${Date.now()}`,
      requestId: id,
      timeMs: this.timelineClockMs,
      value: req.emittedValue,
      displayLabel: String(req.emittedValue),
      color: req.color
    });

    this.checkQueue();
  }

  cancel(id: number, reason: string = 'Manually cancelled'): void {
    const req = this.requests.get(id);
    if (!req || (req.state !== 'active' && req.state !== 'queued')) return;

    req.state = 'cancelled';
    req.endTime = this.timelineClockMs;
    req.cancelReason = reason;

    this.checkQueue();
  }

  cancelAllActive(reason: string = 'Stream unsubscribed'): void {
    for (const req of this.requests.values()) {
      if (req.state === 'active' || req.state === 'queued') {
        req.state = 'cancelled';
        req.endTime = this.timelineClockMs;
        req.cancelReason = reason;
      }
    }
  }

  reset(): void {
    this.requests.clear();
    this.outputs = [];
    this.nextId = 1;
    this.timelineClockMs = 0;
  }

  private checkQueue(): void {
    if (this.operator === 'switchMap' || this.operator === 'exhaustMap') {
      return; // These never queue
    }

    const activeCount = this.getActiveRequests().length;
    const availableSlots = this.concurrencyLimit - activeCount;

    if (availableSlots > 0) {
      const queuedList = Array.from(this.requests.values()).filter(r => r.state === 'queued');
      const toActivate = queuedList.slice(0, availableSlots);

      for (const req of toActivate) {
        req.state = 'active';
        req.activeStartTime = this.timelineClockMs;
      }
    }
  }

  getActiveRequests(): HooTimelineRequest[] {
    return Array.from(this.requests.values()).filter(r => r.state === 'active');
  }

  getSnapshot(): HooTimelineSnapshot {
    const all = Array.from(this.requests.values());
    const activeCount = all.filter(r => r.state === 'active').length;
    const queuedCount = all.filter(r => r.state === 'queued').length;
    const completedCount = all.filter(r => r.state === 'completed').length;
    const cancelledCount = all.filter(r => r.state === 'cancelled').length;
    const ignoredCount = all.filter(r => r.state === 'ignored').length;

    return {
      operator: this.operator,
      concurrencyLimit: this.concurrencyLimit,
      requests: all,
      activeCount,
      queuedCount,
      completedCount,
      cancelledCount,
      ignoredCount,
      outputs: [...this.outputs],
      isRunning: activeCount > 0 || queuedCount > 0
    };
  }
}
```

### 4.3 Visual Timeline Component (`components/timeline-visualizer/hoo-timeline-visualizer.component.*`)

The visual timeline component renders each request as a rich concurrent swimlane.

#### Template Structure (`hoo-timeline-visualizer.component.html`)
- **Status Summary Header**:
  - Live badges for Active (glowing cyan), Queued (amber), Completed (emerald), Cancelled (red), Ignored (gray).
  - Operator label with active concurrency indicator (e.g. `mergeMap (Concurrency = 2)`).
- **Swimlane Tracks**:
  - For each request:
    - Left metadata card: Request ID, emission payload, state pill.
    - Right visual progress track:
      - Active: Glowing gradient fill, animated stripe, countdown badge (`${elapsed}ms / ${duration}ms`).
      - Queued: Amber striped bar with clock icon `⏳ Queued (waiting for slot)`.
      - Cancelled: Red background, dashed border, strike-through text, `✕ Cancelled (superseded)`.
      - Ignored: Faded gray background (`opacity: 0.35`), slashed icon `⊘ Ignored (busy)`.
      - Completed: Solid emerald green bar, checkmark `✓ Completed (${duration}ms)`.
- **Output Result Stream**:
  - Bottom chronological track displaying the emitted output marbles in arrival sequence.
  - Demonstrates that `mergeMap` interleaves results, `concatMap` strictly preserves arrival order, `switchMap` yields only the latest, and `exhaustMap` drops middle requests.

#### SCSS Styles (`hoo-timeline-visualizer.component.scss`)
Utilizes CSS custom properties from `src/styles/_tokens.scss`:
```scss
.track-state-active {
  border: 1px solid var(--color-primary-500);
  background: rgba(99, 102, 241, 0.08);
  .progress-fill {
    background: linear-gradient(90deg, var(--color-primary-500), var(--color-accent-cyan));
    box-shadow: 0 0 12px var(--color-primary-glow);
  }
}

.track-state-queued {
  border: 1px dashed var(--color-warning-border);
  background: var(--color-warning-bg);
  .badge-queued {
    color: var(--color-warning);
    background: rgba(245, 158, 11, 0.15);
  }
}

.track-state-cancelled {
  border: 1px dashed var(--color-danger);
  background: var(--color-danger-bg);
  text-decoration: line-through;
  opacity: 0.85;
  .badge-cancelled {
    color: var(--color-danger);
    background: rgba(239, 68, 68, 0.15);
  }
}

.track-state-ignored {
  border: 1px solid var(--color-border-subtle);
  background: rgba(255, 255, 255, 0.02);
  opacity: 0.4;
  filter: grayscale(1);
}

.track-state-completed {
  border: 1px solid var(--color-success-border);
  background: var(--color-success-bg);
  .progress-fill {
    background: var(--color-success);
  }
}
```

### 4.4 Comprehensive Educational Content (`module4.data.ts`)

Contains rich metadata, comparison tables, quizzes, and code examples:

1. **Operator Metadata (`MODULE4_OPERATORS`)**:
   - `switchMap`:
     - Summary: "Projects each source value to an Observable, cancelling the previous inner Observable when a new one arrives."
     - Pitfall: Never use for non-idempotent HTTP POST/PUT/DELETE where prior saves should not be aborted.
     - Resilience: Must wrap inner observable in `catchError` to avoid terminating the outer stream (F36.B1).
   - `mergeMap`:
     - Summary: "Projects each source value to an Observable which is merged concurrently into the output stream up to an optional concurrency limit."
     - Special Rule: With `concurrency = 1`, it behaves identically to `concatMap` (F36.B4).
     - Pitfall: Uncontrolled concurrency can cause socket exhaustion and out-of-order race conditions.
   - `concatMap`:
     - Summary: "Projects each source value to an Observable and concatenates them sequentially in strict FIFO order."
     - Pitfall: An inner observable that never completes causes head-of-line blocking, locking the queue forever.
   - `exhaustMap`:
     - Summary: "Projects each source value to an Observable, ignoring new source values while the current inner Observable is still executing."
     - Pitfall: If the inner observable never completes, future emissions are permanently locked out (F36.B3).
     - Ideal Use: Button debouncing (prevent double-submit logins / transactions).

2. **Master Comparison Matrix (`MODULE4_COMPARISON`)**:
   - Compares:
     - Inner Concurrency Strategy
     - Cancellation on New Emission
     - Queuing Behavior
     - Dropping/Ignoring In-Flight
     - Order Preservation
     - Primary Recommended Use Case
     - Major Anti-Pattern / Risk

3. **Interactive Quizzes (`MODULE4_QUIZZES`)**:
   - 4 quizzes, 4 questions each (16 questions total), covering:
     - Preemption and cancellation in `switchMap`
     - Sequential queueing vs parallel interleaving
     - Concurrency limits (`mergeMap(..., 1)` vs `concatMap`)
     - Button click debouncing via `exhaustMap`
     - Error propagation and inner `catchError` isolation
     - Memory leak prevention using `takeUntilDestroyed()`

### 4.5 Component Layouts & Routes

1. **`HooPlaygroundComponent` (`hoo-playground.component.ts`)**:
   - Wraps `app-playground-wrapper` with slots `concept`, `code`, `visual`, `comparison`, `quiz`.
   - Embeds `app-hoo-timeline-visualizer`, `app-code-block`, `app-output-console`, `app-marble-diagram`, `app-comparison-table`, `app-quiz-block`.
   - Controls panel:
     - Single Request trigger button
     - Burst Trigger button (3 rapid requests)
     - Custom Outer Emission input + button
     - Delay slider (500ms to 5000ms)
     - Concurrency slider (visible for `mergeMap`, with notice when concurrency=1)
     - Reset button
     - Live Express `/api/slow` API toggle (utilizes Angular `HttpClient` against Express server)

2. **`HooOverviewComponent` (`hoo-overview.component.ts`)**:
   - Route: `/module4/overview`
   - Conceptual introduction to Higher-Order Observables (`Observable<Observable<T>>`) and the flattening problem.
   - Interactive Decision Matrix Flowchart: "Which flattening operator should I pick?"
   - Quick-launch cards for `switchMap`, `mergeMap`, `concatMap`, `exhaustMap`.
   - **4-Way Comparison Race Demo**:
     - Single button "Run 4-Way Comparison" fires 3 identical requests into all 4 operators simultaneously!
     - Renders 4 synchronized mini timelines side-by-side, visually proving how `switchMap` cancels 1 & 2, `mergeMap` runs all 3 in parallel, `concatMap` queues sequentially, and `exhaustMap` drops 2 & 3.

3. **Routing Configuration (`module4.routes.ts`)**:
   ```typescript
   import { Routes } from '@angular/router';
   import { HooOverviewComponent } from './hoo-overview.component';
   import { HooPlaygroundComponent } from './hoo-playground.component';

   export const MODULE4_ROUTES: Routes = [
     { path: '', redirectTo: 'overview', pathMatch: 'full' },
     { path: 'overview', component: HooOverviewComponent, data: { topicId: 'hoo-overview' } },
     { path: 'switch-map', component: HooPlaygroundComponent, data: { topicId: 'switchMap', operator: 'switchMap' } },
     { path: 'merge-map', component: HooPlaygroundComponent, data: { topicId: 'mergeMap', operator: 'mergeMap' } },
     { path: 'concat-map', component: HooPlaygroundComponent, data: { topicId: 'concatMap', operator: 'concatMap' } },
     { path: 'exhaust-map', component: HooPlaygroundComponent, data: { topicId: 'exhaustMap', operator: 'exhaustMap' } },
   ];
   ```

---

## 5. Verification Method

To independently verify the implementation, follow these steps:

1. **Unit Test Verification**:
   - Run:
     ```bash
     npx ng test --watch=false
     ```
   - Verify unit test suites pass:
     - `hoo-timeline-engine.spec.ts`: Tests `switchMap` cancellation, `concatMap` sequential queuing, `mergeMap` concurrency limits (including `concurrency = 1 === concatMap`), `exhaustMap` ignore logic, burst triggers, and `cancelAllActive`.
     - `hoo-playground.component.spec.ts`: Tests component initialization, route parameter resolution, tab switching, parameter controls, trigger button interactions, and console logging.
     - `hoo-overview.component.spec.ts`: Tests overview rendering, navigation links, and 4-way comparison race execution.

2. **Full E2E Acceptance Test Suite**:
   - Run:
     ```bash
     node tests/e2e/run-all-tests.js
     ```
   - Confirm all 543 tests across Tiers 1-4 pass with zero failures. Specifically check:
     - Tier 1: F36.1 through F36.5 (Core HOO Timeline requirements)
     - Tier 2: F36.B1 through F36.B5 (Boundaries, Concurrency 1, Unsubscribe cleanup)
     - Tier 3: T3.03 (Express `/api/slow` + HOO Timeline)
     - Tier 4: T4.07 (Direct Benchmark Scenario comparing all 4 operators)

3. **Angular Compilation Check**:
   - Run:
     ```bash
     npx ng build --configuration development
     ```
   - Must build cleanly with 0 TypeScript/Angular compiler diagnostics. Verify `module4-routes` chunk is produced with lazy loading.

4. **Invalidation Conditions**:
   - Any failure in `t1-hoo-subjects-schedulers.js` or `t2-hoo-subjects-schedulers-boundaries.js`.
   - Missing any of the 4 visual request lifecycle states (`cancelled`, `queued`, `ignored`, `completed`).
   - Failure to provide concurrency limit control for `mergeMap`.
   - Broken routing between `/module4/overview`, `/module4/switch-map`, `/module4/merge-map`, `/module4/concat-map`, and `/module4/exhaust-map`.
