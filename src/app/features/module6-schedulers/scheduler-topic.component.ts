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
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  asapScheduler,
  asyncScheduler,
  queueScheduler,
  animationFrameScheduler,
  Subscription
} from 'rxjs';

import { ConsoleEntry, PlaygroundTab, QuizScore } from '../../core/models';
import { PlaygroundWrapperComponent } from '../../shared/components/playground-wrapper/playground-wrapper.component';
import { CodeBlockComponent } from '../../shared/components/code-block/code-block.component';
import { OutputConsoleComponent } from '../../shared/components/output-console/output-console.component';
import { ComparisonTableComponent } from '../../shared/components/comparison-table/comparison-table.component';
import { QuizBlockComponent } from '../../shared/components/quiz-block/quiz-block.component';
import { MODULE6_TOPICS, SCHEDULER_COMPARISON_DATA } from './module6.data';
import { SchedulerTopicConfig } from './module6.models';

@Component({
  selector: 'app-scheduler-topic',
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
  templateUrl: './scheduler-topic.component.html',
  styleUrl: './scheduler-topic.component.scss'
})
export class SchedulerTopicComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly topicId = signal<string>('queue-scheduler');
  readonly activeTab = signal<PlaygroundTab>('concept');
  readonly consoleEntries = signal<ConsoleEntry[]>([]);

  readonly topic = computed<SchedulerTopicConfig | null>(() => {
    return (
      MODULE6_TOPICS[this.topicId()] ||
      MODULE6_TOPICS['queue-scheduler'] ||
      null
    );
  });

  private entryCounter = 0;

  // --- Topic 1 (queueScheduler) Demo State ---
  readonly recursionDepth = signal<number>(10);
  readonly maxStackDepthObserved = signal<number>(1);
  readonly trampolineExecuting = signal<boolean>(false);

  // --- Topic 2 (asapScheduler) Demo State ---
  readonly microtaskRaceRunning = signal<boolean>(false);

  // --- Topic 3 (asyncScheduler) Demo State ---
  readonly configuredDelayMs = signal<number>(500);
  readonly pendingActionActive = signal<boolean>(false);
  readonly elapsedTimerMs = signal<number>(0);
  private scheduledAsyncSub: Subscription | null = null;
  private timerIntervalId: any = null;

  // --- Topic 4 (animationFrameScheduler) Demo State ---
  readonly animationRunning = signal<boolean>(false);
  readonly animationProgress = signal<number>(0);
  readonly currentFps = signal<number>(60);
  readonly lastFrameDeltaMs = signal<number>(16.6);
  private animSub: Subscription | null = null;
  private lastFrameTimestamp = 0;

  ngOnInit(): void {
    this.route.data.subscribe(data => {
      if (data['topicId']) {
        this.topicId.set(data['topicId']);
      }
    });

    this.route.url.subscribe(segments => {
      if (segments.length > 0) {
        const path = segments[segments.length - 1].path;
        if (path === 'queue') this.topicId.set('queue-scheduler');
        else if (path === 'asap') this.topicId.set('asap-scheduler');
        else if (path === 'async') this.topicId.set('async-scheduler');
        else if (path === 'animation-frame')
          this.topicId.set('animation-frame-scheduler');
      }
    });

    this.destroyRef.onDestroy(() => {
      this.cancelDelayedAction();
      this.stopAnimation();
    });
  }

  ngOnDestroy(): void {
    this.cancelDelayedAction();
    this.stopAnimation();
  }

  logConsole(
    type: 'info' | 'next' | 'complete' | 'error',
    message: string
  ): void {
    this.entryCounter++;
    const entry: ConsoleEntry = {
      id: `log-${this.entryCounter}-${Date.now()}`,
      timestamp: Date.now(),
      relativeMs: this.entryCounter * 10,
      type,
      value: message,
      description: message
    };
    this.consoleEntries.update(entries => [...entries, entry]);
  }

  clearConsole(): void {
    this.consoleEntries.set([]);
  }

  onQuizCompleted(score: QuizScore): void {
    // Handled by quiz block
  }

  // ==========================================
  // Topic 1: queueScheduler Demo
  // ==========================================
  runTrampolineDemo(): void {
    this.clearConsole();
    this.trampolineExecuting.set(true);
    const depth = this.recursionDepth();

    this.logConsole('info', `=== Running queueScheduler Trampoline (Depth: ${depth}) ===`);
    this.logConsole('info', 'Notice: Stack depth remains strictly at 1 across all iterations!');

    const startTime = performance.now();
    const self = this;

    // Genuine queueScheduler recursive schedule
    queueScheduler.schedule(
      function (state = 1) {
        const s = state ?? 1;
        self.logConsole(
          'next',
          `Iteration ${s}/${depth} | Call Stack depth: 1 (Trampoline while-loop)`
        );

        if (s < depth) {
          // Recursive schedule flattens into trampoline array!
          this.schedule(s + 1);
        } else {
          const duration = (performance.now() - startTime).toFixed(2);
          self.logConsole(
            'complete',
            `✔ Completed ${depth} iterations safely in ${duration}ms without call stack growth!`
          );
          self.trampolineExecuting.set(false);
        }
      },
      0,
      1
    );
  }

  simulateStackOverflowRisk(): void {
    this.clearConsole();
    const depth = this.recursionDepth();
    this.logConsole('error', '⚠️ Standard JavaScript recursive call simulation:');
    this.logConsole(
      'info',
      `In standard recursion, calling foo() ${depth} times nested creates ${depth} stack frames.`
    );
    this.logConsole(
      'info',
      `At depth > 10,000, standard recursion crashes with "RangeError: Maximum call stack size exceeded".`
    );
    this.logConsole(
      'complete',
      `queueScheduler completely protects against this failure mode by unwinding recursive calls!`
    );
  }

  // ==========================================
  // Topic 2: asapScheduler Demo
  // ==========================================
  runMicrotaskRaceDemo(): void {
    this.clearConsole();
    this.microtaskRaceRunning.set(true);

    this.logConsole('info', '=== Dispatching Mixed Concurrency Race ===');
    this.logConsole('info', '[1] Synchronous Script Execution Started');

    // 1. Queue Macrotask (asyncScheduler)
    asyncScheduler.schedule(() => {
      this.logConsole(
        'next',
        '[5] asyncScheduler MACROTASK executed (after microtasks and render cycle)'
      );
      this.logConsole('complete', '✔ Race finished: Synchronous ➔ Microtasks (FIFO) ➔ Macrotask');
      this.microtaskRaceRunning.set(false);
    });

    // 2. Queue Microtask 1 (asapScheduler)
    asapScheduler.schedule(() => {
      this.logConsole('next', '[3] asapScheduler MICROTASK #1 executed (FIFO order)');
    });

    // 3. Queue Microtask 2 (asapScheduler)
    asapScheduler.schedule(() => {
      this.logConsole('next', '[4] asapScheduler MICROTASK #2 executed (FIFO order)');
    });

    // 4. End Synchronous Script
    this.logConsole('info', '[2] Synchronous Script Execution Ended (Call Stack cleared)');
  }

  // ==========================================
  // Topic 3: asyncScheduler Demo
  // ==========================================
  scheduleDelayedAction(): void {
    this.cancelDelayedAction();
    this.clearConsole();

    const delay = this.configuredDelayMs();
    this.pendingActionActive.set(true);
    this.elapsedTimerMs.set(0);

    const start = Date.now();
    this.logConsole('info', `=== Scheduling action with ${delay}ms delay on asyncScheduler ===`);

    this.timerIntervalId = setInterval(() => {
      const elapsed = Date.now() - start;
      this.elapsedTimerMs.set(Math.min(elapsed, delay));
    }, 20);

    this.scheduledAsyncSub = asyncScheduler.schedule(() => {
      const totalElapsed = Date.now() - start;
      this.elapsedTimerMs.set(totalElapsed);
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
      this.pendingActionActive.set(false);

      this.logConsole('next', `🔔 Action executed! Elapsed time: ${totalElapsed}ms (Delay: ${delay}ms)`);
      this.logConsole('complete', '✔ Macrotask successfully dispatched and completed');
    }, delay);
  }

  cancelDelayedAction(): void {
    if (this.scheduledAsyncSub && !this.scheduledAsyncSub.closed) {
      this.scheduledAsyncSub.unsubscribe();
      this.logConsole('error', '🛑 Action was CANCELLED via action.unsubscribe() before delay elapsed!');
      this.logConsole('info', 'The scheduled macrotask was disarmed; nothing will fire.');
    }
    if (this.timerIntervalId) {
      clearInterval(this.timerIntervalId);
      this.timerIntervalId = null;
    }
    this.pendingActionActive.set(false);
  }

  // ==========================================
  // Topic 4: animationFrameScheduler Demo
  // ==========================================
  startAnimation(): void {
    this.stopAnimation();
    this.clearConsole();
    this.animationRunning.set(true);
    this.animationProgress.set(0);
    this.lastFrameTimestamp = performance.now();

    this.logConsole('info', '=== Starting 60 FPS animationFrameScheduler Loop ===');

    const self = this;
    const totalFrames = 120; // 2 seconds at 60fps

    this.animSub = animationFrameScheduler.schedule(
      function (frame = 1) {
        const f = frame ?? 1;
        const now = performance.now();
        const delta = now - self.lastFrameTimestamp;
        self.lastFrameTimestamp = now;

        const fps = Math.round(1000 / (delta || 16.6));
        self.lastFrameDeltaMs.set(parseFloat(delta.toFixed(1)));
        self.currentFps.set(fps);

        const progress = Math.min(100, Math.round((f / totalFrames) * 100));
        self.animationProgress.set(progress);

        if (f % 30 === 0 || f === totalFrames) {
          self.logConsole(
            'next',
            `Frame #${f} | Delta: ${delta.toFixed(1)}ms | Approx FPS: ${fps}`
          );
        }

        if (f < totalFrames && self.animationRunning()) {
          this.schedule(f + 1);
        } else {
          self.animationRunning.set(false);
          self.logConsole('complete', '✔ 60fps animation complete across 120 frames without jitter!');
        }
      },
      0,
      1
    );
  }

  stopAnimation(): void {
    if (this.animSub && !this.animSub.closed) {
      this.animSub.unsubscribe();
      this.animSub = null;
    }
    this.animationRunning.set(false);
  }
}
