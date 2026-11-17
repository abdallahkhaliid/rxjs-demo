import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { switchMap, concatMap, mergeMap, exhaustMap, delay } from 'rxjs/operators';

import { HooTimelineEngineService, TimelineStateTracker } from './hoo-timeline-engine.service';
import { HooTimelineVisualizerComponent } from './hoo-timeline-visualizer.component';
import { HooPlaygroundComponent } from './hoo-playground.component';
import { HooOverviewComponent } from './hoo-overview.component';
import { MODULE4_OPERATORS, MODULE4_MASTER_COMPARISON } from './module4.data';
import { HooTimelineSnapshot } from './module4.models';
import { ProgressService } from '../../core/services/progress.service';

describe('Module 4: Higher-Order Observables Unit Tests', () => {

  describe('HooTimelineEngineService & Pure RxJS Mechanics', () => {
    let service: HooTimelineEngineService;

    beforeEach(() => {
      service = new HooTimelineEngineService();
    });

    afterEach(() => {
      service.stopSimulation();
    });

    it('F36.1: switchMap cancels active in-flight request when a new outer request is triggered', () => {
      service.setOperator('switchMap');

      const req1 = service.trigger('Req 1', 2000);
      expect(req1.state).toBe('active');
      expect(service.snapshot().activeCount).toBe(1);

      // Triggering Req 2 should preempt and cancel Req 1
      const req2 = service.trigger('Req 2', 2000);
      expect(req1.state).toBe('cancelled');
      expect(req1.cancelReason).toContain('Superseded');
      expect(req2.state).toBe('active');
      expect(service.snapshot().activeCount).toBe(1);
      expect(service.snapshot().cancelledCount).toBe(1);
    });

    it('F36.2: concatMap queues subsequent requests and executes sequentially in strict FIFO order', () => {
      service.setOperator('concatMap');

      const req1 = service.trigger('Req 1', 1000);
      const req2 = service.trigger('Req 2', 1000);
      const req3 = service.trigger('Req 3', 1000);

      expect(req1.state).toBe('active');
      expect(req2.state).toBe('queued');
      expect(req3.state).toBe('queued');
      expect(service.snapshot().activeCount).toBe(1);
      expect(service.snapshot().queuedCount).toBe(2);

      // Complete Req 1 -> Req 2 should become active
      service.complete(req1.id);
      expect(req1.state).toBe('completed');
      expect(req2.state).toBe('active');
      expect(req3.state).toBe('queued');

      // Complete Req 2 -> Req 3 should become active
      service.complete(req2.id);
      expect(req2.state).toBe('completed');
      expect(req3.state).toBe('active');

      // Complete Req 3 -> all completed
      service.complete(req3.id);
      expect(req3.state).toBe('completed');
      expect(service.snapshot().completedCount).toBe(3);
      expect(service.snapshot().queuedCount).toBe(0);
      expect(service.snapshot().activeCount).toBe(0);
    });

    it('F36.3: mergeMap runs multiple requests concurrently in parallel up to concurrency limit', () => {
      service.setOperator('mergeMap');
      service.setConcurrencyLimit(2);

      const req1 = service.trigger('Req 1', 2000);
      const req2 = service.trigger('Req 2', 1000);
      const req3 = service.trigger('Req 3', 1500);

      // With limit 2, req1 and req2 are active in parallel, req3 is queued
      expect(req1.state).toBe('active');
      expect(req2.state).toBe('active');
      expect(req3.state).toBe('queued');
      expect(service.snapshot().activeCount).toBe(2);
      expect(service.snapshot().queuedCount).toBe(1);

      // Fast request 2 completes first (interleaved completion)
      service.complete(req2.id);
      expect(req2.state).toBe('completed');
      expect(req3.state).toBe('active'); // Slot opened for req3!
      expect(req1.state).toBe('active'); // req1 still active
    });

    it('F36.4: exhaustMap ignores incoming outer emissions while an inner observable is active', () => {
      service.setOperator('exhaustMap');

      const req1 = service.trigger('Req 1', 2000);
      expect(req1.state).toBe('active');

      // These should be ignored/dropped
      const req2 = service.trigger('Req 2', 2000);
      const req3 = service.trigger('Req 3', 2000);

      expect(req2.state).toBe('ignored');
      expect(req3.state).toBe('ignored');
      expect(service.snapshot().ignoredCount).toBe(2);
      expect(service.snapshot().activeCount).toBe(1);

      // Complete Req 1
      service.complete(req1.id);
      expect(req1.state).toBe('completed');
      expect(service.snapshot().activeCount).toBe(0);

      // Now new request should be accepted
      const req4 = service.trigger('Req 4', 2000);
      expect(req4.state).toBe('active');
    });

    it('F36.5: Lifecycle state transitions reflect active, queued, cancelled, ignored, completed via TimelineStateTracker', () => {
      const tracker = new TimelineStateTracker('switchMap');
      tracker.trigger(1);
      expect(tracker.requests[1].state).toBe('active');
      tracker.trigger(2);
      expect(tracker.requests[1].state).toBe('cancelled');
      expect(tracker.requests[2].state).toBe('active');
      tracker.complete(2);
      expect(tracker.requests[2].state).toBe('completed');

      const concatTracker = new TimelineStateTracker('concatMap');
      concatTracker.trigger(1);
      expect(concatTracker.requests[1].state).toBe('active');
      concatTracker.trigger(2);
      expect(concatTracker.requests[2].state).toBe('queued');
      concatTracker.complete(1);
      expect(concatTracker.requests[1].state).toBe('completed');
      expect(concatTracker.requests[2].state).toBe('active');

      const exhaustTracker = new TimelineStateTracker('exhaustMap');
      exhaustTracker.trigger(1);
      expect(exhaustTracker.requests[1].state).toBe('active');
      exhaustTracker.trigger(2);
      expect(exhaustTracker.requests[2].state).toBe('ignored');
    });

    it('F36.B2: concatMap queues rapid sequential emissions without losing items', () => {
      service.setOperator('concatMap');

      for (let i = 1; i <= 20; i++) {
        service.trigger(`Req #${i}`, 100);
      }

      const snap = service.snapshot();
      expect(snap.requests.length).toBe(20);
      expect(snap.activeCount).toBe(1);
      expect(snap.queuedCount).toBe(19);

      // Completing all in FIFO sequence
      for (let i = 1; i <= 20; i++) {
        service.complete(i);
      }

      const finalSnap = service.snapshot();
      expect(finalSnap.completedCount).toBe(20);
      expect(finalSnap.queuedCount).toBe(0);
      expect(finalSnap.activeCount).toBe(0);
      expect(finalSnap.outputs.length).toBe(20);
    });

    it('F36.B3: exhaustMap with active inner locks out future emissions until complete', () => {
      service.setOperator('exhaustMap');

      const activeReq = service.trigger('Persistent Req', 999999);
      expect(activeReq.state).toBe('active');

      for (let i = 2; i <= 5; i++) {
        const dropped = service.trigger(`Blocked Req #${i}`, 500);
        expect(dropped.state).toBe('ignored');
      }

      expect(service.snapshot().ignoredCount).toBe(4);
      expect(service.snapshot().activeCount).toBe(1);
    });

    it('F36.B4: mergeMap with concurrency limit = 1 behaves identically to concatMap', () => {
      service.setOperator('mergeMap');
      service.setConcurrencyLimit(1);

      const req1 = service.trigger('Req 1', 1000);
      const req2 = service.trigger('Req 2', 1000);
      const req3 = service.trigger('Req 3', 1000);

      expect(req1.state).toBe('active');
      expect(req2.state).toBe('queued');
      expect(req3.state).toBe('queued');
      expect(service.snapshot().activeCount).toBe(1);
      expect(service.snapshot().queuedCount).toBe(2);

      service.complete(req1.id);
      expect(req2.state).toBe('active');
      expect(req3.state).toBe('queued');
    });

    it('F36.B5: cancelAllActive cancels in-flight inner observables on stream teardown', () => {
      service.setOperator('mergeMap');
      service.setConcurrencyLimit(2);

      service.trigger('Req 1', 2000);
      service.trigger('Req 2', 2000);
      service.trigger('Req 3', 2000);

      expect(service.snapshot().activeCount).toBe(2);
      expect(service.snapshot().queuedCount).toBe(1);

      service.cancelAllActive('Stream unsubscribed (takeUntilDestroyed)');

      const snap = service.snapshot();
      expect(snap.activeCount).toBe(0);
      expect(snap.queuedCount).toBe(0);
      expect(snap.cancelledCount).toBe(3);
    });

    it('tick advances elapsed time and completes request when duration reached', () => {
      service.setOperator('switchMap');
      const req = service.trigger('Timed Req', 500);

      expect(req.progress).toBe(0);
      service.tick(250);
      expect(req.progress).toBe(50);
      expect(req.state).toBe('active');

      service.tick(250);
      expect(req.progress).toBe(100);
      expect(req.state).toBe('completed');
      expect(service.snapshot().outputs.length).toBe(1);
    });

    it('triggerBurst fires 3 rapid requests', () => {
      service.setOperator('concatMap');
      const burst = service.triggerBurst(3, 1000);

      expect(burst.length).toBe(3);
      expect(burst[0].state).toBe('active');
      expect(burst[1].state).toBe('queued');
      expect(burst[2].state).toBe('queued');
    });

    it('reset clears all state, requests and outputs', () => {
      service.setOperator('switchMap');
      service.trigger('Req 1', 100);
      service.tick(100);
      expect(service.snapshot().completedCount).toBe(1);

      service.reset();
      const snap = service.snapshot();
      expect(snap.requests.length).toBe(0);
      expect(snap.outputs.length).toBe(0);
      expect(snap.activeCount).toBe(0);
    });
  });

  describe('Module 4 Pedagogical Data & Quizzes', () => {
    it('MODULE4_OPERATORS contains full metadata for all 4 operators', () => {
      const keys = ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'] as const;
      keys.forEach(key => {
        const op = MODULE4_OPERATORS[key];
        expect(op).toBeDefined();
        expect(op.id).toBe(key);
        expect(op.name).toBe(key);
        expect(op.title).toBeTruthy();
        expect(op.signature).toBeTruthy();
        expect(op.summary).toBeTruthy();
        expect(op.description).toBeTruthy();
        expect(op.codeSnippet).toContain(key);
        expect(op.errorHandlingSnippet).toContain('catchError');
        expect(op.angularPatternSnippet).toBeTruthy();
        expect(op.useCases.length).toBeGreaterThan(0);
        expect(op.pitfalls.length).toBeGreaterThan(0);
        expect(op.marbleRules.length).toBeGreaterThan(0);
      });
    });

    it('MODULE4_OPERATORS contains 16 comprehensive quiz questions (4 per operator)', () => {
      let totalQuestions = 0;
      const keys = ['switchMap', 'mergeMap', 'concatMap', 'exhaustMap'] as const;

      keys.forEach(key => {
        const op = MODULE4_OPERATORS[key];
        expect(op.quiz.length).toBe(4);
        totalQuestions += op.quiz.length;

        op.quiz.forEach(q => {
          expect(q.id).toBeTruthy();
          expect(q.question).toBeTruthy();
          expect(q.options.length).toBeGreaterThanOrEqual(3);
          expect(q.correctOptionId).toBeTruthy();
          expect(q.options.some(opt => opt.id === q.correctOptionId)).toBe(true);
          expect(q.explanation).toBeTruthy();
        });
      });

      expect(totalQuestions).toBe(16);
    });

    it('MODULE4_MASTER_COMPARISON includes all 4 operators across key architectural features', () => {
      expect(MODULE4_MASTER_COMPARISON.features.length).toBeGreaterThanOrEqual(6);
      expect(MODULE4_MASTER_COMPARISON.items.length).toBe(4);

      const itemIds = MODULE4_MASTER_COMPARISON.items.map(i => i.id);
      expect(itemIds).toContain('switchMap');
      expect(itemIds).toContain('mergeMap');
      expect(itemIds).toContain('concatMap');
      expect(itemIds).toContain('exhaustMap');
    });
  });

  describe('HooTimelineVisualizerComponent', () => {
    let fixture: ComponentFixture<HooTimelineVisualizerComponent>;
    let component: HooTimelineVisualizerComponent;

    const mockSnapshot: HooTimelineSnapshot = {
      operator: 'switchMap',
      concurrencyLimit: 1,
      requests: [
        {
          id: 1,
          label: 'Req 1',
          state: 'cancelled',
          durationMs: 2000,
          elapsedMs: 500,
          progress: 25,
          startTime: 0,
          color: '#6366f1',
          cancelReason: 'Superseded'
        },
        {
          id: 2,
          label: 'Req 2',
          state: 'active',
          durationMs: 2000,
          elapsedMs: 1000,
          progress: 50,
          startTime: 500,
          color: '#06b6d4'
        }
      ],
      activeCount: 1,
      queuedCount: 0,
      completedCount: 0,
      cancelledCount: 1,
      ignoredCount: 0,
      outputs: [
        {
          id: 'out-1',
          requestId: 1,
          timeMs: 1000,
          value: 'res-1',
          displayLabel: 'res-1',
          color: '#6366f1'
        }
      ],
      isRunning: true
    };

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HooTimelineVisualizerComponent],
        providers: [provideZonelessChangeDetection()]
      }).compileComponents();

      fixture = TestBed.createComponent(HooTimelineVisualizerComponent);
      component = fixture.componentInstance;
    });

    it('should create and calculate stateSummary correctly', () => {
      fixture.componentRef.setInput('snapshot', mockSnapshot);
      fixture.detectChanges();

      expect(component).toBeTruthy();
      const summary = component.stateSummary();
      expect(summary.operator).toBe('switchMap');
      expect(summary.active).toBe(1);
      expect(summary.cancelled).toBe(1);
      expect(summary.total).toBe(2);
    });

    it('should render state badge classes correctly', () => {
      expect(component.getStateBadgeClass('active')).toBe('badge-active');
      expect(component.getStateBadgeClass('queued')).toBe('badge-queued');
      expect(component.getStateBadgeClass('completed')).toBe('badge-completed');
      expect(component.getStateBadgeClass('cancelled')).toBe('badge-cancelled');
      expect(component.getStateBadgeClass('ignored')).toBe('badge-ignored');
    });

    it('should render empty timeline placeholder when requests array is empty', () => {
      const emptySnapshot: HooTimelineSnapshot = {
        operator: 'switchMap',
        concurrencyLimit: 1,
        requests: [],
        activeCount: 0,
        queuedCount: 0,
        completedCount: 0,
        cancelledCount: 0,
        ignoredCount: 0,
        outputs: [],
        isRunning: false
      };

      fixture.componentRef.setInput('snapshot', emptySnapshot);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      expect(el.querySelector('.empty-timeline')).toBeTruthy();
      expect(el.textContent).toContain('No active requests in flight');
    });

    it('should render swimlane rows when requests are present', () => {
      fixture.componentRef.setInput('snapshot', mockSnapshot);
      fixture.detectChanges();

      const el = fixture.nativeElement as HTMLElement;
      const rows = el.querySelectorAll('.track-row');
      expect(rows.length).toBe(2);
      expect(el.querySelector('.bar-cancelled')).toBeTruthy();
      expect(el.querySelector('.bar-active')).toBeTruthy();
    });
  });

  describe('HooPlaygroundComponent', () => {
    let fixture: ComponentFixture<HooPlaygroundComponent>;
    let component: HooPlaygroundComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HooPlaygroundComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          ProgressService,
          {
            provide: ActivatedRoute,
            useValue: {
              data: of({ operator: 'switchMap' }),
              snapshot: { url: [{ path: 'switch-map' }] }
            }
          }
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(HooPlaygroundComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should initialize with switchMap operator and config', () => {
      expect(component).toBeTruthy();
      expect(component.operator()).toBe('switchMap');
      expect(component.config().name).toBe('switchMap');
      expect(component.activeTab()).toBe('visual');
    });

    it('should switch operator and update concurrency parameters', () => {
      component.setOperator('mergeMap');
      expect(component.operator()).toBe('mergeMap');
      expect(component.concurrencyLimit()).toBe(2);
      expect(component.isMergeMap()).toBe(true);

      component.setOperator('concatMap');
      expect(component.operator()).toBe('concatMap');
      expect(component.concurrencyLimit()).toBe(1);
      expect(component.isMergeMap()).toBe(false);
    });

    it('should trigger single request and log to console', () => {
      const initialLogs = component.consoleEntries().length;
      component.triggerSingle();

      expect(component.engine.snapshot().requests.length).toBe(1);
      expect(component.consoleEntries().length).toBeGreaterThan(initialLogs);
    });

    it('should trigger burst of 3 requests', () => {
      component.triggerBurst();
      expect(component.engine.snapshot().requests.length).toBe(3);
    });

    it('should trigger custom request with custom label and delay', () => {
      component.customLabelInput.set('Search Query "RxJS"');
      component.customDelayInput.set(1200);
      component.triggerCustom();

      const lastReq = component.engine.snapshot().requests[component.engine.snapshot().requests.length - 1];
      expect(lastReq.label).toBe('Search Query "RxJS"');
      expect(lastReq.durationMs).toBe(1200);
    });

    it('should handle simulated teardown and cancel all active requests', () => {
      component.triggerBurst();
      expect(component.engine.snapshot().activeCount).toBeGreaterThan(0);

      component.simulateTeardown();
      expect(component.engine.snapshot().activeCount).toBe(0);
      expect(component.engine.snapshot().cancelledCount).toBeGreaterThan(0);
    });

    it('should handle reset', () => {
      component.triggerBurst();
      component.resetTimeline();

      expect(component.engine.snapshot().requests.length).toBe(0);
      expect(component.consoleEntries().length).toBe(1); // Reset log entry
    });

    it('should switch tabs and code subtabs', () => {
      component.activeTab.set('concept');
      expect(component.activeTab()).toBe('concept');

      component.codeSubTab.set('errorHandling');
      expect(component.codeSubTab()).toBe('errorHandling');

      component.codeSubTab.set('angular');
      expect(component.codeSubTab()).toBe('angular');
    });
  });

  describe('HooOverviewComponent', () => {
    let fixture: ComponentFixture<HooOverviewComponent>;
    let component: HooOverviewComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HooOverviewComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([])
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(HooOverviewComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      component.ngOnDestroy();
    });

    it('should create and configure 4 dedicated engines', () => {
      expect(component).toBeTruthy();
      expect(component.switchMapEngine.getOperator()).toBe('switchMap');
      expect(component.mergeMapEngine.getOperator()).toBe('mergeMap');
      expect(component.concatMapEngine.getOperator()).toBe('concatMap');
      expect(component.exhaustMapEngine.getOperator()).toBe('exhaustMap');
      expect(component.operatorCards.length).toBe(4);
    });

    it('runFourWayRace triggers burst simultaneously in all 4 engines', () => {
      component.runFourWayRace();
      expect(component.isRaceRunning()).toBe(true);

      // Verify divergence across all 4 operators with identical 3-request burst:
      const smSnap = component.switchMapEngine.snapshot();
      const mmSnap = component.mergeMapEngine.snapshot();
      const cmSnap = component.concatMapEngine.snapshot();
      const emSnap = component.exhaustMapEngine.snapshot();

      // switchMap: req 1 and 2 cancelled, req 3 active
      expect(smSnap.cancelledCount).toBe(2);
      expect(smSnap.activeCount).toBe(1);

      // mergeMap: all 3 running concurrently (limit was set to 3)
      expect(mmSnap.activeCount).toBe(3);
      expect(mmSnap.queuedCount).toBe(0);

      // concatMap: req 1 active, req 2 and 3 queued
      expect(cmSnap.activeCount).toBe(1);
      expect(cmSnap.queuedCount).toBe(2);

      // exhaustMap: req 1 active, req 2 and 3 ignored
      expect(emSnap.activeCount).toBe(1);
      expect(emSnap.ignoredCount).toBe(2);
    });

    it('resetRace clears all 4 engines', () => {
      component.runFourWayRace();
      component.resetRace();

      expect(component.isRaceRunning()).toBe(false);
      expect(component.switchMapEngine.snapshot().requests.length).toBe(0);
      expect(component.mergeMapEngine.snapshot().requests.length).toBe(0);
      expect(component.concatMapEngine.snapshot().requests.length).toBe(0);
      expect(component.exhaustMapEngine.snapshot().requests.length).toBe(0);
    });
  });

});
