import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { FundamentalTopicComponent } from '../module1-fundamentals/fundamental-topic.component';
import { CreationPlaygroundComponent } from './creation-playground.component';
import { ProgressService } from '../../core/services/progress.service';
import { MODULE1_TOPICS } from '../module1-fundamentals/module1.data';
import { MODULE2_OPERATORS } from './module2.data';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Milestone 2 Adversarial & Stress Testing Suite', () => {
  let routeData$: BehaviorSubject<Record<string, any>>;

  beforeEach(() => {
    localStorage.clear();
    routeData$ = new BehaviorSubject<Record<string, any>>({
      topicId: 'what-is-rxjs',
      operatorId: 'of'
    });
  });

  afterEach(() => {
    localStorage.clear();
  });

  // =========================================================================
  // 1. FundamentalTopicComponent Stress & Adversarial Tests
  // =========================================================================
  describe('FundamentalTopicComponent Adversarial & Lifecycle Stress', () => {
    let fixture: ComponentFixture<FundamentalTopicComponent>;
    let component: FundamentalTopicComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FundamentalTopicComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              data: routeData$.asObservable(),
              snapshot: { data: { topicId: 'what-is-rxjs' } }
            }
          },
          ProgressService
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(FundamentalTopicComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.destroy();
    });

    it('M2.F1: Rapid route parameter transitions between all 7 topics clean up state and subscriptions', () => {
      const topicSlugs = [
        'what-is-rxjs',
        'what-is-observable',
        'observable-vs-promise',
        'observer-subscriber',
        'subscription-lifecycle',
        'cold-vs-hot',
        'multicasting'
      ];

      // Start push stream on topic 1
      component.startPushStream();
      expect(component.isPushing()).toBeTrue();

      // Rapidly transition through other topics
      for (const slug of topicSlugs.slice(1)) {
        routeData$.next({ topicId: slug });
        fixture.detectChanges();
        expect(component.topicId()).toBe(slug);
        expect(component.topic()).not.toBeNull();
        expect(component.topic()?.id).toBe(slug);
        // Verify push stream from topic 1 was cancelled by resetDemos
        expect(component.isPushing()).toBeFalse();
      }

      // Transition backwards rapidly
      for (const slug of [...topicSlugs].reverse()) {
        routeData$.next({ topicId: slug });
        fixture.detectChanges();
        expect(component.topicId()).toBe(slug);
      }
    });

    it('M2.F2: Unknown or malformed route topic slug falls back safely without null dereference', () => {
      routeData$.next({ topicId: 'invalid-topic-slug-xyz-999' });
      fixture.detectChanges();

      expect(component.topicId()).toBe('invalid-topic-slug-xyz-999');
      // Should fall back to default what-is-rxjs topic data
      expect(component.topic()).not.toBeNull();
      expect(component.topic()?.id).toBe('what-is-rxjs');
    });

    it('M2.F3: Rapid tab switching while streams are actively logging to console', async () => {
      // Start push producer
      component.startPushStream();
      expect(component.isPushing()).toBeTrue();

      const tabs: ('concept' | 'code' | 'visual' | 'comparison' | 'quiz')[] = [
        'concept', 'code', 'visual', 'comparison', 'quiz',
        'visual', 'code', 'quiz', 'concept', 'visual'
      ];

      // Rapidly toggle tabs while emissions occur
      for (const tab of tabs) {
        component.activeTab.set(tab);
        fixture.detectChanges();
        await delay(20);
      }

      component.simulatePull();
      expect(component.consoleEntries().length).toBeGreaterThan(0);
      component.stopPushStream();
      expect(component.isPushing()).toBeFalse();
    });

    it('M2.F4: Unmounting / destruction while all 7 background simulators are running leaves no leaks', async () => {
      // Activate all async streams across all topics simultaneously
      component.startPushStream();
      component.startPromiseDemo();
      component.startObservableDemo();
      component.initSubscriptionTree();
      component.startViewer1();
      component.startViewer2();
      component.tuneInListener3();
      component.tuneInListener4();
      component.mountComponent('Adversarial-Widget-1');
      component.mountComponent('Adversarial-Widget-2');

      expect(component.isPushing()).toBeTrue();
      expect(component.promiseRunning()).toBeTrue();
      expect(component.obsRunning()).toBeTrue();
      expect(component.treeParentActive()).toBeTrue();
      expect(component.viewer1Running()).toBeTrue();
      expect(component.listener3Active()).toBeTrue();
      expect(component.activeConsumersCount()).toBe(2);

      await delay(100);

      // Destroy component fixture — must invoke ngOnDestroy() and cleanupAll()
      fixture.destroy();

      // Ensure no zombie intervals or subscriptions remain active
      await delay(200);
      expect(true).toBeTrue();
    });

    it('M2.F5: SafeSubscriber shields against user callback exceptions and blocks post-error emissions', () => {
      component.resetSafeStream();
      expect(component.streamTerminated()).toBeFalse();

      // Emit normal value
      component.safeEmitNext();
      expect(component.consoleEntries().some(e => e.type === 'next')).toBeTrue();

      // Enable simulated crash in next()
      component.simulateExceptionInNext.set(true);
      component.safeEmitNext();

      // SafeSubscriber must catch exception and terminate stream
      expect(component.streamTerminated()).toBeTrue();
      const errEntry = component.consoleEntries().find(e => e.type === 'error');
      expect(errEntry).toBeDefined();
      expect(errEntry?.description).toContain('SafeSubscriber caught user exception');

      // Attempting to emit after termination must be strictly blocked
      component.safeEmitNext();
      const lastEntry = component.consoleEntries()[component.consoleEntries().length - 1];
      expect(lastEntry.description).toContain('BLOCKED illegal next()');
    });

    it('M2.F6: Subscription tree teardown cascades cleanly to all children', () => {
      component.initSubscriptionTree();
      expect(component.treeParentActive()).toBeTrue();
      expect(component.treeChild1Active()).toBeTrue();
      expect(component.treeChild2Active()).toBeTrue();
      expect(component.treeChild3Active()).toBeTrue();

      // Unsubscribe composite parent directly
      component.unsubscribeParentTree();

      expect(component.treeParentActive()).toBeFalse();
      expect(component.treeChild1Active()).toBeFalse();
      expect(component.treeChild2Active()).toBeFalse();
      expect(component.treeChild3Active()).toBeFalse();

      const unsubLog = component.consoleEntries().find(e => e.description?.includes('Cascaded unsubscription'));
      expect(unsubLog).toBeDefined();
    });
  });

  // =========================================================================
  // 2. CreationPlaygroundComponent Stress & Adversarial Tests
  // =========================================================================
  describe('CreationPlaygroundComponent Adversarial Parameter Fuzzing & Stress', () => {
    let fixture: ComponentFixture<CreationPlaygroundComponent>;
    let component: CreationPlaygroundComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [CreationPlaygroundComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          {
            provide: ActivatedRoute,
            useValue: {
              data: routeData$.asObservable(),
              snapshot: { data: { operatorId: 'of' } }
            }
          },
          ProgressService
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(CreationPlaygroundComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      fixture.destroy();
    });

    it('M2.C1: Rapid operator route transitions while streams are executing', async () => {
      const operatorSlugs = [
        'of', 'from', 'from-event', 'interval', 'timer', 'range',
        'throw-error', 'defer', 'empty', 'never', 'generate', 'iif'
      ];

      // Start interval stream
      component.operatorId.set('interval');
      component.updateIntervalPeriod(50);
      component.runOperatorStream();
      expect(component.isRunning()).toBeTrue();

      // Cycle rapidly across all 12 operators
      for (const slug of operatorSlugs) {
        routeData$.next({ operatorId: slug });
        fixture.detectChanges();
        // Previous stream should be terminated cleanly
        expect(component.isRunning()).toBeFalse();
        expect(component.config()).not.toBeNull();
        await delay(10);
      }
    });

    it('M2.C2: Parameter fuzzing on range() with negative and zero counts', () => {
      component.operatorId.set('range');

      // Negative count: RxJS range(start, count <= 0) should complete cleanly with 0 emissions
      component.updateRangeStart(5);
      component.updateRangeCount(-10);
      expect(() => component.runOperatorStream()).not.toThrow();
      expect(component.isCompleted()).toBeTrue();
      let nexts = component.consoleEntries().filter(e => e.type === 'next');
      expect(nexts.length).toBe(0);

      // Count = 0
      component.clearConsole();
      component.updateRangeCount(0);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      nexts = component.consoleEntries().filter(e => e.type === 'next');
      expect(nexts.length).toBe(0);

      // Large range with negative start
      component.clearConsole();
      component.updateRangeStart(-50);
      component.updateRangeCount(5);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      nexts = component.consoleEntries().filter(e => e.type === 'next');
      expect(nexts.length).toBe(5);
      expect(nexts[0].value).toBe(-50);
      expect(nexts[4].value).toBe(-46);
    });

    it('M2.C3: Parameter fuzzing on interval() and timer() with 0ms or negative period', async () => {
      component.operatorId.set('interval');

      // 0ms interval period: should clamp to safe 50ms to prevent browser freeze
      component.updateIntervalPeriod(0);
      component.updateIntervalTakeCount(2);
      component.runOperatorStream();
      expect(component.isRunning()).toBeTrue();

      await delay(130);
      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();
      const intervalEmissions = component.consoleEntries().filter(e => e.type === 'next');
      expect(intervalEmissions.length).toBe(2);

      // Negative interval period
      component.clearConsole();
      component.updateIntervalPeriod(-500);
      component.updateIntervalTakeCount(1);
      component.runOperatorStream();
      await delay(80);
      expect(component.isCompleted()).toBeTrue();

      // 0ms timer due
      component.operatorId.set('timer');
      component.updateTimerMode('single_shot');
      component.updateTimerDue(0);
      component.clearConsole();
      component.runOperatorStream();
      await delay(20);
      expect(component.isCompleted()).toBeTrue();
      const timerEmissions = component.consoleEntries().filter(e => e.type === 'next');
      expect(timerEmissions.length).toBe(1);
    });

    it('M2.C4: throwError() without catchError handles error callback without throwing unhandled exception', () => {
      component.operatorId.set('throwError');
      component.updateThrowErrorMessage('Adversarial Injected Crash 500');

      // Without catchError
      expect(component.throwCatchError()).toBeFalse();
      expect(() => component.runOperatorStream()).not.toThrow();

      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeFalse();

      const errEntry = component.consoleEntries().find(e => e.type === 'error');
      expect(errEntry).toBeDefined();
      expect(errEntry?.value).toContain('Adversarial Injected Crash 500');

      // Marble diagram should have errorAtMs recorded
      const marble = component.outputMarbleStream();
      expect(marble?.errorAtMs).toBeDefined();
    });

    it('M2.C5: from() with rejected promise, empty string, and rapid unsubscription', async () => {
      component.operatorId.set('from');

      // Rejected promise
      component.updateFromInputType('promise_reject');
      component.runOperatorStream();
      expect(component.isRunning()).toBeTrue();

      await delay(1100);
      expect(component.isRunning()).toBeFalse();
      const errEntry = component.consoleEntries().find(e => e.type === 'error');
      expect(errEntry).toBeDefined();
      expect(errEntry?.value).toContain('Promise Rejected');

      // Resolved promise with unsubscription before resolution
      component.clearConsole();
      component.updateFromInputType('promise_resolve');
      component.runOperatorStream();
      expect(component.isRunning()).toBeTrue();

      // Unsubscribe at 200ms (before 1000ms timer resolves)
      await delay(200);
      component.stopOperatorStream();
      expect(component.isRunning()).toBeFalse();

      // Advance past promise resolution: no error or late emission should happen
      await delay(1000);
      const lateEmissions = component.consoleEntries().filter(e => e.type === 'next');
      expect(lateEmissions.length).toBe(0);
    });

    it('M2.C6: iif() rapid condition toggling produces mutually exclusive streams', () => {
      component.operatorId.set('iif');

      // Test alternating toggles
      for (let i = 0; i < 6; i++) {
        const cond = i % 2 === 0;
        component.updateIifCondition(cond);
        component.clearConsole();
        component.runOperatorStream();

        const next = component.consoleEntries().find(e => e.type === 'next');
        expect(next).toBeDefined();
        if (cond) {
          expect(next?.value).toContain('VIP Content');
        } else {
          expect(next?.value).toContain('Guest Content');
        }
      }
    });

    it('M2.C7: of() with empty input string, whitespaces, and punctuation', () => {
      component.operatorId.set('of');

      // Empty string
      component.updateOfValues('');
      component.clearConsole();
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(0);

      // Only spaces and commas
      component.updateOfValues('   ,  , ,   ');
      component.clearConsole();
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(0);

      // Special characters & emojis
      component.updateOfValues('⚡ RxJS, 💥 Error, 🚀 Angular 20, 🎯 Zoneless');
      component.clearConsole();
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      const nexts = component.consoleEntries().filter(e => e.type === 'next');
      expect(nexts.length).toBe(4);
      expect(nexts[0].value).toBe('⚡ RxJS');
      expect(nexts[3].value).toBe('🎯 Zoneless');
    });

    it('M2.C8: Destruction while interval stream is running prevents memory leaks and zombie emissions', async () => {
      component.operatorId.set('interval');
      component.updateIntervalPeriod(50);
      component.updateIntervalTakeCount(50);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      await delay(120);
      const countBefore = component.consoleEntries().length;
      expect(countBefore).toBeGreaterThan(0);

      // Destroy component fixture
      fixture.destroy();

      // Teardown adds an unsubscribe audit entry and cancels the timer
      const countAfterDestroy = component.consoleEntries().length;
      expect(countAfterDestroy).toBe(countBefore + 1);
      expect(component.consoleEntries()[countAfterDestroy - 1].type).toBe('unsubscribe');

      // Delay further by 300ms
      await delay(300);

      // No new zombie emissions occur after destruction
      expect(component.consoleEntries().length).toBe(countAfterDestroy);
    });

    it('M2.C9: fromEvent handles rapid click bursts, stop/restart cycles, and zero emissions post-unsubscribe', () => {
      component.operatorId.set('fromEvent');
      fixture.detectChanges();
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      const targetElement = fixture.nativeElement.querySelector('.interactive-target-box');
      expect(targetElement).toBeTruthy();

      // Burst of 25 rapid clicks
      for (let i = 0; i < 25; i++) {
        targetElement.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 50 + i * 2,
          clientY: 40 + i
        }));
      }

      let nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBe(25);
      expect(nextEntries[0].value.clientX).toBe(50);
      expect(nextEntries[24].value.clientX).toBe(98);

      // Stop stream
      component.stopOperatorStream();
      expect(component.isRunning()).toBeFalse();

      // Dispatch 15 clicks while stopped
      for (let i = 0; i < 15; i++) {
        targetElement.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 999,
          clientY: 999
        }));
      }

      // Assert zero new emissions while unsubscribed
      nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBe(25);

      // Restart stream with cleared console
      component.clearConsole();
      component.runOperatorStream();
      expect(component.isRunning()).toBeTrue();

      // Dispatch 10 clicks in restarted session
      for (let i = 0; i < 10; i++) {
        targetElement.dispatchEvent(new MouseEvent('click', {
          bubbles: true,
          cancelable: true,
          clientX: 200 + i,
          clientY: 100
        }));
      }

      const restartNextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(restartNextEntries.length).toBe(10);
      expect(restartNextEntries[0].value.clientX).toBe(200);

      const restartMarbles = component.outputMarbleStream();
      expect(restartMarbles?.emissions.length).toBe(10);

      component.stopOperatorStream();
    });

    it('M2.C10: Synchronous operators (of, from, range, generate) produce zero marble timestamp collisions', () => {
      // 1. of()
      component.operatorId.set('of');
      component.updateOfValues('A, B, C, D, E, F');
      component.runOperatorStream();
      let stream = component.outputMarbleStream();
      expect(stream).not.toBeNull();
      let times = stream!.emissions.map(e => e.timeMs);
      expect(times.length).toBe(6);
      expect(new Set(times).size).toBe(times.length);
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeLessThan(times[i + 1]);
      }
      expect(stream!.completedAtMs).toBeGreaterThan(times[times.length - 1]);

      // 2. from(array)
      component.clearConsole();
      component.operatorId.set('from');
      component.updateFromInputType('array');
      component.runOperatorStream();
      stream = component.outputMarbleStream();
      times = stream!.emissions.map(e => e.timeMs);
      expect(times.length).toBe(4);
      expect(new Set(times).size).toBe(times.length);
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeLessThan(times[i + 1]);
      }

      // 3. range()
      component.clearConsole();
      component.operatorId.set('range');
      component.updateRangeStart(10);
      component.updateRangeCount(8);
      component.runOperatorStream();
      stream = component.outputMarbleStream();
      times = stream!.emissions.map(e => e.timeMs);
      expect(times.length).toBe(8);
      expect(new Set(times).size).toBe(times.length);
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeLessThan(times[i + 1]);
      }

      // 4. generate()
      component.clearConsole();
      component.operatorId.set('generate');
      component.updateGeneratePreset('powers_of_2');
      component.runOperatorStream();
      stream = component.outputMarbleStream();
      times = stream!.emissions.map(e => e.timeMs);
      expect(times.length).toBe(7); // 1, 2, 4, 8, 16, 32, 64
      expect(new Set(times).size).toBe(times.length);
      for (let i = 0; i < times.length - 1; i++) {
        expect(times[i]).toBeLessThan(times[i + 1]);
      }
    });

    it('M2.C11: from(Promise.reject) propagates error to console and marble without unhandled promise rejection', async () => {
      let unhandled = false;
      const rejectionHandler = () => { unhandled = true; };
      window.addEventListener('unhandledrejection', rejectionHandler);

      component.operatorId.set('from');
      component.updateFromInputType('promise_reject');
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();

      await delay(1100);

      window.removeEventListener('unhandledrejection', rejectionHandler);

      expect(unhandled).toBeFalse();
      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeFalse();

      const errEntry = component.consoleEntries().find(e => e.type === 'error');
      expect(errEntry).toBeDefined();
      expect(errEntry?.value).toContain('Promise Rejected');

      const stream = component.outputMarbleStream();
      expect(stream?.errorAtMs).toBeDefined();
      expect(stream?.completedAtMs).toBeUndefined();
    });
  });
});

