import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { ProgressService } from './progress.service';
import { QuizScore } from '../models';

describe('ProgressService', () => {
  let service: ProgressService;

  beforeEach(() => {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        ProgressService
      ]
    });
    service = TestBed.inject(ProgressService);
    service.resetProgress();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created and start with 0 completed topics', () => {
    expect(service).toBeTruthy();
    expect(service.completedCount()).toBe(0);
    expect(service.completionPercentage()).toBe(0);
  });

  it('should mark topics as completed and update percentage', () => {
    service.markCompleted('what-is-rxjs');
    expect(service.isCompleted('what-is-rxjs')).toBeTrue();
    expect(service.completedCount()).toBe(1);
    expect(service.completionPercentage()).toBeGreaterThan(0);
  });

  it('should toggle topic completion', () => {
    service.toggleCompleted('of-operator');
    expect(service.isCompleted('of-operator')).toBeTrue();

    service.toggleCompleted('of-operator');
    expect(service.isCompleted('of-operator')).toBeFalse();
  });

  it('should save quiz score and auto-mark topic as completed if passed', () => {
    const passedScore: QuizScore = {
      total: 4,
      correct: 4,
      percentage: 100,
      passed: true
    };

    service.saveQuizScore('switch-map', passedScore);
    expect(service.getQuizScore('switch-map')).toEqual(passedScore);
    expect(service.isCompleted('switch-map')).toBeTrue();
  });

  it('should reset all progress', () => {
    service.markCompleted('topic-1');
    service.markCompleted('topic-2');
    expect(service.completedCount()).toBe(2);

    service.resetProgress();
    expect(service.completedCount()).toBe(0);
    expect(service.isCompleted('topic-1')).toBeFalse();
  });
});
