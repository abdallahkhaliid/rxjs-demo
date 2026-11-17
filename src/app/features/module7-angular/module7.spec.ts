import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { of, throwError } from 'rxjs';

import { HttpRecipeService } from './http-recipe.service';
import { CourseStateStoreService, INITIAL_STATE } from './course-state-store.service';
import { HttpPatternsComponent } from './http-patterns.component';
import { ReactiveFormsComponent } from './reactive-forms.component';
import { LifecycleTeardownComponent } from './lifecycle-teardown.component';
import { StateStoreComponent } from './state-store.component';
import { CourseWithLessons } from '../../core/models';

describe('Module 7: RxJS in Angular Recipes', () => {

  // =========================================================================
  // 1. HttpRecipeService Tests (F39.1 - F39.5, F39.B1 - F39.B5)
  // =========================================================================
  describe('HttpRecipeService', () => {
    let service: HttpRecipeService;
    let httpMock: HttpTestingController;

    const mockCourse: CourseWithLessons = {
      id: 1,
      description: 'RxJS In Depth',
      longDescription: 'Comprehensive reactive programming with RxJS',
      category: 'ADVANCED',
      lessonsCount: 10,
      lessons: [
        { id: 1, description: 'Stream Fundamentals', duration: '5:00', seqNo: 1, courseId: 1 },
        { id: 2, description: 'Higher-Order Operators', duration: '8:00', seqNo: 2, courseId: 1 }
      ]
    };

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          provideHttpClient(),
          provideHttpClientTesting(),
          HttpRecipeService
        ]
      });

      service = TestBed.inject(HttpRecipeService);
      httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('F39.1: should cache HTTP response across subscribers using shareReplay({ bufferSize: 1, refCount: true })', () => {
      let res1: CourseWithLessons | undefined;
      let res2: CourseWithLessons | undefined;

      const stream$ = service.getCachedCourse(1, true);

      // First subscriber
      stream$.subscribe(val => { res1 = val; });
      const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
      expect(req.request.method).toBe('GET');
      req.flush(mockCourse);

      // Second subscriber to cached observable
      stream$.subscribe(val => { res2 = val; });
      httpMock.expectNone('http://localhost:9000/api/courses/1');

      expect(res1?.description).toBe('RxJS In Depth');
      expect(res2?.description).toBe('RxJS In Depth');
      expect(service.getNetworkCallsCount()).toBe(1);
    });

    it('F39.B3: should properly release connection when unsubscribed mid-flight (refCount: true)', () => {
      const stream$ = service.getCachedCourse(1, true);
      const sub = stream$.subscribe();
      const req = httpMock.expectOne('http://localhost:9000/api/courses/1');

      // Unsubscribe before response completes
      sub.unsubscribe();
      expect(req.cancelled).toBe(true);
    });

    it('F39.B1: should discriminate 4xx client errors and NOT retry 404 or 401', async () => {
      let received: any;
      service.fetchWithResilientRetry(1.0, 404, 3, 50).subscribe(val => {
        received = val;
      });

      const req = httpMock.expectOne(req => req.url.includes('/simulate-error'));
      expect(req.request.params.get('statusCode')).toBe('404');
      req.flush('Not Found', { status: 404, statusText: 'Not Found' });

      // No retries should be made for 404
      httpMock.expectNone(req => req.url.includes('/simulate-error'));

      expect(received).toBeDefined();
      expect(received.fallback).toBe(true);
      expect(received.statusCode).toBe(404);
    });

    it('F39.2 & F39.B2: should retry transient 500 errors with backoff and provide fallback when retries exhausted', async () => {
      let received: any;
      service.fetchWithResilientRetry(1.0, 500, 3, 20).subscribe(val => {
        received = val;
      });

      // Initial call (attempt 1)
      const req1 = httpMock.expectOne(req => req.url.includes('/simulate-error') && req.params.get('attempt') === '1');
      req1.flush('Server Error', { status: 500, statusText: 'Server Error' });

      // Retry 1 (attempt 2)
      await new Promise(r => setTimeout(r, 40));
      const req2 = httpMock.expectOne(req => req.url.includes('/simulate-error') && req.params.get('attempt') === '2');
      req2.flush('Server Error', { status: 500, statusText: 'Server Error' });

      // Retry 2 (attempt 3)
      await new Promise(r => setTimeout(r, 60));
      const req3 = httpMock.expectOne(req => req.url.includes('/simulate-error') && req.params.get('attempt') === '3');
      req3.flush('Server Error', { status: 500, statusText: 'Server Error' });

      // Retry 3 (attempt 4)
      await new Promise(r => setTimeout(r, 100));
      const req4 = httpMock.expectOne(req => req.url.includes('/simulate-error') && req.params.get('attempt') === '4');
      req4.flush('Server Error', { status: 500, statusText: 'Server Error' });

      // Exhausted all 3 retries (1 initial + 3 retries = 4 attempts)
      expect(received).toBeDefined();
      expect(received.fallback).toBe(true);
      expect(received.status).toBe('recovered_fallback');
    });

    it('F39.B6: should abort underlying HTTP request when unsubscribed mid-flight from fetchWithResilientRetry', () => {
      const stream$ = service.fetchWithResilientRetry(0.7, 500, 3, 400);
      const sub = stream$.subscribe();

      // Intercept the in-flight HTTP request initiated for attempt 1
      const req = httpMock.expectOne(r => r.url.includes('/simulate-error'));
      expect(req.cancelled).toBe(false);

      // Unsubscribe mid-flight before the server responds or retries
      sub.unsubscribe();

      // Teardown must abort the underlying Angular HttpClient request
      expect(req.cancelled).toBe(true);
    });

    it('F39.4 & F39.B5: should handle refresh triggers with switchMap cancellation', () => {
      let emissions = 0;
      const refreshStream$ = service.createRefreshableCourseStream(1);
      refreshStream$.subscribe(() => { emissions++; });

      // Initial automatic fetch via startWith(null)
      const req1 = httpMock.expectOne('http://localhost:9000/api/courses/1');
      req1.flush(mockCourse);
      expect(emissions).toBe(1);

      // Trigger manual refresh
      service.triggerRefresh();
      const req2 = httpMock.expectOne('http://localhost:9000/api/courses/1');
      req2.flush(mockCourse);
      expect(emissions).toBe(2);
    });

    it('F39.5: should combine course and telemetry data in parallel', () => {
      let aggregated: any;
      service.fetchParallelAggregatedData(1).subscribe(data => {
        aggregated = data;
      });

      const courseReq = httpMock.expectOne('http://localhost:9000/api/courses/1');
      courseReq.flush(mockCourse);

      const slowReq = httpMock.expectOne(req => req.url.includes('/api/slow'));
      slowReq.flush({
        status: 'success',
        endpoint: '/api/slow',
        delay: 800,
        tag: 'aggregated',
        requestTimestamp: 100,
        responseTimestamp: 900,
        elapsedMs: 800,
        data: { message: 'OK', serverTime: '2026-11-06' }
      });

      expect(aggregated).toBeDefined();
      expect(aggregated.course.description).toBe('RxJS In Depth');
      expect(aggregated.slowData.endpoint).toBe('/api/slow');
    });

    it('F39.B4: should safely parse JSON payloads and detect malformed responses', () => {
      const valid = service.safeParseJson('{"status": "ok", "count": 42}');
      expect(valid.valid).toBe(true);
      expect(valid.data.count).toBe(42);

      const invalid = service.safeParseJson('<html>502 Bad Gateway</html>');
      expect(invalid.valid).toBe(false);
      expect(invalid.error).toBe('INVALID_JSON');
    });
  });

  // =========================================================================
  // 2. CourseStateStoreService Tests (F42.1 - F42.5, F42.B1 - F42.B5)
  // =========================================================================
  describe('CourseStateStoreService', () => {
    let store: CourseStateStoreService;

    beforeEach(() => {
      TestBed.configureTestingModule({
        providers: [
          provideZonelessChangeDetection(),
          CourseStateStoreService
        ]
      });

      store = TestBed.inject(CourseStateStoreService);
      store.resetStore();
    });

    it('F42.1: should initialize store with immutable initial state', () => {
      const state = store.getState();
      expect(state.courses.length).toBe(6);
      expect(state.filterCategory).toBe('all');
      expect(state.filterDifficulty).toBe('all');
      expect(state.searchTerm).toBe('');
      expect(state.lastAction).toBe('INITIALIZE');
    });

    it('F42.2: should emit current slice value immediately via select()', () => {
      let category: string | undefined;
      store.select(s => s.filterCategory).subscribe(val => {
        category = val;
      });
      expect(category).toBe('all');
    });

    it('F42.3 & F42.B1: should update state immutably upon action dispatch and record transition', () => {
      const stateBefore = store.getState();
      store.setCategoryFilter('RxJS');
      const stateAfter = store.getState();

      expect(stateBefore).not.toBe(stateAfter); // Fresh object reference
      expect(stateBefore.filterCategory).toBe('all'); // Original untouched
      expect(stateAfter.filterCategory).toBe('RxJS');

      const timeline = store.getState();
      expect(timeline.lastAction).toContain('SET_CATEGORY_FILTER');
    });

    it('F42.4 & F42.B3: should optimize selectors with distinctUntilChanged and prevent redundant emissions', () => {
      let enrolledCountEmissions = 0;
      store.enrolledCount$.subscribe(() => {
        enrolledCountEmissions++;
      });
      expect(enrolledCountEmissions).toBe(1); // Initial emission

      // Mutating filterCategory should NOT trigger enrolledCount$ emission!
      store.setCategoryFilter('Angular');
      store.setCategoryFilter('TypeScript');

      expect(enrolledCountEmissions).toBe(1); // Still 1!
    });

    it('F42.B2: should safely handle selector on non-existent property without throwing', () => {
      let val: any;
      expect(() => {
        store.select((s: any) => s.nonExistentKey.nested).subscribe(v => {
          val = v;
        });
      }).not.toThrow();
      expect(val).toBeUndefined();
    });

    it('F42.B4: should support deep state slice selection', () => {
      let firstLessonCount: number | undefined;
      store.select(s => s.courses[0].lessonsCount).subscribe(v => {
        firstLessonCount = v;
      });
      expect(firstLessonCount).toBe(12);
    });

    it('F42.B5: should leave state unchanged when unknown action is dispatched', () => {
      const stateBefore = store.getState();
      store.dispatchUnknownAction('NON_EXISTENT_ACTION_123');
      const stateAfter = store.getState();
      expect(stateBefore).toBe(stateAfter); // Same reference
    });

    it('should support time-travel state rollback', () => {
      store.setCategoryFilter('Angular');
      const snapshotAfterAngular = store.getState();
      const logs = store.getState();

      store.setCategoryFilter('Architecture');
      expect(store.getState().filterCategory).toBe('Architecture');

      // Rollback to Angular snapshot
      const timelineLogs: any[] = [];
      store.timeline$.subscribe(l => timelineLogs.push(l));
      const targetLog = timelineLogs[0].find((l: any) => l.action.includes('SET_CATEGORY_FILTER (Angular)'));

      if (targetLog) {
        store.rollbackToSnapshot(targetLog);
        expect(store.getState().filterCategory).toBe('Angular');
      }
    });

    it('should toggle course enrollment and add/delete courses correctly', () => {
      store.toggleEnrollment(2);
      expect(store.getState().courses.find(c => c.id === 2)?.enrolled).toBe(true);

      store.addCourse({
        title: 'New Dynamic Course',
        category: 'RxJS',
        difficulty: 'advanced',
        enrolled: false,
        lessonsCount: 5,
        rating: 4.9
      });
      expect(store.getState().courses.some(c => c.title === 'New Dynamic Course')).toBe(true);

      const addedId = store.getState().courses[0].id;
      store.deleteCourse(addedId);
      expect(store.getState().courses.some(c => c.id === addedId)).toBe(false);
    });
  });

  // =========================================================================
  // 3. HttpPatternsComponent Unit Tests
  // =========================================================================
  describe('HttpPatternsComponent', () => {
    let component: HttpPatternsComponent;
    let fixture: ComponentFixture<HttpPatternsComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HttpPatternsComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(HttpPatternsComponent);
      component = fixture.componentInstance;
      httpMock = TestBed.inject(HttpTestingController);

      // Flush initial refresh trigger request from constructor
      const initialReq = httpMock.expectOne('http://localhost:9000/api/courses/1');
      initialReq.flush({ id: 1, description: 'Initial', lessons: [] });

      fixture.detectChanges();
    });

    afterEach(() => {
      httpMock.verify();
    });

    it('should create component and render initial structure', () => {
      expect(component).toBeTruthy();
      expect(component.recipeData.title).toBe('HTTP Patterns & Caching');
      expect(component.sub1Active()).toBe(false);
      expect(component.sub2Active()).toBe(false);
    });

    it('should toggle caching and update telemetry on subscriber actions', () => {
      component.toggleCaching();
      expect(component.useCache()).toBe(false);
      component.toggleCaching();
      expect(component.useCache()).toBe(true);

      // Subscribe Sub 1
      component.subscribeSub1();
      expect(component.sub1Active()).toBe(true);
      const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
      req.flush({ id: 1, description: 'RxJS Course', lessons: [] });
      fixture.detectChanges();

      expect(component.sub1Data()?.description).toBe('RxJS Course');

      // Unsubscribe Sub 1
      component.unsubscribeSub1();
      expect(component.sub1Active()).toBe(false);
    });

    it('should trigger resilient fetch and handle retry logs', () => {
      component.triggerResilientFetch();
      expect(component.isRetrying()).toBe(true);

      const req = httpMock.expectOne(r => r.url.includes('/simulate-error'));
      req.flush({ status: 'success', data: 'Done' });
      fixture.detectChanges();

      expect(component.isRetrying()).toBe(false);
      expect(component.retryResult()?.data).toBe('Done');
    });

    it('should trigger rapid refresh and parallel data aggregation', () => {
      component.triggerRefresh();
      const req1 = httpMock.expectOne('http://localhost:9000/api/courses/1');
      req1.flush({ id: 1, description: 'Refreshed', lessons: [] });
      fixture.detectChanges();

      expect(component.refreshClicksCount()).toBe(1);

      // Trigger parallel aggregation
      component.triggerParallelAggregation();
      expect(component.isAggregating()).toBe(true);

      const courseReq = httpMock.expectOne('http://localhost:9000/api/courses/1');
      courseReq.flush({ id: 1, description: 'Aggregated Course', lessons: [] });

      const slowReq = httpMock.expectOne(r => r.url.includes('/api/slow'));
      slowReq.flush({ status: 'success', endpoint: '/api/slow', elapsedMs: 800 });
      fixture.detectChanges();

      expect(component.isAggregating()).toBe(false);
      expect(component.aggregatedData()?.course.description).toBe('Aggregated Course');
    });

    it('should log console entries and clear them', () => {
      component.logConsole('info', undefined, 'Test log message');
      expect(component.consoleEntries().length).toBeGreaterThan(0);
      expect(component.consoleEntries()[0].description).toBe('Test log message');

      component.clearConsole();
      expect(component.consoleEntries().length).toBe(0);
    });

    it('should unsubscribe in-flight retry and parallel requests when component is destroyed', () => {
      component.triggerResilientFetch();
      component.triggerParallelAggregation();

      const retryReq = httpMock.expectOne(r => r.url.includes('/simulate-error'));
      const courseReq = httpMock.expectOne('http://localhost:9000/api/courses/1');
      const slowReq = httpMock.expectOne(r => r.url.includes('/api/slow'));

      expect(retryReq.cancelled).toBe(false);
      expect(courseReq.cancelled).toBe(false);
      expect(slowReq.cancelled).toBe(false);

      component.ngOnDestroy();

      expect(retryReq.cancelled).toBe(true);
      expect(courseReq.cancelled).toBe(true);
      expect(slowReq.cancelled).toBe(true);
    });
  });

  // =========================================================================
  // 4. ReactiveFormsComponent Unit Tests
  // =========================================================================
  describe('ReactiveFormsComponent', () => {
    let component: ReactiveFormsComponent;
    let fixture: ComponentFixture<ReactiveFormsComponent>;
    let httpMock: HttpTestingController;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ReactiveFormsComponent, ReactiveFormsModule, FormsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([]),
          provideHttpClient(),
          provideHttpClientTesting()
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(ReactiveFormsComponent);
      component = fixture.componentInstance;
      httpMock = TestBed.inject(HttpTestingController);
      fixture.detectChanges();
    });

    afterEach(() => {
      httpMock.match('http://localhost:9000/api/courses/1').forEach(req => {
        if (!req.cancelled) {
          req.flush({ id: 1, description: 'Saved' });
        }
      });
      httpMock.verify();
    });

    it('should initialize form with controls and valid default data', () => {
      expect(component).toBeTruthy();
      expect(component.form.valid).toBe(true);
      expect(component.form.get('title')?.value).toContain('Mastering RxJS');
      expect(component.form.get('category')?.value).toBe('Frontend');
      expect(component.form.get('subCategory')?.value).toBe('Angular');
    });

    it('F40.3: should validate title control minimum length and mark invalid when empty', () => {
      component.form.get('title')?.setValue('AB');
      expect(component.form.get('title')?.valid).toBe(false);

      component.form.get('title')?.setValue('');
      expect(component.form.get('title')?.valid).toBe(false);

      component.form.get('title')?.setValue('Valid Title');
      expect(component.form.get('title')?.valid).toBe(true);
    });

    it('F40.5: should update sub-category options when parent category changes', () => {
      component.form.get('category')?.setValue('Backend');
      fixture.detectChanges();

      expect(component.subCategories()).toContain('Node.js');
      expect(component.subCategories()).toContain('Express');

      component.form.get('category')?.setValue('DevOps');
      fixture.detectChanges();

      expect(component.subCategories()).toContain('Docker');
      expect(component.subCategories()).toContain('Kubernetes');
    });

    it('F40.B1: should handle 10,000 character description without error', () => {
      const hugeDesc = 'R'.repeat(10000);
      component.form.get('description')?.setValue(hugeDesc);
      expect(component.form.get('description')?.valid).toBe(true);

      const tooBig = 'R'.repeat(10001);
      component.form.get('description')?.setValue(tooBig);
      expect(component.form.get('description')?.valid).toBe(false);
    });

    it('should update debounce window when slider changes', () => {
      component.onDebounceChange(800);
      expect(component.debounceDurationMs()).toBe(800);
    });

    it('F40.1 & F40.4: should debounce rapid consecutive keystrokes within debounce window and coalesce into exactly 1 HTTP PUT save', async () => {
      // 1. Initial baseline verification
      expect(component.telemetry().keystrokesCount).toBe(0);
      expect(component.telemetry().httpRequestsCount).toBe(0);
      expect(component.saveStatus()).toBe('pristine');
      httpMock.expectNone('http://localhost:9000/api/courses/1');

      // 2. Simulate rapid keystrokes: 5 characters typed with 25ms intervals (100ms total << 400ms debounce)
      const baseTitle = 'Mastering RxJS Patterns in Angular';
      const rapidKeystrokes = [' A', ' AB', ' ABC', ' ABCD', ' ABCDE'];

      for (const suffix of rapidKeystrokes) {
        component.form.get('title')?.setValue(`${baseTitle}${suffix}`);
        await new Promise(resolve => setTimeout(resolve, 25));
      }

      // 3. Immediately after typing burst, all 5 keystrokes are recorded, but ZERO HTTP requests sent
      expect(component.telemetry().keystrokesCount).toBe(5);
      expect(component.telemetry().httpRequestsCount).toBe(0);
      expect(component.saveStatus()).toBe('typing');
      httpMock.expectNone('http://localhost:9000/api/courses/1');

      // 4. Wait 500ms (> 400ms debounceDurationMs) for quiet window to elapse and timer to fire
      await new Promise(resolve => setTimeout(resolve, 500));

      // 5. Exactly 1 HTTP PUT request should be initiated with the latest coalesced payload
      const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
      expect(req.request.method).toBe('PUT');
      expect(req.request.body.description).toBe('Mastering RxJS Patterns in Angular ABCDE');

      // 6. Complete HTTP save with 200 OK
      req.flush({ id: 1, description: 'Mastering RxJS Patterns in Angular ABCDE' });
      fixture.detectChanges();

      // 7. Verify final telemetry and component state
      expect(component.telemetry().keystrokesCount).toBe(5);
      expect(component.telemetry().httpRequestsCount).toBe(1);
      expect(component.telemetry().cancelledRequestsCount).toBe(0);
      expect(component.saveStatus()).toBe('saved');
      expect(component.efficiencyPercentage()).toBe(80); // (5 - 1) / 5 * 100 = 80%

      // 8. Confirm no subsequent pending requests
      httpMock.expectNone('http://localhost:9000/api/courses/1');
    });

    it('should support manual save and form reset', () => {
      component.forceSaveNow();
      expect(component.saveStatus()).toBe('saving');

      const req = httpMock.expectOne('http://localhost:9000/api/courses/1');
      expect(req.request.method).toBe('PUT');
      req.flush({ id: 1, description: 'Saved' });
      fixture.detectChanges();

      expect(component.saveStatus()).toBe('saved');

      // Reset form
      component.resetForm();
      expect(component.saveStatus()).toBe('pristine');
      expect(component.telemetry().keystrokesCount).toBe(0);
    });
  });

  // =========================================================================
  // 5. LifecycleTeardownComponent Unit Tests
  // =========================================================================
  describe('LifecycleTeardownComponent', () => {
    let component: LifecycleTeardownComponent;
    let fixture: ComponentFixture<LifecycleTeardownComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [LifecycleTeardownComponent],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([])
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(LifecycleTeardownComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();
    });

    afterEach(() => {
      component.forceCleanAll();
    });

    it('should initialize simulator in clean state with zero memory leaks', () => {
      expect(component).toBeTruthy();
      expect(component.telemetry().hasMemoryLeak).toBe(false);
      expect(component.telemetry().activeComponentCount).toBe(0);
      expect(component.telemetry().activeSubscriptionCount).toBe(0);
    });

    it('F41.2 & F41.B3: should demonstrate unmanaged subscription leak and detect leak condition', () => {
      // Mount a leaky widget
      component.mountWidget('leaky');
      expect(component.mountedWidgets().length).toBe(1);
      expect(component.telemetry().activeComponentCount).toBe(1);
      expect(component.telemetry().activeSubscriptionCount).toBe(1);

      // Unmount it: Leaky subscription continues in background!
      const widgetId = component.mountedWidgets()[0].id;
      component.unmountWidget(widgetId);

      expect(component.mountedWidgets().length).toBe(0);
      expect(component.telemetry().activeComponentCount).toBe(0);
      expect(component.telemetry().activeSubscriptionCount).toBe(1); // Zombie sub!
      expect(component.telemetry().hasMemoryLeak).toBe(true);
      expect(component.zombieWidgets().length).toBe(1);
    });

    it('F41.1 & F41.B4: should automatically unhook managed widgets via takeUntilDestroyed without leaking', () => {
      // Mount a managed widget
      component.mountWidget('managed');
      expect(component.mountedWidgets().length).toBe(1);
      expect(component.telemetry().activeComponentCount).toBe(1);
      expect(component.telemetry().activeSubscriptionCount).toBe(1);

      // Unmount: Managed subscription cleanly terminated
      const widgetId = component.mountedWidgets()[0].id;
      component.unmountWidget(widgetId);

      expect(component.mountedWidgets().length).toBe(0);
      expect(component.telemetry().activeComponentCount).toBe(0);
      expect(component.telemetry().activeSubscriptionCount).toBe(0); // Zero leak balance!
      expect(component.telemetry().hasMemoryLeak).toBe(false);
      expect(component.zombieWidgets().length).toBe(0);
    });

    it('F41.B1: should verify stream subscribed after destroy completes immediately', () => {
      component.testSubscribeAfterDestroy();
      expect(component.edgeCaseMessage()).toContain('F41.B1 Verified');
    });

    it('F41.B2: should verify active timer teardown halts execution', async () => {
      component.testActiveTimerTeardown();
      await new Promise(r => setTimeout(r, 260));
      expect(component.edgeCaseMessage()).toContain('F41.B2 Verified');
    });

    it('F41.B5: should safely handle multiple destroy notifications', () => {
      component.testMultipleDestroy();
      expect(component.edgeCaseMessage()).toContain('F41.B5 Verified');
    });

    it('should force clean all widgets and reset graveyard', () => {
      component.mountWidget('leaky');
      component.mountWidget('managed');
      component.unmountAll();

      expect(component.telemetry().hasMemoryLeak).toBe(true);

      component.forceCleanAll();
      expect(component.telemetry().hasMemoryLeak).toBe(false);
      expect(component.telemetry().activeSubscriptionCount).toBe(0);
      expect(component.zombieWidgets().length).toBe(0);
    });
  });

  // =========================================================================
  // 6. StateStoreComponent Unit Tests
  // =========================================================================
  describe('StateStoreComponent', () => {
    let component: StateStoreComponent;
    let fixture: ComponentFixture<StateStoreComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StateStoreComponent, FormsModule],
        providers: [
          provideZonelessChangeDetection(),
          provideRouter([])
        ]
      }).compileComponents();

      fixture = TestBed.createComponent(StateStoreComponent);
      component = fixture.componentInstance;
      component.onResetStore();
      fixture.detectChanges();
    });

    it('F42.5: should create component and bridge selectors to Signals', () => {
      expect(component).toBeTruthy();
      expect(component.totalCourses()).toBe(6);
      expect(component.enrolledCourses()).toBe(3);
      expect(component.activeCategory()).toBe('all');
      expect(component.activeDifficulty()).toBe('all');
      expect(component.filteredCourses().length).toBe(6);
    });

    it('should dispatch search term action and filter courses reactively', () => {
      component.onSearchChange('Zoneless');
      fixture.detectChanges();

      expect(component.filteredCourses().length).toBe(1);
      expect(component.filteredCourses()[0].title).toContain('Zoneless');
    });

    it('should dispatch category and difficulty filters', () => {
      component.onCategorySelect('RxJS');
      fixture.detectChanges();

      expect(component.activeCategory()).toBe('RxJS');
      expect(component.filteredCourses().every(c => c.category === 'RxJS')).toBe(true);

      component.onDifficultySelect('beginner');
      fixture.detectChanges();

      expect(component.activeDifficulty()).toBe('beginner');
      expect(component.filteredCourses().every(c => c.category === 'RxJS' && c.difficulty === 'beginner')).toBe(true);
    });

    it('should toggle course enrollment reactively', () => {
      const course = component.filteredCourses()[0];
      const initialEnrollment = course.enrolled;

      component.onToggleEnroll(course);
      fixture.detectChanges();

      const updated = component.filteredCourses().find(c => c.id === course.id);
      expect(updated?.enrolled).toBe(!initialEnrollment);
    });

    it('should add new course and record transition in timeline history', () => {
      const initialCount = component.totalCourses();
      component.newCourseTitle = 'Mastering Angular Signals';
      component.newCourseCategory = 'Angular';
      component.newCourseDifficulty = 'advanced';

      component.confirmAddCourse();
      fixture.detectChanges();

      expect(component.totalCourses()).toBe(initialCount + 1);
      expect(component.timelineHistory().length).toBeGreaterThan(1);
    });

    it('should delete course from store', () => {
      const initialCount = component.totalCourses();
      const courseToDelete = component.filteredCourses()[0];

      component.onDeleteCourse(courseToDelete);
      fixture.detectChanges();

      expect(component.totalCourses()).toBe(initialCount - 1);
      expect(component.filteredCourses().some(c => c.id === courseToDelete.id)).toBe(false);
    });

    it('should run boundary verifiers for deep slice, non-existent key, and unknown actions', () => {
      component.testNonExistentProperty();
      expect(component.boundaryTestMessage()).toContain('F42.B2 Verified');

      component.testDeepSliceSelection();
      expect(component.boundaryTestMessage()).toContain('F42.B4 Verified');

      component.testUnknownAction();
      expect(component.boundaryTestMessage()).toContain('F42.B5 Verified');
    });
  });
});
