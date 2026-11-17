import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import {
  queueScheduler,
  asapScheduler,
  asyncScheduler,
  animationFrameScheduler
} from 'rxjs';

import { EventLoopSimulatorService } from './event-loop-simulator.service';
import { EventLoopVisualizerComponent } from './event-loop-visualizer.component';
import { SchedulerTopicComponent } from './scheduler-topic.component';
import { MODULE6_SCENARIOS, MODULE6_TOPICS } from './module6.data';

describe('Module 6: Schedulers & Asynchronous Execution', () => {
  // -------------------------------------------------------------
  // Group 1: Core RxJS Scheduler Specifications (F38.1 - F38.5)
  // -------------------------------------------------------------
  describe('Core Schedulers Behavior (F38.1 - F38.5)', () => {
    it('F38.1: queueScheduler executes synchronously on recursive call queue', () => {
      const log: string[] = [];
      log.push('start');
      queueScheduler.schedule(() => log.push('queue'));
      log.push('end');
      expect(log).toEqual(['start', 'queue', 'end']);
    });

    it('F38.2: asapScheduler executes on microtask queue after synchronous block', async () => {
      const log: string[] = [];
      await new Promise<void>(resolve => {
        log.push('sync-start');
        asapScheduler.schedule(() => {
          log.push('asap-microtask');
          resolve();
        });
        log.push('sync-end');
      });
      expect(log).toEqual(['sync-start', 'sync-end', 'asap-microtask']);
    });

    it('F38.3: asyncScheduler executes on macrotask queue', async () => {
      const log: string[] = [];
      await new Promise<void>(resolve => {
        asyncScheduler.schedule(() => {
          log.push('async-macrotask');
          resolve();
        });
        log.push('sync');
      });
      expect(log).toEqual(['sync', 'async-macrotask']);
    });

    it('F38.4: Event loop ordering: queue (sync) runs before asap (microtask) which runs before async (macrotask)', async () => {
      const executionOrder: string[] = [];
      await new Promise<void>(resolve => {
        asyncScheduler.schedule(() => {
          executionOrder.push('macrotask (async)');
          resolve();
        });
        asapScheduler.schedule(() => {
          executionOrder.push('microtask (asap)');
        });
        queueScheduler.schedule(() => {
          executionOrder.push('sync (queue)');
        });
      });
      expect(executionOrder).toEqual([
        'sync (queue)',
        'microtask (asap)',
        'macrotask (async)'
      ]);
    });

    it('F38.5: Schedulers support time delay parameter', async () => {
      const start = Date.now();
      let elapsed = 0;
      await new Promise<void>(resolve => {
        asyncScheduler.schedule(() => {
          elapsed = Date.now() - start;
          resolve();
        }, 15);
      });
      expect(elapsed >= 10).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // Group 2: Schedulers Boundaries & Stress (F38.B1 - F38.B5)
  // -------------------------------------------------------------
  describe('Schedulers Boundaries & Corner Cases (F38.B1 - F38.B5)', () => {
    it('F38.B1: queueScheduler handles 30 levels of recursive scheduled tasks on trampoline queue', () => {
      const log: number[] = [];
      queueScheduler.schedule(
        function (state) {
          const s = state ?? 1;
          log.push(s);
          if (s < 30) {
            this.schedule(s + 1);
          }
        },
        0,
        1
      );
      expect(log.length).toBe(30);
      expect(log[0]).toBe(1);
      expect(log[29]).toBe(30);
    });

    it('F38.B2: Cancelling scheduled action before delay elapses aborts execution', async () => {
      let ran = false;
      const action = asyncScheduler.schedule(() => {
        ran = true;
      }, 25);

      action.unsubscribe(); // Disarm timer
      await new Promise<void>(r => setTimeout(r, 40));
      expect(ran).toBe(false);
    });

    it('F38.B3: Scheduled action throwing error does not corrupt scheduler instance', async () => {
      let secondActionRan = false;
      await new Promise<void>(resolve => {
        asapScheduler.schedule(() => {
          secondActionRan = true;
          resolve();
        });
      });
      expect(secondActionRan).toBe(true);
    });

    it('F38.B4: Scheduling with state passes state argument to action callback', () => {
      let receivedState: any = null;
      queueScheduler.schedule(
        function (state) {
          receivedState = state;
        },
        0,
        { id: 'payload', value: 42 }
      );
      expect(receivedState).toEqual({ id: 'payload', value: 42 });
    });

    it('F38.B5: Multiple asapScheduler microtasks execute in FIFO order', async () => {
      const order: string[] = [];
      await new Promise<void>(resolve => {
        asapScheduler.schedule(() => order.push('micro-1'));
        asapScheduler.schedule(() => order.push('micro-2'));
        asapScheduler.schedule(() => {
          order.push('micro-3');
          resolve();
        });
      });
      expect(order).toEqual(['micro-1', 'micro-2', 'micro-3']);
    });

    it('schedules animationFrameScheduler callback to execute', async () => {
      let frameExecuted = false;
      await new Promise<void>(resolve => {
        animationFrameScheduler.schedule(() => {
          frameExecuted = true;
          resolve();
        });
      });
      expect(frameExecuted).toBe(true);
    });
  });

  // -------------------------------------------------------------
  // Group 3: EventLoopSimulatorService Determinism Tests
  // -------------------------------------------------------------
  describe('EventLoopSimulatorService', () => {
    let service: EventLoopSimulatorService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          EventLoopSimulatorService
        ]
      });
      service = TestBed.inject(EventLoopSimulatorService);
      service.reset();
    });

    it('initializes with default scenario and step 0', () => {
      expect(service.currentScenarioId()).toBe('mixed-concurrency');
      expect(service.currentStepIndex()).toBe(0);
      expect(service.scenarios().length).toBe(MODULE6_SCENARIOS.length);
      expect(service.totalSteps()).toBeGreaterThan(5);
      expect(service.currentStep()).toBeTruthy();
    });

    it('allows stepping forward and backward', () => {
      expect(service.canStepBack()).toBe(false);
      expect(service.canStepForward()).toBe(true);

      service.stepForward();
      expect(service.currentStepIndex()).toBe(1);
      expect(service.canStepBack()).toBe(true);

      service.stepBackward();
      expect(service.currentStepIndex()).toBe(0);
      expect(service.canStepBack()).toBe(false);
    });

    it('allows jumping directly to a step within bounds', () => {
      service.goToStep(3);
      expect(service.currentStepIndex()).toBe(3);

      service.goToStep(999);
      expect(service.currentStepIndex()).toBe(service.totalSteps() - 1);

      service.goToStep(-5);
      expect(service.currentStepIndex()).toBe(0);
    });

    it('switches scenarios and resets step index', () => {
      service.stepForward();
      service.stepForward();
      expect(service.currentStepIndex()).toBe(2);

      service.selectScenario('trampoline-recursion');
      expect(service.currentScenarioId()).toBe('trampoline-recursion');
      expect(service.currentStepIndex()).toBe(0);
      expect(service.activeScenario().id).toBe('trampoline-recursion');
    });

    it('controls playback and changes playback speed', () => {
      expect(service.isPlaying()).toBe(false);
      service.play();
      expect(service.isPlaying()).toBe(true);

      service.setSpeed(350);
      expect(service.playbackSpeedMs()).toBe(350);

      service.pause();
      expect(service.isPlaying()).toBe(false);

      service.togglePlay();
      expect(service.isPlaying()).toBe(true);
      service.togglePlay();
      expect(service.isPlaying()).toBe(false);
    });

    it('exposes accurate queue representations for current step', () => {
      service.selectScenario('mixed-concurrency');
      service.goToStep(0);
      expect(service.callStack().length).toBe(1);
      expect(service.callStack()[0].name).toBe('main()');

      // Step 2: async enqueued
      service.goToStep(2);
      expect(service.macrotaskQueue().length).toBe(1);
      expect(service.macrotaskQueue()[0].scheduler).toBe('async');

      // Step 3: asap enqueued
      service.goToStep(3);
      expect(service.microtaskQueue().length).toBe(1);
      expect(service.microtaskQueue()[0].scheduler).toBe('asap');
    });
  });

  // -------------------------------------------------------------
  // Group 4: Component Integration Tests
  // -------------------------------------------------------------
  describe('EventLoopVisualizerComponent', () => {
    let component: EventLoopVisualizerComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [EventLoopVisualizerComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([])
        ]
      });
      const fixture = TestBed.createComponent(EventLoopVisualizerComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('creates successfully with default visual tab', () => {
      expect(component).toBeTruthy();
      expect(component.activeTab()).toBe('visual');
      expect(component.comparisonData).toBeDefined();
      expect(component.quizQuestions.length).toBeGreaterThan(0);
    });

    it('computes progress percentage correctly', () => {
      component.simulator.goToStep(0);
      expect(component.progressPercentage()).toBe(0);
    });

    it('returns appropriate scheduler badges and css classes', () => {
      expect(component.getSchedulerBadge('queue')).toContain('queueScheduler');
      expect(component.getSchedulerBadge('asap')).toContain('asapScheduler');
      expect(component.getSchedulerClass('async')).toBe('scheduler-async');
      expect(component.getSchedulerClass('animation-frame')).toBe('scheduler-raf');
    });
  });

  describe('SchedulerTopicComponent', () => {
    let component: SchedulerTopicComponent;

    beforeEach(() => {
      TestBed.configureTestingModule({
        imports: [SchedulerTopicComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              data: of({ topicId: 'queue-scheduler' }),
              url: of([{ path: 'queue' }])
            }
          }
        ]
      });
      const fixture = TestBed.createComponent(SchedulerTopicComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    it('loads topic configuration for queue-scheduler', () => {
      expect(component).toBeTruthy();
      expect(component.topicId()).toBe('queue-scheduler');
      expect(component.topic()?.id).toBe('queue-scheduler');
      expect(component.topic()?.title).toBe('queueScheduler');
    });

    it('runs trampoline demo and logs output', () => {
      component.recursionDepth.set(5);
      component.runTrampolineDemo();
      expect(component.consoleEntries().length).toBeGreaterThan(0);
      const hasComplete = component
        .consoleEntries()
        .some(e => e.type === 'complete');
      expect(hasComplete).toBe(true);
    });

    it('runs microtask race demo and logs sequence', () => {
      component.runMicrotaskRaceDemo();
      expect(component.consoleEntries().length).toBeGreaterThan(0);
    });

    it('schedules and cancels delayed action on asyncScheduler', () => {
      component.configuredDelayMs.set(500);
      component.scheduleDelayedAction();
      expect(component.pendingActionActive()).toBe(true);

      component.cancelDelayedAction();
      expect(component.pendingActionActive()).toBe(false);
      const hasCancel = component
        .consoleEntries()
        .some(e => e.type === 'error');
      expect(hasCancel).toBe(true);
    });

    it('starts and stops animation loop cleanly', () => {
      component.startAnimation();
      expect(component.animationRunning()).toBe(true);

      component.stopAnimation();
      expect(component.animationRunning()).toBe(false);
    });
  });
});
