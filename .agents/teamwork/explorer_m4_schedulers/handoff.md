# Handoff Report: Module 6 Schedulers & Event Loop Visualizer Architecture

## 1. Observation

### 1.1 Existing Codebase & Routing Layout
- **Module 6 Route Configuration**:
  `src/app/features/module6-schedulers/module6.routes.ts:1-12`:
  ```ts
  import { Routes } from '@angular/router';
  import { StubTopicComponent } from '../stub-topic.component';

  export const MODULE6_ROUTES: Routes = [
    { path: '', redirectTo: 'visualizer', pathMatch: 'full' },
    { path: 'visualizer', component: StubTopicComponent },
    { path: 'queue', component: StubTopicComponent },
    { path: 'asap', component: StubTopicComponent },
    { path: 'async', component: StubTopicComponent },
    { path: 'animation-frame', component: StubTopicComponent },
  ];
  ```
  Currently points all 5 paths to `StubTopicComponent`.
- **Global App Routing**:
  `src/app/app.routes.ts:35-37`:
  ```ts
  {
    path: 'module6',
    loadChildren: () => import('./features/module6-schedulers/module6.routes').then(m => m.MODULE6_ROUTES)
  }
  ```
- **Sidenav & Search Navigation**:
  `src/app/core/services/search.service.ts:88-102`:
  ```ts
  {
    id: 'module6',
    moduleNumber: 6,
    title: 'Schedulers Visualizer',
    description: 'Event loop execution order across queue, asap, async, and animationFrame',
    icon: '⏱️',
    basePath: '/module6',
    topics: [
      { id: 'schedulers-visualizer', title: 'Execution Order Visualizer', path: '/module6/visualizer', category: 'Schedulers', difficulty: 'advanced' },
      { id: 'queue-scheduler', title: 'queueScheduler', path: '/module6/queue', category: 'Schedulers', difficulty: 'intermediate' },
      { id: 'asap-scheduler', title: 'asapScheduler', path: '/module6/asap', category: 'Schedulers', difficulty: 'advanced' },
      { id: 'async-scheduler', title: 'asyncScheduler', path: '/module6/async', category: 'Schedulers', difficulty: 'intermediate' },
      { id: 'animation-frame-scheduler', title: 'animationFrameScheduler', path: '/module6/animation-frame', category: 'Schedulers', difficulty: 'advanced' },
    ]
  }
  ```

### 1.2 Reusable Shared Components
- `app-playground-wrapper` (`src/app/shared/components/playground-wrapper/playground-wrapper.component.ts`):
  Inputs: `title`, `subtitle`, `category`, `difficulty`, `topicId`, `availableTabs` (defaults to `['concept', 'code', 'visual', 'comparison', 'quiz']`), `activeTab` two-way model.
  Projects slots: `<ng-content select="[slot=concept]" />`, `[slot=code]`, `[slot=visual]`, `[slot=comparison]`, `[slot=quiz]`.
- `app-code-block` (`src/app/shared/components/code-block/code-block.component.ts`):
  Inputs: `code`, `language` ('typescript'), `title`, `showLineNumbers`, `highlightLines`.
- `app-output-console` (`src/app/shared/components/output-console/output-console.component.ts`):
  Inputs: `title`, `entries` (`ConsoleEntry[]`), `isStreaming`, `maxEntries`, `autoScroll`, `showTimestamps`. Outputs: `clear`, `pause`, `replay`.
- `app-comparison-table` (`src/app/shared/components/comparison-table/comparison-table.component.ts`):
  Inputs: `data` (`ComparisonData`), `highlightColumnId`.
- `app-quiz-block` (`src/app/shared/components/quiz-block/quiz-block.component.ts`):
  Inputs: `questions` (`QuizQuestion[]`), `topicId`, `passThreshold`. Output: `completed` (`QuizScore`).

### 1.3 Authoritative Acceptance & E2E Tests
1. **`tests/e2e/tier1-features/t1-hoo-subjects-schedulers.js`**:
   - `F38.1`: `queueScheduler` executes synchronously on recursive call queue (`['start', 'queue', 'end']`).
   - `F38.2`: `asapScheduler` executes on microtask queue after synchronous block (`['sync-start', 'sync-end', 'asap-microtask']`).
   - `F38.3`: `asyncScheduler` executes on macrotask queue (`['sync', 'async-macrotask']`).
   - `F38.4`: Event loop ordering: queue (sync) runs before asap (microtask) which runs before async (macrotask) (`['sync (queue)', 'microtask (asap)', 'macrotask (async)']`).
   - `F38.5`: Schedulers support time delay parameter (`asyncScheduler.schedule(..., 15)` with `elapsed >= 10`).
2. **`tests/e2e/tier2-boundaries/t2-hoo-subjects-schedulers-boundaries.js`**:
   - `F38.B1`: `queueScheduler` handles 30 levels of recursive scheduled tasks on trampoline queue without call stack overflow (`[1, 2, 3, 4, 5]`).
   - `F38.B2`: Cancelling scheduled action before delay elapses aborts execution (`action.unsubscribe()`, `ran === false`).
   - `F38.B3`: Scheduled action throwing error does not corrupt scheduler instance.
   - `F38.B4`: Scheduling with state passes state argument to action callback (`scheduler.schedule(fn, 0, { id: 'payload' })`).
   - `F38.B5`: Multiple `asapScheduler` microtasks execute in FIFO order (`['micro-1', 'micro-2', 'micro-3']`).

### 1.4 Verification Baseline
- E2E Test Suite command: `node tests/e2e/run-all-tests.js` (543/543 passed).
- Unit Test Suite command: `npx ng test --watch=false --browsers=ChromeHeadless` (154/154 passed).
- Compilation Build command: `npx ng build --configuration development` (zero errors, 5.45s).

---

## 2. Logic Chain

1. **Requirement R3 & F38 Goal**: Module 6 must provide an interactive, educational visualizer demonstrating the JavaScript Concurrency Model and how the four RxJS Schedulers (`queueScheduler`, `asapScheduler`, `asyncScheduler`, `animationFrameScheduler`) map to the Call Stack, Microtask Queue, Macrotask Queue, and Render Frame Queue.
2. **Decoupled Architecture Rationale**:
   - Creating a dedicated, headless simulator engine (`EventLoopSimulatorService`) enables 100% deterministic, step-by-step state reproduction (enqueue, dequeue, push to stack, pop from stack, log output).
   - This service can be tested thoroughly via pure Jasmine unit tests without fragile DOM assertions.
   - The presentation component (`EventLoopVisualizerComponent`) binds to the service's signals (`callStack`, `microtaskQueue`, `macrotaskQueue`, `renderQueue`, `trampolineQueue`, `currentPhase`, `currentStep`, `isPlaying`) and renders glowing animated SVG/CSS elements representing tasks moving between queues.
3. **Route & Component Topology**:
   - `/module6/visualizer` -> `SchedulersVisualizerComponent`: Flagship event loop simulator with preset scenario selection, custom task builder, play/pause/step controls, speed selector, code viewer, comparison table, and quiz.
   - `/module6/queue` -> `SchedulerTopicComponent` (data topicId: `'queue-scheduler'`): Deep dive on trampoline execution, stack overflow prevention, state passing.
   - `/module6/asap` -> `SchedulerTopicComponent` (data topicId: `'asap-scheduler'`): Deep dive on microtasks, FIFO drain, promise interop.
   - `/module6/async` -> `SchedulerTopicComponent` (data topicId: `'async-scheduler'`): Deep dive on macrotasks, time delay parameters, cancellation via `unsubscribe()`, recurring scheduling.
   - `/module6/animation-frame` -> `SchedulerTopicComponent` (data topicId: `'animation-frame-scheduler'`): Deep dive on `requestAnimationFrame`, 60fps vsync synchronization, smooth animations vs interval jitter.
4. **Data Driven Educational Content**:
   - Defining `src/app/features/module6-schedulers/module6.data.ts` mirroring `module1.data.ts` ensures rich concept explanations, code examples, comparison matrix, and 5 interactive quizzes with immediate feedback.

---

## 3. Caveats

1. **Browser vs Node Event Loop**: `animationFrameScheduler` uses `window.requestAnimationFrame`. In non-browser / SSR / headless Node environments, RxJS falls back to `setTimeout` or `asyncScheduler`. The simulator UI models browser behavior explicitly, including the ~16.6ms vsync render cycle.
2. **Microtask Starvation Guard**: In JavaScript, an infinite recursive microtask loop (`asapScheduler.schedule(() => this.schedule())`) starves the macrotask and render queues completely, freezing the UI. In the simulator, a max step boundary (e.g., 50 steps) is enforced to keep the interactive UI responsive.
3. **No Code Write During Exploration**: This exploration report produces specifications, TypeScript interfaces, and templates; actual file creation under `src/app/features/module6-schedulers/` will be performed by the worker agent.

---

## 4. Conclusion & Technical Implementation Blueprint

The worker must implement the following 10 artifacts under `src/app/features/module6-schedulers/`:

### 4.1 Data Model: `src/app/features/module6-schedulers/models/event-loop.models.ts`

```ts
import { ConsoleEntry } from '../../../core/models';

export type SchedulerId = 'queue' | 'asap' | 'async' | 'animation-frame' | 'sync';

export type EventLoopPhase = 'idle' | 'synchronous' | 'microtask' | 'render' | 'macrotask' | 'completed';

export type SimulationActionType =
  | 'enqueue'
  | 'dequeue_to_stack'
  | 'executing'
  | 'output_logged'
  | 'pop_stack'
  | 'cancelled';

export interface TaskItem {
  id: string;
  name: string;
  scheduler: SchedulerId;
  delayMs?: number;
  state?: any;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  outputMessage?: string;
  isRecursive?: boolean;
  recursionDepth?: number;
}

export interface EventLoopQueuesState {
  callStack: TaskItem[];
  trampolineQueue: TaskItem[];
  microtaskQueue: TaskItem[];
  macrotaskQueue: TaskItem[];
  renderQueue: TaskItem[];
}

export interface SimulationStep {
  stepNumber: number;
  phase: EventLoopPhase;
  phaseTitle: string;
  action: SimulationActionType;
  activeTaskId: string | null;
  queues: EventLoopQueuesState;
  explanation: string;
  consoleOutput: ConsoleEntry[];
  codeLineHighlight?: number;
}

export interface SimulationScenario {
  id: string;
  name: string;
  badge: string;
  description: string;
  codeSnippet: string;
  steps: SimulationStep[];
}

export interface SchedulerTopicConfig {
  id: string;
  title: string;
  subtitle: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  schedulerType: SchedulerId;
  concept: {
    summary: string;
    pillars?: { title: string; description: string }[];
    sections: { title: string; content: string }[];
    takeaways: string[];
  };
  code: {
    title: string;
    code: string;
    language: string;
    highlightLines?: number[];
  };
  comparison: any;
  quiz: any[];
  demo: {
    title: string;
    description: string;
  };
}
```

### 4.2 Simulator Engine Service: `src/app/features/module6-schedulers/services/event-loop-simulator.service.ts`

```ts
import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';
import {
  SimulationScenario,
  SimulationStep,
  EventLoopPhase,
  TaskItem,
  SchedulerId
} from '../models/event-loop.models';
import { ConsoleEntry } from '../../../core/models';
import { MODULE6_SCENARIOS } from '../module6.data';

@Injectable({
  providedIn: 'root'
})
export class EventLoopSimulatorService {
  private readonly destroyRef = inject(DestroyRef);

  readonly scenarios = signal<SimulationScenario[]>(MODULE6_SCENARIOS);
  readonly currentScenarioId = signal<string>('mixed-concurrency');
  readonly currentStepIndex = signal<number>(0);
  readonly isPlaying = signal<boolean>(false);
  readonly playbackSpeedMs = signal<number>(800); // 1500 (slow), 800 (normal), 300 (fast)

  private timerId: any = null;

  readonly activeScenario = computed<SimulationScenario>(() => {
    return this.scenarios().find(s => s.id === this.currentScenarioId()) || this.scenarios()[0];
  });

  readonly steps = computed<SimulationStep[]>(() => {
    return this.activeScenario().steps;
  });

  readonly currentStep = computed<SimulationStep | null>(() => {
    const list = this.steps();
    const idx = this.currentStepIndex();
    return list[idx] || list[0] || null;
  });

  readonly totalSteps = computed<number>(() => this.steps().length);
  readonly canStepBack = computed<boolean>(() => this.currentStepIndex() > 0);
  readonly canStepForward = computed<boolean>(() => this.currentStepIndex() < this.totalSteps() - 1);
  readonly isFinished = computed<boolean>(() => this.currentStepIndex() >= this.totalSteps() - 1);

  readonly callStack = computed<TaskItem[]>(() => this.currentStep()?.queues.callStack || []);
  readonly trampolineQueue = computed<TaskItem[]>(() => this.currentStep()?.queues.trampolineQueue || []);
  readonly microtaskQueue = computed<TaskItem[]>(() => this.currentStep()?.queues.microtaskQueue || []);
  readonly macrotaskQueue = computed<TaskItem[]>(() => this.currentStep()?.queues.macrotaskQueue || []);
  readonly renderQueue = computed<TaskItem[]>(() => this.currentStep()?.queues.renderQueue || []);
  readonly currentPhase = computed<EventLoopPhase>(() => this.currentStep()?.phase || 'idle');
  readonly explanation = computed<string>(() => this.currentStep()?.explanation || 'Ready.');
  readonly consoleLogs = computed<ConsoleEntry[]>(() => this.currentStep()?.consoleOutput || []);

  constructor() {
    this.destroyRef.onDestroy(() => this.pause());
  }

  selectScenario(scenarioId: string): void {
    this.pause();
    this.currentScenarioId.set(scenarioId);
    this.currentStepIndex.set(0);
  }

  play(): void {
    if (this.isPlaying()) return;
    if (this.isFinished()) {
      this.currentStepIndex.set(0);
    }
    this.isPlaying.set(true);
    this.scheduleNextTick();
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  stepForward(): void {
    this.pause();
    if (this.canStepForward()) {
      this.currentStepIndex.update(i => i + 1);
    }
  }

  stepBackward(): void {
    this.pause();
    if (this.canStepBack()) {
      this.currentStepIndex.update(i => i - 1);
    }
  }

  reset(): void {
    this.pause();
    this.currentStepIndex.set(0);
  }

  setSpeed(speedMs: number): void {
    this.playbackSpeedMs.set(speedMs);
    if (this.isPlaying()) {
      clearTimeout(this.timerId);
      this.scheduleNextTick();
    }
  }

  private scheduleNextTick(): void {
    this.timerId = setTimeout(() => {
      if (!this.isPlaying()) return;
      if (this.canStepForward()) {
        this.currentStepIndex.update(i => i + 1);
        this.scheduleNextTick();
      } else {
        this.pause();
      }
    }, this.playbackSpeedMs());
  }
}
```

### 4.3 Simulation Step Generator Algorithms (in `module6.data.ts`)

The worker will implement generator functions for each scenario:
1. **Scenario 1: Mixed Concurrency Showdown (`mixed-concurrency`)**
   - Code:
     ```ts
     console.log('1. Script Start (Sync)');
     asyncScheduler.schedule(() => console.log('5. asyncScheduler (Macrotask)'));
     asapScheduler.schedule(() => console.log('3. asapScheduler (Microtask)'));
     queueScheduler.schedule(() => console.log('2. queueScheduler (Sync Trampoline)'));
     animationFrameScheduler.schedule(() => console.log('4. animationFrame (Render)'));
     console.log('2.5. Script End (Sync)');
     ```
   - Step Sequence (12 atomic states):
     1. Initial state (Call Stack: `main()`).
     2. Log `1. Script Start` (Output added, line highlight 1).
     3. `asyncScheduler.schedule` -> Enqueue Macrotask `T_ASYNC` into Macrotask Queue.
     4. `asapScheduler.schedule` -> Enqueue Microtask `T_ASAP` into Microtask Queue.
     5. `queueScheduler.schedule` -> Synchronous execution! Pushed immediately onto Call Stack -> Log `2. queueScheduler` -> Pops.
     6. `animationFrameScheduler.schedule` -> Enqueue Render task `T_RAF` into Render Queue.
     7. Log `2.5. Script End` -> `main()` pops -> Call Stack is EMPTY.
     8. Phase transition to **Microtask Queue Drain**: Dequeue `T_ASAP` to Call Stack -> Log `3. asapScheduler (Microtask)` -> Pops.
     9. Phase transition to **Render Phase**: Dequeue `T_RAF` to Call Stack -> Log `4. animationFrame (Render)` -> Pops.
     10. Phase transition to **Macrotask Execution**: Dequeue `T_ASYNC` to Call Stack -> Log `5. asyncScheduler (Macrotask)` -> Pops.
     11. All queues empty -> Status: Completed!

2. **Scenario 2: Trampoline Recursion (`trampoline-recursion`)**
   - Demonstrates recursive scheduling without call stack growth.
   - Code:
     ```ts
     queueScheduler.schedule(function(state) {
       console.log(`Trampoline recursion depth: ${state}`);
       if (state < 5) {
         this.schedule(state + 1); // Queued on trampoline!
       }
     }, 0, 1);
     ```
   - Call stack depth remains at 1 at every step while trampoline queue holds pending iterations (state: 1, 2, 3, 4, 5). Visual comparison with normal recursion (stack explosion).

3. **Scenario 3: Delay & Cancellation Race (`delay-cancellation`)**
   - Demonstrates countdown timers, `action.unsubscribe()` aborting scheduled action, and delay elapsing (`500ms`, `1000ms`).

4. **Scenario 4: Microtask FIFO Ordering (`microtask-fifo`)**
   - Demonstrates multiple `asapScheduler` tasks queued and draining strictly in FIFO order (`micro-1`, `micro-2`, `micro-3`) before macrotasks.

5. **Scenario 5: Animation Frame 60fps Synchronization (`animation-frame-sync`)**
   - Demonstrates coordination with browser refresh rate (vsync 16.6ms intervals).

### 4.4 Visualizer Component: `src/app/features/module6-schedulers/components/event-loop-visualizer/event-loop-visualizer.component.ts`

- Selector: `app-event-loop-visualizer`
- Layout:
  1. **Control Toolbar**:
     - Scenario Selector Dropdown
     - Transport Controls: `[⏮ Reset]` `[⏪ Step Back]` `[▶ Play / ⏸ Pause]` `[⏩ Step Forward]`
     - Speed Selector Pills: `0.5x (Slow)` | `1x (Normal)` | `2x (Fast)`
     - Step Indicator: `Step X / Y` with progress bar.
  2. **Phase Flow Ribbon**:
     - 4 glowing badges showing current event loop phase:
       `[ 1. Call Stack (Sync) ]` ➔ `[ 2. Microtask Queue ]` ➔ `[ 3. Render / Vsync ]` ➔ `[ 4. Macrotask Queue ]`
  3. **Event Loop Arena (Grid)**:
     - **Call Stack Frame Container**: Vertical stack displaying active execution frame with glowing border and "Depth" counter.
     - **Trampoline Queue Container**: Shows synchronous queued actions during recursive loops.
     - **Microtask Queue Container**: Amber horizontal conveyor with badge `asapScheduler / Promise`.
     - **Render Queue Container**: Purple horizontal conveyor with badge `animationFrame / 60fps`.
     - **Macrotask Queue Container**: Blue horizontal conveyor with badge `asyncScheduler / setTimeout` and delay chips.
  4. **Active Step Explanation Box**:
     - Clear narrative explanation with action icon explaining why the browser is performing this exact transition.

### 4.5 Topic Deep Dive Component: `src/app/features/module6-schedulers/scheduler-topic.component.ts`

- Parameterized standalone component for `/queue`, `/asap`, `/async`, `/animation-frame`.
- Uses `PlaygroundWrapperComponent` with 5 tabs:
  - **Concept**: Summary, principles, deep dive sections, key takeaways.
  - **Code**: `app-code-block` with highlighted code snippet and copy button.
  - **Visual Demo**:
    - For `queueScheduler`: Interactive Recursion Depth Slider (1 to 30 depth) comparing call stack depth of standard function vs `queueScheduler` trampoline.
    - For `asapScheduler`: Microtask Drain Playground with buttons to dispatch sync logs, microtasks, and macrotasks.
    - For `asyncScheduler`: Delayed Action Runner with delay slider (0-2000ms), "Schedule" button, "Cancel" button, countdown bar, and elapsed time readout.
    - For `animationFrameScheduler`: 60fps Frame Rate Ticker comparing smooth transform animation via `animationFrameScheduler` vs `setInterval(16)`.
  - **Comparison**: `app-comparison-table` with feature breakdown.
  - **Quiz**: `app-quiz-block` with 5 challenging questions.

### 4.6 Route Definitions: `src/app/features/module6-schedulers/module6.routes.ts`

```ts
import { Routes } from '@angular/router';
import { SchedulersVisualizerComponent } from './schedulers-visualizer.component';
import { SchedulerTopicComponent } from './scheduler-topic.component';

export const MODULE6_ROUTES: Routes = [
  { path: '', redirectTo: 'visualizer', pathMatch: 'full' },
  { path: 'visualizer', component: SchedulersVisualizerComponent },
  { path: 'queue', component: SchedulerTopicComponent, data: { topicId: 'queue-scheduler' } },
  { path: 'asap', component: SchedulerTopicComponent, data: { topicId: 'asap-scheduler' } },
  { path: 'async', component: SchedulerTopicComponent, data: { topicId: 'async-scheduler' } },
  { path: 'animation-frame', component: SchedulerTopicComponent, data: { topicId: 'animation-frame-scheduler' } },
];
```

### 4.7 Unit Test Plan (`*.spec.ts`)

The worker will create the following test files:
1. `src/app/features/module6-schedulers/services/event-loop-simulator.service.spec.ts`:
   - Verify initial state and scenario loading.
   - Verify `stepForward()` and `stepBackward()` maintain state transitions.
   - Verify `play()` starts interval timer and automatically pauses at end.
   - Verify speed adjustment alters tick duration.
   - Verify resetting restores step index to 0.
2. `src/app/features/module6-schedulers/components/event-loop-visualizer/event-loop-visualizer.component.spec.ts`:
   - Component creation.
   - Renders Call Stack, Microtask Queue, Macrotask Queue, Render Queue elements.
   - User clicking step buttons invokes service methods.
   - Changing speed updates active speed pill.
3. `src/app/features/module6-schedulers/schedulers-visualizer.component.spec.ts`:
   - Component creation.
   - Renders all 5 playground tabs.
   - Scenario dropdown change updates code block and simulator scenario.
4. `src/app/features/module6-schedulers/scheduler-topic.component.spec.ts`:
   - Loads topic data based on route data (`queue-scheduler`, `asap-scheduler`, etc.).
   - Interactive demos run and output to console.
   - Quiz completion tracks score.
5. `src/app/features/module6-schedulers/module6-schedulers.spec.ts` (E2E alignment tests):
   - 10 comprehensive tests directly verifying F38.1-F38.5 and F38.B1-F38.B5 in Angular Jasmine environment.

---

## 5. Verification Method

To verify the implementation once the worker finishes:

1. **Angular Development Build Verification**:
   ```bash
   npx ng build --configuration development
   ```
   *Expected Result*: Build completes with 0 errors; `module6-routes` bundle generates cleanly.
2. **Karma Unit Test Suite Execution**:
   ```bash
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected Result*: All existing tests (154) + new Module 6 tests (>25) pass with 100% success.
3. **E2E Acceptance Test Suite**:
   ```bash
   node tests/e2e/run-all-tests.js
   ```
   *Expected Result*: All 543 tests pass, including all 30 tests in Milestone M4 (`F38.1` - `F38.5` and `F38.B1` - `F38.B5`).
4. **Invalidation Conditions**:
   - Any compilation error or broken route navigation.
   - Missing one of the 4 schedulers in the visualizer or topic pages.
   - Missing play/pause/step controls or speed adjustment.
   - Incorrect event loop phase sequencing.
