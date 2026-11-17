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
import { ActivatedRoute } from '@angular/router';
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
  selector: 'app-subject-sandbox',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './subject-sandbox.component.html',
  styleUrl: './subject-sandbox.component.scss'
})
export class SubjectSandboxComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);

  // Active topic & tab signals
  readonly topicId = signal<string>('sandbox');
  readonly activeTab = signal<PlaygroundTab>('visual');

  // Selected Subject Type & Parameters
  readonly selectedSubjectType = signal<SubjectType>('Subject');
  readonly behaviorInitialValue = signal<string>('Initial State');
  readonly behaviorInitialIsNull = signal<boolean>(false);
  readonly replayBufferSize = signal<number>(2);
  readonly replayWindowTimeMs = signal<number>(0); // 0 = infinite
  readonly bufferSizes = [1, 2, 3, 5, 10];

  // Controller Inputs
  readonly nextValueInput = signal<string>('Message 1');
  readonly nextValueCounter = signal<number>(1);
  readonly errorMessageInput = signal<string>('Simulated Subject Error');

  // Observers Fleet (A, B, C)
  readonly observers = signal<Record<ObserverId, ObserverViewModel>>({
    A: {
      id: 'A',
      name: 'Observer A',
      color: '#38bdf8',
      status: 'idle',
      subscriptionTime: null,
      emissions: [],
      totalReceived: 0
    },
    B: {
      id: 'B',
      name: 'Observer B',
      color: '#a855f7',
      status: 'idle',
      subscriptionTime: null,
      emissions: [],
      totalReceived: 0
    },
    C: {
      id: 'C',
      name: 'Observer C',
      color: '#10b981',
      status: 'idle',
      subscriptionTime: null,
      emissions: [],
      totalReceived: 0
    }
  });

  // Global Console Logs for app-output-console
  readonly consoleEntries = signal<ConsoleEntry[]>([]);

  // Subject Status
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

  // Active Topic Data
  readonly topic = computed<SubjectTopicData | null>(() => {
    const id = this.topicId();
    return MODULE5_TOPICS[id] || MODULE5_TOPICS['sandbox'] || null;
  });

  // Internal RxJS State
  private currentSubject: Subject<any> | null = null;
  private observerSubscriptions: Record<ObserverId, Subscription | null> = {
    A: null,
    B: null,
    C: null
  };
  private sandboxStartTime = Date.now();
  private entryIdCounter = 0;
  private emissionCounter = 0;

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data && data['topicId']) {
        this.topicId.set(data['topicId']);
      }
      if (data && data['subjectType']) {
        this.selectedSubjectType.set(data['subjectType']);
      } else {
        const id = this.topicId();
        if (id === 'behavior-subject') this.selectedSubjectType.set('BehaviorSubject');
        else if (id === 'replay-subject') this.selectedSubjectType.set('ReplaySubject');
        else if (id === 'async-subject') this.selectedSubjectType.set('AsyncSubject');
      }
      this.initSubjectInstance();
    });
  }

  ngOnDestroy(): void {
    this.teardownAllSubscriptions();
    if (this.currentSubject && !this.currentSubject.closed) {
      try {
        this.currentSubject.unsubscribe();
      } catch {}
    }
  }

  // --- Subject Initialization ---
  initSubjectInstance(): void {
    this.teardownAllSubscriptions();
    this.resetObserverFleet();
    this.sandboxStartTime = Date.now();
    this.emissionCounter = 0;

    const type = this.selectedSubjectType();
    this.currentSubject = this.createSubjectInstance(type);
    this.refreshSubjectStatus();

    this.logConsole('info', `Created new ${type} instance`, 'System');
  }

  private createSubjectInstance(type: SubjectType): Subject<any> {
    switch (type) {
      case 'Subject':
        return new Subject<any>();
      case 'BehaviorSubject': {
        const initVal = this.behaviorInitialIsNull() ? null : this.behaviorInitialValue();
        return new BehaviorSubject<any>(initVal);
      }
      case 'ReplaySubject': {
        const buf = this.replayBufferSize();
        const win = this.replayWindowTimeMs() > 0 ? this.replayWindowTimeMs() : undefined;
        return new ReplaySubject<any>(buf, win);
      }
      case 'AsyncSubject':
        return new AsyncSubject<any>();
    }
  }

  // --- Observer Controls ---
  subscribeObserver(id: ObserverId): void {
    if (this.observerSubscriptions[id]) return; // Already subscribed
    if (!this.currentSubject) return;

    const now = Date.now();
    const relMs = now - this.sandboxStartTime;

    this.logConsole('subscribe', `Observer ${id} subscribed`, `Observer ${id}`);

    // Update observer status to 'connected'
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
          displayValue: `Subscribed to ${this.selectedSubjectType()}`
        }
      ]
    }));

    // Synchronous replay detection flag
    let isSubscribingSync = true;

    try {
      const sub = this.currentSubject.subscribe({
        next: (val) => {
          const emitNow = Date.now();
          const emitRelMs = emitNow - this.sandboxStartTime;
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
          const errRelMs = errNow - this.sandboxStartTime;
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
          const compRelMs = compNow - this.sandboxStartTime;

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

  unsubscribeObserver(id: ObserverId): void {
    const sub = this.observerSubscriptions[id];
    if (!sub) return;

    sub.unsubscribe();
    this.observerSubscriptions[id] = null;

    const now = Date.now();
    const relMs = now - this.sandboxStartTime;

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
          displayValue: 'Unsubscribed (Disconnected)'
        }
      ]
    }));

    this.refreshSubjectStatus();
  }

  // --- Controller Actions ---
  emitNext(): void {
    if (!this.currentSubject) return;

    if (this.currentSubject.isStopped || this.currentSubject.closed) {
      this.logConsole('info', 'Call to .next() ignored: Subject is completed, errored, or closed.', 'Controller');
      return;
    }

    const val = this.nextValueInput();
    this.emissionCounter++;

    this.logConsole('info', `Subject.next("${val}")`, 'Controller');
    this.currentSubject.next(val);

    // Auto-advance message counter for smooth user interaction
    this.nextValueCounter.update(c => c + 1);
    this.nextValueInput.set(`Message ${this.nextValueCounter()}`);

    this.refreshSubjectStatus();
  }

  emitError(): void {
    if (!this.currentSubject || this.currentSubject.isStopped || this.currentSubject.closed) {
      this.logConsole('info', 'Call to .error() ignored: Subject is stopped or closed.', 'Controller');
      return;
    }

    const msg = this.errorMessageInput() || 'Simulated Subject Error';
    this.logConsole('error', `Subject.error("${msg}")`, 'Controller');
    this.currentSubject.error(new Error(msg));

    this.refreshSubjectStatus();
  }

  emitComplete(): void {
    if (!this.currentSubject || this.currentSubject.isStopped || this.currentSubject.closed) {
      this.logConsole('info', 'Call to .complete() ignored: Subject is stopped or closed.', 'Controller');
      return;
    }

    this.logConsole('complete', 'Subject.complete() called', 'Controller');
    this.currentSubject.complete();

    this.refreshSubjectStatus();
  }

  closeSubjectViaUnsubscribe(): void {
    if (!this.currentSubject) return;
    this.logConsole('info', 'Calling subject.unsubscribe() directly (sets closed = true)', 'Controller');
    this.currentSubject.unsubscribe();
    this.teardownAllSubscriptions();
    this.refreshSubjectStatus();
  }

  resetSandbox(): void {
    this.initSubjectInstance();
    this.nextValueCounter.set(1);
    this.nextValueInput.set('Message 1');
  }

  selectSubjectType(type: SubjectType): void {
    if (this.selectedSubjectType() === type) return;
    this.selectedSubjectType.set(type);
    this.initSubjectInstance();
  }

  setPresetValue(preset: string): void {
    this.nextValueInput.set(preset);
  }

  setNullInitial(isNull: boolean): void {
    this.behaviorInitialIsNull.set(isNull);
    if (this.selectedSubjectType() === 'BehaviorSubject') {
      this.initSubjectInstance();
    }
  }

  setReplayBufferSize(size: number): void {
    this.replayBufferSize.set(size);
    if (this.selectedSubjectType() === 'ReplaySubject') {
      this.initSubjectInstance();
    }
  }

  setReplayWindowTime(timeMs: number): void {
    this.replayWindowTimeMs.set(timeMs);
    if (this.selectedSubjectType() === 'ReplaySubject') {
      this.initSubjectInstance();
    }
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  // --- Helper Methods ---
  private refreshSubjectStatus(): void {
    if (!this.currentSubject) return;

    let currVal: any = undefined;
    if (this.selectedSubjectType() === 'BehaviorSubject' && 'getValue' in this.currentSubject) {
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

  private teardownAllSubscriptions(): void {
    (['A', 'B', 'C'] as ObserverId[]).forEach(id => {
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
        name: 'Observer A',
        color: '#38bdf8',
        status: 'idle',
        subscriptionTime: null,
        emissions: [],
        totalReceived: 0
      },
      B: {
        id: 'B',
        name: 'Observer B',
        color: '#a855f7',
        status: 'idle',
        subscriptionTime: null,
        emissions: [],
        totalReceived: 0
      },
      C: {
        id: 'C',
        name: 'Observer C',
        color: '#10b981',
        status: 'idle',
        subscriptionTime: null,
        emissions: [],
        totalReceived: 0
      }
    });
  }

  private updateObserverState(id: ObserverId, updater: (prev: ObserverViewModel) => ObserverViewModel): void {
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
      relativeMs: now - this.sandboxStartTime,
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
