import { Injectable, signal, computed, WritableSignal } from '@angular/core';
import { QuizScore, StoredProgressState, StoredQuizScore, ModuleProgress, ProgressSummary } from '../models';

export const PROGRESS_STORAGE_KEY = 'rxjs_platform_progress';
export const PROGRESS_STORAGE_KEY_V1 = 'rxjs_platform_progress_v1';
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
  private readonly quizScoresMap = signal<Map<string, any>>(new Map());
  private readonly lastVisitedTopicSignal = signal<string | null>(null);
  private readonly lastVisitedRouteSignal = signal<string>('/');

  // Compute all canonical topic IDs (108 total)
  private readonly allCanonicalTopicIds: string[] = Object.values(MODULE_TOPIC_REGISTRY)
    .flatMap(m => m.topicIds);

  // Readonly & Writable Signals
  readonly totalTopicsCount: WritableSignal<number> = signal<number>(this.allCanonicalTopicIds.length);
  readonly completedCount = computed<number>(() => {
    // Count canonical unique topics completed
    const completedSet = this.completedTopicsSet();
    const counted = new Set<string>();
    for (const item of completedSet) {
      const canonical = this.normalizeTopicId(item);
      counted.add(canonical || item);
    }
    return counted.size;
  });

  readonly lastVisitedTopic = this.lastVisitedTopicSignal.asReadonly();

  readonly completionPercentage = computed<number>(() => {
    const total = this.totalTopicsCount();
    if (total <= 0) return 0;
    const count = this.completedCount();
    return Math.min(100, Math.round((count / total) * 100));
  });

  readonly overallProgressPercentage = this.completionPercentage;

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

  // --- Query Methods ---
  isCompleted(topicId: string): boolean {
    if (!topicId) return false;
    const set = this.completedTopicsSet();
    if (set.has(topicId)) return true;
    const normalized = this.normalizeTopicId(topicId);
    if (normalized && set.has(normalized)) return true;

    for (const [k, v] of Object.entries(TOPIC_ALIASES)) {
      if ((k === topicId || v === topicId) && (set.has(k) || set.has(v))) {
        return true;
      }
    }
    return false;
  }

  getQuizScore(topicId: string): any {
    if (!topicId) return undefined;
    const map = this.quizScoresMap();
    if (map.has(topicId)) return map.get(topicId);

    const normalized = this.normalizeTopicId(topicId);
    if (normalized && map.has(normalized)) return map.get(normalized);

    for (const [k, v] of Object.entries(TOPIC_ALIASES)) {
      if ((k === topicId || v === topicId) && (map.has(k) || map.has(v))) {
        return map.get(k) || map.get(v);
      }
    }
    return undefined;
  }

  getLastVisitedRoute(): string {
    return this.lastVisitedRouteSignal() || '/';
  }

  setLastVisitedRoute(route: string): void {
    if (route) {
      this.lastVisitedRouteSignal.set(route);
      this.persistToStorage();
    }
  }

  getProgressPercentage(totalTopics?: number): number {
    const total = totalTopics !== undefined ? totalTopics : this.totalTopicsCount();
    if (total <= 0) return 0;
    const count = this.completedCount();
    return Math.min(100, Math.round((count / total) * 100));
  }

  getModuleProgress(moduleId: string | number): ModuleProgress {
    let key = '';
    if (typeof moduleId === 'number') {
      key = `module${moduleId}`;
    } else {
      const clean = String(moduleId).trim().toLowerCase();
      if (clean.startsWith('module')) {
        key = clean;
      } else if (!isNaN(Number(clean))) {
        key = `module${clean}`;
      } else {
        key = clean;
      }
    }

    const reg = MODULE_TOPIC_REGISTRY[key];
    if (!reg) {
      return {
        moduleId: String(moduleId),
        moduleNumber: 0,
        title: 'Unknown Module',
        totalTopics: 0,
        completedTopics: 0,
        total: 0,
        completed: 0,
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
      total,
      completed,
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

  // --- Mutation Methods ---
  toggleTopicCompleted(topicId: string): boolean {
    if (!topicId) return false;
    const canonical = this.normalizeTopicId(topicId);
    const current = new Set(this.completedTopicsSet());
    let nowCompleted = false;

    if (this.isCompleted(topicId)) {
      current.delete(topicId);
      if (canonical) current.delete(canonical);
      for (const [k, v] of Object.entries(TOPIC_ALIASES)) {
        if (k === topicId || v === topicId) {
          current.delete(k);
          current.delete(v);
        }
      }
      nowCompleted = false;
    } else {
      current.add(topicId);
      if (canonical) current.add(canonical);
      for (const [k, v] of Object.entries(TOPIC_ALIASES)) {
        if (k === topicId) current.add(v);
        if (v === topicId) current.add(k);
      }
      nowCompleted = true;
    }

    this.completedTopicsSet.set(current);
    this.persistToStorage();
    return nowCompleted;
  }

  toggleCompleted(topicId: string): void {
    this.toggleTopicCompleted(topicId);
  }

  markTopicCompleted(topicId: string): void {
    if (!topicId) return;
    const canonical = this.normalizeTopicId(topicId);
    const current = new Set(this.completedTopicsSet());
    let changed = false;

    if (!current.has(topicId)) {
      current.add(topicId);
      changed = true;
    }
    if (canonical && !current.has(canonical)) {
      current.add(canonical);
      changed = true;
    }
    for (const [k, v] of Object.entries(TOPIC_ALIASES)) {
      if (k === topicId && !current.has(v)) {
        current.add(v);
        changed = true;
      }
      if (v === topicId && !current.has(k)) {
        current.add(k);
        changed = true;
      }
    }

    if (changed) {
      this.completedTopicsSet.set(current);
      this.persistToStorage();
    }
  }

  markCompleted(topicId: string): void {
    this.markTopicCompleted(topicId);
  }

  unmarkTopicCompleted(topicId: string): void {
    if (!topicId) return;
    const canonical = this.normalizeTopicId(topicId);
    const current = new Set(this.completedTopicsSet());
    current.delete(topicId);
    if (canonical) current.delete(canonical);
    for (const [k, v] of Object.entries(TOPIC_ALIASES)) {
      if (k === topicId || v === topicId) {
        current.delete(k);
        current.delete(v);
      }
    }
    this.completedTopicsSet.set(current);
    this.persistToStorage();
  }

  recordQuizScore(topicId: string, score: number | QuizScore, total?: number, passThreshold = 70): any {
    if (!topicId) return null;

    let storedScore: any;
    let passed = false;

    if (typeof score === 'number') {
      if (total !== undefined) {
        const validTotal = Math.max(1, total);
        const validScore = Math.max(0, Math.min(score, validTotal));
        const validPercentage = Math.round((validScore / validTotal) * 100);
        passed = validPercentage >= passThreshold;
        storedScore = {
          score: validScore,
          total: validTotal,
          percentage: validPercentage,
          passed,
          timestamp: Date.now()
        };
      } else {
        const validPercentage = Math.max(0, Math.min(100, Math.round(score)));
        passed = validPercentage >= passThreshold;
        storedScore = {
          score: validPercentage,
          total: 100,
          percentage: validPercentage,
          passed,
          timestamp: Date.now()
        };
      }
    } else {
      passed = !!score.passed;
      storedScore = {
        total: score.total,
        correct: score.correct,
        score: score.correct,
        percentage: Math.max(0, Math.min(100, score.percentage)),
        passed,
        timestamp: Date.now()
      };
    }

    const map = new Map(this.quizScoresMap());
    map.set(topicId, storedScore);
    const canonical = this.normalizeTopicId(topicId);
    if (canonical) map.set(canonical, storedScore);
    this.quizScoresMap.set(map);

    if (passed) {
      this.markTopicCompleted(topicId);
    } else {
      this.persistToStorage();
    }

    return storedScore;
  }

  saveQuizScore(topicId: string, score: QuizScore): void {
    if (!topicId || !score) return;
    const storedScore = {
      total: score.total,
      correct: score.correct,
      percentage: score.percentage,
      passed: score.passed
    };

    const map = new Map(this.quizScoresMap());
    map.set(topicId, storedScore);
    const canonical = this.normalizeTopicId(topicId);
    if (canonical) map.set(canonical, storedScore);
    this.quizScoresMap.set(map);

    if (score.passed) {
      this.markTopicCompleted(topicId);
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
    this.lastVisitedRouteSignal.set('/');

    if (this.isLocalStorageAvailable()) {
      try {
        localStorage.removeItem(PROGRESS_STORAGE_KEY);
        localStorage.removeItem(PROGRESS_STORAGE_KEY_V1);
        localStorage.removeItem(LEGACY_STORAGE_KEY_TOPICS);
        localStorage.removeItem(LEGACY_STORAGE_KEY_QUIZZES);
      } catch (err) {
        console.warn('ProgressTrackingService: Failed to clear localStorage items', err);
      }
    }
  }

  reset(): void {
    this.resetProgress();
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
      let raw = localStorage.getItem(PROGRESS_STORAGE_KEY);
      if (!raw) {
        raw = localStorage.getItem(PROGRESS_STORAGE_KEY_V1);
      }

      if (raw) {
        let parsed: any;
        try {
          parsed = JSON.parse(raw);
        } catch {
          // Ignore corrupt data gracefully (PTS-4.1)
          return;
        }

        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          this.applyState(parsed);
          return;
        }
      }

      // Check legacy split keys
      const legacyTopics = localStorage.getItem(LEGACY_STORAGE_KEY_TOPICS);
      const legacyQuizzes = localStorage.getItem(LEGACY_STORAGE_KEY_QUIZZES);
      if (legacyTopics || legacyQuizzes) {
        this.migrateLegacyData(legacyTopics, legacyQuizzes);
      }
    } catch (e) {
      console.warn('ProgressTrackingService: Failed to read from localStorage', e);
    }
  }

  private applyState(state: any): void {
    const topicsSet = new Set<string>();

    if (state.completedTopics) {
      if (Array.isArray(state.completedTopics)) {
        for (const item of state.completedTopics) {
          if (typeof item === 'string' && item.trim().length > 0 && item !== '__proto__') {
            topicsSet.add(item.trim());
          }
        }
      } else if (typeof state.completedTopics === 'object') {
        for (const [key, val] of Object.entries(state.completedTopics)) {
          if (key && key !== '__proto__' && key !== 'constructor' && val) {
            topicsSet.add(key);
          }
        }
      }
    }
    this.completedTopicsSet.set(topicsSet);

    const scoresMap = new Map<string, any>();
    if (state.quizScores && typeof state.quizScores === 'object' && !Array.isArray(state.quizScores)) {
      for (const [key, val] of Object.entries(state.quizScores)) {
        if (key && key !== '__proto__' && val) {
          if (typeof val === 'number') {
            const pct = Math.max(0, Math.min(100, Math.round(val)));
            scoresMap.set(key, { score: pct, total: 100, percentage: pct, passed: pct >= 70 });
          } else if (typeof val === 'object') {
            const v = val as any;
            const total = typeof v.total === 'number' ? Math.max(1, v.total) : 100;
            const score = typeof v.score === 'number' ? v.score : (typeof v.correct === 'number' ? v.correct : 0);
            const percentage = typeof v.percentage === 'number' ? Math.max(0, Math.min(100, v.percentage)) : 0;
            const passed = typeof v.passed === 'boolean' ? v.passed : percentage >= 70;
            scoresMap.set(key, { ...v, total, score, percentage, passed });
          }
        }
      }
    }
    this.quizScoresMap.set(scoresMap);

    if (typeof state.lastVisitedRoute === 'string') {
      this.lastVisitedRouteSignal.set(state.lastVisitedRoute);
    }
    if (typeof state.lastVisitedTopic === 'string') {
      this.lastVisitedTopicSignal.set(state.lastVisitedTopic);
    }
  }

  private migrateLegacyData(rawTopics: string | null, rawQuizzes: string | null): void {
    const topicsSet = new Set<string>();
    const quizzesMap = new Map<string, any>();

    if (rawTopics) {
      try {
        const arr = JSON.parse(rawTopics);
        if (Array.isArray(arr)) {
          arr.forEach(t => {
            if (typeof t === 'string' && t !== '__proto__') {
              topicsSet.add(t);
            }
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
            if (q && typeof q.total === 'number' && k !== '__proto__') {
              quizzesMap.set(k, {
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
      const completedObj: Record<string, boolean> = {};
      for (const t of this.completedTopicsSet()) {
        completedObj[t] = true;
      }

      const quizObj: Record<string, any> = {};
      for (const [k, v] of this.quizScoresMap().entries()) {
        quizObj[k] = v;
      }

      const state: StoredProgressState = {
        version: 1,
        completedTopics: completedObj,
        quizScores: quizObj,
        lastVisitedRoute: this.lastVisitedRouteSignal() || '/',
        lastVisitedTopic: this.lastVisitedTopicSignal() ?? undefined,
        updatedAt: Date.now()
      };

      const serialized = JSON.stringify(state);
      localStorage.setItem(PROGRESS_STORAGE_KEY, serialized);
      localStorage.setItem(PROGRESS_STORAGE_KEY_V1, serialized);

      // Keep legacy keys synced for backward-compatible readers
      localStorage.setItem(LEGACY_STORAGE_KEY_TOPICS, JSON.stringify(Array.from(this.completedTopicsSet())));
      localStorage.setItem(LEGACY_STORAGE_KEY_QUIZZES, JSON.stringify(quizObj));
    } catch (err: any) {
      if (err?.name === 'QuotaExceededError' || err?.code === 22 || err?.code === 1014) {
        console.warn('ProgressTrackingService: QuotaExceededError encountered. Maintaining memory state.', err);
      } else {
        console.warn('ProgressTrackingService: Failed to persist progress to localStorage', err);
      }
    }
  }
}

// Export ProgressService alias for backward-compatibility
export { ProgressTrackingService as ProgressService };
