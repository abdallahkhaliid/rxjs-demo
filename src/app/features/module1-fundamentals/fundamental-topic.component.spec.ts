import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideRouter, ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { FundamentalTopicComponent } from './fundamental-topic.component';
import { MODULE1_TOPICS } from './module1.data';
import { ProgressService } from '../../core/services/progress.service';

describe('FundamentalTopicComponent', () => {
  let component: FundamentalTopicComponent;
  let fixture: ComponentFixture<FundamentalTopicComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [FundamentalTopicComponent],
      providers: [
        provideZonelessChangeDetection(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: {
            data: of({ topicId: 'what-is-rxjs' }),
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
    component.ngOnDestroy();
  });

  it('should create the component with default topic what-is-rxjs', () => {
    expect(component).toBeTruthy();
    expect(component.topicId()).toBe('what-is-rxjs');
    expect(component.topic()).not.toBeNull();
    expect(component.topic()?.title).toBe('What is RxJS?');
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

  it('should have complete and valid data for all 7 topics in MODULE1_TOPICS', () => {
    const topicKeys = [
      'what-is-rxjs',
      'what-is-observable',
      'observable-vs-promise',
      'observer-subscriber',
      'subscription-lifecycle',
      'cold-vs-hot',
      'multicasting'
    ];

    expect(Object.keys(MODULE1_TOPICS).length).toBe(7);

    for (const key of topicKeys) {
      const topic = MODULE1_TOPICS[key];
      expect(topic).toBeDefined(`Topic ${key} must exist`);
      expect(topic.id).toBe(key);
      expect(topic.title.length).toBeGreaterThan(0);
      expect(topic.concept.summary.length).toBeGreaterThan(0);
      expect(topic.concept.takeaways.length).toBeGreaterThan(0);
      expect(topic.code.code.length).toBeGreaterThan(0);
      expect(topic.comparison.features.length).toBeGreaterThan(0);
      expect(topic.comparison.items.length).toBeGreaterThan(0);
      expect(topic.quiz.length).toBeGreaterThanOrEqual(3);

      for (const q of topic.quiz) {
        expect(q.options.length).toBeGreaterThanOrEqual(2);
        const optionIds = q.options.map(o => o.id);
        expect(optionIds).toContain(q.correctOptionId, `Quiz question ${q.id} in ${key} must have matching correctOptionId`);
        expect(q.explanation.length).toBeGreaterThan(0);
      }
    }
  });

  it('should execute pull simulation correctly in Topic 1', () => {
    expect(component.pullCount()).toBe(0);
    expect(component.consoleEntries().length).toBe(0);

    component.simulatePull();
    expect(component.pullCount()).toBe(1);
    expect(component.consoleEntries().length).toBe(1);
    expect(component.consoleEntries()[0].streamName).toBe('PULL-CONSUMER');
    expect(component.consoleEntries()[0].type).toBe('next');

    component.simulatePull();
    expect(component.pullCount()).toBe(2);
    expect(component.consoleEntries().length).toBe(2);
  });

  it('should start and stop push stream in Topic 1', () => {
    expect(component.isPushing()).toBeFalse();
    component.startPushStream();
    expect(component.isPushing()).toBeTrue();

    const subEntry = component.consoleEntries().find(e => e.type === 'subscribe');
    expect(subEntry).toBeDefined();

    component.stopPushStream();
    expect(component.isPushing()).toBeFalse();

    const completeEntry = component.consoleEntries().find(e => e.type === 'complete');
    expect(completeEntry).toBeDefined();
  });

  it('should manage blueprint and unicast subscribers in Topic 2', () => {
    component.createBlueprint();
    expect(component.blueprintCreated()).toBeTrue();

    component.subscribeA();
    expect(component.subAActive()).toBeTrue();

    component.subscribeB();
    expect(component.subBActive()).toBeTrue();

    component.unsubscribeA();
    expect(component.subAActive()).toBeFalse();

    component.unsubscribeB();
    expect(component.subBActive()).toBeFalse();
  });

  it('should handle observable cancellation in Topic 3', () => {
    component.startObservableDemo();
    expect(component.obsRunning()).toBeTrue();

    component.cancelObservableDemo();
    expect(component.obsRunning()).toBeFalse();
    expect(component.obsCancelled()).toBeTrue();

    const unsubEntry = component.consoleEntries().find(e => e.type === 'unsubscribe');
    expect(unsubEntry).toBeDefined();
  });

  it('should enforce contract and block illegal emissions after complete in Topic 4', () => {
    component.safeEmitNext();
    const countBefore = component.consoleEntries().length;
    expect(countBefore).toBeGreaterThan(0);

    component.safeEmitComplete();
    expect(component.streamTerminated()).toBeTrue();

    // Illegal next after complete
    component.safeEmitNext();
    const lastEntry = component.consoleEntries()[component.consoleEntries().length - 1];
    expect(lastEntry.description).toContain('BLOCKED illegal next()');
  });

  it('should cascade unsubscription down composite subscription tree in Topic 5', () => {
    component.initSubscriptionTree();
    expect(component.treeParentActive()).toBeTrue();
    expect(component.treeChild1Active()).toBeTrue();
    expect(component.treeChild2Active()).toBeTrue();
    expect(component.treeChild3Active()).toBeTrue();

    component.unsubscribeChild2Only();
    expect(component.treeChild2Active()).toBeFalse();
    expect(component.treeChild1Active()).toBeTrue();
    expect(component.treeParentActive()).toBeTrue();

    component.unsubscribeParentTree();
    expect(component.treeParentActive()).toBeFalse();
    expect(component.treeChild1Active()).toBeFalse();
    expect(component.treeChild3Active()).toBeFalse();
  });

  it('should demonstrate multicasting cache efficiency in Topic 7', () => {
    component.setMulticastMode('multicast');
    expect(component.networkCalls()).toBe(0);

    component.mountComponent('Header Nav');
    expect(component.networkCalls()).toBe(1);
    expect(component.activeConsumersCount()).toBe(1);

    component.mountComponent('User Profile');
    // Cached response hit: networkCalls should still be 1
    expect(component.networkCalls()).toBe(1);
    expect(component.activeConsumersCount()).toBe(2);
    expect(component.bandwidthSaved()).toBe(50);

    component.unmountAllComponents();
    expect(component.activeConsumersCount()).toBe(0);
  });

  it('should clean up all active timers and subscriptions upon destruction', () => {
    component.startPushStream();
    component.startObservableDemo();
    component.initSubscriptionTree();

    expect(() => component.ngOnDestroy()).not.toThrow();
  });
});
