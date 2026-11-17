import { Component, inject, signal, computed, DestroyRef, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subscription,
  Observable,
  of,
  from,
  fromEvent,
  interval,
  timer,
  range,
  throwError,
  defer,
  EMPTY,
  NEVER,
  generate,
  iif
} from 'rxjs';
import { take, catchError, defaultIfEmpty, timeout } from 'rxjs/operators';

import { ConsoleEntry, ConsoleEntryType, MarbleStream, MarbleEmission, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { OperatorCardComponent } from '../../shared/components/operator-card/operator-card.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { MarbleDiagramComponent } from '../../shared/components/marble-diagram/marble-diagram.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';
import { MODULE2_OPERATORS, CreationOperatorConfig } from './module2.data';

const SLUG_TO_ID_MAP: Record<string, string> = {
  'of': 'of',
  'from': 'from',
  'from-event': 'fromEvent',
  'fromEvent': 'fromEvent',
  'interval': 'interval',
  'timer': 'timer',
  'range': 'range',
  'throw-error': 'throwError',
  'throwError': 'throwError',
  'defer': 'defer',
  'empty': 'empty',
  'never': 'never',
  'generate': 'generate',
  'iif': 'iif'
};

const MARBLE_COLORS = [
  'var(--color-marble-1)',
  'var(--color-marble-2)',
  'var(--color-marble-3)',
  'var(--color-marble-4)',
  'var(--color-marble-5)',
  'var(--color-marble-6)',
  'var(--color-marble-7)',
  'var(--color-marble-8)'
];

@Component({
  selector: 'app-creation-playground',
  standalone: true,
  imports: [
    PlaygroundWrapperComponent,
    OperatorCardComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    MarbleDiagramComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './creation-playground.component.html',
  styleUrl: './creation-playground.component.scss'
})
export class CreationPlaygroundComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly operatorId = signal<string>('of');
  readonly activeTab = signal<PlaygroundTab>('concept');
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  readonly isRunning = signal<boolean>(false);
  readonly isCompleted = signal<boolean>(false);
  readonly durationMs = signal<number>(4000);

  readonly outputMarbleStream = signal<MarbleStream | null>(null);

  readonly config = computed<CreationOperatorConfig | null>(() => {
    const id = this.operatorId();
    return MODULE2_OPERATORS[id] || MODULE2_OPERATORS['of'] || null;
  });

  private activeSubscription: Subscription | null = null;
  private streamStartTime: number = 0;
  private entryIdCounter: number = 0;
  private emissionCounter: number = 0;

  // --- Parameter Signals ---
  // of
  readonly ofValuesInput = signal<string>('Angular, RxJS, Signals, Zoneless');
  // from
  readonly fromInputType = signal<'array' | 'promise_resolve' | 'promise_reject' | 'string_iterable'>('array');
  // fromEvent
  @ViewChild('eventTarget', { static: false }) eventTargetRef?: ElementRef<HTMLDivElement>;
  // interval
  readonly intervalPeriod = signal<number>(500);
  readonly intervalTakeCount = signal<number>(5);
  // timer
  readonly timerMode = signal<'single_shot' | 'recurring'>('single_shot');
  readonly timerDueMs = signal<number>(800);
  readonly timerPeriodMs = signal<number>(400);
  // range
  readonly rangeStart = signal<number>(1);
  readonly rangeCount = signal<number>(5);
  // throwError
  readonly throwErrorMessage = signal<string>('Simulated Network Error (500)');
  readonly throwCatchError = signal<boolean>(false);
  // defer
  readonly deferMode = signal<'timestamp' | 'random'>('timestamp');
  // empty
  readonly emptyDefaultIfEmpty = signal<boolean>(false);
  // never
  readonly neverWithTimeout = signal<boolean>(false);
  // generate
  readonly generatePreset = signal<'powers_of_2' | 'even_numbers' | 'countdown'>('powers_of_2');
  // iif
  readonly iifCondition = signal<boolean>(true);

  constructor() {
    this.route.data.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(data => {
      const raw = data['operatorId'];
      const mapped = SLUG_TO_ID_MAP[raw] || raw;
      if (mapped && mapped !== this.operatorId()) {
        this.stopOperatorStream();
        this.operatorId.set(mapped);
        this.resetOperatorState();
      }
    });
  }

  ngOnInit(): void {
    const raw = this.route.snapshot.data['operatorId'];
    const mapped = SLUG_TO_ID_MAP[raw] || raw;
    if (mapped) {
      this.operatorId.set(mapped);
      this.resetOperatorState();
    }
  }

  ngOnDestroy(): void {
    this.stopOperatorStream();
  }

  private resetOperatorState(): void {
    this.clearConsole();
    this.isRunning.set(false);
    this.isCompleted.set(false);
    const cfg = this.config();
    if (cfg && cfg.initialMarbles.length > 0) {
      this.outputMarbleStream.set(cfg.initialMarbles[0]);
    } else {
      this.outputMarbleStream.set(null);
    }
  }

  // --- Parameter Update Methods ---
  updateOfValues(val: string): void { this.ofValuesInput.set(val); }
  updateFromInputType(val: any): void { this.fromInputType.set(val); }
  updateIntervalPeriod(val: number): void { this.intervalPeriod.set(val); }
  updateIntervalTakeCount(val: number): void { this.intervalTakeCount.set(val); }
  updateTimerMode(val: any): void { this.timerMode.set(val); }
  updateTimerDue(val: number): void { this.timerDueMs.set(val); }
  updateTimerPeriod(val: number): void { this.timerPeriodMs.set(val); }
  updateRangeStart(val: number): void { this.rangeStart.set(val); }
  updateRangeCount(val: number): void { this.rangeCount.set(val); }
  updateThrowErrorMessage(val: string): void { this.throwErrorMessage.set(val); }
  toggleThrowCatchError(): void { this.throwCatchError.update(v => !v); }
  updateDeferMode(val: any): void { this.deferMode.set(val); }
  toggleEmptyDefault(): void { this.emptyDefaultIfEmpty.update(v => !v); }
  toggleNeverTimeout(): void { this.neverWithTimeout.update(v => !v); }
  updateGeneratePreset(val: any): void { this.generatePreset.set(val); }
  updateIifCondition(val: boolean): void { this.iifCondition.set(val); }


  // --- Console Logging Helper ---
  addLog(type: ConsoleEntryType, streamName?: string, value?: any, description?: string): void {
    const relativeMs = this.streamStartTime ? Date.now() - this.streamStartTime : 0;
    const entry: ConsoleEntry = {
      id: `m2_entry_${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs,
      type,
      streamName,
      value,
      description
    };
    this.consoleEntries.update(entries => [...entries, entry]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
    this.streamStartTime = Date.now();
  }

  // --- Runner Logic ---
  runOperatorStream(): void {
    this.stopOperatorStream();
    this.isRunning.set(true);
    this.isCompleted.set(false);
    this.streamStartTime = Date.now();
    this.emissionCounter = 0;

    const opName = this.config()?.metadata.name || 'stream$';
    this.outputMarbleStream.set({
      id: `out_${Date.now()}`,
      label: `${opName}()`,
      color: 'var(--color-primary-500)',
      emissions: []
    });

    this.addLog('subscribe', opName, undefined, 'Subscription active. Observable execution initiated.');

    const observable$ = this.buildObservable();

    this.activeSubscription = observable$.subscribe({
      next: val => {
        this.emissionCounter++;
        this.addLog('next', opName, val, `Emission #${this.emissionCounter}`);
        this.recordMarbleEmission(val);
      },
      error: err => {
        this.isRunning.set(false);
        const errMsg = err?.message || String(err);
        this.addLog('error', opName, errMsg, 'Stream terminated with error');
        this.recordMarbleError();
      },
      complete: () => {
        this.isRunning.set(false);
        this.isCompleted.set(true);
        this.addLog('complete', opName, undefined, 'Stream completed successfully');
        this.recordMarbleComplete();
      }
    });
  }

  stopOperatorStream(): void {
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
      if (this.isRunning()) {
        this.addLog('unsubscribe', this.config()?.metadata.name || 'stream$', undefined, 'Stream cancelled mid-execution via unsubscription');
      }
    }
    this.isRunning.set(false);
  }

  private buildObservable(): Observable<any> {
    const id = this.operatorId();

    switch (id) {
      case 'of': {
        const rawValues = this.ofValuesInput()
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0);
        return of(...rawValues);
      }

      case 'from': {
        const type = this.fromInputType();
        if (type === 'promise_resolve') {
          return from(new Promise(res => setTimeout(() => res('Promise Resolved (200 OK)'), 1000)));
        } else if (type === 'promise_reject') {
          return from(new Promise((_, rej) => setTimeout(() => rej(new Error('Promise Rejected (Network Timeout)')), 1000)));
        } else if (type === 'string_iterable') {
          return from('RxJS');
        } else {
          return from(['Alpha', 'Beta', 'Gamma', 'Delta']);
        }
      }

      case 'fromEvent': {
        if (!this.eventTargetRef?.nativeElement) {
          return EMPTY;
        }
        return fromEvent<MouseEvent>(this.eventTargetRef.nativeElement, 'click');
      }

      case 'interval': {
        const p = Math.max(this.intervalPeriod(), 50);
        const count = Math.max(this.intervalTakeCount(), 1);
        return interval(p).pipe(take(count));
      }

      case 'timer': {
        const due = Math.max(this.timerDueMs(), 0);
        if (this.timerMode() === 'recurring') {
          const p = Math.max(this.timerPeriodMs(), 50);
          return timer(due, p).pipe(take(5));
        } else {
          return timer(due);
        }
      }

      case 'range': {
        const s = this.rangeStart();
        const c = this.rangeCount();
        return range(s, c);
      }

      case 'throwError': {
        const msg = this.throwErrorMessage();
        const raw$ = throwError(() => new Error(msg));
        if (this.throwCatchError()) {
          return raw$.pipe(
            catchError(err => of(`[Recovered Fallback]: ${err.message}`))
          );
        }
        return raw$;
      }

      case 'defer': {
        const mode = this.deferMode();
        return defer(() => {
          if (mode === 'timestamp') {
            return of(`Timestamp: ${new Date().toLocaleTimeString()}`);
          } else {
            const token = Math.floor(1000 + Math.random() * 9000);
            return of(`Token: #${token}`);
          }
        });
      }

      case 'empty': {
        if (this.emptyDefaultIfEmpty()) {
          return EMPTY.pipe(defaultIfEmpty('Fallback Default Value'));
        }
        return EMPTY;
      }

      case 'never': {
        if (this.neverWithTimeout()) {
          return NEVER.pipe(timeout({ each: 2000 }));
        }
        return NEVER;
      }

      case 'generate': {
        const preset = this.generatePreset();
        if (preset === 'even_numbers') {
          return generate({
            initialState: 0,
            condition: x => x <= 10,
            iterate: x => x + 2
          });
        } else if (preset === 'countdown') {
          return generate({
            initialState: 10,
            condition: x => x >= 1,
            iterate: x => x - 1
          });
        } else {
          return generate({
            initialState: 1,
            condition: x => x <= 64,
            iterate: x => x * 2
          });
        }
      }

      case 'iif': {
        const cond = this.iifCondition();
        return iif(
          () => cond,
          of('VIP Content (Condition = TRUE)'),
          of('Guest Content (Condition = FALSE)')
        );
      }

      default:
        return of('Default Value');
    }
  }

  private recordMarbleEmission(val: any): void {
    const elapsed = Date.now() - this.streamStartTime;
    const currentStream = this.outputMarbleStream();
    if (!currentStream) return;

    let displayLabel = String(val);
    if (typeof val === 'object' && val !== null) {
      if (val.clientX !== undefined && val.clientY !== undefined) {
        displayLabel = `(${val.clientX},${val.clientY})`;
      } else if (val.x !== undefined && val.y !== undefined) {
        displayLabel = `(${val.x},${val.y})`;
      } else {
        displayLabel = 'OBJ';
      }
    }
    if (displayLabel.length > 8) {
      displayLabel = displayLabel.substring(0, 7) + '…';
    }

    // Stagger synchronous emissions (elapsed < 50ms) across the timeline so marbles don't stack
    const timeMs = elapsed > 50 ? elapsed : 100 + (this.emissionCounter - 1) * 250;

    const marble: MarbleEmission = {
      id: `emission_${this.emissionCounter}`,
      timeMs,
      value: val,
      displayLabel,
      color: MARBLE_COLORS[(this.emissionCounter - 1) % MARBLE_COLORS.length]
    };

    this.outputMarbleStream.set({
      ...currentStream,
      emissions: [...currentStream.emissions, marble]
    });
  }

  private recordMarbleComplete(): void {
    const elapsed = Date.now() - this.streamStartTime;
    const currentStream = this.outputMarbleStream();
    if (!currentStream) return;

    const lastEmissionTime = currentStream.emissions.length > 0
      ? currentStream.emissions[currentStream.emissions.length - 1].timeMs
      : 0;
    const completedAtMs = elapsed > 50 ? Math.max(elapsed, 200) : Math.max(lastEmissionTime + 200, 200);

    this.outputMarbleStream.set({
      ...currentStream,
      completedAtMs
    });
  }

  private recordMarbleError(): void {
    const elapsed = Date.now() - this.streamStartTime;
    const currentStream = this.outputMarbleStream();
    if (!currentStream) return;

    const lastEmissionTime = currentStream.emissions.length > 0
      ? currentStream.emissions[currentStream.emissions.length - 1].timeMs
      : 0;
    const errorAtMs = elapsed > 50 ? Math.max(elapsed, 200) : Math.max(lastEmissionTime + 200, 200);

    this.outputMarbleStream.set({
      ...currentStream,
      errorAtMs
    });
  }
}
