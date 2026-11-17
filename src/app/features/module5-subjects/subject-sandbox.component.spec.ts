import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SubjectSandboxComponent } from './subject-sandbox.component';
import { MODULE5_TOPICS } from './module5.data';
import { ProgressService } from '../../core/services/progress.service';

describe('SubjectSandboxComponent', () => {
  let component: SubjectSandboxComponent;
  let fixture: ComponentFixture<SubjectSandboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectSandboxComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ topicId: 'sandbox', subjectType: 'Subject' }),
            snapshot: { data: { topicId: 'sandbox', subjectType: 'Subject' } }
          }
        },
        ProgressService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectSandboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create the component with default topic sandbox and Subject type', () => {
    expect(component).toBeTruthy();
    expect(component.topicId()).toBe('sandbox');
    expect(component.selectedSubjectType()).toBe('Subject');
    expect(component.topic()).not.toBeNull();
  });

  it('F37.1 Alignment: Standard Subject only delivers emissions occurring AFTER observer subscription', () => {
    component.selectSubjectType('Subject');

    // Observer A subscribes early
    component.subscribeObserver('A');

    // Emit 1
    component.nextValueInput.set('Val 1');
    component.emitNext();

    // Observer B subscribes late (after Val 1)
    component.subscribeObserver('B');

    // Emit 2
    component.nextValueInput.set('Val 2');
    component.emitNext();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    const obsB = component.observers()['B'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsA).toEqual(['Val 1', 'Val 2']);
    expect(obsB).toEqual(['Val 2']); // Observer B missed Val 1!
  });

  it('F37.2 Alignment: BehaviorSubject requires initial value and replays current value immediately', () => {
    component.behaviorInitialValue.set('Initial State');
    component.selectSubjectType('BehaviorSubject');

    expect(component.subjectStatus().currentValue).toBe('Initial State');

    // Observer A subscribes -> receives initial state immediately
    component.subscribeObserver('A');
    let obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    expect(obsA).toEqual(['Initial State']);

    // Emit updated
    component.nextValueInput.set('Updated State');
    component.emitNext();

    obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    expect(obsA).toEqual(['Initial State', 'Updated State']);
    expect(component.subjectStatus().currentValue).toBe('Updated State');
  });

  it('F37.3 Alignment: ReplaySubject(N) buffers and replays last N values to new subscribers', () => {
    component.setReplayBufferSize(2);
    component.selectSubjectType('ReplaySubject');

    component.nextValueInput.set('A');
    component.emitNext();
    component.nextValueInput.set('B');
    component.emitNext();
    component.nextValueInput.set('C');
    component.emitNext();

    // Observer B subscribes late
    component.subscribeObserver('B');
    const obsB = component.observers()['B'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsB).toEqual(['B', 'C']); // Last 2 items buffered
  });

  it('F37.4 Alignment: AsyncSubject emits only the final value upon completion', () => {
    component.selectSubjectType('AsyncSubject');

    component.subscribeObserver('A');

    component.nextValueInput.set('10');
    component.emitNext();
    component.nextValueInput.set('20');
    component.emitNext();
    component.nextValueInput.set('30');
    component.emitNext();

    let obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.length).toBe(0); // Nothing emitted before complete!

    component.emitComplete();

    obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.map(e => e.value)).toEqual(['30']); // Only final value!
  });

  it('F37.5 Alignment: Fleet of 3 observers subscribing and unsubscribing independently', () => {
    component.selectSubjectType('Subject');

    // A and B subscribe
    component.subscribeObserver('A');
    component.subscribeObserver('B');

    component.nextValueInput.set('Msg 1');
    component.emitNext();

    // A unhooks, C joins
    component.unsubscribeObserver('A');
    component.subscribeObserver('C');

    component.nextValueInput.set('Msg 2');
    component.emitNext();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    const obsB = component.observers()['B'].emissions.filter(e => e.type === 'next').map(e => e.value);
    const obsC = component.observers()['C'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsA).toEqual(['Msg 1']);
    expect(obsB).toEqual(['Msg 1', 'Msg 2']);
    expect(obsC).toEqual(['Msg 2']);
  });

  it('F37.B1 Alignment: BehaviorSubject accepts null as valid initial value', () => {
    component.setNullInitial(true);
    component.selectSubjectType('BehaviorSubject');

    expect(component.subjectStatus().currentValue).toBeNull();

    component.subscribeObserver('A');
    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);
    expect(obsA).toEqual([null]);
  });

  it('F37.B2 Alignment: Calling .next() after Subject is completed throws or is ignored silently', () => {
    component.selectSubjectType('Subject');
    component.subscribeObserver('A');

    component.emitComplete();
    expect(component.subjectStatus().isCompleted).toBe(true);
    expect(component.subjectStatus().isStopped).toBe(true);

    // Calling next after complete should not crash
    component.nextValueInput.set('zombie');
    component.emitNext();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.length).toBe(0);
  });

  it('F37.B3 Alignment: ReplaySubject with windowTime drops expired emissions', async () => {
    component.setReplayBufferSize(10);
    component.setReplayWindowTime(20); // 20ms window
    component.selectSubjectType('ReplaySubject');

    component.nextValueInput.set('expired');
    component.emitNext();

    await new Promise(r => setTimeout(r, 35)); // Let 35ms elapse (exceeding 20ms window)

    component.nextValueInput.set('fresh');
    component.emitNext();

    component.subscribeObserver('A');
    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next').map(e => e.value);

    expect(obsA).toEqual(['fresh']); // 'expired' was pruned
  });

  it('F37.B4 Alignment: AsyncSubject completing without any emissions completes with 0 emissions', () => {
    component.selectSubjectType('AsyncSubject');
    component.subscribeObserver('A');

    component.emitComplete();

    const obsA = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(obsA.length).toBe(0);
    expect(component.observers()['A'].status).toBe('completed');
  });

  it('F37.B5 Alignment: Subject unsubscribe() permanently marks subject as closed', () => {
    component.selectSubjectType('Subject');
    component.closeSubjectViaUnsubscribe();

    expect(component.subjectStatus().isClosed).toBe(true);
  });

  it('should accurately tag synchronous replay emissions as [REPLAY] and subsequent as [LIVE]', () => {
    component.setReplayBufferSize(3);
    component.selectSubjectType('ReplaySubject');

    // Emit 2 values prior to Observer B subscribing
    component.nextValueInput.set('Historical 1');
    component.emitNext();
    component.nextValueInput.set('Historical 2');
    component.emitNext();

    // Observer B subscribes late
    component.subscribeObserver('B');

    // Emit 1 live value after subscription
    component.nextValueInput.set('Live 3');
    component.emitNext();

    const nextEmissions = component.observers()['B'].emissions.filter(e => e.type === 'next');
    expect(nextEmissions.length).toBe(3);

    expect(nextEmissions[0].value).toBe('Historical 1');
    expect(nextEmissions[0].source).toBe('replay');

    expect(nextEmissions[1].value).toBe('Historical 2');
    expect(nextEmissions[1].source).toBe('replay');

    expect(nextEmissions[2].value).toBe('Live 3');
    expect(nextEmissions[2].source).toBe('live');
  });

  it('should handle subject error emissions properly and update observer status', () => {
    component.selectSubjectType('Subject');
    component.subscribeObserver('A');

    component.errorMessageInput.set('Test Network Failure');
    component.emitError();

    expect(component.subjectStatus().hasError).toBe(true);
    expect(component.observers()['A'].status).toBe('error');

    const errItems = component.observers()['A'].emissions.filter(e => e.type === 'error');
    expect(errItems.length).toBe(1);
    expect(errItems[0].value).toContain('Test Network Failure');
  });

  it('should reset sandbox completely when resetSandbox is triggered', () => {
    component.subscribeObserver('A');
    component.nextValueInput.set('Message X');
    component.emitNext();

    expect(component.observers()['A'].totalReceived).toBe(1);

    component.resetSandbox();

    expect(component.observers()['A'].status).toBe('idle');
    expect(component.observers()['A'].totalReceived).toBe(0);
    expect(component.nextValueCounter()).toBe(1);
    expect(component.nextValueInput()).toBe('Message 1');
  });

  it('should validate educational data structure in MODULE5_TOPICS', () => {
    const requiredTopics = ['sandbox', 'behavior-subject', 'replay-subject', 'async-subject'];
    for (const key of requiredTopics) {
      const t = MODULE5_TOPICS[key];
      expect(t).toBeDefined(`Topic ${key} must exist`);
      expect(t.concept.summary.length).toBeGreaterThan(0);
      expect(t.concept.takeaways.length).toBeGreaterThan(0);
      expect(t.code.code.length).toBeGreaterThan(0);
      expect(t.quiz.length).toBe(4); // 4 questions per topic = 16 total
      for (const q of t.quiz) {
        expect(q.options.map(o => o.id)).toContain(q.correctOptionId);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });
});
