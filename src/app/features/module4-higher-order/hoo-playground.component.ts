import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';

import { ConsoleEntry, ConsoleEntryType, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { OperatorCardComponent } from '../../shared/components/operator-card/operator-card.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';
import { HooTimelineVisualizerComponent } from './hoo-timeline-visualizer.component';
import { HooTimelineEngineService } from './hoo-timeline-engine.service';
import { MODULE4_OPERATORS, HooTopicData } from './module4.data';
import { HooOperatorType, HooTimelineRequest } from './module4.models';

const SLUG_TO_OPERATOR: Record<string, HooOperatorType> = {
  'switch-map': 'switchMap',
  'switchMap': 'switchMap',
  'merge-map': 'mergeMap',
  'mergeMap': 'mergeMap',
  'concat-map': 'concatMap',
  'concatMap': 'concatMap',
  'exhaust-map': 'exhaustMap',
  'exhaustMap': 'exhaustMap'
};

@Component({
  standalone: true,
  selector: 'app-hoo-playground',
  imports: [
    CommonModule,
    FormsModule,
    PlaygroundWrapperComponent,
    OperatorCardComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent,
    HooTimelineVisualizerComponent
  ],
  providers: [HooTimelineEngineService],
  templateUrl: './hoo-playground.component.html',
  styleUrls: ['./hoo-playground.component.scss']
})
export class HooPlaygroundComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private http = inject(HttpClient, { optional: true });
  readonly engine = inject(HooTimelineEngineService);

  readonly operator = signal<HooOperatorType>('switchMap');
  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly codeSubTab = signal<'standard' | 'errorHandling' | 'angular'>('standard');

  readonly simulatedDelayMs = signal<number>(2000);
  readonly concurrencyLimit = signal<number>(2);
  readonly customLabelInput = signal<string>('Custom Query');
  readonly customDelayInput = signal<number>(1500);
  readonly useLiveApi = signal<boolean>(false);

  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private consoleIdCounter = 1;
  private routeSub?: Subscription;
  private lastOutputsCount = 0;
  private activeHttpSubs = new Map<number, Subscription>();

  readonly config = computed<HooTopicData>(() => {
    return MODULE4_OPERATORS[this.operator()] || MODULE4_OPERATORS.switchMap;
  });

  readonly isMergeMap = computed<boolean>(() => this.operator() === 'mergeMap');

  readonly snapshot = computed(() => this.engine.snapshot());

  ngOnInit(): void {
    this.routeSub = this.route.data.subscribe(data => {
      const opFromData = data['operator'] as HooOperatorType;
      if (opFromData && MODULE4_OPERATORS[opFromData]) {
        this.setOperator(opFromData);
      } else {
        // Fallback check URL path
        const path = this.route.snapshot.url[0]?.path;
        if (path && SLUG_TO_OPERATOR[path]) {
          this.setOperator(SLUG_TO_OPERATOR[path]);
        }
      }
    });

    this.engine.setDefaultDuration(this.simulatedDelayMs());
    this.logConsole('info', undefined, `Initialized playground for ${this.operator()}`);
  }

  ngOnDestroy(): void {
    this.routeSub?.unsubscribe();
    this.abortAllHttp();
    this.engine.stopSimulation();
  }

  setOperator(op: HooOperatorType): void {
    this.operator.set(op);
    this.engine.setOperator(op);
    if (op === 'mergeMap') {
      this.concurrencyLimit.set(2);
      this.engine.setConcurrencyLimit(2);
    } else {
      this.concurrencyLimit.set(1);
      this.engine.setConcurrencyLimit(1);
    }
    this.lastOutputsCount = 0;
    this.logConsole('info', undefined, `Switched operator to ${op}`);
  }

  onDelayChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.simulatedDelayMs.set(val);
    this.engine.setDefaultDuration(val);
  }

  onConcurrencyChange(event: Event): void {
    const val = Number((event.target as HTMLInputElement).value);
    this.concurrencyLimit.set(val);
    this.engine.setConcurrencyLimit(val);
    this.logConsole('info', undefined, `Concurrency limit set to ${val}`);
  }

  triggerSingle(): void {
    const delay = this.simulatedDelayMs();
    const isLive = this.useLiveApi();
    const req = this.engine.trigger(undefined, delay, undefined, isLive);

    this.logConsole('subscribe', `Req #${req.id}`, `Triggered inner request #${req.id} (duration ${delay}ms) -> Initial state: ${req.state.toUpperCase()}`);

    if (isLive && this.http && req.state === 'active') {
      this.executeLiveApiCall(req);
    }
  }

  triggerBurst(): void {
    const delay = this.simulatedDelayMs();
    const reqs = this.engine.triggerBurst(3, delay);

    this.logConsole('subscribe', 'Burst (3 Requests)', `Fired 3 rapid requests [${reqs.map(r => `#${r.id}`).join(', ')}]`);
    reqs.forEach(r => {
      this.logConsole('info', `Req #${r.id}`, `State: ${r.state.toUpperCase()}`);
    });
  }

  triggerCustom(): void {
    const label = this.customLabelInput().trim() || 'Custom';
    const delay = this.customDelayInput() || 1500;
    const isLive = this.useLiveApi();
    const req = this.engine.trigger(label, delay, `data-${Date.now()}`, isLive);

    this.logConsole('subscribe', label, `Triggered custom request "${label}" (${delay}ms) -> State: ${req.state.toUpperCase()}`);

    if (isLive && this.http && req.state === 'active') {
      this.executeLiveApiCall(req);
    }
  }

  simulateTeardown(): void {
    this.engine.cancelAllActive('Unsubscribed from outer stream (takeUntilDestroyed)');
    this.abortAllHttp();
    this.logConsole('unsubscribe', undefined, 'Simulated outer unsubscription: All in-flight inner observables cancelled (F36.B5)');
  }

  resetTimeline(): void {
    this.engine.reset();
    this.abortAllHttp();
    this.clearConsole();
    this.logConsole('info', undefined, 'Timeline and queue reset to initial state.');
  }

  private executeLiveApiCall(req: HooTimelineRequest): void {
    if (!this.http) return;
    const url = `/api/slow?delay=${req.durationMs}`;

    const sub = this.http.get<any>(url).subscribe({
      next: (response) => {
        this.logConsole('next', response, `HTTP /api/slow returned for Req #${req.id}`);
        this.activeHttpSubs.delete(req.id);
      },
      error: (err) => {
        this.logConsole('error', err, `HTTP /api/slow failed for Req #${req.id}`);
        this.activeHttpSubs.delete(req.id);
      }
    });

    this.activeHttpSubs.set(req.id, sub);
  }

  private abortAllHttp(): void {
    for (const sub of this.activeHttpSubs.values()) {
      sub.unsubscribe();
    }
    this.activeHttpSubs.clear();
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private logConsole(type: ConsoleEntryType, value?: any, description?: string): void {
    const entry: ConsoleEntry = {
      id: `m4-log-${this.consoleIdCounter++}-${Date.now()}`,
      timestamp: Date.now(),
      relativeMs: 0,
      type,
      streamName: this.operator(),
      value,
      description
    };

    this.consoleEntries.update(entries => [...entries, entry]);
  }
}
