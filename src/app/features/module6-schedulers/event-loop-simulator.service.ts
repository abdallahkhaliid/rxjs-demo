import { Injectable, signal, computed, DestroyRef, inject } from '@angular/core';
import {
  SimulationScenario,
  SimulationStep,
  EventLoopPhase,
  TaskItem
} from './module6.models';
import { ConsoleEntry } from '../../core/models';
import { MODULE6_SCENARIOS } from './module6.data';

@Injectable({
  providedIn: 'root'
})
export class EventLoopSimulatorService {
  private readonly destroyRef = inject(DestroyRef);

  readonly scenarios = signal<SimulationScenario[]>(MODULE6_SCENARIOS);
  readonly currentScenarioId = signal<string>('mixed-concurrency');
  readonly currentStepIndex = signal<number>(0);
  readonly isPlaying = signal<boolean>(false);
  readonly playbackSpeedMs = signal<number>(800); // 1500 (slow), 800 (normal), 300 (fast)

  private timerId: any = null;

  readonly activeScenario = computed<SimulationScenario>(() => {
    return (
      this.scenarios().find(s => s.id === this.currentScenarioId()) ||
      this.scenarios()[0]
    );
  });

  readonly steps = computed<SimulationStep[]>(() => {
    return this.activeScenario().steps;
  });

  readonly currentStep = computed<SimulationStep | null>(() => {
    const list = this.steps();
    const idx = this.currentStepIndex();
    return list[idx] || list[0] || null;
  });

  readonly totalSteps = computed<number>(() => this.steps().length);
  readonly canStepBack = computed<boolean>(() => this.currentStepIndex() > 0);
  readonly canStepForward = computed<boolean>(
    () => this.currentStepIndex() < this.totalSteps() - 1
  );
  readonly isFinished = computed<boolean>(
    () => this.currentStepIndex() >= this.totalSteps() - 1
  );

  readonly callStack = computed<TaskItem[]>(
    () => this.currentStep()?.queues.callStack || []
  );
  readonly trampolineQueue = computed<TaskItem[]>(
    () => this.currentStep()?.queues.trampolineQueue || []
  );
  readonly microtaskQueue = computed<TaskItem[]>(
    () => this.currentStep()?.queues.microtaskQueue || []
  );
  readonly macrotaskQueue = computed<TaskItem[]>(
    () => this.currentStep()?.queues.macrotaskQueue || []
  );
  readonly renderQueue = computed<TaskItem[]>(
    () => this.currentStep()?.queues.renderQueue || []
  );

  readonly currentPhase = computed<EventLoopPhase>(
    () => this.currentStep()?.phase || 'idle'
  );
  readonly phaseTitle = computed<string>(
    () => this.currentStep()?.phaseTitle || 'Idle'
  );
  readonly explanation = computed<string>(
    () => this.currentStep()?.explanation || 'Ready.'
  );
  readonly consoleLogs = computed<ConsoleEntry[]>(
    () => this.currentStep()?.consoleOutput || []
  );
  readonly activeTaskId = computed<string | null>(
    () => this.currentStep()?.activeTaskId || null
  );
  readonly codeLineHighlight = computed<number | undefined>(
    () => this.currentStep()?.codeLineHighlight
  );

  constructor() {
    this.destroyRef.onDestroy(() => this.pause());
  }

  selectScenario(scenarioId: string): void {
    this.pause();
    this.currentScenarioId.set(scenarioId);
    this.currentStepIndex.set(0);
  }

  goToStep(index: number): void {
    this.pause();
    const clamped = Math.max(0, Math.min(index, this.totalSteps() - 1));
    this.currentStepIndex.set(clamped);
  }

  play(): void {
    if (this.isPlaying()) return;
    if (this.isFinished()) {
      this.currentStepIndex.set(0);
    }
    this.isPlaying.set(true);
    this.scheduleNextTick();
  }

  pause(): void {
    this.isPlaying.set(false);
    if (this.timerId) {
      clearTimeout(this.timerId);
      this.timerId = null;
    }
  }

  togglePlay(): void {
    if (this.isPlaying()) {
      this.pause();
    } else {
      this.play();
    }
  }

  stepForward(): void {
    this.pause();
    if (this.canStepForward()) {
      this.currentStepIndex.update(i => i + 1);
    }
  }

  stepBackward(): void {
    this.pause();
    if (this.canStepBack()) {
      this.currentStepIndex.update(i => i - 1);
    }
  }

  reset(): void {
    this.pause();
    this.currentStepIndex.set(0);
  }

  setSpeed(speedMs: number): void {
    this.playbackSpeedMs.set(speedMs);
    if (this.isPlaying()) {
      clearTimeout(this.timerId);
      this.scheduleNextTick();
    }
  }

  private scheduleNextTick(): void {
    this.timerId = setTimeout(() => {
      if (!this.isPlaying()) return;
      if (this.canStepForward()) {
        this.currentStepIndex.update(i => i + 1);
        this.scheduleNextTick();
      } else {
        this.pause();
      }
    }, this.playbackSpeedMs());
  }
}
