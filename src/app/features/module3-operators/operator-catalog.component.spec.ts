import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { OperatorCatalogComponent } from './operator-catalog.component';
import { MODULE3_OPERATORS } from './module3.data';
import { ProgressService } from '../../core/services/progress.service';

describe('OperatorCatalogComponent Unit Test Suite', () => {
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
    fixture.destroy();
  });

  // -------------------------------------------------------------------------
  // Suite 1: Component Initialization & Route Defaults
  // -------------------------------------------------------------------------
  describe('1. Component Initialization & Routing', () => {
    it('should initialize with default category transformation and operator map', () => {
      expect(component).toBeTruthy();
      expect(component.selectedCategory()).toBe('transformation');
      expect(component.selectedOperatorId()).toBe('map');
      expect(component.currentOperatorData()).not.toBeNull();
      expect(component.currentOperatorData()?.id).toBe('map');
    });

    it('should update activeTab signal correctly across all 5 tabs', () => {
      expect(component.activeTab()).toBe('concept');
      component.activeTab.set('code');
      expect(component.activeTab()).toBe('code');
      component.activeTab.set('visual');
      expect(component.activeTab()).toBe('visual');
      component.activeTab.set('comparison');
      expect(component.activeTab()).toBe('comparison');
      component.activeTab.set('quiz');
      expect(component.activeTab()).toBe('quiz');
    });

    it('should switch category and auto-select first operator in new category', () => {
      component.selectCategory('filtering');
      expect(component.selectedCategory()).toBe('filtering');
      expect(component.selectedOperatorId()).toBe('filter');

      component.selectCategory('combination');
      expect(component.selectedCategory()).toBe('combination');
      expect(component.selectedOperatorId()).toBe('combineLatest');

      component.selectCategory('utility');
      expect(component.selectedCategory()).toBe('utility');
      expect(component.selectedOperatorId()).toBe('tap');

      component.selectCategory('multicasting');
      expect(component.selectedCategory()).toBe('multicasting');
      expect(component.selectedOperatorId()).toBe('share');
    });

    it('should switch operator pill within active category', () => {
      component.selectOperator('scan');
      expect(component.selectedOperatorId()).toBe('scan');
      expect(component.currentOperatorData()?.name).toBe('scan');
    });

    it('should handle invalid category or operator slug with safe fallback', () => {
      routeParams$.next({ category: 'non_existent_category', operatorId: 'xyz_999' });
      fixture.detectChanges();
      expect(component.selectedCategory()).toBe('transformation');
      expect(component.selectedOperatorId()).toBe('map');
    });
  });

  // -------------------------------------------------------------------------
  // Suite 2: Catalog Data Schema & Completeness (65 Operators)
  // -------------------------------------------------------------------------
  describe('2. Catalog Data Schema & Completeness (65 Operators)', () => {
    it('should contain exactly 65 operators across the 5 categories', () => {
      const allKeys = Object.keys(MODULE3_OPERATORS);
      expect(allKeys.length).toBe(65);

      const categoryCounts: Record<string, number> = {
        transformation: 0,
        filtering: 0,
        combination: 0,
        utility: 0,
        multicasting: 0
      };

      for (const op of Object.values(MODULE3_OPERATORS)) {
        categoryCounts[op.category]++;
      }

      expect(categoryCounts['transformation']).toBe(18);
      expect(categoryCounts['filtering']).toBe(19);
      expect(categoryCounts['combination']).toBe(11);
      expect(categoryCounts['utility']).toBe(12);
      expect(categoryCounts['multicasting']).toBe(5);
    });

    it('should enforce complete metadata, code snippets, and quizzes on every operator', () => {
      const deprecatedIds = ['mapTo', 'pluck', 'repeatWhen', 'retryWhen', 'multicast', 'publish', 'refCount'];

      for (const [id, op] of Object.entries(MODULE3_OPERATORS)) {
        expect(op.id).toBe(id);
        expect(op.name.length).toBeGreaterThan(0, `Operator ${id} name missing`);
        expect(op.signature.length).toBeGreaterThan(0, `Operator ${id} signature missing`);
        expect(op.summary.length).toBeGreaterThan(0, `Operator ${id} summary missing`);
        expect(op.description.length).toBeGreaterThan(0, `Operator ${id} description missing`);
        expect(op.codeExample.length).toBeGreaterThan(0, `Operator ${id} codeExample missing`);
        expect(op.asciiMarble.input.length).toBeGreaterThan(0, `Operator ${id} ascii input missing`);
        expect(op.asciiMarble.output.length).toBeGreaterThan(0, `Operator ${id} ascii output missing`);

        // Pedagogical metadata enforcement
        expect(op.metadata).toBeDefined(`Operator ${id} metadata missing`);
        expect(op.metadata.useCases?.length).toBeGreaterThanOrEqual(2, `Operator ${id} metadata.useCases missing or < 2`);
        expect(op.metadata.pitfalls?.length).toBeGreaterThanOrEqual(1, `Operator ${id} metadata.pitfalls missing or < 1`);
        expect(op.metadata.relatedOperators?.length).toBeGreaterThanOrEqual(1, `Operator ${id} metadata.relatedOperators missing`);
        expect(op.metadata.docUrl?.length).toBeGreaterThan(0, `Operator ${id} metadata.docUrl missing`);

        // Interactive parameters
        expect(op.interactiveConfig).toBeDefined(`Operator ${id} interactiveConfig missing`);
        expect(op.interactiveConfig.sourcePreset).toBeDefined();

        // Quiz validation
        expect(op.quiz.length).toBeGreaterThanOrEqual(1, `Operator ${id} must have >= 1 quiz question`);
        for (const q of op.quiz) {
          expect(q.options.length).toBeGreaterThanOrEqual(2);
          const optionIds = q.options.map(o => o.id);
          expect(optionIds).toContain(q.correctOptionId, `Quiz in ${id} has invalid correctOptionId`);
          expect(q.explanation.length).toBeGreaterThan(0);
        }

        // Deprecation enforcement
        if (deprecatedIds.includes(id)) {
          expect(op.isDeprecated).toBe(true, `Operator ${id} must have isDeprecated: true at root`);
          expect(op.metadata.isDeprecated).toBe(true, `Operator ${id} must have isDeprecated: true in metadata`);
          expect(op.metadata.deprecationNotice?.length).toBeGreaterThan(0, `Operator ${id} deprecationNotice missing`);
          expect(op.metadata.modernAlternative?.length).toBeGreaterThan(0, `Operator ${id} modernAlternative missing`);
        }
      }
    });

    it('should declare explicit deprecation metadata on all 7 deprecated operators', () => {
      const deprecatedIds = ['mapTo', 'pluck', 'repeatWhen', 'retryWhen', 'multicast', 'publish', 'refCount'];
      for (const depId of deprecatedIds) {
        const op = MODULE3_OPERATORS[depId];
        expect(op).toBeDefined(`Operator ${depId} must exist in catalog`);
        expect(op.isDeprecated).toBe(true, `Operator ${depId} must have isDeprecated: true at root`);
        expect(op.metadata.isDeprecated).toBe(true, `Operator ${depId} must have isDeprecated: true in metadata`);
        expect(op.metadata.deprecationNotice?.length).toBeGreaterThan(0, `Operator ${depId} deprecationNotice missing`);
        expect(op.metadata.modernAlternative?.length).toBeGreaterThan(0, `Operator ${depId} modernAlternative missing`);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Suite 3: Dual-Track Marble Generation & Parameter State
  // -------------------------------------------------------------------------
  describe('3. Dual-Track Marble Stream Generation', () => {
    it('should generate source marble stream and output marble stream upon run', () => {
      component.selectOperator('map');
      component.runOperatorStream();

      const inputStreams = component.inputMarbleStreams();
      const outputStream = component.outputMarbleStream();

      expect(inputStreams.length).toBeGreaterThanOrEqual(1);
      expect(inputStreams[0].emissions.length).toBeGreaterThan(0);
      expect(outputStream).not.toBeNull();
      expect(outputStream?.emissions.length).toBeGreaterThan(0);
    });

    it('should update parameters dynamically and reflect in executed output', () => {
      component.selectOperator('map');
      component.updateParam('multiplier', 10);
      component.runOperatorStream();

      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThan(0);
      expect(nextEntries[0].value).toBe(10); // 1 * 10 = 10
    });

    it('should dynamically space completion tick after synchronous emissions (completedAtMs >= maxTime + 100)', () => {
      component.selectCategory('transformation');
      component.selectOperator('map');
      component.runOperatorStream();

      const outStream = component.outputMarbleStream();
      expect(outStream).not.toBeNull();
      expect(outStream!.completedAtMs).toBeDefined();

      const maxEmissionTime = Math.max(...outStream!.emissions.map(e => e.timeMs));
      expect(outStream!.completedAtMs!).toBeGreaterThanOrEqual(maxEmissionTime + 100);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 4: Real Operator Execution — Transformation (map, scan)
  // -------------------------------------------------------------------------
  describe('4. Real Execution: Transformation Operators', () => {
    it('should execute map(x => x * 2) synchronously and complete', () => {
      component.selectOperator('map');
      component.updateParam('multiplier', 2);
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      expect(component.isRunning()).toBeFalse();

      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([2, 4, 6, 8, 10]);
    });

    it('should execute scan((acc, curr) => acc + curr) accumulating values', () => {
      component.selectOperator('scan');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([1, 3, 6, 10, 15]);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 5: Real Execution: Filtering (filter, debounceTime)
  // -------------------------------------------------------------------------
  describe('5. Real Execution: Filtering Operators', () => {
    it('should execute filter(x => x % 2 === 0) filtering odd values', () => {
      component.selectCategory('filtering');
      component.selectOperator('filter');
      component.updateParam('predicate', 'even');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([2, 4]);
    });

    it('should execute debounceTime and emit only trailing burst value', async () => {
      component.selectCategory('filtering');
      component.selectOperator('debounceTime');
      component.updateParam('dueTimeMs', 20);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      await new Promise(r => setTimeout(r, 60));

      expect(component.isRunning()).toBeFalse();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Suite 6: Real Execution: Combination (merge, combineLatest)
  // -------------------------------------------------------------------------
  describe('6. Real Execution: Combination Operators', () => {
    it('should execute merge interleaving dual source streams', () => {
      component.selectCategory('combination');
      component.selectOperator('merge');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThanOrEqual(4);
    });

    it('should execute combineLatest emitting combined latest pairs', () => {
      component.selectCategory('combination');
      component.selectOperator('combineLatest');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThan(0);
      expect(Array.isArray(nextEntries[0].value)).toBeTrue();
    });
  });

  // -------------------------------------------------------------------------
  // Suite 7: Real Execution: Utility & Multicasting (tap, delay, shareReplay)
  // -------------------------------------------------------------------------
  describe('7. Real Execution: Utility & Multicasting', () => {
    it('should execute tap recording side effects without mutating stream', () => {
      component.selectCategory('utility');
      component.selectOperator('tap');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.map(e => e.value)).toEqual([1, 2, 3, 4, 5]);
    });

    it('should execute delay shifting emission timing into the future', async () => {
      component.selectCategory('utility');
      component.selectOperator('delay');
      component.updateParam('delayMs', 25);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      await new Promise(r => setTimeout(r, 60));

      expect(component.isRunning()).toBeFalse();
      expect(component.isCompleted()).toBeTrue();
    });

    it('should execute shareReplay caching emissions for subsequent subscriber', () => {
      component.selectCategory('multicasting');
      component.selectOperator('shareReplay');
      component.runOperatorStream();

      expect(component.isCompleted()).toBeTrue();
      const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
      expect(nextEntries.length).toBeGreaterThan(0);
    });

    it('should halt running stream and teardown subscription via stopOperatorStream()', () => {
      component.selectCategory('utility');
      component.selectOperator('delay');
      component.updateParam('delayMs', 500);
      component.runOperatorStream();

      expect(component.isRunning()).toBeTrue();
      component.stopOperatorStream();

      expect(component.isRunning()).toBeFalse();
      const unsubEntry = component.consoleEntries().find(e => e.type === 'unsubscribe');
      expect(unsubEntry).toBeDefined();
    });
  });
});
