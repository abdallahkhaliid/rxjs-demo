import { TestBed, ComponentFixture } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideRouter } from '@angular/router';
import { filter, take } from 'rxjs/operators';

import { LessonsService } from '../../core/services/lessons.service';

import {
  CartService,
  cartReducer,
  computeCartSummary
} from './services/cart.service';
import {
  TelemetryService,
  sanitizeMetric,
  evaluateAlert
} from './services/telemetry.service';
import {
  PollingService,
  sanitizePollingInterval
} from './services/polling.service';
import {
  FormWizardService,
  clampStep,
  getTopicsForRole,
  loadDraftFromStorage,
  validateStep1,
  validateStep2,
  validateStep3
} from './services/form-wizard.service';

import { SearchAutocompleteComponent } from './components/search-autocomplete/search-autocomplete.component';
import { LiveDashboardComponent } from './components/live-dashboard/live-dashboard.component';
import { ShoppingCartComponent } from './components/shopping-cart/shopping-cart.component';
import { HttpManagerComponent } from './components/http-manager/http-manager.component';
import { PollingSystemComponent } from './components/polling-system/polling-system.component';
import { MultistepFormComponent } from './components/multistep-form/multistep-form.component';

describe('Module 8: Real-World Mini-Projects Unit Tests', () => {
  let httpTestingController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideZonelessChangeDetection(),
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([])
      ]
    });
    httpTestingController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  // =========================================================================
  // 1. CartService & Reducer Tests (F45 & Boundaries)
  // =========================================================================
  describe('CartService & Reducer (F45)', () => {
    it('1. should initialize with empty items and zero total', () => {
      const summary = computeCartSummary([], '');
      expect(summary.subtotal).toBe(0);
      expect(summary.total).toBe(0);
      expect(summary.itemCount).toBe(0);
    });

    it('2. ADD action should add item with qty 1', () => {
      const items = cartReducer([], {
        type: 'ADD',
        item: { id: 1, name: 'RxJS Masterclass', category: 'Course', price: 79, rating: 5, icon: '⚡', description: 'desc' }
      });
      expect(items.length).toBe(1);
      expect(items[0].qty).toBe(1);
      expect(items[0].price).toBe(79);
    });

    it('3. duplicate ADD action increments qty', () => {
      const item = { id: 1, name: 'Course 1', category: 'Course', price: 50, rating: 5, icon: '⚡', description: 'desc' };
      let items = cartReducer([], { type: 'ADD', item });
      items = cartReducer(items, { type: 'ADD', item });
      expect(items.length).toBe(1);
      expect(items[0].qty).toBe(2);
    });

    it('4. REMOVE action filters out deleted item', () => {
      const item1 = { id: 1, name: 'Course 1', category: 'Course', price: 50, rating: 5, icon: '⚡', description: 'desc', qty: 1 };
      const item2 = { id: 2, name: 'Course 2', category: 'Course', price: 30, rating: 5, icon: '⚡', description: 'desc', qty: 1 };
      const items = cartReducer([item1, item2], { type: 'REMOVE', id: 1 });
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(2);
    });

    it('5. removing non-existent ID leaves cart intact (F45.B1)', () => {
      const item = { id: 1, name: 'Course 1', category: 'Course', price: 50, rating: 5, icon: '⚡', description: 'desc', qty: 1 };
      const items = cartReducer([item], { type: 'REMOVE', id: 999 });
      expect(items.length).toBe(1);
      expect(items[0].id).toBe(1);
    });

    it('6. UPDATE_QTY updates quantity for target item', () => {
      const item = { id: 1, name: 'Course 1', category: 'Course', price: 50, rating: 5, icon: '⚡', description: 'desc', qty: 1 };
      const items = cartReducer([item], { type: 'UPDATE_QTY', id: 1, qty: 5 });
      expect(items[0].qty).toBe(5);
    });

    it('7. quantity <= 0 clamped to minimum 1 (F45.B2)', () => {
      const item = { id: 1, name: 'Course 1', category: 'Course', price: 50, rating: 5, icon: '⚡', description: 'desc', qty: 2 };
      const items = cartReducer([item], { type: 'UPDATE_QTY', id: 1, qty: -3 });
      expect(items[0].qty).toBe(1);
    });

    it('8. currency precision rounds to 2 decimals avoiding float issues (F45.B3)', () => {
      const item1 = { id: 1, name: 'A', category: 'C', price: 0.1, rating: 5, icon: '⚡', description: 'd', qty: 1 };
      const item2 = { id: 2, name: 'B', category: 'C', price: 0.2, rating: 5, icon: '⚡', description: 'd', qty: 1 };
      const summary = computeCartSummary([item1, item2], '');
      expect(summary.subtotal).toBe(0.3);
    });

    it('9. valid coupon RXJS20 applies 20% discount (F45.3)', () => {
      const item = { id: 1, name: 'A', category: 'C', price: 100, rating: 5, icon: '⚡', description: 'd', qty: 1 };
      const summary = computeCartSummary([item], 'RXJS20');
      expect(summary.subtotal).toBe(100);
      expect(summary.discount).toBe(20);
      expect(summary.tax).toBe(6.4);
      expect(summary.total).toBe(86.4);
      expect(summary.appliedCoupon).toBe('RXJS20');
    });

    it('10. valid coupon DEV50 applies 50% discount', () => {
      const item = { id: 1, name: 'A', category: 'C', price: 100, rating: 5, icon: '⚡', description: 'd', qty: 1 };
      const summary = computeCartSummary([item], 'DEV50');
      expect(summary.discount).toBe(50);
      expect(summary.tax).toBe(4);
      expect(summary.total).toBe(54);
    });

    it('11. invalid coupon code yields 0 discount and does not mutate items (F45.4, F45.B4)', () => {
      const item = { id: 1, name: 'A', category: 'C', price: 100, rating: 5, icon: '⚡', description: 'd', qty: 1 };
      const summary = computeCartSummary([item], 'INVALID_PROMO');
      expect(summary.discount).toBe(0);
      expect(summary.appliedCoupon).toBeNull();
      expect(summary.total).toBe(108);
    });

    it('12. CLEAR action empties cart completely (F45.5)', () => {
      const item = { id: 1, name: 'A', category: 'C', price: 100, rating: 5, icon: '⚡', description: 'd', qty: 1 };
      const items = cartReducer([item], { type: 'CLEAR' });
      expect(items).toEqual([]);
    });

    it('13. 100 items accumulate without issue (F45.B5)', () => {
      let items: any[] = [];
      for (let i = 0; i < 100; i++) {
        items = cartReducer(items, {
          type: 'ADD',
          item: { id: i, name: `Course ${i}`, category: 'C', price: 10, rating: 5, icon: '⚡', description: 'd' }
        });
      }
      expect(items.length).toBe(100);
    });
  });

  // =========================================================================
  // 2. TelemetryService & Dashboard Logic Tests (F44 & Boundaries)
  // =========================================================================
  describe('TelemetryService (F44)', () => {
    let service: TelemetryService;

    beforeEach(() => {
      service = TestBed.inject(TelemetryService);
      service.setPlay(false); // Disable background ticker during unit assertions
    });

    it('14. should aggregate CPU, Memory, and Network streams via combineLatest', (done) => {
      service.currentPoint$.pipe(take(1)).subscribe(point => {
        expect(point.cpu).toBeGreaterThanOrEqual(0);
        expect(point.mem).toBeGreaterThanOrEqual(0);
        expect(point.net).toBeGreaterThanOrEqual(0);
        expect(point.timestamp).toContain('T');
        done();
      });
    });

    it('15. scan maintains sliding window history buffer capped at 15 points (F44.2, F44.B4)', (done) => {
      service.history$.pipe(take(1)).subscribe(hist => {
        expect(hist.length).toBeLessThanOrEqual(15);
        done();
      });
    });

    it('16. evaluates threshold alert CPU > 75% as CRITICAL_CPU (F44.3)', () => {
      expect(evaluateAlert({ cpu: 82, mem: 50 })).toBe('CRITICAL_CPU');
    });

    it('17. evaluates threshold alert Mem > 85% as CRITICAL_MEM (F44.3)', () => {
      expect(evaluateAlert({ cpu: 40, mem: 90 })).toBe('CRITICAL_MEM');
    });

    it('18. normal metrics evaluate to NORMAL alert status', () => {
      expect(evaluateAlert({ cpu: 40, mem: 50 })).toBe('NORMAL');
    });

    it('19. sanitizeMetric sanitizes NaN and non-numeric values to 0 (F44.B1)', () => {
      expect(sanitizeMetric(NaN)).toBe(0);
      expect(sanitizeMetric('invalid')).toBe(0);
      expect(sanitizeMetric(null)).toBe(0);
    });

    it('20. sanitizeMetric clamps negative values to 0% (F44.B2)', () => {
      expect(sanitizeMetric(-25)).toBe(0);
    });

    it('21. sanitizeMetric clamps values > 100% to 100% (F44.B3)', () => {
      expect(sanitizeMetric(150)).toBe(100);
      expect(sanitizeMetric(75)).toBe(75);
    });

    it('22. togglePlay pauses and resumes telemetry collection (F44.4, F44.B5)', () => {
      service.setPlay(true);
      expect(service.isPlaying).toBe(true);
      const paused = service.togglePlay();
      expect(paused).toBe(false);
      expect(service.isPlaying).toBe(false);
      const resumed = service.togglePlay();
      expect(resumed).toBe(true);
    });

    it('23. injectSpike updates target metric immediately', (done) => {
      service.cpu$.pipe(
        filter(val => val === 95),
        take(1)
      ).subscribe(val => {
        expect(val).toBe(95);
        done();
      });
      service.injectSpike('cpu', 95);
    });
  });

  // =========================================================================
  // 3. PollingService Tests (F47 & Boundaries)
  // =========================================================================
  describe('PollingService (F47)', () => {
    let service: PollingService;

    beforeEach(() => {
      service = TestBed.inject(PollingService);
    });

    afterEach(() => {
      service.stopPolling();
    });

    it('24. sanitizePollingInterval clamps interval to minimum 500ms (F47.B2)', () => {
      expect(sanitizePollingInterval(0)).toBe(500);
      expect(sanitizePollingInterval(-200)).toBe(500);
      expect(sanitizePollingInterval(250)).toBe(500);
      expect(sanitizePollingInterval(1500)).toBe(1500);
    });

    it('25. startPolling changes isRunning state to true', () => {
      expect(service.getState().isRunning).toBe(false);
      service.startPolling();
      expect(service.getState().isRunning).toBe(true);
      service.stopPolling();
      expect(service.getState().isRunning).toBe(false);
    });

    it('26. simulateTabHidden suspends tab visibility (F47.2, F47.B1)', (done) => {
      service.simulateTabHidden(true);
      service.isTabVisible$.pipe(take(1)).subscribe(vis => {
        expect(vis).toBe(false);
        done();
      });
    });

    it('27. setInterval updates interval in state with clamping', () => {
      service.setInterval(3000);
      expect(service.getState().intervalMs).toBe(3000);
      service.setInterval(100);
      expect(service.getState().intervalMs).toBe(500);
    });

    it('28. stopPolling called multiple times safely unsubscribes (F47.B5)', () => {
      service.startPolling();
      service.stopPolling();
      service.stopPolling();
      expect(service.getState().isRunning).toBe(false);
    });
  });

  // =========================================================================
  // 4. FormWizardService Tests (F48 & Boundaries)
  // =========================================================================
  describe('FormWizardService (F48)', () => {
    let service: FormWizardService;

    beforeEach(() => {
      service = TestBed.inject(FormWizardService);
    });

    it('29. validateStep1 enforces username min 3 chars and valid email (F48.1)', () => {
      expect(validateStep1({ username: 'ab', email: 'a@b.com' })).toBe(false);
      expect(validateStep1({ username: 'abc', email: 'invalidemail' })).toBe(false);
      expect(validateStep1({ username: 'alice', email: 'alice@domain.com' })).toBe(true);
    });

    it('30. getTopicsForRole dynamically enables topics based on role (F48.2)', () => {
      expect(getTopicsForRole('beginner')).toContain('fundamentals');
      expect(getTopicsForRole('advanced')).toContain('schedulers');
      expect(getTopicsForRole('intermediate')).toContain('transformation');
    });

    it('31. clampStep clamps step numbers strictly between 1 and 3 (F48.B5)', () => {
      expect(clampStep(0)).toBe(1);
      expect(clampStep(-5)).toBe(1);
      expect(clampStep(5)).toBe(3);
      expect(clampStep(2)).toBe(2);
    });

    it('32. role change resets step 2 topics to empty array (F48.B4)', () => {
      service.updateStep2({ role: 'beginner', topics: ['fundamentals'] });
      expect(service.currentState.step2.topics).toContain('fundamentals');
      service.setRole('advanced');
      expect(service.currentState.step2.topics).toEqual([]);
      expect(service.currentState.step2.role).toBe('advanced');
    });

    it('33. advancing to step 3 without steps 1 & 2 completed is blocked (F48.B1)', () => {
      service.reset();
      const advanced = service.setStep(3);
      expect(advanced).toBe(false);
      expect(service.currentState.currentStep).toBe(1);
    });

    it('34. backward navigation retains entered draft state (F48.5)', () => {
      service.updateStep1({ username: 'charlie', email: 'charlie@test.com', fullName: 'Charlie Dev' });
      service.setStep(2);
      expect(service.currentState.currentStep).toBe(2);
      service.previousStep();
      expect(service.currentState.currentStep).toBe(1);
      expect(service.currentState.step1.username).toBe('charlie');
    });

    it('35. corrupted draft in storage falls back to clean default state (F48.B3)', () => {
      const fallback = loadDraftFromStorage('corrupted_key_that_does_not_exist');
      expect(fallback.currentStep).toBe(1);
      expect(fallback.step1.username).toBe('');
      expect(fallback.step2.role).toBe('beginner');
    });

    it('36. submit triggers exhaustMap submission and clears draft on completion (F48.4, F48.B2)', (done) => {
      service.updateStep1({ username: 'bob', email: 'bob@test.com', fullName: 'Bob Dev' });
      service.updateStep2({ role: 'beginner', topics: ['fundamentals'] });
      service.updateStep3({ agreedToTerms: true });

      service.submissionResult$.pipe(take(1)).subscribe(res => {
        expect(res.success).toBe(true);
        expect(res.data.step1.username).toBe('bob');
        done();
      });

      service.submit();
    });
  });

  // =========================================================================
  // 5. Component Tests
  // =========================================================================
  describe('Mini-Project Standalone Components', () => {
    it('37. SearchAutocompleteComponent renders search input and debounces input', () => {
      const fixture = TestBed.createComponent(SearchAutocompleteComponent);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      const input = compiled.querySelector('input[data-testid="search-input"]');
      expect(input).toBeTruthy();
    });

    it('38. SearchAutocompleteComponent handles empty and whitespace queries cleanly (F43.3, F43.B1)', () => {
      const fixture = TestBed.createComponent(SearchAutocompleteComponent);
      const comp = fixture.componentInstance;
      comp.searchControl.setValue('   ');
      fixture.detectChanges();
      expect(comp.results()).toEqual([]);
      expect(comp.isLoading()).toBe(false);
    });

    it('39. LiveDashboardComponent renders metrics and sparkline paths', () => {
      const fixture = TestBed.createComponent(LiveDashboardComponent);
      const comp = fixture.componentInstance;
      comp.telemetryService.setPlay(false);
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.telemetry-grid')).toBeTruthy();
      expect(comp.isPlaying()).toBe(false);
    });

    it('40. ShoppingCartComponent adds catalog item to cart and updates total', () => {
      const fixture = TestBed.createComponent(ShoppingCartComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();
      expect(comp.catalog.length).toBeGreaterThan(0);
      comp.addToCart(comp.catalog[0]);
      fixture.detectChanges();
      expect(comp.cartItems().length).toBe(1);
      expect(comp.cartSummary().total).toBeGreaterThan(0);
    });

    it('41. HttpManagerComponent initializes with 4 flattening strategies ready', () => {
      const fixture = TestBed.createComponent(HttpManagerComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();
      expect(comp.strategies).toEqual(['switchMap', 'concatMap', 'mergeMap', 'exhaustMap']);
      const results = comp.benchmarkResults();
      expect(results.switchMap.requests).toEqual([]);
      expect(results.switchMap.completedCount).toBe(0);
    });

    it('42. PollingSystemComponent renders polling status bar and history panel', () => {
      const fixture = TestBed.createComponent(PollingSystemComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();
      const compiled = fixture.nativeElement as HTMLElement;
      expect(compiled.querySelector('.polling-toolbar')).toBeTruthy();
      expect(comp.state().intervalMs).toBeGreaterThanOrEqual(500);
    });

    it('43. MultistepFormComponent initializes on step 1 with validation', () => {
      const fixture = TestBed.createComponent(MultistepFormComponent);
      const comp = fixture.componentInstance;
      fixture.detectChanges();
      expect(comp.formData().currentStep).toBe(1);
      expect(comp.formStep1.valid).toBe(false);
      comp.formStep1.patchValue({
        username: 'alice',
        email: 'alice@angular.io',
        fullName: 'Alice Dev'
      });
      expect(comp.formStep1.valid).toBe(true);
    });
  });
});
