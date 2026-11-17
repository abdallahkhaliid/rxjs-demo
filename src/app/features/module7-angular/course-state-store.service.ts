import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { CourseStoreItem, CourseStoreState, StateTransitionLog } from './module7.models';

export const INITIAL_COURSES: CourseStoreItem[] = [
  { id: 1, title: 'RxJS Fundamentals in Depth', category: 'RxJS', difficulty: 'beginner', enrolled: true, lessonsCount: 12, rating: 4.9 },
  { id: 2, title: 'Mastering Higher-Order Mapping', category: 'RxJS', difficulty: 'intermediate', enrolled: false, lessonsCount: 8, rating: 4.8 },
  { id: 3, title: 'Angular 20 Zoneless Reactivity & Signals', category: 'Angular', difficulty: 'intermediate', enrolled: true, lessonsCount: 15, rating: 5.0 },
  { id: 4, title: 'Advanced Multicasting & Subject Sandboxing', category: 'RxJS', difficulty: 'advanced', enrolled: false, lessonsCount: 6, rating: 4.7 },
  { id: 5, title: 'Modern Clean Architecture with TypeScript', category: 'Architecture', difficulty: 'advanced', enrolled: false, lessonsCount: 14, rating: 4.9 },
  { id: 6, title: 'TypeScript Type-Level Mastery', category: 'TypeScript', difficulty: 'intermediate', enrolled: true, lessonsCount: 9, rating: 4.6 }
];

export const INITIAL_STATE: CourseStoreState = {
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

  // Audit timeline log (F42.1)
  private readonly _timeline$ = new BehaviorSubject<StateTransitionLog[]>([
    {
      id: 'step-0',
      timestamp: Date.now(),
      action: 'INITIALIZE',
      stateSnapshot: INITIAL_STATE
    }
  ]);
  readonly timeline$: Observable<StateTransitionLog[]> = this._timeline$.asObservable();

  // Telemetry counters for selector evaluations to prove distinctUntilChanged efficiency (F42.4, F42.B3)
  readonly selectorEvaluations = {
    courses: 0,
    filterCategory: 0,
    filterDifficulty: 0,
    filteredCourses: 0,
    enrolledCount: 0
  };

  getState(): CourseStoreState {
    return this._state$.getValue();
  }

  // Base generic selector with distinctUntilChanged (F42.2, F42.4, F42.B2, F42.B3, F42.B4)
  select<K>(selectorFn: (state: CourseStoreState) => K): Observable<K> {
    return this.state$.pipe(
      map(s => {
        try {
          return selectorFn(s);
        } catch {
          // F42.B2: Non-existent slice returns undefined safely
          return undefined as unknown as K;
        }
      }),
      distinctUntilChanged((a, b) => {
        if (a === b) return true;
        try {
          return JSON.stringify(a) === JSON.stringify(b);
        } catch {
          return false;
        }
      })
    );
  }

  // Immutable state update (F42.3, F42.B1)
  private update(actionName: string, payload: any, updater: (state: CourseStoreState) => CourseStoreState): void {
    const current = this.getState();
    const nextState = updater(current);

    // Ensure immutability: must be a fresh reference
    this._state$.next(nextState);

    const log: StateTransitionLog = {
      id: `step-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
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

  readonly filterDifficulty$ = this.select(s => {
    this.selectorEvaluations.filterDifficulty++;
    return s.filterDifficulty;
  });

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
      courses: s.courses.map(c => (c.id === courseId ? { ...c, enrolled: !c.enrolled } : c)),
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

  // F42.B5: Unknown action handling leaves state unmodified
  dispatchUnknownAction(actionType: string): void {
    const current = this.getState();
    const updater = (s: CourseStoreState) => {
      switch (actionType) {
        case 'KNOWN_NOOP':
          return { ...s };
        default:
          return s; // Unchanged reference
      }
    };
    const next = updater(current);
    if (next !== current) {
      this._state$.next(next);
    }
    // Record in timeline for demonstration
    const log: StateTransitionLog = {
      id: `noop-${Date.now()}`,
      timestamp: Date.now(),
      action: `UNKNOWN_ACTION (${actionType} - State Preserved)`,
      stateSnapshot: current
    };
    this._timeline$.next([...this._timeline$.getValue(), log]);
  }

  // Time-travel rollback
  rollbackToSnapshot(log: StateTransitionLog): void {
    this._state$.next({ ...log.stateSnapshot });
    const newLog: StateTransitionLog = {
      id: `rollback-${Date.now()}`,
      timestamp: Date.now(),
      action: `ROLLBACK_TO (${log.action})`,
      stateSnapshot: log.stateSnapshot
    };
    this._timeline$.next([...this._timeline$.getValue(), newLog]);
  }

  resetStore(): void {
    this.selectorEvaluations.courses = 0;
    this.selectorEvaluations.filterCategory = 0;
    this.selectorEvaluations.filterDifficulty = 0;
    this.selectorEvaluations.filteredCourses = 0;
    this.selectorEvaluations.enrolledCount = 0;

    this._state$.next({
      ...INITIAL_STATE,
      courses: INITIAL_COURSES.map(c => ({ ...c }))
    });
    this._timeline$.next([
      {
        id: `reset-${Date.now()}`,
        timestamp: Date.now(),
        action: 'RESET_STORE',
        stateSnapshot: {
          ...INITIAL_STATE,
          courses: INITIAL_COURSES.map(c => ({ ...c }))
        }
      }
    ]);
  }
}
