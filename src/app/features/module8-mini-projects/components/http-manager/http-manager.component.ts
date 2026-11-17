import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  Observable,
  Subject,
  concatMap,
  exhaustMap,
  from,
  mergeMap,
  of,
  switchMap,
  tap,
  catchError,
  delay
} from 'rxjs';

import { ConsoleEntry, PlaygroundTab } from '../../../../core/models';
import { LessonsService } from '../../../../core/services/lessons.service';
import { MODULE8_PROJECTS } from '../../module8.data';
import {
  BenchmarkRequestItem,
  FlatteningStrategy,
  MiniProjectTopicConfig,
  StrategyBenchmarkResult
} from '../../module8.models';

import { PlaygroundWrapperComponent } from '../../../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../../../shared/components/quiz-block/quiz-block.component';

@Component({
  selector: 'app-http-request-manager',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './http-manager.component.html',
  styleUrl: './http-manager.component.scss'
})
export class HttpManagerComponent implements OnInit {
  private readonly lessonsService = inject(LessonsService);
  private readonly destroyRef = inject(DestroyRef);

  readonly config: MiniProjectTopicConfig = MODULE8_PROJECTS['http-manager'];
  readonly activeTab = signal<PlaygroundTab>('visual');

  readonly batchSizeControl = new FormControl<number>(4, { nonNullable: true });
  readonly delayControl = new FormControl<number>(600, { nonNullable: true });

  readonly strategies: FlatteningStrategy[] = ['switchMap', 'concatMap', 'mergeMap', 'exhaustMap'];

  readonly benchmarkResults = signal<Record<FlatteningStrategy, StrategyBenchmarkResult>>({
    switchMap: this.createInitialResult('switchMap'),
    concatMap: this.createInitialResult('concatMap'),
    mergeMap: this.createInitialResult('mergeMap'),
    exhaustMap: this.createInitialResult('exhaustMap')
  });

  readonly isRunningAll = signal<boolean>(false);
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private entryIdCounter = 0;
  private readonly startTime = Date.now();

  ngOnInit(): void {
    // Initial clean state
  }

  private createInitialResult(strategy: FlatteningStrategy): StrategyBenchmarkResult {
    return {
      strategy,
      requests: [],
      completedCount: 0,
      cancelledCount: 0,
      ignoredCount: 0,
      queuedCount: 0,
      totalElapsedMs: 0,
      isRunning: false
    };
  }

  runAllStrategies(): void {
    if (this.isRunningAll()) return;
    this.isRunningAll.set(true);
    this.logEntry('info', `Starting comparative 4-way benchmark across all flattening strategies`);

    this.strategies.forEach(strategy => {
      this.runStrategyBenchmark(strategy);
    });

    const checkInterval = setInterval(() => {
      const results = this.benchmarkResults();
      const anyRunning = Object.values(results).some(r => r.isRunning);
      if (!anyRunning) {
        this.isRunningAll.set(false);
        clearInterval(checkInterval);
        this.logEntry('complete', 'Comparative benchmark finished across all strategies');
      }
    }, 200);
  }

  runStrategyBenchmark(strategy: FlatteningStrategy): void {
    const count = this.batchSizeControl.value;
    const reqDelay = this.delayControl.value;
    const items: BenchmarkRequestItem[] = Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      tag: `Req #${i + 1}`,
      status: 'idle'
    }));

    this.updateResult(strategy, {
      strategy,
      requests: items,
      completedCount: 0,
      cancelledCount: 0,
      ignoredCount: 0,
      queuedCount: count,
      totalElapsedMs: 0,
      isRunning: true
    });

    const startOverall = Date.now();
    const trigger$ = new Subject<{ item: BenchmarkRequestItem; index: number }>();

    let activeInFlightCount = 0;

    let benchmarkStream$: Observable<any>;

    if (strategy === 'switchMap') {
      benchmarkStream$ = trigger$.pipe(
        switchMap(({ item }) => {
          this.updateRequests(strategy, reqs =>
            reqs.map(r => (r.status === 'active' ? { ...r, status: 'cancelled' } : r))
          );
          this.setItemStatus(strategy, item.id, 'active');
          const startItem = Date.now();
          return this.simulateOrFetch(reqDelay, item.tag).pipe(
            tap(() => {
              this.setItemStatus(strategy, item.id, 'completed', Date.now() - startItem);
              this.logEntry('next', `[switchMap] ${item.tag} completed in ${Date.now() - startItem}ms`);
            }),
            catchError(err => {
              this.setItemStatus(strategy, item.id, 'error', Date.now() - startItem, err.message);
              return of(null);
            })
          );
        })
      );
    } else if (strategy === 'concatMap') {
      benchmarkStream$ = trigger$.pipe(
        tap(({ item }) => {
          this.setItemStatus(strategy, item.id, 'queued');
        }),
        concatMap(({ item }) => {
          this.setItemStatus(strategy, item.id, 'active');
          const startItem = Date.now();
          return this.simulateOrFetch(reqDelay, item.tag).pipe(
            tap(() => {
              this.setItemStatus(strategy, item.id, 'completed', Date.now() - startItem);
              this.logEntry('next', `[concatMap] ${item.tag} completed in ${Date.now() - startItem}ms`);
            }),
            catchError(err => {
              this.setItemStatus(strategy, item.id, 'error', Date.now() - startItem, err.message);
              return of(null);
            })
          );
        })
      );
    } else if (strategy === 'mergeMap') {
      benchmarkStream$ = trigger$.pipe(
        mergeMap(({ item }) => {
          this.setItemStatus(strategy, item.id, 'active');
          const startItem = Date.now();
          const jitter = (item.id % 2 === 0 ? 0.6 : 1.2) * reqDelay;
          return this.simulateOrFetch(Math.round(jitter), item.tag).pipe(
            tap(() => {
              this.setItemStatus(strategy, item.id, 'completed', Date.now() - startItem);
              this.logEntry('next', `[mergeMap] ${item.tag} completed in ${Date.now() - startItem}ms`);
            }),
            catchError(err => {
              this.setItemStatus(strategy, item.id, 'error', Date.now() - startItem, err.message);
              return of(null);
            })
          );
        })
      );
    } else {
      benchmarkStream$ = trigger$.pipe(
        tap(({ item }) => {
          if (activeInFlightCount > 0) {
            this.setItemStatus(strategy, item.id, 'ignored');
            this.logEntry('info', `[exhaustMap] ${item.tag} ignored while request 1 is busy!`);
          }
        }),
        exhaustMap(({ item }) => {
          activeInFlightCount++;
          this.setItemStatus(strategy, item.id, 'active');
          const startItem = Date.now();
          return this.simulateOrFetch(reqDelay, item.tag).pipe(
            tap(() => {
              activeInFlightCount--;
              this.setItemStatus(strategy, item.id, 'completed', Date.now() - startItem);
              this.logEntry('next', `[exhaustMap] ${item.tag} completed in ${Date.now() - startItem}ms`);
            }),
            catchError(err => {
              activeInFlightCount--;
              this.setItemStatus(strategy, item.id, 'error', Date.now() - startItem, err.message);
              return of(null);
            })
          );
        })
      );
    }

    benchmarkStream$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe();

    items.forEach((item, index) => {
      trigger$.next({ item, index });
    });

    const maxExpectedDuration = strategy === 'concatMap' ? count * reqDelay + 500 : reqDelay * 2 + 500;
    setTimeout(() => {
      this.recalculateSummary(strategy, Date.now() - startOverall);
    }, maxExpectedDuration);
  }

  private simulateOrFetch(delayMs: number, tag: string): Observable<any> {
    return this.lessonsService.getSlow(delayMs, tag).pipe(
      catchError(() => {
        return of({ status: 'success', tag, delay: delayMs }).pipe(delay(delayMs));
      })
    );
  }

  private setItemStatus(
    strategy: FlatteningStrategy,
    id: number,
    status: BenchmarkRequestItem['status'],
    durationMs?: number,
    error?: string
  ): void {
    this.updateRequests(strategy, reqs =>
      reqs.map(r => (r.id === id ? { ...r, status, durationMs: durationMs ?? r.durationMs, error } : r))
    );
  }

  private updateRequests(
    strategy: FlatteningStrategy,
    updater: (reqs: BenchmarkRequestItem[]) => BenchmarkRequestItem[]
  ): void {
    const cur = this.benchmarkResults()[strategy];
    const updated = updater(cur.requests);
    this.recalculateSummaryFromRequests(strategy, updated, cur.totalElapsedMs, cur.isRunning);
  }

  private recalculateSummary(strategy: FlatteningStrategy, elapsedMs: number): void {
    const cur = this.benchmarkResults()[strategy];
    this.recalculateSummaryFromRequests(strategy, cur.requests, elapsedMs, false);
  }

  private recalculateSummaryFromRequests(
    strategy: FlatteningStrategy,
    requests: BenchmarkRequestItem[],
    totalElapsedMs: number,
    isRunning: boolean
  ): void {
    const completedCount = requests.filter(r => r.status === 'completed').length;
    const cancelledCount = requests.filter(r => r.status === 'cancelled').length;
    const ignoredCount = requests.filter(r => r.status === 'ignored').length;
    const queuedCount = requests.filter(r => r.status === 'queued' || r.status === 'idle').length;

    this.updateResult(strategy, {
      strategy,
      requests,
      completedCount,
      cancelledCount,
      ignoredCount,
      queuedCount,
      totalElapsedMs,
      isRunning
    });
  }

  private updateResult(strategy: FlatteningStrategy, res: StrategyBenchmarkResult): void {
    this.benchmarkResults.update(all => ({
      ...all,
      [strategy]: res
    }));
  }

  resetAll(): void {
    this.benchmarkResults.set({
      switchMap: this.createInitialResult('switchMap'),
      concatMap: this.createInitialResult('concatMap'),
      mergeMap: this.createInitialResult('mergeMap'),
      exhaustMap: this.createInitialResult('exhaustMap')
    });
    this.isRunningAll.set(false);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  private logEntry(type: 'next' | 'error' | 'complete' | 'info', description: string, value?: any): void {
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.startTime,
      type,
      streamName: 'http-benchmark',
      description,
      value
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 19)]);
  }
}
