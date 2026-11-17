import { Component, inject, signal, computed, DestroyRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, Subscription, interval, of, timer, AsyncSubject } from 'rxjs';
import { takeUntil, finalize, tap } from 'rxjs/operators';

import { ConsoleEntry, ConsoleEntryType, PlaygroundTab } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';

import { MODULE7_RECIPES, MODULE7_COMPARISONS, MODULE7_QUIZZES } from './module7.data';
import { SimulatedWidgetInstance, LifecycleTelemetry } from './module7.models';

interface InternalWidget extends SimulatedWidgetInstance {
  subscription?: Subscription;
  destroySubject?: Subject<void>;
}

@Component({
  selector: 'app-lifecycle-recipe',
  standalone: true,
  imports: [
    CommonModule,
    PlaygroundWrapperComponent,
    CodeBlockComponent,
    OutputConsoleComponent,
    ComparisonTableComponent,
    QuizBlockComponent
  ],
  templateUrl: './lifecycle-teardown.component.html',
  styleUrls: ['./lifecycle-teardown.component.scss']
})
export class LifecycleTeardownComponent implements OnDestroy {
  private readonly destroyRef = inject(DestroyRef);

  readonly recipeData = MODULE7_RECIPES['lifecycle-teardown'];
  readonly comparisonData = MODULE7_COMPARISONS['lifecycle-teardown'];
  readonly quizzes = MODULE7_QUIZZES['lifecycle-teardown'];

  readonly activeTab = signal<PlaygroundTab>('visual');
  readonly codeSubTab = signal<'modern' | 'leaky' | 'legacy'>('modern');

  // Widgets state
  private widgetsList: InternalWidget[] = [];
  readonly mountedWidgets = signal<SimulatedWidgetInstance[]>([]);
  readonly zombieWidgets = signal<SimulatedWidgetInstance[]>([]);

  // Telemetry
  readonly telemetry = signal<LifecycleTelemetry>({
    spawnedCount: 0,
    destroyedCount: 0,
    activeComponentCount: 0,
    activeSubscriptionCount: 0,
    totalZombieTicks: 0,
    hasMemoryLeak: false
  });

  // Edge case test results
  readonly edgeCaseMessage = signal<string | null>(null);

  // Output Console
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private consoleIdCounter = 1;
  private widgetIdCounter = 1;

  constructor() {
    // Component-level safety: Clean all active simulation timers on actual destroy
    this.destroyRef.onDestroy(() => {
      this.forceCleanAll();
    });
  }

  ngOnDestroy(): void {
    this.forceCleanAll();
  }

  // --- Widget Simulator Actions ---
  mountWidget(type: 'leaky' | 'managed'): void {
    const id = `widget-${type}-${this.widgetIdCounter++}`;
    const widget: InternalWidget = {
      id,
      type,
      createdAt: Date.now(),
      ticks: 0,
      isActive: true
    };

    if (type === 'managed') {
      // Managed pipeline: Using simulated DestroyRef / takeUntil
      const destroySubject = new Subject<void>();
      widget.destroySubject = destroySubject;

      widget.subscription = interval(500).pipe(
        takeUntil(destroySubject),
        finalize(() => {
          this.logConsole('complete', undefined, `[Managed] ${id} cleanly unhooked and finalized.`);
          this.updateTelemetry();
        })
      ).subscribe(tick => {
        widget.ticks = tick + 1;
        this.syncWidgetSignals();
        this.logConsole('next', tick, `[Managed] ${id} tick #${tick + 1}`);
      });
    } else {
      // ⚠️ LEAKY pipeline: Unmanaged subscription without unsubscription or takeUntil
      widget.subscription = interval(500).subscribe(tick => {
        widget.ticks = tick + 1;
        if (!widget.isActive) {
          // It is a zombie!
          this.telemetry.update(t => ({ ...t, totalZombieTicks: t.totalZombieTicks + 1 }));
          this.logConsole('next', tick, `⚠️ [ZOMBIE LEAK] ${id} still ticking in background! Tick #${tick + 1}`);
        } else {
          this.logConsole('next', tick, `[Active Leaky] ${id} tick #${tick + 1}`);
        }
        this.syncWidgetSignals();
      });
    }

    this.widgetsList.push(widget);
    this.telemetry.update(t => ({
      ...t,
      spawnedCount: t.spawnedCount + 1
    }));
    this.syncWidgetSignals();
    this.updateTelemetry();

    this.logConsole('info', undefined, `Mounted ${type.toUpperCase()} widget instance: ${id}`);
  }

  unmountWidget(widgetId: string): void {
    const widget = this.widgetsList.find(w => w.id === widgetId);
    if (!widget || !widget.isActive) return;

    widget.isActive = false;
    widget.destroyedAt = Date.now();

    if (widget.type === 'managed') {
      // Managed: fires DestroyRef
      widget.destroySubject?.next();
      widget.destroySubject?.complete();
      widget.subscription?.unsubscribe();
      widget.subscription = undefined;
      this.logConsole('info', undefined, `Unmounted Managed widget ${widgetId}: Subscription terminated.`);
    } else {
      // ⚠️ Leaky: component destroyed, but subscription NOT cancelled!
      this.logConsole('error', undefined, `⚠️ Unmounted Leaky widget ${widgetId}: Component destroyed, but subscription LEAKED in memory!`);
    }

    this.telemetry.update(t => ({
      ...t,
      destroyedCount: t.destroyedCount + 1
    }));

    this.syncWidgetSignals();
    this.updateTelemetry();
  }

  unmountAll(): void {
    const active = this.widgetsList.filter(w => w.isActive);
    for (const w of active) {
      this.unmountWidget(w.id);
    }
  }

  forceCleanAll(): void {
    for (const widget of this.widgetsList) {
      widget.destroySubject?.next();
      widget.destroySubject?.complete();
      widget.subscription?.unsubscribe();
      widget.subscription = undefined;
      widget.isActive = false;
    }
    this.widgetsList = [];
    this.syncWidgetSignals();
    this.telemetry.update(t => ({
      ...t,
      activeComponentCount: 0,
      activeSubscriptionCount: 0,
      hasMemoryLeak: false
    }));
    this.logConsole('info', undefined, 'Force Cleaned all widgets and zombie subscriptions');
  }

  private syncWidgetSignals(): void {
    this.mountedWidgets.set(this.widgetsList.filter(w => w.isActive).map(w => ({ ...w })));
    this.zombieWidgets.set(this.widgetsList.filter(w => !w.isActive && w.subscription && !w.subscription.closed).map(w => ({ ...w })));
  }

  private updateTelemetry(): void {
    const activeMounted = this.widgetsList.filter(w => w.isActive).length;
    // Active subscriptions in memory: any subscription that is not closed
    const activeSubs = this.widgetsList.filter(w => w.subscription && !w.subscription.closed).length;
    const zombies = this.widgetsList.filter(w => !w.isActive && w.subscription && !w.subscription.closed).length;

    this.telemetry.update(t => ({
      ...t,
      activeComponentCount: activeMounted,
      activeSubscriptionCount: activeSubs,
      hasMemoryLeak: zombies > 0
    }));
  }

  // --- Edge Case Verifiers (F41.B1, F41.B2, F41.B5) ---

  // F41.B1: Stream subscribed after DestroyRef has already fired completes immediately
  testSubscribeAfterDestroy(): void {
    const destroy$ = new AsyncSubject<boolean>();
    destroy$.next(true);
    destroy$.complete(); // Destroyed prior to subscription

    const emissions: number[] = [];
    let completed = false;

    of(10, 20, 30).pipe(
      takeUntil(destroy$)
    ).subscribe({
      next: v => emissions.push(v),
      complete: () => { completed = true; }
    });

    const msg = `F41.B1 Verified: Subscribing after destroy emitted ${emissions.length} items; completed immediately: ${completed}`;
    this.edgeCaseMessage.set(msg);
    this.logConsole('complete', { emissions, completed }, msg);
  }

  // F41.B2: DestroyRef firing during active timer terminates without leaking timeout handle
  testActiveTimerTeardown(): void {
    const destroy$ = new Subject<void>();
    let timerFired = false;

    timer(200).pipe(
      takeUntil(destroy$),
      finalize(() => {
        this.logConsole('complete', undefined, 'F41.B2 Verified: Timer teardown finalized cleanly.');
      })
    ).subscribe(() => {
      timerFired = true;
    });

    // Destroy immediately before timer fires
    destroy$.next();
    destroy$.complete();

    setTimeout(() => {
      const msg = `F41.B2 Verified: Active timer aborted before firing. timerFired = ${timerFired}`;
      this.edgeCaseMessage.set(msg);
      this.logConsole('info', undefined, msg);
    }, 250);
  }

  // F41.B5: Multiple destroy notifications do not throw
  testMultipleDestroy(): void {
    const destroy$ = new Subject<void>();
    destroy$.next();
    destroy$.next();
    destroy$.complete();

    const msg = `F41.B5 Verified: Multiple destroy notifications handled safely. isStopped = ${destroy$.isStopped}`;
    this.edgeCaseMessage.set(msg);
    this.logConsole('info', undefined, msg);
  }

  // --- Output Console ---
  logConsole(type: ConsoleEntryType, value?: any, description?: string): void {
    const entry: ConsoleEntry = {
      id: `c-${this.consoleIdCounter++}`,
      timestamp: Date.now(),
      relativeMs: Date.now(),
      type,
      streamName: 'LifecycleStream',
      value,
      description
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 199)]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }
}
