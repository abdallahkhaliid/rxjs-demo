import {
  Component,
  inject,
  signal,
  computed,
  DestroyRef,
  OnInit,
  OnDestroy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Subscription,
  Observable,
  Subject,
  of,
  interval,
  timer
} from 'rxjs';
import { take, tap } from 'rxjs/operators';

import {
  ConsoleEntry,
  MarbleStream,
  PlaygroundTab,
  QuizScore
} from '../../core/models';
import { ProgressService } from '../../core/services/progress.service';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { OperatorCardComponent } from '../../shared/components/operator-card/operator-card.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { MarbleDiagramComponent } from '../../shared/components/marble-diagram/marble-diagram.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import {
  OperatorCategoryId,
  OperatorDefinition,
  SourceStreamPreset,
  PipelineContext,
  CategoryInfo
} from './operator-catalog.models';
import {
  MODULE3_OPERATORS,
  OPERATOR_CATEGORIES,
  CATEGORY_DEFAULT_OPERATOR,
  CATEGORY_OPERATOR_MAP
} from './module3.data';

const MARBLE_COLORS = [
  'var(--color-primary-400)',
  'var(--color-secondary-400)',
  'var(--color-accent-400)',
  'var(--color-warning-400)',
  'var(--color-danger-400)'
];

@Component({
  selector: 'app-operator-catalog',
  standalone: true,
  imports: [
    CommonModule,
    PlaygroundWrapperComponent,
    OperatorCardComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    MarbleDiagramComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './operator-catalog.component.html',
  styleUrl: './operator-catalog.component.scss'
})
export class OperatorCatalogComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router, { optional: true });
  private readonly destroyRef = inject(DestroyRef);
  readonly progressService = inject(ProgressService, { optional: true });

  readonly categories: CategoryInfo[] = OPERATOR_CATEGORIES;

  // Active Category & Operator State
  readonly selectedCategory = signal<OperatorCategoryId>('transformation');
  readonly selectedOperatorId = signal<string>('map');
  readonly activeTab = signal<PlaygroundTab>('concept');
  readonly searchQuery = signal<string>('');

  // Runner & Live Stream State
  readonly isRunning = signal<boolean>(false);
  readonly isCompleted = signal<boolean>(false);
  readonly durationMs = signal<number>(5000);
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  readonly inputStreams = signal<MarbleStream[]>([]);
  readonly inputMarbleStreams = computed<MarbleStream[]>(() => this.inputStreams());
  readonly outputMarbleStream = signal<MarbleStream | null>(null);

  // Source Stream Configuration
  readonly selectedSourcePreset = signal<SourceStreamPreset>('sync_numbers');
  readonly selectedSource2Preset = signal<SourceStreamPreset>('words');
  readonly customSourceInput = signal<string>('1, 2, 3, 4, 5');

  // Dynamic Parameter Values Map
  readonly paramValues = signal<Record<string, any>>({});

  // Active Operator Definition Computed Signal
  readonly currentOperator = computed<OperatorDefinition>(() => {
    const opId = this.selectedOperatorId();
    return MODULE3_OPERATORS[opId] || MODULE3_OPERATORS['map'];
  });

  readonly currentOperatorData = computed<OperatorDefinition | null>(() => this.currentOperator());

  // Filtered Operator Pills for Ribbon
  readonly filteredOperators = computed<OperatorDefinition[]>(() => {
    const cat = this.selectedCategory();
    const query = this.searchQuery().trim().toLowerCase();
    const ops = CATEGORY_OPERATOR_MAP[cat] || [];
    if (!query) return ops;
    return ops.filter(op =>
      op.name.toLowerCase().includes(query) ||
      op.summary.toLowerCase().includes(query)
    );
  });

  private activeSubscription: Subscription | null = null;
  private notifierSubject$ = new Subject<any>();
  private streamStartTime = 0;
  private entryIdCounter = 0;
  private emissionCounter = 0;

  constructor() {
    // Synchronize route parameters with reactive signals
    if (this.route.params) {
      this.route.params
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(params => {
          if (params) {
            const cat = params['category'] as OperatorCategoryId;
            const opId = params['operatorId'];
            this.handleRouteParams(cat, opId);
          }
        });
    }

    if (this.route.paramMap) {
      this.route.paramMap
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(paramMap => {
          if (paramMap && paramMap.get('category')) {
            const cat = paramMap.get('category') as OperatorCategoryId;
            const opId = paramMap.get('operatorId') || undefined;
            this.handleRouteParams(cat, opId);
          }
        });
    }
  }

  ngOnInit(): void {
    const snapshotParams = this.route.snapshot?.params;
    if (snapshotParams && snapshotParams['category']) {
      this.handleRouteParams(snapshotParams['category'] as OperatorCategoryId, snapshotParams['operatorId']);
    }
  }

  ngOnDestroy(): void {
    this.stopStream();
  }

  handleRouteParams(category?: OperatorCategoryId, operatorId?: string): void {
    const validCategories: OperatorCategoryId[] = [
      'transformation',
      'filtering',
      'combination',
      'utility',
      'multicasting'
    ];

    let targetCat: OperatorCategoryId = 'transformation';
    if (category && validCategories.includes(category)) {
      targetCat = category;
    }

    let targetOp = CATEGORY_DEFAULT_OPERATOR[targetCat];
    if (operatorId && MODULE3_OPERATORS[operatorId] && MODULE3_OPERATORS[operatorId].category === targetCat) {
      targetOp = operatorId;
    }

    this.selectedCategory.set(targetCat);
    this.selectedOperatorId.set(targetOp);
  }

  setCategory(cat: OperatorCategoryId): void {
    this.selectCategory(cat);
  }

  selectCategory(cat: OperatorCategoryId): void {
    const validCategories: OperatorCategoryId[] = [
      'transformation',
      'filtering',
      'combination',
      'utility',
      'multicasting'
    ];
    const targetCat = validCategories.includes(cat) ? cat : 'transformation';
    const firstOp = CATEGORY_DEFAULT_OPERATOR[targetCat];
    this.selectedCategory.set(targetCat);
    this.selectedOperatorId.set(firstOp);

    if (this.router) {
      this.router.navigate(['/module3', targetCat, firstOp]).catch(() => {});
    }
  }

  selectOperator(opId: string): void {
    const op = MODULE3_OPERATORS[opId];
    if (op) {
      this.selectedCategory.set(op.category);
      this.selectedOperatorId.set(opId);
      if (this.router) {
        this.router.navigate(['/module3', op.category, opId]).catch(() => {});
      }
    }
  }

  updateParam(paramId: string, value: any): void {
    this.paramValues.update(m => ({ ...m, [paramId]: value }));
  }

  triggerNotifier(): void {
    this.addLog('info', 'notifier$', '⚡ Signal emitted', 'Manual trigger fired');
    this.notifierSubject$.next(Date.now());
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  runStream(): void {
    this.runOperatorStream();
  }

  runOperatorStream(): void {
    this.stopStream();
    this.clearConsole();
    this.isRunning.set(true);
    this.isCompleted.set(false);
    this.streamStartTime = Date.now();
    this.emissionCounter = 0;

    const op = this.currentOperator();
    const isCombo = op.category === 'combination';

    // 1. Initialize Marble Streams
    const initialInputs: MarbleStream[] = [
      {
        id: 'src_1',
        label: isCombo ? 'source1$' : 'source$',
        color: 'var(--color-primary-400)',
        emissions: []
      }
    ];
    if (isCombo) {
      initialInputs.push({
        id: 'src_2',
        label: 'source2$',
        color: 'var(--color-secondary-400)',
        emissions: []
      });
    }
    this.inputStreams.set(initialInputs);
    this.outputMarbleStream.set({
      id: `out_${Date.now()}`,
      label: `${op.name}()`,
      color: 'var(--color-accent-400)',
      emissions: []
    });

    // 2. Build Monitored Source Stream 1
    const rawSource1$ = this.buildSourceObservable(this.getSourcePresetForOperator(op), 1);
    let src1Counter = 0;
    const monitoredSource1$ = rawSource1$.pipe(
      tap({
        next: val => {
          src1Counter++;
          this.recordInputMarble('src_1', val, src1Counter);
        },
        error: err => {
          this.addLog('error', isCombo ? 'source1$' : 'source$', err?.message || String(err));
          this.recordInputError('src_1');
        },
        complete: () => {
          this.recordInputComplete('src_1');
        }
      })
    );

    // 3. Build Monitored Source Stream 2 (if Combination)
    let monitoredSource2$: Observable<any> | undefined;
    if (isCombo) {
      const rawSource2$ = this.buildSourceObservable(this.selectedSource2Preset(), 2);
      let src2Counter = 0;
      monitoredSource2$ = rawSource2$.pipe(
        tap({
          next: val => {
            src2Counter++;
            this.recordInputMarble('src_2', val, src2Counter);
          },
          error: err => {
            this.addLog('error', 'source2$', err?.message || String(err));
            this.recordInputError('src_2');
          },
          complete: () => {
            this.recordInputComplete('src_2');
          }
        })
      );
    }

    // 4. Construct Output Pipeline via Operator Pipeline Factory
    const context: PipelineContext = {
      source2$: monitoredSource2$,
      notifier$: this.notifierSubject$.asObservable()
    };
    const output$ = op.pipelineFactory(monitoredSource1$, this.paramValues(), context);

    // 5. Subscribe to Output Pipeline
    this.addLog('subscribe', `${op.name}()`, undefined, 'Pipeline subscription active');
    this.activeSubscription = output$.subscribe({
      next: val => {
        this.emissionCounter++;
        this.addLog('next', `${op.name}()`, val, `Output emission #${this.emissionCounter}`);
        this.recordOutputMarble(val, this.emissionCounter);
      },
      error: err => {
        this.isRunning.set(false);
        this.addLog('error', `${op.name}()`, err?.message || String(err), 'Stream terminated with error');
        this.recordOutputError();
      },
      complete: () => {
        this.isRunning.set(false);
        this.isCompleted.set(true);
        this.addLog('complete', `${op.name}()`, undefined, 'Pipeline completed');
        this.recordOutputComplete();
      }
    });
  }

  stopStream(): void {
    this.stopOperatorStream();
  }

  stopOperatorStream(): void {
    if (this.activeSubscription) {
      this.activeSubscription.unsubscribe();
      this.activeSubscription = null;
      this.addLog('unsubscribe', `${this.currentOperator().name}()`, undefined, 'Subscription manually unsubscribed');
    }
    this.isRunning.set(false);
  }

  onQuizCompleted(score: QuizScore): void {
    if (score.passed && this.progressService) {
      this.progressService.markCompleted(this.selectedOperatorId());
    }
  }

  isOperatorCompleted(opId: string): boolean {
    return this.progressService?.isCompleted(opId) ?? false;
  }

  private getSourcePresetForOperator(op: OperatorDefinition): SourceStreamPreset {
    if (op.id === 'debounceTime' || op.id === 'debounce' || op.id === 'throttle' || op.id === 'throttleTime' || op.id === 'audit' || op.id === 'auditTime') {
      return 'burst';
    }
    if (op.id === 'distinct' || op.id === 'distinctUntilChanged') {
      return 'duplicates';
    }
    if (op.id === 'pluck' || op.id === 'distinctUntilKeyChanged') {
      return 'objects';
    }
    if (op.id === 'retry' || op.id === 'retryWhen') {
      return 'error';
    }
    return this.selectedSourcePreset() || op.defaultSourcePreset || 'sync_numbers';
  }

  private buildSourceObservable(preset: SourceStreamPreset, sourceIndex = 1): Observable<any> {
    switch (preset) {
      case 'interval':
      case 'numbers_interval':
        return interval(300).pipe(
          take(5),
          tap(i => i)
        );

      case 'burst':
        return new Observable(subscriber => {
          subscriber.next(1);
          const t1 = setTimeout(() => subscriber.next(2), 5);
          const t2 = setTimeout(() => subscriber.next(3), 10);
          const t3 = setTimeout(() => subscriber.complete(), 15);
          return () => {
            clearTimeout(t1);
            clearTimeout(t2);
            clearTimeout(t3);
          };
        });

      case 'words':
        return sourceIndex === 1
          ? of('Angular', 'RxJS', 'TypeScript', 'Signals', 'Zoneless')
          : of('Alpha', 'Beta', 'Gamma');

      case 'duplicates':
        return of(1, 1, 2, 2, 3, 1);

      case 'objects':
        return of(
          { id: 1, name: 'Alice', role: 'admin' },
          { id: 1, name: 'Alice (Duplicate ID)', role: 'editor' },
          { id: 2, name: 'Bob', role: 'user' },
          { id: 3, name: 'Charlie', role: 'guest' }
        );

      case 'error': {
        let attempts = 0;
        return new Observable(sub => {
          attempts++;
          sub.next(1);
          sub.next(2);
          if (attempts < 2) {
            sub.error(new Error('Simulated Stream Error'));
          } else {
            sub.next(3);
            sub.complete();
          }
        });
      }

      case 'custom': {
        const raw = this.customSourceInput().trim();
        const items = raw
          .split(',')
          .map(s => s.trim())
          .filter(s => s.length > 0)
          .map(s => (!isNaN(+s) ? +s : s));
        return of(...items);
      }

      case 'sync_numbers':
      default:
        return of(1, 2, 3, 4, 5);
    }
  }

  private recordInputMarble(streamId: string, val: any, index: number): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    const timeMs = elapsed < 20 ? index * 100 : elapsed;

    this.inputStreams.update(streams =>
      streams.map(s => {
        if (s.id !== streamId) return s;
        return {
          ...s,
          emissions: [
            ...s.emissions,
            {
              id: `in_${Date.now()}_${Math.random()}`,
              timeMs,
              value: val,
              displayLabel: typeof val === 'object' ? JSON.stringify(val) : String(val),
              color: MARBLE_COLORS[(s.emissions.length) % MARBLE_COLORS.length]
            }
          ]
        };
      })
    );
  }

  private recordInputError(streamId: string): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => {
        if (s.id !== streamId) return s;
        const maxTime = s.emissions.length > 0 ? Math.max(...s.emissions.map(e => e.timeMs)) : 0;
        const errorAtMs = Math.max(elapsed, maxTime + 100);
        return { ...s, errorAtMs };
      })
    );
  }

  private recordInputComplete(streamId: string): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.inputStreams.update(streams =>
      streams.map(s => {
        if (s.id !== streamId) return s;
        const maxTime = s.emissions.length > 0 ? Math.max(...s.emissions.map(e => e.timeMs)) : 0;
        const completedAtMs = Math.max(elapsed, maxTime + 100);
        return { ...s, completedAtMs };
      })
    );
  }

  private recordOutputMarble(val: any, index: number): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    const timeMs = elapsed < 20 ? index * 100 : elapsed;

    this.outputMarbleStream.update(out => {
      if (!out) return null;
      return {
        ...out,
        emissions: [
          ...out.emissions,
          {
            id: `out_${Date.now()}_${Math.random()}`,
            timeMs,
            value: val,
            displayLabel: typeof val === 'object' ? JSON.stringify(val) : String(val),
            color: MARBLE_COLORS[out.emissions.length % MARBLE_COLORS.length]
          }
        ]
      };
    });
  }

  private recordOutputError(): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => {
      if (!out) return null;
      const maxTime = out.emissions.length > 0 ? Math.max(...out.emissions.map(e => e.timeMs)) : 0;
      const errorAtMs = Math.max(elapsed, maxTime + 100);
      return { ...out, errorAtMs };
    });
  }

  private recordOutputComplete(): void {
    const elapsed = Math.max(0, Date.now() - this.streamStartTime);
    this.outputMarbleStream.update(out => {
      if (!out) return null;
      const maxTime = out.emissions.length > 0 ? Math.max(...out.emissions.map(e => e.timeMs)) : 0;
      const completedAtMs = Math.max(elapsed, maxTime + 100);
      return { ...out, completedAtMs };
    });
  }

  private addLog(
    type: 'next' | 'error' | 'complete' | 'subscribe' | 'unsubscribe' | 'info',
    streamName: string,
    value?: any,
    description?: string
  ): void {
    const entry: ConsoleEntry = {
      id: `entry_${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.streamStartTime,
      type,
      streamName,
      value,
      description
    };
    this.consoleEntries.update(entries => [...entries, entry]);
  }
}
