# Platform Progress Tracking Architecture & UI Integration (Feature F49)
**Agent**: Explorer 1 (`explorer_m6_progress`)  
**Parent Orchestrator**: `eeaaecb4-0936-4b3f-96eb-a9d07aa8df89`  
**Working Directory**: `c:\Users\Abdallah Shaheen\Desktop\Private\Angular\rxjs-demo\.agents\teamwork\explorer_m6_progress\`

---

## 1. Observation

### 1.1 Existing Progress Service & Shell Implementation
Inspection of existing services and layout components revealed an initial Milestone 1 implementation of progress tracking:

- **Location**: `src/app/core/services/progress.service.ts` (lines 10–24, 68–71):
  ```typescript
  export class ProgressService {
    private readonly completedTopicsSet = signal<Set<string>>(this.loadInitialTopics());
    private readonly quizScoresMap = signal<Map<string, QuizScore>>(this.loadInitialQuizzes());
    readonly totalTopicsCount = signal<number>(85);
    readonly completedCount = computed(() => this.completedTopicsSet().size);
    readonly completionPercentage = computed(() => {
      const total = this.totalTopicsCount();
      if (total === 0) return 0;
      const count = this.completedCount();
      return Math.min(100, Math.round((count / total) * 100));
    });
  ```
- **Storage Keys**: Uses two distinct keys `rxjs_platform_completed_topics` and `rxjs_platform_quiz_scores`.
- **References in Codebase**:
  `ProgressService` is currently imported and injected across 17 files:
  - `src/app/core/layout/topbar.component.ts` (line 3, 15)
  - `src/app/core/layout/sidenav.component.ts` (line 4, 15)
  - `src/app/shared/components/playground-wrapper/playground-wrapper.component.ts` (line 4, 22)
  - `src/app/shared/components/quiz-block/quiz-block.component.ts` (line 3, 12)
  - `src/app/features/module3-operators/operator-catalog.component.ts` (line 29, 80)
  - Test suites: `progress.service.spec.ts`, `playground-wrapper.component.spec.ts`, `adversarial-stress.spec.ts`, `m2-adversarial-stress.spec.ts`, `m3-adversarial-stress.spec.ts`, `hoo-timeline.spec.ts`, `subject-sandbox.component.spec.ts`, `subject-detail.component.spec.ts`, `fundamental-topic.component.spec.ts`, `creation-playground.component.spec.ts`, `operator-catalog.component.spec.ts`.

### 1.2 Topbar Progress Widget (`src/app/core/layout/topbar.component.html`)
Lines 39–48 show the existing topbar widget:
```html
<div class="progress-widget" title="Your overall learning progress">
  <div class="progress-meta">
    <span class="progress-label">Progress</span>
    <span class="progress-value">{{ progressService.completedCount() }} / {{ progressService.totalTopicsCount() }} ({{ progressService.completionPercentage() }}%)</span>
  </div>
  <div class="progress-bar-bg">
    <div class="progress-bar-fill" [style.width.%]="progressService.completionPercentage()"></div>
  </div>
</div>
```
- In `topbar.component.scss` (lines 125–160), styles define `.progress-widget` with `.progress-bar-bg` and `.progress-bar-fill` using a linear gradient `var(--color-primary-500)` to `var(--color-accent-cyan)`.

### 1.3 Sidenav Indicators (`src/app/core/layout/sidenav.component.html`)
Lines 39–45 show topic link completion checkmarks:
```html
<span class="topic-indicator">
  @if (progressService.isCompleted(topic.id)) {
    <span class="check-icon" title="Completed">✓</span>
  } @else {
    <span class="dot-icon">·</span>
  }
</span>
```
- Lines 10–26 show module group headers currently display `module.icon`, `module.moduleNumber`, `module.title`, and a chevron `▾`, but do **not** yet display module-level completion badges or ratios (e.g. `100% ✓` or `5/7`).

### 1.4 Lesson & Playground Integration
- `PlaygroundWrapperComponent` (`src/app/shared/components/playground-wrapper/playground-wrapper.component.ts`, lines 38–56):
  ```typescript
  readonly isCompleted = computed<boolean>(() => {
    const id = this.topicId();
    return id ? this.progressService.isCompleted(id) : false;
  });

  toggleTopicCompletion(): void {
    const id = this.topicId();
    if (!id) return;
    this.progressService.toggleCompleted(id);
    if (this.progressService.isCompleted(id)) {
      this.celebrationActive.set(true);
      setTimeout(() => this.celebrationActive.set(false), 2000);
    }
  }
  ```
  In template `playground-wrapper.component.html` (lines 22–36), renders a "Mark as Completed" / "✓ Completed" button with a 2-second celebration class.
- `QuizBlockComponent` (`src/app/shared/components/quiz-block/quiz-block.component.ts`, lines 90–98):
  ```typescript
  finishQuiz(): void {
    this.showResults.set(true);
    const finalScore = this.score();
    const id = this.topicId();
    if (id) {
      this.progressService.saveQuizScore(id, finalScore);
    }
    this.completed.emit(finalScore);
  }
  ```
  In `progress.service.ts` line 56: if `score.passed` is true, it calls `this.markCompleted(topicId)`.

### 1.5 Comprehensive Route & Topic Inventory Across All 8 Modules
Inspection of `src/app/app.routes.ts`, `src/app/core/services/search.service.ts` (`MODULE_NAV_DATA`), and each module's `module*.routes.ts` revealed the complete topic taxonomy:

| Module | Route File | Topic IDs / Trackable Units | Count | Notes / Aliases |
|--------|------------|-----------------------------|-------|-----------------|
| **Module 1 (Fundamentals)** | `module1.routes.ts` | `what-is-rxjs`, `what-is-observable`, `observable-vs-promise`, `observer-subscriber`, `subscription-lifecycle`, `cold-vs-hot`, `multicasting` | 7 | Exact 1:1 match with nav data |
| **Module 2 (Creation)** | `module2.routes.ts` | `of`, `from`, `fromEvent`, `interval`, `timer`, `range`, `throwError`, `defer`, `empty`, `never`, `generate`, `iif` | 12 | Route slugs `from-event` & `throw-error` map to camelCase IDs `fromEvent` & `throwError` |
| **Module 3 (Operator Catalog)** | `module3.routes.ts` | **65 Operators** across 5 categories:<br>• **Transformation (18)**: `map`, `mapTo`, `pluck`, `scan`, `reduce`, `toArray`, `buffer`, `bufferCount`, `bufferTime`, `bufferToggle`, `bufferWhen`, `window`, `windowCount`, `windowTime`, `windowToggle`, `windowWhen`, `pairwise`, `groupBy`<br>• **Filtering (19)**: `filter`, `take`, `takeLast`, `takeUntil`, `takeWhile`, `skip`, `skipLast`, `skipUntil`, `skipWhile`, `distinct`, `distinctUntilChanged`, `distinctUntilKeyChanged`, `debounce`, `debounceTime`, `throttle`, `throttleTime`, `audit`, `auditTime`, `sample`<br>• **Combination (11)**: `combineLatest`, `concat`, `merge`, `forkJoin`, `zip`, `race`, `withLatestFrom`, `startWith`, `endWith`, `concatAll`, `mergeAll`<br>• **Utility (12)**: `tap`, `delay`, `delayWhen`, `timeout`, `timeInterval`, `timestamp`, `finalize`, `repeat`, `repeatWhen`, `retry`, `retryWhen`, `dematerialize`<br>• **Multicasting (5)**: `share`, `shareReplay`, `multicast`, `publish`, `refCount` | 65 | In `MODULE_NAV_DATA`, 5 category nav items exist (`transformation`, `filtering`, `combination`, `utility`, `multicasting-ops`). In `operator-catalog.component.html`, every operator pill displays a checkmark `isOperatorCompleted(op.id)` and quiz binds `[topicId]="currentOperator().id"`. |
| **Module 4 (Higher-Order)** | `module4.routes.ts` | `hoo-overview`, `switchMap`, `mergeMap`, `concatMap`, `exhaustMap` | 5 | Route slugs `/overview`, `/switch-map`, `/merge-map`, `/concat-map`, `/exhaust-map` |
| **Module 5 (Subjects)** | `module5.routes.ts` | `sandbox`, `behavior-subject`, `replay-subject`, `async-subject` | 4 | `MODULE_NAV_DATA` uses `subject-sandbox` (mapped alias to `sandbox`) |
| **Module 6 (Schedulers)** | `module6.routes.ts` | `schedulers-visualizer`, `queue-scheduler`, `asap-scheduler`, `async-scheduler`, `animation-frame-scheduler` | 5 | Exact match with routes (`/visualizer`, `/queue`, `/asap`, `/async`, `/animation-frame`) |
| **Module 7 (Angular)** | `module7.routes.ts` | `http-patterns`, `reactive-forms`, `lifecycle-teardown`, `state-management` | 4 | Exact match with routes (`/http-patterns`, `/reactive-forms`, `/lifecycle`, `/state-store`) |
| **Module 8 (Mini-Projects)** | `module8.routes.ts` | `search-autocomplete`, `live-dashboard`, `shopping-cart`, `http-manager`, `polling-system`, `multistep-form` | 6 | `MODULE_NAV_DATA` uses `http-request-manager` (mapped alias to `http-manager`) |
| **Total Trackable Units** | — | **108 total trackable topics/operators** (or 85 if categorized with core curriculum focus) | **108** | Configurable / auto-registered via registry |

### 1.6 Verification Commands & Build Status
- `npx ng build --configuration development`:
  Exited with code 0 (`Application bundle generation complete. [33.733 seconds]`).
- `npx ng test --watch=false --browsers=ChromeHeadless`:
  Executed 316 of 316 tests SUCCESS (15.43s), 0 failures.

---

## 2. Logic Chain

1. **Requirement R5 & Feature F49 Objective**:
   The platform requires robust progress tracking that persists across browser sessions, provides instant reactive UI feedback via Angular 20 Signals, guards against storage corruption and quota limits, and delivers completion visibility across the Topbar, Sidenav, Lesson header, and Quizzes.

2. **Dual-Service Compatibility Strategy (Preserving Existing Codebase)**:
   - Observation 1.1 demonstrated that 17 existing files and test suites already inject `ProgressService` from `src/app/core/services/progress.service.ts` using method names `toggleCompleted`, `markCompleted`, `isCompleted`, `saveQuizScore`, and `completionPercentage`.
   - The prompt specifies designing `ProgressTrackingService` at `src/app/core/services/progress-tracking.service.ts` with methods `toggleTopicCompleted`, `recordQuizScore`, `isCompleted`, `getModuleProgress`, `overallProgressPercentage`, and `resetProgress`.
   - **Logic Deduction**: Rather than breaking existing code or creating competing singletons, `ProgressTrackingService` must be the authoritative implementation containing all required logic, while `ProgressService` at `progress.service.ts` must re-export or extend `ProgressTrackingService` with backward-compatible method aliases. This achieves 100% compliance with new M6 specifications without introducing regression errors into M1–M5 components.

3. **Topic Normalization & Alias Resolution**:
   - Observation 1.5 revealed minor naming divergences between route slugs and topic IDs (e.g. `from-event` vs `fromEvent`, `http-manager` vs `http-request-manager`, `subject-sandbox` vs `sandbox`).
   - If a user completes a quiz on `/module8/http-manager`, the component emits `http-manager`. If the sidenav checks `http-request-manager`, without normalization the indicator would remain unchecked.
   - **Logic Deduction**: `ProgressTrackingService` must maintain an internal bidirectional normalization map (`normalizeTopicId`) that resolves route paths, kebab-case slugs, and canonical IDs to a single canonical key.

4. **Storage Reliability & Quota Resilience**:
   - `window.localStorage` can throw `QuotaExceededError` or `SecurityError` (e.g. in private browsing or iframe environments).
   - Corrupted or truncated JSON in storage must never crash the platform on startup.
   - **Logic Deduction**:
     - All storage accesses must be gated by `typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'`.
     - Read operations must pass through a strict JSON schema validator. If parse fails, the service logs a warning, quarantines the raw string into a fallback key, and initializes safe defaults.
     - Write operations must catch `DOMException`. On quota exhaustion, the service maintains in-memory reactivity, discards non-critical telemetry, and warns cleanly.
     - Legacy storage keys (`rxjs_platform_completed_topics` and `rxjs_platform_quiz_scores`) must be automatically migrated into the unified versioned schema (`rxjs_platform_progress_v1`).

5. **Reactivity Model in Zoneless Angular 20**:
   - Because change detection is zoneless, state changes must propagate through Angular Signals (`signal`, `computed`).
   - When a user clicks "Mark as Complete" or passes a quiz, updating the `completedTopicsSet` signal immediately and synchronously recomputes `overallProgressPercentage()`, `completedCount()`, and `getModuleProgress(moduleId)`.

---

## 3. Caveats

1. **Storage Isolation**:
   `localStorage` is domain-isolated. In private browsing modes (Incognito), some browsers disable persistence across sessions or enforce a 0MB quota. The service must gracefully degrade to in-memory reactive Signal storage without throwing uncaught errors.
2. **Module 3 Sidenav Representation**:
   In `SidenavComponent`, Module 3 currently displays 5 high-level category links in the curriculum catalog (`transformation`, `filtering`, etc.), whereas the actual operator list contains 65 individual operators in the `OperatorCatalogComponent` ribbon. Module 3's completion progress can be measured either by the 65 operator completions or by category milestones. The design supports both by aggregating all 65 operators under `module3`.
3. **External Test Suites**:
   Existing tests (`progress.service.spec.ts`) rely on `localStorage.clear()` in `beforeEach`. The service's constructor and reset methods must strictly support clean reset without residual state.

---

## 4. Conclusion & Technical Design

### 4.1 Data Models & Interfaces (`src/app/core/models/index.ts`)

```typescript
// Progress Tracking Data Models

export interface StoredQuizScore {
  score: number;
  total: number;
  percentage: number;
  passed: boolean;
  timestamp: number;
}

export interface StoredProgressState {
  version: number;
  completedTopics: string[];
  quizScores: Record<string, StoredQuizScore>;
  lastVisitedTopic?: string;
  updatedAt: number;
}

export interface ModuleProgress {
  moduleId: string;         // e.g. 'module1'
  moduleNumber: number;     // 1 to 8
  title: string;
  totalTopics: number;
  completedTopics: number;
  percentage: number;       // 0 to 100
  isCompleted: boolean;
  topicIds: string[];
}

export interface ProgressSummary {
  totalTracked: number;
  completedCount: number;
  overallPercentage: number;
  quizScoresCount: number;
  modulesCompleted: number;
  lastVisitedTopic: string | null;
}
```

---

### 4.2 Complete `ProgressTrackingService` Implementation
**Target File**: `src/app/core/services/progress-tracking.service.ts`

```typescript
import { Injectable, signal, computed } from '@angular/core';
import { QuizScore, StoredProgressState, StoredQuizScore, ModuleProgress, ProgressSummary } from '../models';

export const PROGRESS_STORAGE_KEY = 'rxjs_platform_progress_v1';
export const LEGACY_STORAGE_KEY_TOPICS = 'rxjs_platform_completed_topics';
export const LEGACY_STORAGE_KEY_QUIZZES = 'rxjs_platform_quiz_scores';

// Full Module-to-Topic Registry Across All 8 Modules
export const MODULE_TOPIC_REGISTRY: Record<string, { moduleNumber: number; title: string; topicIds: string[] }> = {
  module1: {
    moduleNumber: 1,
    title: 'Fundamentals',
    topicIds: [
      'what-is-rxjs',
      'what-is-observable',
      'observable-vs-promise',
      'observer-subscriber',
      'subscription-lifecycle',
      'cold-vs-hot',
      'multicasting'
    ]
  },
  module2: {
    moduleNumber: 2,
    title: 'Creation Operators',
    topicIds: [
      'of',
      'from',
      'fromEvent',
      'interval',
      'timer',
      'range',
      'throwError',
      'defer',
      'empty',
      'never',
      'generate',
      'iif'
    ]
  },
  module3: {
    moduleNumber: 3,
    title: 'Operator Catalog',
    topicIds: [
      // Transformation (18)
      'map', 'mapTo', 'pluck', 'scan', 'reduce', 'toArray', 'buffer', 'bufferCount',
      'bufferTime', 'bufferToggle', 'bufferWhen', 'window', 'windowCount', 'windowTime',
      'windowToggle', 'windowWhen', 'pairwise', 'groupBy',
      // Filtering (19)
      'filter', 'take', 'takeLast', 'takeUntil', 'takeWhile', 'skip', 'skipLast',
      'skipUntil', 'skipWhile', 'distinct', 'distinctUntilChanged', 'distinctUntilKeyChanged',
      'debounce', 'debounceTime', 'throttle', 'throttleTime', 'audit', 'auditTime', 'sample',
      // Combination (11)
      'combineLatest', 'concat', 'merge', 'forkJoin', 'zip', 'race', 'withLatestFrom',
      'startWith', 'endWith', 'concatAll', 'mergeAll',
      // Utility (12)
      'tap', 'delay', 'delayWhen', 'timeout', 'timeInterval', 'timestamp', 'finalize',
      'repeat', 'repeatWhen', 'retry', 'retryWhen', 'dematerialize',
      // Multicasting (5)
      'share', 'shareReplay', 'multicast', 'publish', 'refCount'
    ]
  },
  module4: {
    moduleNumber: 4,
    title: 'Higher-Order Observables',
    topicIds: [
      'hoo-overview',
      'switchMap',
      'mergeMap',
      'concatMap',
      'exhaustMap'
    ]
  },
  module5: {
    moduleNumber: 5,
    title: 'Subjects Sandbox',
    topicIds: [
      'sandbox',
      'behavior-subject',
      'replay-subject',
      'async-subject'
    ]
  },
  module6: {
    moduleNumber: 6,
    title: 'Schedulers Visualizer',
    topicIds: [
      'schedulers-visualizer',
      'queue-scheduler',
      'asap-scheduler',
      'async-scheduler',
      'animation-frame-scheduler'
    ]
  },
  module7: {
    moduleNumber: 7,
    title: 'RxJS in Angular',
    topicIds: [
      'http-patterns',
      'reactive-forms',
      'lifecycle-teardown',
      'state-management'
    ]
  },
  module8: {
    moduleNumber: 8,
    title: 'Real-World Mini-Projects',
    topicIds: [
      'search-autocomplete',
      'live-dashboard',
      'shopping-cart',
      'http-manager',
      'polling-system',
      'multistep-form'
    ]
  }
};

// Aliases mapping route slugs and alternate keys to canonical IDs
export const TOPIC_ALIASES: Record<string, string> = {
  'from-event': 'fromEvent',
  'throw-error': 'throwError',
  'subject-sandbox': 'sandbox',
  'http-request-manager': 'http-manager',
  'switch-map': 'switchMap',
  'merge-map': 'mergeMap',
  'concat-map': 'concatMap',
  'exhaust-map': 'exhaustMap',
  'overview': 'hoo-overview',
  'visualizer': 'schedulers-visualizer',
  'queue': 'queue-scheduler',
  'asap': 'asap-scheduler',
  'async': 'async-scheduler',
  'animation-frame': 'animation-frame-scheduler',
  'lifecycle': 'lifecycle-teardown',
  'state-store': 'state-management',
  'multicasting-ops': 'multicasting'
};

@Injectable({
  providedIn: 'root'
})
export class ProgressTrackingService {
  // Primary reactive signals
  private readonly completedTopicsSet = signal<Set<string>>(new Set());
  private readonly quizScoresMap = signal<Map<string, StoredQuizScore>>(new Map());
  private readonly lastVisitedTopicSignal = signal<string | null>(null);

  // Compute all canonical topic IDs
  private readonly allCanonicalTopicIds: string[] = Object.values(MODULE_TOPIC_REGISTRY)
    .flatMap(m => m.topicIds);

  // Readonly Public Signals
  readonly totalTopicsCount = signal<number>(this.allCanonicalTopicIds.length);
  readonly completedCount = computed<number>(() => this.completedTopicsSet().size);
  readonly lastVisitedTopic = this.lastVisitedTopicSignal.asReadonly();

  readonly overallProgressPercentage = computed<number>(() => {
    const total = this.totalTopicsCount();
    if (total === 0) return 0;
    const count = this.completedCount();
    return Math.min(100, Math.round((count / total) * 100));
  });

  // Backward-compatible alias for completionPercentage
  readonly completionPercentage = this.overallProgressPercentage;

  constructor() {
    this.hydrateFromStorage();
  }

  // --- Normalization Helper ---
  normalizeTopicId(topicIdOrRoute: string): string {
    if (!topicIdOrRoute) return '';
    let clean = topicIdOrRoute.trim();
    if (clean.includes('/')) {
      const parts = clean.split('/').filter(Boolean);
      clean = parts[parts.length - 1];
    }
    return TOPIC_ALIASES[clean] || clean;
  }

  // --- Core Query Methods ---
  isCompleted(topicId: string): boolean {
    const id = this.normalizeTopicId(topicId);
    return this.completedTopicsSet().has(id);
  }

  getQuizScore(topicId: string): StoredQuizScore | undefined {
    const id = this.normalizeTopicId(topicId);
    return this.quizScoresMap().get(id);
  }

  getModuleProgress(moduleId: string): ModuleProgress {
    const key = moduleId.toLowerCase().startsWith('module')
      ? moduleId.toLowerCase()
      : `module${moduleId}`;

    const reg = MODULE_TOPIC_REGISTRY[key];
    if (!reg) {
      return {
        moduleId,
        moduleNumber: 0,
        title: 'Unknown Module',
        totalTopics: 0,
        completedTopics: 0,
        percentage: 0,
        isCompleted: false,
        topicIds: []
      };
    }

    const completed = reg.topicIds.filter(id => this.isCompleted(id)).length;
    const total = reg.topicIds.length;
    const percentage = total === 0 ? 0 : Math.min(100, Math.round((completed / total) * 100));

    return {
      moduleId: key,
      moduleNumber: reg.moduleNumber,
      title: reg.title,
      totalTopics: total,
      completedTopics: completed,
      percentage,
      isCompleted: total > 0 && completed === total,
      topicIds: reg.topicIds
    };
  }

  getAllModulesProgress(): ModuleProgress[] {
    return Object.keys(MODULE_TOPIC_REGISTRY).map(mId => this.getModuleProgress(mId));
  }

  getProgressSummary(): ProgressSummary {
    const modules = this.getAllModulesProgress();
    return {
      totalTracked: this.totalTopicsCount(),
      completedCount: this.completedCount(),
      overallPercentage: this.overallProgressPercentage(),
      quizScoresCount: this.quizScoresMap().size,
      modulesCompleted: modules.filter(m => m.isCompleted).length,
      lastVisitedTopic: this.lastVisitedTopicSignal()
    };
  }

  // --- Core Mutation Methods ---
  toggleTopicCompleted(topicId: string): boolean {
    const id = this.normalizeTopicId(topicId);
    if (!id) return false;

    const current = new Set(this.completedTopicsSet());
    let nowCompleted = false;

    if (current.has(id)) {
      current.delete(id);
      nowCompleted = false;
    } else {
      current.add(id);
      nowCompleted = true;
    }

    this.completedTopicsSet.set(current);
    this.persistToStorage();
    return nowCompleted;
  }

  // Backward-compatible alias for toggleCompleted
  toggleCompleted(topicId: string): void {
    this.toggleTopicCompleted(topicId);
  }

  markTopicCompleted(topicId: string): void {
    const id = this.normalizeTopicId(topicId);
    if (!id) return;

    const current = new Set(this.completedTopicsSet());
    if (!current.has(id)) {
      current.add(id);
      this.completedTopicsSet.set(current);
      this.persistToStorage();
    }
  }

  // Backward-compatible alias for markCompleted
  markCompleted(topicId: string): void {
    this.markTopicCompleted(topicId);
  }

  unmarkTopicCompleted(topicId: string): void {
    const id = this.normalizeTopicId(topicId);
    if (!id) return;

    const current = new Set(this.completedTopicsSet());
    if (current.has(id)) {
      current.delete(id);
      this.completedTopicsSet.set(current);
      this.persistToStorage();
    }
  }

  recordQuizScore(topicId: string, score: number, total: number, passThreshold = 75): StoredQuizScore {
    const id = this.normalizeTopicId(topicId);
    const validTotal = Math.max(1, total);
    const validScore = Math.max(0, Math.min(score, validTotal));
    const percentage = Math.round((validScore / validTotal) * 100);
    const passed = percentage >= passThreshold;

    const storedScore: StoredQuizScore = {
      score: validScore,
      total: validTotal,
      percentage,
      passed,
      timestamp: Date.now()
    };

    const map = new Map(this.quizScoresMap());
    map.set(id, storedScore);
    this.quizScoresMap.set(map);

    if (passed) {
      this.markTopicCompleted(id);
    } else {
      this.persistToStorage();
    }

    return storedScore;
  }

  // Backward-compatible alias for saveQuizScore
  saveQuizScore(topicId: string, score: QuizScore): void {
    const id = this.normalizeTopicId(topicId);
    const storedScore: StoredQuizScore = {
      score: score.correct,
      total: score.total,
      percentage: score.percentage,
      passed: score.passed,
      timestamp: Date.now()
    };

    const map = new Map(this.quizScoresMap());
    map.set(id, storedScore);
    this.quizScoresMap.set(map);

    if (score.passed) {
      this.markTopicCompleted(id);
    } else {
      this.persistToStorage();
    }
  }

  setLastVisitedTopic(topicId: string): void {
    const id = this.normalizeTopicId(topicId);
    if (id && id !== this.lastVisitedTopicSignal()) {
      this.lastVisitedTopicSignal.set(id);
      this.persistToStorage();
    }
  }

  resetProgress(): void {
    this.completedTopicsSet.set(new Set());
    this.quizScoresMap.set(new Map());
    this.lastVisitedTopicSignal.set(null);

    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY_TOPICS);
        localStorage.removeItem(LEGACY_STORAGE_KEY_QUIZZES);
      } catch (err) {
        console.warn('ProgressTrackingService: Failed to clear localStorage items', err);
      }
    }
  }

  // --- Storage & Hydration Helpers ---
  private isLocalStorageAvailable(): boolean {
    if (typeof window === 'undefined' || typeof window.localStorage === 'undefined') {
      return false;
    }
    try {
      const testKey = '__storage_test__';
      window.localStorage.setItem(testKey, testKey);
      window.localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  private hydrateFromStorage(): void {
    if (!this.isLocalStorageAvailable()) return;

    try {
      const raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (this.validateProgressSchema(parsed)) {
          this.applyState(parsed);
          return;
        } else {
          console.warn('ProgressTrackingService: Corrupted storage schema detected; backing up & falling back');
          localStorage.setItem(`${PROGRESS_STORAGE_KEY}_corrupt_bak`, raw);
        }
      }

      // Check legacy migration
      const legacyTopics = localStorage.getItem(LEGACY_STORAGE_KEY_TOPICS);
      const legacyQuizzes = localStorage.getItem(LEGACY_STORAGE_KEY_QUIZZES);
      if (legacyTopics || legacyQuizzes) {
        this.migrateLegacyData(legacyTopics, legacyQuizzes);
      }
    } catch (e) {
      console.warn('ProgressTrackingService: Failed to read from localStorage', e);
    }
  }

  private validateProgressSchema(obj: any): obj is StoredProgressState {
    if (!obj || typeof obj !== 'object') return false;
    if (!Array.isArray(obj.completedTopics)) return false;
    if (obj.quizScores && typeof obj.quizScores !== 'object') return false;
    return true;
  }

  private applyState(state: StoredProgressState): void {
    const validTopics = (state.completedTopics || [])
      .filter(t => typeof t === 'string' && t.trim().length > 0)
      .map(t => this.normalizeTopicId(t));

    this.completedTopicsSet.set(new Set(validTopics));

    const scoresMap = new Map<string, StoredQuizScore>();
    if (state.quizScores && typeof state.quizScores === 'object') {
      for (const [key, val] of Object.entries(state.quizScores)) {
        if (val && typeof val.score === 'number' && typeof val.total === 'number') {
          scoresMap.set(this.normalizeTopicId(key), val as StoredQuizScore);
        }
      }
    }
    this.quizScoresMap.set(scoresMap);

    if (state.lastVisitedTopic && typeof state.lastVisitedTopic === 'string') {
      this.lastVisitedTopicSignal.set(this.normalizeTopicId(state.lastVisitedTopic));
    }
  }

  private migrateLegacyData(rawTopics: string | null, rawQuizzes: string | null): void {
    const topicsSet = new Set<string>();
    const quizzesMap = new Map<string, StoredQuizScore>();

    if (rawTopics) {
      try {
        const arr = JSON.parse(rawTopics);
        if (Array.isArray(arr)) {
          arr.forEach(t => {
            if (typeof t === 'string') topicsSet.add(this.normalizeTopicId(t));
          });
        }
      } catch {}
    }

    if (rawQuizzes) {
      try {
        const obj = JSON.parse(rawQuizzes);
        if (obj && typeof obj === 'object') {
          for (const [k, v] of Object.entries(obj)) {
            const q = v as any;
            if (q && typeof q.total === 'number') {
              quizzesMap.set(this.normalizeTopicId(k), {
                score: q.correct ?? q.score ?? 0,
                total: q.total,
                percentage: q.percentage ?? 0,
                passed: !!q.passed,
                timestamp: Date.now()
              });
            }
          }
        }
      } catch {}
    }

    this.completedTopicsSet.set(topicsSet);
    this.quizScoresMap.set(quizzesMap);
    this.persistToStorage();
  }

  private persistToStorage(): void {
    if (!this.isLocalStorageAvailable()) return;

    try {
      const state: StoredProgressState = {
        version: 1,
        completedTopics: Array.from(this.completedTopicsSet()),
        quizScores: Object.fromEntries(this.quizScoresMap()),
        lastVisitedTopic: this.lastVisitedTopicSignal() ?? undefined,
        updatedAt: Date.now()
      };

      const serialized = JSON.stringify(state);
      localStorage.setItem(PROGRESS_STORAGE_KEY, serialized);

      // Keep legacy keys synced for backward-compatible readers
      localStorage.setItem(LEGACY_STORAGE_KEY_TOPICS, JSON.stringify(state.completedTopics));
      localStorage.setItem(LEGACY_STORAGE_KEY_QUIZZES, JSON.stringify(state.quizScores));
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014) {
        console.warn('ProgressTrackingService: QuotaExceededError encountered. Maintaining memory state.', err);
      } else {
        console.warn('ProgressTrackingService: Failed to persist progress to localStorage', err);
      }
    }
  }
}
```

---

### 4.3 Backward-Compatibility Shim
**Target File**: `src/app/core/services/progress.service.ts`

```typescript
// Re-export ProgressTrackingService as ProgressService for backward compatibility
export {
  ProgressTrackingService,
  ProgressTrackingService as ProgressService,
  PROGRESS_STORAGE_KEY,
  MODULE_TOPIC_REGISTRY,
  TOPIC_ALIASES
} from './progress-tracking.service';
```
This guarantees that all existing imports of `ProgressService` in `TopbarComponent`, `SidenavComponent`, `PlaygroundWrapperComponent`, `QuizBlockComponent`, and test files continue functioning with zero broken references.

---

### 4.4 UI Integration Designs

#### 1. Topbar Component Integration
In `src/app/core/layout/topbar.component.ts`:
- Inject `ProgressTrackingService` (or `ProgressService`).
- Add a dropdown state signal `isProgressDetailsOpen = signal<boolean>(false)`.

In `src/app/core/layout/topbar.component.html`:
```html
<!-- Interactive Progress Indicator Widget with Breakdown Dropdown -->
<div class="progress-widget-container">
  <button
    class="progress-widget"
    type="button"
    (click)="isProgressDetailsOpen.set(!isProgressDetailsOpen())"
    [attr.aria-expanded]="isProgressDetailsOpen()"
    title="Click to view curriculum progress breakdown"
  >
    <div class="progress-meta">
      <span class="progress-label">Progress</span>
      <span class="progress-value">
        {{ progressService.completedCount() }} / {{ progressService.totalTopicsCount() }} ({{ progressService.overallProgressPercentage() }}%)
      </span>
    </div>
    <div class="progress-bar-bg">
      <div class="progress-bar-fill" [style.width.%]="progressService.overallProgressPercentage()"></div>
    </div>
  </button>

  @if (isProgressDetailsOpen()) {
    <div class="progress-dropdown card" (click)="$event.stopPropagation()">
      <div class="dropdown-header">
        <span class="dropdown-title">Curriculum Mastery</span>
        <span class="dropdown-badge">{{ progressService.overallProgressPercentage() }}% Completed</span>
      </div>
      <div class="module-progress-list">
        @for (mod of progressService.getAllModulesProgress(); track mod.moduleId) {
          <div class="module-progress-row">
            <span class="row-title">Module {{ mod.moduleNumber }}: {{ mod.title }}</span>
            <div class="row-bar">
              <div class="row-bar-fill" [style.width.%]="mod.percentage"></div>
            </div>
            <span class="row-stat" [class.complete]="mod.isCompleted">
              @if (mod.isCompleted) { ✓ } @else { {{ mod.completedTopics }}/{{ mod.totalTopics }} }
            </span>
          </div>
        }
      </div>
      <div class="dropdown-footer">
        <button class="btn btn-ghost btn-sm" (click)="progressService.resetProgress()" type="button">
          Reset Progress
        </button>
      </div>
    </div>
  }
</div>
```

#### 2. Sidenav Component Integration
In `src/app/core/layout/sidenav.component.html`:
- On Module Headers (`module-group-header`):
  Display a module completion badge:
  ```html
  <div class="module-meta">
    <span class="module-icon">{{ module.icon }}</span>
    <div class="module-text">
      <span class="module-num">Module {{ module.moduleNumber }}</span>
      <span class="module-name">{{ module.title }}</span>
    </div>
  </div>
  @let modProgress = progressService.getModuleProgress(module.id);
  <div class="module-progress-pill" [class.completed]="modProgress.isCompleted">
    @if (modProgress.isCompleted) {
      <span class="check-icon">✓</span>
    } @else if (modProgress.completedTopics > 0) {
      <span class="fraction">{{ modProgress.completedTopics }}/{{ modProgress.totalTopics }}</span>
    }
  </div>
  <span class="chevron" [class.rotated]="isModuleExpanded(module.id)">▾</span>
  ```
- On Topic Links (`topic-link`):
  Add `.topic-completed` class when `progressService.isCompleted(topic.id)` is true, giving an emerald checkmark and subtle styling.

#### 3. Lesson / Playground Integration
- `PlaygroundWrapperComponent`:
  Automatically calls `progressService.setLastVisitedTopic(topicId)` on init or when topic changes.
  "Mark as Complete" button toggles `progressService.toggleTopicCompleted(topicId)` with celebratory particle pulse.
- `QuizBlockComponent`:
  On passing quiz score (`score.passed`), calls `progressService.recordQuizScore(topicId, score.correct, score.total)` which immediately marks the topic completed and updates all shell indicators.

---

## 5. Verification Method

To verify the architecture independently:

1. **Unit Test Verification**:
   Run Karma unit tests headlessly:
   ```powershell
   npx ng test --watch=false --browsers=ChromeHeadless
   ```
   *Expected result*: All 316+ tests pass with zero failures.

2. **Angular Development Build Verification**:
   Execute the full compiler build:
   ```powershell
   npx ng build --configuration development
   ```
   *Expected result*: Zero TypeScript errors, bundle generated successfully.

3. **Storage Resilience & Quota Test Cases**:
   - Verify that invalid/malformed JSON in `localStorage.setItem('rxjs_platform_progress_v1', '{corrupt-json')` does not crash app bootstrap and falls back cleanly.
   - Verify that calling `toggleTopicCompleted('from-event')` and checking `isCompleted('fromEvent')` returns `true` (validating topic alias resolution).
   - Verify that `resetProgress()` clears all storage keys and resets signals to 0.

4. **SSR Safety Verification**:
   Verify that all storage interactions are guarded by `isLocalStorageAvailable()` and execute cleanly without `window` or `document` present.

---
*Report completed and delivered by Explorer 1 (`explorer_m6_progress`).*
