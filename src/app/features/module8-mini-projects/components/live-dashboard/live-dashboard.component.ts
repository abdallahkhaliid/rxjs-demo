import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConsoleEntry, PlaygroundTab } from '../../../../core/models';
import { MODULE8_PROJECTS, METRIC_CONFIGS } from '../../module8.data';
import { MiniProjectTopicConfig, TelemetryPoint, MetricCardConfig } from '../../module8.models';
import { TelemetryService } from '../../services/telemetry.service';

import { PlaygroundWrapperComponent } from '../../../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../../../shared/components/quiz-block/quiz-block.component';

@Component({
  selector: 'app-live-dashboard',
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
  templateUrl: './live-dashboard.component.html',
  styleUrl: './live-dashboard.component.scss'
})
export class LiveDashboardComponent implements OnInit {
  readonly telemetryService = inject(TelemetryService);
  private readonly destroyRef = inject(DestroyRef);

  readonly config: MiniProjectTopicConfig = MODULE8_PROJECTS['live-dashboard'];
  readonly metricConfigs: MetricCardConfig[] = METRIC_CONFIGS;
  readonly activeTab = signal<PlaygroundTab>('visual');

  readonly isPlaying = signal<boolean>(true);
  readonly speedControl = new FormControl<number>(1000, { nonNullable: true });

  readonly latestPoint = signal<TelemetryPoint>({
    cpu: 35,
    mem: 45,
    net: 120,
    timestamp: new Date().toISOString(),
    alertStatus: 'NORMAL'
  });

  readonly history = signal<TelemetryPoint[]>([]);
  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private entryIdCounter = 0;
  private readonly startTime = Date.now();

  ngOnInit(): void {
    this.isPlaying.set(this.telemetryService.isPlaying);

    this.speedControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        this.telemetryService.setSpeed(val);
      });

    this.telemetryService.currentPoint$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(point => {
        this.latestPoint.set(point);
        if (point.alertStatus !== 'NORMAL') {
          this.logEntry('error', `High resource alert triggered: ${point.alertStatus}`, point);
        } else {
          this.logEntry('next', `Telemetry point: CPU ${point.cpu}%, Mem ${point.mem}%, Net ${point.net}MB/s`);
        }
      });

    this.telemetryService.history$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(points => {
        this.history.set(points);
      });
  }

  togglePlay(): void {
    const next = this.telemetryService.togglePlay();
    this.isPlaying.set(next);
    this.logEntry('info', next ? 'Telemetry stream resumed.' : 'Telemetry stream paused.');
  }

  injectSpike(metric: 'cpu' | 'mem' | 'net'): void {
    const val = metric === 'cpu' ? 88 : metric === 'mem' ? 92 : 900;
    this.telemetryService.injectSpike(metric, val);
    this.logEntry('info', `Manual spike injected into ${metric.toUpperCase()}: ${val}`);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  getSparklineSvgPath(metric: 'cpu' | 'mem' | 'net', width = 240, height = 50): string {
    const points = this.history();
    if (points.length < 2) return '';

    const maxVal = metric === 'net' ? 1000 : 100;
    const stepX = width / 14;

    const coords = points.map((pt, idx) => {
      const val = pt[metric];
      const x = Math.round(idx * stepX);
      const y = Math.round(height - (Math.min(maxVal, val) / maxVal) * (height - 8) - 4);
      return `${x},${y}`;
    });

    return `M ${coords.join(' L ')}`;
  }

  private logEntry(type: 'next' | 'error' | 'complete' | 'info', description: string, value?: any): void {
    const entry: ConsoleEntry = {
      id: `log-${++this.entryIdCounter}`,
      timestamp: Date.now(),
      relativeMs: Date.now() - this.startTime,
      type,
      streamName: 'telemetry-stream',
      description,
      value
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 19)]);
  }
}
