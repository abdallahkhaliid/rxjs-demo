import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SubjectDetailComponent } from './subject-detail.component';
import { ProgressService } from '../../core/services/progress.service';

describe('SubjectDetailComponent', () => {
  let component: SubjectDetailComponent;
  let fixture: ComponentFixture<SubjectDetailComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SubjectDetailComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ topicId: 'behavior-subject', subjectType: 'BehaviorSubject' }),
            snapshot: { data: { topicId: 'behavior-subject', subjectType: 'BehaviorSubject' } }
          }
        },
        ProgressService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SubjectDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    component.ngOnDestroy();
  });

  it('should create the detail component with BehaviorSubject loaded', () => {
    expect(component).toBeTruthy();
    expect(component.topicId()).toBe('behavior-subject');
    expect(component.subjectType()).toBe('BehaviorSubject');
    expect(component.topic()?.title).toBe('BehaviorSubject Deep Dive');
  });

  it('should auto-connect Observer A and receive the seed initial value', () => {
    expect(component.observers()['A'].status).toBe('connected');
    const nextEmissions = component.observers()['A'].emissions.filter(e => e.type === 'next');
    expect(nextEmissions.length).toBe(1);
    expect(nextEmissions[0].value).toBe('User: Guest');
  });

  it('should deliver updated state to early Observer A and immediate replay to late Observer B', () => {
    component.nextValueInput.set('User: Alice (Admin)');
    component.emitNext();

    // Now connect Observer B late
    component.subscribeObserver('B');

    const obsBNext = component.observers()['B'].emissions.filter(e => e.type === 'next');
    expect(obsBNext.length).toBe(1);
    expect(obsBNext[0].value).toBe('User: Alice (Admin)');
    expect(obsBNext[0].source).toBe('replay');
  });

  it('should update topic when route provides replay-subject', () => {
    component.topicId.set('replay-subject');
    component.subjectType.set('ReplaySubject');
    component.initSubjectInstance();

    expect(component.topic()?.title).toBe('ReplaySubject Deep Dive');
  });

  it('should update topic when route provides async-subject', () => {
    component.topicId.set('async-subject');
    component.subjectType.set('AsyncSubject');
    component.initSubjectInstance();

    expect(component.topic()?.title).toBe('AsyncSubject Deep Dive');
  });
});
