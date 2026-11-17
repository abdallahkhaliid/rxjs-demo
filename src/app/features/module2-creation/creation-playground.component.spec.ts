import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of, from } from 'rxjs';

import { CreationPlaygroundComponent } from './creation-playground.component';
import { MODULE2_OPERATORS } from './module2.data';
import { ProgressService } from '../../core/services/progress.service';

describe('CreationPlaygroundComponent', () => {
  let component: CreationPlaygroundComponent;
  let fixture: ComponentFixture<CreationPlaygroundComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreationPlaygroundComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ operatorId: 'of' }),
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
    component.ngOnDestroy();
  });

  it('should create the component with default operator of', () => {
    expect(component).toBeTruthy();
    expect(component.operatorId()).toBe('of');
    expect(component.config()).not.toBeNull();
    expect(component.config()?.metadata.name).toBe('of');
  });

  it('should switch active tab correctly', () => {
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

  it('should have complete and valid data for all 12 operators in MODULE2_OPERATORS', () => {
    const operatorKeys = [
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
    ];

    expect(Object.keys(MODULE2_OPERATORS).length).toBe(12);

    for (const key of operatorKeys) {
      const op = MODULE2_OPERATORS[key];
      expect(op).toBeDefined(`Operator ${key} must exist`);
      expect(op.id).toBe(key);
      expect(op.metadata.name.length).toBeGreaterThan(0);
      expect(op.metadata.signature.length).toBeGreaterThan(0);
      expect(op.metadata.summary.length).toBeGreaterThan(0);
      expect(op.codeSnippet.length).toBeGreaterThan(0);
      expect(op.comparison.features.length).toBeGreaterThan(0);
      expect(op.comparison.items.length).toBeGreaterThan(0);
      expect(op.quiz.length).toBeGreaterThanOrEqual(3);

      for (const q of op.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        const optionIds = q.options.map(o => o.id);
        expect(optionIds).toContain(q.correctOptionId, `Quiz question ${q.id} in ${key} must have matching correctOptionId`);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it('should execute of() stream and complete synchronously', () => {
    component.updateOfValues('One, Two, Three');
    component.runOperatorStream();

    expect(component.isCompleted()).toBeTrue();
    expect(component.isRunning()).toBeFalse();

    const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries.length).toBe(3);
    expect(nextEntries[0].value).toBe('One');
    expect(nextEntries[1].value).toBe('Two');
    expect(nextEntries[2].value).toBe('Three');

    const completeEntry = component.consoleEntries().find(e => e.type === 'complete');
    expect(completeEntry).toBeDefined();

    const marbles = component.outputMarbleStream();
    expect(marbles).not.toBeNull();
    expect(marbles?.emissions.length).toBe(3);
    expect(marbles?.emissions[0].timeMs).toBe(100);
    expect(marbles?.emissions[1].timeMs).toBe(350);
    expect(marbles?.emissions[2].timeMs).toBe(600);
    expect(marbles?.completedAtMs).toBe(800);
  });

  it('should execute range() stream with custom bounds', () => {
    component.operatorId.set('range');
    component.updateRangeStart(10);
    component.updateRangeCount(3);
    component.runOperatorStream();

    expect(component.isCompleted()).toBeTrue();
    const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries.length).toBe(3);
    expect(nextEntries[0].value).toBe(10);
    expect(nextEntries[1].value).toBe(11);
    expect(nextEntries[2].value).toBe(12);
  });

  it('should execute from() with array and string iterable', () => {
    component.operatorId.set('from');
    component.updateFromInputType('array');
    component.runOperatorStream();

    expect(component.isCompleted()).toBeTrue();
    const arrayEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(arrayEntries.length).toBe(4);
    expect(arrayEntries[0].value).toBe('Alpha');

    component.updateFromInputType('string_iterable');
    component.runOperatorStream();
    const strEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(strEntries.some(e => e.value === 'R')).toBeTrue();
    expect(strEntries.some(e => e.value === 'x')).toBeTrue();
  });

  it('should verify from(Promise.resolve) emits payload and completes', async () => {
    const emitted: string[] = [];
    let completed = false;

    await new Promise<void>((resolve, reject) => {
      from(Promise.resolve('Success Payload')).subscribe({
        next: val => emitted.push(val),
        error: err => reject(err),
        complete: () => {
          completed = true;
          resolve();
        }
      });
    });

    expect(emitted).toEqual(['Success Payload']);
    expect(completed).toBeTrue();
  });

  it('should verify from(Promise.reject) propagates error callback', async () => {
    let errorCaught: any = null;

    await new Promise<void>(resolve => {
      from(Promise.reject(new Error('Network Error'))).subscribe({
        next: () => {},
        error: err => {
          errorCaught = err;
          resolve();
        },
        complete: () => resolve()
      });
    });

    expect(errorCaught).toBeDefined();
    expect(errorCaught.message).toBe('Network Error');
  });

  it('should execute from() with promise_resolve in component runner and complete', async () => {
    component.operatorId.set('from');
    component.updateFromInputType('promise_resolve');
    component.runOperatorStream();

    expect(component.isRunning()).toBeTrue();
    expect(component.isCompleted()).toBeFalse();

    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(component.isRunning()).toBeFalse();
    expect(component.isCompleted()).toBeTrue();
    const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries.length).toBe(1);
    expect(nextEntries[0].value).toContain('Promise Resolved');
  });

  it('should execute from() with promise_reject in component runner and propagate error', async () => {
    component.operatorId.set('from');
    component.updateFromInputType('promise_reject');
    component.runOperatorStream();

    expect(component.isRunning()).toBeTrue();

    await new Promise(resolve => setTimeout(resolve, 1100));

    expect(component.isRunning()).toBeFalse();
    const errEntry = component.consoleEntries().find(e => e.type === 'error');
    expect(errEntry).toBeDefined();
    expect(errEntry?.value).toContain('Promise Rejected');
  });

  it('should execute throwError() and catchError recovery', () => {
    component.operatorId.set('throwError');
    component.updateThrowErrorMessage('Fatal Network Timeout');

    // Without catchError: errors out
    component.runOperatorStream();
    expect(component.isRunning()).toBeFalse();
    const errorEntry = component.consoleEntries().find(e => e.type === 'error');
    expect(errorEntry).toBeDefined();
    expect(errorEntry?.value).toContain('Fatal Network Timeout');

    // With catchError recovery: recovers with fallback value
    component.toggleThrowCatchError();
    component.runOperatorStream();
    const recoveredEntry = component.consoleEntries().find(e => e.type === 'next');
    expect(recoveredEntry).toBeDefined();
    expect(recoveredEntry?.value).toContain('Recovered Fallback');
  });

  it('should execute EMPTY with and without defaultIfEmpty', () => {
    component.operatorId.set('empty');

    // Pure EMPTY: 0 next, 1 complete
    component.runOperatorStream();
    expect(component.isCompleted()).toBeTrue();
    const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries.length).toBe(0);

    // With defaultIfEmpty: 1 next fallback, 1 complete
    component.toggleEmptyDefault();
    component.runOperatorStream();
    const defaultEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(defaultEntries.length).toBe(1);
    expect(defaultEntries[0].value).toBe('Fallback Default Value');
  });

  it('should execute generate() with powers of 2', () => {
    component.operatorId.set('generate');
    component.updateGeneratePreset('powers_of_2');
    component.runOperatorStream();

    expect(component.isCompleted()).toBeTrue();
    const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries.length).toBe(7); // 1, 2, 4, 8, 16, 32, 64
    expect(nextEntries[0].value).toBe(1);
    expect(nextEntries[6].value).toBe(64);
  });

  it('should execute iif() with true and false conditions', () => {
    component.operatorId.set('iif');

    component.updateIifCondition(true);
    component.runOperatorStream();
    let nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries[0].value).toContain('VIP Content');

    component.updateIifCondition(false);
    component.clearConsole();
    component.runOperatorStream();
    nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries[0].value).toContain('Guest Content');
  });

  it('should capture click events with genuine fromEvent() via DOM event dispatch', () => {
    component.operatorId.set('fromEvent');
    fixture.detectChanges();
    component.runOperatorStream();

    expect(component.isRunning()).toBeTrue();

    const targetElement = fixture.nativeElement.querySelector('.interactive-target-box');
    expect(targetElement).toBeTruthy('Interactive target box must be present in DOM');

    targetElement.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 150,
      clientY: 80
    }));

    const nextEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(nextEntries.length).toBe(1);
    expect(nextEntries[0].value).toBeInstanceOf(MouseEvent);
    expect(nextEntries[0].value.clientX).toBe(150);
    expect(nextEntries[0].value.clientY).toBe(80);

    // Verify unsubscription cleanly tears down the DOM event listener
    component.stopOperatorStream();
    expect(component.isRunning()).toBeFalse();

    targetElement.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: 200,
      clientY: 100
    }));

    const afterStopEntries = component.consoleEntries().filter(e => e.type === 'next');
    expect(afterStopEntries.length).toBe(1);
  });

  it('should stop stream cleanly via stopOperatorStream()', () => {
    component.operatorId.set('interval');
    component.runOperatorStream();
    expect(component.isRunning()).toBeTrue();

    component.stopOperatorStream();
    expect(component.isRunning()).toBeFalse();

    const unsubEntry = component.consoleEntries().find(e => e.type === 'unsubscribe');
    expect(unsubEntry).toBeDefined();
  });
});
