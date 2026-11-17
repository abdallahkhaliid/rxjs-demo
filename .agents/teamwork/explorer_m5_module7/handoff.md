# Handoff Report: Module 7 — RxJS in Angular Recipes Architecture & Implementation Plan

## 1. Observation

### Codebase & Route Inspection
1. **Existing Routes**: In `src/app/app.routes.ts` (lines 39–41):
   ```typescript
   {
     path: 'module7',
     loadChildren: () => import('./features/module7-angular/module7.routes').then(m => m.MODULE7_ROUTES)
   }
   ```
   Currently in `src/app/features/module7-angular/module7.routes.ts` (lines 1–11):
   ```typescript
   import { Routes } from '@angular/router';
   import { StubTopicComponent } from '../stub-topic.component';

   export const MODULE7_ROUTES: Routes = [
     { path: '', redirectTo: 'http-patterns', pathMatch: 'full' },
     { path: 'http-patterns', component: StubTopicComponent },
     { path: 'reactive-forms', component: StubTopicComponent },
     { path: 'lifecycle', component: StubTopicComponent },
     { path: 'state-store', component: StubTopicComponent },
   ];
   ```
2. **Curriculum Index & Search Alignment**: In `src/app/core/services/search.service.ts` (lines 104–116):
   - Module 7 Title: `RxJS in Angular`
   - Topic 1: `id: 'http-patterns'`, `title: 'HTTP Patterns & Caching'`, `path: '/module7/http-patterns'`, `difficulty: 'intermediate'`
   - Topic 2: `id: 'reactive-forms'`, `title: 'Reactive Forms with Debounce'`, `path: '/module7/reactive-forms'`, `difficulty: 'intermediate'`
   - Topic 3: `id: 'lifecycle-teardown'`, `title: 'Lifecycle & takeUntilDestroyed'`, `path: '/module7/lifecycle'`, `difficulty: 'intermediate'`
   - Topic 4: `id: 'state-management'`, `title: 'BehaviorSubject State Store'`, `path: '/module7/state-store'`, `difficulty: 'advanced'`
3. **Express Server Endpoints**: In `server/server.ts` and route files:
   - `GET /api/courses/:id` (`get-course.route.ts`) returns course data with lessons.
   - `PUT /api/courses/:id` (`save-course-route.ts`) updates course in memory and returns updated course.
   - `GET /api/slow?delay=2000&tag=...` (`slow.route.ts`) returns delayed response.
   - `GET /api/simulate-error?rate=0.3&statusCode=500&attempt=1` (`simulate-error.route.ts`) simulates transient 500 or client errors with configurable failure rate.
4. **E2E Test Specifications**:
   - `tests/e2e/tier1-features/t1-angular-mini-projects.js`:
     - **F39.1–F39.5**:
       - `F39.1`: `shareReplay({ bufferSize: 1, refCount: true })` caches response across subscribers (network call count = 1).
       - `F39.2`: Exponential backoff retry policy retries transient errors with delay (`retry({ count: 3, delay: (err, count) => timer(count * 5) })`).
       - `F39.3`: `catchError` provides fallback payload on unrecoverable HTTP failure.
       - `F39.4`: Refresh Subject triggers re-fetching without creating extra subscriptions (`refresh$.pipe(startWith(null), switchMap(() => ...))`).
       - `F39.5`: Parallel HTTP requests combine via `combineLatest` / `forkJoin` for aggregated view data.
     - **F40.1–F40.5**:
       - `F40.1`: Form `valueChanges` pipeline applies `debounceTime(400)` to reduce auto-save events.
       - `F40.2`: `distinctUntilChanged` suppresses auto-save when value has not changed.
       - `F40.3`: `filter` operator ensures only valid form states proceed to auto-save.
       - `F40.4`: `switchMap` to HTTP PUT cancels pending save when new form modification occurs.
       - `F40.5`: Cross-field reactive dependencies: Field A updates Field B options.
     - **F41.1–F41.5**:
       - `F41.1`: Automatically unhooks active stream upon component destruction.
       - `F41.2`: Unmanaged subscriptions accumulate and cause memory leaks.
       - `F41.3`: Teardown logic executes immediately on component destruction (`finalize`).
       - `F41.4`: Works cleanly with periodic intervals and prevents background processing.
       - `F41.5`: Streams already completed before component destroy do not error on destroy.
     - **F42.1–F42.5**:
       - `F42.1`: Store initializes with initial state immutably.
       - `F42.2`: `select()` emits current slice value immediately to subscriber.
       - `F42.3`: `update()` mutates state and notifies selectors.
       - `F42.4`: Selectors ignore mutations in unrelated state branches.
       - `F42.5`: Signal bridge simulation synchronizes store state reactively (`toSignal`).
   - `tests/e2e/tier2-boundaries/t2-angular-mini-projects-boundaries.js`:
     - **F39.B1**: Retry policy discriminates 4xx client errors: `if (err.status >= 400 && err.status < 500) throw err;` (does NOT retry 404/401).
     - **F39.B2**: Persistent 500 error exhausts all 3 retries (1 initial + 3 retries = 4 attempts) and falls back.
     - **F39.B3**: `shareReplay({ bufferSize: 1, refCount: true })` releases connection when unsubscribed mid-flight.
     - **F39.B4**: Handles malformed JSON response payload gracefully.
     - **F39.B5**: Rapid manual refresh triggers execute via `switchMap` cancelling prior pending calls.
     - **F40.B1**: Handles 10,000 character text input in form control without timeout.
     - **F40.B2**: Form with `debounceTime` suppresses duplicate submissions on `distinctUntilChanged`.
     - **F40.B3**: Empty string input is correctly filtered or validated.
     - **F40.B4**: Form `valueChanges` stream completing does not break subscriber.
     - **F40.B5**: Nested form groups serialize cleanly for auto-save HTTP PUT payload.
     - **F41.B1**: Stream subscribed after DestroyRef has already fired completes immediately.
     - **F41.B2**: DestroyRef firing during active timer terminates without leaking timeout handle.
     - **F41.B3 & F41.B4**: Leaky unmanaged counter vs managed zero-leak balance.
     - **F41.B5**: Multiple destroy notifications handled safely.
     - **F42.B1**: Immutability enforcement: updates create fresh copies.
     - **F42.B2**: Selector on non-existent state property returns `undefined` without throwing.
     - **F42.B3**: State update with identical primitive values does not trigger selector emission.
     - **F42.B4**: Handles deep state tree slice selection.
     - **F42.B5**: Action dispatching unknown action leaves state unchanged.
5. **Shared Components Available**:
   - `PlaygroundWrapperComponent` (`app-playground-wrapper`): slots `concept`, `code`, `visual`, `comparison`, `quiz`.
   - `CodeBlockComponent` (`app-code-block`): `code`, `language`, `title`, `showLineNumbers`.
   - `OutputConsoleComponent` (`app-output-console`): `entries`, `title`, `(clear)`.
   - `ComparisonTableComponent` (`app-comparison-table`): `data`.
   - `QuizBlockComponent` (`app-quiz-block`): `questions`, `topicId`, `(completed)`.
6. **Current Build & Test State**:
   - `node tests/e2e/run-all-tests.js`: 543/543 tests passing.
   - `npx ng build --configuration development`: passes with 0 errors.

---

## 2. Logic Chain

1. **Routing and Structure Integration**:
   - `src/app/app.routes.ts` points `/module7` to `src/app/features/module7-angular/module7.routes.ts`.
   - The 4 routes in `module7.routes.ts` (`http-patterns`, `reactive-forms`, `lifecycle`, `state-store`) must replace `StubTopicComponent` with 4 dedicated, rich standalone components:
     1. `HttpPatternsComponent`
     2. `ReactiveFormsComponent`
     3. `LifecycleTeardownComponent`
     4. `StateStoreComponent`
2. **Separation of Concerns via Services**:
   - Recipe 1 needs HTTP caching, retry backoff with 4xx discrimination, manual refresh, and parallel requests. Creating `HttpRecipeService` provides clean testability, encapsulation, and seamless connection to Express backend endpoints.
   - Recipe 4 requires a BehaviorSubject reactive store with actions, selectors, and signal bridging. Implementing `CourseStateStoreService` provides a real-world, complete state management implementation demonstrating immutable state transitions, selector optimization with `distinctUntilChanged`, and Angular 20 `toSignal()` bridging.
3. **Contract Alignment with Curriculum & Progress**:
   - Passing `topicId: 'http-patterns'`, `'reactive-forms'`, `'lifecycle-teardown'`, and `'state-management'` to `app-playground-wrapper` and `app-quiz-block` ensures exact integration with `ProgressService` and `SearchService`.
4. **Compliance with E2E Invariants**:
   - Every behavior tested in `F39.1–F39.5`, `F39.B1–B5`, `F40.1–F40.5`, `F40.B1–B5`, `F41.1–F41.5`, `F41.B1–B5`, `F42.1–F42.5`, `F42.B1–B5` must be directly embodied in the interactive visual demos, code snippets, and quizzes.

---

## 3. Caveats

1. **Express Server Connectivity**: In browser environments where the local Express backend (port 9000) might not be running simultaneously, all services must have resilient fallback mocks so the interactive demos function smoothly offline while preferring the real backend when reachable.
2. **Memory Leak Simulation**: The simulation of "leaky unmanaged subscriptions" creates deliberate subscriptions in memory to demonstrate the leak counter. A "Clean / Reset" button and `ngOnDestroy` hook must ensure that navigating away from the page cleans up these simulation timers so tests and other modules are not impacted.
3. **No External Libraries**: Do not install external UI component libraries (no Angular Material, PrimeNG, etc.). Use the project's SCSS design system tokens (`--color-primary-500`, `--color-bg-surface`, etc.) and native HTML/CSS.

---

## 4. Conclusion & Complete Architecture Specification

### 4.1 Target File Map

The worker will create/update the following 12 files in `src/app/features/module7-angular/`:

```
src/app/features/module7-angular/
├── module7.routes.ts                    # Updated with lazy-loaded recipe components
├── module7.models.ts                    # Domain interfaces, state types, retry configs
├── module7.data.ts                      # Educational content, multi-tab code snippets, comparison tables, quizzes
├── http-recipe.service.ts               # HTTP patterns, shareReplay caching, exponential backoff, refresh
├── course-state-store.service.ts        # BehaviorSubject store, action dispatchers, selectors, signal bridging
├── http-patterns.component.ts           # Recipe 1 Component
├── http-patterns.component.html
├── http-patterns.component.scss
├── reactive-forms.component.ts          # Recipe 2 Component (ReactiveFormsModule)
├── reactive-forms.component.html
├── reactive-forms.component.scss
├── lifecycle-teardown.component.ts      # Recipe 3 Component (DestroyRef, leak simulator)
├── lifecycle-teardown.component.html
├── lifecycle-teardown.component.scss
├── state-store.component.ts             # Recipe 4 Component (toSignal, timeline log)
├── state-store.component.html
└── state-store.component.scss
```

---

### 4.2 Route Definitions (`module7.routes.ts`)

```typescript
import { Routes } from '@angular/router';

export const MODULE7_ROUTES: Routes = [
  { path: '', redirectTo: 'http-patterns', pathMatch: 'full' },
  {
    path: 'http-patterns',
    loadComponent: () =>
      import('./http-patterns.component').then(m => m.HttpPatternsComponent),
    data: { topicId: 'http-patterns' }
  },
  {
    path: 'reactive-forms',
    loadComponent: () =>
      import('./reactive-forms.component').then(m => m.ReactiveFormsComponent),
    data: { topicId: 'reactive-forms' }
  },
  {
    path: 'lifecycle',
    loadComponent: () =>
      import('./lifecycle-teardown.component').then(m => m.LifecycleTeardownComponent),
    data: { topicId: 'lifecycle-teardown' }
  },
  {
    path: 'state-store',
    loadComponent: () =>
      import('./state-store.component').then(m => m.StateStoreComponent),
    data: { topicId: 'state-management' }
  }
];
```

---

### 4.3 Models Specification (`module7.models.ts`)

```typescript
import { Course, Lesson } from '../../core/models';

// Recipe 1: HTTP Patterns Models
export interface RetryAttemptLog {
  attempt: number;
  timestamp: number;
  delayMs: number;
  statusCode?: number;
  status: 'pending' | 'success' | 'failed';
  errorMessage?: string;
}

export interface CachedRequestTelemetry {
  subscriberId: string;
  subscribedAt: number;
  receivedAt?: number;
  fromCache: boolean;
  data?: any;
}

// Recipe 2: Reactive Forms Models
export type AutoSaveStatus = 'pristine' | 'typing' | 'saving' | 'saved' | 'error';

export interface FormAutoSavePayload {
  title: string;
  category: string;
  subCategory: string;
  description: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  autoSaveEnabled: boolean;
}

export interface FormTelemetry {
  keystrokesCount: number;
  valueChangesCount: number;
  httpRequestsCount: number;
  cancelledRequestsCount: number;
  lastSavedAt?: number;
}

// Recipe 3: Lifecycle Models
export interface SimulatedWidgetInstance {
  id: string;
  type: 'leaky' | 'managed';
  createdAt: number;
  destroyedAt?: number;
  ticks: number;
  isActive: boolean;
}

export interface LifecycleTelemetry {
  spawnedCount: number;
  destroyedCount: number;
  activeComponentCount: number;
  activeSubscriptionCount: number; // Zombie counter
  totalZombieTicks: number;
  hasMemoryLeak: boolean;
}

// Recipe 4: State Store Models
export interface CourseStoreItem {
  id: number;
  title: string;
  category: 'RxJS' | 'Angular' | 'TypeScript' | 'Architecture';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  enrolled: boolean;
  lessonsCount: number;
  rating: number;
}

export interface CourseStoreState {
  courses: CourseStoreItem[];
  filterCategory: string; // 'all' | 'RxJS' | 'Angular' | 'TypeScript' | 'Architecture'
  filterDifficulty: string; // 'all' | 'beginner' | 'intermediate' | 'advanced'
  searchTerm: string;
  selectedCourseId: number | null;
  loading: boolean;
  lastAction: string;
}

export interface StateTransitionLog {
  id: string;
  timestamp: number;
  action: string;
  payload?: any;
  stateSnapshot: CourseStoreState;
}
```

---

### 4.4 Service Architectures

#### 1. `HttpRecipeService` (`http-recipe.service.ts`)
```typescript
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of, timer, throwError, combineLatest } from 'rxjs';
import { map, switchMap, shareReplay, retry, catchError, startWith, tap } from 'rxjs/operators';
import { CourseWithLessons, SlowApiResponse, SimulateErrorSuccessResponse } from '../../core/models';
import { RetryAttemptLog } from './module7.models';

@Injectable({ providedIn: 'root' })
export class HttpRecipeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:9000/api';

  // Manual refresh Subject
  readonly refreshTrigger$ = new Subject<void>();

  // Cached Course Observable using shareReplay({ bufferSize: 1, refCount: true })
  private cachedCourse$?: Observable<CourseWithLessons>;
  private networkCallCounter = 0;

  getNetworkCallsCount(): number {
    return this.networkCallCounter;
  }

  resetNetworkCallsCount(): void {
    this.networkCallCounter = 0;
    this.cachedCourse$ = undefined;
  }

  // 1. shareReplay Caching Pipeline
  getCachedCourse(courseId = 1, useCache = true): Observable<CourseWithLessons> {
    if (!useCache) {
      return this.fetchCourseFromBackend(courseId);
    }
    if (!this.cachedCourse$) {
      this.cachedCourse$ = this.fetchCourseFromBackend(courseId).pipe(
        shareReplay({ bufferSize: 1, refCount: true })
      );
    }
    return this.cachedCourse$;
  }

  private fetchCourseFromBackend(id: number): Observable<CourseWithLessons> {
    return this.http.get<CourseWithLessons>(`${this.baseUrl}/courses/${id}`).pipe(
      tap(() => { this.networkCallCounter++; }),
      catchError(err => {
        // Fallback mock if backend server is not running
        this.networkCallCounter++;
        return of({
          id,
          description: 'RxJS in Practice (Offline Mock)',
          longDescription: 'Comprehensive reactive programming with RxJS and Angular',
          category: 'ADVANCED',
          lessonsCount: 10,
          lessons: [
            { id: 1, description: 'Introduction to Reactive Streams', duration: '5:00', seqNo: 1, courseId: id },
            { id: 2, description: 'Higher-Order Mapping Operators', duration: '8:30', seqNo: 2, courseId: id },
            { id: 3, description: 'Reactive State Architecture', duration: '12:00', seqNo: 3, courseId: id }
          ]
        });
      })
    );
  }

  // 2. Resilient Exponential Backoff Retry Pipeline (F39.2, F39.B1, F39.B2)
  fetchWithResilientRetry(
    rate = 0.7,
    statusCode = 500,
    maxRetries = 3,
    baseDelayMs = 500,
    onAttempt?: (log: RetryAttemptLog) => void
  ): Observable<any> {
    let attemptCount = 0;

    const request$ = new Observable<any>(sub => {
      attemptCount++;
      const currentAttempt = attemptCount;
      const startTime = Date.now();

      if (onAttempt) {
        onAttempt({
          attempt: currentAttempt,
          timestamp: startTime,
          delayMs: 0,
          statusCode,
          status: 'pending'
        });
      }

      this.http.get<SimulateErrorSuccessResponse>(
        `${this.baseUrl}/simulate-error?rate=${rate}&statusCode=${statusCode}&attempt=${currentAttempt}`
      ).subscribe({
        next: val => {
          if (onAttempt) {
            onAttempt({
              attempt: currentAttempt,
              timestamp: startTime,
              delayMs: 0,
              status: 'success'
            });
          }
          sub.next(val);
          sub.complete();
        },
        error: err => {
          if (onAttempt) {
            onAttempt({
              attempt: currentAttempt,
              timestamp: startTime,
              delayMs: 0,
              statusCode: err.status || statusCode,
              status: 'failed',
              errorMessage: err.message || 'Simulated upstream error'
            });
          }
          sub.error(err);
        }
      });
    });

    return request$.pipe(
      retry({
        count: maxRetries,
        delay: (err, retryAttempt) => {
          const status = err.status || statusCode;
          // F39.B1: Do NOT retry 4xx client errors (400, 401, 404)
          if (status >= 400 && status < 500) {
            throw err;
          }
          // Exponential backoff: baseDelay * 2^(retryAttempt - 1)
          const delayTime = Math.pow(2, retryAttempt - 1) * baseDelayMs;
          return timer(delayTime);
        }
      }),
      catchError(err => {
        // F39.3: Graceful fallback
        return of({
          fallback: true,
          status: 'recovered_fallback',
          error: err.message || 'Exhausted retries',
          data: { message: 'Fallback payload provided after failure' }
        });
      })
    );
  }

  // 3. Manual Refresh with switchMap (F39.4, F39.B5)
  createRefreshableCourseStream(courseId = 1): Observable<CourseWithLessons> {
    return this.refreshTrigger$.pipe(
      startWith(null),
      switchMap(() => this.fetchCourseFromBackend(courseId))
    );
  }

  // 4. Parallel Combination (F39.5)
  fetchParallelAggregatedData(courseId = 1): Observable<{ course: CourseWithLessons; slowData: SlowApiResponse }> {
    const course$ = this.fetchCourseFromBackend(courseId);
    const slow$ = this.http.get<SlowApiResponse>(`${this.baseUrl}/slow?delay=1000&tag=aggregated`).pipe(
      catchError(() => of({
        status: 'success' as const,
        endpoint: '/api/slow',
        delay: 1000,
        tag: 'offline-mock',
        requestTimestamp: Date.now(),
        responseTimestamp: Date.now() + 1000,
        elapsedMs: 1000,
        data: { message: 'Offline Telemetry Mock', serverTime: new Date().toISOString() }
      }))
    );

    return combineLatest([course$, slow$]).pipe(
      map(([course, slowData]) => ({ course, slowData }))
    );
  }
}
```

#### 2. `CourseStateStoreService` (`course-state-store.service.ts`)
```typescript
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { CourseStoreItem, CourseStoreState, StateTransitionLog } from './module7.models';

const INITIAL_COURSES: CourseStoreItem[] = [
  { id: 1, title: 'RxJS Fundamentals in Depth', category: 'RxJS', difficulty: 'beginner', enrolled: true, lessonsCount: 12, rating: 4.9 },
  { id: 2, title: 'Mastering Higher-Order Mapping', category: 'RxJS', difficulty: 'intermediate', enrolled: false, lessonsCount: 8, rating: 4.8 },
  { id: 3, title: 'Angular 20 Zoneless Reactivity & Signals', category: 'Angular', difficulty: 'intermediate', enrolled: true, lessonsCount: 15, rating: 5.0 },
  { id: 4, title: 'Advanced Multicasting & Subject Sandboxing', category: 'RxJS', difficulty: 'advanced', enrolled: false, lessonsCount: 6, rating: 4.7 },
  { id: 5, title: 'Modern Clean Architecture with TypeScript', category: 'Architecture', difficulty: 'advanced', enrolled: false, lessonsCount: 14, rating: 4.9 },
  { id: 6, title: 'TypeScript Type-Level Mastery', category: 'TypeScript', difficulty: 'intermediate', enrolled: true, lessonsCount: 9, rating: 4.6 }
];

const INITIAL_STATE: CourseStoreState = {
  courses: INITIAL_COURSES,
  filterCategory: 'all',
  filterDifficulty: 'all',
  searchTerm: '',
  selectedCourseId: null,
  loading: false,
  lastAction: 'INITIALIZE'
};

@Injectable({ providedIn: 'root' })
export class CourseStateStoreService {
  private readonly _state$ = new BehaviorSubject<CourseStoreState>(INITIAL_STATE);
  readonly state$: Observable<CourseStoreState> = this._state$.asObservable();

  // Audit timeline log
  private readonly _timeline$ = new BehaviorSubject<StateTransitionLog[]>([
    {
      id: 'step-0',
      timestamp: Date.now(),
      action: 'INITIALIZE',
      stateSnapshot: INITIAL_STATE
    }
  ]);
  readonly timeline$: Observable<StateTransitionLog[]> = this._timeline$.asObservable();

  // Telemetry counters for selector evaluations
  readonly selectorEvaluations = {
    courses: 0,
    filterCategory: 0,
    filteredCourses: 0,
    enrolledCount: 0
  };

  getState(): CourseStoreState {
    return this._state$.getValue();
  }

  // Base generic selector with distinctUntilChanged (F42.2, F42.4, F42.B3)
  select<K>(selectorFn: (state: CourseStoreState) => K): Observable<K> {
    return this.state$.pipe(
      map(selectorFn),
      distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b))
    );
  }

  // Immutable state update (F42.3, F42.B1)
  private update(actionName: string, payload: any, updater: (state: CourseStoreState) => CourseStoreState): void {
    const current = this.getState();
    const nextState = updater(current);

    this._state$.next(nextState);

    const log: StateTransitionLog = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      timestamp: Date.now(),
      action: actionName,
      payload,
      stateSnapshot: nextState
    };
    this._timeline$.next([...this._timeline$.getValue(), log]);
  }

  // --- Selectors ---
  readonly courses$ = this.select(s => {
    this.selectorEvaluations.courses++;
    return s.courses;
  });

  readonly filterCategory$ = this.select(s => {
    this.selectorEvaluations.filterCategory++;
    return s.filterCategory;
  });

  readonly filterDifficulty$ = this.select(s => s.filterDifficulty);
  readonly searchTerm$ = this.select(s => s.searchTerm);
  readonly selectedCourseId$ = this.select(s => s.selectedCourseId);

  readonly filteredCourses$ = this.select(s => {
    this.selectorEvaluations.filteredCourses++;
    return s.courses.filter(c => {
      const matchCat = s.filterCategory === 'all' || c.category === s.filterCategory;
      const matchDiff = s.filterDifficulty === 'all' || c.difficulty === s.filterDifficulty;
      const matchSearch = !s.searchTerm || c.title.toLowerCase().includes(s.searchTerm.toLowerCase());
      return matchCat && matchDiff && matchSearch;
    });
  });

  readonly enrolledCount$ = this.select(s => {
    this.selectorEvaluations.enrolledCount++;
    return s.courses.filter(c => c.enrolled).length;
  });

  readonly totalCount$ = this.select(s => s.courses.length);

  // --- Actions ---
  setCategoryFilter(category: string): void {
    this.update('SET_CATEGORY_FILTER', { category }, s => ({
      ...s,
      filterCategory: category,
      lastAction: `SET_CATEGORY_FILTER (${category})`
    }));
  }

  setDifficultyFilter(difficulty: string): void {
    this.update('SET_DIFFICULTY_FILTER', { difficulty }, s => ({
      ...s,
      filterDifficulty: difficulty,
      lastAction: `SET_DIFFICULTY_FILTER (${difficulty})`
    }));
  }

  setSearchTerm(term: string): void {
    this.update('SET_SEARCH_TERM', { term }, s => ({
      ...s,
      searchTerm: term,
      lastAction: `SET_SEARCH_TERM ("${term}")`
    }));
  }

  toggleEnrollment(courseId: number): void {
    this.update('TOGGLE_ENROLLMENT', { courseId }, s => ({
      ...s,
      courses: s.courses.map(c => c.id === courseId ? { ...c, enrolled: !c.enrolled } : c),
      lastAction: `TOGGLE_ENROLLMENT (Course #${courseId})`
    }));
  }

  addCourse(newCourse: Omit<CourseStoreItem, 'id'>): void {
    const nextId = Math.max(...this.getState().courses.map(c => c.id), 0) + 1;
    const course: CourseStoreItem = { ...newCourse, id: nextId };
    this.update('ADD_COURSE', course, s => ({
      ...s,
      courses: [course, ...s.courses],
      lastAction: `ADD_COURSE ("${course.title}")`
    }));
  }

  deleteCourse(courseId: number): void {
    this.update('DELETE_COURSE', { courseId }, s => ({
      ...s,
      courses: s.courses.filter(c => c.id !== courseId),
      selectedCourseId: s.selectedCourseId === courseId ? null : s.selectedCourseId,
      lastAction: `DELETE_COURSE (#${courseId})`
    }));
  }

  selectCourse(courseId: number | null): void {
    this.update('SELECT_COURSE', { courseId }, s => ({
      ...s,
      selectedCourseId: courseId,
      lastAction: `SELECT_COURSE (#${courseId})`
    }));
  }

  rollbackToSnapshot(log: StateTransitionLog): void {
    this._state$.next(log.stateSnapshot);
    const newLog: StateTransitionLog = {
      id: `rollback-${Date.now()}`,
      timestamp: Date.now(),
      action: `ROLLBACK_TO (${log.action})`,
      stateSnapshot: log.stateSnapshot
    };
    this._timeline$.next([...this._timeline$.getValue(), newLog]);
  }

  resetStore(): void {
    this._state$.next(INITIAL_STATE);
    this._timeline$.next([
      {
        id: `reset-${Date.now()}`,
        timestamp: Date.now(),
        action: 'RESET_STORE',
        stateSnapshot: INITIAL_STATE
      }
    ]);
  }
}
```

---

### 4.5 Component Architectures & Interactive UI Specifications

#### 1. Recipe 1: `HttpPatternsComponent` (`http-patterns.component.ts|html|scss`)
- **Category**: Angular Recipes
- **Title**: "HTTP Patterns & Caching"
- **Subtitle**: "Resilient data fetching with shareReplay, exponential backoff retries, and cancellation"
- **Difficulty**: intermediate
- **Topic ID**: `http-patterns`
- **Tabs**:
  - `concept`: Explains cold vs hot HTTP streams, `shareReplay({ bufferSize: 1, refCount: true })` teardown semantics (F39.B3), exponential backoff formulas, why 4xx errors must never be retried (F39.B1), and `switchMap` request cancellation.
  - `code`: 3 subtabs:
    1. `caching`: `shareReplay` pattern with `refCount: true`
    2. `retry`: Exponential backoff with 4xx discrimination
    3. `refresh`: Refresh Subject with `switchMap`
  - `visual`: 4 interactive simulation cards:
    - **Card A (Caching Simulator)**:
      - Toggle: "Use shareReplay Caching"
      - Buttons: "Subscribe Subscriber 1", "Subscribe Subscriber 2", "Unsubscribe Sub 1", "Unsubscribe Sub 2", "Invalidate Cache".
      - Live Badges: Network Requests Dispatched (`1` vs `2`), Active Subscriptions count.
      - Received data inspection for Sub 1 & Sub 2.
    - **Card B (Resilient Backoff Retry Visualizer)**:
      - Controls: Failure Rate slider (0.0 to 1.0, default 0.7), Status Code selector (`500 Internal Error` vs `404 Not Found`), Max Retries (`3`).
      - Button: "🚀 Trigger Resilient Fetch"
      - Live Timeline: Step-by-step attempt tracker:
        `Attempt 1: Failed 500 (Backoff 500ms) ➔ Attempt 2: Failed 500 (Backoff 1000ms) ➔ Attempt 3: 200 OK Recovered!`
        If 404: `Attempt 1: 404 Client Error ➔ 🚫 No Retry (Immediate rejection)`.
    - **Card C (Rapid Refresh & switchMap Cancellation)**:
      - Button: "🔄 Rapid Refresh"
      - Click counter vs resolved version counter, showing how `switchMap` cancels prior in-flight requests.
    - **Card D (Parallel Data Aggregation)**:
      - Button: "⚡ ForkJoin / CombineLatest Aggregated View"
      - Renders combined Course + Telemetry view.
  - `comparison`: Comparison table comparing:
    - `shareReplay({ bufferSize: 1, refCount: true })` vs `share()` vs `publishReplay()` vs Uncached.
    - `retry({ count, delay })` vs `retryWhen()` vs `repeat()`.
  - `quiz`: 4 questions on HTTP caching, backoff rules, and teardown.

#### 2. Recipe 2: `ReactiveFormsComponent` (`reactive-forms.component.ts|html|scss`)
- **Category**: Angular Recipes
- **Title**: "Reactive Forms with Debounce"
- **Subtitle**: "Auto-saving forms with valueChanges, debounceTime, distinctUntilChanged, and switchMap"
- **Difficulty**: intermediate
- **Topic ID**: `reactive-forms`
- **Tabs**:
  - `concept`: Detailed exploration of `form.valueChanges`, the cost of unthrottled typing, how `debounceTime(400)` creates a quiet window, how `distinctUntilChanged` prevents duplicate payloads, and the 5-state auto-save state machine (`pristine` -> `typing` -> `saving` -> `saved` -> `error`).
  - `code`: 3 subtabs:
    1. `pipeline`: Form setup and `valueChanges` pipe with debounce, distinct, filter, switchMap.
    2. `stateMachine`: AutoSave status management with `tap` and `catchError`.
    3. `crossField`: Dynamic dependency pipeline where Category updates Subcategory options.
  - `visual`:
    - **Auto-Save Status Header Pill**:
      - `[Pristine - Up to date]` (gray)
      - `[Typing... debouncing 400ms]` (amber pulsing)
      - `[Saving to server...]` (blue spinner)
      - `[Saved successfully at HH:MM:SS]` (green check)
      - `[Save error - retry]` (red)
    - **Course Editor Form**:
      - Title input (min 3 chars)
      - Category select ('Frontend' | 'Backend' | 'DevOps' | 'Mobile')
      - Sub-Category select (dynamically filtered by Category - F40.5)
      - Description textarea (with 10,000 char capacity - F40.B1)
      - Difficulty radio group
      - Auto-save toggle checkbox
    - **Efficiency Telemetry & Side-by-Side Comparison**:
      - Live Stat 1: Total Keystrokes / Changes: `[ 38 ]`
      - Live Stat 2: Actual HTTP PUT Requests Dispatched: `[ 2 ]`
      - Live Stat 3: Network Traffic Reduction: `[ 94.7% ]`
      - Live Stat 4: In-flight Requests Cancelled by switchMap: `[ 1 ]`
    - **Debounce Window Scrubber**: Slider to adjust debounce time from 100ms to 2000ms.
    - **Live Stream Output Console**: Logs typing bursts, debounce completion, and HTTP PUT results.
  - `comparison`: Table comparing `valueChanges` + `debounceTime` vs Template-driven `(ngModelChange)` vs Manual Submit button.
  - `quiz`: 4 questions on reactive forms pipelines, distinct object comparisons, and cancellation.

#### 3. Recipe 3: `LifecycleTeardownComponent` (`lifecycle-teardown.component.ts|html|scss`)
- **Category**: Angular Recipes
- **Title**: "Component Lifecycle & takeUntilDestroyed"
- **Subtitle**: "Preventing memory leaks and zombie subscriptions using Angular 20 DestroyRef"
- **Difficulty**: intermediate
- **Topic ID**: `lifecycle-teardown`
- **Tabs**:
  - `concept`: In-depth breakdown of subscription lifecycle in Single Page Applications, why unmanaged subscriptions keep the component instance alive in JavaScript memory (Zombie Subscriptions), how `takeUntilDestroyed()` binds to `DestroyRef`, and injection context rules.
  - `code`: 3 subtabs:
    1. `modern`: `takeUntilDestroyed()` inside constructor vs with explicit `DestroyRef`.
    2. `leaky`: The unmanaged anti-pattern and why it leaks.
    3. `legacy`: Legacy `Subject` + `takeUntil` + `ngOnDestroy` comparison.
  - `visual`:
    - **Interactive Memory Leak Simulator**:
      - Controls:
        - "➕ Mount Leaky Widget (Unmanaged Sub)"
        - "➕ Mount Managed Widget (takeUntilDestroyed)"
        - "❌ Unmount All Widgets"
        - "🧹 Force Clean Zombie Subscriptions"
      - **Live Telemetry & Leak Warning Banner**:
        - Active Mounted Components: `[ 0 ]`
        - Active Subscriptions in Memory: `[ 4 ]`
        - If Zombie Subscriptions > 0: **Flashing Red Alert Badge**:
          `⚠️ MEMORY LEAK DETECTED: 4 Zombie subscriptions continue ticking in background despite components being destroyed!`
        - If Zombie Subscriptions == 0: **Green Healthy Badge**:
          `✅ ZERO LEAKS: All active subscriptions destroyed.`
        - Cumulative Zombie Ticks: Counter continuously ticking in real-time.
      - **Active Widget Cards Grid**:
        - Each card shows: Widget ID, Type (`Leaky` vs `Managed`), Live Ticks, Mount Timestamp, and an individual "Unmount Component" button.
        - When unmounted: Managed card cleans up immediately; Leaky card unmounts from view but moves to the "Zombie Subscription Graveyard" where it keeps ticking!
      - **Edge-Case Verifiers (F41.B1, F41.B2)**:
        - Button: "Test Subscribe After Destroy" (verifies stream completes immediately).
        - Button: "Test Active Timer Teardown" (verifies timer does not leak timeout handle).
  - `comparison`: Table comparing `takeUntilDestroyed(destroyRef)` vs `AsyncPipe` vs `takeUntil(destroy$)` vs manual `Subscription.unsubscribe()`.
  - `quiz`: 4 questions on DestroyRef injection contexts, memory leak mechanisms, and teardown execution order.

#### 4. Recipe 4: `StateStoreComponent` (`state-store.component.ts|html|scss`)
- **Category**: Angular Recipes
- **Title**: "BehaviorSubject State Store"
- **Subtitle**: "Pragmatic reactive state management with action dispatchers, selectors, and toSignal bridging"
- **Difficulty**: advanced
- **Topic ID**: `state-management`
- **Tabs**:
  - `concept`: Architectural pattern of single source of truth using `BehaviorSubject`, immutable state updates via shallow copy spread operators, selector optimization with `distinctUntilChanged` to eliminate redundant child component re-renders, and bridging to Angular 20 signals with `toSignal()`.
  - `code`: 3 subtabs:
    1. `storeService`: Base store architecture, update and select methods.
    2. `courseStore`: Concrete domain store with actions and selectors.
    3. `signalBridge`: Angular 20 `toSignal()` template integration.
  - `visual`:
    - **Section 1: Store Controls & Action Dispatcher**:
      - Search box (bound to `store.setSearchTerm`)
      - Category filter pills: `[All]`, `[RxJS]`, `[Angular]`, `[TypeScript]`, `[Architecture]`
      - Difficulty filter pills: `[All]`, `[Beginner]`, `[Intermediate]`, `[Advanced]`
      - Quick actions: `[➕ Add Course]`, `[Reset Store]`
    - **Section 2: Bridged Signals & Course Cards**:
      - Summary stats rendered using Angular 20 signals (`toSignal`):
        - Total Courses: `[ 6 ]`
        - Enrolled Courses: `[ 3 ]`
        - Filter: `[ RxJS ]`
      - Grid of interactive course cards:
        - Course title, category badge, difficulty badge, rating.
        - Toggle "Enroll / Unenroll" button.
        - Delete course button.
    - **Section 3: Selector Optimization Monitor (`distinctUntilChanged`)**:
      - Real-time counters showing emissions per selector:
        - `courses$ emissions`: `[ 4 ]`
        - `filterCategory$ emissions`: `[ 2 ]`
        - `enrolledCount$ emissions`: `[ 1 ]`
      - Explanatory callout: Changing category updates `filteredCourses$`, but leaves `enrolledCount$` untouched without redundant re-evaluations!
    - **Section 4: State Transition Audit Timeline (Time-Travel)**:
      - Table listing each action dispatched:
        - Timestamp, Action Name, Payload, State Snapshot.
        - "⏪ Rollback to this state" button to time-travel back to that snapshot!
    - **Section 5: Boundary Integrity Checks (F42.B2, F42.B4, F42.B5)**:
      - Interactive test: "Select Deep Non-Existent Slice" (proves no runtime error).
      - Interactive test: "Dispatch Unknown Action" (proves state immutability).
  - `comparison`: Table comparing `BehaviorSubject Store` vs `NgRx SignalStore` vs `NgRx ComponentStore` vs Raw Signals.
  - `quiz`: 4 questions on BehaviorSubject state stores, selectors, and `toSignal()` bridging.

---

### 4.6 Complete Quiz Questions Specification (`module7.data.ts`)

```typescript
import { QuizQuestion, ComparisonData } from '../../core/models';

export const MODULE7_QUIZZES: Record<string, QuizQuestion[]> = {
  'http-patterns': [
    {
      id: 'q-http-1',
      question: 'Why should you include { bufferSize: 1, refCount: true } when using shareReplay on an Angular HTTP request?',
      options: [
        { id: 'a', text: 'To convert the HTTP request into a WebSocket stream' },
        { id: 'b', text: 'To prevent memory leaks by unsubscribing from the source when all subscribers unsubscribe' },
        { id: 'c', text: 'To automatically retry 500 errors indefinitely' },
        { id: 'd', text: 'To serialize the payload into XML format' }
      ],
      correctOptionId: 'b',
      explanation: 'Without refCount: true, shareReplay maintains its subscription to the underlying source observable indefinitely even after all subscribers unsubscribe, which can cause connection leaks and prevent garbage collection if cancelled mid-flight.'
    },
    {
      id: 'q-http-2',
      question: 'Which HTTP status codes should an exponential backoff retry strategy explicitly AVOID retrying?',
      options: [
        { id: 'a', text: '503 Service Unavailable' },
        { id: 'b', text: '504 Gateway Timeout' },
        { id: 'c', text: '4xx Client Errors (such as 400 Bad Request, 401 Unauthorized, 404 Not Found)' },
        { id: 'd', text: '500 Internal Server Error' }
      ],
      correctOptionId: 'c',
      explanation: 'Client errors (4xx) signify invalid client requests, missing authentication, or non-existent resources. Retrying a 404 or 401 with backoff will never succeed and wastes network bandwidth.'
    },
    {
      id: 'q-http-3',
      question: 'In a manual data refresh pipeline, why is switchMap preferred over mergeMap when mapping a refresh$ Subject to an HTTP request?',
      options: [
        { id: 'a', text: 'switchMap executes requests sequentially in FIFO order' },
        { id: 'b', text: 'switchMap cancels any previous pending in-flight request if the user clicks refresh again rapidly' },
        { id: 'c', text: 'switchMap ignores new clicks until the current request finishes' },
        { id: 'd', text: 'switchMap runs requests on a background web worker' }
      ],
      correctOptionId: 'b',
      explanation: 'switchMap unsubscribes from the previous inner observable when a new value arrives. This cancels prior pending HTTP requests, preventing race conditions where outdated responses overwrite newer data.'
    },
    {
      id: 'q-http-4',
      question: 'Where should catchError be placed in an HTTP pipeline to provide fallback data without breaking outer stream subscriptions?',
      options: [
        { id: 'a', text: 'Outside the component constructor' },
        { id: 'b', text: 'Inside the inner HTTP observable stream before returning it to switchMap' },
        { id: 'c', text: 'Directly in the template using the async pipe' },
        { id: 'd', text: 'In the index.html head tag' }
      ],
      correctOptionId: 'b',
      explanation: 'Placing catchError inside the inner observable allows the error to be handled locally and replaced with a fallback observable, keeping the outer stream alive to receive future triggers.'
    }
  ],

  'reactive-forms': [
    {
      id: 'q-forms-1',
      question: 'What is the primary benefit of applying debounceTime(400) to a FormGroup valueChanges observable?',
      options: [
        { id: 'a', text: 'It enforces password complexity validation' },
        { id: 'b', text: 'It pauses emissions until the user stops typing for 400 milliseconds, eliminating excessive HTTP requests' },
        { id: 'c', text: 'It converts form control values to uppercase' },
        { id: 'd', text: 'It delays form submission until the page reloads' }
      ],
      correctOptionId: 'b',
      explanation: 'debounceTime(400) discards rapid interim values emitted during active keystroke bursts, only emitting the latest value after 400ms of inactivity.'
    },
    {
      id: 'q-forms-2',
      question: 'Why is a custom comparator needed when passing distinctUntilChanged to an Angular form.valueChanges stream?',
      options: [
        { id: 'a', text: 'Because RxJS cannot compare boolean values' },
        { id: 'b', text: 'Because form.value emits a new object reference on every keystroke, so default triple-equality (===) would never detect equality' },
        { id: 'c', text: 'Because form controls require asynchronous comparator promises' },
        { id: 'd', text: 'To automatically hash the form input using SHA-256' }
      ],
      correctOptionId: 'b',
      explanation: 'By default, distinctUntilChanged checks previous === current. Since valueChanges emits a new object reference on each change, a custom comparator (e.g. comparing JSON strings or specific keys) is necessary to detect true value equality.'
    },
    {
      id: 'q-forms-3',
      question: 'In an auto-save pipeline, what operator sequence best handles debounced saving with cancellation of in-flight saves?',
      codeSnippet: 'form.valueChanges.pipe(\n  debounceTime(400),\n  distinctUntilChanged((a, b) => JSON.stringify(a) === JSON.stringify(b)),\n  filter(() => form.valid),\n  switchMap(data => http.put(...))\n)',
      options: [
        { id: 'a', text: 'concatMap followed by delay' },
        { id: 'b', text: 'debounceTime -> distinctUntilChanged -> filter(valid) -> switchMap' },
        { id: 'c', text: 'mergeMap -> take(1) -> retry' },
        { id: 'd', text: 'exhaustMap -> sampleTime(100)' }
      ],
      correctOptionId: 'b',
      explanation: 'This pipeline debounces typing, eliminates duplicate values, guarantees only valid form states proceed, and uses switchMap to cancel any in-flight PUT if another edit occurs.'
    },
    {
      id: 'q-forms-4',
      question: 'How should you reactively update dropdown options in Field B based on the selected value of Field A?',
      options: [
        { id: 'a', text: 'Listen to fieldA.valueChanges.pipe(map(val => getOptionsFor(val))) and bind to field B' },
        { id: 'b', text: 'Poll field A using window.setInterval' },
        { id: 'c', text: 'Use a MutationObserver on the select element in the DOM' },
        { id: 'd', text: 'Attach an onclick listener to the body tag' }
      ],
      correctOptionId: 'a',
      explanation: 'Using fieldA.valueChanges as an observable stream allows declarative, reactive derivation of dependent options without polling or manual event listeners.'
    }
  ],

  'lifecycle-teardown': [
    {
      id: 'q-life-1',
      question: 'What happens if a long-lived subscription (e.g. interval) in an Angular component is created without teardown management?',
      options: [
        { id: 'a', text: 'Angular automatically detects and kills it upon component destroy' },
        { id: 'b', text: 'The subscription closure retains the component instance in memory, creating a memory leak and continuing to execute in the background' },
        { id: 'c', text: 'The browser tab immediately crashes' },
        { id: 'd', text: 'The interval stops emitting as soon as the DOM node is removed' }
      ],
      correctOptionId: 'b',
      explanation: 'RxJS observables are decoupled from the Angular view lifecycle. Unless cancelled, the subscription holds a reference to the component instance in memory, causing a zombie subscription leak.'
    },
    {
      id: 'q-life-2',
      question: 'When using takeUntilDestroyed() OUTSIDE of an Angular injection context (e.g. inside a method or ngOnInit), what is required?',
      options: [
        { id: 'a', text: 'You must provide a string identifier' },
        { id: 'b', text: 'You must pass an explicit DestroyRef reference: takeUntilDestroyed(this.destroyRef)' },
        { id: 'c', text: 'You must call ngOnDestroy manually' },
        { id: 'd', text: 'It is not possible to use takeUntilDestroyed outside the constructor' }
      ],
      correctOptionId: 'b',
      explanation: 'When called inside the constructor, takeUntilDestroyed automatically infers DestroyRef from the current injection context. Outside of an injection context, you must explicitly inject DestroyRef and pass it as an argument.'
    },
    {
      id: 'q-life-3',
      question: 'If an observable stream completes naturally before the component is destroyed, what does takeUntilDestroyed do?',
      options: [
        { id: 'a', text: 'It throws an UnhandledException error' },
        { id: 'b', text: 'It safely cleans up its internal teardown listener without error' },
        { id: 'c', text: 'It restarts the completed observable' },
        { id: 'd', text: 'It triggers change detection twice' }
      ],
      correctOptionId: 'b',
      explanation: 'takeUntilDestroyed cleanly unsubscribes when the source completes naturally. Subsequent destruction of the component causes no errors (tested in F41.5).'
    },
    {
      id: 'q-life-4',
      question: 'Which Angular operator executes teardown callbacks when an unmanaged or managed stream terminates?',
      options: [
        { id: 'a', text: 'startWith' },
        { id: 'b', text: 'finalize(() => { ... })' },
        { id: 'c', text: 'defaultIfEmpty' },
        { id: 'd', text: 'scan' }
      ],
      correctOptionId: 'b',
      explanation: 'The finalize operator executes its callback when the source observable completes, errors, or is unsubscribed, making it ideal for tracking teardown execution.'
    }
  ],

  'state-management': [
    {
      id: 'q-state-1',
      question: 'Why does a reactive state store service use BehaviorSubject instead of a standard Subject?',
      options: [
        { id: 'a', text: 'Because BehaviorSubject allows bidirectional HTTP streaming' },
        { id: 'b', text: 'Because BehaviorSubject requires an initial state and immediately replays the current state value to any new subscriber' },
        { id: 'c', text: 'Because BehaviorSubject cannot be unsubscribed from' },
        { id: 'd', text: 'Because BehaviorSubject executes synchronously on a worker thread' }
      ],
      correctOptionId: 'b',
      explanation: 'BehaviorSubject stores the current state in memory and provides synchronous access via getValue() as well as immediate emission to any new subscriber upon subscription.'
    },
    {
      id: 'q-state-2',
      question: 'Why must state updates in a BehaviorSubject store be performed immutably (e.g. { ...state, property: value })?',
      options: [
        { id: 'a', text: 'To ensure TypeScript compiles faster' },
        { id: 'b', text: 'To preserve historical state integrity, allow time-travel auditing, and trigger distinctUntilChanged checks properly' },
        { id: 'c', text: 'Because JavaScript arrays cannot be mutated' },
        { id: 'd', text: 'To prevent the browser from reloading' }
      ],
      correctOptionId: 'b',
      explanation: 'Mutating state in-place changes the internal properties of the existing object, breaking change detection, selector memoization (distinctUntilChanged), and audit/undo history.'
    },
    {
      id: 'q-state-3',
      question: 'How does distinctUntilChanged optimize state selectors in a BehaviorSubject store?',
      options: [
        { id: 'a', text: 'It prevents the selector from emitting when unrelated state properties change but the selected slice value remains unchanged' },
        { id: 'b', text: 'It caches the emissions in IndexedDB' },
        { id: 'c', text: 'It encrypts the emitted data' },
        { id: 'd', text: 'It delays emissions by 1 second' }
      ],
      correctOptionId: 'a',
      explanation: 'When state.update() is called for theme, a distinctUntilChanged selector for count will not emit because count has not changed, preventing unnecessary downstream calculations or component renders.'
    },
    {
      id: 'q-state-4',
      question: 'How does Angular 20 toSignal() enhance consuming store selectors in zoneless component templates?',
      options: [
        { id: 'a', text: 'It converts the template into pure HTML canvas' },
        { id: 'b', text: 'It bridges the selector observable to a reactive signal with automatic subscription management, enabling direct template evaluation without async pipes' },
        { id: 'c', text: 'It converts observables into web workers' },
        { id: 'd', text: 'It forces manual change detection on every tick' }
      ],
      correctOptionId: 'b',
      explanation: 'toSignal() subscribes to the selector observable under the hood within the injection context, manages unsubscription on component destruction, and provides a synchronous Signal value for optimal zoneless change detection.'
    }
  ]
};
```

---

### 4.7 Comparison Tables Data (`module7.data.ts`)

```typescript
export const MODULE7_COMPARISONS: Record<string, ComparisonData> = {
  'http-patterns': {
    features: [
      { id: 'caching', label: 'Response Caching' },
      { id: 'teardown', label: 'Connection Teardown on Zero Subscribers' },
      { id: 'replay', label: 'Replay to Late Subscribers' },
      { id: 'retry', label: 'Transient Error Resilience' },
      { id: 'recommended', label: 'Best Suited For' }
    ],
    items: [
      {
        id: 'share-replay',
        name: 'shareReplay({ bufferSize: 1, refCount: true })',
        badge: 'Recommended',
        recommendedUse: 'Standard HTTP caching in Angular services',
        characteristics: {
          caching: { text: 'Caches last emission for subsequent subscribers', status: 'positive' },
          teardown: { text: 'Cleanly unsubscribes when subscriber count hits zero (refCount: true)', status: 'positive' },
          replay: { text: 'Replays bufferSize (1) immediately to new subscribers', status: 'positive' },
          retry: { text: 'Combine with retry({ delay: ... }) before shareReplay', status: 'positive' },
          recommended: { text: 'Read-heavy REST endpoints, course details, config data', status: 'positive' }
        }
      },
      {
        id: 'unshared-http',
        name: 'Raw HttpClient.get() (Uncached)',
        badge: 'Cold',
        recommendedUse: 'Endpoints where fresh data is mandatory on every call',
        characteristics: {
          caching: { text: 'No caching; re-executes network call per subscription', status: 'negative' },
          teardown: { text: 'Automatic completion upon HTTP response', status: 'neutral' },
          replay: { text: 'No replay; cold unicast execution', status: 'negative' },
          retry: { text: 'Can retry individual call', status: 'neutral' },
          recommended: { text: 'Form submissions, mutations, payment authorizations', status: 'neutral' }
        }
      },
      {
        id: 'share',
        name: 'share() (Multicast without Replay)',
        badge: 'Hot',
        recommendedUse: 'Sharing in-flight requests without caching historical responses',
        characteristics: {
          caching: { text: 'Shares in-flight execution, but does not cache after completion', status: 'neutral' },
          teardown: { text: 'Unsubscribes when refCount reaches 0', status: 'positive' },
          replay: { text: 'Late subscribers do NOT receive past emission', status: 'negative' },
          retry: { text: 'Retries upstream source', status: 'neutral' },
          recommended: { text: 'Event streams, live telemetry, WebSocket feeds', status: 'neutral' }
        }
      }
    ]
  },

  'reactive-forms': {
    features: [
      { id: 'keystroke', label: 'Keystroke Efficiency' },
      { id: 'cancellation', label: 'In-Flight Cancellation' },
      { id: 'duplication', label: 'Duplicate Payload Suppression' },
      { id: 'validation', label: 'Integrated Form Validity' },
      { id: 'state', label: 'Auto-Save Status Lifecycle' }
    ],
    items: [
      {
        id: 'debounced-stream',
        name: 'valueChanges + debounceTime + switchMap',
        badge: 'Best Practice',
        recommendedUse: 'Modern reactive auto-saving forms',
        characteristics: {
          keystroke: { text: 'Reduces typing bursts by 90%+ via debounceTime(400)', status: 'positive' },
          cancellation: { text: 'switchMap immediately cancels pending in-flight saves on new typing', status: 'positive' },
          duplication: { text: 'distinctUntilChanged discards duplicate serializations', status: 'positive' },
          validation: { text: 'filter(() => form.valid) guarantees only valid data is sent', status: 'positive' },
          state: { text: 'Explicit state machine: pristine | typing | saving | saved | error', status: 'positive' }
        }
      },
      {
        id: 'template-driven',
        name: 'Template-Driven (ngModelChange)',
        badge: 'Legacy',
        recommendedUse: 'Simple single-input forms without auto-save',
        characteristics: {
          keystroke: { text: 'Triggers on every keystroke unless manually debounced with setTimeout', status: 'negative' },
          cancellation: { text: 'No built-in request cancellation', status: 'negative' },
          duplication: { text: 'Manual tracking required to avoid duplicate submits', status: 'negative' },
          validation: { text: 'Template directives ($invalid)', status: 'neutral' },
          state: { text: 'Manual boolean flags (isSaving = true/false)', status: 'neutral' }
        }
      },
      {
        id: 'manual-submit',
        name: 'Manual Submit Button (ngSubmit)',
        badge: 'Explicit',
        recommendedUse: 'High-security transactions and checkout flows',
        characteristics: {
          keystroke: { text: 'Zero background requests; user initiates action', status: 'neutral' },
          cancellation: { text: 'Manual disabling of submit button during in-flight save', status: 'neutral' },
          duplication: { text: 'Requires button disabling to prevent double-click submits', status: 'neutral' },
          validation: { text: 'Checked on submit', status: 'positive' },
          state: { text: 'Simple pending/submitted state', status: 'neutral' }
        }
      }
    ]
  },

  'lifecycle-teardown': {
    features: [
      { id: 'syntax', label: 'Syntax & Ergonomics' },
      { id: 'injection', label: 'Injection Context Requirement' },
      { id: 'leakRisk', label: 'Memory Leak Risk' },
      { id: 'zoneless', label: 'Zoneless Angular 20 Compatibility' },
      { id: 'teardownTiming', label: 'Teardown Execution Timing' }
    ],
    items: [
      {
        id: 'takeUntilDestroyed',
        name: 'takeUntilDestroyed() with DestroyRef',
        badge: 'Modern Angular 20',
        recommendedUse: 'All component and directive subscriptions',
        characteristics: {
          syntax: { text: 'Concise pipe operator; no ngOnDestroy boilerplate', status: 'positive' },
          injection: { text: 'Implicit in constructor; requires inject(DestroyRef) in methods', status: 'positive' },
          leakRisk: { text: 'Zero leak risk when DestroyRef fires', status: 'positive' },
          zoneless: { text: 'First-class support in Angular 20 zoneless applications', status: 'positive' },
          teardownTiming: { text: 'Executes immediately when DestroyRef notifies destroy', status: 'positive' }
        }
      },
      {
        id: 'unmanaged',
        name: 'Unmanaged subscription.subscribe()',
        badge: 'Anti-Pattern (Danger)',
        recommendedUse: 'NEVER for component-scoped subscriptions',
        characteristics: {
          syntax: { text: 'Simple to write initially', status: 'neutral' },
          injection: { text: 'None', status: 'neutral' },
          leakRisk: { text: 'CRITICAL: Retains component instance, leaks memory indefinitely', status: 'negative' },
          zoneless: { text: 'Causes zombie change detection ticks and side-effects', status: 'negative' },
          teardownTiming: { text: 'Never tears down until page refresh', status: 'negative' }
        }
      },
      {
        id: 'asyncPipe',
        name: 'AsyncPipe (| async)',
        badge: 'Declarative Template',
        recommendedUse: 'Template-only observable bindings',
        characteristics: {
          syntax: { text: 'No component code subscription', status: 'positive' },
          injection: { text: 'Handled by Angular template runtime', status: 'positive' },
          leakRisk: { text: 'Zero leak risk; unbinds on view destruction', status: 'positive' },
          zoneless: { text: 'Signals (toSignal) preferred in Angular 20', status: 'neutral' },
          teardownTiming: { text: 'Teardown occurs on view destruction', status: 'positive' }
        }
      }
    ]
  },

  'state-management': {
    features: [
      { id: 'simplicity', label: 'Boilerplate & Learning Curve' },
      { id: 'reactivity', label: 'Reactivity Model' },
      { id: 'selectors', label: 'Selector Optimization' },
      { id: 'signalInterop', label: 'Angular 20 Signal Interop' },
      { id: 'audit', label: 'Time-Travel & Audit Log' }
    ],
    items: [
      {
        id: 'behavior-subject-store',
        name: 'BehaviorSubject Reactive Store',
        badge: 'Lightweight & Pragmatic',
        recommendedUse: 'Feature state, service-driven stores, mid-size apps',
        characteristics: {
          simplicity: { text: 'No external libraries; single TypeScript service', status: 'positive' },
          reactivity: { text: 'BehaviorSubject state$ stream + immutability', status: 'positive' },
          selectors: { text: 'distinctUntilChanged ensures minimal re-computations', status: 'positive' },
          signalInterop: { text: 'Bridges to signals seamlessly with toSignal()', status: 'positive' },
          audit: { text: 'Easy to record audit timeline log of actions and snapshots', status: 'positive' }
        }
      },
      {
        id: 'ngrx-signal-store',
        name: 'NgRx SignalStore',
        badge: 'Signals-First',
        recommendedUse: 'Large enterprise Signal-based applications',
        characteristics: {
          simplicity: { text: 'Requires @ngrx/signals library', status: 'neutral' },
          reactivity: { text: 'Native signals with deep reactivity', status: 'positive' },
          selectors: { text: 'Computed signals memoized by default', status: 'positive' },
          signalInterop: { text: 'Native signals everywhere', status: 'positive' },
          audit: { text: 'Requires custom extensions or devtools', status: 'neutral' }
        }
      },
      {
        id: 'raw-subject',
        name: 'Ad-Hoc Subject in Service',
        badge: 'Fragile',
        recommendedUse: 'Avoid for complex state',
        characteristics: {
          simplicity: { text: 'Primitive and unstructured', status: 'negative' },
          reactivity: { text: 'No initial value, no selector memoization', status: 'negative' },
          selectors: { text: 'Re-emits on any change; no distinct filtering', status: 'negative' },
          signalInterop: { text: 'Requires manual mapping', status: 'negative' },
          audit: { text: 'No state history or snapshot tracking', status: 'negative' }
        }
      }
    ]
  }
};
```

---

## 5. Verification Method

To independently verify the architecture and implementation:

1. **Compilation Check**:
   ```powershell
   npx ng build --configuration development
   ```
   *Pass Criteria*: Zero compilation errors, bundle generates chunks for `module7-routes` without warnings.

2. **E2E Test Execution**:
   ```powershell
   node tests/e2e/run-all-tests.js
   ```
   *Pass Criteria*: All 543 tests pass (100.0%), including:
   - Tier 1 Features 39, 40, 41, 42 (20 tests)
   - Tier 2 Boundaries F39.B1–B5, F40.B1–B5, F41.B1–B5, F42.B1–B5 (20 tests)
   - Tier 3 Interaction T3.04 (HTTP Retry + Express error)

3. **Route Navigation Spot-Check**:
   Navigate to:
   - `http://localhost:4200/module7/http-patterns`
   - `http://localhost:4200/module7/reactive-forms`
   - `http://localhost:4200/module7/lifecycle`
   - `http://localhost:4200/module7/state-store`
   *Pass Criteria*: Each page loads its respective `app-playground-wrapper` with all 5 tabs (`concept`, `code`, `visual`, `comparison`, `quiz`) populated and functional.

4. **Invalidation Conditions**:
   - If `module7.routes.ts` routes fail to resolve or point to `StubTopicComponent`.
   - If `shareReplay` does not use `refCount: true`.
   - If 4xx client errors are retried by exponential backoff.
   - If memory leak simulation fails to clean up simulation subscriptions when leaving the page.
   - If quizzes do not bind to the correct `topicId`.

---

## 6. Implementation Instructions for Worker

1. Create `src/app/features/module7-angular/module7.models.ts` with all models defined in Section 4.3.
2. Create `src/app/features/module7-angular/module7.data.ts` with educational descriptions, code samples, comparison data, and quizzes defined in Sections 4.6 and 4.7.
3. Create `src/app/features/module7-angular/http-recipe.service.ts` implementing `shareReplay`, exponential backoff retry with 4xx rejection, and manual refresh streams.
4. Create `src/app/features/module7-angular/course-state-store.service.ts` implementing `BehaviorSubject`, immutable `update()`, selectors with `distinctUntilChanged()`, and time-travel rollback.
5. Create `src/app/features/module7-angular/http-patterns.component.ts|html|scss` (Recipe 1).
6. Create `src/app/features/module7-angular/reactive-forms.component.ts|html|scss` (Recipe 2, importing `ReactiveFormsModule`).
7. Create `src/app/features/module7-angular/lifecycle-teardown.component.ts|html|scss` (Recipe 3, DestroyRef, memory leak simulation).
8. Create `src/app/features/module7-angular/state-store.component.ts|html|scss` (Recipe 4, `toSignal` bridging, state timeline).
9. Update `src/app/features/module7-angular/module7.routes.ts` to route all 4 paths to the new components.
10. Run `npx ng build --configuration development` and `node tests/e2e/run-all-tests.js` to verify zero regression.
