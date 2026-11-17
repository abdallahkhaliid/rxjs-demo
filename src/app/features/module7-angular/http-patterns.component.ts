import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';

import { ConsoleEntry, ConsoleEntryType, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import { HttpRecipeService } from './http-recipe.service';
import { MODULE7_RECIPES, MODULE7_COMPARISONS, MODULE7_QUIZZES } from './module7.data';
import { RetryAttemptLog, CachedRequestTelemetry } from './module7.models';

@Component({
  selector: 'app-http-patterns-recipe',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './http-patterns.component.html',
  styleUrls: ['./http-patterns.component.scss']
})
export class HttpPatternsComponent implements OnDestroy {
  readonly httpService = inject(HttpRecipeService);

  readonly recipeData = MODULE7_RECIPES['http-patterns'];
  readonly comparisonData = MODULE7_COMPARISONS['http-patterns'];
  readonly quizzes = MODULE7_QUIZZES['http-patterns'];

  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly codeSubTab = signal<'caching' | 'retry' | 'refresh'>('caching');

  // Simulator 1: shareReplay Caching
  readonly useCache = signal<boolean>(true);
  readonly sub1Active = signal<boolean>(false);
  readonly sub2Active = signal<boolean>(false);
  readonly sub1Data = signal<any>(null);
  readonly sub2Data = signal<any>(null);
  readonly networkCallCount = signal<number>(0);
  private sub1Subscription?: Subscription;
  private sub2Subscription?: Subscription;
  private retrySubscription?: Subscription;
  private parallelSubscription?: Subscription;

  // Simulator 2: Resilient Backoff Retry
  readonly failureRate = signal<number>(0.7);
  readonly simulatedStatusCode = signal<number>(500);
  readonly maxRetries = signal<number>(3);
  readonly retryLogs = signal<RetryAttemptLog[]>([]);
  readonly retryResult = signal<any>(null);
  readonly isRetrying = signal<boolean>(false);

  // Simulator 3: Rapid Refresh switchMap
  readonly refreshClicksCount = signal<number>(0);
  readonly refreshResolvedCount = signal<number>(0);
  readonly latestRefreshedCourse = signal<any>(null);
  private refreshSubscription?: Subscription;

  // Simulator 4: Parallel Aggregation
  readonly aggregatedData = signal<any>(null);
  readonly isAggregating = signal<boolean>(false);

  // Output Console
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private consoleIdCounter = 1;

  constructor() {
    // Wire up refresh stream
    this.refreshSubscription = this.httpService
      .createRefreshableCourseStream(1)
      .subscribe(course => {
        this.refreshResolvedCount.update(c => c + 1);
        this.latestRefreshedCourse.set(course);
        this.logConsole('next', course, `Refreshed course loaded: ${course.description}`);
      });
  }

  ngOnDestroy(): void {
    this.unsubscribeSub1();
    this.unsubscribeSub2();
    this.refreshSubscription?.unsubscribe();
    this.retrySubscription?.unsubscribe();
    this.parallelSubscription?.unsubscribe();
  }

  // --- Card 1: Caching Actions ---
  toggleCaching(): void {
    this.useCache.update(v => !v);
    this.httpService.invalidateCache();
    this.logConsole('info', undefined, `Caching mode set to: ${this.useCache() ? 'shareReplay enabled' : 'Disabled (uncached)'}`);
  }

  subscribeSub1(): void {
    if (this.sub1Active()) return;
    this.sub1Active.set(true);
    this.logConsole('subscribe', undefined, 'Subscriber 1 subscribed to course$');

    const start = Date.now();
    this.sub1Subscription = this.httpService
      .getCachedCourse(1, this.useCache())
      .subscribe({
        next: data => {
          const elapsed = Date.now() - start;
          this.sub1Data.set(data);
          this.networkCallCount.set(this.httpService.getNetworkCallsCount());
          this.logConsole('next', data, `Subscriber 1 received data (${elapsed}ms)`);
        },
        error: err => {
          this.logConsole('error', err, `Subscriber 1 error: ${err.message}`);
        }
      });
  }

  unsubscribeSub1(): void {
    if (!this.sub1Active()) return;
    this.sub1Subscription?.unsubscribe();
    this.sub1Subscription = undefined;
    this.sub1Active.set(false);
    this.logConsole('unsubscribe', undefined, 'Subscriber 1 unsubscribed');
  }

  subscribeSub2(): void {
    if (this.sub2Active()) return;
    this.sub2Active.set(true);
    this.logConsole('subscribe', undefined, 'Subscriber 2 subscribed to course$');

    const start = Date.now();
    this.sub2Subscription = this.httpService
      .getCachedCourse(1, this.useCache())
      .subscribe({
        next: data => {
          const elapsed = Date.now() - start;
          this.sub2Data.set(data);
          this.networkCallCount.set(this.httpService.getNetworkCallsCount());
          this.logConsole('next', data, `Subscriber 2 received data (${elapsed}ms)`);
        },
        error: err => {
          this.logConsole('error', err, `Subscriber 2 error: ${err.message}`);
        }
      });
  }

  unsubscribeSub2(): void {
    if (!this.sub2Active()) return;
    this.sub2Subscription?.unsubscribe();
    this.sub2Subscription = undefined;
    this.sub2Active.set(false);
    this.logConsole('unsubscribe', undefined, 'Subscriber 2 unsubscribed');
  }

  invalidateCache(): void {
    this.httpService.invalidateCache();
    this.logConsole('info', undefined, 'Cache invalidated: Next subscription will trigger new network request');
  }

  resetNetworkStats(): void {
    this.unsubscribeSub1();
    this.unsubscribeSub2();
    this.httpService.resetNetworkCallsCount();
    this.networkCallCount.set(0);
    this.sub1Data.set(null);
    this.sub2Data.set(null);
    this.logConsole('info', undefined, 'Reset Caching Simulator');
  }

  // --- Card 2: Resilient Backoff Retry ---
  triggerResilientFetch(): void {
    this.retrySubscription?.unsubscribe();
    this.isRetrying.set(true);
    this.retryLogs.set([]);
    this.retryResult.set(null);

    const rate = this.failureRate();
    const code = this.simulatedStatusCode();
    const maxRetries = this.maxRetries();

    this.logConsole(
      'info',
      undefined,
      `Triggering fetch with retry: Rate=${rate}, Code=${code}, MaxRetries=${maxRetries}`
    );

    this.retrySubscription = this.httpService
      .fetchWithResilientRetry(rate, code, maxRetries, 350, log => {
        this.retryLogs.update(logs => [...logs, log]);
        this.logConsole(
          log.status === 'success' ? 'next' : log.status === 'failed' ? 'error' : 'info',
          undefined,
          `Attempt #${log.attempt} ${log.status.toUpperCase()} (HTTP ${log.statusCode || 200})`
        );
      })
      .subscribe({
        next: res => {
          this.isRetrying.set(false);
          this.retryResult.set(res);
          this.logConsole('complete', res, res.fallback ? 'Recovered via graceful fallback' : 'Fetch succeeded');
        },
        error: err => {
          this.isRetrying.set(false);
          this.retryResult.set({ error: err.message, status: err.status });
          this.logConsole('error', err, `Unrecoverable error: ${err.message}`);
        }
      });
  }

  // --- Card 3: Rapid Refresh switchMap ---
  triggerRefresh(): void {
    this.refreshClicksCount.update(c => c + 1);
    this.logConsole('info', undefined, `Refresh triggered (Click #${this.refreshClicksCount()})`);
    this.httpService.triggerRefresh();
  }

  // --- Card 4: Parallel Aggregation ---
  triggerParallelAggregation(): void {
    this.parallelSubscription?.unsubscribe();
    this.isAggregating.set(true);
    this.aggregatedData.set(null);
    this.logConsole('info', undefined, 'Dispatching parallel requests via combineLatest([course$, slow$])...');

    this.parallelSubscription = this.httpService.fetchParallelAggregatedData(1).subscribe({
      next: data => {
        this.isAggregating.set(false);
        this.aggregatedData.set(data);
        this.logConsole('next', data, 'Parallel data aggregated successfully');
      },
      error: err => {
        this.isAggregating.set(false);
        this.logConsole('error', err, `Parallel aggregation failed: ${err.message}`);
      }
    });
  }

  // --- Output Console ---
  logConsole(type: ConsoleEntryType, value?: any, description?: string): void {
    const entry: ConsoleEntry = {
      id: `c-${this.consoleIdCounter++}`,
      timestamp: Date.now(),
      relativeMs: Date.now(),
      type,
      streamName: 'HttpPatternsStream',
      value,
      description
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 199)]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }
}
