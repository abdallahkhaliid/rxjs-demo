import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { ConsoleEntry, PlaygroundTab } from '../../../../core/models';
import { MODULE8_PROJECTS } from '../../module8.data';
import { MiniProjectTopicConfig, PollingEngineState } from '../../module8.models';
import { PollingService } from '../../services/polling.service';

import { PlaygroundWrapperComponent } from '../../../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../../../shared/components/quiz-block/quiz-block.component';

@Component({
  selector: 'app-polling-system',
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
  templateUrl: './polling-system.component.html',
  styleUrl: './polling-system.component.scss'
})
export class PollingSystemComponent implements OnInit {
  readonly pollingService = inject(PollingService);
  private readonly destroyRef = inject(DestroyRef);

  readonly config: MiniProjectTopicConfig = MODULE8_PROJECTS['polling-system'];
  readonly activeTab = signal<PlaygroundTab>('visual');

  readonly intervalControl = new FormControl<number>(2000, { nonNullable: true });
  readonly simulateHiddenControl = new FormControl<boolean>(false, { nonNullable: true });
  readonly simulateErrorControl = new FormControl<boolean>(false, { nonNullable: true });

  readonly state = signal<PollingEngineState>(this.pollingService.getState());

  readonly consoleEntries = signal<ConsoleEntry[]>([]);
  private entryIdCounter = 0;
  private readonly startTime = Date.now();

  ngOnInit(): void {
    this.pollingService.state$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(s => {
        this.state.set(s);
        if (s.history.length > 0) {
          const latest = s.history[0];
          if (latest.status === 'ok') {
            this.logEntry('next', `Poll #${latest.pollId} succeeded in ${latest.durationMs}ms: ${latest.snippet}`);
          } else {
            this.logEntry('error', `Poll #${latest.pollId} offline / retried: ${latest.error}`);
          }
        }
      });

    this.intervalControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(val => {
        this.pollingService.setInterval(val);
        this.logEntry('info', `Polling interval set to ${val}ms (min 500ms enforced)`);
      });

    this.simulateHiddenControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(hidden => {
        this.pollingService.simulateTabHidden(hidden);
        this.logEntry('info', hidden ? 'Tab visibility simulated: HIDDEN (Polling suspended)' : 'Tab visibility simulated: VISIBLE (Polling resumed)');
      });

    this.simulateErrorControl.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(err => {
        this.pollingService.simulateBackendError(err);
        this.logEntry('info', err ? 'Backend failure simulation ENABLED' : 'Backend failure simulation DISABLED');
      });
  }

  togglePolling(): void {
    if (this.state().isRunning) {
      this.pollingService.stopPolling();
      this.logEntry('info', 'Polling loop stopped by user');
    } else {
      this.pollingService.startPolling();
      this.logEntry('info', 'Polling loop started');
    }
  }

  refreshNow(): void {
    this.pollingService.refreshNow();
    this.logEntry('info', 'Manual refresh triggered');
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
      streamName: 'polling-stream',
      description,
      value
    };
    this.consoleEntries.update(entries => [entry, ...entries.slice(0, 19)]);
  }
}
