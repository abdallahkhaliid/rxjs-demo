import {
  Component,
  inject,
  signal,
  computed,
  OnInit,
  OnDestroy,
  ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { Subject, BehaviorSubject, ReplaySubject, AsyncSubject, Subscription } from 'rxjs';

import { ConsoleEntry, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import {
  SubjectType,
  ObserverId,
  ObserverViewModel,
  SubjectStatusModel,
  SubjectTopicData,
  EmissionSource
} from './module5.models';
import { MODULE5_TOPICS } from './module5.data';

@Component({
  selector: 'app-subject-detail',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './subject-detail.component.html',
  styleUrl: './subject-detail.component.scss'
})
export class SubjectDetailComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  readonly topicId = signal<string>('behavior-subject');
  readonly activeTab = signal<PlaygroundTab>('visual');

  // Specific Subject Variant
  readonly subjectType = signal<SubjectType>('BehaviorSubject');

  // Variant-specific parameters
  readonly behaviorInitialValue = signal<string>('Guest');
  readonly behaviorInitialIsNull = signal<boolean>(false);
  readonly replayBufferSize = signal<number>(2);
  readonly replayWindowTimeMs = signal<number>(0);
  readonly bufferSizes = [1, 2, 3, 5];

  // Inputs
  readonly nextValueInput = signal<string>('State: Active');
  readonly nextValueCounter = signal<number>(1);

  // Observers Fleet (A & B for focused deep dive)
  readonly observers = signal<Record<'A' | 'B', ObserverViewModel>>({
    A: {
      id: 'A',
      name: 'Observer A (Early Subscriber)',
      color: '#38bdf8',
      status: 'idle',
      subscriptionTime: null,
      emissions: [],
      totalReceived: 0
    },
    B: {
      id: 'B',
      name: 'Observer B (Late Subscriber)',
      color: '#a855f7',
      status: 'idle',
      subscriptionTime: null,
      emissions: [],
      totalReceived: 0
    }
  });

  readonly consoleEntries = signal<ConsoleEntry[]>([]);

  readonly subjectStatus = signal<SubjectStatusModel>({
    isStopped: false,
    hasError: false,
    errorMessage: undefined,
    isCompleted: false,
    isClosed: false,
    currentValue: undefined,
    emissionCount: 0,
    activeSubscriberCount: 0
  });

  readonly topic = computed<SubjectTopicData | null>(() => {
    const id = this.topicId();
    return MODULE5_TOPICS[id] || MODULE5_TOPICS['behavior-subject'] || null;
  });

  private currentSubject: Subject<any> | null = null;
  private observerSubscriptions: Record<'A' | 'B', Subscription | null> = {
    A: null,
    B: null
  };
  private startTime = Date.now();
  private entryIdCounter = 0;
  private emissionCounter = 0;

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data && data['topicId']) {
        this.topicId.set(data['topicId']);
      }
      if (data && data['subjectType']) {
        this.subjectType.set(data['subjectType']);
      } else {
        const id = this.topicId();
        if (id === 'replay-subject') this.subjectType.set('ReplaySubject');
        else if (id === 'async-subject') this.subjectType.set('AsyncSubject');
        else this.subjectType.set('BehaviorSubject');
      }

      this.setupInitialPreset();
      this.initSubjectInstance();
    });
  }

  ngOnDestroy(): void {
    this.teardownSubscriptions();
    if (this.currentSubject && !this.currentSubject.closed) {
      try {
        this.currentSubject.unsubscribe();
      } catch {}
    }
  }

  private setupInitialPreset(): void {
    const type = this.subjectType();
    if (type === 'BehaviorSubject') {
      this.behaviorInitialValue.set('User: Guest');
      this.nextValueInput.set('User: Alice');
    } else if (type === 'ReplaySubject') {
      this.replayBufferSize.set(2);
      this.nextValueInput.set('Chat Message 1');
    } else if (type === 'AsyncSubject') {
      this.nextValueInput.set('HTTP Progress: 50%');
    }
  }

  initSubjectInstance(): void {
    this.teardownSubscriptions();
    this.resetObserverFleet();
    this.startTime = Date.now();
    this.emissionCounter = 0;

    const type = this.subjectType();
    switch (type) {
      case 'BehaviorSubject': {
        const val = this.behaviorInitialIsNull() ? null : this.behaviorInitialValue();
        this.currentSubject = new BehaviorSubject<any>(val);
        break;
      }
      case 'ReplaySubject': {
        const buf = this.replayBufferSize();
        const win = this.replayWindowTimeMs() > 0 ? this.replayWindowTimeMs() : undefined;
        this.currentSubject = new ReplaySubject<any>(buf, win);
        break;
      }
      case 'AsyncSubject':
        this.currentSubject = new AsyncSubject<any>();
        break;
      default:
        this.currentSubject = new Subject<any>();
        break;
    }

    this.refreshSubjectStatus();
    this.logConsole('info', `Initialized ${type} deep dive instance`, 'System');

    // Auto-subscribe Observer A early to highlight initial replay / early observation
    this.subscribeObserver('A');
  }

  subscribeObserver(id: 'A' | 'B'): void {
    if (this.observerSubscriptions[id]) return;
    if (!this.currentSubject) return;

    const now = Date.now();
    const relMs = now - this.startTime;

    this.logConsole('subscribe', `${id === 'A' ? 'Observer A' : 'Observer B'} connected`, `Observer ${id}`);

    this.updateObserverState(id, obs => ({
      ...obs,
      status: 'connected',
      subscriptionTime: relMs,
      emissions: [
        ...obs.emissions,
        {
          id: `sub-${++this.entryIdCounter}`,
          timestamp: now,
          relativeMs: relMs,
          type: 'subscribed',
          source: 'status',
          displayValue: `Subscribed to ${this.subjectType()}`
        }
      ]
    }));

    let isSubscribingSync = true;

    try {
      const sub = this.currentSubject.subscribe({
        next: (val) => {
          const emitNow = Date.now();
          const emitRelMs = emitNow - this.startTime;
          const source: EmissionSource = isSubscribingSync ? 'replay' : 'live';

          this.logConsole('next', val, `Observer ${id}`);

          this.updateObserverState(id, obs => ({
            ...obs,
            totalReceived: obs.totalReceived + 1,
            emissions: [
              ...obs.emissions,
              {
                id: `emit-${++this.entryIdCounter}`,
                timestamp: emitNow,
                relativeMs: emitRelMs,
                type: 'next',
                value: val,
                source,
                displayValue: this.formatValue(val)
              }
            ]
          }));
        },
        error: (err) => {
          const errNow = Date.now();
          const errRelMs = errNow - this.startTime;
          const errMsg = err instanceof Error ? err.message : String(err);

          this.logConsole('error', errMsg, `Observer ${id}`);

          this.updateObserverState(id, obs => ({
            ...obs,
            status: 'error',
            emissions: [
              ...obs.emissions,
              {
                id: `err-${++this.entryIdCounter}`,
                timestamp: errNow,
                relativeMs: errRelMs,
                type: 'error',
                value: errMsg,
                displayValue: `Error: ${errMsg}`
              }
            ]
          }));

          this.observerSubscriptions[id] = null;
          this.refreshSubjectStatus();
        },
        complete: () => {
          const compNow = Date.now();
          const compRelMs = compNow - this.startTime;

          this.logConsole('complete', 'Stream Completed', `Observer ${id}`);

          this.updateObserverState(id, obs => ({
            ...obs,
            status: 'completed',
            emissions: [
              ...obs.emissions,
              {
                id: `comp-${++this.entryIdCounter}`,
                timestamp: compNow,
                relativeMs: compRelMs,
                type: 'complete',
                source: 'status',
                displayValue: 'Completed'
              }
            ]
          }));

          this.observerSubscriptions[id] = null;
          this.refreshSubjectStatus();
        }
      });

      isSubscribingSync = false;
      this.observerSubscriptions[id] = sub;
    } catch (e: any) {
      isSubscribingSync = false;
      this.logConsole('error', `Subscription failed: ${e.message}`, `Observer ${id}`);
    }

    this.refreshSubjectStatus();
  }

  unsubscribeObserver(id: 'A' | 'B'): void {
    const sub = this.observerSubscriptions[id];
    if (!sub) return;

    sub.unsubscribe();
    this.observerSubscriptions[id] = null;

    const now = Date.now();
    const relMs = now - this.startTime;

    this.logConsole('unsubscribe', `Observer ${id} unsubscribed`, `Observer ${id}`);

    this.updateObserverState(id, obs => ({
      ...obs,
      status: 'idle',
      emissions: [
        ...obs.emissions,
        {
          id: `unsub-${++this.entryIdCounter}`,
          timestamp: now,
          relativeMs: relMs,
          type: 'unsubscribed',
          source: 'status',
          displayValue: 'Unsubscribed'
        }
      ]
    }));

    this.refreshSubjectStatus();
  }

  emitNext(): void {
    if (!this.currentSubject || this.currentSubject.isStopped || this.currentSubject.closed) {
      return;
    }

    const val = this.nextValueInput();
    this.emissionCounter++;

    this.logConsole('info', `Emit: ${val}`, 'Producer');
    this.currentSubject.next(val);

    this.nextValueCounter.update(c => c + 1);
    this.refreshSubjectStatus();
  }

  emitComplete(): void {
    if (!this.currentSubject || this.currentSubject.isStopped || this.currentSubject.closed) {
      return;
    }

    this.logConsole('complete', 'Subject.complete() called', 'Producer');
    this.currentSubject.complete();
    this.refreshSubjectStatus();
  }

  resetDemo(): void {
    this.initSubjectInstance();
    this.setupInitialPreset();
  }

  setPreset(value: string): void {
    this.nextValueInput.set(value);
  }

  setBufferSize(size: number): void {
    this.replayBufferSize.set(size);
    this.initSubjectInstance();
  }

  setWindowTime(ms: number): void {
    this.replayWindowTimeMs.set(ms);
    this.initSubjectInstance();
  }

  setNullInitial(isNull: boolean): void {
    this.behaviorInitialIsNull.set(isNull);
    this.initSubjectInstance();
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private refreshSubjectStatus(): void {
    if (!this.currentSubject) return;

    let currVal: any = undefined;
    if (this.subjectType() === 'BehaviorSubject' && 'getValue' in this.currentSubject) {
      try {
        currVal = (this.currentSubject as BehaviorSubject<any>).getValue();
      } catch {}
    }

    const activeSubs = Object.values(this.observerSubscriptions).filter(s => s !== null).length;

    this.subjectStatus.set({
      isStopped: !!this.currentSubject.isStopped,
      hasError: !!this.currentSubject.hasError,
      errorMessage: this.currentSubject.thrownError ? String(this.currentSubject.thrownError.message || this.currentSubject.thrownError) : undefined,
      isCompleted: !!this.currentSubject.isStopped && !this.currentSubject.hasError,
      isClosed: !!this.currentSubject.closed,
      currentValue: currVal,
      emissionCount: this.emissionCounter,
      activeSubscriberCount: activeSubs
    });
  }

  private teardownSubscriptions(): void {
    (['A', 'B'] as const).forEach(id => {
      if (this.observerSubscriptions[id]) {
        try {
          this.observerSubscriptions[id]?.unsubscribe();
        } catch {}
        this.observerSubscriptions[id] = null;
      }
    });
  }

  private resetObserverFleet(): void {
    this.observers.set({
      A: {
        id: 'A',
        name: 'Observer A (Early Subscriber)',
        color: '#38bdf8',
        status: 'idle',
        subscriptionTime: null,
        emissions: [],
        totalReceived: 0
      },
      B: {
        id: 'B',
        name: 'Observer B (Late Subscriber)',
        color: '#a855f7',
        status: 'idle',
        subscriptionTime: null,
        emissions: [],
        totalReceived: 0
      }
    });
  }

  private updateObserverState(id: 'A' | 'B', updater: (prev: ObserverViewModel) => ObserverViewModel): void {
    const current = { ...this.observers() };
    if (current[id]) {
      current[id] = updater(current[id]);
      this.observers.set(current);
    }
  }

  private logConsole(type: ConsoleEntry['type'], value: any, streamName?: string): void {
    const now = Date.now();
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: now,
      relativeMs: now - this.startTime,
      type,
      streamName,
      value
    };
    this.consoleEntries.update(list => [...list, entry]);
  }

  formatValue(val: any): string {
    if (val === undefined) return 'undefined';
    if (val === null) return 'null';
    if (typeof val === 'object') {
      try {
        return JSON.stringify(val);
      } catch {
        return String(val);
      }
    }
    return String(val);
  }
}
