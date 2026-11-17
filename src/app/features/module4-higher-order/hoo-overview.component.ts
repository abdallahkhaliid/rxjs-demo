import { Component, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { HooTimelineVisualizerComponent } from './hoo-timeline-visualizer.component';
import { HooTimelineEngineService } from './hoo-timeline-engine.service';
import { MODULE4_MASTER_COMPARISON } from './module4.data';
import { HooOperatorType } from './module4.models';

interface OperatorCardInfo {
  id: HooOperatorType;
  name: string;
  badge: string;
  path: string;
  summary: string;
  icon: string;
  accentColor: string;
}

@Component({
  standalone: true,
  selector: 'app-hoo-overview',
  imports: [
    CommonModule,
    RouterModule,
    ComparisonTableComponent,
    HooTimelineVisualizerComponent
  ],
  templateUrl: './hoo-overview.component.html',
  styleUrls: ['./hoo-overview.component.scss']
})
export class HooOverviewComponent implements OnDestroy {
  readonly comparisonData = MODULE4_MASTER_COMPARISON;

  // 4 Dedicated engines for the 4-way synchronized comparison race
  readonly switchMapEngine = new HooTimelineEngineService();
  readonly mergeMapEngine = new HooTimelineEngineService();
  readonly concatMapEngine = new HooTimelineEngineService();
  readonly exhaustMapEngine = new HooTimelineEngineService();

  readonly isRaceRunning = signal<boolean>(false);

  readonly operatorCards: OperatorCardInfo[] = [
    {
      id: 'switchMap',
      name: 'switchMap',
      badge: 'Preemptive / Cancel',
      path: '/module4/switch-map',
      summary: 'Cancels prior in-flight request when a new emission arrives. Ideal for autocomplete search & tab switches.',
      icon: '🔀',
      accentColor: 'var(--color-primary-500, #6366f1)'
    },
    {
      id: 'mergeMap',
      name: 'mergeMap',
      badge: 'Concurrent / Parallel',
      path: '/module4/merge-map',
      summary: 'Processes inner observables concurrently in parallel. Supports concurrency limits. Ideal for batch downloads.',
      icon: '⚡',
      accentColor: 'var(--color-accent-cyan, #06b6d4)'
    },
    {
      id: 'concatMap',
      name: 'concatMap',
      badge: 'Sequential / Queue',
      path: '/module4/concat-map',
      summary: 'Queues outer emissions in strict FIFO order until previous finishes. Ideal for sequential writes and chat feeds.',
      icon: '⏳',
      accentColor: 'var(--color-warning, #f59e0b)'
    },
    {
      id: 'exhaustMap',
      name: 'exhaustMap',
      badge: 'Guarded / Ignore',
      path: '/module4/exhaust-map',
      summary: 'Ignores incoming outer emissions while an inner request is running. Ideal for button double-click debouncing.',
      icon: '🛡️',
      accentColor: 'var(--color-success, #10b981)'
    }
  ];

  constructor() {
    this.switchMapEngine.setOperator('switchMap');
    this.mergeMapEngine.setOperator('mergeMap');
    this.mergeMapEngine.setConcurrencyLimit(3); // Allow all 3 in parallel
    this.concatMapEngine.setOperator('concatMap');
    this.exhaustMapEngine.setOperator('exhaustMap');
  }

  ngOnDestroy(): void {
    this.resetRace();
  }

  runFourWayRace(): void {
    this.resetRace();
    this.isRaceRunning.set(true);

    const burstDurationMs = 2500;

    // Trigger 3 identical rapid requests across all 4 engines
    this.switchMapEngine.triggerBurst(3, burstDurationMs);
    this.mergeMapEngine.triggerBurst(3, burstDurationMs);
    this.concatMapEngine.triggerBurst(3, burstDurationMs);
    this.exhaustMapEngine.triggerBurst(3, burstDurationMs);
  }

  resetRace(): void {
    this.switchMapEngine.reset();
    this.mergeMapEngine.reset();
    this.concatMapEngine.reset();
    this.exhaustMapEngine.reset();
    this.isRaceRunning.set(false);
  }
}
