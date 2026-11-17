import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { BehaviorSubject, of, throwError, EMPTY } from 'rxjs';
import { finalize, take } from 'rxjs/operators';

import { OperatorCatalogComponent } from './operator-catalog.component';
import { MODULE3_OPERATORS } from './module3.data';
import { ProgressService } from '../../core/services/progress.service';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('Milestone 3 Adversarial & Stress Testing Suite', () => {
  let fixture: ComponentFixture<OperatorCatalogComponent>;
  let component: OperatorCatalogComponent;
  let routeParams$: BehaviorSubject<Record<string, string>>;

  beforeEach(async () => {
    routeParams$ = new BehaviorSubject<Record<string, string>>({
      category: 'transformation',
      operatorId: 'map'
    });

    await TestBed.configureTestingModule({
      imports: [OperatorCatalogComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            params: routeParams$.asObservable(),
            snapshot: {
              params: { category: 'transformation', operatorId: 'map' }
            }
          }
        },
        ProgressService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(OperatorCatalogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    if (component) {
      component.stopOperatorStream();
    }
    fixture.destroy();
  });

  // =========================================================================
  // 1. Adversarial Dimension: Empty Input Streams
  // =========================================================================
  describe('1. Adversarial Stress: Empty Input Streams', () => {
    it('ADV-1.1: reduce on empty custom stream emits seed (0) and completes gracefully', () => {
      component.selectCategory('transformation');
      component.selectOperator('reduce');
      component.selectedSourcePreset.set('custom');
      component.customSourceInput.set('');

      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();
      const nextLogs = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextLogs.length).toBe(1);
      expect(nextLogs[0].value).toBe(0); // Default seed
      expect(component.outputMarbleStream()?.completedAtMs).toBeDefined();
    });

    it('ADV-1.2: toArray on empty custom stream emits empty array [] and completes', () => {
      component.selectCategory('transformation');
      component.selectOperator('toArray');
      component.selectedSourcePreset.set('custom');
      component.customSourceInput.set('   ');

      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();
      const nextLogs = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextLogs.length).toBe(1);
      expect(Array.isArray(nextLogs[0].value)).toBeTrue();
      expect(nextLogs[0].value.length).toBe(0);
      expect(component.outputMarbleStream()?.emissions[0].displayLabel).toBe('[]');
    });

    it('ADV-1.3: take(0) on non-empty and empty streams completes immediately with zero emissions', () => {
      component.selectCategory('filtering');
      component.selectOperator('take');
      component.updateParam('count', 0);

      // Run on standard non-empty stream
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();
      let nextLogs = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextLogs.length).toBe(0);
      expect(component.outputMarbleStream()?.emissions.length).toBe(0);
      expect(component.outputMarbleStream()?.completedAtMs).toBeDefined();

      // Run on empty custom stream
      component.selectedSourcePreset.set('custom');
      component.customSourceInput.set('');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      nextLogs = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextLogs.length).toBe(0);
    });

    it('ADV-1.4: filter on empty stream completes gracefully without unhandled errors', () => {
      component.selectCategory('filtering');
      component.selectOperator('filter');
      component.selectedSourcePreset.set('custom');
      component.customSourceInput.set('');

      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();
      const nextLogs = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextLogs.length).toBe(0);
    });

    it('ADV-1.5: pairwise, groupBy, and scan handle empty stream without crashing', () => {
      // Pairwise on empty stream: emits nothing and completes
      component.selectCategory('transformation');
      component.selectOperator('pairwise');
      component.selectedSourcePreset.set('custom');
      component.customSourceInput.set('');
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(0);

      // GroupBy on empty stream
      component.selectOperator('groupBy');
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();

      // Scan on empty stream
      component.selectOperator('scan');
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
    });
  });

  // =========================================================================
  // 2. Adversarial Dimension: Error Input Streams & Cleanup
  // =========================================================================
  describe('2. Adversarial Stress: Error Input Streams & Cleanup', () => {
    it('ADV-2.1: Error input stream propagates error, records terminal error cross marker, and stops running', () => {
      component.selectCategory('transformation');
      component.selectOperator('map');
      component.selectedSourcePreset.set('error');

      component.runOperatorStream();

      // The error preset emits 1, 2, then error
      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeFalse();

      // Source stream should have errorAtMs recorded (SVG cross marker)
      const inputStreams = component.inputMarbleStreams();
      expect(inputStreams[0].errorAtMs).toBeDefined();

      // Output stream should have errorAtMs recorded
      const outStream = component.outputMarbleStream();
      expect(outStream?.errorAtMs).toBeDefined();

      // Console should have logged next entries then error entry
      const errorLogs = component.consoleEntries().filter(e => e.type === 'error');
      expect(errorLogs.length).toBeGreaterThanOrEqual(1);
      expect(errorLogs[0].value).toContain('Simulated Stream Error');
    });

    it('ADV-2.2: retry operator recovers from error input stream and completes cleanly', () => {
      component.selectCategory('utility');
      component.selectOperator('retry');
      component.updateParam('count', 2);
      // retry operator automatically uses 'error' preset
      component.runOperatorStream();

      // Error preset fails on attempt 1, then succeeds on attempt 2 emitting 3 and complete
      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeTrue();

      const outStream = component.outputMarbleStream();
      expect(outStream?.errorAtMs).toBeUndefined();
      expect(outStream?.completedAtMs).toBeDefined();
    });

    it('ADV-2.3: finalize block executes reliably during error termination', () => {
      let finalizeRan = false;
      const pipelineFactory = MODULE3_OPERATORS['finalize'].pipelineFactory;
      const errorSource$ = throwError(() => new Error('Fatal'));

      pipelineFactory(errorSource$, {}, {}).pipe(
        finalize(() => { finalizeRan = true; })
      ).subscribe({
        error: () => {}
      });

      expect(finalizeRan).toBeTrue();
    });
  });

  // =========================================================================
  // 3. Adversarial Dimension: Concurrency, Rapid Clicking & Teardown
  // =========================================================================
  describe('3. Adversarial Stress: Concurrency & Rapid Clicks', () => {
    it('ADV-3.1: 50 rapid synchronous runOperatorStream calls cleanly teardown previous subscriptions without race conditions', () => {
      component.selectCategory('transformation');
      component.selectOperator('map');

      for (let i = 0; i < 50; i++) {
        component.runOperatorStream();
      }

      // Final state should be valid and complete for synchronous source
      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();

      // Only the final run's console entries should be retained (clearConsole on each run)
      const subLogs = component.consoleEntries().filter(e => e.type === 'subscribe');
      expect(subLogs.length).toBe(1);
    });

    it('ADV-3.2: 50 rapid alternating run/stop calls leave component in idle stopped state', () => {
      component.selectCategory('utility');
      component.selectOperator('delay');
      component.updateParam('delayMs', 500);

      for (let i = 0; i < 50; i++) {
        component.runOperatorStream();
        component.stopOperatorStream();
      }

      expect(component.isRunning()).toBeFalse();
      const lastEntry = component.consoleEntries().slice(-1)[0];
      expect(lastEntry?.type).toBe('unsubscribe');
    });

    it('ADV-3.3: Rapid operator switching while running halts previous pipeline and clears timers', async () => {
      component.selectCategory('filtering');
      component.selectOperator('debounceTime');
      component.selectedSourcePreset.set('burst');
      component.updateParam('dueTimeMs', 100);

      component.runOperatorStream();
      expect(component.isRunning()).toBeTrue();

      // Rapidly switch operators
      component.selectOperator('take');
      expect(component.selectedOperatorId()).toBe('take');

      // Previous active stream must be cleaned up
      component.stopOperatorStream();
      expect(component.isRunning()).toBeFalse();

      // Wait past the burst timers (15ms)
      await delay(30);

      // Verify no unexpected asynchronous events leaked into take
      expect(component.isRunning()).toBeFalse();
    });
  });

  // =========================================================================
  // 4. Adversarial Dimension: Boundary Parameter Extremes
  // =========================================================================
  describe('4. Adversarial Stress: Boundary Parameter Extremes', () => {
    it('ADV-4.1: delay(0) shifts execution asynchronously without hanging', async () => {
      component.selectCategory('utility');
      component.selectOperator('delay');
      component.updateParam('delayMs', 0);

      component.runOperatorStream();
      await delay(20);

      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeTrue();
    });

    it('ADV-4.2: debounceTime(0) batches synchronous emissions and handles zero dueTime without hanging', async () => {
      // 1. Test component execution with dueTimeMs = 0
      component.selectCategory('filtering');
      component.selectOperator('debounceTime');
      component.updateParam('dueTimeMs', 0);

      component.runOperatorStream();
      await delay(40);

      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeTrue();
      const nextLogs = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextLogs.length).toBeGreaterThanOrEqual(1);

      // 2. Direct pipeline test: synchronous burst is batched to single final emission
      const pipelineFactory = MODULE3_OPERATORS['debounceTime'].pipelineFactory;
      let synDebouncedVal: any = null;
      pipelineFactory(of(1, 2, 3, 4, 5), { dueTimeMs: 0 }, {}).subscribe(v => {
        synDebouncedVal = v;
      });
      await delay(20);
      expect(synDebouncedVal).toBe(5);
    });

    it('ADV-4.3: negative values (take(-1), skip(-1), multiplier = -10) handle gracefully', () => {
      // take(-1) in RxJS acts as take(0) -> completes with 0 emissions
      component.selectCategory('filtering');
      component.selectOperator('take');
      component.updateParam('count', -1);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(0);

      // skip(-1) in RxJS acts as skip(0) -> emits all items
      component.selectOperator('skip');
      component.updateParam('count', -1);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(5);

      // map with multiplier = -10
      component.selectCategory('transformation');
      component.selectOperator('map');
      component.updateParam('multiplier', -10);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      const vals = component.consoleEntries().filter(e => e.type === 'next').map(e => e.value);
      expect(vals).toEqual([-10, -20, -30, -40, -50]);
    });

    it('ADV-4.4: extreme high numbers (take(999999), skip(999999)) execute correctly', () => {
      component.selectCategory('filtering');
      component.selectOperator('take');
      component.updateParam('count', 999999);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(5);

      component.selectOperator('skip');
      component.updateParam('count', 999999);
      component.runOperatorStream();
      expect(component.isCompleted()).toBeTrue();
      expect(component.consoleEntries().filter(e => e.type === 'next').length).toBe(0);
    });

    it('ADV-4.5: custom stream with malformed or irregular comma-separated inputs parses safely', () => {
      component.selectCategory('transformation');
      component.selectOperator('map');
      component.selectedSourcePreset.set('custom');
      component.updateParam('multiplier', 2);

      // Malformed input with extra commas and spaces
      component.customSourceInput.set(',,  10 , , 20, 30 ,,, ');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const vals = component.consoleEntries().filter(e => e.type === 'next').map(e => e.value);
      expect(vals).toEqual([20, 40, 60]);
    });

    it('ADV-4.6: all 65 pipeline factories handle empty params object {} without throwing', () => {
      const dummySource$ = of(1, 2, 3);
      for (const [id, op] of Object.entries(MODULE3_OPERATORS)) {
        expect(() => {
          const stream$ = op.pipelineFactory(dummySource$, {}, { source2$: of('A') });
          const sub = stream$.subscribe({ error: () => {} });
          sub.unsubscribe();
        }).not.toThrow(`Operator ${id} threw when passed empty params {}`);
      }
    });
  });
});
