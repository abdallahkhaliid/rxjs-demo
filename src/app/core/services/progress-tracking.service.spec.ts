import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ProgressTrackingService, ProgressService } from './progress-tracking.service';
import { QuizScore } from '../models';

describe('ProgressTrackingService (Milestone 6 Unit Acceptance Suite)', () => {
  let service: ProgressTrackingService;
  const STORAGE_KEY = 'rxjs_platform_progress';

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ProgressTrackingService
      ]
    });
    service = TestBed.inject(ProgressTrackingService);
    service.resetProgress();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. Initial State & Defaults
  // =========================================================================
  describe('Initial Default State', () => {
    it('PTS-1.1: should start with 0 completed topics and 0% progress', () => {
      expect(service).toBeTruthy();
      expect(service.completedCount()).toBe(0);
      expect(service.completionPercentage()).toBe(0);
      expect(service.overallProgressPercentage()).toBe(0);
      expect(service.getLastVisitedRoute()).toBe('/');
    });

    it('PTS-1.2: should return false for any uncompleted topic query', () => {
      expect(service.isCompleted('what-is-rxjs')).toBeFalse();
      expect(service.isCompleted('module2-of')).toBeFalse();
      expect(service.isCompleted('non-existent-topic')).toBeFalse();
    });

    it('PTS-1.3: should return undefined for unrecorded quiz scores', () => {
      expect(service.getQuizScore('what-is-rxjs')).toBeUndefined();
    });
  });

  // =========================================================================
  // 2. Marking Topics Complete & Signal Reactivity
  // =========================================================================
  describe('Topic Completion & Reactivity', () => {
    it('PTS-2.1: should mark a topic complete and update signals reactively', () => {
      service.markCompleted('what-is-rxjs');
      expect(service.isCompleted('what-is-rxjs')).toBeTrue();
      expect(service.completedCount()).toBe(1);
      expect(service.completionPercentage()).toBeGreaterThan(0);
    });

    it('PTS-2.2: should be idempotent when marking the same topic multiple times', () => {
      service.markCompleted('what-is-rxjs');
      service.markCompleted('what-is-rxjs');
      service.markCompleted('what-is-rxjs');
      expect(service.completedCount()).toBe(1);
      expect(service.isCompleted('what-is-rxjs')).toBeTrue();
    });

    it('PTS-2.3: should toggle topic completion status back and forth', () => {
      service.toggleTopicCompleted('of');
      expect(service.isCompleted('of')).toBeTrue();
      expect(service.completedCount()).toBe(1);

      service.toggleTopicCompleted('of');
      expect(service.isCompleted('of')).toBeFalse();
      expect(service.completedCount()).toBe(0);
    });

    it('PTS-2.4: should support legacy toggleCompleted method alias', () => {
      service.toggleCompleted('from');
      expect(service.isCompleted('from')).toBeTrue();
      service.toggleCompleted('from');
      expect(service.isCompleted('from')).toBeFalse();
    });
  });

  // =========================================================================
  // 3. LocalStorage Persistence & Rehydration
  // =========================================================================
  describe('LocalStorage Persistence & Compatibility', () => {
    it('PTS-3.1: should persist state to LocalStorage under unified key', () => {
      service.markCompleted('switch-map');
      service.setLastVisitedRoute('/module4/switch-map');

      const raw = localStorage.getItem(STORAGE_KEY);
      expect(raw).toBeTruthy();
      const parsed = JSON.parse(raw!);
      expect(parsed.completedTopics['switch-map']).toBeTrue();
      expect(parsed.lastVisitedRoute).toBe('/module4/switch-map');
    });

    it('PTS-3.2: should rehydrate state cleanly on service reinstantiation', () => {
      service.markCompleted('topic-a');
      service.markCompleted('topic-b');

      // Create a secondary service instance pointing to the same localStorage
      const service2 = new ProgressTrackingService();
      expect(service2.isCompleted('topic-a')).toBeTrue();
      expect(service2.isCompleted('topic-b')).toBeTrue();
      expect(service2.completedCount()).toBe(2);
    });

    it('PTS-3.3: should gracefully migrate legacy split storage keys if present', () => {
      localStorage.clear();
      localStorage.setItem('rxjs_platform_completed_topics', JSON.stringify(['legacy-1', 'legacy-2']));
      localStorage.setItem('rxjs_platform_quiz_scores', JSON.stringify({
        'legacy-1': { total: 4, correct: 4, percentage: 100, passed: true }
      }));

      const migratingService = new ProgressTrackingService();
      expect(migratingService.isCompleted('legacy-1')).toBeTrue();
      expect(migratingService.isCompleted('legacy-2')).toBeTrue();
      expect(migratingService.completedCount()).toBe(2);
      expect(migratingService.getQuizScore('legacy-1')?.passed).toBeTrue();
    });
  });

  // =========================================================================
  // 4. Corruption Resistance & Storage Fault Tolerance
  // =========================================================================
  describe('Corruption Resistance & Error Guards', () => {
    it('PTS-4.1: should handle corrupted non-JSON strings in LocalStorage without throwing', () => {
      localStorage.setItem(STORAGE_KEY, 'MALFORMED_JSON_STRING{{{');
      expect(() => {
        const resilientService = new ProgressTrackingService();
        expect(resilientService.completedCount()).toBe(0);
        expect(resilientService.getLastVisitedRoute()).toBe('/');
      }).not.toThrow();
    });

    it('PTS-4.2: should handle unexpected JSON primitive values (numbers, null, booleans)', () => {
      localStorage.setItem(STORAGE_KEY, '12345');
      const s1 = new ProgressTrackingService();
      expect(s1.completedCount()).toBe(0);

      localStorage.setItem(STORAGE_KEY, 'null');
      const s2 = new ProgressTrackingService();
      expect(s2.completedCount()).toBe(0);
    });

    it('PTS-4.3: should survive LocalStorage QuotaExceededError without crashing session', () => {
      spyOn(localStorage, 'setItem').and.callFake(() => {
        const error = new Error('QuotaExceededError');
        error.name = 'QuotaExceededError';
        throw error;
      });

      // Must update in-memory state and computed signals without throwing to the UI
      expect(() => {
        service.markCompleted('heavy-topic');
      }).not.toThrow();
      expect(service.isCompleted('heavy-topic')).toBeTrue();
      expect(service.completedCount()).toBe(1);
    });
  });

  // =========================================================================
  // 5. Quiz Score Recording & Passing Threshold
  // =========================================================================
  describe('Quiz Score Recording & Auto-Completion', () => {
    it('PTS-5.1: should auto-mark topic completed when quiz is passed (>= 70%)', () => {
      service.recordQuizScore('module-2-of', 85);
      expect(service.getQuizScore('module-2-of')?.percentage).toBe(85);
      expect(service.getQuizScore('module-2-of')?.passed).toBeTrue();
      expect(service.isCompleted('module-2-of')).toBeTrue();
    });

    it('PTS-5.2: should record quiz score but NOT mark completed when quiz fails (< 70%)', () => {
      service.recordQuizScore('module-4-switchmap', 50);
      expect(service.getQuizScore('module-4-switchmap')?.percentage).toBe(50);
      expect(service.getQuizScore('module-4-switchmap')?.passed).toBeFalse();
      expect(service.isCompleted('module-4-switchmap')).toBeFalse();
    });

    it('PTS-5.3: should support QuizScore object parameter in saveQuizScore', () => {
      const scoreObj: QuizScore = {
        total: 5,
        correct: 4,
        percentage: 80,
        passed: true
      };
      service.saveQuizScore('combine-latest', scoreObj);
      expect(service.isCompleted('combine-latest')).toBeTrue();
      expect(service.getQuizScore('combine-latest')).toEqual(scoreObj);
    });

    it('PTS-5.4: should sanitize and clamp out-of-range quiz scores', () => {
      service.recordQuizScore('clamped-neg', -20);
      expect(service.getQuizScore('clamped-neg')?.percentage).toBe(0);

      service.recordQuizScore('clamped-pos', 150);
      expect(service.getQuizScore('clamped-pos')?.percentage).toBe(100);
    });
  });

  // =========================================================================
  // 6. Module-Level & Platform-Wide Percentage Calculations
  // =========================================================================
  describe('Module & Platform Percentage Calculations', () => {
    it('PTS-6.1: should calculate module-level progress accurately', () => {
      // Mark 3 topics in module 1
      service.markCompleted('what-is-rxjs');
      service.markCompleted('what-is-observable');
      service.markCompleted('observable-vs-promise');

      const m1Progress = service.getModuleProgress(1);
      expect(m1Progress.completed).toBe(3);
      expect(m1Progress.total).toBe(7);
      expect(m1Progress.percentage).toBe(43); // Math.round((3/7)*100) = 43%
    });

    it('PTS-6.2: should return 0% for unstarted modules without division-by-zero errors', () => {
      const m8Progress = service.getModuleProgress(8);
      expect(m8Progress.completed).toBe(0);
      expect(m8Progress.percentage).toBe(0);
    });

    it('PTS-6.3: should handle unknown module ID safely', () => {
      const unknownProgress = service.getModuleProgress(99);
      expect(unknownProgress.completed).toBe(0);
      expect(unknownProgress.total).toBe(0);
      expect(unknownProgress.percentage).toBe(0);
    });

    it('PTS-6.4: should clamp overall platform completion percentage between 0 and 100', () => {
      service.totalTopicsCount.set(10);
      for (let i = 1; i <= 15; i++) {
        service.markCompleted(`topic-${i}`);
      }
      expect(service.completionPercentage()).toBe(100);
    });
  });

  // =========================================================================
  // 7. Reset Progress
  // =========================================================================
  describe('Reset Progress', () => {
    it('PTS-7.1: should completely clear completion, scores, and storage keys on reset', () => {
      service.markCompleted('topic-1');
      service.recordQuizScore('topic-1', 100);
      service.setLastVisitedRoute('/module1/topic-1');
      expect(service.completedCount()).toBe(1);

      service.resetProgress();
      expect(service.completedCount()).toBe(0);
      expect(service.completionPercentage()).toBe(0);
      expect(service.isCompleted('topic-1')).toBeFalse();
      expect(service.getQuizScore('topic-1')).toBeUndefined();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
    });
  });
});
